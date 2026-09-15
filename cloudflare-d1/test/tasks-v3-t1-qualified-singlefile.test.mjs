import assert from 'node:assert/strict';
import worker from '../dashboard/tasks-v3-t1-qualified-singlefile-20260915.mjs';

const originalFetch = globalThis.fetch;

try {
  let seenAssertion = null;
  globalThis.fetch = async (_url, init) => {
    assert.equal(init.method, 'POST');
    assert.equal(init.headers['content-type'], 'text/plain;charset=utf-8');
    seenAssertion = JSON.parse(init.body);
    return new Response(JSON.stringify({
      success: true,
      version: 'TASKS_V3_READONLY_T0',
      flyPrint: { success: true, lane: 'flyPrint', rows: [], count: 0 },
      pressCandidates: { success: true, lane: 'press', rows: [], count: 0 }
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  const env = {
    TASKS_V3_APPS_SCRIPT_URL: 'https://example.invalid/exec',
    TASKS_V3_SHARED_SECRET: 'test-secret-only'
  };

  const response = await worker.fetch(
    new Request('https://preview.invalid/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        op: 'status',
        operator: 'wael-preview',
        role: 'WAEL',
        payloadJson: '{}'
      })
    }),
    env
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.code, 'OK');
  assert.ok(response.headers.get('Server-Timing'));

  assert.ok(seenAssertion);
  assert.equal(seenAssertion.protocol, 'TRENDOS_TASKS_V3_READONLY_1');
  assert.equal(seenAssertion.op, 'status');
  assert.equal(seenAssertion.operator, 'wael-preview');
  assert.equal(seenAssertion.role, 'WAEL');
  assert.equal(seenAssertion.payloadJson, '{}');
  assert.match(seenAssertion.signature, /^[0-9a-f]{64}$/);

  const getResponse = await worker.fetch(
    new Request('https://preview.invalid/', { method: 'GET' }),
    env
  );
  assert.equal(getResponse.status, 405);

  const forbiddenResponse = await worker.fetch(
    new Request('https://preview.invalid/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        op: 'claimNext',
        operator: 'wael-preview',
        role: 'WAEL'
      })
    }),
    env
  );
  assert.equal(forbiddenResponse.status, 400);
  const forbiddenBody = await forbiddenResponse.json();
  assert.equal(forbiddenBody.success, false);
  assert.equal(forbiddenBody.code, 'TASKS_V3_PREVIEW_OPERATION_FORBIDDEN');

  console.log('TASKS_V3_T1_QUALIFIED_SINGLEFILE_PASS');
} finally {
  globalThis.fetch = originalFetch;
}
