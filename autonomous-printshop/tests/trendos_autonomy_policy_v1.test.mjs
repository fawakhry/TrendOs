import assert from 'node:assert/strict';
import {
  AUTONOMY_DECISIONS,
  AUTONOMY_TASK_FAMILIES,
  decideAutonomyV1,
  autonomyOwnerKpisV1
} from '../core/autonomy-policy-v1.mjs';

let out;

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.CUSTOMER_INTAKE, confidence: 0.99 },
  { autopilotEnabled: false }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.HUMAN_EXCEPTION);
assert.equal(out.reason, 'AUTOPILOT_DEFAULT_OFF');
assert.equal(out.shadowDecision, AUTONOMY_DECISIONS.AI_AUTO);

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.CUSTOMER_INTAKE, confidence: 0.99, idempotent: true },
  { autopilotEnabled: true, minConfidence: 0.92 }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.AI_AUTO);
assert.equal(out.queue, 'AI_EXECUTION_QUEUE');

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.DESIGN_PREFLIGHT, confidence: 0.6 },
  { autopilotEnabled: true, minConfidence: 0.92 }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.HUMAN_EXCEPTION);
assert.equal(out.reason, 'AI_CONFIDENCE_BELOW_THRESHOLD');

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.PHYSICAL_PRODUCTION, confidence: 1 },
  { autopilotEnabled: true }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.HUMAN_PHYSICAL);
assert.equal(out.queue, 'OPERATOR_TASK_V2');
assert.equal(out.aiPreparesInstructions, true);

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.EMPLOYEE_TASK_ASSIGNMENT, confidence: 0.98, idempotent: true },
  { autopilotEnabled: true }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.AI_AUTO);

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.EMPLOYMENT_ADVERSE_ACTION, confidence: 1 },
  { autopilotEnabled: true }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.OWNER_ONLY);
assert.equal(out.requiresOwner, true);

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.FINANCIAL_POSTING, confidence: 1 },
  { autopilotEnabled: true }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.HUMAN_EXCEPTION);
assert.equal(out.queue, 'FINANCE_REVIEW');

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.PRODUCTION_SCHEDULING, confidence: 0.99, irreversible: true, idempotent: false },
  { autopilotEnabled: true }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.HUMAN_EXCEPTION);
assert.equal(out.reason, 'IRREVERSIBLE_ACTION_NOT_IDEMPOTENT');

out = decideAutonomyV1(
  { family: AUTONOMY_TASK_FAMILIES.CUSTOMER_REPLY, confidence: 1, dataIntegrityUnknown: true },
  { autopilotEnabled: true }
);
assert.equal(out.decision, AUTONOMY_DECISIONS.BLOCKED);

const kpi = autonomyOwnerKpisV1({
  totalTasks: 100,
  aiAutoTasks: 94,
  humanExceptionTasks: 6,
  ownerTouches: 0
});
assert.equal(kpi.aiAutoRate, 0.94);
assert.equal(kpi.humanExceptionRate, 0.06);
assert.equal(kpi.ownerRoutineZero, true);

console.log('TRENDOS_AUTONOMY_POLICY_V1=PASS');
console.log('AI_FIRST_DEFAULT=QUALIFIED_ONLY');
console.log('PHYSICAL_WORK_QUEUE=OPERATOR_TASK_V2');
console.log('OWNER_ROUTINE_TOUCH_TARGET=0');
