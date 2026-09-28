import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';

const PATH = '/v1/edge/customers/search';
const SHEET = 'العملاء';
const EXPECTED_NOTE = 'PERF-CF-02CR enrichment live sync V1';
const CACHE_MS = 60 * 1000;
const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

let directoryCache = {
  syncedAt: '',
  loadedAt: 0,
  customers: []
};

function text(value) {
  return String(value == null ? '' : value).trim();
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

function parseDebtAmount(value) {
  let s = arabicDigits(value).trim();
  if (!s || /^#/.test(s)) return 0;
  const digitsOnly = s.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 8) return 0;
  s = s.replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n <= 500000 ? n : 0;
}

function parseArray(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function headerIndex(headers, aliases, fallback = -1) {
  const normalized = (headers || []).map((h) => text(h));
  for (const alias of aliases || []) {
    const idx = normalized.lastIndexOf(text(alias));
    if (idx >= 0) return idx;
  }
  return fallback;
}

function at(row, index) {
  return index >= 0 && Array.isArray(row) && index < row.length ? row[index] : '';
}

function sqliteUtcMs(value) {
  const raw = text(value);
  if (!raw) return 0;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)
    ? raw.replace(' ', 'T') + 'Z'
    : raw;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : 0;
}

function authSecret(env) {
  return text(env && env.EDGE_SESSION_SECRET);
}

function bearer(request) {
  const match = text(request && request.headers && request.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : '';
}

function configuredOrigins(env) {
  const configured = String((env && env.CORS_ORIGINS) || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
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

async function readCatalog(env) {
  return env.DB.prepare(`
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
}

async function readRows(env) {
  const result = await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           display_json AS displayJson,
           values_json AS valuesJson
      FROM sheet_rows
     WHERE sheet_name = ?
     ORDER BY row_number ASC
  `).bind(SHEET).all();
  return result.results || [];
}

function structurallyReady(catalog) {
  const c = catalog || {};
  return text(c.status) === 'ready' &&
    Number(c.rowCount || 0) === Number(c.sourceLastRow || 0) &&
    Number(c.sourceLastRow || 0) > 1 &&
    text(c.note) === EXPECTED_NOTE;
}

function buildDirectory(headers, rows) {
  const c = {
    name: headerIndex(headers, ['اسم الشات / المكتب','اسم العميل','Customer Name'], 0),
    manager: headerIndex(headers, ['اسم المسؤول','المسؤول','Manager'], -1),
    phone: headerIndex(headers, ['رقم العميل الأساسي','رقم العميل','رقم الهاتف','Phone'], -1),
    extra: headerIndex(headers, ['رقم إضافي','رقم إضافى','Extra Phone'], -1),
    type: headerIndex(headers, ['نوع العميل','Customer Type'], -1),
    active: headerIndex(headers, ['مفعل؟','مفعل','Active'], -1),
    debt: headerIndex(headers, ['مديونية حالية','رصيد العميل','مديونية','customerDebt','remainingBalance'], -1)
  };

  const out = [];
  const seen = new Set();
  for (const item of rows || []) {
    if (Number(item && item.rowNumber || 0) <= 1) continue;
    const row = parseArray(item.displayJson).length ? parseArray(item.displayJson) : parseArray(item.valuesJson);
    const active = c.active >= 0 ? normalizeArabic(at(row, c.active)) : '';
    if (active && active !== 'نعم') continue;
    const name = text(at(row, c.name));
    const manager = text(at(row, c.manager));
    const phone = cleanPhone(at(row, c.phone));
    const extraPhone = cleanPhone(at(row, c.extra));
    const type = text(at(row, c.type));
    const debt = parseDebtAmount(at(row, c.debt));
    const key = name + '|' + phone;
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push({
      name,
      manager,
      phone: phone || extraPhone,
      extraPhone,
      type,
      debt,
      debtAmount: debt,
      currentBalance: debt,
      remainingBalance: debt,
      _search: searchKey([name, manager, phone, extraPhone, type].join(' '))
    });
  }
  return out;
}

async function loadDirectory(env, nowMs = Date.now()) {
  const catalog = await readCatalog(env);
  if (!structurallyReady(catalog)) {
    const err = new Error('D1 customer mirror is not structurally ready');
    err.code = 'CUSTOMER_MIRROR_NOT_READY';
    throw err;
  }

  if (
    directoryCache.customers.length &&
    directoryCache.syncedAt === text(catalog.syncedAt) &&
    Number(nowMs) - directoryCache.loadedAt <= CACHE_MS
  ) {
    return { catalog, customers: directoryCache.customers, cached: true };
  }

  const headers = parseArray(catalog.headersJson);
  const rows = await readRows(env);
  if (rows.length !== Number(catalog.rowCount || 0)) {
    const err = new Error('D1 customer mirror row parity failed');
    err.code = 'CUSTOMER_MIRROR_PARITY';
    throw err;
  }

  const customers = buildDirectory(headers, rows);
  directoryCache = {
    syncedAt: text(catalog.syncedAt),
    loadedAt: Number(nowMs),
    customers
  };
  return { catalog, customers, cached: false };
}

export async function searchCustomerDirectory(env, query, limit = 12, nowMs = Date.now()) {
  const q = searchKey(query);
  if (!q) {
    return {
      customers: [],
      mirror: { sheetName: SHEET, ready: true, rowCount: 0, sourceLastRow: 0, syncedAt: '', ageSeconds: null },
      cached: false
    };
  }

  const loaded = await loadDirectory(env, nowMs);
  const matches = [];
  for (const customer of loaded.customers) {
    if (!customer._search.includes(q)) continue;
    const safe = { ...customer };
    delete safe._search;
    matches.push(safe);
    if (matches.length >= Math.max(1, Math.min(12, Number(limit) || 12))) break;
  }

  const syncedMs = sqliteUtcMs(loaded.catalog.syncedAt);
  return {
    customers: matches,
    cached: loaded.cached,
    mirror: {
      sheetName: SHEET,
      ready: true,
      rowCount: Number(loaded.catalog.rowCount || 0),
      sourceLastRow: Number(loaded.catalog.sourceLastRow || 0),
      sourceLastCol: Number(loaded.catalog.sourceLastCol || 0),
      syncedAt: text(loaded.catalog.syncedAt),
      ageSeconds: syncedMs ? Math.max(0, Math.round((Number(nowMs) - syncedMs) / 1000)) : null,
      note: text(loaded.catalog.note)
    }
  };
}

export function isEdgeCustomerSearchPath(path) {
  return text(path) === PATH;
}

export async function handleEdgeCustomerSearchRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'GET') return json({ success: false, message: 'Method not allowed' }, 405, request, env);

  const verified = await verifyOrdersEdgeToken(bearer(request), authSecret(env));
  if (!verified.ok) {
    return json({ success: false, message: 'Unauthorized customer search', code: verified.reason }, 401, request, env);
  }

  try {
    const url = new URL(request.url);
    const q = text(url.searchParams.get('q'));
    if (!q) return json({ success: true, customers: [], dataSource: 'd1-customer-directory', edgeSession: verified.payload.sub }, 200, request, env);
    const result = await searchCustomerDirectory(env, q, 12, Date.now());
    return json({
      success: true,
      customers: result.customers,
      dataSource: 'd1-customer-directory',
      edgeSession: verified.payload.sub,
      mirror: result.mirror,
      cacheHit: result.cached === true
    }, 200, request, env);
  } catch (err) {
    return json({
      success: false,
      message: err && err.message ? err.message : String(err),
      code: err && err.code ? err.code : 'CUSTOMER_SEARCH_FAILED',
      fallback: 'apps-script'
    }, 503, request, env);
  }
}
