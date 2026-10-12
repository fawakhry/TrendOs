import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ACC187_OWNER_FULL_MANUFACTURING_COST_COMPONENTS as policy,
 inspectDamagedReturnCostComponents as review,
} from '../scripts/easystore_acc187_manufacturing_cost_components_no_go.mjs';

const request=(changes={})=>({
 invoiceId:'FAKE-INVOICE-950',
 returnRequestId:'FAKE-RETURN-950',
 itemId:'FAKE-PRINTED-ITEM-950',
 returnedUnits:2,
 salePriceCents:999999,
 ...changes,
});
const receipt=(r=request(),changes={})=>({
 source:'SYNTHETIC_VERIFIED_PHYSICAL_RETURN',
 verified:true,receiptId:'FAKE-PHYSICAL-RECEIPT-950',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,returnedUnits:r.returnedUnits,...changes,
});
const inspection=(r=request(),changes={})=>({
 source:'SYNTHETIC_INDEPENDENT_RETURN_QUALITY_INSPECTION',
 verified:true,inspectionId:'FAKE-INDEPENDENT-INSPECTION-950',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,receiptId:'FAKE-PHYSICAL-RECEIPT-950',
 inspectedUnits:r.returnedUnits,condition:'DAMAGED',
 damageEvidenceRef:'FAKE-DAMAGE-950',damageReasonRef:'FAKE-DEFECT-950',
 ...changes,
});
const breakdown=(r=request(),changes={})=>({
 source:'SYNTHETIC_VERIFIED_INDEPENDENT_MANUFACTURING_COMPONENTS',
 verified:true,costEvidenceId:'FAKE-COST-950',
 batchOrJobEvidenceRef:'FAKE-MANUFACTURING-BATCH-950',
 unitCostBasisEvidenceRef:'FAKE-UNIT-BASIS-950',
 allocationMethodEvidenceRef:'FAKE-ALLOCATION-METHOD-EVIDENCE-950',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,returnedUnits:r.returnedUnits,
 physicalReceiptId:'FAKE-PHYSICAL-RECEIPT-950',
 inspectionId:'FAKE-INDEPENDENT-INSPECTION-950',
 materialsCents:6500,materialsEvidenceRef:'FAKE-MATERIALS-950',
 directLaborCents:3400,directLaborEvidenceRef:'FAKE-LABOR-950',
 allocatedProductionOverheadCents:2100,
 overheadAllocationEvidenceRef:'FAKE-PRODUCTION-OVERHEAD-950',
 ...changes,
});
const inspect=(r=request(),e=breakdown(r),p=receipt(r),q=inspection(r))=>
 review(r,p,q,e);
