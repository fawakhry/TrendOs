import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_V1.gs', import.meta.url), 'utf8');
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
const executable = stripComments(source);

for (const forbidden of [
  /function\s+doGet\s*\(/,
  /function\s+doPost\s*\(/,
  /DriveApp/,
  /MailApp/,
  /GmailApp/,
  /Jdbc/,
  /SpreadsheetApp\.openById\s*\(/,
  /setProperty\s*\(/
]) {
  assert.equal(forbidden.test(executable), false, `forbidden staging bridge capability: ${forbidden}`);
}
assert.equal((executable.match(/createManualOrder_\s*\(/g) || []).length, 1, 'canonical writer must be invoked at exactly one call site');
assert.equal(executable.includes('trendos-d1-staging.trendmall-contact.workers.dev/v1/staging/cloud-write/v2/bridge/validate'), true);
assert.equal(executable.includes('trendos-d1-api.trendmall-contact.workers.dev'), false);
assert.equal(executable.includes('CWV2-STAGE-BRIDGE-001'), true);
assert.equal(executable.includes('PERF-CF-02BM'), true);
assert.equal(executable.includes('production-active-spreadsheet-refused'), true);
assert.equal(executable.includes('production-canonical-target-refused'), true);
assert.equal(executable.includes('business-order-id-preallocation-refused'), true);

const STAGING = '1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s';
const PROD = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';
const USER_TOKEN = 'cw-stage-test-token-abcdefghijklmnopqrstuvwxyz';
const BRIDGE_TOKEN = 'v1.fake.bridge.token';

class FakeRange {
  constructor({ values, displayValues, setValue }) {
    this._values = values;
    this._displayValues = displayValues;
    this._setValue = setValue;
  }
  getValues() { return this._values ? this._values() : []; }
  getDisplayValues() { return this._displayValues ? this._displayValues() : this.getValues(); }
  setValue(value) { if (!this._setValue) throw new Error('setValue not supported'); this._setValue(value); return this; }
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
    ['v2GateRun','33923809358'],
    ['v2GateConclusion','PASS'],
    ['canonicalInvocationAllowed','STAGING FIRST WRITE VERIFIED - CLOUDFLARE BRIDGE NOT ENABLED'],
    ['latestCheckpoint','PERF-CF-02BM'],
    ['firstCanonicalWriteStatus','PASS_RECOVERED'],
    ['firstCanonicalOrderId','3885'],
    ['firstCanonicalLineId','3885-01']
  ];
}

class FakeGuardSheet {
  constructor() { this.values = guardValues(); }
  getRange(row, col, numRows = 1, numCols = 1) {
    assert.deepEqual([row,col,numRows,numCols],[1,1,20,2]);
    return new FakeRange({ displayValues: () => this.values.map(r => r.slice()) });
  }
}

class FakeUsersSheet {
  constructor() {
    this.values = [
      ['اسم المستخدم','القسم','الصلاحية','مفعل؟','رقم الواتساب','كلمة المرور','يجب تغيير كلمة المرور؟','آخر دخول','ملاحظات','Token'],
      ['جابر','ليزر','تشغيل','نعم','','','','2026-09-04','','prod-not-used'],
      ['cw_stage_service','خدمة العملاء - STAGING','خدمة','نعم','','','لا','2026-09-05T00:21:00+03:00','synthetic staging only',USER_TOKEN]
    ];
    this.lastLoginWrites = 0;
  }
  getLastRow() { return this.values.length; }
  getLastColumn() { return this.values[0].length; }
  getRange(row, col, numRows = 1, numCols = 1) {
    if (row === 1 && col === 1 && numRows === this.values.length && numCols === this.values[0].length) {
      return new FakeRange({ values: () => this.values.map(r => r.slice()) });
    }
    return new FakeRange({ setValue: value => { this.values[row - 1][col - 1] = value; this.lastLoginWrites++; } });
  }
}

function makeWorkbook(id = STAGING) {
  const guard = new FakeGuardSheet();
  const users = new FakeUsersSheet();
  return {
    id, guard, users,
    getId() { return id; },
    getSheetByName(name) {
      if (name === '__TRENDOS_V2_CANONICAL_STAGING_GUARD') return guard;
      if (name === 'المستخدمين') return users;
      return null;
    }
  };
}

let active = makeWorkbook();
let canonical = active;
let configured = '';
let urlFetchCalls = 0;
let createCalls = 0;
let validationMode = 'pass';

function reset({ activeId = STAGING, canonicalId = null, configuredId = '', validation = 'pass' } = {}) {
  active = makeWorkbook(activeId);
  canonical = makeWorkbook(canonicalId || activeId);
  configured = configuredId;
  validationMode = validation;
  urlFetchCalls = 0;
  createCalls = 0;
}

const context = vm.createContext({
  console,
  Date,
  JSON,
  Object,
  ContentService: {
    MimeType: { JSON: 'json' },
    createTextOutput: text => ({ setMimeType: () => ({ text }) })
  },
  SpreadsheetApp: { getActiveSpreadsheet: () => active },
  ss_: () => canonical,
  PropertiesService: {
    getScriptProperties: () => ({ getProperty: key => key === 'TRENDOS_SPREADSHEET_ID' ? configured : '' })
  },
  UrlFetchApp: {
    fetch: (url, options) => {
      urlFetchCalls++;
      assert.equal(url, 'https://trendos-d1-staging.trendmall-contact.workers.dev/v1/staging/cloud-write/v2/bridge/validate');
      assert.equal(options.method, 'post');
      assert.equal(options.headers.Authorization, `Bearer ${BRIDGE_TOKEN}`);
      const body = validationMode === 'pass'
        ? { success:true, bridgeAuthorized:true, stagingOnly:true, subject:'cloud-write-v2-bridge' }
        : { success:false, bridgeAuthorized:false, stagingOnly:true, code:'invalid-token' };
      return {
        getResponseCode: () => validationMode === 'pass' ? 200 : 401,
        getContentText: () => JSON.stringify(body)
      };
    }
  },
  roleFromArabic_: (role, dept) => (String(role).includes('خدمة') || String(dept).includes('خدمة')) ? 'service' : 'other',
  canCreateOrder_: user => user?.username === 'cw_stage_service' && String(user.department).includes('خدمة'),
  createManualOrder_: event => {
    createCalls++;
    const p = event?.parameter || {};
    assert.equal(p.username, 'cw_stage_service');
    assert.equal(p.token, USER_TOKEN);
    assert.equal(p.clientRequestId, 'CWV2-STAGE-BRIDGE-001');
    assert.equal(p.customerName, 'Staging Cloud Write V2 Bridge Qualification');
    assert.equal(p.customerPhone, '01001112233');
    assert.equal(p.customerMode, 'خارجي / عابر');
    assert.equal(p.externalCustomerId, '988');
    assert.equal(p.department, 'طباعة');
    assert.equal(p.itemName, 'V2 Bridge Qualification Item');
    assert.equal(String(p.qty), '1');
    assert.equal(p.priority, 'عادي');
    assert.equal(p.status, 'طلب جديد');
    assert.equal(p.heatPress, 'نعم');
    assert.equal(p.flyPrint, 'لا');
    assert.equal(p.source, 'TrendOS Staging V2 Bridge');
    assert.equal(p.notes, 'Synthetic staging-only V2 bridge qualification');
    assert.equal(Object.hasOwn(p, 'orderId'), false);
    return { success:true, orderId:'3886', lineId:'3886-01', linesCreated:1, reusedOpenOrder:false };
  },
  output_: result => result
});
vm.runInContext(source, context, { filename: 'CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_V1.gs' });
const run = context.trendosCloudWriteOrderV2StagingBridgeV1_;
assert.equal(typeof run, 'function');

function payload(overrides = {}) {
  return {
    bridgeToken: BRIDGE_TOKEN,
    canonicalCreateParams: {
      clientRequestId: 'CWV2-STAGE-BRIDGE-001',
      customerName: 'Staging Cloud Write V2 Bridge Qualification',
      customerPhone: '01001112233',
      customerMode: 'خارجي / عابر',
      externalCustomerId: '988',
      department: 'طباعة',
      itemName: 'V2 Bridge Qualification Item',
      qty: 1,
      priority: 'عادي',
      status: 'طلب جديد',
      heatPress: 'نعم',
      flyPrint: 'لا',
      source: 'TrendOS Staging V2 Bridge',
      notes: 'Synthetic staging-only V2 bridge qualification',
      ...overrides
    }
  };
}

// Happy staging path uses callback-authenticated bridge + canonical writer once.
{
  reset();
  const result = run(payload());
  assert.equal(result.success, true);
  assert.equal(result.verified, true);
  assert.equal(result.bridgeAuthenticated, true);
  assert.equal(result.canonicalWriterUsed, true);
  assert.equal(result.orderId, '3886');
  assert.equal(result.lineId, '3886-01');
  assert.equal(result.tokenReturned, false);
  assert.equal(result.productionWriteExecuted, false);
  assert.equal(result.productionCloudWriteChanged, false);
  assert.equal(urlFetchCalls, 1);
  assert.equal(createCalls, 1);
  assert.equal(canonical.users.lastLoginWrites, 1);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(USER_TOKEN), false);
  assert.equal(serialized.includes(BRIDGE_TOKEN), false);
}

// Production active workbook is refused before validation/network/writer.
{
  reset({ activeId: PROD, canonicalId: PROD });
  const result = run(payload());
  assert.equal(result.success, false);
  assert.equal(result.code, 'production-active-spreadsheet-refused');
  assert.equal(urlFetchCalls, 0);
  assert.equal(createCalls, 0);
}

// Production canonical ss_ target is refused before validation/network/writer.
{
  reset({ activeId: STAGING, canonicalId: PROD, configuredId: PROD });
  const result = run(payload());
  assert.equal(result.success, false);
  assert.equal(result.code, 'production-canonical-target-refused');
  assert.equal(urlFetchCalls, 0);
  assert.equal(createCalls, 0);
}

// Invalid/expired bridge token callback stops before user session refresh/writer.
{
  reset({ validation: 'fail' });
  const result = run(payload());
  assert.equal(result.success, false);
  assert.equal(result.code, 'bridge-token-rejected');
  assert.equal(urlFetchCalls, 1);
  assert.equal(createCalls, 0);
  assert.equal(canonical.users.lastLoginWrites, 0);
}

// Any mutation of the fixed synthetic contract is refused before canonical writer.
{
  reset();
  const result = run(payload({ itemName: 'NOT ALLOWED' }));
  assert.equal(result.success, false);
  assert.equal(result.code, 'synthetic-bridge-contract-mismatch');
  assert.equal(urlFetchCalls, 1);
  assert.equal(createCalls, 0);
  assert.equal(canonical.users.lastLoginWrites, 0);
}

// Preallocated business Order ID is explicitly refused.
{
  reset();
  const bad = payload();
  bad.canonicalCreateParams.orderId = '9999';
  const result = run(bad);
  assert.equal(result.success, false);
  assert.equal(result.code, 'business-order-id-preallocation-refused');
  assert.equal(createCalls, 0);
}

console.log('APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_PASS');
