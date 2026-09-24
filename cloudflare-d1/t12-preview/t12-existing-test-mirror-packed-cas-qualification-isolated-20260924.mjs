/**
 * TrendOS existing TEST D1 mirror: SOURCE-ONLY qualification candidate.
 * NOT deployed, NOT imported by any Worker, NO HTTP route and NO DB.batch call.
 * Preparing statements is NOT authorization to execute them.
 * Never use on trendos-main, customer data, Google Sheets or t12_synth_* writes.
 * Existing TEST UUID must be verified from independent Cloudflare account evidence:
 * 54a3c05e-cde9-4979-814f-d40f941edcd5.
 *
 * Scope: a tiny two-tab synthetic transaction, NOT full 142-position/large-payload
 * packed-CAS qualification. Do not paste individual statements in D1 Console:
 * a separate, authorized TEST-only executor must submit ALL prepared statements
 * with exactly ONE D1Database.batch() call after verification.
 */
export const TEST_ONLY_MIRROR_UUID = '54a3c05e-cde9-4979-814f-d40f941edcd5';
export const TEST_ONLY_D1_NAME = 'trendos-t12-synthetic-test';
export const QUALIFICATION_VERSION = 'T12_TEST_TWO_TAB_CAS_PREPARED_ONLY_20260924';
const NOTE = 'TrendOS orders live sync V2 quota-aware';
const HEADER = '["synthetic_header"]';
const FORMULAS = '[""]';
const tabs = Object.freeze([
  Object.freeze({
    name: 'الأوردرات', sheetId: 'SYNTHETIC_TEST_MIRROR_9001',
    old: '["SYNTHETIC TEST MIRROR OLD ORDER"]',
    next: '["SYNTHETIC TEST MIRROR NEW ORDER"]'
  }),
  Object.freeze({
    name: 'بنود الأوردرات', sheetId: 'SYNTHETIC_TEST_MIRROR_9002',
    old: '["SYNTHETIC TEST MIRROR OLD LINE"]',
    next: '["SYNTHETIC TEST MIRROR NEW LINE"]'
  })
]);
const quote = v => "'" + v.replace(/'/g, "''") + "'";
function assert(ok, label) {
  if (!ok) throw new Error('TEST_MIRROR_QUALIFICATION_ABORT_' + label);
}
// Every baseline condition below uses only fixed fabricated literals.
// Pre-image guards include BOTH header (unchanged) and row 2 on BOTH tabs.
function fullBaselinePredicate() {
  const catalog = tabs.map(t => `EXISTS (
    SELECT 1 FROM sheet_catalog c
    WHERE c.sheet_name=${quote(t.name)}
      AND c.sheet_id=${quote(t.sheetId)}
      AND c.headers_json=${quote(HEADER)}
      AND c.source_last_row=2 AND c.source_last_col=1
      AND c.row_count=2 AND c.status='ready'
      AND c.note=${quote(NOTE)}
  )`);
  const rows = tabs.flatMap(t => [
    {num: 1, value: HEADER},
    {num: 2, value: t.old}
  ].map(r => `EXISTS (
    SELECT 1 FROM sheet_rows x
    WHERE x.sheet_name=${quote(t.name)} AND x.row_number=${r.num}
      AND x.values_json=${quote(r.value)}
      AND x.display_json=${quote(r.value)}
      AND x.formulas_json=${quote(FORMULAS)}
  )`));
  return [
    `EXISTS (SELECT 1 FROM t12_synth_control
       WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY')`,
    '(SELECT COUNT(*) FROM sheet_catalog)=2',
    '(SELECT COUNT(*) FROM sheet_rows)=4',
    '(SELECT COUNT(*) FROM sheet_migration_runs)=0',
    ...catalog, ...rows
  ].join('\n AND ');
}
function preflight(db, t) {
  // A failed guard inserts NULL into sheet_catalog.status (NOT NULL) => abort.
  // ON CONFLICT can resolve only the sheet_name uniqueness conflict, not NOT NULL.
  const sql = `INSERT INTO sheet_catalog (sheet_name,status)
    VALUES (?, CASE WHEN ${fullBaselinePredicate()} THEN 'ready' ELSE NULL END)
    ON CONFLICT(sheet_name) DO UPDATE SET status=excluded.status`;
  return db.prepare(sql).bind(t.name);
}
function casRow2(db,t) {
  // Existing row must retain its exact old values at the instant this SQL runs.
  // Missing or modified row => NULL values_json (NOT NULL) => transaction abort.
  const sql = `INSERT INTO sheet_rows
      (sheet_name,row_number,values_json,display_json,formulas_json)
    VALUES (?,2,
      CASE WHEN EXISTS (SELECT 1 FROM sheet_rows r
        WHERE r.sheet_name=? AND r.row_number=2
          AND r.values_json=? AND r.display_json=? AND r.formulas_json=?)
      THEN ? ELSE NULL END,
      ?,?)
    ON CONFLICT(sheet_name,row_number) DO UPDATE SET
      values_json=excluded.values_json,
      display_json=excluded.display_json,
      formulas_json=excluded.formulas_json`;
  return db.prepare(sql).bind(t.name,t.name,t.old,t.old,FORMULAS,t.next,t.next,FORMULAS);
}
function intentionalConflict(db,t) {
  // Only used within the NEGATIVE transaction. It must be rolled back completely.
  // Never execute this statement alone, or after a successful positive batch.
  const sql = `UPDATE sheet_rows
    SET values_json=?,display_json=?
    WHERE sheet_name=? AND row_number=2
      AND values_json=? AND display_json=? AND formulas_json=?`;
  const conflict='["SYNTHETIC TEST MIRROR CONFLICT LINE"]';
  return db.prepare(sql).bind(conflict,conflict,t.name,t.old,t.old,FORMULAS);
}
/**
 * Build a statement array; DOES NOT execute. A caller must not use this without
 * a separate owner-approved, TEST-only executor, binding/UUID proof, and
 * an observed single-DB.batch atomicity/lost-response reconciliation protocol.
 *
 * "negative-conflict": 2 baseline guards, artificial line conflict, order CAS,
 * line CAS => the last CAS must FAIL and the entire transaction must ROLLBACK.
 * "positive": 2 baseline guards and two CAS rows => both tabs change together.
 *
 * Run negative FIRST, read-only confirm original baseline, then separately
 * authorize positive. Never retry a batch when its outcome is unknown.
 */
export function prepareTestOnlyMirrorCasStatements(db, scenario) {
  assert(db && typeof db.prepare === 'function', 'D1_PREPARE_ADAPTER');
  assert(scenario === 'negative-conflict' || scenario === 'positive',
    'EXPLICIT_SCENARIO_REQUIRED');
  const statements = tabs.map(t => preflight(db,t));
  if (scenario === 'negative-conflict') {
    statements.push(intentionalConflict(db,tabs[1]));
  }
  statements.push(...tabs.map(t => casRow2(db,t)));
  return Object.freeze({
    statements: Object.freeze(statements),
    scenario,
    statementCount: statements.length,
    testDatabaseName: TEST_ONLY_D1_NAME,
    expectedTestDatabaseUuid: TEST_ONLY_MIRROR_UUID,
    identityVerifiedByThisModule: false,
    productionWriteAuthorized: false,
    testWriteAuthorized: false,
    requiresSeparateOwnerConsent: true,
    requiresFreshTestBindingVerification: true,
    requiresSingleAtomicD1Batch: true,
    requiresReadOnlyPostflight: true,
    onUnknownResponse: 'STOP_READ_ONLY_RECONCILE_NO_AUTOMATIC_RETRY',
    executorIncluded: false,
    deployed: false
  });
}
