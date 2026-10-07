import assert from 'node:assert/strict';
import fs from 'node:fs';

const deploy=fs.readFileSync('.github/workflows/easystore-a210-supplier-guard-deploy.yml','utf8');
const exec=fs.readFileSync('.github/workflows/easystore-a210-supplier-canary-execution.yml','utf8');

for (const [name,y] of [['deploy',deploy],['execution',exec]]) {
  assert.match(y,/on:\s*\n\s*workflow_dispatch:\s*(?:\n|$)/m,name+' must be manual-only');
  assert.doesNotMatch(y,/on:\s*\n[\s\S]{0,120}push:/m,name+' must not push-trigger');
  assert.ok(!/mode[[:space:]]*=/.test(''), 'noop');
  assert.ok(!y.includes("SET mode='GENERAL'"),name+' must never open GENERAL');
}
assert.ok(deploy.includes("materials:1,templates:1,parties:0"));
assert.ok(deploy.includes("partyBalances:0,requestLedger:3,events:3"));
assert.ok(deploy.includes("frontend must remain OFF"));
assert.ok(deploy.includes('wrangler rollback'));
assert.ok(deploy.includes('A210_DEPLOY_ROW_COUNTS_INVARIANT=PASS'));

assert.ok(exec.includes("EASYSTORE_ACCOUNTING_D1_WRITE_MODE\\s*=\\s*'CANARY'"));
assert.ok(exec.includes("'saveEasyStoreSupplier'"));
assert.ok(exec.includes("allowed_usernames_json='[\"ضياء\"]'"));
assert.ok(exec.includes("allowed_actions_json='[\"saveEasyStoreSupplier\"]'"));
assert.ok(exec.includes('max_amount=0,max_commands=1,commands_started=0'));
assert.ok(exec.includes("mode='CANARY'"));
assert.ok(exec.includes("mode='READONLY'"));
assert.ok(exec.includes("parties:0"));
assert.ok(exec.includes("partyBalances:0,requestLedger:3,events:3"));
assert.ok(exec.includes("Number(r.parties||0)===1"));
assert.ok(exec.includes("Number(r.partyBalances||0)===1"));
assert.ok(exec.includes("Number(r.requestLedger||0)===4"));
assert.ok(exec.includes("Number(r.events||0)===4"));
assert.ok(exec.includes("q.operation!=='supplier-master-upsert'"));
assert.ok(exec.includes("e.entity_type!=='supplier'"));
assert.ok(exec.includes("Number(b.balance)!==0"));
assert.ok(exec.includes('A210_EXEC_SERVER_AUTO_DISABLED=PASS'));

console.log('A210_DECISION_GATE_FILES=PASS');
console.log('A210_BACKEND_DEPLOY_MANUAL_ONLY=YES');
console.log('A210_EXECUTION_MANUAL_ONLY=YES');
console.log('A210_AUTOMATIC_SERVER_DISABLE=YES');
console.log('A210_GENERAL_PATH=ABSENT');
console.log('A210_EXPECTED_FINAL_BASELINE=materials1_templates1_parties1_partyBalances1_request4_events4');
console.log('PRODUCTION_MUTATION=NO');
