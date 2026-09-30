import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js', import.meta.url), 'utf8');

assert.match(src, /handleEdgeOrders02CRCanaryRequest/);
assert.match(src, /isEdgeOrders02CRPath/);
assert.match(src, /from '\.\/edge-orders-read-02cr-freshness\.mjs'/);
assert.match(src, /repairEdgeOrdersResponse02CX/);
assert.match(src, /from '\.\/edge-orders-line-id-repair-02cx\.mjs'/);
assert.match(src, /if \(isEdgeOrders02CRPath\(path\)\) \{\s*const response = await handleEdgeOrders02CRCanaryRequest\(request, env, ctx\);\s*return repairEdgeOrdersResponse02CX\(response\);\s*\}/s);

const isolatedIndex = src.indexOf('if (isEdgeOrders02CRPath(path))');
const productionIndex = src.indexOf('if (isEdgeOrdersReadPath(path))');
assert.ok(isolatedIndex >= 0 && productionIndex > isolatedIndex, '02CR route remains explicit while carrying freshness + 02CX identity repair');
assert.doesNotMatch(src, /MATBAGY_EDGE_ORDERS_READ_V1_ENABLED/);
assert.doesNotMatch(src, /EDGE_SESSION_SECRET\s*=|wrangler\s+deploy|genericDrainEnabled/);

const wrapper = fs.readFileSync(new URL('../cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs', import.meta.url), 'utf8');
assert.match(wrapper, /handleQualified02CR/);
assert.match(wrapper, /02CR_LINES_STALE_SNAPSHOT_ADVISORY/);
assert.match(wrapper, /googleHeartbeatRequired:\s*false/);
assert.doesNotMatch(wrapper, /inspectOrdersIdleHeartbeat|ordersIdleHeartbeatVerifierEnabled|fetchOrdersIdleHeartbeat|APPS_SCRIPT_API_URL/);
assert.doesNotMatch(wrapper, /INSERT\s+INTO|UPDATE\s+sheet_|DELETE\s+FROM/i);

const repair = fs.readFileSync(new URL('../cloudflare-d1/src/edge-orders-line-id-repair-02cx.mjs', import.meta.url), 'utf8');
assert.match(repair, /repairSerializedLineId02CX/);
assert.match(repair, /repairEdgeOrdersResponse02CX/);
assert.doesNotMatch(repair, /INSERT\s+INTO|UPDATE\s+sheet_|DELETE\s+FROM|fetch\s*\(/i, '02CX response repair must stay mutation/network free');

console.log('ENTRY498_02CX_02CR_ZERO_GOOGLE_ROUTE_PASS');
