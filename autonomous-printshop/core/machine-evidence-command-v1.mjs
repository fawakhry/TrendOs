export const MACHINE_EVIDENCE_COMMAND_VERSION='MACHINE_EVIDENCE_COMMAND_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function id(v,label){
  const s=text(v);
  if(!/^[A-Za-z0-9_.:-]{2,80}$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function lineId(v){
  const s=text(v);
  if(!/^[A-Za-z0-9_.:\/-]{1,120}$/.test(s)) throw new Error('LINE_ID_INVALID');
  return s;
}
function q(v){return "'"+text(v).replace(/'/g,"''")+"'";}
function json(v){return q(JSON.stringify(v&&typeof v==='object'?v:{}));}
function ttl(state,minutes){
  const n=Number(minutes);
  if(!Number.isFinite(n)||n<=0) throw new Error('TTL_MINUTES_INVALID');
  if(state==='READY'&&n>15) throw new Error('READY_TTL_TOO_LONG');
  if(['BLOCKED','MAINTENANCE'].includes(state)&&n>480) throw new Error('BLOCKED_TTL_TOO_LONG');
  return Math.trunc(n);
}

export function buildRegisterMachineSqlV1(input={}){
  const machineId=id(input.machineId,'MACHINE_ID');
  const displayName=text(input.displayName);
  const department=text(input.department);
  const machineClass=id(input.machineClass,'MACHINE_CLASS');
  if(!displayName) throw new Error('DISPLAY_NAME_REQUIRED');
  if(!department) throw new Error('DEPARTMENT_REQUIRED');
  const capabilities=Array.isArray(input.capabilities)?input.capabilities.map(text).filter(Boolean):[];
  return `
INSERT INTO autonomous_machines(
  machine_id,display_name,department,machine_class,capabilities_json,active,version,updated_at
) VALUES(
  ${q(machineId)},${q(displayName)},${q(department)},${q(machineClass)},${q(JSON.stringify(capabilities))},1,1,
  strftime('%Y-%m-%dT%H:%M:%fZ','now')
)
ON CONFLICT(machine_id) DO UPDATE SET
  display_name=excluded.display_name,
  department=excluded.department,
  machine_class=excluded.machine_class,
  capabilities_json=excluded.capabilities_json,
  active=1,
  version=autonomous_machines.version+1,
  updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
`.trim();
}

export function buildRecordMachineObservationSqlV1(input={}){
  const observationId=id(input.observationId,'OBSERVATION_ID');
  const machineId=id(input.machineId,'MACHINE_ID');
  const state=upper(input.machineState);
  const sourceKind=upper(input.sourceKind);
  const sourceRef=text(input.sourceRef);
  const confidence=Number(input.confidence??1);
  if(!['READY','BLOCKED','MAINTENANCE','UNKNOWN'].includes(state)) throw new Error('MACHINE_STATE_INVALID');
  if(!['SENSOR','OPERATOR_CHECK','SELF_TEST','MAINTENANCE','SYSTEM'].includes(sourceKind)) throw new Error('MACHINE_SOURCE_INVALID');
  if(!Number.isFinite(confidence)||confidence<0||confidence>1) throw new Error('MACHINE_CONFIDENCE_INVALID');
  const minutes=ttl(state,input.ttlMinutes);
  const evidence=input.evidence&&typeof input.evidence==='object'?input.evidence:{};
  if(state==='READY'){
    if(!['SELF_TEST','OPERATOR_CHECK'].includes(sourceKind)) throw new Error('READY_DIRECT_CHECK_SOURCE_REQUIRED');
    if(evidence.directCheck!==true) throw new Error('READY_DIRECT_CHECK_FLAG_REQUIRED');
  }
  if(state==='UNKNOWN'&&sourceKind!=='SYSTEM') throw new Error('UNKNOWN_SYSTEM_ONLY');

  return `
INSERT OR IGNORE INTO autonomous_machine_observations(
  observation_id,machine_id,machine_state,source_kind,source_ref,confidence,evidence_json,observed_at_ms,expires_at_ms
)
SELECT
  ${q(observationId)},${q(machineId)},${q(state)},${q(sourceKind)},${q(sourceRef)},${confidence},${json(evidence)},
  CAST(strftime('%s','now') AS INTEGER)*1000,
  CAST(strftime('%s','now') AS INTEGER)*1000+${minutes}*60*1000
WHERE EXISTS(
  SELECT 1 FROM autonomous_machine_control WHERE singleton_id=1 AND mode='SHADOW'
)
AND EXISTS(
  SELECT 1 FROM autonomous_machines WHERE machine_id=${q(machineId)} AND active=1
);
`.trim();
}

export function buildMapLineToMachineSqlV1(input={}){
  const mappingEventId=id(input.mappingEventId,'MAPPING_EVENT_ID');
  const targetLineId=lineId(input.lineId);
  const machineId=id(input.machineId,'MACHINE_ID');
  const mappingState=upper(input.mappingState||'ACTIVE');
  const sourceKind=upper(input.sourceKind||'OPERATOR');
  const sourceRef=text(input.sourceRef);
  if(!['ACTIVE','REMOVED'].includes(mappingState)) throw new Error('MAPPING_STATE_INVALID');
  if(!['SCHEDULER','OPERATOR','SYSTEM_POLICY','IMPORT'].includes(sourceKind)) throw new Error('MAPPING_SOURCE_INVALID');

  return `
INSERT OR IGNORE INTO autonomous_line_machine_mapping_events(
  mapping_event_id,line_id,machine_id,mapping_state,source_kind,source_ref,observed_at_ms
)
SELECT
  ${q(mappingEventId)},${q(targetLineId)},${q(machineId)},${q(mappingState)},${q(sourceKind)},${q(sourceRef)},
  CAST(strftime('%s','now') AS INTEGER)*1000
WHERE EXISTS(
  SELECT 1 FROM autonomous_machine_control WHERE singleton_id=1 AND mode='SHADOW'
)
AND EXISTS(
  SELECT 1 FROM autonomous_machines WHERE machine_id=${q(machineId)} AND active=1
)
AND EXISTS(
  SELECT 1 FROM (
    SELECT line_id FROM employee_core_lines_v1
    UNION ALL
    SELECT line_id FROM t12_prod_lines
  ) q WHERE q.line_id=${q(targetLineId)}
);
`.trim();
}
