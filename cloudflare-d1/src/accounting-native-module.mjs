import { handleAccountingPreviewRequest } from './accounting-preview.mjs';
import { accountingCapabilitiesPayload } from './accounting-capabilities-v1.mjs';
import {
  accountingContractMetadata,
  validateAccountingCommand
} from './accounting-contract-v1.mjs';
import {
  handleAccountingFoundationApiRequest,
  isAccountingFoundationApiPath
} from './accounting-foundation-api-v1.mjs';
import {
  handleAccountingFinanceApiRequest,
  isAccountingFinanceApiPath
} from './accounting-finance-api-v1.mjs';
import { accountingPersistenceReadinessFromEnv } from './accounting-persistence-readiness-v1.mjs';
import { evaluateAccountingPersistenceSchemaPreflight } from './accounting-persistence-schema-preflight-v1.mjs';

export const TRENDOS_ACCOUNTING_NATIVE_VERSION = 'TRENDOS_ACCOUNTING_NATIVE_V0_8_20260905';

const INTEGRATION_CONTRACT = Object.freeze({
  version: TRENDOS_ACCOUNTING_NATIVE_VERSION,
  module: 'TrendOS Accounting',
  platform: 'TrendOS',
  nativeModule: true,
  standaloneProduct: false,
  easyStoreRole: 'historical-working-trendos-accounting-baseline',
  mode: 'preview-integration-contract',
  cutover: false,
  authoritativeWrites: false,
  writeAuthority: 'google-sheets-apps-script',
  sheetsAuthoritative: true,
  sharedIdentity: {
    orderKey: 'Order ID', lineKey: 'Line ID', itemKey: 'Item ID',
    customerKey: 'Customer ID / Party ID', supplierKey: 'Supplier ID / Party ID',
    departmentKey: 'Department ID', profitCenterKey: 'Profit Center ID',
    treasuryKey: 'Treasury ID / Cashbox ID',
    customerIdentityOwner: 'TrendOS shared customer registry',
    employeeIdentityOwner: 'TrendOS shared auth/session'
  },
  sharedAuth: {
    target: 'TrendOS Edge authenticated session + shared RBAC',
    forbidden: 'employee-name regex authorization',
    currentPreview: 'UI shell is isolated; authoritative financial writes disabled'
  },
  operationsToAccounting: ['eventId / idempotency key','Order ID','Line ID','Item ID','Customer ID / Party ID','Department ID','Profit Center ID','quantity','approved selling price / approved line amount','operational status','source version','timestamp'],
  accountingToOperations: ['Invoice ID','Order ID','Line ID','payment status','paid amount','remaining amount','recognized cost','factual line profit','stock / BOM formation result','financial block / approval state when configured'],
  foundationEndpoints: ['GET /v1/accounting/foundation','POST /v1/accounting/foundation/validate','GET /v1/accounting/operations/line?orderId=...&lineId=... (authenticated read only)'],
  financeEndpoints: ['GET /v1/accounting/finance (F2 metadata, read only)','POST /v1/accounting/finance/plan (posting plan only, persistence=none)'],
  diagnosticsEndpoints: ['GET /v1/accounting/persistence-readiness (read only, mutationPerformed=false)','GET /v1/accounting/persistence-schema-preflight (read only, mutationPerformed=false)'],
  invariants: ['Accounting never invents an operational price.','Replaying the same event must not duplicate invoice lines, stock movements, payments or cash transactions.','Line profit is factual revenue minus recognized line cost and must retain Profit Center identity.','Profit-sharing percentages are outside Accounting.','Inventory/BOM movements must be atomic and auditable.','Names and phone numbers are never primary integration keys.','Treasury and cashbox legs use stable Treasury IDs rather than account names alone.','Verified EasyStore behavior is preserved unless deliberately superseded by a tested TrendOS contract.','D1 does not become authoritative for financial writes without a separately approved cutover.']
});

export function isAccountingNativeModulePath(path) {
  const normalized = String(path || '').replace(/\/+$/, '') || '/';
  return normalized === '/trendos/accounting' || normalized === '/v1/accounting/integration' || normalized === '/v1/accounting/capabilities' || normalized === '/v1/accounting/contract' || normalized === '/v1/accounting/validate' || normalized === '/v1/accounting/persistence-readiness' || normalized === '/v1/accounting/persistence-schema-preflight' || isAccountingFoundationApiPath(normalized) || isAccountingFinanceApiPath(normalized);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-trendos-module': 'accounting' } });
}

