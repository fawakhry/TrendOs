// ACC-187 owner decision (2026-10-12): aggregate cash + customer credit,
// including any earlier compensation, should not exceed the ACTUAL AMOUNT
// PAID FOR THE RETURNED ITEMS. An exceptional increase requires a SEPARATE
// management approval. Mandatory legal rights must still be honored.
//
// SOURCE-ONLY REVIEW CONTRACT. DOES NOT authenticate managers, issue any
// refund/store credit, establish return amount allocation from real invoices,
// read D1, access Cloudflare, post ledger entries or create a real liability.
export const ACC187_OWNER_COMPENSATION_AMOUNT_RULE = Object.freeze({
  scope:'ACTUAL_PAID_FOR_RETURNED_ITEMS_LESS_PREVIOUS_CASH_AND_CREDIT',
  normal_rule:'CASH_PLUS_CREDIT_PLUS_PREVIOUS_COMPENSATION_LESS_OR_EQUAL_ACTUAL_PAID_FOR_RETURNED_ITEMS',
  methods:Object.freeze(['CASH_REFUND','CUSTOMER_CREDIT','MIXED_CASH_AND_CREDIT']),
  separate_manager_approval_for_exception:true,
  case_manager_approval_always_required:true,
  partial_payment_invoice_allocation:'NEEDS_SEPARATELY_VERIFIED_SOURCE_EVIDENCE',
  cash_credit_issuance_ledger:'NOT_IMPLEMENTED',
  live_manager_verifier:'NOT_IMPLEMENTED',
  legal_consumer_rights_override:true,
  release_decision:'NO_GO',
  gates:'G1_G2_G3_G4_G5_OPEN',
});

const validId=value=>typeof value==='string' &&
 /^[A-Za-z0-9][A-Za-z0-9_.:-]{3,127}$/.test(value);
const cents=value=>Number.isSafeInteger(value)&&value>=0;
const MAX = Number.MAX_SAFE_INTEGER;
function sortedItems(value){
 if(!Array.isArray(value)||value.length<1||value.length>100||
    value.some(x=>!validId(x)))return null;
 const items=[...value].sort();
 if(new Set(items).size!==items.length)return null;
 return items;
}
const sameItems=(a,b)=>{
 const x=sortedItems(a), y=sortedItems(b);
 return x!==null&&y!==null&&x.length===y.length&&x.every((v,i)=>v===y[i]);
};
function safeSum(...values) {
 if(!values.every(cents)) return null;
 let total=0;
 for(const value of values){
   if(value>MAX-total) return null;
   total+=value;
 }
 return total;
}
const result=(status,details={})=>Object.freeze({
 status,
 business_policy:'ACTUAL_PAID_RETURNED_ITEMS_PREVIOUS_COMPENSATION_DEDUCTED',
 amount_review_matched:false,
 exception_review_matched:false,
 actual_return_approved:false,
 can_pay_cash:false,
 can_post_store_credit:false,
 can_edit_customer_debt:false,
 can_publish:false,
 real_manager_verified:false,
 release_decision:'NO_GO',
 owner_gates:'G1_G2_G3_G4_G5_OPEN',
 ...details,
});

/**
 * Validates owner amount limits using ONLY independently sourced SYNTHETIC
 * case fixtures; does not process or execute a payment. In real code all
 * payment allocations, historical compensations, and manager decisions MUST
 * come from server-side, authenticated, atomic ledger sources. Not implemented.
 */
