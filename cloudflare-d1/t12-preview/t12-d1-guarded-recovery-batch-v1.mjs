/**
 * R4 ISOLATED / NOT ROUTED / NO PRODUCTION AUTHORIZATION.
 * Constructs guarded D1 statements from a freshly-qualified source-vs-mirror
 * proposal. Caller MUST run the entire returned array in ONE D1 DB.batch.
 * NO invocation from production Worker or Apps Script; tests use in-memory SQLite.
 * A stale candidate fails via sheet_rows.values_json NOT NULL, rolling back batch.
 */
import { buildTargetedRecoveryPlan } from './t12-d1-targeted-recovery-plan-v1.mjs';
export const R4_GUARDED_BATCH_VERSION = 'TRENDOS_R4_GUARDED_BATCH_V1_ISOLATED';

function fail(code) { throw new Error('R4_BATCH_ABORT_' + code); }
function requireSafe(ok, code) { if (!ok) fail(code); }
const json = x => JSON.stringify(x);
function verifyInput(plan) {
  requireSafe(plan && plan.productionWriteAuthorized === false &&
    Array.isArray(plan.sheets) && plan.sheets.length === 2, 'UNSAFE_PLAN');
  requireSafe(plan.sheets[0].sheetName === 'الأوردرات' &&
    plan.sheets[1].sheetName === 'بنود الأوردرات', 'TAB_MANIFEST');
  requireSafe(plan.sheets.every(s => s.sourceLastRow >= s.baseRowCount &&
    s.sourceLastCol > 0 && s.upserts.every(u =>
      u.rowNumber >= 1 && u.rowNumber <= s.sourceLastRow &&
      u.replacement.rowNumber === u.rowNumber)), 'INVALID_ROWS');
  requireSafe(plan.sheets.every(s => s.upserts.every((u, i, all) =>
    i === 0 || all[i - 1].rowNumber < u.rowNumber)), 'DUPLICATE_OR_UNORDERED_CANDIDATE');
}
function catalogGuard(db, s) {
  const headers = json(s.headers);
  const sql = `INSERT INTO sheet_catalog
    (sheet_name,sheet_id,headers_json,source_last_row,source_last_col,
     row_count,status,note)
    VALUES (?,?,?,?,?,?,
      CASE WHEN EXISTS (
        SELECT 1 FROM sheet_catalog c WHERE c.sheet_name=? AND
          c.sheet_id=? AND c.headers_json=? AND c.source_last_row=? AND
          c.source_last_col=? AND c.row_count=? AND c.status='ready' AND c.note=?
      ) AND (SELECT COUNT(*) FROM sheet_rows WHERE sheet_name=?)=?
        AND (SELECT MIN(row_number) FROM sheet_rows WHERE sheet_name=?)=1
        AND (SELECT MAX(row_number) FROM sheet_rows WHERE sheet_name=?)=?
      THEN 'ready' ELSE NULL END,?)
    ON CONFLICT(sheet_name) DO UPDATE SET status=excluded.status`;
  return db.prepare(sql).bind(
    s.sheetName,s.sheetId,headers,s.baseRowCount,s.sourceLastCol,s.baseRowCount,
    s.sheetName,s.sheetId,headers,s.baseRowCount,s.sourceLastCol,s.baseRowCount,
    s.expectedNote,s.sheetName,s.baseRowCount,s.sheetName,s.sheetName,
    s.baseRowCount,s.expectedNote
  );
}
function guardedUpsert(db, s, entry, rowCountAtThisPoint) {
  const old = entry.expectedBefore;
  const existingPredicate = old
    ? `EXISTS (SELECT 1 FROM sheet_rows r WHERE r.sheet_name=? AND
         r.row_number=? AND r.values_json=? AND r.display_json=? AND r.formulas_json=?)`
    : `NOT EXISTS (SELECT 1 FROM sheet_rows r WHERE r.sheet_name=? AND r.row_number=?)`;
  const existingParams = old
    ? [s.sheetName,entry.rowNumber,json(old.values),json(old.display),json(old.formulas)]
    : [s.sheetName,entry.rowNumber];
  const sql = `INSERT INTO sheet_rows
    (sheet_name,row_number,values_json,display_json,formulas_json,synced_at)
    VALUES(?,?,CASE WHEN
      EXISTS(SELECT 1 FROM sheet_catalog c WHERE c.sheet_name=? AND
        c.sheet_id=? AND c.headers_json=? AND c.source_last_row=? AND
        c.source_last_col=? AND c.row_count=? AND c.status='ready' AND c.note=?)
      AND (SELECT COUNT(*) FROM sheet_rows WHERE sheet_name=?)=?
      AND ${existingPredicate}
      THEN ? ELSE NULL END,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(sheet_name,row_number) DO UPDATE SET
      values_json=excluded.values_json,
      display_json=excluded.display_json,
      formulas_json=excluded.formulas_json,
      synced_at=CURRENT_TIMESTAMP`;
  const after = entry.replacement;
  return db.prepare(sql).bind(
    s.sheetName,entry.rowNumber,
    s.sheetName,s.sheetId,json(s.headers),s.baseRowCount,s.sourceLastCol,
    s.baseRowCount,s.expectedNote,s.sheetName,rowCountAtThisPoint,
    ...existingParams,json(after.values),json(after.display),json(after.formulas)
  );
}
function catalogAdvance(db, s) {
  const sql = `UPDATE sheet_catalog SET
    source_last_row=CASE WHEN
      sheet_id=? AND headers_json=? AND source_last_row=? AND
      source_last_col=? AND row_count=? AND status='ready' AND note=? AND
      (SELECT COUNT(*) FROM sheet_rows WHERE sheet_name=?)=? AND
      (SELECT MIN(row_number) FROM sheet_rows WHERE sheet_name=?)=1 AND
      (SELECT MAX(row_number) FROM sheet_rows WHERE sheet_name=?)=?
      THEN ? ELSE NULL END,
    row_count=?,synced_at=CURRENT_TIMESTAMP
    WHERE sheet_name=?`;
  return db.prepare(sql).bind(
    s.sheetId,json(s.headers),s.baseRowCount,s.sourceLastCol,
    s.baseRowCount,s.expectedNote,s.sheetName,s.sourceLastRow,
    s.sheetName,s.sheetName,s.sourceLastRow,s.sourceLastRow,
    s.sourceLastRow,s.sheetName
  );
}
export function buildIsolatedGuardedRecoveryBatch(db, snapshot) {
  requireSafe(db && typeof db.prepare==='function', 'DB_ADAPTER');
  const plan=buildTargetedRecoveryPlan(snapshot);
  verifyInput(plan);
  requireSafe(plan.publicSummary.totalCandidateUpserts > 0, 'NO_DIFF');
  const statements=[];
  // Both catalog guards are the FIRST two statements in the SAME transaction.
  for (const s of plan.sheets) statements.push(catalogGuard(db,s));
  // Each changed row uses pre-image CAS; each append checks that row is absent.
  // Appends follow existing updates, so own inserts account for row-count growth.
  for (const s of plan.sheets) {
    let appended=0;
    for (const u of s.upserts) {
      const expectedCount=s.baseRowCount+appended;
      statements.push(guardedUpsert(db,s,u,expectedCount));
      if (u.expectedBefore===null) appended++;
    }
  }
  // Both catalogs advance only AFTER both sets of rows in this same batch.
  for (const s of plan.sheets) statements.push(catalogAdvance(db,s));
  return { statements, publicSummary:plan.publicSummary,
    productionWriteAuthorized:false, triggerRestartAuthorized:false,
    requiresSingleTransactionalBatch:true, requiresPostWriteReadOnlyParity:true };
}
