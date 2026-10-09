import assert from 'node:assert/strict';
import {createSharedControlTowerLastGoodV1} from '../core/control-tower-shared-last-good-v1.mjs';
const clock=Date.parse('2026-10-08T19:00:00Z');let payload=null,expiration=0,writes=0;
const store={async put(key,value,options){assert.equal(key,'control-tower:diagnostic:v1');payload=value;expiration=options.expiration;writes++;},async get(){return payload;}};
const snapshot={success:true,mode:'CONTROL_TOWER_SHADOW',generatedAt:new Date(clock-1000).toISOString(),
 source:{authority:'trendos-main-d1',rowCount:10},operations:{counts:{ordinary:7,inProgress:2},deadlineRisk:{overdueOrders:1,atRisk24hOrders:2}},
 piiExposed:false,employeeIdentityExposed:false,rawOrderIdsExposed:false,rawLineIdsExposed:false,writesAccepted:false,d1Mutation:false,employeeAssignment:false,
 finance:{secret:'FINANCE_NEVER_STORE'},ownerExceptionModel:{secret:'OWNER_NEVER_STORE'},customerSecret:'PII_NEVER_STORE'};
const first=createSharedControlTowerLastGoodV1(store);
assert.equal((await first.observe(snapshot,clock)).success,true);assert.equal(writes,1);
assert.equal(expiration,(clock-1000+300000)/1000);
for(const forbidden of ['FINANCE_NEVER_STORE','OWNER_NEVER_STORE','PII_NEVER_STORE','finance','ownerExceptionModel'])assert.ok(!payload.includes(forbidden));
// A separate instance can recover only the PII-free diagnostic subset.
const second=createSharedControlTowerLastGoodV1(store);
const diagnostic=await second.degraded(clock+1000);
assert.equal(diagnostic.status,'LAST_GOOD_STALE_DIAGNOSTIC_ONLY');assert.equal(diagnostic.ageMs,2000);
assert.equal(diagnostic.operationalDiagnostic.waiting,7);assert.equal(diagnostic.cacheScope,'KV_SHARED_BEST_EFFORT');
assert.equal(diagnostic.financialExecutionAllowed,false);assert.equal(diagnostic.operatorTaskActivationAllowed,false);
assert.equal((await second.degraded(clock+299000)).success,true);
assert.equal((await second.degraded(clock+299001)).success,false);
assert.equal((await second.degraded(clock-1)).success,false);
assert.equal((await first.observe({...snapshot,generatedAt:new Date(clock-250000).toISOString()},clock)).code,'SOURCE_TOO_OLD_FOR_SHARED_STORAGE');
assert.equal(writes,1);
assert.equal((await first.observe({...snapshot,piiExposed:true},clock)).success,false);assert.equal(writes,1);
assert.equal((await first.observe({...snapshot,operations:{...snapshot.operations,counts:{ordinary:7}}},clock)).code,'LIVE_SOURCE_NOT_QUALIFIED');
assert.equal((await first.observe({...snapshot,source:{...snapshot.source,rowCount:undefined}},clock)).code,'LIVE_SOURCE_NOT_QUALIFIED');
assert.equal((await first.observe({...snapshot,operations:{...snapshot.operations,deadlineRisk:{overdueOrders:-1,atRisk24hOrders:2}}},clock)).code,'LIVE_SOURCE_NOT_QUALIFIED');
assert.equal(writes,1); // Invalid snapshots must not overwrite the qualified record.
const original=payload;
payload=JSON.stringify({...JSON.parse(original),finance:{ready:true}});
assert.equal((await second.degraded(clock)).success,false);
payload=JSON.stringify({...JSON.parse(original),expiresAt:clock+999999});
assert.equal((await second.degraded(clock)).success,false);
payload=JSON.stringify({...JSON.parse(original),waiting:-1});
assert.equal((await second.degraded(clock)).success,false);
payload='{bad';assert.equal((await second.degraded(clock)).code,'SHARED_STORAGE_READ_FAILED');
const broken=createSharedControlTowerLastGoodV1({async put(){throw Error('PRIVATE');},async get(){throw Error('PRIVATE');}});
assert.equal((await broken.observe(snapshot,clock)).code,'SHARED_STORAGE_WRITE_FAILED');
assert.equal((await broken.degraded(clock)).code,'SHARED_STORAGE_READ_FAILED');
assert.equal((await createSharedControlTowerLastGoodV1(null).degraded(clock)).code,'SHARED_STORAGE_UNAVAILABLE');
console.log('SHARED_LAST_GOOD_TWO_INSTANCES_SOURCE_ONLY=PASS');
console.log('STRICT_SOURCE_EXPIRY_NO_FINANCE_PII_OR_AUTHORITY=PASS');
console.log('EXTERNAL_STORAGE_WRITES=0');
