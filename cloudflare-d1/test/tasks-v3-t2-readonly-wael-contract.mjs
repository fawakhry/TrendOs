import assert from 'node:assert/strict';
import worker from '../src/tasks-v3-t2-readonly-wael-worker.mjs';

const EXPECTED_URL = 'https://script.google.com/macros/s/AKfycbzo6zcypF7mhECUrfqkP4u0NuzrV373vUQjLMk4o-TMbe4TyV93WkPnrsmeKVHSgCH1Bg/exec';
const env = {
  TASKS_V3_APPS_SCRIPT_URL: EXPECTED_URL,
  TASKS_V3_SHARED_SECRET: 'unit-test-secret-not-production'
};

const originalFetch = globalThis.fetch;
const calls = [];

globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), init });
  return new Response(JSON.stringify({
    success: true,
    version: 'TASKS_V3_READONLY_T2_WAEL_CANARY_2',
    readOnly: true,
    activeTask: null
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

async function post(body) {
  return worker.fetch(new Request('https://t2.example.test/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }), env);
}

try {
  {
    const response = await worker.fetch(new Request('https://t2.example.test/'), env);
    assert.equal(response.status, 405);
    assert.equal(calls.length, 0);
  }

  for (const op of ['claimNext', 'completeTask']) {
    const response = await post({ op, operator: 'وائل', role: 'WAEL' });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'T2_OPERATION_FORBIDDEN');
    assert.equal(calls.length, 0);
  }

  {
    const response = await post({ op: 'health', operator: 'غير وائل', role: 'WAEL' });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'T2_OPERATOR_FORBIDDEN');
    assert.equal(calls.length, 0);
  }

  {
    const response = await post({ op: 'health', operator: 'وائل', role: 'ADMIN' });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'T2_ROLE_FORBIDDEN');
    assert.equal(calls.length, 0);
  }

  for (const op of ['health', 'status', 'flyPrint', 'pressCandidates']) {
    const before = calls.length;
    const response = await post({ op, operator: 'وائل', role: 'WAEL', payloadJson: '{}' });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);
    assert.equal(calls.length, before + 1);

    const call = calls.at(-1);
    assert.equal(call.url, EXPECTED_URL);
    assert.equal(call.init.method, 'POST');
    const assertion = JSON.parse(call.init.body);
    assert.equal(assertion.protocol, 'TRENDOS_TASKS_V3_READONLY_1');
    assert.equal(assertion.op, op);
    assert.equal(assertion.operator, 'وائل');
    assert.equal(assertion.role, 'WAEL');
    assert.equal(typeof assertion.signature, 'string');
    assert.ok(assertion.signature.length > 0);
  }

  console.log('TASKS_V3_T2_READONLY_WAEL_CONTRACT_PASS');
} finally {
  globalThis.fetch = originalFetch;
}
