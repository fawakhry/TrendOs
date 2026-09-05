import assert from 'node:assert/strict';
import fs from 'node:fs';

const wrapperSource = fs.readFileSync('cloudflare-d1/src/edge-orders-read-v1-canary.mjs', 'utf8');
const indexSource = fs.readFileSync('cloudflare-d1/src/index_v2.js', 'utf8');
const configSource = fs.readFileSync('config.js', 'utf8');

const mod = await import('../cloudflare-d1/src/edge-orders-read-v1-canary.mjs');
assert.equal(typeof mod.handleEdgeOrdersReadCanaryRequest, 'function');
assert.equal(typeof mod.isEdgeOrdersReadPath, 'function');

assert.match(indexSource, /edge-orders-read-v1-canary\.mjs/);
assert.match(indexSource, /handleEdgeOrdersReadCanaryRequest/);
assert.match(configSource, /MATBAGY_EDGE_ORDERS_READ_V1_ENABLED\s*=\s*false/);

assert.match(wrapperSource, /defaultVisibleStatus/);
assert.match(wrapperSource, /ملغى/);
assert.match(wrapperSource, /مكرر/);
assert.match(wrapperSource, /تم التسليم/);
assert.match(wrapperSource, /جاهز للاستلام/);
assert.match(wrapperSource, /Debt-filtered orders require the authoritative Apps Script lane/);
assert.match(wrapperSource, /handleEdgeOrdersReadRequest\(request, env, ctx\)/);

const forbiddenSql = ['INSERT ', 'UPDATE ', 'DELETE ', 'DROP ', 'ALTER ', 'CREATE TABLE', 'PRAGMA ', 'REPLACE '];
const upperWrapper = wrapperSource.toUpperCase();
for (const token of forbiddenSql) {
  assert.equal(upperWrapper.includes(token), false, `Wrapper must remain SELECT-only/read-only: ${token}`);
}

const forbidden = ['secret put', 'wrangler d1 migrations apply', 'd1 execute --file', 'TRENDOS_PRODUCTION_CUTOVER', 'AUTHORITY_CUTOVER'];
for (const token of forbidden) {
  assert.equal(wrapperSource.includes(token), false, `Forbidden boundary token in wrapper: ${token}`);
}

console.log('PERF_CF_02CO_CANARY_WRAPPER_SAFETY_TEST_PASS');
