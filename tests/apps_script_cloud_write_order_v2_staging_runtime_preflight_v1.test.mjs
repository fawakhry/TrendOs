import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(
  new URL('../apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_RUNTIME_PREFLIGHT_V1.gs', import.meta.url),
  'utf8'
);

const STAGING_ID = '1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s';
const PROD_ID = '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI';
const GUARD = '__TRENDOS_V2_CANONICAL_STAGING_GUARD';

for (const pattern of [
  /UrlFetchApp/,
  /DriveApp/,
  /PropertiesService/,
  /LockService/,
  /CacheService/,
  /ScriptApp/,
  /\.appendRow\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.deleteRow\s*\(/,
  /\.insertRow\s*\(/,
  /\.clear(?:Content|Format)?\s*\(/,
  /\.setProperty\s*\(/,
  /\.deleteProperty\s*\(/,
  /createManualOrder_\s*\(/,
  /makeOrderId_\s*\(/
]) {
  assert.equal(pattern.test(source), false, `forbidden preflight capability: ${pattern}`);
}

function guardRows(overrides = {}) {
  const map = {
    stagingSpreadsheetId: STAGING_ID,
    sourceProductionSpreadsheetId: PROD_ID,
    productionCloudWrite: 'OFF',
    allowedSyntheticOrderPrefix: 'CW-STAGE-',
    canonicalWriteTarget: 'THIS STAGING COPY ONLY',
    productionSpreadsheetMutationAllowed: 'NO',
    checkpoint: 'PERF-CF-02BF',
    ...overrides
  };
  return [
    ['TRENDOS V2 CANONICAL WRITE STAGING — DO NOT USE FOR PRODUCTION', ''],
    ['stagingSpreadsheetId', map.stagingSpreadsheetId],
    ['sourceProductionSpreadsheetId', map.sourceProductionSpreadsheetId],
    ['productionCloudWrite', map.productionCloudWrite],
    ['allowedSyntheticOrderPrefix', map.allowedSyntheticOrderPrefix],
    ['canonicalWriteTarget', map.canonicalWriteTarget],
    ['productionSpreadsheetMutationAllowed', map.productionSpreadsheetMutationAllowed],
    ['checkpoint', map.checkpoint]
  ];
}

function makeSpreadsheet({ id = STAGING_ID, orders = 274, lines = 315, guard = guardRows(), includeGuard = true } = {}) {
  const sheets = {
    'الأوردرات': { getLastRow: () => orders },
    'بنود الأوردرات': { getLastRow: () => lines }
  };
  if (includeGuard) {
    sheets[GUARD] = {
      getRange(row, col, rows, cols) {
        assert.deepEqual([row, col, rows, cols], [1, 1, 8, 2]);
        return { getValues: () => guard.map((r) => [...r]) };
      }
    };
  }
  return {
    getId: () => id,
    getSheetByName: (name) => sheets[name] || null
  };
}

function runWith(spreadsheet) {
  const logs = [];
  const context = vm.createContext({
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    Logger: { log: (value) => logs.push(String(value)) }
  });
  vm.runInContext(source, context, { filename: 'CLOUD_WRITE_ORDER_V2_STAGING_RUNTIME_PREFLIGHT_V1.gs' });
  return {
    result: context.trendosCloudWriteOrderV2StagingRuntimePreflightV1_(),
    publicRun: () => context.runTrendOSCloudWriteOrderV2StagingRuntimePreflight(),
    logs
  };
}

// Exact isolated staging workbook and baseline: PASS, but canonical invocation stays blocked.
{
  const { result, publicRun, logs } = runWith(makeSpreadsheet());
  assert.equal(result.success, true);
  assert.equal(result.readOnly, true);
  assert.equal(result.spreadsheetId, STAGING_ID);
  assert.equal(result.productionSpreadsheetRefused, true);
  assert.equal(result.stagingTargetVerified, true);
  assert.equal(result.stagingGuardVerified, true);
  assert.equal(result.prewriteBaselineVerified, true);
  assert.equal(result.ordersLastRow, 274);
  assert.equal(result.orderLinesLastRow, 315);
  assert.equal(result.authBridgeQualified, false);
  assert.equal(result.externalSideEffectsQualified, false);
  assert.equal(result.canonicalInvocationAllowed, false);
  assert.equal(result.sheetsWritten, false);
  assert.equal(result.mutationCount, 0);
  assert.equal(result.networkRequests, 0);
  assert.equal(result.propertyWrites, 0);
  assert.deepEqual(Array.from(result.nextRequiredGates), ['staging-auth-bridge', 'canonical-side-effect-isolation']);
  const publicResult = publicRun();
  assert.equal(publicResult.success, true);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /^CLOUD_WRITE_V2_STAGING_RUNTIME_PREFLIGHT=/);
}

// Production workbook must be refused before any sheet lookup.
{
  const { result } = runWith(makeSpreadsheet({ id: PROD_ID }));
  assert.equal(result.success, false);
  assert.equal(result.code, 'production-spreadsheet-refused');
  assert.equal(result.canonicalInvocationAllowed, false);
  assert.equal(result.sheetsWritten, false);
}

// Any unknown/copy ID is also refused.
{
  const { result } = runWith(makeSpreadsheet({ id: 'unexpected-copy-id' }));
  assert.equal(result.success, false);
  assert.equal(result.code, 'unexpected-staging-spreadsheet');
}

// Guard is mandatory.
{
  const { result } = runWith(makeSpreadsheet({ includeGuard: false }));
  assert.equal(result.success, false);
  assert.equal(result.code, 'staging-guard-missing');
}

// Guard contract drift fails closed.
{
  const { result } = runWith(makeSpreadsheet({ guard: guardRows({ productionCloudWrite: 'ON' }) }));
  assert.equal(result.success, false);
  assert.equal(result.code, 'staging-guard-contract-mismatch');
  assert.equal(result.details.failedCheck, 'productionCloudWriteOff');
}

// First-write baseline must be exact before the canonical rehearsal.
{
  const { result } = runWith(makeSpreadsheet({ orders: 275, lines: 315 }));
  assert.equal(result.success, false);
  assert.equal(result.code, 'prewrite-baseline-mismatch');
  assert.equal(result.details.expectedOrdersLastRow, 274);
  assert.equal(result.details.actualOrdersLastRow, 275);
}

console.log('APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_STAGING_RUNTIME_PREFLIGHT_PASS');
