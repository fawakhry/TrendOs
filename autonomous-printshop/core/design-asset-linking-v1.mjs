export const DESIGN_ASSET_BINDING_VERSION='AUTONOMOUS_DESIGN_ASSET_BINDING_V1';

const VALID_STATUS=new Set(['LINKED','PENDING_UPLOAD','MISSING','REMOVED']);
const VALID_PRIVACY=new Set(['PUBLIC_SAFE','CUSTOMER_PRIVATE','UNKNOWN']);
const PUBLIC_PROVIDERS=new Set(['GITHUB_PUBLIC','PUBLIC_GIT','PUBLIC_URL']);

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

export function validateDesignAssetBindingV1(input={},options={}){
  const tenantId=text(input.tenantId||input.tenant_id||options.tenantId||'TENANT_001');
  const expectedTenant=text(options.tenantId||tenantId);
  const artifactId=text(input.artifactId||input.artifact_id);
  const status=upper(input.bindingStatus||input.binding_status);
  const privacy=upper(input.privacyClass||input.privacy_class||'UNKNOWN');
  const provider=upper(input.storageProvider||input.storage_provider);
  const storageRef=text(input.storageRef||input.storage_ref);
  const observedAtMs=num(input.observedAtMs??input.observed_at_ms);

  if(!tenantId) throw new Error('ASSET_TENANT_REQUIRED');
  if(expectedTenant&&tenantId!==expectedTenant) throw new Error('ASSET_TENANT_MISMATCH');
  if(!artifactId) throw new Error('ASSET_ARTIFACT_ID_REQUIRED');
  if(!VALID_STATUS.has(status)) throw new Error('ASSET_BINDING_STATUS_INVALID');
  if(!VALID_PRIVACY.has(privacy)) throw new Error('ASSET_PRIVACY_CLASS_INVALID');
  if(!observedAtMs) throw new Error('ASSET_OBSERVED_AT_REQUIRED');

  if(status==='LINKED'&&(!provider||!storageRef)){
    throw new Error('ASSET_LINKED_STORAGE_REQUIRED');
  }
  if(privacy==='CUSTOMER_PRIVATE'&&PUBLIC_PROVIDERS.has(provider)){
    throw new Error('ASSET_PRIVATE_PUBLIC_STORAGE_FORBIDDEN');
  }

  return {
    tenantId,
    artifactId,
    bindingStatus:status,
    privacyClass:privacy,
    storageProvider:provider,
    storageRef,
    sourceAssetId:text(input.sourceAssetId||input.source_asset_id),
    sourceRef:text(input.sourceRef||input.source_ref),
    observedAtMs
  };
}

export function latestDesignAssetBindingsV1(events=[],options={}){
  const tenantId=text(options.tenantId||'TENANT_001');
  const map=new Map();
  for(const raw of Array.isArray(events)?events:[]){
    let x;
    try{x=validateDesignAssetBindingV1(raw,{tenantId});}
    catch{continue;}
    const cur=map.get(x.artifactId);
    const eventId=text(raw.bindingEventId||raw.binding_event_id);
    if(!cur||x.observedAtMs>cur.observedAtMs||(
      x.observedAtMs===cur.observedAtMs&&eventId.localeCompare(cur.bindingEventId)>0
    )){
      map.set(x.artifactId,{...x,bindingEventId:eventId});
    }
  }
  return map;
}

export function productionAssetBindingStateV1(event){
  if(!event) return {available:false,state:'UNKNOWN',reason:'ASSET_BINDING_MISSING'};
  const status=upper(event.bindingStatus||event.binding_status);
  if(status==='LINKED'){
    return {
      available:true,
      state:'READY',
      reason:'ASSET_LINKED',
      storageProvider:upper(event.storageProvider||event.storage_provider),
      storageRef:text(event.storageRef||event.storage_ref),
      privacyClass:upper(event.privacyClass||event.privacy_class)
    };
  }
  if(status==='REMOVED') return {available:false,state:'BLOCKED',reason:'ASSET_REMOVED'};
  if(status==='MISSING') return {available:false,state:'BLOCKED',reason:'ASSET_MISSING'};
  return {available:false,state:'UNKNOWN',reason:'ASSET_PENDING_UPLOAD'};
}
