import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ACC187_PERSONALIZED_RETURN_ELIGIBILITY_DECISION as policy,
 inspectPersonalizedReturnEligibility as inspect,
 inspectPersonalizedSettlementProposal as combine,
} from '../scripts/easystore_acc187_owner_refund_method_contract_no_go.mjs';

const fakeCase=(type='CUSTOMER_NAME', reason='MANUFACTURING_DEFECT', method='CASH_REFUND')=>({
  invoiceId:'FAKE-INVOICE-101',requestId:'FAKE-RETURN-101',
  itemId:'FAKE-ITEM-101',personalizationType:type,reason,
  refundMethod:method,amount:25,
});
const fakeEvidence=(r)=>({
  source:'SYNTHETIC_INDEPENDENT_QUALITY_REVIEW',
  decision:'EXCEPTION_CONFIRMED',verified:true,
  evidenceRef:'SYNTHETIC-EVIDENCE-101',
  invoiceId:r.invoiceId,requestId:r.requestId,itemId:r.itemId,
  personalizationType:r.personalizationType,reason:r.reason,
});
const fakeManager=(r)=>({
  source:'SYNTHETIC_BACKEND_VERIFIED_MANAGER',
  verifiedManager:true,decision:'APPROVED',
  approvalId:'SYNTHETIC-MANAGER-APPROVAL-101',
  invoiceId:r.invoiceId,requestId:r.requestId,itemId:r.itemId,
  refundMethod:r.refundMethod,amount:r.amount,
});
function assertNeverPosts(v){
  assert.equal(v.release_decision,'NO_GO');
  assert.equal(v.owner_gates,'G1_G2_G3_G4_G5_OPEN');
  assert.equal(v.actual_return_approved,false);
  assert.equal(v.refund_authorized,false);
  assert.equal(v.customer_credit_authorized,false);
  assert.equal(v.financial_posting_allowed,false);
}
function assertCombinedNeverPosts(v){
  assert.equal(v.release_decision,'NO_GO');
  assert.equal(v.owner_gates,'G1_G2_G3_G4_G5_OPEN');
  assert.equal(v.financial_posting_allowed,false);
  assert.equal(v.customer_credit_posting_allowed,false);
  assert.equal(v.return_approved,false);
}
test('owner policy is limited to personalized name/photo items and two exception reasons',()=>{
  assert.deepEqual([...policy.personalized_categories],['CUSTOMER_NAME','CUSTOMER_PHOTO','CUSTOMER_NAME_AND_PHOTO']);
  assert.deepEqual([...policy.exception_reasons],['MANUFACTURING_DEFECT','TREND_MALL_ERROR']);
  assert.equal(policy.change_of_mind_allowed,false);
  assert.equal(policy.customer_supplied_error_alone_allowed,false);
  assert.equal(policy.management_approval_per_case_still_required,true);
  assert.equal(policy.other_product_eligibility,'NOT_YET_DECIDED');
  assert.equal(policy.release_decision,'NO_GO');
});
for(const type of policy.personalized_categories){
  for(const reason of policy.exception_reasons){
    test(type+' '+reason+' matching synthetic evidence permits review only',()=>{
      const r=fakeCase(type,reason);
      const out=inspect(r,fakeEvidence(r));
      assert.equal(out.status,'EXCEPTION_MATCHED_IN_FAKE_REVIEW_ONLY');
      assert.equal(out.eligible_for_management_review_only,true);
      assertNeverPosts(out);
    });
  }
}
for(const reason of ['CHANGED_MIND','WRONG_SIZE_CHOSEN_BY_CUSTOMER','CUSTOMER_PHOTO_UPLOAD_ERROR','DISLIKED_COLOR','NO_REASON',null]){
  test('custom name/photo return without accepted seller-fault exception is rejected '+String(reason),()=>{
    const r=fakeCase('CUSTOMER_PHOTO',reason);
    const out=inspect(r,fakeEvidence(r));
    assert.equal(out.status,'REJECT_PERSONALIZED_RETURN_WITHOUT_ALLOWED_EXCEPTION');
    assertNeverPosts(out);
  });
}
test('ordinary products require a distinct undecided policy, never implicit refusal or approval',()=>{
 const r=fakeCase('STANDARD_GOOD');
 const out=inspect(r,fakeEvidence(r));
 assert.equal(out.status,'STOP_OUTSIDE_DECIDED_PERSONALIZED_SCOPE');
 assertNeverPosts(out);
});
test('unrecognized customization type cannot silently bypass scope',()=>{
 const r=fakeCase('CUSTOM_OTHER');
 assert.equal(inspect(r,fakeEvidence(r)).status,'STOP_OUTSIDE_DECIDED_PERSONALIZED_SCOPE');
});
test('missing independent quality evidence cannot be replaced by client defect claim',()=>{
 const r={...fakeCase(),claimedDefect:true,role:'admin',approved:true,evidence:fakeEvidence(fakeCase())};
 const out=inspect(r);
 assert.equal(out.status,'STOP_CLAIMED_EXCEPTION_NOT_INDEPENDENTLY_VERIFIED');
 assertNeverPosts(out);
});
for(const [name,patch] of [
 ['client-asserted source',{source:'CLIENT_ASSERTED'}],
 ['not independently verified',{verified:false}],
 ['unconfirmed quality review',{decision:'PENDING'}],
 ['no evidence reference',{evidenceRef:''}],
]){
 test('unverified evidence '+name+' denied',()=>{
  const r=fakeCase(),e={...fakeEvidence(r),...patch};
  const out=inspect(r,e);
  assert.equal(out.status,'STOP_UNVERIFIED_RETURN_EVIDENCE');
  assertNeverPosts(out);
 });
}
for(const [name,patch] of [
 ['invoice mismatch',{invoiceId:'FAKE-OTHER-INVOICE'}],
 ['item mismatch',{itemId:'FAKE-OTHER-ITEM'}],
 ['different return request',{requestId:'FAKE-OTHER-RETURN'}],
 ['different product personalization',{personalizationType:'CUSTOMER_PHOTO'}],
 ['reason swapped to merchant error',{reason:'TREND_MALL_ERROR'}],
]){
 test('unrelated evidence never transferred: '+name,()=>{
  const r=fakeCase(),e={...fakeEvidence(r),...patch};
  const out=inspect(r,e);
  assert.equal(out.status,'STOP_RETURN_EVIDENCE_CASE_MISMATCH');
  assertNeverPosts(out);
 });
}
for(const [name,patch] of [
 ['no invoice',{invoiceId:''}],
 ['no item',{itemId:null}],
 ['no request',{requestId:''}],
]){
 test('missing case binding denied: '+name,()=>{
  const r={...fakeCase(),...patch};
  assert.equal(inspect(r,fakeEvidence(fakeCase())).status,'REJECT_INCOMPLETE_RETURN_CASE');
 });
}
for(const method of ['CASH_REFUND','CUSTOMER_CREDIT']){
 test(method+' review requires both separate synthetic evidence and matching management decision',()=>{
  const r=fakeCase('CUSTOMER_NAME_AND_PHOTO','TREND_MALL_ERROR',method);
  const out=combine(r,fakeEvidence(r),fakeManager(r));
  assert.equal(out.status,'SYNTHETIC_EXCEPTION_AND_MANAGER_METHOD_MATCH_BUT_NO_POSTING');
  assert.equal(out.method_review.management_approval_record_matches,true);
  assertCombinedNeverPosts(out);
 });
 test(method+' no verified defect or error evidence blocks any review even with manager record',()=>{
  const r=fakeCase('CUSTOMER_NAME','MANUFACTURING_DEFECT',method);
  const out=combine(r,null,fakeManager(r));
  assert.equal(out.status,'STOP_PERSONALIZED_ELIGIBILITY');
  assertCombinedNeverPosts(out);
 });
 test(method+' eligibility alone is not manager authorization',()=>{
  const r=fakeCase('CUSTOMER_PHOTO','TREND_MALL_ERROR',method);
  const out=combine(r,fakeEvidence(r),null);
  assert.equal(out.status,'STOP_MANAGER_APPROVAL_ITEM_MISMATCH');
  assertCombinedNeverPosts(out);
 });
}
for(const [name,patch] of [
 ['item mismatch',{itemId:'FAKE-OTHER-ITEM'}],
 ['wrong settlement choice',{refundMethod:'CUSTOMER_CREDIT'}],
 ['wrong amount',{amount:30}],
 ['wrong invoice',{invoiceId:'FAKE-OTHER-INVOICE'}],
 ['wrong return request',{requestId:'FAKE-OTHER-REQUEST'}],
]){
 test('management approval cannot be recycled: '+name,()=>{
  const r=fakeCase();
  const out=combine(r,fakeEvidence(r),{...fakeManager(r),...patch});
  assert.match(out.status,/^STOP_MANAGER_APPROVAL_ITEM_MISMATCH$|^STOP_MANAGEMENT_SETTLEMENT_APPROVAL$/);
  assertCombinedNeverPosts(out);
 });
}
test('even synthetic verified exception and manager agreement cannot authorize real payout or store credit',()=>{
 const r=fakeCase();
 const out=combine(r,fakeEvidence(r),fakeManager(r));
 assertCombinedNeverPosts(out);
 assert.equal(out.exception_review.actual_return_approved,false);
 assert.equal(out.method_review.can_post_money,false);
 assert.equal(out.method_review.can_credit_customer_account,false);
});
console.log('ACC187_CUSTOM_NAME_PHOTO_ONLY_SELLER_FAULT_DEFECT_EXCEPTION_REVIEW=PASS');
console.log('ACC187_CUSTOMER_CHANGED_MIND_AND_UNVERIFIED_DEFECT=DENIED');
console.log('ACC187_CASH_OR_CREDIT_CASE_SPECIFIC_MANAGER_APPROVAL_REQUIRED=PASS');
console.log('ACC187_REAL_REFUND_CUSTOMER_CREDIT_AND_BACKEND_MANAGEMENT_VERIFIER=NOT_IMPLEMENTED');
console.log('G1_G2_G3_G4_G5=OPEN');
console.log('FINANCE_RELEASE=NO_GO');
