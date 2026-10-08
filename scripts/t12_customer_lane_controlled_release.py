"""Owner-authorized T12 release. Default is read-only preparation.
Runner-private settings/source/recovery must never be uploaded as artifacts.
"""
import hashlib,json,os,re,subprocess,sys,time,uuid
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from email import message_from_bytes
from t12_live_bundle_inventory_readonly import extract_modules,fingerprint

DEPLOY='--deploy' in sys.argv
ROOT=Path.cwd();STATE=Path('/tmp/t12-qualified-release');STATE.mkdir(exist_ok=True)
TOKEN=os.environ['CLOUDFLARE_API_TOKEN'];ACCOUNT=os.environ['CLOUDFLARE_ACCOUNT_ID']
API=f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}'
DB='5c4b92bf-e043-4f6e-bd6d-d514a92cd825'
HOST='https://trendos-d1-api.trendmall-contact.workers.dev';UI='https://trendos-ui.trendmall-contact.workers.dev'
EXPECTED='f61e58185ec245b996dcf2aa139805d8bbac7d9d068aa7f8a7514835da3398d4'
TARGET='0c75704893862be91279911fbc21a04bb3f0350c5f21f55ed47e92a1e796d503'
PINNED_SOURCE='bc0531e3eebe133c5c8f3c009426825759cb4ffa'
WRANGLER=os.environ['T12_WRANGLER_BIN']
REPORT={'state':'PREPARING','deployAuthorized':DEPLOY,'businessCreate':False,'businessStatusWrite':False,'googleWrite':False}

def check(ok,label):
 if not ok:raise RuntimeError(label)
