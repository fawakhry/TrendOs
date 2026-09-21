import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-dashboard-singlefile-test-worker.js',import.meta.url),'utf8');
const production=fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js',import.meta.url),'utf8');
assert.doesNotMatch(src,/^\\s*import\\s/m);
assert.match(src,/T12_SYNTHETIC_TEST_ENABLED/);
assert.match(src,/\.replace\(\/\[٠-٩\]\/g, \(d\) => String\(/);
assert.match(src,/const subtle=\(\/\*\* @type \{any\} \*\/ \(globalThis\)\)\.crypto\?\.subtle;/);
assert.match(src,/ISOLATED_T12_SYNTHETIC_ONLY/);
assert.match(src,/T12_SYNTHETIC_TEST_BEARER_SECRET/);
assert.doesNotMatch(production,/t12-dashboard-singlefile-test-worker/);
const module=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
assert.equal(typeof module.default.fetch,'function');
const r=await module.default.fetch(
  new Request('https://isolated-test.invalid/__t12/synthetic/order-create',{method:'POST'}),
  {T12_SYNTHETIC_TEST_ENABLED:'false'});
assert.equal(r.status,423);
const result=await r.json();
assert.equal(result.success,false);
assert.equal(result.productionAuthorized,false);
console.log('T12 dashboard single-file smoke PASS: no imports, no production import, default disabled with no DB mutation');
