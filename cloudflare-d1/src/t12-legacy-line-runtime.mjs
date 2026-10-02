import { mapMirrorRows } from './edge-orders-read-v1.mjs';
import { repairSerializedLineId02CX } from './edge-orders-line-id-repair-02cx.mjs';

const LINES_SHEET='بنود الأوردرات';

function text(value){return String(value==null?'':value).trim();}

function canonicalLine(row){
  if(!row||typeof row!=='object')return row;
  const current=text(row.lineId);
  const repaired=repairSerializedLineId02CX(row.orderId,current);
  return repaired&&repaired!==current?{...row,lineId:repaired}:row;
}

async function readLegacyMirror(env){
  if(!env||!env.DB||typeof env.DB.prepare!=='function')throw new Error('legacy-runtime-db-unavailable');
  const catalog=await env.DB.prepare(`
    SELECT headers_json AS headersJson,
           source_last_row AS sourceLastRow,
           source_last_col AS sourceLastCol,
           row_count AS rowCount,
           status,
           synced_at AS syncedAt,
           note
      FROM sheet_catalog
     WHERE sheet_name=?
     LIMIT 1
  `).bind(LINES_SHEET).first();
  if(!catalog)throw new Error('legacy-lines-mirror-missing');
  const query=await env.DB.prepare(`
    SELECT row_number AS rowNumber,
           values_json AS valuesJson,
           display_json AS displayJson
      FROM sheet_rows
     WHERE sheet_name=?
     ORDER BY row_number
  `).bind(LINES_SHEET).all();
  const rows=(query.results||[]).map((r)=>({
    rowNumber:Number(r.rowNumber||0),
    values:JSON.parse(r.valuesJson||'[]'),
    display:JSON.parse(r.displayJson||'[]')
  }));
  return {catalog,headers:JSON.parse(catalog.headersJson||'[]'),rows};
}

export async function resolveLegacyMirrorLine(env,orderId,lineId){
  const order=text(orderId),line=text(lineId);
  if(!order||!line)return null;
  const mirror=await readLegacyMirror(env);
  const mapped=mapMirrorRows(mirror.headers,mirror.rows,'service').map(canonicalLine);
  const found=mapped.find((row)=>text(row.orderId)===order&&text(row.lineId)===line)||null;
  if(!found)return null;
  return {...found,sourceMirrorSyncedAt:text(mirror.catalog&&mirror.catalog.syncedAt)};
}

export async function readLegacyRuntimeRows(env){
  if(!env||!env.DB||typeof env.DB.prepare!=='function')throw new Error('legacy-runtime-db-unavailable');
  const query=await env.DB.prepare(`
    SELECT line_id AS lineId,
           order_id AS orderId,
           status,
           notes,
           source_row_number AS sourceRowNumber,
           source_mirror_synced_at AS sourceMirrorSyncedAt,
           updated_by AS updatedBy,
           update_source AS updateSource,
           version,
           updated_at AS updatedAt
      FROM t12_legacy_line_runtime
  `).all();
  return query.results||[];
}

export function applyLegacyRuntimeOverlay(rows,runtimeRows){
  const byIdentity=new Map();
  for(const item of runtimeRows||[]){
    const key=text(item&&item.orderId)+'\u0000'+text(item&&item.lineId);
    if(key!=='\u0000')byIdentity.set(key,item);
  }
  return (rows||[]).map((source)=>{
    const row=canonicalLine(source);
    const key=text(row&&row.orderId)+'\u0000'+text(row&&row.lineId);
    const runtime=byIdentity.get(key);
    if(!runtime)return row;
    return {
      ...row,
      status:text(runtime.status)||text(row.status),
      notes:runtime.notes==null?text(row.notes):text(runtime.notes),
      updatedAt:text(runtime.updatedAt)||text(row.updatedAt),
      legacyRuntime:true,
      legacyRuntimeVersion:Number(runtime.version||0),
      writeAuthority:'cloudflare-t12-legacy-runtime',
      readOnly:false
    };
  });
}

export async function verifyLegacyRuntimeState(env,orderId,lineId,status,notes){
  const row=await env.DB.prepare(`
    SELECT status,notes,version,updated_at AS updatedAt
      FROM t12_legacy_line_runtime
     WHERE line_id=? AND order_id=?
     LIMIT 1
  `).bind(lineId,orderId).first();
  if(!row||text(row.status)!==text(status)||text(row.notes)!==text(notes))return null;
  return row;
}

export async function writeLegacyRuntimeState(env,{line,beforeStatus,status,notes,actor,updateSource='runtime'}){
  const orderId=text(line&&line.orderId),lineId=text(line&&line.lineId);
  const sourceRowNumber=Number(line&&line.rowNumber||0);
  const sourceMirrorSyncedAt=text(line&&line.sourceMirrorSyncedAt);
  const oldStatus=text(beforeStatus)||text(line&&line.status)||'طلب جديد';
  const payload=JSON.stringify({
    notesChanged:text(line&&line.notes)!==text(notes),
    sourceMirrorSyncedAt,
    updateSource:text(updateSource)||'runtime'
  });
  const statements=[
    env.DB.prepare(`
      INSERT INTO t12_legacy_line_runtime
      (line_id,order_id,status,notes,source_row_number,source_mirror_synced_at,updated_by,update_source,version,updated_at)
      VALUES (?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(line_id) DO UPDATE SET
        order_id=excluded.order_id,
        status=excluded.status,
        notes=excluded.notes,
        source_row_number=excluded.source_row_number,
        source_mirror_synced_at=excluded.source_mirror_synced_at,
        updated_by=excluded.updated_by,
        update_source=excluded.update_source,
        version=t12_legacy_line_runtime.version+1,
        updated_at=CURRENT_TIMESTAMP
    `).bind(lineId,orderId,status,notes,sourceRowNumber,sourceMirrorSyncedAt,actor,updateSource),
    env.DB.prepare(`
      INSERT INTO t12_legacy_line_runtime_events
      (order_id,line_id,event_type,old_status,new_status,actor,source_row_number,payload_json)
      VALUES (?,?,?,?,?,?,?,?)
    `).bind(orderId,lineId,'legacy-line-update',oldStatus,status,actor,sourceRowNumber,payload)
  ];
  await env.DB.batch(statements);
  return verifyLegacyRuntimeState(env,orderId,lineId,status,notes);
}

export async function legacyRuntimeSchemaReady(env){
  try{
    const rows=await env.DB.prepare(`
      SELECT name
        FROM sqlite_master
       WHERE type='table'
         AND name IN ('t12_legacy_line_runtime','t12_legacy_line_runtime_events')
    `).all();
    return new Set((rows.results||[]).map((r)=>text(r.name))).size===2;
  }catch{return false;}
}
