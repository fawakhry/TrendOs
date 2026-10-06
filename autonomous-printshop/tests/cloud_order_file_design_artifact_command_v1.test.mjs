import assert from 'node:assert/strict';
import { buildCloudOrderFileDesignArtifactSqlV1 } from '../core/cloud-order-file-design-artifact-command-v1.mjs';

const base={
  artifactId:'cloud-artifact-1',
  bindingEventId:'cloud-binding-1',
  fileId:'OCF-abc123',
  orderId:'TM2606000001',
  lineId:'TM2606000001-01',
  r2Key:'order-conversations/TM2606000001/TM2606000001-01/OCF-abc123/proof.png',
  mimeType:'image/png',
  contentSha256:'a'.repeat(64),
  activeLineMatch:true,
  archived:false
};

const sql=buildCloudOrderFileDesignArtifactSqlV1(base);
assert.match(sql,/INSERT OR IGNORE INTO autonomous_design_artifacts/);
assert.match(sql,/employee_order_conversation_files_v1/);
assert.match(sql,/employee_core_archive_lines_v1/);
assert.match(sql,/employee_core_lines_v1/);
assert.match(sql,/t12_prod_lines/);
assert.match(sql,/autonomous_design_control WHERE singleton_id=1 AND mode='SHADOW'/);
assert.match(sql,/'CUSTOMER_UPLOAD'/);
assert.match(sql,/'R2'/);
assert.match(sql,/INSERT OR IGNORE INTO autonomous_design_asset_binding_events/);
assert.match(sql,/'LINKED'/);
assert.match(sql,/'CUSTOMER_PRIVATE'/);
assert.doesNotMatch(sql,/autonomous_design_approval_events/);
assert.doesNotMatch(sql,/autonomous_design_preflight_runs/);
assert.doesNotMatch(sql,/autonomous_readiness_evidence/);
assert.doesNotMatch(sql,/operator_tasks/);
assert.doesNotMatch(sql,/employee_accounting_/);

for(const patch of [
  {contentSha256:''},
  {activeLineMatch:false},
  {archived:true},
  {mimeType:'text/plain'},
  {r2Key:''}
]){
  assert.throws(()=>buildCloudOrderFileDesignArtifactSqlV1({...base,...patch}));
}

console.log('CLOUD_ORDER_FILE_DESIGN_ARTIFACT_COMMAND_V1=PASS');
console.log('ACTIVE_ORDER_LINE_REQUIRED=YES');
console.log('CONTENT_SHA256_REQUIRED=YES');
console.log('ARCHIVED_LINE_FORBIDDEN=YES');
console.log('APPROVAL_WRITE=NO');
console.log('PREFLIGHT_WRITE=NO');
console.log('READINESS_WRITE=NO');
