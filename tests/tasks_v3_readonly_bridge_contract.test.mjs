import fs from 'node:fs';
import assert from 'node:assert/strict';

const src = fs.readFileSync('tasks-v3-bridge-readonly.gs', 'utf8');

const forbidden = [
  ['main authorize dependency', /\bauthorize_\s*\(/],
  ['main user lookup dependency', /\bfindUser_\s*\(/],
  ['main line mutation dependency', /\bupdateLine_\s*\(/],
  ['legacy source rows constant', /SHEET_NAME_LINES/],
  ['business source sheet literal', /بنود الأوردرات/],
  ['sheet creation', /\.insertSheet\s*\(/],
  ['row append', /\.appendRow\s*\(/],
  ['cell write', /\.setValue\s*\(/],
  ['range write', /\.setValues\s*\(/],
  ['delete rows/sheets', /\.(?:deleteRow|deleteRows|deleteSheet)\s*\(/],
  ['clear data', /\.clear(?:Content|Format|DataValidations)?\s*\(/],
  ['script lock', /LockService\.getScriptLock\s*\(/],
  ['full data-range scan', /getDataRange\s*\(/]
];

for (const [label, re] of forbidden) {
  assert.equal(re.test(src), false, `Forbidden ${label} found in Tasks V3 read-only bridge`);
}

assert.match(src, /TASKS_V3_INDEX_SHEET/);
assert.match(src, /TASKS_V3_LEDGER_SHEET/);
assert.match(src, /TASKS_V3_SHARED_SECRET/);
assert.match(src, /TASKS_V3_SPREADSHEET_ID/);
assert.match(src, /computeHmacSha256Signature/);
assert.match(src, /READONLY_OPERATION_NOT_FOUND/);
assert.match(src, /readOnly:\s*true/);

// T0 source must expose only read-only operations.
for (const op of ['health', 'status', 'flyPrint', 'pressCandidates']) {
  assert.match(src, new RegExp(`op === ['"]${op}['"]`));
}

// Mutation route names are intentionally absent from executable routing/source in T0.
for (const forbiddenOp of ['claim' + 'Next', 'complete' + 'Task']) {
  assert.equal(src.includes(forbiddenOp), false, `${forbiddenOp} must not exist in T0 bridge`);
}

console.log('TASKS_V3_READONLY_BRIDGE_CONTRACT=PASS');
