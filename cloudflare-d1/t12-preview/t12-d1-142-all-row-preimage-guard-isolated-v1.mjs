/**
 * SYNTHETIC ONLY / NOT ROUTED: extra preimage guards for every previously
 * unchanged row. This is NOT a source-writer fence or a production D1 proof.
 * Run ALL returned statements in ONE atomic transaction; never individually.
 */
import { buildIsolatedPacked128RecoveryPlan } from './t12-d1-128-packed-cas-planner-isolated-v1.mjs';
import { buildIsolatedPacked128GuardedBatchFromPlan } from './t12-d1-128-packed-cas-batch-isolated-v1.mjs';
const fail = reason => { throw Error('R4_ALL_ROW_GUARD_ABORT_' + reason); };
const requireSafe = (condition, reason) => { if (!condition) fail(reason); };
const stringify = value => JSON.stringify(value);
const byteLength = value => new TextEncoder().encode(value).length;
const MAX_GUARD_PAYLOAD_BYTES_PER_TAB = 100000; // local fail-closed cap, NOT a D1 quota
const MAX_ISOLATED_STATEMENTS = 50; // local planning ceiling, NOT a D1 plan quota

function unchangedGuard(db, sheet, mirror, source) {
  const changed = new Set(sheet.upserts.filter(u => u.expectedBefore !== null)
    .map(u => u.rowNumber));
  const unchanged = mirror.rows.filter(r => !changed.has(r.rowNumber));
  requireSafe(unchanged.length === sheet.baseRowCount - sheet.changedExistingRows,
    'INCOMPLETE_PREIMAGE_SET');
  for (const r of unchanged) {
    requireSafe(r.rowNumber >= 1 && r.rowNumber <= sheet.baseRowCount &&
      stringify(r.values) === stringify(source.rows[r.rowNumber - 1].values) &&
      stringify(r.display) === stringify(source.rows[r.rowNumber - 1].display) &&
      stringify(r.formulas) === stringify(source.rows[r.rowNumber - 1].formulas),
      'INVALID_UNCHANGED_SOURCE_ROW');
  }
  const payload = stringify(unchanged.map(r => ({
    n:r.rowNumber, v:stringify(r.values), d:stringify(r.display),
    f:stringify(r.formulas)
  })));
  requireSafe(byteLength(payload) <= MAX_GUARD_PAYLOAD_BYTES_PER_TAB,
    'GUARD_PAYLOAD_BYTES');
  // NOT NULL(status) deliberately aborts the entire transaction if any
  // unchanged row's EXACT captured JSON preimage disappeared or changed.
  const sql = `INSERT INTO sheet_catalog (sheet_name,status) VALUES (?,
    CASE WHEN EXISTS (SELECT 1 FROM sheet_catalog c WHERE c.sheet_name=?
      AND c.sheet_id=? AND c.headers_json=? AND c.source_last_row=?
      AND c.source_last_col=? AND c.row_count=? AND c.status='ready' AND c.note=?)
      AND (SELECT COUNT(*) FROM json_each(?))=?
      AND NOT EXISTS (
        SELECT 1 FROM json_each(?) e
        LEFT JOIN sheet_rows r ON r.sheet_name=?
          AND r.row_number=CAST(json_extract(e.value,'$.n') AS INTEGER)
        WHERE r.row_number IS NULL
          OR r.values_json IS NOT json_extract(e.value,'$.v')
          OR r.display_json IS NOT json_extract(e.value,'$.d')
          OR r.formulas_json IS NOT json_extract(e.value,'$.f')
      ) THEN 'ready' ELSE NULL END)
    ON CONFLICT(sheet_name) DO UPDATE SET status=excluded.status`;
  const params = [sheet.sheetName,sheet.sheetName,sheet.sheetId,
    stringify(sheet.headers),sheet.baseRowCount,sheet.sourceLastCol,
    sheet.baseRowCount,sheet.expectedNote,payload,unchanged.length,
    payload,sheet.sheetName];
  requireSafe(params.length<=100 && byteLength(sql)<=100000,'GUARD_SQL_LIMIT');
  return {statement:db.prepare(sql).bind(...params),bytes:byteLength(payload),
    rowCount:unchanged.length};
}

export function buildIsolated142AllRowPreimageBatch(db,snapshot) {
  requireSafe(db && typeof db.prepare==='function','DB_ADAPTER');
  const plan=buildIsolatedPacked128RecoveryPlan(snapshot);
  const existing=buildIsolatedPacked128GuardedBatchFromPlan(db,plan);
  // Original planner validates source/mirror snapshots; preserve its
  // ordering contract and explicitly require the complete captured baselines.
  const guards=plan.sheets.map(s=>{
    const mirror=snapshot.mirrorTabs.find(t=>t.sheetName===s.sheetName);
    const source=snapshot.sourceTabs.find(t=>t.sheetName===s.sheetName);
    requireSafe(mirror && source && mirror.rows.length===s.baseRowCount,
      'MISSING_SNAPSHOT_ROWS');
    return unchangedGuard(db,s,mirror,source);
  });
  const statements=[...guards.map(g=>g.statement),...existing.statements];
  requireSafe(statements.length<=MAX_ISOLATED_STATEMENTS,'STATEMENT_BUDGET');
  return {
    ...existing, statements, hypotheticalBatchStatements:statements.length,
    localGuardPayloadBytes:guards.map(g=>g.bytes),
    guardedUnchangedRowCounts:guards.map(g=>g.rowCount),
    allUnchangedRowsGuardedInSingleTransaction:true,
    productionWriteAuthorized:false,requiresSingleTransactionalBatch:true,
    requiresSourceAndAllWriterFence:true,requiresPostWriteReadOnlyParity:true,
    requiresRealD1Qualification:true
  };
}
