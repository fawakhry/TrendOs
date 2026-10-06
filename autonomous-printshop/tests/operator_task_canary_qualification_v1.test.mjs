import assert from 'node:assert/strict';
import { qualifyOperatorTaskCanaryV1 } from '../core/operator-task-canary-qualification-v1.mjs';

let q=qualifyOperatorTaskCanaryV1({
  autonomyMode:'SHADOW',
  readinessMode:'SHADOW',
  operatorTaskMode:'OFF',
  strictEligible:0,
  recommendationExists:false,
  activeOperatorTasks:0,
  availableOperators:0,
  reviewRequired:0
});
assert.equal(q.systemPrerequisitesQualified,false);
assert.equal(q.activationQualified,false);
assert.ok(q.blockers.includes('NO_STRICT_ELIGIBLE_LINE'));
assert.ok(q.blockers.includes('NO_AVAILABLE_OPERATOR'));
assert.ok(q.activationBlockers.includes('CANARY_OPERATOR_SELECTION_REQUIRED'));
assert.equal(q.activationPerformed,false);

q=qualifyOperatorTaskCanaryV1({
  autonomyMode:'SHADOW',
  readinessMode:'SHADOW',
  operatorTaskMode:'OFF',
  strictEligible:1,
  recommendationExists:true,
  activeOperatorTasks:0,
  availableOperators:1,
  reviewRequired:0
});
assert.equal(q.systemPrerequisitesQualified,true);
assert.equal(q.activationQualified,false);
assert.deepEqual(q.blockers,[]);
assert.deepEqual(q.activationBlockers,['CANARY_OPERATOR_SELECTION_REQUIRED']);

q=qualifyOperatorTaskCanaryV1({
  autonomyMode:'SHADOW',
  readinessMode:'SHADOW',
  operatorTaskMode:'OFF',
  strictEligible:1,
  recommendationExists:true,
  activeOperatorTasks:0,
  availableOperators:1,
  reviewRequired:0,
  canaryOperatorId:'operator-1',
  canaryOperatorAvailable:true
});
assert.equal(q.systemPrerequisitesQualified,true);
assert.equal(q.activationQualified,true);
assert.deepEqual(q.activationBlockers,[]);
assert.equal(q.activationPerformed,false);

q=qualifyOperatorTaskCanaryV1({
  autonomyMode:'SHADOW',
  readinessMode:'SHADOW',
  operatorTaskMode:'OFF',
  strictEligible:2,
  recommendationExists:true,
  activeOperatorTasks:1,
  availableOperators:2,
  reviewRequired:0,
  canaryOperatorId:'operator-1',
  canaryOperatorAvailable:true
});
assert.equal(q.activationQualified,false);
assert.ok(q.blockers.includes('ACTIVE_OPERATOR_TASKS_PRESENT'));

console.log('OPERATOR_TASK_CANARY_QUALIFICATION_V1=PASS');
console.log('CONTROL_MUTATION=NO');
console.log('STRICT_ELIGIBLE_REQUIRED=YES');
console.log('AVAILABLE_OPERATOR_REQUIRED=YES');
console.log('EXPLICIT_CANARY_OPERATOR_REQUIRED_FOR_ACTIVATION=YES');
