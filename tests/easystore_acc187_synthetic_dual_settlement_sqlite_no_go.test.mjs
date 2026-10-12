// ACC187 rehearsal ONLY. All data/approval IDs are synthetic and never real.
// Does NOT decide real amount entitlements, authenticate staff or post cash/credit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {inspectPersonalizedReturnWithTiming} from '../scripts/easystore_acc187_discretionary_timing_review_no_go.mjs';

const db=new DatabaseSync(':memory:');
db.exec("PRAGMA foreign_keys=ON;"+
 "CREATE TABLE fake_sale(invoice_id TEXT PRIMARY KEY,collected_cents INTEGER NOT NULL CHECK(collected_cents>=0));"+
 "CREATE TABLE fake_settlement(request_id TEXT PRIMARY KEY,invoice_id TEXT NOT NULL REFERENCES fake_sale(invoice_id),"+
 "item_id TEXT NOT NULL,method TEXT NOT NULL CHECK(method IN ('CASH_REFUND','CUSTOMER_CREDIT')),"+
 "cents INTEGER NOT NULL CHECK(cents>0));"+
 "CREATE TRIGGER fake_no_double_compensation BEFORE INSERT ON fake_settlement BEGIN "+
 "SELECT CASE WHEN (SELECT COALESCE(SUM(cents),0) FROM fake_settlement WHERE invoice_id=NEW.invoice_id)"+
 "+NEW.cents > (SELECT collected_cents FROM fake_sale WHERE invoice_id=NEW.invoice_id) "+
 "THEN RAISE(ABORT,'FAKE_TOTAL_EXCEEDS_PRETEND_COLLECTED') END; END;");
