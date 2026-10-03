import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isEmployeeAccountingNativePath } from '../cloudflare-d1/src/employee-accounting-native-v1.mjs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0015_employee_accounting_zero_google_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const index=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');

assert.match(sql,/ENTRY614_ACCOUNTING_V1/);
assert.match(sql,/mode TEXT NOT NULL DEFAULT 'OFF'/);
for(const table of [
  'employee_accounting_materials_v1','employee_accounting_templates_v1',
  'employee_accounting_dept_lines_v1','employee_accounting_final_invoices_v1',
  'employee_accounting_party_ledger_v1','employee_accounting_stock_moves_v1',
  'employee_accounting_request_ledger_v1','employee_accounting_events_v1'
]) assert.ok(sql.includes(table), 'missing table '+table);

const actions=[
  'getAccounting','getDeptInvoiceDraftV1887','approveAccountingDeptInvoice',
  'saveAccountingDeptLine','saveAccountingFinalInvoice','saveAccountingMaterial',
  'saveAccountingTemplate','getPartyAccountV1858','savePartyLedgerTransaction'
];
for(const action of actions) assert.ok(mod.includes("'"+action+"'"), 'missing accounting action '+action);

assert.match(mod,/authority:'d1-employee-accounting-v1'/);
assert.match(mod,/googleBusinessCalls:0/);
assert.match(mod,/appsScriptBusinessAuthority:false/);
assert.match(mod,/authoritativeWrites:text\(c\.mode\)==='GENERAL'/);
assert.match(mod,/employee_accounting_request_ledger_v1/);
assert.match(mod,/duplicatePrevented:true/);
assert.match(mod,/stock_deducted/);
assert.match(mod,/next_invoice_number/);
assert.match(mod,/verifyEmployeeSessionCloudFirst/);
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com|APPS_SCRIPT_API_URL/);

assert.match(index,/isEmployeeAccountingNativePath/);
assert.match(index,/handleEmployeeAccountingNativeRequest/);
assert.equal(isEmployeeAccountingNativePath('/v1/employee/accounting'),true);
assert.equal(isEmployeeAccountingNativePath('/v1/employee/accounting/health'),true);
assert.equal(isEmployeeAccountingNativePath('/v1/employee/legacy-action'),false);

console.log('ENTRY614_EMPLOYEE_ACCOUNTING_NATIVE_SOURCE=PASS');
console.log('ENTRY614_ACCOUNTING_ACTION_COUNT='+actions.length);
console.log('ENTRY614_ACCOUNTING_AUTHORITATIVE_D1_DESIGN=YES');
console.log('ENTRY614_ACCOUNTING_IDEMPOTENCY_LEDGER=YES');
console.log('ENTRY614_ACCOUNTING_GOOGLE_BUSINESS_CALLS=0');
console.log('ENTRY614_ACCOUNTING_CONTROL_DEFAULT=OFF');
console.log('ENTRY614_PRODUCTION_MUTATION=NO');
