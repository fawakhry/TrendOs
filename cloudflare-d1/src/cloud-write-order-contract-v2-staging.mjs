/* TrendOS Cloud Write Order Contract V2 — STAGING-ONLY plan route
 *
 * Read-only synthetic qualification surface. It imports the pure V2 contract
 * and exposes one fixed create-intent plan on the dedicated Staging Worker.
 *
 * Safety:
 * - GET only
 * - fixed synthetic intent only
 * - no D1/DB access
 * - no Apps Script / Sheets call
 * - no secret/auth requirement because it cannot mutate state
 * - no production business Order ID allocation
 * - production Worker must never import this module
 */

import { buildCanonicalOrderCreateIntentV2 } from './cloud-write-order-contract-v2.mjs';

export const CLOUD_WRITE_ORDER_V2_STAGING_PATH = '/v1/staging/cloud-write/v2/intent-plan';

const SYNTHETIC_INTENT = Object.freeze({
  clientRequestId: 'CWV2-STAGE-PLAN-001',
  customerMode: 'خارجي / عابر',
  externalCustomerId: '987',
  customerName: 'Staging Cloud Write V2 Qualification',
  customerPhone: '01001112233',
  department: 'مكبس',
  itemName: 'V2 Intent Qualification Item',
  qty: 1,
  priority: 'عادي',
  status: 'طلب جديد',
  flyPrint: false,
  source: 'TrendOS Staging V2 Contract',
  notes: 'Synthetic read-only V2 intent qualification'
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function cleanPath(value) {
  const path = String(value || '').trim().replace(/\/+$/, '');
  return path || '/';
}

export function isCloudWriteOrderV2StagingPath(path) {
  return cleanPath(path) === CLOUD_WRITE_ORDER_V2_STAGING_PATH;
}

export async function handleCloudWriteOrderV2StagingRequest(request) {
  const url = new URL(request.url);
  const path = cleanPath(url.pathname);

  if (request.method !== 'GET' || path !== CLOUD_WRITE_ORDER_V2_STAGING_PATH) {
    return json({
      success: false,
      code: 'not-found',
      stagingOnly: true,
      syntheticOnly: true,
      readOnly: true,
      d1Written: false,
      sheetsWritten: false,
      mutationCount: 0,
      productionCutover: false
    }, 404);
  }

  const contract = buildCanonicalOrderCreateIntentV2({ ...SYNTHETIC_INTENT });
  if (!contract || contract.success !== true || contract.valid !== true) {
    return json({
      success: false,
      code: 'v2-contract-plan-failed',
      stagingOnly: true,
      syntheticOnly: true,
      readOnly: true,
      d1Written: false,
      sheetsWritten: false,
      mutationCount: 0,
      productionCutover: false,
      errors: Array.isArray(contract && contract.errors) ? contract.errors : []
    }, 500);
  }

  return json({
    success: true,
    service: 'trendos-cloud-write-order-contract-v2-staging-plan',
    stagingOnly: true,
    syntheticOnly: true,
    readOnly: true,
    d1Written: false,
    sheetsWritten: false,
    mutationCount: 0,
    productionCutover: false,
    version: contract.version,
    intentType: contract.intentType,
    businessOrderIdStrategy: contract.businessOrderIdStrategy,
    productionRouteIntegrated: false,
    canonicalCreateParams: contract.canonicalCreateParams,
    requiredCanonicalSideEffects: contract.requiredCanonicalSideEffects
  });
}
