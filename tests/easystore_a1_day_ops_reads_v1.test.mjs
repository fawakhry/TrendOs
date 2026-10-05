import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0022_employee_accounting_day_ops_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

for(const table of [
  'employee_accounting_purchase_invoices_v1',
  'employee_accounting_daily_purchases_v1',
  'employee_accounting_cashbox_v1',
  'employee_accounting_waste_v1',
  'employee_accounting_custody_events_v1',
  'employee_accounting_custody_closes_v1',
  'employee_accounting_day_closes_v1'
]) assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS '+table),table);

assert.ok(sql.includes('ADD COLUMN work_date TEXT NOT NULL DEFAULT'));
assert.ok(sql.includes("status TEXT NOT NULL DEFAULT 'PENDING'"));
assert.ok(sql.includes('request_key TEXT NOT NULL UNIQUE'));
assert.ok(sql.includes('UNIQUE(work_date,employee_key,department)'));
assert.ok(sql.includes('UNIQUE(work_date,department)'));

const readLine=mod.split(String.fromCharCode(10)).find(x=>x.includes('const READ_ACTIONS=new Set'))||'';
for(const action of ['getDailyDepartmentReportV1920','previewAccountingAutomationV1921']){
  assert.ok(readLine.includes("'"+action+"'"),action);
}
assert.ok(mod.includes('async function automationPreviewV1'));
assert.ok(mod.includes('async function dailyDepartmentReportV1'));
assert.ok(mod.includes('async function custodySummariesV1'));
assert.ok(mod.includes("WHERE work_date=? AND status='PENDING'"));
assert.ok(mod.includes("WHERE work_date=? AND final_invoice_no=''"));
assert.ok(mod.includes("integrity_status AS integrityStatus"));
assert.ok(mod.includes("ready:blockers.length===0"));
assert.ok(mod.includes("report.profit=report.sales-report.actualJobCost-report.netWaste"));
assert.ok(!/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/.test(mod));

console.log('EASYSTORE_A1_DAY_OPS_READS_SOURCE=PASS');
console.log('DAILY_REPORT_D1=YES');
console.log('AUTOMATION_PREVIEW_D1=YES');
console.log('DAY_OPS_TABLE_COUNT=7');
console.log('GOOGLE_BUSINESS_CALLS=0');
console.log('PRODUCTION_MUTATION=NO');
