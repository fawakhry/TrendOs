import fs from 'node:fs';
import assert from 'node:assert/strict';

const src = fs.readFileSync('tasks-v3-bridge-readonly.gs', 'utf8');

const forbidden = [
  ['main authorize dependency', /\bauthorize_\s*\(/],
  ['main user lookup dependency', /\bfindUser_\s*\(/],
  ['main line mutation dependency', /\bupdateLine_\s*\(/],
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
  assert.equal(re.test(src), false, `Forbidden ${label} found in T2 bridge`);
}

assert.match(src, /TASKS_V3_T2_VERSION/);
assert.match(src, /TASKS_V3_T2_CANARY_OPERATOR/);
assert.match(src, /TASKS_V3_T2_SPREADSHEET_ID/);
assert.match(src, /T2_CANARY_FORBIDDEN/);
assert.match(src, /role !== 'WAEL'/);
assert.match(src, /readOnly:\s*true/);
assert.match(src, /TASKS_V3_T2_SOURCE_SHEET\s*=\s*['"]بنود الأوردرات['"]/);

for (const op of ['health', 'status', 'flyPrint', 'pressCandidates']) {
  assert.match(src, new RegExp(`op === ['"]${op}['"]`));
}

for (const forbiddenOp of ['claim' + 'Next', 'complete' + 'Task']) {
  assert.equal(src.includes(forbiddenOp), false, `${forbiddenOp} must not exist in T2 bridge`);
}

// Production spreadsheet identity must remain runtime configuration, never source-coded.
assert.equal(src.includes('1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI'), false);

// T2 direct projection is intentionally bounded to 9 narrow columns, never the 92-column row body.
for (const col of ['A', 'E', 'F', 'J', 'K', 'M', 'R', 'AG', 'AS']) {
  assert.match(src, new RegExp(`tasksV3Column_\\(sheet, ['"]${col}['"]`));
}
assert.equal(/getRange\([^\n]*,\s*92\s*\)/.test(src), false);

console.log('TASKS_V3_T2_WAEL_CANARY_CONTRACT=PASS');
