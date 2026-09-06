import {
  buildDashboardFromRows,
  mapMirrorRows,
  verifyOrdersEdgeToken
} from './edge-orders-read-v1.mjs';
import { enrichFromMirrors02CR } from './edge-orders-operational-enrichment-02cr.mjs';

const PATH_02CR = '/v1/edge/orders/02cr/page';
const LINES_NOTE_02CR = 'TrendOS orders live sync V2 quota-aware';
const ENRICHMENT_NOTE_02CR = 'PERF-CF-02CR enrichment live sync V1';
const SHEETS_02CR = Object.freeze({
  lines: 'بنود الأوردرات',
  customers: 'العملاء',
  restrictions: 'عملاء منع التسليم بالمديونية'
});

function text(value) { return String(value == null ? '' : value).trim(); }
function clampInt(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
}
function normalizeArabic(value) {
  return text(value).toLowerCase()
    .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي').replace(/[ةه]/g, 'ه').replace(/\s+/g, ' ').trim();
}
function searchKey(value) {
  return normalizeArabic(value).replace(/[^0-9a-z\u0600-\u06ff ]/g, ' ').replace(/\s+/g, ' ').trim();
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
    'access-control-allow-methods': 'GET,OPTIONS',
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
function arabicDigits(value) {
  const map = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  return String(value || '').replace(/[٠-٩]/g, (d) => map[d] || d);
}
function parseDate(value) {
  const raw = arabicDigits(text(value));
  if (!raw) return null;
  const m = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
function sameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isHeatPress(value) {
  const s = text(value).toLowerCase();
  return s === 'نعم' || s === 'true' || s === '1' || s === 'on' || s === 'مكبس' || s === 'yes';
}
function isHidden(status) {
  const s = text(status);
  return s === 'جاهز للاستلام' || s === 'تم التسليم' || s === 'مكرر' || s === 'تم التنفيذ' || s === 'جاهز للطباعة' || s === 'ملغى';
}
function priorityRank(priority) {
  const p = text(priority) || 'عادي';
  if (p === 'عاجل' || p === 'VIP') return 0;
  if (p === 'عادي') return 1;
  if (p === 'مؤجل') return 2;
  return 9;
}
function sortLikeAppsRows(rows) {
  return (rows || []).slice().sort((a, b) => {
    const rank = priorityRank(a && a.priority) - priorityRank(b && b.priority);
    if (rank) return rank;
    return String(a && a.orderId || '').localeCompare(String(b && b.orderId || ''));
  });
}
function rowMatchesAppsFilters(row, params, now = new Date()) {
  const q = searchKey(params.query || params.q || '');
  const status = text(params.statusFilter || params.status || '');
  const priority = text(params.priorityFilter || params.priority || '');
  const heat = text(params.heatPressFilter || '');

  if (q) {
    const blob = searchKey([
      row.orderId,row.lineId,row.customer,row.customerPhone,row.department,row.itemName,row.notes
    ].join(' '));
    if (blob.indexOf(q) === -1) return false;
  }
  if (heat === 'only' && !isHeatPress(row.heatPress)) return false;
  if (heat === 'without' && isHeatPress(row.heatPress)) return false;
  if (status === '__ACTIVE__' && isHidden(row.status)) return false;
  if (status === '__OVERDUE__' && text(row.overdue) !== 'نعم') return false;
  if (status === '__TODAY_WORK__') {
    const today = new Date(now), yesterday = new Date(today), tomorrow = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    tomorrow.setDate(today.getDate() + 1);
    const received = parseDate(row.receivedAt);
    const expected = parseDate(row.expectedDeliveryAt || row.expectedDeliveryText);
    if (isHidden(row.status) || !received || !expected || !sameDay(received, yesterday) || !sameDay(expected, tomorrow)) return false;
  }
  if (status === '__READY_PICKUP__' && !['جاهز للاستلام','في قسم التسليمات','تم التنفيذ'].includes(text(row.status))) return false;
  if (status === '__CANCELLED__' && !['ملغي','ملغى'].includes(text(row.status))) return false;
  if (status === '__DELIVERED_TODAY__' && (text(row.status) !== 'تم التسليم' || !sameDay(parseDate(row.updatedAt), new Date(now)))) return false;
  if (status && !status.startsWith('__') && text(row.status) !== status) return false;
  if (priority === '__ACTIVE__' && !['عاجل','عادي','VIP',''].includes(text(row.priority))) return false;
  if (priority && priority !== '__ACTIVE__' && text(row.priority) !== priority) return false;
  return true;
}
function statusCounts(rows) {
  const counts = {};
  const orderSets = {};
  for (const row of rows || []) {
    const key = text(row && row.status) || 'طلب جديد';
    counts[key] = Number(counts[key] || 0) + 1;
    if (!orderSets[key]) orderSets[key] = new Set();
    const orderId = text(row && row.orderId);
    if (orderId) orderSets[key].add(orderId);
  }
  const orderCounts = {};
  Object.keys(orderSets).forEach((key) => { orderCounts[key] = orderSets[key].size; });
  return { statusCounts:counts, statusOrderCounts:orderCounts };
}

async function readMirror(env, sheetName) {
  const catalog = await env.DB.prepare(`
    SELECT headers_json AS headersJson,
           source_last_row AS sourceLastRow,
           source_last_col AS sourceLastCol,
           row_count AS rowCount,
           status,
           synced_at AS syncedAt,
           note
      FROM sheet_catalog
     WHERE sheet_name = ?
     LIMIT 1
  `).bind(sheetName).first();
  if (!catalog) throw new Error(`02CR operational mirror missing: ${sheetName}`);
  const query = await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           values_json AS valuesJson,
           display_json AS displayJson
      FROM sheet_rows
     WHERE sheet_name = ?
     ORDER BY row_number
  `).bind(sheetName).all();
  const rows = (query.results || []).map((r) => ({
    rowNumber: Number(r.rowNumber || 0),
    values: JSON.parse(r.valuesJson || '[]'),
    display: JSON.parse(r.displayJson || '[]')
  }));
  return { catalog, headers: JSON.parse(catalog.headersJson || '[]'), rows };
}

function mirrorQualified(mirror, expectedNote) {
  const c = mirror && mirror.catalog || {};
  return text(c.status) === 'ready' &&
    Number(c.rowCount || 0) === Number(c.sourceLastRow || 0) &&
    text(c.note) === text(expectedNote);
}

function safeMirrorMeta(sheetName, mirror) {
  const c = mirror && mirror.catalog || {};
  return {
    sheetName,
    sourceLastRow: Number(c.sourceLastRow || 0),
    sourceLastCol: Number(c.sourceLastCol || 0),
    rowCount: Number(c.rowCount || 0),
    status: text(c.status),
    syncedAt: text(c.syncedAt),
    note: text(c.note)
  };
}

export function isEdgeOrders02CRPath(path) {
  return (String(path || '').replace(/\/+$/, '') || '/') === PATH_02CR;
}

export async function handleEdgeOrders02CRCanaryRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (request.method === 'OPTIONS' && path === PATH_02CR) return new Response(null, { status:204, headers:corsHeaders(request, env) });
  if (request.method !== 'GET' || path !== PATH_02CR) return null;

  const verified = await verifyOrdersEdgeToken(bearer(request), text(env.EDGE_SESSION_SECRET));
  if (!verified.ok) return json({ success:false, code:verified.reason, message:'Unauthorized orders edge session' }, 401, corsHeaders(request, env));

  const screen = text(url.searchParams.get('screen') || 'service');
  const allowed = Array.isArray(verified.payload.screens) ? verified.payload.screens : [];
  if (allowed.length && !allowed.includes(screen)) return json({ success:false, message:'غير مصرح لك بعرض أوردرات هذا القسم.' }, 403, corsHeaders(request, env));
  const params = Object.fromEntries(url.searchParams.entries());
  if (text(params.statusFilter) === '__DEBT__') return json({ success:false, code:'apps-script-required', fallback:'apps-script', message:'Debt-filtered orders require the authoritative Apps Script lane.' }, 409, corsHeaders(request, env));

  try {
    const [lines, customers, restrictions] = await Promise.all([
      readMirror(env, SHEETS_02CR.lines),
      readMirror(env, SHEETS_02CR.customers),
      readMirror(env, SHEETS_02CR.restrictions)
    ]);
    const mirrors = [
      [SHEETS_02CR.lines, lines, LINES_NOTE_02CR],
      [SHEETS_02CR.customers, customers, ENRICHMENT_NOTE_02CR],
      [SHEETS_02CR.restrictions, restrictions, ENRICHMENT_NOTE_02CR]
    ];
    const failed = mirrors.filter(([, mirror, expectedNote]) => !mirrorQualified(mirror, expectedNote));
    if (failed.length) {
      return json({ success:false, code:'02cr-operational-mirror-not-qualified', fallback:'apps-script', mirrors:failed.map(([name, mirror]) => safeMirrorMeta(name, mirror)) }, 503, corsHeaders(request, env));
    }

    const mapped = mapMirrorRows(lines.headers, lines.rows, screen);
    const enriched = sortLikeAppsRows(enrichFromMirrors02CR(mapped, customers, restrictions, new Date()));
    const counts = statusCounts(enriched);
    const filtered = enriched.filter((row) => rowMatchesAppsFilters(row, params));
    const dashboard = buildDashboardFromRows(enriched, screen);
    const pageSize = clampInt(params.pageSize, 20, 5, 100);
    const requestedPage = clampInt(params.page, 1, 1, 1000000);
    const totalRows = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * pageSize;

    return json({
      success:true,
      rows:filtered.slice(start, start + pageSize),
      dashboard,
      pagination:{ page, pageSize, totalRows, totalPages, hasOlder:page < totalPages },
      statusCounts:counts.statusCounts,
      statusOrderCounts:counts.statusOrderCounts,
      serverPaged:true,
      dataVersion:text(lines.catalog.syncedAt) || 'd1',
      version:'D1_ORDERS_READ_02CR_OPERATIONAL_CANARY',
      dataSource:'d1-edge-orders-02cr-operational',
      edgeSession:verified.payload.sub,
      mirrors:mirrors.map(([name, mirror]) => safeMirrorMeta(name, mirror))
    }, 200, corsHeaders(request, env));
  } catch (err) {
    return json({ success:false, code:'02cr-operational-canary-error', fallback:'apps-script', message:String(err && err.message ? err.message : err) }, 502, corsHeaders(request, env));
  }
}
