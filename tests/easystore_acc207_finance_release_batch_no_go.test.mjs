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
await test('11 delegated restricted phase-1 scope is defined, but approval gates not signed',()=>{
  const d=inspectRepoAcc207();
  assert.equal(d.delegatedSafePhase1Scope,'CASH_SALES_AND_CUSTOMER_COLLECTIONS_ONLY');
  assert.equal(d.phase1ScopeIsBusinessSelectionNotFinancialRelease,true);
  assert.equal(d.refundsStockCreditAndSupplierMutationsPhase1Allowed,false);
  assert.equal(d.employeeFinanceGrantsAuthenticated,false);
  assert.equal(d.ownerOpeningBalancesReconciled,false);
  assert.equal(d.codeInspectionPassed,true,JSON.stringify(d.checks));
  assert.equal(d.financeRelease,'NO_GO');
  assert.equal(d.productionDeployApproved,false);
});
await test('12 a source missing ACC211 extra guard cannot pass delegated phase1 source checks',()=>{
  const modified=worker.replace('function acc211Phase1WriteRejectionV1(','function removedACC211ForTest(');
  const result=examineAcc207({accountingSource:modified,existingFinanceGate:gate});
  assert.equal(result.checks.acc211_restricted_scope_is_optional_and_safe,false);
  assert.equal(result.codeInspectionPassed,false);
  assert.equal(result.financeRelease,'NO_GO');
});
await test('13 owner October 20 is TARGET, no signed real zero opening assumed',()=>{
  const a=inspectRepoAcc207();
  assert.equal(a.ownerTargetCutoverDate,'2026-10-20');
  assert.equal(a.zeroOpeningIsConditionalOnIndependentlyVerifiedSources,true);
  assert.equal(a.physicalPriorBalancesProvenZero,false);
  assert.equal(a.authenticatedEmployeeSSORosterMapped,false);
  assert.equal(a.realSeparateEncryptedBackupAndUbuntuRestoreVerified,false);
  assert.equal(a.restrictedFirstPilot,'PRIVATE_ALL_SYNTHETIC');
  assert.equal(a.closedDayCorrectionPolicy,'NEW_IMMUTABLE_ENTRY_ON_OPEN_DAY_ONLY');
  assert.equal(a.gates.G3,'OPEN');assert.equal(a.gates.G5,'OPEN');
  assert.equal(a.financeRelease,'NO_GO');
});
await test('14 removing two-signature zero evidence gate is never readiness PASS',()=>{
  const mutilated=worker.replace('async function acc212VerifyOpeningZeroEvidenceV1(',
    'async function disabledOpeningVerifier(');
  const a=examineAcc207({accountingSource:mutilated,existingFinanceGate:gate});
  assert.equal(a.checks.acc212_conditional_zero_opening_requires_two_signatures,false);
  assert.equal(a.codeInspectionPassed,false);
  assert.equal(a.productionDeployApproved,false);
});
console.log('ACC207_FINANCE_RELEASE_CONSOLIDATED_DECISION_BATCH=TESTED');
console.log('ACC207_CLAIMED_SIGNOFF_NEVER_AUTO_AUTHORIZED=PASS');
console.log('ACC207_FINANCE_RELEASE=NO_GO');
