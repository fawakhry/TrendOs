/*
 * T12: branch-only, PURE order-create migration preflight.
 *
 * No production router imports this module. No D1, Sheets, Apps Script, fetch,
 * secrets, counters or other side effects are allowed here. This is NOT an
 * authoritative create handler and MUST NOT be used as one.
 */
import { buildCanonicalOrderCreateIntentV2 } from '../src/cloud-write-order-contract-v2.mjs';

export const T12_ORDER_CREATE_PREFLIGHT_VERSION = 'T12_ORDER_CREATE_PREFLIGHT_V1_20260919';

const REQUIRED_SIDE_EFFECTS = Object.freeze([
  'authorize-canCreateOrder',
  'script-lock',
  'v1908-request-idempotency',
  'customer-or-external-identity',
  'debt-policy',
  'department-normalization',
  'recent-duplicate-guard',
  'open-order-department-scope',
  'apps-script-business-order-id-allocation',
  'line-id-allocation',
  'orders-summary-upsert',
  'order-lines-create',
  'activity-log',
  'trend-master-message-queue',
  'data-version-bump',
  'saved-response-replay'
]);

// Fields unsupported by the single-line V2 intent must NEVER be silently dropped.
const UNSUPPORTED_CREATE_FIELDS = Object.freeze([
  'items', 'lineItems', 'orderLines', 'lines', 'products', 'payment',
  'payments', 'invoice', 'stockMovements', 'discount', 'total', 'remaining',
  'shippingFee', 'deposit', 'amountPaid', 'customPrice', 'orderId', 'order_id',
  'رقم الأوردر', 'الإجمالي', 'المتبقي', 'المدفوع', 'الخصم', 'بنود الأوردر'
]);

function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
function unique(values) { return [...new Set(values)]; }

/**
 * Produces a review artifact only. NO identifier allocation or database writes.
 * productionVersion155SourceVerified MUST be supported by exact deployed-source
 * evidence, not the GitHub Code.gs file or a UI screenshot.
 */
export function buildT12OrderCreatePreflight(input = {}, evidence = {}) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      success: false, readyForImplementation: false, readyForProduction: false,
      version: T12_ORDER_CREATE_PREFLIGHT_VERSION, mutationFree: true,
      errors: ['invalid-create-input'], unsupportedFields: [],
      requiredSideEffects: [...REQUIRED_SIDE_EFFECTS]
    };
  }
  const unsupportedFields = UNSUPPORTED_CREATE_FIELDS.filter((key) => own(input, key));
  if (unsupportedFields.length) errors.push('unsupported-create-fields-must-be-mapped');

  const intent = buildCanonicalOrderCreateIntentV2(input);
  if (!intent.valid) errors.push(...intent.errors);

  const sourceVerified = evidence.productionVersion155SourceVerified === true
    && typeof evidence.productionVersion155SourceFingerprint === 'string'
    && /^[a-f0-9]{64}$/i.test(evidence.productionVersion155SourceFingerprint)
    && evidence.productionVersion === 155;
  if (!sourceVerified) errors.push('production-version-155-source-unverified');

  const mapped = Array.isArray(evidence.verifiedSideEffects) ? evidence.verifiedSideEffects : [];
  const missingSideEffects = REQUIRED_SIDE_EFFECTS.filter((name) => !mapped.includes(name));
  if (missingSideEffects.length) errors.push('canonical-create-side-effects-unverified');

  if (evidence.orderNumberAllocatorVerified !== true) {
    errors.push('cloud-order-number-allocation-unverified');
  }
  if (evidence.atomicOrderAndLinesWriteVerified !== true) {
    errors.push('atomic-order-and-lines-write-unverified');
  }
  if (evidence.idempotentReplayVerified !== true) {
    errors.push('idempotent-replay-unverified');
  }
  if (evidence.authoritativeWriteCutoverApproved !== true) {
    errors.push('authoritative-write-cutover-not-approved');
  }

  return {
    success: errors.length === 0,
    readyForImplementation: errors.length === 0,
    // This pure code can never activate a production write.
    readyForProduction: false,
    mutationFree: true,
    productionRouteIntegrated: false,
    version: T12_ORDER_CREATE_PREFLIGHT_VERSION,
    errors: unique(errors),
    unsupportedFields,
    missingSideEffects,
    requiredSideEffects: [...REQUIRED_SIDE_EFFECTS],
    canonicalCreateParams: intent.valid ? intent.canonicalCreateParams : null,
    businessOrderIdStrategy: 'cloud-allocator-not-implemented',
    nextGate: 'exact-production-155-source-and-side-effect-reconciliation'
  };
}
