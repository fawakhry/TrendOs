// No Apps Script/Google/Sheets API is called. Extract Legacy handler only and
// simulate a previously COMMITTED synthetic invoice after a lost client ACK.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../Code.gs',import.meta.url),'utf8');
const a=code.indexOf('function saveAccountingFinalInvoice_(e) {');
const b=code.indexOf('\nfunction reopenAccountingFinalInvoice_(e) {',a);
assert.ok(a>=0&&b>a,'missing Legacy final invoice source');
const source=code.slice(a,b);
const existing={
  'مفتاح العملية':'FIN-11111111-1111-4111-8111-111111111111',
  'رقم الفاتورة':'INV-SYNTHETIC-001',
  'الإجمالي النهائي':120,
  'الباقي':20,
  'المدفوع':100,
  'اسم العميل':'Synthetic Only',
  'طريقة الدفع':'إنستاباي',
  'القسم المالي':'طباعة',
  'رقم الأوردر':'FAKE-ORDER-01',
  'مدفوع محمول من فاتورة سابقة':0
};
const cols={};Object.keys(existing).forEach((k,i)=>cols[k]=i+1);
const row=Object.keys(existing).map(k=>existing[k]);
function fixture({authorized=true}={}){
  const calls={lock:0,released:0,reads:0,appends:0,finance:0,held:0,consume:0};
  const finalInvoices={
    getLastRow(){return 2;},
    getLastColumn(){return row.length;},
    getRange(){calls.reads++;return {getValues(){return [row];}};}
  };
  const ctx={
    accountingAuthorize_:()=>authorized?{ok:true,mode:'final',user:{username:'FICTIONAL-STAFF'}}:{ok:false,message:'expired synthetic session'},
    LockService:{getScriptLock(){return{
      waitLock(){calls.lock++;},releaseLock(){calls.released++;}
    };}},
    normalize_:v=>String(v==null?'':v).trim(),
    ensureAccountingSheets_:()=>({finalInvoices}),
    headersMap_:()=>({...cols}),
    firstCol_:(h,names,fallback)=>names.map(x=>h[x]).find(Boolean)||fallback,
    valueAt_:(r,col)=>r[col-1],
    parseMoney_:v=>Number(v||0),
    accountingPostInvoiceFinanceV1921_:()=>{calls.finance++;return {warning:''};},
    accountingHeldPaymentForOrderV1921_:()=>{calls.held++;return {rows:[],amount:0};},
    accountingConsumeHeldPaymentV1921_:()=>{calls.consume++;},
    appendByHeaders_:()=>{calls.appends++;throw Error('NO_REAL_OR_FAKE_NEW_INVOICE_ALLOWED');}
  };
  vm.createContext(ctx);
  vm.runInContext(source+'\nthis.fn=saveAccountingFinalInvoice_',ctx);
  return {invoke:requestId=>ctx.fn({parameter:{username:'fictional',token:'NOT_REAL',orderId:'FAKE-ORDER-01',requestId}}),calls};
}
test('Legacy backend: retry same synthetic request after lost ACK returns original invoice',()=>{
  const h=fixture();
  const first=h.invoke(existing['مفتاح العملية']);
  const second=h.invoke(existing['مفتاح العملية']);
  for(const result of [first,second]){
    assert.equal(result.success,true);
    assert.equal(result.duplicatePrevented,true);
    assert.equal(result.trustedByServer,true);
    assert.equal(result.invoiceNo,existing['رقم الفاتورة']);
    assert.equal(result.paid,100);
    assert.equal(result.remaining,20);
  }
  assert.equal(h.calls.appends,0);
  assert.equal(h.calls.lock,2);
  assert.equal(h.calls.released,2);
  assert.equal(h.calls.reads,2);
});
test('Legacy backend: unauthorized or expired fake employee cannot read old invoice',()=>{
  const h=fixture({authorized:false});
  const x=h.invoke(existing['مفتاح العملية']);
  assert.equal(x.success,false);
  assert.equal(h.calls.reads,0);
  assert.equal(h.calls.appends,0);
  assert.equal(h.calls.lock,0);
});
test('Legacy backend replay is a repair path, not a provider delivery acknowledgement',()=>{
  const h=fixture();
  const x=h.invoke(existing['مفتاح العملية']);
  assert.equal(x.duplicatePrevented,true);
  assert.equal(h.calls.finance,1);
  assert.equal(h.calls.held,1);
  assert.equal(h.calls.consume,1);
  assert.equal(h.calls.appends,0);
});
