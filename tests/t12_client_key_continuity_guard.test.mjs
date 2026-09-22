import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planT12ClientKeyContinuity as plan} from '../cloudflare-d1/src/t12-client-key-continuity-guard.mjs';
const key='cld1_1790000000000_TEST_12345678901';
const actor='employee-001',digest='a'.repeat(64),epoch='cutover_20260922';
const record={clientRequestId:key,actorSubject:actor,intentDigest:digest,
  cutoverEpoch:epoch,deliveryState:'PREPARED_NEVER_SENT'};
const ctx={rawKey:key,actorSubject:actor,intentDigest:digest,cutoverEpoch:epoch,record};
for(const malformed of [null,[],42,'text',Object.create({inherited:true})]){
  const rejected=plan(malformed);
  assert.equal(rejected.disposition,'REFUSE');
  assert.equal(rejected.reason,'invalid-continuity-context');
  assert.equal(rejected.createAuthorized,false);
  assert.equal(rejected.productionAuthorized,false);
}
let r=plan(ctx);
assert.equal(r.disposition,'RESUME_SAME_KEY_AFTER_INDEPENDENT_SERVER_ADMISSION');
assert.equal(r.createAuthorized,false);
assert.equal(r.productionAuthorized,false);
assert.equal(Object.isFrozen(r),true);
assert.equal(plan({...ctx,record:{...record,deliveryState:'MAY_HAVE_SENT'}}).disposition,
  'LEDGER_RECONCILIATION_ONLY');
assert.equal(plan({...ctx,record:{...record,deliveryState:'COMMITTED'}}).disposition,
  'VERIFIED_RECEIPT_LOOKUP_ONLY');
assert.equal(plan({...ctx,record:{...record,deliveryState:'CONFLICT'}}).disposition,'REFUSE');
assert.equal(plan({...ctx,record:null}).reason,'missing-trusted-durable-ledger-record');
for(const [field,value] of [['rawKey',key+'x'],['actorSubject','employee-002'],
  ['intentDigest','b'.repeat(64)],['cutoverEpoch','new_epoch_2027']]){
  assert.equal(plan({...ctx,[field]:value}).disposition,'REFUSE',field);
}
for(const [field,value] of [['clientRequestId',key+'x'],['actorSubject','employee-002'],
  ['intentDigest','b'.repeat(64)],['cutoverEpoch','new_epoch_2027']]){
  assert.equal(plan({...ctx,record:{...record,[field]:value}}).reason,
    'key-actor-payload-or-epoch-conflict',field);
}
assert.equal(plan({...ctx,rawKey:'co_1790000000000_legacyKey'}).disposition,'HISTORIC_LOOKUP_ONLY');
assert.equal(plan({...ctx,rawKey:'TRENDOS_CREATE_ORDER_V1908_co_1790000000000_legacyKey'}).disposition,'HISTORIC_LOOKUP_ONLY');
assert.equal(plan({...ctx,rawKey:'anything'}).disposition,'REFUSE');
assert.equal(plan({...ctx,cutoverEpoch:'?'}).disposition,'REFUSE');
assert.equal(plan({...ctx,intentDigest:'not-hash'}).disposition,'REFUSE');
const source=fs.readFileSync(new URL('../cloudflare-d1/src/t12-client-key-continuity-guard.mjs',import.meta.url),'utf8');
assert.doesNotMatch(source,/\b(?:fetch|SpreadsheetApp|PropertiesService)\s*\(|\.prepare\s*\(|new\s+Response\s*\(/);
for(const path of ['cloudflare-d1/src/index_v2.js','cloudflare-d1/production-shadow/index.js']){
  assert.doesNotMatch(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),/t12-client-key-continuity-guard/);
}
console.log('T12 stable request-key continuity PASS: legacy lookup-only, ambiguous no-create, same-key server-record binding and no live authorization.');
