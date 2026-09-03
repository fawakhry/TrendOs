import { handleMirrorRequest as handleLegacyMirrorRequest } from './mirror.js';

const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function text(value) {
  return String(value == null ? '' : value).trim();
}

function clampInt(value, fallback, min, max) {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function configuredOrigins(env) {
  const configured = String(env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
}

function corsHeaders(request, env) {
  const origin = text(request.headers.get('Origin'));
  const allowed = configuredOrigins(env);
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-migration-secret,authorization',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });
}

function migrationAuthorized(request, env) {
  const expected = text(env.MIGRATION_SECRET);
  const supplied = text(request.headers.get('x-migration-secret'));
  return !!expected && supplied === expected;
}

export function isMirrorPath(path) {
  return path === '/v1/import/sheet' ||
    path === '/v1/mirror/sheets' ||
    path === '/v1/mirror/stats' ||
    path === '/v1/mirror/sheet';
}

async function listSheetsReadOnly(env) {
  const result = await env.DB.prepare(`
    SELECT sheet_name AS sheetName,
           sheet_id AS sheetId,
           source_last_row AS sourceLastRow,
           source_last_col AS sourceLastCol,
           row_count AS rowCount,
           status,
           synced_at AS syncedAt,
           note
      FROM sheet_catalog
     ORDER BY sheet_name COLLATE NOCASE
  `).all();
  return result.results || [];
}

async function mirrorStatsReadOnly(env) {
  const totals = await env.DB.prepare(`
    SELECT COUNT(*) AS sheetCount,
           COALESCE(SUM(row_count), 0) AS rowCount,
           COALESCE(SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END), 0) AS readySheets,
           COALESCE(SUM(CASE WHEN status <> 'ready' THEN 1 ELSE 0 END), 0) AS pendingSheets,
           MIN(synced_at) AS oldestSyncedAt,
           MAX(synced_at) AS lastSyncedAt
      FROM sheet_catalog
  `).first();
  return {
    sheetCount: Number((totals && totals.sheetCount) || 0),
    rowCount: Number((totals && totals.rowCount) || 0),
    readySheets: Number((totals && totals.readySheets) || 0),
    pendingSheets: Number((totals && totals.pendingSheets) || 0),
    oldestSyncedAt: (totals && totals.oldestSyncedAt) || '',
    lastSyncedAt: (totals && totals.lastSyncedAt) || '',
    schemaMutationFree: true
  };
}

async function getSheetReadOnly(env, url) {
  const sheetName = text(url.searchParams.get('name'));
  if (!sheetName) throw new Error('name is required');
  const limit = clampInt(url.searchParams.get('limit'), 100, 1, 500);
  const offset = clampInt(url.searchParams.get('offset'), 0, 0, 10000000);

  const catalog = await env.DB.prepare(`
    SELECT sheet_name AS sheetName,
           sheet_id AS sheetId,
           headers_json AS headersJson,
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
  if (!catalog) return null;

  const result = await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           values_json AS valuesJson,
           display_json AS displayJson,
           formulas_json AS formulasJson,
           synced_at AS syncedAt
      FROM sheet_rows
     WHERE sheet_name = ?
     ORDER BY row_number
     LIMIT ? OFFSET ?
  `).bind(sheetName, limit, offset).all();

  const rows = (result.results || []).map((row) => ({
    rowNumber: row.rowNumber,
    values: JSON.parse(row.valuesJson || '[]'),
    display: JSON.parse(row.displayJson || '[]'),
    formulas: JSON.parse(row.formulasJson || '[]'),
    syncedAt: row.syncedAt
  }));

  return {
    sheetName: catalog.sheetName,
    sheetId: catalog.sheetId,
    headers: JSON.parse(catalog.headersJson || '[]'),
    sourceLastRow: Number(catalog.sourceLastRow || 0),
    sourceLastCol: Number(catalog.sourceLastCol || 0),
    rowCount: Number(catalog.rowCount || 0),
    status: catalog.status,
    syncedAt: catalog.syncedAt,
    note: catalog.note,
    offset,
    limit,
    schemaMutationFree: true,
    rows
  };
}

export async function handleMirrorRequest(request, env, ctx) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (!isMirrorPath(path)) {
    return json({ success: false, message: 'Mirror route not found' }, 404, cors);
  }

  // Read paths are deliberately implemented here with SELECT-only statements.
  // They must never call legacy ensureMirrorSchema(), so parity/freshness probes
  // remain observational even if a table is unexpectedly absent.
  if (request.method === 'GET') {
    try {
      if (path === '/v1/mirror/sheets') {
        return json({ success: true, schemaMutationFree: true, sheets: await listSheetsReadOnly(env) }, 200, cors);
      }
      if (path === '/v1/mirror/stats') {
        return json({ success: true, stats: await mirrorStatsReadOnly(env) }, 200, cors);
      }
      if (path === '/v1/mirror/sheet') {
        const sheet = await getSheetReadOnly(env, url);
        return sheet
          ? json({ success: true, schemaMutationFree: true, sheet }, 200, cors)
          : json({ success: false, schemaMutationFree: true, message: 'Sheet not found' }, 404, cors);
      }
      return json({ success: false, message: 'Method not allowed' }, 405, cors);
    } catch (err) {
      return json({
        success: false,
        schemaMutationFree: true,
        message: err && err.message ? err.message : String(err)
      }, 503, cors);
    }
  }

  // Reject unauthenticated import traffic before delegating to legacy code that
  // may initialize schema. This prevents anonymous requests from causing DDL.
  if (request.method === 'POST' && path === '/v1/import/sheet') {
    if (!migrationAuthorized(request, env)) {
      return json({ success: false, message: 'Unauthorized import', schemaMutationFree: true }, 401, cors);
    }
    return handleLegacyMirrorRequest(request, env, ctx);
  }

  return json({ success: false, message: 'Method not allowed' }, 405, cors);
}
