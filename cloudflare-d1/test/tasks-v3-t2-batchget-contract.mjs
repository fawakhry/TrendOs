import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bridgeUrl = new URL('../../tasks-v3-bridge-readonly.gs', import.meta.url);
const bridge = await readFile(bridgeUrl, 'utf8');

assert.match(
  bridge,
  /TASKS_V3_T2_VERSION\s*=\s*'TASKS_V3_READONLY_T2_WAEL_CANARY_3_BATCHGET'/,
  'T2 bridge must expose the batchGet candidate version marker.'
);

assert.match(
  bridge,
  /TASKS_V3_T2_SOURCE_COLUMNS\s*=\s*Object\.freeze\(\['A', 'E', 'F', 'J', 'K', 'M', 'R', 'AG', 'AS'\]\)/,
  'T2 batchGet source footprint must remain exactly the approved nine columns.'
);

const batchGetCalls = bridge.match(/Sheets\.Spreadsheets\.Values\.batchGet\s*\(/g) || [];
assert.equal(batchGetCalls.length, 1, 'T2 bridge must contain exactly one batchGet read call.');

assert.match(bridge, /majorDimension:\s*'COLUMNS'/, 'batchGet must use COLUMNS major dimension.');
assert.match(bridge, /valueRenderOption:\s*'FORMATTED_VALUE'/, 'batchGet must preserve formatted display-value semantics.');
assert.match(
  bridge,
  /sheetRangePrefix \+ column \+ '2:' \+ column/,
  'Each approved source range must remain a single narrow column beginning at row 2.'
);

for (const forbidden of [
  'getDataRange(',
  '.getRange(',
  '.getDisplayValues(',
  'Sheets.Spreadsheets.Values.batchUpdate(',
  'Sheets.Spreadsheets.Values.update(',
  'Sheets.Spreadsheets.Values.append(',
  'Sheets.Spreadsheets.Values.clear(',
  'claimNext',
  'completeTask'
]) {
  assert.ok(!bridge.includes(forbidden), `Forbidden read/write surface found: ${forbidden}`);
}

assert.ok(!/A2\s*:\s*AS|A\s*:\s*AS/.test(bridge), 'Wide A:AS source reads remain forbidden.');

console.log('TASKS_V3_T2_BATCHGET_READONLY_CONTRACT_PASS');
