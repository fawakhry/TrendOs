"""Qualified ready-pickup policy patch. No customer/status writes or migrations."""
import json,subprocess,tarfile,time,io
from pathlib import Path
import t12_customer_lane_controlled_release as R
from ap081_dashboard_controlled_release import main_health
DEPLOY='--deploy' in __import__('sys').argv
EXPECTED='ca850aa78e6e682a389b309bcf72a078fe56a0f5d771089cbd98d69bb47df2d3'
VERSION='734e4610-ae41-4cfb-9096-891d07015610'
POLICY='T12_CUSTOMER_LANE_POLICY_20261010_READY_PICKUP_V4'
REPORT={'state':'PREPARING','deployAuthorized':DEPLOY,'businessWrite':False,'customerStatusWrite':False,'migration':False}
work=Path('/tmp/t12-ready-pickup');work.mkdir(exist_ok=True)
paused=False;own=None;before=None;control=None
try:
 for test in ['t12_general_create','t12_customer_lane_partial']:
  R.run(['node','--experimental-sqlite','tests/'+test+'.test.mjs'])
 tree=R.run(['git','merge-tree','--write-tree','57153ebf98616957e7317815603ee79b899d846b','fe16c8b6d835dd372782e955fedf6d8fa84e865e']).splitlines()[0]
 archive=subprocess.check_output(['git','archive',tree]);source=work/'source';source.mkdir(exist_ok=True)
 with tarfile.open(fileobj=io.BytesIO(archive)) as tar:tar.extractall(source,filter='data')
 def build(out):
  R.run([R.WRANGLER,'deploy','--dry-run','--config',str(source/'cloudflare-d1/wrangler.toml'),'--outdir',str(out)],cwd=source)
  files=[p for p in out.iterdir() if p.suffix in ('.js','.mjs')];R.check(len(files)==1,'MULTI_MODULE');return files[0].read_bytes()
 baseline=build(work/'baseline');R.check(R.fingerprint(baseline)['sha256']==EXPECTED,'BASE_RECONSTRUCTION_FAILED')
 patches=['cloudflare-d1/src/t12-customer-lane-policy.mjs','cloudflare-d1/src/t12-general-create.mjs','cloudflare-d1/src/t12-general-create-handler.mjs']
 for name in patches:(source/name).write_bytes(Path(name).read_bytes())
 target=build(work/'target');target_hash=R.fingerprint(target)['sha256']
 R.check(target_hash!=EXPECTED,'EMPTY_PATCH')
 before=R.active('trendos-d1-api');ui=R.active('trendos-ui');settings=R.normalized_settings(R.settings('trendos-d1-api'));health=main_health()
 R.check(before==VERSION and R.fingerprint(R.module('trendos-d1-api'))['sha256']==EXPECTED,'LIVE_SOURCE_DRIFT')
 control=R.rows('SELECT mode,marker,policy_epoch,canary_remaining FROM t12_prod_general_create_control WHERE singleton=1')[0]
 R.check(control['mode']=='GENERAL' and control['marker']=='T12_GENERAL_CREATE_V1' and control['canary_remaining']==0,'CONTROL_DRIFT')
 REPORT.update(state='QUALIFIED_READONLY',preVersion=before,baseSha256=EXPECTED,targetSha256=target_hash,changedSourceFiles=patches,mainHealth=health,tests='PASS')
 def lease(expected):
  R.check(R.active('trendos-d1-api')==expected and R.active('trendos-ui')==ui,'VERSION_LEASE_DRIFT')
  R.check(R.normalized_settings(R.settings('trendos-d1-api'))==settings,'SETTINGS_DRIFT')
 if DEPLOY:
  lease(before);R.check(main_health()==health,'HEALTH_DRIFT')
  R.sql("UPDATE t12_prod_general_create_control SET mode='OFF' WHERE singleton=1 AND mode='GENERAL' AND marker=? AND policy_epoch=?",[control['marker'],control['policy_epoch']]);paused=True
  R.check(R.rows('SELECT mode,policy_epoch FROM t12_prod_general_create_control WHERE singleton=1')[0]=={'mode':'OFF','policy_epoch':control['policy_epoch']},'PAUSE_FAILED')
  time.sleep(35);counts=R.stats();time.sleep(8);R.check(counts==R.stats(),'CREATE_NOT_DRAINED');lease(before)
  R.check(R.fingerprint(R.module('trendos-d1-api'))['sha256']==EXPECTED,'SOURCE_LEASE_DRIFT')
  own=R.upload_api(target,before);lease(before);R.traffic('trendos-d1-api',own)
  for attempt in range(15):
   h=R.health('/v1/t12/orders/create/health')
   if h.get('customerLanePolicyVersion')==POLICY and h.get('mode')=='OFF':break
   time.sleep(2)
  R.check(h.get('customerLanePolicyVersion')==POLICY and h.get('schemaReady') is True and h.get('customerLaneClaimReady') is True,'POLICY_HEALTH_FAILED')
  lease(own);R.check(R.fingerprint(R.module('trendos-d1-api'))['sha256']==target_hash,'TARGET_SOURCE_FAILED')
  R.check(counts==R.stats(),'BUSINESS_CHANGED_DURING_PAUSE')
  R.sql("UPDATE t12_prod_general_create_control SET mode='GENERAL' WHERE singleton=1 AND mode='OFF' AND marker=? AND policy_epoch=?",[control['marker'],control['policy_epoch']]);paused=False
  R.check(main_health()==health,'PROTECTED_HEALTH_CHANGED')
  h=R.health('/v1/t12/orders/create/health');R.check(h.get('mode')=='GENERAL' and h.get('customerLanePolicyVersion')==POLICY,'REOPEN_FAILED')
  REPORT.update(state='DEPLOYED_PASS',postVersion=own,customerLanePolicyVersion=POLICY,businessUnchangedDuringPause=True)
except Exception as e:
 REPORT['error']=str(e)
 if paused:
  try:
   current=R.active('trendos-d1-api')
   if own and current==own:R.traffic('trendos-d1-api',before);current=R.active('trendos-d1-api')
   if current==before and R.fingerprint(R.module('trendos-d1-api'))['sha256']==EXPECTED:
    R.sql("UPDATE t12_prod_general_create_control SET mode='GENERAL' WHERE singleton=1 AND mode='OFF' AND marker=? AND policy_epoch=?",[control['marker'],control['policy_epoch']]);REPORT['recovery']='RESTORED_BASELINE'
   else:REPORT['recovery']='CREATE_OFF_OPERATOR_REQUIRED'
  except Exception:REPORT['recovery']='RECOVERY_FAILED_OPERATOR_REQUIRED'
 raise
finally:
 Path('/tmp/t12-ready-pickup-sanitized.json').write_text(json.dumps(REPORT,indent=2))
 print('::notice title=T12_READY_PICKUP_RELEASE::'+json.dumps(REPORT,separators=(',',':')))
