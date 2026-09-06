import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js', import.meta.url), 'utf8');

assert.match(src, /handleEdgeOrders02CRCanaryRequest/);
assert.match(src, /isEdgeOrders02CRPath/);
assert.match(src, /from '\.\/edge-orders-read-02cr-canary\.mjs'/);
assert.match(src, /if \(isEdgeOrders02CRPath\(path\)\) \{\s*return handleEdgeOrders02CRCanaryRequest\(request, env, ctx\);\s*\}/s);

const isolatedIndex = src.indexOf('if (isEdgeOrders02CRPath(path))');
const productionIndex = src.indexOf('if (isEdgeOrdersReadPath(path))');
assert.ok(isolatedIndex >= 0 && productionIndex > isolatedIndex, '02CR isolated path must be explicit and must not replace production orders route');
assert.doesNotMatch(src, /MATBAGY_EDGE_ORDERS_READ_V1_ENABLED/);
assert.doesNotMatch(src, /EDGE_SESSION_SECRET\s*=|wrangler\s+deploy|genericDrainEnabled/);

console.log('PERF_CF_02CR_ISOLATED_WORKER_ROUTE_PASS');
