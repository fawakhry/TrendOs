import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PRODUCTION_SHADOW_PREVIEW_PATH,
  handleProductionShadowPreviewRequest,
  isProductionShadowPreviewPath
} from '../cloudflare-d1/preview/production-shadow-preview.mjs';

const previewModuleSource = fs.readFileSync(
  new URL('../cloudflare-d1/preview/production-shadow-preview.mjs', import.meta.url),
  'utf8'
);
const previewEntrySource = fs.readFileSync(
  new URL('../cloudflare-d1/preview/index.js', import.meta.url),
  'utf8'
);
const productionEntrySource = fs.readFileSync(
  new URL('../cloudflare-d1/src/index_v2.js', import.meta.url),
  'utf8'
);

for (const forbidden of [
  /\.prepare\s*\(/,
  /\.batch\s*\(/,
  /UrlFetchApp/,
  /SpreadsheetApp/,
  /PropertiesService/,
  /createManualOrder_/,
  /script\.google\.com/,
  /trendos-d1-api\.trendmall-contact\.workers\.dev/
]) {
  assert.equal(forbidden.test(previewModuleSource), false, `forbidden preview observer capability: ${forbidden}`);
}

assert.equal(isProductionShadowPreviewPath(PRODUCTION_SHADOW_PREVIEW_PATH), true);
assert.equal(isProductionShadowPreviewPath(`${PRODUCTION_SHADOW_PREVIEW_PATH}/`), true);
assert.equal(isProductionShadowPreviewPath('/v1/cloud/write/v2/production-shadow'), false);
assert.match(previewEntrySource, /production-shadow-preview\.mjs/);
assert.match(previewEntrySource, /\.\.\/src\/index_v2\.js/);
assert.doesNotMatch(productionEntrySource, /production-shadow-preview/);
assert.doesNotMatch(productionEntrySource, /cloud-write-order-v2-production-shadow/);

// Default-off if the Preview flag is absent.
{
  const response = handleProductionShadowPreviewRequest(
    new Request(`https://preview.test${PRODUCTION_SHADOW_PREVIEW_PATH}`),
    {}
  );
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.code, 'preview-shadow-disabled');
  assert.equal(body.d1Written, false);
  assert.equal(body.sheetsWritten, false);
}

// Enabled GET returns one fixed synthetic, deterministic, no-write plan.
const env = { TRENDOS_PRODUCTION_SHADOW_PREVIEW_ENABLED: 'true' };
const firstResponse = handleProductionShadowPreviewRequest(
  new Request(`https://preview.test${PRODUCTION_SHADOW_PREVIEW_PATH}`),
  env
);
assert.equal(firstResponse.status, 200);
const first = await firstResponse.json();
assert.equal(first.success, true);
assert.equal(first.valid, true);
assert.equal(first.previewOnly, true);
assert.equal(first.fixedSyntheticIntent, true);
assert.equal(first.liveProductionDataRead, false);
assert.equal(first.d1Read, false);
assert.equal(first.appsScriptCalled, false);
assert.equal(first.authoritativeWrites, false);
assert.equal(first.readOnly, true);
assert.equal(first.mutationFree, true);
assert.equal(first.canonicalWriterInvoked, false);
assert.equal(first.d1Written, false);
assert.equal(first.sheetsWritten, false);
assert.equal(first.mutationCount, 0);
assert.equal(first.productionWriteEnabled, false);
assert.equal(first.productionCutover, false);
assert.equal(first.productionRouteIntegrated, false);
assert.equal(first.orderIdPresent, false);
assert.equal(first.canonicalCreateParams.clientRequestId, 'PROD-SHADOW-PREVIEW-001');
assert.equal(Object.hasOwn(first.canonicalCreateParams, 'orderId'), false);
assert.match(first.shadowFingerprint, /^[a-f0-9]{64}$/);

const secondResponse = handleProductionShadowPreviewRequest(
  new Request(`https://preview.test${PRODUCTION_SHADOW_PREVIEW_PATH}`),
  env
);
const second = await secondResponse.json();
assert.equal(second.shadowFingerprint, first.shadowFingerprint);
assert.deepEqual(second.canonicalCreateParams, first.canonicalCreateParams);

// Any mutation method is rejected without invoking anything authoritative.
{
  const response = handleProductionShadowPreviewRequest(
    new Request(`https://preview.test${PRODUCTION_SHADOW_PREVIEW_PATH}`, { method: 'POST' }),
    env
  );
  assert.equal(response.status, 405);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.code, 'method-not-allowed');
  assert.equal(body.d1Written, false);
  assert.equal(body.sheetsWritten, false);
  assert.equal(body.mutationCount, 0);
  assert.equal(body.productionCutover, false);
}

console.log('CLOUDFLARE_PRODUCTION_SHADOW_PREVIEW_V1_PASS');
