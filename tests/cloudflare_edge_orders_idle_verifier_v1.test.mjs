import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ORDERS_IDLE_HEARTBEAT_ACTION,
  fetchOrdersIdleHeartbeat,
  ordersIdleHeartbeatUrl,
  ordersIdleHeartbeatVerifierEnabled
} from '../cloudflare-d1/src/edge-orders-idle-verifier.mjs';

const baseEnv = {
  APPS_SCRIPT_API_URL: 'https://script.google.com/macros/s/example-deployment/exec'
};

assert.equal(ORDERS_IDLE_HEARTBEAT_ACTION, 'getD1OrdersLowUsageHeartbeatV1');
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
assert.doesNotMatch(previewConfig, /^EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED\s*=/m);
assert.match(previewConfig, /TRENDOS_CLOUD_WRITE_V1_ENABLED\s*=\s*"false"/);

console.log('Cloudflare Edge Orders Idle Verifier V1: HTTPS GET + EXPLICIT FLAG + PREVIEW DEFAULT-OFF + CLOUD-WRITE-OFF PASS');
