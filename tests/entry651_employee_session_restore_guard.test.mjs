import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');

assert.match(app,/TRENDOS_ENTRY651_SESSION_RESTORE_GUARD\s*=\s*['"]T12_ENTRY651_SESSION_RESTORE_VERIFY_V1_20261008['"]/);
assert.match(app,/async function verifyRestoredEmployeeSessionV1\(\)/);
assert.match(app,/api\("verifyEmployeeSession",\s*\{\s*username:\s*username,\s*token:\s*token\s*\}\)/);
assert.match(app,/state\.user\s*=\s*Object\.assign\(\{\},\s*restored,\s*res\.user,\s*\{\s*token:\s*token\s*\}\)/);
assert.match(app,/status\s*===\s*401/);
assert.match(app,/code\s*===\s*"EMPLOYEE_API_HTTP_401"/);
assert.match(app,/function clearRejectedRestoredEmployeeSessionV1\(\)[\s\S]*?sessionStorage\.removeItem\("trendos_session"\)[\s\S]*?state\.user\s*=\s*null/s);
assert.match(app,/if\s*\(rejected\)\s*\{\s*clearRejectedRestoredEmployeeSessionV1\(\);\s*\}/s);
assert.equal((app.match(/\bclearSession\(\);/g)||[]).length,1,'clearSession must remain explicit-logout only');
assert.match(app,/showLogin\(\);[\s\S]*?usernameInput\.value\s*=\s*username/);
assert.match(app,/انتهت جلسة الدخول القديمة/);
assert.match(app,/document\.addEventListener\("DOMContentLoaded",\s*async function \(\)\s*\{[\s\S]*?if \(loadSession\(\)\) \{[\s\S]*?await verifyRestoredEmployeeSessionV1\(\)[\s\S]*?if \(sessionValid\) bootMain\(\)/);
assert.doesNotMatch(app,/if \(loadSession\(\)\) bootMain\(\);/);

console.log('ENTRY651_SESSION_RESTORE_VERIFY_GUARD=PASS');
console.log('STALE_EMPLOYEE_SESSION_AUTO_BOOT=NO');
console.log('REJECTED_SESSION_CLEARED=YES');
console.log('VALID_SESSION_BOOT_ONLY_AFTER_CLOUD_VERIFY=YES');
