/**
 * TEST ONLY / READ ONLY / NO PRODUCTION AUTHORIZATION.
 * Diagnoses whether the existing large 142 preimage-guard payload can be
 * accepted by remote D1 as SELECT-only prepared statements.
 * No db.batch(), INSERT, UPDATE, DELETE, DDL, seed, or Worker deploy.
 */
const ROUTE='/__t12/local/142-readonly-guard-probe';
const NOTE='TrendOS orders live sync V2 quota-aware';
const MAX_CHUNK_BYTES=100000;
const specs=Object.freeze([
  Object.freeze({name:'الأوردرات',sheetId:'T12_142_SYNTHETIC_9001',width:77,base:652}),
  Object.freeze({name:'بنود الأوردرات',sheetId:'T12_142_SYNTHETIC_9002',width:92,base:708})
]);
const enc=new TextEncoder();
const bytes=v=>enc.encode(v).length;
const j=v=>JSON.stringify(v);
const tag=(w,v)=>j(Array(w).fill(v));
const headers=w=>Array.from({length:w},(_,i)=>'c'+i);

function expectedUnchangedRows(s){
  const f=j(Array(s.width).fill(''));
  const out=[{n:1,v:tag(s.width,'h'),d:tag(s.width,'h'),f}];
  for(let n=13;n<=s.base;n++) out.push({n,v:tag(s.width,'s'),d:tag(s.width,'s'),f});
  return out;
}
function packExpected(rows){
  const chunks=[]; let current=[];
  for(const item of rows){
    if(bytes(j([item]))>MAX_CHUNK_BYTES) throw Error('READONLY_PROBE_ONE_ROW_EXCEEDS_CHUNK');
    if(current.length&&bytes(j([...current,item]))>MAX_CHUNK_BYTES){
      chunks.push(j(current)); current=[];
    }
    current.push(item);
  }
  if(current.length) chunks.push(j(current));
  return chunks;
}
export function buildReadOnlyGuardProbe(db,s){
  if(!db||typeof db.prepare!=='function') throw Error('READONLY_PROBE_DB_ADAPTER');
  const chunks=packExpected(expectedUnchangedRows(s));
  const pieces=chunks.map(()=>`SELECT CAST(json_extract(e.value,'$.n') AS INTEGER) n,
    json_extract(e.value,'$.v') v,json_extract(e.value,'$.d') d,
    json_extract(e.value,'$.f') f FROM json_each(?) AS e`);
  const h=j(headers(s.width));
  const sql=`WITH expected AS MATERIALIZED (${pieces.join('\nUNION ALL\n')})
SELECT
  (SELECT COUNT(*) FROM expected) expected_rows,
  (SELECT COUNT(*) FROM expected x LEFT JOIN sheet_rows r
     ON r.sheet_name=? AND r.row_number=x.n
   WHERE r.row_number IS NULL OR r.values_json IS NOT x.v
      OR r.display_json IS NOT x.d OR r.formulas_json IS NOT x.f) mismatches,
  (SELECT COUNT(*) FROM sheet_catalog c WHERE c.sheet_name=? AND c.sheet_id=?
     AND c.headers_json=? AND c.source_last_row=? AND c.source_last_col=?
     AND c.row_count=? AND c.status='ready' AND c.note=?) catalog_matches,
  (SELECT COUNT(*) FROM sheet_rows r WHERE r.sheet_name=?) actual_rows`;
  const params=[...chunks,s.name,s.name,s.sheetId,h,s.base,s.width,s.base,NOTE,s.name];
  return {
    stmt:db.prepare(sql).bind(...params),
    metrics:{
      sheetName:s.name,
      expectedRows:s.base-11,
      chunks:chunks.length,
      payloadBytes:chunks.reduce((n,x)=>n+bytes(x),0),
      maxChunkBytes:Math.max(...chunks.map(bytes)),
      sqlBytes:bytes(sql),
      bindCount:params.length
    }
  };
}
function safeError(error){
  let s=String(error?.message||error?.cause?.message||error||'unknown-error');
  s=s.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/ig,'<uuid>');
  s=s.replace(/Bearer\s+\S+/ig,'Bearer <redacted>');
  s=s.replace(/(["'])[^"'\n]{120,}\1/g,'"<long-value-redacted>"');
  return s.slice(0,700);
}
async function baselineGate(db){
  const g=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM sheet_catalog) catalog_rows,
    (SELECT COUNT(*) FROM sheet_rows) mirror_rows,
    (SELECT COUNT(*) FROM sheet_migration_runs) migration_rows,
    (SELECT COUNT(*) FROM t12_synth_control
      WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY') control_matches`).first();
  return Number(g?.catalog_rows||0)===2&&Number(g?.mirror_rows||0)===1360&&
    Number(g?.migration_rows||0)===0&&Number(g?.control_matches||0)===1;
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store'
  }});
}
export async function handle142ReadOnlyGuardProbe(request,env={}){
  if(new URL(request.url).pathname!==ROUTE) return json({success:false,code:'not-found'},404);
  if(request.method!=='GET') return json({success:false,code:'get-only'},405);
  const db=env.T12_SYNTHETIC_DB;
  if(!db||typeof db.prepare!=='function') return json({success:false,code:'test-d1-binding-missing'},503);
  try{
    if(!await baselineGate(db)) return json({success:false,code:'requires-large-baseline'},409);
    const results=[];
    for(const s of specs){
      const built=buildReadOnlyGuardProbe(db,s);
      const started=Date.now();
      try{
        const r=await built.stmt.first();
        results.push({...built.metrics,elapsedMs:Date.now()-started,
          observed:{
            expectedRows:Number(r?.expected_rows||0),
            mismatches:Number(r?.mismatches||0),
            catalogMatches:Number(r?.catalog_matches||0),
            actualRows:Number(r?.actual_rows||0)
          }});
      }catch(error){
        results.push({...built.metrics,elapsedMs:Date.now()-started,
          error:safeError(error)});
      }
    }
    const pass=results.every((r,i)=>!r.error&&r.observed?.expectedRows===r.expectedRows&&
      r.observed?.mismatches===0&&r.observed?.catalogMatches===1&&
      r.observed?.actualRows===specs[i].base);
    return json({success:pass,code:pass?'readonly-large-guard-pass':'readonly-large-guard-fail',
      productionAuthorized:false,mutationAttempted:false,results},pass?200:503);
  }catch(error){
    return json({success:false,code:'readonly-diagnostic-error',
      productionAuthorized:false,mutationAttempted:false,error:safeError(error)},503);
  }
}
export default {fetch:handle142ReadOnlyGuardProbe};
