import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';

import {
  TASKS_V3_PROTOCOL,
  TASKS_V3_PREVIEW_ALLOWED_OPS,
  TASKS_V3_PREVIEW_ALLOWED_ROLE,
  TASKS_V3_PREVIEW_TIMEOUT_MS,
  buildTasksV3PreviewAssertion,
  proxyTasksV3ReadonlyPreview
} from '../cloudflare-d1/src/tasks-v3-readonly-preview.mjs';

const SOURCE_URL = new URL('../cloudflare-d1/src/tasks-v3-readonly-preview.mjs', import.meta.url);
const SECRET = 'preview-contract-secret';
const UPSTREAM = 'https://example.invalid/tasks-v3-preview';

async function hmacHex(canonical, secret) {
  const enc = new TextEncoder();
  const key = await webcrypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await webcrypto.subtle.sign('HMAC', key, enc.encode(canonical));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function response(status, body, contentType = 'application/json') {
  return new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    { status, headers: { 'content-type': contentType } }
  );
}

test('preview source is isolated from legacy Task mutation/fallback contracts', async () => {
  const source = await readFile(SOURCE_URL, 'utf8');
  assert.equal(source.includes('claim' + 'Next'), false);
  assert.equal(source.includes('complete' + 'Task'), false);
  assert.equal(source.includes('APPS_' + 'SCRIPT_API_URL'), false);
  assert.equal(source.includes('TRENDOS_' + 'OPERATOR_TASK_PROXY_SECRET'), false);
  assert.equal(source.includes('/v1/operator/tasks'), false);
  assert.equal(source.includes('TASKS_V3_APPS_SCRIPT_URL'), true);
  assert.equal(source.includes('TASKS_V3_SHARED_SECRET'), true);
});

test('preview contract exposes only the four read-only operations and Wael role', () => {
  assert.equal(TASKS_V3_PROTOCOL, 'TRENDOS_TASKS_V3_READONLY_1');
  assert.deepEqual([...TASKS_V3_PREVIEW_ALLOWED_OPS], ['health', 'status', 'flyPrint', 'pressCandidates']);
  assert.equal(TASKS_V3_PREVIEW_ALLOWED_ROLE, 'WAEL');
  assert.equal(TASKS_V3_PREVIEW_TIMEOUT_MS, 5000);
});

test('assertion canonicalization matches the Apps Script V3 bridge contract', async () => {
  const assertion = await buildTasksV3PreviewAssertion({
    op: 'status',
    operator: 'wael-test',
    role: 'wael',
    payloadJson: '{"screen":"print"}',
    secret: SECRET,
    nowSeconds: 1770000000,
    nonce: 'nonce-123',
    cryptoImpl: webcrypto
  });

  assert.equal(assertion.protocol, 'TRENDOS_TASKS_V3_READONLY_1');
  assert.equal(assertion.role, 'WAEL');
  const canonical = [
    assertion.protocol,
    assertion.op,
    assertion.operator,
    assertion.role,
    assertion.assertedAt,
    assertion.nonce,
    assertion.payloadJson
  ].join('\n');
  assert.equal(assertion.signature, await hmacHex(canonical, SECRET));
});

test('allowed request performs exactly one POST to the dedicated V3 upstream', async () => {
  let calls = 0;
  let captured;
  const fetchImpl = async (url, init) => {
    calls += 1;
    captured = { url, init };
    return response(200, { success: true, version: 'TASKS_V3_READONLY_T0' });
  };

  const out = await proxyTasksV3ReadonlyPreview({
    env: { TASKS_V3_APPS_SCRIPT_URL: UPSTREAM, TASKS_V3_SHARED_SECRET: SECRET },
    op: 'status',
    operator: 'wael-test',
    role: 'WAEL',
    fetchImpl,
    cryptoImpl: webcrypto,
    nowSeconds: 1770000000,
    nonce: 'one-fetch'
  });

  assert.equal(out.success, true);
  assert.equal(out.code, 'OK');
  assert.equal(calls, 1);
  assert.equal(captured.url, UPSTREAM);
  assert.equal(captured.init.method, 'POST');
  assert.match(captured.init.headers['content-type'], /^text\/plain/);
  const sent = JSON.parse(captured.init.body);
  assert.equal(sent.protocol, TASKS_V3_PROTOCOL);
  assert.equal(sent.role, 'WAEL');
});

