/** SERVER-70: repository SOURCE compatibility audit; never calls Cloudflare or Google.
 * A successful test is not a deployment GO; live callers & trigger status unknown.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ROOT='autonomous-printshop/print-server/';
const inventory=JSON.parse(readFileSync(ROOT+'SERVER70_LEGACY_READ_CONSUMER_INVENTORY.json','utf8'));
const source=p=>readFileSync(p,'utf8');
const entries=new Map(inventory.consumers.map(c=>[c.id,c]));

test('all five repository-known legacy read consumers are recorded, not marked migrated',()=>{
  assert.equal(inventory.schema,'trendos.server70.legacy-read-source-inventory.v1');
  assert.deepEqual([...entries.keys()],[
    'R5_PERIODIC_CONTROLLED','FULL_MIGRATION','ORDERS_LIVE_SYNC',
    'ORDERS_READ_CUTOVER','CUSTOMER_MANAGER_V1934'
  ]);
  assert.ok(inventory.consumers.every(c=>c.path && c.legacy.length && c.sourceMigrationPrepared !== undefined));
  assert.ok(inventory.consumers.every(c=>c.liveCutoverVerified===false));
  assert.equal(inventory.outsideRepositoryCallers.verifiedExhaustive,false);
  assert.equal(inventory.outsideRepositoryCallers.status,'UNKNOWN');
});
for(const [id,paths] of [
  ['R5_PERIODIC_CONTROLLED',['/v1/mirror/sheets']],
  ['FULL_MIGRATION',['/v1/mirror/stats']],
  ['ORDERS_LIVE_SYNC',['/v1/mirror/capabilities','/v1/mirror/stats']],
  ['ORDERS_READ_CUTOVER',['/v1/mirror/sheet']],
  ['CUSTOMER_MANAGER_V1934',['/v1/orders','/v1/customer','/v1/messages','/v1/inbox']]
]){
  test(id+': every dangerous route in static inventory is still present in source',()=>{
    const c=entries.get(id);
    assert.deepEqual([...c.legacy].sort(),[...paths].sort());
    const content=source(c.path);
    for(const path of paths)assert.ok(content.includes(path),'lost source reference '+id+': '+path);
  });
}
test('R5 deploy job is STILL pinned and relies on old anonymous mirror HTTP200; no implicit migration',()=>{
  const w=source(entries.get('R5_PERIODIC_CONTROLLED').path);
  assert.ok(w.includes('ref: b7e85647ac205b93f22e9f9ea1da58b21d54e4c0'));
  assert.ok(w.includes('"$PROD_URL/v1/mirror/sheets"'));
  assert.ok(w.includes('test "$catalog_code" = 200'));
  assert.ok(w.includes('wrangler@4 deploy --config cloudflare-d1/wrangler.toml'));
  assert.ok(w.includes('CLOUDFLARE_API_TOKEN'));
  const r5=source('cloudflare-d1/r5-server68-signed-metadata-preflight.mjs');
  assert.ok(r5.includes("'/v1/service/mirror/sheets'"));
  assert.ok(r5.includes("typeof options.fetchImpl !== 'function'"));
  assert.ok(r5.includes('expectedHostname'));
});
test('full mirror Apps Script signer remains source-only, opt-in, no silent fallback after ON',()=>{
  const full=source(entries.get('FULL_MIGRATION').path);
  const client=source('cloudflare-d1/D1_Mirror_Service_Read_V1.gs');
  assert.ok(full.includes("getProperty('D1_MIRROR_SERVICE_READ_V1_ENABLED')"));
  assert.ok(full.includes('return d1MirrorServiceReadV1_(path);'));
  assert.ok(full.includes("throw new Error('SERVER67_SIGNER_NOT_INSTALLED')"));
  assert.ok(client.includes("getProperty('D1_MIRROR_SERVICE_READ_V1_ENABLED')"));
  assert.ok(client.includes('followRedirects: false'));
  assert.ok(client.includes("principal = isRows ? 'trendos_mirror_parity' : 'trendos_mirror_metadata'"));
  assert.ok(client.includes("'/v1/service/mirror/' + kind"));
  assert.ok(!client.includes('fallbackToLegacy'));
});
test('orders live sync depends on common metadata client; live trigger and target are unknown',()=>{
  const sync=source(entries.get('ORDERS_LIVE_SYNC').path);
  assert.ok(sync.includes("d1FullGet_('/v1/mirror/capabilities')"));
  assert.ok(sync.includes("d1FullGet_('/v1/mirror/stats')"));
  assert.ok(sync.includes("getProperty('D1_API_URL')"));
  assert.equal(entries.get('ORDERS_LIVE_SYNC').liveCutoverVerified,false);
});
test('orders parity paging changes 500 only to 100 in explicitly enabled secure mode',()=>{
  const read=source(entries.get('ORDERS_READ_CUTOVER').path);
  assert.ok(read.includes("const D1_ORDERS_READ_PAGE_SIZE_V1 = 500"));
  assert.ok(read.includes("? 100 : D1_ORDERS_READ_PAGE_SIZE_V1"));
  assert.ok(read.includes('d1OrdersReadPageSizeV1_()'));
  assert.ok(read.includes('return d1MirrorServiceReadV1_(path);'));
  assert.ok(read.includes("throw new Error('SERVER67_SIGNER_NOT_INSTALLED')"));
});
test('customer-manager browser bridge is a DIFFERENT worker and cannot be made secure by metadata HMAC',()=>{
  const client=source(entries.get('CUSTOMER_MANAGER_V1934').path);
  assert.ok(client.includes("https://trendos.trendmall-contact.workers.dev"));
  assert.ok(client.includes("'/v1/inbox'"));
  assert.ok(client.includes("'/v1/messages'"));
  assert.ok(client.includes("'/v1/orders'"));
  assert.ok(client.includes("'/v1/customer'"));
  assert.ok(client.includes('apps-script-fallback'));
  assert.equal(entries.get('CUSTOMER_MANAGER_V1934').sourceMigrationPrepared,false);
  assert.equal(entries.get('CUSTOMER_MANAGER_V1934').automaticLegacyFallback,true);
});
test('legacy mirror GET and legacy customer GET are DENIED in review source without a key bypass',()=>{
  const modern=source('cloudflare-d1/src/mirror-gate.mjs');
  const old=source('cloudflare-d1/src/index.js');
  const legacyMirror=source('cloudflare-d1/src/mirror.js');
  assert.ok(modern.includes('mirror-read-authorization-required'));
  assert.ok(legacyMirror.includes('mirror-read-authorization-required'));
  assert.ok(old.includes('legacy-read-authorization-required'));
});
test('static code PASS never means cutover GO, access fix, R5 deployed or Ubuntu connected',()=>{
  const flags=inventory.releaseGates;
  assert.equal(Object.keys(flags).length,8);
  assert.ok(Object.values(flags).every(flag=>flag===false));
  assert.equal(inventory.upstreamFixes.existingProductionConsumersModified,false);
  assert.equal(inventory.upstreamFixes.securedCloudflareStageDeployed,false);
  const owner=JSON.parse(source(ROOT+'SERVER69_RELEASE_DECISIONS.json'));
  assert.equal(owner.decisions.find(x=>x.id==='D03').status,'evidence_pending');
  assert.equal(owner.decisions.find(x=>x.id==='D04').defaultSafe,'NO_PRODUCTION_DEPLOY');
});
test('no inventory script contains runtime triggers, secrets or external network operations',()=>{
  const code=source('tests/server70_legacy_read_consumer_inventory.test.mjs');
  assert.ok(code.includes("import {readFileSync}"));
  assert.ok(!code.includes('https.request('));
  assert.ok(!code.includes('fetch('));
  assert.ok(!code.includes('spawn('));
  assert.ok(!code.includes('exec('));
  assert.ok(!code.includes('wrangler deploy'));
});
