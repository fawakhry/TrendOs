"""Authorized frontend-only fix: optional order description, exact live overlay."""
import json,os,hashlib,subprocess,time
from pathlib import Path
import t12_customer_lane_controlled_release as release
R=release;report={'state':'PREPARING','backendDeploy':False,'d1Write':False,'descriptionOptional':True}
BASE='d247bf3e';names=subprocess.check_output(['git','ls-tree','--name-only','2da755ca910b84911378c018d050cf806d8349d5'],text=True).splitlines();names=[n for n in names if n.endswith(('.html','.js','.css'))]
pre=None;attempted=False;completed=False
try:
 pre=R.active('trendos-ui');api=R.active('trendos-d1-api')
 report['preVersions']={'ui':pre,'api':api}
 api_hash=R.fingerprint(R.module('trendos-d1-api'))['sha256'];report['apiSourceSha256']=api_hash
 pre_health=R.invariants('GENERAL');R.check(pre_health['claimReady'] is True,'LANE_GUARD_NOT_READY')
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
 R.check(R.active('trendos-d1-api')==api and R.invariants('GENERAL')==pre_health and R.fingerprint(R.module('trendos-d1-api'))['sha256']==api_hash,'BACKEND_DRIFT')
 R.check(R.normalized_settings(R.settings('trendos-ui'))==R.normalized_settings(before_settings),'UI_SETTINGS_CHANGED')
 R.check(R.normalized_settings(R.settings('trendos-d1-api'))==R.normalized_settings(api_settings),'API_SETTINGS_CHANGED')
 report.update(state='DEPLOYED_VERIFIED',preUiVersion=pre,apiVersionUnchanged=api,assetsChecked=len(names),changedAssets=patches,otherAssetsPreserved=True,rollbackUsed=False)
 completed=True
except Exception as e:
 report['error']=str(e);report['state']='BLOCKED_SAFE'
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
