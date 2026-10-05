import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  operatorTaskMutationGateV1,
  claimNextOperatorTaskV1,
  completeOperatorTaskV1
} from '../core/operator-task-authority-v1.mjs';

const migration=fs.readFileSync('autonomous-printshop/migrations/0020_operator_task_authority_v1.sql','utf8');
assert.match(migration,/mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(migration,/'OFF','SHADOW','CANARY','GENERAL'/);
assert.match(migration,/idx_operator_tasks_one_active_operator/);
assert.match(migration,/idx_operator_tasks_one_active_line/);
assert.match(migration,/WHERE task_type = 'ORDINARY' AND status = 'ACTIVE'/);
assert.match(migration,/OPERATOR_TASK_EVENTS_APPEND_ONLY/);
assert.match(migration,/OPERATOR_TASK_CONTROL_EVENTS_APPEND_ONLY/);
assert.match(migration,/trg_operator_task_control_audit/);
assert.doesNotMatch(migration,/\bDROP\s+TABLE\b/i);
assert.doesNotMatch(migration,/\bALTER\s+TABLE\b/i);

assert.deepEqual(
  operatorTaskMutationGateV1({mode:'OFF'},'wael'),
  {allowed:false,shadow:false,reason:'OPERATOR_TASK_CONTROL_OFF'}
);
assert.equal(operatorTaskMutationGateV1({mode:'SHADOW'},'wael').shadow,true);
assert.equal(operatorTaskMutationGateV1({mode:'CANARY',canaryOperatorId:'gaber'},'wael').allowed,false);
assert.equal(operatorTaskMutationGateV1({mode:'CANARY',canaryOperatorId:'wael'},'wael').allowed,true);
assert.equal(operatorTaskMutationGateV1({mode:'GENERAL'},'wael').allowed,true);

function fakeDb(config={}){
  const state={
    control:config.control||{mode:'OFF',canaryOperatorId:'',epoch:1,updatedBy:'test',changeReason:'test'},
    active:config.active||null,
    byClaim:config.byClaim||null,
    byId:{...(config.byId||{})},
    batchCalls:0,
    insertedTask:null,
    completedTask:null
  };
  return {
    state,
    prepare(sql){
      return {
        sql,
        args:[],
        bind(...args){
          const bound={
            sql,args,
            async first(){
              if(sql.includes('FROM operator_task_control')) return state.control;
              if(sql.includes('WHERE claim_idempotency_key = ?')) return state.byClaim;
              if(sql.includes("task_type = 'ORDINARY'")&&sql.includes("status = 'ACTIVE'")) return state.active;
              if(sql.includes('WHERE task_id = ?')) return state.byId[args[0]]||state.completedTask||state.insertedTask||null;
              return null;
            }
          };
          return bound;
        },
        async first(){
          if(sql.includes('FROM operator_task_control')) return state.control;
          return null;
        }
      };
    },
    async batch(statements){
      state.batchCalls+=1;
      const first=statements[0];
      if(first.sql.includes('INSERT OR IGNORE INTO operator_tasks')){
        const [taskId,orderId,lineId,department,operatorId,priority,due,sourceVersion,sourceHash,claimKey]=first.args;
        state.insertedTask={
          taskId,taskType:'ORDINARY',orderId,lineId,department,operatorId,status:'ACTIVE',
          prioritySnapshot:priority,dueAtSnapshot:due,sourceDataVersion:sourceVersion,
          sourceInputHash:sourceHash,claimIdempotencyKey:claimKey
        };
        state.byId[taskId]=state.insertedTask;
        return [{meta:{changes:1}},{meta:{changes:1}}];
      }
      if(first.sql.includes('UPDATE operator_tasks')){
        const [completionKey,resultJson,taskId,operatorId]=first.args;
        const current=state.byId[taskId];
        if(!current||current.operatorId!==operatorId||current.status!=='ACTIVE') return [{meta:{changes:0}},{meta:{changes:0}}];
        state.completedTask={...current,status:'COMPLETED',completionIdempotencyKey:completionKey,completionResultJson:resultJson};
        state.byId[taskId]=state.completedTask;
        return [{meta:{changes:1}},{meta:{changes:1}}];
      }
      return [{meta:{changes:0}},{meta:{changes:0}}];
    }
  };
}

const rows=[
  {orderId:'20',lineId:'20-1',department:'طباعة',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-06'},
  {orderId:'10',lineId:'10-1',department:'طباعة',priority:'عاجل',status:'طلب جديد',expectedDelivery:'2026-10-07'}
];

let db=fakeDb({control:{mode:'OFF',epoch:1}});
let out=await claimNextOperatorTaskV1(db,{
  operatorId:'wael',department:'طباعة',rows,claimIdempotencyKey:'req-1'
},{idFactory:p=>p+'-1'});
assert.equal(out.mutated,false);
assert.equal(out.reason,'OPERATOR_TASK_CONTROL_OFF');
assert.equal(out.recommendedTask.orderId,'10');
assert.equal(db.state.batchCalls,0);

db=fakeDb({control:{mode:'SHADOW',epoch:2}});
out=await claimNextOperatorTaskV1(db,{
  operatorId:'wael',department:'طباعة',rows,claimIdempotencyKey:'req-2'
},{idFactory:p=>p+'-2'});
assert.equal(out.mutated,false);
assert.equal(out.shadow,true);
assert.equal(out.reason,'OPERATOR_TASK_SHADOW_NO_MUTATION');
assert.equal(db.state.batchCalls,0);

db=fakeDb({control:{mode:'CANARY',canaryOperatorId:'gaber',epoch:3}});
out=await claimNextOperatorTaskV1(db,{
  operatorId:'wael',department:'طباعة',rows,claimIdempotencyKey:'req-3'
},{idFactory:p=>p+'-3'});
assert.equal(out.mutated,false);
assert.equal(out.reason,'OPERATOR_TASK_CANARY_OPERATOR_MISMATCH');

db=fakeDb({control:{mode:'GENERAL',epoch:4}});
out=await claimNextOperatorTaskV1(db,{
  operatorId:'wael',department:'طباعة',rows,claimIdempotencyKey:'req-4',
  sourceDataVersion:'v-data-1',sourceInputHash:'hash-1'
},{idFactory:p=>p+'-4'});
assert.equal(out.mutated,true);
assert.equal(out.reason,'OPERATOR_TASK_CLAIMED');
assert.equal(out.task.orderId,'10');
assert.equal(out.task.operatorId,'wael');
assert.equal(db.state.batchCalls,1);

const activeTask={taskId:'task-existing',taskType:'ORDINARY',orderId:'99',lineId:'99-1',department:'طباعة',operatorId:'wael',status:'ACTIVE'};
db=fakeDb({control:{mode:'GENERAL'},active:activeTask});
out=await claimNextOperatorTaskV1(db,{
  operatorId:'wael',department:'طباعة',rows,claimIdempotencyKey:'req-5'
});
assert.equal(out.task.taskId,'task-existing');
assert.equal(out.reason,'OPERATOR_TASK_ACTIVE_EXISTS');
assert.equal(db.state.batchCalls,0);

const active={taskId:'task-1',taskType:'ORDINARY',orderId:'10',lineId:'10-1',department:'طباعة',operatorId:'wael',status:'ACTIVE'};
db=fakeDb({byId:{'task-1':active}});
out=await completeOperatorTaskV1(db,{
  taskId:'task-1',operatorId:'wael',completionIdempotencyKey:'done-1',
  result:{quality:'PASS'}
},{idFactory:p=>p+'-done'});
assert.equal(out.success,true);
assert.equal(out.mutated,true);
assert.equal(out.task.status,'COMPLETED');
assert.equal(out.task.completionIdempotencyKey,'done-1');

db=fakeDb({byId:{'task-2':{...active,taskId:'task-2',status:'COMPLETED',completionIdempotencyKey:'done-2'}}});
out=await completeOperatorTaskV1(db,{
  taskId:'task-2',operatorId:'wael',completionIdempotencyKey:'done-2'
});
assert.equal(out.idempotent,true);
assert.equal(out.mutated,false);
assert.equal(db.state.batchCalls,0);

console.log('AUTONOMOUS_PRINTSHOP_OPERATOR_TASK_AUTHORITY_V1=PASS');
console.log('CONTROL_DEFAULT=OFF');
console.log('SHADOW_MUTATION=NO');
console.log('ONE_ACTIVE_OPERATOR=DB_UNIQUE_GUARD');
console.log('ONE_ACTIVE_LINE=DB_UNIQUE_GUARD');
console.log('CLAIM_START=ATOMIC_D1_BATCH_FOUNDATION');
console.log('COMPLETE=IDEMPOTENT_D1_BATCH_FOUNDATION');
