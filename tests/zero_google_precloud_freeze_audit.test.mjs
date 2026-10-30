/* Zero Google source freeze audit. No Cloudflare connections or mutating data. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectZeroGooglePreCloudFreezeV0 as inspect,
  CANONICAL_NINE_CUSTOMER_ACTIONS as NINE} from '../tools/zero_google_precloud_freeze_audit_v0.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const FILES=[
  'cloudflare-d1/src/legacy-browser-transport-v1.mjs',
  'employee-api-dispatcher-v1.js',
  'cloudflare-d1/wrangler.customer-stage.toml',
  'cloudflare-d1/migrations/0041_customer_private_scan_lease_replay_v0.sql',
  'cloudflare-d1/customer-stage/private-scan-lease-issuer-internal-v0.mjs',
  'cloudflare-d1/customer-stage/private-scan-lease-replay-d1-internal-v0.mjs',
  'cloudflare-d1/customer-stage/private-scan-transport-envelope-internal-v0.mjs',
  'tools/customer_private_scan_loopback_transport_off_v0.py',
  'cloudflare-d1/src/index_v2.js',
  'cloudflare-d1/production-shadow/index.js',
  'cloudflare-d1/customer-stage/index.mjs'
];
function frozenFixture(t){
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'zg-precloud-fixture-'));
  t.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));
  for(const item of FILES){
    const dest=path.join(temporary,item);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.copyFileSync(path.join(ROOT,item),dest);
  }
  return {
    root:temporary,
    edit(item,fn){
      const loc=path.join(temporary,item);
      fs.writeFileSync(loc,fn(fs.readFileSync(loc,'utf8')));
    }
  };
}
test('all exactly nine customer Google action names are inventoried, not claimed retired',()=>{
  const r=inspect(ROOT);
  assert.equal(r.sourceGuardsPassed,true,JSON.stringify(r.failedChecks));
  assert.equal(r.status,'SOURCE_GUARDS_PASS_WAIT_FOR_CLOUDFLARE');
  assert.deepEqual(r.legacyActionsPresentInSource,NINE);
  assert.equal(r.customerActionsRetiredInProductionProven,0);
  assert.equal(NINE.length,9);
  assert.equal(r.productionGo,false);
  assert.equal(r.nativeGoogleCutoverAllowed,false);
  assert.equal(r.customerPrintReleaseAllowed,false);
  assert.equal(r.remoteCloudflareAccessAuthenticated,false);
  assert.equal(r.remoteIsolatedStageDeployed,false);
  assert.equal(r.liveProductionTrafficAudited,false);
  assert.equal(r.realCustomerFilesScanned,0);
  assert.equal(r.lastKnownControlledRay,'a52d02962ab3e1d0-MRS');
  assert.ok(Object.keys(r.checks).length>=12);
});
test('fails closed if customer stage enabled accidentally or made public',t=>{
  const x=frozenFixture(t);
  x.edit('cloudflare-d1/wrangler.customer-stage.toml',s=>
    s.replace('TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"',
      'TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "true"')
    .replace('workers_dev = false','workers_dev = true'));
  const r=inspect(x.root);
  assert.equal(r.sourceGuardsPassed,false);
  assert.equal(r.checks.independent_customer_stage_off,false);
  assert.equal(r.checks.no_public_customer_stage_url,false);
  assert.equal(r.productionGo,false);
});
test('fails closed if customer Google set silently loses an action',t=>{
  const x=frozenFixture(t);
  // Legacy source contains a second, broader action allowlist earlier in the
  // file. Mutate the scoped nine-action declaration only, not the first match.
  x.edit('cloudflare-d1/src/legacy-browser-transport-v1.mjs',s=>{
    const i=s.indexOf('const LEGACY_CUSTOMER_SESSION_ACTIONS');
    assert.ok(i>=0);
    const prefix=s.slice(0,i),tail=s.slice(i);
    const changed=tail.replace("'submitCustomerDraft', 'uploadCustomerDraftFile'",
      "'submitCustomerDraft'");
    assert.notEqual(changed,tail);
    return prefix+changed;
  });
  const r=inspect(x.root);
  assert.equal(r.checks.nine_legacy_actions_match_source,false);
  assert.equal(r.productionGo,false);
});
test('fails closed if new private scan module is imported by customer Stage',t=>{
  const x=frozenFixture(t);
  x.edit('cloudflare-d1/customer-stage/index.mjs',
    s=>s+"\nimport './private-scan-transport-envelope-internal-v0.mjs';\n");
  const r=inspect(x.root);
  assert.equal(r.checks.new_private_scan_modules_not_imported_in_entry_3,false);
});
test('fails closed if loopback scanner bound to all interfaces',t=>{
  const x=frozenFixture(t);
  x.edit('tools/customer_private_scan_loopback_transport_off_v0.py',
    s=>s.replace('("127.0.0.1", 0)','("0.0.0.0", 8080)'));
  const r=inspect(x.root);
  assert.equal(r.checks.transport_loopback_test_only,false);
});
test('fails closed if immutable replay schema loses DELETE protection',t=>{
  const x=frozenFixture(t);
  x.edit('cloudflare-d1/migrations/0041_customer_private_scan_lease_replay_v0.sql',
    s=>s.replace('BEFORE DELETE','-- DELETE NOT PROTECTED'));
  const r=inspect(x.root);
  assert.equal(r.checks.replay_table_immutable_pk,false);
});
test('fails closed if production D1/R2 bindings accidentally added to Stage',t=>{
  const x=frozenFixture(t);
  x.edit('cloudflare-d1/wrangler.customer-stage.toml',
    s=>s+"\n[[d1_databases]]\nbinding='DB'\n");
  const r=inspect(x.root);
  assert.equal(r.checks.no_live_customer_stage_d1_r2_binding,false);
});
