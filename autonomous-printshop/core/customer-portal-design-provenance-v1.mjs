export const CUSTOMER_PORTAL_DESIGN_PROVENANCE_VERSION='CUSTOMER_PORTAL_DESIGN_PROVENANCE_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}

function safeId(v){
  const s=text(v);
  return !!s && s.length<=180 && /^[A-Za-z0-9_.:\/-]+$/.test(s);
}

export function qualifyCustomerPortalDesignProvenanceV1(input={}){
  const recordType=upper(input.recordType);
  const orderId=text(input.orderId);
  const lineId=text(input.lineId);
  const draftId=text(input.draftId);
  const draftItemId=text(input.draftItemId);
  const mimeType=text(input.mimeType).toLowerCase();
  const storageProvider=upper(input.storageProvider);
  const storageRef=text(input.storageRef);
  const sourceAssetId=text(input.sourceAssetId);
  const contentSha256=text(input.contentSha256).toLowerCase();
  const lineExists=input.lineExists===true;
  const lineOrderMatches=input.lineOrderMatches===true;
  const folderMatches=input.folderMatches!==false;
  const sourceVersion=text(input.sourceVersion);

  const reasons=[];
  if(recordType!=='FILE'&&recordType!=='ملف') reasons.push('PORTAL_RECORD_NOT_FILE');
  if(!safeId(orderId)) reasons.push('ORDER_ID_REQUIRED');
  if(!safeId(lineId)) reasons.push('LINE_ID_REQUIRED');
  if(!lineExists) reasons.push('TRENDOS_LINE_NOT_FOUND');
  if(!lineOrderMatches) reasons.push('ORDER_LINE_MISMATCH');
  if(!folderMatches) reasons.push('LINE_FOLDER_MISMATCH');
  if(!storageProvider) reasons.push('STORAGE_PROVIDER_REQUIRED');
  if(!storageRef) reasons.push('STORAGE_REF_REQUIRED');
  if(!sourceAssetId) reasons.push('SOURCE_ASSET_ID_REQUIRED');
  if(mimeType && !/^(image\/|application\/pdf$|application\/postscript$|image\/svg\+xml$)/.test(mimeType)){
    reasons.push('DESIGN_MIME_TYPE_NOT_QUALIFIED');
  }

  const provenanceQualified=reasons.length===0;
  const contentHashQualified=/^[a-f0-9]{64}$/.test(contentSha256);
  const artifactEligible=provenanceQualified&&contentHashQualified;

  return {
    version:CUSTOMER_PORTAL_DESIGN_PROVENANCE_VERSION,
    provenanceQualified,
    artifactEligible,
    readyAllowed:false,
    approvalState:'NOT_CONFIRMED',
    preflightState:'UNKNOWN',
    reason:provenanceQualified
      ? (contentHashQualified?'PORTAL_LINE_PROVENANCE_AND_HASH_QUALIFIED':'PORTAL_LINE_PROVENANCE_QUALIFIED_HASH_REQUIRED')
      : reasons[0],
    reasons,
    sourceKind:'CUSTOMER_UPLOAD',
    orderId,
    lineId,
    draftId,
    draftItemId,
    mimeType,
    storageProvider,
    storageRef,
    sourceAssetId,
    sourceVersion,
    contentSha256:contentHashQualified?contentSha256:'',
    piiExposed:false
  };
}

export function portalProvenanceToArtifactCandidateV1(input={}){
  const q=qualifyCustomerPortalDesignProvenanceV1(input);
  if(!q.artifactEligible) return {qualified:false,reason:q.reason,candidate:null};
  return {
    qualified:true,
    reason:'CUSTOMER_UPLOAD_ARTIFACT_CANDIDATE_ONLY',
    candidate:{
      lineId:q.lineId,
      caseId:q.draftId||'',
      versionId:q.sourceVersion||'',
      contentSha256:q.contentSha256,
      storageProvider:q.storageProvider,
      storageRef:q.storageRef,
      mimeType:q.mimeType,
      sourceKind:'CUSTOMER_UPLOAD',
      sourceRef:q.sourceAssetId,
      approvalState:'NOT_CONFIRMED',
      preflightState:'UNKNOWN',
      readyAllowed:false
    }
  };
}
