import { classifyCloudOrderFileDesignSourceV1 } from './cloud-order-file-design-discovery-v1.mjs';

export const CLOUD_ORDER_FILE_DESIGN_ARTIFACT_COMMAND_VERSION='CLOUD_ORDER_FILE_DESIGN_ARTIFACT_COMMAND_V1';

function text(v){return String(v==null?'':v).trim();}
function lower(v){return text(v).toLowerCase();}
function safeId(v,label,max=180){
  const s=text(v);
  if(!s||s.length>max||!/^[A-Za-z0-9_.:\/-]+$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function q(v){return "'"+text(v).replace(/'/g,"''")+"'";}

export function buildCloudOrderFileDesignArtifactSqlV1(input={}){
  const artifactId=safeId(input.artifactId,'ARTIFACT_ID');
  const bindingEventId=safeId(input.bindingEventId,'BINDING_EVENT_ID');
  const fileId=safeId(input.fileId,'FILE_ID');
  const orderId=safeId(input.orderId,'ORDER_ID');
  const lineId=safeId(input.lineId,'LINE_ID');
  const r2Key=text(input.r2Key);
  const mimeType=lower(input.mimeType);
  const contentSha256=lower(input.contentSha256);
  const activeLineMatch=input.activeLineMatch===true;
  const archived=input.archived===true;
  if(!r2Key) throw new Error('R2_KEY_REQUIRED');

  const c=classifyCloudOrderFileDesignSourceV1({
    orderId,lineId,fileId,r2Key,mimeType,contentSha256,activeLineMatch,archived
  });
  if(!c.artifactCandidate) throw new Error('CLOUD_FILE_NOT_ARTIFACT_CANDIDATE:'+c.reason);

  const activePredicate=`(
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
  )`;

  return [
    "INSERT OR IGNORE INTO autonomous_design_artifacts(",
    " artifact_id,line_id,case_id,version_id,product_type,content_sha256,storage_provider,storage_ref,mime_type,source_kind,source_ref,created_at_ms",
    ") SELECT ",
    q(artifactId)+",f.line_id,'','','',lower(f.content_sha256),'R2',f.r2_key,f.mime_type,'CUSTOMER_UPLOAD',f.file_id,CAST(strftime('%s','now') AS INTEGER)*1000",
    " FROM employee_order_conversation_files_v1 f",
    " WHERE f.file_id="+q(fileId),
    "   AND f.order_id="+q(orderId),
    "   AND f.line_id="+q(lineId),
    "   AND f.r2_key="+q(r2Key),
    "   AND lower(f.content_sha256)="+q(contentSha256),
    "   AND length(f.content_sha256)=64",
    "   AND (lower(f.mime_type) LIKE 'image/%' OR lower(f.mime_type) IN ('application/pdf','application/postscript'))",
    "   AND NOT EXISTS(SELECT 1 FROM employee_core_archive_lines_v1 a WHERE a.line_id=f.line_id)",
    "   AND "+activePredicate,
    "   AND EXISTS(SELECT 1 FROM autonomous_design_control WHERE singleton_id=1 AND mode='SHADOW');",
    "",
    "INSERT OR IGNORE INTO autonomous_design_asset_binding_events(",
    " binding_event_id,artifact_id,tenant_id,binding_status,privacy_class,storage_provider,storage_ref,source_asset_id,source_ref,observed_at_ms",
    ") SELECT ",
    q(bindingEventId)+","+q(artifactId)+",'TENANT_001','LINKED','CUSTOMER_PRIVATE','R2',f.r2_key,f.file_id,'employee_order_conversation_files_v1',CAST(strftime('%s','now') AS INTEGER)*1000",
    " FROM employee_order_conversation_files_v1 f",
    " WHERE f.file_id="+q(fileId),
    "   AND EXISTS(SELECT 1 FROM autonomous_design_artifacts a WHERE a.artifact_id="+q(artifactId)+" AND a.line_id=f.line_id AND lower(a.content_sha256)=lower(f.content_sha256));"
  ].join('\n');
}
