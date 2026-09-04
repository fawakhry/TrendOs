import assert from 'node:assert/strict';
import fs from 'node:fs';

const productionConfig = fs.readFileSync(new URL('../cloudflare-d1/wrangler.toml', import.meta.url), 'utf8');
const candidateConfig = fs.readFileSync(new URL('../cloudflare-d1/production-shadow/wrangler.production-integration-candidate.toml', import.meta.url), 'utf8');
const productionEntry = fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js', import.meta.url), 'utf8');
const candidateEntry = fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js', import.meta.url), 'utf8');

function capture(text, re, label) {
  const match = text.match(re);
  assert.ok(match, `missing ${label}`);
  return match[1];
}

assert.match(candidateConfig, /^name = "trendos-d1-api-production-shadow-integration-no-deploy"$/m);
assert.match(candidateConfig, /^main = "\.\/index\.js"$/m);
assert.match(candidateConfig, /^workers_dev = false$/m);
assert.match(candidateConfig, /^TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"$/m);
assert.match(candidateConfig, /^TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "false"$/m);
assert.match(candidateConfig, /^database_name = "trendos-main"$/m);
assert.match(candidateConfig, /^database_id = "5c4b92bf-e043-4f6e-bd6d-d514a92cd825"$/m);
assert.match(candidateConfig, /^migrations_dir = "\.\.\/migrations"$/m);

// Working-branch Production may transition from the original core entrypoint
// to the shadow wrapper only while the shadow feature remains explicitly OFF.
assert.match(productionConfig, /^name = "trendos-d1-api"$/m);
assert.match(productionConfig, /^TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"$/m);
assert.doesNotMatch(productionEntry, /production-shadow\/observer/);
assert.doesNotMatch(productionEntry, /cloud-write-order-v2-production-shadow/);

const prodUsesCore = /^main = "src\/index_v2\.js"$/m.test(productionConfig);
const prodUsesShadowWrapper = /^main = "production-shadow\/index\.js"$/m.test(productionConfig);
assert.equal(prodUsesCore || prodUsesShadowWrapper, true, 'unexpected Production entrypoint');
assert.equal(prodUsesCore && prodUsesShadowWrapper, false, 'ambiguous Production entrypoint');
if (prodUsesCore) {
  assert.doesNotMatch(productionConfig, /TRENDOS_PRODUCTION_SHADOW_V2_ENABLED/);
} else {
  assert.match(productionConfig, /^TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "false"$/m);
  assert.doesNotMatch(productionConfig, /^TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"$/m);
}

// Candidate mirrors the Production runtime values needed for compile compatibility.
for (const [label, re] of [
  ['compatibility_date', /^compatibility_date = "([^"]+)"$/m],
  ['CORS_ORIGINS', /^CORS_ORIGINS = "([^"]+)"$/m],
  ['APPS_SCRIPT_API_URL', /^APPS_SCRIPT_API_URL = "([^"]+)"$/m],
  ['EDGE_SESSION_TTL_SECONDS', /^EDGE_SESSION_TTL_SECONDS = "([^"]+)"$/m],
  ['EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS', /^EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS = "([^"]+)"$/m],
  ['EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED', /^EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "([^"]+)"$/m],
  ['database_name', /^database_name = "([^"]+)"$/m],
  ['database_id', /^database_id = "([^"]+)"$/m]
]) {
  assert.equal(capture(candidateConfig, re, `candidate ${label}`), capture(productionConfig, re, `production ${label}`), `${label} drift`);
}

assert.match(candidateEntry, /\.\.\/src\/index_v2\.js/);
assert.match(candidateEntry, /\.\/observer\.mjs/);

console.log('CLOUDFLARE_PRODUCTION_SHADOW_INTEGRATION_CANDIDATE_V1_PASS');
