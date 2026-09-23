/**
 * T12 packed-128 DESIGN PROOF: ISOLATED / NOT ROUTED / NO LIVE AUTHORIZATION.
 * Constructs guarded D1 statements from a freshly-qualified source-vs-mirror
 * proposal. Caller MUST run the entire returned array in ONE D1 DB.batch.
 * NO invocation from production Worker or Apps Script; tests use in-memory SQLite.
 * No production caller/route exists and no new permission is granted.
 * A stale candidate fails via sheet_rows.values_json NOT NULL, rolling back batch.
 */
import { buildIsolatedPacked128RecoveryPlan } from './t12-d1-128-packed-cas-planner-isolated-v1.mjs';
export const T12_128_PACKED_BATCH_VERSION = 'T12_128_PACKED_CAS_SYNTHETIC_ONLY';
const PACK_SIZE = 4; // <=100 SQLite bind parameters per packed INSERT; never a live quota claim
const MAX_BATCH_STATEMENTS = 50; // hypothetical Free query ceiling; external plan unknown

function fail(code) { throw new Error('R4_BATCH_ABORT_' + code); }
function requireSafe(ok, code) { if (!ok) fail(code); }
const json = x => JSON.stringify(x);
function verifyInput(plan) {
  const expectedNote='TrendOS orders live sync V2 quota-aware';
  requireSafe(plan && plan.productionWriteAuthorized === false &&
    plan.publicSummary && plan.publicSummary.productionWriteAuthorized === false &&
    Array.isArray(plan.sheets) && plan.sheets.length === 2, 'UNSAFE_PLAN');
  requireSafe(plan.sheets[0].sheetName === 'الأوردرات' &&
    plan.sheets[1].sheetName === 'بنود الأوردرات', 'TAB_MANIFEST');
  requireSafe(plan.sheets.every(s => Number.isInteger(s.sourceLastRow) &&
    Number.isInteger(s.baseRowCount) && s.baseRowCount >= 1 &&
    s.sourceLastRow >= s.baseRowCount && s.sourceLastRow <= 5000 &&
    Number.isInteger(s.sourceLastCol) && s.sourceLastCol > 0 &&
    s.sourceLastCol <= 10000 && String(s.sheetId || '') &&
    s.expectedNote === expectedNote && Array.isArray(s.headers) &&
    s.headers.length === s.sourceLastCol && Array.isArray(s.upserts) &&
    s.upserts.every(u =>
      u.rowNumber >= 1 && u.rowNumber <= s.sourceLastRow &&
      u.replacement && u.replacement.rowNumber === u.rowNumber &&
      ['values','display','formulas'].every(k =>
        Array.isArray(u.replacement[k]) && u.replacement[k].length === s.sourceLastCol) &&
      (u.expectedBefore === null ||
        (u.expectedBefore.rowNumber === u.rowNumber &&
          ['values','display','formulas'].every(k =>
            Array.isArray(u.expectedBefore[k]) &&
            u.expectedBefore[k].length === s.sourceLastCol))))), 'INVALID_ROWS');
  requireSafe(plan.sheets.every(s => s.upserts.every((u, i, all) =>
    i === 0 || all[i - 1].rowNumber < u.rowNumber)), 'DUPLICATE_OR_UNORDERED_CANDIDATE');
  const total=plan.sheets.reduce((n,s)=>n+s.upserts.length,0);
  requireSafe(total >= 0 && total <= 160 &&
    plan.publicSummary.totalCandidateUpserts === total &&
    plan.sheets.every(s =>
      s.upserts.filter(u=>u.expectedBefore===null).length === s.appendedRows &&
      s.upserts.filter(u=>u.expectedBefore!==null).length === s.changedExistingRows),
  'CANDIDATE_BUDGET');
  requireSafe(plan.sheets.every(s=>s.sourceLastRow-s.baseRowCount<=64),
    'ISOLATED_TAIL_BUDGET');
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
/**
 * Four row-CAS propositions in one INSERT. Each would-be row is accepted only
 * against its EXACT D1 pre-image, or absence for a tail append. A violated
 * guard produces NULL values_json and aborts the whole caller DB.batch().
 * SQLite local simulation only; real Cloudflare D1 behavior is NOT qualified.
 */
function packedUpsert(db,s,entries){
  requireSafe(entries.length>=1&&entries.length<=PACK_SIZE,'PACK_SIZE');
  const params=[],parts=[];
  for(const entry of entries){
    const old=entry.expectedBefore, after=entry.replacement;
    const preimage=old
      ? `EXISTS (SELECT 1 FROM sheet_rows r WHERE r.sheet_name=? AND
           r.row_number=? AND r.values_json=? AND r.display_json=? AND r.formulas_json=?)`
      : `NOT EXISTS (SELECT 1 FROM sheet_rows r WHERE r.sheet_name=? AND r.row_number=?)`;
    const preParams=old
      ? [s.sheetName,entry.rowNumber,json(old.values),json(old.display),json(old.formulas)]
      : [s.sheetName,entry.rowNumber];
    parts.push(`(?,?,CASE WHEN EXISTS(SELECT 1 FROM sheet_catalog c WHERE
        c.sheet_name=? AND c.sheet_id=? AND c.headers_json=? AND
        c.source_last_row=? AND c.source_last_col=? AND c.row_count=? AND
        c.status='ready' AND c.note=?)
        AND ${preimage} THEN ? ELSE NULL END,?,?,CURRENT_TIMESTAMP)`);
    params.push(s.sheetName,entry.rowNumber,
      s.sheetName,s.sheetId,json(s.headers),s.baseRowCount,s.sourceLastCol,
      s.baseRowCount,s.expectedNote,
      ...preParams,json(after.values),json(after.display),json(after.formulas));
  }
  const sql=`INSERT INTO sheet_rows
    (sheet_name,row_number,values_json,display_json,formulas_json,synced_at)
    VALUES ${parts.join(',')}
    ON CONFLICT(sheet_name,row_number) DO UPDATE SET
      values_json=excluded.values_json,
      display_json=excluded.display_json,
      formulas_json=excluded.formulas_json,
      synced_at=CURRENT_TIMESTAMP`;
  requireSafe(params.length<=100,'SQL_BOUND_PARAMETER_LIMIT');
  requireSafe(new TextEncoder().encode(sql).length<=100000,'SQL_STATEMENT_BYTES');
  return db.prepare(sql).bind(...params);
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
export function buildIsolatedPacked128GuardedBatch(db, snapshot) {
  requireSafe(db && typeof db.prepare==='function', 'DB_ADAPTER');
  const plan=buildIsolatedPacked128RecoveryPlan(snapshot);
  return buildIsolatedPacked128GuardedBatchFromPlan(db,plan);
}

export function buildIsolatedPacked128GuardedBatchFromPlan(db, plan) {
  requireSafe(db && typeof db.prepare==='function', 'DB_ADAPTER');
  verifyInput(plan);
  requireSafe(plan.publicSummary.totalCandidateUpserts > 0, 'NO_DIFF');
  const statements=[];
  // Both catalog guards are the FIRST two statements in the SAME transaction.
  for (const s of plan.sheets) statements.push(catalogGuard(db,s));
  // Exact row pre-image guards are evaluated inside each grouped INSERT.
  // The two catalog guards were added before ANY grouped mutation, and
  // both catalogs advance only after both tabs' grouped mutations.
  for (const s of plan.sheets) {
    for(let offset=0;offset<s.upserts.length;offset+=PACK_SIZE){
      statements.push(packedUpsert(db,s,s.upserts.slice(offset,offset+PACK_SIZE)));
    }
  }
  // Both catalogs advance only AFTER both sets of rows in this same batch.
  for (const s of plan.sheets) statements.push(catalogAdvance(db,s));
  requireSafe(statements.length<=MAX_BATCH_STATEMENTS,'BATCH_STATEMENT_BUDGET');
  return { statements, publicSummary:plan.publicSummary,
    hypotheticalBatchStatements:statements.length,
    productionWriteAuthorized:false, triggerRestartAuthorized:false,
    cloudCreateCutoverAuthorized:false, requiresDedicatedTestD1Qualification:true,
    requiresSingleTransactionalBatch:true, requiresPostWriteReadOnlyParity:true,
    requiresAccountAndRealPayloadQualification:true };
}
