import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Walk every frontend source, not just the files currently loaded by index.html.
const excluded = new Set(['.git', '.github', 'cloudflare-d1', 'docs', 'tests', 'scripts', 'FOKHA_BRAIN']);
function walk(dir = '.') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return excluded.has(e.name) ? [] : walk(p);
    return /\.(?:js|html)$/.test(p) && !/\.test\.js$/.test(p) ? [p] : [];
  });
}
const browserFiles = walk();
for (const file of browserFiles) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /script\.google\.com\/macros\/s|script\.googleusercontent\.com/i, `${file}: direct Google URL in browser runtime`);
  assert.doesNotMatch(source, /\bfetch\s*\(\s*(?:API(?:_URL)?|APPS_SCRIPT_API(?:_URL)?|WEB_APP_URL|TREND_API_URL|window\.(?:API_URL|TREND_API_URL|WEB_APP_URL))\b/, `${file}: legacy alias transport`);
}
const index = fs.readFileSync('index.html', 'utf8');
assert.ok(index.indexOf('browser-api-transport-v1.js?') < index.indexOf('app.js?'));
assert.ok(index.indexOf('employee-api-dispatcher-v1.js?') > index.indexOf('app.js?'));

const requests = [];
const window = { location: { href: 'https://ui.example.test/' },
  fetch: async (url, options) => {
    requests.push({ url: String(url), options });
    return new Response(JSON.stringify({ success: true, source: 'server-side-legacy' }));
  },
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1: false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1: false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES: [],
  state: { user: { username: 'fixture-user', token: 'fixture-token' } }
};
const context = { window, URL, Set, Map, Error, Object, JSON, AbortController, setTimeout, clearTimeout,
  setInterval, clearInterval, console, Response, URLSearchParams };
Object.defineProperty(context, 'fetch', { get: () => window.fetch });
vm.createContext(context);
vm.runInContext(fs.readFileSync('browser-api-transport-v1.js', 'utf8'), context);
window.trendosSecureApiV1922 = (action, params) => window.trendosLegacyApiTransportV1(action, params);
vm.runInContext(fs.readFileSync('employee-api-dispatcher-v1.js', 'utf8'), context);
for (const action of ['login', 'verifyEmployeeSession', 'logout', 'changePassword', 'hrV1']) {
  await window.trendosEmployeeApiV1(action, { username: 'fixture-user', token: 'fixture-token' }, () => { throw new Error('direct invoker forbidden'); });
  assert.equal(requests.at(-1).url, 'https://trendos-d1-api.trendmall-contact.workers.dev/v1/legacy-api');
  assert.equal(requests.at(-1).options.redirect, 'error');
}
const before = requests.length;
for (const url of ['https://script.google.com/macros/s/fixture/exec', 'https://script.googleusercontent.com/macros/echo', 'https://SCRIPT.GOOGLE.COM/macros/s/fixture/exec']) {
  await assert.rejects(() => window.fetch(url), e => e.code === 'BROWSER_GOOGLE_TRANSPORT_BLOCKED');
}
assert.equal(requests.length, before);
window.MATBAGY_EMPLOYEE_API_URL = 'https://script.google.com/macros/s/fixture/exec';
await assert.rejects(() => window.trendosLegacyApiTransportV1('login', {}));
assert.equal(requests.length, before);
delete window.MATBAGY_EMPLOYEE_API_URL;
window.fetch = async () => new Response(JSON.stringify({ success: false, code: 'LEGACY_UPSTREAM_UNAVAILABLE' }), { status: 502 });
await assert.rejects(() => window.trendosEmployeeApiV1('verifyEmployeeSession', {}), e => e.code === 'LEGACY_UPSTREAM_UNAVAILABLE');
assert.equal(window.state.user.token, 'fixture-token', 'transport failure must not clear employee session');
console.log(`A61_NO_BROWSER_GOOGLE_TRANSPORT=PASS (${browserFiles.length} runtime files)`);
