import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildOwnerExceptionModelV1 } from '../core/owner-exception-model-v1.mjs';

const state={
  controls:{autonomy:{mode:'SHADOW'},readiness:'SHADOW',operatorTask:'OFF'},
  readiness:{baselineCandidates:88,strictBlocked:88,strictEligible:0},
  attentionSignals:{employeeReviewRequired:0,readinessBlocked:88,activeOperatorTasks:0,noStrictRecommendation:true},
  shadowLearning:{autonomyEvents:14,recommendedAiAuto:0,ownerOnly:0,blocked:0},
  evidenceAcquisition:{
    design:{acquisitionReady:false,blocker:'REAL_LINKED_APPROVED_PREFLIGHTED_ARTIFACT_MISSING'},
    material:{acquisitionReady:false,accountingMode:'CANARY',materialFrozen:true,blocker:'ACCOUNTING_CLOUD_CANARY_ACTIVE_MATERIAL_FROZEN'},
    machine:{acquisitionReady:false,blocker:'REGISTERED_MACHINE_DIRECT_OBSERVATION_AND_MAPPING_REQUIRED'}
  },
  operatorTaskCanary:{systemPrerequisitesQualified:false,activationBlockers:['NO_STRICT_ELIGIBLE_LINE','CANARY_OPERATOR_SELECTION_REQUIRED']}
};
const out=buildOwnerExceptionModelV1(state);
assert.equal(out.mode,'READ_ONLY_EXCEPTION_PROJECTION');
assert.equal(out.authorityBoundaries.accountingWrite,false);
assert.equal(out.authorityBoundaries.easyStoreMutation,false);
assert.equal(out.authorityBoundaries.contentMutation,false);
assert.equal(out.authorityBoundaries.operatorTaskWrite,false);
assert.equal(out.authorityBoundaries.employeeAssignment,false);
assert.ok(out.exceptions.some(x=>x.id==='READINESS_BLOCKED'&&x.count===88));
assert.ok(out.exceptions.some(x=>x.id==='DESIGN_EVIDENCE_BLOCKER'));
assert.ok(out.exceptions.some(x=>x.id==='ACCOUNTING_CANARY_MATERIAL_FREEZE'&&x.domain==='FINANCE_SIGNAL'&&!x.ownerActionRequired));
assert.ok(out.exceptions.some(x=>x.id==='MACHINE_EVIDENCE_BLOCKER'));
assert.equal(out.summary.aiObservedDecisions,14);
assert.equal(out.summary.aiExecutionState,'SHADOW_NO_LIVE_EXECUTION');
assert.equal(out.summary.ownerActionRequired,0);

const owner=buildOwnerExceptionModelV1({...state,shadowLearning:{autonomyEvents:15,ownerOnly:2,blocked:1},operatorTaskCanary:{systemPrerequisitesQualified:true,activationBlockers:['CANARY_OPERATOR_SELECTION_REQUIRED']}});
assert.ok(owner.exceptions.some(x=>x.id==='OWNER_ONLY_DECISIONS'&&x.ownerActionRequired&&x.protectedDecision));
assert.ok(owner.exceptions.some(x=>x.id==='CANARY_OPERATOR_SELECTION_REQUIRED'&&x.ownerActionRequired));
assert.equal(owner.summary.ownerActionRequired,2);

const drift=buildOwnerExceptionModelV1({controls:{autonomy:{mode:'GENERAL'},readiness:'SHADOW',operatorTask:'OFF'},attentionSignals:{activeOperatorTasks:1}});
assert.ok(drift.exceptions.some(x=>x.id==='AUTONOMY_MODE_REVIEW'));
assert.ok(drift.exceptions.some(x=>x.id==='OPERATOR_TASK_OFF_WITH_ACTIVE_ROWS'));

const inventory=JSON.parse(fs.readFileSync('autonomous-printshop/manifests/MANAGER_CENTER_MIGRATION_INVENTORY_V1.json','utf8'));
const allowed=new Set(inventory.classifications);
assert.equal(inventory.capabilities.length,32);
for(const item of inventory.capabilities){
  assert.ok(/^MC-\d{2}$/.test(item.id),item.id);
  assert.ok(allowed.has(item.classification),item.id+' '+item.classification);
}
assert.equal(inventory.hard_boundaries.accounting_write_in_autonomous_printshop,false);
assert.equal(inventory.hard_boundaries.easystore_mutation,false);
assert.equal(inventory.hard_boundaries.content_r2_change,false);
assert.equal(inventory.hard_boundaries.legacy_manager_center_disabled,false);
assert.ok(inventory.capabilities.some(x=>x.function.includes('Debt / payment warning')&&x.classification==='MOVE_TO_OWNER_EXCEPTION_CONSOLE'));
assert.ok(inventory.capabilities.some(x=>x.function.includes('70/30')&&x.classification==='DROP_LEGACY'));
assert.ok(inventory.capabilities.some(x=>x.function.includes('Execute day close')&&x.classification==='DROP_LEGACY'));
console.log('OWNER_EXCEPTION_MODEL_V1=PASS');
console.log('MANAGER_CENTER_MIGRATION_INVENTORY_V1=PASS');
