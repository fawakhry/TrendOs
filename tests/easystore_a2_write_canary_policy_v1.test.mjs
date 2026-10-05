import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0028_employee_accounting_write_canary_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(sql.includes('employee_accounting_write_canary_v1'));
assert.ok(sql.includes("enabled INTEGER NOT NULL DEFAULT 1"));
assert.ok(sql.includes("allowed_usernames_json TEXT NOT NULL DEFAULT '[]'"));
assert.ok(sql.includes("allowed_actions_json TEXT NOT NULL DEFAULT '[]'"));
assert.ok(sql.includes("max_amount REAL NOT NULL DEFAULT 0"));
assert.ok(sql.includes("EASYSTORE_A2_WRITE_CANARY_V1"));

for(const fn of ['writeCanaryPolicyV1','writeAmountV1','enforceWriteCanaryV1']){
  assert.ok(mod.includes('function '+fn)||mod.includes('async function '+fn),fn);
}
assert.ok(mod.includes('employee-accounting-canary-policy-missing'));
assert.ok(mod.includes('employee-accounting-canary-expired'));
assert.ok(mod.includes('employee-accounting-canary-user-blocked'));
assert.ok(mod.includes('employee-accounting-canary-action-blocked'));
assert.ok(mod.includes('employee-accounting-canary-amount-blocked'));
assert.ok(mod.includes("if(c.mode==='GENERAL'&&!READ_ACTIONS.has(action))await enforceWriteCanaryV1"));
assert.ok(mod.includes('writeCanaryReady'));
assert.ok(mod.includes('writeCanaryEnabled'));
assert.ok(mod.includes('writeCanaryAllowedUserCount'));
assert.ok(mod.includes('writeCanaryAllowedActionCount'));
assert.ok(mod.includes("if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))"));

console.log('EASYSTORE_A2_WRITE_CANARY_POLICY_SOURCE=PASS');
console.log('GENERAL_DEFAULT_DENY_GUARD=YES');
console.log('CANARY_USER_ALLOWLIST=YES');
console.log('CANARY_ACTION_ALLOWLIST=YES');
console.log('CANARY_AMOUNT_LIMIT=YES');
console.log('CANARY_EXPIRY=YES');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('PRODUCTION_MUTATION=NO');
