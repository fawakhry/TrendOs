const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const config = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');

function functionSource(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.ok(start >= 0, 'missing function ' + name);
  const open = app.indexOf('{', start);
  let depth = 0, quote = '', escaped = false;
  for (let i = open; i < app.length; i += 1) {
    const ch = app[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}' && --depth === 0) return app.slice(start, i + 1);
  }
  throw new Error('unclosed function ' + name);
}

const post = functionSource('entry619PostEmployeeSso');
const open = functionSource('openAccounting');

assert.match(post, /TRENDOS_EMPLOYEE_SSO_V1/);
assert.match(post, /EASYSTORE_EMPLOYEE_SSO_ACK_V1/);
assert.match(post, /child\.postMessage/);
assert.match(post, /targetOrigin/);
assert.match(post, /token:u\.token/);
assert.match(post, /tries>=32/);

assert.match(open, /if\(!u\.token\)/);
assert.match(open, /ssoNonce:nonce/);
assert.match(open, /var child=window\.open/);
assert.match(open, /entry619PostEmployeeSso\(child,url\.origin,nonce,u,params\)/);
assert.doesNotMatch(open, /searchParams\.set\([^\n]*token/i);
assert.doesNotMatch(open, /params=\{[^}]*token/);

assert.match(config, /MATBAGY_EASYSTORE_VERSION_PARAM\s*=\s*'entry619-d1-readonly-sso-20261004'/);

console.log('Entry619 TrendOS -> EasyStore secure SSO source qualification passed');
