import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ACC187_OWNER_COMPENSATION_AMOUNT_RULE as policy,
 inspectReturnCompensationCap as review,
} from '../scripts/easystore_acc187_paid_items_compensation_cap_no_go.mjs';

// Entirely invented fixtures, NOT actual manager approvals or payment data.
const req=(cashCents=6000,storeCreditCents=2000,more={})=>({
 invoiceId:'FAKE-INVOICE-500',requestId:'FAKE-RETURN-500',
 returnedItemIds:['FAKE-ITEM-A','FAKE-ITEM-B'],
 cashCents,storeCreditCents,...more,
});
const proof=(r=req(),updates={})=>({
 source:'SYNTHETIC_SERVER_VERIFIED_ITEM_PAYMENTS_AND_HISTORY',verified:true,
 proofId:'FAKE-PAYMENTS-HISTORY-500',invoiceId:r.invoiceId,
 requestId:r.requestId,returnedItemIds:[...r.returnedItemIds],
 actualPaidForReturnedItemsCents:10000,
 priorCashRefundCents:1000,priorStoreCreditCents:1000,...updates,
});
const mgr=(r=req(),updates={})=>({
 source:'SYNTHETIC_SERVER_VERIFIED_CASE_MANAGER',
 verifiedManager:true,decision:'APPROVED',
 approvalId:'FAKE-CASE-MANAGER-500',
 invoiceId:r.invoiceId,requestId:r.requestId,
 returnedItemIds:[...r.returnedItemIds],
 route:r.cashCents>0&&r.storeCreditCents>0?'MIXED_CASH_AND_CREDIT':
   r.cashCents>0?'CASH_REFUND':'CUSTOMER_CREDIT',
 cashCents:r.cashCents,storeCreditCents:r.storeCreditCents,...updates,
});
const exception=(r=req(),additional=1,updates={})=>({
 source:'SYNTHETIC_SEPARATE_VERIFIED_EXCEPTION_MANAGER',
 verifiedManager:true,decision:'APPROVED_EXCEPTION',
 exceptionApprovalId:'FAKE-EXCEPTION-MANAGER-500',
 reasonReference:'FAKE-EXCEPTION-REASON-500',
 invoiceId:r.invoiceId,requestId:r.requestId,
 returnedItemIds:[...r.returnedItemIds],
 cashCents:r.cashCents,storeCreditCents:r.storeCreditCents,
 exceptionalAdditionalCents:additional,...updates,
});
const inspect=(r=req(),history=proof(r),manager=mgr(r),exceptionRecord=null)=>
 review(r,history,manager,exceptionRecord);
