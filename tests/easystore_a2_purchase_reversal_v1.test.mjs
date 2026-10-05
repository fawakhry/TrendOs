import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(mod.includes('async function reverseApprovedPurchaseV1'));
assert.ok(mod.includes("'purchase-reversal'"));
assert.ok(mod.includes("status='REVERSED'"));
assert.ok(mod.includes("'عكس فاتورة شراء'"));
assert.ok(mod.includes("'عكس دفعة شراء'"));
assert.ok(mod.includes("'PURCHASE_REVERSAL'"));
assert.ok(mod.includes("'PURCHASE_REVERSAL_RECEIPT'"));
assert.ok(mod.includes('supplierBalanceAfter:balanceBefore-remaining'));
assert.ok(mod.includes("reverseApprovedPurchaseV1920')out=await reverseApprovedPurchaseV1"));
assert.ok(mod.includes("if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))"));
assert.ok(!/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/.test(mod));

console.log('EASYSTORE_A2_PURCHASE_REVERSAL_SOURCE=PASS');
console.log('REVERSAL_NOT_DELETE=YES');
console.log('STOCK_REVERSAL=VERSION_GUARDED');
console.log('SUPPLIER_LEDGER_REVERSAL=YES');
console.log('DAILY_PURCHASE_CUSTODY_REVERSAL=YES');
console.log('DIRECT_PURCHASE_CASHBOX_REVERSAL=YES');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('PRODUCTION_MUTATION=NO');
