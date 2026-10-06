import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('autonomous-printshop/readiness-collector/worker.mjs','utf8');
const config=fs.readFileSync('autonomous-printshop/readiness-collector/wrangler.toml','utf8');
const adapters=fs.readFileSync('autonomous-printshop/core/readiness-source-adapters-v1.mjs','utf8');
const writer=fs.readFileSync('autonomous-printshop/core/readiness-evidence-writer-v1.mjs','utf8');
const designCollector=fs.readFileSync('autonomous-printshop/core/design-readiness-collector-v1.mjs','utf8');

assert.match(config,/^name = "autonomous-printshop-readiness-collector"$/m);
assert.match(config,/^crons = \["\*\/10 \* \* \* \*"\]$/m);
assert.match(worker,/collectExistingReadinessEvidenceV1/);
assert.match(worker,/collectDesignReadinessEvidenceV1/);
assert.match(worker,/designEvidenceSchemaReady/);
assert.match(worker,/designMode/);
assert.match(worker,/\/evidence-status/);
assert.match(worker,/READINESS_EVIDENCE_STATUS/);
assert.match(worker,/REAL_LINKED_APPROVED_PREFLIGHTED_ARTIFACT_MISSING/);
assert.match(worker,/classifyAccountingCloudCutoverV1/);
assert.match(worker,/cloudStage/);
assert.match(worker,/materialFrozen/);
assert.match(worker,/cloudOrderFiles/);
assert.match(worker,/cloudLineLinkedFiles/);
assert.match(worker,/cloudFileHashSchemaReady/);
assert.match(worker,/approvalReceiptSchemaReady/);
assert.match(worker,/approvalReceiptRows/);
assert.match(worker,/projectDesignProductionReadinessV1/);
assert.match(worker,/readDesignAcquisitionProjection/);
assert.match(worker,/projectedLines/);
assert.match(worker,/qualifiedReadyLines/);
assert.match(worker,/projectedBlockedLines/);
assert.match(worker,/projectedUnknownLines/);
assert.doesNotMatch(
  worker,
  /designReadyInput\s*=\s*Number\(row&&row\.designArtifacts/,
  'OLD_AGGREGATE_DESIGN_READY_FORBIDDEN'
);
assert.match(worker,/machineIdentitySchemaReady/);
assert.match(worker,/machineIdentityRows/);
assert.match(worker,/machineReadinessEvidenceCandidatesV1/);
assert.match(worker,/readMachineAcquisitionProjection/);
assert.match(worker,/projectedCandidates/);
assert.match(worker,/projectedReadyLines/);
assert.match(worker,/projectedBlockedLines/);
assert.match(worker,/writeCanaryAllowedUsers/);
assert.match(worker,/writeCanaryAllowedActions/);
assert.match(worker,/writeCanaryMaxCommands/);
assert.match(worker,/writeCanaryCommandsStarted/);
assert.match(worker,/writeCanaryCommandsRemaining/);
assert.match(worker,/accountingMaterialRowsTotal/);
assert.match(worker,/accountingCanaryMaterialRows/);
assert.match(worker,/materialSourceClass/);
assert.match(worker,/AUDIT_ONLY_CANARY_MATERIALS/);
assert.match(worker,/canaryRowsExcludedFromReadiness:true/);
assert.match(worker,/activeMaterialsAll/);
assert.match(worker,/upper\(trim\(material_kind\)\)<>'A2_CANARY'/);
assert.match(worker,/REGISTERED_MACHINE_DIRECT_OBSERVATION_AND_MAPPING_REQUIRED/);
assert.match(
  worker,
  /machineReadyInput\s*=\s*text\(row&&row\.machineMode\)==='SHADOW'\s*&&\s*Number\(machineProjection&&machineProjection\.ready\|\|0\)>0/
);
assert.match(worker,/writeAuthority:'AUTONOMOUS_READINESS_EVIDENCE_ONLY'/);
assert.match(worker,/businessWrites:false/);
assert.match(worker,/employeeAssignment:false/);
assert.match(adapters,/legacyDesignEvidenceCandidatesV1/);
assert.match(adapters,/materialBlockerEvidenceCandidatesV1/);
assert.match(writer,/INSERT OR IGNORE INTO autonomous_readiness_evidence/);
assert.match(designCollector,/DESIGN_EVIDENCE_SCHEMA_NOT_READY/);
assert.match(designCollector,/DESIGN_CONTROL_NOT_SHADOW/);

for(const src of [worker,adapters,writer,designCollector]){
  for(const forbidden of [
    /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+t12_prod_/i,
    /UPDATE\s+t12_prod_/i,
    /DELETE\s+FROM\s+t12_prod_/i,
    /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+employee_/i,
    /UPDATE\s+employee_/i,
    /DELETE\s+FROM\s+employee_/i,
    /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+operator_tasks/i,
    /UPDATE\s+operator_tasks/i
  ]){
    assert.doesNotMatch(src,forbidden);
  }
}

console.log('AUTONOMOUS_PRINTSHOP_READINESS_COLLECTOR_V1=PASS');
console.log('CRON=EVERY_10_MINUTES');
console.log('WRITE_AUTHORITY=AUTONOMOUS_READINESS_EVIDENCE_ONLY');
console.log('DESIGN_CONTROL_OFF=COLLECTOR_SKIP');
console.log('MATERIAL_READY_SYNTHESIS=NO');
console.log('MACHINE_READY_SYNTHESIS=NO');
