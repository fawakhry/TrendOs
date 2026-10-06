import assert from 'node:assert/strict';
import { qualifyMaterialPostCutoverV1 } from '../core/material-post-cutover-requalification-v1.mjs';

let q=qualifyMaterialPostCutoverV1({
  accountingMode:'READONLY',
  accountingEpoch:2,
  accountingCheckpointRef:'ACC-036',
  stockAuthorityConfirmed:false,
  appsScriptBusinessAuthority:false,
  googleBusinessCalls:0,
  activeMaterials:0,
  deptLinesWithLineId:0,
  deptLinesWithMaterial:0,
  deptLinesWithConsumption:0
});
assert.equal(q.qualifiedForShadowReadyEvaluation,false);
assert.ok(q.reasons.includes('ACCOUNTING_GENERAL_NOT_ACTIVE'));
assert.ok(q.reasons.includes('STOCK_AUTHORITY_NOT_CONFIRMED'));
assert.equal(q.activationPerformed,false);
assert.equal(q.readyEvidenceWritten,false);

q=qualifyMaterialPostCutoverV1({
  accountingMode:'CANARY',
  accountingCheckpointRef:'ACC-040',
  stockAuthorityConfirmed:true,
  appsScriptBusinessAuthority:false,
  googleBusinessCalls:0,
  activeMaterials:5,
  deptLinesWithLineId:10,
  deptLinesWithMaterial:10,
  deptLinesWithConsumption:10
});
assert.equal(q.qualifiedForShadowReadyEvaluation,false);
assert.deepEqual(q.reasons,['ACCOUNTING_GENERAL_NOT_ACTIVE']);

q=qualifyMaterialPostCutoverV1({
  accountingMode:'GENERAL',
  accountingEpoch:9,
  accountingCheckpointRef:'ACC-050',
  stockAuthorityConfirmed:true,
  appsScriptBusinessAuthority:false,
  googleBusinessCalls:0,
  activeMaterials:5,
  stockMoves:0,
  deptLinesWithLineId:10,
  deptLinesWithMaterial:10,
  deptLinesWithConsumption:10
});
assert.equal(q.qualifiedForShadowReadyEvaluation,true);
assert.deepEqual(q.reasons,[]);
assert.equal(q.activationPerformed,false);
assert.equal(q.readyEvidenceWritten,false);

q=qualifyMaterialPostCutoverV1({
  accountingMode:'GENERAL',
  accountingCheckpointRef:'not-a-checkpoint',
  stockAuthorityConfirmed:true,
  appsScriptBusinessAuthority:false,
  googleBusinessCalls:0,
  activeMaterials:1,
  deptLinesWithLineId:1,
  deptLinesWithMaterial:1,
  deptLinesWithConsumption:1
});
assert.equal(q.qualifiedForShadowReadyEvaluation,false);
assert.ok(q.reasons.includes('ACCOUNTING_CUTOVER_CHECKPOINT_REQUIRED'));

console.log('MATERIAL_POST_CUTOVER_REQUALIFICATION_V1=PASS');
console.log('GENERAL_REQUIRED=YES');
console.log('ACCOUNTING_CHECKPOINT_REQUIRED=YES');
console.log('STOCK_AUTHORITY_CONFIRMATION_REQUIRED=YES');
console.log('ACTIVATION_PERFORMED=NO');
console.log('READY_EVIDENCE_WRITTEN=NO');
