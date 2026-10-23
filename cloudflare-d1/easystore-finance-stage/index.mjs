/**
 * ACC234 EasyStore-only D1 Stage entrypoint.
 * Imports the ORIGINAL financial engine (no duplicate invoice writer).
 * This stage attests D1 health only. All financial/customer/order routes
 * remain hard-disabled in CODE until isolated authentication and canonical
 * TrendOS customer/order API are implemented and independently qualified.
 */
import { handleEmployeeAccountingNativeRequest } from '../src/employee-accounting-native-v1.mjs';

const HEALTH = '/v1/employee/accounting/health';
const API = '/v1/employee/accounting';
const TABLE_COUNT = 22;

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
    // No orders, no customer enumeration, and NO native finance POST routing,
    // including in CANARY/GENERAL if somebody changes database control flags.
    if (path === API) return reply('isolated-stage-financial-routes-disabled');
    if (path !== HEALTH) return reply('not-found', 404);
    if (request.method !== 'GET') return reply('method-not-allowed', 405);
    if (!env || !env.DB) return reply('isolated-accounting-d1-binding-missing');
    if (env.EASYSTORE_CUSTOMER_SOURCE_V1!=='REMOTE_REQUIRED')
      return reply('isolated-official-customer-source-not-enforced');
    if (env.EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1!=='REMOTE_NATIVE_REQUIRED')
      return reply('isolated-native-employee-session-not-enforced');
    try {
      const stage = await env.DB.prepare(
        "SELECT mode FROM employee_accounting_control_v1 WHERE singleton=1 AND marker='ENTRY614_ACCOUNTING_V1'"
      ).first();
      const tables = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name LIKE 'employee_accounting_%'"
      ).first();
      // ACC236: even 22 correct finance tables are NOT sufficient if a
      // mixed TrendOS/employee D1 was accidentally bound to finance Stage.
      const forbidden = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND "+
        "(name LIKE 't12_%' OR name LIKE 'employee_auth_%' OR "+
        "name IN ('orders','customers','messages'))"
      ).first();
      if (!stage || stage.mode !== 'OFF' || Number(tables?.n) !== TABLE_COUNT || Number(forbidden?.n) !== 0)
        return reply('isolated-accounting-stage-schema-or-mode-not-ready');
      const native = await handleEmployeeAccountingNativeRequest(request, env);
      if (!native.ok) return reply('native-accounting-health-failed');
      const data = await native.json();
      if (!data.success || !data.schemaReady || data.mode !== 'OFF' ||
          data.authoritativeWrites !== false)
        return reply('native-accounting-control-invariant-failed');
      return new Response(JSON.stringify({
        success: true, stage: 'easystore-accounting-staging',
        nativeEngine: 'employee-accounting-native-v1',
        schemaReady: true, schemaTables: TABLE_COUNT,
        mode: 'OFF', financeWrites: 'OFF', financeRelease: 'NO_GO',
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
