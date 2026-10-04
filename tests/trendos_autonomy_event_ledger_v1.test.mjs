import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  recordAutonomyShadowEventV1,
  readAutonomyControlV1
} from '../cloudflare-d1/src/autonomy-event-ledger-v1.mjs';

const migration = fs.readFileSync('cloudflare-d1/migrations/0019_autonomy_events_v1.sql','utf8');
assert.match(migration, /mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(migration, /'OFF','SHADOW','CANARY','GENERAL'/);
assert.match(migration, /AUTONOMY_EVENTS_APPEND_ONLY/);
assert.doesNotMatch(migration, /\bDROP\s+TABLE\b/i);
assert.doesNotMatch(migration, /\bALTER\s+TABLE\b/i);

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
assert.equal(out.decision.shadowDecision,'AI_AUTO');
assert.equal(out.inserted,true);
assert.equal(writes.length,1);
assert.match(writes[0].sql,/INSERT OR IGNORE INTO autonomy_events/);
assert.equal(writes[0].args[1],'CUSTOMER_INTAKE');
assert.equal(writes[0].args[2],'order:1001:intake');
assert.equal(writes[0].args[5],'HUMAN_EXCEPTION');
assert.equal(writes[0].args[6],'AUTOPILOT_DEFAULT_OFF');
assert.equal(writes[0].args[11].length,64);

const control=await readAutonomyControlV1(db);
assert.equal(control.mode,'OFF');
assert.equal(control.policyVersion,'v1');
assert.equal(control.minConfidence,0.92);
assert.equal(control.epoch,1);
assert.equal(control.configured,true);

await assert.rejects(
  ()=>recordAutonomyShadowEventV1(null,{taskKey:'x',family:'CUSTOMER_INTAKE'}),
  /AUTONOMY_DB_REQUIRED/
);

console.log('TRENDOS_AUTONOMY_EVENT_LEDGER_V1=PASS');
console.log('AUTONOMY_CONTROL_DEFAULT=OFF');
console.log('AUTONOMY_EVENT_MODE=APPEND_ONLY_SHADOW');
console.log('MIGRATION_0019_DESTRUCTIVE_DDL=NO');
