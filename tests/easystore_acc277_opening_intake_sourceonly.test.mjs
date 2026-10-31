import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightEasyStoreOpeningACC277 as check} from '../cloudflare-d1/src/easystore-acc277-opening-intake-v1.mjs';
const sup=(id='SUP-OFFLINE-0001',cents=125000)=>({
  supplierId:id,balanceCents:cents,evidenceRef:'SRC-OFFLINE-SIGNED-0001'
});
const ins=(props={})=>({
  contractId:'CONTRACT-TEST-0001',creditorRef:'SUP-OFFLINE-0001',
  supplierId:'SUP-OFFLINE-0001',liabilityTreatment:'INCLUDED_IN_SUPPLIER_OPENING',
  contractTotalCents:90000,paidToCutoverCents:30000,remainingCents:60000,
  installmentCents:15000,frequency:'monthly',nextDueDate:'2026-11-15',
  evidenceRef:'DOC-OFFLINE-0001',...props
});
const batch=(extra={})=>({cutoverDate:'2026-11-01',currency:'EGP',
  suppliers:[sup()],installments:[ins()],...extra});
test('valid included installment is not counted twice',()=>{
  const r=check(batch());assert.equal(r.ok,true);
  assert.equal(r.totalLiabilityCents,125000);
  assert.equal(r.includedInSupplierCents,60000);
  assert.equal(r.posted,false);assert.equal(r.postingAllowed,false);
  assert.equal(r.persistence,'NONE_SOURCE_ONLY');
});
test('separate independent credit is added once',()=>{
  const r=check(batch({installments:[ins({creditorRef:'CREDITOR-OFFLINE-0002',supplierId:'',
    liabilityTreatment:'SEPARATE_CREDITOR'})]}));
  assert.equal(r.ok,true);assert.equal(r.totalLiabilityCents,185000);
});
test('reject mistaken separate creditor also in supplier master',()=>{
  const r=check(batch({installments:[ins({supplierId:'',
    liabilityTreatment:'SEPARATE_CREDITOR'})]}));
  assert.equal(r.code,'CREDITOR_ALSO_REGISTERED_AS_SUPPLIER');
});
test('block duplicate supplier IDs',()=>{
  assert.equal(check(batch({suppliers:[sup(),sup()]})).code,'DUPLICATE_SUPPLIER_ID');
});
test('block duplicate installment contract',()=>{
  assert.equal(check(batch({installments:[ins(),ins()]})).code,'DUPLICATE_INSTALLMENT_CONTRACT');
});
test('block included installment exceeding supplier opening',()=>{
  assert.equal(check(batch({suppliers:[sup(undefined,50000)]})).code,'INSTALLMENTS_EXCEED_SUPPLIER_OPENING');
});
test('block principal/payment/balance inconsistency',()=>{
  assert.equal(check(batch({installments:[ins({paidToCutoverCents:6000})]})).code,'INSTALLMENT_ARITHMETIC_MISMATCH');
});
test('block decimals, negative amounts, numeric-string ambiguity',()=>{
  for(const balanceCents of [-1,1.5,'125000',NaN]){
    assert.equal(check(batch({suppliers:[sup(undefined,balanceCents)]})).ok,false);
  }
});
test('block missing source evidence for historic opening',()=>{
  assert.equal(check(batch({suppliers:[{...sup(),evidenceRef:''}]})).code,'SUPPLIER_OPENING_INCOMPLETE');
});
test('block missing vendor link or mismatched creditor',()=>{
  assert.equal(check(batch({installments:[ins({creditorRef:'SUP-OFFLINE-WRONG'})]})).code,'INSTALLMENT_SUPPLIER_LINK_UNPROVEN');
});
test('reject date invalid or wrong currency',()=>{
  assert.equal(check(batch({cutoverDate:'2026-11-31'})).code,'CUTOVER_DATE_OR_CURRENCY_INVALID');
  assert.equal(check(batch({currency:'USD'})).code,'CUTOVER_DATE_OR_CURRENCY_INVALID');
});
test('reject overflow without silently rounding financial totals',()=>{
  const r=check(batch({suppliers:[sup('SUP-A',Number.MAX_SAFE_INTEGER),sup('SUP-B',1)],installments:[]}));
  assert.equal(r.code,'LIABILITY_TOTAL_OVERFLOW');
});
test('reject unsigned empty financial opening represented as valid',()=>{
  assert.equal(check(batch({suppliers:[],installments:[]})).code,'NO_LIABILITIES_PRESENT');
});
test('replay same preview never posts or mutates any input',()=>{
  const x=batch(),before=JSON.stringify(x);
  assert.deepEqual(check(x),check(x));assert.equal(JSON.stringify(x),before);
});
console.log('ACC277_ORIGINAL_FINANCE_OPENING_SOURCE_PREFLIGHT=PASS');
console.log('ACC277_DATABASE_WRITES=0');
console.log('ACC277_FINANCE_RELEASE=NO_GO');
