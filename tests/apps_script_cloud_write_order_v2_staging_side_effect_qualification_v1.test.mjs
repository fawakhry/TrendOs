import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../Code.gs', import.meta.url), 'utf8');
const policySource = fs.readFileSync(new URL('../apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_SIDE_EFFECT_QUALIFICATION_V1.gs', import.meta.url), 'utf8');

function sectionBetween(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert.notEqual(a, -1, `missing start marker: ${start}`);
  assert.notEqual(b, -1, `missing end marker: ${end}`);
  return source.slice(a, b);
}

const createSection = sectionBetween(code, 'function createManualOrder_(e)', 'function trendosV1932DuplicateLinesAudit_');
for (const forbidden of [
  'UrlFetchApp', 'GmailApp', 'MailApp', 'DriveApp', 'Jdbc', 'fetch(', 'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID', 'api.cloudflare.com', 'workers.dev'
]) {
  assert.equal(createSection.includes(forbidden), false, `direct external effect found in createManualOrder_: ${forbidden}`);
}
for (const required of [
  'upsertOrderSummary_(',
  'appendLine_(',
  'appendActivityLog_(',
  'queueOrderStatusMessageV1931_(',
  'trendosBumpDataVersionV1931_(',
  'trendosV1908SaveResponse_('
]) {
  assert.equal(createSection.includes(required), true, `expected canonical side effect missing: ${required}`);
}

const queueSection = sectionBetween(code, 'function automationQueueHeadersV1931_', 'function employeeKpisV1931_');
for (const forbidden of ['UrlFetchApp', 'GmailApp', 'MailApp', 'DriveApp', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']) {
  assert.equal(queueSection.includes(forbidden), false, `queue must not directly send externally: ${forbidden}`);
}
assert.equal(queueSection.includes('appendByHeaders_('), true);
assert.equal(queueSection.includes('function queueOrderStatusMessageV1931_'), true);
assert.equal(queueSection.includes('https://wa.me/'), true, 'queue may build a link but must not fetch it');

const idempotencySection = sectionBetween(code, 'function trendosV1908ReadSavedResponse_', 'function trendosV1908FpPart_');
assert.equal(idempotencySection.includes('PropertiesService.getScriptProperties().getProperty'), true);
assert.equal(idempotencySection.includes('PropertiesService.getScriptProperties().setProperty'), true);
for (const forbidden of ['UrlFetchApp', 'GmailApp', 'MailApp', 'DriveApp']) {
  assert.equal(idempotencySection.includes(forbidden), false);
}

const bumpStart = code.indexOf('function trendosBumpDataVersionV1931_');
assert.notEqual(bumpStart, -1);
const bumpSection = code.slice(bumpStart, bumpStart + 700);
assert.equal(bumpSection.includes('PropertiesService.getScriptProperties().setProperty("TRENDOS_DATA_VERSION_V1931"'), true);
for (const forbidden of ['UrlFetchApp', 'GmailApp', 'MailApp', 'DriveApp']) {
  assert.equal(bumpSection.includes(forbidden), false);
}

// ss_ may honor TRENDOS_SPREADSHEET_ID, so canonical target identity MUST remain a separate gate.
const ssStart = code.indexOf('function ss_()');
assert.notEqual(ssStart, -1);
const ssSection = code.slice(ssStart, ssStart + 900);
assert.equal(ssSection.includes('TRENDOS_SPREADSHEET_ID'), true);
assert.equal(ssSection.includes('SpreadsheetApp.openById'), true);

const context = vm.createContext({ console });
vm.runInContext(policySource, context, { filename: 'CLOUD_WRITE_ORDER_V2_STAGING_SIDE_EFFECT_QUALIFICATION_V1.gs' });
const qualify = context.trendosCloudWriteOrderV2StagingSideEffectQualificationV1_;
assert.equal(typeof qualify, 'function');

const preflight = {
  success: true,
  stagingTargetVerified: true,
  spreadsheetId: '1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s'
};
const auth = {
  success: true,
  authBridgeQualified: true,
  syntheticUsername: 'cw_stage_service',
  canonicalRole: 'service',
  tokenValueReturned: false
};
const result = qualify(preflight, auth);
assert.equal(result.success, true);
assert.equal(result.qualified, true);
assert.equal(result.sideEffectShapeQualified, true);
assert.equal(result.directNetworkQualified, true);
assert.equal(result.directWhatsAppSendQualifiedAbsent, true);
assert.equal(result.d1DirectWriteQualifiedAbsent, true);
assert.equal(result.automationQueueBehavior, 'staging-sheet-queue-only-no-direct-send');
assert.equal(result.scriptProjectIsolationVerified, false);
assert.equal(result.canonicalInvocationAllowed, false);
assert.equal(result.nextRequiredGate, 'staging-bound-script-identity');
assert.equal(result.firstWriteProfile.customerMode, 'خارجي / عابر');
assert.equal(result.firstWriteProfile.department, 'ليزر');
assert.equal(result.firstWriteProfile.reuseOpenOrderAllowed, false);
assert.equal(result.networkRequests, 0);

console.log('APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_STAGING_SIDE_EFFECT_QUALIFICATION_PASS');
