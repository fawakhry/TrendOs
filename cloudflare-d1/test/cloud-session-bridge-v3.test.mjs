import assert from 'node:assert/strict';
import {
  handleCloudSessionBridgeV3,
  isCloudSessionBridgeV3Path,
  verifyEmployeeSessionViaPost
} from '../src/cloud-session-bridge-v3.mjs';

const originalFetch = globalThis.fetch;
function env() {
  return {
    APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/test-deployment/exec',
    EDGE_SESSION_SECRET: 'test-only-edge-secret-that-is-not-production',
    EDGE_SESSION_TTL_SECONDS: '600',
    CORS_ORIGINS: 'https://fawakhry.github.io'
  };
}
function mockFetch(body, status = 200) {
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ input: String(input), init });
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
  return calls;
}
function request(path, body) {
  return new Request(`https://edge.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://fawakhry.github.io' },
    body: JSON.stringify(body)
  });
}
async function testPostTransportDoesNotLeakTokenInUrl() {
  const calls = mockFetch({ success: true, user: { username: 'wael', role: 'print', department: 'طباعة' } });
  const result = await verifyEmployeeSessionViaPost('wael', 'employee-secret-token', env(), 'orders');
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, env().APPS_SCRIPT_API_URL);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['content-type'], 'text/plain;charset=utf-8');
  assert.equal(calls[0].input.includes('employee-secret-token'), false);
  assert.equal(calls[0].input.includes('token='), false);
  const payload = JSON.parse(calls[0].init.body);
  assert.equal(payload.action, 'verifyEmployeeSession');
  assert.equal(payload.username, 'wael');
  assert.equal(payload.token, 'employee-secret-token');
  assert.equal(payload._edgeOrders, 1);
}
async function testGeneralSessionExchange() {
  const calls = mockFetch({ success: true, username: 'wael' });
  const response = await handleCloudSessionBridgeV3(request('/v1/edge/session', { username: 'wael', token: 'employee-secret-token' }), env());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.user.username, 'wael');
  assert.equal(body.sessionBridge, 'cloud-session-bridge-v3-post');
  assert.equal(body.authSource, 'apps-script-post');
  assert.match(body.edgeToken, /^v1\./);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].input.includes('employee-secret-token'), false);
  assert.equal(JSON.parse(calls[0].init.body)._edge, 1);
}
async function testOrdersSessionExchange() {
  const calls = mockFetch({ success: true, user: { username: 'wael', role: 'print', department: 'طباعة' } });
  const response = await handleCloudSessionBridgeV3(request('/v1/edge/orders/session', { username: 'wael', token: 'employee-secret-token' }), env());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.user.role, 'print');
  assert.deepEqual(body.user.screens, ['print', 'press', '']);
  assert.equal(body.sessionBridge, 'cloud-session-bridge-v3-post');
  assert.match(body.edgeToken, /^v1\./);
  assert.equal(calls[0].input.includes('employee-secret-token'), false);
}
async function testUpstream404IsExplicit502() {
  mockFetch({}, 404);
  const response = await handleCloudSessionBridgeV3(request('/v1/edge/session', { username: 'wael', token: 'employee-secret-token' }), env());
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(body.success, false);
  assert.equal(body.code, 'apps-script-verification-upstream');
}
async function testExactRoutesOnly() {
  assert.equal(isCloudSessionBridgeV3Path('/v1/edge/session'), true);
  assert.equal(isCloudSessionBridgeV3Path('/v1/edge/orders/session'), true);
  assert.equal(isCloudSessionBridgeV3Path('/v1/edge/orders/page'), false);
  assert.equal(isCloudSessionBridgeV3Path('/v1/operator/tasks/status'), false);
}
try {
  await testPostTransportDoesNotLeakTokenInUrl();
  await testGeneralSessionExchange();
  await testOrdersSessionExchange();
  await testUpstream404IsExplicit502();
  await testExactRoutesOnly();
  console.log('CLOUD_SESSION_BRIDGE_V3_T6A=PASS');
  console.log('APPS_SCRIPT_VERIFY_METHOD=POST');
  console.log('EMPLOYEE_TOKEN_IN_URL=NO');
  console.log('PRODUCTION_MUTATION=NO');
} finally {
  globalThis.fetch = originalFetch;
}
