const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const TOKEN_AUDIENCE = 'trendos-orders-edge';
const TOKEN_VERSION = 'v1';
const DEFAULT_TTL_SECONDS = 600;
const MAX_TTL_SECONDS = 900;
const LINES_SHEET = 'بنود الأوردرات';
const LIVE_NOTES = ['TrendOS orders live sync V1', 'TrendOS orders live sync V2 quota-aware'];

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
function normalizeArabic(value) {
  return text(value).toLowerCase()
    .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي').replace(/[ةه]/g, 'ه').replace(/\s+/g, ' ').trim();
}
function searchKey(value) { return normalizeArabic(value).replace(/[^0-9a-z\u0600-\u06ff ]/g, ' '); }
function configuredOrigins(env) {
  const list = String(env.CORS_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
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
function allowedOrigin(request, env) {
  const origin = text(request.headers.get('Origin'));
  return !origin || configuredOrigins(env).includes(origin);
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(headers || {}) }
  });
}

function utf8(value) { return new TextEncoder().encode(String(value)); }
function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function fromBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
async function hmacKey(secret, usage) {
  return crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}
async function sign(value, secret) {
  const key = await hmacKey(secret, 'sign');
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(value)));
}
async function verify(value, signature, secret) {
  const key = await hmacKey(secret, 'verify');
  return crypto.subtle.verify('HMAC', key, signature, utf8(value));
}
function authSecret(env) { return text(env.EDGE_SESSION_SECRET); }
function screensForRole(role) {
  role = text(role).toLowerCase();
  if (role === 'admin') return ['service', 'print', 'laser', 'press', ''];
  if (role === 'print' || role === 'press') return ['print', 'press', ''];
  if (role === 'laser') return ['laser', ''];
  return ['service', ''];
}

export async function issueOrdersEdgeToken(claims, secret, nowSeconds, ttlSeconds) {
  if (!text(secret)) throw new Error('EDGE_SESSION_SECRET is not configured');
  const now = Number.isFinite(Number(nowSeconds)) ? Number(nowSeconds) : Math.floor(Date.now() / 1000);
  const ttl = clampInt(ttlSeconds, DEFAULT_TTL_SECONDS, 60, MAX_TTL_SECONDS);
  const payload = {
    aud: TOKEN_AUDIENCE,
    sub: text(claims && claims.sub),
    role: text(claims && claims.role),
    department: text(claims && claims.department),
    screens: Array.isArray(claims && claims.screens) ? claims.screens.map(text) : [],
    iat: now,
    exp: now + ttl,
    jti: crypto.randomUUID()
  };
  if (!payload.sub) throw new Error('Orders edge session subject is required');
  const body = toBase64Url(utf8(JSON.stringify(payload)));
  const input = `${TOKEN_VERSION}.${body}`;
  return `${input}.${toBase64Url(await sign(input, secret))}`;
}

export async function verifyOrdersEdgeToken(token, secret, nowSeconds) {
  if (!text(secret)) return { ok: false, reason: 'edge-auth-not-configured' };
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return { ok: false, reason: 'invalid-token-format' };
  try {
    const input = `${parts[0]}.${parts[1]}`;
    if (!(await verify(input, fromBase64Url(parts[2]), secret))) return { ok: false, reason: 'invalid-signature' };
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1])));
    const now = Number.isFinite(Number(nowSeconds)) ? Number(nowSeconds) : Math.floor(Date.now() / 1000);
    if (payload.aud !== TOKEN_AUDIENCE || !text(payload.sub)) return { ok: false, reason: 'invalid-claims' };
    if (!Number.isFinite(Number(payload.exp)) || Number(payload.exp) <= now) return { ok: false, reason: 'expired' };
    if (!Number.isFinite(Number(payload.iat)) || Number(payload.exp) - Number(payload.iat) > MAX_TTL_SECONDS) return { ok: false, reason: 'invalid-time-claims' };
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, reason: 'invalid-token' };
  }
}

