// ACC-187 OWNER METHOD DECISION: SOURCE-ONLY contract; no finance or D1 authority.
// Owner statement (2026-10-12): "نسمح بالاختيارين حسب موافقة الإدارة"
// Both cash reimbursement and customer store-credit are business-policy choices,
// but distinct management approval is required FOR EACH CASE and METHOD.
// DO NOT use as a posting handler: amount, inventory, close and staff
// authority semantics remain UNRESOLVED. No request here changes a database.
export const ACC187_OWNER_METHOD_DECISION = Object.freeze({
  decision_date: '2026-10-12',
  decision_scope: 'REFUND_SETTLEMENT_METHOD_ONLY',
  cash_refund: 'PERMITTED_SUBJECT_TO_CASE_SPECIFIC_MANAGEMENT_APPROVAL',
  customer_credit: 'PERMITTED_SUBJECT_TO_CASE_SPECIFIC_MANAGEMENT_APPROVAL',
  both_without_approval: false,
  refund_handler_implemented: false,
  can_post_money: false,
  can_credit_customer_account: false,
  owner_cutover_approval: false,
  release_decision: 'NO_GO',
  gates: Object.freeze(['OPEN','OPEN','OPEN','OPEN','OPEN']),
});
const METHODS = new Set(['CASH_REFUND','CUSTOMER_CREDIT']);
const UNDECIDED = Object.freeze([
  'OTHER_PRODUCT_ELIGIBILITY_AND_REMAINING_EVIDENCE_RULES',
  'AMOUNT_CAP_AND_PREVIOUS_REFUNDS',
  'PAYOUT_CHANNEL_AND_CASHBOX_PROOF',
  'STOCK_INSPECTION_RESTOCK_COST_AND_WASTE',
  'CLOSED_DAY_AND_DISPUTE_COMPENSATING_ENTRIES',
  'REAL_MANAGER_IDENTITY_AND_ROLE_VERIFIER',
  'REAL_TRANSACTION_ATOMICITY_AND_IDEMPOTENCY',
  'SEPARATE_LIVE_FINANCE_RELEASE_APPROVAL',
]);

function caseId(v) {
  return typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{3,127}$/.test(v);
}
function exactAmount(v) {
  // Source-only case binding: NOT the actual legally payable refund cap.
  return typeof v === 'number' && Number.isFinite(v) && v > 0 && Number.isSafeInteger(v * 100);
}

/**
 * Reviews whether a request matches an independently supplied, fictitious
 * server-side management approval record. It NEVER authorizes posting.
 *
 * approvalFromTrustedVerifier must NOT be copied from the client request.
 * This method DOES NOT authenticate managers; real server verification is absent.
 * The synthetic test harness creates this distinct record only as fake data.
 */
export function inspectRefundMethodProposal(clientRequest, approvalFromTrustedVerifier = null) {
  const result = (status, matched = false) => Object.freeze({
    status, management_approval_record_matches: matched,
    refund_method_owner_policy: 'CASH_OR_CREDIT_WITH_CASE_MANAGEMENT_APPROVAL',
    can_post_money: false, can_credit_customer_account: false,
    authorized_to_deploy: false, release_decision: 'NO_GO',
    owner_gates: 'G1_G2_G3_G4_G5_OPEN', unresolved_requirements: UNDECIDED,
  });
  if (!clientRequest || typeof clientRequest !== 'object' || Array.isArray(clientRequest)) {
    return result('REJECT_INVALID_REQUEST');
  }
  const {refundMethod, invoiceId, requestId, amount} = clientRequest;
  if (!METHODS.has(refundMethod)) return result('REJECT_UNAUTHORIZED_METHOD');
  if (!caseId(invoiceId) || !caseId(requestId) || !exactAmount(amount)) {
    return result('REJECT_INCOMPLETE_CASE_BINDING');
  }
  if (!approvalFromTrustedVerifier || typeof approvalFromTrustedVerifier !== 'object' ||
      Array.isArray(approvalFromTrustedVerifier)) {
    return result('STOP_NO_INDEPENDENT_MANAGEMENT_APPROVAL');
  }
  const a=approvalFromTrustedVerifier;
  // Client fields role:"admin", approved:true, managementApproval:{...}
  // are deliberately ignored as authorization.
  if (a.source !== 'SYNTHETIC_BACKEND_VERIFIED_MANAGER' ||
      a.verifiedManager !== true || a.decision !== 'APPROVED' ||
      !caseId(a.approvalId)) {
    return result('STOP_MANAGEMENT_APPROVAL_UNVERIFIED');
  }
  if (a.invoiceId !== invoiceId || a.requestId !== requestId ||
      a.refundMethod !== refundMethod || a.amount !== amount) {
    return result('STOP_APPROVAL_CASE_OR_METHOD_MISMATCH');
  }
  return result('METHOD_APPROVAL_MATCHES_FAKE_VERIFIER_BUT_POSTING_BLOCKED', true);
}


