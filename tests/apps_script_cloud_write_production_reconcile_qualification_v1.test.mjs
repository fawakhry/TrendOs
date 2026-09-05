import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const patchPath = path.join(root, 'apps-script/patches/CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1.gs');
const dryRunPath = path.join(root, 'apps-script/patches/CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs');
const source = fs.readFileSync(patchPath, 'utf8');
const dryRun = fs.readFileSync(dryRunPath, 'utf8');

const target = 'CW-PROD-QUAL-33975124471';
const confirmation = 'QUALIFY_PRODUCTION_OUTBOX_TO_SHEETS_33975124471';

assert.match(source, /PREPARED \/ NOT ROUTED \/ DEFAULT-OFF/);
assert.match(source, new RegExp(target));
assert.match(source, new RegExp(confirmation));
assert.match(source, /TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_ENABLED/);
assert.match(source, /TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_SECRET/);
assert.match(source, /cwReconcileSafeEqualV1_/);
assert.match(source, /payload-fingerprint-mismatch/);
assert.match(source, /cwReconcileSha256V1_\(payload\)/);
assert.match(source, /exact-synthetic-payload-required/);
assert.match(source, /duplicate-production-order-id/);
assert.match(source, /conflicting-production-replay/);
assert.match(source, /existing_identical_noop/);
assert.match(source, /LockService\.getScriptLock\(\)/);
assert.match(source, /SpreadsheetApp\.flush\(\)/);
assert.match(source, /existingMatchesAfter:\s*1/);
assert.match(source, /persisted:\s*true/);
assert.match(source, /productionCutover:\s*false/);
assert.match(source, /sheetsAuthoritative:\s*true/);

const appendCalls = (source.match(/\.appendRow\s*\(/g) || []).length;
assert.equal(appendCalls, 1, 'qualification patch must have exactly one append mutation site');
assert.equal(/\.setValue\s*\(/.test(source), false, 'existing cells must never be updated');
assert.equal(/\.setValues\s*\(/.test(source), false, 'existing rows must never be bulk-updated');
assert.equal(/\.deleteRow\s*\(/.test(source), false, 'rows must never be deleted');
assert.equal(/\.insertRow/.test(source), false, 'rows must not be inserted through alternate mutation APIs');
assert.equal(/insertSheet\s*\(/.test(source), false, 'qualification must never create a Sheet');
assert.equal(/setProperty\s*\(/.test(source), false, 'qualification must never mutate Script Properties');
assert.equal(/deleteProperty\s*\(/.test(source), false, 'qualification must never delete Script Properties');

assert.match(source, /cwReconcileTextV1_\(payload\.orderId\)\s*===\s*CW_PROD_RECONCILE_QUAL_TARGET_V1/);
assert.match(source, /cwReconcileTextV1_\(payload\.clientRequestId\)\s*===\s*CW_PROD_RECONCILE_QUAL_REQUEST_V1/);
assert.match(source, /TrendOS Production Cloud Write Qualification/);
assert.match(source, /SYSTEM-QUALIFICATION/);
assert.match(source, /cloud-qualification/);
assert.match(source, /Number\(payload\.total\)\s*===\s*0/);
assert.match(source, /Number\(payload\.remaining\)\s*===\s*0/);

for (const dependency of [
  'function cwReconcileTextV1_',
  'function cwReconcileSafeEqualV1_',
  'function cwReconcileSha256V1_',
  'function cwReconcileOrderMappingV1_',
  'function cwReconcilePlanV1_'
]) {
  assert.ok(dryRun.includes(dependency), `missing declared dependency: ${dependency}`);
}

assert.equal(source.includes('CW-STAGE-'), false, 'Production qualification patch must not broaden to staging prefixes');
assert.equal(source.includes('CW-PROD-QUAL-*'), false, 'Production qualification patch must never accept a wildcard/prefix target');

console.log('Apps Script Production Reconcile Qualification V1: EXACT TARGET + DEFAULT-OFF + LOCKED SINGLE APPEND + IDEMPOTENT NO-UPDATE PASS');
