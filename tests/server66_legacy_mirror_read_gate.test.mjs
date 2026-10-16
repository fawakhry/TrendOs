/** SERVER-66 / SEC-AP303-02 — offline authorization regression. No network or real D1. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMirrorRequest } from '../cloudflare-d1/src/mirror.js';
import routed from '../cloudflare-d1/src/index_v2.js';
import legacy from '../cloudflare-d1/src/index.js';

const ORIGIN = 'https://server66-offline.invalid';
const MIRROR_PATHS = [
  '/v1/mirror/sheets',
  '/v1/mirror/stats',
  '/v1/mirror/sheet?name=SYNTHETIC_ONLY',
  '/v1/mirror/sheets/',
];
const LEGACY_PATHS = [
  '/v1/orders',
  '/v1/orders/SYNTHETIC_ONLY',
  '/v1/customer?phone=01000000000',
  '/v1/messages?phone=01000000000',
  '/v1/inbox',
];
const mirror = { fetch: (request, env) => handleMirrorRequest(request, env) };
const workers = [['direct-mirror', mirror], ['v2-routed', routed]];
const DB_SHOULD_NOT_RUN = { prepare() { throw new Error('D1 must not be queried or initialized'); } };

function fakeEnv() { return { DB: DB_SHOULD_NOT_RUN, MIGRATION_SECRET: 'FAKE_SECRET_FOR_UNIT_TEST_ONLY' }; }

for (const [name, worker] of workers) {
  for (const path of MIRROR_PATHS) {
    for (const headers of [
      {},
      { Origin: 'https://fawakhry.github.io' },
      { Authorization: 'Bearer FAKE_UNTRUSTED_BEARER' },
      { 'x-migration-secret': 'FAKE_SECRET_FOR_UNIT_TEST_ONLY' },
    ]) {
      test(`${name}: ${path} rejects GET before any DB access (${Object.keys(headers)[0] || 'none'})`, async () => {
        const response = await worker.fetch(new Request(ORIGIN + path, { method: 'GET', headers }), fakeEnv(), {});
        assert.equal(response.status, 403);
        assert.equal((await response.json()).code, 'mirror-read-authorization-required');
      });
    }
  }
  test(`${name}: OPTIONS preflight does not initialize DB`, async () => {
    const response = await worker.fetch(new Request(ORIGIN + '/v1/mirror/sheets', { method: 'OPTIONS' }), fakeEnv(), {});
    assert.equal(response.status, 204);
  });
  test(`${name}: import with no secret returns 401 before DB initialization`, async () => {
    const response = await worker.fetch(new Request(ORIGIN + '/v1/import/sheet', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({sheetName:'SYNTHETIC_ONLY', rows:[]}),
    }), fakeEnv(), {});
    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, 'Unauthorized import');
  });
  test(`${name}: import with incorrect secret returns 401 before DB initialization`, async () => {
    const response = await worker.fetch(new Request(ORIGIN + '/v1/import/sheet', {
      method: 'POST',
      headers: {'content-type':'application/json', 'x-migration-secret':'WRONG_SYNTHETIC'},
      body: JSON.stringify({sheetName:'SYNTHETIC_ONLY', rows:[]}),
    }), fakeEnv(), {});
    assert.equal(response.status, 401);
  });
  test(`${name}: unknown mirror path is 404 without D1`, async () => {
    const response = await worker.fetch(new Request(ORIGIN + '/v1/mirror/not-a-real-path'), fakeEnv(), {});
    assert.equal(response.status, 404);
  });
}

for (const path of LEGACY_PATHS) {
  test(`legacy local guard: ${path} rejects fake GET without D1`, async () => {
    const response = await legacy.fetch(
      new Request(ORIGIN + path, {method:'GET', headers:{Authorization:'Bearer FAKE'}}), fakeEnv(),
    );
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, 'legacy-read-authorization-required');
  });
}

test('authorized mirror import still reaches its original fake-DB handler', async () => {
  let statements = 0;
  const db = {
    prepare() {
      statements++;
      return {
        bind() { return this; },
        async run() { return {success:true}; },
        async first() { return {count:0}; },
        async all() { return {results:[]}; },
      };
    },
    async batch() { return []; },
  };
  const response = await mirror.fetch(new Request(ORIGIN + '/v1/import/sheet', {
    method:'POST',
    headers:{'content-type':'application/json', 'x-migration-secret':'FAKE_SECRET_FOR_UNIT_TEST_ONLY'},
    body:JSON.stringify({sheetName:'SYNTHETIC_ONLY',rows:[],sourceLastRow:0}),
  }), {DB:db,MIGRATION_SECRET:'FAKE_SECRET_FOR_UNIT_TEST_ONLY'});
  assert.equal(response.status,200);
  assert.equal((await response.json()).success,true);
  assert.ok(statements>0, 'authorized importer should still reach fake DB');
});

test('all synthetic request destinations are intentionally unroutable', () => {
  assert.equal(new URL(ORIGIN).hostname.endsWith('.invalid'),true);
});
