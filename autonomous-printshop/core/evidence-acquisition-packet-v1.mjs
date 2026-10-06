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

export function buildEvidenceAcquisitionPacketV1(pilot={}){
  const exists=pilot&&pilot.exists===true;
  const missingKinds=Array.isArray(pilot&&pilot.missingKinds)
    ? [...new Set(pilot.missingKinds.map(upper).filter(x=>REQUIREMENTS[x]))]
    : [];
  const machineClassHint=upper(pilot&&pilot.machineClassHint)||'UNKNOWN';

  if(!exists){
    return {
      version:EVIDENCE_ACQUISITION_PACKET_VERSION,
      exists:false,
      purpose:'EVIDENCE_ACQUISITION_ONLY',
      externalEvidenceRequired:false,
      requirements:{},
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
