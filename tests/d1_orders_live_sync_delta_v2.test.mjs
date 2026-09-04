import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { handleMirrorDeltaRequest } from '../cloudflare-d1/src/mirror-delta-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SECRET = 'delta-test-secret';
const NOTE = 'TrendOS orders live sync V2 quota-aware';

class StatementAdapter {
  constructor(owner, sql) {
    this.owner = owner;
    this.sql = sql;
    this.params = [];
  }
  bind(...params) {
    this.params = params;
    return this;
  }
  async first() {
    const row = this.owner.db.prepare(this.sql).get(...this.params);
    return row || null;
  }
  async all() {
    return { results: this.owner.db.prepare(this.sql).all(...this.params) };
  }
  async run() {
    return this.owner.db.prepare(this.sql).run(...this.params);
  }
}

class D1Adapter {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.failBatchAt = 0;
  }
  prepare(sql) {
    return new StatementAdapter(this, sql);
  }
  async batch(statements) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const results = [];
      for (let i = 0; i < statements.length; i += 1) {
        if (this.failBatchAt && i + 1 === this.failBatchAt) {
          throw new Error(`Injected D1 batch failure at statement ${i + 1}`);
        }
        results.push(await statements[i].run());
      }
      this.db.exec('COMMIT;');
      return results;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }
  row(sql, ...params) {
    return this.db.prepare(sql).get(...params) || null;
  }
  scalar(sql, ...params) {
    const row = this.row(sql, ...params);
    return row ? Number(Object.values(row)[0] || 0) : 0;
  }
}

function makeEnv() {
  const DB = new D1Adapter();
  DB.db.exec(`
    CREATE TABLE sheet_catalog (
      sheet_name TEXT PRIMARY KEY,
      sheet_id TEXT NOT NULL DEFAULT '',
      headers_json TEXT NOT NULL DEFAULT '[]',
      source_last_row INTEGER NOT NULL DEFAULT 0,
      source_last_col INTEGER NOT NULL DEFAULT 0,
      row_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ready',
      synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      note TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE sheet_rows (
      sheet_name TEXT NOT NULL,
      row_number INTEGER NOT NULL,
      values_json TEXT NOT NULL DEFAULT '[]',
      display_json TEXT NOT NULL DEFAULT '[]',
      formulas_json TEXT NOT NULL DEFAULT '[]',
      synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (sheet_name, row_number)
    );
  `);
  return { DB, MIGRATION_SECRET: SECRET, CORS_ORIGINS: 'https://fawakhry.github.io' };
}

function seedSheet(env, sheetName, rows, cols = 3) {
  env.DB.db.prepare(`
    INSERT INTO sheet_catalog (
      sheet_name, sheet_id, headers_json, source_last_row, source_last_col,
      row_count, status, synced_at, note
    ) VALUES (?, ?, ?, ?, ?, ?, 'ready', CURRENT_TIMESTAMP, ?)
  `).run(sheetName, `id-${sheetName}`, JSON.stringify(['A','B','C']), rows.length, cols, rows.length, NOTE);

  const insert = env.DB.db.prepare(`
    INSERT INTO sheet_rows (
      sheet_name, row_number, values_json, display_json, formulas_json, synced_at
    ) VALUES (?, ?, ?, ?, '[]', CURRENT_TIMESTAMP)
  `);
  rows.forEach((value, index) => {
    const arr = [value, `v-${index + 1}`, ''];
    insert.run(sheetName, index + 1, JSON.stringify(arr), JSON.stringify(arr));
  });
}

function deltaRow(rowNumber, value) {
  const arr = [value, `v-${rowNumber}`, ''];
  return { rowNumber, values: arr, display: arr, formulas: ['', '', ''] };
}

async function post(env, payload, secret = SECRET) {
  return handleMirrorDeltaRequest(new Request('https://worker.test/v1/mirror/delta', {
    method: 'POST',
    headers: {
      Origin: 'https://fawakhry.github.io',
      'content-type': 'application/json',
      'x-migration-secret': secret
    },
    body: JSON.stringify(payload)
  }), env);
}

function sheetPayload(sheetName, baseRowCount, sourceLastRow, rows) {
  return {
    sheetName,
    sheetId: `id-${sheetName}`,
    headers: ['A','B','C'],
    sourceLastRow,
    sourceLastCol: 3,
    baseRowCount,
    expectedNote: NOTE,
    note: NOTE,
    rows
  };
}

