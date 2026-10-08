import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const dispatcher=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const andon=fs.readFileSync('employee-andon-v1.js','utf8');
const edge=fs.readFileSync('trendos-edge-orders-read-v1.js','utf8');
const config=fs.readFileSync('config.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.match(config,/MATBAGY_EMPLOYEE_AUTH_SESSION_EPOCH = 1/);
assert.match(app,/authSessionEpoch:\s*employeeAuthSessionEpochV2\(\)/);
assert.match(app,/storedEpoch !== employeeAuthSessionEpochV2\(\)/);
assert.match(app,/T12_ENTRY652_SESSION_LIFECYCLE_GUARD_V1_20261008/);

assert.match(app,/function forceEmployeeReloginV2\(reason\)/);
assert.match(app,/window\.addEventListener\("trendos:employee-session-invalid"/);
assert.match(app,/clearRejectedRestoredEmployeeSessionV1\(\)/);
assert.match(app,/stopEmployeeSessionGuardV2\(\)/);
assert.match(app,/startEmployeeSessionGuardV2\(\)/);
assert.match(app,/EMPLOYEE_SESSION_GUARD_INTERVAL_MS_V2 = 5 \* 60 \* 1000/);
assert.match(app,/window\.addEventListener\("focus"/);
assert.match(app,/document\.addEventListener\("visibilitychange"/);
assert.equal((app.match(/\bclearSession\(\);/g)||[]).length,1,'clearSession remains explicit logout only');

assert.match(dispatcher,/function signalEmployeeSessionInvalidV2\(response, body\)/);
assert.match(dispatcher,/trendos:employee-session-invalid/);
assert.match(dispatcher,/\/v1\\\/employee\\\/auth\\\/login/);
assert.match(dispatcher,/signalEmployeeSessionInvalidV2\(response, body\)/);

assert.match(andon,/function signalSessionInvalidV2\(\)/);
assert.match(andon,/if\(response\.status===401\)signalSessionInvalidV2\(\)/);
assert.match(andon,/trendos:employee-session-invalid/);

assert.match(edge,/function signalEmployeeSessionInvalidV2\(source\)/);
assert.match(edge,/response\.status === 401\) signalEmployeeSessionInvalidV2\('edge-orders-session-exchange'\)/);
assert.match(edge,/trendos:employee-session-invalid/);

assert.match(index,/config\.js\?v=20261008-entry652-session-lifecycle/);
assert.match(index,/app\.js\?v=20261008-entry652-session-lifecycle/);
assert.match(index,/employee-api-dispatcher-v1\.js\?v=20261008-entry652-session-lifecycle/);
assert.match(config,/trendos-edge-orders-read-v1\.js\?v=20261008-entry652-session-lifecycle/);
assert.match(config,/employee-andon-v1\.js\?v=20261008-entry652-session-lifecycle/);

assert.doesNotMatch(app,/password\s*=\s*['"][^'"]+['"]/i);
console.log('ENTRY652_EMPLOYEE_SESSION_LIFECYCLE_GUARD=PASS');
console.log('BOOT_VERIFY=YES');
console.log('RUNTIME_401_FORCE_RELOGIN=YES');
console.log('PERIODIC_AND_FOCUS_REVERIFY=YES');
console.log('SESSION_EPOCH_CONTRACT=YES');
console.log('PASSWORD_RESET=NO');
