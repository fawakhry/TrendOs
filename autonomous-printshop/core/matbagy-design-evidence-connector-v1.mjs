export const MATBAGY_DESIGN_EVIDENCE_CONNECTOR_VERSION='MATBAGY_DESIGN_EVIDENCE_CONNECTOR_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}

export function qualifyMatbagyDesignCaseForReadinessV1(input={}){
  const tenantId=text(input.tenantId||input.tenant_id);
  const caseId=text(input.caseId||input.case_id);
  const orderId=text(input.orderId||input.order_id);
  const lineId=text(input.lineId||input.line_id);
  const approvalStatus=upper(input.approvalStatus||input.approval_status);
  const assetBindingStatus=upper(input.assetBindingStatus||input.asset_binding_status);
  const storageProvider=text(input.storageProvider||input.storage_provider);
  const storageRef=text(input.storageRef||input.storage_ref);
  const contentSha256=text(input.contentSha256||input.content_sha256).toLowerCase();
  const preflightStatus=upper(input.preflightStatus||input.preflight_status);

  const reasons=[];
  if(!tenantId) reasons.push('TENANT_ID_MISSING');
  if(!caseId) reasons.push('CASE_ID_MISSING');
  if(!orderId||upper(orderId)==='UNKNOWN') reasons.push('ORDER_ID_UNKNOWN');
  if(!lineId||upper(lineId)==='UNKNOWN') reasons.push('LINE_ID_UNKNOWN');
  if(!['FINAL_APPROVED','EXPLICITLY_LIKED'].includes(approvalStatus)) reasons.push('APPROVAL_NOT_QUALIFIED');
  if(assetBindingStatus!=='LINKED') reasons.push('ASSET_NOT_LINKED');
  if(!storageProvider||!storageRef) reasons.push('STORAGE_REFERENCE_MISSING');
  if(!/^[a-f0-9]{64}$/.test(contentSha256)) reasons.push('CONTENT_SHA256_MISSING_OR_INVALID');
  if(preflightStatus!=='PASS') reasons.push('PREFLIGHT_NOT_PASS');

  return {
    qualified:reasons.length===0,
    reasons,
    tenantId,caseId,orderId,lineId,
    approvalStatus,assetBindingStatus,storageProvider,storageRef,contentSha256,preflightStatus,
    connectorVersion:MATBAGY_DESIGN_EVIDENCE_CONNECTOR_VERSION
  };
}

export function matbagyDesignReadinessCandidateV1(input={},options={}){
  const q=qualifyMatbagyDesignCaseForReadinessV1(input);
  if(!q.qualified) return {qualification:q,candidate:null};

  const observedAtMs=Number.isFinite(Number(options.observedAtMs))
    ? Number(options.observedAtMs)
    : Date.now();

  return {
    qualification:q,
    candidate:{
      lineId:q.lineId,
      kind:'DESIGN',
      state:'READY',
      sourceKind:'MATBAGY_OS',
      sourceRef:q.caseId+':'+q.storageRef,
      sourceVersion:q.connectorVersion,
      confidence:1,
      observedAtMs,
      evidence:{
        tenantId:q.tenantId,
        caseId:q.caseId,
        orderId:q.orderId,
        approvalStatus:q.approvalStatus,
        assetBindingStatus:q.assetBindingStatus,
        storageProvider:q.storageProvider,
        storageRef:q.storageRef,
        contentSha256:q.contentSha256,
        preflightStatus:q.preflightStatus
      }
    }
  };
}
