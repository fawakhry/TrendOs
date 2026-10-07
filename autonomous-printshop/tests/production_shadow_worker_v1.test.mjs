import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('autonomous-printshop/production-shadow/worker.mjs','utf8');
const config=fs.readFileSync('autonomous-printshop/production-shadow/wrangler.toml','utf8');
const evidencePilotCore=fs.readFileSync('autonomous-printshop/core/evidence-pilot-target-v1.mjs','utf8');
const evidenceAcquisitionCore=fs.readFileSync('autonomous-printshop/core/evidence-acquisition-packet-v1.mjs','utf8');
const deadlineRiskCore=fs.readFileSync('autonomous-printshop/core/deadline-risk-projection-v1.mjs','utf8');

assert.match(config,/^name = "autonomous-printshop-shadow"$/m);
assert.match(config,/^database_name = "trendos-main"$/m);
assert.match(config,/^database_id = "5c4b92bf-e043-4f6e-bd6d-d514a92cd825"$/m);
assert.match(worker,/PRODUCTION_SHADOW_READ_ONLY/);
assert.match(worker,/rawOrderIdsExposed:false/);
assert.match(worker,/rawLineIdsExposed:false/);
assert.match(worker,/piiExposed:false/);
assert.match(worker,/writesAccepted:false/);
assert.match(worker,/d1Mutation:false/);
assert.match(worker,/employeeAssignment:false/);
assert.match(worker,/SELECT 1 AS ok/);
assert.match(worker,/employee_zero_google_backfill_runs_v1/);
assert.match(worker,/employee_zero_google_parity_v1/);
assert.match(worker,/employee_core_lines_v1/);
assert.match(worker,/t12_legacy_line_runtime/);
assert.match(worker,/t12_prod_lines/);
assert.match(worker,/t12_prod_line_runtime/);
assert.match(worker,/t12_prod_order_schedule/);
assert.match(worker,/NATIVE_ORDER_SCHEDULE_INCOMPLETE/);
assert.match(worker,/NATIVE_ORDER_SCHEDULE_POLICY_MISMATCH/);
assert.match(worker,/LEGACY_D0_FLY_D2_STANDARD_V1/);
assert.match(worker,/nativeOrderDueDatePersisted:true/);
assert.match(worker,/employeeIdentityExposed:false/);
assert.match(worker,/departmentSources/);
assert.match(worker,/autonomous_readiness_evidence/);
assert.match(worker,/autonomous_readiness_control/);
assert.match(worker,/STRICT_FAIL_CLOSED/);
assert.match(worker,/selectEvidencePilotTargetV1/);
assert.match(worker,/evidencePilotTarget/);
assert.match(worker,/buildEvidenceAcquisitionPacketV1/);
assert.match(worker,/evidenceAcquisitionPacket/);
assert.match(worker,/evidenceAcquisitionPacket:readiness&&readiness\.evidenceAcquisitionPacket/,'CONTROL_TOWER_PACKET_PROJECTION');
assert.match(worker,/EVIDENCE_ACQUISITION_ONLY/);
assert.match(worker,/assignmentAllowed:false/);
assert.match(worker,/taskClaimAllowed:false/);
assert.match(evidencePilotCore,/const acquisitionRows=sourceRows\.map/);
assert.match(evidencePilotCore,/designReady:null/);
assert.match(evidencePilotCore,/materialReady:null/);
assert.match(evidencePilotCore,/machineReady:null/);
assert.match(evidenceAcquisitionCore,/SAME_LINE_REQUIRES_DESIGN_MATERIAL_MACHINE_READY/);
assert.match(evidenceAcquisitionCore,/SERIAL_OR_ASSET_TAG/);
assert.match(evidenceAcquisitionCore,/ACTIVE_NON_CANARY_MATERIAL/);
assert.match(evidenceAcquisitionCore,/QUALIFIED_PREFLIGHT_PASS/);
assert.match(evidenceAcquisitionCore,/readyWriteAllowed:false/);
assert.match(evidenceAcquisitionCore,/operatorTaskActivationAllowed:false/);
assert.match(worker,/READINESS_SHADOW/);
assert.ok(worker.includes("path==='/readiness'"));
assert.match(worker,/shadowLearning/);
assert.match(worker,/attentionSignals/);
assert.match(worker,/buildDeadlineRiskProjectionV1/);
assert.match(worker,/deadlineRisk/);
assert.match(worker,/deadlineOverdueOrders/);
assert.match(worker,/deadlineAtRisk24hOrders/);
assert.match(worker,/deadlineUrgentImmediateRiskLines/);
assert.match(deadlineRiskCore,/READ_ONLY_AGGREGATE/);
assert.match(deadlineRiskCore,/rawOrderIdsExposed:false/);
assert.match(deadlineRiskCore,/rawLineIdsExposed:false/);
assert.match(deadlineRiskCore,/customerPiiExposed:false/);
assert.match(worker,/CONTROL_TOWER_SHADOW/);
assert.ok(worker.includes("path==='/control-tower'"));
assert.match(worker,/supervisorCoreVersion/);
assert.match(worker,/operator_tasks/);
assert.match(worker,/employee_attendance_pulses_v1/);
assert.match(worker,/employee_attendance_days_v1/);
assert.match(worker,/employee_hr_employees_v1/);
assert.match(worker,/EMPLOYEE_SUPERVISOR_SHADOW/);
assert.ok(worker.includes("path==='/supervisor'"));
assert.match(worker,/BACKFILL_SNAPSHOT_SHA_MISMATCH/);
assert.match(worker,/BACKFILL_TARGET_COUNT_MISMATCH/);
assert.match(worker,/BACKFILL_NATIVE_IDENTITY_OVERLAP/);
assert.match(worker,/optionalBecauseCommittedRunCountsAreQualified/);
assert.match(config,/AUTONOMOUS_SHADOW_EXPECTED_BACKFILL_SHA256 = "1f9b510723be29eb97932cc7fc95a562c0340873001b3ffea2108bd1a8903b2f"/);

for(const forbidden of [
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[A-Za-z_"'\[]/i,
  /\bDELETE\s+FROM\b/i,
  /\bREPLACE\s+INTO\b/i,
  /\bCREATE\s+TABLE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\.run\s*\(/,
  /\.batch\s*\(/
]){
  assert.doesNotMatch(worker,forbidden);
}

console.log('AUTONOMOUS_PRINTSHOP_PRODUCTION_SHADOW_WORKER=PASS');
console.log('AUTHORITY=READ_ONLY_D1');
console.log('PII_EXPOSED=NO');
console.log('RAW_ORDER_IDS_EXPOSED=NO');
console.log('D1_MUTATION_CODE=NO');
