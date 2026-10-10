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
  const now=Number(nowMs);
  if(!Number.isFinite(now)||now<=0) return new Map();
  const latest=new Map();
  const invalidTimelineKeys=new Set();
  for(const raw of Array.isArray(events)?events:[]){
    if(!raw||typeof raw!=='object') continue;
    const lineId=text(raw.lineId ?? raw.line_id);
    const kind=upper(raw.evidenceKind ?? raw.evidence_kind ?? raw.kind);
    const state=upper(raw.evidenceState ?? raw.evidence_state ?? raw.state);
    const observedAtMs=Number(raw.observedAtMs ?? raw.observed_at_ms);
    const expiresRaw=raw.expiresAtMs ?? raw.expires_at_ms;
    const expiresAtMs=expiresRaw==null||expiresRaw===''?null:Number(expiresRaw);
    if(!lineId||!READINESS_KINDS.includes(kind)) continue;
    const key=lineId+'::'+kind;
    if(!Number.isFinite(observedAtMs)||observedAtMs<=0){
      // An undatable event cannot be ordered against existing READY.
      // Fail closed for the whole line/kind, not by ignoring the event.
      invalidTimelineKeys.add(key);
      continue;
    }
    // Select by event time FIRST. Never revive an older READY after a newer
    // expired/invalid BLOCKED or UNKNOWN fact.
    const current=latest.get(key);
    const evidenceId=text(raw.evidenceId ?? raw.evidence_id);
    if(!current || observedAtMs>current.observedAtMs){
      const knownState=['READY','BLOCKED','UNKNOWN'].includes(state);
      latest.set(key,{
        evidenceId,lineId,kind,
        state:knownState?state:'UNKNOWN',
        value:knownState?evidenceValue(state):null,
        sourceKind:upper(raw.sourceKind ?? raw.source_kind),
        sourceRef:text(raw.sourceRef ?? raw.source_ref),
        sourceVersion:text(raw.sourceVersion ?? raw.source_version),
        confidence:Number(raw.confidence ?? 1),
        observedAtMs,expiresAtMs
      });
    }else if(observedAtMs===current.observedAtMs){
      // Two facts at the same timestamp cannot establish a trustworthy
      // latest revision ordering. Keep UNKNOWN even if one claims READY,
      // regardless of evidence IDs or iteration order. A strictly later
      // event can resolve this ambiguity; an older event cannot.
      latest.set(key,{
        ...current,state:'UNKNOWN',value:null,ambiguousSameInstant:true
      });
    }
  }
  // Invalid timestamps cannot be sorted at all, so no remaining same-line
  // event may qualify this kind. This is stricter than a newer-valid reset.
  for(const key of invalidTimelineKeys) latest.delete(key);
  // A newer future-dated, malformed or expired record blocks older evidence.
  // Its kind becomes UNKNOWN; this projection cannot authorize dispatch.
  for(const [key,record] of latest){
    if(record.observedAtMs>now || (
      record.expiresAtMs!=null && (
        !Number.isFinite(record.expiresAtMs) ||
        record.expiresAtMs<=record.observedAtMs ||
        record.expiresAtMs<=now
      )
    )) latest.delete(key);
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
