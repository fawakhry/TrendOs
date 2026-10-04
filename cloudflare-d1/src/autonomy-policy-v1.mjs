/* TrendOS Autonomous Printshop - Autonomy Policy V1
 * Repository-only, default fail-closed foundation.
 * No runtime wiring is performed by this module alone.
 */

export const AUTONOMY_DECISIONS = Object.freeze({
  AI_AUTO: 'AI_AUTO',
  HUMAN_PHYSICAL: 'HUMAN_PHYSICAL',
  HUMAN_EXCEPTION: 'HUMAN_EXCEPTION',
  OWNER_ONLY: 'OWNER_ONLY',
  BLOCKED: 'BLOCKED'
});

export const AUTONOMY_TASK_FAMILIES = Object.freeze({
  CUSTOMER_INTAKE: 'CUSTOMER_INTAKE',
  CUSTOMER_REPLY: 'CUSTOMER_REPLY',
  ORDER_DRAFT: 'ORDER_DRAFT',
  PRICE_QUOTE: 'PRICE_QUOTE',
  DESIGN_TEMPLATE: 'DESIGN_TEMPLATE',
  DESIGN_PREFLIGHT: 'DESIGN_PREFLIGHT',
  PRODUCTION_SCHEDULING: 'PRODUCTION_SCHEDULING',
  MACHINE_JOB_PREP: 'MACHINE_JOB_PREP',
  PHYSICAL_PRODUCTION: 'PHYSICAL_PRODUCTION',
  PACKING: 'PACKING',
  DELIVERY_HANDOFF: 'DELIVERY_HANDOFF',
  QUALITY_CHECK: 'QUALITY_CHECK',
  INVENTORY_REPLENISHMENT: 'INVENTORY_REPLENISHMENT',
  EMPLOYEE_TASK_ASSIGNMENT: 'EMPLOYEE_TASK_ASSIGNMENT',
  EMPLOYEE_COACHING: 'EMPLOYEE_COACHING',
  FINANCIAL_POSTING: 'FINANCIAL_POSTING',
  REFUND_OR_DISCOUNT_OVERRIDE: 'REFUND_OR_DISCOUNT_OVERRIDE',
  EMPLOYMENT_ADVERSE_ACTION: 'EMPLOYMENT_ADVERSE_ACTION',
  SECURITY_CONTROL: 'SECURITY_CONTROL'
});

const DIGITAL_AUTO_FAMILIES = new Set([
  AUTONOMY_TASK_FAMILIES.CUSTOMER_INTAKE,
  AUTONOMY_TASK_FAMILIES.CUSTOMER_REPLY,
  AUTONOMY_TASK_FAMILIES.ORDER_DRAFT,
  AUTONOMY_TASK_FAMILIES.PRICE_QUOTE,
  AUTONOMY_TASK_FAMILIES.DESIGN_TEMPLATE,
  AUTONOMY_TASK_FAMILIES.DESIGN_PREFLIGHT,
  AUTONOMY_TASK_FAMILIES.PRODUCTION_SCHEDULING,
  AUTONOMY_TASK_FAMILIES.MACHINE_JOB_PREP,
  AUTONOMY_TASK_FAMILIES.QUALITY_CHECK,
  AUTONOMY_TASK_FAMILIES.INVENTORY_REPLENISHMENT,
  AUTONOMY_TASK_FAMILIES.EMPLOYEE_TASK_ASSIGNMENT,
  AUTONOMY_TASK_FAMILIES.EMPLOYEE_COACHING
]);

const PHYSICAL_FAMILIES = new Set([
  AUTONOMY_TASK_FAMILIES.PHYSICAL_PRODUCTION,
  AUTONOMY_TASK_FAMILIES.PACKING,
  AUTONOMY_TASK_FAMILIES.DELIVERY_HANDOFF
]);

const OWNER_ONLY_FAMILIES = new Set([
  AUTONOMY_TASK_FAMILIES.REFUND_OR_DISCOUNT_OVERRIDE,
  AUTONOMY_TASK_FAMILIES.EMPLOYMENT_ADVERSE_ACTION,
  AUTONOMY_TASK_FAMILIES.SECURITY_CONTROL
]);

function text(value) {
  return String(value == null ? '' : value).trim();
}

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function bool(value) {
  return value === true;
}

