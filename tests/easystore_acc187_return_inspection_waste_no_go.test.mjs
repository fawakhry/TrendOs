import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ACC187_OWNER_RETURN_INVENTORY_DECISION as policy,
 inspectReturnedItemDisposition as inspect,
} from '../scripts/easystore_acc187_returned_product_inspection_waste_no_go.mjs';

const req=(more={})=>({
 invoiceId:'FAKE-INVOICE-RETURN-100',returnRequestId:'FAKE-RETURN-100',
 itemId:'FAKE-PRINTED-MUG-100',returnedUnits:1,...more,
});
const receipt=(r=req(),more={})=>({
 source:'SYNTHETIC_VERIFIED_PHYSICAL_RETURN',verified:true,
 receiptId:'FAKE-RECEIPT-100',invoiceId:r.invoiceId,
 returnRequestId:r.returnRequestId,itemId:r.itemId,
 returnedUnits:r.returnedUnits,...more,
});
const inspection=(r=req(),condition='FIT_FOR_RESALE',more={})=>({
 source:'SYNTHETIC_INDEPENDENT_RETURN_QUALITY_INSPECTION',
 verified:true,inspectionId:'FAKE-QUALITY-INSPECTION-100',
 invoiceId:r.invoiceId,returnRequestId:r.returnRequestId,
 itemId:r.itemId,receiptId:'FAKE-RECEIPT-100',
 inspectedUnits:r.returnedUnits,condition,
 saleabilityEvidenceRef:'FAKE-FIT-FOR-RESALE-EVIDENCE-100',
 damageEvidenceRef:'FAKE-DAMAGE-EVIDENCE-100',
 damageReasonRef:'FAKE-MATERIAL-SCRAP-REASON-100',...more,
});
function neverActuallyPosts(out){
 assert.equal(out.physical_saleable_stock_changed,false);
 assert.equal(out.physical_waste_stock_changed,false);
 assert.equal(out.financial_posting_allowed,false);
 assert.equal(out.real_restocks_authorized,false);
 assert.equal(out.real_waste_posting_authorized,false);
 assert.equal(out.return_approved,false);
 assert.equal(out.manager_identity_verified,false);
 assert.equal(out.release_decision,'NO_GO');
 assert.equal(out.owner_gates,'G1_G2_G3_G4_G5_OPEN');
}
test('owner inspected-first saleable / damaged-only waste and uninspected quarantine',()=>{
 assert.equal(policy.pending_inspection,'NEVER_SALEABLE');
 assert.equal(policy.saleable_restocks,'ONLY_AFTER_VERIFIED_FIT_FOR_RESALE');
 assert.equal(policy.damaged_returns,'WASTE_NOT_AVAILABLE_STOCK');
 assert.equal(policy.compensation_does_not_trigger_restock,true);
 assert.equal(policy.real_return_inventory_handler,'NOT_IMPLEMENTED');
 assert.equal(policy.real_waste_accounting_handler_for_finished_returns,'NOT_IMPLEMENTED');
});
test('unverified physical return cannot create any real stock or waste movement',()=>{
 const r=req(),o=inspect(r);
 assert.equal(o.status,'STOP_NO_INDEPENDENT_PHYSICAL_RETURN_RECEIPT');
 assert.equal(o.proposed_classification,'QUARANTINE');
 neverActuallyPosts(o);
});
test('verified physical return but no inspection remains QUARANTINE',()=>{
 const r=req(),o=inspect(r,receipt(r));
 assert.equal(o.status,'STOP_PENDING_INDEPENDENT_INSPECTION');
 assert.equal(o.proposed_classification,'QUARANTINE');
 neverActuallyPosts(o);
});
test('inspected item fit for resale is *review only*, never automatic restocking',()=>{
 const r=req(),o=inspect(r,receipt(r),inspection(r,'FIT_FOR_RESALE'));
 assert.equal(o.status,'SYNTHETIC_INSPECTED_SALEABLE_RESTOCK_REVIEW_ONLY');
 assert.equal(o.proposed_classification,'INSPECTED_SALEABLE');
 neverActuallyPosts(o);
});
test('inspected damaged returned item must be classified WASTE_ONLY, never saleable',()=>{
 const r=req(),o=inspect(r,receipt(r),inspection(r,'DAMAGED'));
 assert.equal(o.status,'SYNTHETIC_DAMAGED_ITEM_WASTE_RECORD_REQUIRED');
 assert.equal(o.proposed_classification,'WASTE_ONLY');
 neverActuallyPosts(o);
});
for(const [name,edit] of [
 ['unverified',{verified:false}],
 ['client made',{source:'CLIENT_SELF_ASSERTED_RETURN'}],
 ['wrong invoice',{invoiceId:'FAKE-INVOICE-OTHER'}],
 ['wrong request',{returnRequestId:'FAKE-RETURN-OTHER'}],
 ['wrong item',{itemId:'FAKE-MUG-OTHER'}],
 ['wrong quantity',{returnedUnits:2}],
 ['no receipt reference',{receiptId:''}],
]){
 test('forged / unrelated receipt refuses saleable or waste: '+name,()=>{
  const r=req(),o=inspect(r,receipt(r,edit),inspection(r));
  assert.equal(o.status,'STOP_PHYSICAL_RECEIPT_UNVERIFIED_OR_CASE_MISMATCH');
  assert.equal(o.proposed_classification,'QUARANTINE');
  neverActuallyPosts(o);
 });
}
for(const [name,edit] of [
 ['unverified',{verified:false}],
 ['self reported',{source:'CLIENT_SELF_ASSERTED_QA'}],
 ['wrong invoice',{invoiceId:'FAKE-INVOICE-OTHER'}],
 ['wrong return request',{returnRequestId:'FAKE-RETURN-OTHER'}],
 ['wrong item',{itemId:'FAKE-MUG-OTHER'}],
 ['wrong receipt',{receiptId:'FAKE-RECEIPT-OTHER'}],
 ['wrong inspected count',{inspectedUnits:2}],
 ['no inspection id',{inspectionId:''}],
]){
 test('unverified / unrelated inspection cannot change quarantine: '+name,()=>{
  const r=req(),o=inspect(r,receipt(r),inspection(r,'FIT_FOR_RESALE',edit));
  assert.equal(o.status,'STOP_INSPECTION_UNVERIFIED_OR_CASE_MISMATCH');
  assert.equal(o.proposed_classification,'QUARANTINE');
  neverActuallyPosts(o);
 });
}
test('client can claim fit and manager role; without external inspection stays quarantined',()=>{
 const r={...req(),qualityPassed:true,role:'admin',approved:true,
   inspection:inspection(req()),physicalReceipt:receipt(req())};
 const out=inspect(r);
 assert.equal(out.status,'STOP_NO_INDEPENDENT_PHYSICAL_RETURN_RECEIPT');
 neverActuallyPosts(out);
});
test('damaged item without quality evidence for damage remains quarantine',()=>{
 const r=req(),o=inspect(r,receipt(r),inspection(r,'DAMAGED',{damageEvidenceRef:''}));
 assert.equal(o.status,'STOP_DAMAGED_ITEM_MISSING_WASTE_EVIDENCE');
 assert.equal(o.proposed_classification,'QUARANTINE');
 neverActuallyPosts(o);
});
test('damaged item without reason cannot be booked as waste automatically',()=>{
 const r=req(),o=inspect(r,receipt(r),inspection(r,'DAMAGED',{damageReasonRef:''}));
 assert.equal(o.status,'STOP_DAMAGED_ITEM_MISSING_WASTE_EVIDENCE');
 neverActuallyPosts(o);
});
test('FIT_FOR_RESALE requires inspection proof',()=>{
 const r=req(),o=inspect(r,receipt(r),inspection(r,'FIT_FOR_RESALE',{saleabilityEvidenceRef:''}));
 assert.equal(o.status,'STOP_RESALE_WITHOUT_INSPECTION_EVIDENCE');
 neverActuallyPosts(o);
});
for(const status of ['CUSTOMER_SAYS_GOOD','UNKNOWN','LOST','PARTLY_GOOD',null,'']){
 test('unknown condition cannot silently become resale inventory: '+String(status),()=>{
  const r=req(),o=inspect(r,receipt(r),inspection(r,status));
  assert.equal(o.status,'STOP_NO_CONFIRMED_SALEABLE_OR_DAMAGED_CLASSIFICATION');
  assert.equal(o.proposed_classification,'QUARANTINE');
  neverActuallyPosts(o);
 });
}
for(const [name,edits] of [
 ['missing invoice',{invoiceId:''}],['missing item',{itemId:null}],
 ['missing request',{returnRequestId:''}],['zero units',{returnedUnits:0}],
 ['fractional units',{returnedUnits:0.5}],['negative units',{returnedUnits:-1}],
 ['non-integer units',{returnedUnits:'1'}],['unsafe qty',{returnedUnits:Number.MAX_SAFE_INTEGER+1}],
]){
 test('invalid returned physical goods '+name+' cannot pass',()=>{
  const r=req(edits),o=inspect(r,receipt(r),inspection(r));
  assert.equal(o.status,'STOP_INVALID_RETURN_ITEM_ID_OR_QUANTITY');
  neverActuallyPosts(o);
 });
}
test('missing request object fails closed',()=>{
 const o=inspect(null);
 assert.equal(o.status,'STOP_INVALID_RETURN_ITEM_REQUEST');
 neverActuallyPosts(o);
});
console.log('ACC187_OWNER_RETURNED_GOODS=QUARANTINE_UNTIL_INDEPENDENT_INSPECTION');
console.log('ACC187_INSPECTED_FIT_RESALE=REVIEW_ONLY_NO_REAL_RESTOCK');
console.log('ACC187_INSPECTED_DAMAGED=WASTE_RECORD_REVIEW_ONLY_NO_REAL_WASTE_POST');
console.log('ACC187_REAL_FINANCE_AND_MATERIAL_STOCK_MUTATIONS=ZERO');
console.log('FINANCE_RELEASE=NO_GO');
