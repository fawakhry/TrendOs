import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Financial safety adjudication from PUBLIC GET-only health, published UI,
// and checked-in execution-workflow contract. This makes NO financial request.
// SUCCESS in this CI means SAFE-IDLE proof; it is NOT authorization to launch.
const [configFile,appFile,healthFile,manualWorkflowFile]=process.argv.slice(2);
for(const file of [configFile,appFile,healthFile,manualWorkflowFile])
  assert.ok(file && fs.existsSync(file),'required exact-input file missing');
const cfg=fs.readFileSync(configFile,'utf8');
const app=fs.readFileSync(appFile,'utf8');
const h=JSON.parse(fs.readFileSync(healthFile,'utf8'));
const manual=fs.readFileSync(manualWorkflowFile,'utf8');
function exactlyOne(source,needle,description){
  assert.equal(source.split(needle).length-1,1,description);
}
exactlyOne(cfg,"window.EASYSTORE_ACCOUNTING_D1_READONLY = true;",'frontend D1 read-only must be true exactly once');
exactlyOne(cfg,"window.EASYSTORE_ACCOUNTING_D1_WRITES = false;",'general writes must be disabled exactly once');
exactlyOne(cfg,"window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'OFF';",'client must be OFF exactly once');
exactlyOne(cfg,"window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = [];",'client action allowlist must be empty exactly once');
assert.equal(h.success,true);
assert.equal(h.mode,'READONLY','live D1 must be READONLY');
assert.equal(h.authoritativeWrites,false);
for(const field of ['writeCanaryAllowedUserCount','writeCanaryAllowedActionCount','writeCanaryMaxCommands','writeCanaryCommandsStarted','writeCanaryExpiresAtMs'])
  assert.equal(Number(h[field]||0),0,field+' must be exactly zero');
const declaration="  let a213PilotServerReady=false;";
exactlyOne(app,declaration,'published app requires a single early pilot state declaration');
assert.ok(app.indexOf(declaration)<app.indexOf('  const state = {'),'live blank screen regression');
assert.ok(app.includes('function a213PilotHealthAllowsOneCommand(h)'),'backend arm gate missing');
assert.ok(app.includes('__EASYSTORE_A213_PILOT_ATTEMPTED'),'one-attempt client guard missing');
assert.match(manual,/on:\s*\n\s*workflow_dispatch:/);
assert.ok(manual.includes('A213_SETTLEMENT_WAIT_MS=120000'),'120s bounded monitor must exist');
assert.ok(manual.includes('A213_EXEC_CLEANUP_VERIFIED=PASS'),'automatic cleanup proof must exist');
assert.ok(manual.includes('A213_EXEC_UNKNOWN_OUTCOME_DO_NOT_RETRY'),'unknown outcome must block replay');
const arming=manual.indexOf('      - name: Arm one zero-balance Custody Close command, wait for Diaa, then auto-disable');
assert.ok(arming>0,'no auditable manual arming step found');
const prearm=manual.slice(0,arming);
const expectedCommand='node tests/easystore_a213_published_boot_gate.test.mjs';
const publishedBootEnforced=prearm.includes(expectedCommand);
// No user presence can be inferred from a CI runner. An audit run is never
// a substitute for independent, fresh owner authorization.
const status={
  phase:'ACC-165',
  readOnlyState:'PASS',
  publishedFrontendBootOrder:'PASS',
  operatorPresent:'NOT_VERIFIED_BY_CI',
  manualFinancePrearmBootCheck:publishedBootEnforced?'INSTALLED':'MISSING',
  closeA213Production:'NOT_PASSED',
  financialLaunchDecision:'NO_GO',
  financialPostCount:0,
  reason:publishedBootEnforced
    ?'No freshly approved authenticated financial operation or owner-supervised operator window; this is a READ-ONLY audit.'
    :'Manual A2.13 finance-changing workflow does not enforce published browser bootstrap BEFORE arming. A standalone green UI CI is NOT an enforced pre-arm control.'
};
assert.equal(status.financialLaunchDecision,'NO_GO','CI must never self-authorize finance execution');
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync(path.join('artifacts','acc165-golive-decision.json'),JSON.stringify(status,null,2)+'\n');
console.log('ACC165_PUBLIC_UI_SAFE_OFF=PASS');
console.log('ACC165_PRODUCTION_D1_READONLY_ZERO_BUDGET=PASS');
console.log('ACC165_MANUAL_WORKFLOW_BOOT_GATE='+status.manualFinancePrearmBootCheck);
console.log('ACC165_PRODUCTION_A213_LIVE_CLOSE=NOT_PASSED');
console.log('ACC165_LIVE_FINANCIAL_LAUNCH=NO_GO');
console.log('ACC165_FINANCIAL_HTTP_POST=ZERO');
if(process.env.GITHUB_STEP_SUMMARY){
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,[
    '## ACC-165 — Finance release decision (GET only)',
    '| Check | Status |','|---|---|',
    '| Public EasyStore | OFF; boot-order contract PASS |',
    '| D1 finance authority | READONLY; one-command budget 0 |',
    '| A2.13 120s watcher and cleanup | SOURCE VERIFIED |',
    '| Live published bootstrap enforced before manual arming | '+status.manualFinancePrearmBootCheck+' |',
    '| Real operator and fresh financial approval | NOT VERIFIED |',
    '| Financial go-live authorization | **NO_GO** |',
    '',
    'Green tests do not mean finance is enabled. No credentials, finance POST, D1 writes or Cloudflare deployment.'
  ].join('\n')+'\n');
}
