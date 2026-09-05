import {
  buildDashboardFromRows,
  handleEdgeOrdersReadRequest,
  isEdgeOrdersReadPath,
  mapMirrorRows,
  verifyOrdersEdgeToken
} from './edge-orders-read-v1.mjs';

const LINES_SHEET = 'بنود الأوردرات';
const LIVE_NOTES = ['TrendOS orders live sync V1', 'TrendOS orders live sync V2 quota-aware'];

function text(value) { return String(value == null ? '' : value).trim(); }
function clampInt(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
}
function configuredOrigins(env) {
  const list = String(env.CORS_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
  return list.length ? list : ['https://fawakhry.github.io'];
}
function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  return {
    'access-control-allow-origin': origin && allowed.includes(origin) ? origin : allowed[0],
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(headers || {}) }
  });
}
function bearer(request) {
  const match = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}
function priorityRank(value) {
  const p = text(value);
  if (p === 'عاجل' || p === 'VIP') return 0;
  if (p === 'عادي' || !p) return 1;
  if (p === 'مؤجل') return 2;
  return 9;
}
function arabicDigits(value) {
  const map = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  return String(value || '').replace(/[٠-٩]/g, (d) => map[d] || d);
}
function numericId(value) {
  const raw = arabicDigits(text(value));
  const m = raw.match(/\d+/);
  return m ? Number(m[0]) : 0;
}
function defaultVisibleStatus(status) {
  const s = text(status);
  // Apps Script default department screen is an active/current work list, not a full history view.
  // Ready-for-pickup stays visible because the live Apps response returns it on the default print page.
  return !['ملغى', 'ملغي', 'مكرر', 'تم التسليم', 'تم التنفيذ', 'جاهز للطباعة'].includes(s);
}
function statusBucket(status) {
  const s = text(status) || 'طلب جديد';
  if (s === 'طلب جديد' || s === 'بدأ التنفيذ' || s === 'تحت التنفيذ' || s === 'متوقف' || s === 'مشكلة/متوقف') return 0;
  if (s === 'جاهز للاستلام' || s === 'في قسم التسليمات') return 1;
  return 2;
}
function sortLikeAppsVisiblePage(rows) {
  return (rows || []).slice().sort((a, b) => {
    const byStatus = statusBucket(a.status) - statusBucket(b.status);
    if (byStatus) return byStatus;
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
    if (byPriority) return byPriority;
    const byOrder = numericId(b.orderId) - numericId(a.orderId);
    if (byOrder) return byOrder;
    return numericId(b.lineId) - numericId(a.lineId);
  });
}
function filterRowsForCanary(rows, params) {
  const statusFilter = text(params.statusFilter || params.status || '');
  if (!statusFilter) return sortLikeAppsVisiblePage((rows || []).filter((row) => defaultVisibleStatus(row && row.status)));
  if (statusFilter === '__ACTIVE__') return sortLikeAppsVisiblePage((rows || []).filter((row) => defaultVisibleStatus(row && row.status)));
  return sortLikeAppsVisiblePage((rows || []).filter((row) => text(row && row.status) === statusFilter));
}

async function readMirror(env) {
  const catalog = await env.DB.prepare(`SELECT headers_json AS headersJson, source_last_row AS sourceLastRow, source_last_col AS sourceLastCol, row_count AS rowCount, status, synced_at AS syncedAt, note FROM sheet_catalog WHERE sheet_name = ? LIMIT 1`).bind(LINES_SHEET).first();
  if (!catalog) throw new Error('Orders mirror sheet is missing');
  const query = await env.DB.prepare(`SELECT row_number AS rowNumber, values_json AS valuesJson, display_json AS displayJson FROM sheet_rows WHERE sheet_name = ? ORDER BY row_number`).bind(LINES_SHEET).all();
  const rows = (query.results || []).map((r) => ({ rowNumber: Number(r.rowNumber || 0), values: JSON.parse(r.valuesJson || '[]'), display: JSON.parse(r.displayJson || '[]') }));
  return { catalog, headers: JSON.parse(catalog.headersJson || '[]'), rows };
}

async function canaryPage(request, env, url, session) {
  const screen = text(url.searchParams.get('screen') || 'service');
  const allowed = Array.isArray(session.screens) ? session.screens : [];
  if (allowed.length && !allowed.includes(screen)) return json({ success: false, message: 'غير مصرح لك بعرض أوردرات هذا القسم.' }, 403, corsHeaders(request, env));
  const statusFilter = text(url.searchParams.get('statusFilter'));
  if (statusFilter === '__DEBT__') return json({ success: false, code: 'apps-script-required', fallback: 'apps-script', message: 'Debt-filtered orders require the authoritative Apps Script lane.' }, 409, corsHeaders(request, env));

  const mirror = await readMirror(env);
  const catalog = mirror.catalog;
  const parity = Number(catalog.rowCount || 0) === Number(catalog.sourceLastRow || 0);
  const live = LIVE_NOTES.includes(text(catalog.note));
  if (text(catalog.status) !== 'ready' || !parity || !live) {
    return json({ success: false, code: 'mirror-not-ready', fallback: 'apps-script', dataSource: 'd1-orders-unready', mirror: { status: catalog.status, rowCount: Number(catalog.rowCount||0), sourceLastRow: Number(catalog.sourceLastRow||0), syncedAt: text(catalog.syncedAt), note: text(catalog.note) } }, 503, corsHeaders(request, env));
  }

  const allRows = mapMirrorRows(mirror.headers, mirror.rows, screen);
  const dashboard = buildDashboardFromRows(filterRowsForCanary(allRows, { statusFilter: '' }), screen);
  const params = Object.fromEntries(url.searchParams.entries());
  const filtered = filterRowsForCanary(allRows, params);
  const pageSize = clampInt(url.searchParams.get('pageSize'), 20, 5, 100);
  const requestedPage = clampInt(url.searchParams.get('page'), 1, 1, 1000000);
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(requestedPage, totalPages);
  const start = (safePage - 1) * pageSize;
  return json({
    success: true,
    rows: filtered.slice(start, start + pageSize),
    dashboard,
    pagination: { page: safePage, pageSize, totalRows, totalPages, hasOlder: safePage < totalPages },
    serverPaged: true,
    dataVersion: text(catalog.syncedAt) || 'd1',
    version: 'D1_ORDERS_READ_V1_02CO_CANARY',
    dataSource: 'd1-edge-orders',
    edgeSession: session.sub,
    mirror: { syncedAt: text(catalog.syncedAt), sourceLastRow: Number(catalog.sourceLastRow||0), sourceLastCol: Number(catalog.sourceLastCol||0), note: text(catalog.note) }
  }, 200, corsHeaders(request, env));
}

export { isEdgeOrdersReadPath };

export async function handleEdgeOrdersReadCanaryRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  if (request.method === 'POST' && path === '/v1/edge/orders/session') return handleEdgeOrdersReadRequest(request, env, ctx);
  if (request.method !== 'GET' || path !== '/v1/edge/orders/page') return handleEdgeOrdersReadRequest(request, env, ctx);
  const verified = await verifyOrdersEdgeToken(bearer(request), text(env.EDGE_SESSION_SECRET));
  if (!verified.ok) return json({ success: false, message: 'Unauthorized orders edge session', code: verified.reason }, 401, corsHeaders(request, env));
  try {
    return await canaryPage(request, env, url, verified.payload);
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return json({ success: false, code: 'orders-edge-canary-error', fallback: 'apps-script', message }, 502, corsHeaders(request, env));
  }
}
