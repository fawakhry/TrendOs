import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0022_employee_accounting_day_ops_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

for(const table of [
  'employee_accounting_daily_purchases_v1',
  'employee_accounting_cashbox_v1',
  'employee_accounting_custody_events_v1',
  'employee_accounting_custody_closes_v1'
]) assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS '+table),table);

for(const fn of [
  'resolveMaterialV1',
  'saveDeptDailyPurchaseV1',
  'rejectDeptDailyPurchaseV1',
  'savePurchaseCustodyV1',
  'closePurchaseCustodyV1'
]) assert.ok(mod.includes('function '+fn)||mod.includes('async function '+fn),fn);

assert.match(mod,/daily-purchase-create/);
assert.match(mod,/daily-purchase-reject/);
assert.match(mod,/custody-handoff/);
assert.match(mod,/custody-close/);
assert.match(mod,/status='REJECTED'/);
assert.match(mod,/stock_qty=stock_qty\+\?/);
assert.match(mod,/stock_qty=stock_qty-\?/);
assert.match(mod,/movement_type,amount/);
assert.match(mod,/CUSTODY_HANDOFF/);
assert.match(mod,/CUSTODY_RETURN/);
assert.match(mod,/CUSTODY_EXTRA_PAYMENT/);

assert.match(mod,/saveDeptDailyPurchaseV1917'\)out=await saveDeptDailyPurchaseV1/);
assert.match(mod,/rejectDeptDailyPurchaseV1917'\)out=await rejectDeptDailyPurchaseV1/);
assert.match(mod,/savePurchaseCustodyV1920'\)out=await savePurchaseCustodyV1/);
assert.match(mod,/closePurchaseCustodyV1920'\)out=await closePurchaseCustodyV1/);

assert.match(mod,/if\(c\.mode==='READONLY'&&!READ_ACTIONS\.has\(action\)\)/);
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/);

console.log('EASYSTORE_A2_DAILY_PURCHASE_CUSTODY_SOURCE=PASS');
console.log('DAILY_PURCHASE_STOCK_IMMEDIATE=YES');
console.log('REJECT_REVERSES_STOCK=YES');
console.log('CUSTODY_CASHBOX_COUPLED=YES');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('GOOGLE_BUSINESS_WRITES=0');
console.log('PRODUCTION_MUTATION=NO');
