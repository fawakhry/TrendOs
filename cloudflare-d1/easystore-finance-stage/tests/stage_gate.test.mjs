import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.mjs';

const health = 'https://example.invalid/v1/employee/accounting/health';
const api = 'https://example.invalid/v1/employee/accounting';
function fakeDb(mode='OFF',tableCount=22,operationalTables=0) {
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
            maxCommands:0, commandsStarted:0
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
