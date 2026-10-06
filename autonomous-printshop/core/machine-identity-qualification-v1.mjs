export const MACHINE_IDENTITY_QUALIFICATION_VERSION='MACHINE_IDENTITY_QUALIFICATION_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function safeId(v,max=120){const s=text(v);return !!s&&s.length<=max&&/^[A-Za-z0-9_.:-]+$/.test(s);}

export function qualifyMachineIdentityV1(input={}){
  const machineId=text(input.machineId);
  const displayName=text(input.displayName);
  const department=text(input.department);
  const machineClass=upper(input.machineClass);
  const sourceKind=upper(input.identitySourceKind);
  const sourceRef=text(input.identitySourceRef);
  const serialOrAssetTag=text(input.serialOrAssetTag);
  const machineIdExplicit=input.machineIdExplicit===true;

  const reasons=[];
  if(!machineIdExplicit) reasons.push('MACHINE_ID_MUST_BE_EXPLICIT');
  if(!safeId(machineId,80)) reasons.push('MACHINE_ID_INVALID');
  if(!displayName) reasons.push('DISPLAY_NAME_REQUIRED');
  if(!department) reasons.push('DEPARTMENT_REQUIRED');
  if(!safeId(machineClass,80)) reasons.push('MACHINE_CLASS_INVALID');
  if(!['NAMEPLATE','OWNER_ASSET_REGISTRY'].includes(sourceKind)) reasons.push('IDENTITY_SOURCE_NOT_QUALIFIED');
  if(!sourceRef) reasons.push('IDENTITY_SOURCE_REF_REQUIRED');
  if(!serialOrAssetTag) reasons.push('SERIAL_OR_ASSET_TAG_REQUIRED');

  return {
    version:MACHINE_IDENTITY_QUALIFICATION_VERSION,
    qualified:reasons.length===0,
    reasons,
    machineId,
    displayName,
    department,
    machineClass,
    identitySourceKind:sourceKind,
    identitySourceRef:sourceRef,
    serialOrAssetTag,
    inferredIdentity:false,
    readyStateGranted:false,
    lineMappingGranted:false
  };
}
