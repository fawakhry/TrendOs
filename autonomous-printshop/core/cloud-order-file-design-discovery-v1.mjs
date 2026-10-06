export const CLOUD_ORDER_FILE_DESIGN_DISCOVERY_VERSION='CLOUD_ORDER_FILE_DESIGN_DISCOVERY_V1';

function text(v){return String(v==null?'':v).trim();}
function lower(v){return text(v).toLowerCase();}

export function classifyCloudOrderFileDesignSourceV1(input={}){
  const orderId=text(input.orderId);
  const lineId=text(input.lineId);
  const fileId=text(input.fileId);
  const r2Key=text(input.r2Key);
  const mimeType=lower(input.mimeType);
  const activeLineMatch=input.activeLineMatch===true;
  const archived=input.archived===true;
  const contentSha256=lower(input.contentSha256);
  const designMime=
    mimeType.startsWith('image/') ||
    mimeType==='application/pdf' ||
    mimeType==='application/postscript';

  const reasons=[];
  if(!orderId) reasons.push('ORDER_ID_REQUIRED');
  if(!lineId) reasons.push('LINE_ID_REQUIRED');
  if(!fileId) reasons.push('FILE_ID_REQUIRED');
  if(!r2Key) reasons.push('R2_KEY_REQUIRED');
  if(!designMime) reasons.push('DESIGN_MIME_NOT_QUALIFIED');
  if(!activeLineMatch) reasons.push('ACTIVE_ORDER_LINE_MATCH_REQUIRED');
  if(archived) reasons.push('ARCHIVED_LINE_FORBIDDEN');

  const provenanceQualified=reasons.length===0;
  const hashQualified=/^[a-f0-9]{64}$/.test(contentSha256);

  return {
    version:CLOUD_ORDER_FILE_DESIGN_DISCOVERY_VERSION,
    provenanceQualified,
    artifactCandidate:provenanceQualified&&hashQualified,
    readyAllowed:false,
    sourceKind:'CUSTOMER_UPLOAD',
    storageProvider:'R2',
    approvalState:'NOT_CONFIRMED',
    preflightState:'UNKNOWN',
    reason:provenanceQualified
      ? (hashQualified?'CLOUD_LINE_FILE_HASHED_ARTIFACT_CANDIDATE':'CLOUD_LINE_FILE_PROVENANCE_HASH_REQUIRED')
      : reasons[0],
    reasons,
    piiExposed:false
  };
}

export function summarizeCloudOrderFileDesignDiscoveryV1(rows=[]){
  const out={
    total:0,
    designMime:0,
    lineLinked:0,
    activeLineMatched:0,
    provenanceQualified:0,
    artifactCandidates:0,
    readyAllowed:0
  };
  for(const row of Array.isArray(rows)?rows:[]){
    out.total++;
    const mime=lower(row.mimeType||row.mime_type);
    if(mime.startsWith('image/')||mime==='application/pdf'||mime==='application/postscript') out.designMime++;
    if(text(row.lineId||row.line_id)) out.lineLinked++;
    if(row.activeLineMatch===true||Number(row.active_line_match||0)===1) out.activeLineMatched++;
    const q=classifyCloudOrderFileDesignSourceV1({
      orderId:row.orderId||row.order_id,
      lineId:row.lineId||row.line_id,
      fileId:row.fileId||row.file_id,
      r2Key:row.r2Key||row.r2_key,
      mimeType:row.mimeType||row.mime_type,
      activeLineMatch:row.activeLineMatch===true||Number(row.active_line_match||0)===1,
      archived:row.archived===true||Number(row.archived||0)===1,
      contentSha256:row.contentSha256||row.content_sha256
    });
    if(q.provenanceQualified) out.provenanceQualified++;
    if(q.artifactCandidate) out.artifactCandidates++;
  }
  return out;
}
