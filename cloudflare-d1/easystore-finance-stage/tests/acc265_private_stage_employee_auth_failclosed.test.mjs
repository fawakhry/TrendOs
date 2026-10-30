/**
 * ACC265 - source-only FIRST-USE safety checks.
 * Uses the ORIGINAL Stage Worker and synthetic in-memory providers only.
 * NO real staff, credentials, Cloudflare D1, financial posting or deployment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.mjs';

const API = 'https://example.invalid/v1/employee/accounting';
const HEALTH = API + '/health';
const fakeServices = {
  TRENDOS_EMPLOYEE_SESSION: { fetch: async () => new Response(
    JSON.stringify({success:false,code:'synthetic-denied'}), {status:401}
  ) },
  TRENDOS_CUSTOMER_FACTS: { fetch: async () => new Response(
    JSON.stringify({success:false,code:'synthetic-denied'}), {status:401}
  ) }
};
function financeDb(mode='READONLY', tableCount=22, forbiddenTables=0) {
  const trace=[];
  return {trace,prepare(sql) {
    trace.push(sql);
    return {async first(){
      if(sql.includes('SELECT mode FROM employee_accounting_control_v1'))
        return {mode};
      if(sql.includes("name LIKE 'employee_accounting_%'"))
        return {n:tableCount};
      if(sql.includes("name LIKE 't12_%'"))
        return {n:forbiddenTables};
      if(sql.includes('SELECT mode,next_invoice_number'))
        return {mode,nextInvoiceNumber:1,policyEpoch:1};
      if(sql.includes("name IN ('employee_accounting_materials_v1'"))
        return {n:6};
      if(sql.includes('FROM employee_accounting_write_canary_v1'))
        return {enabled:1,allowedUsersJson:'[]',allowedActionsJson:'[]',
          maxAmount:0,expiresAtMs:0,policyEpoch:1,
          maxCommands:0,commandsStarted:0};
      throw Error('unexpected synthetic SQL');
    }};
  }};
}
function stageEnv(db=financeDb(), extra={}) {
  return {
    DB:db,
    FINANCE_RELEASE:'NO_GO',
    FINANCE_WRITES:'OFF',
    EASYSTORE_ACCOUNTING_D1_WRITES:'false',
    EASYSTORE_ACCOUNTING_D1_WRITE_MODE:'OFF',
    EASYSTORE_STAGE_READONLY_API_V1:'ENFORCE', // fake isolated env only
    ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
    ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify({
      version:1,grants:[{username:'synthetic-only',mode:'full'}]
    }),
    EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',
    EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED',
    TRENDOS_EMPLOYEE_SESSION_HMAC_V1:'FAKE-ONLY-NOT-A-REAL-SECRET-ACC265-1234',
    TRENDOS_CUSTOMER_FACTS_HMAC_V1:'FAKE-ONLY-NOT-A-REAL-SECRET-ACC265-5678',
    ...fakeServices,...extra
  };
}
async function call(action, env, fields={}) {
  const res=await worker.fetch(new Request(API,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action,...fields})
  }), env);
  return {status:res.status,body:await res.json()};
}

test('ACC265 default OFF rejects even a forged manager role before touching D1',async()=>{
  const db=financeDb();
  const env=stageEnv(db,{EASYSTORE_STAGE_READONLY_API_V1:'OFF'});
  const r=await call('getAccounting',env,{username:'admin',role:'admin'});
  assert.equal(r.status,503);
  assert.equal(r.body.code,'isolated-stage-financial-routes-disabled');
  assert.equal(db.trace.length,0);
});

test('ACC265 empty or invalid grant roster and missing private trust reject before D1',async()=>{
  for (const patch of [
    {ACCOUNTING_FINANCE_GRANTS_V1:'{"version":1,"grants":[]}'},
    {ACCOUNTING_FINANCE_GRANTS_V1:'invalid-json'},
    {TRENDOS_EMPLOYEE_SESSION_HMAC_V1:'too-short'},
    {TRENDOS_CUSTOMER_FACTS_HMAC_V1:''},
    {TRENDOS_EMPLOYEE_SESSION:undefined},
    {TRENDOS_CUSTOMER_FACTS:undefined},
    {ACCOUNTING_FINANCE_GRANTS_MODE_V1:'OFF'}
  ]) {
    const db=financeDb();
    const r=await call('getAccounting',stageEnv(db,patch),{
      username:'admin',role:'admin',token:'bogus'
    });
    assert.equal(r.status,503,JSON.stringify(patch));
    assert.equal(r.body.code,'isolated-stage-financial-routes-disabled');
    assert.equal(db.trace.length,0);
  }
});

test('ACC265 all original money commands remain denied across all D1 modes',async()=>{
  for(const mode of ['OFF','READONLY','CANARY','GENERAL']){
    const db=financeDb(mode),env=stageEnv(db);
    for(const action of [
      'saveAccountingFinalInvoice','saveEasyStoreSaleV2',
      'savePartyLedgerTransaction','saveAccountingDeptLine',
      'approveAccountingDeptInvoice','saveAccountingPurchase',
      'reopenAccountingFinalInvoice'
    ]) {
      const r=await call(action,env,{
        username:'admin',role:'admin',token:'bogus',amount:100
      });
      assert.equal(r.status,503,`${mode} / ${action}`);
      assert.equal(r.body.code,'isolated-stage-financial-routes-disabled');
    }
    assert.equal(db.trace.length,0,'disallowed actions never query finance D1');
  }
});

test('ACC265 asserted admin or cashier fields never replace a real employee token',async()=>{
  const env=stageEnv();
  for(const forged of [
    {username:'admin',role:'admin',mode:'full'},
    {username:'synthetic-only',role:'admin',department:'finance'},
    {username:'cashier',role:'final',department:'طباعة'}
  ]) {
    const r=await call('getAccounting',env,forged);
    assert.equal(r.status,401,JSON.stringify(forged));
    assert.equal(r.body.code,'employee-session-rejected');
  }
});

test('ACC265 private API rejects malformed/oversize/unknown HTTP requests',async()=>{
  const env=stageEnv();
  const tooLarge=await worker.fetch(new Request(API,{
    method:'POST',body:'x'.repeat(16385)
  }),env);
  assert.equal(tooLarge.status,413);
  assert.equal((await tooLarge.json()).code,'isolated-stage-read-payload-too-large');
  const malformed=await worker.fetch(new Request(API,{
    method:'POST',body:'{invalid'
  }),env);
  assert.equal(malformed.status,400);
  assert.equal((await malformed.json()).code,'isolated-stage-invalid-json');
  const unknown=await call('unknown-finance-action',env);
  assert.equal(unknown.status,503);
  assert.equal(unknown.body.code,'isolated-stage-financial-routes-disabled');
  const get=await worker.fetch(new Request(API),env);
  assert.equal(get.status,405);
  const random=await worker.fetch(new Request(API+'/customers'),env);
  assert.equal(random.status,404);
});

test('ACC265 Stage health is NEVER attestation of authenticated staff or money',async()=>{
  for(const mode of ['OFF','READONLY']){
    const env=stageEnv(financeDb(mode));
    const res=await worker.fetch(new Request(HEALTH),env);
    const d=await res.json();
    assert.equal(res.status,200,JSON.stringify(d));
    assert.equal(d.mode,mode);
    assert.equal(d.customerApiVerified,false);
    assert.equal(d.employeeAuthVerified,false);
    assert.equal(d.financeWrites,'OFF');
    assert.equal(d.financeRelease,'NO_GO');
    assert.equal(d.readOnlyApiEnabled,mode==='READONLY');
  }
});

test('ACC265 wrong finance-only schema cannot pass health',async()=>{
  for(const db of [financeDb('READONLY',21),financeDb('READONLY',22,1)]){
    const r=await worker.fetch(new Request(HEALTH),stageEnv(db));
    assert.equal(r.status,503);
    assert.equal((await r.json()).code,'isolated-accounting-stage-schema-or-mode-not-ready');
  }
});
