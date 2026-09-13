import {
  verifyOrdersEdgeToken,
  buildDashboardFromRows,
  filterRows
} from './edge-orders-read-v1.mjs';

const SERVICE_PATH = '/v1/edge/orders/service/page';
const ORDERS_SHEET = 'الأوردرات';
const LIVE_NOTES = ['TrendOS orders live sync V1', 'TrendOS orders live sync V2 quota-aware'];
const DEFAULT_MAX_AGE_SECONDS = 600;
const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
const HIDDEN_STATUSES = new Set([
  'جاهز للاستلام',
  'تم التسليم',
  'مكرر',
  'تم التنفيذ',
  'جاهز للطباعة',
  'ملغى',
  'ملغي'
]);
const GOOGLE_SHEETS_SERIAL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
const GOOGLE_SHEETS_SERIAL_DAY_MS = 24 * 60 * 60 * 1000;

function text(value) { return String(value == null ? '' : value).trim(); }
function clampInt(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
}
function cleanPhone(value) {
  let digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(2);
  if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);
  if (/^1[0125]\d{8}$/.test(digits)) digits = '0' + digits;
  return digits;
}
function configuredOrigins(env) {
  const list = String((env && env.CORS_ORIGINS) || '').split(',').map((x) => x.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}
function originAllowed(request, env) {
  const origin = text(request.headers.get('Origin'));
  return !origin || configuredOrigins(env).includes(origin);
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
function json(payload, status, request, env) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...corsHeaders(request, env)
    }
  });
}
function bearer(request) {
  const match = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}
function headerIndex(headers, names, fallback = -1) {
  const normalized = (headers || []).map(text);
  for (const name of names) {
    const index = normalized.lastIndexOf(name);
    if (index >= 0) return index;
  }
  return fallback;
}
function valueAt(row, index) { return index >= 0 && index < row.length ? row[index] : ''; }
function parseSqliteUtc(value) {
  const raw = text(value);
  if (!raw) return 0;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw) ? raw.replace(' ', 'T') + 'Z' : raw;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : 0;
}
function maxAgeSeconds(env) {
  const n = Number(env && env.EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS);
  return Number.isFinite(n) ? Math.max(300, Math.min(3600, Math.trunc(n))) : DEFAULT_MAX_AGE_SECONDS;
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
function semanticSortMs(rawValue, displayValue) {
  const raw = text(rawValue);
  if (raw) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
    if (/^\d+(?:\.\d+)?$/.test(raw)) {
      const serial = Number(raw);
      if (Number.isFinite(serial) && serial > 0) return GOOGLE_SHEETS_SERIAL_EPOCH_UTC_MS + serial * GOOGLE_SHEETS_SERIAL_DAY_MS;
    }
  }
  const display = arabicDigits(text(displayValue));
  if (!display) return 0;
  let m = display.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const month = Number(m[1]), day = Number(m[2]), year = Number(m[3]);
    const hour = Number(m[4] || 0), minute = Number(m[5] || 0), second = Number(m[6] || 0);
    const ms = Date.UTC(year, month - 1, day, hour, minute, second);
    if (Number.isFinite(ms)) return ms;
  }
  const parsed = Date.parse(display);
  return Number.isFinite(parsed) ? parsed : 0;
}
function parseDate(value) {
  const raw = arabicDigits(text(value));
  if (!raw) return null;
  let m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  m = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}
function overdue(status, expected) {
  if (HIDDEN_STATUSES.has(text(status))) return false;
  const date = parseDate(expected);
  if (!date) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return date.getTime() < today.getTime();
}
function isQualification(orderId, status) {
  return text(status) === 'cloud-qualification' || text(orderId).startsWith('CW-PROD-QUAL-');
}

