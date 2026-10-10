import assert from 'node:assert/strict';
import fs from 'node:fs';

const file='.github/workflows/easystore-a213-custody-close-canary-execution.yml';
const actual=fs.readFileSync(file,'utf8');

// Validate the existing MONEY-MOVING workflow is fail-closed on a real
// published browser bootstrap, using its own GET downloads BEFORE D1 arming.
// This executable static gate never dispatches the financial workflow.
function check(workflow){
  const one=(token)=> {
    const index=workflow.indexOf(token);
    assert.ok(index>=0,'missing required audited step: '+token);
    assert.equal(workflow.indexOf(token,index+token.length),-1,'duplicated token: '+token);
    return index;
  };
  const preflight=one('      - name: Preflight exact A2.13 Custody Close scope');
  const arm=one('      - name: Arm one zero-balance Custody Close command, wait for Diaa, then auto-disable');
  const config=one('curl -fsSL "$EASYSTORE_URL/config.js?a213exec=$GITHUB_RUN_ID" > /tmp/config.js');
  const app=one('curl -fsSL "$EASYSTORE_URL/app.js?a213exec=$GITHUB_RUN_ID" > /tmp/app.js');
  const syntax=one('node --check /tmp/app.js');
  const liveBoot=one('node tests/easystore_a213_published_boot_gate.test.mjs /tmp/config.js /tmp/app.js --expect-canary');
  const marker=one('A213_EXEC_PUBLISHED_BOOT_PREFLIGHT=PASS');
  const health=one('curl -fsS "$API_URL/v1/employee/accounting/health?a213exec=$GITHUB_RUN_ID" > /tmp/health.json');
  assert.ok(preflight<config && config<app && app<syntax && syntax<liveBoot &&
    liveBoot<marker && marker<health && health<arm,
    'real fetched JS must be boot-tested in manual preflight before any D1 CANARY arming');
  assert.match(workflow,/on:\s*\n\s*workflow_dispatch:/,'must remain a manually authorized workflow');
  assert.doesNotMatch(workflow,/on:\s*\n\s*push:/,'manual financial workflow must not auto-dispatch');
  for(const lock of ['A213_SETTLEMENT_WAIT_MS=120000','A213_EXEC_UNKNOWN_OUTCOME_DO_NOT_RETRY',
    'A213_EXEC_CLEANUP_VERIFIED=PASS',"max_amount=0,max_commands=1,commands_started=0",
    'A213_EXEC_EXACT_D1_EVIDENCE=PASS','A213_EXEC_SERVER_AUTO_DISABLED=PASS']) {
    assert.ok(workflow.includes(lock),'required bounded and rollback guard missing '+lock);
  }
  assert.ok(workflow.indexOf("SET mode='CANARY'")>arm,'CANARY mode must only be armed in manual post-preflight stage');
  return true;
}
assert.equal(check(actual),true);
// Real regression checks: guard removal, later placement, stale app/config, wrong mode.
const needle='node tests/easystore_a213_published_boot_gate.test.mjs /tmp/config.js /tmp/app.js --expect-canary';
assert.throws(()=>check(actual.replace(needle,'')));
assert.throws(()=>check(actual.replace(needle,'').replace('      - name: Arm one zero-balance Custody Close command, wait for Diaa, then auto-disable',
  '      - name: Arm one zero-balance Custody Close command, wait for Diaa, then auto-disable\n          '+needle)));
assert.throws(()=>check(actual.replace(needle,
  'node tests/easystore_a213_published_boot_gate.test.mjs /tmp/config.js /tmp/app.js --expect-off')));
assert.throws(()=>check(actual.replace(needle,needle.replace('/tmp/app.js','/tmp/old-app.js'))));
console.log('ACC168_FINANCIAL_WORKFLOW_PREARM_PUBLISHED_BOOT_REQUIRED=PASS');
console.log('ACC168_PREARM_REMOVAL_REORDER_WRONG_MODE_REJECTED=PASS');
console.log('ACC168_120S_ONE_COMMAND_CLEANUP_UNCHANGED=PASS');
console.log('ACC168_PRODUCTION_FINANCIAL_ACTION=ZERO');
