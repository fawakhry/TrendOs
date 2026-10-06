export const CLOUD_ORDER_FILE_DESIGN_ARTIFACT_COLLECTOR_VERSION='CLOUD_ORDER_FILE_DESIGN_ARTIFACT_COLLECTOR_V1';

function text(v){return String(v==null?'':v).trim();}
function lower(v){return text(v).toLowerCase();}
function safeSourceId(v){return /^[A-Za-z0-9_.:\/-]{1,180}$/.test(text(v));}
function hashOk(v){return /^[a-f0-9]{64}$/.test(lower(v));}

function candidateSql(limit){
  const n=Math.max(1,Math.min(Math.trunc(Number(limit)||25),100));
  return `
    SELECT
      f.file_id AS fileId,
      f.order_id AS orderId,
      f.line_id AS lineId,
      f.r2_key AS r2Key,
      f.mime_type AS mimeType,
      lower(f.content_sha256) AS contentSha256
    FROM employee_order_conversation_files_v1 f
    WHERE trim(f.order_id)<>''
      AND trim(f.line_id)<>''
      AND trim(f.file_id)<>''
      AND trim(f.r2_key)<>''
      AND length(f.content_sha256)=64
      AND lower(f.content_sha256) NOT GLOB '*[^0-9a-f]*'
      AND (
        lower(f.mime_type) LIKE 'image/%'
        OR lower(f.mime_type) IN ('application/pdf','application/postscript')
      )
      AND NOT EXISTS(
        SELECT 1 FROM employee_core_archive_lines_v1 a
        WHERE a.line_id=f.line_id
      )
      AND (
        EXISTS(
          SELECT 1 FROM employee_core_lines_v1 l
          WHERE l.line_id=f.line_id
            AND l.order_id=f.order_id
            AND l.active=1
            AND l.status NOT IN ('تم التسليم','جاهز للاستلام','ملغي','ملغى','مكرر','مدمج','مغلق','ملغي/مغلق')
        )
        OR EXISTS(
          SELECT 1
          FROM t12_prod_lines l
          LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id
          WHERE l.line_id=f.line_id
            AND l.order_id=f.order_id
            AND COALESCE(r.status,l.status) NOT IN ('تم التسليم','جاهز للاستلام','ملغي','ملغى','مكرر','مدمج','مغلق','ملغي/مغلق')
        )
      )
    ORDER BY f.created_at
    LIMIT ${n}
  `;
}

export async function collectCloudOrderFileDesignArtifactsV1(db,{limit=25,nowMs=Date.now()}={}){
  if(!db||typeof db.prepare!=='function') throw new Error('CLOUD_DESIGN_ARTIFACT_COLLECTOR_DB_REQUIRED');

  const control=await db.prepare(
    "SELECT mode FROM autonomous_design_control WHERE singleton_id=1"
  ).first();

  if(text(control&&control.mode)!=='SHADOW'){
    return {
      success:true,
      skipped:true,
      reason:'DESIGN_CONTROL_NOT_SHADOW',
      candidates:0,
      artifactsInserted:0,
      bindingsInserted:0,
      approvalWrites:0,
      preflightWrites:0,
      readinessWrites:0
    };
  }

  const q=await db.prepare(candidateSql(limit)).all();
  const rows=Array.isArray(q&&q.results)?q.results:[];
  let artifactsInserted=0,bindingsInserted=0,duplicates=0,invalid=0;

  for(const row of rows){
    const fileId=text(row.fileId);
    const lineId=text(row.lineId);
    const orderId=text(row.orderId);
    const r2Key=text(row.r2Key);
    const mimeType=lower(row.mimeType);
    const contentSha256=lower(row.contentSha256);

    if(!safeSourceId(fileId)||!safeSourceId(lineId)||!safeSourceId(orderId)||!r2Key||!hashOk(contentSha256)){
      invalid++;
      continue;
    }

    const existing=await db.prepare(
      "SELECT artifact_id AS artifactId FROM autonomous_design_artifacts WHERE line_id=? AND lower(content_sha256)=? LIMIT 1"
    ).bind(lineId,contentSha256).first();

    let artifactId=text(existing&&existing.artifactId);
    if(!artifactId){
      artifactId='cloud-artifact-'+fileId+'-'+contentSha256.slice(0,12);
      const ar=await db.prepare(`
        INSERT OR IGNORE INTO autonomous_design_artifacts(
          artifact_id,line_id,case_id,version_id,product_type,content_sha256,
          storage_provider,storage_ref,mime_type,source_kind,source_ref,created_at_ms
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        artifactId,lineId,'','','',contentSha256,
        'R2',r2Key,mimeType,'CUSTOMER_UPLOAD',fileId,Number(nowMs)
      ).run();
      artifactsInserted+=Number(ar&&ar.meta&&ar.meta.changes||0);
    }else{
      duplicates++;
    }

    const resolved=await db.prepare(
      "SELECT artifact_id AS artifactId FROM autonomous_design_artifacts WHERE line_id=? AND lower(content_sha256)=? LIMIT 1"
    ).bind(lineId,contentSha256).first();
    const resolvedArtifactId=text(resolved&&resolved.artifactId)||artifactId;
    if(!resolvedArtifactId) continue;

    const bindingEventId='cloud-binding-'+fileId+'-'+contentSha256.slice(0,12);
    const br=await db.prepare(`
      INSERT OR IGNORE INTO autonomous_design_asset_binding_events(
        binding_event_id,artifact_id,tenant_id,binding_status,privacy_class,
        storage_provider,storage_ref,source_asset_id,source_ref,observed_at_ms
      ) VALUES(?,?,?,?,?,?,?,?,?,?)
    `).bind(
      bindingEventId,resolvedArtifactId,'TENANT_001','LINKED','CUSTOMER_PRIVATE',
      'R2',r2Key,fileId,'employee_order_conversation_files_v1',Number(nowMs)
    ).run();
    bindingsInserted+=Number(br&&br.meta&&br.meta.changes||0);
  }

  return {
    success:true,
    skipped:false,
    version:CLOUD_ORDER_FILE_DESIGN_ARTIFACT_COLLECTOR_VERSION,
    candidates:rows.length,
    artifactsInserted,
    bindingsInserted,
    duplicates,
    invalid,
    approvalWrites:0,
    preflightWrites:0,
    readinessWrites:0,
    accountingWrites:0,
    operatorTaskWrites:0,
    employeeAssignment:false,
    piiExposed:false
  };
}
