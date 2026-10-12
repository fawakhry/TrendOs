import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACC187_RETURN_TIME_OWNER_DECISION as policy,
  inspectReturnTimingDecision as inspect,
  inspectPersonalizedReturnWithTiming as combine,
} from '../scripts/easystore_acc187_discretionary_timing_review_no_go.mjs';

const base = (submittedAt='2026-10-12T10:00:00.000Z',refundMethod='CASH_REFUND')=>({
  invoiceId:'FAKE-INVOICE-901',
  requestId:'FAKE-REQUEST-901',
  itemId:'FAKE-ITEM-901',
  submittedAt,
  personalizationType:'CUSTOMER_PHOTO',
  reason:'MANUFACTURING_DEFECT',
  refundMethod,amount:25,
});
const management = (r,decision='ALLOW_TIMING_REVIEW')=>({
  source:'SYNTHETIC_INDEPENDENT_MANAGEMENT_TIMING_REVIEW',
  verifiedManager:true,
  reviewId:'FAKE-TIMING-REVIEW-901',decision,
  invoiceId:r.invoiceId,requestId:r.requestId,itemId:r.itemId,
  submittedAt:r.submittedAt,
});
const quality = r=>({
  source:'SYNTHETIC_INDEPENDENT_QUALITY_REVIEW',
  decision:'EXCEPTION_CONFIRMED',verified:true,
  evidenceRef:'FAKE-EVIDENCE-901',
  invoiceId:r.invoiceId,requestId:r.requestId,itemId:r.itemId,
  personalizationType:r.personalizationType,reason:r.reason,
});
const settlement = r=>({
  source:'SYNTHETIC_BACKEND_VERIFIED_MANAGER',verifiedManager:true,
  decision:'APPROVED',approvalId:'FAKE-SETTLEMENT-REVIEW-901',
  invoiceId:r.invoiceId,requestId:r.requestId,itemId:r.itemId,
  refundMethod:r.refundMethod,amount:r.amount,
});
const noFinance = v => {
  assert.equal(v.release_decision,'NO_GO');
  assert.equal(v.owner_gates,'G1_G2_G3_G4_G5_OPEN');
  assert.equal(v.return_approved,false);
  assert.equal(v.financial_posting_allowed,false);
};
test('owner chose per-case discretion, not 7 or 14 days',()=>{
  assert.equal(policy.policy,'CASE_BY_CASE_MANAGEMENT_TIMING_REVIEW');
  assert.equal(policy.fixed_days,null);
  assert.equal(policy.auto_expiry,false);
  assert.equal(policy.automatic_time_approval,false);
  assert.equal(policy.requires_independent_per_case_management_review,true);
  assert.equal(policy.statutory_rights_override,true);
  assert.equal(policy.real_verifier_implemented,false);
  assert.equal(policy.can_refund,false);
  assert.equal(policy.can_credit,false);
});
for(const date of [
  '2026-10-12T10:00:00.000Z', // same day
  '2026-10-08T10:00:00.000Z', // inside 7d
  '2026-09-29T10:00:00.000Z', // inside 14d
  '2026-08-01T10:00:00.000Z', // >14d
  '2024-01-01T10:00:00.000Z', // far outside any 7/14d window
  '2018-12-31T10:00:00.000Z', // older historical fake case
]){
  test('no automatic rejection by age, independent synthetic manager may review: '+date,()=>{
    const r=base(date),out=inspect(r,management(r));
    assert.equal(out.status,'FAKE_TIMING_REVIEW_MATCHED_NOT_A_RETURN_APPROVAL');
    assert.equal(out.management_timing_review_matched,true);
    assert.equal(out.cash_refund_allowed,false);
    assert.equal(out.customer_credit_allowed,false);
    noFinance(out);
  });
  test('no automatic acceptance by age; missing manager blocks: '+date,()=>{
    const r=base(date),out=inspect({...r,role:'admin',approved:true,
      managementDecision:management(r),allowedDays:365,ageDays:0});
    assert.equal(out.status,'STOP_NO_INDEPENDENT_MANAGEMENT_TIMING_REVIEW');
    assert.equal(out.management_timing_review_matched,false);
    noFinance(out);
  });
}
test('manager refusal blocks even an otherwise very recent case',()=>{
  const r=base();
  const out=inspect(r,management(r,'DENY_TIMING_REVIEW'));
  assert.equal(out.status,'STOP_MANAGEMENT_TIMING_REVIEW_DECLINED');
  noFinance(out);
});
for(const [name,patch] of [
  ['not an independent source',{source:'SELF_ASSERTED_CLIENT'}],
  ['no trusted identity',{verifiedManager:false}],
  ['not a decision',{decision:'PENDING'}],
  ['garbage decision',{decision:'AUTOMATIC_7_DAYS'}],
  ['missing review evidence',{reviewId:''}],
]){
  test('unverified timing manager record is blocked: '+name,()=>{
    const r=base(),out=inspect(r,{...management(r),...patch});
    assert.equal(out.status,'STOP_MANAGEMENT_TIMING_REVIEW_UNVERIFIED');
    noFinance(out);
  });
}
for(const [name,patch] of [
  ['different invoice',{invoiceId:'FAKE-INVOICE-OTHER'}],
  ['different request',{requestId:'FAKE-REQUEST-OTHER'}],
  ['different item',{itemId:'FAKE-ITEM-OTHER'}],
  ['different submission timestamp',{submittedAt:'2026-10-11T10:00:00.000Z'}],
]){
  test('manager timing decision cannot be transferred to '+name,()=>{
    const r=base(),out=inspect(r,{...management(r),...patch});
    assert.equal(out.status,'STOP_TIMING_APPROVAL_CASE_BINDING_MISMATCH');
    noFinance(out);
  });
}
for(const [name,patch] of [
  ['missing invoice',{invoiceId:''}],
  ['missing request',{requestId:undefined}],
  ['missing item',{itemId:null}],
  ['missing timestamp',{submittedAt:undefined}],
  ['non ISO timestamp',{submittedAt:'12/10/2026'}],
  ['invalid day',{submittedAt:'2026-02-30T10:00:00.000Z'}],
]){
  test('malformed audit record fails closed without imposing time cutoff: '+name,()=>{
    const r={...base(),...patch};
    const out=inspect(r,management(r));
    assert.equal(out.status,'STOP_INCOMPLETE_RETURN_TIMING_RECORD');
    noFinance(out);
  });
}
for(const method of ['CASH_REFUND','CUSTOMER_CREDIT']){
  test('all three mock review records match: '+method+' — STILL NO POSTING',()=>{
    const r=base('2018-12-31T10:00:00.000Z',method);
    const out=combine(r,quality(r),settlement(r),management(r));
    assert.equal(out.status,'ALL_FAKE_REVIEW_PREREQUISITES_MATCHED_NO_REAL_RETURN_NO_POSTING');
    assert.equal(out.timing_review.management_timing_review_matched,true);
    assert.equal(out.settlement_review.method_review.management_approval_record_matches,true);
    assert.equal(out.refund_authorized,false);
    assert.equal(out.customer_credit_authorized,false);
    noFinance(out);
  });
  test('quality and method cannot override missing timing review: '+method,()=>{
    const r=base(undefined,method);
    const out=combine(r,quality(r),settlement(r),null);
    assert.equal(out.status,'STOP_TIMING_REVIEW_NOT_APPROVED');
    noFinance(out);
  });
  test('timing review cannot bypass unverified custom product defect: '+method,()=>{
    const r=base(undefined,method);
    const out=combine(r,null,settlement(r),management(r));
    assert.equal(out.status,'STOP_OTHER_RETURN_PREREQUISITE');
    noFinance(out);
  });
  test('timing and defect evidence cannot bypass no manager settlement approval: '+method,()=>{
    const r=base(undefined,method);
    const out=combine(r,quality(r),null,management(r));
    assert.equal(out.status,'STOP_OTHER_RETURN_PREREQUISITE');
    noFinance(out);
  });
  test('timing cannot override change of mind in personalized product: '+method,()=>{
    const r={...base(undefined,method),reason:'CHANGED_MIND'};
    const out=combine(r,quality(r),settlement(r),management(r));
    assert.equal(out.status,'STOP_OTHER_RETURN_PREREQUISITE');
    noFinance(out);
  });
}
console.log('ACC187_OWNER_RETURN_TIMING=PER_CASE_MANAGEMENT_DISCRETION_NO_FIXED_DAYS');
console.log('ACC187_INDEPENDENT_MANAGER_TIME_REVIEW=FAKE_ONLY');
console.log('ACC187_PERSONALIZED_SELLER_FAULT_AND_SETTLEMENT_MANAGER_REMAIN_REQUIRED');
console.log('ACC187_STATUTORY_CUSTOMER_RIGHTS=NOT_OVERRIDDEN');
console.log('ACC187_PRODUCTION_FINANCIAL_POSTS=ZERO');
console.log('FINANCE_RELEASE=NO_GO');