async function verifyEmployee(username, token, env) {
  const base = text(env.APPS_SCRIPT_API_URL);
  if (!base) throw new Error('APPS_SCRIPT_API_URL is not configured');
  const url = new URL(base);
  url.searchParams.set('action', 'verifyEmployeeSession');
  url.searchParams.set('username', username);
  url.searchParams.set('token', token);
  url.searchParams.set('_edgeOrders', '1');
  url.searchParams.set('_ts', String(Date.now()));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url.toString(), { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { accept: 'application/json' } });
    let body = {};
    try { body = JSON.parse(await response.text() || '{}'); } catch (err) { throw new Error('Apps Script verification returned invalid JSON'); }
    if (!response.ok || body.success !== true || !body.user) return { success: false, message: text(body.message) || 'Employee session rejected' };
    return body;
  } finally { clearTimeout(timer); }
}

async function exchangeSession(request, env) {
  let body = {};
  try { body = await request.json(); } catch (err) { return json({ success: false, message: 'Invalid JSON body' }, 400, corsHeaders(request, env)); }
  const username = text(body.username || body.name);
  const token = text(body.token);
  if (!username || !token) return json({ success: false, message: 'username and token are required' }, 400, corsHeaders(request, env));
  const verified = await verifyEmployee(username, token, env);
  if (!verified.success) return json({ success: false, message: verified.message || 'Employee session rejected' }, 401, corsHeaders(request, env));
  const user = verified.user || {};
  const role = text(user.role || 'service').toLowerCase();
  const screens = screensForRole(role);
  const edgeToken = await issueOrdersEdgeToken({ sub: user.username || username, role, department: user.department, screens }, authSecret(env));
  return json({ success: true, edgeToken, expiresIn: DEFAULT_TTL_SECONDS, expiresAt: new Date(Date.now() + DEFAULT_TTL_SECONDS * 1000).toISOString(), user: { username: user.username || username, role, department: text(user.department), screens } }, 200, corsHeaders(request, env));
}