async function readJsonBody(request) {
  try { return { ok: true, body: await request.json() }; }
  catch (err) { return { ok: false, response: json({ success:false, valid:false, code:'invalid-json', message:'A valid JSON request body is required.', authoritativeWrites:false, persistence:'none' }, 400) }; }
}

export async function handleAccountingNativeModuleRequest(request, env = {}, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (isAccountingFoundationApiPath(path)) return handleAccountingFoundationApiRequest(request, env, ctx);
  if (isAccountingFinanceApiPath(path)) return handleAccountingFinanceApiRequest(request, env, ctx);

  if (path === '/v1/accounting/integration') {
    if (request.method !== 'GET') return json({ success:false, code:'integration-contract-read-only', authoritativeWrites:false, nativeModule:true }, 405);
    return json({ success:true, ...INTEGRATION_CONTRACT });
  }
  if (path === '/v1/accounting/capabilities') {
    if (request.method !== 'GET') return json({ success:false, code:'accounting-capabilities-read-only', authoritativeWrites:false, nativeModule:true }, 405);
    return json(accountingCapabilitiesPayload());
  }
  if (path === '/v1/accounting/contract') {
    if (request.method !== 'GET') return json({ success:false, code:'accounting-contract-read-only', authoritativeWrites:false, persistence:'none', nativeModule:true }, 405);
    return json(accountingContractMetadata());
  }
  if (path === '/v1/accounting/persistence-readiness') {
    if (request.method !== 'GET') return json({ success:false, code:'accounting-persistence-readiness-read-only', authoritativeWrites:false, persistence:'none', mutationPerformed:false, nativeModule:true }, 405);
    const readiness = accountingPersistenceReadinessFromEnv(env);
    return json({ success:true, nativeModule:true, persistence:'diagnostic-only', ...readiness });
  }
  if (path === '/v1/accounting/persistence-schema-preflight') {
    if (request.method !== 'GET') return json({ success:false, code:'accounting-persistence-schema-preflight-read-only', readOnly:true, authoritativeWrites:false, persistence:'none', mutationPerformed:false, nativeModule:true }, 405);
    const db = env && env.TRENDOS_ACCOUNTING_PREVIEW_DB;
    const report = await evaluateAccountingPersistenceSchemaPreflight(db);
    return json({ success: report.code !== 'D1_NOT_INJECTED', nativeModule:true, persistence:'diagnostic-only', ...report }, report.code === 'D1_NOT_INJECTED' ? 503 : 200);
  }
  if (path === '/v1/accounting/validate') {
    if (request.method !== 'POST') return json({ success:false, code:'accounting-validation-post-only', authoritativeWrites:false, persistence:'none', nativeModule:true }, 405);
    const parsed = await readJsonBody(request); if (!parsed.ok) return parsed.response;
    const result = validateAccountingCommand(parsed.body); return json({ ...result, nativeModule:true }, result.valid ? 200 : 422);
  }
  if (path === '/trendos/accounting') {
    if (request.method !== 'GET') return json({ success:false, code:'accounting-native-preview-read-only', authoritativeWrites:false, nativeModule:true }, 405);
    const previewUrl = new URL(request.url); previewUrl.pathname = '/accounting';
    const response = await handleAccountingPreviewRequest(new Request(previewUrl.toString(), request), env, ctx);
    const html = await response.text();
    const nativeBanner = '<div style="background:#0f766e;color:white;padding:10px 14px;text-align:center;font-family:Tahoma,Arial,sans-serif;font-size:13px"><b>TrendOS Native Module</b> — تطوير مباشر للنسخة البدائية EasyStore داخل TrendOS مع الحفاظ على Order ID / Line ID ونفس هوية المنصة</div>';
    const headers = new Headers(response.headers); headers.set('x-trendos-native-module','accounting'); headers.set('x-trendos-accounting-version',TRENDOS_ACCOUNTING_NATIVE_VERSION);
    return new Response(html.replace('<body>', '<body>' + nativeBanner), { status:response.status, headers });
  }
  return json({ success:false, code:'not-found' }, 404);
}
