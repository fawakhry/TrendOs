// ACC187 owner inventory decision, 2026-10-12:
// A customer-returned product NEVER re-enters saleable inventory unless a
// separate, independently verified inspection establishes it is fit for sale.
// If damaged, it must be recorded as WASTE rather than restocked.
//
// REVIEW-ONLY CONTRACT. Inspection proofs below are FAKE; the actual Worker
// inventory, restocking, waste ledger, costing and manager verifier are not
// implemented for returned finished goods. This does NOT grant any D1, cash,
// employee, production or printshop authority. G1-G5 remain OPEN / NO_GO.
export const ACC187_OWNER_RETURN_INVENTORY_DECISION = Object.freeze({
  rule:'PHYSICALLY_RETURNED_GOODS_QUARANTINED_UNTIL_INDEPENDENT_INSPECTION',
  saleable_restocks:'ONLY_AFTER_VERIFIED_FIT_FOR_RESALE',
  damaged_returns:'WASTE_NOT_AVAILABLE_STOCK',
  pending_inspection:'NEVER_SALEABLE',
  compensation_does_not_trigger_restock:true,
  real_return_inventory_handler:'NOT_IMPLEMENTED',
  real_waste_accounting_handler_for_finished_returns:'NOT_IMPLEMENTED',
  requires_separate_management_workflow:true,
  release_decision:'NO_GO',
  gates:'G1_G2_G3_G4_G5_OPEN',
});
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,127}$/.test(x);
const result=(status,finalClassification='QUARANTINE')=>Object.freeze({
 status,
 proposed_classification:finalClassification,
 physical_saleable_stock_changed:false,
 physical_waste_stock_changed:false,
 financial_posting_allowed:false,
 real_restocks_authorized:false,
 real_waste_posting_authorized:false,
 return_approved:false,
 manager_identity_verified:false,
 release_decision:'NO_GO',
 owner_gates:'G1_G2_G3_G4_G5_OPEN',
});

/** Independently documented physical receipt + quality inspection required.
 * Neither can be supplied as client.request.receipt or client.request.checked.
 * This tool does not verify real inspection staff, real goods or cost impact.
 * Separate customer eligibility, managerial return authorization and compensation
 * checks still apply, and are NOT replaced by inspection approval.
 */
export function inspectReturnedItemDisposition(request,physicalReceipt=null,qualityInspection=null){
  if(!request||typeof request!=='object'||Array.isArray(request))
    return result('STOP_INVALID_RETURN_ITEM_REQUEST');
  const {invoiceId,returnRequestId,itemId,returnedUnits}=request;
  if(!validId(invoiceId)||!validId(returnRequestId)||!validId(itemId)||
     !Number.isSafeInteger(returnedUnits)||returnedUnits<1)
    return result('STOP_INVALID_RETURN_ITEM_ID_OR_QUANTITY');
  if(!physicalReceipt||typeof physicalReceipt!=='object'||Array.isArray(physicalReceipt))
    return result('STOP_NO_INDEPENDENT_PHYSICAL_RETURN_RECEIPT');
  const p=physicalReceipt;
  if(p.source!=='SYNTHETIC_VERIFIED_PHYSICAL_RETURN'||
     p.verified!==true||!validId(p.receiptId)||
     p.invoiceId!==invoiceId||p.returnRequestId!==returnRequestId||
     p.itemId!==itemId||p.returnedUnits!==returnedUnits)
    return result('STOP_PHYSICAL_RECEIPT_UNVERIFIED_OR_CASE_MISMATCH');
  if(!qualityInspection||typeof qualityInspection!=='object'||Array.isArray(qualityInspection))
    return result('STOP_PENDING_INDEPENDENT_INSPECTION');
  const q=qualityInspection;
  if(q.source!=='SYNTHETIC_INDEPENDENT_RETURN_QUALITY_INSPECTION'||
     q.verified!==true||!validId(q.inspectionId)||
     q.invoiceId!==invoiceId||q.returnRequestId!==returnRequestId||
     q.itemId!==itemId||q.receiptId!==p.receiptId||
     q.inspectedUnits!==returnedUnits)
    return result('STOP_INSPECTION_UNVERIFIED_OR_CASE_MISMATCH');
  if(q.condition==='DAMAGED'){
    if(!validId(q.damageEvidenceRef)||!validId(q.damageReasonRef))
      return result('STOP_DAMAGED_ITEM_MISSING_WASTE_EVIDENCE');
    return result('SYNTHETIC_DAMAGED_ITEM_WASTE_RECORD_REQUIRED','WASTE_ONLY');
  }
  if(q.condition==='FIT_FOR_RESALE'){
    if(!validId(q.saleabilityEvidenceRef))
      return result('STOP_RESALE_WITHOUT_INSPECTION_EVIDENCE');
    return result('SYNTHETIC_INSPECTED_SALEABLE_RESTOCK_REVIEW_ONLY','INSPECTED_SALEABLE');
  }
  return result('STOP_NO_CONFIRMED_SALEABLE_OR_DAMAGED_CLASSIFICATION');
}
