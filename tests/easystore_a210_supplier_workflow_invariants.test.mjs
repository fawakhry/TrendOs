import assert from 'node:assert/strict';
import fs from 'node:fs';

const deploy=fs.readFileSync('.github/workflows/easystore-a210-supplier-guard-readonly-deploy.yml','utf8');
const exec=fs.readFileSync('.github/workflows/easystore-a210-supplier-canary-execution.yml','utf8');

for (const [name,yaml] of [['deploy',deploy],['execution',exec]]) {
  assert.match(yaml,/on:\s*\n\s*workflow_dispatch:\s*/m,name+' must stay manual-only');
  assert.doesNotMatch(yaml,/on:\s*\n\s*push:/m,name+' must not have push trigger');
  assert.ok(!yaml.includes("mode='GENERAL'"),name+' must never open GENERAL');
}

assert.ok(deploy.includes('A210_DEPLOY_PRE=READONLY_THREE_CANARY_ZERO_PARTY_BASELINE'));
assert.ok(deploy.includes("EASYSTORE_ACCOUNTING_D1_WRITE_MODE\\s*=\\s*'OFF'"));
assert.ok(deploy.includes('materials:1'));
assert.ok(deploy.includes('templates:1'));
assert.ok(deploy.includes('parties:0'));
assert.ok(deploy.includes('partyBalances:0'));
assert.ok(deploy.includes('requestLedger:3'));
assert.ok(deploy.includes('events:3'));
assert.ok(deploy.includes('A210_DEPLOY_SUPPLIER_GUARD_LIVE=YES'));
assert.ok(deploy.includes('wrangler rollback'));
assert.ok(!/UPDATE\s+employee_accounting_/i.test(deploy),'readonly deploy must not mutate accounting tables');

assert.ok(exec.includes("allowed_usernames_json='[\"ضياء\"]'"));
assert.ok(exec.includes("allowed_actions_json='[\"saveEasyStoreSupplier\"]'"));
assert.ok(exec.includes('max_amount=0,max_commands=1,commands_started=0'));
assert.ok(exec.includes("SET mode='CANARY'"));
assert.ok(exec.includes("SET mode='READONLY'"));
assert.ok(exec.includes("newAccountingRequestId('A210-SUP')"));
assert.ok(exec.includes('A2-CANARY-SUPPLIER-'));
assert.ok(exec.includes("q.operation!=='supplier-master-upsert'"));
assert.ok(exec.includes("e.entity_type!=='supplier'"));
assert.ok(exec.includes("e.event_type!=='create'"));
assert.ok(exec.includes('Number(r.parties||0)===1'));
assert.ok(exec.includes('Number(r.partyBalances||0)===1'));
assert.ok(exec.includes('Number(r.requestLedger||0)===4'));
assert.ok(exec.includes('Number(r.events||0)===4'));
assert.ok(exec.includes('A210_EXEC_SERVER_AUTO_DISABLED=PASS'));

console.log('A210_SUPPLIER_DEPLOY_WORKFLOW_MANUAL_ONLY=PASS');
console.log('A210_SUPPLIER_EXECUTION_WORKFLOW_MANUAL_ONLY=PASS');
console.log('A210_SUPPLIER_THREE_CANARY_BASELINE_LOCKED=PASS');
console.log('A210_SUPPLIER_ONE_USER_ONE_ACTION_ONE_COMMAND=PASS');
console.log('A210_SUPPLIER_GENERAL_FORBIDDEN=PASS');
console.log('PRODUCTION_MUTATION=NO');
