import assert from 'node:assert/strict';
import { evaluateAcc176,getReleaseSources } from '../scripts/acc176_finance_release_readiness.mjs';

const src=getReleaseSources();
const health={
 success:true,schemaReady:true,mode:'READONLY',authoritativeWrites:false,
 writeCanaryReady:true,googleBusinessCalls:0,
 writeCanaryAllowedUserCount:0,writeCanaryAllowedActionCount:0,
 writeCanaryExpiresAtMs:0,writeCanaryMaxAmount:0,
 writeCanaryMaxCommands:0,writeCanaryCommandsStarted:0
};
const config=[
 "window.EASYSTORE_ACCOUNTING_D1_READONLY = true;",
 "window.EASYSTORE_ACCOUNTING_D1_WRITES = false;",
 "window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'OFF';",
 "window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = [];"
].join('\n');
const app=[
 '  let a213PilotServerReady=false;',
 '  const state = {',
 'function a213PilotHealthAllowsOneCommand(h){}'
].join('\n');
const evaluate=(overrides={})=>evaluateAcc176({sources:src,health,config,app,...overrides});
const approved=evaluate();
assert.equal(approved.public_safe_idle_checks_passed,true,'source-only and synthetic safe-idle contract must pass');
assert.equal(approved.checks.old_release_job_not_version_pinned,true,'legacy deploy merge drift risk must be documented');
assert.equal(approved.release_decision,'NO_GO');
assert.equal(approved.deployment_artifact_locked,false);
assert.equal(approved.backup_verified,false);
assert.equal(approved.approved_staff_grants_activated,false);
assert.equal(approved.real_financial_transactions_authorized,false);
assert.equal(approved.production_mutations,0);
assert.ok(approved.release_blockers.length>=8,'all remaining acceptance gates and backup must be tracked');
for(const field of ['writeCanaryAllowedUserCount','writeCanaryAllowedActionCount','writeCanaryExpiresAtMs','writeCanaryMaxAmount','writeCanaryMaxCommands','writeCanaryCommandsStarted']){
 assert.equal(evaluate({health:{...health,[field]:1}}).public_safe_idle_checks_passed,false,field+' nonzero');
 const missing={...health};delete missing[field];
 assert.equal(evaluate({health:missing}).public_safe_idle_checks_passed,false,field+' missing');
}
for(const v of [
 {mode:'CANARY'}, {mode:'GENERAL'}, {authoritativeWrites:true}, {success:false},
 {schemaReady:false}, {googleBusinessCalls:1}, {writeCanaryReady:false}
]){
 assert.equal(evaluate({health:{...health,...v}}).public_safe_idle_checks_passed,false,'unsafe server health:'+JSON.stringify(v));
}
for(const needle of [
 "window.EASYSTORE_ACCOUNTING_D1_READONLY = true;",
 "window.EASYSTORE_ACCOUNTING_D1_WRITES = false;",
 "window.EASYSTORE_ACCOUNTING_D1_WRITE_MODE = 'OFF';",
 "window.EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS = [];"
]){
 assert.equal(evaluate({config:config.replace(needle,'// removed finance guard')}).public_safe_idle_checks_passed,false,needle);
 assert.equal(evaluate({config:config+'\n'+needle}).public_safe_idle_checks_passed,false,'duplicate '+needle);
}
const worker=src.accounting;
assert.equal(evaluate({sources:{...src,accounting:worker.replace("'payment_paid',?,?,-1","'payment_paid',?,-1")}}).public_safe_idle_checks_passed,false,'regress supplier paid placeholder');
assert.equal(evaluate({sources:{...src,accounting:worker.replace("VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?)","VALUES(?,?,?,?,?,'HANDOFF',?,?,?,?,?,?,?)")}}).public_safe_idle_checks_passed,false,'regress custody handoff placeholder');
assert.equal(evaluate({sources:{...src,accounting:worker.replace('function approvedAccountingModeV1(env,verifiedUsername,user)','function legacyUnauthorizedFinanceMode()')}}).public_safe_idle_checks_passed,false,'roster logic missing');
assert.equal(evaluate({sources:{...src,manual:src.manual.replace('--expect-canary','--simulate-canary')}}).public_safe_idle_checks_passed,false,'manual prearm check removed');
assert.equal(evaluate({sources:{...src,shadow:src.shadow.replace('return core.fetch(request, env, ctx)','return new Response("missing")')}}).public_safe_idle_checks_passed,false,'worker route chain mismatch');
assert.equal(evaluate({sources:{...src,wrangler:src.wrangler+'\nACCOUNTING_FINANCE_GRANTS_MODE_V1 = "ENFORCE"'}}).public_safe_idle_checks_passed,false,'unexpected committed finance grant activation');
assert.equal(evaluate({app:app.replace('  let a213PilotServerReady=false;','')}).public_safe_idle_checks_passed,false,'blank-screen bootstrap broken');
assert.equal(evaluate().release_decision,'NO_GO','even all green checks cannot authorize production release');
console.log('ACC176_LOCAL_ENTRYPOINT_AND_FINANCE_SQL_SOURCE=PASS');
console.log('ACC176_SOURCE_REGRESSION_AND_BOOTSTRAP_NEGATIVES=PASS');
console.log('ACC176_RUNTIME_OFF_READONLY_ALL_ZERO_FIELDS_NEGATIVES=PASS');
console.log('ACC176_UNPINNED_MERGE_BACKUP_DEPLOY_ACCEPTANCE_BLOCKERS=DOCUMENTED');
console.log('ACC176_NEVER_AUTO_APPROVES_RELEASE=PASS');
console.log('ACC176_PRODUCTION_MUTATIONS=ZERO');
