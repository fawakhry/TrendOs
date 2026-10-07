import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(mod.includes("if(action==='closePurchaseCustodyV1920')"));
assert.ok(mod.includes("/^A213-CCLOSE-/"));
assert.ok(mod.includes("/^A2-CANARY-CUSTODY-/"));
assert.ok(mod.includes("department==='عام'"));
assert.ok(mod.includes("workDate==='2099-12-31'"));
assert.ok(mod.includes("employee-accounting-canary-custody-close-shape-blocked"));

assert.ok(mod.includes("async function closePurchaseCustodyV1"));
assert.ok(mod.includes("const current=(await custodySummariesV1(env,workDate)).find"));
assert.ok(mod.includes("const balance=num(current.balance),amount=Math.abs(balance),movement=balance>0?'RETURN':balance<0?'EXTRA_PAYMENT':'';"));
assert.ok(mod.includes("if(amount>0){"));
assert.ok(mod.includes("INSERT INTO employee_accounting_custody_closes_v1"));
assert.ok(mod.includes("await auditEventV1(env,ctx,'custody-close',closeId,'close'"));

console.log('A213_CUSTODY_CLOSE_SERVER_GUARD=PASS');
console.log('A213_REQUEST_PREFIX=A213-CCLOSE-');
console.log('A213_EMPLOYEE_PREFIX=A2-CANARY-CUSTODY-');
console.log('A213_DEPARTMENT=عام');
console.log('A213_WORK_DATE=2099-12-31');
console.log('A213_ZERO_BALANCE_ONLY=YES');
console.log('A213_EXPECTED_CUSTODY_CLOSE_DELTA=1');
console.log('A213_EXPECTED_CUSTODY_EVENT_DELTA=0');
console.log('A213_EXPECTED_CASHBOX_DELTA=0');
console.log('A213_EXPECTED_STOCK_MOVE_DELTA=0');
console.log('A213_EXPECTED_PARTY_LEDGER_DELTA=0');
console.log('A213_EXPECTED_REQUEST_LEDGER_DELTA=1');
console.log('A213_EXPECTED_EVENTS_DELTA=1');
console.log('PRODUCTION_MUTATION=NO');
