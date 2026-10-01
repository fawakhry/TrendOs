import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');

assert.match(edge,/reason === 'duplicate-order-window-active'/);
assert.match(edge,/existingOrderId/);
assert.match(edge,/retryAfterMs/);
assert.match(edge,/تم منع إنشاء أوردر مكرر/);
assert.match(edge,/انتظر حوالي/);

// Existing same-key retry behavior must remain intact.
assert.match(edge,/T12_PENDING_CREATE_STORAGE_KEY/);
assert.match(edge,/rememberPendingCreate\(fingerprint, cloudKey\)/);
assert.match(edge,/clearPendingCreate\(\)/);

console.log('T12 duplicate-order frontend guard messaging PASS');
