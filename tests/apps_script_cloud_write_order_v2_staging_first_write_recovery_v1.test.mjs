import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_RECOVERY_V1.gs', import.meta.url), 'utf8');
const executable = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

for (const forbidden of [
  /function\s+doGet\s*\(/,
  /function\s+doPost\s*\(/,
  /UrlFetchApp/,
  /DriveApp/,
  /MailApp/,
  /GmailApp/,
  /Jdbc/,
  /appendRow\s*\(/,
  /insertRow/,
  /deleteRow/,
  /setProperty\s*\(/
]) {
  assert.equal(forbidden.test(executable), false, `forbidden recovery capability: ${forbidden}`);
}
assert.equal((executable.match(/createManualOrder_\s*\(/g) || []).length, 1, 'recovery must replay exactly once');
assert.equal(executable.includes('getDisplayValue'), true, 'legacy line-id verification must use display value');
assert.equal(executable.includes('getProperties'), true, 'recovery must discover the saved V1908 key internally');

const STAGING = '1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s';
const TOKEN = 'cw-stage-recovery-token-abcdefghijklmnopqrstuvwxyz';
const REQUEST = 'CW-STAGE-FIRST-WRITE-1757041092345-abcdef12';
const PROP = 'TRENDOS_CREATE_ORDER_V1908_' + REQUEST;

class FakeCell {
  constructor(value, display = null) { this.value = value; this.display = display ?? String(value ?? ''); }
  getValue() { return this.value; }
  getDisplayValue() { return this.display; }
}

class FakeRange {
  constructor({values, setValues, cell}) { this._values = values; this._setValues = setValues; this._cell = cell; }
  getValues() { return this._values ? this._values() : [[this._cell?.getValue?.() ?? '']]; }
  getValue() { return this._cell?.getValue?.() ?? ''; }
  getDisplayValue() { return this._cell?.getDisplayValue?.() ?? String(this.getValue()); }
  setValues(v) { if (!this._setValues) throw new Error('setValues unsupported'); this._setValues(v); return this; }
}

class FakeSheet {
  constructor(name, headers, lastRow, lastValues = {}, lastDisplays = {}) {
    this.name = name; this.headers = headers; this.lastRow = lastRow;
    this.lastValues = {...lastValues}; this.lastDisplays = {...lastDisplays}; this.resultRows = null;
  }
  getLastRow() { return this.lastRow; }
  getLastColumn() { return this.headers.length; }
  getRange(row, col, numRows = 1, numCols = 1) {
    if (this.name === '__TRENDOS_V2_CANONICAL_STAGING_GUARD' && row === 18 && col === 1 && numRows === 3 && numCols === 2) {
      return new FakeRange({setValues: v => { this.resultRows = v.map(r => r.slice()); }});
    }
    if (row === 1 && numRows === 1) {
      return new FakeRange({values: () => [this.headers.slice(col - 1, col - 1 + numCols)]});
    }
    const header = this.headers[col - 1];
    const value = row === this.lastRow ? (this.lastValues[header] ?? '') : '';
    const display = row === this.lastRow ? (this.lastDisplays[header] ?? String(value)) : '';
    return new FakeRange({cell: new FakeCell(value, display)});
  }
}

function makeBook({ordersRows=275, linesRows=316, lineDisplay='3885-01'} = {}) {
  const orders = new FakeSheet('الأوردرات', ['رقم الأوردر'], ordersRows, {'رقم الأوردر':'3885'});
  const lines = new FakeSheet('بنود الأوردرات', ['رقم الأوردر','رقم البند'], linesRows,
    {'رقم الأوردر':'3885','رقم البند':725009}, {'رقم الأوردر':'3885','رقم البند':lineDisplay});
  const guard = new FakeSheet('__TRENDOS_V2_CANONICAL_STAGING_GUARD', ['k','v'], 20);
  const book = {
    getId: () => STAGING,
    getSheetByName(name) {
      if (name === 'الأوردرات') return orders;
      if (name === 'بنود الأوردرات') return lines;
      if (name === '__TRENDOS_V2_CANONICAL_STAGING_GUARD') return guard;
      return null;
    }
  };
  return {book, orders, lines, guard};
}

function makeRuntime({bookState=makeBook(), propOverrides={}, replayResult=null} = {}) {
  const properties = {
    CW_V2_STAGING_BOUND_SCRIPT_ID_V1: 'bound-stage-script',
    [PROP]: JSON.stringify({success:true, orderId:'3885', lineId:'3885-01', linesCreated:1, idempotentReplay:true}),
    ...propOverrides
  };
  let createCalls = 0;
  let lastEvent = null;
  const props = {
    getProperty: key => properties[key] || '',
    getProperties: () => ({...properties})
  };
  const context = vm.createContext({
    console,
    cwV2FirstWriteResolveTargetsV1_: () => ({success:true, canonical:bookState.book, props}),
    cwV2FirstWritePinScriptIdentityV1_: () => ({success:true, pinned:true}),
    cwV2FirstWriteResolveSyntheticAuthV1_: () => ({success:true, username:'cw_stage_service', token:TOKEN}),
    createManualOrder_: event => {
      createCalls++; lastEvent = event;
      return replayResult || {success:true, orderId:'3885', lineId:'3885-01', duplicatePrevented:true, idempotentReplay:true};
    },
    Logger: {log: () => {}},
    CW_V2_FIRST_WRITE_STAGING_ID_V1: STAGING
  });
  vm.runInContext(source, context, {filename:'CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_RECOVERY_V1.gs'});
  return {run: context.trendosCloudWriteOrderV2StagingRecoverFirstWriteV1_, bookState, properties, getCreateCalls:()=>createCalls, getLastEvent:()=>lastEvent};
}

// Happy recovery: existing 3885/3885-01, exact saved request, one replay, no row growth.
{
  const rt = makeRuntime();
  const result = rt.run();
  assert.equal(result.success, true);
  assert.equal(result.verified, true);
  assert.equal(result.replayVerified, true);
  assert.equal(result.duplicatePreventedOnReplay, true);
  assert.deepEqual(JSON.parse(JSON.stringify(result.before)), {orders:275,lines:316});
  assert.deepEqual(JSON.parse(JSON.stringify(result.after)), {orders:275,lines:316});
  assert.equal(result.lineId, '3885-01');
  assert.equal(result.lineIdVerificationMode, 'display-value-legacy-date-format-compatible');
  assert.equal(result.requestKeyReturned, false);
  assert.equal(result.tokenReturned, false);
  assert.equal(result.productionWriteExecuted, false);
  assert.equal(rt.getCreateCalls(), 1);
  assert.equal(rt.getLastEvent().parameter.clientRequestId, REQUEST);
  assert.equal(rt.getLastEvent().parameter.username, 'cw_stage_service');
  assert.equal(rt.getLastEvent().parameter.token, TOKEN);
  assert.equal(Object.keys(rt.getLastEvent().parameter).length, 3, 'replay event must contain auth + saved request key only');
  assert.deepEqual(JSON.parse(JSON.stringify(rt.bookState.guard.resultRows)), [
    ['firstCanonicalWriteStatus','PASS_RECOVERED'],
    ['firstCanonicalOrderId','3885'],
    ['firstCanonicalLineId','3885-01']
  ]);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(TOKEN), false);
  assert.equal(serialized.includes(REQUEST), false);
}

// Changed row counts: fail before replay.
{
  const rt = makeRuntime({bookState:makeBook({ordersRows:276})});
  const result = rt.run();
  assert.equal(result.success, false);
  assert.equal(result.code, 'recovery-baseline-mismatch');
  assert.equal(rt.getCreateCalls(), 0);
}

// Wrong displayed Line ID: fail before replay even if numeric underlying value exists.
{
  const rt = makeRuntime({bookState:makeBook({lineDisplay:'3886-01'})});
  const result = rt.run();
  assert.equal(result.success, false);
  assert.equal(result.code, 'existing-first-write-not-observed');
  assert.equal(rt.getCreateCalls(), 0);
}

// Two saved keys for the same order: fail closed.
{
  const extra = 'TRENDOS_CREATE_ORDER_V1908_CW-STAGE-FIRST-WRITE-OTHER';
  const rt = makeRuntime({propOverrides:{[extra]:JSON.stringify({success:true,orderId:'3885',lineId:'3885-01'})}});
  const result = rt.run();
  assert.equal(result.success, false);
  assert.equal(result.code, 'saved-idempotency-key-not-unique');
  assert.equal(rt.getCreateCalls(), 0);
}

// Replay guard missing: rows must stay fixed but recovery fails.
{
  const rt = makeRuntime({replayResult:{success:true,orderId:'3885',lineId:'3885-01',duplicatePrevented:false}});
  const result = rt.run();
  assert.equal(result.success, false);
  assert.equal(result.code, 'saved-idempotency-replay-verification-failed');
  assert.equal(rt.getCreateCalls(), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(result.before)), {orders:275,lines:316});
  assert.deepEqual(JSON.parse(JSON.stringify(result.after)), {orders:275,lines:316});
}

console.log('APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_RECOVERY_PASS');
