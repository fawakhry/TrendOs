import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import localWorker from '../cloudflare-d1/t12-preview/r4-preview-local-entry.mjs';

const localConfig=fs.readFileSync(new URL(
  '../cloudflare-d1/t12-preview/wrangler.r4-preview.local.toml',
  import.meta.url),'utf8');
const prodConfig=fs.readFileSync(new URL(
  '../cloudflare-d1/wrangler.toml',import.meta.url),'utf8');
for(const forbidden of [
  'trendos-main', 'APPS_SCRIPT_API_URL', 'trendos-d1-api',
  'production-shadow/index.js', 'cloudflare-d1/src/index_v2.js'
]) {
  assert.equal(localConfig.includes(forbidden),false,
    'local preview must not inherit production configuration');
}
assert.match(localConfig,/main = "\.\/r4-preview-local-entry\.mjs"/);
assert.match(localConfig,/R4_PREVIEW_ENABLED = "false"/);
assert.match(localConfig,/binding = "R4_TEST_DB"/);
assert.match(localConfig,/database_id = "00000000-0000-0000-0000-000000000000"/);
assert.equal(localConfig.includes(/database_id\s*=\s*"[^"]+"/.exec(prodConfig)?.[0]??'NO_PRODUCTION_ID'),false);
assert.equal(/\bbinding = "DB"/.test(localConfig),false);
const prodEntrypoints=[
  '../cloudflare-d1/src/index_v2.js',
  '../cloudflare-d1/production-shadow/index.js'
];
for(const name of prodEntrypoints) {
  const code=fs.readFileSync(new URL(name,import.meta.url),'utf8');
  assert.equal(code.includes('r4-preview-local-entry'),false);
  assert.equal(code.includes('t12-d1-guarded-recovery-preview-handler-v1'),false);
}
const root='http://127.0.0.1:8787';
const req=(path,method='GET')=>new Request(root+path,{method});
let res=await localWorker.fetch(req('/v1/t12-preview/d1-recovery/health'),{});
assert.equal(res.status,200);
assert.equal((await res.json()).productionWriteAuthorized,false);
res=await localWorker.fetch(req('/v1/t12-preview/d1-recovery/health'),{DB:{}});
assert.equal(res.status,423);
res=await localWorker.fetch(req('/v1/t12-preview/d1-recovery/health'),{APPS_SCRIPT_API_URL:'synthetic'});
assert.equal(res.status,423);
res=await localWorker.fetch(req('/unrelated'),{});
assert.equal(res.status,404);
res=await localWorker.fetch(req('/v1/t12-preview/d1-recovery/apply','POST'),
  {R4_PREVIEW_ENABLED:'false',R4_TEST_DATABASE_ONLY:'true'});
assert.equal(res.status,423);
const fixture=fs.readFileSync(new URL(
  '../cloudflare-d1/t12-preview/r4-preview-synthetic-fixture.sql',
  import.meta.url),'utf8');
const testDb=new DatabaseSync(':memory:');
testDb.exec(fixture);
assert.equal(testDb.prepare('SELECT COUNT(*) AS n FROM sheet_catalog').get().n,2);
assert.equal(testDb.prepare('SELECT COUNT(*) AS n FROM sheet_rows').get().n,4);
assert.equal(testDb.prepare(
  'SELECT COUNT(*) AS n FROM sheet_rows WHERE values_json NOT IN (?,?)'
).get('["h"]','["synthetic-old"]').n,0);
testDb.close();
console.log('R4 local preview isolation PASS: no production binding, exact routes, default-off, no live Worker wiring.');
