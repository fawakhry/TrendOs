"""Show the existing blocking order; preserve the live API and all other assets."""
import hashlib,json,os,re,subprocess,time
from pathlib import Path
import t12_customer_lane_controlled_release as R
from ap081_dashboard_controlled_release import main_health

DEPLOY='--deploy' in __import__('sys').argv
BASE='99ba54a8'
REPORT={'state':'PREPARING','deployAuthorized':DEPLOY,'backendDeploy':False,'businessWrite':False,'d1Write':False,'customerStatusWrite':False}
STATE=Path('/tmp/t12-blocked-order-ui');STATE.mkdir(exist_ok=True)
try:
 for test in ['t12_blocked_order_visibility','t12_create_key_durability','frontend_t12_duplicate_order_guard_entry590','entry652_employee_session_lifecycle_guard']:
  R.run(['node','tests/'+test+'.test.mjs'])
 REPORT['frontendContracts']='PASS'
 before_ui=R.active('trendos-ui');before_api=R.active('trendos-d1-api')
 api_hash=R.fingerprint(R.module('trendos-d1-api'))['sha256'];health=main_health()
 before_settings=R.settings('trendos-ui');api_settings=R.settings('trendos-d1-api')
 names=subprocess.check_output(['git','ls-tree','--name-only','2da755ca910b84911378c018d050cf806d8349d5'],text=True).splitlines()
 names=[n for n in names if n.endswith(('.html','.js','.css'))]
 dist=STATE/'frontend-dist';dist.mkdir(exist_ok=True);before={}
 for name in names:
  _,data=R.fetch(R.UI+'/'+name+'?blockedOrder='+str(time.time_ns()))
  R.check(data and not (name.endswith(('.js','.css')) and data.lstrip().lower().startswith(b'<!doctype html')),'ASSET_INVALID')
  (dist/name).write_bytes(data);before[name]=hashlib.sha256(data).hexdigest()
 patches=['app.js','trendos-edge-orders-read-v1.js','config.js','index.html']
 for name in patches:
  R.check((dist/name).read_bytes()==subprocess.check_output(['git','show',BASE+':'+name]),'PATCH_BASE_DRIFT_'+name)
  (dist/name).write_bytes(Path(name).read_bytes())
 after={name:hashlib.sha256((dist/name).read_bytes()).hexdigest() for name in names}
 R.check({name for name in names if before[name]!=after[name]}==set(patches),'PATCH_SCOPE_DRIFT')
 front=STATE/'frontend';(front/'src').mkdir(parents=True,exist_ok=True)
 (front/'src/frontend-static-worker.mjs').write_bytes(Path('cloudflare-d1/src/frontend-static-worker.mjs').read_bytes())
 (front/'wrangler.toml').write_bytes(Path('cloudflare-d1/wrangler.frontend.toml').read_bytes())
 if not (front/'frontend-dist').exists():(front/'frontend-dist').symlink_to(dist,target_is_directory=True)
 R.run([R.WRANGLER,'deploy','--dry-run','--config',str(front/'wrangler.toml'),'--outdir',str(STATE/'ui-build')])
 modules=[p for p in (STATE/'ui-build').iterdir() if p.suffix in ('.js','.mjs')]
 R.check(len(modules)==1 and R.fingerprint(modules[0].read_bytes())==R.fingerprint(R.module('trendos-ui')),'UI_WORKER_CHANGED')
 R.check(R.active('trendos-ui')==before_ui and R.active('trendos-d1-api')==before_api,'VERSION_LEASE_DRIFT')
 R.check(main_health()==health and R.fingerprint(R.module('trendos-d1-api'))['sha256']==api_hash,'API_LEASE_DRIFT')
 R.check(R.normalized_settings(R.settings('trendos-ui'))==R.normalized_settings(before_settings),'SETTINGS_LEASE_DRIFT')
 REPORT.update(state='QUALIFIED_READONLY',preUiVersion=before_ui,apiVersion=before_api,apiSourceSha256=api_hash,assetsChecked=len(names),changedAssets=patches,mainHealth=health)
 if DEPLOY:
  output=R.run([R.WRANGLER,'deploy','--config',str(front/'wrangler.toml'),'--keep-vars'])
  match=re.search(r'Current Version ID:\s*([a-f0-9-]{36})',output);R.check(match is not None,'VERSION_NOT_CAPTURED')
  own=match.group(1);REPORT['postUiVersion']=own;REPORT['state']='PUBLISHED_PENDING_POSTFLIGHT'
  for attempt in range(12):
   good=True
   for name in names:
    _,data=R.fetch(R.UI+'/'+name+'?blockedOrderPost='+str(time.time_ns()))
    if hashlib.sha256(data).hexdigest()!=after[name]:good=False;break
   if good:break
   time.sleep(2)
  R.check(good and R.active('trendos-ui')==own,'UI_POSTFLIGHT_FAILED')
  R.check(R.active('trendos-d1-api')==before_api and R.fingerprint(R.module('trendos-d1-api'))['sha256']==api_hash and main_health()==health,'API_POSTFLIGHT_DRIFT')
  R.check(R.normalized_settings(R.settings('trendos-ui'))==R.normalized_settings(before_settings),'UI_SETTINGS_CHANGED')
  R.check(R.normalized_settings(R.settings('trendos-d1-api'))==R.normalized_settings(api_settings),'API_SETTINGS_CHANGED')
  REPORT['state']='DEPLOYED_PASS'
except Exception as e:
 REPORT['error']=str(e);raise
finally:
 Path('/tmp/t12-blocked-order-ui-sanitized.json').write_text(json.dumps(REPORT,indent=2))
 print('::notice title=T12_BLOCKED_ORDER_UI::'+json.dumps(REPORT,separators=(',',':')))
