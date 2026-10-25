/**
 * ACC234 EasyStore-only D1 Stage entrypoint.
 * Imports the ORIGINAL financial engine (no duplicate invoice writer).
 * This stage attests D1 health only. All financial/customer/order routes
 * remain hard-disabled in CODE until isolated authentication and canonical
 * TrendOS customer/order API are implemented and independently qualified.
 */
import { handleEmployeeAccountingNativeRequest } from '../src/employee-accounting-native-v1.mjs';
import { signedSourceStageSmoke } from './stage-signed-source-smoke-v1.mjs';

const HEALTH = '/v1/employee/accounting/health';
const API = '/v1/employee/accounting';
const TABLE_COUNT = 22;
const SIGNED_SOURCE_SMOKE = '/internal/acc253/signed-source-smoke';
const READ_ACTIONS = new Set([
  'getAccounting','getDeptInvoiceDraftV1887','getPartyAccountV1858',
  'getCustomerAccountV1915','getEasyStoreCustomers','searchCustomers',
  'getEasyStoreSuppliers','easyStoreSystemHealth',
  'calculateAccountingLaserQuoteV1913','getDailyDepartmentReportV1920',
  'previewAccountingAutomationV1921','previewCustomerCreditInvoiceReviewV1',
  'previewCustomerCreditPreparedCommandV1','previewAccountingFinalInvoiceCommandV1',
  'previewCustomerCreditLiabilityAuditV1','previewNativeInvoiceReturnExposureV1',
  'previewInvoiceItemPaymentReviewV1'
]);

// OFF by default; config alone does not change the native D1 OFF control.
// Requires real independent native session and private customer service bindings.
function readGatewayConfigured(env) {
  if (env?.EASYSTORE_STAGE_READONLY_API_V1 !== 'ENFORCE' ||
      env?.FINANCE_RELEASE !== 'NO_GO' || env?.FINANCE_WRITES !== 'OFF' ||
      env?.EASYSTORE_ACCOUNTING_D1_WRITES !== 'false' ||
      env?.EASYSTORE_ACCOUNTING_D1_WRITE_MODE !== 'OFF' ||
      env?.ACCOUNTING_FINANCE_GRANTS_MODE_V1 !== 'ENFORCE' ||
      env?.EASYSTORE_CUSTOMER_SOURCE_V1 !== 'REMOTE_REQUIRED' ||
      env?.EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1 !== 'REMOTE_NATIVE_REQUIRED' ||
      typeof env?.TRENDOS_EMPLOYEE_SESSION?.fetch !== 'function' ||
      typeof env?.TRENDOS_CUSTOMER_FACTS?.fetch !== 'function' ||
      typeof env?.TRENDOS_EMPLOYEE_SESSION_HMAC_V1 !== 'string' ||
      env.TRENDOS_EMPLOYEE_SESSION_HMAC_V1.length < 32 ||
      typeof env?.TRENDOS_CUSTOMER_FACTS_HMAC_V1 !== 'string' ||
      env.TRENDOS_CUSTOMER_FACTS_HMAC_V1.length < 32) return false;
  try {
    const grants = JSON.parse(env.ACCOUNTING_FINANCE_GRANTS_V1);
    return grants?.version === 1 && Array.isArray(grants.grants) &&
      grants.grants.length > 0;
  } catch { return false; }
}

async function stageSchema(env) {
  const stage = await env.DB.prepare(
    "SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1 AND marker='ENTRY614_ACCOUNTING_V1'"
  ).first();
  const tables = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name LIKE 'employee_accounting_%'"
  ).first();
  const forbidden = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND "+
    "(name LIKE 't12_%' OR name LIKE 'employee_auth_%' OR "+
    "name IN ('orders','customers','messages'))"
  ).first();
  if (!stage || !['OFF','READONLY'].includes(stage.mode) ||
      Number(tables?.n) !== TABLE_COUNT || Number(forbidden?.n) !== 0)
    return null;
  return stage.mode;
}


