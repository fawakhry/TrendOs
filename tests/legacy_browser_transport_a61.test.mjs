import assert from 'node:assert/strict';
import { handleLegacyBrowserTransport, LEGACY_BROWSER_ACTIONS } from '../cloudflare-d1/src/legacy-browser-transport-v1.mjs';
const env = { CORS_ORIGINS: 'https://ui.example.test', APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/fixture/exec' };
let calls = 0, mode = 'ok', sent;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  calls++; sent = { url, options };
  if (mode === 'network') throw new Error('fixture confidential detail');
  if (mode === '404') return new Response('fixture confidential detail', { status: 404 });
  if (mode === 'invalid') return new Response('<html>not JSON</html>');
  if (mode === 'auth') return new Response(JSON.stringify({ success: false, message: 'انتهت الجلسة' }));
  return new Response(JSON.stringify({ success: true, user: { username: 'fixture-user', token: 'fixture-token' } }), { headers: { location: 'https://script.googleusercontent.com/fixture' } });
};
function request(body, origin = 'https://ui.example.test', method = 'POST') {
  return new Request('https://cloud.example.test/v1/legacy-api', { method,
    headers: { Origin: origin, 'content-type': 'application/json' }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
}
try {
  for (const action of ['login','verifyEmployeeSession','logout','changePassword','getRowsPageV1931','hrV1']) {
    const result = await handleLegacyBrowserTransport(request({ action, username: 'fixture-user', token: 'fixture-token' }), env);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('location'), null);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(result.headers.get('access-control-allow-origin'), 'https://ui.example.test');
    assert.equal(sent.url, env.APPS_SCRIPT_API_URL);
    assert.equal(JSON.parse(sent.options.body).action, action);
  }
  let count = calls;
  for (const action of ['createManualOrder','createCustomer','searchCustomers','cloudEmployeeLegacyBridgeExecuteV1','unknown','d1OrdersLiveSync']) {
    assert.equal(LEGACY_BROWSER_ACTIONS.has(action), false);
    assert.equal((await handleLegacyBrowserTransport(request({ action }), env)).status, 403);
  }
  assert.equal((await handleLegacyBrowserTransport(request({ action: 'login' }, 'https://bad.example.test'), env)).status, 403);
  assert.equal((await handleLegacyBrowserTransport(request({}, 'https://ui.example.test', 'GET'), env)).status, 405);
  assert.equal((await handleLegacyBrowserTransport(request({ action: 'login' }), { ...env, APPS_SCRIPT_API_URL: 'https://bad.example.test/exec' })).status, 503);
  assert.equal(calls, count);
  for (const failure of ['404','network','invalid']) {
    mode = failure; count = calls;
    const result = await handleLegacyBrowserTransport(request({ action: 'login' }), env);
    assert.equal(result.status, 502);
    assert.doesNotMatch(await result.text(), /fixture confidential/);
    assert.equal(calls, count + 1, 'no blind retry');
  }
  mode = 'auth';
  const result = await handleLegacyBrowserTransport(request({ action: 'verifyEmployeeSession' }), env);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).success, false, 'genuine upstream auth rejection is preserved');
} finally { globalThis.fetch = originalFetch; }
console.log('A61_SERVER_SIDE_LEGACY_TRANSPORT=PASS');
