import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../index.mjs';

const health = 'https://example.invalid/v1/employee/accounting/health';
const api = 'https://example.invalid/v1/employee/accounting';
function fakeDb(mode='OFF',tableCount=22,operationalTables=0,canaryArmed=false) {
  return {
    prepare(sql) {
      return {
        async first() {
          if (sql.includes("SELECT mode FROM employee_accounting_control_v1"))
            return {mode};
          if (sql.includes("name LIKE 'employee_accounting_%'")) return {n:tableCount};
          if (sql.includes("name LIKE 't12_%'")) return {n:operationalTables};
          if (sql.includes("SELECT mode,next_invoice_number")) return {
            mode, nextInvoiceNumber:1, policyEpoch:1
          };
          if (sql.includes("name IN ('employee_accounting_materials_v1'")) return {n:6};
          if (sql.includes("FROM employee_accounting_write_canary_v1")) return {
            enabled:1, allowedUsersJson:'[]', allowedActionsJson:'[]',
            maxAmount:0, expiresAtMs:0, policyEpoch:1,
            maxCommands:canaryArmed?1:0, commandsStarted:0,
            allowedUsers:'[]', allowedActions:'[]'
          };
          throw new Error('unexpected SQL: '+sql.slice(0,110));
        }
      };
    }
  };
}

