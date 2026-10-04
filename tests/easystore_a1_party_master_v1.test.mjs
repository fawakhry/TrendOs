import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0020_employee_accounting_party_master_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.match(sql,/CREATE TABLE IF NOT EXISTS employee_accounting_parties_v1/);
assert.match(sql,/party_id TEXT PRIMARY KEY/);
assert.match(sql,/party_type TEXT NOT NULL CHECK\(party_type IN \('customer','supplier'\)\)/);
assert.match(sql,/UNIQUE\(party_type,normalized_name\)/);
assert.match(sql,/ALTER TABLE employee_accounting_party_ledger_v1\s+ADD COLUMN party_id TEXT NOT NULL DEFAULT ''/s);
assert.match(sql,/idx_employee_accounting_party_id_time/);
assert.doesNotMatch(sql,/UPDATE employee_accounting_control_v1|DELETE FROM employee_accounting_control_v1/);

const readLine=mod.split('\n').find(x=>x.includes('const READ_ACTIONS=new Set'))||'';
assert.ok(readLine.includes("'getEasyStoreSuppliers'"),'supplier read not registered');
assert.match(mod,/async function getEasyStoreSuppliersV1/);
assert.match(mod,/FROM employee_accounting_parties_v1 p/);
assert.match(mod,/p\.party_type='supplier'/);
assert.match(mod,/partyId:text\(r\.party_id\)/);
assert.match(mod,/l\.party_id=p\.party_id/);
assert.match(mod,/const partyId=text\(b\.partyId\|\|b\.customerId\|\|b\.supplierId\)/);
assert.match(mod,/WHERE party_type=\? AND party_id=\?/);
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/);

console.log('EASYSTORE_A1_PARTY_MASTER_SOURCE=PASS');
console.log('SUPPLIER_MASTER=employee_accounting_parties_v1');
console.log('PARTY_LEDGER_STABLE_ID=party_id');
console.log('GET_EASYSTORE_SUPPLIERS_D1=YES');
console.log('GOOGLE_BUSINESS_CALLS=0');
console.log('PRODUCTION_MUTATION=NO');
