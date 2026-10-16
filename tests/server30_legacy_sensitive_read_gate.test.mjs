/** SEC-AP303-02 read-boundary review tests. Synthetic requests ONLY, no network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import legacy from '../cloudflare-d1/src/index.js';
import routed from '../cloudflare-d1/src/index_v2.js';

const ORIGIN = 'https://sec-ap303-02-tests.invalid';
const BLOCKED = [
  '/v1/orders', '/v1/orders/FAKE-ORDER-1',
  '/v1/customer', '/v1/messages', '/v1/inbox',
];
function fakeEnv(counter) {
  return { DB: { prepare() { counter.count += 1; throw new Error('D1 read must not occur'); } } };
}
for (const [name, worker] of [['standalone-legacy', legacy], ['v2-fallback', routed]]) {
  for (const path of BLOCKED) {
    test(name + ': sensitive legacy read denies without D1 (' + path + ')', async () => {
      const counter = {count:0};
      const response = await worker.fetch(
        new Request(ORIGIN + path, {method:'GET'}), fakeEnv(counter), {},
      );
      assert.equal(response.status, 403);
      assert.equal((await response.json()).code, 'legacy-read-authorization-required');
      assert.equal(counter.count, 0);
    });
  }
  test(name + ': untrusted bearer text is not a bypass', async () => {
    const counter = {count:0};
    const response = await worker.fetch(
      new Request(ORIGIN + '/v1/inbox', {
        method:'GET',
        headers:{Authorization:'Bearer FAKE_INVALID_DO_NOT_TRUST'},
      }), fakeEnv(counter), {},
    );
    assert.equal(response.status, 403);
    assert.equal(counter.count, 0);
  });
  test(name + ': missing resources remain 404 (non-sensitive route)', async () => {
    const counter = {count:0};
    const response = await worker.fetch(
      new Request(ORIGIN + '/v1/this-route-does-not-exist', {method:'GET'}),
      fakeEnv(counter), {},
    );
    assert.equal(response.status, 404);
    assert.equal(counter.count, 0);
  });
}
test('all test URLs use .invalid and do not exercise the live Worker', () => {
  assert.equal(new URL(ORIGIN).hostname.endsWith('.invalid'), true);
});
