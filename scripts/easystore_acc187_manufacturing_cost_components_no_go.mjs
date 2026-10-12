// ACC187 SEVENTH owner decision, 2026-10-12:
// verified actual manufacturing cost includes materials + direct labor +
// allocated production overhead for the returned DAMAGED item/quantity.
// Selling price, refund entitlement and supplier recovery are NEVER cost inputs.
// This is a PURE, source-only verification sketch using SYNTHETIC evidence.
//
// The owner DID NOT yet select how to allocate production overhead/labor,
// what belongs to overhead, or how multi-batch costs are sourced. A reference
// to independent allocation evidence is required, not proof that the method
// is approved. No actual cost allocator, accounting writes, D1 or production.
import {inspectReturnedWasteManufacturingCost}
 from './easystore_acc187_manufacturing_waste_cost_recovery_no_go.mjs';

export const ACC187_OWNER_FULL_MANUFACTURING_COST_COMPONENTS=Object.freeze({
 cost_basis:'VERIFIED_ACTUAL_MANUFACTURING_COST_RETURNED_DAMAGED_UNITS',
 components:Object.freeze(['MATERIALS','DIRECT_LABOR','ALLOCATED_PRODUCTION_OVERHEAD']),
 sale_price_is_cost:false,
 materials_only_sufficient:false,
 require_independent_component_provenance:true,
 overhead_allocation_method:'NOT_YET_APPROVED',
 labor_allocation_method:'NOT_YET_APPROVED',
 unit_or_batch_cost_method:'NOT_YET_APPROVED',
 cost_handler_implemented:false,
 real_production_cost_read:false,
 accounting_write_allowed:false,
 release_decision:'NO_GO',
 gates:'G1_G2_G3_G4_G5_OPEN',
});
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,127}$/.test(x);
const money=x=>Number.isSafeInteger(x)&&x>=0;
const reply=(status,add={})=>Object.freeze({
 status,
 component_cost_matches:false,
 source_is_synthetic:true,
 materials_only_cost_policy:false,
 real_production_cost_allocator_present:false,
 real_manager_authorized:false,
 manufacturing_waste_posted:false,
 supplier_recovery_posted:false,
 customer_refund_or_store_credit_posted:false,
 production_db_accessed:false,
 release_decision:'NO_GO',
 owner_gates:'G1_G2_G3_G4_G5_OPEN',
 ...add,
});
const C=Object.freeze([
 ['materialsCents','materialsEvidenceRef'],
 ['directLaborCents','directLaborEvidenceRef'],
 ['allocatedProductionOverheadCents','overheadAllocationEvidenceRef']
]);

/** Review-only: independently supplied fake per-item cost-component proof.
 * Caller cannot use request materials/worker hours/selling price as authority.
 * A genuine authenticated cost evidence verifier and cost allocation formula
 * need to be implemented and separately reviewed before live costing.
 */
export function inspectDamagedReturnCostComponents(
  request,
  independentPhysicalReceipt=null,
  independentDamageInspection=null,
  verifiedCostComponents=null
) {
 if(!request||typeof request!=='object'||Array.isArray(request)||
    !id(request.invoiceId)||!id(request.returnRequestId)||
    !id(request.itemId)||!Number.isSafeInteger(request.returnedUnits)||
    request.returnedUnits<1)
   return reply('STOP_INVALID_RETURNED_ITEM_CASE');

 const q=verifiedCostComponents;
 if(!q||typeof q!=='object'||Array.isArray(q))
   return reply('STOP_NO_INDEPENDENT_COST_BREAKDOWN');
 if(q.source!=='SYNTHETIC_VERIFIED_INDEPENDENT_MANUFACTURING_COMPONENTS'||
    q.verified!==true||!id(q.costEvidenceId)||
    !id(q.batchOrJobEvidenceRef)||!id(q.unitCostBasisEvidenceRef)||
    !id(q.allocationMethodEvidenceRef))
   return reply('STOP_COMPONENT_EVIDENCE_UNVERIFIED');
 for(const k of ['invoiceId','returnRequestId','itemId','returnedUnits'])
   if(q[k]!==request[k]) return reply('STOP_COMPONENT_BREAKDOWN_CASE_MISMATCH');
 if(!independentPhysicalReceipt || !independentDamageInspection ||
    q.physicalReceiptId!==independentPhysicalReceipt.receiptId ||
    q.inspectionId!==independentDamageInspection.inspectionId)
   return reply('STOP_COMPONENT_BREAKDOWN_INSPECTION_BINDING');

 let total=0;
 const refs=[];
 for(const [moneyName,refName] of C){
   if(!money(q[moneyName])||!id(q[refName]))
     return reply('STOP_MISSING_UNSAFE_OR_UNPROVEN_COST_COMPONENT');
   if(q[moneyName]>Number.MAX_SAFE_INTEGER-total)
     return reply('STOP_COST_COMPONENT_SUM_OVERFLOW');
   total+=q[moneyName];
   refs.push(q[refName]);
 }
 if(total<=0)return reply('STOP_NON_POSITIVE_VERIFIED_ACTUAL_MANUFACTURING_COST');
 if(new Set(refs).size!==refs.length)
   return reply('STOP_REUSED_COMPONENT_EVIDENCE_REFERENCE');
 // Even when one component has a verified zero cost, its evidence reference
 // must exist. A missing overhead share is not treated as an implicit zero.
 const gross=inspectReturnedWasteManufacturingCost(
   request,independentPhysicalReceipt,independentDamageInspection,{
     source:'SYNTHETIC_VERIFIED_FINISHED_GOODS_MANUFACTURING_COST',
     verified:true,costEvidenceId:q.costEvidenceId,
     invoiceId:request.invoiceId,returnRequestId:request.returnRequestId,
     itemId:request.itemId,returnedUnits:request.returnedUnits,
     physicalReceiptId:independentPhysicalReceipt.receiptId,
     inspectionId:independentDamageInspection.inspectionId,
     actualManufacturingCostCents:total,
   });
 if(gross.status!=='SYNTHETIC_GROSS_WASTE_AT_VERIFIED_MANUFACTURING_COST_REVIEW_ONLY')
   return reply('STOP_DAMAGE_RECEIPT_OR_INSPECTION_NOT_VERIFIED');
 return reply('SYNTHETIC_FULL_COMPONENT_GROSS_MANUFACTURING_COST_REVIEW_ONLY',{
   component_cost_matches:true,
   materials_cents:q.materialsCents,
   direct_labor_cents:q.directLaborCents,
   allocated_production_overhead_cents:q.allocatedProductionOverheadCents,
   hypothetical_gross_waste_cents:total,
   cost_evidence_id:q.costEvidenceId,
   job_evidence_id:q.batchOrJobEvidenceRef,
   component_evidence_refs:Object.freeze(refs),
   allocation_method_ref:q.allocationMethodEvidenceRef,
   selling_price_as_cost:false,
   recovery_netting:false,
   real_cost_allocation_method_approved:false,
 });
}
