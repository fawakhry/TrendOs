export const EVIDENCE_ACQUISITION_PACKET_VERSION='EVIDENCE_ACQUISITION_PACKET_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}

const REQUIREMENTS={
  DESIGN:[
    'REAL_ACTIVE_ORDER_LINE_LINK',
    'CONTENT_SHA256',
    'LINKED_PRIVATE_ASSET',
    'STRUCTURED_APPROVAL',
    'QUALIFIED_PREFLIGHT_PASS'
  ],
  MATERIAL:[
    'ACTIVE_NON_CANARY_MATERIAL',
    'AUTHORITATIVE_STOCK_SOURCE',
    'LIVE_LINE_MATERIAL_LINK',
    'POSITIVE_MATERIAL_CONSUMPTION'
  ],
  MACHINE:[
    'EXPLICIT_MACHINE_ID',
    'NAMEPLATE_OR_OWNER_ASSET_REGISTRY',
    'SERIAL_OR_ASSET_TAG',
    'DIRECT_OPERATOR_CHECK_OR_SELF_TEST',
    'ACTIVE_LINE_MACHINE_MAPPING'
  ]
};


const EVIDENCE_REVIEW_VERSION='EVIDENCE_ACQUISITION_REVIEW_V1';
const MACHINE_HINTS=new Set(['LASER','PRINT','HEAT_PRESS','VINYL_CUTTER','UNKNOWN']);

// Explain why evidence acquisition is still required, without exposing source
// identities, order/line IDs, raw event references, customer or employee PII.
// This is diagnostic only; never upgrade readiness or authorize dispatch.
function buildEvidenceReviewV1(missingKinds,context={}){
  const statusByKind={};
  const lineId=text(context&&context.lineId);
  const now=Number(context&&context.nowMs===undefined?Date.now():context&&context.nowMs);
  const validClock=Number.isFinite(now)&&now>0;
  const events=Array.isArray(context&&context.events)?context.events:[];
  for(const kind of missingKinds){
    let status='NO_RECORDED_EVIDENCE';
    if(!lineId) status='SOURCE_LINE_UNVERIFIED';
    else if(!validClock) status='SOURCE_CLOCK_UNVERIFIED';
    else{
      let newest=null, invalidTime=false;
      for(const raw of events){
        if(!raw||typeof raw!=='object') continue;
        if(text(raw.lineId??raw.line_id)!==lineId) continue;
        if(upper(raw.evidenceKind??raw.evidence_kind??raw.kind)!==kind) continue;
        const observedAtMs=Number(raw.observedAtMs??raw.observed_at_ms);
        if(!Number.isFinite(observedAtMs)||observedAtMs<=0){
          invalidTime=true;
          continue;
        }
        const id=text(raw.evidenceId??raw.evidence_id);
        if(!newest||observedAtMs>newest.observedAtMs||
          (observedAtMs===newest.observedAtMs&&id.localeCompare(newest.id)>0)){
          newest={raw,id,observedAtMs};
        }
      }
      if(invalidTime)status='SOURCE_TIME_UNVERIFIED';
      else if(newest){
        const raw=newest.raw;
        const expiresRaw=raw.expiresAtMs??raw.expires_at_ms;
        const expires=expiresRaw==null||expiresRaw===''?null:Number(expiresRaw);
        if(newest.observedAtMs>now)status='FUTURE_OBSERVATION';
        else if(expires!=null&&(!Number.isFinite(expires)||expires<=newest.observedAtMs))
          status='INVALID_EXPIRY';
        else if(expires!=null&&expires<=now)status='EVIDENCE_EXPIRED';
        else{
          const state=upper(raw.evidenceState??raw.evidence_state??raw.state);
          status=state==='BLOCKED'?'EVIDENCE_BLOCKED':
            state==='READY'?'READY_STATE_MISMATCH_REVIEW':'EVIDENCE_UNKNOWN';
        }
      }
    }
    statusByKind[kind]=status;
  }
  return {
    version:EVIDENCE_REVIEW_VERSION,
    statusByKind,
    provenanceQualified:false,
    actionableWriteAllowed:false,
    assignmentAllowed:false,
    identifiersExposed:false
  };
}

export function buildEvidenceAcquisitionPacketV1(pilot={},context={}){
  const exists=pilot&&pilot.exists===true;
  const missingKinds=Array.isArray(pilot&&pilot.missingKinds)
    ? [...new Set(pilot.missingKinds.map(upper).filter(x=>Object.hasOwn(REQUIREMENTS,x)))]
    : [];
  const proposedHint=upper(pilot&&pilot.machineClassHint);
  const machineClassHint=MACHINE_HINTS.has(proposedHint)?proposedHint:'UNKNOWN';

  if(!exists){
    return {
      version:EVIDENCE_ACQUISITION_PACKET_VERSION,
      exists:false,
      purpose:'EVIDENCE_ACQUISITION_ONLY',
      externalEvidenceRequired:false,
      requirements:{},
      review:buildEvidenceReviewV1([],{}),
      machineClassHint:'UNKNOWN',
      assignmentAllowed:false,
      taskClaimAllowed:false,
      rawOrderIdsExposed:false,
      rawLineIdsExposed:false,
      customerPiiExposed:false
    };
  }

  const requirements={};
  for(const kind of missingKinds){
    requirements[kind]=[...REQUIREMENTS[kind]];
  }

  return {
    version:EVIDENCE_ACQUISITION_PACKET_VERSION,
    exists:true,
    purpose:'EVIDENCE_ACQUISITION_ONLY',
    department:text(pilot.department),
    priority:text(pilot.priority),
    dueIso:text(pilot.dueIso),
    urgent:pilot.urgent===true,
    missingKinds,
    machineClassHint,
    requirements,
    externalEvidenceRequired:missingKinds.length>0,
    review:buildEvidenceReviewV1(missingKinds,context),
    completionRule:'SAME_LINE_REQUIRES_DESIGN_MATERIAL_MACHINE_READY',
    assignmentAllowed:false,
    taskClaimAllowed:false,
    readyWriteAllowed:false,
    operatorTaskActivationAllowed:false,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false,
    customerPiiExposed:false
  };
}
