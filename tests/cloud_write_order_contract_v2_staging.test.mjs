import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLOUD_WRITE_ORDER_V2_STAGING_PATH,
  handleCloudWriteOrderV2StagingRequest,
  isCloudWriteOrderV2StagingPath
} from '../cloudflare-d1/src/cloud-write-order-contract-v2-staging.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'cloudflare-d1/src/cloud-write-order-contract-v2-staging.mjs'), 'utf8');
const stagingIndex = fs.readFileSync(path.join(root, 'cloudflare-d1/staging/index.js'), 'utf8');
const productionIndex = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');
const productionWrite = fs.readFileSync(path.join(root, 'cloudflare-d1/src/cloud-write.mjs'), 'utf8');

assert.equal(CLOUD_WRITE_ORDER_V2_STAGING_PATH, '/v1/staging/cloud-write/v2/intent-plan');
assert.equal(isCloudWriteOrderV2StagingPath(CLOUD_WRITE_ORDER_V2_STAGING_PATH), true);
assert.equal(isCloudWriteOrderV2StagingPath(`${CLOUD_WRITE_ORDER_V2_STAGING_PATH}/`), true);
assert.equal(isCloudWriteOrderV2StagingPath('/v1/cloud/orders'), false);

// Staging plan route must never touch DB, Sheets, Apps Script, network fetch, or secrets.
for (const forbidden of [
  /\benv\.DB\b/,
  /\.prepare\s*\(/,
  /\.batch\s*\(/,
  /\bSpreadsheetApp\b/,
  /\bPropertiesService\b/,
  /\bUrlFetchApp\b/,
  /\bfetch\s*\(/,
  /\bAuthorization\b/,
  /EDGE_SESSION_SECRET/,
  /TRENDOS_CLOUD_WRITE_V1_ENABLED/
]) {
  assert.equal(forbidden.test(source), false, `forbidden staging-plan dependency: ${forbidden}`);
}

// Production must not import either the staging route or pure V2 contract.
assert.equal(productionIndex.includes('cloud-write-order-contract-v2-staging'), false);
assert.equal(productionIndex.includes('cloud-write-order-contract-v2.mjs'), false);
assert.equal(productionWrite.includes('cloud-write-order-contract-v2-staging'), false);
assert.equal(productionWrite.includes('cloud-write-order-contract-v2.mjs'), false);

// Staging entrypoint wiring is added in the next isolated integration step; this
// test permits either state while still forbidding Production wiring.
const stagingWired = stagingIndex.includes('cloud-write-order-contract-v2-staging');
assert.equal(typeof stagingWired, 'boolean');

const response = await handleCloudWriteOrderV2StagingRequest(
  new Request(`https://staging.example${CLOUD_WRITE_ORDER_V2_STAGING_PATH}`)
);
assert.equal(response.status, 200);
const body = await response.json();
assert.equal(body.success, true);
assert.equal(body.stagingOnly, true);
assert.equal(body.syntheticOnly, true);
assert.equal(body.readOnly, true);
assert.equal(body.d1Written, false);
assert.equal(body.sheetsWritten, false);
assert.equal(body.mutationCount, 0);
assert.equal(body.productionCutover, false);
assert.equal(body.productionRouteIntegrated, false);
assert.equal(body.intentType, 'createManualOrder');
assert.equal(body.businessOrderIdStrategy, 'apps-script-allocated');
assert.ok(body.canonicalCreateParams);
assert.equal(Object.prototype.hasOwnProperty.call(body.canonicalCreateParams, 'orderId'), false);
assert.equal(body.canonicalCreateParams.customerMode, 'خارجي / عابر');
assert.equal(body.canonicalCreateParams.externalCustomerId, '987');
assert.equal(body.canonicalCreateParams.department, 'طباعة');
assert.equal(body.canonicalCreateParams.heatPress, 'نعم');
assert.equal(body.canonicalCreateParams.itemName, 'V2 Intent Qualification Item');
assert.equal(body.canonicalCreateParams.qty, 1);
assert.equal(body.canonicalCreateParams.status, 'طلب جديد');
assert.equal(body.canonicalCreateParams.flyPrint, 'لا');
assert.ok(Array.isArray(body.requiredCanonicalSideEffects));
assert.ok(body.requiredCanonicalSideEffects.includes('apps-script-business-order-id-allocation'));
assert.ok(body.requiredCanonicalSideEffects.includes('order-lines-create'));

const post = await handleCloudWriteOrderV2StagingRequest(
  new Request(`https://staging.example${CLOUD_WRITE_ORDER_V2_STAGING_PATH}`, { method: 'POST' })
);
assert.equal(post.status, 404);
const postBody = await post.json();
assert.equal(postBody.d1Written, false);
assert.equal(postBody.sheetsWritten, false);
assert.equal(postBody.mutationCount, 0);

console.log('Cloud Write Order Contract V2 Staging Plan: FIXED SYNTHETIC GET + READ-ONLY + NO-DB + NO-PRODUCTION-WIRING PASS');
