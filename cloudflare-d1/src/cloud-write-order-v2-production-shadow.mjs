import { buildCanonicalOrderCreateIntentV2 } from './cloud-write-order-contract-v2.mjs';

export const CLOUD_WRITE_ORDER_V2_PRODUCTION_SHADOW_VERSION =
  'CLOUD_WRITE_ORDER_V2_PRODUCTION_SHADOW_V1_20260905';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stable(value[key]);
      return out;
    }, {});
  }
  return value;
}

// Deterministic comparison fingerprint only; it is not an auth/security primitive.
// Keep this pure JS so the same module runs in Node CI and Cloudflare Workers
// without requiring nodejs_compat or any runtime crypto capability.
function fnv1a32(text, seed) {
  let hash = (0x811c9dc5 ^ (seed >>> 0)) >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function comparisonFingerprint(value) {
  const text = JSON.stringify(stable(value));
  const seeds = [
    0x00000000,
    0x9e3779b9,
    0x85ebca6b,
    0xc2b2ae35,
    0x27d4eb2f,
    0x165667b1,
    0xd3a2646c,
    0xfd7046c5
  ];
  return seeds.map((seed) => fnv1a32(text, seed)).join('');
}

function fail(code, details = null) {
  return {
    success: false,
    valid: false,
    version: CLOUD_WRITE_ORDER_V2_PRODUCTION_SHADOW_VERSION,
    code,
    details,
    shadowOnly: true,
    productionShadow: true,
    readOnly: true,
    mutationFree: true,
    canonicalWriterInvoked: false,
    d1Written: false,
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0,
    productionWriteEnabled: false,
    productionCutover: false,
    productionRouteIntegrated: false
  };
}

/**
 * Production Shadow V1 is deliberately planning-only.
 * It validates a production-like create intent against the same V2 canonical
 * contract used by Staging, but it cannot call Apps Script, D1, Sheets, or a
 * network endpoint and it does not allocate a business Order ID.
 */
export function buildProductionOrderShadowV1(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return fail('object-input-required');
  }

  // Credentials must never enter the shadow planner.
  if (String(input.username || input.token || input.authorization || '').trim()) {
    return fail('credentials-refused');
  }

  const plan = buildCanonicalOrderCreateIntentV2(input);
  if (!plan.success || !plan.valid) {
    return fail('canonical-contract-rejected', {
      errors: Array.isArray(plan.errors) ? plan.errors.slice() : [],
      normalized: plan.normalized || null
    });
  }

  if (plan.businessOrderIdStrategy !== 'apps-script-allocated') {
    return fail('apps-script-order-id-ownership-required');
  }
  if (plan.mutationFree !== true || plan.productionRouteIntegrated !== false) {
    return fail('unsafe-source-plan-state');
  }

  const canonicalCreateParams = { ...plan.canonicalCreateParams };
  if (
    Object.prototype.hasOwnProperty.call(canonicalCreateParams, 'orderId') ||
    Object.prototype.hasOwnProperty.call(canonicalCreateParams, 'order_id')
  ) {
    return fail('business-order-id-preallocation-refused');
  }

  const shadowFingerprint = comparisonFingerprint({
    sourceVersion: plan.version,
    intentType: plan.intentType,
    canonicalCreateParams,
    requiredCanonicalSideEffects: plan.requiredCanonicalSideEffects || []
  });

  return {
    success: true,
    valid: true,
    version: CLOUD_WRITE_ORDER_V2_PRODUCTION_SHADOW_VERSION,
    sourceContractVersion: plan.version,
    intentType: plan.intentType,
    shadowOnly: true,
    productionShadow: true,
    readOnly: true,
    mutationFree: true,
    canonicalEnvelopeReady: true,
    canonicalWriterInvoked: false,
    businessOrderIdStrategy: 'apps-script-allocated',
    orderIdPresent: false,
    canonicalCreateParams,
    requiredCanonicalSideEffects: Array.isArray(plan.requiredCanonicalSideEffects)
      ? plan.requiredCanonicalSideEffects.slice()
      : [],
    shadowFingerprint,
    fingerprintPurpose: 'deterministic-comparison-only',
    d1Written: false,
    sheetsWritten: false,
    mutationCount: 0,
    networkRequests: 0,
    propertyWrites: 0,
    productionWriteEnabled: false,
    productionCutover: false,
    productionRouteIntegrated: false,
    nextBoundary: 'shadow-observation-only'
  };
}