db.prepare('INSERT INTO fake_sale VALUES(?,?)').run('FAKE-INVOICE-300',10000);
db.prepare('INSERT INTO fake_sale VALUES(?,?)').run('FAKE-INVOICE-400',1500);
const req=(requestId,method='CASH_REFUND',cents=3000,invoiceId='FAKE-INVOICE-300')=>({
 invoiceId,requestId,itemId:'FAKE-ITEM-300',
 submittedAt:'2018-12-31T10:00:00.000Z',
 personalizationType:'CUSTOMER_NAME_AND_PHOTO',
 reason:'TREND_MALL_ERROR',refundMethod:method,amount:cents/100,
});
const quality=r=>({
 source:'SYNTHETIC_INDEPENDENT_QUALITY_REVIEW',verified:true,
 decision:'EXCEPTION_CONFIRMED',evidenceRef:'FAKE-QUALITY-EVIDENCE-300',
 invoiceId:r.invoiceId,requestId:r.requestId,itemId:r.itemId,
 personalizationType:r.personalizationType,reason:r.reason,
});
const manager=r=>({
 source:'SYNTHETIC_BACKEND_VERIFIED_MANAGER',verifiedManager:true,
 decision:'APPROVED',approvalId:'FAKE-MANAGER-REVIEW-300',
 invoiceId:r.invoiceId,requestId:r.requestId,itemId:r.itemId,
 refundMethod:r.refundMethod,amount:r.amount,
});
const timing=r=>({
 source:'SYNTHETIC_INDEPENDENT_MANAGEMENT_TIMING_REVIEW',
 verifiedManager:true,decision:'ALLOW_TIMING_REVIEW',
 reviewId:'FAKE-TIMING-REVIEW-300',
 invoiceId:r.invoiceId,requestId:r.requestId,itemId:r.itemId,submittedAt:r.submittedAt,
});
const snapshot=()=>JSON.stringify(db.prepare(
 'SELECT request_id,invoice_id,item_id,method,cents FROM fake_settlement ORDER BY request_id'
).all());
const totals=invoice=>db.prepare(
 'SELECT method, SUM(cents) AS cents FROM fake_settlement WHERE invoice_id=? GROUP BY method ORDER BY method'
).all(invoice);
const NO_AUTHORITY=Object.freeze({
 can_transfer_cash:false,can_credit_customer:false,real_refund_handler_exists:false,
 real_manager_verified:false,owner_amount_policy_approved:false,
 actual_financial_acceptance:false,finance_release:'NO_GO',
 gates:'G1_G2_G3_G4_G5_OPEN',
});
function rehearse(r,syntheticReviews=true) {
 const review=inspectPersonalizedReturnWithTiming(r,
  syntheticReviews?quality(r):null,
  syntheticReviews?manager(r):null,
  syntheticReviews?timing(r):null);
 if(review.status!=='ALL_FAKE_REVIEW_PREREQUISITES_MATCHED_NO_REAL_RETURN_NO_POSTING')
  return {outcome:'STOP_FAKE_REVIEW_MISSING',...NO_AUTHORITY};
 const amountInCents=r.amount*100;
 if(!Number.isSafeInteger(amountInCents)||amountInCents<1)
  return {outcome:'STOP_UNSAFE_MINOR_UNITS',...NO_AUTHORITY};
 if(!['CASH_REFUND','CUSTOMER_CREDIT'].includes(r.refundMethod))
  return {outcome:'STOP_INVALID_METHOD',...NO_AUTHORITY};
 const sale=db.prepare('SELECT collected_cents FROM fake_sale WHERE invoice_id=?').get(r.invoiceId);
 if(!sale) return {outcome:'STOP_NO_FAKE_INVOICE',...NO_AUTHORITY};
 const existing=db.prepare('SELECT * FROM fake_settlement WHERE request_id=?').get(r.requestId);
 if(existing){
  const same=existing.invoice_id===r.invoiceId&&existing.item_id===r.itemId&&
   existing.method===r.refundMethod&&existing.cents===amountInCents;
  return {outcome:same?'FAKE_IDEMPOTENT_REPEAT_NO_CHANGE':'STOP_FAKE_REQUEST_KEY_COLLISION',...NO_AUTHORITY};
 }
 db.exec('BEGIN IMMEDIATE');
 try {
  db.prepare('INSERT INTO fake_settlement VALUES(?,?,?,?,?)')
   .run(r.requestId,r.invoiceId,r.itemId,r.refundMethod,amountInCents);
  db.exec('COMMIT');
  return {outcome:'FAKE_LEDGER_REHEARSAL_ONLY_NOT_FINANCE',...NO_AUTHORITY};
 }catch(err){
  db.exec('ROLLBACK');
  if(String(err.message).includes('FAKE_TOTAL_EXCEEDS_PRETEND_COLLECTED'))
   return {outcome:'STOP_FAKE_COMBINED_CEILING',...NO_AUTHORITY};
  throw err;
 }
}
function neverReal(x){
 assert.equal(x.can_transfer_cash,false);
 assert.equal(x.can_credit_customer,false);
 assert.equal(x.real_refund_handler_exists,false);
 assert.equal(x.real_manager_verified,false);
 assert.equal(x.owner_amount_policy_approved,false);
 assert.equal(x.actual_financial_acceptance,false);
 assert.equal(x.finance_release,'NO_GO');
 assert.equal(x.gates,'G1_G2_G3_G4_G5_OPEN');
}
test('synthetic cap is a conservative rehearsal, owner amount policy NOT defined',()=>{
 neverReal(NO_AUTHORITY);
 assert.equal(snapshot(),'[]');
});
test('fake cash and credit share one invented maximum per invoice',()=>{
 for(const [id,route,cents] of [
  ['FAKE-CASE-301','CASH_REFUND',3000],
  ['FAKE-CASE-302','CUSTOMER_CREDIT',5000],
  ['FAKE-CASE-303','CASH_REFUND',2000],
 ]){
  const out=rehearse(req(id,route,cents));
  assert.equal(out.outcome,'FAKE_LEDGER_REHEARSAL_ONLY_NOT_FINANCE');
  neverReal(out);
 }
 assert.deepEqual(totals('FAKE-INVOICE-300'),[
  {method:'CASH_REFUND',cents:5000},
  {method:'CUSTOMER_CREDIT',cents:5000},
 ]);
});
test('after fake cap exhausted, neither route can add one cent',()=>{
 const old=snapshot();
 for(const [i,route] of ['CASH_REFUND','CUSTOMER_CREDIT'].entries()){
  const outcome=rehearse(req('FAKE-EXCESS-00'+i,route,1));
  assert.equal(outcome.outcome,'STOP_FAKE_COMBINED_CEILING');
  neverReal(outcome);
  assert.equal(snapshot(),old);
 }
});
test('idempotent retries do not duplicate fake settlement',()=>{
 const old=snapshot();
 const x=rehearse(req('FAKE-CASE-302','CUSTOMER_CREDIT',5000));
 assert.equal(x.outcome,'FAKE_IDEMPOTENT_REPEAT_NO_CHANGE');
 assert.equal(snapshot(),old);
});
test('same id cannot be recycled for another route, amount, invoice',()=>{
 const old=snapshot();
 for(const item of [
  req('FAKE-CASE-302','CASH_REFUND',5000),
  req('FAKE-CASE-302','CUSTOMER_CREDIT',6000),
  req('FAKE-CASE-301','CASH_REFUND',3000,'FAKE-INVOICE-400')
 ]){
  const x=rehearse(item);
  assert.equal(x.outcome,'STOP_FAKE_REQUEST_KEY_COLLISION');
  assert.equal(snapshot(),old);
 }
});
test('two fake invoices remain independently capped',()=>{
 const x=rehearse(req('FAKE-CASE-401','CASH_REFUND',1000,'FAKE-INVOICE-400'));
 assert.equal(x.outcome,'FAKE_LEDGER_REHEARSAL_ONLY_NOT_FINANCE');
 neverReal(x);
 assert.deepEqual(totals('FAKE-INVOICE-400'),[{method:'CASH_REFUND',cents:1000}]);
 const old=snapshot();
 const denied=rehearse(req('FAKE-CASE-402','CUSTOMER_CREDIT',501,'FAKE-INVOICE-400'));
 assert.equal(denied.outcome,'STOP_FAKE_COMBINED_CEILING');
 assert.equal(snapshot(),old);
});
test('missing fake approvals cannot produce even fake ledger events',()=>{
 const old=snapshot();
 const x=rehearse(req('FAKE-UNVERIFIED-001','CASH_REFUND',100),false);
 assert.equal(x.outcome,'STOP_FAKE_REVIEW_MISSING');
 neverReal(x);assert.equal(snapshot(),old);
});
test('changed mind on name/photo item cannot bypass quality gate',()=>{
 const old=snapshot();
 const x=rehearse({...req('FAKE-CHANGED-MIND-001'),reason:'CHANGED_MIND'});
 assert.equal(x.outcome,'STOP_FAKE_REVIEW_MISSING');
 assert.equal(snapshot(),old);
});
test('bad fake sums and unknown invoices preserve all fake ledger rows',()=>{
 const old=snapshot();
 for(const amt of [-1,0,Infinity,NaN,.001]){
  const x=rehearse(req('FAKE-BAD-001','CASH_REFUND',amt));
  assert.notEqual(x.outcome,'FAKE_LEDGER_REHEARSAL_ONLY_NOT_FINANCE');
  neverReal(x);
  assert.equal(snapshot(),old);
 }
 const y=rehearse(req('FAKE-NO-INV-001','CASH_REFUND',100,'FAKE-INVOICE-999'));
 assert.equal(y.outcome,'STOP_NO_FAKE_INVOICE');
 assert.equal(snapshot(),old);
});
test('fixture contains only test-named tables, not any actual accounting table',()=>{
 assert.deepEqual(db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
 ).all().map(z=>z.name),['fake_sale','fake_settlement']);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fake_settlement').get().n,4);
});
test.after(()=>db.close());
console.log('ACC187_COMBINED_CASH_CREDIT_FAKE_CEILING_AND_IDEMPOTENCY=OFFLINE_ONLY');
console.log('ACC187_OWNER_REAL_AMOUNT_ENTITLEMENT_AND_PAYOUT_RULES=UNDECIDED');
console.log('ACC187_FINANCIAL_AUTHORITY=NONE');
console.log('FINANCE_RELEASE=NO_GO');
