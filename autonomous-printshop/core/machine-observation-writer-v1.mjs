export const MACHINE_OBSERVATION_WRITER_VERSION='MACHINE_OBSERVATION_WRITER_V1';
const READY_MAX_TTL_MS=15*60*1000;
const BLOCKED_MAX_TTL_MS=8*60*60*1000;

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

export async function recordMachineObservationV1(db,input={}){
  if(!db||typeof db.prepare!=='function') throw new Error('MACHINE_OBSERVATION_DB_REQUIRED');

  const control=await db.prepare(`
    SELECT mode FROM autonomous_machine_control WHERE singleton_id=1 LIMIT 1
  `).first();
  if(text(control&&control.mode)!=='SHADOW'){
    return {success:true,inserted:false,skipped:true,reason:'MACHINE_CONTROL_NOT_SHADOW'};
  }

  const observationId=text(input.observationId);
  const machineId=text(input.machineId);
  const state=upper(input.machineState);
  const sourceKind=upper(input.sourceKind);
  const sourceRef=text(input.sourceRef);
  const confidence=Number(input.confidence??1);
  const observedAtMs=num(input.observedAtMs);
  const expiresAtMs=num(input.expiresAtMs);
  const evidence=input.evidence&&typeof input.evidence==='object'?input.evidence:{};

  if(!observationId) throw new Error('MACHINE_OBSERVATION_ID_REQUIRED');
  if(!machineId) throw new Error('MACHINE_ID_REQUIRED');
  if(!['READY','BLOCKED','MAINTENANCE','UNKNOWN'].includes(state)) throw new Error('MACHINE_STATE_INVALID');
  if(!['SENSOR','OPERATOR_CHECK','SELF_TEST','MAINTENANCE','SYSTEM'].includes(sourceKind)) throw new Error('MACHINE_SOURCE_INVALID');
  if(!Number.isFinite(confidence)||confidence<0||confidence>1) throw new Error('MACHINE_CONFIDENCE_INVALID');
  if(!observedAtMs||!expiresAtMs||expiresAtMs<=observedAtMs) throw new Error('MACHINE_OBSERVATION_TIME_INVALID');

  const ttl=expiresAtMs-observedAtMs;
  if(state==='READY'){
    if(!['SELF_TEST','OPERATOR_CHECK'].includes(sourceKind)) throw new Error('MACHINE_READY_DIRECT_CHECK_REQUIRED');
    if(evidence.directCheck!==true) throw new Error('MACHINE_READY_DIRECT_CHECK_FLAG_REQUIRED');
    if(ttl>READY_MAX_TTL_MS) throw new Error('MACHINE_READY_TTL_TOO_LONG');
  }
  if((state==='BLOCKED'||state==='MAINTENANCE')&&ttl>BLOCKED_MAX_TTL_MS){
    throw new Error('MACHINE_BLOCKED_TTL_TOO_LONG');
  }
  if(state==='UNKNOWN'&&sourceKind!=='SYSTEM'){
    throw new Error('MACHINE_UNKNOWN_SYSTEM_ONLY');
  }

  const machine=await db.prepare(`
    SELECT machine_id AS machineId,active
      FROM autonomous_machines
     WHERE machine_id=?
     LIMIT 1
  `).bind(machineId).first();
  if(!machine||Number(machine.active)!==1) throw new Error('MACHINE_NOT_REGISTERED_ACTIVE');

  const result=await db.prepare(`
    INSERT OR IGNORE INTO autonomous_machine_observations (
      observation_id,machine_id,machine_state,source_kind,source_ref,
      confidence,evidence_json,observed_at_ms,expires_at_ms
    ) VALUES (?,?,?,?,?,?,?,?,?)
  `).bind(
    observationId,machineId,state,sourceKind,sourceRef,confidence,
    JSON.stringify(evidence),observedAtMs,expiresAtMs
  ).run();

  return {
    success:true,
    inserted:Number(result&&result.meta&&result.meta.changes||0)>0,
    observationId,machineId,state,sourceKind,
    readinessAuthority:'AUTONOMOUS_MACHINE_EVIDENCE_ONLY'
  };
}
