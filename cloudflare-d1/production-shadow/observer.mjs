import { buildProductionOrderShadowV1 } from '../src/cloud-write-order-v2-production-shadow.mjs';

export const PRODUCTION_SHADOW_PATH = '/v1/cloud/write/v2/production-shadow';
export const PRODUCTION_SHADOW_OBSERVER_VERSION = 'PRODUCTION_SHADOW_OBSERVER_CANDIDATE_V1_20260905';

const FIXED_SYNTHETIC_INTENT = Object.freeze({
  clientRequestId: 'PROD-SHADOW-OBSERVER-001',
  customerName: 'Production Shadow Observer Qualification',
  customerPhone: '01001112233',
  customerMode: 'خارجي / عابر',
  externalCustomerId: '992',
  department: 'طباعة',
  itemName: 'Production Shadow Observer Qualification Item',
  qty: 1,
  priority: 'عادي',
  status: 'طلب جديد',
  heatPress: 'لا',
  flyPrint: 'لا',
  source: 'TrendOS Production Shadow Observer',
  notes: 'Fixed synthetic mutation-free production observer candidate'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export function productionShadowObserverEnabled(env = {}) {
  return String(env.TRENDOS_PRODUCTION_SHADOW_V2_ENABLED || '').trim().toLowerCase() === 'true';
}

export function isProductionShadowPath(path) {
  return String(path || '').replace(/\/+$/, '') === PRODUCTION_SHADOW_PATH;
}

export function handleProductionShadowObserver(request, env = {}) {
  if (!productionShadowObserverEnabled(env)) {
    return json({
      success: false,
      code: 'production-shadow-disabled',
      productionShadow: true,
      observerOnly: true,
      readOnly: true,
      mutationFree: true,
      d1Read: false,
      d1Written: false,
      appsScriptCalled: false,
      sheetsWritten: false,
      mutationCount: 0,
      productionWriteEnabled: false,
      productionCutover: false
    }, 404);
  }

  if (request.method !== 'GET') {
    return json({
      success: false,
      code: 'method-not-allowed',
      productionShadow: true,
      observerOnly: true,
      readOnly: true,
      mutationFree: true,
      d1Read: false,
      d1Written: false,
      appsScriptCalled: false,
      sheetsWritten: false,
      mutationCount: 0,
      productionWriteEnabled: false,
      productionCutover: false
    }, 405);
  }

  const plan = buildProductionOrderShadowV1(FIXED_SYNTHETIC_INTENT);
  if (!plan.success || !plan.valid) {
    return json({
      success: false,
      code: 'production-shadow-plan-rejected',
      productionShadow: true,
      observerOnly: true,
      readOnly: true,
      mutationFree: true,
      d1Read: false,
      d1Written: false,
      appsScriptCalled: false,
      sheetsWritten: false,
      mutationCount: 0,
      productionWriteEnabled: false,
      productionCutover: false
    }, 500);
  }

  return json({
    ...plan,
    service: 'trendos-production-shadow-observer',
    observerVersion: PRODUCTION_SHADOW_OBSERVER_VERSION,
    observerOnly: true,
    fixedSyntheticIntent: true,
    liveProductionDataRead: false,
    d1Read: false,
    appsScriptCalled: false,
    authoritativeWrites: false,
    productionRouteIntegrated: false
  });
}
