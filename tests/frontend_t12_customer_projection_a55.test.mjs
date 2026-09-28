import assert from 'node:assert/strict';
import fs from 'node:fs';

const client=fs.readFileSync('trendos-edge-orders-read-v1.js','utf8');
const config=fs.readFileSync('config.js','utf8');

assert.match(client,/EDGE_ORDERS_T12_CUSTOMER_PROJECTION_A55_20260929/);
assert.match(client,/CUSTOMER_LEGACY_PROJECTION_PATH = '\/v1\/t12\/customers\/legacy-projection'/);
assert.match(client,/CUSTOMER_PENDING_PROJECTION_STORAGE_KEY = 'trendos_customer_pending_projection_v1'/);
assert.match(client,/DEFAULT_CUSTOMER_POST_WRITE_BARRIER_MS = 10 \* 60 \* 1000/);
assert.match(client,/function customerProjectionPayload\(params, requestKey\)/);
assert.match(client,/function rememberPendingCustomerProjection\(payload\)/);
assert.match(client,/async function t12CustomerLegacyProjection\(payload\)/);
assert.match(client,/async function flushPendingCustomerProjection\(\)/);
assert.match(client,/if \(action === 'createCustomer'\)/);
assert.match(client,/var legacyCustomerResult = await original\.apply\(this, args\)/);
assert.match(client,/rememberPendingCustomerProjection\(projectionPayload\)/);
assert.match(client,/var projectionResult = await t12CustomerLegacyProjection\(projectionPayload\)/);
assert.match(client,/openCustomerPostWriteBarrier\(\)/);
assert.match(client,/if \(action === 'searchCustomers'\)[\s\S]*?if \(customerPostWriteBarrierActive\(\)\)[\s\S]*?await flushPendingCustomerProjection\(\)/);
assert.match(client,/metrics\.customerProjectionSuccess \+= 1/);
assert.match(client,/metrics\.customerProjectionFailures \+= 1/);
assert.match(client,/customerProjectionPending: !!readPendingCustomerProjection\(\)/);
assert.match(client,/if \(action === 'createManualOrder'\)/);
assert.match(client,/if \(staleFallbackActive\(\)\)/);
assert.match(config,/trendos-edge-orders-read-v1\.js\?v=20260929-t12-a55-customer-projection/);

// The authoritative Sheet save must happen before the D1 projection attempt.
const createPos=client.indexOf("if (action === 'createCustomer')");
const legacySavePos=client.indexOf('var legacyCustomerResult = await original.apply(this, args)',createPos);
const projectionPos=client.indexOf('var projectionResult = await t12CustomerLegacyProjection(projectionPayload)',createPos);
assert.ok(createPos>=0 && legacySavePos>createPos && projectionPos>legacySavePos);

// Projection payload is explicitly whitelisted and must not persist employee auth material.
const payloadStart=client.indexOf('function customerProjectionPayload(params, requestKey)');
const payloadEnd=client.indexOf('function readPendingCustomerProjection()',payloadStart);
const payloadFn=client.slice(payloadStart,payloadEnd);
assert.doesNotMatch(payloadFn,/username\s*:/);
assert.doesNotMatch(payloadFn,/token\s*:/);

// A55 does not switch frontend customer writes to the native GENERAL endpoint.
assert.doesNotMatch(client,/CUSTOMER_WRITE_PATH\s*=\s*['"]\/v1\/t12\/customers\/write['"]/);

console.log('T12 A55 frontend customer projection contract: PASS');
