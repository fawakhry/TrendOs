"""Authorized frontend-only fix: optional order description, exact live overlay."""
import json,os,hashlib,subprocess,time
from pathlib import Path
import t12_customer_lane_controlled_release as release
R=release;report={'state':'PREPARING','backendDeploy':False,'d1Write':False,'descriptionOptional':True}
BASE='d247bf3e';names=subprocess.check_output(['git','ls-tree','--name-only','2da755ca910b84911378c018d050cf806d8349d5'],text=True).splitlines();names=[n for n in names if n.endswith(('.html','.js','.css'))]
pre=None;attempted=False;completed=False;paused=False;api_changed=False;new_api=None
try:
 pre=R.active('trendos-ui');api=R.active('trendos-d1-api')
 report['preVersions']={'ui':pre,'api':api}
 api_hash=R.fingerprint(R.module('trendos-d1-api'))['sha256'];report['apiSourceSha256']=api_hash
 pre_health=R.invariants('GENERAL');R.check(pre_health['createVersion'] in ('T12_GENERAL_CREATE_20261001_DUP_GUARD_V1','T12_GENERAL_CREATE_20261008_PER_DEPARTMENT_ATOMIC_CANDIDATE_V2'),'UNQUALIFIED_CREATE_VERSION')
 before_settings=R.settings('trendos-ui');api_settings=R.settings('trendos-d1-api')
 dist=R.STATE/'frontend-dist';dist.mkdir(exist_ok=True);before={}
 for name in names:
  _,data=R.fetch(R.UI+'/'+name+'?optionalDescription='+str(time.time_ns()));R.check(len(data)>0,'EMPTY_ASSET')
  if name.endswith(('.js','.css')):R.check(not data.lstrip().lower().startswith(b'<!doctype html'),'SPA_FALLBACK')
  (dist/name).write_bytes(data);before[name]=hashlib.sha256(data).hexdigest()
 patches=['app.js','index.html']
 for name in patches:
  R.check((dist/name).read_bytes()==subprocess.check_output(['git','show',BASE+':'+name]),'PATCH_BASE_MOVED')
  (dist/name).write_bytes(Path(name).read_bytes())
 after={n:hashlib.sha256((dist/n).read_bytes()).hexdigest() for n in names}
 R.check({n for n in names if before[n]!=after[n]}==set(patches),'UNEXPECTED_ASSET_DELTA')
 front=R.STATE/'frontend';(front/'src').mkdir(parents=True,exist_ok=True)
 (front/'src/frontend-static-worker.mjs').write_bytes(Path('cloudflare-d1/src/frontend-static-worker.mjs').read_bytes())
 (front/'wrangler.toml').write_bytes(Path('cloudflare-d1/wrangler.frontend.toml').read_bytes())
 (front/'frontend-dist').symlink_to(dist,target_is_directory=True)
 R.run([R.WRANGLER,'deploy','--dry-run','--config',str(front/'wrangler.toml'),'--outdir',str(R.STATE/'ui-build')])
 modules=[p for p in (R.STATE/'ui-build').iterdir() if p.suffix in ('.js','.mjs')]
 R.check(len(modules)==1 and R.fingerprint(modules[0].read_bytes())==R.fingerprint(R.module('trendos-ui')),'UI_WORKER_SOURCE_CHANGED')
 R.check(R.active('trendos-ui')==pre and R.active('trendos-d1-api')==api,'LEASE_MOVED')
 R.check(R.normalized_settings(R.settings('trendos-ui'))==R.normalized_settings(before_settings),'SETTINGS_MOVED')
 # Restore the previously authorized lane guard after the parallel Accounting
 # publish, preserving the new Accounting/Core/Comms source byte-for-byte.
 if pre_health['claimReady'] is not True:
  R.check(api_hash=='072bffffe8da361858899e8d04f373ac4616f6cac79bd7129206c053c5d77c2c','UNRECONSTRUCTED_BACKEND')
  tree=R.run(['git','merge-tree','--write-tree','1e3493321f1c27a59fbc1e0291f197fccf086d34','0e3d35f0283773b2e0c65070fa91d46d3fd477be']).splitlines()[0]
  base=R.STATE/'live-backend';base.mkdir()
  a=subprocess.Popen(['git','archive',tree],stdout=subprocess.PIPE)
  subprocess.run(['tar','-x','-C',str(base)],stdin=a.stdout,check=True);R.check(a.wait()==0,'ARCHIVE_FAILED')
  R.run([R.WRANGLER,'deploy','--dry-run','--config',str(base/'cloudflare-d1/wrangler.toml'),'--outdir',str(R.STATE/'base-bundle')])
  R.check(R.fingerprint((R.STATE/'base-bundle/index.js').read_bytes())['sha256']==api_hash,'CURRENT_BACKEND_RECONSTRUCTION_FAILED')
  protected={name:(base/'cloudflare-d1/src'/name).read_bytes() for name in ['employee-accounting-native-v1.mjs','employee-core-native-v1.mjs','employee-comms-native-v1.mjs','accounting-foundation-v1.mjs']}
  for name in ['t12-general-create.mjs','t12-general-create-handler.mjs','t12-customer-lane-policy.mjs','t12-order-create-shadow-intent.mjs']:
   (base/'cloudflare-d1/src'/name).write_bytes(Path('cloudflare-d1/src',name).read_bytes())
  for name,data in protected.items():R.check((base/'cloudflare-d1/src'/name).read_bytes()==data,'PARALLEL_SOURCE_CHANGED')
  R.run([R.WRANGLER,'deploy','--dry-run','--config',str(base/'cloudflare-d1/wrangler.toml'),'--outdir',str(R.STATE/'fixed-bundle')])
  fixed=(R.STATE/'fixed-bundle/index.js').read_bytes();new_hash=R.fingerprint(fixed)['sha256'];report['restoredGuardApiSha256']=new_hash
  R.check(len(R.rows("SELECT name FROM sqlite_master WHERE name IN ('t12_prod_customer_lane_claim','idx_t12_prod_customer_lane_claim_order')"))==2,'EXISTING0012_NOT_READY')
  control=R.rows('SELECT mode,policy_epoch FROM t12_prod_general_create_control WHERE singleton=1')[0]
  R.check(control['mode']=='GENERAL' and R.active('trendos-ui')==pre and R.active('trendos-d1-api')==api,'REPAIR_LEASE_MOVED')
  R.sql("UPDATE t12_prod_general_create_control SET mode='OFF' WHERE singleton=1 AND mode='GENERAL' AND policy_epoch=?",[control['policy_epoch']]);paused=True;report['d1Write']=True;report['controlOnly']=True
  time.sleep(35);stats=R.stats();time.sleep(8);R.check(R.stats()==stats,'INFLIGHT_NOT_DRAINED')
  R.check(R.active('trendos-d1-api')==api and R.active('trendos-ui')==pre,'REPAIR_VERSION_MOVED')
  new_api=R.upload_api(fixed,api);R.traffic('trendos-d1-api',new_api);api_changed=True
  R.check(R.fingerprint(R.module('trendos-d1-api'))['sha256']==new_hash,'REPAIR_HASH_MISMATCH')
  fixed_health=R.invariants('OFF');R.check(fixed_health['claimReady'] is True,'REPAIR_HEALTH_FAILED')
  R.check(R.normalized_settings(R.settings('trendos-d1-api'))==R.normalized_settings(api_settings),'REPAIR_SETTINGS_CHANGED')
  report['backendDeploy']=True;report['parallelAccountingCoreCommsPreserved']=True
  api=new_api;api_hash=new_hash
  pre_health=dict(fixed_health);pre_health['createMode']='GENERAL'
 attempted=True
 R.run([R.WRANGLER,'deploy','--config',str(front/'wrangler.toml'),'--keep-vars','--tag',os.environ['GITHUB_SHA']])
 post=R.active('trendos-ui');R.check(post!=pre,'VERSION_UNCHANGED');report['postUiVersion']=post
 for attempt in range(15):
  ok=True
  for name in names:
   _,data=R.fetch(R.UI+'/'+name+'?optionalDescriptionPost='+str(time.time_ns()))
   if hashlib.sha256(data).hexdigest()!=after[name]:ok=False;break
  if ok:break
  time.sleep(2)
 R.check(ok,'POST_ASSET_MISMATCH')
 current_health=R.invariants('OFF' if paused else 'GENERAL')
 expected=dict(pre_health);expected['createMode']='OFF' if paused else 'GENERAL'
 R.check(R.active('trendos-d1-api')==api and current_health==expected and R.fingerprint(R.module('trendos-d1-api'))['sha256']==api_hash,'BACKEND_DRIFT')
 R.check(R.normalized_settings(R.settings('trendos-ui'))==R.normalized_settings(before_settings),'UI_SETTINGS_CHANGED')
 R.check(R.normalized_settings(R.settings('trendos-d1-api'))==R.normalized_settings(api_settings),'API_SETTINGS_CHANGED')
 if paused:
  R.check(R.stats()==stats,'BUSINESS_CHANGED_DURING_REPAIR')
  R.sql("UPDATE t12_prod_general_create_control SET mode='GENERAL' WHERE singleton=1 AND mode='OFF' AND policy_epoch=?",[control['policy_epoch']])
  R.check(R.invariants('GENERAL')==pre_health,'GENERAL_REOPEN_FAILED');paused=False
 report.update(state='DEPLOYED_VERIFIED',preUiVersion=pre,activeApiVersion=api,assetsChecked=len(names),changedAssets=patches,otherAssetsPreserved=True,rollbackUsed=False)
 completed=True
except Exception as e:
 report['error']=str(e);report['state']='BLOCKED_SAFE'
 if paused:report['createPaused']=True
 if attempted and not completed:
  current=R.active('trendos-ui');version=R.cf('/workers/scripts/trendos-ui/versions/'+current)
  annotations=version.get('metadata',{}).get('annotations',{})
  if current!=pre and annotations.get('workers/tag')==os.environ['GITHUB_SHA']:
   R.traffic('trendos-ui',pre);report['rollbackUsed']=True
  else:report['rollback']='NO_OVERWRITE_OF_UNLEASED_VERSION'
 raise
finally:
 (R.STATE/'optional-description-result.json').write_text(json.dumps(report,indent=2))
 print('::notice title=T12_OPTIONAL_DESCRIPTION_RELEASE::'+json.dumps(report,separators=(',',':')))
