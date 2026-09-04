import { buildProductionOrderShadowV1 } from '../src/cloud-write-order-v2-production-shadow.mjs';

export const PRODUCTION_SHADOW_PREVIEW_PATH = '/v1/preview/cloud-write/v2/production-shadow';
export const PRODUCTION_SHADOW_PREVIEW_VERSION = 'PRODUCTION_SHADOW_PREVIEW_V1_20260905';

const FIXED_SYNTHETIC_INTENT = Object.freeze({
  clientRequestId: 'PROD-SHADOW-PREVIEW-001',
  customerName: 'Production Shadow Qualification',
  customerPhone: '01001112233',
  customerMode: 'خارجي / عابر',
  externalCustomerId: '991',
  department: 'طباعة',
  itemName: 'Production Shadow Qualification Item',
  qty: 1,
  priority: 'عادي',
  status: 'طلب جديد',
  heatPress: 'لا',
  flyPrint: 'لا',
  source: 'TrendOS Production Shadow Preview',
  notes: 'Fixed synthetic no-write preview qualification'
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

export function productionShadowPreviewEnabled(env = {}) {
  return String(env.TRENDOS_PRODUCTION_SHADOW_PREVIEW_ENABLED || '').trim().toLowerCase() === 'true';
}

export function isProductionShadowPreviewPath(path) {
  return String(path || '').replace(/\/+$/, '') === PRODUCTION_SHADOW_PREVIEW_PATH;
}

export function handleProductionShadowPreviewRequest(request, env = {}) {
  if (!productionShadowPreviewEnabled(env)) {
    return json({
      success: false,
      code: 'preview-shadow-disabled',
      previewOnly: true,
      productionShadow: true,
      readOnly: true,
      mutationFree: true,
      d1Written: false,
      sheetsWritten: false,
      productionCutover: false
    }, 404);
  }

  if (request.method !== 'GET') {
    return json({
      success: false,
      code: 'method-not-allowed',
      previewOnly: true,
      productionShadow: true,
      readOnly: true,
      mutationFree: true,
      d1Written: false,
      sheetsWritten: false,
      mutationCount: 0,
      productionWriteEnabled: false,
      productionCutover: false,
      productionRouteIntegrated: false
    }, 405);
  }

  const plan = buildProductionOrderShadowV1(FIXED_SYNTHETIC_INTENT);
  if (!plan.success || !plan.valid) {
    return json({
      success: false,
      code: 'preview-shadow-plan-rejected',
      previewOnly: true,
      productionShadow: true,
      readOnly: true,
      mutationFree: true,
      d1Written: false,
      sheetsWritten: false,
      mutationCount: 0,
      productionWriteEnabled: false,
      productionCutover: false,
      productionRouteIntegrated: false
    }, 500);
  }

  return json({
    ...plan,
    service: 'trendos-production-shadow-preview',
    previewVersion: PRODUCTION_SHADOW_PREVIEW_VERSION,
    previewOnly: true,
    fixedSyntheticIntent: true,
    liveProductionDataRead: false,
    d1Read: false,
    appsScriptCalled: false,
    authoritativeWrites: false
  });
}
