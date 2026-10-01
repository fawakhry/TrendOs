import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(rel) {
  return fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
}

function extractFunction(code, name) {
  const start = code.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name + ' not found');
  const brace = code.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < code.length; i += 1) {
    const ch = code[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return code.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

function activeRuntimeJsFiles() {
  const files = new Set();
  for (const source of [read('index.html'), read('config.js')]) {
    const re = /(?:src\s*=\s*["']|trendLoadModuleV1932\([^,]+,\s*["'])([^"'?]+\.js)/g;
    for (const match of source.matchAll(re)) {
      const file = String(match[1] || '').trim();
      if (file && !/^https?:/i.test(file)) files.add(file);
    }
  }
  return [...files];
}

const app = read('app.js');
const clearMain = extractFunction(app, 'clearSession');
const logoutMain = extractFunction(app, 'logout');

assert.match(clearMain, /sessionStorage\.removeItem\(["']trendos_session["']\)/);
assert.match(clearMain, /state\.user\s*=\s*null/);
assert.match(logoutMain, /api\(["']logout["']/);
assert.match(logoutMain, /clearSession\(\)/);

const mainClearCalls = app.match(/\bclearSession\(\);/g) || [];
assert.equal(
  mainClearCalls.length,
  1,
  'main employee clearSession() must only be called by explicit logout()'
);

const runtimeFiles = activeRuntimeJsFiles();
assert.ok(runtimeFiles.includes('app.js'), 'app.js must remain in active runtime manifest');
assert.ok(runtimeFiles.includes('trendos-edge-orders-read-v1.js'), 'Orders Edge runtime must remain covered');

const forbiddenEmployeeKeyRemoval =
  /(?:sessionStorage|localStorage)\.removeItem\(\s*["'](?:trendos_session|matbagy_session_token|matbagy_username|matbagy_user_name|MATBAGY_EMPLOYEE_SSO)["']\s*\)/;
const forbiddenWholeStorageClear = /(?:sessionStorage|localStorage)\.clear\s*\(/;
const forbiddenMainUserNull = /state\.user\s*=\s*null/;
const forbiddenEmployeeLogoutApi =
  /(?:\bapi|trendosSecureApiV1922|trendosEmployeeApiV1)\s*\(\s*["']logout["']/;

for (const file of runtimeFiles) {
  if (file === 'app.js' || file === 'trendos-edge-orders-read-v1.js') continue;
  const source = read(file);
  assert.doesNotMatch(source, /\bclearSession\s*\(/, file + ' must not define/call a main-style clearSession');
  assert.doesNotMatch(source, forbiddenMainUserNull, file + ' must not null the main employee user');
  assert.doesNotMatch(source, forbiddenEmployeeKeyRemoval, file + ' must not remove employee browser-session keys');
  assert.doesNotMatch(source, forbiddenWholeStorageClear, file + ' must not clear browser storage wholesale');
  assert.doesNotMatch(source, forbiddenEmployeeLogoutApi, file + ' must not issue employee logout implicitly');
}

const orders = read('trendos-edge-orders-read-v1.js');
const ordersClear = extractFunction(orders, 'clearSession');
assert.match(ordersClear, /session\.token\s*=\s*['"]/);
assert.match(ordersClear, /session\.expiresAt\s*=\s*0/);
assert.match(ordersClear, /session\.inflight\s*=\s*null/);
assert.doesNotMatch(ordersClear, /storage\.removeItem|storage\.clear|state\.user|trendos_session|matbagy_session_token|MATBAGY_EMPLOYEE_SSO/i);

const transport = read('browser-api-transport-v1.js');
assert.doesNotMatch(transport, /clearSession\s*\(|state\.user\s*=\s*null|removeItem\(|(?:sessionStorage|localStorage)\.clear\s*\(/);

const code = read('Code.gs');
const employeeTokenWrites = code.match(/safeSet_\([^\n;]*\bcolToken\b[^\n;]*\)/g) || [];
assert.equal(
  employeeTokenWrites.length,
  4,
  'employee Token column must only be written by login, exact-match expiry, explicit logout, and password change'
);
for (const fn of ['login_', 'authorize_', 'logoutEmployee_', 'changePassword_']) {
  const src = extractFunction(code, fn);
  assert.equal((src.match(/safeSet_\([^\n;]*\bcolToken\b[^\n;]*\)/g) || []).length, 1, fn + ' token mutation count changed');
}
assert.doesNotMatch(
  extractFunction(code, 'verifyEmployeeSession_'),
  /safeSet_\([^\n;]*\bcolToken\b/,
  'verifyEmployeeSession_ must never mutate the employee token'
);

console.log('ENTRY533_ACTIVE_RUNTIME_JS_FILES=' + runtimeFiles.length);
console.log('ENTRY533_EMPLOYEE_SESSION_ISOLATION=PASS');
