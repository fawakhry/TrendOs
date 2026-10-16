// BOOK29 — fake-D1 safety qualification, NOT a finance migration approval.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { handleEmployeeAccountingNativeRequest } from '../cloudflare-d1/src/employee-accounting-native-v1.mjs';

const CONFIG = fs.readFileSync(new URL('../config.js',import.meta.url),'utf8');
const FRONT = fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const NATIVE = fs.readFileSync(new URL('../cloudflare-d1/src/employee-accounting-native-v1.mjs',import.meta.url),'utf8');
const DISPATCHER = fs.readFileSync(new URL('../employee-api-dispatcher-v1.js',import.meta.url),'utf8');
const SECRET = 'fixture-not-a-real-employee-token';

function fakeEnv(){
  const calls={control:0,otherReads:0,write:0};
  const env={DB:{prepare(sql) {
    if(/FROM employee_accounting_control_v1/.test(sql)){
      calls.control++;
      return {async first(){return {mode:'READONLY',policyEpoch:1,nextInvoiceNumber:1};}};
    }
    calls.otherReads++;
    return {
      bind(){return this;},
      async first(){throw Error('Unexpected D1 read in READONLY guard');},
      async all(){throw Error('Unexpected D1 read in READONLY guard');},
      async run(){calls.write++;throw Error('Unexpected D1 write in READONLY guard');}
    };
  },
  async batch(){calls.write++;throw Error('Unexpected D1 batch in READONLY guard');}}};
  return {env,calls};
}
async function nativeWrite(action,body={}){
  const {env,calls}=fakeEnv();
  const req=new Request('https://fixture.invalid/v1/employee/accounting',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+SECRET},
    body:JSON.stringify({username:'fixture-user',action,...body})
  });
  const res=await handleEmployeeAccountingNativeRequest(req,env);
  return {status:res.status,body:await res.json(),calls};
}

test('BOOK29: source config explicitly READONLY, not GENERAL, for accounting Native writes',()=>{
  assert.match(CONFIG,/MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE\s*=\s*'READONLY'/);
  assert.match(DISPATCHER,/MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE/);
});

test('BOOK29: READONLY denies department write and approval before session/financial SQL',async()=>{
  for(const action of ['saveAccountingDeptLine','approveAccountingDeptInvoice']){
    const r=await nativeWrite(action,{orderId:'FAKE-ORDER',materialQty:7,laborCost:80});
    assert.equal(r.status,503,action);
    assert.equal(r.body.code,'employee-accounting-readonly');
    assert.equal(r.calls.control,1);
    assert.equal(r.calls.otherReads,0);
    assert.equal(r.calls.write,0);
  }
});

test('BOOK29: READONLY denies final-invoice writes/retries regardless of requestId',async()=>{
  for(const requestId of ['', 'FAKE-STABLE-REQUEST-0001']){
    const r=await nativeWrite('saveAccountingFinalInvoice',{
      orderId:'FAKE-ORDER',requestId,manualDescription:'Fake item',paid:100,
      remaining:0,paymentMethod:'cash'});
    assert.equal(r.status,503);
    assert.equal(r.body.code,'employee-accounting-readonly');
    assert.equal(r.calls.otherReads,0);
    assert.equal(r.calls.write,0);
  }
});

test('BOOK29: READONLY denies owner-sensitive inventory/expense mutations',async()=>{
  for(const action of ['saveAccountingMaterial','saveAccountingTemplate','savePartyLedgerTransaction']){
    const r=await nativeWrite(action);
    assert.equal(r.status,503);
    assert.equal(r.calls.write,0);
  }
});

test('BOOK29: FIELD MISMATCH STILL EXISTS; cannot switch writers until mapping is approved',()=>{
  assert.match(FRONT,/materialQty:\s*\(\$\("accDeptLineMaterialQty"\)/);
  assert.match(FRONT,/laborCost:\s*\(\$\("accDeptLineLaborCost"\)/);
  assert.match(NATIVE,/b\.materialConsumption\|\|b\.consumption/);
  assert.match(NATIVE,/operating=num\(b\.operatingCost\)/);
  // This intentionally documents a mismatch, not a success claim for mapping.
  assert.equal(/b\.materialQty/.test(NATIVE),false);
  assert.equal(/b\.laborCost/.test(NATIVE),false);
});

test('BOOK29: invoice replay authority is server-side and requires stable request ID',()=>{
  assert.match(NATIVE,/if\(!requestKey\)return \{success:false,message:'requestId مطلوب/);
  assert.match(NATIVE,/WHERE request_key=\? AND status='COMMITTED'/);
  assert.match(NATIVE,/duplicatePrevented:true/);
  assert.match(FRONT,/manualDescription:/);
  assert.match(NATIVE,/text\(b\.manualItem\)/);
  // Source mismatch is a BLOCKER for Native GENERAL, not a reason to disable idempotency.
});
