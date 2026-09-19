/*
 * TrendOS T12 — preflight only. No route, D1 SQL, Google access or deploy wiring.
 * Do not confuse a ready intent with an authorized production write.
 */
import { buildCanonicalOrderCreateIntentV2 } from './cloud-write-order-contract-v2.mjs';

export const T12_PREFLIGHT_VERSION = 'TRENDOS_T12_ORDER_CREATE_PREFLIGHT_20260919';
const SIDE_EFFECTS = Object.freeze([
  'authorize-canCreateOrder', 'script-lock', 'v1908-request-idempotency',
  'customer-or-external-identity', 'debt-policy', 'department-normalization',
  'recent-duplicate-guard', 'open-order-department-scope',
  'apps-script-business-order-id-allocation', 'line-id-allocation',
  'orders-summary-upsert', 'order-lines-create', 'activity-log',
  'trend-master-message-queue', 'data-version-bump', 'saved-response-replay'
]);
const EVIDENCE_KEYS = Object.freeze([
  'productionVersion155SourceExact', 'canonicalCreateParity',
  'orderAndLineIdAtomicity', 'authorizationAndDebtParity',
  'orderLineAndSummaryParity', 'sideEffectAndAccountingParity',
  'idempotentReplayAndConflict', 'timeoutRecoveryNoDuplicate',
  'd1MirrorAndReadYourWriteParity', 'authRevocationAndSessionExpiry',
  'isolatedRuntimeTests', 'rollbackAndReconciliationProven'
]);
function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function fail(reason, extra = {}) {
  return Object.freeze({
    success: false, ready: false, productionCutoverAuthorized: false,
    mutationFree: true, routeIntegrated: false, version: T12_PREFLIGHT_VERSION,
    reason, ...extra
  });
}
export function evaluateT12OrderCreatePreflight(input, evidence = {}) {
  if (!plainObject(input) || !plainObject(evidence)) return fail('invalid-input');
  const intent = buildCanonicalOrderCreateIntentV2(input);
  if (!intent.valid) return fail('canonical-intent-invalid', { errors: intent.errors });
  if (intent.businessOrderIdStrategy !== 'apps-script-allocated' ||
      Object.hasOwn(intent.canonicalCreateParams, 'orderId')) {
    return fail('business-order-id-ownership-conflict');
  }
  const actualSideEffects = new Set(intent.requiredCanonicalSideEffects || []);
  if (SIDE_EFFECTS.some(name => !actualSideEffects.has(name))) return fail('canonical-side-effects-incomplete');
  const missing = EVIDENCE_KEYS.filter(key => evidence[key] !== true);
  // Evidence is an engineering checklist, not authority to deploy or write.
  if (missing.length) return fail('qualification-evidence-missing', { missing, intent });
  return fail('owner-authorized-production-cutover-not-in-scope', { intent, evidenceQualified: true });
}
export const T12_REQUIRED_EVIDENCE = EVIDENCE_KEYS;
export const T12_REQUIRED_SIDE_EFFECTS = SIDE_EFFECTS;
