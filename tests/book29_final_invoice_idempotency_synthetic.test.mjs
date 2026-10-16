// BOOK29: synthetic-only lost ACK, safe retry, semantic payload and Legacy contract.
// Does not import any deployed browser context or execute financial/Apps Script APIs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const legacy=fs.readFileSync(new URL('../Code.gs',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../config.js',import.meta.url),'utf8');
const dispatcher=fs.readFileSync(new URL('../employee-api-dispatcher-v1.js',import.meta.url),'utf8');
const begin=app.indexOf('  async function accountingFinalInvoiceRequestIdV29(payload) {');
const end=app.indexOf('  function withQuery(',begin);
assert.ok(begin>0&&end>begin,'missing guarded primary invoice handler');
const snippet=app.slice(begin,end);

function harness({storage=new Map(),username='fictional-employee',response='LOST_ACK',fields={}}={}){
  const values={
    accFinalOrderId:'FAKE-ORDER-101',accFinalCustomer:'Synthetic Customer',
    accFinalManualDescription:'Synthetic banner',accFinalManualAmount:'10',
    accFinalDiscount:'0',accFinalPaid:'20',accFinalPaymentType:'إنستاباي',
    accFinalStatus:'مفتوحة',accFinalNotes:'SYNTHETIC_ONLY',
    ...fields
  };
  const elements=new Map(Object.entries(values).map(([id,value])=>[id,{value}]));
  elements.set('accountingOrderLinesList',{innerHTML:'fixture'});
  const params=[],messages=[];
  let fakeResponse=response;
  const state={user:{username,token:'TEST_TOKEN_NOT_REAL'},accounting:{pendingFinalInvoiceV29:null}};
  const ctx={
    state,
    window:{crypto:webcrypto},
    sessionStorage:{
      getItem:k=>storage.get(k)||null,
      setItem:(k,v)=>storage.set(k,String(v)),
      removeItem:k=>storage.delete(k)
    },
    TextEncoder,Uint8Array,Array,JSON,Promise,
    $:id=>elements.get(id)||null,
    accountingCanCloseFinalInvoice:()=>true,
    selectedFinalInvoiceLines:()=>[{id:'FAKE-LINE',salePrice:100}],
    accountingLineSale:()=>100,
    numericAmount:v=>Number(v||0),
    accountingMoney:n=>String(n),
    authParams:p=>({...p,username}),
    api:async(action,p)=>{params.push({action,p});if(fakeResponse==='LOST_ACK')throw Error('OFFLINE_AFTER_COMMIT');return fakeResponse;},
    setMsg:(...args)=>messages.push(args),
    loadAccountingData:async()=>true
  };
  vm.createContext(ctx);
  vm.runInContext(snippet+'\nthis.saveInvoice=saveAccountingFinalInvoice;this.newKey=accountingFinalInvoiceRequestIdV29',ctx);
  return {ctx,state,values,elements,params,messages,storage,
    save:()=>ctx.saveInvoice(),setResponse:r=>fakeResponse=r,
    read:id=>(elements.get(id)||{}).value};
}
test('CH29 invoice: lost ACK retries with SAME stable requestId and records both manual field names',async()=>{
  const h=harness();
  await h.save();
  assert.equal(h.params.length,1);
  assert.equal(h.params[0].action,'saveAccountingFinalInvoice');
  const a=h.params[0].p;
  assert.match(a.requestId,/^FIN-[0-9a-f-]{36}$/i);
  assert.equal(a.manualDescription,'Synthetic banner');
  assert.equal(a.manualItem,'Synthetic banner');
  assert.equal(a.paymentType,'إنستاباي');
  assert.equal(a.paid,20);
  assert.equal(a.remaining,90);
  assert.ok(!JSON.stringify([...h.storage]).includes('Synthetic Customer'), 'no invoice PII in session storage');
  h.setResponse({success:true,duplicatePrevented:true,message:'Synthetic replay'});
  await h.save();
  assert.equal(h.params.length,2);
  assert.equal(h.params[1].p.requestId,a.requestId);
  assert.equal(h.storage.size,0,'confirmed response clears pending key');
  assert.equal(h.state.accounting.pendingFinalInvoiceV29,null);
});

test('CH29 invoice: changed payload after lost ACK cannot create a new invoice key',async()=>{
  const h=harness();
  await h.save();
  const k=h.params[0].p.requestId;
  h.elements.get('accFinalPaid').value='25';
  await h.save();
  assert.equal(h.params.length,1);
  assert.equal(h.state.accounting.pendingFinalInvoiceV29.requestId,k);
  assert.ok(h.messages.some(x=>String(x[1]).includes('غير مؤكدة')));
});

test('CH29 invoice: stable requestId survives reloading the same tab',async()=>{
  const storage=new Map();
  const first=harness({storage});
  await first.save();
  const id=first.params[0].p.requestId;
  const second=harness({storage,response:{success:true}});
  await second.save();
  assert.equal(second.params[0].p.requestId,id);
  assert.equal(storage.size,0);
});

test('CH29 invoice: unknown previous request for another employee is denied',async()=>{
  const storage=new Map();
  const first=harness({storage});
  await first.save();
  const other=harness({storage,username:'fictional-second'});
  await other.save();
  assert.equal(other.params.length,0);
  assert.ok(other.messages.some(x=>String(x[1]).includes('غير مؤكدة')));
});

test('CH29 invoice: pending first save coalesces double clicks',async()=>{
  const h=harness({response:{success:true}});
  const first=h.save(),second=h.save();
  await Promise.all([first,second]);
  assert.equal(h.params.length,1);
});

test('CH29 invoice: no WebCrypto is fail-closed before API',async()=>{
  const h=harness();h.ctx.window.crypto=null;
  await h.save();
  assert.equal(h.params.length,0);
  assert.ok(h.messages.some(x=>String(x[1]).includes('HTTPS')));
});

test('CH29 invoice: UI now explicitly offers payment method, not inferred as cash',()=>{
  assert.match(index,/id="accFinalPaymentType"/);
  for(const method of ['نقدي','إنستاباي','تحويل بنكي','فيزا','آجل'])assert.ok(index.includes('value="'+method+'"'));
});

test('CH29 invoice: current Legacy server already dedupes under lock, Native writes remain READONLY',()=>{
  const i=legacy.indexOf('function saveAccountingFinalInvoice_(e)');
  assert.ok(i>=0);
  const body=legacy.slice(i,i+2300);
  assert.match(body,/LockService\.getScriptLock\(\)/);
  assert.match(body,/e\.parameter\.requestId/);
  assert.match(body,/=== requestKey/);
  assert.match(config,/MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE\s*=\s*'READONLY'/);
  assert.match(dispatcher,/return mode === 'READONLY' \? mode : 'OFF'/);
});
