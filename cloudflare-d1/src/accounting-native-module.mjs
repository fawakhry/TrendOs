import { handleAccountingPreviewRequest } from './accounting-preview.mjs';

export const TRENDOS_ACCOUNTING_NATIVE_VERSION = 'TRENDOS_ACCOUNTING_NATIVE_V0_2_20260905';

const INTEGRATION_CONTRACT = Object.freeze({
  version: TRENDOS_ACCOUNTING_NATIVE_VERSION,
  module: 'TrendOS Accounting',
  platform: 'TrendOS',
  nativeModule: true,
  standaloneProduct: false,
  mode: 'preview-integration-contract',
  cutover: false,
  authoritativeWrites: false,
  writeAuthority: 'google-sheets-apps-script',
  sheetsAuthoritative: true,
  sharedIdentity: {
    orderKey: 'Order ID',
    lineKey: 'Line ID',
    itemKey: 'Item ID',
    customerIdentityOwner: 'TrendOS Operations / shared customer registry',
    employeeIdentityOwner: 'TrendOS shared auth/session'
  },
  sharedAuth: {
    target: 'TrendOS Edge authenticated session',
    currentPreview: 'UI shell is isolated; authoritative financial writes disabled'
  },
  operationsToAccounting: [
    'eventId / idempotency key',
    'Order ID',
    'Line ID',
    'Item ID',
    'customer reference',
    'quantity',
    'approved selling price / approved line amount',
    'operational status',
    'source version',
    'timestamp'
  ],
  accountingToOperations: [
    'Invoice ID',
    'Order ID',
    'Line ID',
    'payment status',
    'paid amount',
    'remaining amount',
    'recognized cost',
    'factual line profit',
    'stock / BOM formation result',
    'financial block / approval state when configured'
  ],
  invariants: [
    'Accounting never invents an operational price.',
    'Replaying the same event must not duplicate invoice lines, stock movements, payments or cash transactions.',
    'Line profit is factual revenue minus recognized line cost; profit-sharing percentages are outside Accounting.',
    'Inventory/BOM movements must be atomic and auditable.',
    'Names and phone numbers are never primary integration keys.',
    'D1 does not become authoritative for financial writes without a separately approved cutover.'
  ]
});

export function isAccountingNativeModulePath(path) {
  const normalized = String(path || '').replace(/\/+$/, '') || '/';
  return normalized === '/trendos/accounting' || normalized === '/v1/accounting/integration';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-trendos-module': 'accounting'
    }
  });
}

export async function handleAccountingNativeModuleRequest(request, env = {}, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/v1/accounting/integration') {
    if (request.method !== 'GET') {
      return json({
        success: false,
        code: 'integration-contract-read-only',
        authoritativeWrites: false,
        nativeModule: true
      }, 405);
    }
    return json({ success: true, ...INTEGRATION_CONTRACT });
  }

  if (path === '/trendos/accounting') {
    if (request.method !== 'GET') {
      return json({
        success: false,
        code: 'accounting-native-preview-read-only',
        authoritativeWrites: false,
        nativeModule: true
      }, 405);
    }
    const previewUrl = new URL(request.url);
    previewUrl.pathname = '/accounting';
    const response = await handleAccountingPreviewRequest(new Request(previewUrl.toString(), request), env, ctx);
    const html = await response.text();
    const nativeBanner = '<div style="background:#0f766e;color:white;padding:10px 14px;text-align:center;font-family:Tahoma,Arial,sans-serif;font-size:13px"><b>TrendOS Native Module</b> — الحسابات جزء من TrendOS ويعتمد Order ID / Line ID ونفس هوية المنصة</div>';
    const nativeHtml = html.replace('<body>', '<body>' + nativeBanner);
    const headers = new Headers(response.headers);
    headers.set('x-trendos-native-module', 'accounting');
    headers.set('x-trendos-accounting-version', TRENDOS_ACCOUNTING_NATIVE_VERSION);
    return new Response(nativeHtml, { status: response.status, headers });
  }

  return json({ success: false, code: 'not-found' }, 404);
}
