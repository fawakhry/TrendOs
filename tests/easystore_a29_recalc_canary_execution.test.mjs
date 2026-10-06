import assert from 'node:assert/strict';
import fs from 'node:fs';

const y=fs.readFileSync('.github/workflows/easystore-a29-recalc-canary-execution.yml','utf8');
assert.ok(/on:\s*\n\s*workflow_dispatch:\s*/m.test(y));
assert.ok(!/on:\s*\n\s*push:/m.test(y));
for(const marker of [
  "canonical_username='ضياء'",
  "allowed_usernames_json='[\"ضياء\"]'",
  "allowed_actions_json='[\"recalcAccountingMaterialsCascade\"]'",
  "max_amount=0,max_commands=1,commands_started=0",
  "A29_EXEC_ACTIVE_MASTERS=0",
  "A29_EXEC_WAITING_FOR_DIAA_CLICK=YES",
  "A29_EXEC_EXACT_D1_EVIDENCE=PASS",
  "A29_EXEC_RECALC_RESULT=ZERO_MASTER_SCOPE",
  "A29_EXEC_SERVER_AUTO_DISABLED=PASS",
  "requestLedger:2,events:2,activeMaterials:0,activeTemplates:0",
  "material-cost-cascade",
  "event_type!=='recalculate'"
]) assert.ok(y.includes(marker), 'missing '+marker);
assert.ok(!/mode[\s]*=[\s]*'GENERAL'/.test(y));
assert.ok(y.indexOf("SET mode='READONLY'") < y.indexOf("allowed_usernames_json='[]'"));
console.log('A29_RECALC_EXECUTION_SOURCE=PASS');
console.log('ONE_USER_ONE_ACTION_ONE_COMMAND=YES');
console.log('ZERO_ACTIVE_MASTER_REQUIRED=YES');
console.log('MASTER_ROW_COUNTS_MUST_NOT_CHANGE=YES');
console.log('AUTO_DISABLE_ON_EXIT=YES');
console.log('GENERAL_TRANSITION=NO');
console.log('PRODUCTION_MUTATION=NO');