test('non-Wael roles fail closed before any upstream request', async () => {
  for (const role of ['GABER', 'MANAGER', 'OTHER']) {
    let calls = 0;
    const out = await proxyTasksV3ReadonlyPreview({
      env: { TASKS_V3_APPS_SCRIPT_URL: UPSTREAM, TASKS_V3_SHARED_SECRET: SECRET },
      op: 'status',
      operator: 'candidate',
      role,
      fetchImpl: async () => { calls += 1; return response(200, { success: true }); },
      cryptoImpl: webcrypto,
      nonce: `role-${role}`
    });
    assert.equal(out.success, false);
    assert.equal(out.code, 'TASKS_V3_PREVIEW_ROLE_FORBIDDEN');
    assert.equal(calls, 0);
  }
});

test('unknown operations fail closed before any upstream request', async () => {
  let calls = 0;
  const out = await proxyTasksV3ReadonlyPreview({
    env: { TASKS_V3_APPS_SCRIPT_URL: UPSTREAM, TASKS_V3_SHARED_SECRET: SECRET },
    op: 'mutateSomething',
    operator: 'wael-test',
    role: 'WAEL',
    fetchImpl: async () => { calls += 1; return response(200, { success: true }); },
    cryptoImpl: webcrypto,
    nonce: 'forbidden-op'
  });
  assert.equal(out.success, false);
  assert.equal(out.code, 'TASKS_V3_PREVIEW_OPERATION_FORBIDDEN');
  assert.equal(calls, 0);
});

test('missing dedicated V3 configuration fails before fetch', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return response(200, { success: true }); };
  const out = await proxyTasksV3ReadonlyPreview({
    env: {}, op: 'health', operator: 'wael-test', fetchImpl, cryptoImpl: webcrypto
  });
  assert.equal(out.success, false);
  assert.equal(out.code, 'TASKS_V3_PREVIEW_CONFIG_MISSING');
  assert.equal(calls, 0);
});

test('upstream HTTP failure is fail-closed and never retried/fallbacked', async () => {
  let calls = 0;
  const out = await proxyTasksV3ReadonlyPreview({
    env: { TASKS_V3_APPS_SCRIPT_URL: UPSTREAM, TASKS_V3_SHARED_SECRET: SECRET },
    op: 'flyPrint',
    operator: 'wael-test',
    fetchImpl: async () => { calls += 1; return response(503, { success: false, code: 'UPSTREAM_DOWN' }); },
    cryptoImpl: webcrypto,
    nonce: 'http-fail'
  });
  assert.equal(out.success, false);
  assert.equal(out.code, 'TASKS_V3_PREVIEW_UPSTREAM_HTTP');
  assert.equal(calls, 1);
});

test('invalid upstream JSON fails closed', async () => {
  let calls = 0;
  const out = await proxyTasksV3ReadonlyPreview({
    env: { TASKS_V3_APPS_SCRIPT_URL: UPSTREAM, TASKS_V3_SHARED_SECRET: SECRET },
    op: 'pressCandidates',
    operator: 'wael-test',
    fetchImpl: async () => { calls += 1; return response(200, '<html>bad</html>', 'text/html'); },
    cryptoImpl: webcrypto,
    nonce: 'bad-json'
  });
  assert.equal(out.success, false);
  assert.equal(out.code, 'TASKS_V3_PREVIEW_INVALID_JSON');
  assert.equal(calls, 1);
});

test('timeout aborts the single upstream request and fails closed', async () => {
  let calls = 0;
  const fetchImpl = async (_url, init) => {
    calls += 1;
    return await new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      }, { once: true });
    });
  };

  const out = await proxyTasksV3ReadonlyPreview({
    env: { TASKS_V3_APPS_SCRIPT_URL: UPSTREAM, TASKS_V3_SHARED_SECRET: SECRET },
    op: 'status',
    operator: 'wael-test',
    fetchImpl,
    cryptoImpl: webcrypto,
    nonce: 'timeout-test',
    timeoutMs: 5
  });
  assert.equal(out.success, false);
  assert.equal(out.code, 'TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT');
  assert.equal(calls, 1);
});
