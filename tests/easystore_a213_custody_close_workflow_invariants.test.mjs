import assert from 'node:assert/strict';
import fs from 'node:fs';

const deploy=fs.readFileSync('.github/workflows/easystore-a213-custody-close-guard-readonly-deploy.yml','utf8');
const exec=fs.readFileSync('.github/workflows/easystore-a213-custody-close-canary-execution.yml','utf8');

for (const [name,yaml] of [['deploy',deploy],['execution',exec]]) {
  assert.match(yaml,/on:\s*\n\s*workflow_dispatch:\s*/m,name+' must stay manual-only');
  assert.doesNotMatch(yaml,/on:\s*\n\s*push:/m,name+' must not have push trigger');
  assert.ok(!yaml.includes("mode='GENERAL'"),name+' must never open GENERAL');
}

for (const token of ['materials:1','templates:1','parties:1','partyBalances:1','waste:1','deptLines:1','custodyCloses:0','requestLedger:6','events:6']) {
  assert.ok(deploy.includes(token),'deploy missing '+token);
}
assert.ok(deploy.includes('A213_DEPLOY_PRE=READONLY_SIX_CANARY_ZERO_CUSTODY_CLOSE_BASELINE'));
assert.ok(deploy.includes('A213_DEPLOY_CUSTODY_CLOSE_GUARD_LIVE=YES'));
assert.ok(deploy.includes('wrangler rollback'));

assert.ok(exec.includes("allowed_usernames_json='[\"ضياء\"]'"));
assert.ok(exec.includes("allowed_actions_json='[\"closePurchaseCustodyV1920\"]'"));
assert.ok(exec.includes('max_amount=0,max_commands=1,commands_started=0'));
assert.ok(exec.includes("SET mode='CANARY'"));
assert.ok(exec.includes("SET mode='READONLY'"));
assert.ok(exec.includes("A213-CCLOSE-"));
assert.ok(exec.includes("A2-CANARY-CUSTODY-"));
assert.ok(exec.includes("2099-12-31"));
assert.ok(exec.includes("q.operation!=='custody-close'"));
assert.ok(exec.includes("e.entity_type!=='custody-close'"));
assert.ok(exec.includes("e.event_type!=='close'"));
assert.ok(exec.includes('Number(r.custodyCloses||0)===1'));
assert.ok(exec.includes('Number(r.requestLedger||0)===7'));
assert.ok(exec.includes('Number(r.events||0)===7'));
assert.ok(exec.includes('Number(ce.custodyEventCount)!==0'));
assert.ok(exec.includes('Number(cc.cashCount)!==0'));
assert.ok(exec.includes('Number(sc.stockCount)!==0'));
assert.ok(exec.includes('Number(lc.ledgerCount)!==0'));
assert.ok(exec.includes('A213_EXEC_SERVER_AUTO_DISABLED=PASS'));

console.log('A213_CUSTODY_CLOSE_DEPLOY_WORKFLOW_MANUAL_ONLY=PASS');
console.log('A213_CUSTODY_CLOSE_EXECUTION_WORKFLOW_MANUAL_ONLY=PASS');
console.log('A213_CUSTODY_CLOSE_SIX_CANARY_BASELINE_LOCKED=PASS');
console.log('A213_CUSTODY_CLOSE_ONE_USER_ONE_ACTION_ONE_COMMAND=PASS');
console.log('A213_CUSTODY_CLOSE_ZERO_BALANCE_ONLY=PASS');
console.log('A213_CUSTODY_CLOSE_CASH_STOCK_LEDGER_FORBIDDEN=PASS');
console.log('A213_CUSTODY_CLOSE_GENERAL_FORBIDDEN=PASS');
console.log('PRODUCTION_MUTATION=NO');
