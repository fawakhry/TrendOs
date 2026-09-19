import assert from 'node:assert/strict';
import { buildTargetedRecoveryPlan, publicTargetedRecoverySummary } from
  '../cloudflare-d1/t12-preview/t12-d1-targeted-recovery-plan-v1.mjs';

// All values in these tests are synthetic; no production rows, secrets or IDs.
const names = ['الأوردرات', 'بنود الأوردرات'];
function row(n, text) {
  return {rowNumber:n, values:[text], display:[text], formulas:['']};
}
function fixture() {
  const sourceTabs = names.map((sheetName, i) => ({
    sheetName, sheetId:i+11, headers:['h'], sourceLastRow:3,
    sourceLastCol:1, rows:[row(1,'header'),row(2,'updated'),row(3,'tail')]
  }));
  const mirrorTabs = names.map((sheetName, i) => ({
    sheetName,
    catalog:{sheetName,sheetId:i+11,headers:['h'], sourceLastRow:2,
      sourceLastCol:1,rowCount:2,status:'ready',
      note:'TrendOS orders live sync V2 quota-aware'},
    rows:[row(1,'header'),row(2,'old')]
  }));
  return {sourceTabs,mirrorTabs,sourceStable:true,mirrorStable:true,
    workbookVerified:true};
}
const base = buildTargetedRecoveryPlan(fixture());
assert.equal(base.publicSummary.totalCandidateUpserts,4);
assert.deepEqual(base.publicSummary.tabCounts.map(s=>s.appendedRows),[1,1]);
assert.deepEqual(base.publicSummary.tabCounts.map(s=>s.changedExistingRows),[1,1]);
assert.equal(base.productionWriteAuthorized,false);
assert.equal(base.publicSummary.requiresTransactionalD1CompareAndSwap,true);
assert.equal(base.sheets.length,2);
assert.equal(base.sheets[0].upserts[0].expectedBefore.values[0],'old');
assert.equal(base.sheets[0].upserts[1].expectedBefore,null);
assert.equal(JSON.stringify(publicTargetedRecoverySummary(base)).includes('updated'),false);
assert.equal(JSON.stringify(publicTargetedRecoverySummary(base)).includes('old'),false);
let cases=0;
function denied(label, mutate, code) {
  const obj=fixture(); mutate(obj);
  assert.throws(()=>buildTargetedRecoveryPlan(obj),e=>
    e && e.message==='R4_PLAN_ABORT_'+code,label); cases++;
}
denied('read source drift',f=>{f.sourceStable=false},'UNSTABLE_OR_UNVERIFIED_SNAPSHOT');
denied('mirror drift',f=>{f.mirrorStable=false},'UNSTABLE_OR_UNVERIFIED_SNAPSHOT');
denied('wrong workbook',f=>{f.workbookVerified=false},'UNSTABLE_OR_UNVERIFIED_SNAPSHOT');
denied('only one tab',f=>{f.mirrorTabs.pop()},'MIRROR_TAB_COUNT');
denied('duplicate tab',f=>{f.mirrorTabs[1].sheetName=f.mirrorTabs[0].sheetName},'MIRROR_TAB_IDENTITY');
denied('wrong sheet id',f=>{f.mirrorTabs[1].catalog.sheetId=77},'MIRROR_SCHEMA_DRIFT');
denied('changed headers',f=>{f.mirrorTabs[0].catalog.headers=['other']},'MIRROR_SCHEMA_DRIFT');
denied('column width change',f=>{f.sourceTabs[0].rows[1].values.push('extra')},'SOURCE_ROWS');
denied('out of range mirror row',f=>{f.mirrorTabs[0].rows[1].rowNumber=3},'MIRROR_ROWS');
denied('non-contiguous source rows',f=>{f.sourceTabs[0].rows[1].rowNumber=4},'SOURCE_ROWS');
denied('source row deletion',f=>{f.sourceTabs[0].rows.pop();f.sourceTabs[0].sourceLastRow=2;
  f.mirrorTabs[0].catalog.rowCount=3;f.mirrorTabs[0].catalog.sourceLastRow=3;
  f.mirrorTabs[0].rows.push(row(3,'x'))},'MIRROR_DIMENSIONS');
denied('candidate cap',f=>{f.maxCandidates=3},'CANDIDATE_BUDGET');
denied('payload cap',f=>{f.maxPayloadBytes=80},'PAYLOAD_BUDGET');
denied('untrusted elevated caps',f=>{f.maxCandidates=1000},'CANDIDATE_LIMIT');
denied('missing note',f=>{f.mirrorTabs[1].catalog.note='wrong'},'MIRROR_CATALOG');
console.log('R4 isolated targeted-recovery planner PASS: '+cases+
  ' negative cases, exact two-tab synthetic proposal, no IO/write authorization.');