function bearer(request) {
  const match = text(request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}
function headerIndex(headers, names, fallback) {
  const normalized = headers.map((h) => text(h));
  for (const name of names) {
    const idx = normalized.lastIndexOf(name);
    if (idx >= 0) return idx;
  }
  return Number.isInteger(fallback) && fallback >= 0 ? fallback : -1;
}
function valueAt(row, index) { return index >= 0 && index < row.length ? row[index] : ''; }
function isHeatPress(value) {
  const v = text(value).toLowerCase();
  return ['نعم','true','1','on','مكبس'].includes(v);
}
function screenMatches(screen, department, heatPress) {
  const dept = text(department);
  if (screen === 'print') return dept === 'طباعة' || dept.includes('طباعة');
  if (screen === 'laser') return dept === 'ليزر' || dept.includes('ليزر');
  if (screen === 'press') return !!heatPress;
  return true;
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
function parseDate(value) {
  const raw = arabicDigits(text(value));
  if (!raw) return null;
  let m = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
function sameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function hiddenStatus(status) {
  return ['جاهز للاستلام','تم التسليم','مكرر','تم التنفيذ','جاهز للطباعة','ملغى','ملغي'].includes(text(status));
}
function readyPickupStatus(status) {
  return ['جاهز للاستلام','في قسم التسليمات','تم التنفيذ'].includes(text(status));
}
function readyStatus(status) {
  return readyPickupStatus(status) || text(status) === 'تم التسليم';
}
function overdue(status, expected) {
  if (hiddenStatus(status)) return false;
  const d = parseDate(expected);
  if (!d) return false;
  const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return d.getTime() < today.getTime();
}
function parseDebt(value) {
  const digits = arabicDigits(value).replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 && n <= 500000 ? n : 0;
}
function inc(obj, key, amount = 1) {
  const k = text(key) || 'غير محدد';
  obj[k] = Number(obj[k] || 0) + amount;
}
function addSet(map, key, value) {
  const k = text(key) || 'غير محدد';
  const v = text(value);
  if (!v) return;
  if (!map[k]) map[k] = new Set();
  map[k].add(v);
}
function emptyDashboard(screen) {
  const nameMap = { service: 'خدمة العملاء', print: 'الطباعة', laser: 'الليزر', press: 'المكبس' };
  return {
    screen: screen || 'service',
    departmentName: nameMap[screen] || 'خدمة العملاء',
    todayOrders: 0,
    todayWorkOrders: 0,
    todayWorkLines: 0,
    todayWorkSheets: 0,
    todayWorkDoneLines: 0,
    activeOrders: 0,
    activeLines: 0,
    activeSheets: 0,
    urgent: 0,
    normal: 0,
    delayedPriority: 0,
    overdue: 0,
    overdueOrders: 0,
    problems: 0,
    readyForPickup: 0,
    readyOrders: 0,
    delivered: 0,
    deliveredToday: 0,
    deliveredTodayOrders: 0,
    duplicate: 0,
    heatPress: 0,
    debtOrders: 0,
    completionPercent: 0,
    timeScore: 100,
    performanceScore: 0,
    byDepartment: { 'طباعة': 0, 'ليزر': 0, 'مكبس': 0 },
    dataSource: 'd1-edge-orders'
  };
}

export function buildDashboardFromRows(rows, screen, now = new Date()) {
  const dashboard = emptyDashboard(text(screen) || 'service');
  const today = new Date(now); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const activeOrders = new Set();
  const readyOrders = new Set();
  const overdueOrders = new Set();
  const deliveredTodayOrders = new Set();
  const todayWorkOrders = new Set();
  const debtOrders = new Set();
  const departmentOrderSets = {};

  for (const row of rows || []) {
    const orderId = text(row && row.orderId);
    const department = text(row && row.department);
    const status = text(row && row.status) || 'طلب جديد';
    const priority = text(row && row.priority);
    const qty = Math.max(1, Number(row && row.qty) || 1);
    const expected = row && (row.expectedDeliveryAt || row.expectedDeliveryText);
    const received = parseDate(row && row.receivedAt);
    const expectedDate = parseDate(expected);
    const updated = parseDate(row && row.updatedAt);
    const isHidden = hiddenStatus(status);
    const isOverdue = text(row && row.overdue) === 'نعم' || overdue(status, expected);
    const isReady = readyStatus(status);
    const isDelivered = status === 'تم التسليم';
    const isDeliveredToday = isDelivered && sameDay(updated, today);
    const isTodayWork = !isHidden && sameDay(received, yesterday) && sameDay(expectedDate, tomorrow);

    if (!isHidden) {
      dashboard.activeLines += 1;
      dashboard.activeSheets += qty;
      if (orderId) activeOrders.add(orderId);
      inc(dashboard.byDepartment, department || 'غير محدد', 1);
      addSet(departmentOrderSets, department || 'غير محدد', orderId);
    }

    if (priority === 'عاجل' || priority === 'VIP') dashboard.urgent += 1;
    else if (priority === 'مؤجل') dashboard.delayedPriority += 1;
    else dashboard.normal += 1;

    if (isOverdue) {
      dashboard.overdue += 1;
      if (orderId) overdueOrders.add(orderId);
    }
    if (readyPickupStatus(status)) {
      dashboard.readyForPickup += 1;
      if (orderId) readyOrders.add(orderId);
    }
    if (isDelivered) dashboard.delivered += 1;
    if (isDeliveredToday) {
      dashboard.deliveredToday += 1;
      if (orderId) deliveredTodayOrders.add(orderId);
    }
    if (status === 'مكرر') dashboard.duplicate += 1;
    if (['متوقف','مشكلة/متوقف','في انتظار موافقة العميل'].includes(status)) dashboard.problems += 1;
    if (isHeatPress(row && row.heatPress)) dashboard.heatPress += 1;
    if (parseDebt(row && row.debtAmount) > 0) {
      if (orderId) debtOrders.add(orderId);
    }
    if (isTodayWork) {
      dashboard.todayWorkLines += 1;
      dashboard.todayWorkSheets += qty;
      if (orderId) todayWorkOrders.add(orderId);
      if (isReady || isDelivered) dashboard.todayWorkDoneLines += 1;
    }
  }

  dashboard.activeOrders = activeOrders.size;
  dashboard.todayOrders = activeOrders.size;
  dashboard.todayWorkOrders = todayWorkOrders.size;
  dashboard.readyOrders = readyOrders.size;
  dashboard.overdueOrders = overdueOrders.size;
  dashboard.deliveredTodayOrders = deliveredTodayOrders.size;
  dashboard.debtOrders = debtOrders.size;

  Object.keys(departmentOrderSets).forEach((department) => {
    dashboard.byDepartment[department + 'Orders'] = departmentOrderSets[department].size;
  });

  dashboard.completionPercent = Math.min(100, Math.round((dashboard.todayWorkDoneLines / Math.max(1, dashboard.todayWorkLines)) * 100));
  const target = Math.max(1, dashboard.todayWorkLines + dashboard.overdue);
  dashboard.timeScore = Math.max(0, Math.round(100 - ((dashboard.overdue / target) * 100)));
  dashboard.performanceScore = Math.round((dashboard.completionPercent * 0.6) + (dashboard.timeScore * 0.4));
  dashboard.updatedAt = new Date(now).toISOString();
  return dashboard;
}

export function mapMirrorRows(headers, mirrorRows, screen) {
  const c = {
    orderId: headerIndex(headers, ['رقم الأوردر','Order ID'], 0),
    orderCode: headerIndex(headers, ['كود الأوردر'], 1),
    customer: headerIndex(headers, ['اسم الشات / المكتب','اسم العميل','Customer Name'], 2),
    department: headerIndex(headers, ['القسم','Department'], 4),
    lineId: headerIndex(headers, ['رقم البند','Line ID'], 5),
    itemName: headerIndex(headers, ['اسم البند / نوع الشغل','اسم البند','Item Name'], 6),
    qty: headerIndex(headers, ['الكمية','Qty'], 7),
    assigned: headerIndex(headers, ['مسؤول القسم','Assigned To'], 8),
    priority: headerIndex(headers, ['الأولوية','Priority'], 9),
    status: headerIndex(headers, ['الحالة','Status'], 10),
    ready: headerIndex(headers, ['جاهز؟','جاهز','Ready'], 11),
    updated: headerIndex(headers, ['آخر تحديث','Updated At'], 12),
    notes: headerIndex(headers, ['ملاحظات','Notes'], 13),
    phone: headerIndex(headers, ['رقم العميل الخارجي','رقم العميل','رقم الهاتف','Phone'], 16),
    press: headerIndex(headers, ['مكبس','مكبس حراري','مكبس؟','Press','Heat Press'], -1),
    fly: headerIndex(headers, ['طباعة على الطاير','طباعة ع الطاير','طباعة فورية','Ready Print','Fly Print','Quick Print'], -1),
    debt: headerIndex(headers, ['مديونية العميل'], -1),
    debtNotes: headerIndex(headers, ['ملاحظات المديونية'], -1),
    notified: headerIndex(headers, ['تم إبلاغ العميل؟'], -1),
    notifiedAt: headerIndex(headers, ['وقت الإبلاغ'], -1),
    notifiedBy: headerIndex(headers, ['تم الإبلاغ بواسطة'], -1),
    waMessage: headerIndex(headers, ['آخر رسالة واتساب'], -1),
    waAt: headerIndex(headers, ['آخر وقت واتساب'], -1),
    waBy: headerIndex(headers, ['آخر واتساب بواسطة'], -1),
    receivedAt: headerIndex(headers, ['تاريخ الاستلام','تاريخ الإنشاء','Received At'], -1),
    expectedAt: headerIndex(headers, ['تاريخ التسليم المتوقع','Expected Delivery'], -1),
    expectedText: headerIndex(headers, ['الوقت المتوقع'], -1),
    registrationSent: headerIndex(headers, ['تم إرسال رسالة التسجيل؟'], -1),
    source: headerIndex(headers, ['مصدر الطلب','Source'], -1),
    externalCustomerId: headerIndex(headers, ['علامة العميل الخارجي','رقم/علامة العميل','معرف العميل الخارجي','External Customer ID'], -1),
    customerMode: headerIndex(headers, ['نوع إدخال العميل','Customer Mode'], -1)
  };
  const out = [];
  for (const item of mirrorRows || []) {
    if (Number(item.rowNumber || 0) <= 1) continue;
    const row = Array.isArray(item.display) && item.display.length ? item.display : (Array.isArray(item.values) ? item.values : []);
    const orderId = text(valueAt(row, c.orderId)) || text(valueAt(row, c.orderCode));
    const lineId = text(valueAt(row, c.lineId));
    if (!orderId && !lineId) continue;
    const department = text(valueAt(row, c.department));
    const heatPress = text(valueAt(row, c.press));
    if (!screenMatches(screen, department, isHeatPress(heatPress))) continue;
    const status = text(valueAt(row, c.status)) || 'طلب جديد';
    const expectedAt = text(valueAt(row, c.expectedAt));
    const expectedText = text(valueAt(row, c.expectedText)) || expectedAt;
    const debtAmount = parseDebt(valueAt(row, c.debt));
    out.push({
      rowNumber: Number(item.rowNumber || 0), orderId, orderCode: text(valueAt(row, c.orderCode)) || orderId,
      lineId, customer: text(valueAt(row, c.customer)), customerPhone: cleanPhone(valueAt(row, c.phone)),
      customerSource: text(valueAt(row, c.source)), source: text(valueAt(row, c.source)), externalCustomerId: text(valueAt(row, c.externalCustomerId)), customerMode: text(valueAt(row, c.customerMode)),
      department, itemName: text(valueAt(row, c.itemName)), qty: valueAt(row, c.qty) || 1, assignedTo: text(valueAt(row, c.assigned)),
      priority: text(valueAt(row, c.priority)) || 'عادي', status, ready: text(valueAt(row, c.ready)), heatPress, flyPrint: text(valueAt(row, c.fly)), quickPrint: text(valueAt(row, c.fly)),
      debtAmount, debtHold: debtAmount > 0 ? 'نعم' : 'لا', deliveryDebtRestricted: false, debtRestrictionReason: '', debtNotes: text(valueAt(row, c.debtNotes)),
      updatedAt: text(valueAt(row, c.updated)), notes: text(valueAt(row, c.notes)), customerNotified: text(valueAt(row, c.notified)), notifiedAt: text(valueAt(row, c.notifiedAt)), notifiedBy: text(valueAt(row, c.notifiedBy)),
      lastWhatsAppMessage: text(valueAt(row, c.waMessage)), lastWhatsAppAt: text(valueAt(row, c.waAt)), lastWhatsAppBy: text(valueAt(row, c.waBy)),
      receivedAt: text(valueAt(row, c.receivedAt)), expectedDeliveryAt: expectedAt, expectedDeliveryText: expectedText, overdue: overdue(status, expectedAt || expectedText) ? 'نعم' : 'لا', registrationSent: text(valueAt(row, c.registrationSent))
    });
  }
  out.sort((a,b) => priorityRank(a.priority) - priorityRank(b.priority) || String(a.orderId).localeCompare(String(b.orderId)));
  return out;
}

export function filterRows(rows, params) {
  const q = searchKey(params.query || params.q || '');
  const status = text(params.statusFilter || params.status || '');
  const priority = text(params.priorityFilter || params.priority || '');
  const heat = text(params.heatPressFilter || '');
  return (rows || []).filter((row) => {
    if (q && !searchKey([row.orderId,row.lineId,row.customer,row.customerPhone,row.department,row.itemName,row.notes].join(' ')).includes(q)) return false;
    if (heat === 'only' && !isHeatPress(row.heatPress)) return false;
    if (heat === 'without' && isHeatPress(row.heatPress)) return false;
    if (status === '__ACTIVE__' && hiddenStatus(row.status)) return false;
    if (status === '__OVERDUE__' && row.overdue !== 'نعم') return false;
    if (status === '__READY_PICKUP__' && !['جاهز للاستلام','في قسم التسليمات','تم التنفيذ'].includes(text(row.status))) return false;
    if (status === '__DEBT__') return false;
    if (status === '__CANCELLED__' && !['ملغي','ملغى'].includes(text(row.status))) return false;
    if (status === '__DELIVERED_TODAY__' && (text(row.status) !== 'تم التسليم' || !sameDay(parseDate(row.updatedAt), new Date()))) return false;
    if (status === '__TODAY_WORK__') {
      const today = new Date(), yesterday = new Date(today), tomorrow = new Date(today);
      yesterday.setDate(today.getDate()-1); tomorrow.setDate(today.getDate()+1);
      if (hiddenStatus(row.status) || !sameDay(parseDate(row.receivedAt), yesterday) || !sameDay(parseDate(row.expectedDeliveryAt || row.expectedDeliveryText), tomorrow)) return false;
    }
    if (status && !status.startsWith('__') && text(row.status) !== status) return false;
    if (priority === '__ACTIVE__' && !['عاجل','عادي','VIP',''].includes(text(row.priority))) return false;
    if (priority && priority !== '__ACTIVE__' && text(row.priority) !== priority) return false;
    return true;
  });
}

async function readMirror(env) {
  const catalog = await env.DB.prepare(`SELECT headers_json AS headersJson, source_last_row AS sourceLastRow, source_last_col AS sourceLastCol, row_count AS rowCount, status, synced_at AS syncedAt, note FROM sheet_catalog WHERE sheet_name = ? LIMIT 1`).bind(LINES_SHEET).first();
  if (!catalog) throw new Error('Orders mirror sheet is missing');
  const query = await env.DB.prepare(`SELECT row_number AS rowNumber, values_json AS valuesJson, display_json AS displayJson FROM sheet_rows WHERE sheet_name = ? ORDER BY row_number`).bind(LINES_SHEET).all();
  const rows = (query.results || []).map((r) => ({ rowNumber: Number(r.rowNumber || 0), values: JSON.parse(r.valuesJson || '[]'), display: JSON.parse(r.displayJson || '[]') }));
  return { catalog, headers: JSON.parse(catalog.headersJson || '[]'), rows };
}

async function page(request, env, url, session) {
  const screen = text(url.searchParams.get('screen') || 'service');
  const allowed = Array.isArray(session.screens) ? session.screens : screensForRole(session.role);
  if (!allowed.includes(screen)) return json({ success: false, message: 'غير مصرح لك بعرض أوردرات هذا القسم.' }, 403, corsHeaders(request, env));
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
  const dashboard = buildDashboardFromRows(allRows, screen);
  const params = Object.fromEntries(url.searchParams.entries());
  const filtered = filterRows(allRows, params);
  const statusCounts = {}, statusOrderSets = {};
  for (const row of allRows) {
    const key = text(row.status) || 'طلب جديد';
    statusCounts[key] = (statusCounts[key] || 0) + 1;
    if (!statusOrderSets[key]) statusOrderSets[key] = new Set();
    if (row.orderId) statusOrderSets[key].add(text(row.orderId));
  }
  const statusOrderCounts = {};
  Object.keys(statusOrderSets).forEach((k) => { statusOrderCounts[k] = statusOrderSets[k].size; });
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
    statusCounts,
    statusOrderCounts,
    serverPaged: true,
    dataVersion: text(catalog.syncedAt) || 'd1',
    version: 'D1_ORDERS_READ_V1',
    dataSource: 'd1-edge-orders',
    edgeSession: session.sub,
    mirror: { syncedAt: text(catalog.syncedAt), sourceLastRow: Number(catalog.sourceLastRow||0), sourceLastCol: Number(catalog.sourceLastCol||0), note: text(catalog.note) }
  }, 200, corsHeaders(request, env));
}

export function isEdgeOrdersReadPath(path) {
  return path === '/v1/edge/orders/session' || path === '/v1/edge/orders/page';
}

export async function handleEdgeOrdersReadRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!allowedOrigin(request, env)) return json({ success: false, message: 'Origin not allowed' }, 403, cors);
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (request.method === 'POST' && path === '/v1/edge/orders/session') return exchangeSession(request, env);
    if (request.method !== 'GET' || path !== '/v1/edge/orders/page') return json({ success: false, message: 'Method not allowed' }, 405, cors);
    const verified = await verifyOrdersEdgeToken(bearer(request), authSecret(env));
    if (!verified.ok) return json({ success: false, message: 'Unauthorized orders edge session', code: verified.reason }, 401, cors);
    return page(request, env, url, verified.payload);
  } catch (err) {
    const message = err && err.name === 'AbortError' ? 'Apps Script verification timed out' : (err && err.message ? err.message : String(err));
    return json({ success: false, code: 'orders-edge-error', fallback: 'apps-script', message }, 502, cors);
  }
}
