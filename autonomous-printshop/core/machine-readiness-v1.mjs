export const MACHINE_READINESS_VERSION='AUTONOMOUS_MACHINE_READINESS_V1';
const READY_TTL_MAX_MS=15*60*1000;
const BLOCKED_TTL_MAX_MS=8*60*60*1000;

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

function latestBy(rows,keyFn,timeFn,idFn){
  const out=new Map();
  for(const row of Array.isArray(rows)?rows:[]){
    const key=keyFn(row);
    if(!key) continue;
    const time=num(timeFn(row));
    const id=text(idFn(row));
    const cur=out.get(key);
    if(!cur||time>cur.time||(time===cur.time&&id.localeCompare(cur.id)>0)){
      out.set(key,{row,time,id});
    }
  }
  return out;
}

export function machineReadinessEvidenceCandidatesV1({
  mappings=[],
  observations=[],
  machines=[],
  nowMs=Date.now()
}={}){
  const machineById=new Map((machines||[]).map(x=>[text(x.machineId||x.machine_id),x]));
  const latestMapping=latestBy(
    mappings,
    r=>text(r.lineId||r.line_id),
    r=>r.observedAtMs??r.observed_at_ms,
    r=>r.mappingEventId||r.mapping_event_id
  );
  const latestObs=latestBy(
    observations,
    r=>text(r.machineId||r.machine_id),
    r=>r.observedAtMs??r.observed_at_ms,
    r=>r.observationId||r.observation_id
  );

  const out=[];
  for(const [lineId,mappingBox] of latestMapping){
    const mapping=mappingBox.row;
    if(upper(mapping.mappingState||mapping.mapping_state)!=='ACTIVE') continue;
    const machineId=text(mapping.machineId||mapping.machine_id);
    const machine=machineById.get(machineId);
    if(!machine||Number(machine.active||0)!==1) continue;

    const box=latestObs.get(machineId);
    if(!box) continue;
    const obs=box.row;
    const state=upper(obs.machineState||obs.machine_state);
    const observedAtMs=num(obs.observedAtMs??obs.observed_at_ms);
    const expiresAtMs=num(obs.expiresAtMs??obs.expires_at_ms);
    if(!observedAtMs||!expiresAtMs||expiresAtMs<=Number(nowMs)) continue;

    let readinessState='';
    if(state==='READY'){
      if(expiresAtMs-observedAtMs>READY_TTL_MAX_MS) continue;
      readinessState='READY';
    }else if(state==='BLOCKED'||state==='MAINTENANCE'){
      if(expiresAtMs-observedAtMs>BLOCKED_TTL_MAX_MS) continue;
      readinessState='BLOCKED';
    }else{
      continue;
    }

    out.push({
      lineId,
      kind:'MACHINE',
      state:readinessState,
      sourceKind:'MACHINE_AGENT',
      sourceRef:'machine:'+machineId+':observation:'+text(obs.observationId||obs.observation_id),
      sourceVersion:'machine-v'+String(machine.version||1),
      confidence:Number(obs.confidence??1),
      observedAtMs,
      expiresAtMs,
      evidence:{
        machineId,
        machineClass:text(machine.machineClass||machine.machine_class),
        department:text(machine.department),
        observedState:state,
        observationSource:upper(obs.sourceKind||obs.source_kind),
        mappingSource:upper(mapping.sourceKind||mapping.source_kind)
      }
    });
  }
  return out;
}
