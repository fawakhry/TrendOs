import assert from 'node:assert/strict';
import fs from 'node:fs';
import { machineReadinessEvidenceCandidatesV1 } from '../core/machine-readiness-v1.mjs';

const sql=fs.readFileSync('autonomous-printshop/migrations/0027_machine_readiness_v1.sql','utf8');
assert.match(sql,/mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(sql,/AUTONOMOUS_MACHINE_OBSERVATIONS_APPEND_ONLY/);
assert.match(sql,/AUTONOMOUS_MACHINE_MAPPING_APPEND_ONLY/);
assert.doesNotMatch(sql,/\bDROP\b/i);
assert.doesNotMatch(sql,/\bALTER\b/i);
assert.doesNotMatch(sql,/t12_prod_/i);
assert.doesNotMatch(sql,/employee_/i);

const now=1800000000000;
const machines=[
  {machineId:'laser-1',machineClass:'LASER',department:'ليزر',active:1,version:2},
  {machineId:'press-1',machineClass:'HEAT_PRESS',department:'طباعة',active:1,version:1}
];
const mappings=[
  {mappingEventId:'m1',lineId:'10-1',machineId:'laser-1',mappingState:'ACTIVE',sourceKind:'SCHEDULER',observedAtMs:now-1000},
  {mappingEventId:'m2',lineId:'20-1',machineId:'press-1',mappingState:'ACTIVE',sourceKind:'SCHEDULER',observedAtMs:now-1000},
  {mappingEventId:'m3',lineId:'30-1',machineId:'laser-1',mappingState:'ACTIVE',sourceKind:'SCHEDULER',observedAtMs:now-2000},
  {mappingEventId:'m4',lineId:'30-1',machineId:'laser-1',mappingState:'REMOVED',sourceKind:'SCHEDULER',observedAtMs:now-1000}
];
const observations=[
  {observationId:'o1',machineId:'laser-1',machineState:'READY',sourceKind:'SELF_TEST',confidence:1,observedAtMs:now-60000,expiresAtMs:now+5*60000},
  {observationId:'o2',machineId:'press-1',machineState:'MAINTENANCE',sourceKind:'MAINTENANCE',confidence:1,observedAtMs:now-60000,expiresAtMs:now+60*60000}
];

let out=machineReadinessEvidenceCandidatesV1({mappings,observations,machines,nowMs:now});
assert.equal(out.length,2);
assert.equal(out.find(x=>x.lineId==='10-1').state,'READY');
assert.equal(out.find(x=>x.lineId==='20-1').state,'BLOCKED');
assert.equal(out.some(x=>x.lineId==='30-1'),false);

out=machineReadinessEvidenceCandidatesV1({
  mappings:[{mappingEventId:'x1',lineId:'40-1',machineId:'laser-1',mappingState:'ACTIVE',sourceKind:'SCHEDULER',observedAtMs:now}],
  observations:[{observationId:'x2',machineId:'laser-1',machineState:'READY',sourceKind:'SELF_TEST',confidence:1,observedAtMs:now,expiresAtMs:now+16*60000}],
  machines,
  nowMs:now
});
assert.equal(out.length,0);

out=machineReadinessEvidenceCandidatesV1({
  mappings:[{mappingEventId:'z1',lineId:'50-1',machineId:'laser-1',mappingState:'ACTIVE',sourceKind:'SCHEDULER',observedAtMs:now}],
  observations:[],
  machines,
  nowMs:now
});
assert.equal(out.length,0);

console.log('AUTONOMOUS_PRINTSHOP_MACHINE_READINESS_V1=PASS');
console.log('NO_MAPPING_OR_OBSERVATION=NO_READY_EVIDENCE');
console.log('READY_TTL_MAX_MIN=15');
console.log('MAINTENANCE_OR_BLOCKED=BLOCKED');
console.log('NO_FAULT_ABSENCE_IS_NOT_READY=YES');
