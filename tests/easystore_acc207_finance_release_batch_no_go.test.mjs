import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {examineAcc207,inspectRepoAcc207,PENDING_APPROVALS} from '../scripts/acc207_finance_release_batch.mjs';
const worker=readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const gate=readFileSync('scripts/acc176_finance_release_readiness.mjs','utf8');
const inspect=(options={})=>examineAcc207({accountingSource:worker,existingFinanceGate:gate,...options});
await test('01 real checked-in accounting worker and historical safe release gate both available',()=>{
  const r=inspectRepoAcc207();
  assert.equal(r.codeInspectionPassed,true,JSON.stringify(r.checks));
  assert.match(r.inspectedWorkerSha256,/^[0-9a-f]{64}$/);
  assert.equal(r.unsupportedReturnPostingFailClosed,true);
  assert.equal(r.refundHandlerComplete,false);
});
await test('02 NO_GO and all five gates OPEN regardless of source-only green result',()=>{
  const r=inspect();
  assert.deepEqual({...r.gates},{G1:'OPEN',G2:'OPEN',G3:'OPEN',G4:'OPEN',G5:'OPEN'});
  assert.equal(r.financeRelease,'NO_GO');
  assert.equal(r.productionDeployApproved,false);
  assert.equal(r.cloudflareMutationAllowed,false);
  assert.equal(r.cashboxWriteAuthorized,false);
  assert.equal(r.customerReturnCashPayoutAuthorized,false);
});
await test('03 one consolidated non-sensitive decision queue, no duplicate gates',()=>{
  const ids=PENDING_APPROVALS.map(x=>x.id);
  assert.deepEqual(ids,['G1','G2','G3','G4','G5','RELEASE']);
  assert.equal(new Set(ids).size,6);
  assert.equal(PENDING_APPROVALS.every(x=>typeof x.ownerInput==='string'&&x.ownerInput.length>25),true);
  assert.equal(inspect().ownerApprovals.every(x=>x.status==='NOT_AUTHENTICATED_IN_THIS_PROCESS'),true);
});
await test('04 untrusted signed claims cannot authorize production money or close any gate',()=>{
  for(const claims of [{approved:true,role:'admin',ownerSignature:'FAKE'},
    {G1:true,G2:true,G3:true,G4:true,G5:true,release:'GO'},
    {identity:'SYNTHETIC',permissions:['ALL'],financeMode:'GENERAL'}]){
    const r=inspect({ownerClaims:claims,liveHealth:{mode:'GENERAL',authoritativeWrites:true}});
    assert.equal(r.untrustedExternalClaimsProvided,true);
    assert.equal(r.untrustedClaimsGrantedRelease,false);
    assert.equal(r.financeRelease,'NO_GO');
    assert.equal(r.ownerSignedProductionRelease,false);
    assert.equal(r.realEmployeeCashTransactionAccepted,false);
  }
});
await test('05 missing native credit preview cannot be misreported as ready',()=>{
  const bad=worker.replace('async function previewCustomerCreditLiabilityAuditV1(','async function removedForTest(');
  assert.equal(examineAcc207({accountingSource:bad,existingFinanceGate:gate}).codeInspectionPassed,false);
});
await test('06 absent native invoice cash review cannot be treated as return readiness',()=>{
  const bad=worker.replace('async function previewNativeInvoiceReturnExposureV1(','async function removedForTest(');
  assert.equal(examineAcc207({accountingSource:bad,existingFinanceGate:gate}).checks.native_invoice_cash_refund_preview_is_readonly,false);
});
await test('07 absent supplier cash SQL fix blocks source gate',()=>{
  const bad=worker.replace("'payment_paid',?,?,-1","'payment_paid',?,-1");
  assert.equal(examineAcc207({accountingSource:bad,existingFinanceGate:gate}).checks.supplier_payment_sql_fix_present,false);
});
await test('08 unpinned/missing prior safe release diagnostic blocks this gate',()=>{
  assert.equal(examineAcc207({accountingSource:worker,existingFinanceGate:'not present'}).codeInspectionPassed,false);
});
await test('09 checked-in source can never authenticate a live backup, SSO, signed openings, or custody',()=>{
  const r=inspect();
  for(const key of ['staffSsoLiveValidated','openingBalancesOwnerSigned','trustworthyProductionBackupRestored','realEmployeeCashTransactionAccepted','exactProdWorkerVersionPinned','customerCashAndDebtProductionProven'])
    assert.equal(r[key],false,key);
  assert.equal(r.handoff,'CHECKED_IN_SOURCE_AND_FAKE_SQLITE_TESTS_ONLY');
});
await test('10 invalid source objects fail closed; no auto optimistic fallback',()=>{
  for(const s of [undefined,'',null,42]){
    assert.throws(()=>examineAcc207({accountingSource:s,existingFinanceGate:gate}),/REQUIRED_SOURCE_MISSING/);
  }
});
console.log('ACC207_FINANCE_RELEASE_CONSOLIDATED_DECISION_BATCH=TESTED');
console.log('ACC207_CLAIMED_SIGNOFF_NEVER_AUTO_AUTHORIZED=PASS');
console.log('ACC207_FINANCE_RELEASE=NO_GO');
