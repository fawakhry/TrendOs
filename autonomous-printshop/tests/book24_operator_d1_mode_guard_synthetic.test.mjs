// BOOK24-TASK-AUTHORITY: isolated D1 mock, no accounts, no hardware or Google.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claimNextOperatorTaskV1,
  completeOperatorTaskV1
} from '../core/operator-task-authority-v1.mjs';

const fakeRows=[{
  orderId:'BOOK24-FAKE-ORDER',lineId:'BOOK24-FAKE-LINE',
  department:'طباعة',priority:'عاجل',status:'طلب جديد',
  expectedDelivery:'2026-10-16'
}];
const active={
  taskId:'BOOK24-FAKE-TASK',taskType:'ORDINARY',orderId:'BOOK24-FAKE-ORDER',
  lineId:'BOOK24-FAKE-LINE',department:'طباعة',operatorId:'wael',
  status:'ACTIVE',claimIdempotencyKey:'BOOK24-FAKE-CLAIM'
};
function fixture({mode='OFF',canaryOperatorId='',task={...active},mutateModeAtBatch=null}={}){
  const state={
    control:{mode,canaryOperatorId,epoch:1},
    tasks:new Map(task?[[task.taskId,{...task}]]:[]),
    batchCalls:0,batchWrites:0,controlReads:0,sql:[],
    mutateModeAtBatch
  };
  const db={
    prepare(sql){
      state.sql.push(sql);
      return {
        sql,args:[],
        bind(...args){this.args=args;return this;},
        async first(){
          if(sql.includes('FROM operator_task_control')){state.controlReads++;return state.control;}
          if(sql.includes('WHERE claim_idempotency_key = ?')){
            return [...state.tasks.values()].find(x=>x.claimIdempotencyKey===this.args[0])||null;
          }
          if(sql.includes("task_type = 'ORDINARY'")&&sql.includes("status = 'ACTIVE'")){
            return [...state.tasks.values()].find(x=>x.operatorId===this.args[0]&&x.status==='ACTIVE')||null;
          }
          if(sql.includes('WHERE task_id = ?'))return state.tasks.get(this.args[0])||null;
          throw Error('BOOK24_UNEXPECTED_SQL_QUERY:'+sql.slice(0,80));
        }
      };
    },
    async batch(statements){
      state.batchCalls++;
      if(state.mutateModeAtBatch){
        state.control.mode=state.mutateModeAtBatch;
        state.mutateModeAtBatch=null;
      }
      const stmt=statements[0],sql=stmt.sql;
      const opId=sql.includes('INSERT OR IGNORE INTO operator_tasks')?stmt.args[10]:stmt.args[4];
      const allowed=state.control.mode==='GENERAL'||
        (state.control.mode==='CANARY'&&state.control.canaryOperatorId===opId);
      if(!allowed)return [{meta:{changes:0}},{meta:{changes:0}}];
      if(sql.includes('INSERT OR IGNORE INTO operator_tasks')){
        const [taskId,orderId,lineId,department,operatorId,priority,due,sourceVersion,sourceHash,claimKey]=stmt.args;
        if([...state.tasks.values()].some(x=>x.claimIdempotencyKey===claimKey||x.status==='ACTIVE'&&(x.operatorId===operatorId||x.lineId===lineId)))return [{meta:{changes:0}},{meta:{changes:0}}];
        state.tasks.set(taskId,{taskId,orderId,lineId,department,operatorId,
          taskType:'ORDINARY',status:'ACTIVE',claimIdempotencyKey:claimKey});
        state.batchWrites++;
        return [{meta:{changes:1}},{meta:{changes:1}}];
      }
      if(sql.includes('UPDATE operator_tasks')){
        const [completionKey,payload,taskId,operatorId]=stmt.args;
        const current=state.tasks.get(taskId);
        if(!current||current.operatorId!==operatorId||current.status!=='ACTIVE')return [{meta:{changes:0}},{meta:{changes:0}}];
        state.tasks.set(taskId,{...current,status:'COMPLETED',completionIdempotencyKey:completionKey,completionResultJson:payload});
        state.batchWrites++;
        return [{meta:{changes:1}},{meta:{changes:1}}];
      }
      throw Error('BOOK24_UNEXPECTED_MUTATION');
    }
  };
  return {db,state};
}
const done=(db,key='BOOK24-FAKE-COMPLETE')=>completeOperatorTaskV1(db,{
  taskId:'BOOK24-FAKE-TASK',operatorId:'wael',
  completionIdempotencyKey:key,result:{synthetic:true}
},{idFactory:p=>p+'-BOOK24-FAKE'});
const claim=(db,key='BOOK24-FAKE-CLAIM-NEXT')=>claimNextOperatorTaskV1(db,{
  operatorId:'wael',department:'طباعة',rows:fakeRows,
  claimIdempotencyKey:key,sourceDataVersion:'fake-v1',sourceInputHash:'fake-hash'
},{idFactory:p=>p+'-BOOK24-FAKE'});
test('BOOK24: OFF denies completion of ACTIVE existing task before D1 batch',async()=>{
  const f=fixture();
  await assert.rejects(done(f.db),/OPERATOR_TASK_CONTROL_OFF/);
  assert.equal(f.state.batchCalls,0);
  assert.equal(f.state.tasks.get(active.taskId).status,'ACTIVE');
});
test('BOOK24: SHADOW forbids completion, stays observational only',async()=>{
  const f=fixture({mode:'SHADOW'});
  await assert.rejects(done(f.db),/OPERATOR_TASK_SHADOW_NO_MUTATION/);
  assert.equal(f.state.batchCalls,0);
});
test('BOOK24: CANARY wrong operator cannot complete even owned active task',async()=>{
  const f=fixture({mode:'CANARY',canaryOperatorId:'gaber'});
  await assert.rejects(done(f.db),/OPERATOR_TASK_CANARY_OPERATOR_MISMATCH/);
  assert.equal(f.state.batchCalls,0);
});
test('BOOK24: CANARY exact operator may complete and same-key replay is no-write',async()=>{
  const f=fixture({mode:'CANARY',canaryOperatorId:'wael'});
  const result=await done(f.db);
  assert.equal(result.mutated,true);
  assert.equal(f.state.batchWrites,1);
  f.state.control.mode='OFF';
  const replay=await done(f.db);
  assert.equal(replay.idempotent,true);
  assert.equal(replay.mutated,false);
  assert.equal(f.state.batchCalls,1);
});
test('BOOK24: GENERAL may complete only once for its owner',async()=>{
  const f=fixture({mode:'GENERAL'});
  const res=await done(f.db);
  assert.equal(res.mutated,true);
  assert.equal(f.state.batchWrites,1);
  await assert.rejects(done(f.db,'BOOK24-DIFFERENT-COMPLETE'),/OPERATOR_TASK_ALREADY_COMPLETED_DIFFERENT_KEY/);
  assert.equal(f.state.batchWrites,1);
});
test('BOOK24: preflight GENERAL to OFF race denies completion inside SQL guard',async()=>{
  const f=fixture({mode:'GENERAL',mutateModeAtBatch:'OFF'});
  await assert.rejects(done(f.db),/OPERATOR_TASK_COMPLETION_CONFLICT/);
  assert.equal(f.state.batchCalls,1);
  assert.equal(f.state.batchWrites,0);
  assert.equal(f.state.tasks.get(active.taskId).status,'ACTIVE');
  assert.ok(f.state.sql.some(x=>x.includes('AND EXISTS (')&&x.includes("mode = 'GENERAL'")));
});
test('BOOK24: claim mode GENERAL to SHADOW race cannot insert task',async()=>{
  const f=fixture({mode:'GENERAL',task:null,mutateModeAtBatch:'SHADOW'});
  const x=await claim(f.db);
  assert.equal(x.success,false);
  assert.equal(x.mutated,false);
  assert.equal(f.state.tasks.size,0);
  assert.equal(f.state.batchWrites,0);
  assert.ok(f.state.sql.some(x=>x.includes('INSERT OR IGNORE INTO operator_tasks')&&x.includes('WHERE EXISTS')));
});
test('BOOK24: no control mode allows ordinary task claim in OFF or SHADOW',async()=>{
  for(const mode of ['OFF','SHADOW']){
    const f=fixture({mode,task:null});
    const x=await claim(f.db);
    assert.equal(x.mutated,false);
    assert.equal(f.state.batchCalls,0);
  }
});
test('BOOK24: CANARY wrong operator and GENERAL correctness for claim',async()=>{
  const wrong=fixture({mode:'CANARY',canaryOperatorId:'gaber',task:null});
  const reject=await claim(wrong.db);
  assert.equal(reject.mutated,false);
  assert.equal(wrong.state.batchCalls,0);
  const valid=fixture({mode:'GENERAL',task:null});
  const ok=await claim(valid.db);
  assert.equal(ok.mutated,true);
  assert.equal(valid.state.batchWrites,1);
});
test('BOOK24: mode-invalid fails closed on active completion',async()=>{
  const f=fixture({mode:'INVALID'});
  await assert.rejects(done(f.db),/OPERATOR_TASK_CONTROL_INVALID/);
  assert.equal(f.state.batchCalls,0);
});