function decision(decisionCode, reason, queue, extra = {}) {
  return {
    decision: decisionCode,
    reason,
    queue,
    requiresOwner: decisionCode === AUTONOMY_DECISIONS.OWNER_ONLY,
    requiresHuman: [
      AUTONOMY_DECISIONS.HUMAN_PHYSICAL,
      AUTONOMY_DECISIONS.HUMAN_EXCEPTION,
      AUTONOMY_DECISIONS.OWNER_ONLY
    ].includes(decisionCode),
    ...extra
  };
}

export function decideAutonomyV1(input = {}, options = {}) {
  const family = text(input.family).toUpperCase();
  const confidence = clamp01(input.confidence);
  const minConfidence = clamp01(options.minConfidence == null ? 0.92 : options.minConfidence);
  const autopilotEnabled = bool(options.autopilotEnabled);

  if (!family) {
    return decision(AUTONOMY_DECISIONS.BLOCKED, 'TASK_FAMILY_REQUIRED', 'AUTONOMY_BLOCKED');
  }

  if (bool(input.safetyBlocked) || bool(input.policyBlocked) || bool(input.dataIntegrityUnknown)) {
    return decision(AUTONOMY_DECISIONS.BLOCKED, 'SAFETY_OR_INTEGRITY_BLOCK', 'AUTONOMY_BLOCKED');
  }

  if (OWNER_ONLY_FAMILIES.has(family)) {
    return decision(AUTONOMY_DECISIONS.OWNER_ONLY, 'SENSITIVE_OWNER_GATE', 'OWNER_REVIEW');
  }

  if (family === AUTONOMY_TASK_FAMILIES.FINANCIAL_POSTING) {
    return decision(AUTONOMY_DECISIONS.HUMAN_EXCEPTION, 'ACCOUNTING_STAYS_SEPARATE_AND_CONTROLLED', 'FINANCE_REVIEW');
  }

  if (PHYSICAL_FAMILIES.has(family) || bool(input.physicalRequired)) {
    return decision(AUTONOMY_DECISIONS.HUMAN_PHYSICAL, 'PHYSICAL_EXECUTION_REQUIRED', 'OPERATOR_TASK_V2', {
      aiPreparesInstructions: true
    });
  }

  if (bool(input.customerApprovalRequired) || bool(input.missingRequiredData) || bool(input.novelRequest)) {
    return decision(AUTONOMY_DECISIONS.HUMAN_EXCEPTION, 'APPROVAL_OR_NOVELTY_REQUIRED', 'HUMAN_EXCEPTION_QUEUE');
  }

  if (!DIGITAL_AUTO_FAMILIES.has(family)) {
    return decision(AUTONOMY_DECISIONS.HUMAN_EXCEPTION, 'UNKNOWN_OR_UNQUALIFIED_TASK_FAMILY', 'HUMAN_EXCEPTION_QUEUE');
  }

  if (!autopilotEnabled) {
    return decision(AUTONOMY_DECISIONS.HUMAN_EXCEPTION, 'AUTOPILOT_DEFAULT_OFF', 'SHADOW_REVIEW', {
      shadowDecision: AUTONOMY_DECISIONS.AI_AUTO
    });
  }

  if (confidence < minConfidence) {
    return decision(AUTONOMY_DECISIONS.HUMAN_EXCEPTION, 'AI_CONFIDENCE_BELOW_THRESHOLD', 'HUMAN_EXCEPTION_QUEUE', {
      confidence,
      minConfidence
    });
  }

  if (bool(input.irreversible) && !bool(input.idempotent)) {
    return decision(AUTONOMY_DECISIONS.HUMAN_EXCEPTION, 'IRREVERSIBLE_ACTION_NOT_IDEMPOTENT', 'HUMAN_EXCEPTION_QUEUE');
  }

  return decision(AUTONOMY_DECISIONS.AI_AUTO, 'QUALIFIED_FOR_AUTONOMOUS_EXECUTION', 'AI_EXECUTION_QUEUE', {
    confidence,
    minConfidence
  });
}

export function autonomyOwnerKpisV1(metrics = {}) {
  const total = Math.max(0, Number(metrics.totalTasks) || 0);
  const ai = Math.max(0, Number(metrics.aiAutoTasks) || 0);
  const owner = Math.max(0, Number(metrics.ownerTouches) || 0);
  const humanException = Math.max(0, Number(metrics.humanExceptionTasks) || 0);
  return {
    totalTasks: total,
    aiAutoRate: total ? ai / total : 0,
    humanExceptionRate: total ? humanException / total : 0,
    ownerTouches: owner,
    ownerRoutineZero: owner === 0
  };
}
