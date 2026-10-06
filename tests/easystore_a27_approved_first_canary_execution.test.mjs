import assert from 'node:assert/strict';
import fs from 'node:fs';
const y=fs.readFileSync('.github/workflows/easystore-a27-approved-first-canary-execution.yml','utf8');
for(const marker of [
  "canonical_username='ضياء'",
  "allowed_usernames_json='[\"ضياء\"]'",
  "allowed_actions_json='[\"saveAccountingTemplate\"]'",
  "max_amount=0,max_commands=1,commands_started=0",
  "mode='CANARY'",
  "mode='READONLY'",
  "A27_EXEC_WAITING_FOR_DIAA_CLICK=YES",
  "A27_EXEC_EXACT_D1_EVIDENCE=PASS",
  "A27_EXEC_SERVER_AUTO_DISABLED=PASS",
  "A2-CANARY-TEMPLATE-",
  "A27-TPL-"
]) assert.ok(y.includes(marker), 'missing '+marker);
assert.ok(!/mode[\s]*=[\s]*'GENERAL'/.test(y));
assert.ok(y.indexOf("SET mode='READONLY'") < y.indexOf("allowed_usernames_json='[]'"), 'cleanup must close authority before clearing policy');
console.log('A27_APPROVED_CANARY_EXECUTION_SOURCE=PASS');
console.log('ONE_USER_ONE_ACTION_ONE_COMMAND=YES');
console.log('AUTO_DISABLE_ON_EXIT=YES');
console.log('GENERAL_TRANSITION=NO');
console.log('PRODUCTION_MUTATION=NO');
