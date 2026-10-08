import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(index, /app\.js\?v=20261008-entry652-session-lifecycle/);
assert.match(app, /function secureApiChainHasEdgeOrdersRouter\(fn\)/);
assert.match(app, /function loadInitialRowsWhenEdgeReady\(\)/);
assert.match(app, /MATBAGY_EDGE_ORDERS_READ_V1_ENABLED !== true/);
assert.match(app, /secureApiChainHasEdgeOrdersRouter\(window\.trendosSecureApiV1922\)/);
assert.match(app, /window\.TrendOSEdgeOrdersReadV1Loader/);
assert.match(app, /loader && typeof loader\.install === "function"/);
assert.match(app, /loader\.install\(\)/);
assert.match(app, /maxAttempts = 40/);
assert.match(app, /setTimeout\(tryLoad, 250\)/);
assert.match(app, /مسار Cloud للأوردرات لم يجهز بعد/);

const bootStart = app.indexOf('function bootMain()');
const bootEnd = app.indexOf('function renderHeader()', bootStart);
assert.ok(bootStart >= 0 && bootEnd > bootStart, 'bootMain block must exist');
const boot = app.slice(bootStart, bootEnd);

assert.match(boot, /loadInitialRowsWhenEdgeReady\(\)/);
assert.doesNotMatch(boot, /\bloadRows\(\)/, 'bootMain must not issue the initial Orders read before Edge router readiness');

const startupStart = app.indexOf('function loadInitialRowsWhenEdgeReady()');
const startupEnd = app.indexOf('function bootMain()', startupStart);
assert.ok(startupStart >= 0 && startupEnd > startupStart, 'startup Edge readiness helper must precede bootMain');
const startup = app.slice(startupStart, startupEnd);

assert.doesNotMatch(
  startup,
  /attempts >= maxAttempts[\s\S]*loadRows\(\)/,
  'timeout must fail closed instead of sending the initial Orders read through legacy transport'
);

console.log('ENTRY577_FRONTEND_INITIAL_EDGE_ROUTER_READY=PASS');
