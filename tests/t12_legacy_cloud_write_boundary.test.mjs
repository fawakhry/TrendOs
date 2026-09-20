import assert from 'node:assert/strict';
import fs from 'node:fs';

// Repository-only route isolation. Production health API may say enabled=true,
// but the legacy V1 CW shadow lane is NOT canonical numeric Order authority.
const v1=fs.readFileSync(new URL('../cloudflare-d1/src/cloud-write.mjs',import.meta.url),'utf8');
const v1Gate=fs.readFileSync(new URL('../cloudflare-d1/src/cloud-write-gate.mjs',import.meta.url),'utf8');
const native=fs.readFileSync(new URL('../cloudflare-d1/src/t12-cloud-native-synthetic-create.mjs',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
const prod=fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js',import.meta.url),'utf8');
const wrangler=fs.readFileSync(new URL('../cloudflare-d1/wrangler.toml',import.meta.url),'utf8');

assert.match(v1,/CW-\$\{Date\.now\(\)\}/);
assert.match(v1,/cloud_write_events/);
assert.match(v1,/cloud_write_outbox/);
assert.match(v1,/\/v1\/cloud\/orders/);
assert.match(v1,/cutover:\s*false/);
assert.match(v1Gate,/handleLegacyCloudWriteRequest/);
assert.match(worker,/isCloudWritePath/);
assert.match(wrangler,/TRENDOS_CLOUD_WRITE_V1_ENABLED/);
assert.doesNotMatch(native,/cloud-write(?:\.mjs|-gate)/);
assert.doesNotMatch(native,/cloud_write_events|cloud_write_outbox|\bCW-/);
for(const source of [worker,prod,wrangler])
  assert.doesNotMatch(source,/t12-cloud-native-synthetic-create/);
console.log('T12 V1 Cloud Write boundary PASS: current CW shadow route is distinct from canonical numeric Order authority and synthetic T12 is not routed');
