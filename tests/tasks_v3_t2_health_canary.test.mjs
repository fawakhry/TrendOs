import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('tasks-v3-bridge-readonly.gs', 'utf8'), ctx);
vm.runInContext(`
var reads = 0;
tasksV3VerifyAssertion_ = function () { return { ok: true }; };
tasksV3ScriptProperty_ = function (name) { if (name === 'TASKS_V3_T2_CANARY_OPERATOR') return 'وائل'; throw new Error('Unexpected property'); };
tasksV3Output_ = function (body) { return body; };
tasksV3Health_ = function () { reads++; return { success: true, readOnly: true }; };
tasksV3Status_ = function () { reads++; return { success: true }; };
tasksV3LaneResponse_ = function () { reads++; return { success: true }; };
`, ctx);
const call = (op, operator, role) => ctx.doPost({postData:{contents:JSON.stringify({op,operator,role})}});
for (const op of ['health','status','flyPrint','pressCandidates']) {
  const before = ctx.reads;
  assert.equal(call(op,'other','WAEL').code,'T2_CANARY_FORBIDDEN');
  assert.equal(call(op,'وائل','OTHER').code,'T2_CANARY_FORBIDDEN');
  assert.equal(ctx.reads,before,'Rejected requests must not read source data');
  assert.equal(call(op,'وائل','WAEL').success,true);
  assert.equal(ctx.reads,before+1);
}
console.log('T2_ALL_OPERATIONS_WAEL_GATE=PASS (mocked valid signatures; not live qualification)');