export function inspectServiceOrdersCatalog(catalog, nowMs = Date.now(), configuredMaxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const maxAge = Number.isFinite(Number(configuredMaxAgeSeconds))
    ? Math.max(300, Math.min(3600, Math.trunc(Number(configuredMaxAgeSeconds))))
    : DEFAULT_MAX_AGE_SECONDS;
  const c = catalog || {};
  const syncedMs = parseSqliteUtc(c.syncedAt);
  const ageSeconds = syncedMs ? Math.max(0, Math.round((Number(nowMs) - syncedMs) / 1000)) : Number.MAX_SAFE_INTEGER;
  const parity = Number(c.rowCount || 0) === Number(c.sourceLastRow || 0);
  const live = LIVE_NOTES.includes(text(c.note));
  const statusReady = text(c.status) === 'ready';
  const fresh = ageSeconds <= maxAge;
  return {
    ready: statusReady && parity && live && fresh,
    statusReady,
    parity,
    live,
    fresh,
    ageSeconds,
    maxAgeSeconds: maxAge,
    syncedAt: text(c.syncedAt),
    status: text(c.status),
    rowCount: Number(c.rowCount || 0),
    sourceLastRow: Number(c.sourceLastRow || 0),
    sourceLastCol: Number(c.sourceLastCol || 0),
    note: text(c.note),
    sheetName: ORDERS_SHEET
  };
}

export function mapServiceOrdersRows(headers, mirrorRows) {
  const c = {
    orderId: headerIndex(headers, ['رقم الأوردر','id'], 0),
    orderCode: headerIndex(headers, ['كود الأوردر'], 1),
    customer: headerIndex(headers, ['اسم الشات / المكتب','customerName'], 3),
    owner: headerIndex(headers, ['اسم المسؤول'], 4),
    phone: headerIndex(headers, ['رقم العميل','customerPhone'], 5),
    externalPhone: headerIndex(headers, ['رقم عميل خارجي'], 6),
    customerType: headerIndex(headers, ['نوع العميل'], 7),
    department: headerIndex(headers, ['القسم الرئيسي','department'], 8),
    summary: headerIndex(headers, ['وصف مختصر'], 9),
    priority: headerIndex(headers, ['الأولوية'], 10),
    status: headerIndex(headers, ['الحالة العامة','status'], 11),
    updated: headerIndex(headers, ['آخر تحديث'], 12),
    lineCount: headerIndex(headers, ['عدد البنود'], 13),
    readyCount: headerIndex(headers, ['بنود جاهزة'], 14),
    notReadyCount: headerIndex(headers, ['بنود غير جاهزة'], 15),
    partial: headerIndex(headers, ['تسليم جزئي؟'], 16),
    mainExecutor: headerIndex(headers, ['الكيان المنفذ الرئيسي'], 17),
    notes: headerIndex(headers, ['ملاحظات','notes'], 18),
    received: headerIndex(headers, ['تاريخ الاستلام'], -1),
    expected: headerIndex(headers, ['تاريخ التسليم المتوقع'], -1),
    source: headerIndex(headers, ['مصدر الطلب'], -1),
    entryType: headerIndex(headers, ['نوع إدخال العميل'], -1),
    externalCustomerId: headerIndex(headers, ['علامة العميل الخارجي'], -1),
    notified: headerIndex(headers, ['تم إبلاغ العميل؟'], -1),
    notifiedAt: headerIndex(headers, ['وقت الإبلاغ'], -1),
    notifiedBy: headerIndex(headers, ['تم الإبلاغ بواسطة'], -1),
    waMessage: headerIndex(headers, ['آخر رسالة واتساب'], -1),
    waAt: headerIndex(headers, ['آخر وقت واتساب'], -1),
    waBy: headerIndex(headers, ['آخر واتساب بواسطة'], -1),
    registrationSent: headerIndex(headers, ['تم إرسال رسالة التسجيل؟'], -1)
  };
  const out = [];
  const updatedSortMsByRow = new Map();
  for (const item of mirrorRows || []) {
    if (Number(item && item.rowNumber || 0) <= 1) continue;
    const display = Array.isArray(item.display) && item.display.length ? item.display : (Array.isArray(item.values) ? item.values : []);
    const raw = Array.isArray(item.values) ? item.values : [];
    const orderId = text(valueAt(display, c.orderId));
    const status = text(valueAt(display, c.status)) || 'طلب جديد';
    if (!orderId || HIDDEN_STATUSES.has(status)) continue;
    const customerMode = text(valueAt(display, c.entryType));
    if (!customerMode && !isQualification(orderId, status)) continue;
    const phone = cleanPhone(valueAt(display, c.phone));
    const expected = text(valueAt(display, c.expected));
    out.push({
      rowNumber: Number(item.rowNumber || 0),
      orderId,
      orderCode: text(valueAt(display, c.orderCode)) || orderId,
      lineId: phone,
      customer: text(valueAt(display, c.customer)),
      customerPhone: phone,
      externalCustomerPhone: cleanPhone(valueAt(display, c.externalPhone)),
      customerType: text(valueAt(display, c.customerType)),
      customerSource: text(valueAt(display, c.source)),
      source: text(valueAt(display, c.source)),
      customerMode,
      externalCustomerId: text(valueAt(display, c.externalCustomerId)),
      department: text(valueAt(display, c.department)),
      assignedTo: text(valueAt(display, c.owner)),
      itemName: text(valueAt(display, c.summary)),
      priority: text(valueAt(display, c.priority)) || 'عادي',
      status,
      updatedAt: text(valueAt(display, c.updated)),
      notes: text(valueAt(display, c.notes)),
      receivedAt: text(valueAt(display, c.received)),
      expectedDeliveryAt: expected,
      expectedDeliveryText: expected,
      overdue: overdue(status, expected) ? 'نعم' : 'لا',
      lineCount: Number(valueAt(display, c.lineCount) || 0),
      readyCount: Number(valueAt(display, c.readyCount) || 0),
      notReadyCount: Number(valueAt(display, c.notReadyCount) || 0),
      partialDelivery: text(valueAt(display, c.partial)),
      mainExecutor: text(valueAt(display, c.mainExecutor)),
      customerNotified: text(valueAt(display, c.notified)),
      notifiedAt: text(valueAt(display, c.notifiedAt)),
      notifiedBy: text(valueAt(display, c.notifiedBy)),
      lastWhatsAppMessage: text(valueAt(display, c.waMessage)),
      lastWhatsAppAt: text(valueAt(display, c.waAt)),
      lastWhatsAppBy: text(valueAt(display, c.waBy)),
      registrationSent: text(valueAt(display, c.registrationSent))
    });
    updatedSortMsByRow.set(Number(item.rowNumber || 0), semanticSortMs(valueAt(raw, c.updated), valueAt(display, c.updated)));
  }
  out.sort((a, b) =>
    priorityRank(a.priority) - priorityRank(b.priority) ||
    Number(updatedSortMsByRow.get(b.rowNumber) || 0) - Number(updatedSortMsByRow.get(a.rowNumber) || 0) ||
    Number(a.rowNumber || 0) - Number(b.rowNumber || 0)
  );
  return out;
}

