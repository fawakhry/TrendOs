import fs from 'node:fs';
import assert from 'node:assert/strict';

const src = fs.readFileSync('tasks-v3-preview/Code.gs', 'utf8');
const manifest = JSON.parse(fs.readFileSync('tasks-v3-preview/appsscript.json', 'utf8'));

const forbidden = [
  ['main authorize dependency', /\bauthorize_\s*\(/],
  ['main user lookup dependency', /\bfindUser_\s*\(/],
  ['main line mutation dependency', /\bupdateLine_\s*\(/],
  ['legacy source sheet literal', /بنود الأوردرات/],
  ['sheet creation', /\.insertSheet\s*\(/],
  ['row append', /\.appendRow\s*\(/],
  ['single cell write', /\.setValue\s*\(/],
  ['range write', /\.setValues\s*\(/],
  ['delete operations', /\.(?:deleteRow|deleteRows|deleteSheet)\s*\(/],
  ['clear operations', /\.clear(?:Content|Format|DataValidations)?\s*\(/],
  ['script lock', /LockService\.getScriptLock\s*\(/],
  ['full data range scan', /getDataRange\s*\(/]
];

for (const [label, re] of forbidden) {
  assert.equal(re.test(src), false, `Forbidden ${label} found in T1 preview bridge`);
}

assert.match(src, /TASKS_V3_ENV\s*=\s*['"]PREVIEW['"]/);
assert.match(src, /TASKS_V3_PREVIEW_SPREADSHEET_ID/);
assert.match(src, /TASKS_V3_PREVIEW_SHARED_SECRET/);
assert.match(src, /TASKS_V3_PREVIEW_PRODUCTION_SPREADSHEET_FORBIDDEN/);
assert.match(src, /1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI/);
assert.match(src, /computeHmacSha256Signature/);
assert.match(src, /READONLY_OPERATION_NOT_FOUND/);
assert.match(src, /readOnly:\s*true/);
assert.equal(src.includes('GABER'), false, 'Gaber must not be enabled in T1 preview');

for (const op of ['health', 'status', 'flyPrint', 'pressCandidates']) {
  assert.match(src, new RegExp(`op === ['"]${op}['"]`));
}
for (const forbiddenOp of ['claim' + 'Next', 'complete' + 'Task']) {
  assert.equal(src.includes(forbiddenOp), false, `${forbiddenOp} must not exist in T1 preview source`);
}

assert.equal(manifest.timeZone, 'Africa/Cairo');
assert.equal(manifest.runtimeVersion, 'V8');
assert.equal(manifest.webapp.executeAs, 'USER_DEPLOYING');

console.log('TASKS_V3_T1_PREVIEW_CONTRACT=PASS');
console.log('PRODUCTION_SPREADSHEET_BLOCKED=YES');
console.log('TASK_MUTATION_CODE_PRESENT=NO');
console.log('MAIN_APPS_SCRIPT_DEPENDENCY=NO');
