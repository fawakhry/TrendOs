import assert from 'node:assert/strict';
import { recordMachineObservationV1 } from '../core/machine-observation-writer-v1.mjs';

function db({mode='SHADOW',registered=true}={}){
  let inserted=null;
  return {
    get inserted(){return inserted;},
    prepare(sql){
      if(sql.includes('FROM autonomous_machine_control')) return {async first(){return {mode};}};
      if(sql.includes('FROM autonomous_machines')) return {bind(){return {async first(){return registered?{machineId:'press-1',active:1}:null;}};}};
      if(sql.includes('INSERT OR IGNORE INTO autonomous_machine_observations')) return {
        bind(...args){inserted=args;return {async run(){return {meta:{changes:1}};}};}
      };
      throw new Error('unexpected sql');
    }
  };
}

const now=1800000000000;
let fake=db();
let out=await recordMachineObservationV1(fake,{
  observationId:'obs-1',machineId:'press-1',machineState:'READY',
  sourceKind:'OPERATOR_CHECK',sourceRef:'check-1',confidence:1,
  evidence:{directCheck:true},observedAtMs:now,expiresAtMs:now+10*60*1000
});
assert.equal(out.inserted,true);

await assert.rejects(()=>recordMachineObservationV1(db(),{
  observationId:'obs-2',machineId:'press-1',machineState:'READY',
  sourceKind:'SYSTEM',sourceRef:'no-fault',confidence:1,
  evidence:{directCheck:true},observedAtMs:now,expiresAtMs:now+10*60*1000
}),/MACHINE_READY_DIRECT_CHECK_REQUIRED/);

await assert.rejects(()=>recordMachineObservationV1(db(),{
  observationId:'obs-3',machineId:'press-1',machineState:'READY',
  sourceKind:'OPERATOR_CHECK',sourceRef:'check-3',confidence:1,
  evidence:{directCheck:false},observedAtMs:now,expiresAtMs:now+10*60*1000
}),/MACHINE_READY_DIRECT_CHECK_FLAG_REQUIRED/);

await assert.rejects(()=>recordMachineObservationV1(db(),{
  observationId:'obs-4',machineId:'press-1',machineState:'READY',
  sourceKind:'SELF_TEST',sourceRef:'self-test',confidence:1,
  evidence:{directCheck:true},observedAtMs:now,expiresAtMs:now+16*60*1000
}),/MACHINE_READY_TTL_TOO_LONG/);

out=await recordMachineObservationV1(db({mode:'OFF'}),{
  observationId:'obs-5',machineId:'press-1',machineState:'BLOCKED',
  sourceKind:'MAINTENANCE',sourceRef:'maint',confidence:1,
  evidence:{},observedAtMs:now,expiresAtMs:now+60*60*1000
});
assert.equal(out.skipped,true);
assert.equal(out.reason,'MACHINE_CONTROL_NOT_SHADOW');

await assert.rejects(()=>recordMachineObservationV1(db({registered:false}),{
  observationId:'obs-6',machineId:'press-1',machineState:'BLOCKED',
  sourceKind:'MAINTENANCE',sourceRef:'maint',confidence:1,
  evidence:{},observedAtMs:now,expiresAtMs:now+60*60*1000
}),/MACHINE_NOT_REGISTERED_ACTIVE/);

console.log('MACHINE_OBSERVATION_WRITER_V1=PASS');
console.log('READY_REQUIRES_DIRECT_CHECK=YES');
console.log('READY_FROM_NO_FAULT=FORBIDDEN');
console.log('READY_TTL_MAX_MIN=15');
console.log('MACHINE_CONTROL_SHADOW_REQUIRED=YES');