function reply(code, status = 503, more = {}) {
  return new Response(JSON.stringify({
    success: false, code, financeRelease: 'NO_GO', financeWrites: 'OFF', ...more
  }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
  });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    // ACC253: diagnostics are ONLY Stage, ONLY while ALL finance controls OFF,
    // require an explicit temporary provider-side toggle. Never a money API,
    // never a customer-directory endpoint and never usable in READONLY/CANARY.
    if (path === SIGNED_SOURCE_SMOKE) {
      if (request.method !== 'POST') return reply('method-not-allowed',405);
      if (env?.EASYSTORE_STAGE_SIGNED_SOURCE_SMOKE_V1 !== 'ENFORCE' ||
          env?.FINANCE_RELEASE !== 'NO_GO' || env?.FINANCE_WRITES !== 'OFF' ||
          env?.EASYSTORE_STAGE_READONLY_API_V1 !== 'OFF' ||
          env?.EASYSTORE_ACCOUNTING_D1_WRITES !== 'false' ||
          env?.EASYSTORE_ACCOUNTING_D1_WRITE_MODE !== 'OFF' ||
          env?.ACCOUNTING_FINANCE_GRANTS_V1 !== '{"version":1,"grants":[]}' ||
          env?.EASYSTORE_CUSTOMER_SOURCE_V1 !== 'REMOTE_REQUIRED' ||
          env?.EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1 !== 'REMOTE_NATIVE_REQUIRED' ||
          !env?.DB) return reply('isolated-stage-signed-source-smoke-disabled');
      try {
        if (await stageSchema(env) !== 'OFF')
          return reply('isolated-stage-signed-source-smoke-control-not-off');
        return await signedSourceStageSmoke(env);
      } catch { return reply('isolated-stage-signed-source-smoke-unavailable'); }
    }
    // Any money write remains impossible at this Stage gateway: native D1
    // must be READONLY, all authority flags OFF, and action explicitly a read.
    if (path === API) {
      if (!readGatewayConfigured(env)) return reply('isolated-stage-financial-routes-disabled');
      if (request.method === 'OPTIONS')
        return handleEmployeeAccountingNativeRequest(request, env);
      if (request.method !== 'POST') return reply('method-not-allowed', 405);
      if (!env?.DB) return reply('isolated-accounting-d1-binding-missing');
      try {
        const raw = await request.clone().text();
        if (raw.length > 16384) return reply('isolated-stage-read-payload-too-large', 413);
        let body; try { body = JSON.parse(raw); } catch {
          return reply('isolated-stage-invalid-json', 400);
        }
        if (!body || Array.isArray(body) || !READ_ACTIONS.has(body.action))
          return reply('isolated-stage-financial-routes-disabled');
        const mode = await stageSchema(env);
        if (mode !== 'READONLY') return reply('isolated-stage-readonly-control-required');
        return handleEmployeeAccountingNativeRequest(request, env);
      } catch { return reply('isolated-stage-read-unavailable'); }
    }
    if (path !== HEALTH) return reply('not-found', 404);
    if (request.method !== 'GET') return reply('method-not-allowed', 405);
    if (!env || !env.DB) return reply('isolated-accounting-d1-binding-missing');
    if (env.EASYSTORE_CUSTOMER_SOURCE_V1!=='REMOTE_REQUIRED')
      return reply('isolated-official-customer-source-not-enforced');
    if (env.EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1!=='REMOTE_NATIVE_REQUIRED')
      return reply('isolated-native-employee-session-not-enforced');
    try {
      const mode = await stageSchema(env);
      if (!mode || (mode === 'READONLY' && !readGatewayConfigured(env)))
        return reply('isolated-accounting-stage-schema-or-mode-not-ready');
      const native = await handleEmployeeAccountingNativeRequest(request, env);
      if (!native.ok) return reply('native-accounting-health-failed');
      const data = await native.json();
      if (!data.success || !data.schemaReady || data.mode !== mode ||
          data.authoritativeWrites !== false)
        return reply('native-accounting-control-invariant-failed');
      return new Response(JSON.stringify({
        success: true, stage: 'easystore-accounting-staging',
        nativeEngine: 'employee-accounting-native-v1',
        schemaReady: true, schemaTables: TABLE_COUNT,
        mode, readOnlyApiEnabled: mode === 'READONLY',
        financeWrites: 'OFF', financeRelease: 'NO_GO',
        customerApiVerified: false, employeeAuthVerified: false
      }), { status: 200, headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store', 'x-content-type-options': 'nosniff'
      }});
    } catch {
      // Do not disclose SQL, schema, credentials or provider internals.
      return reply('isolated-accounting-stage-unavailable');
    }
  }
};
