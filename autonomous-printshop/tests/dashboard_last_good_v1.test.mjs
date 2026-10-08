import assert from 'node:assert/strict';
import worker from '../dashboard/worker.mjs';
let unavailable=false;
const live={
 success:true,mode:'CONTROL_TOWER_SHADOW',generatedAt:new Date().toISOString(),
 source:{authority:'trendos-main-d1',rowCount:714},
 operations:{counts:{ordinary:47,inProgress:22},deadlineRisk:{overdueOrders:6,atRisk24hOrders:10}},
 employees:{blockers:{control:{mode:'SHADOW',epoch:2},summary:{byReason:[]}}},
 controls:{autonomy:{mode:'SHADOW'},readiness:'SHADOW',operatorTask:'OFF'},
 finance:{warnings:{success:true,mode:'FINANCE_WARNING_READ_ONLY',
   summary:{mode:'READ_ONLY_AGGREGATE',control:{mode:'READONLY',readModeSafe:true},
     source:{sourceBusinessRows:0,sourceDataPresent:false,absenceQualified:false,positiveSignalsQualified:false},
     debt:{customerAmount:0},dayClose:{state:'UNKNOWN_SOURCE_COMPLETENESS',ready:false}}}},
 writesAccepted:false,d1Mutation:false,employeeAssignment:false,
 piiExposed:false,employeeIdentityExposed:false,rawOrderIdsExposed:false,rawLineIdsExposed:false,
 customerSecret:'NEVER_EXPOSE_CUSTOMER_SECRET'
};
const env={
 SHADOW:{async fetch(){if(unavailable)throw new Error('SIMULATED_UPSTREAM_DOWN');return new Response(JSON.stringify(live),{status:200});}},
 READINESS_COLLECTOR:{async fetch(){return new Response(JSON.stringify({success:false}),{status:503});}}
};
const request=()=>new Request('https://dashboard.internal/state',{method:'GET'});
const freshr=await worker.fetch(request(),env);
const fresh=await freshr.json();
assert.equal(freshr.status,200);
assert.equal(fresh.mode,'CONTROL_TOWER_SHADOW');
assert.ok(fresh.ownerExceptionModel?.exceptions?.some(x=>x.id==='FINANCE_SOURCE_INCOMPLETE'));
unavailable=true;
const oldr=await worker.fetch(request(),env);
const old=await oldr.json();
assert.equal(oldr.status,200);
assert.equal(old.status,'LAST_GOOD_STALE_DIAGNOSTIC_ONLY');
assert.equal(old.success,true);
assert.equal(old.financialReadinessCurrent,false);
assert.equal(old.ownerDecisionsCurrent,false);
assert.equal(old.operatorTaskActivationAllowed,false);
assert.equal(old.noStaleFinanceOrProtectedDecisions,true);
assert.equal(old.operationalDiagnostic.waiting,47);
assert.ok(!('finance' in old));
assert.ok(!('ownerExceptionModel' in old));
assert.ok(!('controls' in old));
assert.ok(!JSON.stringify(old).includes('NEVER_EXPOSE_CUSTOMER_SECRET'));
const html=await (await worker.fetch(new Request('https://dashboard.internal/'),env)).text();
assert.match(html,/LAST_GOOD_STALE_DIAGNOSTIC_ONLY/);
assert.match(html,/مؤشرات Finance والديون والقرارات المحمية والجاهزية غير متاحة/);
unavailable=false;
const recovered=await (await worker.fetch(request(),env)).json();
assert.equal(recovered.mode,'CONTROL_TOWER_SHADOW');
assert.ok(recovered.ownerExceptionModel);
assert.equal(recovered.finance.warnings.summary.dayClose.ready,false);
// A late upstream snapshot retains only its remaining source-age budget.
const realNow=Date.now;
const clock=realNow();
try{
 Date.now=()=>clock;
 live.generatedAt=new Date(clock-299000).toISOString();
 assert.equal((await worker.fetch(request(),env)).status,200);
 unavailable=true;
 Date.now=()=>clock+1001;
 const expired=await worker.fetch(request(),env);
 const unavailableState=await expired.json();
 assert.equal(expired.status,503);
 assert.equal(unavailableState.success,false);
 assert.ok(!('operationalDiagnostic' in unavailableState));
}finally{Date.now=realNow;}
console.log('CONTROL_TOWER_DASHBOARD_MOCK_OUTAGE_RECOVERY=PASS');
console.log('STALE_FINANCE_AND_PROTECTED_DECISIONS_NOT_PROJECTED=PASS');
console.log('NO_PRODUCTION_FAILURE_INJECTION=YES');
