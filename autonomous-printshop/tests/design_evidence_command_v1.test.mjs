import assert from 'node:assert/strict';
import { buildMatbagyDesignEvidenceBundleSqlV1 } from '../core/design-evidence-command-v1.mjs';

const base={
  artifactId:'artifact-001',
  bindingEventId:'binding-001',
  approvalEventId:'approval-001',
  preflightRunId:'preflight-001',
  tenantId:'TENANT_001',
  caseId:'DESIGN-2026-000013',
  versionId:'V5',
  orderId:'4323',
  lineId:'4323-1',
  contentSha256:'a'.repeat(64),
  storageProvider:'GOOGLE_DRIVE',
  storageRef:'drive:file:abc123',
  sourceAssetId:'DESIGN-2026-000013-A005',
  privacyClass:'CUSTOMER_PRIVATE',
  approvalStatus:'FINAL_APPROVED',
  approvalActorKind:'CUSTOMER',
  approvalEvidenceRef:'case:DESIGN-2026-000013:approval',
  recipeId:'MUG_20X9_TWO_PHOTOS_CENTER_TEXT_V1',
  productType:'MUG',
  mimeType:'image/png',
  checks:{dimensions:true,dpi:true}
};

let sql=buildMatbagyDesignEvidenceBundleSqlV1(base);
assert.match(sql,/autonomous_design_artifacts/);
assert.match(sql,/autonomous_design_asset_binding_events/);
assert.match(sql,/autonomous_design_approval_events/);
assert.match(sql,/autonomous_design_preflight_runs/);
assert.match(sql,/order_id='4323' AND q\.line_id='4323-1'/);
assert.match(sql,/CUSTOMER_APPROVED/);
assert.match(sql,/'UNKNOWN'/);
assert.match(sql,/manual-import-v1/);
assert.match(sql,/preflightQualified/);
assert.doesNotMatch(sql,/'PASS'/);

for(const patch of [
  {orderId:''},
  {lineId:''},
  {contentSha256:'bad'},
  {storageRef:''},
  {approvalStatus:'NOT_CONFIRMED'},
  {approvalActorKind:'IMPORT'},
  {approvalEvidenceRef:''}
]){
  assert.throws(()=>buildMatbagyDesignEvidenceBundleSqlV1({...base,...patch}));
}

assert.throws(()=>buildMatbagyDesignEvidenceBundleSqlV1({
  ...base,privacyClass:'CUSTOMER_PRIVATE',storageProvider:'PUBLIC_URL'
}),/PRIVATE_PUBLIC_STORAGE_FORBIDDEN/);

assert.throws(()=>buildMatbagyDesignEvidenceBundleSqlV1({
  ...base,lineId:"x';DELETE FROM t12_prod_lines;--"
}),/LINE_ID_INVALID/);

console.log('DESIGN_EVIDENCE_COMMAND_V1=PASS');
console.log('REAL_ORDER_LINE_MATCH_REQUIRED=YES');
console.log('LINKED_STORAGE_REQUIRED=YES');
console.log('QUALIFIED_APPROVAL_REQUIRED=YES');
console.log('MANUAL_PREFLIGHT_RESULT=UNKNOWN');
console.log('MANUAL_PREFLIGHT_PASS_SYNTHESIS=NO');
console.log('CUSTOMER_PRIVATE_PUBLIC_STORAGE=FORBIDDEN');
