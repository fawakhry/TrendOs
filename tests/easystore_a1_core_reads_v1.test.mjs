import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

for(const action of [
  'getEasyStoreCustomers',
  'searchCustomers',
  'getCustomerAccountV1915',
  'easyStoreSystemHealth'
]){
  assert.ok(mod.includes("'"+action+"'"),'missing A1 core read '+action);
}

assert.match(mod,/const READ_ACTIONS=new Set\([^;]*getEasyStoreCustomers[^;]*searchCustomers[^;]*getCustomerAccountV1915[^;]*easyStoreSystemHealth/s);
assert.match(mod,/FROM t12_customers/);
assert.match(mod,/employee_accounting_party_ledger_v1/);
assert.match(mod,/customerId:text\(r\.customer_id\)/);
assert.match(mod,/A1_D1_READ_MODEL_V1/);
assert.match(mod,/unavailableDomains:\['daily-purchases','custody','day-close'\]/);
assert.match(mod,/pendingRequestLedgerCount/);

assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/);

console.log('EASYSTORE_A1_CORE_D1_READS_SOURCE=PASS');
console.log('A1_CORE_READ_ACTIONS=4');
console.log('A1_CUSTOMER_MASTER=t12_customers');
console.log('A1_BALANCE_SOURCE=employee_accounting_party_ledger_v1');
console.log('A1_GOOGLE_BUSINESS_CALLS=0');
console.log('PRODUCTION_MUTATION=NO');
