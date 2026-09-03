import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  issueEdgeSessionToken,
  verifyEdgeSessionToken,
  isAllowedOrigin,
  isEdgeGatewayPath,
  handleEdgeGatewayRequest
} from '../cloudflare-d1/src/edge-gateway.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SECRET = 'test-edge-secret-20260903';

async function testSignedSessionContract() {
  const token = await issueEdgeSessionToken({ sub: 'diaa' }, SECRET, 1000, 300);
  const verified = await verifyEdgeSessionToken(token, SECRET, 1100);
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.sub, 'diaa');
  assert.equal(verified.payload.aud, 'trendos-edge');
  assert.equal(verified.payload.exp, 1300);

  const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
  const bad = await verifyEdgeSessionToken(tampered, SECRET, 1100);
  assert.equal(bad.ok, false);

  const expired = await verifyEdgeSessionToken(token, SECRET, 1300);
  assert.equal(expired.ok, false);
  assert.equal(expired.reason, 'expired');
}

function testOriginAndRoutes() {
  const env = { CORS_ORIGINS: 'https://fawakhry.github.io,http://localhost:8000' };
  assert.equal(isAllowedOrigin(new Request('https://edge.test/v1/edge/health', { headers: { Origin: 'https://fawakhry.github.io' } }), env), true);
  assert.equal(isAllowedOrigin(new Request('https://edge.test/v1/edge/health', { headers: { Origin: 'https://evil.example' } }), env), false);
  assert.equal(isAllowedOrigin(new Request('https://edge.test/v1/edge/health'), env), true);

  assert.equal(isEdgeGatewayPath('/v1/edge/session'), true);
  assert.equal(isEdgeGatewayPath('/v1/edge/customer-manager/inbox'), true);
  assert.equal(isEdgeGatewayPath('/v1/edge/customer-manager/thread'), true);
  assert.equal(isEdgeGatewayPath('/v1/orders'), false);
}

async function testFailClosedWithoutSecret() {
  const request = new Request('https://edge.test/v1/edge/session', {
    method: 'POST',
    headers: { Origin: 'https://fawakhry.github.io', 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'diaa', token: 'raw-employee-token' })
  });
  const response = await handleEdgeGatewayRequest(request, {
    CORS_ORIGINS: 'https://fawakhry.github.io',
    APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/example/exec'
  });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.success, false);
}

async function testExchangeUsesAppsScriptOnceThenEdgeToken() {
  const originalFetch = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = async (url, init) => {
    upstreamCalls += 1;
    assert.match(String(url), /action=verifyEmployeeSession/);
    assert.match(String(url), /username=diaa/);
    assert.match(String(url), /token=employee-session-token/);
    assert.equal(init.method, 'GET');
    return new Response(JSON.stringify({ success: true, user: { username: 'diaa' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  try {
    const request = new Request('https://edge.test/v1/edge/session', {
      method: 'POST',
      headers: { Origin: 'https://fawakhry.github.io', 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'diaa', token: 'employee-session-token' })
    });
    const env = {
      CORS_ORIGINS: 'https://fawakhry.github.io',
      APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/example/exec',
      EDGE_SESSION_SECRET: SECRET,
      EDGE_SESSION_TTL_SECONDS: '300'
    };
    const response = await handleEdgeGatewayRequest(request, env);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(body.edgeToken);
    assert.equal(upstreamCalls, 1);
    assert.equal(JSON.stringify(body).includes('employee-session-token'), false);

    const verified = await verifyEdgeSessionToken(body.edgeToken, SECRET);
    assert.equal(verified.ok, true);
    assert.equal(verified.payload.sub, 'diaa');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testProtectedWhoAmI() {
  const token = await issueEdgeSessionToken({ sub: 'diaa' }, SECRET);
  const env = { CORS_ORIGINS: 'https://fawakhry.github.io', EDGE_SESSION_SECRET: SECRET };
  const unauthorized = await handleEdgeGatewayRequest(
    new Request('https://edge.test/v1/edge/whoami', { headers: { Origin: 'https://fawakhry.github.io' } }),
    env
  );
  assert.equal(unauthorized.status, 401);

  const authorized = await handleEdgeGatewayRequest(
    new Request('https://edge.test/v1/edge/whoami', {
      headers: { Origin: 'https://fawakhry.github.io', Authorization: `Bearer ${token}` }
    }),
    env
  );
  assert.equal(authorized.status, 200);
  const body = await authorized.json();
  assert.equal(body.user.username, 'diaa');
}

function testFrontendDefaultOffAndFallbackContract() {
  const frontend = fs.readFileSync(path.join(root, 'trendos-edge-read-v1.js'), 'utf8');
  const config = fs.readFileSync(path.join(root, 'config.js'), 'utf8');
  const entry = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');

  assert.match(frontend, /MATBAGY_EDGE_READ_V1_ENABLED !== true/);
  assert.match(frontend, /original\.apply\(this, args\)/);
  assert.match(frontend, /document\.hidden === true/);
  assert.match(frontend, /var inflight = new Map\(\)/);
  assert.match(frontend, /customerManagerV1/);
  assert.match(frontend, /\/v1\/edge\/customer-manager\/inbox/);
  assert.match(frontend, /\/v1\/edge\/customer-manager\/thread/);
  assert.doesNotMatch(frontend, /localStorage\.setItem/);
  assert.doesNotMatch(frontend, /sessionStorage\.setItem/);

  // No frontend traffic cutover in this increment.
  assert.doesNotMatch(config, /trendos-edge-read-v1\.js/);
  assert.doesNotMatch(config, /MATBAGY_EDGE_READ_V1_ENABLED\s*=\s*true/);

  // Worker entry may expose the parallel secure lane, but legacy routes remain untouched.
  assert.match(entry, /edge-gateway\.mjs/);
  assert.match(entry, /return base\.fetch/);
}

await testSignedSessionContract();
testOriginAndRoutes();
await testFailClosedWithoutSecret();
await testExchangeUsesAppsScriptOnceThenEdgeToken();
await testProtectedWhoAmI();
testFrontendDefaultOffAndFallbackContract();

console.log('Cloudflare Edge Gateway V1 tests: PASS');
