import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_CANONICAL_TARGET_IDENTITY_V1.gs', import.meta.url), 'utf8');
for (const forbidden of [
  /createManualOrder_\s*\(/,
  /authorize_\s*\(/,
  /UrlFetchApp/,
  /DriveApp/,
  /MailApp/,
  /GmailApp/,
  /\.appendRow\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.setProperty\s*\(/,
  /\.deleteProperty\s*\(/
]) {
  assert.equal(forbidden.test(source), false, `forbidden target identity capability: ${forbidden}`);
}

const STAGING = '1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s';
const PROD = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';
let activeId = STAGING;
let canonicalId = STAGING;
let configured = '';

const context = vm.createContext({
  console,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getId: () => activeId }) },
  ss_: () => ({ getId: () => canonicalId }),
  PropertiesService: {
    getScriptProperties: () => ({ getProperty: key => key === 'TRENDOS_SPREADSHEET_ID' ? configured : '' })
  }
});
vm.runInContext(source, context, { filename: 'CLOUD_WRITE_ORDER_V2_STAGING_CANONICAL_TARGET_IDENTITY_V1.gs' });
const qualify = context.trendosCloudWriteOrderV2StagingCanonicalTargetIdentityV1_;
assert.equal(typeof qualify, 'function');

const preflight = { success: true, stagingTargetVerified: true, spreadsheetId: STAGING };
const auth = { success: true, authBridgeQualified: true };
const side = { success: true, sideEffectShapeQualified: true, directNetworkQualified: true };

{
  const result = qualify(preflight, auth, side);
  assert.equal(result.success, true);
  assert.equal(result.qualified, true);
  assert.equal(result.activeSpreadsheetId, STAGING);
  assert.equal(result.canonicalSpreadsheetId, STAGING);
  assert.equal(result.activeEqualsCanonicalTarget, true);
  assert.equal(result.productionSpreadsheetRefused, true);
  assert.equal(result.configuredSpreadsheetPropertyPresent, false);
  assert.equal(result.configuredSpreadsheetPropertyClass, 'empty-use-bound-active');
  assert.equal(result.canonicalTargetIdentityQualified, true);
  assert.equal(result.canonicalInvocationEligible, true);
  assert.equal(result.nextRequiredGate, 'staging-first-write-runner');
  assert.equal(result.sheetsWritten, false);
}

// Explicit staging property remains allowed.
{
  configured = STAGING;
  const result = qualify(preflight, auth, side);
  assert.equal(result.success, true);
  assert.equal(result.configuredSpreadsheetPropertyPresent, true);
  assert.equal(result.configuredSpreadsheetPropertyClass, 'explicit-staging');
}

// Active production is always refused.
{
  configured = '';
  activeId = PROD;
  canonicalId = PROD;
  const result = qualify(preflight, auth, side);
  assert.equal(result.success, false);
  assert.equal(result.code, 'production-active-spreadsheet-refused');
}

// The critical case: active staging but ss_ resolves production must fail closed.
{
  activeId = STAGING;
  canonicalId = PROD;
  configured = PROD;
  const result = qualify(preflight, auth, side);
  assert.equal(result.success, false);
  assert.equal(result.code, 'production-canonical-target-refused');
}

// Any unexpected canonical target also fails.
{
  activeId = STAGING;
  canonicalId = 'unexpected-sheet-id';
  configured = 'unexpected-sheet-id';
  const result = qualify(preflight, auth, side);
  assert.equal(result.success, false);
  assert.equal(result.code, 'unexpected-canonical-target');
}

console.log('APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_STAGING_CANONICAL_TARGET_IDENTITY_PASS');
