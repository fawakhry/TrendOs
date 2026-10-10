import assert from 'node:assert/strict';
import {createSharedControlTowerLastGoodV1} from '../core/control-tower-shared-last-good-v1.mjs';

// AP-111 isolated in-memory KV-like store: NO live KV/DO, D1 or Production.
const t=Date.parse('2026-10-10T15:00:00.000Z');
let state=null,writeCount=0,storageOnline=true,writeOnline=true;
const store={
 async get(){if(!storageOnline)throw Error('SECRET_STORAGE_READ_EXCEPTION');return state;},
 async put(k,v,opt){
  if(!writeOnline)throw Error('SECRET_STORAGE_WRITE_EXCEPTION');
  assert.equal(k,'control-tower:diagnostic:v1');
  assert.ok(opt.expiration>0);
  state=v;writeCount++;
 }
};
function source(when,count){
 return {
  success:true,mode:'CONTROL_TOWER_SHADOW',generatedAt:new Date(when).toISOString(),
  source:{authority:'trendos-main-d1',rowCount:count},
  operations:{counts:{ordinary:count,inProgress:1},deadlineRisk:{overdueOrders:2,atRisk24hOrders:3}},
  piiExposed:false,rawOrderIdsExposed:false,rawLineIdsExposed:false,
  employeeIdentityExposed:false,writesAccepted:false,d1Mutation:false,employeeAssignment:false,
  customer:'DONT_CACHE_CUSTOMER',finance:{debt:'DONT_CACHE_FINANCE'}
 };
}
const a=createSharedControlTowerLastGoodV1(store);
const b=createSharedControlTowerLastGoodV1(store);
assert.equal((await a.observe(source(t,5),t+1000)).success,true);
assert.equal((await b.degraded(t+2000)).operationalDiagnostic.waiting,5);
assert.equal((await b.observe(source(t+6000,8),t+7000)).success,true);
assert.equal(writeCount,2);
assert.equal((await a.degraded(t+8000)).operationalDiagnostic.waiting,8);
const old=await a.observe(source(t,5),t+9000);
assert.equal(old.code,'SHARED_SOURCE_ROLLBACK_OR_REPLAY');
assert.equal(writeCount,2);
const replay=await b.observe(source(t+6000,8),t+10000);
assert.equal(replay.code,'SHARED_SOURCE_ROLLBACK_OR_REPLAY');
assert.equal(writeCount,2);
assert.equal((await b.degraded(t+11000)).operationalDiagnostic.waiting,8);
for(const forbidden of ['DONT_CACHE_CUSTOMER','DONT_CACHE_FINANCE','finance','customer']){
 assert.equal(state.includes(forbidden),false);
}
// A failed cache GET must NEVER be converted into a put of a possibly
// older snapshot, and storage failure must not become a clean zero panel.
storageOnline=false;
assert.equal((await a.observe(source(t+12000,10),t+13000)).code,
  'SHARED_STORAGE_READ_FAILED');
assert.equal((await a.degraded(t+13000)).code,'SHARED_STORAGE_READ_FAILED');
assert.equal(writeCount,2);
storageOnline=true;writeOnline=false;
assert.equal((await a.observe(source(t+12000,10),t+13000)).code,
  'SHARED_STORAGE_WRITE_FAILED');
assert.equal(writeCount,2);
writeOnline=true;
// Corrupt persisted JSON is not silently promoted to valid evidence.
state='{invalid-private-record';
assert.equal((await b.degraded(t+14000)).code,'SHARED_STORAGE_READ_FAILED');
assert.equal((await b.observe(source(t+12000,10),t+13000)).code,
  'SHARED_STORAGE_READ_FAILED');
// Recovery requires clearing/replacing the corrupt mock record with a
// fresh independently qualified diagnostic snapshot (no business write).
state=null;
assert.equal((await b.observe(source(t+15000,11),t+16000)).success,true);
assert.equal((await a.degraded(t+17000)).operationalDiagnostic.waiting,11);
assert.equal((await a.degraded(t+15000+300001)).success,false);
assert.equal((await b.degraded(t+15000+300001)).success,false);
assert.equal((await a.degraded(t+17000)).operatorTaskActivationAllowed,false);
console.log('AP111_MC02_MC23_TWO_ADAPTER_RECOVERY=TESTED_MOCK');
console.log('AP111_SOURCE_TIME_ROLLBACK_AND_REPLAY=BLOCKED_SAFE');
console.log('AP111_STORAGE_READ_WRITE_CORRUPTION=FAIL_CLOSED');
console.log('AP111_CROSS_ISOLATE_CLOUDFLARE_KV_DO=NOT_TESTED');
console.log('AP111_D1_WRITES=0; WORKER_DEPLOY=NO');
