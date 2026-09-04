import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  handleStagingCloudWriteReconcileRequest,
  isStagingCloudWriteReconcilePath
} from '../cloudflare-d1/src/cloud-write-staging-reconcile.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'cloudflare-d1/src/cloud-write-staging-reconcile.mjs'), 'utf8');
const productionEntrypoint = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');
const stagingEntrypoint = fs.readFileSync(path.join(root, 'cloudflare-d1/staging/index.js'), 'utf8');

assert.match(source, /\/v1\/staging\/cloud-write\/reconcile/);
assert.match(source, /syntheticOnly:\s*true/);
assert.match(source, /CW-STAGE-/);
assert.match(source, /Staging Cloud Write Qualification/);
assert.match(source, /01001112233/);
assert.equal(/\.run\s*\(/.test(source), false, 'sample/reconciliation route module must not issue direct D1 writes');
assert.equal(/UrlFetchApp|APPS_SCRIPT_API_URL/.test(source), false, 'staging bridge must not call Apps Script');
assert.equal(productionEntrypoint.includes('/v1/staging/cloud-write/reconcile/sample'), false, 'production entrypoint must not expose staging sample route');
assert.equal(productionEntrypoint.includes('cloud-write-staging-reconcile'), false, 'production entrypoint must not import staging reconciliation module');
assert.match(stagingEntrypoint, /cloud-write-staging-reconcile\.mjs/);
assert.equal(isStagingCloudWriteReconcilePath('/v1/staging/cloud-write/reconcile/sample'), true);

function row(entityId, payload, overrides = {}) {
  return {
    outboxId: overrides.outboxId ?? 1,
    entityType: 'order',
    entityId,
    operation: 'upsert_order_to_sheets',
    outboxStatus: overrides.outboxStatus ?? 'staging_verified',
    attempts: overrides.attempts ?? 1,
    eventStatus: overrides.eventStatus ?? 'staging_verified',
    sheetsStatus: overrides.sheetsStatus ?? 'not_written_staging',
    payloadJson: JSON.stringify(payload),
    createdAt: '2026-09-04 19:00:00',
    updatedAt: '2026-09-04 19:01:00'
  };
}

function syntheticPayload(entityId) {
  return {
    clientRequestId: `staging-${entityId}`,
    orderId: entityId,
    customerPhone: '01001112233',
    customerName: 'Staging Cloud Write Qualification',
    status: 'cloud-draft',
    total: 123.45,
    remaining: 23.45,
    _cloudWriteV1: true,
    _cloudActor: 'ci-staging-admin',
    _cloudReceivedAt: '2026-09-04T19:00:00.000Z'
  };
}

function makeEnv(rows, enabled = true) {
  return {
    TRENDOS_STAGING_RECONCILE_VERIFY_ENABLED: enabled ? 'true' : 'false',
    EDGE_SESSION_SECRET: 'unused-for-public-synthetic-read',
    DB: {
      prepare(sql) {
        let binds = [];
        return {
          bind(...values) { binds = values; return this; },
          async all() {
            assert.match(sql, /entity_id LIKE 'CW-STAGE-%'/);
            assert.match(sql, /entity_type = 'order'/);
            assert.match(sql, /operation = 'upsert_order_to_sheets'/);
            let filtered = rows.slice();
            if (binds.length) filtered = filtered.filter((item) => item.entityId === binds[0]);
            return { success: true, results: filtered };
          }
        };
      }
    }
  };
}

const goodId = 'CW-STAGE-33900000000';
const wrongSyntheticId = 'CW-STAGE-33900000001';
const rows = [
  row(wrongSyntheticId, {
    orderId: wrongSyntheticId,
    customerPhone: '01099999999',
    customerName: 'Not Synthetic Customer',
    _cloudWriteV1: true
  }, { outboxId: 2 }),
  row(goodId, syntheticPayload(goodId), { outboxId: 1 })
];

const okResponse = await handleStagingCloudWriteReconcileRequest(
  new Request('https://staging.invalid/v1/staging/cloud-write/reconcile/sample'),
  makeEnv(rows)
);
assert.equal(okResponse.status, 200);
assert.equal(okResponse.headers.get('cache-control'), 'no-store');
const ok = await okResponse.json();
assert.equal(ok.success, true);
assert.equal(ok.stagingOnly, true);
assert.equal(ok.syntheticOnly, true);
assert.equal(ok.readOnly, true);
assert.equal(ok.sheetsWritten, false);
assert.equal(ok.entityId, goodId);
assert.equal(ok.entityType, 'order');
assert.equal(ok.operation, 'upsert_order_to_sheets');
assert.equal(ok.payload.orderId, goodId);
assert.equal(ok.payload.customerName, 'Staging Cloud Write Qualification');
assert.equal(ok.payload.customerPhone, '01001112233');
assert.equal(ok.payload._cloudWriteV1, true);
assert.equal('actor' in ok, false, 'sample response must not expose actor field');
assert.equal('lastError' in ok, false, 'sample response must not expose raw error data');

const specificResponse = await handleStagingCloudWriteReconcileRequest(
  new Request(`https://staging.invalid/v1/staging/cloud-write/reconcile/sample?entityId=${goodId}`),
  makeEnv(rows)
);
assert.equal(specificResponse.status, 200);
assert.equal((await specificResponse.json()).entityId, goodId);

const badIdResponse = await handleStagingCloudWriteReconcileRequest(
  new Request('https://staging.invalid/v1/staging/cloud-write/reconcile/sample?entityId=TM260900001'),
  makeEnv(rows)
);
assert.equal(badIdResponse.status, 400);
const badId = await badIdResponse.json();
assert.equal(badId.code, 'staging-id-required');
assert.equal(badId.sheetsWritten, false);

const missingResponse = await handleStagingCloudWriteReconcileRequest(
  new Request('https://staging.invalid/v1/staging/cloud-write/reconcile/sample'),
  makeEnv([rows[0]])
);
assert.equal(missingResponse.status, 404);
const missing = await missingResponse.json();
assert.equal(missing.code, 'staging-synthetic-sample-not-found');
assert.equal(missing.syntheticOnly, true);
assert.equal(missing.sheetsWritten, false);

const disabledResponse = await handleStagingCloudWriteReconcileRequest(
  new Request('https://staging.invalid/v1/staging/cloud-write/reconcile/sample'),
  makeEnv(rows, false)
);
assert.equal(disabledResponse.status, 423);
assert.equal((await disabledResponse.json()).sheetsWritten, false);

console.log('Cloudflare Staging Synthetic Sample Bridge V1: STAGING-ONLY + SYNTHETIC-ONLY + READ-ONLY + PRODUCTION-ABSENT PASS');
