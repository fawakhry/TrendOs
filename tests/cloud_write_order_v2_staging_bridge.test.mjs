import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_EXECUTE_PATH,
  CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_HEALTH_PATH,
  CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT,
  CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VALIDATE_PATH,
  handleCloudWriteOrderV2StagingBridgeRequest,
  isCloudWriteOrderV2StagingBridgePath
} from '../cloudflare-d1/src/cloud-write-order-v2-staging-bridge.mjs';
import { issueEdgeSessionToken, verifyEdgeSessionToken } from '../cloudflare-d1/src/edge-gateway.mjs';

const source = fs.readFileSync(new URL('../cloudflare-d1/src/cloud-write-order-v2-staging-bridge.mjs', import.meta.url), 'utf8');
assert.equal(/env\.DB|\.prepare\s*\(|d1\.execute|cloud_write_outbox/i.test(source), false, 'bridge module must not write/read D1');
assert.equal(source.includes('productionCutover: false'), true);
assert.equal(source.includes('CWV2-STAGE-BRIDGE-001'), true);
assert.equal(source.includes('orderId:'), true, 'sanitized response may expose Apps Script allocated orderId');
assert.equal(source.includes("orderId: '"), false, 'module must not preallocate a business order id');

const secret = 'edge-staging-test-secret-abcdefghijklmnopqrstuvwxyz-1234567890';
const apiUrl = 'https://script.google.com/macros/s/STAGING_TEST/exec';
const env = {
  EDGE_SESSION_SECRET: secret,
  APPS_SCRIPT_API_URL: apiUrl
};

for (const path of [
  CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_HEALTH_PATH,
  CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VALIDATE_PATH,
  CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_EXECUTE_PATH
]) {
  assert.equal(isCloudWriteOrderV2StagingBridgePath(path), true);
}
assert.equal(isCloudWriteOrderV2StagingBridgePath('/v1/cloud/orders'), false);

// Health is fail-closed until both non-secret Apps Script URL and edge auth exist.
{
  const res = await handleCloudWriteOrderV2StagingBridgeRequest(
    new Request(`https://staging.test${CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_HEALTH_PATH}`),
    { EDGE_SESSION_SECRET: secret, APPS_SCRIPT_API_URL: '' }
  );
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.appsScriptConfigured, false);
  assert.equal(body.edgeAuthConfigured, true);
  assert.equal(body.productionCutover, false);
}

{
  const res = await handleCloudWriteOrderV2StagingBridgeRequest(
    new Request(`https://staging.test${CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_HEALTH_PATH}`),
    env
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.stagingOnly, true);
  assert.equal(body.syntheticOnly, true);
  assert.equal(body.appsScriptConfigured, true);
  assert.equal(body.edgeAuthConfigured, true);
  assert.equal(body.d1Written, false);
  assert.equal(body.productionRouteIntegrated, false);
}

// Bridge validation accepts only a signed short-lived bridge-subject token.
{
  const now = Math.floor(Date.now() / 1000);
  const token = await issueEdgeSessionToken({ sub: CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT }, secret, now, 60);
  const res = await handleCloudWriteOrderV2StagingBridgeRequest(
    new Request(`https://staging.test${CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VALIDATE_PATH}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: '{}'
    }),
    env
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.bridgeAuthorized, true);
  assert.equal(body.subject, CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT);
  assert.equal(body.stagingOnly, true);
}

{
  const now = Math.floor(Date.now() / 1000);
  const token = await issueEdgeSessionToken({ sub: 'ci-staging-admin' }, secret, now, 60);
  const res = await handleCloudWriteOrderV2StagingBridgeRequest(
    new Request(`https://staging.test${CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_VALIDATE_PATH}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: '{}'
    }),
    env
  );
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.code, 'invalid-bridge-subject');
}

// Execute requires a normal Staging edge session, mints a dedicated bridge token,
// forwards only the fixed synthetic canonical params, and never returns the token.
{
  const now = Math.floor(Date.now() / 1000);
  const callerToken = await issueEdgeSessionToken({ sub: 'ci-staging-admin' }, secret, now, 300);
  const originalFetch = globalThis.fetch;
  let upstreamCalls = 0;
  let capturedBridgeToken = '';
  try {
    globalThis.fetch = async (url, options = {}) => {
      upstreamCalls++;
      assert.equal(String(url), apiUrl);
      assert.equal(options.method, 'POST');
      const body = JSON.parse(String(options.body || '{}'));
      assert.equal(body.action, 'cloudWriteOrderV2StagingBridgeV1');
      assert.equal(body.contractVersion.includes('STAGING_BRIDGE_WORKER_V1'), true);
      assert.equal(body.canonicalCreateParams.clientRequestId, 'CWV2-STAGE-BRIDGE-001');
      assert.equal(body.canonicalCreateParams.customerName, 'Staging Cloud Write V2 Bridge Qualification');
      assert.equal(body.canonicalCreateParams.customerPhone, '01001112233');
      assert.equal(body.canonicalCreateParams.customerMode, 'خارجي / عابر');
      assert.equal(body.canonicalCreateParams.externalCustomerId, '988');
      assert.equal(body.canonicalCreateParams.department, 'طباعة');
      assert.equal(body.canonicalCreateParams.itemName, 'V2 Bridge Qualification Item');
      assert.equal(String(body.canonicalCreateParams.qty), '1');
      assert.equal(body.canonicalCreateParams.heatPress, 'نعم');
      assert.equal(body.canonicalCreateParams.flyPrint, 'لا');
      assert.equal(Object.hasOwn(body.canonicalCreateParams, 'orderId'), false);
      capturedBridgeToken = String(body.bridgeToken || '');
      const verified = await verifyEdgeSessionToken(capturedBridgeToken, secret, now);
      assert.equal(verified.ok, true);
      assert.equal(verified.payload.sub, CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT);
      assert.equal(Number(verified.payload.exp) - Number(verified.payload.iat), 60);
      return new Response(JSON.stringify({
        success: true,
        verified: true,
        stagingOnly: true,
        syntheticOnly: true,
        clientRequestId: 'CWV2-STAGE-BRIDGE-001',
        orderId: '3886',
        lineId: '3886-01',
        linesCreated: 1,
        duplicatePrevented: false,
        idempotentReplay: false,
        productionWriteExecuted: false,
        productionCloudWriteChanged: false
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const res = await handleCloudWriteOrderV2StagingBridgeRequest(
      new Request(`https://staging.test${CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_EXECUTE_PATH}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${callerToken}`, 'content-type': 'application/json' },
        body: '{}'
      }),
      env
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.verified, true);
    assert.equal(body.orderId, '3886');
    assert.equal(body.lineId, '3886-01');
    assert.equal(body.bridgeTokenReturned, false);
    assert.equal(body.d1Written, false);
    assert.equal(body.productionWriteExecuted, false);
    assert.equal(body.productionCloudWriteChanged, false);
    assert.equal(body.productionCutover, false);
    assert.equal(JSON.stringify(body).includes(capturedBridgeToken), false);
    assert.equal(upstreamCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// A bridge token cannot recursively invoke /execute.
{
  const now = Math.floor(Date.now() / 1000);
  const bridgeToken = await issueEdgeSessionToken({ sub: CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_SUBJECT }, secret, now, 60);
  const res = await handleCloudWriteOrderV2StagingBridgeRequest(
    new Request(`https://staging.test${CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_EXECUTE_PATH}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${bridgeToken}`, 'content-type': 'application/json' },
      body: '{}'
    }),
    env
  );
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.code, 'bridge-token-cannot-invoke-execute');
}

console.log('CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_PASS');
