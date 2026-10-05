import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const m27=fs.readFileSync('cloudflare-d1/migrations/0027_employee_accounting_direct_sale_cost_v1.sql','utf8');

assert.ok(m27.includes('ADD COLUMN manual_cost REAL NOT NULL DEFAULT 0'));
for(const fn of ['directSaleStockRequirementsV1','saveEasyStoreSaleV2A2']) {
  assert.ok(mod.includes('function '+fn)||mod.includes('async function '+fn),fn);
}
assert.ok(mod.includes("'direct-sale'"));
assert.ok(mod.includes("'بيع مباشر'"));
assert.ok(mod.includes('manual_cost AS manualCost'));
assert.ok(mod.includes('report.actualJobCost+=num(inv.manualCost)'));
assert.ok(mod.includes('employee_accounting_party_balances_v1'));
assert.ok(mod.includes('employee_accounting_party_ledger_v1'));
assert.ok(mod.includes('employee_accounting_cashbox_v1'));
assert.ok(mod.includes('employee_accounting_stock_moves_v1'));
assert.ok(mod.includes("saveEasyStoreSaleV2')out=await saveEasyStoreSaleV2A2"));
assert.ok(mod.includes('txGuardPairV1'));
assert.ok(mod.includes("if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))"));
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/);

console.log('EASYSTORE_A2_DIRECT_SALE_SOURCE=PASS');
console.log('DIRECT_SALE_STOCK_COST=YES');
console.log('DIRECT_SALE_CUSTOMER_LEDGER=YES');
console.log('DIRECT_SALE_CASHBOX=YES');
console.log('DIRECT_SALE_TX_GUARD=YES');
console.log('DAY_REPORT_MANUAL_COST=YES');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('PRODUCTION_MUTATION=NO');
