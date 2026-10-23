import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.mjs';

const health = 'https://example.invalid/v1/employee/accounting/health';
const api = 'https://example.invalid/v1/employee/accounting';
function fakeDb(mode='OFF',tableCount=22) {
  return {
    prepare(sql) {
      return {
        async first() {
          if (sql.includes("SELECT mode FROM employee_accounting_control_v1"))
            return {mode};
          if (sql.includes("name LIKE 'employee_accounting_%'")) return {n:tableCount};
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
  const res = await worker.fetch(new Request(health), {DB:fakeDb(),EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED'});
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
      }),{DB:fakeDb(mode),EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED'});
      assert.equal(res.status,503);
      assert.equal((await res.json()).code,'isolated-stage-financial-routes-disabled');
    }
  }
});
test('broken schema, wrong mode and absent D1 reject health', async () => {
  for (const env of [undefined,{DB:fakeDb('GENERAL'),EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED'},{DB:fakeDb('OFF',21),EASYSTORE_CUSTOMER_SOURCE_V1:'REMOTE_REQUIRED'}]) {
    const res = await worker.fetch(new Request(health),env);
    assert.equal(res.status,503);
    assert.equal((await res.json()).financeWrites,'OFF');
  }
});
test('not an operational or customer API, and no non-GET health', async () => {
  let r=await worker.fetch(new Request('https://example.invalid/v1/t12/orders'),{DB:fakeDb()});
  assert.equal(r.status,404);
  r=await worker.fetch(new Request(health,{method:'POST'}),{DB:fakeDb()});
  assert.equal(r.status,405);
});
