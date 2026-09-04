import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const path = new URL('../apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_V1.gs', import.meta.url);
const source = fs.readFileSync(path, 'utf8');

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}
const executableSource = stripComments(source);

for (const pattern of [
  /authorize_\s*\(/,
  /createManualOrder_\s*\(/,
  /UrlFetchApp/,
  /DriveApp/,
  /MailApp/,
  /GmailApp/,
  /PropertiesService/,
  /\.appendRow\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.deleteRow\s*\(/,
  /\.insertRow\s*\(/,
  /\.setProperty\s*\(/,
  /\.deleteProperty\s*\(/
]) {
  assert.equal(pattern.test(executableSource), false, `forbidden auth bridge capability: ${pattern}`);
}

const STAGING_ID = '1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s';
const PROD_ID = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';
const headers = [
  'اسم المستخدم','القسم','الصلاحية','مفعل؟','رقم الواتساب','كلمة المرور',
  'يجب تغيير كلمة المرور؟','آخر دخول','ملاحظات','Token','timestamp','id',
  'name','username','password','role','department','permissions','active'
];
const userRow = [
  'cw_stage_service','خدمة العملاء - STAGING','خدمة','نعم','','','لا',
  '2026-09-05T00:21:00+03:00','synthetic staging only','cw-stage-test-token-abcdefghijklmnopqrstuvwxyz'
];
while (userRow.length < headers.length) userRow.push('');

function makeSheet(values) {
  return {
    getLastRow: () => values.length,
    getLastColumn: () => values[0].length,
    getRange: () => ({ getValues: () => values })
  };
}
function makeSpreadsheet(id, rows = [headers, userRow]) {
  return {
    getId: () => id,
    getSheetByName: name => name === 'المستخدمين' ? makeSheet(rows) : null
  };
}

let activeSpreadsheet = makeSpreadsheet(STAGING_ID);
let authorizeCalls = 0;
let createCalls = 0;
const context = vm.createContext({
  console,
  SpreadsheetApp: { getActiveSpreadsheet: () => activeSpreadsheet },
  trendosCloudWriteOrderV2StagingRuntimePreflightV1_: () => ({
    success: true,
    stagingTargetVerified: true,
    spreadsheetId: STAGING_ID
  }),
  roleFromArabic_: (role, department) => (String(role).includes('خدمة') || String(department).includes('خدمة')) ? 'service' : 'other',
  canCreateOrder_: user => user && user.username === 'cw_stage_service' && String(user.department).includes('خدمة'),
  sessionExpiredV1922_: value => !value,
  authorize_: () => { authorizeCalls++; throw new Error('authorize_ must not be called'); },
  createManualOrder_: () => { createCalls++; throw new Error('createManualOrder_ must not be called'); }
});
vm.runInContext(source, context, { filename: 'CLOUD_WRITE_ORDER_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_V1.gs' });
const qualify = context.trendosCloudWriteOrderV2StagingAuthBridgeQualificationV1_;
assert.equal(typeof qualify, 'function');

function adapterResult(overrides = {}) {
  return {
    success: true,
    valid: true,
    canonicalEnvelopeReady: true,
    canonicalInvocationAuthorized: false,
    businessOrderIdStrategy: 'apps-script-allocated',
    canonicalParameterEnvelope: {
      clientRequestId: 'CW-STAGE-AUTH-001',
      customerName: 'Synthetic External',
      customerPhone: '',
      customerMode: 'خارجي / عابر',
      externalCustomerId: '7711',
      department: 'ليزر',
      itemName: 'Auth bridge qualification',
      qty: 1,
      priority: 'عادي',
      status: 'طلب جديد',
      heatPress: 'لا',
      flyPrint: 'لا',
      source: 'Cloud Write V2',
      notes: 'staging'
    },
    ...overrides
  };
}

{
  const result = qualify(adapterResult());
  assert.equal(result.success, true);
  assert.equal(result.qualified, true);
  assert.equal(result.readOnly, true);
  assert.equal(result.productionSpreadsheetRefused, true);
  assert.equal(result.stagingTargetVerified, true);
  assert.equal(result.syntheticAccountVerified, true);
  assert.equal(result.syntheticUsername, 'cw_stage_service');
  assert.equal(result.canonicalRole, 'service');
  assert.equal(result.createOrderPermissionVerified, true);
  assert.equal(result.tokenPresent, true);
  assert.equal(result.tokenValueReturned, false);
  assert.equal(result.cloudCredentialsAccepted, false);
  assert.equal(result.authorizeInvoked, false);
  assert.equal(result.authBridgeQualified, true);
  assert.equal(result.canonicalInvocationAllowed, false);
  assert.equal(result.nextRequiredGate, 'canonical-side-effect-isolation');
  assert.equal(Object.hasOwn(result, 'token'), false);
  assert.equal(JSON.stringify(result).includes('cw-stage-test-token'), false);
  assert.equal(authorizeCalls, 0);
  assert.equal(createCalls, 0);
}

// Production spreadsheet must always fail closed.
{
  activeSpreadsheet = makeSpreadsheet(PROD_ID);
  const result = qualify(adapterResult());
  assert.equal(result.success, false);
  assert.equal(result.code, 'production-spreadsheet-refused');
}

// Cloud-supplied credentials remain forbidden.
{
  activeSpreadsheet = makeSpreadsheet(STAGING_ID);
  const bad = adapterResult();
  bad.canonicalParameterEnvelope.username = 'someone';
  bad.canonicalParameterEnvelope.token = 'secret';
  const result = qualify(bad);
  assert.equal(result.success, false);
  assert.equal(result.code, 'cloud-credentials-or-order-id-refused');
}

// Only CW-STAGE idempotency keys may qualify.
{
  const bad = adapterResult();
  bad.canonicalParameterEnvelope.clientRequestId = 'PROD-001';
  const result = qualify(bad);
  assert.equal(result.success, false);
  assert.equal(result.code, 'staging-client-request-prefix-required');
}

// Token absence/shape mismatch must fail without mutation.
{
  const badRow = userRow.slice();
  badRow[9] = '';
  activeSpreadsheet = makeSpreadsheet(STAGING_ID, [headers, badRow]);
  const result = qualify(adapterResult());
  assert.equal(result.success, false);
  assert.equal(result.code, 'synthetic-staging-token-required');
  assert.equal(authorizeCalls, 0);
}

console.log('APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_PASS');
