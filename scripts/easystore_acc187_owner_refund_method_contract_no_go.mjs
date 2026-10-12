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
  'REFUND_ELIGIBILITY_AND_EVIDENCE',
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
