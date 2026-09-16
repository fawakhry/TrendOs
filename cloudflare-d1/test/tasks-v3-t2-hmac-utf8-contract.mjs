import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { buildTasksV3PreviewAssertion } from '../src/tasks-v3-readonly-preview.mjs';

const secret = 'unit-test-secret-not-production';
const payload = {
  op: 'health',
  operator: 'وائل',
  role: 'WAEL',
  payloadJson: '{}',
  nowSeconds: 1770000000,
  nonce: 'utf8-arabic-contract-nonce'
};

const assertion = await buildTasksV3PreviewAssertion({
  ...payload,
  secret
});

const canonical = [
  'TRENDOS_TASKS_V3_READONLY_1',
  payload.op,
  payload.operator,
  payload.role,
  String(payload.nowSeconds),
  payload.nonce,
  payload.payloadJson
].join('\n');

const expectedUtf8 = createHmac('sha256', Buffer.from(secret, 'utf8'))
  .update(Buffer.from(canonical, 'utf8'))
  .digest('hex');

assert.equal(assertion.signature, expectedUtf8, 'Worker HMAC must use UTF-8 canonical bytes for Arabic operator text.');
assert.equal(assertion.operator, 'وائل');
assert.equal(assertion.protocol, 'TRENDOS_TASKS_V3_READONLY_1');

const bridgeUrl = new URL('../../tasks-v3-bridge-readonly.gs', import.meta.url);
const bridge = await readFile(bridgeUrl, 'utf8');

assert.match(
  bridge,
  /Utilities\.computeHmacSha256Signature\(\s*value,\s*secret,\s*Utilities\.Charset\.UTF_8\s*\)/s,
  'Apps Script HMAC must explicitly use Utilities.Charset.UTF_8.'
);
assert.match(
  bridge,
  /TASKS_V3_PROTOCOL,[\s\S]*tasksV3Text_\(payload\.op\),[\s\S]*tasksV3Text_\(payload\.operator\),[\s\S]*tasksV3Role_\(payload\.role\),[\s\S]*tasksV3Text_\(payload\.assertedAt\),[\s\S]*tasksV3Text_\(payload\.nonce\),[\s\S]*tasksV3Text_\(payload\.payloadJson \|\| '\{\}'\)/,
  'Apps Script canonical field order must remain aligned with the Worker protocol.'
);
assert.ok(!bridge.includes('claimNext'), 'T2 bridge must not expose claimNext.');
assert.ok(!bridge.includes('completeTask'), 'T2 bridge must not expose completeTask.');

console.log('TASKS_V3_T2_HMAC_UTF8_CONTRACT_PASS');
