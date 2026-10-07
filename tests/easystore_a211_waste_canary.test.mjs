import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(mod.includes("if(action==='saveAccountingWaste')"));
assert.ok(mod.includes('/^A2-CANARY-WASTE-/'));
assert.ok(mod.includes("reason==='A2_CANARY'"));
assert.ok(mod.includes("department==='عام'"));
assert.ok(mod.includes('Math.abs(amount-0.01)<=0.000001'));
assert.ok(mod.includes('recovered===0'));
assert.ok(mod.includes('materialQty===0'));
for (const expr of [
  '!text(b.materialId)',
  '!text(b.materialName||b.material)',
  '!text(b.itemName)',
  '!text(b.lineId)',
  '!text(b.evidenceRef||b.evidence)',
  '!text(b.notes)',
  '!text(b.wasteId||b.id)'
]) assert.ok(mod.includes(expr), 'missing Waste guard '+expr);
assert.ok(mod.includes('employee-accounting-canary-waste-shape-blocked'));
assert.ok(mod.includes("const id=text(b.wasteId||b.id)||uid('WASTE')"));
assert.ok(mod.includes("ctx=await beginCommandV1(env,auth,'waste-create'"));
assert.ok(mod.includes("await auditEventV1(env,ctx,'waste',id,'create'"));
assert.ok(mod.includes('if(material&&materialQty>0){'));
assert.ok(mod.includes('employee_accounting_stock_moves_v1'));
assert.ok(mod.includes('if(!(amount>0)||recovered<0||recovered>amount)'));

console.log('A211_WASTE_CANARY_SERVER_GUARD=PASS');
console.log('A211_WASTE_SYNTHETIC_ORDER_REQUIRED=YES');
console.log('A211_WASTE_AMOUNT=0.01');
console.log('A211_WASTE_RECOVERED=0');
console.log('A211_WASTE_MATERIAL=NONE');
console.log('A211_EXPECTED_WASTE_DELTA=1');
console.log('A211_EXPECTED_STOCK_MOVE_DELTA=0');
console.log('A211_EXPECTED_CASHBOX_DELTA=0');
console.log('A211_EXPECTED_PARTY_LEDGER_DELTA=0');
console.log('A211_EXPECTED_REQUEST_LEDGER_DELTA=1');
console.log('A211_EXPECTED_EVENTS_DELTA=1');
console.log('PRODUCTION_MUTATION=NO');
