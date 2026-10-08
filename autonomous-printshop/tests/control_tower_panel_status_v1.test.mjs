import assert from 'node:assert/strict';
import {buildControlTowerPanelStatusV1} from '../core/control-tower-panel-status-v1.mjs';
const clock=Date.parse('2026-10-08T19:00:00Z');
const control={success:true,mode:'CONTROL_TOWER_SHADOW',generatedAt:new Date(clock-2000).toISOString(),
 source:{authority:'trendos-main-d1'},writesAccepted:false,d1Mutation:false,employeeAssignment:false,
 piiExposed:false,employeeIdentityExposed:false,rawOrderIdsExposed:false,rawLineIdsExposed:false,
 operations:{counts:{ordinary:0},deadlineRisk:{overdueOrders:0}},employees:{operatorCounts:{available:0},blockers:{success:true,summary:{}}},
 readiness:{coverage:{}},communications:{pending:{success:true,summary:{}}},
 finance:{warnings:{success:true,summary:{control:{readModeSafe:true},source:{absenceQualified:false}}}},
 shadowLearning:{},customerSecret:'NEVER_EMIT',rawLineId:'SECRET_ID'};
const evidence={success:true,mode:'READINESS_EVIDENCE_STATUS',generatedAt:new Date(clock-1000).toISOString()};
const full=buildControlTowerPanelStatusV1(control,evidence,clock);
for(const [id,p] of Object.entries(full.panels)){
 assert.equal(p.state,'FRESH',id);assert.equal(p.displayAvailable,true,id);
 assert.equal(p.executionAllowed,false);assert.equal(p.ageMs,id==='evidence'?1000:2000);
}
assert.equal(full.panels.finance.historicalCompletenessQualified,false);
assert.ok(!JSON.stringify(full).includes('NEVER_EMIT'));
assert.ok(!JSON.stringify(full).includes('SECRET_ID'));
const partial=structuredClone(control);partial.communications.pending={success:false};
const mixed=buildControlTowerPanelStatusV1(partial,{success:false},clock);
assert.equal(mixed.panels.communications.state,'UNAVAILABLE');
assert.equal(mixed.panels.evidence.state,'UNAVAILABLE');
assert.equal(mixed.panels.operations.state,'FRESH');
assert.equal(mixed.panels.finance.state,'FRESH');
const missing=structuredClone(control);delete missing.employees.operatorCounts;delete missing.operations.deadlineRisk;
assert.equal(buildControlTowerPanelStatusV1(missing,evidence,clock).panels.employees.displayAvailable,false);
assert.equal(buildControlTowerPanelStatusV1(missing,evidence,clock).panels.deadlines.displayAvailable,false);
for(const generatedAt of [new Date(clock-300001).toISOString(),new Date(clock+1).toISOString(),'bad']){
 const expired=buildControlTowerPanelStatusV1({...control,generatedAt},evidence,clock);
 assert.ok(Object.values(expired.panels).every(p=>p.displayAvailable===false));
 assert.equal(expired.panels.finance.historicalCompletenessQualified,false);
}
const unknown=buildControlTowerPanelStatusV1(control,{success:true,mode:'READINESS_EVIDENCE_STATUS'},clock).panels.evidence;
assert.equal(unknown.state,'RECEIVED_AGE_UNKNOWN');assert.equal(unknown.ageMs,null);assert.equal(unknown.asOf,null);
assert.equal(buildControlTowerPanelStatusV1(control,{...evidence,generatedAt:'bad'},clock).panels.evidence.displayAvailable,false);
assert.equal(buildControlTowerPanelStatusV1(control,{...evidence,generatedAt:new Date(clock-300001).toISOString()},clock).panels.evidence.displayAvailable,false);
assert.ok(Object.values(buildControlTowerPanelStatusV1({...control,writesAccepted:true},evidence,clock).panels).every(p=>!p.displayAvailable));
console.log('CONTROL_TOWER_PANEL_FRESHNESS_PROVENANCE=PASS');
console.log('PARTIAL_FAILURE_NO_FALSE_ZERO_OR_EXECUTION=PASS');
