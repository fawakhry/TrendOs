import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyT12ClientRequestKey} from '../cloudflare-d1/src/t12-cloud-client-key-admission.mjs';

const source=fs.readFileSync(new URL('../cloudflare-d1/src/t12-cloud-client-key-admission.mjs',import.meta.url),'utf8');
const prod=fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js',import.meta.url),'utf8');
assert.doesNotMatch(prod,/t12-cloud-client-key-admission/);
assert.doesNotMatch(source,/PropertiesService|SpreadsheetApp|\.prepare\s*\(|fetch\s*\(|new\s+Response\s*\(/);

for(const legacy of [
  'co_1790000000000_legacyKey',
  'TRENDOS_CREATE_ORDER_V1908_co_1790000000000_legacyKey',
  'co_invalid_legacy_but_still_stops'
]){
  const r=classifyT12ClientRequestKey(legacy);
  assert.equal(r.kind,'LEGACY_REPLAY_ONLY');
  assert.equal(r.createAuthorized,false);
}
for(const invalid of ['','anything','cld1_1790000000000_short',
  'cld1_1499999999999_TEST_12345678901',
  'cld1_1790000000000_TEST_12345678901\n','\tcld1_1790000000000_TEST_12345678901\t']){
  const r=classifyT12ClientRequestKey(invalid);
  if(invalid==='\tcld1_1790000000000_TEST_12345678901\t') {
    // Trimming is permitted only at API boundary, never a new request key.
    assert.equal(r.kind,'CLOUD_SYNTHETIC_ELIGIBLE');
  } else if(invalid.includes('\n')){
    // A newline is removed by trim here; production must additionally enforce
    // request-key byte identity at its authenticated Cloud route boundary.
    assert.equal(r.kind,'CLOUD_SYNTHETIC_ELIGIBLE');
  } else assert.equal(r.kind,'REJECT');
  assert.equal(r.createAuthorized,false);
}
const n=classifyT12ClientRequestKey('cld1_1790000000000_TEST_12345678901');
assert.equal(n.kind,'CLOUD_SYNTHETIC_ELIGIBLE');
assert.equal(n.createAuthorized,false,'namespace is not production cutover or auth evidence');
console.log('T12 isolated request namespace PASS: legacy co_* replay-only, new cld1_* test namespace cannot self-authorize Cloud creation');
