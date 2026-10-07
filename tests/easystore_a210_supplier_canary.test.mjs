import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(mod.includes("if(action==='saveEasyStoreSupplier')"));
assert.ok(mod.includes('/^A2-CANARY-SUPPLIER-/'));
assert.ok(mod.includes('employee-accounting-canary-supplier-shape-blocked'));
assert.ok(mod.includes('lowRiskCanaryInactiveV1(b.active)'));
assert.ok(mod.includes('opening===0'));
assert.ok(mod.includes('!text(b.partyId||b.supplierId)'));
for (const field of ['externalId','phone','address','notes']) {
  assert.ok(mod.includes('!text(b.'+field+')'), 'supplier canary must reject '+field);
}
assert.ok(mod.includes("const ctx=await beginCommandV1(env,auth,'supplier-master-upsert'"));
assert.ok(mod.includes("await auditEventV1(env,ctx,'supplier',partyId,existing?'update':'create'"));
assert.ok(mod.includes("INSERT OR IGNORE INTO employee_accounting_party_balances_v1"));
assert.ok(mod.includes("VALUES('supplier',?,?,0,1,'',?)"));
assert.ok(mod.includes("if(opening>0){"));
assert.ok(mod.includes("employee_accounting_party_ledger_v1"));

console.log('A210_SUPPLIER_CANARY_SERVER_GUARD=PASS');
console.log('A210_SUPPLIER_SYNTHETIC_NAME_REQUIRED=YES');
console.log('A210_SUPPLIER_INACTIVE_REQUIRED=YES');
console.log('A210_SUPPLIER_OPENING_BALANCE_ZERO_REQUIRED=YES');
console.log('A210_SUPPLIER_EXTRA_BUSINESS_METADATA_BLOCKED=YES');
console.log('A210_EXPECTED_PARTY_LEDGER_DELTA=0');
console.log('A210_EXPECTED_CASHBOX_DELTA=0');
console.log('A210_EXPECTED_PARTY_MASTER_DELTA=1');
console.log('A210_EXPECTED_ZERO_BALANCE_ROW_DELTA=1');
console.log('PRODUCTION_MUTATION=NO');
