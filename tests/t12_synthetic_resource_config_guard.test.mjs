import assert from 'node:assert/strict';
import fs from 'node:fs';

const base=new URL('../cloudflare-d1/',import.meta.url);
const prod=fs.readFileSync(new URL('wrangler.toml',base),'utf8');
const test=fs.readFileSync(new URL('t12-preview/wrangler.t12-synthetic-test.template.toml',base),'utf8');
const standalone=fs.readFileSync(new URL('t12-preview/t12-cloud-native-synthetic-test-worker.mjs',base),'utf8');
const prodWorker=fs.readFileSync(new URL('production-shadow/index.js',base),'utf8');
const rootWorker=fs.readFileSync(new URL('src/index_v2.js',base),'utf8');

assert.match(test,/^name = "trendos-t12-synthetic-test"$/m);
assert.match(test,/^main = "\.\/t12-cloud-native-synthetic-test-worker\.mjs"$/m);
assert.match(test,/^T12_SYNTHETIC_TEST_ENABLED = "false"$/m);
assert.match(test,/^binding = "T12_SYNTHETIC_DB"$/m);
assert.match(test,/^database_name = "trendos-t12-synthetic-test"$/m);
assert.match(test,/^database_id = "<NEW_TEST_D1_DATABASE_ID>"$/m);
assert.doesNotMatch(test,/^binding = "DB"$/m);
assert.doesNotMatch(test,/APPS_SCRIPT_API_URL|EDGE_SESSION_SECRET|TRENDOS_CLOUD_WRITE_V1_ENABLED/);
assert.notEqual((prod.match(/^name = "([^"]+)"$/m)||[])[1],
  (test.match(/^name = "([^"]+)"$/m)||[])[1]);
const prodId=(prod.match(/^database_id = "([^"]+)"$/m)||[])[1];
assert.ok(prodId && prodId!=='<NEW_TEST_D1_DATABASE_ID>');
assert.equal(test.includes(prodId),false,'TEST must not contain production D1 binding ID');
assert.doesNotMatch(prodWorker,/t12-cloud-native-synthetic-test-worker|T12_SYNTHETIC_DB/);
assert.doesNotMatch(rootWorker,/t12-cloud-native-synthetic-test-worker|T12_SYNTHETIC_DB/);
assert.match(standalone,/env\.DB\|\|env\.APPS_SCRIPT_API_URL\|\|env\.EDGE_SESSION_SECRET/);
assert.match(standalone,/T12_SYNTHETIC_TEST_ATTESTATION/);
assert.match(standalone,/T12_SYNTHETIC_TEST_BEARER_SECRET/);
console.log('T12 isolated resource config PASS: separate TEST Worker/DB name, placeholder UUID, default OFF, no prod ID, no imported production route');
