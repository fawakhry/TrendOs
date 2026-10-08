import assert from 'node:assert/strict';
import {createControlTowerLastGoodGateV1,CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS} from '../core/control-tower-last-good-v1.mjs';

const clock=Date.parse('2026-10-08T12:45:00.000Z');
const source={
 success:true,mode:'CONTROL_TOWER_SHADOW',generatedAt:'2026-10-08T12:44:59.000Z',
 source:{authority:'trendos-main-d1',rowCount:714},
 operations:{counts:{ordinary:47,inProgress:22},deadlineRisk:{overdueOrders:6,atRisk24hOrders:10}},
 finance:{warnings:{summary:{debt:{customerAmount:99999},dayClose:{ready:false},source:{absenceQualified:false}}}},
 ownerExceptionModel:{exceptions:[{id:'OWNER_ONLY_DECISIONS',ownerActionRequired:true}]},
 controls:{operatorTask:'OFF'},
 customerSecret:'CUSTOMER_SECRET',
 piiExposed:false,employeeIdentityExposed:false,rawOrderIdsExposed:false,rawLineIdsExposed:false,
 writesAccepted:false,d1Mutation:false,employeeAssignment:false
};
const gate=createControlTowerLastGoodGateV1();
assert.equal(gate.degraded(clock).status,'UNAVAILABLE_FAIL_CLOSED');
assert.equal(gate.observe(source,clock).status,'FRESH_OBSERVED');
const fallback=gate.degraded(clock+60000);
assert.equal(fallback.status,'LAST_GOOD_STALE_DIAGNOSTIC_ONLY');
assert.equal(fallback.cacheScope,'WORKER_ISOLATE_BEST_EFFORT');
assert.equal(fallback.ageMs,61000);
assert.equal(fallback.operationalDiagnostic.rowCount,714);
assert.equal(fallback.operationalDiagnostic.overdueOrders,6);
assert.equal(fallback.financialReadinessCurrent,false);
assert.equal(fallback.ownerDecisionsCurrent,false);
assert.equal(fallback.operatorTaskActivationAllowed,false);
assert.equal(fallback.financialExecutionAllowed,false);
assert.equal(fallback.noStaleFinanceOrProtectedDecisions,true);
assert.equal(fallback.accountingWrite,false);
assert.equal(fallback.d1Mutation,false);
assert.ok(!JSON.stringify(fallback).includes('CUSTOMER_SECRET'));
assert.ok(!JSON.stringify(fallback).includes('customerAmount'));
assert.ok(!JSON.stringify(fallback).includes('OWNER_ONLY_DECISIONS'));
assert.ok(!JSON.stringify(fallback).includes('ready'));
assert.equal(gate.degraded(clock+CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS+1).status,'UNAVAILABLE_FAIL_CLOSED');
assert.equal(gate.degraded(clock-1).status,'UNAVAILABLE_FAIL_CLOSED');
const bad=createControlTowerLastGoodGateV1();
assert.equal(bad.observe({...source,writesAccepted:true},clock).status,'UNAVAILABLE_FAIL_CLOSED');
assert.equal(bad.observe({...source,rawOrderIdsExposed:true},clock).status,'UNAVAILABLE_FAIL_CLOSED');
assert.equal(bad.observe({...source,mode:'GENERAL'},clock).status,'UNAVAILABLE_FAIL_CLOSED');
assert.equal(bad.observe({...source,generatedAt:'2026-10-08T12:30:00.000Z'},clock).status,'UNAVAILABLE_FAIL_CLOSED');
assert.equal(bad.degraded(clock).status,'UNAVAILABLE_FAIL_CLOSED');
// Receiving an already aged snapshot must not restart its freshness budget.
const aged=createControlTowerLastGoodGateV1();
const produced=clock-CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS+1000;
assert.equal(aged.observe({...source,generatedAt:new Date(produced).toISOString()},clock).success,true);
assert.equal(aged.degraded(clock+1000).ageMs,CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS);
assert.equal(aged.degraded(clock+1001).code,'LAST_GOOD_EXPIRED');
const shorter=createControlTowerLastGoodGateV1({maxAgeMs:30000});
assert.equal(shorter.observe({...source,generatedAt:new Date(clock-31000).toISOString()},clock).success,true);
assert.equal(shorter.degraded(clock).code,'LAST_GOOD_EXPIRED');
const futureObservation=createControlTowerLastGoodGateV1();
assert.equal(futureObservation.observe(source,clock).success,true);
assert.equal(futureObservation.degraded(clock-1).code,'LAST_GOOD_EXPIRED');
console.log('CONTROL_TOWER_LAST_GOOD_CONTRACT=PASS');
console.log('STALE_FINANCE_PROTECTED_DECISIONS=EXCLUDED');
console.log('CACHE_SCOPE=WORKER_ISOLATE_BEST_EFFORT');
console.log('LIVE_INTEGRATION=NOT_YET_ACTIVE');
