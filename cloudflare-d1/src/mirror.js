const DEFAULT_ORIGINS = [
  'https://fawakhry.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

let schemaReadyPromise = null;

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

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configured = String(env.CORS_ORIGINS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const allowed = configured.length ? configured : DEFAULT_ORIGINS;
  const isAllowed = allowed.includes(origin);
  return {
    'access-control-allow-origin': isAllowed ? origin : allowed[0],
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-migration-secret,authorization',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

function clampInt(value, fallback, min, max) {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function requireMigrationSecret(request, env) {
  const expected = String(env.MIGRATION_SECRET || '').trim();
  const supplied = String(request.headers.get('x-migration-secret') || '').trim();
  return !!expected && supplied === expected;
}

async function ensureMirrorSchema(env) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const ddl = [
        `CREATE TABLE IF NOT EXISTS sheet_catalog (
          sheet_name TEXT PRIMARY KEY,
          sheet_id TEXT NOT NULL DEFAULT '',
          headers_json TEXT NOT NULL DEFAULT '[]',
          source_last_row INTEGER NOT NULL DEFAULT 0,
          source_last_col INTEGER NOT NULL DEFAULT 0,
          row_count INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'ready',
          synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          note TEXT NOT NULL DEFAULT ''
        )`,
        `CREATE INDEX IF NOT EXISTS idx_sheet_catalog_status
          ON sheet_catalog(status, synced_at DESC)`,
        `CREATE TABLE IF NOT EXISTS sheet_rows (
          sheet_name TEXT NOT NULL,
          row_number INTEGER NOT NULL,
          values_json TEXT NOT NULL DEFAULT '[]',
          display_json TEXT NOT NULL DEFAULT '[]',
          formulas_json TEXT NOT NULL DEFAULT '[]',
          synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (sheet_name, row_number),
          FOREIGN KEY (sheet_name) REFERENCES sheet_catalog(sheet_name) ON DELETE CASCADE
        )`,
        `CREATE INDEX IF NOT EXISTS idx_sheet_rows_sheet_row
          ON sheet_rows(sheet_name, row_number)`,
        `CREATE TABLE IF NOT EXISTS sheet_migration_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sheet_name TEXT NOT NULL,
          source_last_row INTEGER NOT NULL DEFAULT 0,
          source_last_col INTEGER NOT NULL DEFAULT 0,
          copied_rows INTEGER NOT NULL DEFAULT 0,
          started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'running',
          note TEXT NOT NULL DEFAULT ''
        )`,
        `CREATE INDEX IF NOT EXISTS idx_sheet_migration_runs_sheet
          ON sheet_migration_runs(sheet_name, id DESC)`
      ];
      for (const sql of ddl) await env.DB.prepare(sql).run();
      return true;
    })().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  return schemaReadyPromise;
}

function stringifyArray(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

async function importSheet(request, env) {
  if (!requireMigrationSecret(request, env)) {
    return json({ success: false, message: 'Unauthorized import' }, 401);
  }

  const body = await request.json();
  const sheetName = String(body.sheetName || '').trim();
  if (!sheetName) return json({ success: false, message: 'sheetName is required' }, 400);

  const sheetId = String(body.sheetId == null ? '' : body.sheetId);
  const headers = Array.isArray(body.headers) ? body.headers : [];
  const sourceLastRow = clampInt(body.sourceLastRow, 0, 0, 10000000);
  const sourceLastCol = clampInt(body.sourceLastCol, 0, 0, 10000);
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const reset = body.reset === true;
  const final = body.final === true;
  const note = String(body.note || 'full-sheet-mirror');

  if (reset) {
    await env.DB.prepare('DELETE FROM sheet_rows WHERE sheet_name = ?').bind(sheetName).run();
    await env.DB.prepare(`
      INSERT INTO sheet_catalog (
        sheet_name, sheet_id, headers_json, source_last_row, source_last_col,
        row_count, status, synced_at, note
      ) VALUES (?, ?, ?, ?, ?, 0, 'syncing', CURRENT_TIMESTAMP, ?)
      ON CONFLICT(sheet_name) DO UPDATE SET
        sheet_id = excluded.sheet_id,
        headers_json = excluded.headers_json,
        source_last_row = excluded.source_last_row,
        source_last_col = excluded.source_last_col,
        row_count = 0,
        status = 'syncing',
        synced_at = CURRENT_TIMESTAMP,
        note = excluded.note
    `).bind(
      sheetName,
      sheetId,
      JSON.stringify(headers),
      sourceLastRow,
      sourceLastCol,
      note
    ).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO sheet_catalog (
        sheet_name, sheet_id, headers_json, source_last_row, source_last_col,
        row_count, status, synced_at, note
      ) VALUES (?, ?, ?, ?, ?, 0, 'syncing', CURRENT_TIMESTAMP, ?)
      ON CONFLICT(sheet_name) DO UPDATE SET
        sheet_id = CASE WHEN excluded.sheet_id <> '' THEN excluded.sheet_id ELSE sheet_catalog.sheet_id END,
        headers_json = CASE WHEN excluded.headers_json <> '[]' THEN excluded.headers_json ELSE sheet_catalog.headers_json END,
        source_last_row = excluded.source_last_row,
        source_last_col = excluded.source_last_col,
        status = 'syncing',
        note = excluded.note
    `).bind(
      sheetName,
      sheetId,
      JSON.stringify(headers),
      sourceLastRow,
      sourceLastCol,
      note
    ).run();
  }

  const statements = [];
  for (const row of rows) {
    const rowNumber = clampInt(row && row.rowNumber, 0, 1, 10000000);
    if (!rowNumber) continue;
    statements.push(
      env.DB.prepare(`
        INSERT INTO sheet_rows (
          sheet_name, row_number, values_json, display_json, formulas_json, synced_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(sheet_name, row_number) DO UPDATE SET
          values_json = excluded.values_json,
          display_json = excluded.display_json,
          formulas_json = excluded.formulas_json,
          synced_at = CURRENT_TIMESTAMP
      `).bind(
        sheetName,
        rowNumber,
        stringifyArray(row.values),
        stringifyArray(row.display),
        stringifyArray(row.formulas)
      )
    );
  }

  if (statements.length) await env.DB.batch(statements);

  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM sheet_rows WHERE sheet_name = ?'
  ).bind(sheetName).first();
  const copiedRows = Number((countRow && countRow.count) || 0);

  if (final) {
    await env.DB.prepare(`
      UPDATE sheet_catalog
         SET row_count = ?,
             status = 'ready',
             synced_at = CURRENT_TIMESTAMP,
             source_last_row = ?,
             source_last_col = ?,
             headers_json = ?,
             sheet_id = ?,
             note = ?
       WHERE sheet_name = ?
    `).bind(
      copiedRows,
      sourceLastRow,
      sourceLastCol,
      JSON.stringify(headers),
      sheetId,
      note,
      sheetName
    ).run();

    await env.DB.prepare(`
      INSERT INTO sheet_migration_runs (
        sheet_name, source_last_row, source_last_col, copied_rows,
        completed_at, status, note
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'completed', ?)
    `).bind(sheetName, sourceLastRow, sourceLastCol, copiedRows, note).run();
  } else {
    await env.DB.prepare(`
      UPDATE sheet_catalog
         SET row_count = ?, synced_at = CURRENT_TIMESTAMP
       WHERE sheet_name = ?
    `).bind(copiedRows, sheetName).run();
  }

  return json({
    success: true,
    sheetName,
    receivedRows: statements.length,
    copiedRows,
    final,
    status: final ? 'ready' : 'syncing'
  });
}

async function listSheets(env) {
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

async function mirrorStats(env) {
  const totals = await env.DB.prepare(`
    SELECT COUNT(*) AS sheetCount,
           COALESCE(SUM(row_count), 0) AS rowCount,
           COALESCE(SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END), 0) AS readySheets,
           COALESCE(SUM(CASE WHEN status <> 'ready' THEN 1 ELSE 0 END), 0) AS pendingSheets,
           MAX(synced_at) AS lastSyncedAt
      FROM sheet_catalog
  `).first();
  return {
    sheetCount: Number((totals && totals.sheetCount) || 0),
    rowCount: Number((totals && totals.rowCount) || 0),
    readySheets: Number((totals && totals.readySheets) || 0),
    pendingSheets: Number((totals && totals.pendingSheets) || 0),
    lastSyncedAt: (totals && totals.lastSyncedAt) || ''
  };
}

async function getSheetRows(env, url) {
  const sheetName = String(url.searchParams.get('name') || '').trim();
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
    sourceLastRow: catalog.sourceLastRow,
    sourceLastCol: catalog.sourceLastCol,
    rowCount: catalog.rowCount,
    status: catalog.status,
    syncedAt: catalog.syncedAt,
    note: catalog.note,
    offset,
    limit,
    rows
  };
}

export async function handleMirrorRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  try {
    await ensureMirrorSchema(env);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'POST' && path === '/v1/import/sheet') {
      const response = await importSheet(request, env);
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
      return new Response(response.body, { status: response.status, headers });
    }

    if (request.method === 'GET' && path === '/v1/mirror/sheets') {
      return json({ success: true, sheets: await listSheets(env) }, 200, cors);
    }

    if (request.method === 'GET' && path === '/v1/mirror/stats') {
      return json({ success: true, stats: await mirrorStats(env) }, 200, cors);
    }

    if (request.method === 'GET' && path === '/v1/mirror/sheet') {
      const sheet = await getSheetRows(env, url);
      return sheet
        ? json({ success: true, sheet }, 200, cors)
        : json({ success: false, message: 'Sheet not found' }, 404, cors);
    }

    return json({ success: false, message: 'Mirror route not found' }, 404, cors);
  } catch (err) {
    return json({
      success: false,
      message: err && err.message ? err.message : String(err)
    }, 500, cors);
  }
}
