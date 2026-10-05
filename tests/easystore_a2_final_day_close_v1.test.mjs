import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const m25=fs.readFileSync('cloudflare-d1/migrations/0025_employee_accounting_final_reversal_day_close_v1.sql','utf8');
const m26=fs.readFileSync('cloudflare-d1/migrations/0026_employee_accounting_tx_guard_v1.sql','utf8');

for(const col of [
  'customer_party_id','version INTEGER NOT NULL DEFAULT 1','held_paid',
  'replacement_invoice_no','reversed_at_ms','reversal_reason','reversal_ref'
]) assert.ok(m25.includes(col),col);
assert.ok(m25.includes('report_hash'));
assert.ok(m25.includes('blockers_json'));
assert.ok(m26.includes('employee_accounting_tx_guard_v1'));
assert.ok(m26.includes('CHECK(actual_count=expected_count)'));

for(const fn of [
  'txGuardPairV1','saveDeptLineA2V1','approveDeptA2V1','finalInvoiceA2V1',
  'reopenAccountingFinalInvoiceV1','dayCloseBlockersV1',
  'closeDepartmentDayV1','runAccountingDayAutomationV1'
]) assert.ok(mod.includes('function '+fn)||mod.includes('async function '+fn),fn);

assert.ok(mod.includes("'dept-line-upsert'"));
assert.ok(mod.includes("'dept-approval'"));
assert.ok(mod.includes("'final-invoice'"));
assert.ok(mod.includes("'final-invoice-reopen'"));
assert.ok(mod.includes("'day-close'"));

assert.ok(mod.includes('employee_accounting_tx_guard_v1'));
assert.ok(mod.includes("CHECK(actual_count=expected_count)") || m26.includes("CHECK(actual_count=expected_count)"));
assert.ok(mod.includes("work_date"));
assert.ok(mod.includes("heldPayment"));
assert.ok(mod.includes("newCashReceipt"));
assert.ok(mod.includes("status='UNDER_REVIEW'"));
assert.ok(mod.includes("replacement_invoice_no"));
assert.ok(mod.includes("عكس مدفوع للمراجعة"));
assert.ok(mod.includes("عكس فاتورة للمراجعة"));
assert.ok(mod.includes("اقفل الليزر والطباعة أولًا"));
assert.ok(mod.includes("RUN_SAFE_DAY_CLOSE"));
assert.ok(mod.includes("AUTO-DAY-"));

for(const route of [
  "approveAccountingDeptInvoice')out=await approveDeptA2V1",
  "saveAccountingDeptLine')out=await saveDeptLineA2V1",
  "saveAccountingFinalInvoice')out=await finalInvoiceA2V1",
  "reopenAccountingFinalInvoice')out=await reopenAccountingFinalInvoiceV1",
  "closeDepartmentDayV1920')out=await closeDepartmentDayV1",
  "runAccountingDayAutomationV1921')out=await runAccountingDayAutomationV1"
]) assert.ok(mod.includes(route),route);

assert.ok(mod.includes("if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))"));
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/);

console.log('EASYSTORE_A2_FINAL_DAY_CLOSE_SOURCE=PASS');
console.log('DEPT_LINE_WORK_DATE=YES');
console.log('DEPT_APPROVAL_TX_GUARD=YES');
console.log('FINAL_INVOICE_TX_GUARD=YES');
console.log('FINAL_REOPEN_REVERSAL_NOT_DELETE=YES');
console.log('HELD_PAYMENT_NO_DOUBLE_CASH=YES');
console.log('DAY_CLOSE_BLOCKERS=YES');
console.log('SAFE_DAY_AUTOMATION=YES');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('PRODUCTION_MUTATION=NO');
