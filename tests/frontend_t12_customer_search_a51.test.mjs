import assert from 'node:assert/strict';
import fs from 'node:fs';

const client=fs.readFileSync('trendos-edge-orders-read-v1.js','utf8');
const config=fs.readFileSync('config.js','utf8');

assert.match(client,/EDGE_ORDERS_T12_CUSTOMER_D1.*A51.*20260929/);
assert.match(client,/var CUSTOMER_SEARCH_PATH = '\/v1\/edge\/customers\/search'/);
assert.match(client,/if \(action === 'searchCustomers'\)/);
assert.match(client,/edgeCustomerSearch\(params \|\| \{\}\)/);
assert.match(client,/metrics\.customerEdgeSuccess \+= 1/);
assert.match(client,/metrics\.customerMissFallbacks \+= 1/);
assert.match(client,/return original\.apply\(this, args\)/);
assert.match(client,/result = await edgeCustomerSearch\(searchParams\)/);
assert.match(client,/result = await original\.call\(context, 'searchCustomers', searchParams\)/);
assert.match(client,/if \(action === 'createManualOrder'\)/);
assert.match(client,/if \(action === 'updateLine'\)/);
assert.match(client,/if \(action === 'markCustomerNotified'\)/);
assert.match(client,/CUSTOMER_SEARCH_PATH/);
assert.match(client,/customerSearchPath: CUSTOMER_SEARCH_PATH/);
assert.match(config,/trendos-edge-orders-read-v1\.js\?v=20260929-t12-(?:customer-d1-search-a51|a52-stale-backoff)/);
assert.match(config,/MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true/);

console.log('T12 A51 frontend customer D1 search contract: PASS');
