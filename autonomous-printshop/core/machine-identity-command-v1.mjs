import { qualifyMachineIdentityV1 } from './machine-identity-qualification-v1.mjs';

export const MACHINE_IDENTITY_COMMAND_VERSION='MACHINE_IDENTITY_COMMAND_V1';

function text(v){return String(v==null?'':v).trim();}
function id(v,label,max=120){
  const s=text(v);
  if(!s||s.length>max||!/^[A-Za-z0-9_.:-]+$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function q(v){return "'" + text(v).replace(/'/g,"''") + "'";}
function json(v){return q(JSON.stringify(v&&typeof v==='object'?v:{}));}

export function buildRegisterMachineWithIdentitySqlV1(input={}){
  const x=qualifyMachineIdentityV1(input);
  if(!x.qualified) throw new Error(x.reasons[0]||'MACHINE_IDENTITY_NOT_QUALIFIED');
  const identityEventId=id(input.identityEventId,'IDENTITY_EVENT_ID');
  const capabilities=Array.isArray(input.capabilities)?input.capabilities.map(text).filter(Boolean):[];
  const evidence=input.identityEvidence&&typeof input.identityEvidence==='object'?input.identityEvidence:{};

  return [
    "INSERT OR IGNORE INTO autonomous_machine_identity_events(",
    " identity_event_id,machine_id,identity_source_kind,identity_source_ref,serial_or_asset_tag,evidence_json,observed_at_ms",
    ") VALUES(",
    q(identityEventId)+","+q(x.machineId)+","+q(x.identitySourceKind)+","+q(x.identitySourceRef)+","+q(x.serialOrAssetTag)+","+json(evidence)+",CAST(strftime('%s','now') AS INTEGER)*1000",
    ");",
    "",
    "INSERT INTO autonomous_machines(",
    " machine_id,display_name,department,machine_class,capabilities_json,active,version,updated_at",
    ") SELECT ",
    q(x.machineId)+","+q(x.displayName)+","+q(x.department)+","+q(x.machineClass)+","+q(JSON.stringify(capabilities))+",1,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    " WHERE EXISTS(SELECT 1 FROM autonomous_machine_identity_events WHERE identity_event_id="+q(identityEventId)+" AND machine_id="+q(x.machineId)+")",
    " ON CONFLICT(machine_id) DO UPDATE SET",
    " display_name=excluded.display_name,",
    " department=excluded.department,",
    " machine_class=excluded.machine_class,",
    " capabilities_json=excluded.capabilities_json,",
    " active=1,",
    " version=autonomous_machines.version+1,",
    " updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');"
  ].join('\n');
}
