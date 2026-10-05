import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('autonomous-printshop/readiness-collector/worker.mjs','utf8');
const config=fs.readFileSync('autonomous-printshop/readiness-collector/wrangler.toml','utf8');
const adapters=fs.readFileSync('autonomous-printshop/core/readiness-source-adapters-v1.mjs','utf8');
const writer=fs.readFileSync('autonomous-printshop/core/readiness-evidence-writer-v1.mjs','utf8');

assert.match(config,/^name = "autonomous-printshop-readiness-collector"$/m);
assert.match(config,/^crons = \["\*\/10 \* \* \* \*"\]$/m);
assert.match(worker,/collectExistingReadinessEvidenceV1/);
assert.match(worker,/writeAuthority:'AUTONOMOUS_READINESS_EVIDENCE_ONLY'/);
assert.match(worker,/businessWrites:false/);
assert.match(worker,/employeeAssignment:false/);
assert.match(adapters,/legacyDesignEvidenceCandidatesV1/);
assert.match(adapters,/materialBlockerEvidenceCandidatesV1/);
assert.match(writer,/INSERT OR IGNORE INTO autonomous_readiness_evidence/);

for(const src of [worker,adapters,writer]){
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
console.log('MATERIAL_READY_SYNTHESIS=NO');
console.log('MACHINE_READY_SYNTHESIS=NO');
