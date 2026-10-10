#!/usr/bin/env node
// ACC-185 adversarial offline fake source tests, zero external access.
import assert from "node:assert/strict";
import {ACTIONS, PINNED_EASYSTORE_COMMIT,checkContract,ContractStop}
  from "../scripts/easystore_acc185_ui_worker_contract.mjs";
const ui=ACTIONS.join("\n");
const worker=ACTIONS.map(s=>"else if(action==='"+s+"')out=1;").join("\n")+
"\nfunction approvedAccountingModeV1(env,verifiedUsername,user){}\nif(mode==='none')return;";
let result=checkContract(ui,worker);
assert.equal(result.action_count,10);
assert.equal(result.release_decision,"NO_GO");
assert.equal(result.production_changes,0);
assert.equal(result.real_financial_operating_acceptance,false);
assert.equal(result.actual_refund_and_customer_return_acceptance,"NOT_TESTED_LIVE");
assert.equal(result.pinned_easystore_git_commit,PINNED_EASYSTORE_COMMIT);
function denied(a,b,actions=ACTIONS,why="") {
  assert.throws(()=>checkContract(a,b,actions),
    e=>e instanceof ContractStop && (!why || e.message.includes(why)));
}
for(const action of ACTIONS){
  denied(ui.replace(action,"missing"),worker,ACTIONS,"FRONTEND_ACTION_MISSING");
  denied(ui,worker.replace("action==='"+action+"'","action==='deleted'"),
         ACTIONS,"BACKEND_DISPATCH_MISSING");
}
denied(ui,worker.replace("function approvedAccountingModeV1","function noFinanceGuard"),
       ACTIONS,"VERIFIED_ROLE_GUARD_MISSING");
denied(ui,worker.replace("if(mode==='none')","if(mode==='full')"),
       ACTIONS,"DENY_UNKNOWN_FINANCE_ROLE_MISSING");
denied(ui,worker,[...ACTIONS].reverse(),"ACTION_LIST_CHANGED");
denied(ui,worker,[...ACTIONS,ACTIONS[0]],"ACTION_COUNT_CHANGED");
denied(ui,worker,[...ACTIONS.slice(0,9),ACTIONS[0]],"ACTION_DUPLICATE");
denied(null,worker,ACTIONS,"SOURCE_NOT_TEXT");
console.log("ACC185_TEN_UI_AND_WORKER_ACTION_FAIL_CLOSED_NEGATIVES=PASS");
console.log("ACC185_VERIFIED_ROLE_GUARD_AND_UNKNOWN_SCOPE_DENIAL=PASS");
console.log("ACC185_RETURN_AND_REAL_G4_ACCEPTANCE_NOT_FABRICATED=PASS");
console.log("ACC185_PRODUCTION_MUTATIONS=ZERO");