const noReal=(out)=>{
 assert.equal(out.source_is_synthetic,true);
 assert.equal(out.materials_only_cost_policy,false);
 assert.equal(out.real_production_cost_allocator_present,false);
 assert.equal(out.real_manager_authorized,false);
 assert.equal(out.manufacturing_waste_posted,false);
 assert.equal(out.supplier_recovery_posted,false);
 assert.equal(out.customer_refund_or_store_credit_posted,false);
 assert.equal(out.production_db_accessed,false);
 assert.equal(out.release_decision,'NO_GO');
 assert.equal(out.owner_gates,'G1_G2_G3_G4_G5_OPEN');
};
test('owner approved three manufacturing components, allocation formula NOT approved',()=>{
 assert.deepEqual([...policy.components],['MATERIALS','DIRECT_LABOR','ALLOCATED_PRODUCTION_OVERHEAD']);
 assert.equal(policy.sale_price_is_cost,false);
 assert.equal(policy.materials_only_sufficient,false);
 assert.equal(policy.overhead_allocation_method,'NOT_YET_APPROVED');
 assert.equal(policy.labor_allocation_method,'NOT_YET_APPROVED');
 assert.equal(policy.cost_handler_implemented,false);
});
test('actual MFG cost = verified materials + direct labor + allocated overhead',()=>{
 const x=inspect();
 assert.equal(x.status,'SYNTHETIC_FULL_COMPONENT_GROSS_MANUFACTURING_COST_REVIEW_ONLY');
 assert.equal(x.component_cost_matches,true);
 assert.equal(x.hypothetical_gross_waste_cents,12000);
 assert.equal(x.materials_cents,6500);
 assert.equal(x.direct_labor_cents,3400);
 assert.equal(x.allocated_production_overhead_cents,2100);
 assert.equal(x.real_cost_allocation_method_approved,false);
 assert.equal(x.recovery_netting,false);
 noReal(x);
});
test('higher sale price and separate customer refund cannot change cost amount',()=>{
 const r=request({salePriceCents:999999999,customerRefundCents:2});
 const x=inspect(r,breakdown(r,{salePriceCents:100000000}));
 assert.equal(x.hypothetical_gross_waste_cents,12000);
 assert.equal(x.selling_price_as_cost,false);
 noReal(x);
});
for(const [name,changes,expected] of [
 ['labor must contribute',{directLaborCents:6500},15100],
 ['overhead must contribute',{allocatedProductionOverheadCents:3100},13000],
 ['raw materials must contribute',{materialsCents:9500},15000],
 ['verified zero labor is explicit',{directLaborCents:0},8600],
 ['verified zero overhead is explicit',{allocatedProductionOverheadCents:0},9900],
]){
 test('verified component independently changes gross: '+name,()=>{
  const r=request(),o=inspect(r,breakdown(r,changes));
  assert.equal(o.hypothetical_gross_waste_cents,expected);
  noReal(o);
 });
}
for(const name of [
 'materialsCents','directLaborCents','allocatedProductionOverheadCents',
]){
 for(const value of [undefined,null,-1,0.1,NaN,Infinity,'1500']){
  test('missing/faulty '+name+' value '+String(value)+' stops',()=>{
   const r=request(),p=breakdown(r,{[name]:value});
   const o=inspect(r,p);
   assert.equal(o.status,'STOP_MISSING_UNSAFE_OR_UNPROVEN_COST_COMPONENT');
   noReal(o);
  });
 }
}
for(const name of [
 'materialsEvidenceRef','directLaborEvidenceRef','overheadAllocationEvidenceRef',
]){
 test('no evidence reference for '+name+' denies implicit cost',()=>{
  const r=request(),o=inspect(r,breakdown(r,{[name]:''}));
  assert.equal(o.status,'STOP_MISSING_UNSAFE_OR_UNPROVEN_COST_COMPONENT');
  noReal(o);
 });
}
test('zero in ALL verified components must not produce free waste',()=>{
 const r=request(),o=inspect(r,breakdown(r,{
  materialsCents:0,directLaborCents:0,allocatedProductionOverheadCents:0,
 }));
 assert.equal(o.status,'STOP_NON_POSITIVE_VERIFIED_ACTUAL_MANUFACTURING_COST');
 noReal(o);
});
test('overflow of safe cents is denied without rounding',()=>{
 const r=request(),o=inspect(r,breakdown(r,{
  materialsCents:Number.MAX_SAFE_INTEGER,
  directLaborCents:1,allocatedProductionOverheadCents:0,
 }));
 assert.equal(o.status,'STOP_COST_COMPONENT_SUM_OVERFLOW');
 noReal(o);
});
test('same source reference reused as direct labor and overhead is denied',()=>{
 const r=request(),o=inspect(r,breakdown(r,{
  overheadAllocationEvidenceRef:'FAKE-LABOR-950',
 }));
 assert.equal(o.status,'STOP_REUSED_COMPONENT_EVIDENCE_REFERENCE');
 noReal(o);
});
for(const [name,update] of [
 ['client asserted',{source:'CLIENT_ASSERTED_COMPONENTS'}],
 ['unverified',{verified:false}],
 ['missing batch',{batchOrJobEvidenceRef:''}],
 ['missing allocation source',{allocationMethodEvidenceRef:''}],
 ['missing unit cost basis',{unitCostBasisEvidenceRef:''}],
 ['missing primary cost evidence',{costEvidenceId:''}],
]){
 test('fake breakdown missing independent source '+name+' is refused',()=>{
  const r=request(),o=inspect(r,breakdown(r,update));
  assert.equal(o.status,'STOP_COMPONENT_EVIDENCE_UNVERIFIED');
  noReal(o);
 });
}
for(const [name,update] of [
 ['invoice',{invoiceId:'FAKE-INVOICE-OTHER'}],
 ['request',{returnRequestId:'FAKE-RETURN-OTHER'}],
 ['item',{itemId:'FAKE-ITEM-OTHER'}],
 ['quantity',{returnedUnits:3}],
]){
 test('batch component proof cannot be transferred across '+name,()=>{
  const r=request(),o=inspect(r,breakdown(r,update));
  assert.equal(o.status,'STOP_COMPONENT_BREAKDOWN_CASE_MISMATCH');
  noReal(o);
 });
}
for(const [name,update] of [
 ['receipt',{physicalReceiptId:'FAKE-OTHER-RECEIPT'}],
 ['inspection',{inspectionId:'FAKE-OTHER-INSPECTION'}],
]){
 test('cost evidence cannot transfer across '+name,()=>{
  const r=request(),o=inspect(r,breakdown(r,update));
  assert.equal(o.status,'STOP_COMPONENT_BREAKDOWN_INSPECTION_BINDING');
  noReal(o);
 });
}
test('a physically unreceived item cannot pass the finished-goods waste inspection',()=>{
 const r=request(),o=inspect(r,breakdown(r),null,inspection(r));
 assert.equal(o.status,'STOP_COMPONENT_BREAKDOWN_INSPECTION_BINDING');
 noReal(o);
});
test('no independent damage QA cannot be valued as confirmed waste',()=>{
 const r=request(),o=inspect(r,breakdown(r),receipt(r),null);
 assert.equal(o.status,'STOP_COMPONENT_BREAKDOWN_INSPECTION_BINDING');
 noReal(o);
});
test('fit-for-resale returned item is NOT a damaged-waste cost',()=>{
 const r=request(),o=inspect(r,breakdown(r),receipt(r),inspection(r,{condition:'FIT_FOR_RESALE'}));
 assert.equal(o.status,'STOP_DAMAGE_RECEIPT_OR_INSPECTION_NOT_VERIFIED');
 noReal(o);
});
test('customer-provided cost breakdown cannot replace independent proof',()=>{
 const r={...request(),materialsCents:6500,directLaborCents:3400,
          allocatedProductionOverheadCents:2100,approved:true};
 const o=review(r,receipt(r),inspection(r),null);
 assert.equal(o.status,'STOP_NO_INDEPENDENT_COST_BREAKDOWN');
 noReal(o);
});
console.log('ACC187_OWNER_ACTUAL_MANUFACTURING_COST=MATERIALS_PLUS_DIRECT_LABOR_PLUS_ALLOCATED_OVERHEAD');
console.log('ACC187_COST_COMPONENT_EVIDENCE=SYNTHETIC_ONLY_NO_ALLOCATOR_APPROVED');
console.log('ACC187_GROSS_WASTE_NOT_SALES_PRICE_OR_RECOVERY=PASS');
console.log('ACC187_REAL_FINANCIAL_POSTING_D1_AND_PRINTSHOP=ZERO');
console.log('FINANCE_RELEASE=NO_GO');
