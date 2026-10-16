// BOOK24: Apps Script single-writer election in VM only. No Google calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const wq=fs.readFileSync('work-queue-backend-v1.gs','utf8');
const ot=fs.readFileSync('operator-task-workflow-v2.gs','utf8');
const ENABLE='TRENDOS_TASK_SCRIPT_SINGLE_WRITER_GUARD_V1_ENABLED';
const OWNER='TRENDOS_TASK_SCRIPT_WRITER_V1';
function sandbox({enabled,owner,propError=false,lockAdapter=false,otherProps={}}={}){
  const props={...otherProps};
  if(enabled!==undefined)props[ENABLE]=enabled;
  if(owner!==undefined)props[OWNER]=owner;
  const state={props,lockHeld:false,enters:0,exits:0,executions:[],propertyReads:[]};
  const ctx={console,Date,Math,Number,String,Object,Array,JSON,Error,
    PropertiesService:{
      getScriptProperties(){
        if(propError)throw Error('FAKE_PROPERTIES_UNAVAILABLE');
        return {getProperty(name){
          state.propertyReads.push(name);
          return Object.prototype.hasOwnProperty.call(props,name)?props[name]:null;
        }};
      }
    },
    LockService:{
      getScriptLock(){
        return {
          waitLock(ms){assert.equal(ms,30000);assert.equal(state.lockHeld,false);
            state.lockHeld=true;state.enters++;},
          releaseLock(){assert.equal(state.lockHeld,true);state.lockHeld=false;state.exits++;}
        };
      }
    }
  };
  if(lockAdapter)ctx.trendosWithLock_=(scope,fn,ms)=>{
    assert.equal(scope,'script');assert.equal(ms,30000);assert.equal(state.lockHeld,false);
    state.lockHeld=true;state.enters++;
    try{return fn();}finally{state.lockHeld=false;state.exits++;}
  };
  vm.createContext(ctx);
  vm.runInContext(wq+'\n'+ot+`
globalThis.__BOOK24_TEST__={
  work:()=>wqWithLockV1_(function(){if(!globalThis.__BOOK24_STATE__.lockHeld)throw Error('OUTSIDE_LOCK_WQ');
    globalThis.__BOOK24_STATE__.executions.push('WORK_QUEUE_V1');return 'WORK_QUEUE_V1';}),
  operator:()=>otWithLockV2_(function(){if(!globalThis.__BOOK24_STATE__.lockHeld)throw Error('OUTSIDE_LOCK_OT');
    globalThis.__BOOK24_STATE__.executions.push('OPERATOR_TASK_V2');return 'OPERATOR_TASK_V2';}),
  wqGuard:wqRequireScriptWriterV1_,otGuard:otRequireScriptWriterV2_
};`,ctx);
  ctx.__BOOK24_STATE__=state;
  return {ctx,state,call:ctx.__BOOK24_TEST__};
}
function exactlyOneSelected({enabled,owner,expected}){
  const f=sandbox({enabled,owner});
  let outcomes=[];
  for(const name of ['work','operator']){
    try{outcomes.push([name,f.call[name](),true]);}
    catch(e){outcomes.push([name,String(e.message),false]);}
  }
  assert.deepEqual(outcomes.filter(x=>x[2]).map(x=>x[1]),expected);
  assert.deepEqual(f.state.executions,expected);
  assert.equal(f.state.enters,2);
  assert.equal(f.state.exits,2);
  assert.equal(f.state.lockHeld,false);
}
test('BOOK24: default-off selector preserves existing Work Queue and Operator writes',()=>{
  const f=sandbox();
  assert.equal(f.call.work(),'WORK_QUEUE_V1');
  assert.equal(f.call.operator(),'OPERATOR_TASK_V2');
  assert.deepEqual(f.state.executions,['WORK_QUEUE_V1','OPERATOR_TASK_V2']);
  assert.equal(f.state.exits,2);
});
test('BOOK24: flag=false allows legacy behavior; does not require writer property',()=>{
  const f=sandbox({enabled:'false'});
  f.call.work();f.call.operator();
  assert.equal(f.state.executions.length,2);
});
test('BOOK24: Work Queue owner denies Operator V2 inside same shared lock',()=>{
  exactlyOneSelected({enabled:'true',owner:'WORK_QUEUE_V1',expected:['WORK_QUEUE_V1']});
});
test('BOOK24: Operator V2 owner denies Work Queue V1 inside shared lock',()=>{
  exactlyOneSelected({enabled:'yes',owner:'OPERATOR_TASK_V2',expected:['OPERATOR_TASK_V2']});
});
test('BOOK24: D1 selection denies BOTH legacy Apps Script writers',()=>{
  exactlyOneSelected({enabled:'on',owner:'D1',expected:[]});
});
test('BOOK24: NONE/missing/invalid selected owner fail closed',()=>{
  for(const owner of [undefined,'','NONE','UNKNOWN','WORK_QUEUE_V1,OPERATOR_TASK_V2']){
    exactlyOneSelected({enabled:'1',owner,expected:[]});
  }
});
test('BOOK24: case-insensitive owner value is normalized but cannot select two',()=>{
  exactlyOneSelected({enabled:'true',owner:'operator_task_v2',expected:['OPERATOR_TASK_V2']});
});
test('BOOK24: unavailable Script Properties denies both writes, never bypasses selector',()=>{
  const f=sandbox({enabled:'true',owner:'WORK_QUEUE_V1',propError:true});
  assert.throws(()=>f.call.work(),/BOOK24_SCRIPT_WRITER_GUARD_UNAVAILABLE/);
  assert.throws(()=>f.call.operator(),/BOOK24_SCRIPT_WRITER_GUARD_UNAVAILABLE/);
  assert.equal(f.state.executions.length,0);
  assert.equal(f.state.exits,2);
});
test('BOOK24: owner read is evaluated AFTER script lock acquisition, not at startup',()=>{
  const f=sandbox({enabled:'true',owner:'WORK_QUEUE_V1'});
  f.call.work();
  f.state.props[OWNER]='OPERATOR_TASK_V2';
  assert.throws(()=>f.call.work(),/BOOK24_WORK_QUEUE_NOT_SELECTED_WRITER/);
  f.call.operator();
  assert.deepEqual(f.state.executions,['WORK_QUEUE_V1','OPERATOR_TASK_V2']);
  assert.equal(f.state.exits,3);
});
test('BOOK24: shared trendosWithLock_ helper cannot bypass per-lane owner check',()=>{
  const f=sandbox({enabled:'true',owner:'WORK_QUEUE_V1',lockAdapter:true});
  assert.equal(f.call.work(),'WORK_QUEUE_V1');
  assert.throws(()=>f.call.operator(),/BOOK24_OPERATOR_V2_NOT_SELECTED_WRITER/);
  assert.deepEqual(f.state.executions,['WORK_QUEUE_V1']);
  assert.equal(f.state.exits,2);
});
test('BOOK24: writer flag is read within the locked callback of each mutating lane',()=>{
  for(const legacy of ['work','operator']){
    const f=sandbox({enabled:'true',owner:'D1'});
    assert.throws(()=>f.call[legacy](),/BOOK24_.*_NOT_SELECTED_WRITER/);
    assert.equal(f.state.lockHeld,false);
    assert.deepEqual(f.state.propertyReads.slice(0,2),[ENABLE,OWNER]);
    assert.equal(f.state.executions.length,0);
  }
});
test('BOOK24: all task-changing entrypoints use guarded lock; read-only calls stay outside',()=>{
  const entrypoints=[
    'wqClaimNextV1_','wqClaimFlyV1_','wqStartTaskV1_','wqPauseTaskV1_',
    'wqResumeTaskV1_','wqCompleteTaskV1_','wqPressStartV1_','wqPressStopV1_',
    'wqManagerReleaseV1_'
  ];
  for(let i=0;i<entrypoints.length;i++){
    const from=wq.indexOf('function '+entrypoints[i]+'(');
    const to=i+1<entrypoints.length?wq.indexOf('function '+entrypoints[i+1]+'(',from+1):wq.length;
    assert.ok(from>=0,entrypoints[i]);
    assert.match(wq.slice(from,to),/wqWithLockV1_\(function\(\)\{/);
  }
  for(const name of ['otClaimNextV2_','otCompleteTaskV2_']){
    assert.match(ot.slice(ot.indexOf('function '+name+'(')),/return otWithLockV2_\(function\(\)\{/);
  }
  assert.ok(ot.includes("if(op==='status')return otStatusV2_(auth)"));
  assert.ok(wq.includes("if(op==='status')return wqStatusV1_(auth)"));
});
test('BOOK24: separate Script Properties stores do NOT prove global writer exclusivity',()=>{
  // Explicit negative control: even with the opt-in selector, two different
  // Apps Script projects could each select themselves. Needs deployment audit.
  const separateWq=sandbox({enabled:'true',owner:'WORK_QUEUE_V1'});
  const separateOt=sandbox({enabled:'true',owner:'OPERATOR_TASK_V2'});
  assert.equal(separateWq.call.work(),'WORK_QUEUE_V1');
  assert.equal(separateOt.call.operator(),'OPERATOR_TASK_V2');
  assert.equal(separateWq.state.executions.length+separateOt.state.executions.length,2);
});

test('BOOK24: misspelled enabled property blocks BOTH writers instead of disabling safety',()=>{
  for(const enabled of ['tru','enable','onx','1 ','نعمم','TRUEE','FALSEE','unknown']){
    const f=sandbox({enabled,owner:'WORK_QUEUE_V1'});
    assert.throws(()=>f.call.work(),/BOOK24_SCRIPT_WRITER_GUARD_VALUE_INVALID/,enabled);
    assert.throws(()=>f.call.operator(),/BOOK24_SCRIPT_WRITER_GUARD_VALUE_INVALID/,enabled);
    assert.deepEqual(f.state.executions,[]);
    assert.equal(f.state.exits,2);
    assert.deepEqual(f.state.propertyReads,[ENABLE,ENABLE],
      'bad toggle must deny before reading selected writer');
  }
});
test('BOOK24: explicitly disabled values remain backwards compatible',()=>{
  for(const enabled of [undefined,'','0','false','FALSE','no','off',' Off ']){
    const f=sandbox({enabled,owner:'D1'});
    assert.equal(f.call.work(),'WORK_QUEUE_V1');
    assert.equal(f.call.operator(),'OPERATOR_TASK_V2');
    assert.deepEqual(f.state.executions,['WORK_QUEUE_V1','OPERATOR_TASK_V2']);
  }
});
test('BOOK24: valid owner toggle spellings remain recognized by both lanes',()=>{
  for(const enabled of ['1','true','YES','on','enabled','نعم']){
    const f=sandbox({enabled,owner:'OPERATOR_TASK_V2'});
    assert.throws(()=>f.call.work(),/BOOK24_WORK_QUEUE_NOT_SELECTED_WRITER/);
    assert.equal(f.call.operator(),'OPERATOR_TASK_V2');
    assert.deepEqual(f.state.executions,['OPERATOR_TASK_V2']);
  }
});
test('BOOK24: new owner selector cannot be bypassed by a bad toggle after owner flip',()=>{
  const f=sandbox({enabled:'1',owner:'WORK_QUEUE_V1'});
  f.call.work();
  f.state.props[ENABLE]='treu';
  f.state.props[OWNER]='OPERATOR_TASK_V2';
  assert.throws(()=>f.call.work(),/BOOK24_SCRIPT_WRITER_GUARD_VALUE_INVALID/);
  assert.throws(()=>f.call.operator(),/BOOK24_SCRIPT_WRITER_GUARD_VALUE_INVALID/);
  assert.deepEqual(f.state.executions,['WORK_QUEUE_V1']);
  assert.equal(f.state.enters,3);
  assert.equal(f.state.exits,3);
});
