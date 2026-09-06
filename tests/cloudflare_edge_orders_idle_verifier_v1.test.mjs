import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ORDERS_IDLE_HEARTBEAT_ACTION,
  ORDERS_IDLE_HEARTBEAT_CACHE_TTL_MS,
  fetchOrdersIdleHeartbeat,
  ordersIdleHeartbeatUrl,
  ordersIdleHeartbeatVerifierEnabled,
  resetOrdersIdleHeartbeatCacheForTests
} from '../cloudflare-d1/src/edge-orders-idle-verifier.mjs';

const baseEnv = {
  APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/example-deployment/exec'
};

assert.equal(ORDERS_IDLE_HEARTBEAT_ACTION, 'getD1OrdersLowUsageHeartbeatV1');
assert.equal(ORDERS_IDLE_HEARTBEAT_CACHE_TTL_MS, 30000);
assert.equal(ordersIdleHeartbeatVerifierEnabled(baseEnv), false);
assert.equal(ordersIdleHeartbeatVerifierEnabled({ ...baseEnv, EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED: 'true' }), true);
assert.equal(ordersIdleHeartbeatVerifierEnabled({ ...baseEnv, EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED: '1' }), true);
assert.equal(ordersIdleHeartbeatVerifierEnabled({ ...baseEnv, EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED: 'off' }), false);

const heartbeatUrl = ordersIdleHeartbeatUrl(baseEnv);
assert.ok(heartbeatUrl.startsWith('https://script.google.com/'));
assert.equal(new URL(heartbeatUrl).searchParams.get('action'), ORDERS_IDLE_HEARTBEAT_ACTION);
assert.equal(ordersIdleHeartbeatUrl({ APPS_SCRIPT_API_URL: 'http://insecure.local/exec' }), '');

{
  const env = { ...baseEnv, EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED: 'true' };
  let seenUrl = '';
  let seenMethod = '';
  const payload = { success: true, lowUsage: true };
  const result = await fetchOrdersIdleHeartbeat(env, {
    timeoutMs: 1000,
    async fetchImpl(url, init) {
      seenUrl = String(url);
      seenMethod = String(init && init.method);
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });
  assert.deepEqual(result, payload);
  assert.equal(new URL(seenUrl).searchParams.get('action'), ORDERS_IDLE_HEARTBEAT_ACTION);
  assert.equal(seenMethod, 'GET');
}

// Production calls are coalesced/cached. Custom fetch is used here with explicit
// cache opt-in so the behavior can be tested without external traffic.
{
  resetOrdersIdleHeartbeatCacheForTests();
  const env = { ...baseEnv, EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED: 'true' };
  let fetchCalls = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const payload = { success: true, lowUsage: true, marker: 'coalesced' };
  const fetchImpl = async () => {
    fetchCalls += 1;
    await gate;
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const first = fetchOrdersIdleHeartbeat(env, { fetchImpl, cache: true, cacheTtlMs: 5000 });
  const second = fetchOrdersIdleHeartbeat(env, { fetchImpl, cache: true, cacheTtlMs: 5000 });
  assert.equal(fetchCalls, 1, 'concurrent heartbeat reads must coalesce');
  release();
  assert.deepEqual(await first, payload);
  assert.deepEqual(await second, payload);
  const third = await fetchOrdersIdleHeartbeat(env, { fetchImpl, cache: true, cacheTtlMs: 5000 });
  assert.deepEqual(third, payload);
  assert.equal(fetchCalls, 1, 'successful heartbeat must be reused inside the short cache TTL');
  resetOrdersIdleHeartbeatCacheForTests();
}

// Failed heartbeat fetches are never cached.
{
  resetOrdersIdleHeartbeatCacheForTests();
  const env = { ...baseEnv, EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED: 'true' };
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    return new Response('{}', { status: 503 });
  };
  await assert.rejects(() => fetchOrdersIdleHeartbeat(env, { fetchImpl, cache: true }), /HTTP 503/);
  await assert.rejects(() => fetchOrdersIdleHeartbeat(env, { fetchImpl, cache: true }), /HTTP 503/);
  assert.equal(attempts, 2, 'failed heartbeat responses must not poison the cache');
  resetOrdersIdleHeartbeatCacheForTests();
}

await assert.rejects(
  () => fetchOrdersIdleHeartbeat(baseEnv, { fetchImpl: async () => new Response('{}', { status: 200 }) }),
  /disabled/i
);

await assert.rejects(
  () => fetchOrdersIdleHeartbeat({ ...baseEnv, EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED: 'true' }, {
    async fetchImpl() { return new Response('{}', { status: 503 }); }
  }),
  /HTTP 503/
);

const indexCode = fs.readFileSync('cloudflare-d1/src/index_v2.js', 'utf8');
const previewConfig = fs.readFileSync('cloudflare-d1/preview/wrangler.toml', 'utf8');
assert.match(indexCode, /ordersIdleHeartbeatVerifierEnabled\(env\)/);
assert.match(indexCode, /verifyIdleSourceFreshness/);
assert.match(indexCode, /fetchOrdersIdleHeartbeat\(env\)/);
assert.match(indexCode, /edge-orders-read-02cr-freshness\.mjs/);
assert.match(previewConfig, /^EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED\s*=\s*"true"$/m);
assert.match(previewConfig, /TRENDOS_CLOUD_WRITE_V1_ENABLED\s*=\s*"false"/);

console.log('Cloudflare Edge Orders Idle Verifier V1: HTTPS GET + SHORT CACHE/COALESCING + EXPLICIT PREVIEW-TRUE FLAG + CLOUD-WRITE-OFF PASS');