async function readOrdersMirror(env) {
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
  `).bind(ORDERS_SHEET).first();
  if (!catalog) return null;
  const result = await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           values_json AS valuesJson,
           display_json AS displayJson
      FROM sheet_rows
     WHERE sheet_name = ?
     ORDER BY row_number
  `).bind(ORDERS_SHEET).all();
  const rows = (result.results || []).map((row) => ({
    rowNumber: Number(row.rowNumber || 0),
    values: JSON.parse(row.valuesJson || '[]'),
    display: JSON.parse(row.displayJson || '[]')
  }));
  return { catalog, headers: JSON.parse(catalog.headersJson || '[]'), rows };
}

function statusCountsFor(rows) {
  const statusCounts = {};
  const statusOrderCounts = {};
  for (const row of rows || []) {
    const status = text(row && row.status) || 'طلب جديد';
    statusCounts[status] = Number(statusCounts[status] || 0) + 1;
    statusOrderCounts[status] = Number(statusOrderCounts[status] || 0) + 1;
  }
  return { statusCounts, statusOrderCounts };
}

async function page(request, env, url, session) {
  const allowedScreens = Array.isArray(session && session.screens) ? session.screens.map(text) : [];
  if (!allowedScreens.includes('service')) {
    return json({ success: false, message: 'غير مصرح لك بعرض أوردرات خدمة العملاء.' }, 403, request, env);
  }
  const requestedScreen = text(url.searchParams.get('screen') || 'service');
  if (requestedScreen !== 'service') {
    return json({ success: false, message: 'Service route only accepts screen=service.' }, 400, request, env);
  }
  const statusFilter = text(url.searchParams.get('statusFilter'));
  if (statusFilter === '__DEBT__') {
    return json({ success: false, code: 'apps-script-required', fallback: 'apps-script', message: 'Debt-filtered service orders require Apps Script.' }, 409, request, env);
  }
  if (!env || !env.DB || typeof env.DB.prepare !== 'function') {
    return json({ success: false, code: 'orders-mirror-check-error', fallback: 'apps-script', dataSource: 'd1-orders-unavailable', message: 'Orders mirror is unavailable.' }, 503, request, env || {});
  }
  const mirror = await readOrdersMirror(env);
  if (!mirror) {
    return json({ success: false, code: 'mirror-not-ready', fallback: 'apps-script', dataSource: 'd1-orders-unready', message: 'Orders mirror metadata is missing.' }, 503, request, env);
  }
  const inspection = inspectServiceOrdersCatalog(mirror.catalog, Date.now(), maxAgeSeconds(env));
  if (!inspection.ready) {
    return json({
      success: false,
      code: inspection.statusReady && inspection.parity && inspection.live ? 'stale-orders-mirror' : 'mirror-not-ready',
      fallback: 'apps-script',
      dataSource: inspection.fresh ? 'd1-orders-unready' : 'd1-orders-stale',
      message: inspection.fresh ? 'Orders mirror is not ready.' : 'Orders mirror is stale.',
      mirror: inspection,
      mirrors: [inspection]
    }, 503, request, env);
  }
  const allRows = mapServiceOrdersRows(mirror.headers, mirror.rows);
  const params = Object.fromEntries(url.searchParams.entries());
  const filtered = filterRows(allRows, params);
  const pageSize = clampInt(url.searchParams.get('pageSize'), 20, 5, 100);
  const requestedPage = clampInt(url.searchParams.get('page'), 1, 1, 1000000);
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(requestedPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const counts = statusCountsFor(allRows);
  return json({
    success: true,
    rows: filtered.slice(start, start + pageSize),
    dashboard: buildDashboardFromRows(allRows, 'service'),
    pagination: { page: safePage, pageSize, totalRows, totalPages, hasOlder: safePage < totalPages },
    statusCounts: counts.statusCounts,
    statusOrderCounts: counts.statusOrderCounts,
    serverPaged: true,
    dataVersion: inspection.syncedAt || 'd1',
    version: 'D1_SERVICE_ORDERS_READ_V1',
    dataSource: 'd1-edge-orders-service-v1',
    edgeSession: text(session && session.sub),
    mirror: inspection,
    mirrors: [inspection],
    serviceProjection: { source: ORDERS_SHEET, modernShapeOnly: true, writesAuthoritative: 'apps-script' }
  }, 200, request, env);
}

export function isEdgeOrdersServiceReadPath(path) {
  return path === SERVICE_PATH;
}

export async function handleEdgeOrdersServiceReadRequest(request, env) {
  const cors = corsHeaders(request, env || {});
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!originAllowed(request, env || {})) return json({ success: false, message: 'Origin not allowed' }, 403, request, env || {});
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (path !== SERVICE_PATH || request.method !== 'GET') return json({ success: false, message: 'Method not allowed' }, 405, request, env || {});
  try {
    const verified = await verifyOrdersEdgeToken(bearer(request), text(env && env.EDGE_SESSION_SECRET));
    if (!verified.ok) return json({ success: false, message: 'Unauthorized orders edge session', code: verified.reason }, 401, request, env);
    return page(request, env, url, verified.payload);
  } catch (err) {
    return json({ success: false, code: 'service-orders-edge-error', fallback: 'apps-script', message: err && err.message ? err.message : String(err) }, 502, request, env || {});
  }
}

export const SERVICE_ORDERS_READ_PATH = SERVICE_PATH;