def fetch(url,data=None,method='GET',headers=None):
 h=dict(headers or {})
 if not url.startswith(API):
  check(method=='GET' and data is None,'PUBLIC_WRITE_REFUSED')
  header=STATE/'public-headers.tmp';body=STATE/'public-body.tmp'
  p=subprocess.run(['curl','--location','--proto-redir','=https','--fail','--silent','--show-error','--max-time','55','--dump-header',str(header),'--output',str(body),url],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
  check(p.returncode==0,'PUBLIC_GET_FAILED:'+url.split('?')[0].split('.workers.dev')[-1])
  blocks=header.read_bytes().split(b'\r\n\r\n');block=[b for b in blocks if b.startswith(b'HTTP/')][-1]
  return message_from_bytes(block.split(b'\r\n',1)[1]),body.read_bytes()
 if url.startswith(API):h['Authorization']='Bearer '+TOKEN
 try:
  with urlopen(Request(url,data=data,method=method,headers=h),timeout=55) as r:return r.headers,r.read()
 except HTTPError as e:raise RuntimeError('HTTP_'+str(e.code)+'_'+method) from None

def cf(path,payload=None,method=None):
 h={'Content-Type':'application/json'}
 _,raw=fetch(API+path,None if payload is None else json.dumps(payload).encode(),method or ('GET' if payload is None else 'POST'),h)
 x=json.loads(raw);check(x.get('success') is True,'CF_REQUEST_FAILED');return x['result']
def sql(query,params=None):
 result=cf('/d1/database/'+DB+'/query',{'sql':query,'params':params or []})
 check(all(x.get('success') for x in result),'D1_QUERY_FAILED');return result

def rows(query,params=None):return sql(query,params)[0]['results']
def active(worker):
 x=cf('/workers/scripts/'+worker+'/deployments');ds=x.get('deployments',[]) if isinstance(x,dict) else x
 d=sorted(ds,key=lambda z:z['created_on'],reverse=True)[0];v=d['versions']
 check(len(v)==1 and v[0]['percentage']==100,'TRAFFIC_NOT_SINGLE_VERSION')
 return v[0]['version_id']
def settings(worker):return cf('/workers/scripts/'+worker+'/settings')
def module(worker):
 hs,buf=fetch(API+'/workers/scripts/'+worker+'/content/v2');mods,main=extract_modules(hs.get('Content-Type',''),buf)
 main=hs.get('cf-entrypoint') or main
 if not main and len(mods)==1:main=next(iter(mods))
 check(len(mods)==1 and main in mods,'UNEXPECTED_WORKER_MODULES');return mods[main]
def run(args,cwd=None):
 p=subprocess.run(args,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 (STATE/('command-'+str(time.time_ns())+'.log')).write_text(p.stdout)
 check(p.returncode==0,'RUNNER_COMMAND_FAILED:'+Path(args[0]).name)
 return p.stdout

def health(path):
 _,raw=fetch(HOST+path+'?t12lease='+str(time.time_ns()));return json.loads(raw)
def invariants(create_mode):
 a=health('/v1/employee/auth/health');b=health('/v1/employee/accounting/health');c=health('/v1/employee/core/health');g=health('/v1/t12/orders/create/health')
 check(a.get('success') and a.get('mode')=='NATIVE' and a.get('nativeOnly') is True and a.get('userCount')==6 and a.get('nativeReadyCount')==6 and a.get('mustChangeCount')==0 and a.get('legacyBootstrapEnabled') is False and a.get('legacySessionEnrollEnabled') is False,'AUTH_DRIFT')
 check(b.get('success') and b.get('mode')=='READONLY' and b.get('policyEpoch')==37 and b.get('authoritativeWrites') is False and b.get('writeAuthorityMode')=='OFF','ACCOUNTING_DRIFT')
 check(c.get('success') and c.get('mode')=='GENERAL' and c.get('policyEpoch')==2,'CORE_DRIFT')
 check(g.get('mode')==create_mode,'CREATE_MODE_DRIFT')
 return {'auth':'NATIVE_6_OF_6','accounting':'READONLY_EPOCH37','core':'GENERAL_EPOCH2','createMode':g['mode'],'createVersion':g.get('version'),'claimReady':g.get('customerLaneClaimReady'),'schemaReady':g.get('schemaReady')}

def stats():return rows('SELECT (SELECT COUNT(*) FROM t12_prod_orders) AS orders,(SELECT COUNT(*) FROM t12_prod_lines) AS lines,(SELECT COUNT(*) FROM t12_prod_request_ledger) AS ledger,(SELECT next_order_number FROM t12_prod_create_control WHERE singleton=1) AS nextNumber')[0]
def refs():
 names=['candidate/t12-full-cloud-cutover-a56-20260929','candidate/easystore-accounting-a2-20261005','release/t12-customer-lane-safe-20261008','fix/t12-duplicate-create-durable-20261008']
 out=run(['git','ls-remote','origin',*[('refs/heads/'+s) for s in names]])
 check(len(out.strip().splitlines())==4,'REF_LEASE_INCOMPLETE');return out

def upload_api(bundle,pre):
 # Metadata follows Wrangler's version-upload contract. All live bindings are
 # carried forward; secret values stay on Cloudflare through keep_bindings.
 version=cf('/workers/scripts/trendos-d1-api/versions/'+pre)
 runtime=version['resources']['script_runtime'];live=settings('trendos-d1-api')
 metadata={'main_module':'index.js','bindings':[b for b in live['bindings'] if b['type'] not in ('secret_text','secret_key')],
  'keep_bindings':['secret_text','secret_key'],'tags':live.get('tags',[]),'usage_model':live.get('usage_model','standard'),'compatibility_date':runtime['compatibility_date'],
  'compatibility_flags':runtime.get('compatibility_flags',[]),'annotations':{'workers/message':'Owner authorized T12 customer lane V2; runtime-preserving release'},'keep_assets':True}
 for key in ['logpush','tail_consumers','observability']:
  if key in live:metadata[key]=live[key]
 if runtime.get('limits'):metadata['limits']=runtime['limits']
 if version['resources']['script'].get('placement_mode')=='smart':metadata['placement']={'mode':'smart'}
 boundary='trendos-'+uuid.uuid4().hex
 body=(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n'.encode()+json.dumps(metadata).encode()+
       f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="index.js"; filename="index.js"\r\nContent-Type: application/javascript+module\r\n\r\n'.encode()+bundle+
       f'\r\n--{boundary}--\r\n'.encode())
 _,raw=fetch(API+'/workers/scripts/trendos-d1-api/versions',body,'POST',{'Content-Type':'multipart/form-data; boundary='+boundary})
 x=json.loads(raw);check(x.get('success') is True,'VERSION_UPLOAD_FAILED');return x['result']['id']
def traffic(worker,version):
 cf('/workers/scripts/'+worker+'/deployments',{'strategy':'percentage','versions':[{'version_id':version,'percentage':100}],'annotations':{'workers/message':'Owner authorized T12 controlled release'}})

def normalized_settings(x):
 # Compare every returned setting; ordering of bindings is not material.
 x=dict(x);x.pop('annotations',None);x['bindings']=sorted(x.get('bindings',[]),key=lambda b:b['name'])
 return x

def main():
 for file in ['cloudflare-d1/src/t12-general-create.mjs','cloudflare-d1/src/t12-general-create-handler.mjs','cloudflare-d1/src/t12-customer-lane-policy.mjs','cloudflare-d1/src/t12-order-create-shadow-intent.mjs','cloudflare-d1/migrations/0012_t12_customer_lane_claim.sql','app.js','trendos-edge-orders-read-v1.js','config.js','index.html']:
  check((ROOT/file).read_bytes()==subprocess.check_output(['git','show',PINNED_SOURCE+':'+file]),'QUALIFIED_SOURCE_CHANGED:'+file)
 report=run(['bash','scripts/t12_build_runtime_preserving_release.sh',os.environ['GITHUB_SHA']]);build=Path(re.search(r'BUILD_ARTIFACT_DIRECTORY=(.+)',report).group(1))
 manifest=json.loads((build/'release-manifest.json').read_text());check(manifest['targetBundle']['sha256']==TARGET,'TARGET_HASH_CHANGED')
 pre_api=active('trendos-d1-api');pre_ui=active('trendos-ui');pre_refs=refs()
 check(pre_api=='d7c65348-a921-4f2e-8359-f3e30ce3a1eb','API_VERSION_MOVED')
 check(fingerprint(module('trendos-d1-api'))['sha256']==EXPECTED,'API_SOURCE_MOVED')
 pre_settings={w:settings(w) for w in ['trendos-d1-api','trendos-ui']}
 (STATE/'private-settings.json').write_text(json.dumps(pre_settings));os.chmod(STATE/'private-settings.json',0o600)
 REPORT['bindingFieldKeys']={w:[{'type':b['type'],'keys':sorted(b.keys())} for b in x['bindings'] if b['type']=='assets'] for w,x in pre_settings.items()};REPORT['settingsKeys']={w:sorted(x.keys()) for w,x in pre_settings.items()};REPORT['bindingTypes']={w:sorted({b['type'] for b in x['bindings']}) for w,x in pre_settings.items()}
 REPORT['preVersions']={'api':pre_api,'ui':pre_ui};REPORT['preHealth']=invariants('GENERAL')
 check(REPORT['preHealth']['schemaReady'] is True,'PRE_CREATE_UNHEALTHY')
 control=rows('SELECT marker,mode,canary_remaining,policy_epoch FROM t12_prod_general_create_control WHERE singleton=1')[0]
 check(control['mode']=='GENERAL' and control['canary_remaining']==0,'CONTROL_DRIFT')
 check(not rows("SELECT name FROM sqlite_master WHERE name='t12_prod_customer_lane_claim'"),'CLAIM_ALREADY_EXISTS_UNREVIEWED')
 check(not rows("SELECT name FROM d1_migrations WHERE name='0012_t12_customer_lane_claim.sql'"),'MIGRATION_ALREADY_APPLIED_UNREVIEWED')
 run([WRANGLER,'d1','time-travel','info','trendos-main','--config','cloudflare-d1/wrangler.toml','--json'])
 recovery_logs=sorted(STATE.glob('command-*.log'),key=lambda p:p.stat().st_mtime)
 check('bookmark' in recovery_logs[-1].read_text().lower(),'RECOVERY_REFERENCE_UNAVAILABLE');REPORT['recoveryAvailable']=True
 # Entry652's deployed asset set consists of all root HTML/JS/CSS from its
 # pinned base. Re-fetch each live byte, then overlay exactly four assets.
 names=run(['git','ls-tree','--name-only','2da755ca910b84911378c018d050cf806d8349d5']).splitlines()
 names=sorted(n for n in names if n.endswith(('.html','.js','.css')))
 check(len(names)>25,'FRONTEND_ASSET_LIST_INCOMPLETE')
 dist=STATE/'frontend-dist';dist.mkdir(exist_ok=True)
 before={}
 for name in names:
  hs,data=fetch(UI+'/'+name+'?t12snapshot='+str(time.time_ns()))
  check(len(data)>0,'EMPTY_FRONTEND_ASSET:'+name)
  if name.endswith(('.js','.css')):check(not data.lstrip().lower().startswith(b'<!doctype html'),'ASSET_FELL_BACK_TO_SPA:'+name)
  before[name]=hashlib.sha256(data).hexdigest();(dist/name).write_bytes(data)
 for name in ['app.js','config.js','trendos-edge-orders-read-v1.js']:
  baseline=subprocess.check_output(['git','show','467c5e5fcd0e538a5b57692e630943d6ab500710:'+name])
  check((dist/name).read_bytes()==baseline,'FRONTEND_PATCH_BASE_MOVED:'+name)
 # index has the same Entry652 cache baseline, also required byte-for-byte.
 check((dist/'index.html').read_bytes()==subprocess.check_output(['git','show','467c5e5fcd0e538a5b57692e630943d6ab500710:index.html']),'INDEX_BASE_MOVED')
 patches={'app.js','config.js','index.html','trendos-edge-orders-read-v1.js'}
 for name in patches:(dist/name).write_bytes((build/'frontend-patches'/name).read_bytes())
 after={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in dist.iterdir()}
 check({n for n in before if before[n]!=after[n]}==patches,'UNEXPECTED_UI_DELTA')
 for n in patches:
  if n.endswith('.js'):run(['node','--check',str(dist/n)])
 # The UI worker/config from Entry652 is unchanged, verified against live
 # compiled worker before any deploy. No Git worktree or stale asset copy.
 ui_root=STATE/'frontend';(ui_root/'src').mkdir(parents=True,exist_ok=True)
 for src,dest in [('cloudflare-d1/src/frontend-static-worker.mjs','src/frontend-static-worker.mjs'),('cloudflare-d1/wrangler.frontend.toml','wrangler.toml')]:
  (ui_root/dest).write_bytes(subprocess.check_output(['git','show','2da755ca910b84911378c018d050cf806d8349d5:'+src]))
 (ui_root/'frontend-dist').symlink_to(dist,target_is_directory=True)
 run([WRANGLER,'deploy','--dry-run','--outdir',str(STATE/'ui-bundle'),'--config',str(ui_root/'wrangler.toml')])
 check(fingerprint(module('trendos-ui'))==fingerprint((STATE/'ui-bundle'/'index.js').read_bytes()),'FRONTEND_WORKER_SOURCE_MISMATCH')
 REPORT.update({'assetCount':len(names),'frontendChanged':sorted(patches),'frontendUnrelatedPreserved':True,'targetApiSha256':TARGET,'sourceRuntimeParity':'PASS'})
 check(active('trendos-d1-api')==pre_api and active('trendos-ui')==pre_ui and refs()==pre_refs,'PREPARE_LEASE_MOVED')
 if not DEPLOY:REPORT['state']='READONLY_PREPARE_PASS';return
 # Revalidate before mutation; owner authorization was provided in chat.
 check(invariants('GENERAL')==REPORT['preHealth'],'PREMUTATION_HEALTH_MOVED')
 for w in pre_settings:check(normalized_settings(settings(w))==normalized_settings(pre_settings[w]),'SETTINGS_MOVED')
 paused=False;api_attempt=False;ui_attempt=False;complete=False
 try:
  sql("UPDATE t12_prod_general_create_control SET mode='OFF' WHERE singleton=1 AND mode='GENERAL' AND marker='T12_GENERAL_CREATE_V1' AND policy_epoch=?",[control['policy_epoch']]);paused=True
  check(rows('SELECT mode,policy_epoch FROM t12_prod_general_create_control WHERE singleton=1')[0]=={'mode':'OFF','policy_epoch':control['policy_epoch']},'PAUSE_FAILED')
  time.sleep(35);s1=stats();time.sleep(8);s2=stats();check(s1==s2,'INFLIGHT_CREATE_NOT_DRAINED');REPORT['pausedBusinessSnapshot']=s2
  check(active('trendos-d1-api')==pre_api and active('trendos-ui')==pre_ui and refs()==pre_refs,'MUTATION_LEASE_MOVED')
  migration=(ROOT/'cloudflare-d1/migrations/0012_t12_customer_lane_claim.sql').read_text()
  check(not re.search(r'\b(DROP|ALTER|DELETE|UPDATE)\b',re.sub(r'--[^\n]*','',migration),re.I),'MIGRATION_SCOPE_CHANGED')
  sql(migration)
  sql("INSERT INTO d1_migrations(name) VALUES ('0012_t12_customer_lane_claim.sql')")
  schema=rows("SELECT name,sql FROM sqlite_master WHERE name IN ('t12_prod_customer_lane_claim','idx_t12_prod_customer_lane_claim_order')")
  check(len(schema)==2 and any('PRIMARY KEY (identity_key,department)' in r['sql'] for r in schema),'MIGRATION_SCHEMA_MISMATCH')
  check(rows('SELECT COUNT(*) AS n FROM t12_prod_customer_lane_claim')[0]['n']==0,'NONEMPTY_NEW_CLAIMS')
  REPORT['migration0012']='APPLIED_ADDITIVE_ONLY'
  target_version=upload_api((build/'target-bundle/index.js').read_bytes(),pre_api);REPORT['uploadedApiVersion']=target_version
  check(active('trendos-d1-api')==pre_api,'API_MOVED_DURING_UPLOAD')
  api_attempt=True;traffic('trendos-d1-api',target_version)
  check(active('trendos-d1-api')==target_version,'API_TRAFFIC_SWITCH_FAILED')
  check(fingerprint(module('trendos-d1-api'))['sha256']==TARGET,'POST_API_HASH_MISMATCH')
  post=invariants('OFF');check(post['claimReady'] is True and post['schemaReady'] is True and 'ATOMIC_CANDIDATE_V2' in post['createVersion'],'POST_CREATE_HEALTH_FAILED')
  check(normalized_settings(settings('trendos-d1-api'))==normalized_settings(pre_settings['trendos-d1-api']),'API_SETTINGS_CHANGED')
  check(active('trendos-ui')==pre_ui,'UI_LEASE_MOVED')
  ui_attempt=True;run([WRANGLER,'deploy','--config',str(ui_root/'wrangler.toml'),'--keep-vars'])
  post_ui=active('trendos-ui');check(post_ui!=pre_ui,'UI_VERSION_UNCHANGED')
  for attempt in range(15):
   matches=True
   for name in names:
    _,data=fetch(UI+'/'+name+'?t12post='+str(time.time_ns()))
    if hashlib.sha256(data).hexdigest()!=after[name]:matches=False;break
   if matches:break
   time.sleep(2)
  check(matches,'UI_POST_ASSET_HASH_MISMATCH')
  check(normalized_settings(settings('trendos-ui'))==normalized_settings(pre_settings['trendos-ui']),'UI_SETTINGS_CHANGED')
  check(stats()==s2,'BUSINESS_CHANGED_WHILE_PAUSED')
  check(rows('SELECT COUNT(*) AS n FROM t12_prod_customer_lane_claim')[0]['n']==0,'UNEXPECTED_CLAIMS_WRITE')
  check(rows('SELECT policy_epoch FROM t12_prod_general_create_control WHERE singleton=1')[0]['policy_epoch']==control['policy_epoch'],'POLICY_EPOCH_CHANGED')
  sql("UPDATE t12_prod_general_create_control SET mode='GENERAL' WHERE singleton=1 AND mode='OFF' AND policy_epoch=?",[control['policy_epoch']])
  REPORT['postHealth']=invariants('GENERAL');paused=False;REPORT['postVersions']={'api':target_version,'ui':post_ui};REPORT['state']='DEPLOYED_VERIFIED';REPORT['businessUnchangedDuringWindow']=True;REPORT['rollbackUsed']=False;complete=True
 finally:
  if not complete and paused:
   sql("UPDATE t12_prod_general_create_control SET mode='OFF' WHERE singleton=1 AND policy_epoch=?",[control['policy_epoch']])
   REPORT['state']='BLOCKED_SAFE_CREATE_PAUSED';REPORT['rollbackUsed']=False
   # Never overwrite a third-party version. Roll back only versions deployed
   # by this run. Keeping CREATE OFF prevents V1 reopening on unreviewed data.
   if ui_attempt:
    try:
     current=active('trendos-ui')
     if 'post_ui' in locals() and current==post_ui:traffic('trendos-ui',pre_ui);REPORT['uiRollback']='PASS'
    except Exception:REPORT['uiRollback']='FAILED_REQUIRES_OPERATOR'
   if api_attempt:
    try:
     if active('trendos-d1-api')==target_version:traffic('trendos-d1-api',pre_api);REPORT['apiRollback']='PASS';REPORT['rollbackUsed']=True
    except Exception:REPORT['apiRollback']='FAILED_REQUIRES_OPERATOR'

try:main()
except Exception as e:
 REPORT['error']=str(e);REPORT.setdefault('state','BLOCKED_SAFE');raise
finally:
 (STATE/'sanitized-result.json').write_text(json.dumps(REPORT,indent=2))
 print('::notice title=T12_CONTROLLED_RELEASE_RESULT::'+json.dumps(REPORT,separators=(',',':')))
