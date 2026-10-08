import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../config.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert.match(edge,/reason === 'duplicate-order-window-active'/);
assert.match(edge,/existingOrderId/);
assert.match(edge,/retryAfterMs/);
assert.match(edge,/تم منع إنشاء أوردر مكرر/);
assert.match(edge,/انتظر حوالي/);
assert.match(config,/trendos-edge-orders-read-v1\.js\?v=20261002-legacy-line-runtime/);
// The frontend cache tag is intentionally allowed to advance on unrelated deploys.
assert.match(html,/<script src="config\.js\?v=[^"]+"(?:\s|>)/);

// Existing same-key retry behavior must remain intact.
assert.match(edge,/T12_PENDING_CREATE_STORAGE_KEY/);
assert.match(edge,/rememberPendingCreate\(fingerprint, cloudKey\)/);
assert.match(edge,/clearPendingCreate\(fingerprint\)/);

// New fixed-key safety and occupied-department refusal contract.
assert.match(edge,/createStorageKey\(fingerprint\)/);
assert.match(edge,/localStorage\.setItem\(createStorageKey\(fingerprint\),value\)/);
assert.match(edge,/crypto\.subtle\.digest\('SHA-256'/);
assert.doesNotMatch(edge,/duplicateConfirmationOrderId/);
assert.match(edge,/reason === 'customer-department-open-order-exists'/);
assert.doesNotMatch(edge,/20 \* 60 \* 1000/);
console.log('T12 duplicate-order frontend guard messaging + durable pending key PASS');
