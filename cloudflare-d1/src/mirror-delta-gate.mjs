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
    'access-control-allow-methods': 'POST,OPTIONS',
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

function stringifyArray(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

export function isMirrorDeltaPath(path) {
  return path === '/v1/mirror/delta';
}

function normalizeRows(rawRows, sourceLastRow) {
  const seen = new Set();
  const rows = [];
  for (const raw of Array.isArray(rawRows) ? rawRows : []) {
    const rowNumber = clampInt(raw && raw.rowNumber, 0, 1, 10000000);
    if (!rowNumber || rowNumber > sourceLastRow || seen.has(rowNumber)) continue;
    seen.add(rowNumber);
    rows.push({
      rowNumber,
      values: Array.isArray(raw && raw.values) ? raw.values : [],
      display: Array.isArray(raw && raw.display) ? raw.display : [],
      formulas: Array.isArray(raw && raw.formulas) ? raw.formulas : []
    });
  }
  rows.sort((a, b) => a.rowNumber - b.rowNumber);
  return rows;
}

function normalizeSheets(body) {
  const raw = Array.isArray(body && body.sheets) ? body.sheets : [];
  const seen = new Set();
  const sheets = [];

  for (const item of raw) {
    const sheetName = text(item && item.sheetName);
    if (!sheetName || seen.has(sheetName)) continue;
    seen.add(sheetName);

    const sourceLastRow = clampInt(item && item.sourceLastRow, 0, 0, 10000000);
    const sourceLastCol = clampInt(item && item.sourceLastCol, 0, 0, 10000);
    const baseRowCount = clampInt(item && item.baseRowCount, 0, 0, 10000000);
    const rows = normalizeRows(item && item.rows, sourceLastRow);

    sheets.push({
      sheetName,
      sheetId: text(item && item.sheetId),
      headers: Array.isArray(item && item.headers) ? item.headers : [],
      sourceLastRow,
      sourceLastCol,
      baseRowCount,
      expectedNote: text(item && item.expectedNote),
      note: text(item && item.note),
      rows
    });
  }

  return sheets;
}

async function preflightSheet(sheet, env) {
  const catalog = await env.DB.prepare(`
    SELECT sheet_name AS sheetName,
           source_last_row AS sourceLastRow,
           source_last_col AS sourceLastCol,
           row_count AS rowCount,
           status,
           note
      FROM sheet_catalog
     WHERE sheet_name = ?
     LIMIT 1
  `).bind(sheet.sheetName).first();

  if (!catalog) {
    return { ok: false, status: 404, message: 'Delta base sheet not found' };
  }

  const shape = await env.DB.prepare(`
    SELECT COUNT(*) AS count,
           MIN(row_number) AS minRow,
           MAX(row_number) AS maxRow
      FROM sheet_rows
     WHERE sheet_name = ?
  `).bind(sheet.sheetName).first();

  const actualCount = Number((shape && shape.count) || 0);
  const minRow = shape && shape.minRow != null ? Number(shape.minRow) : 0;
  const maxRow = shape && shape.maxRow != null ? Number(shape.maxRow) : 0;
  const catalogCount = Number(catalog.rowCount || 0);
  const contiguous = actualCount === 0
    ? minRow === 0 && maxRow === 0
    : minRow === 1 && maxRow === actualCount;

  const noteOk = !sheet.expectedNote || text(catalog.note) === sheet.expectedNote;
  const baseOk = text(catalog.status) === 'ready' &&
    catalogCount === actualCount &&
    actualCount === sheet.baseRowCount &&
    contiguous &&
    noteOk;

  if (!baseOk) {
    return {
      ok: false,
      status: 409,
      message: 'Delta base preflight failed',
      actual: {
        rowCount: actualCount,
        catalogRowCount: catalogCount,
        sourceLastRow: Number(catalog.sourceLastRow || 0),
        sourceLastCol: Number(catalog.sourceLastCol || 0),
        status: text(catalog.status),
        note: text(catalog.note),
        contiguous
      }
    };
  }

  if (sheet.sourceLastRow > actualCount) {
    const changed = new Set(sheet.rows.map((row) => row.rowNumber));
    for (let rowNumber = actualCount + 1; rowNumber <= sheet.sourceLastRow; rowNumber += 1) {
      if (!changed.has(rowNumber)) {
        return {
          ok: false,
          status: 409,
          message: 'Delta growth is missing appended source rows',
          missingRowNumber: rowNumber
        };
      }
    }
  }

  return {
    ok: true,
    actualCount,
    deleteCount: Math.max(0, actualCount - sheet.sourceLastRow)
  };
}

async function applyDelta(body, env) {
  const runId = text(body && body.runId);
  const sheets = normalizeSheets(body);
  if (!runId) {
    return json({ success: false, atomic: true, action: 'delta', message: 'runId is required' }, 400);
  }
  if (!sheets.length) {
    return json({ success: false, atomic: true, action: 'delta', message: 'sheets is required' }, 400);
  }

  const preflight = [];
  for (const sheet of sheets) {
    const checked = await preflightSheet(sheet, env);
    if (!checked.ok) {
      return json({
        success: false,
        atomic: true,
        action: 'delta',
        schemaMutationFree: true,
        rowLevelDelta: true,
        runId,
        sheetName: sheet.sheetName,
        message: checked.message,
        missingRowNumber: checked.missingRowNumber || null,
        actual: checked.actual || null
      }, checked.status || 409);
    }
    preflight.push({ sheet, ...checked });
  }

  const statements = [];
  let changedRows = 0;
  let deletedRows = 0;

  for (const item of preflight) {
    const sheet = item.sheet;
    for (const row of sheet.rows) {
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
          sheet.sheetName,
          row.rowNumber,
          stringifyArray(row.values),
          stringifyArray(row.display),
          stringifyArray(row.formulas)
        )
      );
      changedRows += 1;
    }

    if (sheet.sourceLastRow < item.actualCount) {
      statements.push(
        env.DB.prepare(`
          DELETE FROM sheet_rows
           WHERE sheet_name = ? AND row_number > ?
        `).bind(sheet.sheetName, sheet.sourceLastRow)
      );
      deletedRows += item.deleteCount;
    }

    statements.push(
      env.DB.prepare(`
        UPDATE sheet_catalog
           SET sheet_id = ?,
               headers_json = ?,
               source_last_row = ?,
               source_last_col = ?,
               row_count = ?,
               status = 'ready',
               synced_at = CURRENT_TIMESTAMP,
               note = ?
         WHERE sheet_name = ?
      `).bind(
        sheet.sheetId,
        JSON.stringify(sheet.headers),
        sheet.sourceLastRow,
        sheet.sourceLastCol,
        sheet.sourceLastRow,
        sheet.note,
        sheet.sheetName
      )
    );
  }

  // D1 batch is the transaction boundary: both Orders and Lines advance together.
  await env.DB.batch(statements);

  const verified = [];
  for (const sheet of sheets) {
    const catalog = await env.DB.prepare(`
      SELECT sheet_name AS sheetName,
             source_last_row AS sourceLastRow,
             source_last_col AS sourceLastCol,
             row_count AS rowCount,
             status,
             synced_at AS syncedAt,
             note
        FROM sheet_catalog
       WHERE sheet_name = ?
       LIMIT 1
    `).bind(sheet.sheetName).first();
    const countRow = await env.DB.prepare(
      'SELECT COUNT(*) AS count FROM sheet_rows WHERE sheet_name = ?'
    ).bind(sheet.sheetName).first();
    const actualCount = Number((countRow && countRow.count) || 0);

    if (!catalog || actualCount !== sheet.sourceLastRow || Number(catalog.rowCount || 0) !== sheet.sourceLastRow) {
      return json({
        success: false,
        atomic: true,
        action: 'delta',
        rowLevelDelta: true,
        message: 'Delta post-commit parity verification failed',
        sheetName: sheet.sheetName,
        expectedRowCount: sheet.sourceLastRow,
        actualRowCount: actualCount
      }, 500);
    }

    verified.push({
      sheetName: text(catalog.sheetName),
      rowCount: Number(catalog.rowCount || 0),
      sourceLastRow: Number(catalog.sourceLastRow || 0),
      sourceLastCol: Number(catalog.sourceLastCol || 0),
      syncedAt: text(catalog.syncedAt),
      note: text(catalog.note)
    });
  }

  return json({
    success: true,
    atomic: true,
    action: 'delta',
    rowLevelDelta: true,
    schemaMutationFree: true,
    runId,
    changedRows,
    deletedRows,
    catalogRowsTouched: sheets.length,
    estimatedRowWrites: changedRows + deletedRows + sheets.length,
    sheets: verified
  }, 200);
}

export async function handleMirrorDeltaRequest(request, env) {
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, 405, cors);
  }
  if (!migrationAuthorized(request, env)) {
    return json({
      success: false,
      atomic: true,
      action: 'delta',
      schemaMutationFree: true,
      rowLevelDelta: true,
      message: 'Unauthorized delta'
    }, 401, cors);
  }

  try {
    const body = await request.json();
    const response = await applyDelta(body, env);
    const data = await response.json();
    return json(data, response.status, cors);
  } catch (err) {
    return json({
      success: false,
      atomic: true,
      action: 'delta',
      schemaMutationFree: true,
      rowLevelDelta: true,
      message: err && err.message ? err.message : String(err)
    }, 503, cors);
  }
}
