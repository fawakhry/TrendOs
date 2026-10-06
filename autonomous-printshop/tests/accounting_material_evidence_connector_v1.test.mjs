import fs from 'node:fs';
import assert from 'node:assert/strict';
import { readAccountingMaterialEvidenceSnapshotV1 } from '../core/accounting-material-evidence-connector-v1.mjs';

function dbFor({mode='READONLY',epoch=2,rows=[]}={}){
  return {
    prepare(sql){
      if(sql.includes('FROM employee_accounting_control_v1')){
        return {async first(){return {mode,policyEpoch:epoch};}};
      }
      if(sql.includes('FROM employee_accounting_dept_lines_v1')){
        return {async all(){return {results:rows};}};
      }
      throw new Error('unexpected sql');
    }
  };
}

let out=await readAccountingMaterialEvidenceSnapshotV1(dbFor({mode:'OFF'}));
assert.equal(out.qualified,false);
assert.equal(out.reason,'ACCOUNTING_CLOUD_AUTHORITY_OFF');
assert.equal(out.accountingCloudStage,'ACCOUNTING_OFF');
assert.equal(out.materialFrozen,true);
assert.equal(out.rows.length,0);

out=await readAccountingMaterialEvidenceSnapshotV1(dbFor({mode:'CANARY'}));
assert.equal(out.qualified,false);
assert.equal(out.accountingCloudStage,'CLOUD_WRITE_CANARY_ACTIVE');
assert.equal(out.reason,'ACCOUNTING_CLOUD_CANARY_ACTIVE_MATERIAL_FROZEN');
assert.equal(out.materialFrozen,true);
assert.equal(out.rows.length,0);

out=await readAccountingMaterialEvidenceSnapshotV1(dbFor({mode:'GENERAL'}));
assert.equal(out.qualified,false);
assert.equal(out.accountingCloudStage,'CLOUD_GENERAL_REQUIRES_AUTONOMOUS_REQUALIFICATION');
assert.equal(out.reason,'ACCOUNTING_POST_CUTOVER_REQUALIFICATION_REQUIRED');
assert.equal(out.materialFrozen,true);
assert.equal(out.rows.length,0);

out=await readAccountingMaterialEvidenceSnapshotV1(dbFor({
  mode:'READONLY',
  rows:[{
    lineId:'10-1',department:'ليزر',materialName:'MDF',
    materialConsumption:3,materialId:'m1',stockQty:2,materialVersion:4
  }]
}));
assert.equal(out.qualified,true);
assert.equal(out.accountingMode,'READONLY');
assert.equal(out.accountingEpoch,2);
assert.equal(out.authority,'employee_accounting_d1_read_model');
assert.equal(out.accountingCloudStage,'CLOUD_READ_MODEL_PRESENT_READONLY');
assert.equal(out.materialFrozen,false);
assert.equal(out.financialWrites,false);
assert.equal(out.piiExposed,false);
assert.equal(out.rows.length,1);
assert.deepEqual(Object.keys(out.rows[0]).sort(),[
  'department','lineId','materialConsumption','materialId','materialName','materialVersion','stockQty'
].sort());

const source=fs.readFileSync('autonomous-printshop/core/accounting-material-evidence-connector-v1.mjs','utf8');
assert.match(source,/material_kind\)<>\'A2_CANARY\'/);
console.log('ACCOUNTING_CANARY_MATERIALS_EXCLUDED=YES');
console.log('ACCOUNTING_MATERIAL_EVIDENCE_CONNECTOR_V1=PASS');
console.log('ACCOUNTING_READONLY_REQUIRED=YES');
console.log('PII_EXPOSED=NO');
console.log('FINANCIAL_WRITES=NO');
