// ACC207: one-batch accounting release handoff; OFFLINE code-inspection only.
// It neither checks authentic operator signatures nor decides financial GO.
// All owner approvals, production backup, real staff & cashbox acceptance
// remain external to this source-only implementation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const keyCheck=(x)=>typeof x==='string'&&x.length>0;
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const sha=(s)=>crypto.createHash('sha256').update(s).digest('hex');
export const PENDING_APPROVALS=Object.freeze([
  Object.freeze({id:'G1',topic:'AUTHENTIC_ONE_COMMAND_CUSTODY_WITH_RECEIPT',ownerInput:'Approve authenticated live cashier/custody operator and a controlled zero-balance handoff; genuine provider result required.'}),
  Object.freeze({id:'G2',topic:'EXACT_VERIFIED_EMPLOYEE_FINANCE_GRANTS',ownerInput:'Privately sign the real verified login-to-finance-mode permission matrix; no public credentials or user IDs.'}),
  Object.freeze({id:'G3',topic:'OPENING_CUTOVER_DATE_AND_BALANCES',ownerInput:'Confirm initial finance cutover, exact opening customer/supplier/cash/stock totals and two-person reconciliation.'}),
  Object.freeze({id:'G4',topic:'ACTUAL_REFUNDS_AND_WHOLE_FINANCE_FLOW',ownerInput:'Approve unresolved return allocations, post-close treatment, case authorizers, overhead drivers/rates and bounded first-live finance transaction acceptance.'}),
  Object.freeze({id:'G5',topic:'REAL_BACKUP_ISOLATED_RESTORE_ROLLBACK',ownerInput:'Authorize secure production backup to private storage, isolated restore and exact Worker version rollback drill.'}),
  Object.freeze({id:'RELEASE',topic:'PINNED_MERGE_DEPLOY_APPROVAL',ownerInput:'Explicitly approve the exact release SHA/artifact, maintenance window, rollback operator and production finance scope after G1–G5.'})
]);
export function examineAcc207({accountingSource,existingFinanceGate,ownerClaims,liveHealth}={}){
  if(!keyCheck(accountingSource)||!keyCheck(existingFinanceGate))
    throw Error('ACC207_REQUIRED_SOURCE_MISSING');
  const checks={
    accounting_worker_source_visible:accountingSource.includes('async function handleEmployeeAccountingNativeRequest'),
    finance_roles_have_strict_opt_in:accountingSource.includes('function approvedAccountingModeV1(env,verifiedUsername,user)'),
    default_finance_modes_are_guarded:accountingSource.includes("if(c.mode==='READONLY'&&!READ_ACTIONS.has(action)")&&accountingSource.includes("if(c.mode==='OFF')"),
    customer_credit_liability_is_readonly:accountingSource.includes("async function previewCustomerCreditLiabilityAuditV1(")&&accountingSource.includes("'previewCustomerCreditLiabilityAuditV1'"),
    native_invoice_cash_refund_preview_is_readonly:accountingSource.includes('async function previewNativeInvoiceReturnExposureV1(')&&accountingSource.includes("'previewNativeInvoiceReturnExposureV1'"),
    supplier_payment_sql_fix_present:accountingSource.includes("'payment_paid',?,?,-1"),
    custody_handoff_sql_fix_present:accountingSource.includes("VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?)"),
    legacy_deploy_readiness_never_auto_go:existingFinanceGate.includes("release_decision:'NO_GO'"),
    acc211_restricted_scope_is_optional_and_safe:accountingSource.includes('function acc211Phase1WriteRejectionV1(')&&
      accountingSource.includes("acc211-owner-grants-required")&&
      accountingSource.includes("acc211-credit-flow-off-required")&&
      accountingSource.includes("acc211-phase1-action-denied"),
    owner_approval_not_inferred_from_source:true
  };
  const cannotPostReturns=!accountingSource.includes("else if(action==='refundEasyStoreSaleV2')")
    &&!accountingSource.includes("else if(action==='returnEasyStoreSaleV2'");
  const submitted=ownerClaims!==undefined&&ownerClaims!==null||
    liveHealth!==undefined&&liveHealth!==null;
  // Caller-provided claims/health cannot themselves prove authentic release
  // signatures, custody, production backup or irreversible financial writes.
  return Object.freeze({
    schema:'ACC207_ONE_BATCH_FINANCE_RELEASE_EVIDENCE_V1',
    delegatedSafePhase1Scope:'CASH_SALES_AND_CUSTOMER_COLLECTIONS_ONLY',
    phase1ScopeIsBusinessSelectionNotFinancialRelease:true,
    refundsStockCreditAndSupplierMutationsPhase1Allowed:false,
    employeeFinanceGrantsAuthenticated:false,
    ownerOpeningBalancesReconciled:false,
    inspectedWorkerSha256:sha(accountingSource),
    codeInspectionPassed:Object.values(checks).every(Boolean),
    checks:Object.freeze(checks),
    unsupportedReturnPostingFailClosed:cannotPostReturns,
    refundHandlerComplete:false,
    customerCashAndDebtProductionProven:false,
    staffSsoLiveValidated:false,
    openingBalancesOwnerSigned:false,
    trustworthyProductionBackupRestored:false,
    realEmployeeCashTransactionAccepted:false,
    exactProdWorkerVersionPinned:false,
    ownerSignedProductionRelease:false,
    untrustedExternalClaimsProvided:submitted,
    untrustedClaimsGrantedRelease:false,
    ownerApprovals:Object.freeze(PENDING_APPROVALS.map(x=>Object.freeze({...x,status:'NOT_AUTHENTICATED_IN_THIS_PROCESS'}))),
    gates:Object.freeze({G1:'OPEN',G2:'OPEN',G3:'OPEN',G4:'OPEN',G5:'OPEN'}),
    financeRelease:'NO_GO',
    productionDeployApproved:false,
    cloudflareMutationAllowed:false,
    cashboxWriteAuthorized:false,
    customerReturnCashPayoutAuthorized:false,
    handoff:'CHECKED_IN_SOURCE_AND_FAKE_SQLITE_TESTS_ONLY'
  });
}
export function inspectRepoAcc207({ownerClaims,liveHealth}={}){
  return examineAcc207({
    accountingSource:read('cloudflare-d1/src/employee-accounting-native-v1.mjs'),
    existingFinanceGate:read('scripts/acc176_finance_release_readiness.mjs'),
    ownerClaims,liveHealth
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2);
    if(args.length!==2||args[0]!=='--out')throw Error('USAGE: node scripts/acc207_finance_release_batch.mjs --out <local-json>');
    const out=path.resolve(args[1]);
    const data=inspectRepoAcc207();
    fs.mkdirSync(path.dirname(out),{recursive:true});
    fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n','utf8');
    console.log('ACC207_SOURCE_INSPECTION='+(data.codeInspectionPassed?'PASS':'FAIL'));
    console.log('ACC207_GATES=G1_OPEN,G2_OPEN,G3_OPEN,G4_OPEN,G5_OPEN');
    console.log('ACC207_FINANCE_RELEASE=NO_GO');
    console.log('ACC207_PRODUCTION_MUTATIONS=ZERO');
    if(!data.codeInspectionPassed)process.exitCode=1;
  }catch(err){console.error('ACC207_FAIL_CLOSED='+String(err.message));process.exitCode=1}
}
