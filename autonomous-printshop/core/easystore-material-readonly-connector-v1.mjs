export const EASYSTORE_MATERIAL_CONNECTOR_VERSION='EASYSTORE_MATERIAL_READONLY_CONNECTOR_V1';

function text(v){return String(v==null?'':v).trim();}
function norm(v){
  return text(v).toLowerCase()
    .replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه')
    .replace(/\s+/g,' ').trim();
}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}

export function qualifyEasyStoreAccountingPayloadV1(payload,{authenticated=false}={}){
  if(authenticated!==true) return {qualified:false,reason:'AUTHENTICATED_READ_NOT_PROVEN'};
  if(!payload||payload.success!==true) return {qualified:false,reason:'ACCOUNTING_READ_FAILED'};
  if(!Array.isArray(payload.materials)||!Array.isArray(payload.deptLines)) {
    return {qualified:false,reason:'ACCOUNTING_PAYLOAD_SHAPE_MISSING'};
  }
  const version=text(payload.version);
  if(!version) return {qualified:false,reason:'ACCOUNTING_SOURCE_VERSION_MISSING'};
  return {qualified:true,reason:'QUALIFIED_READONLY_PAYLOAD',version};
}

export function easyStoreMaterialBlockerEvidenceCandidatesV1(payload,options={}){
  const q=qualifyEasyStoreAccountingPayloadV1(payload,{authenticated:options.authenticated===true});
  if(!q.qualified) return {qualification:q,candidates:[]};

  const nowMs=Number.isFinite(Number(options.nowMs))?Number(options.nowMs):Date.now();
  const bucketMs=Math.floor(nowMs/(10*60*1000))*(10*60*1000);
  const mats=new Map();
  for(const m of payload.materials){
    if(!m||String(m.active||'نعم').toLowerCase()==='لا') continue;
    const id=text(m.id||m.materialId);
    const name=text(m.materialName);
    const dept=text(m.department);
    const stock=finite(m.stockQty);
    if(!id||!name||stock===null) continue;
    mats.set(norm(dept)+'|'+norm(name),{...m,id,name,dept,stock});
  }

  const latest=new Map();
  for(const line of payload.deptLines){
    const lineId=text(line.lineId);
    const materialName=text(line.materialName);
    const dept=text(line.department);
    const consumption=finite(line.materialConsumption);
    if(!lineId||!materialName||consumption===null||consumption<=0) continue;
    const material=mats.get(norm(dept)+'|'+norm(materialName));
    if(!material) continue;
    // Payload contract does not expose an authoritative line timestamp here;
    // the authenticated read snapshot itself is the evidence observation.
    latest.set(lineId,{line,material,consumption});
  }

  const candidates=[];
  for(const [lineId,x] of latest){
    if(x.material.stock>=x.consumption) continue; // never synthesize READY
    candidates.push({
      lineId,
      kind:'MATERIAL',
      state:'BLOCKED',
      sourceKind:'EASYSTORE_READONLY',
      sourceRef:'easystore-material:'+x.material.id,
      sourceVersion:q.version+':material-v'+String(x.material.version||1),
      confidence:1,
      observedAtMs:bucketMs,
      expiresAtMs:bucketMs+30*60*1000,
      evidence:{
        reason:'INSUFFICIENT_STOCK',
        materialId:x.material.id,
        materialName:x.material.name,
        department:x.material.dept,
        required:x.consumption,
        available:x.material.stock,
        accountingAuthority:'EasyStore',
        connectorMode:'READONLY'
      }
    });
  }
  return {qualification:q,candidates};
}
