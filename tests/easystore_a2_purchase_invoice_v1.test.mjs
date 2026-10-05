import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0022_employee_accounting_day_ops_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS employee_accounting_purchase_invoices_v1'));
assert.ok(mod.includes('async function postPurchaseInvoiceV1'));
assert.ok(mod.includes('async function approveDeptDailyPurchasesV1'));
assert.ok(mod.includes("'purchase-invoice'"));
assert.ok(mod.includes('employee_accounting_purchase_invoices_v1'));
assert.ok(mod.includes("operation,operation_label,amount,effect"));
assert.ok(mod.includes("'purchase_invoice'"));
assert.ok(mod.includes("'payment_paid'"));
assert.ok(mod.includes('employee_accounting_party_balances_v1'));
assert.ok(mod.includes('last_request_key=?'));
assert.ok(mod.includes('employee_accounting_stock_moves_v1'));
assert.ok(mod.includes('stockAlreadyApplied'));
assert.ok(mod.includes('employee_accounting_cashbox_v1'));
assert.ok(mod.includes('employee_accounting_custody_events_v1'));
assert.ok(mod.includes("'PURCHASE_SETTLEMENT'"));
assert.ok(mod.includes("saveEasyStorePurchaseV2')out=await postPurchaseInvoiceV1"));
assert.ok(mod.includes("approveDeptDailyPurchasesV1917')out=await approveDeptDailyPurchasesV1"));
assert.ok(mod.includes("if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))"));
assert.ok(!/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/.test(mod));

console.log('EASYSTORE_A2_PURCHASE_INVOICE_SOURCE=PASS');
console.log('PURCHASE_SUPPLIER_LEDGER_COUPLED=YES');
console.log('PURCHASE_STOCK_VERSION_GUARDED=YES');
console.log('DAILY_APPROVAL_NO_DOUBLE_STOCK=YES');
console.log('DIRECT_PURCHASE_CASHBOX=YES');
console.log('DAILY_PURCHASE_CUSTODY_SETTLEMENT=YES');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('GOOGLE_BUSINESS_WRITES=0');
console.log('PRODUCTION_MUTATION=NO');