test('isolated Stage invokes ORIGINAL native health on finance-only D1', async () => {
  const res = await worker.fetch(new Request(health), {DB:fakeDb(),EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED'});
  const data = await res.json();
  assert.equal(res.status,200,JSON.stringify(data));
  assert.equal(data.nativeEngine,'employee-accounting-native-v1');
  assert.equal(data.financeWrites,'OFF');
  assert.equal(data.financeRelease,'NO_GO');
  assert.equal(data.schemaTables,22);
});
test('ALL invoice/receipt POSTs fail closed even when D1 control says GENERAL', async () => {
  for (const mode of ['OFF','READONLY','CANARY','GENERAL']) {
    for (const action of ['saveAccountingFinalInvoice','savePartyLedgerTransaction','getEasyStoreCustomers']) {
      const res = await worker.fetch(new Request(api,{
        method:'POST',body:JSON.stringify({action})
      }),{DB:fakeDb(mode),EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED'});
      assert.equal(res.status,503);
      assert.equal((await res.json()).code,'isolated-stage-financial-routes-disabled');
    }
  }
});
test('broken schema, wrong mode and absent D1 reject health', async () => {
  for (const env of [undefined,{DB:fakeDb('GENERAL'),EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED'},{DB:fakeDb('OFF',21),EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED'}]) {
    const res = await worker.fetch(new Request(health),env);
    assert.equal(res.status,503);
    assert.equal((await res.json()).financeWrites,'OFF');
  }
});
test('Stage rejects mixed D1 operational or employee tables even with all 22 finance tables',async()=>{
  const res=await worker.fetch(new Request(health),{
    DB:fakeDb('OFF',22,1),
    EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',
    EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED'
  });
  assert.equal(res.status,503);
  assert.equal((await res.json()).code,'isolated-accounting-stage-schema-or-mode-not-ready');
});
test('not an operational or customer API, and no non-GET health', async () => {
  let r=await worker.fetch(new Request('https://example.invalid/v1/t12/orders'),{DB:fakeDb()});
  assert.equal(r.status,404);
  r=await worker.fetch(new Request(health,{method:'POST'}),{DB:fakeDb()});
  assert.equal(r.status,405);
});

test('read-only Stage gateway is explicitly opt-in, never enables money writes',async()=>{
  const flags={
    EASYSTORE_STAGE_READONLY_API_V1:'ENFORCE',
    FINANCE_RELEASE:'NO_GO',FINANCE_WRITES:'OFF',
    EASYSTORE_ACCOUNTING_D1_WRITES:'false',
    EASYSTORE_ACCOUNTING_D1_WRITE_MODE:'OFF',
    ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
    ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify({version:1,grants:[{username:'fake',mode:'final'}]}),
    EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',
    EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED',
    TRENDOS_EMPLOYEE_SESSION_HMAC_V1:'test-native-session-secret-should-not-be-live',
    TRENDOS_CUSTOMER_FACTS_HMAC_V1:'test-customer-facts-secret-should-not-be-live',
    TRENDOS_EMPLOYEE_SESSION:{fetch:async()=>new Response(null,{status:401})},
    TRENDOS_CUSTOMER_FACTS:{fetch:async()=>new Response(null,{status:401})}
  };
  for(const mode of ['OFF','READONLY','CANARY','GENERAL']){
    const env={...flags,DB:fakeDb(mode)};
    for(const action of ['saveAccountingFinalInvoice','savePartyLedgerTransaction',
                         'saveEasyStoreSaleV2','approveAccountingDeptInvoice']){
      const res=await worker.fetch(new Request(api,{method:'POST',
        body:JSON.stringify({action,username:'fake'})}),env);
      assert.equal(res.status,503);
      assert.equal((await res.json()).code,'isolated-stage-financial-routes-disabled');
    }
    const read=await worker.fetch(new Request(api,{method:'POST',
      body:JSON.stringify({action:'getAccounting',username:'fake'})}),env);
    if(mode!=='READONLY'){
      assert.equal(read.status,503);
      assert.equal((await read.json()).code,'isolated-stage-readonly-control-required');
    }else{
      // Native employee token is absent: a read still cannot bypass SSO.
      assert.equal(read.status,401);
      assert.equal((await read.json()).code,'employee-session-rejected');
    }
  }
  const withoutGrant={...flags,ACCOUNTING_FINANCE_GRANTS_V1:'{"version":1,"grants":[]}',DB:fakeDb('READONLY')};
  const missing=await worker.fetch(new Request(api,{method:'POST',
    body:JSON.stringify({action:'getEasyStoreCustomers'})}),withoutGrant);
  assert.equal(missing.status,503);
  assert.equal((await missing.json()).code,'isolated-stage-financial-routes-disabled');
  const h=await worker.fetch(new Request(health),{...flags,DB:fakeDb('READONLY')});
  assert.equal(h.status,200);
  assert.equal((await h.json()).readOnlyApiEnabled,true);
});

test('ACC253 Stage signed-source smoke disabled by default on OFF finance D1',async()=>{
  const url='https://example.invalid/internal/acc253/signed-source-smoke';
  const res=await worker.fetch(new Request(url,{method:'POST'}),{
    DB:fakeDb(),FINANCE_WRITES:'OFF',FINANCE_RELEASE:'NO_GO',
    EASYSTORE_STAGE_READONLY_API_V1:'OFF',
    EASYSTORE_ACCOUNTING_D1_WRITES:'false',
    EASYSTORE_ACCOUNTING_D1_WRITE_MODE:'OFF',
    ACCOUNTING_FINANCE_GRANTS_V1:'{"version":1,"grants":[]}'
  });
  assert.equal(res.status,503);
  assert.equal((await res.json()).code,'isolated-stage-signed-source-smoke-disabled');
});
test('ACC253 Stage signed bridge has no money-authority under READONLY D1',async()=>{
  const url='https://example.invalid/internal/acc253/signed-source-smoke';
  const res=await worker.fetch(new Request(url,{method:'POST'}),{
    DB:fakeDb('READONLY'),FINANCE_WRITES:'OFF',FINANCE_RELEASE:'NO_GO',
    EASYSTORE_STAGE_READONLY_API_V1:'OFF',
    EASYSTORE_STAGE_SIGNED_SOURCE_SMOKE_V1:'ENFORCE',
    EASYSTORE_ACCOUNTING_D1_WRITES:'false',
    EASYSTORE_ACCOUNTING_D1_WRITE_MODE:'OFF',
    ACCOUNTING_FINANCE_GRANTS_V1:'{"version":1,"grants":[]}',
    EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',
    EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED'
  });
  assert.equal(res.status,503);
  assert.equal((await res.json()).code,'isolated-stage-signed-source-smoke-control-not-off');
});


// ACC291 supplier-only Stage preflight: only previously missing gateway path.
// Existing original native D1/role tests remain the source of truth.
test('ACC291 supplier-only Stage preflight defaults OFF and refuses ALL money',async()=>{
  const cfg=fs.readFileSync('cloudflare-d1/easystore-finance-stage/wrangler.toml','utf8');
  for(const key of ['EASYSTORE_STAGE_SUPPLIER_MASTER_INTAKE_V1',
    'EASYSTORE_SUPPLIER_MASTER_INTAKE_V1','EASYSTORE_OPENING_DRAFT_INTAKE_V1'])
    assert.match(cfg,new RegExp('^'+key+'\\s*=\\s*"OFF"','m'));
  const hmac='ACC291_SYNTHETIC_KEY_NOT_REAL_'.repeat(3);
  const safe={
    DB:fakeDb('READONLY'),
    EASYSTORE_STAGE_READONLY_API_V1:'ENFORCE',
    FINANCE_RELEASE:'NO_GO',FINANCE_WRITES:'OFF',
    EASYSTORE_ACCOUNTING_D1_WRITES:'false',
    EASYSTORE_ACCOUNTING_D1_WRITE_MODE:'OFF',
    EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED',
    EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1:'REMOTE_NATIVE_REQUIRED',
    ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
    ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify(
      {version:1,grants:[{username:'acc291_synthetic_owner',mode:'full'}]}),
    TRENDOS_EMPLOYEE_SESSION_HMAC_V1:hmac,
    TRENDOS_CUSTOMER_FACTS_HMAC_V1:hmac,
    TRENDOS_EMPLOYEE_SESSION:{fetch:async()=>new Response(null,{status:401})},
    TRENDOS_CUSTOMER_FACTS:{fetch:async()=>new Response(null,{status:401})},
    EASYSTORE_STAGE_SUPPLIER_MASTER_INTAKE_V1:'ENFORCE',
    EASYSTORE_SUPPLIER_MASTER_INTAKE_V1:'ENFORCE',
    EASYSTORE_OPENING_DRAFT_INTAKE_V1:'OFF'
  };
  async function call(env,action,data={}){
    const r=await worker.fetch(new Request(api,{method:'POST',
      body:JSON.stringify({action,username:'acc291_synthetic_owner',...data})}),env);
    return {status:r.status,...await r.json()};
  }
  const payload={name:'ACC291 SYNTHETIC',opening:0,requestId:'ACC291-SYNTH-REQUEST-00001'};
  for(const updated of [
    {EASYSTORE_STAGE_SUPPLIER_MASTER_INTAKE_V1:'OFF'},
    {EASYSTORE_SUPPLIER_MASTER_INTAKE_V1:'OFF'},
    {EASYSTORE_STAGE_READONLY_API_V1:'OFF'},
    {ACCOUNTING_FINANCE_GRANTS_V1:'{"version":1,"grants":[]}'},
    {ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify(
      {version:1,grants:[{username:'acc291_synthetic_owner',mode:'final'}]})},
    {EASYSTORE_OPENING_DRAFT_INTAKE_V1:'ENFORCE'},
    {FINANCE_WRITES:'ON'}
  ]){
    const out=await call({...safe,...updated},'saveEasyStoreSupplier',payload);
    assert.equal(out.status,503,'supplier must be off unless all independent gates match');
    assert.equal(out.code,'isolated-stage-financial-routes-disabled');
  }
  const badInputs=[
    {opening:0,debt:500},{opening:0,openingDebt:-200},
    {opening:0,balance:'malformed'},{opening:0,currentBalance:{}},
    {opening:5}
  ];
  for(const invalid of badInputs){
    const out=await call(safe,'saveEasyStoreSupplier',{...payload,...invalid});
    assert.equal(out.status,503);
    assert.equal(out.code,'isolated-stage-supplier-must-be-zero-opening');
  }
  const armed=await call({...safe,DB:fakeDb('READONLY',22,0,true)},
    'saveEasyStoreSupplier',payload);
  assert.equal(armed.status,503);
  assert.equal(armed.code,'isolated-stage-supplier-canary-must-be-unarmed');
  const noToken=await call(safe,'saveEasyStoreSupplier',payload);
  assert.equal(noToken.status,401);
  assert.equal(noToken.code,'employee-session-rejected');
  // Even with all supplier-only switches on, no money or unrelated drafts.
  for(const action of ['saveEasyStoreSaleV2','saveAccountingFinalInvoice',
    'saveEasyStoreOpeningDraftV1','saveCustomerAccountMovementV1915',
    'saveEasyStoreCustomer','saveAccountingDeptLine']){
    const rejected=await call(safe,action,{...payload,amount:90});
    assert.equal(rejected.status,503,action);
    assert.equal(rejected.code,'isolated-stage-financial-routes-disabled',action);
  }
  const notReadOnly=await call({...safe,DB:fakeDb('OFF')},
    'saveEasyStoreSupplier',payload);
  assert.equal(notReadOnly.status,503);
  assert.equal(notReadOnly.code,'isolated-stage-readonly-control-required');
});
