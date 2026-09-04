import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { handleNormalizedImportRequest } from '../cloudflare-d1/src/normalized-import-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SECRET = 'normalized-import-test-secret';

class StatementAdapter {
  constructor(owner, sql) {
    this.owner = owner;
    this.sql = sql;
    this.params = [];
  }
  bind(...params) { this.params = params; return this; }
  async first() { return this.owner.db.prepare(this.sql).get(...this.params) || null; }
  async all() { return { results: this.owner.db.prepare(this.sql).all(...this.params) }; }
  async run() { return this.owner.db.prepare(this.sql).run(...this.params); }
}

class SQLiteD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.failBatchAt = 0;
  }
  prepare(sql) { return new StatementAdapter(this, sql); }
  async batch(statements) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const out = [];
      for (let i = 0; i < statements.length; i += 1) {
        if (this.failBatchAt && i + 1 === this.failBatchAt) {
          throw new Error(`Injected normalized batch failure at statement ${i + 1}`);
        }
        out.push(await statements[i].run());
      }
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
  return {
    DB,
    MIGRATION_SECRET: SECRET,
    CORS_ORIGINS: 'https://fawakhry.github.io'
  };
}

async function post(env, body, secret = SECRET) {
  return handleNormalizedImportRequest(new Request('https://worker.test/v1/import/batch', {
    method: 'POST',
    headers: {
      Origin: 'https://fawakhry.github.io',
      'content-type': 'application/json',
      'x-migration-secret': secret
    },
    body: JSON.stringify(body)
  }), env);
}

async function testUnauthorizedIsMutationFree() {
  const env = makeEnv();
  const response = await post(env, { orders: [{ orderId: 'NOPE' }] }, 'wrong');
  assert.equal(response.status, 401);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM orders'), 0);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM migration_runs'), 0);
}

async function testFreshnessAdvancesOnlyOnFinalChunk() {
  const env = makeEnv();
  const runId = 'sync-orders-1';

  const first = await post(env, {
    syncRunId: runId,
    syncFinal: false,
    sourceRowCounts: { orders: 2 },
    orders: [{ orderId: 'NORM-1', customerName: 'عميل 1' }]
  });
  assert.equal(first.status, 200);
  const firstBody = await first.json();
  assert.equal(firstBody.sync.final, false);
  assert.equal(firstBody.sync.freshnessAdvanced, false);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM orders'), 1);
  assert.equal(env.DB.count("SELECT COUNT(*) AS c FROM migration_runs WHERE entity='orders'"), 0);

  const final = await post(env, {
    syncRunId: runId,
    syncFinal: true,
    sourceRowCounts: { orders: 2 },
    orders: [{ orderId: 'NORM-2', customerName: 'عميل 2' }]
  });
  assert.equal(final.status, 200);
  const finalBody = await final.json();
  assert.equal(finalBody.sync.final, true);
  assert.equal(finalBody.sync.freshnessAdvanced, true);
  assert.deepEqual(finalBody.sync.completedEntities, ['orders']);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM orders'), 2);
  assert.equal(env.DB.count("SELECT COUNT(*) AS c FROM migration_runs WHERE entity='orders'"), 1);
  const run = env.DB.one("SELECT row_count AS rowCount, note FROM migration_runs WHERE entity='orders' ORDER BY id DESC LIMIT 1");
  assert.equal(Number(run.rowCount), 2);
  const note = JSON.parse(run.note);
  assert.equal(note.kind, 'normalized-live-sync-v1');
  assert.equal(note.syncRunId, runId);
  assert.equal(note.sourceRowCount, 2);
  assert.equal(note.final, true);
}

