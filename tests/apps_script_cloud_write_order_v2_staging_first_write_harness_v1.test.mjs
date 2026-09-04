import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_HARNESS_V1.gs', import.meta.url), 'utf8');
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
const executable = stripComments(source);

// Static safety: this is an explicit writer harness, but it must not expose a web
// route or perform direct network/Drive/email/Cloudflare operations.
for (const forbidden of [
  /function\s+doGet\s*\(/,
  /function\s+doPost\s*\(/,
  /UrlFetchApp/,
  /DriveApp/,
  /MailApp/,
  /GmailApp/,
  /Jdbc/,
  /api\.cloudflare\.com/,
  /workers\.dev/,
  /SpreadsheetApp\.openById\s*\(/
]) {
  assert.equal(forbidden.test(executable), false, `forbidden first-write harness capability: ${forbidden}`);
}
assert.equal((executable.match(/createManualOrder_\s*\(/g) || []).length, 2, 'exactly first write + idempotency replay are expected');
assert.equal(/setProperty\s*\(\s*["']TRENDOS_SPREADSHEET_ID/.test(executable), false, 'harness must never retarget ss_');
assert.equal(executable.includes('CW_V2_STAGING_BOUND_SCRIPT_ID_V1'), true);
assert.equal(executable.includes('production-active-spreadsheet-refused'), true);
assert.equal(executable.includes('production-canonical-target-refused'), true);
assert.equal(executable.includes('first-write-baseline-mismatch'), true);

const STAGING = '1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s';
const PROD = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';
const TOKEN = 'cw-stage-test-token-abcdefghijklmnopqrstuvwxyz';

class FakeRange {
  constructor({ values, getValue, setValue, setValues }) {
    this._values = values;
    this._getValue = getValue;
    this._setValue = setValue;
    this._setValues = setValues;
  }
  getValues() { return this._values ? this._values() : [[this.getValue()]]; }
  getValue() { return this._getValue ? this._getValue() : ''; }
  setValue(v) { if (!this._setValue) throw new Error('setValue not supported'); this._setValue(v); return this; }
  setValues(v) { if (!this._setValues) throw new Error('setValues not supported'); this._setValues(v); return this; }
}

class FakeTableSheet {
  constructor(headers, lastRow, lastIds = {}) {
    this.headers = headers;
    this.lastRow = lastRow;
    this.lastIds = { ...lastIds };
  }
  getLastRow() { return this.lastRow; }
  getLastColumn() { return this.headers.length; }
  getRange(row, col, numRows = 1, numCols = 1) {
    if (row === 1 && numRows === 1) {
      return new FakeRange({ values: () => [this.headers.slice(col - 1, col - 1 + numCols)] });
    }
    return new FakeRange({
      getValue: () => {
        const header = this.headers[col - 1];
        return row === this.lastRow ? (this.lastIds[header] || '') : '';
      }
    });
  }
}

class FakeUsersSheet {
  constructor() {
    this.values = [
      ['اسم المستخدم','القسم','الصلاحية','مفعل؟','رقم الواتساب','كلمة المرور','يجب تغيير كلمة المرور؟','آخر دخول','ملاحظات','Token'],
      ['ضياء','الادارة','مدير','نعم','','','','2026-09-04','','prod-not-used'],
      ['وائل','طباعة','تشغيل','نعم','','','','2026-09-04','',''],
      ['رحمه','خدمة عملاء','تشغيل','نعم','','','','2026-09-04','','prod-not-used-2'],
      ['ريفان','طباعة','تشغيل','نعم','','','','2026-09-04','',''],
      ['شريف','فنيل','تشغيل','نعم','','','','2026-09-04','',''],
      ['جابر','ليزر','تشغيل','نعم','','','','2026-09-04','',''],
      ['cw_stage_service','خدمة العملاء - STAGING','خدمة','نعم','','','لا','2026-09-05T00:21:00+03:00','synthetic staging only',TOKEN]
    ];
    this.lastLoginWrites = 0;
  }
  getLastRow() { return this.values.length; }
  getLastColumn() { return this.values[0].length; }
  getRange(row, col, numRows = 1, numCols = 1) {
    if (row === 1 && col === 1 && numRows === this.values.length && numCols === this.values[0].length) {
      return new FakeRange({ values: () => this.values.map(r => r.slice()) });
    }
    return new FakeRange({
      getValue: () => this.values[row - 1]?.[col - 1] ?? '',
      setValue: v => { this.values[row - 1][col - 1] = v; this.lastLoginWrites++; }
    });
  }
}

function guardValues() {
  return [
    ['TRENDOS V2 CANONICAL WRITE STAGING — DO NOT USE FOR PRODUCTION',''],
    ['stagingSpreadsheetId',STAGING],
    ['sourceProductionSpreadsheetId',PROD],
    ['productionCloudWrite','OFF'],
    ['allowedSyntheticOrderPrefix','CW-STAGE-'],
    ['canonicalWriteTarget','THIS STAGING COPY ONLY'],
    ['productionSpreadsheetMutationAllowed','NO'],
    ['checkpoint','PERF-CF-02BF'],
    ['authBridgeAccount','cw_stage_service'],
    ['authCanonicalRole','service'],
    ['productionAccountUsed','NO'],
    ['directExternalSendInCreateManualOrder','NO'],
    ['canonicalSSTargetMustEqualStaging','YES'],
    ['v2GateRun','33921835982'],
    ['v2GateConclusion','PASS'],
    ['canonicalInvocationAllowed','NO - FIRST WRITE RUNNER NOT INSTALLED'],
    ['latestCheckpoint','PERF-CF-02BJ']
  ];
}

class FakeGuardSheet {
  constructor() { this.values = guardValues(); this.resultRows = null; }
  getRange(row, col, numRows = 1, numCols = 1) {
    if (row === 1 && col === 1 && numRows === 17 && numCols === 2) {
      return new FakeRange({ values: () => this.values.map(r => r.slice()) });
    }
    if (row === 18 && col === 1 && numRows === 3 && numCols === 2) {
      return new FakeRange({ setValues: v => { this.resultRows = v.map(r => r.slice()); } });
    }
    throw new Error(`unexpected guard range ${row},${col},${numRows},${numCols}`);
  }
}

function makeWorkbook(id = STAGING, ordersRow = 274, linesRow = 315) {
  const orders = new FakeTableSheet(['رقم الأوردر','الحالة'], ordersRow, {'رقم الأوردر':'3884'});
  const lines = new FakeTableSheet(['رقم الأوردر','رقم البند','الحالة'], linesRow, {'رقم الأوردر':'3884','رقم البند':'3884-01'});
  const users = new FakeUsersSheet();
  const guard = new FakeGuardSheet();
  return {
    id, orders, lines, users, guard,
    getId() { return this.id; },
    getSheetByName(name) {
      if (name === 'الأوردرات') return orders;
      if (name === 'بنود الأوردرات') return lines;
      if (name === 'المستخدمين') return users;
      if (name === '__TRENDOS_V2_CANONICAL_STAGING_GUARD') return guard;
      return null;
    }
  };
}

let active = makeWorkbook();
let canonical = active;
let createCalls = 0;
let propertyWrites = 0;
const properties = new Map();
let seenRequest = '';

function resetRuntime({ activeWorkbook = makeWorkbook(), canonicalWorkbook = null, configured = '' } = {}) {
  active = activeWorkbook;
  canonical = canonicalWorkbook || active;
  createCalls = 0;
  propertyWrites = 0;
  properties.clear();
  if (configured) properties.set('TRENDOS_SPREADSHEET_ID', configured);
  seenRequest = '';
}

const context = vm.createContext({
  console,
  Date,
  SpreadsheetApp: { getActiveSpreadsheet: () => active },
  ss_: () => canonical,
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: key => properties.get(key) || '',
      setProperty: (key, value) => { propertyWrites++; properties.set(key, String(value)); }
    })
  },
  ScriptApp: { getScriptId: () => 'staging-bound-script-id-test' },
  Utilities: { getUuid: () => 'abcdef12-3456-7890-abcd-ef1234567890' },
  roleFromArabic_: (role, dept) => (String(role).includes('خدمة') || String(dept).includes('خدمة')) ? 'service' : 'other',
  canCreateOrder_: user => user?.username === 'cw_stage_service' && String(user.department).includes('خدمة'),
  createManualOrder_: event => {
    createCalls++;
    const p = event?.parameter || {};
    assert.equal(p.username, 'cw_stage_service');
    assert.equal(p.token, TOKEN);
    assert.equal(Object.hasOwn(p, 'orderId'), false);
    assert.equal(p.clientRequestId.startsWith('CW-STAGE-FIRST-WRITE-'), true);
    assert.equal(p.customerMode, 'خارجي / عابر');
    assert.equal(p.department, 'ليزر');
    assert.equal(p.status, 'طلب جديد');
    assert.equal(p.heatPress, 'لا');
    assert.equal(p.flyPrint, 'لا');
    if (!seenRequest) {
      seenRequest = p.clientRequestId;
      canonical.orders.lastRow++;
      canonical.lines.lastRow++;
      canonical.orders.lastIds['رقم الأوردر'] = '3885';
      canonical.lines.lastIds['رقم الأوردر'] = '3885';
      canonical.lines.lastIds['رقم البند'] = '3885-01';
      return { success:true, version:'V1931_TREND_MASTER', orderId:'3885', lineId:'3885-01', linesCreated:1, reusedOpenOrder:false, message:'created' };
    }
    assert.equal(p.clientRequestId, seenRequest);
    return { success:true, version:'V1931_TREND_MASTER', orderId:'3885', lineId:'3885-01', linesCreated:1, duplicatePrevented:true, idempotentReplay:true, reusedOpenOrder:false, message:'duplicate prevented' };
  },
  Logger: { log: () => {} }
});
vm.runInContext(source, context, { filename: 'CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_HARNESS_V1.gs' });
const run = context.trendosCloudWriteOrderV2StagingFirstWriteV1_;
assert.equal(typeof run, 'function');

// Happy path: exactly one row pair, then same-request replay with no row growth.
{
  resetRuntime();
  const result = run('CW-STAGE-FIRST-WRITE');
  assert.equal(result.success, true);
  assert.equal(result.verified, true);
  assert.equal(result.canonicalTargetVerified, true);
  assert.equal(result.scriptIdentityPinned, true);
  assert.equal(result.syntheticUsername, 'cw_stage_service');
  assert.equal(result.tokenPresent, true);
  assert.equal(result.tokenReturned, false);
  assert.equal(result.orderId, '3885');
  assert.equal(result.lineId, '3885-01');
  assert.deepEqual(JSON.parse(JSON.stringify(result.before)), {orders:274,lines:315});
  assert.deepEqual(JSON.parse(JSON.stringify(result.afterFirst)), {orders:275,lines:316});
  assert.deepEqual(JSON.parse(JSON.stringify(result.afterReplay)), {orders:275,lines:316});
  assert.equal(result.idempotencyReplayVerified, true);
  assert.equal(result.duplicatePreventedOnReplay, true);
  assert.equal(result.productionWriteExecuted, false);
  assert.equal(result.productionCloudWriteChanged, false);
  assert.equal(createCalls, 2);
  assert.equal(active.users.lastLoginWrites, 1);
  assert.equal(propertyWrites, 1, 'only staging script identity pin is written by the harness mock');
  assert.equal(properties.get('CW_V2_STAGING_BOUND_SCRIPT_ID_V1'), 'staging-bound-script-id-test');
  assert.deepEqual(JSON.parse(JSON.stringify(active.guard.resultRows)), [
    ['firstCanonicalWriteStatus','PASS'],
    ['firstCanonicalOrderId','3885'],
    ['firstCanonicalLineId','3885-01']
  ]);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(TOKEN), false);
  assert.equal(serialized.includes('staging-bound-script-id-test'), false);
}

// No explicit confirmation: zero mutations/canonical calls.
{
  resetRuntime();
  const result = run('');
  assert.equal(result.success, false);
  assert.equal(result.code, 'explicit-first-write-confirmation-required');
  assert.equal(createCalls, 0);
  assert.equal(propertyWrites, 0);
}

// Active production must fail before Script Property pin/session refresh/writer.
{
  resetRuntime({activeWorkbook: makeWorkbook(PROD)});
  canonical = active;
  const result = run('CW-STAGE-FIRST-WRITE');
  assert.equal(result.success, false);
  assert.equal(result.code, 'production-active-spreadsheet-refused');
  assert.equal(createCalls, 0);
  assert.equal(propertyWrites, 0);
  assert.equal(active.users.lastLoginWrites, 0);
}

// Active staging but canonical ss_ target production must fail before mutation.
{
  const staging = makeWorkbook(STAGING);
  const prod = makeWorkbook(PROD);
  resetRuntime({activeWorkbook: staging, canonicalWorkbook: prod, configured: PROD});
  const result = run('CW-STAGE-FIRST-WRITE');
  assert.equal(result.success, false);
  assert.equal(result.code, 'production-canonical-target-refused');
  assert.equal(createCalls, 0);
  assert.equal(propertyWrites, 0);
  assert.equal(staging.users.lastLoginWrites, 0);
}

// Any changed Orders/Lines baseline refuses the one-shot runner.
{
  resetRuntime({activeWorkbook: makeWorkbook(STAGING, 275, 315)});
  canonical = active;
  const result = run('CW-STAGE-FIRST-WRITE');
  assert.equal(result.success, false);
  assert.equal(result.code, 'first-write-baseline-mismatch');
  assert.equal(createCalls, 0);
  assert.equal(propertyWrites, 0);
  assert.equal(active.users.lastLoginWrites, 0);
}

// Missing staging token fails after target/script pin but before canonical writer.
{
  resetRuntime();
  active.users.values[7][9] = '';
  const result = run('CW-STAGE-FIRST-WRITE');
  assert.equal(result.success, false);
  assert.equal(result.code, 'synthetic-staging-auth-contract-mismatch');
  assert.equal(createCalls, 0);
  assert.equal(active.users.lastLoginWrites, 0);
}

console.log('APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_HARNESS_PASS');
