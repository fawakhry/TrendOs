import fs from 'node:fs';

export const MACHINE_MODEL_PROFILE_VERSION='MACHINE_MODEL_PROFILE_V1';

function text(v){return String(v==null?'':v).trim();}

export function loadMachineModelCatalogV1(path='autonomous-printshop/machine/MACHINE_MODEL_CATALOG_V1.json'){
  const x=JSON.parse(fs.readFileSync(path,'utf8'));
  if(x.version!=='MACHINE_MODEL_CATALOG_V1'||!Array.isArray(x.models)) throw new Error('MACHINE_MODEL_CATALOG_INVALID');
  return x;
}

export function getMachineModelProfileV1(catalog,modelKey){
  return (catalog&&Array.isArray(catalog.models)?catalog.models:[]).find(x=>text(x.modelKey)===text(modelKey))||null;
}

export function buildMachineRegistrationCandidateFromModelV1({catalog,modelKey,physicalIdentity={}}={}){
  const p=getMachineModelProfileV1(catalog,modelKey);
  if(!p) throw new Error('MACHINE_MODEL_PROFILE_NOT_FOUND');
  const serialOrAssetTag=text(physicalIdentity.serialOrAssetTag);
  const identitySourceKind=text(physicalIdentity.identitySourceKind).toUpperCase();
  const identitySourceRef=text(physicalIdentity.identitySourceRef);
  const machineId=text(physicalIdentity.machineId);

  const identityComplete=!!(
    machineId &&
    serialOrAssetTag &&
    identitySourceRef &&
    ['NAMEPLATE','OWNER_ASSET_REGISTRY'].includes(identitySourceKind)
  );

  return {
    version:MACHINE_MODEL_PROFILE_VERSION,
    modelKey:p.modelKey,
    manufacturer:p.manufacturer,
    model:p.model,
    machineClass:p.machineClass,
    capabilities:[...(p.capabilities||[])],
    modelProfileQualified:true,
    physicalIdentityComplete:identityComplete,
    registrationAllowed:identityComplete,
    readyAllowed:false,
    inferredPhysicalIdentity:false,
    reason:identityComplete?'MODEL_AND_PHYSICAL_IDENTITY_PRESENT':'PHYSICAL_MACHINE_IDENTITY_REQUIRED'
  };
}
