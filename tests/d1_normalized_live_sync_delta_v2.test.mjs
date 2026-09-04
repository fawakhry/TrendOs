import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { handleNormalizedImportRequest } from '../cloudflare-d1/src/normalized-import-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SECRET = 'normalized-v2-secret';

class StatementAdapter {
  constructor(owner, sql) { this.owner = owner; this.sql = sql; this.params = []; }
  bind(...params) { this.params = params; return this; }
  async first() { return this.owner.db.prepare(this.sql).get(...this.params) || null; }
  async all() { return { results: this.owner.db.prepare(this.sql).all(...this.params) }; }
  async run() { return this.owner.db.prepare(this.sql).run(...this.params); }
}

class SQLiteD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }
  prepare(sql) { return new StatementAdapter(this, sql); }
  async batch(statements) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const out = [];
      for (const statement of statements) out.push(await statement.run());
      this.db.exec('COMMIT;');
      return out;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }
  count(sql, ...params) {
    const row = this.db.prepare(sql).get(...params);
    return Number(row && Object.values(row)[0] || 0);
  }
  one(sql, ...params) { return this.db.prepare(sql).get(...params) || null; }
}

function makeEnv() {
  const DB = new SQLiteD1();
  DB.db.exec(fs.readFileSync(path.join(root, 'cloudflare-d1/migrations/0001_init.sql'), 'utf8'));
  return { DB, MIGRATION_SECRET: SECRET, CORS_ORIGINS: 'https://fawakhry.github.io' };
}

async function post(env, body) {
  return handleNormalizedImportRequest(new Request('https://worker.test/v1/import/batch', {
    method: 'POST',
    headers: {
      Origin: 'https://fawakhry.github.io',
      'content-type': 'application/json',
      'x-migration-secret': SECRET
    },
    body: JSON.stringify(body)
  }), env);
}

async function testEmptyFinalActsAsFreshnessHeartbeat() {
  const env = makeEnv();

  // Seed one existing order so an empty delta heartbeat proves no business-row rewrite is required.
  const seed = await post(env, {
    syncRunId: 'seed-1',
    syncFinal: true,
    sourceRowCounts: { orders: 1 },
    orders: [{ orderId: 'NORM-V2-1', customerName: 'قبل' }]
  });
  assert.equal(seed.status, 200);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM orders'), 1);

  const before = env.DB.one("SELECT raw_json AS rawJson FROM orders WHERE order_id='NORM-V2-1'").rawJson;
  const beforeRuns = env.DB.count('SELECT COUNT(*) AS c FROM migration_runs');

  const heartbeat = await post(env, {
    syncRunId: 'heartbeat-v2',
    syncFinal: true,
    sourceRowCounts: { customers: 0, orders: 1, messages: 0, conversations: 0 },
    note: 'TrendOS normalized live sync V2 quota-aware',
    customers: [],
    orders: [],
    messages: [],
    conversations: []
  });
  assert.equal(heartbeat.status, 200);
  const body = await heartbeat.json();
  assert.equal(body.success, true);
  assert.equal(body.sync.freshnessAdvanced, true);
  assert.deepEqual(body.sync.completedEntities, ['customers', 'orders', 'messages', 'conversations']);
  assert.equal(env.DB.one("SELECT raw_json AS rawJson FROM orders WHERE order_id='NORM-V2-1'").rawJson, before);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM orders'), 1);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM migration_runs') - beforeRuns, 4);
}

async function testDeltaUpsertsOnlyChangedRowsAndAdvancesAllFreshness() {
  const env = makeEnv();
  await post(env, {
    syncRunId: 'seed-2',
    syncFinal: true,
    sourceRowCounts: { orders: 2 },
    orders: [
      { orderId: 'D-1', customerName: 'A' },
      { orderId: 'D-2', customerName: 'B' }
    ]
  });

  const untouchedBefore = env.DB.one("SELECT raw_json AS rawJson FROM orders WHERE order_id='D-2'").rawJson;
  const response = await post(env, {
    syncRunId: 'delta-v2',
    syncFinal: true,
    sourceRowCounts: { customers: 0, orders: 2, messages: 0, conversations: 0 },
    note: 'TrendOS normalized live sync V2 quota-aware',
    customers: [],
    orders: [{ orderId: 'D-1', customerName: 'A-CHANGED' }],
    messages: [],
    conversations: []
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.imported.orders, 1);
  assert.equal(body.imported.customers, 0);
  assert.equal(body.imported.messages, 0);
  assert.equal(body.imported.conversations, 0);
  assert.equal(JSON.parse(env.DB.one("SELECT raw_json AS rawJson FROM orders WHERE order_id='D-1'").rawJson).customerName, 'A-CHANGED');
  assert.equal(env.DB.one("SELECT raw_json AS rawJson FROM orders WHERE order_id='D-2'").rawJson, untouchedBefore);
  // One seed freshness row for orders + four final freshness rows for the V2 delta request.
  assert.equal(env.DB.count("SELECT COUNT(*) AS c FROM migration_runs WHERE entity IN ('customers','orders','messages','conversations')"), 5);
}

function testAppsScriptV2Contract() {
  const source = fs.readFileSync(path.join(root, 'cloudflare-d1/D1_Normalized_Live_Sync_V2.gs'), 'utf8');
  // Parse as standard V8 JavaScript. Apps Script globals are unresolved only at runtime.
  new Function(source);

  assert.match(source, /d1NormalizedLiveSyncTickV2/);
  assert.match(source, /delta-upsert/);
  assert.match(source, /heartbeat/);
  assert.match(source, /D1_NORMALIZED_SYNC_V2_BASELINE_CHUNK_SIZE\s*=\s*7000/);
  assert.match(source, /D1_NORMALIZED_SYNC_V2_FULL_REBASE_MS\s*=\s*24 \* 60 \* 60 \* 1000/);
  assert.match(source, /d1NormalizedV2IsQuotaError_/);
  assert.match(source, /d1-quota-backoff/);
  assert.match(source, /deletePrune:\s*false/);
  assert.match(source, /props\.setProperty\('D1_NORMALIZED_SYNC_ENABLED_V1', '0'\)/);
  assert.match(source, /fn === 'd1NormalizedLiveSyncTick'/);
  assert.doesNotMatch(source, /\bappendRow\s*\(/);
  assert.doesNotMatch(source, /\.setValues\s*\(/);
}

await testEmptyFinalActsAsFreshnessHeartbeat();
await testDeltaUpsertsOnlyChangedRowsAndAdvancesAllFreshness();
testAppsScriptV2Contract();
console.log('Normalized D1 Live Sync V2: EMPTY-FINAL HEARTBEAT + DELTA UPSERT + ALL-ENTITY FRESHNESS + QUOTA BACKOFF PASS');
