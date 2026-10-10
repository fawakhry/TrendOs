#!/usr/bin/env node
import assert from "node:assert/strict";
import {checkPinnedPilotOff,SourcePilotStop}
from "../scripts/easystore_acc185_pilot_off_contract.mjs";
const app=[
"let a213PilotServerReady=false;",
"if(a213CustodyClosePilotEligible() && !screens.includes('purchase'))",
"return a213PilotServerReady && a213CustodyCloseCanaryEnabled()",
"Number(h.writeCanaryMaxCommands)===1",
"Number(h.writeCanaryCommandsStarted)===0",
"Number(h.writeCanaryMaxAmount)===0",
"expiry>Date.now()+10000",
].join("\n");
const cfg=[
"window.EASYSTORE_ACCOUNTING_D1_READONLY = true;",
"window.EASYSTORE_ACCOUNTING_D1_WRITES = false;",
"window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'OFF';",
"window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = [];",
].join("\n");
const report=checkPinnedPilotOff(app,cfg);
assert.equal(report.release_decision,"NO_GO");
function deny(a,c,why){
  assert.throws(()=>checkPinnedPilotOff(a,c),
     e=>e instanceof SourcePilotStop&&e.message.includes(why));
}
deny(app.replace("a213PilotServerReady=false","a213PilotServerReady=true"),cfg,"PILOT_INIT_NOT_FALSE");
deny(app.replace("a213CustodyClosePilotEligible()","a213CustodyCloseCanaryEnabled()"),
    cfg,"PILOT_SCREEN_LACKS_SERVER_ELIGIBILITY");
deny(app.replace("a213PilotServerReady && ",""),cfg,"PILOT_SERVER_ARM_GUARD_MISSING");
for(const guard of ["Number(h.writeCanaryMaxCommands)===1",
                    "Number(h.writeCanaryCommandsStarted)===0",
                    "Number(h.writeCanaryMaxAmount)===0",
                    "expiry>Date.now()+10000"]){
  deny(app.replace(guard,"true"),cfg,"_");
}
deny(app,cfg.replace("= 'OFF'","= 'CANARY'"),"CANARY_MODE_NOT_OFF");
deny(app,cfg.replace("= false","= true"),"FINANCE_WRITES_NOT_OFF");
deny(app,cfg.replace("= []","= ['closePurchaseCustodyV1920']"),"CANARY_ALLOWLIST_NOT_EMPTY");
console.log("ACC185_PINNED_PILOT_FAIL_CLOSED_SOURCE_NEGATIVES=PASS");
console.log("ACC185_REAL_A213_CLOSE=NOT_TESTED");
