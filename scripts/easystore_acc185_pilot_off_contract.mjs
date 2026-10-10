#!/usr/bin/env node
// ACC-185 current V1922 published-source candidate safety (NOT a live site check).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";

export class SourcePilotStop extends Error {}
function must(value, reason) {
  if(!value)throw new SourcePilotStop("ACC185_A213_OFF_STOP_"+reason);
}
export function checkPinnedPilotOff(app,cfg) {
  must(typeof app==="string" && typeof cfg==="string","NOT_TEXT");
  must(app.includes("let a213PilotServerReady=false;"),"PILOT_INIT_NOT_FALSE");
  must(app.includes("if(a213CustodyClosePilotEligible() && !screens.includes('purchase'))"),
       "PILOT_SCREEN_LACKS_SERVER_ELIGIBILITY");
  must(app.includes("return a213PilotServerReady && a213CustodyCloseCanaryEnabled()"),
       "PILOT_SERVER_ARM_GUARD_MISSING");
  must(app.includes("Number(h.writeCanaryMaxCommands)===1"),
       "SINGLE_COMMAND_WINDOW_NOT_ENFORCED");
  must(app.includes("Number(h.writeCanaryCommandsStarted)===0"),
       "CONSUMED_WINDOW_NOT_REJECTED");
  must(app.includes("Number(h.writeCanaryMaxAmount)===0"),
       "NONZERO_AMOUNT_NOT_REJECTED");
  must(app.includes("expiry>Date.now()+10000"),"EXPIRY_NOT_ENFORCED");
  must(/EASYSTORE_ACCOUNTING_D1_READONLY\s*=\s*true/.test(cfg),"D1_READONLY_MISSING");
  must(/EASYSTORE_ACCOUNTING_D1_WRITES\s*=\s*false/.test(cfg),"FINANCE_WRITES_NOT_OFF");
  must(/EASYSTORE_ACCOUNTING_D1_WRITE_MODE\s*=\s*'OFF'/.test(cfg),"CANARY_MODE_NOT_OFF");
  must(/EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS\s*=\s*\[\]/.test(cfg),
       "CANARY_ALLOWLIST_NOT_EMPTY");
  return {frontend_candidate_mode:"OFF",server_one_command_gate_source_present:true,
          real_live_pilot_executed:false,release_decision:"NO_GO"};
}
function main() {
  const root=process.argv[2]; must(root,"MISSING_EASYSTORE_ROOT");
  const a=fs.readFileSync(path.join(root,"app.js"),"utf8");
  const c=fs.readFileSync(path.join(root,"config.js"),"utf8");
  const r=checkPinnedPilotOff(a,c);
  assert.equal(r.release_decision,"NO_GO");
  console.log("ACC185_PINNED_A213_SERVER_HEALTH_ARM_GUARD=PASS");
  console.log("ACC185_PINNED_FRONTEND_WRITE_MODE=OFF");
  console.log("ACC185_OLD_UNCONDITIONAL_CANARY_TEST=OBSOLETE_NOT_REPLAYED");
  console.log("ACC185_REAL_A213_PILOT=NOT_PERFORMED");
}
if(process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href){
  try{main();}catch(e){console.error(String(e));process.exitCode=1;}
}
