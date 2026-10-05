/* Autonomous Printshop - Readiness Evidence V1
 * Pure evidence projection. No DB/network writes.
 */
import {
  buildOperationalRealityV1,
  recommendNextTaskV1
} from './operational-reality-v1.mjs';

export const READINESS_EVIDENCE_VERSION='AUTONOMOUS_READINESS_EVIDENCE_V1_20261005';
export const READINESS_KINDS=Object.freeze(['DESIGN','MATERIAL','MACHINE']);

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}

function evidenceValue(state){
  const s=upper(state);
  if(s==='READY') return true;
  if(s==='BLOCKED') return false;
  return null;
}

export function latestReadinessEvidenceV1(events=[],nowMs=Date.now()){
  const latest=new Map();
  for(const raw of Array.isArray(events)?events:[]){
    const lineId=text(raw.lineId ?? raw.line_id);
    const kind=upper(raw.evidenceKind ?? raw.evidence_kind ?? raw.kind);
    const state=upper(raw.evidenceState ?? raw.evidence_state ?? raw.state);
    const observedAtMs=Number(raw.observedAtMs ?? raw.observed_at_ms);
    const expiresRaw=raw.expiresAtMs ?? raw.expires_at_ms;
    const expiresAtMs=expiresRaw==null||expiresRaw===''?null:Number(expiresRaw);
    if(!lineId||!READINESS_KINDS.includes(kind)) continue;
    if(!['READY','BLOCKED','UNKNOWN'].includes(state)) continue;
    if(!Number.isFinite(observedAtMs)||observedAtMs<=0) continue;
    if(expiresAtMs!=null && (!Number.isFinite(expiresAtMs)||expiresAtMs<=Number(nowMs))) continue;

    const key=lineId+'::'+kind;
    const current=latest.get(key);
    if(!current || observedAtMs>current.observedAtMs || (
      observedAtMs===current.observedAtMs &&
      text(raw.evidenceId ?? raw.evidence_id).localeCompare(current.evidenceId)>0
    )){
      latest.set(key,{
        evidenceId:text(raw.evidenceId ?? raw.evidence_id),
        lineId,
        kind,
        state,
        value:evidenceValue(state),
        sourceKind:upper(raw.sourceKind ?? raw.source_kind),
        sourceRef:text(raw.sourceRef ?? raw.source_ref),
        sourceVersion:text(raw.sourceVersion ?? raw.source_version),
        confidence:Number(raw.confidence ?? 1),
        observedAtMs,
        expiresAtMs
      });
    }
  }
  return latest;
}

export function applyReadinessEvidenceV1(rows=[],events=[],options={}){
  const nowMs=Number.isFinite(Number(options.nowMs))?Number(options.nowMs):Date.now();
  const latest=latestReadinessEvidenceV1(events,nowMs);
  return (Array.isArray(rows)?rows:[]).map(row=>{
    const lineId=text(row&&(
      row.lineId ?? row.line_id ?? row['رقم البند'] ?? row['Line ID']
    ));
    const design=latest.get(lineId+'::DESIGN')||null;
    const material=latest.get(lineId+'::MATERIAL')||null;
    const machine=latest.get(lineId+'::MACHINE')||null;
    return {
      ...row,
      designReady:design?design.value:null,
      materialReady:material?material.value:null,
      machineReady:machine?machine.value:null,
      readinessEvidence:{
        design,
        material,
        machine
      }
    };
  });
}

export function summarizeReadinessCoverageV1(rows=[],events=[],options={}){
  const enriched=applyReadinessEvidenceV1(rows,events,options);
  const out={
    total:enriched.length,
    DESIGN:{ready:0,blocked:0,unknown:0},
    MATERIAL:{ready:0,blocked:0,unknown:0},
    MACHINE:{ready:0,blocked:0,unknown:0}
  };
  for(const row of enriched){
    for(const [kind,prop] of [
      ['DESIGN','designReady'],
      ['MATERIAL','materialReady'],
      ['MACHINE','machineReady']
    ]){
      if(row[prop]===true) out[kind].ready+=1;
      else if(row[prop]===false) out[kind].blocked+=1;
      else out[kind].unknown+=1;
    }
  }
  return out;
}

export function buildReadinessQualifiedRealityV1(rows=[],events=[],options={}){
  const requiredKinds=Array.isArray(options.requiredKinds)&&options.requiredKinds.length
    ? options.requiredKinds.map(x=>text(x).toLowerCase())
    : ['design','material','machine'];
  const enriched=applyReadinessEvidenceV1(rows,events,options);
  const reality=buildOperationalRealityV1(enriched,{
    department:options.department,
    requiredReadiness:requiredKinds
  });
  const recommendation=recommendNextTaskV1(enriched,{
    department:options.department,
    requiredReadiness:requiredKinds,
    operatorAvailable:options.operatorAvailable,
    activeTask:options.activeTask
  });
  return {
    version:READINESS_EVIDENCE_VERSION,
    requiredKinds,
    coverage:summarizeReadinessCoverageV1(rows,events,options),
    reality,
    recommendation,
    rows:enriched
  };
}
