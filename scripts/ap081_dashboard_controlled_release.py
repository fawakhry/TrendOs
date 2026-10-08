"""Qualify or publish only the read-only AP081 Dashboard; emit sanitized evidence."""
import hashlib,json,os,subprocess,sys,tarfile,time,urllib.request,uuid
from datetime import datetime,timezone
from pathlib import Path
from t12_live_bundle_inventory_readonly import extract_modules,fingerprint

BASE='fe16c8b6d835dd372782e955fedf6d8fa84e865e'
TARGET='cbe270a553df6f7de326a6934f5f7fa978aa18ef'
WORKER='autonomous-printshop-dashboard'
HOST='https://'+WORKER+'.trendmall-contact.workers.dev'
API='https://api.cloudflare.com/client/v4/accounts/'+os.environ['CLOUDFLARE_ACCOUNT_ID']
TOKEN=os.environ['CLOUDFLARE_API_TOKEN']
STAGE=Path('/tmp/ap081-qualified-release');STAGE.mkdir(exist_ok=True)
DEPLOY='--deploy' in sys.argv
REPORT={'checkedAtUTC':datetime.now(timezone.utc).isoformat(),'source':TARGET,
 'deployAuthorized':DEPLOY,'businessWrite':False,'d1Mutation':False,
 'persistentCache':False,'productionFaultInjected':False,'state':'PREPARING'}
RELEASE_ID='AP081'
BASE_VERSION='AUTONOMOUS_PRINTSHOP_OWNER_EXCEPTION_CONSOLE_V1_6_20261008'
TARGET_VERSION=BASE_VERSION
EXPECTED_DIFF={'autonomous-printshop/core/control-tower-last-good-v1.mjs','autonomous-printshop/tests/control_tower_last_good_v1.test.mjs','autonomous-printshop/tests/dashboard_last_good_v1.test.mjs','autonomous-printshop/MASTER_BOOK.md'}
CONTRACT_TESTS=['control_tower_last_good_v1','dashboard_last_good_v1','dashboard_v1','owner_exception_model_v1']

def check(condition,code):
 if not condition:raise RuntimeError(code)

