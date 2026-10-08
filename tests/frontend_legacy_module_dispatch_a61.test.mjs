import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise transport functions independently of their UI/DOM bootstraps.
function extract(source, name) {
  const m = new RegExp('(?:async )?function '+name+'\\([^)]*\\)\\s*\\{').exec(source);
  assert.ok(m, name);
  let depth = 1, quote = '', escaped = false, i = m.index + m[0].length;
  for (; depth; i++) {
    const c = source[i];
    if (quote) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === quote) quote = ''; }
    else if ('\"\'`'.includes(c)) quote = c;
    else if (c === '{') depth++;
    else if (c === '}') depth--;
  }
  return source.slice(m.index, i);
}
const cases = [
  ['attendance-clockin-ui-v1.js','get',['attendanceClockinV1',{op:'state'}],'attendanceClockinV1'],
  ['attendance-live-timer-v1.js','api',[],'attendanceV1'],
  ['employee-cleaning-prep-v1.js','api',['cleaningV1',{op:'state'}],'cleaningV1'],
  ['hr-v1.js','rawApi',['hrV1',{op:'myRequests'}],'hrV1'],
  ['customer-manager-v1.js','api',['inbox',{limit:1}],'customerManagerV1'],
  ['customer-feedback-v1.js','api',['metrics',{limit:1}],'customerFeedbackV1'],
  ['go-live-autopilot-v1.js','api',['status',{}],'goLiveAutopilotV1'],
  ['attendance-v1.js','api',['attendanceV1',{op:'state'}],'attendanceV1'],
  ['manager-center-v1932.js','api',['getDashboard',{}],'getDashboard'],
  ['employee-manager-strips-v2.js','api',['getRows',{}],'getRows'],
  ['employee-ops-coach-v1.js','api',['getRows',{}],'getRows'],
  ['press-control-v1.js','directApi',[{username:'fixture',token:'test-token',op:'status'}],'pressControlV1'],
  ['work-queue-v1.js','directApi',[{username:'fixture',token:'test-token',op:'status'}],'workQueueV1'],
  ['operator-task-workflow-v2.js','materialApi',['gaberMaterialDailyReport',{}],'operatorTaskV2']
];
for (const [file, name, args, expected] of cases) {
  let calls = [];
  const auth = extra => ({ username:'fixture', token:'test-token', ...(extra||{}) });
  const ctx = { window: { trendosEmployeeApiV1: async (action, params) => {
    calls.push({action,params}); return {success:true};
  }}, auth, authParams:auth, legacyMaterialAuth:auth,
  user:()=>({username:'fixture',token:'test-token'}), Object, Error };
  vm.createContext(ctx);
  vm.runInContext(extract(fs.readFileSync(file,'utf8'),name)+`;this.invoke=${name};`,ctx);
  await ctx.invoke(...args);
  assert.equal(calls.length,1,file);
  assert.equal(calls[0].action,expected,file);
  assert.equal(calls[0].params.username,'fixture',file);
  assert.equal(calls[0].params.token,'test-token',file);
  ctx.window.trendosEmployeeApiV1 = undefined;
  await assert.rejects(()=>ctx.invoke(...args),file+' must fail closed without dispatcher');
}
const andon=fs.readFileSync('employee-andon-v1.js','utf8');
assert.doesNotMatch(andon,/trendosEmployeeApiV1/,'Structured Andon must remain on isolated Employee Supervisor service');
assert.match(andon,/\/blockers\/report/);
assert.match(andon,/trendos:employee-session-invalid/);
console.log(`A61_LEGACY_MODULE_DISPATCH=PASS (${cases.length} legacy-dispatch modules + isolated Andon)`);
