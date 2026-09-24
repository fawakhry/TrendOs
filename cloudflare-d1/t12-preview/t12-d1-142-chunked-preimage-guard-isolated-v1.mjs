/**
 * SYNTHETIC ONLY / NOT ROUTED / NO PRODUCTION WRITE AUTHORIZATION.
 * Break unchanged-row preimages into bounded JSON bind arguments while retaining
 * ONE guard statement per tab and ONE atomic transaction for both tabs.
 * Limits below are local design caps, NOT verified Cloudflare D1 quotas.
 */
import {buildIsolatedPacked128RecoveryPlan} from './t12-d1-128-packed-cas-planner-isolated-v1.mjs';
import {buildIsolatedPacked128GuardedBatchFromPlan} from './t12-d1-128-packed-cas-batch-isolated-v1.mjs';
const fail = code => {throw Error('R4_CHUNKED_GUARD_ABORT_' + code);};
const ensure = (ok,code) => {if(!ok) fail(code);};
const json = value => JSON.stringify(value);
const bytes = value => new TextEncoder().encode(value).length;
const MAX_CHUNK_BYTES = 100000; // mock-only, individual JSON bind parameter
const MAX_ALL_GUARD_BYTES = 3000000; // mock-only, request-wide size ceiling
const MAX_GUARD_BINDS = 100; // mock-only; account-specific D1 limits NOT verified
const MAX_STATEMENTS = 50; // mock-only; account-specific D1 limits NOT verified

function packExpected(rows) {
  const chunks=[];
  let current=[];
  for(const r of rows){
    const item={n:r.rowNumber,v:json(r.values),d:json(r.display),f:json(r.formulas)};
    ensure(bytes(json([item]))<=MAX_CHUNK_BYTES,'ONE_ROW_EXCEEDS_CHUNK');
    if(current.length && bytes(json([...current,item]))>MAX_CHUNK_BYTES){
      chunks.push(json(current));current=[];
    }
    current.push(item);
  }
  if(current.length)chunks.push(json(current));
  return chunks;
}

function guardForTab(db,plan,source,mirror) {
  ensure(source&&mirror&&mirror.rows.length===plan.baseRowCount,'MISSING_MIRROR_ROWS');
  const changed=new Set(plan.upserts.filter(u=>u.expectedBefore!==null).map(u=>u.rowNumber));
  const unchanged=mirror.rows.filter(r=>!changed.has(r.rowNumber));
  ensure(unchanged.length===plan.baseRowCount-plan.changedExistingRows,'INCOMPLETE_PREIMAGE');
  for(const r of unchanged){
    ensure(Number.isInteger(r.rowNumber)&&r.rowNumber>=1&&r.rowNumber<=plan.baseRowCount,
      'INVALID_ROW_NUMBER');
    const same=source.rows[r.rowNumber-1];
    ensure(same&&['values','display','formulas'].every(k=>json(r[k])===json(same[k])),
      'UNCAPTURED_SOURCE_DRIFT');
  }
  const chunks=packExpected(unchanged);
  const totalBytes=chunks.reduce((acc,c)=>acc+bytes(c),0);
  ensure(totalBytes<=MAX_ALL_GUARD_BYTES,'TOTAL_GUARD_PAYLOAD_BYTES');
  const pieces=chunks.length ? chunks.map(()=>"SELECT CAST(json_extract(e.value,'$.n') AS INTEGER) n,\n    json_extract(e.value,'$.v') v,json_extract(e.value,'$.d') d,\n    json_extract(e.value,'$.f') f FROM json_each(?) AS e") :
    ['SELECT NULL n,NULL v,NULL d,NULL f WHERE 0'];
  const sql="WITH expected AS MATERIALIZED ("+pieces.join('\nUNION ALL\n')+")\n"+
    "INSERT INTO sheet_catalog (sheet_name,status) VALUES (?,CASE WHEN\n"+
    "EXISTS(SELECT 1 FROM sheet_catalog c WHERE c.sheet_name=? AND c.sheet_id=?\n"+
    "AND c.headers_json=? AND c.source_last_row=? AND c.source_last_col=?\n"+
    "AND c.row_count=? AND c.status='ready' AND c.note=?)\n"+
    "AND (SELECT COUNT(*) FROM expected)=?\n"+
    "AND NOT EXISTS(SELECT 1 FROM expected x LEFT JOIN sheet_rows r\n"+
    "ON r.sheet_name=? AND r.row_number=x.n\n"+
    "WHERE r.row_number IS NULL OR r.values_json IS NOT x.v\n"+
    "OR r.display_json IS NOT x.d OR r.formulas_json IS NOT x.f)\n"+
    "THEN 'ready' ELSE NULL END)\n"+
    "ON CONFLICT(sheet_name) DO UPDATE SET status=excluded.status";
  const params=[...chunks,plan.sheetName,plan.sheetName,plan.sheetId,json(plan.headers),
    plan.baseRowCount,plan.sourceLastCol,plan.baseRowCount,plan.expectedNote,
    unchanged.length,plan.sheetName];
  ensure(params.length<=MAX_GUARD_BINDS,'GUARD_BIND_COUNT');
  ensure(bytes(sql)<=100000,'GUARD_SQL_BYTES');
  return {stmt:db.prepare(sql).bind(...params),chunks:chunks.length,totalBytes,
    unchangedRows:unchanged.length,bindCount:params.length};
}

export function buildIsolated142ChunkedPreimageBatch(db,snapshot){
  ensure(db&&typeof db.prepare==='function','DB_ADAPTER');
  const plan=buildIsolatedPacked128RecoveryPlan(snapshot);
  const baseline=buildIsolatedPacked128GuardedBatchFromPlan(db,plan);
  ensure(baseline.productionWriteAuthorized===false,'UNSAFE_BASELINE');
  const guards=plan.sheets.map(s=>guardForTab(db,s,
    snapshot.sourceTabs.find(x=>x.sheetName===s.sheetName),
    snapshot.mirrorTabs.find(x=>x.sheetName===s.sheetName)));
  const statements=[...guards.map(g=>g.stmt),...baseline.statements];
  ensure(statements.length<=MAX_STATEMENTS,'STATEMENT_BUDGET');
  ensure(guards.reduce((n,g)=>n+g.totalBytes,0)<=MAX_ALL_GUARD_BYTES,
    'TOTAL_BATCH_GUARD_BYTES');
  return {...baseline,statements,hypotheticalBatchStatements:statements.length,
    guardedUnchangedRowCounts:guards.map(g=>g.unchangedRows),
    guardChunkCounts:guards.map(g=>g.chunks),
    guardPayloadBytes:guards.map(g=>g.totalBytes),
    guardBindCounts:guards.map(g=>g.bindCount),
    allUnchangedRowsGuardedInSingleTransaction:true,
    requiresSingleTransactionalBatch:true,requiresSourceAndAllWriterFence:true,
    requiresRealD1Qualification:true,requiresPostWriteReadOnlyParity:true,
    productionWriteAuthorized:false,cloudCreateCutoverAuthorized:false};
}
