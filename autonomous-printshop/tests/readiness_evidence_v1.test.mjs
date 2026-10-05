import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  latestReadinessEvidenceV1,
  applyReadinessEvidenceV1,
  summarizeReadinessCoverageV1,
  buildReadinessQualifiedRealityV1
} from '../core/readiness-evidence-v1.mjs';

const migration=fs.readFileSync('autonomous-printshop/migrations/0023_readiness_evidence_v1.sql','utf8');
assert.match(migration,/mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(migration,/autonomous_readiness_evidence/);
assert.match(migration,/AUTONOMOUS_READINESS_EVIDENCE_APPEND_ONLY/);
assert.match(migration,/AUTONOMOUS_READINESS_CONTROL_EVENTS_APPEND_ONLY/);
assert.doesNotMatch(migration,/\bDROP\b/i);
assert.doesNotMatch(migration,/\bALTER\b/i);

const now=1800000000000;
const events=[
  {evidenceId:'e1',lineId:'10-1',kind:'DESIGN',state:'BLOCKED',sourceKind:'DESIGN_PREFLIGHT',observedAtMs:now-2000},
  {evidenceId:'e2',lineId:'10-1',kind:'DESIGN',state:'READY',sourceKind:'DESIGN_PREFLIGHT',observedAtMs:now-1000},
  {evidenceId:'e3',lineId:'10-1',kind:'MATERIAL',state:'READY',sourceKind:'MATERIAL_LEDGER',observedAtMs:now-1000},
  {evidenceId:'e4',lineId:'10-1',kind:'MACHINE',state:'READY',sourceKind:'MACHINE_AGENT',observedAtMs:now-1000,expiresAtMs:now+10000},
  {evidenceId:'e5',lineId:'20-1',kind:'DESIGN',state:'READY',sourceKind:'DESIGN_PREFLIGHT',observedAtMs:now-1000},
  {evidenceId:'e6',lineId:'20-1',kind:'MATERIAL',state:'READY',sourceKind:'MATERIAL_LEDGER',observedAtMs:now-1000},
  {evidenceId:'e7',lineId:'20-1',kind:'MACHINE',state:'READY',sourceKind:'MACHINE_AGENT',observedAtMs:now-10000,expiresAtMs:now-1}
];
const latest=latestReadinessEvidenceV1(events,now);
assert.equal(latest.get('10-1::DESIGN').state,'READY');
assert.equal(latest.has('20-1::MACHINE'),false);

const rows=[
  {orderId:'10',lineId:'10-1',department:'ليزر',priority:'عاجل',status:'طلب جديد',expectedDelivery:'2026-10-06'},
  {orderId:'20',lineId:'20-1',department:'ليزر',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-05'}
];
const enriched=applyReadinessEvidenceV1(rows,events,{nowMs:now});
assert.equal(enriched[0].designReady,true);
assert.equal(enriched[0].materialReady,true);
assert.equal(enriched[0].machineReady,true);
assert.equal(enriched[1].machineReady,null);

const coverage=summarizeReadinessCoverageV1(rows,events,{nowMs:now});
assert.deepEqual(coverage.DESIGN,{ready:2,blocked:0,unknown:0});
assert.deepEqual(coverage.MATERIAL,{ready:2,blocked:0,unknown:0});
assert.deepEqual(coverage.MACHINE,{ready:1,blocked:0,unknown:1});

let qualified=buildReadinessQualifiedRealityV1(rows,events,{nowMs:now});
assert.equal(qualified.reality.ordinary.length,1);
assert.equal(qualified.reality.exceptions.length,1);
assert.equal(qualified.recommendation.recommended.orderId,'10');

qualified=buildReadinessQualifiedRealityV1(rows,[],{nowMs:now});
assert.equal(qualified.reality.ordinary.length,0);
assert.equal(qualified.reality.exceptions.length,2);
assert.equal(qualified.recommendation.recommended,null);
assert.equal(qualified.recommendation.reason,'NO_ELIGIBLE_TASK');
assert.deepEqual(qualified.coverage.DESIGN,{ready:0,blocked:0,unknown:2});
assert.deepEqual(qualified.coverage.MATERIAL,{ready:0,blocked:0,unknown:2});
assert.deepEqual(qualified.coverage.MACHINE,{ready:0,blocked:0,unknown:2});

console.log('AUTONOMOUS_PRINTSHOP_READINESS_EVIDENCE_V1=PASS');
console.log('MISSING_EVIDENCE=UNKNOWN_FAIL_CLOSED');
console.log('EXPIRED_EVIDENCE=IGNORED');
console.log('LATEST_VALID_EVIDENCE=WINS');
console.log('LIVE_ASSIGNMENT=NO');
