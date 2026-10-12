import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ACC187_OWNER_WASTE_VALUATION_RECOVERY_RULE as policy,
 inspectReturnedWasteManufacturingCost as costReview,
 inspectSeparateApprovedWasteRecovery as recoveryReview,
} from '../scripts/easystore_acc187_manufacturing_waste_cost_recovery_no_go.mjs';

const req=(edits={})=>({
 invoiceId:'FAKE-INVOICE-700',returnRequestId:'FAKE-RETURN-700',
 itemId:'FAKE-PRINTED-MUG-700',returnedUnits:2,
 salePriceCents:95000,...edits,
});
const receipt=(r=req(),patch={})=>({
 source:'SYNTHETIC_VERIFIED_PHYSICAL_RETURN',verified:true,
 receiptId:'FAKE-PHYSICAL-RECEIPT-700',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,returnedUnits:r.returnedUnits,...patch,
});
const quality=(r=req(),patch={})=>({
 source:'SYNTHETIC_INDEPENDENT_RETURN_QUALITY_INSPECTION',
 verified:true,inspectionId:'FAKE-INSPECT-DAMAGED-700',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,receiptId:'FAKE-PHYSICAL-RECEIPT-700',
 inspectedUnits:r.returnedUnits,condition:'DAMAGED',
 damageEvidenceRef:'FAKE-DAMAGE-PHOTO-700',
 damageReasonRef:'FAKE-MANUFACTURING-DEFECT-700',
 saleabilityEvidenceRef:'FAKE-INSPECTION-SALEABLE-NOT-USED',
 ...patch,
});
const manufacturing=(r=req(),patch={})=>({
 source:'SYNTHETIC_VERIFIED_FINISHED_GOODS_MANUFACTURING_COST',
 verified:true,costEvidenceId:'FAKE-MFG-ACTUAL-COST-700',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,returnedUnits:r.returnedUnits,
 inspectionId:'FAKE-INSPECT-DAMAGED-700',
 physicalReceiptId:'FAKE-PHYSICAL-RECEIPT-700',
 actualManufacturingCostCents:12600,
 salePriceCents:95000,...patch,
});
const recover=(r=req(),patch={})=>({
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,recoveryId:'FAKE-SUPPLIER-RECOVERY-700',
 recoveryPartyType:'SUPPLIER',recoveryPartyId:'FAKE-SUPPLIER-700',
 recoveryCents:4200,...patch,
});
const independent=(r=recover(),gross=goodCost(),patch={})=>({
 source:'SYNTHETIC_VERIFIED_INDEPENDENT_THIRD_PARTY_RECOVERY',
 verified:true,recoveryEvidenceId:'FAKE-RECOVERY-DOC-700',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,recoveryId:r.recoveryId,
 recoveryPartyType:r.recoveryPartyType,
 recoveryPartyId:r.recoveryPartyId,recoveryCents:r.recoveryCents,
 costEvidenceId:gross.cost_evidence_id,...patch,
});
const manager=(r=recover(),e=independent(r),patch={})=>({
 source:'SYNTHETIC_VERIFIED_MANAGER_SEPARATE_WASTE_RECOVERY',
 verifiedManager:true,decision:'APPROVED_RECOVERY',
 approvalId:'FAKE-INDEPENDENT-MANAGER-RECOVERY-700',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,recoveryId:r.recoveryId,
 recoveryPartyType:r.recoveryPartyType,
 recoveryPartyId:r.recoveryPartyId,recoveryCents:r.recoveryCents,
 costEvidenceId:e.costEvidenceId,recoveryEvidenceId:e.recoveryEvidenceId,...patch,
});
const goodCost=(r=req())=>costReview(r,receipt(r),quality(r),manufacturing(r));
const noReal=o=>{
 assert.equal(o.gross_waste_ledger_posted,false);
 assert.equal(o.physical_finished_goods_waste_posted,false);
 assert.equal(o.cash_or_bank_recovery_posted,false);
 assert.equal(o.supplier_debt_modified,false);
 assert.equal(o.customer_refund_or_credit_posted,false);
 assert.equal(o.real_management_approval_verified,false);
 assert.equal(o.real_financial_release,false);
 assert.equal(o.release_decision,'NO_GO');
 assert.equal(o.owner_gates,'G1_G2_G3_G4_G5_OPEN');
};
test('owner chose actual manufacturing cost not sale price, separate approved recovery',()=>{
 assert.equal(policy.effective_owner_choice,'DAMAGED_RETURN_AT_ACTUAL_MANUFACTURING_COST');
 assert.equal(policy.forbidden_valuation,'CUSTOMER_SALE_PRICE');
 assert.deepEqual([...policy.recovery_sources],['SUPPLIER','RESPONSIBLE_PARTY']);
 assert.equal(policy.gross_waste_recorded_separately_from_recovery,true);
 assert.equal(policy.automatic_netting_or_reduction_of_original_waste,false);
 assert.equal(policy.recovery_requires_per_case_management_approval,true);
 assert.equal(policy.real_manufacturing_cost_allocator,'NOT_IMPLEMENTED');
 assert.equal(policy.release_decision,'NO_GO');
});
test('verified damaged physical return with independent cost yields GROSS COST REVIEW only',()=>{
 const x=goodCost();
 assert.equal(x.status,'SYNTHETIC_GROSS_WASTE_AT_VERIFIED_MANUFACTURING_COST_REVIEW_ONLY');
 assert.equal(x.hypothetical_gross_waste_cost_cents,12600);
 assert.equal(x.sales_price_used_as_cost,false);
 assert.equal(x.recovery_netted_into_gross_waste,false);
 assert.equal(x.suggested_disposition,'WASTE_ONLY');
 noReal(x);
});
test('sale price 95000 cannot override actual manufacturing cost 12600',()=>{
 const r=req({salePriceCents:99999999});
 const x=costReview(r,receipt(r),quality(r),manufacturing(r,{
  actualManufacturingCostCents:12600,salePriceCents:99999999,
 }));
 assert.equal(x.hypothetical_gross_waste_cost_cents,12600);
 noReal(x);
});
test('fit-for-resale return cannot be written off as damaged waste',()=>{
 const r=req(),x=costReview(r,receipt(r),quality(r,{condition:'FIT_FOR_RESALE'}),manufacturing(r));
 assert.equal(x.status,'STOP_RETURN_NOT_INDEPENDENTLY_INSPECTED_DAMAGED');
 noReal(x);
});
for(const [title,rec,qa] of [
 ['missing physical receipt',null,quality()],
 ['missing inspection',receipt(),null],
 ['inspection not verified',receipt(),quality(req(),{verified:false})],
 ['unrelated inspection item',receipt(),quality(req(),{itemId:'FAKE-OTHER-MUG'})],
 ['receipt for different invoice',receipt(req(),{invoiceId:'FAKE-INVOICE-OTHER'}),quality()],
]){
 test('unproven damaged physical return stops cost posting: '+title,()=>{
  const x=costReview(req(),rec,qa,manufacturing());
  assert.equal(x.status,'STOP_RETURN_NOT_INDEPENDENTLY_INSPECTED_DAMAGED');
  noReal(x);
 });
}
test('no independent manufacturing-cost proof never falls back to sales price',()=>{
 const r=req();
 const x=costReview(r,receipt(r),quality(r),null);
 assert.equal(x.status,'STOP_MISSING_INDEPENDENT_ACTUAL_MANUFACTURING_COST');
 noReal(x);
});
for(const [title,patch] of [
 ['client cost claim',{source:'CUSTOMER_REPORTED_SALE_PRICE'}],
 ['cost not independently verified',{verified:false}],
 ['missing manufacturing cost ref',{costEvidenceId:''}],
 ['zero-cost invented from sales receipt',{actualManufacturingCostCents:0}],
 ['negative cost',{actualManufacturingCostCents:-1}],
 ['fractional minor units',{actualManufacturingCostCents:123.4}],
 ['string monetary amount',{actualManufacturingCostCents:'12600'}],
 ['unsafe monetary amount',{actualManufacturingCostCents:Number.MAX_SAFE_INTEGER+1}],
]){
 test('unverified cost cannot be waste valuation: '+title,()=>{
  const r=req(),x=costReview(r,receipt(r),quality(r),manufacturing(r,patch));
  assert.equal(x.status,'STOP_UNVERIFIED_OR_INVALID_MANUFACTURING_COST');
  noReal(x);
 });
}
for(const [title,patch] of [
 ['invoice',{invoiceId:'FAKE-OTHER-INVOICE'}],
 ['return request',{returnRequestId:'FAKE-OTHER-RETURN'}],
 ['item',{itemId:'FAKE-OTHER-MUG'}],
 ['number of returned units',{returnedUnits:3}],
 ['inspection ID',{inspectionId:'FAKE-OTHER-INSPECTION'}],
 ['physical receipt ID',{physicalReceiptId:'FAKE-OTHER-RECEIPT'}],
]){
 test('manufacturing cost evidence cannot cross '+title,()=>{
  const r=req(),x=costReview(r,receipt(r),quality(r),manufacturing(r,patch));
  assert.equal(x.status,'STOP_MANUFACTURING_COST_EVIDENCE_CASE_MISMATCH');
  noReal(x);
 });
}
for(const party of ['SUPPLIER','RESPONSIBLE_PARTY']){
 test('recovery from '+party+' is separate management REVIEW only; gross waste cost unchanged',()=>{
  const gross=goodCost(),r=recover(req(),{recoveryPartyType:party});
  const e=independent(r,gross),m=manager(r,e);
  const x=recoveryReview(r,gross,e,m);
  assert.equal(x.status,'SYNTHETIC_SEPARATE_MANAGEMENT_APPROVED_RECOVERY_REVIEW_ONLY');
  assert.equal(x.hypothetical_separately_recoverable_cents,4200);
  assert.equal(x.gross_waste_cost_remaining_unchanged_cents,12600);
  assert.equal(x.gross_waste_netted,false);
  noReal(x);
 });
}
test('supplier recovery NOT created automatically by approved damaged return',()=>{
 const gross=goodCost(),r=recover();
 const x=recoveryReview(r,gross);
 assert.equal(x.status,'STOP_MISSING_OR_UNVERIFIED_RECOVERY_EVIDENCE');
 noReal(x);
});
test('independently evidenced recovery STILL needs separate management approval',()=>{
 const gross=goodCost(),r=recover(),e=independent(r,gross);
 const x=recoveryReview(r,gross,e,null);
 assert.equal(x.status,'STOP_NO_SEPARATE_MANAGER_RECOVERY_APPROVAL');
 noReal(x);
});
test('client role and purported approval never substitute for real manager',()=>{
 const gross=goodCost(),r={...recover(),role:'admin',approved:true,managerApproval:manager()};
 const e=independent(r,gross);
 const x=recoveryReview(r,gross,e,null);
 assert.equal(x.status,'STOP_NO_SEPARATE_MANAGER_RECOVERY_APPROVAL');
 noReal(x);
});
for(const [title,patch] of [
 ['manager not verified',{verifiedManager:false}],
 ['wrong decision',{decision:'APPROVE_WASTE_COST_ONLY'}],
 ['client-generated approval',{source:'CLIENT_SIGNED'}],
 ['blank approval reference',{approvalId:''}],
 ['approval reused as evidence',{approvalId:'FAKE-RECOVERY-DOC-700'}],
]){
 test('unverified manager recovery approval denied: '+title,()=>{
  const gross=goodCost(),r=recover(),e=independent(r,gross);
  const x=recoveryReview(r,gross,e,manager(r,e,patch));
  assert.equal(x.status,'STOP_NO_SEPARATE_MANAGER_RECOVERY_APPROVAL');
  noReal(x);
 });
}
for(const [title,patch] of [
 ['wrong invoice',{invoiceId:'FAKE-OTHER-INVOICE'}],
 ['wrong return',{returnRequestId:'FAKE-OTHER-RETURN'}],
 ['wrong item',{itemId:'FAKE-OTHER-ITEM'}],
 ['wrong recovery ID',{recoveryId:'FAKE-OTHER-RECOVERY'}],
 ['wrong party type',{recoveryPartyType:'RESPONSIBLE_PARTY'}],
 ['wrong party',{recoveryPartyId:'FAKE-OTHER-SUPPLIER'}],
 ['wrong amount',{recoveryCents:4201}],
]){
 test('manager approval cannot transfer across '+title,()=>{
  const gross=goodCost(),r=recover(),e=independent(r,gross);
  const x=recoveryReview(r,gross,e,manager(r,e,patch));
  assert.equal(x.status,'STOP_RECOVERY_MANAGER_CASE_MISMATCH');
  noReal(x);
 });
}
for(const [title,patch] of [
 ['wrong invoice',{invoiceId:'FAKE-OTHER-INVOICE'}],
 ['wrong return',{returnRequestId:'FAKE-OTHER-RETURN'}],
 ['wrong item',{itemId:'FAKE-OTHER-ITEM'}],
 ['wrong recovery ID',{recoveryId:'FAKE-OTHER-RECOVERY'}],
 ['wrong party',{recoveryPartyId:'FAKE-OTHER-PARTY'}],
 ['wrong amount',{recoveryCents:4201}],
]){
 test('independent supplier receipt cannot transfer across '+title,()=>{
  const gross=goodCost(),r=recover(),e=independent(r,gross,patch);
  const x=recoveryReview(r,gross,e,manager(r,e));
  assert.equal(x.status,'STOP_RECOVERY_EVIDENCE_CASE_MISMATCH');
  noReal(x);
 });
}
test('recovery proof for wrong waste cost evidence refused',()=>{
 const gross=goodCost(),r=recover(),e=independent(r,gross,{costEvidenceId:'FAKE-OTHER-COST'});
 const x=recoveryReview(r,gross,e,manager(r,e));
 assert.equal(x.status,'STOP_RECOVERY_EVIDENCE_WRONG_GROSS_WASTE');
 noReal(x);
});
test('same waste cost review from another return cannot be reused',()=>{
 const gross=goodCost(),r=recover(req(),{returnRequestId:'FAKE-OTHER-RETURN'});
 const e=independent(r,gross);
 const x=recoveryReview(r,gross,e,manager(r,e));
 assert.equal(x.status,'STOP_NO_VERIFIED_WASTE_COST_REVIEW');
 noReal(x);
});
test('recovery approval must bind the exact evidence reference and gross cost',()=>{
 const gross=goodCost(),r=recover(),e=independent(r,gross);
 const x=recoveryReview(r,gross,e,manager(r,e,{recoveryEvidenceId:'FAKE-OTHER-EVIDENCE'}));
 assert.equal(x.status,'STOP_RECOVERY_APPROVAL_NOT_BOUND_TO_EVIDENCE');
 noReal(x);
});
for(const [title,patch] of [
 ['unknown party type',{recoveryPartyType:'CUSTOMER'}],
 ['empty supplier ID',{recoveryPartyId:''}],
 ['negative amount',{recoveryCents:-20}],
 ['zero amount',{recoveryCents:0}],
 ['unsafe fractional amount',{recoveryCents:12.5}],
 ['string amount',{recoveryCents:'4200'}],
]){
 test('invalid recovery request denied: '+title,()=>{
  const gross=goodCost(),r=recover(req(),patch);
  const x=recoveryReview(r,gross);
  assert.equal(x.status,'STOP_INVALID_RECOVERY_PARTY_OR_AMOUNT');
  noReal(x);
 });
}
test('gross waste stays 12600 even for a recovery larger than that cost: owner amount rule not invented',()=>{
 const gross=goodCost(),r=recover(req(),{recoveryCents:15000});
 const e=independent(r,gross),x=recoveryReview(r,gross,e,manager(r,e));
 assert.equal(x.status,'SYNTHETIC_SEPARATE_MANAGEMENT_APPROVED_RECOVERY_REVIEW_ONLY');
 assert.equal(x.gross_waste_cost_remaining_unchanged_cents,12600);
 assert.equal(x.hypothetical_separately_recoverable_cents,15000);
 noReal(x);
});
console.log('ACC187_WASTE_GROSS=ACTUAL_MANUFACTURING_COST_NOT_SALE_PRICE_REVIEW_ONLY');
console.log('ACC187_SUPPLIER_OR_RESPONSIBLE_PARTY_RECOVERY=SEPARATE_MANAGER_CASE_APPROVAL_ONLY');
console.log('ACC187_GROSS_WASTE_AND_RECOVERY_AUTOMATIC_NETTING=DENIED');
console.log('ACC187_ACTUAL_GOODS_WASTE_RECOVERY_FINANCE_AND_PRINTSHOP_WRITES=ZERO');
console.log('G1_G2_G3_G4_G5=OPEN');console.log('FINANCE_RELEASE=NO_GO');
