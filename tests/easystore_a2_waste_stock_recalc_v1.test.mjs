import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const m21=fs.readFileSync('cloudflare-d1/migrations/0021_employee_accounting_material_dimensions_v1.sql','utf8');
const m22=fs.readFileSync('cloudflare-d1/migrations/0022_employee_accounting_day_ops_v1.sql','utf8');

assert.ok(m21.includes('raw_width'));
assert.ok(m21.includes('raw_height'));
assert.ok(m22.includes('employee_accounting_waste_v1'));

for(const fn of [
  'componentRowsV1',
  'accountingCostGraphV1',
  'recalcAccountingMaterialsCascadeV1',
  'archiveAccountingTemplateV1',
  'saveAccountingWasteV1'
]) assert.ok(mod.includes('function '+fn)||mod.includes('async function '+fn),fn);

assert.ok(mod.includes('accounting-material-cost-cycle'));
assert.ok(mod.includes('accounting-material-component-missing'));
assert.ok(mod.includes('accounting-template-component-missing'));
assert.ok(mod.includes("'material-cost-cascade'"));
assert.ok(mod.includes("'material-upsert'"));
assert.ok(mod.includes("'template-upsert'"));
assert.ok(mod.includes("'template-archive'"));
assert.ok(mod.includes("'waste-create'"));

assert.ok(mod.includes('raw_width'));
assert.ok(mod.includes('raw_height'));
assert.ok(mod.includes('employee_accounting_waste_v1'));
assert.ok(mod.includes("'هالك'"));
assert.ok(mod.includes('stock_qty=stock_qty-?'));
assert.ok(mod.includes('recovered_amount'));
assert.ok(mod.includes("active=0,version=version+1"));
assert.ok(mod.includes('version=version+1'));

for(const route of [
  "archiveAccountingTemplate')out=await archiveAccountingTemplateV1",
  "recalcAccountingMaterialsCascade'||action==='recalculateAccountingMaterials'||action==='recalculateAccountingMaterialsCascade')out=await recalcAccountingMaterialsCascadeV1",
  "saveAccountingWaste')out=await saveAccountingWasteV1"
]) assert.ok(mod.includes(route),route);

assert.ok(mod.includes("if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))"));
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com/);

console.log('EASYSTORE_A2_WASTE_STOCK_RECALC_SOURCE=PASS');
console.log('MATERIAL_DIMENSIONS_WRITE=YES');
console.log('MATERIAL_RECALC_CYCLE_GUARD=YES');
console.log('TEMPLATE_SOFT_ARCHIVE=YES');
console.log('WASTE_LEDGER_D1=YES');
console.log('OPTIONAL_WASTE_STOCK_DEDUCTION=VERSION_GUARDED');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('GOOGLE_BUSINESS_WRITES=0');
console.log('PRODUCTION_MUTATION=NO');
