// ACC-187: 2026-10-12 owner decision "تترك المدة حسب تقدير الإدارة لكل حالة".
// No arbitrary 7/14-day acceptance or automatic expiry is authorized.
// Management must review each case independently; applicable consumer law
// and mandatory customer rights take precedence over internal discretion.
// All code here is PURE, source-only, synthetic and NEVER posts finances.
import { inspectPersonalizedSettlementProposal } from './easystore_acc187_owner_refund_method_contract_no_go.mjs';

export const ACC187_RETURN_TIME_OWNER_DECISION = Object.freeze({
  as_of:'2026-10-12',
  policy:'CASE_BY_CASE_MANAGEMENT_TIMING_REVIEW',
  fixed_days:null,
  auto_expiry:false,
  automatic_time_approval:false,
  statutory_rights_override:true,
  requires_independent_per_case_management_review:true,
  real_verifier_implemented:false,
  can_refund:false,
  can_credit:false,
  release_decision:'NO_GO',
  gates:'G1_G2_G3_G4_G5_OPEN',
});
const safeId = value => typeof value==='string' &&
  /^[A-Za-z0-9][A-Za-z0-9_.:-]{3,127}$/.test(value);
const strictIsoUtc = value => {
  if(typeof value!=='string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};
const decision = (status, timeApprovedForReview=false) => Object.freeze({
  status,
  management_timing_review_matched: timeApprovedForReview,
  return_approved:false,
  cash_refund_allowed:false,
  customer_credit_allowed:false,
  inventory_restored:false,
  financial_posting_allowed:false,
  real_manager_verified:false,
  release_decision:'NO_GO',
  owner_gates:'G1_G2_G3_G4_G5_OPEN',
});

/**
 * Review a return's timing only. The date itself is NEVER used to approve or
 * reject eligibility; there is NO fixed-day threshold.
 *
 * independentlyVerifiedManagementDecision is a SYNTHETIC fixture of a separate
 * verifier result. This function DOES NOT authenticate staff or approve refunds.
 * Real management decisions and any consumer-law constraints are NOT implemented.
 */
export function inspectReturnTimingDecision(request, independentlyVerifiedManagementDecision=null) {
  if(!request || typeof request!=='object' || Array.isArray(request)) {
    return decision('STOP_MISSING_RETURN_CASE');
  }
  const {invoiceId,requestId,itemId,submittedAt}=request;
  if(!safeId(invoiceId) || !safeId(requestId) || !safeId(itemId) || !strictIsoUtc(submittedAt)) {
    return decision('STOP_INCOMPLETE_RETURN_TIMING_RECORD');
  }
  const review=independentlyVerifiedManagementDecision;
  // Do not accept request.role / request.approved / request.managementDecision.
  if(!review || typeof review!=='object' || Array.isArray(review)) {
    return decision('STOP_NO_INDEPENDENT_MANAGEMENT_TIMING_REVIEW');
  }
  if(review.source!=='SYNTHETIC_INDEPENDENT_MANAGEMENT_TIMING_REVIEW' ||
     review.verifiedManager!==true || !safeId(review.reviewId) ||
     !['ALLOW_TIMING_REVIEW','DENY_TIMING_REVIEW'].includes(review.decision)) {
    return decision('STOP_MANAGEMENT_TIMING_REVIEW_UNVERIFIED');
  }
  if(review.invoiceId!==invoiceId || review.requestId!==requestId ||
     review.itemId!==itemId || review.submittedAt!==submittedAt) {
    return decision('STOP_TIMING_APPROVAL_CASE_BINDING_MISMATCH');
  }
  if(review.decision==='DENY_TIMING_REVIEW') {
    return decision('STOP_MANAGEMENT_TIMING_REVIEW_DECLINED');
  }
  return decision('FAKE_TIMING_REVIEW_MATCHED_NOT_A_RETURN_APPROVAL',true);
}

/** No personal-product case can even be considered ready for managerial
 * review without a distinct synthetic timing approval AND the separate
 * synthetic product-defect evidence and method-choice management review.
 * Even with all three fake fixtures matched, there is NEVER posting authority.
 */
export function inspectPersonalizedReturnWithTiming(request,evidence=null,methodReview=null,timingReview=null) {
  const timing=inspectReturnTimingDecision(request,timingReview);
  const result=(status,settlement=null)=>Object.freeze({
    status, timing_review:timing, settlement_review:settlement,
    return_approved:false,
    refund_authorized:false,
    customer_credit_authorized:false,
    financial_posting_allowed:false,
    release_decision:'NO_GO',
    owner_gates:'G1_G2_G3_G4_G5_OPEN',
  });
  if(!timing.management_timing_review_matched) {
    return result('STOP_TIMING_REVIEW_NOT_APPROVED');
  }
  const settlement=inspectPersonalizedSettlementProposal(request,evidence,methodReview);
  if(settlement.status!=='SYNTHETIC_EXCEPTION_AND_MANAGER_METHOD_MATCH_BUT_NO_POSTING') {
    return result('STOP_OTHER_RETURN_PREREQUISITE',settlement);
  }
  return result('ALL_FAKE_REVIEW_PREREQUISITES_MATCHED_NO_REAL_RETURN_NO_POSTING',settlement);
}
