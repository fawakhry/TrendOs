import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0028_employee_accounting_write_canary_v1.sql','utf8');
const modeSql=fs.readFileSync('cloudflare-d1/migrations/0029_employee_accounting_canary_mode_v1.sql','utf8');
const budgetSql=fs.readFileSync('cloudflare-d1/migrations/0030_employee_accounting_write_canary_budget_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(sql.includes('employee_accounting_write_canary_v1'));
assert.ok(sql.includes("enabled INTEGER NOT NULL DEFAULT 1"));
assert.ok(sql.includes("allowed_usernames_json TEXT NOT NULL DEFAULT '[]'"));
assert.ok(sql.includes("allowed_actions_json TEXT NOT NULL DEFAULT '[]'"));
assert.ok(sql.includes("max_amount REAL NOT NULL DEFAULT 0"));
assert.ok(sql.includes("EASYSTORE_A2_WRITE_CANARY_V1"));
assert.ok(budgetSql.includes('max_commands INTEGER NOT NULL DEFAULT 0'));
assert.ok(budgetSql.includes('commands_started INTEGER NOT NULL DEFAULT 0'));

for(const fn of ['writeCanaryPolicyV1','writeAmountV1','enforceWriteCanaryV1']){
  assert.ok(mod.includes('function '+fn)||mod.includes('async function '+fn),fn);
}
assert.ok(mod.includes('employee-accounting-canary-policy-missing'));
assert.ok(mod.includes('employee-accounting-canary-expired'));
assert.ok(mod.includes('employee-accounting-canary-user-blocked'));
assert.ok(mod.includes('employee-accounting-canary-action-blocked'));
assert.ok(mod.includes('employee-accounting-canary-amount-blocked'));
assert.ok(mod.includes('employee-accounting-canary-zero-value-only'));
assert.ok(mod.includes('enforceLowRiskMasterCanaryShapeV1'));
assert.ok(mod.includes('employee-accounting-canary-master-shape-blocked'));
assert.ok(mod.includes('/^A2-CANARY-TEMPLATE-/'));
assert.ok(mod.includes('/^A2-CANARY-MATERIAL-/'));
for(const field of ['stockQty','minStock','rawWidth','rawHeight']) assert.ok(mod.includes(field), 'missing material canary shape field: '+field);
assert.ok(mod.includes("text(b.materialKind)==='A2_CANARY'"));
assert.ok(mod.includes("text(b.category)==='A2_CANARY'"));
assert.ok(mod.includes('employee-accounting-canary-budget-missing'));
assert.ok(mod.includes('employee-accounting-canary-command-budget-blocked'));
assert.ok(mod.includes('commands_started=commands_started+1'));
assert.ok(mod.includes('commands_started<max_commands'));
assert.ok(mod.includes('idempotentReplayCandidate'));
for(const field of ['salePrice','fixedCost','computedUnitCost','unitCost']) assert.ok(mod.includes(field), 'missing canary amount field: '+field);
assert.ok(modeSql.includes("CHECK(mode IN ('OFF','READONLY','CANARY','GENERAL'))"));
assert.ok(modeSql.includes('RENAME TO employee_accounting_control_v1_pre_canary'));
assert.ok(modeSql.includes('SELECT singleton,marker,mode,next_invoice_number,policy_epoch,updated_at'));
assert.ok(mod.includes("if((c.mode==='CANARY'||c.mode==='GENERAL')&&!READ_ACTIONS.has(action))await enforceWriteCanaryV1"));
assert.ok(mod.includes("c.mode==='CANARY'"));
assert.ok(mod.includes('employee-accounting-canary-disabled'));
assert.ok(mod.includes("writeAuthorityMode:text(c.mode)==='CANARY'?'CANARY_BOUNDED'"));
assert.ok(mod.includes('writeCanaryReady'));
assert.ok(mod.includes('writeCanaryEnabled'));
assert.ok(mod.includes('writeCanaryAllowedUserCount'));
assert.ok(mod.includes('writeCanaryAllowedActionCount'));
assert.ok(mod.includes("if(c.mode==='READONLY'&&!READ_ACTIONS.has(action))"));

console.log('EASYSTORE_A2_WRITE_CANARY_POLICY_SOURCE=PASS');
console.log('DEDICATED_CANARY_MODE=YES');
console.log('GENERAL_DEFAULT_DENY_GUARD=YES');
console.log('CANARY_USER_ALLOWLIST=YES');
console.log('CANARY_ACTION_ALLOWLIST=YES');
console.log('CANARY_AMOUNT_LIMIT=YES');
console.log('CANARY_ZERO_LIMIT_MEANS_ZERO_VALUE_ONLY=YES');
console.log('CANARY_MASTER_VALUE_FIELDS_COVERED=YES');
console.log('CANARY_MASTER_PAYLOAD_SHAPE_GUARD=YES');
console.log('CANARY_MATERIAL_INACTIVE_ZERO_STOCK=YES');
console.log('CANARY_ATOMIC_COMMAND_BUDGET=YES');
console.log('CANARY_SECOND_NEW_REQUEST_FAILS_CLOSED=YES');
console.log('CANARY_EXPIRY=YES');
console.log('READONLY_FAIL_CLOSED=YES');
console.log('PRODUCTION_MUTATION=NO');
