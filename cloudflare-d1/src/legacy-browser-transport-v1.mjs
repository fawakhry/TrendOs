import { rememberCloudAuthShadow, revokeCloudAuthShadow } from './cloud-auth-shadow-v1.mjs';
/* Temporary transport only: Apps Script still authorizes legacy sessions/actions.
 * Fixed upstream from server config; no D1 writes, credential storage, or native bridge.
 */
export const LEGACY_BROWSER_PATH = '/v1/legacy-api';
export const LEGACY_BROWSER_ACTIONS = new Set([
  'login', 'logout', 'verifyEmployeeSession', 'changePassword',
  'customerLogin', 'customerLogout', 'changeCustomerPassword', 'getCustomerOrders',
  'getCustomerPortalAccountsV1859', 'createCustomerDraft', 'addCustomerDraftItem',
  'submitCustomerDraft', 'uploadCustomerDraftFile',
  'getRows', 'getRowsPageV1931', 'getDashboard', 'updateLine', 'updateRowV1931',
  'markCustomerNotified', 'bulkUpdateDepartmentStatusV1926', 'archiveDeliveredDepartmentV1926',
  'attendanceV1', 'attendanceClockinV1', 'cleaningV1', 'hrV1', 'pressControlV1',
  'customerFeedbackV1', 'customerManagerV1', 'goLiveAutopilotV1', 'operatorTaskV2', 'workQueueV1',
  'getAccounting', 'initAccounting', 'recalculateAccountingMaterials', 'getDeptInvoiceDraftV1887', 'getPartyAccountV1858',
  'approveAccountingDeptInvoice', 'saveAccountingDeptLine', 'saveAccountingFinalInvoice',
  'saveAccountingMaterial', 'saveAccountingTemplate', 'savePartyLedgerTransaction',
  'prepareReadyInvoice', 'getActivityLog', 'getKnowledge', 'getLeadPhoneNumbers',
  'getMarketplace', 'getMatbagyNotes', 'getOrderConversation', 'getFranchiseBranches',
  'getPlatformAds', 'getPlatformSections', 'getServiceProviderRoutes',
  'getTrendMasterCenterV1931', 'getTrendMasterPanelV1931', 'getWhiteLabelSettings',
  'assignCustomerBranch', 'deletePlatformAd', 'saveFranchiseBranch', 'saveKnowledge',
  'saveMarketplaceProduct', 'saveMarketplaceVendor', 'saveMatbagyNote',
  'savePlatformSection', 'saveServiceProviderRoute', 'saveWhiteLabelSettings',
  'sendOrderConversationMessage', 'uploadOrderConversationFile', 'uploadPlatformAd'
]);
function reply(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type, accept' } : {})
  }});
}
export async function handleLegacyBrowserTransport(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = String(env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (origin && !allowed.includes(origin)) return reply({ success: false, code: 'LEGACY_ORIGIN_DENIED' }, 403);
  if (request.method === 'OPTIONS') return reply({}, 200, origin);
  if (request.method !== 'POST') return reply({ success: false, code: 'LEGACY_METHOD_DENIED' }, 405, origin);
  let body;
  try { body = await request.json(); } catch { return reply({ success: false, code: 'LEGACY_INVALID_JSON' }, 400, origin); }
  if (!body || Array.isArray(body) || typeof body !== 'object' || !LEGACY_BROWSER_ACTIONS.has(body.action)) {
    return reply({ success: false, code: 'LEGACY_ACTION_DENIED', message: 'الإجراء غير متاح عبر Cloud transport.' }, 403, origin);
  }
  // Caller cannot select a target, forward headers, or use this path for D1-native actions.
  let upstream;
  try {
    upstream = new URL(env.APPS_SCRIPT_API_URL);
    if (upstream.protocol !== 'https:' || upstream.hostname !== 'script.google.com' ||
        !/^\/macros\/s\/[^/]+\/exec$/.test(upstream.pathname) || upstream.search || upstream.hash || upstream.username || upstream.password) throw new Error();
  } catch { return reply({ success: false, code: 'LEGACY_UPSTREAM_UNCONFIGURED' }, 503, origin); }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    // No retries: writes/auth may have completed even when an ACK is lost.
    const response = await fetch(upstream.href, { method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8', accept: 'application/json' },
      body: JSON.stringify(body), redirect: 'follow', signal: controller.signal });
    const raw = await response.text();
    if (!response.ok) return reply({ success: false, code: 'LEGACY_UPSTREAM_UNAVAILABLE',
      message: 'تعذر اتصال Cloud بالخدمة القديمة. الجلسة لم تُلغَ.' }, 502, origin);
    let data;
    try { data = JSON.parse(raw); } catch { return reply({ success: false, code: 'LEGACY_UPSTREAM_INVALID_JSON' }, 502, origin); }
    if (!data || Array.isArray(data) || typeof data !== 'object') return reply({ success: false, code: 'LEGACY_UPSTREAM_INVALID_JSON' }, 502, origin);

    // A successful legacy auth response is the one Google round-trip we already
    // paid for. Seed the D1 fingerprint shadow here so Orders/session does not
    // immediately perform a second Apps Script verification. This is best-effort
    // and never stores plaintext password/token.
    if (data.success === true && (body.action === 'login' || body.action === 'verifyEmployeeSession')) {
      const authUser = data.user || {};
      const username = String(authUser.username || authUser.name || data.username || body.username || body.name || '').trim();
      const token = String(authUser.token || data.token || body.token || '').trim();
      if (username && token) {
        try { await rememberCloudAuthShadow(username, token, data, env); } catch {}
      }
    }

    // Logout/password-change invalidates the previously verified fingerprint.
    if (data.success === true && (body.action === 'logout' || body.action === 'changePassword')) {
      const username = String(body.username || body.name || '').trim();
      const token = String(body.token || '').trim();
      if (username && token) {
        try { await revokeCloudAuthShadow(username, token, env); } catch {}
      }
    }

    // Rebuild response locally; never expose Google Location/redirect headers to Browser.
    return reply(data, 200, origin);
  } catch {
    return reply({ success: false, code: 'LEGACY_UPSTREAM_UNAVAILABLE',
      message: 'تعذر اتصال Cloud بالخدمة القديمة. الجلسة لم تُلغَ.' }, 502, origin);
  } finally { clearTimeout(timer); }
}
