import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  recordEmployeeBlockerEventV1
} from '../core/employee-blocker-event-writer-v1.mjs';

const worker=fs.readFileSync('autonomous-printshop/employee-supervisor/worker.mjs','utf8');
const config=fs.readFileSync('autonomous-printshop/employee-supervisor/wrangler.toml','utf8');

assert.match(config,/^name = "autonomous-printshop-employee-supervisor"$/m);
assert.match(config,/^binding = "TRENDOS"$/m);
assert.match(config,/^service = "trendos-d1-api"$/m);
assert.match(config,/^database_name = "trendos-main"$/m);
assert.match(worker,/AUTH_PATH='\/v1\/employee\/auth\/session'/);
assert.match(worker,/TRENDOS\.fetch/);
assert.match(worker,/AUTONOMOUS_EMPLOYEE_BLOCKER_EVENTS_ONLY/);
assert.match(worker,/EMPLOYEE_SUPERVISOR_BLOCKER_SERVICE/);
assert.match(worker,/path==='\/blockers\/report'/);
assert.match(worker,/path==='\/blockers\/acknowledge'/);
assert.match(worker,/path==='\/blockers\/resolve'/);
assert.match(worker,/path==='\/blockers\/my-open'/);
assert.match(worker,/path==='\/blockers\/summary'/);
assert.match(worker,/businessWrites:false/);
assert.match(worker,/employeeAssignment:false/);
assert.doesNotMatch(worker,/console\.log\([^\n]*(token|authorization)/i);

const writes=[];
function fakeDb(mode='SHADOW',identity={imported:0,native:1},existing=null){
  return {
    prepare(sql){
      return {
        bind(...args){
          return {
            async first(){
              if(sql.includes('autonomous_employee_supervisor_control'))return {mode,epoch:2};
              if(sql.includes('WHERE idempotency_key=?'))return existing;
              if(sql.includes('employee_core_lines_v1')&&sql.includes('t12_prod_lines'))return identity;
              if(sql.includes('employee_core_lines_v1')&&sql.includes('t12_prod_orders'))return identity;
              return null;
            },
            async run(){
              writes.push({sql,args});
              return {meta:{changes:1}};
            }
          };
        },
        async first(){
          if(sql.includes('autonomous_employee_supervisor_control'))return {mode,epoch:2};
          return null;
        }
      };
    }
  };
}

const input={
  eventId:'EV-TEST',
  blockerId:'BLK-TEST',
  eventType:'REPORTED',
  reasonCode:'MACHINE_BREAKDOWN',
  operatorId:'operator-a',
  department:'ليزر',
  orderId:'100',
  lineId:'100-1',
  detailText:'machine stopped',
  sourceKind:'EMPLOYEE',
  actorId:'operator-a',
  idempotencyKey:'idem-test',
  occurredAtMs:1000
};

await assert.rejects(()=>recordEmployeeBlockerEventV1(fakeDb('OFF'),input),/EMPLOYEE_SUPERVISOR_CONTROL_OFF/);

writes.length=0;
const out=await recordEmployeeBlockerEventV1(fakeDb('SHADOW'),input);
assert.equal(out.success,true);
assert.equal(out.inserted,true);
assert.equal(out.idempotentReplay,false);
assert.equal(out.control.mode,'SHADOW');
assert.equal(writes.length,1);
assert.match(writes[0].sql,/INSERT OR IGNORE INTO autonomous_employee_blocker_events/);
assert.doesNotMatch(writes[0].sql,/t12_prod_|employee_accounting_|operator_tasks|autonomy_events/);

await assert.rejects(
  ()=>recordEmployeeBlockerEventV1(fakeDb('SHADOW',{imported:0,native:0}),input),
  /BLOCKER_LINE_NOT_FOUND/
);

writes.length=0;
const replayExisting={
  eventId:'EV-ORIGINAL',
  blockerId:'BLK-ORIGINAL',
  eventType:'REPORTED',
  reasonCode:'MACHINE_BREAKDOWN',
  operatorId:'operator-a',
  department:'ليزر',
  orderId:'100',
  lineId:'100-1',
  detailText:'machine stopped',
  sourceKind:'EMPLOYEE',
  actorId:'operator-a',
  idempotencyKey:'idem-test',
  occurredAtMs:900
};
const replay=await recordEmployeeBlockerEventV1(fakeDb('OFF',{imported:0,native:0},replayExisting),{
  ...input,eventId:'EV-RETRY',blockerId:'BLK-RETRY',occurredAtMs:2000
});
assert.equal(replay.success,true);
assert.equal(replay.inserted,false);
assert.equal(replay.idempotentReplay,true);
assert.equal(replay.eventId,'EV-ORIGINAL');
assert.equal(replay.blockerId,'BLK-ORIGINAL');
assert.equal(writes.length,0);

await assert.rejects(
  ()=>recordEmployeeBlockerEventV1(fakeDb('SHADOW',{imported:1,native:0},replayExisting),{
    ...input,reasonCode:'MATERIAL_MISSING'
  }),
  /IDEMPOTENCY_PAYLOAD_MISMATCH/
);

console.log('EMPLOYEE_SUPERVISOR_SERVICE_V1=PASS');
console.log('AUTH=TRENDOS_NATIVE_SESSION_CONSUMER');
console.log('WRITE_AUTHORITY=AUTONOMOUS_EMPLOYEE_BLOCKER_EVENTS_ONLY');
console.log('ORDER_WRITE=NO');
console.log('LINE_WRITE=NO');
console.log('ACCOUNTING_WRITE=NO');
console.log('EMPLOYEE_ASSIGNMENT=NO');

console.log('IDEMPOTENT_REPLAY_RETURNS_ORIGINAL_IDS=PASS');
