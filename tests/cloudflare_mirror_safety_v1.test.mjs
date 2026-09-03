import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleMirrorRequest, isMirrorPath } from '../cloudflare-d1/src/mirror-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

class MockStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first() {
    const compact = this.sql.replace(/\s+/g, ' ');
    if (compact.includes('COUNT(*) AS sheetCount')) {
      return {
        sheetCount: 87,
        rowCount: 31176,
        readySheets: 87,
        pendingSheets: 0,
        oldestSyncedAt: '2026-09-03 20:00:00',
        lastSyncedAt: '2026-09-03 23:00:00'
      };
    }
    if (compact.includes('FROM sheet_catalog') && compact.includes('WHERE sheet_name = ?')) {
      return {
        sheetName: 'بنود الأوردرات',
        sheetId: '123',
        headersJson: '["رقم الأوردر","رقم البند"]',
        sourceLastRow: 242,
        sourceLastCol: 92,
        rowCount: 242,
        status: 'ready',
        syncedAt: '2026-09-03 23:00:00',
        note: 'test'
      };
    }
    return null;
  }

  async all() {
    const compact = this.sql.replace(/\s+/g, ' ');
    if (compact.includes('FROM sheet_rows')) {
      return {
        results: [{
          rowNumber: 1,
          valuesJson: '["رقم الأوردر","رقم البند"]',
          displayJson: '["رقم الأوردر","رقم البند"]',
          formulasJson: '["",""]',
          syncedAt: '2026-09-03 23:00:00'
        }]
      };
    }
    if (compact.includes('FROM sheet_catalog')) {
      return {
        results: [{
          sheetName: 'بنود الأوردرات',
          sheetId: '123',
          sourceLastRow: 242,
          sourceLastCol: 92,
          rowCount: 242,
          status: 'ready',
          syncedAt: '2026-09-03 23:00:00',
          note: 'test'
        }]
      };
    }
    return { results: [] };
  }

  async run() {
    this.db.writeOps += 1;
    return { success: true };
  }
}

class MockDB {
  constructor() {
    this.writeOps = 0;
  }

  prepare(sql) {
    return new MockStatement(this, sql);
  }

  async batch() {
    this.writeOps += 1;
    return [];
  }
}

function env(overrides = {}) {
  return {
    DB: new MockDB(),
    CORS_ORIGINS: 'https://fawakhry.github.io',
    MIGRATION_SECRET: 'migration-secret',
    ...overrides
  };
}

async function testStatsReadOnly() {
  const e = env();
  const response = await handleMirrorRequest(
    new Request('https://preview.test/v1/mirror/stats', {
      headers: { Origin: 'https://fawakhry.github.io' }
    }),
    e
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.stats.schemaMutationFree, true);
  assert.equal(body.stats.sheetCount, 87);
  assert.equal(body.stats.pendingSheets, 0);
  assert.equal(e.DB.writeOps, 0);
}

async function testSheetReadOnly() {
  const e = env();
  const response = await handleMirrorRequest(
    new Request('https://preview.test/v1/mirror/sheet?name=%D8%A8%D9%86%D9%88%D8%AF%20%D8%A7%D9%84%D8%A3%D9%88%D8%B1%D8%AF%D8%B1%D8%A7%D8%AA&limit=1', {
      headers: { Origin: 'https://fawakhry.github.io' }
    }),
    e
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.schemaMutationFree, true);
  assert.equal(body.sheet.schemaMutationFree, true);
  assert.equal(body.sheet.rowCount, 242);
  assert.equal(e.DB.writeOps, 0);
}

async function testUnauthorizedImportCannotInitializeSchema() {
  const e = env();
  const response = await handleMirrorRequest(
    new Request('https://preview.test/v1/import/sheet', {
      method: 'POST',
      headers: {
        Origin: 'https://fawakhry.github.io',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ sheetName: 'must-not-write', rows: [] })
    }),
    e
  );
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.schemaMutationFree, true);
  assert.equal(e.DB.writeOps, 0);
}

function testEntryContract() {
  const entry = fs.readFileSync(path.join(root, 'cloudflare-d1/src/index_v2.js'), 'utf8');
  assert.match(entry, /mirror-gate\.mjs/);
  assert.doesNotMatch(entry, /from '\.\/mirror\.js'/);
  assert.equal(isMirrorPath('/v1/mirror/stats'), true);
  assert.equal(isMirrorPath('/v1/import/sheet'), true);
}

await testStatsReadOnly();
await testSheetReadOnly();
await testUnauthorizedImportCannotInitializeSchema();
testEntryContract();

console.log('Cloudflare Mirror Safety V1 tests: PASS');