def request(path,payload=None,raw=None,content_type=None):
 # Mutation is confined to this worker's version/deployment endpoints.
 if payload is not None or raw is not None:
  check(DEPLOY and path in ['/workers/scripts/'+WORKER+'/versions','/workers/scripts/'+WORKER+'/deployments'],'WRITE_SCOPE_REFUSED')
 data=raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)
 req=urllib.request.Request(API+path,data=data,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':content_type or 'application/json'})
 with urllib.request.urlopen(req,timeout=55) as response:return response.headers,response.read()

def cf(path,payload=None):
 _,raw=request(path,payload);result=json.loads(raw)
 check(result.get('success') is True,'CF_REQUEST_FAILED');return result['result']

def active():
 result=cf('/workers/scripts/'+WORKER+'/deployments')
 deployments=result.get('deployments',[]) if isinstance(result,dict) else result
 check(bool(deployments),'NO_DEPLOYMENT')
 current=sorted(deployments,key=lambda d:d['created_on'],reverse=True)[0]
 versions=current['versions'];check(len(versions)==1 and versions[0]['percentage']==100,'SPLIT_TRAFFIC_REFUSED')
 return versions[0]['version_id']

def live_bundle():
 headers,raw=request('/workers/scripts/'+WORKER+'/content/v2')
 modules,entry=extract_modules(headers.get('Content-Type',''),raw)
 entry=headers.get('cf-entrypoint') or entry
 if not entry and len(modules)==1:entry=next(iter(modules))
 check(len(modules)==1 and entry in modules,'UNEXPECTED_MODULES')
 return modules[entry]

def public(url):
 result=subprocess.run(['curl','--fail','--silent','--show-error','--retry','4','--retry-delay','2','--retry-all-errors','--max-time','45',url],capture_output=True)
 check(result.returncode==0,'PUBLIC_GET_FAILED');return json.loads(result.stdout)

def main_health():
 base='https://trendos-d1-api.trendmall-contact.workers.dev'
 paths={'create':'/v1/t12/orders/create/health','auth':'/v1/employee/auth/health','accounting':'/v1/employee/accounting/health','core':'/v1/employee/core/health','content':'/v1/employee/content/health','comms':'/v1/employee/comms/health'}
 health={k:public(base+p) for k,p in paths.items()}
 check(health['create'].get('mode')=='GENERAL' and health['create'].get('customerLaneClaimReady') is True and 'ATOMIC_CANDIDATE_V2' in health['create'].get('version',''),'T12_GUARD_DRIFT')
 check(health['auth'].get('nativeOnly') is True and health['auth'].get('mode')=='NATIVE','AUTH_DRIFT')
 check(health['accounting'].get('mode')=='READONLY' and health['accounting'].get('writeAuthorityMode')=='OFF' and health['accounting'].get('authoritativeWrites') is False,'ACCOUNTING_AUTHORITY_DRIFT')
 for k in ['content','comms']:check(health[k].get('mode')=='READONLY','READONLY_DOMAIN_DRIFT')
 return {k:{field:value for field,value in v.items() if field in ['mode','version','policyEpoch','nativeOnly','customerLaneClaimReady','writeAuthorityMode','authoritativeWrites','r2Ready']} for k,v in health.items()}

def build(commit,label):
 root=STAGE/label;root.mkdir(exist_ok=True)
 archive=STAGE/(label+'.tar')
 with archive.open('wb') as f:subprocess.run(['git','archive',commit,'autonomous-printshop'],stdout=f,check=True)
 with tarfile.open(archive) as f:f.extractall(root,filter='data')
 for test in CONTRACT_TESTS:
  if label=='baseline' and not (root/('autonomous-printshop/tests/'+test+'.test.mjs')).exists():continue
  result=subprocess.run(['node','autonomous-printshop/tests/'+test+'.test.mjs'],cwd=root,capture_output=True)
  check(result.returncode==0,'CONTRACT_FAILED_'+label+'_'+test)
 out=STAGE/(label+'-bundle')
 result=subprocess.run([os.environ['AP_WRANGLER_BIN'],'deploy','--dry-run','--config','autonomous-printshop/dashboard/wrangler.toml','--outdir',str(out)],cwd=root,capture_output=True)
 check(result.returncode==0,'BUILD_FAILED_'+label)
 files=list(out.glob('*.js'));check(len(files)==1,'UNEXPECTED_BUILD_MODULES')
 return files[0].read_bytes()

def settings_hash(settings):
 clean={k:v for k,v in settings.items() if k!='annotations'}
 return hashlib.sha256(json.dumps(clean,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def main():
 diff=subprocess.check_output(['git','diff','--name-only',BASE,TARGET]).decode().splitlines()
 check(set(diff)==EXPECTED_DIFF,'SOURCE_DIFF_SCOPE_DRIFT')
 baseline=build(BASE,'baseline');target=build(TARGET,'target')
 REPORT['contracts']='PASS';REPORT['baselineBundle']=fingerprint(baseline);REPORT['targetBundle']=fingerprint(target)
 version=active();REPORT['beforeVersion']=version
 live_fingerprint=fingerprint(live_bundle())
 already_deployed=live_fingerprint==fingerprint(target)
 check(already_deployed or live_fingerprint==fingerprint(baseline),'LIVE_SOURCE_NOT_BASELINE_OR_QUALIFIED_TARGET')
 live_settings=cf('/workers/scripts/'+WORKER+'/settings');before_hash=settings_hash(live_settings)
 check(before_hash=='b6c8af2e85776f038a2c5dbe23543def9fa1ac00fd1742cb563dc62ab631aef9','QUALIFIED_SETTINGS_DRIFT')
 bindings=live_settings.get('bindings',[])
 check(len(bindings)==2 and {b.get('name'):b.get('service') for b in bindings}=={'SHADOW':'autonomous-printshop-shadow','READINESS_COLLECTOR':'autonomous-printshop-readiness-collector'} and all(b.get('type')=='service' for b in bindings),'BINDING_SCOPE_DRIFT')
 REPORT['settingsHash']=before_hash
 REPORT['mainBefore']=main_health()
 h=public(HOST+'/health');s=public(HOST+'/state')
 check(h.get('dashboardVersion')==(TARGET_VERSION if already_deployed else BASE_VERSION) and h.get('businessWrites') is False,'DASHBOARD_HEALTH_DRIFT')
 check(s.get('mode')=='CONTROL_TOWER_SHADOW' and s.get('writesAccepted') is False and s.get('d1Mutation') is False,'UPSTREAM_NOT_READONLY')
 REPORT['beforeHealth']={k:h[k] for k in ['dashboardVersion','lastGoodVersion','businessWrites','employeeAssignment']}
 check(active()==version,'VERSION_LEASE_DRIFT')
 if already_deployed:
  if RELEASE_ID=='AP082':
   check(s.get('panelStatus',{}).get('version')=='CONTROL_TOWER_PANEL_STATUS_V1_20261008','PANEL_METADATA_NOT_LIVE')
   REPORT['panels']={k:{field:value for field,value in v.items() if field in ['state','source','asOf','ageMs','historicalCompletenessQualified','executionAllowed']} for k,v in s['panelStatus']['panels'].items()}
  REPORT['afterVersion']=version;REPORT['runtimeSourceParity']='PASS';REPORT['deploymentPerformed']=False
  REPORT['state']='ALREADY_DEPLOYED_VERIFIED';return
 REPORT['state']='QUALIFIED_READONLY'
 if not DEPLOY:return
 runtime=cf('/workers/scripts/'+WORKER+'/versions/'+version)['resources']['script_runtime']
 metadata={'main_module':'worker.js','bindings':bindings,'compatibility_date':runtime['compatibility_date'],'compatibility_flags':runtime.get('compatibility_flags',[]),'tags':live_settings.get('tags',[]),'usage_model':live_settings.get('usage_model','standard'),'annotations':{'workers/message':'Qualified '+RELEASE_ID+' read-only Dashboard only'}}
 for key in ['logpush','tail_consumers','observability']:
  if key in live_settings:metadata[key]=live_settings[key]
 if runtime.get('limits'):metadata['limits']=runtime['limits']
 boundary='ap081-'+uuid.uuid4().hex
 body=(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n'.encode()+json.dumps(metadata).encode()+f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="worker.js"; filename="worker.js"\r\nContent-Type: application/javascript+module\r\n\r\n'.encode()+target+f'\r\n--{boundary}--\r\n'.encode())
 _,raw=request('/workers/scripts/'+WORKER+'/versions',raw=body,content_type='multipart/form-data; boundary='+boundary)
 uploaded=json.loads(raw);check(uploaded.get('success') is True,'VERSION_UPLOAD_FAILED');new=uploaded['result']['id']
 REPORT['uploadedVersion']=new;REPORT['state']='VERSION_UPLOADED_ZERO_TRAFFIC'
 check(active()==version and settings_hash(cf('/workers/scripts/'+WORKER+'/settings'))==before_hash,'FINAL_LEASE_DRIFT')
 check(main_health()==REPORT['mainBefore'],'MAIN_BOUNDARY_LEASE_DRIFT')
 cf('/workers/scripts/'+WORKER+'/deployments',{'strategy':'percentage','versions':[{'version_id':new,'percentage':100}]})
 REPORT['state']='TRAFFIC_SWITCHED_PENDING_POSTFLIGHT'
 for attempt in range(12):
  if active()==new and fingerprint(live_bundle())==fingerprint(target):break
  time.sleep(3)
 else:raise RuntimeError('TARGET_PROPAGATION_FAILED')
 check(settings_hash(cf('/workers/scripts/'+WORKER+'/settings'))==before_hash,'POSTFLIGHT_SETTINGS_DRIFT')
 REPORT['mainAfter']=main_health();check(REPORT['mainAfter']==REPORT['mainBefore'],'MAIN_BOUNDARY_POSTFLIGHT_DRIFT')
 h=public(HOST+'/health');s=public(HOST+'/state')
 check(h.get('dashboardVersion')==TARGET_VERSION and h.get('businessWrites') is False and s.get('mode')=='CONTROL_TOWER_SHADOW' and s.get('d1Mutation') is False,'POSTFLIGHT_HEALTH_FAILED')
 if RELEASE_ID=='AP082':
  check(s.get('panelStatus',{}).get('version')=='CONTROL_TOWER_PANEL_STATUS_V1_20261008','PANEL_METADATA_NOT_LIVE')
  REPORT['panels']={k:{field:value for field,value in v.items() if field in ['state','source','asOf','ageMs','historicalCompletenessQualified','executionAllowed']} for k,v in s['panelStatus']['panels'].items()}
 REPORT['afterVersion']=new;REPORT['runtimeSourceParity']='PASS';REPORT['state']='DEPLOYED_PASS'

def run_release():
 try:main()
 except Exception as e:
  REPORT['failureType']=type(e).__name__
  if isinstance(e,RuntimeError):REPORT['failureCode']=str(e)
  raise
 finally:
  Path('/tmp/'+RELEASE_ID.lower()+'-sanitized-report.json').write_text(json.dumps(REPORT,indent=2))
  print('::notice title='+RELEASE_ID+'_CONTROLLED_RELEASE::'+json.dumps(REPORT,separators=(',',':')))

if __name__=='__main__':run_release()
