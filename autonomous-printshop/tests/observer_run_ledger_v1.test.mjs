import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  recordObserverRunV1,
  latestObserverRunV1
} from '../core/observer-run-ledger-v1.mjs';

const sql=fs.readFileSync('autonomous-printshop/migrations/0026_observer_run_ledger_v1.sql','utf8');
assert.match(sql,/AUTONOMY_OBSERVER_RUNS_APPEND_ONLY/);
assert.doesNotMatch(sql,/\bDROP\b/i);
assert.doesNotMatch(sql,/\bALTER\b/i);
assert.doesNotMatch(sql,/t12_prod_/i);
assert.doesNotMatch(sql,/employee_/i);
assert.doesNotMatch(sql,/operator_tasks/i);

let insertedArgs=null;
const fakeDb={
  prepare(sqlText){
    return {
      bind(...args){
        insertedArgs={sqlText,args};
        return {async run(){return {meta:{changes:1}};}};
      },
      async first(){
        return {
          runId:'observer-cron-1000',
          triggerKind:'CRON',
          status:'SUCCESS',
          state:'READINESS_BLOCKED',
          reason:'',
          baselineCandidates:33,
          strictCandidates:0,
          evidenceRows:0,
          eventInserted:1,
          decision:'HUMAN_EXCEPTION',
          recommendedDecision:'HUMAN_EXCEPTION',
          errorCode:'',
          startedAtMs:1000,
          completedAtMs:1100
        };
      }
    };
  }
};

const out=await recordObserverRunV1(fakeDb,{
  runId:'observer-cron-1000',
  triggerKind:'CRON',
  status:'SUCCESS',
  state:'READINESS_BLOCKED',
  baselineCandidates:33,
  strictCandidates:0,
  evidenceRows:0,
  eventInserted:true,
  decision:'HUMAN_EXCEPTION',
  recommendedDecision:'HUMAN_EXCEPTION',
  startedAtMs:1000,
  completedAtMs:1100
});
assert.equal(out.inserted,true);
assert.match(insertedArgs.sqlText,/INSERT OR IGNORE INTO autonomy_observer_runs/);
assert.equal(insertedArgs.args[0],'observer-cron-1000');
assert.equal(insertedArgs.args[8],1);

const latest=await latestObserverRunV1(fakeDb);
assert.equal(latest.status,'SUCCESS');
assert.equal(latest.baselineCandidates,33);
assert.equal(latest.eventInserted,true);

await assert.rejects(()=>recordObserverRunV1(fakeDb,{
  runId:'x',triggerKind:'CRON',status:'SUCCESS',startedAtMs:2000,completedAtMs:1000
}),/OBSERVER_RUN_TIME_INVALID/);

console.log('AUTONOMOUS_PRINTSHOP_OBSERVER_RUN_LEDGER_V1=PASS');
console.log('RUN_TELEMETRY=APPEND_ONLY');
console.log('BUSINESS_IDS_STORED=NO');
console.log('BUSINESS_TABLE_WRITE=NO');
