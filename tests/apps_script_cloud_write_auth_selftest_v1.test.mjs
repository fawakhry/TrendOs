import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'apps-script/patches/CLOUD_WRITE_RECONCILE_AUTH_SELFTEST_V1.gs');
const source = fs.readFileSync(sourcePath, 'utf8');

const forbidden = [
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.appendRow\s*\(/,
  /\.clear(?:Content|Format|DataValidations)?\s*\(/,
  /\.deleteRow\s*\(/,
  /\.insertRow/,
  /\.setProperty\s*\(/,
  /\.deleteProperty\s*\(/,
  /UrlFetchApp\./,
  /DriveApp\./,
  /SpreadsheetApp\.flush\s*\(/
];
for (const pattern of forbidden) {
  assert.equal(pattern.test(source), false, `self-test contains forbidden mutation/network call: ${pattern}`);
}

assert.match(source, /TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET/);
assert.match(source, /trendosCloudWriteReconcileDryRunV1_/);
assert.match(source, /CW-STAGE-SELFTEST-/);
assert.equal(/Logger\.log\([^\n]*secret/i.test(source), false, 'self-test must never log secret');

const SECRET = 'internal-only-ci-secret';
const logs = [];
let received = null;

const context = vm.createContext({
  JSON,
  String,
  Number,
  Boolean,
  Array,
  Date,
  Error,
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) {
          return key === 'TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET' ? SECRET : '';
        }
      };
    }
  },
  Logger: {
    log(value) { logs.push(String(value)); }
  },
  trendosCloudWriteReconcileDryRunV1_(e) {
    received = e;
    const id = e.parameter.entityId;
    return {
      success: true,
      version: 'CLOUD_WRITE_RECONCILE_DRYRUN_V1_20260904',
      dryRun: true,
      readOnly: true,
      sheetsWritten: false,
      mutationCount: 0,
      entityId: id,
      targetSheet: 'الأوردرات',
      requiredColumnsPresent: true,
      existingMatches: 0,
      decision: 'would_insert',
      eligibleForFutureWrite: true,
      plan: [{ field: 'orderId', value: id }],
      schemaFingerprint: 'abc',
      payloadSha256: 'def'
    };
  }
});

vm.runInContext(source, context, { filename: 'CLOUD_WRITE_RECONCILE_AUTH_SELFTEST_V1.gs' });
assert.equal(typeof context.runTrendOSCloudWriteDryRunSelfTest, 'function');

const result = context.runTrendOSCloudWriteDryRunSelfTest();
assert.equal(result.success, true);
assert.equal(result.dryRun, true);
assert.equal(result.readOnly, true);
assert.equal(result.sheetsWritten, false);
assert.equal(result.mutationCount, 0);
assert.equal(result.decision, 'would_insert');
assert.equal(result.requiredColumnsPresent, true);
assert.equal(result.entityId.startsWith('CW-STAGE-SELFTEST-'), true);
assert.ok(received);
assert.equal(received.parameter.reconcileSecret, SECRET);
assert.equal(received.parameter.dryRun, true);
assert.equal(received.parameter.entityType, 'order');
assert.equal(received.parameter.operation, 'upsert_order_to_sheets');
assert.equal(received.parameter.payload.orderId, received.parameter.entityId);
assert.equal(received.parameter.payload._cloudWriteV1, true);
assert.equal(JSON.stringify(result).includes(SECRET), false, 'returned safe result must not contain secret');
assert.equal(logs.some((line) => line.includes(SECRET)), false, 'logs must not contain secret');
assert.equal(logs.some((line) => line.startsWith('AUTH_DRYRUN_SELFTEST_PASS=')), true);

const noSecretContext = vm.createContext({
  JSON,
  String,
  Number,
  Boolean,
  Array,
  Date,
  Error,
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => '' }) },
  Logger: { log() {} },
  trendosCloudWriteReconcileDryRunV1_() { throw new Error('handler should not be called'); }
});
vm.runInContext(source, noSecretContext);
assert.throws(() => noSecretContext.runTrendOSCloudWriteDryRunSelfTest(), /AUTH_DRYRUN_SELFTEST_NO_SECRET/);

console.log('Apps Script Authenticated Dry-Run Self-Test V1: SECRET-INTERNAL + READ-ONLY + NO-LEAK + STAGING-ONLY PASS');
