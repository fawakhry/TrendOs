import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(mod.includes("if(action==='saveAccountingDeptLine')"));
assert.ok(mod.includes("/^A212-DLINE-/"));
assert.ok(mod.includes("/^A2-CANARY-DEPT-/"));
assert.ok(mod.includes("department==='عام'"));
assert.ok(mod.includes("/^A2-CANARY-DEPT-LINE-/"));
assert.ok(mod.includes("Math.abs(qty-1)<=0.000001"));
assert.ok(mod.includes("employee-accounting-canary-dept-line-shape-blocked"));

assert.ok(mod.includes("const ctx=await beginCommandV1(env,auth,'dept-line-upsert'"));
assert.ok(mod.includes("await auditEventV1(env,ctx,'dept-line',id,existing?'update':'create'"));
assert.ok(mod.includes("INSERT INTO employee_accounting_dept_lines_v1"));
assert.ok(mod.includes("const materialName=text(b.materialName)"));
assert.ok(mod.includes("materialConsumption=num(b.materialConsumption||b.consumption||b.consumedAreaTotal)"));

console.log('A212_DEPT_LINE_SERVER_GUARD=PASS');
console.log('A212_REQUEST_PREFIX=A212-DLINE-');
console.log('A212_ORDER_PREFIX=A2-CANARY-DEPT-');
console.log('A212_ITEM_PREFIX=A2-CANARY-DEPT-LINE-');
console.log('A212_DEPARTMENT=عام');
console.log('A212_QTY=1');
console.log('A212_MAX_AMOUNT=0');
console.log('A212_EXPECTED_DEPT_LINE_DELTA=1');
console.log('A212_EXPECTED_STOCK_MOVE_DELTA=0');
console.log('A212_EXPECTED_CASHBOX_DELTA=0');
console.log('A212_EXPECTED_PARTY_LEDGER_DELTA=0');
console.log('A212_EXPECTED_REQUEST_LEDGER_DELTA=1');
console.log('A212_EXPECTED_EVENTS_DELTA=1');
console.log('PRODUCTION_MUTATION=NO');
