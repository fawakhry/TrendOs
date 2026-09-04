import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dryrunSource = fs.readFileSync(path.join(root, 'apps-script/patches/CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs'), 'utf8');
const source = fs.readFileSync(path.join(root, 'apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_V1.gs'), 'utf8');

assert.match(source, /__TRENDOS_CLOUD_WRITE_REHEARSAL/);
assert.match(source, /TRENDOS_CLOUD_WRITE_REHEARSAL_ENABLED/);
assert.match(source, /TRENDOS_CLOUD_WRITE_REHEARSAL_SECRET/);
assert.equal((source.match(/\.appendRow\s*\(/g) || []).length, 1, 'rehearsal source must contain exactly one appendRow call');
for (const forbidden of [
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.insertRow(?:After|Before)?\s*\(/,
  /\.insertRows(?:After|Before)?\s*\(/,
  /\.clear(?:Content|Format|DataValidations)?\s*\(/,
  /\.createSheet\s*\(/,
  /SpreadsheetApp\.insertSheet\s*\(/,
  /DriveApp\./,
  /UrlFetchApp\./,
  /\.setProperty\s*\(/,
  /\.deleteProperty\s*\(/
]) {
  assert.equal(forbidden.test(source), false, `forbidden rehearsal operation present: ${forbidden}`);
}

const SECRET = 'ci-rehearsal-secret';
let enabled = false;
let secret = SECRET;
let sheetReads = 0;
let ordersMutations = 0;
let rehearsalMutations = 0;
let lockAcquires = 0;

const headers = [
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
let ordersHeaders = [...headers];
let rehearsalHeaders = [...headers];
let rehearsalRows = [];

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

function makeSheet(name, kind) {
  return {
    getName() { return name; },
    getLastColumn() { return (kind === 'orders' ? ordersHeaders : rehearsalHeaders).length; },
    getLastRow() { return kind === 'orders' ? 1 : rehearsalRows.length + 1; },
    getRange(row, col, numRows, numCols) {
      sheetReads += 1;
      return {
        getValues() {
          const activeHeaders = kind === 'orders' ? ordersHeaders : rehearsalHeaders;
          if (row === 1) return [activeHeaders.slice(col - 1, col - 1 + numCols)];
          if (kind === 'orders') return Array.from({ length: numRows }, () => Array(numCols).fill(''));
          if (numCols === 1) {
            return rehearsalRows.slice(row - 2, row - 2 + numRows).map((r) => [r[col - 1]]);
          }
          return rehearsalRows.slice(row - 2, row - 2 + numRows).map((r) => r.slice(col - 1, col - 1 + numCols));
        }
      };
    },
    appendRow(row) {
      if (kind === 'orders') {
        ordersMutations += 1;
        throw new Error('PRODUCTION_ORDERS_MUTATION');
      }
      rehearsalMutations += 1;
      rehearsalRows.push(Array.from(row));
    }
  };
}

const ordersSheet = makeSheet('الأوردرات', 'orders');
const rehearsalSheet = makeSheet('__TRENDOS_CLOUD_WRITE_REHEARSAL', 'rehearsal');
let rehearsalSheetPresent = true;

const spreadsheet = {
  getSheetByName(name) {
    sheetReads += 1;
    if (name === 'الأوردرات') return ordersSheet;
    if (name === '__TRENDOS_CLOUD_WRITE_REHEARSAL' && rehearsalSheetPresent) return rehearsalSheet;
    return null;
  }
};

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
      return {
        getProperty(key) {
          if (key === 'TRENDOS_CLOUD_WRITE_REHEARSAL_ENABLED') return enabled ? '1' : '0';
          if (key === 'TRENDOS_CLOUD_WRITE_REHEARSAL_SECRET') return secret;
          if (key === 'TRENDOS_CLOUD_WRITE_RECONCILE_DRYRUN_SECRET') return 'dryrun-unused-here';
          return '';
        }
      };
    }
  },
  LockService: {
    getScriptLock() {
      return {
        tryLock() { lockAcquires += 1; return true; },
        releaseLock() {}
      };
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

vm.runInContext(dryrunSource, context, { filename: 'CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs' });
vm.runInContext(source, context, { filename: 'CLOUD_WRITE_RECONCILE_REHEARSAL_V1.gs' });
assert.equal(typeof context.trendosCloudWriteReconcileRehearsalV1_, 'function');

function payload(id = 'CW-STAGE-REHEARSAL-1') {
  return {
    orderId: id,
    customerName: 'Staging Cloud Write Qualification',
    customerPhone: '01001112233',
    status: 'cloud-draft',
    department: '',
    priority: '',
    expectedDelivery: '',
    total: 123.45,
    remaining: 23.45,
    updatedAt: '2026-09-04T19:42:14.653Z',
    _cloudWriteV1: true
  };
}
function call(id = 'CW-STAGE-REHEARSAL-1', body = payload(id), suppliedSecret = SECRET) {
  return context.trendosCloudWriteReconcileRehearsalV1_({
    parameter: {
      rehearsalSecret: suppliedSecret,
      entityType: 'order',
      operation: 'upsert_order_to_sheets',
      entityId: id,
      payload: body
    }
  });
}

// Default OFF must fail before any Sheet access.
enabled = false;
sheetReads = 0;
let result = call();
assert.equal(result.success, false);
assert.equal(result.code, 'rehearsal-disabled');
assert.equal(result.sheetsWritten, false);
assert.equal(sheetReads, 0);
assert.equal(ordersMutations, 0);
assert.equal(rehearsalMutations, 0);

// Wrong secret must fail before Sheet access.
enabled = true;
sheetReads = 0;
result = call('CW-STAGE-REHEARSAL-2', payload('CW-STAGE-REHEARSAL-2'), 'wrong');
assert.equal(result.code, 'unauthorized');
assert.equal(sheetReads, 0);

// Production/non-stage IDs are refused.
result = call('TM260900001', payload('TM260900001'));
assert.equal(result.code, 'staging-id-required');
assert.equal(result.sheetsWritten, false);

// Non-synthetic payload is refused before Sheet access.
sheetReads = 0;
const badIdentity = payload('CW-STAGE-BAD');
badIdentity.customerName = 'Real Customer';
result = call('CW-STAGE-BAD', badIdentity);
assert.equal(result.code, 'synthetic-payload-required');
assert.equal(sheetReads, 0);

// Missing shadow target fails closed; it is never created.
rehearsalSheetPresent = false;
result = call('CW-STAGE-NOSHEET', payload('CW-STAGE-NOSHEET'));
assert.equal(result.code, 'rehearsal-sheet-missing');
assert.equal(result.sheetsWritten, false);
rehearsalSheetPresent = true;

// Schema drift between live Orders and shadow target blocks writes.
rehearsalHeaders = headers.slice(0, -1);
result = call('CW-STAGE-DRIFT', payload('CW-STAGE-DRIFT'));
assert.equal(result.code, 'rehearsal-schema-drift');
assert.equal(rehearsalMutations, 0);
rehearsalHeaders = [...headers];

// First valid synthetic order appends exactly once to shadow, never Orders.
rehearsalRows = [];
ordersMutations = 0;
rehearsalMutations = 0;
lockAcquires = 0;
result = call();
assert.equal(result.success, true);
assert.equal(result.rehearsal, true);
assert.equal(result.idempotent, false);
assert.equal(result.decision, 'shadow_inserted');
assert.equal(result.targetSheet, '__TRENDOS_CLOUD_WRITE_REHEARSAL');
assert.equal(result.sheetsWritten, true);
assert.equal(result.mutationCount, 1);
assert.equal(rehearsalMutations, 1);
assert.equal(ordersMutations, 0);
assert.equal(rehearsalRows.length, 1);
assert.equal(lockAcquires, 1);

// Identical replay is no-op and does not append again.
result = call();
assert.equal(result.success, true);
assert.equal(result.idempotent, true);
assert.equal(result.decision, 'replay_noop');
assert.equal(result.sheetsWritten, false);
assert.equal(result.mutationCount, 0);
assert.equal(rehearsalMutations, 1);
assert.equal(rehearsalRows.length, 1);
assert.equal(ordersMutations, 0);

// Conflicting replay fails closed, no update and no second append.
const conflict = payload();
conflict.total = 999;
result = call('CW-STAGE-REHEARSAL-1', conflict);
assert.equal(result.success, false);
assert.equal(result.code, 'conflicting-rehearsal-replay');
assert.equal(result.sheetsWritten, false);
assert.equal(rehearsalMutations, 1);
assert.equal(rehearsalRows.length, 1);
assert.equal(ordersMutations, 0);

// Duplicate shadow IDs fail closed.
rehearsalRows.push(Array.from(rehearsalRows[0]));
result = call();
assert.equal(result.success, false);
assert.equal(result.code, 'duplicate-rehearsal-order-id');
assert.equal(result.sheetsWritten, false);
assert.equal(ordersMutations, 0);

console.log('Apps Script Cloud Write Rehearsal V1: DEFAULT-OFF + FIXED SHADOW TARGET + SYNTHETIC-ONLY + SCHEMA PARITY + IDEMPOTENT APPEND + NO PROD MUTATION PASS');
