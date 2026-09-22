import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reconcileT12OrderIdSeedEvidence as reconcile,
  T12_ORDER_ID_REQUIRED_SOURCES} from '../cloudflare-d1/src/t12-order-id-seed-evidence.mjs';

const snapshotId='frozen-readonly-snapshot-A';
function fixture(){
  const ids={currentOrders:['1001','1050','TM260620'],
    currentLines:['1050','1049'],archivedOrders:['1999','TM260601'],
    archivedLines:['1999'],productionD1Mirror:['1800','1001']};
  return {snapshotId,scriptPropertiesNext:'1900',sources:Object.fromEntries(
    T12_ORDER_ID_REQUIRED_SOURCES.map(source=>[source,
      {snapshotId,complete:true,orderIds:ids[source],rowCount:ids[source].length}]))};
}
let x=reconcile(fixture());
assert.equal(x.success,true);
assert.equal(x.maxObservedNumericId,1999); // archives outrank stale property/mirror
assert.equal(x.nextCandidate,2000);
assert.equal(x.productionAuthorized,false);
assert.equal(x.authoritative,false);
assert.equal(x.legacyCells,2);
assert.equal(x.perSource.length,5);
assert.equal(x.remainingGates.length,4);
assert.equal(Object.isFrozen(x),true);
assert.equal(Object.isFrozen(x.perSource),true);

for(const [field,next,reason] of [
  ['scriptPropertiesNext','2200',null],
  ['scriptPropertiesNext','1999',null],
  ['scriptPropertiesNext','2000.0','invalid-or-unavailable-google-next-number'],
  ['scriptPropertiesNext','02000','invalid-or-unavailable-google-next-number'],
  ['scriptPropertiesNext',2000,'invalid-or-unavailable-google-next-number'],
  ['scriptPropertiesNext','900','invalid-or-unavailable-google-next-number']
]){
  const data=fixture();data[field]=next;const result=reconcile(data);
  if(reason){assert.equal(result.success,false);assert.equal(result.reason,reason);}
  else assert.equal(result.nextCandidate,Math.max(Number(next),2000));
}
for(const key of T12_ORDER_ID_REQUIRED_SOURCES){
  let e=fixture();delete e.sources[key];x=reconcile(e);
  assert.equal(x.reason,'mandatory-source-missing');assert.equal(x.source,key);
  e=fixture();e.sources[key].snapshotId='not-the-same-epoch';
  assert.equal(reconcile(e).reason,'source-coverage-or-snapshot-mismatch');
  e=fixture();e.sources[key].complete=false;
  assert.equal(reconcile(e).reason,'source-coverage-or-snapshot-mismatch');
  e=fixture();e.sources[key].rowCount++;
  assert.equal(reconcile(e).reason,'source-row-count-mismatch');
}
for(const [bad,reason] of [
  ['001999','unsupported-or-noncanonical-order-id'],
  ['2e3','unsupported-or-noncanonical-order-id'],
  ['1999.0','unsupported-or-noncanonical-order-id'],
  [' 2001','invalid-order-id-in-snapshot'],
  ['2001 ','invalid-order-id-in-snapshot'],
  ['', 'invalid-order-id-in-snapshot'],
  ['900','numeric-order-id-out-of-range'],
  [String(Number.MAX_SAFE_INTEGER),'numeric-order-id-out-of-range']
]){
  const e=fixture();e.sources.currentOrders.orderIds.push(bad);e.sources.currentOrders.rowCount++;
  assert.equal(reconcile(e).reason,reason,bad);
}
let e=fixture();e.sources.currentOrders.orderIds=['TM260601'];e.sources.currentOrders.rowCount=1;
for(const key of T12_ORDER_ID_REQUIRED_SOURCES){e.sources[key].orderIds=['TM260601'];e.sources[key].rowCount=1;}
assert.equal(reconcile(e).reason,'no-confirmed-numeric-order-id');
e=fixture();e.sources.productionD1Mirror.orderIds=[];e.sources.productionD1Mirror.rowCount=0;
assert.equal(reconcile(e).nextCandidate,2000); // verified empty mirrors are not a higher-number oracle
assert.equal(reconcile({...fixture(),sources:{...fixture().sources,surprise:{}}}).reason,'source-inventory-invalid');
assert.equal(reconcile(null).reason,'evidence-object-required');

for(const p of ['cloudflare-d1/src/index_v2.js','cloudflare-d1/production-shadow/index.js',
  'cloudflare-d1/t12-preview/t12-dashboard-singlefile-test-worker.js']){
  assert.equal(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8').includes('t12-order-id-seed-evidence'),false);
}
const source=fs.readFileSync(new URL('../cloudflare-d1/src/t12-order-id-seed-evidence.mjs',import.meta.url),'utf8');
assert.equal(/\b(fetch|SpreadsheetApp|PropertiesService|db\.prepare|new\s+Response)\s*\(/.test(source),false);
console.log('T12 pure order-number seed reconciliation PASS; archive/property/mirror maxima, missing/stale sources and no production wiring.');
