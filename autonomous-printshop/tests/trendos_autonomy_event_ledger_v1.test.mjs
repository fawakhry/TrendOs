import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  autonomyInputHashV1,
  stableCanonicalJsonV1,
  recordAutonomyShadowEventV1,
  recordAutonomyObservationV1,
  readAutonomyControlV1
} from '../core/autonomy-event-ledger-v1.mjs';

const migration = fs.readFileSync('autonomous-printshop/migrations/0019_autonomy_events_v1.sql','utf8');
assert.match(migration, /mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(migration, /'OFF','SHADOW','CANARY','GENERAL'/);
assert.match(migration, /recommended_decision TEXT NOT NULL/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS autonomy_observations/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS autonomy_control_events/);
assert.match(migration, /trg_autonomy_control_audit/);
assert.match(migration, /AUTONOMY_EVENTS_APPEND_ONLY/);
assert.match(migration, /AUTONOMY_OBSERVATIONS_APPEND_ONLY/);
assert.match(migration, /AUTONOMY_CONTROL_EVENTS_APPEND_ONLY/);
assert.doesNotMatch(migration, /observed_human_action/);
assert.doesNotMatch(migration, /matched_human_action/);
assert.doesNotMatch(migration, /\bDROP\s+TABLE\b/i);
assert.doesNotMatch(migration, /\bALTER\s+TABLE\b/i);

assert.equal(
  stableCanonicalJsonV1({b:2,a:{y:2,x:1}}),
  stableCanonicalJsonV1({a:{x:1,y:2},b:2})
);
assert.notEqual(
  stableCanonicalJsonV1({a:[1,2]}),
  stableCanonicalJsonV1({a:[2,1]})
);
assert.equal(
  await autonomyInputHashV1({b:2,a:1}),
  await autonomyInputHashV1({a:1,b:2})
);

const writes=[];
const db={
  prepare(sql){
    return {
      bind(...args){
        return {
          async run(){
            writes.push({sql,args});
            return {meta:{changes:1}};
          }
        };
      },
      async first(){
        return {
          mode:'OFF',
          policyVersion:'v1',
          minConfidence:0.92,
          epoch:1,
          updatedBy:'bootstrap',
          changeReason:'INITIAL_OFF',
          updatedAt:'2026-10-05T00:00:00.000Z'
        };
      }
    };
  }
};

const out=await recordAutonomyShadowEventV1(db,{
  taskKey:'order:1001:intake',
  family:'CUSTOMER_INTAKE',
  orderId:'1001',
  confidence:0.99,
  idempotent:true
},{policyVersion:'v1'});

assert.equal(out.success,true);
assert.equal(out.decision.reason,'AUTOPILOT_DEFAULT_OFF');
assert.equal(out.decision.decision,'HUMAN_EXCEPTION');
assert.equal(out.recommendedDecision.decision,'AI_AUTO');
assert.equal(out.inserted,true);
assert.equal(writes.length,1);
assert.match(writes[0].sql,/INSERT OR IGNORE INTO autonomy_events/);
assert.equal(writes[0].args[1],'CUSTOMER_INTAKE');
assert.equal(writes[0].args[2],'order:1001:intake');
assert.equal(writes[0].args[5],'HUMAN_EXCEPTION');
assert.equal(writes[0].args[8],'AI_AUTO');
assert.equal(writes[0].args[13].length,64);

const observation=await recordAutonomyObservationV1(db,{
  eventId:out.eventId,
  observerKind:'HUMAN',
  observerId:'operator-1',
  observedAction:'STARTED_ORDER_1001',
  matchedRecommendation:true,
  outcome:'STARTED',
  evidence:{lineId:'1001-1',at:'2026-10-05T10:00:00Z'}
});
assert.equal(observation.success,true);
assert.equal(observation.inserted,true);
assert.equal(writes.length,2);
assert.match(writes[1].sql,/INSERT OR IGNORE INTO autonomy_observations/);
assert.equal(writes[1].args[1],out.eventId);
assert.equal(writes[1].args[5],1);

const control=await readAutonomyControlV1(db);
assert.equal(control.mode,'OFF');
assert.equal(control.policyVersion,'v1');
assert.equal(control.minConfidence,0.92);
assert.equal(control.epoch,1);
assert.equal(control.updatedBy,'bootstrap');
assert.equal(control.changeReason,'INITIAL_OFF');
assert.equal(control.configured,true);

await assert.rejects(
  ()=>recordAutonomyShadowEventV1(null,{taskKey:'x',family:'CUSTOMER_INTAKE'}),
  /AUTONOMY_DB_REQUIRED/
);
await assert.rejects(
  ()=>recordAutonomyObservationV1(db,{eventId:'x'}),
  /AUTONOMY_OBSERVED_ACTION_REQUIRED/
);

console.log('AUTONOMOUS_PRINTSHOP_AUTONOMY_EVENT_LEDGER_V1=PASS');
console.log('AUTONOMY_CONTROL_DEFAULT=OFF');
console.log('AUTONOMY_EVENTS=IMMUTABLE_DECISIONS_ONLY');
console.log('AUTONOMY_OBSERVATIONS=APPEND_ONLY');
console.log('AUTONOMY_CONTROL_AUDIT=TRIGGERED_APPEND_ONLY');
console.log('INPUT_HASH=STABLE_CANONICAL_JSON_SHA256');
console.log('MIGRATION_0019_DESTRUCTIVE_DDL=NO');
