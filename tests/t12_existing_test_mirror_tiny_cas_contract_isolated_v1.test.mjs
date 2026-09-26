/**
 * LOCAL SYNTHETIC CONTRACT TEST ONLY.
 * No Cloudflare D1, Worker route, Google Sheets, Apps Script, CI or production IO.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  TEST_ONLY_D1_NAME,
  TEST_ONLY_MIRROR_UUID,
  prepareTestOnlyMirrorCasStatements
} from '../cloudflare-d1/t12-preview/t12-existing-test-mirror-packed-cas-qualification-isolated-20260924.mjs';

const NOTE = 'TrendOS orders live sync V2 quota-aware';
const HEADER = '["synthetic_header"]';
const FORMULAS = '[""]';
const tabs = [
  {
    name: 'الأوردرات',
    sheetId: 'SYNTHETIC_TEST_MIRROR_9001',
    old: '["SYNTHETIC TEST MIRROR OLD ORDER"]',
    next: '["SYNTHETIC TEST MIRROR NEW ORDER"]'
  },
  {
    name: 'بنود الأوردرات',
    sheetId: 'SYNTHETIC_TEST_MIRROR_9002',
    old: '["SYNTHETIC TEST MIRROR OLD LINE"]',
    next: '["SYNTHETIC TEST MIRROR NEW LINE"]'
  }
];
const mirrorSchema = fs.readFileSync(new URL(
  '../cloudflare-d1/migrations/0002_full_sheet_mirror.sql', import.meta.url), 'utf8');

class Statement {
  constructor(db, sql) { this.db = db; this.sql = sql; this.args = []; }
  bind(...args) { this.args = args; return this; }
  run() { return this.db.raw.prepare(this.sql).run(...this.args); }
}

class MockD1 {
  constructor() {
    this.raw = new DatabaseSync(':memory:');
    this.raw.exec(mirrorSchema);
    this.raw.exec(`CREATE TABLE t12_synth_control (
      singleton INTEGER PRIMARY KEY,
      fixture_marker TEXT NOT NULL
    )`);
    this.raw.prepare(
      'INSERT INTO t12_synth_control(singleton,fixture_marker) VALUES(1,?)'
    ).run('T12_SYNTHETIC_ONLY');
    for (const t of tabs) {
      this.raw.prepare(`INSERT INTO sheet_catalog
        (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,
         row_count,status,note) VALUES (?,?,?,2,1,2,'ready',?)`)
        .run(t.name, t.sheetId, HEADER, NOTE);
      this.raw.prepare(`INSERT INTO sheet_rows
        (sheet_name,row_number,values_json,display_json,formulas_json)
        VALUES (?,?,?,?,?)`).run(t.name, 1, HEADER, HEADER, FORMULAS);
      this.raw.prepare(`INSERT INTO sheet_rows
        (sheet_name,row_number,values_json,display_json,formulas_json)
        VALUES (?,?,?,?,?)`).run(t.name, 2, t.old, t.old, FORMULAS);
    }
  }
  prepare(sql) { return new Statement(this, sql); }
  async batch(statements, { loseResponse = false } = {}) {
    this.raw.exec('BEGIN IMMEDIATE');
    try {
      for (const statement of statements) statement.run();
      this.raw.exec('COMMIT');
      if (loseResponse) throw new Error('synthetic-response-lost-after-commit');
    } catch (error) {
      if (this.raw.isTransaction) this.raw.exec('ROLLBACK');
      throw error;
    }
  }
  row(sheetName, rowNumber) {
    return this.raw.prepare(`SELECT values_json AS v, display_json AS d,
      formulas_json AS f FROM sheet_rows
      WHERE sheet_name=? AND row_number=?`).get(sheetName, rowNumber);
  }
  catalog(sheetName) {
    return this.raw.prepare(`SELECT sheet_id,headers_json,source_last_row,
      source_last_col,row_count,status,note FROM sheet_catalog
      WHERE sheet_name=?`).get(sheetName);
  }
}

function assertRow(actual, v, d, f) {
  assert.equal(actual.v, v);
  assert.equal(actual.d, d);
  assert.equal(actual.f, f);
}
function assertOldBaseline(db) {
  for (const t of tabs) {
    assertRow(db.row(t.name, 1), HEADER, HEADER, FORMULAS);
    assertRow(db.row(t.name, 2), t.old, t.old, FORMULAS);
    assert.equal(db.catalog(t.name).status, 'ready');
  }
}
function assertNewBaseline(db) {
  for (const t of tabs) {
    assertRow(db.row(t.name, 1), HEADER, HEADER, FORMULAS);
    assertRow(db.row(t.name, 2), t.next, t.next, FORMULAS);
    assert.equal(db.catalog(t.name).status, 'ready');
  }
}

let cases = 0;

{
  const db = new MockD1();
  const plan = prepareTestOnlyMirrorCasStatements(db, 'negative-conflict');
  assert.equal(plan.statementCount, 5);
  assert.equal(plan.executorIncluded, false);
  assert.equal(plan.testWriteAuthorized, false);
  assert.equal(plan.productionWriteAuthorized, false);
  assert.equal(plan.testDatabaseName, TEST_ONLY_D1_NAME);
  assert.equal(plan.expectedTestDatabaseUuid, TEST_ONLY_MIRROR_UUID);
  await assert.rejects(db.batch(plan.statements), /NOT NULL|constraint/i);
  assertOldBaseline(db);
  cases++;
}

{
  const db = new MockD1();
  const plan = prepareTestOnlyMirrorCasStatements(db, 'positive');
  assert.equal(plan.statementCount, 4);
  await db.batch(plan.statements);
  assertNewBaseline(db);
  cases++;
}

{
  const db = new MockD1();
  db.raw.prepare(`UPDATE sheet_rows SET values_json='["DRIFT"]'
    WHERE sheet_name=? AND row_number=1`).run(tabs[1].name);
  const plan = prepareTestOnlyMirrorCasStatements(db, 'positive');
  await assert.rejects(db.batch(plan.statements), /NOT NULL|constraint/i);
  assert.equal(db.row(tabs[0].name, 2).v, tabs[0].old);
  assert.equal(db.row(tabs[1].name, 2).v, tabs[1].old);
  assert.equal(db.row(tabs[1].name, 1).v, '["DRIFT"]');
  cases++;
}

{
  const db = new MockD1();
  db.raw.prepare(`UPDATE sheet_catalog SET source_last_col=2
    WHERE sheet_name=?`).run(tabs[0].name);
  const plan = prepareTestOnlyMirrorCasStatements(db, 'positive');
  await assert.rejects(db.batch(plan.statements), /NOT NULL|constraint/i);
  assert.equal(db.row(tabs[0].name, 2).v, tabs[0].old);
  assert.equal(db.row(tabs[1].name, 2).v, tabs[1].old);
  cases++;
}

{
  const db = new MockD1();
  const plan = prepareTestOnlyMirrorCasStatements(db, 'positive');
  await assert.rejects(
    db.batch(plan.statements, { loseResponse: true }),
    /synthetic-response-lost-after-commit/
  );
  assertNewBaseline(db);
  const retry = prepareTestOnlyMirrorCasStatements(db, 'positive');
  await assert.rejects(db.batch(retry.statements), /NOT NULL|constraint/i);
  assertNewBaseline(db);
  cases++;
}

{
  const db = new MockD1();
  assert.throws(
    () => prepareTestOnlyMirrorCasStatements(db, 'anything-else'),
    /EXPLICIT_SCENARIO_REQUIRED/
  );
  assertOldBaseline(db);
  cases++;
}

assert.equal(cases, 6);
console.log(
  `T12 tiny mirror CAS local SQLite contract PASS ${cases}/6; ` +
  'negative rollback; positive atomic commit; row/catalog drift abort; ' +
  'lost-ACK commits but blind replay fails closed; invalid scenario rejected; ' +
  'LOCAL ONLY; NO TEST OR PRODUCTION AUTHORIZATION.'
);
