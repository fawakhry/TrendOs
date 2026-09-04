import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'apps-script/patches/CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs');
const source = fs.readFileSync(sourcePath, 'utf8');

const forbiddenMutationPatterns = [
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.appendRow\s*\(/,
  /\.clear(?:Content|Format|DataValidations)?\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.insertRow(?:After|Before)?\s*\(/,
  /\.insertRows(?:After|Before)?\s*\(/,
  /\.setNumberFormat\s*\(/,
  /\.setFormula\s*\(/,
  /\.setFormulas\s*\(/,
  /SpreadsheetApp\.flush\s*\(/,
  /\bensureHeader_\s*\(/,
  /\bappendByHeaders_\s*\(/,
  /\bupdateByHeaders_\s*\(/
];

for (const pattern of forbiddenMutationPatterns) {
  assert.equal(pattern.test(source), false, `dry-run patch contains forbidden mutation call: ${pattern}`);
}
assert.equal(/UrlFetchApp\./.test(source), false, 'dry-run patch must not perform network calls');
assert.equal(/DriveApp\./.test(source), false, 'dry-run patch must not touch Drive');

const SECRET = 'ci-dryrun-secret-20260904';
const counters = { sheetReads: 0, mutations: 0 };
let activeHeaders = [];
let activeIds = [];

function mutationTrap(name) {
  return () => {
    counters.mutations += 1;
    throw new Error(`MUTATION_CALLED:${name}`);
  };
}

function makeRange(row, col, numRows, numCols) {
  return {
    getValues() {
      counters.sheetReads += 1;
      if (row === 1) return [activeHeaders.slice(col - 1, col - 1 + numCols)];
      if (numCols === 1) return activeIds.slice(row - 2, row - 2 + numRows).map((value) => [value]);
      return Array.from({ length: numRows }, () => Array(numCols).fill(''));
    },
    setValue: mutationTrap('setValue'),
    setValues: mutationTrap('setValues'),
    clear: mutationTrap('clear'),
    clearContent: mutationTrap('clearContent'),
    setNumberFormat: mutationTrap('setNumberFormat')
  };
}

const sheet = {
  getLastColumn() { return Math.max(1, activeHeaders.length); },
  getLastRow() { return Math.max(1, activeIds.length + 1); },
  getRange(row, col, numRows, numCols) { return makeRange(row, col, numRows, numCols); },
  appendRow: mutationTrap('appendRow'),
  deleteRow: mutationTrap('deleteRow'),
  insertRowAfter: mutationTrap('insertRowAfter')
};

const spreadsheet = {
  getSheetByName(name) {
    counters.sheetReads += 1;
    return name === 'الأوردرات' ? sheet : null;
  }
};

function normalizeKey_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function cleanPhone_(value) {
  let digits = String(value == null ? '' : value).replace(/[^0-9]/g, '');
  if (digits.startsWith('0020')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);
  else if (digits.length === 10 && digits.startsWith('1')) digits = '0' + digits;
  return digits;
}

const context = vm.createContext({
  console,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Date,
  Math,
  isFinite,
  normalizeKey_,
  cleanPhone_,
  SHEET_NAME_ORDERS: 'الأوردرات',
  ss_: () => spreadsheet,
  PropertiesService: {
    getScriptProperties() {
      return { getProperty: (key) => key === 'TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET' ? SECRET : '' };
    }
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    computeDigest(_algo, value) {
      const bytes = crypto.createHash('sha256').update(String(value), 'utf8').digest();
      return Array.from(bytes, (b) => b > 127 ? b - 256 : b);
    }
  }
});

vm.runInContext(source, context, { filename: 'CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs' });
assert.equal(typeof context.trendosCloudWriteReconcileDryRunV1_, 'function');

const baseHeaders = [
  'رقم الأوردر',
  'اسم الشات / المكتب',
  'رقم العميل',
  'القسم الرئيسي',
  'الأولوية',
  'الحالة العامة',
  'تاريخ التسليم المتوقع',
  'إجمالي الأوردر',
  'المتبقي',
  'آخر تحديث'
];

function payload(id = 'CW-STAGE-TEST-1') {
  return {
    orderId: id,
    customerName: 'Staging Customer',
    customerPhone: '01001112233',
    status: 'cloud-draft',
    department: 'طباعة',
    priority: 'عادي',
    expectedDelivery: '2026-09-05',
    total: 123.45,
    remaining: 23.45,
    updatedAt: '2026-09-04T18:40:00.000Z',
    _cloudWriteV1: true,
    _cloudActor: 'ci-staging-admin'
  };
}

function call(params) {
  return context.trendosCloudWriteReconcileDryRunV1_({ parameter: params });
}

activeHeaders = [...baseHeaders];
activeIds = ['1001', '1002'];
counters.sheetReads = 0;
counters.mutations = 0;

const insert = call({
  dryRun: true,
  reconcileSecret: SECRET,
  entityType: 'order',
  operation: 'upsert_order_to_sheets',
  entityId: 'CW-STAGE-TEST-1',
  payload: payload('CW-STAGE-TEST-1')
});
assert.equal(insert.success, true);
assert.equal(insert.dryRun, true);
assert.equal(insert.readOnly, true);
assert.equal(insert.sheetsWritten, false);
assert.equal(insert.mutationCount, 0);
assert.equal(insert.decision, 'would_insert');
assert.equal(insert.eligibleForFutureWrite, true);
assert.equal(insert.requiredColumnsPresent, true);
assert.equal(insert.mapping.orderId.header, 'رقم الأوردر');
assert.equal(insert.mapping.status.header, 'الحالة العامة');
assert.ok(insert.plan.some((item) => item.field === 'orderId' && item.value === 'CW-STAGE-TEST-1'));
assert.equal(counters.mutations, 0);

const readsAfterSuccess = counters.sheetReads;
const unauthorized = call({
  dryRun: true,
  reconcileSecret: 'wrong-secret',
  entityId: 'CW-STAGE-TEST-2',
  payload: payload('CW-STAGE-TEST-2')
});
assert.equal(unauthorized.success, false);
assert.equal(unauthorized.code, 'unauthorized');
assert.equal(unauthorized.sheetsWritten, false);
assert.equal(counters.sheetReads, readsAfterSuccess, 'unauthorized request must fail before sheet access');

const noDryRun = call({
  reconcileSecret: SECRET,
  entityId: 'CW-STAGE-TEST-3',
  payload: payload('CW-STAGE-TEST-3')
});
assert.equal(noDryRun.code, 'dry-run-required');
assert.equal(noDryRun.sheetsWritten, false);

const nonStage = call({
  dryRun: true,
  reconcileSecret: SECRET,
  entityId: '1001',
  payload: payload('1001')
});
assert.equal(nonStage.code, 'staging-id-required');
assert.equal(nonStage.sheetsWritten, false);

activeHeaders = [...baseHeaders];
activeIds = ['CW-STAGE-DUP', '1002', 'CW-STAGE-DUP'];
const duplicate = call({
  dryRun: true,
  reconcileSecret: SECRET,
  entityId: 'CW-STAGE-DUP',
  payload: payload('CW-STAGE-DUP')
});
assert.equal(duplicate.success, true);
assert.equal(duplicate.existingMatches, 2);
assert.equal(duplicate.decision, 'blocked_duplicate_order_id');
assert.equal(duplicate.eligibleForFutureWrite, false);
assert.equal(duplicate.sheetsWritten, false);

activeHeaders = baseHeaders.filter((header) => header !== 'الحالة العامة');
activeIds = [];
const badSchema = call({
  dryRun: true,
  reconcileSecret: SECRET,
  entityId: 'CW-STAGE-SCHEMA',
  payload: payload('CW-STAGE-SCHEMA')
});
assert.equal(badSchema.success, false);
assert.equal(badSchema.code, 'orders-schema-incompatible');
assert.deepEqual(Array.from(badSchema.missingRequired), ['status']);
assert.equal(badSchema.sheetsWritten, false);
assert.equal(badSchema.mutationCount, 0);

activeHeaders = [...baseHeaders];
const fingerprintMismatch = call({
  dryRun: true,
  reconcileSecret: SECRET,
  entityId: 'CW-STAGE-HASH',
  payload: payload('CW-STAGE-HASH'),
  payloadSha256: '0'.repeat(64)
});
assert.equal(fingerprintMismatch.success, false);
assert.equal(fingerprintMismatch.code, 'payload-fingerprint-mismatch');
assert.equal(fingerprintMismatch.sheetsWritten, false);
assert.equal(counters.mutations, 0);

console.log('Apps Script Cloud Write Reconcile Dry-Run V1: READ-ONLY + AUTH + STAGING-ONLY + SCHEMA + DUPLICATE GUARDS PASS');
