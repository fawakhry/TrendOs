import assert from 'node:assert/strict';
import fs from 'node:fs';

const client=fs.readFileSync('trendos-edge-orders-read-v1.js','utf8');
const config=fs.readFileSync('config.js','utf8');

assert.match(client,/EDGE_ORDERS_T12_CUSTOMER_D1_A51_STALE_BACKOFF_A52_20260929/);
assert.match(client,/DEFAULT_STALE_FALLBACK_COOLDOWN_MS = 2 \* 60 \* 1000/);
assert.match(client,/MAX_STALE_FALLBACK_COOLDOWN_MS = 5 \* 60 \* 1000/);
assert.match(client,/function isKnownMirrorStaleError\(err\)/);
assert.match(client,/code === 'edge_mirror_stale' \|\| code === '02cr-mirror-stale'/);
assert.match(client,/function staleFallbackActive\(\)/);
assert.match(client,/if \(staleFallbackActive\(\)\) \{/);
assert.match(client,/metrics\.staleCooldownBypasses \+= 1/);
assert.match(client,/lastFallbackReason = 'EDGE_MIRROR_STALE_COOLDOWN'/);
assert.match(client,/return hybridAppsScriptFallback\(this, original, action, params \|\| \{\}, args\)/);
assert.match(client,/if \(isKnownMirrorStaleError\(err\)\) \{[\s\S]*?openStaleFallbackCooldown\(\)/);
assert.match(client,/if \(text\(params && params\.statusFilter\) === '__DEBT__'\) return false/);
assert.match(client,/if \(action === 'searchCustomers'\)/);
assert.match(client,/CUSTOMER_SEARCH_PATH = '\/v1\/edge\/customers\/search'/);
assert.match(client,/if \(action === 'createManualOrder'\)/);
assert.match(client,/T12_GENERAL_CREATE_PATH = '\/v1\/t12\/orders\/create'/);
assert.match(client,/staleFallbackUntil: staleFallbackUntil \|\| 0/);
assert.match(config,/trendos-edge-orders-read-v1\.js\?v=20260929-t12-a52-stale-backoff/);

// The cooldown must short-circuit before the normal D1 page attempt.
const bypassPos=client.indexOf('if (staleFallbackActive())');
const edgeTryPos=client.indexOf('var result = await edgePage(params || {})', bypassPos);
assert.ok(bypassPos >= 0 && edgeTryPos > bypassPos);

// It must not weaken the backend freshness guard or treat arbitrary failures as stale.
assert.doesNotMatch(client,/staleFallbackUntil\s*=\s*Date\.now\(\).*catch \(err\)[\s\S]*?without/i);

console.log('T12 A52 stale 02CR fallback cooldown contract: PASS');
