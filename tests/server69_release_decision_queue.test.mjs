/** SERVER-69: the decision queue is a release-blocking contract, never a deploy runner. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root='autonomous-printshop/print-server/';
const queue=JSON.parse(readFileSync(root+'SERVER69_RELEASE_DECISIONS.json','utf8'));
const file=name=>readFileSync(name,'utf8');
const ids=queue.decisions.map(x=>x.id);
const check=id=>queue.decisions.find(x=>x.id===id);

test('all six owner decisions are preserved once, never silently resolved',()=>{
  assert.equal(queue.schema,'trendos.server69.review-decision-queue.v1');
  assert.deepEqual(ids,['D01','D02','D03','D04','D05','D06']);
  assert.equal(new Set(ids).size,6);
  assert.ok(queue.decisions.every(x=>x.status!=='approved' && x.defaultSafe && x.requiredBefore));
});
test('separate Cloudflare stage is a held owner decision, not a disguised production deploy',()=>{
  assert.equal(check('D01').defaultSafe,'NO_REMOTE_PROVISIONING');
  const cfg=file('cloudflare-d1/wrangler.server68-isolated-stage.toml');
  assert.match(cfg,/name = "trendos-server68-isolated-stage"/);
  assert.match(cfg,/workers_dev = false/);
  assert.doesNotMatch(cfg,/\[\[d1_databases\]\]|trendos-main|bfe05bde-a3a1-49bc-ad3d-3f0b94a8f8a6/i);
  assert.match(cfg,/MIRROR_SERVICE_READ_ENABLED = "false"/);
  assert.match(cfg,/TRENDOSSHOP_SERVICE_READ_ENABLED = "false"/);
});
test('R5 production deploy remains pinned and explicitly blocked by a real consumer dependency',()=>{
  const wf=file('.github/workflows/trendos-r5-periodic-controlled.yml');
  assert.match(wf,/ref: b7e85647ac205b93f22e9f9ea1da58b21d54e4c0/);
  assert.match(wf,/\/v1\/mirror\/sheets/);
  assert.match(wf,/test "\$catalog_code" = 200/);
  assert.equal(check('D03').status,'evidence_pending');
  const newHelper=file('cloudflare-d1/r5-server68-signed-metadata-preflight.mjs');
  assert.match(newHelper,/\/v1\/service\/mirror\/sheets/);
  assert.doesNotMatch(newHelper,/wrangler deploy|CLOUDFLARE_API_TOKEN/);
});
test('the Python Ubuntu reader remains OFF unless two distinct owner gates are explicitly true',()=>{
  assert.equal(check('D05').defaultSafe,'UBUNTU_CLIENT_OFF');
  const client=file(root+'src/trendosshop_read_once.py');
  assert.match(client,/enabled: bool = False/);
  assert.match(client,/owner_authorized: bool = False/);
  assert.match(client,/if enabled is not True or owner_authorized is not True/);
  assert.match(client,/SERVER34_LIVE_READ_DISABLED/);
  assert.match(client,/def read_trendosshop_once/);
});
test('service principal route excludes customers, finance and device execution',()=>{
  const reader=file('cloudflare-d1/src/trendosshop-service-orders-read-v1.mjs');
  assert.match(reader,/TRENDOSSHOP_SERVICE_READ_ENABLED/);
  assert.match(reader,/const DEPTS = Object\.freeze\(\{ print:'طباعة', laser:'ليزر' \}\)/);
  assert.match(reader,/orderId,lineId,screen,serviceCode,status,quantity/);
  assert.doesNotMatch(reader,/\b(?:INSERT INTO|DELETE FROM|UPDATE t12_)\b/i);
  const policy=JSON.parse(file(root+'SERVICE_ORDER_READER_POLICY_V1.json'));
  assert.equal(policy.principal.provisioned,false);
  assert.equal(policy.readClient.enabled,false);
  assert.ok(policy.authorization.forbiddenOperations.includes('devices.execute'));
});
test('HMAC nonce replay namespace uses the verified principal scope, not an undefined property',()=>{
  const reader=file('cloudflare-d1/src/mirror-service-read-v1.mjs');
  assert.match(reader,/namespace\.idFromName\(authenticated\.scope\)/);
  assert.doesNotMatch(reader,/namespace\.idFromName\(authenticated\.principal\)/);
  assert.equal(check('D02').defaultSafe,'NO_KEYS_OR_REMOTE_BINDINGS');
});
test('no decision enables live customer data or print/laser execution implicitly',()=>{
  assert.equal(check('D06').defaultSafe,'NO_CUSTOMER_DATA_NO_DEVICES');
  assert.ok(queue.strictNoChange.some(x=>x.includes('printing/laser')));
  assert.equal(check('D04').defaultSafe,'NO_PRODUCTION_DEPLOY');
});
test('manager and finance remain independent branches from the Cloudflare release train',()=>{
  assert.ok(queue.strictNoChange.includes('Manager UI PR195'));
  assert.ok(queue.strictNoChange.includes('EasyStore finance'));
  assert.ok(queue.sourceDone.some(x=>x.includes('PR195')));
});
