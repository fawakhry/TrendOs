import assert from 'node:assert/strict';
import { collectCloudOrderFileDesignArtifactsV1 } from '../core/cloud-order-file-design-artifact-collector-v1.mjs';

function mockDb({mode='SHADOW',rows=[],existing={}}={}){
  const calls=[];
  const artifacts=new Map(Object.entries(existing));
  const bindings=new Set();
  return {
    calls,artifacts,bindings,
    prepare(sql){
      calls.push(sql);
      if(sql.includes('SELECT mode FROM autonomous_design_control')){
        return {async first(){return {mode};}};
      }
      if(sql.includes('FROM employee_order_conversation_files_v1 f')){
        return {async all(){return {results:rows};}};
      }
      if(sql.includes('SELECT artifact_id AS artifactId FROM autonomous_design_artifacts')){
        return {
          bind(lineId,hash){
            return {async first(){return artifacts.has(lineId+'|'+hash)?{artifactId:artifacts.get(lineId+'|'+hash)}:null;}};
          }
        };
      }
      if(sql.includes('INSERT OR IGNORE INTO autonomous_design_artifacts')){
        return {
          bind(artifactId,lineId,_case,_version,_product,hash){
            return {async run(){
              const k=lineId+'|'+hash;
              if(artifacts.has(k)) return {meta:{changes:0}};
              artifacts.set(k,artifactId);
              return {meta:{changes:1}};
            }};
          }
        };
      }
      if(sql.includes('INSERT OR IGNORE INTO autonomous_design_asset_binding_events')){
        return {
          bind(bindingId){
            return {async run(){
              if(bindings.has(bindingId)) return {meta:{changes:0}};
              bindings.add(bindingId);
              return {meta:{changes:1}};
            }};
          }
        };
      }
      throw new Error('unexpected sql: '+sql);
    }
  };
}

const row={
  fileId:'OCF-abc123',
  orderId:'TM2606000001',
  lineId:'TM2606000001-01',
  r2Key:'order-conversations/TM2606000001/TM2606000001-01/OCF-abc123/proof.png',
  mimeType:'image/png',
  contentSha256:'a'.repeat(64)
};

let db=mockDb({mode:'OFF',rows:[row]});
let out=await collectCloudOrderFileDesignArtifactsV1(db);
assert.equal(out.skipped,true);
assert.equal(out.reason,'DESIGN_CONTROL_NOT_SHADOW');

db=mockDb({rows:[row]});
out=await collectCloudOrderFileDesignArtifactsV1(db,{nowMs:123});
assert.equal(out.success,true);
assert.equal(out.candidates,1);
assert.equal(out.artifactsInserted,1);
assert.equal(out.bindingsInserted,1);
assert.equal(out.approvalWrites,0);
assert.equal(out.preflightWrites,0);
assert.equal(out.readinessWrites,0);
assert.equal(out.accountingWrites,0);
assert.equal(out.operatorTaskWrites,0);
assert.equal(out.employeeAssignment,false);
assert.equal(out.piiExposed,false);

const artifactId=[...db.artifacts.values()][0];
assert.match(artifactId,/^cloud-artifact-OCF-abc123-/);

out=await collectCloudOrderFileDesignArtifactsV1(db,{nowMs:124});
assert.equal(out.artifactsInserted,0);
assert.equal(out.bindingsInserted,0);
assert.equal(out.duplicates,1);

const source=db.calls.join('\n');
assert.match(source,/employee_core_archive_lines_v1/);
assert.match(source,/employee_core_lines_v1/);
assert.match(source,/t12_prod_lines/);
assert.match(source,/length\(f\.content_sha256\)=64/);
assert.match(source,/autonomous_design_artifacts/);
assert.match(source,/autonomous_design_asset_binding_events/);
assert.doesNotMatch(source,/autonomous_design_approval_events/);
assert.doesNotMatch(source,/autonomous_design_preflight_runs/);
assert.doesNotMatch(source,/autonomous_readiness_evidence/);
assert.doesNotMatch(source,/employee_accounting_/);
assert.doesNotMatch(source,/operator_tasks/);

console.log('CLOUD_ORDER_FILE_DESIGN_ARTIFACT_COLLECTOR_V1=PASS');
console.log('IDEMPOTENT=YES');
console.log('ARTIFACT_AND_BINDING_ONLY=YES');
console.log('APPROVAL_WRITE=NO');
console.log('PREFLIGHT_WRITE=NO');
console.log('READINESS_WRITE=NO');
