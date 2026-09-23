import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessT12IsolatedRecoveryCapacityV1 } from
  '../cloudflare-d1/t12-preview/t12-d1-128-recovery-capacity-envelope-v1.mjs';

// Synthetic aggregate SHAPE only: no real row payloads, order numbers or IDs.
const sample=()=>({tabs:[
  {sheetName:'الأوردرات',sourceRowCount:65,d1BaseRowCount:12,
   changedExistingRows:11,missingSourceRowsInD1:53,
   candidateRowsForUpsert:64,unexpectedRowsInD1:0,duplicateRemoteRows:0},
  {sheetName:'بنود الأوردرات',sourceRowCount:65,d1BaseRowCount:12,
   changedExistingRows:11,missingSourceRowsInD1:53,
   candidateRowsForUpsert:64,unexpectedRowsInD1:0,duplicateRemoteRows:0}
]});
const result=assessT12IsolatedRecoveryCapacityV1(sample());
assert.equal(result.totalCandidateRowPositions,128);
assert.equal(result.hypotheticalExistingV1BatchStatements,132);
assert.equal(result.hypotheticalFreeInvocationQueryFit,false);
assert.equal(result.hypotheticalPaidInvocationQueryFit,true);
assert.equal(result.existingV1WritePathFits,false);
assert.equal(result.productionWriteAuthorized,false);
assert.equal(result.requiresDedicatedTestD1Qualification,true);
assert.equal(result.unknownRealProposalBytes,true);
assert.equal(result.unknownCurrentSourceAndMirrorPreimages,true);
assert.equal(result.tabs[0].tailGrowth,53);
assert.equal(result.tabs[1].tailGrowth,53);
assert.equal(Object.isFrozen(result),true);

let denied=0;
function reject(label,mutate,error){
  const input=sample();mutate(input);
  assert.throws(()=>assessT12IsolatedRecoveryCapacityV1(input),
    e=>e?.message==='T12_ENVELOPE_ABORT_'+error,label);
  denied++;
}
reject('missing second tab',i=>{i.tabs.pop()},'TAB_COUNT');
reject('duplicate names',i=>{i.tabs[1].sheetName=i.tabs[0].sheetName},'TAB_IDENTITY');
reject('source smaller than mirror',i=>{i.tabs[0].sourceRowCount=11},'INVALID_COUNTS');
reject('negative count',i=>{i.tabs[0].changedExistingRows=-1},'INVALID_COUNTS');
reject('fractional count',i=>{i.tabs[0].changedExistingRows=1.5},'INVALID_COUNTS');
reject('nonfinite count',i=>{i.tabs[0].sourceRowCount=Infinity},'INVALID_COUNTS');
reject('unexpected remote row',i=>{i.tabs[0].unexpectedRowsInD1=1},'UNEXPECTED_OR_DUPLICATE_REMOTE');
reject('duplicate remote row',i=>{i.tabs[1].duplicateRemoteRows=1},'UNEXPECTED_OR_DUPLICATE_REMOTE');
reject('missing does not equal tail growth',i=>{i.tabs[0].missingSourceRowsInD1=52},'INCONSISTENT_DELTA');
reject('candidate mismatch',i=>{i.tabs[1].candidateRowsForUpsert=63},'INCONSISTENT_DELTA');
reject('tail growth exceeds design bound',i=>{
  i.tabs[0].sourceRowCount=78;i.tabs[0].missingSourceRowsInD1=66;
  i.tabs[0].candidateRowsForUpsert=77;
},'DESIGN_TAIL_CEILING');
reject('total over 160 only isolated design max',i=>{
  for(const t of i.tabs){
    t.sourceRowCount=75;t.d1BaseRowCount=11;t.changedExistingRows=17;
    t.missingSourceRowsInD1=64;t.candidateRowsForUpsert=81;
  }
},'INVALID_COUNTS');
// Still no authorization even if a tiny hypothetical shape fits the Free budget.
const small=sample();
for(const t of small.tabs){
  t.sourceRowCount=14;t.d1BaseRowCount=12;
  t.changedExistingRows=0;t.missingSourceRowsInD1=2;
  t.candidateRowsForUpsert=2;
}
const little=assessT12IsolatedRecoveryCapacityV1(small);
assert.equal(little.hypotheticalFreeInvocationQueryFit,true);
assert.equal(little.existingV1WritePathFits,true);
assert.equal(little.productionWriteAuthorized,false);
// The pure capacity module must never be reachable from a production router.
for(const name of ['../cloudflare-d1/production-shadow/index.js',
  '../cloudflare-d1/src/index_v2.js',
  '../cloudflare-d1/src/r4-guarded-recovery-production.mjs']){
  const live=fs.readFileSync(new URL(name,import.meta.url),'utf8');
  assert.equal(live.includes('t12-d1-128-recovery-capacity-envelope-v1'),false);
}
const code=fs.readFileSync(new URL(
  '../cloudflare-d1/t12-preview/t12-d1-128-recovery-capacity-envelope-v1.mjs',
  import.meta.url),'utf8');
for(const forbidden of ['fetch(','.batch(','.prepare(','ScriptApp','PropertiesService']){
  assert.equal(code.includes(forbidden),false,'No live IO: '+forbidden);
}
console.log('T12 isolated 128 capacity envelope PASS: 128 => 132 hypothetical statements, 50 budget rejected; '+denied+' negative cases; no production write or route.');