const blocked=v=>{
 assert.equal(v.actual_return_approved,false);
 assert.equal(v.can_pay_cash,false);
 assert.equal(v.can_post_store_credit,false);
 assert.equal(v.can_edit_customer_debt,false);
 assert.equal(v.can_publish,false);
 assert.equal(v.real_manager_verified,false);
 assert.equal(v.release_decision,'NO_GO');
 assert.equal(v.owner_gates,'G1_G2_G3_G4_G5_OPEN');
};
test('owner decided paid returned items less all previous compensation, exception needs separate manager',()=>{
 assert.equal(policy.scope,'ACTUAL_PAID_FOR_RETURNED_ITEMS_LESS_PREVIOUS_CASH_AND_CREDIT');
 assert.equal(policy.separate_manager_approval_for_exception,true);
 assert.equal(policy.case_manager_approval_always_required,true);
 assert.equal(policy.legal_consumer_rights_override,true);
 assert.equal(policy.live_manager_verifier,'NOT_IMPLEMENTED');
 assert.deepEqual([...policy.methods],['CASH_REFUND','CUSTOMER_CREDIT','MIXED_CASH_AND_CREDIT']);
 assert.equal(policy.release_decision,'NO_GO');
});
for(const [cash,credit,route] of [
 [8000,0,'CASH_REFUND'],
 [0,8000,'CUSTOMER_CREDIT'],
 [6000,2000,'MIXED_CASH_AND_CREDIT'],
 [1000,0,'CASH_REFUND'],
 [0,1,'CUSTOMER_CREDIT'],
]){
 test('amount within remaining paid items using '+route+' '+cash+'+'+credit+' is reviewer-only',()=>{
   const r=req(cash,credit),out=inspect(r);
   assert.equal(out.status,'SYNTHETIC_AMOUNT_POLICY_MATCH_ONLY_NO_FINANCIAL_AUTHORITY');
   assert.equal(out.amount_review_matched,true);
   assert.equal(out.exception_review_matched,false);
   assert.equal(out.method,route);
   assert.equal(out.actualPaidForReturnedItemsCents,10000);
   assert.equal(out.previouslyCompensatedCents,2000);
   assert.equal(out.amountRemainingBeforeRequestCents,8000);
   assert.equal(out.excessRequiringDistinctManagementApprovalCents,0);
   blocked(out);
 });
}
test('previous cash AND prior credit both reduce remaining cap',()=>{
 const r=req(6000,2000);
 const x=inspect(r,proof(r,{priorCashRefundCents:2500,priorStoreCreditCents:1500}));
 assert.equal(x.status,'STOP_SEPARATE_EXCEPTION_APPROVAL_REQUIRED');
 blocked(x);
});
test('one additional cent beyond net paid is denied without separate exception approval',()=>{
 const r=req(6001,2000);
 const out=inspect(r);
 assert.equal(out.status,'STOP_SEPARATE_EXCEPTION_APPROVAL_REQUIRED');
 blocked(out);
});
test('separate manager may approve only the specific hypothetical exception amount, no posting',()=>{
 const r=req(6001,2000),out=inspect(r,proof(r),mgr(r),exception(r,1));
 assert.equal(out.status,'SYNTHETIC_AMOUNT_POLICY_MATCH_ONLY_NO_FINANCIAL_AUTHORITY');
 assert.equal(out.exception_review_matched,true);
 assert.equal(out.excessRequiringDistinctManagementApprovalCents,1);
 assert.equal(out.proposedTotalCents,8001);
 blocked(out);
});
test('exception approval distinct from normal per-case approval, never silently reused',()=>{
 const r=req(6001,2000),e=exception(r,1,{exceptionApprovalId:'FAKE-CASE-MANAGER-500'});
 const out=inspect(r,proof(r),mgr(r),e);
 assert.equal(out.status,'STOP_EXCEPTION_MANAGER_APPROVAL_UNVERIFIED');
 blocked(out);
});
test('client approval fields never substitute for two independent manager records',()=>{
 const r={...req(6001,2000),role:'admin',approved:true,
   exceptionApproved:true,managerApproval:mgr(),exceptionApproval:exception(req(6001,2000),1)};
 assert.equal(inspect(r,proof(r),null,exception(r,1)).status,
  'STOP_NO_INDEPENDENT_CASE_MANAGER_APPROVAL');
 blocked(inspect(r,proof(r),mgr(r),null));
});
test('incorrect exception increment cannot approve over-cap return',()=>{
 const r=req(6001,2000),out=inspect(r,proof(r),mgr(r),exception(r,5));
 assert.equal(out.status,'STOP_EXCEPTION_APPROVAL_CASE_OR_AMOUNT_MISMATCH');
 blocked(out);
});
for(const [name,edit] of [
 ['missing exception reason',{reasonReference:''}],
 ['unverified manager',{verifiedManager:false}],
 ['client-made exception',{source:'CLIENT_APPROVAL'}],
 ['pending exception',{decision:'PENDING'}],
 ['no exception id',{exceptionApprovalId:''}],
]){
 test('fake excess approval '+name+' rejects',()=>{
  const r=req(6001,2000),out=inspect(r,proof(r),mgr(r),exception(r,1,edit));
  assert.equal(out.status,'STOP_EXCEPTION_MANAGER_APPROVAL_UNVERIFIED');
  blocked(out);
 });
}
for(const [name,edit] of [
 ['different invoice',{invoiceId:'FAKE-INVOICE-OTHER'}],
 ['different return',{requestId:'FAKE-RETURN-OTHER'}],
 ['different item',{returnedItemIds:['FAKE-ITEM-A']}],
 ['switched cash amount',{cashCents:6000}],
 ['switched credit amount',{storeCreditCents:2001}],
]){
 test('exception cannot transfer to '+name,()=>{
  const r=req(6001,2000),out=inspect(r,proof(r),mgr(r),exception(r,1,edit));
  assert.equal(out.status,'STOP_EXCEPTION_APPROVAL_CASE_OR_AMOUNT_MISMATCH');
  blocked(out);
 });
}
for(const [name,edit] of [
 ['different invoice',{invoiceId:'FAKE-INVOICE-OTHER'}],
 ['different request',{requestId:'FAKE-RETURN-OTHER'}],
 ['different returned items',{returnedItemIds:['FAKE-ITEM-A']}],
 ['different cash route',{cashCents:0}],
 ['different store-credit amount',{storeCreditCents:1800}],
 ['different method',{route:'CUSTOMER_CREDIT'}],
]){
 test('manager case approval cannot transfer to '+name,()=>{
  const r=req(),out=inspect(r,proof(r),mgr(r,edit));
  assert.equal(out.status,'STOP_CASE_MANAGER_APPROVAL_MISMATCH');
  blocked(out);
 });
}
for(const [name,edit] of [
 ['invoice',{invoiceId:'FAKE-INVOICE-OTHER'}],
 ['request',{requestId:'FAKE-RETURN-OTHER'}],
 ['item set',{returnedItemIds:['FAKE-ITEM-B']}],
]){
 test('separate proof of actual returned item payments cannot transfer to '+name,()=>{
  const r=req(),out=inspect(r,proof(r,edit),mgr(r));
  assert.equal(out.status,'STOP_PAYMENT_HISTORY_CASE_MISMATCH');
  blocked(out);
 });
}
for(const [name,edit] of [
 ['missing proof ID',{proofId:''}],
 ['fake client proof',{source:'CLIENT'}],
 ['not server verified',{verified:false}],
]){
 test('unverified paid-item and refund history '+name+' fails closed',()=>{
  const r=req(),out=inspect(r,proof(r,edit),mgr(r));
  assert.equal(out.status,'STOP_UNVERIFIED_PAYMENT_HISTORY');
  blocked(out);
 });
}
test('invoice gross total cannot replace verified amount PAID for returned items',()=>{
 // An invoice can be 20000 cents while only 3000 cents has been paid for
 // returned items. A 5000 cent claim cannot use the gross invoice total.
 const r=req(5000,0),history=proof(r,{
   actualPaidForReturnedItemsCents:3000,
   priorCashRefundCents:0,priorStoreCreditCents:0,
 });
 assert.equal(inspect(r,history).status,'STOP_SEPARATE_EXCEPTION_APPROVAL_REQUIRED');
});
test('prior compensation cannot be represented as only the cash part',()=>{
 const r=req(1000,1000);
 const history=proof(r,{
  actualPaidForReturnedItemsCents:5000,
  priorCashRefundCents:2000,priorStoreCreditCents:2500,
 });
 assert.equal(inspect(r,history).status,'STOP_SEPARATE_EXCEPTION_APPROVAL_REQUIRED');
});
test('previous refund over paid amount cannot open an accidental new automatic credit',()=>{
 const r=req(0,1),history=proof(r,{
  actualPaidForReturnedItemsCents:500,
  priorCashRefundCents:600,priorStoreCreditCents:100,
 });
 assert.equal(inspect(r,history).status,'STOP_SEPARATE_EXCEPTION_APPROVAL_REQUIRED');
});
test('zero paid for returned items never auto-entitles credit or cash',()=>{
 const r=req(0,100);
 assert.equal(inspect(r,proof(r,{actualPaidForReturnedItemsCents:0})).status,
 'STOP_UNSAFE_OR_UNPAID_ITEM_HISTORY');
});
for(const [cash,credit] of [[0,0],[-1,200],[100,-1],[1.2,0],[0,Infinity],[NaN,20],[Number.MAX_SAFE_INTEGER,1]]){
 test('reject non-positive, fractional or overflow request '+String(cash)+'/'+String(credit),()=>{
  const r=req(cash,credit),out=inspect(r);
  assert.equal(out.status,'STOP_UNSAFE_OR_ZERO_SETTLEMENT_MINOR_UNITS');
  blocked(out);
 });
}
test('overflow in historical money totals is rejected, not rounded',()=>{
 const r=req(1,0);
 const out=inspect(r,proof(r,{priorCashRefundCents:Number.MAX_SAFE_INTEGER,
  priorStoreCreditCents:1}));
 assert.equal(out.status,'STOP_HISTORY_AMOUNT_OVERFLOW');
});
test('negative prior store credit evidence is invalid',()=>{
 const r=req(1,0);
 assert.equal(inspect(r,proof(r,{priorStoreCreditCents:-1})).status,
  'STOP_UNSAFE_OR_UNPAID_ITEM_HISTORY');
});
test('same item duplicated in request or proof cannot double-count paid amount',()=>{
 const r=req(100,0,{returnedItemIds:['FAKE-ITEM-A','FAKE-ITEM-A']});
 assert.equal(inspect(r).status,'STOP_INVALID_RETURNED_ITEM_CASE');
});
test('same returned item IDs in different order match as a set',()=>{
 const r=req(6000,2000,{returnedItemIds:['FAKE-ITEM-B','FAKE-ITEM-A']});
 assert.equal(inspect(r).status,'SYNTHETIC_AMOUNT_POLICY_MATCH_ONLY_NO_FINANCIAL_AUTHORITY');
});
test('absence of independent history, manager or request always blocks',()=>{
 const r=req();
 assert.equal(inspect(r,null,mgr(r)).status,'STOP_MISSING_INDEPENDENT_PAYMENT_HISTORY');
 assert.equal(inspect(r,proof(r),null).status,'STOP_NO_INDEPENDENT_CASE_MANAGER_APPROVAL');
 assert.equal(review(null).status,'STOP_INVALID_REQUEST');
});
console.log('ACC187_OWNER_PAID_FOR_RETURNED_ITEMS_MINUS_CASH_PLUS_CREDIT_ALREADY_GIVEN=POLICY_CHECK_ONLY');
console.log('ACC187_EXCEPTION_OVER_CEILING=SEPARATE_MANAGER_APPROVAL_REQUIRED');
console.log('ACC187_ITEM_LEVEL_PAYMENT_ALLOCATION_REAL_MANAGER_AUTH_AND_REFUND_POSTING=NOT_IMPLEMENTED');
console.log('ACC187_REAL_CASH_AND_STORE_CREDIT_DISBURSEMENT=ZERO');
console.log('ACCOUNTING_G1_G5=OPEN');
console.log('FINANCE_RELEASE=NO_GO');
