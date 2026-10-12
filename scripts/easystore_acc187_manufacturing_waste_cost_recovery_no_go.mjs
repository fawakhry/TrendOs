// ACC187 sixth owner decision (2026-10-12).
// Returned damaged finished goods must be written off at independently VERIFIED
// ACTUAL MANUFACTURING COST, NOT at sale price. Supplier/responsible-party
// compensation is a SEPARATE recovery transaction subject to case management
// approval. No automatic offset / netting of recorded gross waste cost.
//
// SOURCE-ONLY pure inspection; NO real inventory, production D1, customer funds,
// supplier funds, worker handler, receipt, journal, user grant or live canary.
// All test proofs of real cost and approvers are SYNTHETIC and are not authentication.
import {inspectReturnedItemDisposition} from './easystore_acc187_returned_product_inspection_waste_no_go.mjs';

export const ACC187_OWNER_WASTE_VALUATION_RECOVERY_RULE=Object.freeze({
  effective_owner_choice:'DAMAGED_RETURN_AT_ACTUAL_MANUFACTURING_COST',
  forbidden_valuation:'CUSTOMER_SALE_PRICE',
  manufacturing_cost_evidence:'INDEPENDENT_ITEM_AND_QUANTITY_COST_TRACE_REQUIRED',
  recovery_sources:Object.freeze(['SUPPLIER','RESPONSIBLE_PARTY']),
  recovery_requires_per_case_management_approval:true,
  gross_waste_recorded_separately_from_recovery:true,
  automatic_netting_or_reduction_of_original_waste:false,
  automatic_recovery_on_waste_record:false,
  real_manufacturing_cost_allocator:'NOT_IMPLEMENTED',
  real_finished_goods_waste_handler:'NOT_IMPLEMENTED',
  real_recovery_and_manager_verification:'NOT_IMPLEMENTED',
  real_financial_authority:false,
  release_decision:'NO_GO',
});
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,127}$/.test(x);
const cents=x=>Number.isSafeInteger(x)&&x>=0;
const stop=(status,fields={})=>Object.freeze({
  status,
  waste_valuation_source:'ACTUAL_MANUFACTURING_COST_NOT_SELLING_PRICE',
  gross_waste_ledger_posted:false,
  physical_finished_goods_waste_posted:false,
  cash_or_bank_recovery_posted:false,
  supplier_debt_modified:false,
  customer_refund_or_credit_posted:false,
  real_management_approval_verified:false,
  real_financial_release:false,
  release_decision:'NO_GO',
  owner_gates:'G1_G2_G3_G4_G5_OPEN',
  ...fields,
});

/**
 * Returned finished goods must already be confirmed DAMAGED under
 * independently verified physical receipt + quality inspection. The separate
 * cost proof is not taken from a client-entered sale price, and is bound to
 * invoice/return/item/quantity and exact independent inspection.
 */
export function inspectReturnedWasteManufacturingCost(
  request,physicalReceipt=null,qualityInspection=null,verifiedManufacturingCost=null
) {
  const disposition=inspectReturnedItemDisposition(request,physicalReceipt,qualityInspection);
  if(disposition.status!=='SYNTHETIC_DAMAGED_ITEM_WASTE_RECORD_REQUIRED')
    return stop('STOP_RETURN_NOT_INDEPENDENTLY_INSPECTED_DAMAGED');
  if(!verifiedManufacturingCost||typeof verifiedManufacturingCost!=='object'||
     Array.isArray(verifiedManufacturingCost))
    return stop('STOP_MISSING_INDEPENDENT_ACTUAL_MANUFACTURING_COST');
  const q=verifiedManufacturingCost;
  if(q.source!=='SYNTHETIC_VERIFIED_FINISHED_GOODS_MANUFACTURING_COST'||
     q.verified!==true||!validId(q.costEvidenceId)||
     !cents(q.actualManufacturingCostCents)||q.actualManufacturingCostCents===0)
    return stop('STOP_UNVERIFIED_OR_INVALID_MANUFACTURING_COST');
  if(q.invoiceId!==request.invoiceId||
     q.returnRequestId!==request.returnRequestId||
     q.itemId!==request.itemId||
     q.returnedUnits!==request.returnedUnits||
     q.inspectionId!==qualityInspection.inspectionId||
     q.physicalReceiptId!==physicalReceipt.receiptId)
    return stop('STOP_MANUFACTURING_COST_EVIDENCE_CASE_MISMATCH');
  // q.salePriceCents and request.salePriceCents are intentionally NEVER used
  // as cost or financial entitlement.
  return stop('SYNTHETIC_GROSS_WASTE_AT_VERIFIED_MANUFACTURING_COST_REVIEW_ONLY',{
    hypothetical_gross_waste_cost_cents:q.actualManufacturingCostCents,
    cost_evidence_id:q.costEvidenceId,
    invoice_id:request.invoiceId,
    return_request_id:request.returnRequestId,
    item_id:request.itemId,
    returned_units:request.returnedUnits,
    suggested_disposition:'WASTE_ONLY',
    sales_price_used_as_cost:false,
    recovery_netted_into_gross_waste:false,
  });
}

