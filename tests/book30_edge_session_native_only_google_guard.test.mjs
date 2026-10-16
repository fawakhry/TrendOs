// BOOK30-LEGACY-VERIFY-QUERY: strictly synthetic Google upstream, no real employee data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleEdgeGatewayRequest, verifyEdgeSessionToken } from '../cloudflare-d1/src/edge-gateway.mjs';

const SECRET = 'FAKE_EDGE_SESSION_SECRET';
const EMPLOYEE_TOKEN = 'FAKE_EMPLOYEE_TOKEN_NEVER_REAL';
function sessionRequest(body = { username: 'fictional-employee', token: EMPLOYEE_TOKEN }) {
  return new Request('https://edge.invalid/v1/edge/session', {
    method: 'POST',
    headers: { Origin: 'https://fawakhry.github.io', 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}
function fixture(nativeOnly) {
  return {
    CORS_ORIGINS: 'https://fawakhry.github.io',
    EDGE_SESSION_SECRET: SECRET,
    APPS_SCRIPT_API_URL: 'https://script.google.invalid/macros/s/fiction/exec',
    ...(nativeOnly === undefined ? {} : { TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1: nativeOnly })
  };
}

test('BOOK30: Native-only blocks legacy Edge token exchange before any Google GET', async () => {
  const savedFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw Error('REMOTE_NETWORK_FORBIDDEN'); };
  try {
    for (const flag of ['true', 'TRUE', '1', 'yes', 'on']) {
      const res = await handleEdgeGatewayRequest(sessionRequest(), fixture(flag));
      assert.equal(res.status, 403, flag);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.code, 'LEGACY_EDGE_SESSION_NATIVE_ONLY');
      assert.doesNotMatch(JSON.stringify(body), /FAKE_EMPLOYEE_TOKEN/);
      assert.equal(res.headers.get('cache-control'), 'no-store');
    }
    assert.equal(calls, 0, 'must deny before Apps Script');
  } finally { globalThis.fetch = savedFetch; }
});

test('BOOK30: Native-only guard runs even with malformed request body, with zero upstream calls', async () => {
  const savedFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw Error('REMOTE_NETWORK_FORBIDDEN'); };
  try {
    const res = await handleEdgeGatewayRequest(sessionRequest('{malformed'), fixture('true'));
    assert.equal(res.status, 403);
    assert.equal((await res.json()).code, 'LEGACY_EDGE_SESSION_NATIVE_ONLY');
    assert.equal(calls, 0);
  } finally { globalThis.fetch = savedFetch; }
});

test('BOOK30: legacy mode retains previous exchange contract (mock upstream only)', async () => {
  const savedFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    const called = new URL(url);
    assert.equal(called.hostname, 'script.google.invalid');
    assert.equal(called.searchParams.get('action'), 'verifyEmployeeSession');
    assert.equal(called.searchParams.get('username'), 'fictional-employee');
    assert.equal(called.searchParams.get('token'), EMPLOYEE_TOKEN);
    assert.equal(init.method, 'GET');
    return new Response(JSON.stringify({ success: true, user: { username: 'fictional-employee' } }), {
      status: 200, headers: { 'content-type': 'application/json' }
    });
  };
  try {
    for (const flag of [undefined, 'false', '0']) {
      const res = await handleEdgeGatewayRequest(sessionRequest(), fixture(flag));
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(JSON.stringify(body).includes(EMPLOYEE_TOKEN), false);
      const proof = await verifyEdgeSessionToken(body.edgeToken, SECRET);
      assert.equal(proof.ok, true);
      assert.equal(proof.payload.sub, 'fictional-employee');
    }
    assert.equal(calls, 3);
  } finally { globalThis.fetch = savedFetch; }
});
