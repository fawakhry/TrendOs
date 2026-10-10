import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const source=fs.readFileSync('.github/workflows/easystore-a213-custody-close-canary-execution.yml','utf8');
const original=fs.readFileSync('tests/easystore_a213_custody_close_workflow_invariants.test.mjs','utf8');
const match=source.match(/A213_SETTLEMENT_WAIT_MS=(\d+)/);
assert.ok(match,'bounded settlement wait must be explicit');
const settlementMs=Number(match[1]);
assert.equal(settlementMs,120000,'90-second client timeout + 30-second observation grace, no unbounded wait');
assert.ok(source.includes('STARTED_AT_MS="$(date +%s%3N)"'),'budget-reservation observation must start wall-clock monitor');
assert.ok(source.includes('NOW_MS="$(date +%s%3N)"'),'monitor must use current wall-clock, not poll iteration count');
assert.doesNotMatch(source,/\(\(i-STARTED_AT\)\) -gt 6/,'old 30-second premature timer cannot remain');
assert.match(source,/A213_EXEC_UNKNOWN_OUTCOME_DO_NOT_RETRY/,'ambiguous execution must never be labelled definitive success/failure');
assert.ok(source.includes("trap 'rc=$?; cleanup || rc=1; exit \"$rc\"' EXIT"),'cleanup mandatory on all paths');
assert.ok(source.includes("SET mode='READONLY'"),'automatic fail-closed mode must be preserved');
assert.ok(source.includes("max_amount=0,max_commands=1,commands_started=0"),'one-command zero-value budget must remain');
assert.ok(source.includes("allowed_actions_json='[\"closePurchaseCustodyV1920\"]'"),'one-action guard must remain');
assert.ok(source.includes("allowed_usernames_json='[\"ضياء\"]'"),'one-user guard must remain');
assert.ok(source.includes('expires_at_ms=$EXPIRES'),'bounded 15-minute expiry must remain');
assert.ok(source.includes('A213_EXEC_EXACT_D1_EVIDENCE=PASS'),'independent commit-level evidence mandatory');
assert.ok(source.includes('A213_EXEC_CLEANUP_VERIFIED=PASS'),'automatic cleanup verification mandatory');
assert.ok(original.includes('A213_CUSTODY_CLOSE_GENERAL_FORBIDDEN=PASS'),'existing historical guard tests unchanged');
assert.doesNotMatch(source,/mode='GENERAL'/,'never open general financial writes');

const start=source.indexOf('            if [ "$STATE" = "STARTED" ] && [ "$STARTED_AT_MS" = "0" ];');
const end=source.indexOf('            sleep 5',start);
assert.ok(start>=0&&end>start,'missing expected monitor shell');
const fragment=source.slice(start,end).split('\n').map(l=>l.replace(/^ {12}/,'')).join('\n');

// Run the **exact monitored shell fragment** using simulated date output;
// no network, Cloudflare, employee session, real time waits, or D1 writes.
function check({state='STARTED',at=1000,now=1000}) {
  const script=[
    'set -euo pipefail',
    'A213_SETTLEMENT_WAIT_MS='+settlementMs,
    'STARTED_AT_MS='+at,
    'STATE='+state,
    'MOCK_NOW='+now,
    'date() { printf "%s\n" "$MOCK_NOW"; }',
    fragment,
    'echo MONITOR_CONTINUES'
  ].join('\n');
  return spawnSync('bash',['-c',script],{encoding:'utf8'});
}
for(const elapsed of [0,30000,90000,105000,119999]){
  const r=check({at:1000,now:1000+elapsed});
  assert.equal(r.status,0,'must keep observing before 120s at '+elapsed+'ms: '+r.stderr);
  assert.match(r.stdout,/MONITOR_CONTINUES/);
}
{
  const r=check({at:1000,now:121000});
  assert.notEqual(r.status,0,'unknown after 120s must stop, not authorize or claim success');
  assert.match(r.stderr,/A213_EXEC_UNKNOWN_OUTCOME_DO_NOT_RETRY/);
}
{
  const r=check({state:'WAIT',at:0,now:200000});
  assert.equal(r.status,0,'unstarted command must not start a settlement timer');
}
console.log('A213_90S_BROWSER_120S_MONITOR_BOUNDARY=PASS');
console.log('A213_119S_CONTINUE_120S_UNKNOWN_FAIL_CLOSED=PASS');
console.log('A213_ONE_COMMAND_AUTO_CLEANUP_INVARIANTS=PASS');
console.log('A213_PRODUCTION_MUTATION=NO');
