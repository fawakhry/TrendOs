import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../Code.gs', import.meta.url), 'utf8');

function extractFunction(name) {
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

const authorizeSource = extractFunction('authorize_');

let user = null;
let expired = false;
const clears = [];

const context = {
  TRENDOS_CLOUD_EMPLOYEE_CONTEXT_V1_: null,
  normalize_: (v) => String(v == null ? '' : v).trim(),
  findUser_: () => user,
  constantTimeEqualsV1922_: (a, b) => String(a) === String(b),
  sessionExpiredV1922_: () => expired,
  safeSet_: (sheet, row, col, value) => clears.push({ sheet, row, col, value })
};
vm.createContext(context);
vm.runInContext(authorizeSource + '\nthis.authorize_ = authorize_;', context);

function reset(token = 'CURRENT_TOKEN') {
  expired = false;
  clears.length = 0;
  user = {
    username: 'ضياء',
    active: 'نعم',
    token,
    lastLogin: new Date(),
    sheet: 'USERS',
    rowNumber: 2,
    colToken: 9
  };
}

reset();
let out = context.authorize_('ضياء', 'CURRENT_TOKEN');
assert.equal(out.ok, true);
assert.equal(clears.length, 0, 'valid session must not be mutated');

reset();
out = context.authorize_('ضياء', '');
assert.equal(out.ok, false);
assert.equal(clears.length, 0, 'missing token must not revoke current session');

reset();
out = context.authorize_('ضياء', 'STALE_TOKEN');
assert.equal(out.ok, false);
assert.equal(clears.length, 0, 'stale token must not revoke current session');

reset();
expired = true;
out = context.authorize_('ضياء', 'CURRENT_TOKEN');
assert.equal(out.ok, false);
assert.equal(clears.length, 1, 'matching expired session should be revoked exactly once');
assert.equal(clears[0].value, '');

reset();
expired = true;
out = context.authorize_('ضياء', 'STALE_TOKEN');
assert.equal(out.ok, false);
assert.equal(clears.length, 0, 'expired state plus stale token must not revoke a different current session');

reset();
context.TRENDOS_CLOUD_EMPLOYEE_CONTEXT_V1_ = {
  username: 'ضياء',
  user: { username: 'ضياء', role: 'admin' }
};
out = context.authorize_('ضياء', '');
assert.equal(out.ok, true);
assert.equal(out.authSource, 'cloudflare-d1-native-v1');
assert.equal(clears.length, 0);

console.log('ENTRY531_APPS_SCRIPT_SESSION_MISMATCH_NON_DESTRUCTIVE=PASS');
