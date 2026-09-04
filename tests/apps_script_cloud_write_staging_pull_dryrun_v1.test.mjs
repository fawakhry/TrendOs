import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'apps-script/patches/CLOUD_WRITE_STAGING_PULL_DRYRUN_V1.gs');
const source = fs.readFileSync(sourcePath, 'utf8');

const fixedUrl = 'https://trendos-d1-staging.trendmall-contact.workers.dev/v1/staging/cloud-write/reconcile/sample';
assert.equal((source.match(/UrlFetchApp\.fetch\s*\(/g) || []).length, 1, 'exactly one network call is allowed');
assert.ok(source.includes(fixedUrl), 'bridge must use the dedicated staging Worker URL');
assert.match(source, /method:\s*["']get["']/i);
assert.equal(/\.setValue\s*\(|\.setValues\s*\(|\.appendRow\s*\(|\.clearContent\s*\(|\.deleteRow\s*\(|\.insertRow/.test(source), false, 'bridge must not mutate Sheets');
assert.equal(/\.setProperty\s*\(|\.deleteProperty\s*\(/.test(source), false, 'bridge must not mutate Script Properties');
assert.equal(/DriveApp\./.test(source), false, 'bridge must not touch Drive');
assert.equal(/trendos-d1-api\.trendmall-contact/.test(source), false, 'bridge must never call production D1 Worker');
assert.match(source, /CW-STAGE-/);
assert.match(source, /Staging Cloud Write Qualification/);
assert.match(source, /01001112233/);

const SECRET = 'internal-secret-not-for-output';
const entityId = 'CW-STAGE-33999999999';
let fetchCount = 0;
let handlerCount = 0;
let observedSecret = '';
let logged = '';

const sampleBody = {
  success: true,
  service: 'trendos-cloud-write-staging-sample-v1',
  stagingOnly: true,
  syntheticOnly: true,
  readOnly: true,
  sheetsWritten: false,
  entityType: 'order',
  entityId,
  operation: 'upsert_order_to_sheets',
  payload: {
    clientRequestId: 'staging-test',
    orderId: entityId,
    customerPhone: '01001112233',
    customerName: 'Staging Cloud Write Qualification',
    status: 'cloud-draft',
    total: 123.45,
    remaining: 23.45,
    _cloudWriteV1: true,
    _cloudActor: 'ci-staging-admin',
    _cloudReceivedAt: '2026-09-04T19:00:00.000Z'
  },
  outboxStatus: 'staging_verified',
  eventStatus: 'staging_verified',
  sheetsStatus: 'not_written_staging'
};

const context = vm.createContext({
  JSON,
  String,
  Number,
  Array,
  Object,
  Error,
  console,
  Logger: {
    log(value) { logged += String(value); }
  },
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) {
          assert.equal(key, 'TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET');
          return SECRET;
        }
      };
    }
  },
  UrlFetchApp: {
    fetch(url, options) {
      fetchCount += 1;
      assert.equal(url, fixedUrl);
      assert.equal(String(options.method).toLowerCase(), 'get');
      assert.equal(options.muteHttpExceptions, true);
      return {
        getResponseCode() { return 200; },
        getContentText() { return JSON.stringify(sampleBody); }
      };
    }
  },
  trendosCloudWriteReconcileDryRunV1_(event) {
    handlerCount += 1;
    const p = event.parameter;
    observedSecret = p.reconcileSecret;
    assert.equal(p.dryRun, true);
    assert.equal(p.entityType, 'order');
    assert.equal(p.operation, 'upsert_order_to_sheets');
    assert.equal(p.entityId, entityId);
    assert.equal(p.payload.orderId, entityId);
    return {
      success: true,
      dryRun: true,
      readOnly: true,
      sheetsWritten: false,
      mutationCount: 0,
      requiredColumnsPresent: true,
      existingMatches: 0,
      decision: 'would_insert',
      eligibleForFutureWrite: true,
      plan: Array.from({ length: 8 }, (_, i) => ({ field: `f${i}` })),
      schemaFingerprint: 'abc',
      payloadSha256: 'def'
    };
  }
});

vm.runInContext(source, context, { filename: 'CLOUD_WRITE_STAGING_PULL_DRYRUN_V1.gs' });
assert.equal(typeof context.runTrendOSCloudWriteStagingPullDryRun, 'function');
const result = context.runTrendOSCloudWriteStagingPullDryRun();
assert.equal(fetchCount, 1);
assert.equal(handlerCount, 1);
assert.equal(observedSecret, SECRET, 'secret must flow only internally into the local handler');
assert.equal(result.success, true);
assert.equal(result.stagingOnly, true);
assert.equal(result.syntheticOnly, true);
assert.equal(result.entityId, entityId);
assert.equal(result.sheetsWritten, false);
assert.equal(result.mutationCount, 0);
assert.equal(result.requiredColumnsPresent, true);
assert.equal(result.decision, 'would_insert');
assert.equal(result.planCount, 8);
assert.equal(JSON.stringify(result).includes(SECRET), false, 'returned safe result must not leak secret');
assert.equal(logged.includes(SECRET), false, 'logs must not leak secret');
assert.match(logged, /STAGING_PULL_DRYRUN_PASS=/);

const unsafeSourceContext = vm.createContext({
  JSON, String, Number, Array, Object, Error, console,
  Logger: { log() {} },
  PropertiesService: context.PropertiesService,
  trendosCloudWriteReconcileDryRunV1_: context.trendosCloudWriteReconcileDryRunV1_,
  UrlFetchApp: {
    fetch() {
      const bad = JSON.parse(JSON.stringify(sampleBody));
      bad.payload.customerName = 'Real Customer';
      return {
        getResponseCode() { return 200; },
        getContentText() { return JSON.stringify(bad); }
      };
    }
  }
});
vm.runInContext(source, unsafeSourceContext);
assert.throws(
  () => unsafeSourceContext.runTrendOSCloudWriteStagingPullDryRun(),
  /STAGING_PULL_DRYRUN_NON_SYNTHETIC_PAYLOAD/
);

console.log('Apps Script Staging Pull Dry-Run V1: FIXED-STAGING-GET + INTERNAL-SECRET + SYNTHETIC-ONLY + NO-MUTATION + NO-LEAK PASS');
