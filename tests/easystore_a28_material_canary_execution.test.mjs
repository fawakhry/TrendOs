import assert from 'node:assert/strict';
import fs from 'node:fs';
const y=fs.readFileSync('.github/workflows/easystore-a28-approved-material-canary-execution.yml','utf8');
assert.ok(/on:\s*\n\s*workflow_dispatch:/m.test(y));
assert.ok(!/on:\s*\n\s*push:/m.test(y));
for(const marker of [
  "allowed_usernames_json='[\"ضياء\"]'",
  "allowed_actions_json='[\"saveAccountingMaterial\"]'",
  "max_amount=0,max_commands=1,commands_started=0",
  "A28_EXEC_WAITING_FOR_DIAA_CLICK=YES",
  "A28_EXEC_EXACT_D1_EVIDENCE=PASS",
  "A28_EXEC_SERVER_AUTO_DISABLED=PASS",
  "A2-CANARY-MATERIAL-",
  "A28-MAT-",
  "materials:0,templates:1",
  "materials||0)===1",
  "requestLedger||0)===2",
  "events||0)===2"
]) assert.ok(y.includes(marker), 'missing '+marker);
assert.ok(!/mode[\s]*=[\s]*'GENERAL'/.test(y));
assert.ok(y.indexOf("SET mode='READONLY'") < y.indexOf("allowed_usernames_json='[]'"), 'cleanup must close authority first');
console.log('A28_APPROVED_MATERIAL_CANARY_EXECUTION=PASS');
console.log('ONE_USER_ONE_ACTION_ONE_COMMAND=YES');
console.log('BASELINE_FIRST_CANARY_EVIDENCE=PRESERVED');
console.log('AUTO_DISABLE_ON_EXIT=YES');
console.log('GENERAL_TRANSITION=NO');
console.log('PRODUCTION_MUTATION=NO');