async function testDeltaSuccessAuthPreflightAndRollback() {
  const env = makeEnv();
  seedSheet(env, 'الأوردرات', ['H','O1','O2']);
  seedSheet(env, 'بنود الأوردرات', ['H','L1','L2']);

  const payload = {
    runId: 'delta-success-1',
    sheets: [
      sheetPayload('الأوردرات', 3, 4, [deltaRow(2, 'O1-CHANGED'), deltaRow(4, 'O3-NEW')]),
      sheetPayload('بنود الأوردرات', 3, 2, [deltaRow(2, 'L1-CHANGED')])
    ]
  };

  // Unauthorized requests fail before any mutation.
  const unauthorized = await post(env, payload, 'wrong-secret');
  assert.equal(unauthorized.status, 401);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM sheet_rows WHERE sheet_name = ?', 'الأوردرات'), 3);

  // One atomic batch changes only the requested rows, appends one and trims one tail row.
  const response = await post(env, payload);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.atomic, true);
  assert.equal(body.rowLevelDelta, true);
  assert.equal(body.changedRows, 3);
  assert.equal(body.deletedRows, 1);
  assert.equal(body.catalogRowsTouched, 2);
  assert.equal(body.estimatedRowWrites, 6);

  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM sheet_rows WHERE sheet_name = ?', 'الأوردرات'), 4);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM sheet_rows WHERE sheet_name = ?', 'بنود الأوردرات'), 2);
  assert.equal(JSON.parse(env.DB.row('SELECT values_json FROM sheet_rows WHERE sheet_name = ? AND row_number = 2', 'الأوردرات').values_json)[0], 'O1-CHANGED');
  assert.equal(JSON.parse(env.DB.row('SELECT values_json FROM sheet_rows WHERE sheet_name = ? AND row_number = 4', 'الأوردرات').values_json)[0], 'O3-NEW');
  assert.equal(env.DB.scalar('SELECT row_count AS c FROM sheet_catalog WHERE sheet_name = ?', 'الأوردرات'), 4);
  assert.equal(env.DB.scalar('SELECT row_count AS c FROM sheet_catalog WHERE sheet_name = ?', 'بنود الأوردرات'), 2);

  // A stale baseline is rejected with no write attempt.
  const stale = await post(env, {
    runId: 'stale-base',
    sheets: [sheetPayload('الأوردرات', 3, 4, [deltaRow(2, 'SHOULD-NOT-WRITE')])]
  });
  assert.equal(stale.status, 409);
  assert.equal(JSON.parse(env.DB.row('SELECT values_json FROM sheet_rows WHERE sheet_name = ? AND row_number = 2', 'الأوردرات').values_json)[0], 'O1-CHANGED');

  // Growth must include every appended row; otherwise fail closed.
  const missingGrowth = await post(env, {
    runId: 'missing-growth',
    sheets: [sheetPayload('الأوردرات', 4, 6, [deltaRow(6, 'ROW6')])]
  });
  assert.equal(missingGrowth.status, 409);
  assert.equal(env.DB.scalar('SELECT COUNT(*) AS c FROM sheet_rows WHERE sheet_name = ?', 'الأوردرات'), 4);

  // Injected D1 batch failure must roll back changes across both sheets.
  const beforeOrder2 = env.DB.row('SELECT values_json FROM sheet_rows WHERE sheet_name = ? AND row_number = 2', 'الأوردرات').values_json;
  const beforeLine2 = env.DB.row('SELECT values_json FROM sheet_rows WHERE sheet_name = ? AND row_number = 2', 'بنود الأوردرات').values_json;
  env.DB.failBatchAt = 2;
  const failed = await post(env, {
    runId: 'rollback-1',
    sheets: [
      sheetPayload('الأوردرات', 4, 4, [deltaRow(2, 'ROLLBACK-O')]),
      sheetPayload('بنود الأوردرات', 2, 2, [deltaRow(2, 'ROLLBACK-L')])
    ]
  });
  assert.equal(failed.status, 503);
  assert.match(String((await failed.json()).message || ''), /Injected D1 batch failure/);
  assert.equal(env.DB.row('SELECT values_json FROM sheet_rows WHERE sheet_name = ? AND row_number = 2', 'الأوردرات').values_json, beforeOrder2);
  assert.equal(env.DB.row('SELECT values_json FROM sheet_rows WHERE sheet_name = ? AND row_number = 2', 'بنود الأوردرات').values_json, beforeLine2);
}

function testAppsScriptContract() {
  const source = fs.readFileSync(path.join(root, 'cloudflare-d1/D1_Orders_Live_Sync_V2.gs'), 'utf8');
  const index = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');
  const gate = fs.readFileSync(path.join(root, 'cloudflare-d1/src/mirror-delta-gate.mjs'), 'utf8');

  assert.match(source, /\/v1\/mirror\/delta/);
  assert.match(source, /rowLevelDelta:\s*true/);
  assert.match(source, /D1_ORDERS_LIVE_SYNC_V2_BASELINE_CHUNK_SIZE\s*=\s*7000/);
  assert.match(source, /D1_ORDERS_LIVE_SYNC_V2_FULL_REBASE_MS\s*=\s*24 \* 60 \* 60 \* 1000/);
  assert.match(source, /d1OrdersLiveSyncV2IsQuotaError_/);
  assert.match(source, /d1-quota-backoff/);
  assert.match(source, /props\.setProperty\('D1_ORDERS_LIVE_SYNC_ENABLED_V1', '0'\)/);
  assert.match(source, /fn === 'd1OrdersLiveSyncTick'/);
  assert.match(gate, /await env\.DB\.batch\(statements\)/);
  assert.match(gate, /Delta base preflight failed/);
  assert.match(gate, /Delta growth is missing appended source rows/);
  assert.match(index, /isMirrorDeltaPath/);
  assert.match(index, /handleMirrorDeltaRequest/);
}

await testDeltaSuccessAuthPreflightAndRollback();
testAppsScriptContract();
console.log('D1 Orders Live Sync V2: ROW-LEVEL DELTA + AUTH + PREFLIGHT + ROLLBACK + QUOTA BACKOFF PASS');
