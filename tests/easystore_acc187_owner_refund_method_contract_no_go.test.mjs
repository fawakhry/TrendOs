import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ACC187_OWNER_METHOD_DECISION,
 inspectRefundMethodProposal,
} from '../scripts/easystore_acc187_owner_refund_method_contract_no_go.mjs';

// All IDs, amounts and 'approval' objects here are INVENTED, not employees.
// Actual backend role validation, posting and cutover are intentionally absent.
const intent=(refundMethod='CASH_REFUND')=>({
 refundMethod,invoiceId:'FAKE-INVOICE-0001',requestId:'FAKE-REQUEST-0001',
 amount:25,
});
const syntheticApproval=(refundMethod='CASH_REFUND')=>({
 source:'SYNTHETIC_BACKEND_VERIFIED_MANAGER',verifiedManager:true,
 decision:'APPROVED',approvalId:'FAKE-MANAGER-APPROVAL-0001',
 invoiceId:'FAKE-INVOICE-0001',requestId:'FAKE-REQUEST-0001',
 refundMethod,amount:25,
});
const checkNoAuthority = result => {
 assert.equal(result.can_post_money,false);
 assert.equal(result.can_credit_customer_account,false);
 assert.equal(result.authorized_to_deploy,false);
 assert.equal(result.release_decision,'NO_GO');
 assert.equal(result.owner_gates,'G1_G2_G3_G4_G5_OPEN');
 assert.equal(result.unresolved_requirements.length,8);
};
test('owner allows ONLY two method choices and no auto execution',()=>{
 assert.equal(ACC187_OWNER_METHOD_DECISION.decision_scope,'REFUND_SETTLEMENT_METHOD_ONLY');
 assert.equal(ACC187_OWNER_METHOD_DECISION.both_without_approval,false);
 assert.equal(ACC187_OWNER_METHOD_DECISION.refund_handler_implemented,false);
 assert.equal(ACC187_OWNER_METHOD_DECISION.release_decision,'NO_GO');
});
for(const mode of ['CASH_REFUND','CUSTOMER_CREDIT']){
 test('owner-approved method '+mode+' has no financial write authority',()=>{
  const x=inspectRefundMethodProposal(intent(mode),syntheticApproval(mode));
  assert.equal(x.status,'METHOD_APPROVAL_MATCHES_FAKE_VERIFIER_BUT_POSTING_BLOCKED');
  assert.equal(x.management_approval_record_matches,true);
  checkNoAuthority(x);
 });
 test('missing management approval rejected for '+mode,()=>{
  const x=inspectRefundMethodProposal(intent(mode));
  assert.equal(x.status,'STOP_NO_INDEPENDENT_MANAGEMENT_APPROVAL');
  checkNoAuthority(x);
 });
}
test('forged client approval is never trusted',()=>{
 const i={...intent(),managementApproval:syntheticApproval(),role:'admin',approved:true};
 const r=inspectRefundMethodProposal(i);
 assert.equal(r.status,'STOP_NO_INDEPENDENT_MANAGEMENT_APPROVAL');
 checkNoAuthority(r);
});
test('invalid settlement method refused',()=>{
 const r=inspectRefundMethodProposal(intent('SILENT_LEDGER_ADJUSTMENT'),syntheticApproval());
 assert.equal(r.status,'REJECT_UNAUTHORIZED_METHOD');
 checkNoAuthority(r);
});
test('empty payload cannot create authority',()=>{
 const r=inspectRefundMethodProposal(null);
 assert.equal(r.status,'REJECT_INVALID_REQUEST');
 checkNoAuthority(r);
});
test('missing invoice fails closed',()=>{
 const r=inspectRefundMethodProposal({...intent(),invoiceId:''},syntheticApproval());
 assert.equal(r.status,'REJECT_INCOMPLETE_CASE_BINDING');
 checkNoAuthority(r);
});
test('missing request id fails closed',()=>{
 const r=inspectRefundMethodProposal({...intent(),requestId:''},syntheticApproval());
 assert.equal(r.status,'REJECT_INCOMPLETE_CASE_BINDING');
 checkNoAuthority(r);
});
for(const amount of [0,-10,Infinity,NaN,'25',0.001]){
 test('non-positive, unsafe or non-number amount rejected: '+String(amount),()=>{
  const r=inspectRefundMethodProposal({...intent(),amount},syntheticApproval());
  assert.equal(r.status,'REJECT_INCOMPLETE_CASE_BINDING');
  checkNoAuthority(r);
 });
}
for(const [name,patch] of [
 ['invalid approval source',{source:'CLIENT_ASSERTED'}],
 ['unchecked manager',{verifiedManager:false}],
 ['denied',{decision:'DENIED'}],
 ['pending',{decision:'PENDING'}],
 ['missing approval id',{approvalId:''}],
]){
 test('management evidence '+name+' rejects',()=>{
  const r=inspectRefundMethodProposal(intent(),{...syntheticApproval(),...patch});
  assert.equal(r.status,'STOP_MANAGEMENT_APPROVAL_UNVERIFIED');
  checkNoAuthority(r);
 });
}
for(const [name,patch] of [
 ['invoice replay',{invoiceId:'FAKE-INVOICE-OTHER'}],
 ['request id replay',{requestId:'FAKE-REQUEST-OTHER'}],
 ['amount mismatch',{amount:30}],
 ['switch cash to credit',{refundMethod:'CUSTOMER_CREDIT'}],
]){
 test('approval cannot transfer across '+name,()=>{
  const r=inspectRefundMethodProposal(intent(),{...syntheticApproval(),...patch});
  assert.equal(r.status,'STOP_APPROVAL_CASE_OR_METHOD_MISMATCH');
  checkNoAuthority(r);
 });
}
console.log('ACC187_OWNER_CASH_OR_CREDIT_WITH_EACH_CASE_MANAGER_APPROVAL=SOURCE_POLICY_ONLY');
console.log('ACC187_REAL_BACKEND_VERIFIED_MANAGER=NOT_IMPLEMENTED');
console.log('ACC187_REFUND_POSTING_AND_CUSTOMER_CREDIT=NOT_IMPLEMENTED');
console.log('ACC187_FINANCE_RELEASE=NO_GO');