// Owner eligibility decision (2026-10-12): customized items bearing the
// customer's NAME or PHOTO may be returned ONLY for a verified manufacturing
// defect or an error attributable to Trend Mall. No other grounds are approved.
// This is conditional eligibility FOR REVIEW, not a confirmed refund right,
// approval of any amount, stock receipt, or a real financial operation.
export const ACC187_PERSONALIZED_RETURN_ELIGIBILITY_DECISION = Object.freeze({
  personalized_categories: Object.freeze(['CUSTOMER_NAME','CUSTOMER_PHOTO','CUSTOMER_NAME_AND_PHOTO']),
  exception_reasons: Object.freeze(['MANUFACTURING_DEFECT','TREND_MALL_ERROR']),
  change_of_mind_allowed: false,
  customer_supplied_error_alone_allowed: false,
  independent_evidence_verification_required: true,
  management_approval_per_case_still_required: true,
  other_product_eligibility: 'NOT_YET_DECIDED',
  full_return_process_enabled: false,
  release_decision: 'NO_GO',
});
const PERSONALIZED = new Set(ACC187_PERSONALIZED_RETURN_ELIGIBILITY_DECISION.personalized_categories);
const EXCEPTIONS = new Set(ACC187_PERSONALIZED_RETURN_ELIGIBILITY_DECISION.exception_reasons);

/** Only independent, synthetic review evidence can qualify a personalized item
 * for managerial REVIEW. Client-supplied claims/booleans never suffice.
 * Actual employee authentication, proof verification and refund posting are NOT
 * implemented or authorized by this deliberately non-executable code.
 */
export function inspectPersonalizedReturnEligibility(request, independentlyVerifiedEvidence=null) {
  const result = (status, exceptionConditionMatched=false) => Object.freeze({
    status,
    synthetic_exception_condition_matched: exceptionConditionMatched,
    eligible_for_management_review_only: exceptionConditionMatched,
    actual_return_approved: false,
    refund_authorized: false,
    customer_credit_authorized: false,
    financial_posting_allowed: false,
    release_decision: 'NO_GO',
    owner_gates: 'G1_G2_G3_G4_G5_OPEN',
  });
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    return result('REJECT_INVALID_RETURN_CASE');
  }
  const {invoiceId,requestId,itemId,personalizationType,reason}=request;
  if (!caseId(invoiceId) || !caseId(requestId) || !caseId(itemId)) {
    return result('REJECT_INCOMPLETE_RETURN_CASE');
  }
  if (!PERSONALIZED.has(personalizationType)) {
    return result('STOP_OUTSIDE_DECIDED_PERSONALIZED_SCOPE');
  }
  if (!EXCEPTIONS.has(reason)) {
    return result('REJECT_PERSONALIZED_RETURN_WITHOUT_ALLOWED_EXCEPTION');
  }
  const e=independentlyVerifiedEvidence;
  if (!e || typeof e !== 'object' || Array.isArray(e)) {
    return result('STOP_CLAIMED_EXCEPTION_NOT_INDEPENDENTLY_VERIFIED');
  }
  // An approval object placed in request.evidence/approved/role is ignored.
  if (e.source !== 'SYNTHETIC_INDEPENDENT_QUALITY_REVIEW' ||
      e.verified !== true || e.decision !== 'EXCEPTION_CONFIRMED' ||
      !caseId(e.evidenceRef)) {
    return result('STOP_UNVERIFIED_RETURN_EVIDENCE');
  }
  if (e.invoiceId !== invoiceId || e.requestId !== requestId ||
      e.itemId !== itemId || e.personalizationType !== personalizationType ||
      e.reason !== reason) {
    return result('STOP_RETURN_EVIDENCE_CASE_MISMATCH');
  }
  return result('EXCEPTION_MATCHED_IN_FAKE_REVIEW_ONLY',true);
}

/**
 * Both conditions are mandatory: an independently checked EXCEPTION for a
 * named/photo item, and a separately verified management choice of settlement
 * method FOR THE SAME item/invoice/request/amount. Even when both synthetic
 * records match this function never authorizes a payout or real credit.
 */
export function inspectPersonalizedSettlementProposal(request, verifiedEvidence=null, managerRecord=null) {
  const eligibility=inspectPersonalizedReturnEligibility(request,verifiedEvidence);
  const result=(status,method=null)=>Object.freeze({
    status,
    exception_review: eligibility,
    method_review:method,
    financial_posting_allowed:false,
    customer_credit_posting_allowed:false,
    return_approved:false,
    release_decision:'NO_GO',
    owner_gates:'G1_G2_G3_G4_G5_OPEN',
  });
  if (!eligibility.synthetic_exception_condition_matched) {
    return result('STOP_PERSONALIZED_ELIGIBILITY');
  }
  // Existing management inspector binds method/invoice/request/amount.
  // The following adds the exact item to the approval binding as well.
  if (managerRecord?.itemId !== request.itemId) {
    return result('STOP_MANAGER_APPROVAL_ITEM_MISMATCH');
  }
  const method=inspectRefundMethodProposal(request,managerRecord);
  if (!method.management_approval_record_matches) {
    return result('STOP_MANAGEMENT_SETTLEMENT_APPROVAL',method);
  }
  return result('SYNTHETIC_EXCEPTION_AND_MANAGER_METHOD_MATCH_BUT_NO_POSTING',method);
}
