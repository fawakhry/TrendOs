import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('autonomous-printshop/core/design-readiness-collector-v1.mjs','utf8');

assert.match(source,/DESIGN_EVIDENCE_SCHEMA_NOT_READY/);
assert.match(source,/DESIGN_CONTROL_NOT_SHADOW/);
assert.match(source,/designReadinessEvidenceCandidatesV1/);
assert.match(source,/recordReadinessEvidenceV1/);
assert.match(source,/autonomous_design_asset_binding_events/);
assert.match(source,/autonomous_readiness_evidence/);
assert.doesNotMatch(source,/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+t12_prod_/i);
assert.doesNotMatch(source,/UPDATE\s+t12_prod_/i);
assert.doesNotMatch(source,/DELETE\s+FROM\s+t12_prod_/i);
assert.doesNotMatch(source,/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+employee_/i);
assert.doesNotMatch(source,/UPDATE\s+employee_/i);
assert.doesNotMatch(source,/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+operator_tasks/i);

let schemaSql='';
const absentDb={
  prepare(sql){
    schemaSql=sql;
    return {async first(){return {tableCount:0,mode:'ABSENT'};}};
  }
};
const mod=await import('../core/design-readiness-collector-v1.mjs');
let out=await mod.collectDesignReadinessEvidenceV1(absentDb);
assert.equal(out.skipped,true);
assert.equal(out.reason,'DESIGN_EVIDENCE_SCHEMA_NOT_READY');
assert.match(schemaSql,/sqlite_master/);

const offDb={
  prepare(sql){
    if(sql.includes('sqlite_master')) return {async first(){return {tableCount:5,mode:'OFF'};}};
    throw new Error('unexpected query');
  }
};
out=await mod.collectDesignReadinessEvidenceV1(offDb);
assert.equal(out.skipped,true);
assert.equal(out.reason,'DESIGN_CONTROL_NOT_SHADOW');

console.log('AUTONOMOUS_PRINTSHOP_DESIGN_READINESS_COLLECTOR_V1=PASS');
console.log('MISSING_SCHEMA=SKIP');
console.log('DESIGN_CONTROL_OFF=SKIP');
console.log('WRITE_TARGET=READINESS_EVIDENCE_ONLY');
