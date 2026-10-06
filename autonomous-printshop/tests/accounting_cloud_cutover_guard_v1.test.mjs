import assert from 'node:assert/strict';
import { classifyAccountingCloudCutoverV1 } from '../core/accounting-cloud-cutover-guard-v1.mjs';

let x=classifyAccountingCloudCutoverV1({
  mode:'READONLY',policyEpoch:2,writeCanaryReady:true,writeCanaryEnabled:true,
  allowedUsers:0,allowedActions:0
});
assert.equal(x.stage,'CLOUD_BACKEND_READONLY_DATA_PENDING');
assert.equal(x.blockerCollectionAllowed,true);
assert.equal(x.readyEvidenceAllowed,false);
assert.equal(x.frozen,false);
assert.equal(x.sourceDataPresent,false);

x=classifyAccountingCloudCutoverV1({
  mode:'READONLY',activeMaterials:2,deptLinesWithLineId:3,
  deptLinesWithMaterial:3,deptLinesWithConsumption:3
});
assert.equal(x.stage,'CLOUD_READ_MODEL_PRESENT_READONLY');
assert.equal(x.blockerCollectionAllowed,true);
assert.equal(x.readyEvidenceAllowed,false);
assert.equal(x.sourceDataPresent,true);

x=classifyAccountingCloudCutoverV1({
  mode:'CANARY',writeCanaryReady:true,writeCanaryEnabled:true,
  allowedUsers:1,allowedActions:1,activeMaterials:5,
  deptLinesWithLineId:5,deptLinesWithMaterial:5,deptLinesWithConsumption:5
});
assert.equal(x.stage,'CLOUD_WRITE_CANARY_ACTIVE');
assert.equal(x.frozen,true);
assert.equal(x.blockerCollectionAllowed,false);
assert.equal(x.readyEvidenceAllowed,false);
assert.equal(x.writeCanary.armed,true);

x=classifyAccountingCloudCutoverV1({mode:'GENERAL',activeMaterials:10,deptLinesWithLineId:10,deptLinesWithMaterial:10,deptLinesWithConsumption:10});
assert.equal(x.stage,'CLOUD_GENERAL_REQUIRES_AUTONOMOUS_REQUALIFICATION');
assert.equal(x.frozen,true);
assert.equal(x.blockerCollectionAllowed,false);
assert.equal(x.readyEvidenceAllowed,false);

x=classifyAccountingCloudCutoverV1({mode:'OFF'});
assert.equal(x.stage,'ACCOUNTING_OFF');
assert.equal(x.frozen,true);

console.log('ACCOUNTING_CLOUD_CUTOVER_GUARD_V1=PASS');
console.log('READONLY_BLOCKERS_ONLY=YES');
console.log('CANARY_MATERIAL_FREEZE=YES');
console.log('GENERAL_REQUIRES_REQUALIFICATION=YES');
console.log('MATERIAL_READY_DURING_MIGRATION=NO');
