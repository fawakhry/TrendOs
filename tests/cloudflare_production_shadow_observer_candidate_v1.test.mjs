import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PRODUCTION_SHADOW_PATH,
  handleProductionShadowObserver,
  isProductionShadowPath
} from '../cloudflare-d1/production-shadow/observer.mjs';

const observerSource = fs.readFileSync(new URL('../cloudflare-d1/production-shadow/observer.mjs', import.meta.url), 'utf8');
const candidateEntry = fs.readFileSync(new URL('../cloudflare-d1/production-shadow/index.js', import.meta.url), 'utf8');
const candidateConfig = fs.readFileSync(new URL('../cloudflare-d1/production-shadow/wrangler.candidate.toml', import.meta.url), 'utf8');
const productionEntry = fs.readFileSync(new URL('../cloudflare-d1/src/index_v2.js', import.meta.url), 'utf8');
const productionConfig = fs.readFileSync(new URL('../cloudflare-d1/wrangler.toml', import.meta.url), 'utf8');
const productionCloudWriteGate = fs.readFileSync(new URL('../cloudflare-d1/src/cloud-write-gate.mjs', import.meta.url), 'utf8');

for (const forbidden of [
  /\.prepare\s*\(/,
  /\.batch\s*\(/,
  /UrlFetchApp/,
  /SpreadsheetApp/,
  /PropertiesService/,
  /createManualOrder_/,
  /script\.google\.com/,
  /trendos-main/,
  /database_id/,
  /migrations_dir/
]) {
  assert.equal(forbidden.test(observerSource), false, `forbidden production observer capability: ${forbidden}`);
}

assert.equal(isProductionShadowPath(PRODUCTION_SHADOW_PATH), true);
assert.equal(isProductionShadowPath(`${PRODUCTION_SHADOW_PATH}/`), true);
assert.match(candidateEntry, /\.\/observer\.mjs/);
assert.match(candidateEntry, /\.\.\/src\/index_v2\.js/);
assert.doesNotMatch(productionEntry, /production-shadow\/observer/);
assert.doesNotMatch(productionEntry, /cloud-write-order-v2-production-shadow/);

assert.match(candidateConfig, /name\s*=\s*"trendos-d1-api-shadow-candidate-no-deploy"/);
assert.match(candidateConfig, /TRENDOS_CLOUD_WRITE_V1_ENABLED\s*=\s*"false"/);
assert.match(candidateConfig, /TRENDOS_PRODUCTION_SHADOW_V2_ENABLED\s*=\s*"false"/);
assert.doesNotMatch(candidateConfig, /\[\[d1_databases\]\]/);
assert.doesNotMatch(candidateConfig, /APPS_SCRIPT_API_URL/);
assert.doesNotMatch(candidateConfig, /migrations_dir/);

assert.match(productionConfig, /name\s*=\s*"trendos-d1-api"/);
const cloudWriteOff = /TRENDOS_CLOUD_WRITE_V1_ENABLED\s*=\s*"false"/.test(productionConfig);
const cloudWriteOn = /TRENDOS_CLOUD_WRITE_V1_ENABLED\s*=\s*"true"/.test(productionConfig);
assert.equal(cloudWriteOff || cloudWriteOn, true, 'Production Cloud Write flag must be explicit');
assert.equal(cloudWriteOff && cloudWriteOn, false, 'Production Cloud Write flag is ambiguous');

// When Cloud Write is enabled it must remain behind the authenticated fail-closed gate.
if (cloudWriteOn) {
  assert.match(productionCloudWriteGate, /verifyEdgeSessionToken/);
  assert.match(productionCloudWriteGate, /requireEnabledWriteSession/);
  assert.match(productionCloudWriteGate, /const authFailure = await requireEnabledWriteSession/);
  assert.match(productionCloudWriteGate, /if \(authFailure\) return authFailure/);
  assert.match(productionCloudWriteGate, /return handleLegacyCloudWriteRequest/);
}

// Production may use the original core entrypoint or the bounded Shadow wrapper.
const prodUsesCore = /main\s*=\s*"src\/index_v2\.js"/.test(productionConfig);
const prodUsesShadowWrapper = /main\s*=\s*"production-shadow\/index\.js"/.test(productionConfig);
assert.equal(prodUsesCore || prodUsesShadowWrapper, true, 'unexpected Production entrypoint');
assert.equal(prodUsesCore && prodUsesShadowWrapper, false, 'ambiguous Production entrypoint');
if (prodUsesCore) {
  assert.doesNotMatch(productionConfig, /TRENDOS_PRODUCTION_SHADOW_V2_ENABLED/);
} else {
  const shadowOff = /TRENDOS_PRODUCTION_SHADOW_V2_ENABLED\s*=\s*"false"/.test(productionConfig);
  const shadowReadOnlyOn = /TRENDOS_PRODUCTION_SHADOW_V2_ENABLED\s*=\s*"true"/.test(productionConfig);
  assert.equal(shadowOff || shadowReadOnlyOn, true, 'Production shadow wrapper flag must be explicit');
  assert.equal(shadowOff && shadowReadOnlyOn, false, 'Production shadow wrapper flag is ambiguous');
}

// Observer default remains OFF independent of the Production Cloud Write flag.
{
  const response = handleProductionShadowObserver(new Request(`https://candidate.test${PRODUCTION_SHADOW_PATH}`), {});
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.code, 'production-shadow-disabled');
  assert.equal(body.d1Read, false);
  assert.equal(body.d1Written, false);
  assert.equal(body.appsScriptCalled, false);
  assert.equal(body.sheetsWritten, false);
  assert.equal(body.mutationCount, 0);
  assert.equal(body.productionWriteEnabled, false);
  assert.equal(body.productionCutover, false);
}

const env = { TRENDOS_PRODUCTION_SHADOW_V2_ENABLED: 'true' };
const first = await handleProductionShadowObserver(
  new Request(`https://candidate.test${PRODUCTION_SHADOW_PATH}`),
  env
).json();
assert.equal(first.success, true);
assert.equal(first.valid, true);
assert.equal(first.observerOnly, true);
assert.equal(first.fixedSyntheticIntent, true);
assert.equal(first.liveProductionDataRead, false);
assert.equal(first.d1Read, false);
assert.equal(first.d1Written, false);
assert.equal(first.appsScriptCalled, false);
assert.equal(first.sheetsWritten, false);
assert.equal(first.authoritativeWrites, false);
assert.equal(first.canonicalWriterInvoked, false);
assert.equal(first.productionWriteEnabled, false);
assert.equal(first.productionCutover, false);
assert.equal(first.productionRouteIntegrated, false);
assert.equal(first.orderIdPresent, false);
assert.match(first.shadowFingerprint, /^[a-f0-9]{64}$/);

const second = await handleProductionShadowObserver(
  new Request(`https://candidate.test${PRODUCTION_SHADOW_PATH}`),
  env
).json();
assert.equal(second.shadowFingerprint, first.shadowFingerprint);
assert.deepEqual(second.canonicalCreateParams, first.canonicalCreateParams);

const blockedResponse = handleProductionShadowObserver(
  new Request(`https://candidate.test${PRODUCTION_SHADOW_PATH}`, { method: 'POST' }),
  env
);
assert.equal(blockedResponse.status, 405);
const blocked = await blockedResponse.json();
assert.equal(blocked.code, 'method-not-allowed');
assert.equal(blocked.d1Written, false);
assert.equal(blocked.sheetsWritten, false);
assert.equal(blocked.mutationCount, 0);
assert.equal(blocked.productionCutover, false);

console.log('CLOUDFLARE_PRODUCTION_SHADOW_OBSERVER_CANDIDATE_V1_PASS');
