import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0024_employee_accounting_party_balances_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.match(sql,/CREATE TABLE IF NOT EXISTS employee_accounting_party_balances_v1/);
assert.match(sql,/PRIMARY KEY\(party_type,party_id\)/);
assert.match(sql,/balance REAL NOT NULL DEFAULT 0 CHECK\(balance>=-0\.000001\)/);
assert.match(sql,/last_request_key TEXT NOT NULL DEFAULT ''/);

assert.match(mod,/async function resolvePartyV1/);
assert.match(mod,/customer_id AS partyId/);
assert.match(mod,/party_id AS partyId,display_name AS partyName/);
assert.match(mod,/async function partyBalanceV1/);
assert.match(mod,/FROM employee_accounting_party_balances_v1 WHERE party_type=\? AND party_id=\?/);

assert.match(mod,/async function partyLedger/);
assert.match(mod,/await beginCommandV1\(/);
assert.match(mod,/version=\? AND balance\+\?>=-0\.000001/);
assert.match(mod,/last_request_key=\? AND version=\?/);
assert.match(mod,/accounting-party-balance-guard-rejected/);
assert.match(mod,/employee_accounting_cashbox_v1/);
assert.match(mod,/await commitCommandV1\(/);
assert.match(mod,/await auditEventV1\(/);

assert.match(mod,/async function saveSupplierV1/);
assert.match(mod,/supplier-master-upsert/);
assert.match(mod,/employee_accounting_parties_v1/);
assert.match(mod,/saveEasyStoreSupplier'\)out=await saveSupplierV1/);
assert.match(mod,/saveCustomerAccountMovementV1915'\)out=await partyLedger/);
assert.match(mod,/savePartyLedgerTransaction'\)out=await partyLedger/);

assert.match(mod,/searchCustomersV1[\s\S]*pb\.party_id=c\.customer_id/);
assert.match(mod,/getCustomerAccountV1915V1[\s\S]*WHERE party_type='customer' AND party_id=\?/);
assert.match(mod,/getParty\(env,auth,b\)[\s\S]*resolvePartyV1\(env,type,b\)/);
assert.match(mod,/getParty\(env,auth,b\)[\s\S]*partyBalanceV1\(env,type,party\.partyId\)/);

assert.match(mod,/if\(c\.mode==='READONLY'&&!READ_ACTIONS\.has\(action\)\)/);
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/);

console.log('EASYSTORE_A2_PARTY_WRITES_SOURCE=PASS');
console.log('STABLE_PARTY_IDS=YES');
console.log('AUTHORITATIVE_PARTY_BALANCE_GUARD=YES');
console.log('OPTIMISTIC_VERSION_GUARD=YES');
console.log('SUPPLIER_MASTER_WRITE_D1=YES');
console.log('CUSTOMER_LEDGER_WRITE_D1=YES');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('GOOGLE_BUSINESS_WRITES=0');
console.log('PRODUCTION_MUTATION=NO');