export function inspectReturnCompensationCap(
 request,
 verifiedPaidAndPriorCompensation=null,
 independentManagerCaseApproval=null,
 independentExceptionalManagerApproval=null
){
 if(!request||typeof request!=='object'||Array.isArray(request))
   return result('STOP_INVALID_REQUEST');
 const {invoiceId,requestId,returnedItemIds,cashCents,storeCreditCents}=request;
 if(!validId(invoiceId)||!validId(requestId)||!sortedItems(returnedItemIds))
   return result('STOP_INVALID_RETURNED_ITEM_CASE');
 const proposed=safeSum(cashCents,storeCreditCents);
 if(proposed===null||proposed===0)
   return result('STOP_UNSAFE_OR_ZERO_SETTLEMENT_MINOR_UNITS');
 const route=cashCents>0&&storeCreditCents>0?'MIXED_CASH_AND_CREDIT':
   cashCents>0?'CASH_REFUND':'CUSTOMER_CREDIT';

 const proof=verifiedPaidAndPriorCompensation;
 if(!proof||typeof proof!=='object'||Array.isArray(proof))
   return result('STOP_MISSING_INDEPENDENT_PAYMENT_HISTORY');
 if(proof.source!=='SYNTHETIC_SERVER_VERIFIED_ITEM_PAYMENTS_AND_HISTORY'||
    proof.verified!==true||!validId(proof.proofId))
   return result('STOP_UNVERIFIED_PAYMENT_HISTORY');
 if(proof.invoiceId!==invoiceId||proof.requestId!==requestId||
    !sameItems(proof.returnedItemIds,returnedItemIds))
   return result('STOP_PAYMENT_HISTORY_CASE_MISMATCH');
 if(!cents(proof.actualPaidForReturnedItemsCents)||
    proof.actualPaidForReturnedItemsCents===0||
    !cents(proof.priorCashRefundCents)||!cents(proof.priorStoreCreditCents))
   return result('STOP_UNSAFE_OR_UNPAID_ITEM_HISTORY');
 const prior=safeSum(proof.priorCashRefundCents,proof.priorStoreCreditCents);
 if(prior===null)return result('STOP_HISTORY_AMOUNT_OVERFLOW');
 const paid=proof.actualPaidForReturnedItemsCents;
 const outstanding=Math.max(0,paid-prior);
 const exceeding=proposed>outstanding?proposed-outstanding:0;
 // Do not use invoice total in place of actual allocated payment for items.
 // Need a manager approval for the WHOLE requested amount, not just excess.
 const mgr=independentManagerCaseApproval;
 if(!mgr||typeof mgr!=='object'||Array.isArray(mgr))
   return result('STOP_NO_INDEPENDENT_CASE_MANAGER_APPROVAL');
 if(mgr.source!=='SYNTHETIC_SERVER_VERIFIED_CASE_MANAGER'||
    mgr.verifiedManager!==true||mgr.decision!=='APPROVED'||
    !validId(mgr.approvalId))
   return result('STOP_CASE_MANAGER_APPROVAL_UNVERIFIED');
 if(mgr.invoiceId!==invoiceId||mgr.requestId!==requestId||
    !sameItems(mgr.returnedItemIds,returnedItemIds)||
    mgr.cashCents!==cashCents||mgr.storeCreditCents!==storeCreditCents||
    mgr.route!==route)
   return result('STOP_CASE_MANAGER_APPROVAL_MISMATCH');
 if(exceeding>0){
   const ex=independentExceptionalManagerApproval;
   if(!ex||typeof ex!=='object'||Array.isArray(ex))
     return result('STOP_SEPARATE_EXCEPTION_APPROVAL_REQUIRED');
   if(ex.source!=='SYNTHETIC_SEPARATE_VERIFIED_EXCEPTION_MANAGER'||
      ex.verifiedManager!==true||ex.decision!=='APPROVED_EXCEPTION'||
      !validId(ex.exceptionApprovalId)||!validId(ex.reasonReference)||
      ex.exceptionApprovalId===mgr.approvalId)
     return result('STOP_EXCEPTION_MANAGER_APPROVAL_UNVERIFIED');
   if(ex.invoiceId!==invoiceId||ex.requestId!==requestId||
      !sameItems(ex.returnedItemIds,returnedItemIds)||
      ex.cashCents!==cashCents||ex.storeCreditCents!==storeCreditCents||
      ex.exceptionalAdditionalCents!==exceeding)
     return result('STOP_EXCEPTION_APPROVAL_CASE_OR_AMOUNT_MISMATCH');
 }
 return result('SYNTHETIC_AMOUNT_POLICY_MATCH_ONLY_NO_FINANCIAL_AUTHORITY',{
   amount_review_matched:true,
   exception_review_matched:exceeding>0,
   method:route,
   actualPaidForReturnedItemsCents:paid,
   previouslyCompensatedCents:prior,
   amountRemainingBeforeRequestCents:outstanding,
   proposedTotalCents:proposed,
   excessRequiringDistinctManagementApprovalCents:exceeding,
 });
}