async function testFailedFinalChunkDoesNotAdvanceFreshness() {
  const env = makeEnv();
  const runId = 'sync-orders-fail';

  const first = await post(env, {
    syncRunId: runId,
    syncFinal: false,
    sourceRowCounts: { orders: 2 },
    orders: [{ orderId: 'PARTIAL-OLD', customerName: 'باقي غير معلن Fresh' }]
  });
  assert.equal(first.status, 200);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM orders'), 1);
  assert.equal(env.DB.count("SELECT COUNT(*) AS c FROM migration_runs WHERE entity='orders'"), 0);

  // Final request has: order upsert + migration_runs completion marker.
  // Fail on completion marker; both statements in this request must roll back.
  env.DB.failBatchAt = 2;
  const failed = await post(env, {
    syncRunId: runId,
    syncFinal: true,
    sourceRowCounts: { orders: 2 },
    orders: [{ orderId: 'PARTIAL-FINAL', customerName: 'يجب أن يرجع Rollback' }]
  });
  assert.equal(failed.status, 500);
  const body = await failed.json();
  assert.match(String(body.message || ''), /Injected normalized batch failure/);
  assert.equal(env.DB.count("SELECT COUNT(*) AS c FROM orders WHERE order_id='PARTIAL-FINAL'"), 0);
  assert.equal(env.DB.count("SELECT COUNT(*) AS c FROM orders WHERE order_id='PARTIAL-OLD'"), 1);
  assert.equal(env.DB.count("SELECT COUNT(*) AS c FROM migration_runs WHERE entity='orders'"), 0);
}

async function testMultiEntityFinalRequestIsAtomic() {
  const env = makeEnv();
  env.DB.failBatchAt = 2;
  const response = await post(env, {
    syncRunId: 'multi-fail',
    syncFinal: true,
    sourceRowCounts: { customers: 1, orders: 1 },
    customers: [{ phone: '01012345678', customerName: 'عميل' }],
    orders: [{ orderId: 'MULTI-1', customerPhone: '01012345678' }]
  });
  assert.equal(response.status, 500);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM customers'), 0);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM orders'), 0);
  assert.equal(env.DB.count('SELECT COUNT(*) AS c FROM migration_runs'), 0);
}

function testAppsScriptLiveSyncContract() {
  const source = fs.readFileSync(path.join(root, 'cloudflare-d1/D1_Normalized_Live_Sync.gs'), 'utf8');
  assert.match(source, /D1_NORMALIZED_SYNC_TRIGGER_FN_V1 = 'd1NormalizedLiveSyncTick'/);
  assert.match(source, /D1_NORMALIZED_SYNC_CLAIM_TTL_MS_V1/);
  assert.match(source, /tryLock\(D1_NORMALIZED_SYNC_CLAIM_LOCK_WAIT_MS_V1\)/);
  assert.match(source, /lock\.releaseLock\(\)/);
  assert.match(source, /d1NormalizedReleaseClaim_\(claim\.token\)/);
  assert.match(source, /syncFinal: final/);
  assert.match(source, /sourceRowCounts/);
  assert.match(source, /freshnessAdvanced/);
  assert.match(source, /D1_NORMALIZED_MESSAGES_SHEET_V1 = 'مدير العملاء - الرسائل'/);
  assert.match(source, /D1_NORMALIZED_CONVERSATIONS_SHEET_V1 = 'مدير العملاء - المحادثات'/);
  assert.doesNotMatch(source, /cmEnsureAll_\(/);
  assert.doesNotMatch(source, /insertSheet\(/);
  assert.doesNotMatch(source, /appendRow\(/);
  assert.match(source, /everyMinutes\(1\)/);
  assert.match(source, /hasD1MigrationSecret/);
}

await testUnauthorizedIsMutationFree();
await testFreshnessAdvancesOnlyOnFinalChunk();
await testFailedFinalChunkDoesNotAdvanceFreshness();
await testMultiEntityFinalRequestIsAtomic();
testAppsScriptLiveSyncContract();

console.log('Normalized Import V1: AUTH + FINAL-FRESHNESS + ROLLBACK + LIVE-SYNC CONTRACT PASS');
