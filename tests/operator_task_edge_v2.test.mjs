import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {
  isOperatorTaskEdgePath,
  operatorTaskRouteContract,
  operatorTaskCanonicalAssertion,
  signOperatorTaskAssertion
} from '../cloudflare-d1/src/operator-task-edge-v2.mjs';

const workerSource = fs.readFileSync(new URL('../cloudflare-d1/src/operator-task-edge-v2.mjs', import.meta.url), 'utf8');
const proxySource = fs.readFileSync(new URL('../operator-task-edge-proxy-v2.gs', import.meta.url), 'utf8');

test('stable Operator Task edge routes are exact and capability-scoped', () => {
  const expected = [
    '/v1/operator/tasks/status',
    '/v1/operator/tasks/claim-next',
    '/v1/operator/tasks/complete',
    '/v1/operator/fly-print',
    '/v1/operator/press-candidates',
    '/v1/operator/tasks/metrics'
  ];
  expected.forEach((path) => assert.equal(isOperatorTaskEdgePath(path), true, path));
  assert.equal(isOperatorTaskEdgePath('/v1/operator/tasks/backlog'), false);
  assert.deepEqual(operatorTaskRouteContract('/v1/operator/fly-print').roles, ['WAEL']);
  assert.deepEqual(operatorTaskRouteContract('/v1/operator/press-candidates').roles, ['WAEL']);
  assert.deepEqual(operatorTaskRouteContract('/v1/operator/tasks/metrics').roles, ['MANAGER']);
  assert.equal(operatorTaskRouteContract('/v1/operator/tasks/claim-next').mutation, true);
  assert.equal(operatorTaskRouteContract('/v1/operator/tasks/complete').mutation, true);
});

test('worker is fail-closed, secret-only, and has no D1 Task write lane', () => {
  assert.match(workerSource, /TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED/);
  assert.match(workerSource, /TRENDOS_OPERATOR_TASK_PROXY_SECRET/);
  assert.match(workerSource, /IDEMPOTENCY_KEY_REQUIRED/);
  assert.match(workerSource, /verifyEdgeSessionToken/);
  assert.doesNotMatch(workerSource, /env\.DB/);
  assert.doesNotMatch(workerSource, /body\.username/);
  assert.doesNotMatch(workerSource, /payload\.token/);
  assert.doesNotMatch(workerSource, /employeeToken/);
  assert.doesNotMatch(workerSource, /EDGE_SESSION_SECRET[^\n]*(set|put|write)/i);
});

test('Apps Script proxy reads proxy secret but never creates/changes properties', () => {
  assert.match(proxySource, /TRENDOS_OPERATOR_TASK_PROXY_SECRET/);
  assert.match(proxySource, /getScriptProperties\(\)\.getProperty/);
  assert.doesNotMatch(proxySource, /\.setProperty\s*\(/);
  assert.match(proxySource, /findUser_\(otepTxtV2_\(operator\)\)/);
  assert.match(proxySource, /authorize_\(user\.username,user\.token\)/);
  assert.match(proxySource, /auth\.__requestToken=otepTxtV2_\(user\.token\)/);
  assert.doesNotMatch(proxySource, /return\s+.*user\.token/);
});

test('Worker and Apps Script produce identical HMAC canonical bytes/signature', async () => {
  const vector = {
    method: 'POST',
    op: 'completeTask',
    operator: 'وائل',
    sessionJti: 'edge-session-123',
    assertedAt: 1789261200,
    idempotencyKey: 'ot2-complete-abc',
    payloadJson: JSON.stringify({ taskId: 'OT2-123', finalStatus: 'جاهز للاستلام', notes: '' })
  };
  const secret = 'ci-test-secret-not-production';
  const canonicalWorker = await operatorTaskCanonicalAssertion(vector);
  const signatureWorker = await signOperatorTaskAssertion(vector, secret);

  const context = {
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest(_alg, value) { return Array.from(crypto.createHash('sha256').update(String(value), 'utf8').digest()); },
      computeHmacSha256Signature(value, key) { return Array.from(crypto.createHmac('sha256', String(key)).update(String(value), 'utf8').digest()); }
    },
    PropertiesService: { getScriptProperties(){ return { getProperty(){ return secret; } }; } },
    Date,
    JSON,
    String,
    Number,
    Math,
    Array,
    Object
  };
  vm.createContext(context);
  vm.runInContext(proxySource, context);
  const p = { protocol:'TRENDOS_OT_EDGE_V1', ...vector };
  const canonicalApps = context.otepCanonicalV2_(p);
  const signatureApps = context.otepHmacHexV2_(canonicalApps, secret);
  assert.equal(canonicalApps, canonicalWorker);
  assert.equal(signatureApps, signatureWorker);
});
