import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';

const PATH = '/v1/edge/customers/search';
const SHEET = 'العملاء';
const NOTE = 'PERF-CF-02CR enrichment live sync V1';
const DEFAULT_MAX_AGE_SECONDS = 300;

function text(value) { return String(value == null ? '' : value).trim(); }

function normalizeArabic(value) {
  return text(value).toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ةه]/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchKey(value) {
  return normalizeArabic(value)
    .replace(/[^0-9a-z\u0600-\u06ff ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPhone(value) {
  let digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(2);
  if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);
  if (/^1[0125]\d{8}$/.test(digits)) digits = '0' + digits;
  return digits;
}

function arabicDigits(value) {
  const map = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  return String(value == null ? '' : value).replace(/[٠-٩]/g, (d) => map[d] || d);
}

function parseDebt(value) {
  let s = arabicDigits(value).trim();
  if (!s || /^#/.test(s)) return 0;
  const digitsOnly = s.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 8) return 0;
  s = s.replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > 500000) return 0;
  return n;
}

function bearer(request) {
  const match = text(request && request.headers && request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

function configuredOrigins(env) {
  const list = String((env && env.CORS_ORIGINS) || '').split(',').map((x) => x.trim()).filter(Boolean);
  return list.length ? list : ['https://fawakhry.github.io'];
}

function corsHeaders(request, env) {
  const origin = text(request && request.headers && request.headers.get('Origin'));
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

function parseSqliteUtc(value) {
  const raw = text(value);
  if (!raw) return 0;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)
    ? raw.replace(' ', 'T') + 'Z'
    : raw;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : 0;
}

function maxAgeSeconds(env) {
  const configured = Number(env && env.EDGE_CUSTOMERS_MAX_AGE_SECONDS);
  if (!Number.isFinite(configured)) return DEFAULT_MAX_AGE_SECONDS;
  return Math.max(300, Math.min(1800, Math.trunc(configured)));
}

function headerIndex(headers, aliases, fallback = -1) {
  const normalized = (headers || []).map((h) => text(h));
  for (const alias of aliases || []) {
    const idx = normalized.lastIndexOf(text(alias));
    if (idx >= 0) return idx;
  }
  return Number.isInteger(fallback) && fallback >= 0 ? fallback : -1;
}

function valueAt(row, index) {
  return index >= 0 && Array.isArray(row) && index < row.length ? row[index] : '';
}

export function mapCustomerRowsV1(headers, sourceRows, q, limit = 12) {
  const key = searchKey(q);
  if (!key) return [];

  const c = {
    name: headerIndex(headers, ['اسم الشات / المكتب','اسم العميل','Customer Name'], 0),
    manager: headerIndex(headers, ['اسم المسؤول','المسؤول','Manager'], -1),
    phone: headerIndex(headers, ['رقم العميل الأساسي','رقم العميل','رقم الهاتف','Phone'], -1),
    extra: headerIndex(headers, ['رقم إضافي','رقم إضافى','Extra Phone'], -1),
    type: headerIndex(headers, ['نوع العميل','Customer Type'], -1),
    active: headerIndex(headers, ['مفعل؟','مفعل','Active'], -1),
    debt: headerIndex(headers, ['مديونية حالية','رصيد العميل','مديونية','customerDebt','remainingBalance'], -1),
    debtNotes: headerIndex(headers, ['ملاحظات المديونية','ملاحظات الدين','Debt Notes'], -1),
    code: headerIndex(headers, ['كود العميل','كود الشات','Customer Code','Chat Code'], -1),
    branchCode: headerIndex(headers, ['كود فرع مطبعجي'], -1),
    branchName: headerIndex(headers, ['اسم فرع مطبعجي'], -1),
    notes: headerIndex(headers, ['ملاحظات','Notes'], -1)
  };

  const out = [];
  const seen = new Set();
  for (const item of sourceRows || []) {
    if (Number(item && item.rowNumber || 0) <= 1) continue;
    const row = Array.isArray(item && item.display) && item.display.length
      ? item.display
      : (Array.isArray(item && item.values) ? item.values : []);

    const active = text(valueAt(row, c.active));
    if (active && active !== 'نعم') continue;

    const customer = {
      name: text(valueAt(row, c.name)),
      manager: text(valueAt(row, c.manager)),
      phone: cleanPhone(valueAt(row, c.phone)),
      extraPhone: cleanPhone(valueAt(row, c.extra)),
      type: text(valueAt(row, c.type)),
      active: active || 'نعم',
      debtAmount: parseDebt(valueAt(row, c.debt)),
      debtNotes: text(valueAt(row, c.debtNotes)),
      customerCode: text(valueAt(row, c.code)),
      branchCode: text(valueAt(row, c.branchCode)),
      branchName: text(valueAt(row, c.branchName)),
      notes: text(valueAt(row, c.notes))
    };

    const blob = searchKey([
      customer.name,
      customer.manager,
      customer.phone,
      customer.extraPhone,
      customer.type,
      customer.customerCode,
      customer.branchCode,
      customer.branchName
    ].join(' '));
    if (blob.indexOf(key) === -1) continue;

    const identity = [customer.name, customer.phone, customer.extraPhone, customer.customerCode].join('|');
    if (seen.has(identity)) continue;
    seen.add(identity);

    customer.debt = customer.debtAmount;
    customer.currentBalance = customer.debtAmount;
    customer.remainingBalance = customer.debtAmount;
    out.push(customer);
    if (out.length >= Math.max(1, Math.min(25, Number(limit) || 12))) break;
  }
  return out;
}

async function readMirror(env) {
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
  `).bind(SHEET).first();

  if (!catalog) return { catalog: null, headers: [], rows: [] };

  const query = await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           values_json AS valuesJson,
           display_json AS displayJson
      FROM sheet_rows
     WHERE sheet_name = ?
     ORDER BY row_number
  `).bind(SHEET).all();

  const rows = (query.results || []).map((r) => ({
    rowNumber: Number(r.rowNumber || 0),
    values: JSON.parse(r.valuesJson || '[]'),
    display: JSON.parse(r.displayJson || '[]')
  }));

  return {
    catalog,
    headers: JSON.parse(catalog.headersJson || '[]'),
    rows
  };
}

function inspectFreshness(catalog, nowMs, budgetSeconds) {
  const c = catalog || {};
  const syncedMs = parseSqliteUtc(c.syncedAt);
  const ageSeconds = syncedMs ? Math.max(0, Math.round((Number(nowMs) - syncedMs) / 1000)) : Number.MAX_SAFE_INTEGER;
  const structurallyReady =
    text(c.status) === 'ready' &&
    Number(c.rowCount || 0) === Number(c.sourceLastRow || 0) &&
    text(c.note) === NOTE;

  return {
    ok: structurallyReady && ageSeconds <= budgetSeconds,
    structurallyReady,
    ageSeconds,
    maxAgeSeconds: budgetSeconds,
    sourceLastRow: Number(c.sourceLastRow || 0),
    sourceLastCol: Number(c.sourceLastCol || 0),
    rowCount: Number(c.rowCount || 0),
    status: text(c.status),
    syncedAt: text(c.syncedAt),
    note: text(c.note)
  };
}

export function isEdgeCustomersSearchPath(path) {
  return (String(path || '').replace(/\/+$/, '') || '/') === PATH;
}

export async function handleEdgeCustomersSearchRequest(request, env, nowMs = Date.now()) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (request.method === 'OPTIONS' && path === PATH) return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  if (request.method !== 'GET' || path !== PATH) return null;

  const verified = await verifyOrdersEdgeToken(bearer(request), text(env && env.EDGE_SESSION_SECRET), Math.floor(Number(nowMs) / 1000));
  if (!verified.ok) return json({ success:false, code:verified.reason, message:'Unauthorized customer edge session' }, 401, request, env);

  const q = text(url.searchParams.get('q'));
  if (!q) return json({
    success:true,
    customers:[],
    dataSource:'d1-edge-customers-v1',
    freshness:{ ok:true, queryEmpty:true }
  }, 200, request, env);

  try {
    const mirror = await readMirror(env);
    const freshness = inspectFreshness(mirror.catalog, nowMs, maxAgeSeconds(env));
    if (!freshness.structurallyReady) {
      return json({
        success:false,
        code:'edge-customers-not-ready',
        fallback:'apps-script',
        message:'Customer D1 mirror is not qualified.',
        freshness
      }, 503, request, env);
    }
    if (!freshness.ok) {
      return json({
        success:false,
        code:'edge-customers-stale',
        fallback:'apps-script',
        message:'Customer D1 mirror is stale.',
        freshness
      }, 503, request, env);
    }

    const customers = mapCustomerRowsV1(mirror.headers, mirror.rows, q, 12);
    return json({
      success:true,
      customers,
      dataSource:'d1-edge-customers-v1',
      freshness,
      version:'EDGE_CUSTOMERS_D1_SEARCH_V1'
    }, 200, request, env);
  } catch (err) {
    return json({
      success:false,
      code:'edge-customers-error',
      fallback:'apps-script',
      message:String(err && err.message ? err.message : err)
    }, 502, request, env);
  }
}
