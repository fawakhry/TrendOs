// SOURCE_ONLY: invoke only after an approved Cloudflare Access policy + Service Auth token.
// Non-destructive GET checks, no redirects followed and no response bodies logged.
export const OWNER_CONSOLE_PROTECTED_POSTDEPLOY_VERSION = 'AP092_PROTECTED_POSTDEPLOY_V1';
export const PRIVATE_ROUTES = Object.freeze(['/', '/dashboard', '/owner', '/manager-center', '/state', '/api/state']);
const ORIGIN = 'https://autonomous-printshop-dashboard.trendmall-contact.workers.dev';

function blocked(code, checked = 0) {
  return { success: false, status: 'BLOCKED_SAFE', code, checked, version: OWNER_CONSOLE_PROTECTED_POSTDEPLOY_VERSION };
}
function accessRedirect(response, origin) {
  if (![301, 302, 303, 307, 308].includes(response.status)) return false;
  try {
    const dest = new URL(response.headers?.get('location') || '', origin);
    return dest.protocol === 'https:' && (
      dest.hostname.endsWith('.cloudflareaccess.com') ||
      (dest.origin === origin && dest.pathname.startsWith('/cdn-cgi/access/'))
    );
  } catch { return false; }
}
function safeOrigin(input) {
  try {
    const url = new URL(input);
    return url.origin === ORIGIN && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}
function headerValue(v) { return typeof v === 'string' && v.length > 3 && v.trim() === v && !/[\r\n]/.test(v); }
function validState(s) {
  return s && s.success === true && s.mode === 'CONTROL_TOWER_SHADOW' &&
    s.writesAccepted === false && s.d1Mutation === false && s.employeeAssignment === false &&
    s.employees?.blockers?.control?.mode === 'SHADOW' &&
    s.ownerExceptionModel?.authorityBoundaries?.commsSend === false;
}

// Caller passes explicit credentials from a secure store; no global secrets are read implicitly.
// The result is fixed-shape, safe to log; never return fetch errors, headers or private response bodies.
export async function verifyProtectedOwnerConsoleV1({
  origin = ORIGIN, clientId, clientSecret, fetchImpl = fetch
} = {}) {
  if (!safeOrigin(origin)) return blocked('UNAPPROVED_ORIGIN');
  if (!headerValue(clientId) || !headerValue(clientSecret)) return blocked('SERVICE_AUTH_NOT_CONFIGURED');
  if (typeof fetchImpl !== 'function') return blocked('FETCH_NOT_CONFIGURED');
  let checked = 0;
  for (const route of PRIVATE_ROUTES) {
    let response;
    try {
      response = await fetchImpl(new URL(route, origin), {
        method: 'GET', redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(10000)
      });
      checked += 1;
      if (![401, 403].includes(response.status) && !accessRedirect(response, origin)) {
        return blocked('ANONYMOUS_ACCESS_NOT_DENIED', checked);
      }
    } catch {
      return blocked('ANONYMOUS_PROBE_FAILED', checked);
    } finally {
      try { await response?.body?.cancel?.(); } catch { /* ignored */ }
    }
  }
  const headers = new Headers({
    'CF-Access-Client-Id': clientId,
    'CF-Access-Client-Secret': clientSecret
  });
  const checks = [['/health', 'health'], ['/state', 'state'], ['/', 'page']];
  for (const [route, kind] of checks) {
    let response;
    try {
      response = await fetchImpl(new URL(route, origin), {
        method: 'GET', redirect: 'manual', cache: 'no-store', headers,
        signal: AbortSignal.timeout(10000)
      });
      checked += 1;
      if (response.status !== 200) return blocked('AUTHORIZED_READ_NOT_OK', checked);
      if (kind === 'health') {
        const h = await response.json();
        if (h?.success !== true || h.service !== 'autonomous-printshop-dashboard' ||
            h.mode !== 'READ_ONLY_OWNER_EXCEPTION_CONSOLE' ||
            h.businessWrites !== false || h.employeeAssignment !== false) {
          return blocked('HEALTH_BOUNDARY_INVALID', checked);
        }
      } else if (kind === 'state') {
        if (!validState(await response.json())) return blocked('SHADOW_BOUNDARY_INVALID', checked);
      } else {
        const html = await response.text();
        if (!html.includes('مركز إدارة المطبعة الذاتية') ||
            !html.includes('قرارات تحتاج تدخلك') ||
            !html.includes('رسائل تنتظر رد')) return blocked('OWNER_PAGE_INVALID', checked);
      }
    } catch {
      return blocked('AUTHORIZED_PROBE_FAILED', checked);
    } finally {
      try { await response?.body?.cancel?.(); } catch { /* ignored */ }
    }
  }
  return { success: true, status: 'PROTECTED_READ_VERIFIED', checked,
    version: OWNER_CONSOLE_PROTECTED_POSTDEPLOY_VERSION };
}
