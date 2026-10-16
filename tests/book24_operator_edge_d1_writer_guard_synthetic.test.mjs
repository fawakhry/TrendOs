// BOOK24: no real network, D1, Apps Script, staff, or machines.
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {handleOperatorTaskEdgeRequest} from '../cloudflare-d1/src/operator-task-edge-v2.mjs';
import {issueEdgeSessionToken} from '../cloudflare-d1/src/edge-gateway.mjs';
import {
  operatorTaskSingleWriterGuardEnabledV1,checkOperatorEdgeD1WriterConflictV1
} from '../cloudflare-d1/src/operator-task-single-writer-guard-v1.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const SECRET='BOOK24_TEST_ONLY_EDGE_SECRET_NOT_LIVE';
const PROXY='BOOK24_TEST_ONLY_APPS_PROXY_SECRET';
const ORIGINAL_FETCH=globalThis.fetch;
const state={post:0,get:0,urls:[],auth:[]};
globalThis.fetch=async(url,options={})=>{
  assert.equal(url,'https://apps-script.invalid/BOOK24_FAKE_ONLY');
  state.post++;
  state.urls.push(String(url));
  state.auth.push(JSON.parse(options.body||'{}').op);
  return new Response(JSON.stringify({success:true,operation:'fake-google-call-only'}),{
    status:200,headers:{'content-type':'application/json'}
  });
};
test.after(()=>{globalThis.fetch=ORIGINAL_FETCH;});
let token;
async function validToken(){
  if(!token)token=await issueEdgeSessionToken({sub:'wael',jti:'BOOK24_FAKE_JTI'},SECRET);
  return token;
}
function fixture({mode='OFF',flag='true',missingDb=false,missingRow=false,dbThrows=false}={}){
  const calls={select:0,mutate:0};
  const env={
    EDGE_SESSION_SECRET:SECRET,TRENDOS_OPERATOR_TASK_V2_EDGE_ENABLED:'true',
    TRENDOS_OPERATOR_TASK_PROXY_SECRET:PROXY,
    APPS_SCRIPT_API_URL:'https://apps-script.invalid/BOOK24_FAKE_ONLY',
    TRENDOS_OPERATOR_TASK_SINGLE_WRITER_GUARD_V1:flag
  };
  if(!missingDb)env.DB={
    prepare(sql){
      calls.select++;
      assert.match(sql,/^SELECT mode FROM operator_task_control WHERE singleton_id=1 LIMIT 1$/);
      return {async first(){
        if(dbThrows)throw Error('BOOK24_FAKE_D1_FAILURE');
        if(missingRow)return null;
        return {mode};
      }};
    },
    async batch(){calls.mutate++;throw Error('MUTATION_FORBIDDEN');}
  };
  return {env,calls};
}
async function invoke(f,{op='claim',key='BOOK24_REQUEST_A',bearer,method}={}){
  const complete=op==='complete',read=op==='status';
  const path=read?'/v1/operator/tasks/status':complete?'/v1/operator/tasks/complete':'/v1/operator/tasks/claim-next';
  const m=method|| (read?'GET':'POST');
  const h={'Origin':'https://fawakhry.github.io','Authorization':'Bearer '+(bearer===undefined?await validToken():bearer)};
  if(!read)h['Idempotency-Key']=key;
  if(!read)h['content-type']='application/json';
  const req=new Request('https://fixture.invalid'+path,{
    method:m,headers:h,
    ...(!read?{body:JSON.stringify(complete?{taskId:'FAKE-TASK',finalStatus:'تم التسليم'}:{})}:{})
  });
  const res=await handleOperatorTaskEdgeRequest(req,f.env);
  return {status:res.status,body:await res.json()};
}
test('BOOK24: opt-in guard defaults disabled and never queries D1',async()=>{
  const f=fixture({mode:'GENERAL',flag:''});
  assert.equal(operatorTaskSingleWriterGuardEnabledV1(f.env),false);
  const before=state.post;
  const r=await invoke(f);
  assert.equal(r.status,200);
  assert.equal(state.post,before+1);
  assert.equal(f.calls.select,0);
});
test('BOOK24: opt-in D1 mode OFF allows legacy Edge claim only after read',async()=>{
  const f=fixture({mode:'OFF'}),before=state.post;
  const r=await invoke(f);
  assert.equal(r.status,200);
  assert.equal(state.post,before+1);
  assert.equal(f.calls.select,1);
  assert.equal(f.calls.mutate,0);
});
test('BOOK24: opt-in D1 SHADOW allows legacy Edge completion',async()=>{
  const f=fixture({mode:'SHADOW'}),before=state.post;
  const r=await invoke(f,{op:'complete'});
  assert.equal(r.status,200);
  assert.equal(state.post,before+1);
  assert.equal(f.calls.select,1);
});
test('BOOK24: D1 CANARY blocks Edge claim before any Google request',async()=>{
  const f=fixture({mode:'CANARY'}),before=state.post;
  const r=await invoke(f);
  assert.equal(r.status,409);
  assert.equal(r.body.code,'OPERATOR_TASK_D1_WRITER_CONFLICT');
  assert.equal(state.post,before);
  assert.equal(f.calls.select,1);
});
test('BOOK24: D1 GENERAL blocks Edge complete before any Google request',async()=>{
  const f=fixture({mode:'GENERAL'}),before=state.post;
  const r=await invoke(f,{op:'complete'});
  assert.equal(r.status,409);
  assert.equal(r.body.code,'OPERATOR_TASK_D1_WRITER_CONFLICT');
  assert.equal(state.post,before);
});
test('BOOK24: missing D1 binding fails closed only after owner opt-in',async()=>{
  const f=fixture({missingDb:true}),before=state.post;
  const r=await invoke(f);
  assert.equal(r.status,503);
  assert.equal(r.body.code,'OPERATOR_TASK_D1_AUTHORITY_UNKNOWN');
  assert.equal(state.post,before);
});
test('BOOK24: absent D1 control record blocks Google mutation',async()=>{
  const f=fixture({missingRow:true}),before=state.post;
  const r=await invoke(f);
  assert.equal(r.status,503);
  assert.equal(state.post,before);
});
test('BOOK24: D1 read failure blocks Google mutation with no detail leakage',async()=>{
  const f=fixture({dbThrows:true}),before=state.post;
  const r=await invoke(f,{op:'complete'});
  assert.equal(r.status,503);
  assert.equal(r.body.code,'OPERATOR_TASK_D1_AUTHORITY_UNKNOWN');
  assert.doesNotMatch(JSON.stringify(r.body),/BOOK24_FAKE_D1_FAILURE|SELECT|DB/);
  assert.equal(state.post,before);
});
test('BOOK24: unknown or malformed D1 mode fails closed',async()=>{
  for(const mode of ['','INVALID','CANARY_OFF']){
    const f=fixture({mode}),before=state.post;
    const r=await invoke(f);
    assert.equal(r.status,503);
    assert.equal(state.post,before);
  }
});
test('BOOK24: READONLY status is unaffected by conflicting D1 writer',async()=>{
  const f=fixture({mode:'GENERAL'}),before=state.post;
  const r=await invoke(f,{op:'status'});
  assert.equal(r.status,200);
  assert.equal(f.calls.select,0);
  assert.equal(state.post,before+1);
});
test('BOOK24: failed authentication rejects before D1 read and Google',async()=>{
  const f=fixture({mode:'OFF'}),before=state.post;
  const r=await invoke(f,{bearer:'not-valid'});
  assert.equal(r.status,401);
  assert.equal(f.calls.select,0);
  assert.equal(state.post,before);
});
test('BOOK24: missing idempotency key rejects before D1 read and Google',async()=>{
  const f=fixture({mode:'OFF'}),before=state.post;
  const r=await invoke(f,{key:''});
  assert.equal(r.status,400);
  assert.equal(r.body.code,'IDEMPOTENCY_KEY_REQUIRED');
  assert.equal(f.calls.select,0);
  assert.equal(state.post,before);
});
test('BOOK24: explicit gate helper reports only mode / no customer data',async()=>{
  const f=fixture({mode:'OFF'});
  const r=await checkOperatorEdgeD1WriterConflictV1(f.env);
  assert.deepEqual(r,{allowed:true,checked:true,reason:'OPERATOR_TASK_D1_NON_WRITER',d1Mode:'OFF'});
  assert.equal(f.calls.select,1);
  assert.equal(f.calls.mutate,0);
});
test('BOOK24: OPTIONS never accesses D1 or Apps Script',async()=>{
  const f=fixture({mode:'GENERAL'}),before=state.post;
  const res=await handleOperatorTaskEdgeRequest(new Request(
    'https://fixture.invalid/v1/operator/tasks/claim-next',{
      method:'OPTIONS',headers:{Origin:'https://fawakhry.github.io'}
    }),f.env);
  assert.equal(res.status,204);
  assert.equal(f.calls.select,0);
  assert.equal(state.post,before);
});

test('BOOK24: two concurrent Edge claims are both rejected when D1 is a writer',async()=>{
  const f=fixture({mode:'GENERAL'}),before=state.post;
  const [first,second]=await Promise.all([
    invoke(f,{op:'claim',key:'FAKE_OPERATOR_WAEL_REQUEST'}),
    invoke(f,{op:'claim',key:'FAKE_OPERATOR_GABER_REQUEST'})
  ]);
  assert.equal(first.status,409);
  assert.equal(second.status,409);
  assert.equal(first.body.code,'OPERATOR_TASK_D1_WRITER_CONFLICT');
  assert.equal(second.body.code,'OPERATOR_TASK_D1_WRITER_CONFLICT');
  assert.equal(f.calls.select,2);
  assert.equal(f.calls.mutate,0);
  assert.equal(state.post,before,'neither concurrent claim reaches Google');
});
