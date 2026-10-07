import assert from 'node:assert/strict';
import fs from 'node:fs';

const deploy=fs.readFileSync('.github/workflows/easystore-a212-dept-line-guard-readonly-deploy.yml','utf8');
const exec=fs.readFileSync('.github/workflows/easystore-a212-dept-line-canary-execution.yml','utf8');

for (const [name,yaml] of [['deploy',deploy],['execution',exec]]) {
  assert.match(yaml,/on:\s*\n\s*workflow_dispatch:\s*/m,name+' must stay manual-only');
  assert.doesNotMatch(yaml,/on:\s*\n\s*push:/m,name+' must not have push trigger');
  assert.ok(!yaml.includes("mode='GENERAL'"),name+' must never open GENERAL');
}

for (const token of ['materials:1','templates:1','parties:1','partyBalances:1','waste:1','deptLines:0','requestLedger:5','events:5']) {
  assert.ok(deploy.includes(token),'deploy missing '+token);
}
assert.ok(deploy.includes('A212_DEPLOY_PRE=READONLY_FIVE_CANARY_ZERO_DEPT_LINE_BASELINE'));
assert.ok(deploy.includes('A212_DEPLOY_DEPT_LINE_GUARD_LIVE=YES'));
assert.ok(deploy.includes('wrangler rollback'));
assert.ok(!/UPDATE\s+employee_accounting_/i.test(deploy),'readonly deploy must not mutate accounting tables');

assert.ok(exec.includes("allowed_usernames_json='[\"ضياء\"]'"));
assert.ok(exec.includes("allowed_actions_json='[\"saveAccountingDeptLine\"]'"));
assert.ok(exec.includes('max_amount=0,max_commands=1,commands_started=0'));
assert.ok(exec.includes("SET mode='CANARY'"));
assert.ok(exec.includes("SET mode='READONLY'"));
assert.ok(exec.includes("newAccountingRequestId('A212-DLINE')"));
assert.ok(exec.includes('A2-CANARY-DEPT-'));
assert.ok(exec.includes('A2-CANARY-DEPT-LINE-'));
assert.ok(exec.includes("q.operation!=='dept-line-upsert'"));
assert.ok(exec.includes("e.entity_type!=='dept-line'"));
assert.ok(exec.includes("e.event_type!=='create'"));
assert.ok(exec.includes('Number(r.deptLines||0)===1'));
assert.ok(exec.includes('Number(r.requestLedger||0)===6'));
assert.ok(exec.includes('Number(r.events||0)===6'));
assert.ok(exec.includes('Number(sc.stockCount)!==0'));
assert.ok(exec.includes('Number(cc.cashCount)!==0'));
assert.ok(exec.includes('Number(lc.ledgerCount)!==0'));
assert.ok(exec.includes('A212_EXEC_SERVER_AUTO_DISABLED=PASS'));

console.log('A212_DEPT_LINE_DEPLOY_WORKFLOW_MANUAL_ONLY=PASS');
console.log('A212_DEPT_LINE_EXECUTION_WORKFLOW_MANUAL_ONLY=PASS');
console.log('A212_DEPT_LINE_FIVE_CANARY_BASELINE_LOCKED=PASS');
console.log('A212_DEPT_LINE_ONE_USER_ONE_ACTION_ONE_COMMAND=PASS');
console.log('A212_DEPT_LINE_ZERO_VALUE_ONLY=PASS');
console.log('A212_DEPT_LINE_STOCK_CASH_LEDGER_FORBIDDEN=PASS');
console.log('A212_DEPT_LINE_GENERAL_FORBIDDEN=PASS');
console.log('PRODUCTION_MUTATION=NO');