/** Recovery must be recorded as a SEPARATE document/ledger after distinct
 * authenticated management approval in a future implementation. Here both
 * third-party recovery evidence and management decisions are fake fixtures.
 * No implied ceiling for extraordinary third-party recoveries is invented.
 */
export function inspectSeparateApprovedWasteRecovery(
  request,approvedWasteCostReview=null,independentRecoveryEvidence=null,
  independentManagerRecoveryApproval=null
) {
  if(!request||typeof request!=='object'||Array.isArray(request)||
     !validId(request.invoiceId)||!validId(request.returnRequestId)||
     !validId(request.itemId)||!validId(request.recoveryId))
    return stop('STOP_INVALID_RECOVERY_CASE');
  if(!approvedWasteCostReview||
     approvedWasteCostReview.status!=='SYNTHETIC_GROSS_WASTE_AT_VERIFIED_MANUFACTURING_COST_REVIEW_ONLY'||
     !validId(approvedWasteCostReview.cost_evidence_id)||
     approvedWasteCostReview.invoice_id!==request.invoiceId||
     approvedWasteCostReview.return_request_id!==request.returnRequestId||
     approvedWasteCostReview.item_id!==request.itemId)
    return stop('STOP_NO_VERIFIED_WASTE_COST_REVIEW');
  if(!['SUPPLIER','RESPONSIBLE_PARTY'].includes(request.recoveryPartyType)||
     !validId(request.recoveryPartyId)||!cents(request.recoveryCents)||
     request.recoveryCents===0)
    return stop('STOP_INVALID_RECOVERY_PARTY_OR_AMOUNT');
  const e=independentRecoveryEvidence;
  if(!e||typeof e!=='object'||Array.isArray(e)||
     e.source!=='SYNTHETIC_VERIFIED_INDEPENDENT_THIRD_PARTY_RECOVERY'||
     e.verified!==true||!validId(e.recoveryEvidenceId))
    return stop('STOP_MISSING_OR_UNVERIFIED_RECOVERY_EVIDENCE');
  for(const field of ['invoiceId','returnRequestId','itemId','recoveryId','recoveryPartyType','recoveryPartyId','recoveryCents']){
    if(e[field]!==request[field])
      return stop('STOP_RECOVERY_EVIDENCE_CASE_MISMATCH');
  }
  if(e.costEvidenceId!==approvedWasteCostReview.cost_evidence_id)
    return stop('STOP_RECOVERY_EVIDENCE_WRONG_GROSS_WASTE');
  const m=independentManagerRecoveryApproval;
  if(!m||typeof m!=='object'||Array.isArray(m)||
     m.source!=='SYNTHETIC_VERIFIED_MANAGER_SEPARATE_WASTE_RECOVERY'||
     m.verifiedManager!==true||m.decision!=='APPROVED_RECOVERY'||
     !validId(m.approvalId)||m.approvalId===e.recoveryEvidenceId)
    return stop('STOP_NO_SEPARATE_MANAGER_RECOVERY_APPROVAL');
  for(const field of ['invoiceId','returnRequestId','itemId','recoveryId','recoveryPartyType','recoveryPartyId','recoveryCents']){
    if(m[field]!==request[field])
      return stop('STOP_RECOVERY_MANAGER_CASE_MISMATCH');
  }
  if(m.costEvidenceId!==approvedWasteCostReview.cost_evidence_id||
     m.recoveryEvidenceId!==e.recoveryEvidenceId)
    return stop('STOP_RECOVERY_APPROVAL_NOT_BOUND_TO_EVIDENCE');
  return stop('SYNTHETIC_SEPARATE_MANAGEMENT_APPROVED_RECOVERY_REVIEW_ONLY',{
    hypothetical_separately_recoverable_cents:request.recoveryCents,
    cost_evidence_id:approvedWasteCostReview.cost_evidence_id,
    recovery_evidence_id:e.recoveryEvidenceId,
    manager_approval_reference:m.approvalId,
    gross_waste_cost_remaining_unchanged_cents:
      approvedWasteCostReview.hypothetical_gross_waste_cost_cents,
    gross_waste_netted:false,
  });
}
