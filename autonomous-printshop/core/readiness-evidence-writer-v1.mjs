import {
  stableCanonicalJsonV1,
  autonomyInputHashV1
} from './autonomy-event-ledger-v1.mjs';

export const READINESS_EVIDENCE_KINDS=Object.freeze(['DESIGN','MATERIAL','MACHINE']);
export const READINESS_EVIDENCE_STATES=Object.freeze(['READY','BLOCKED','UNKNOWN']);
export const READINESS_SOURCE_KINDS=Object.freeze([
  'DESIGN_PREFLIGHT','MATERIAL_LEDGER','MACHINE_AGENT','OPERATOR',
  'TRENDOS_LEGACY','SYSTEM'
]);

const MINUTE=60*1000;
const HOUR=60*MINUTE;

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}

function ttlLimitMs(kind,state){
  if(state==='UNKNOWN') return 15*MINUTE;
  if(state==='BLOCKED'){
    if(kind==='MATERIAL'||kind==='MACHINE') return 8*HOUR;
    return null;
  }
  if(kind==='MATERIAL') return 30*MINUTE;
  if(kind==='MACHINE') return 15*MINUTE;
  return null;
}

export function validateReadinessEvidenceV1(input={},options={}){
  const nowMs=finite(options.nowMs)??Date.now();
  const lineId=text(input.lineId);
  const kind=upper(input.kind||input.evidenceKind);
  const state=upper(input.state||input.evidenceState);
  const sourceKind=upper(input.sourceKind);
  const sourceRef=text(input.sourceRef);
  const sourceVersion=text(input.sourceVersion);
  const confidence=finite(input.confidence);
  const observedAtMs=finite(input.observedAtMs)??nowMs;
  const expiresRaw=input.expiresAtMs;
  const expiresAtMs=expiresRaw==null||expiresRaw===''?null:finite(expiresRaw);

  if(!lineId) throw new Error('READINESS_LINE_ID_REQUIRED');
  if(!READINESS_EVIDENCE_KINDS.includes(kind)) throw new Error('READINESS_KIND_INVALID');
  if(!READINESS_EVIDENCE_STATES.includes(state)) throw new Error('READINESS_STATE_INVALID');
  if(!READINESS_SOURCE_KINDS.includes(sourceKind)) throw new Error('READINESS_SOURCE_KIND_INVALID');
  if(sourceKind!=='SYSTEM'&&!sourceRef) throw new Error('READINESS_SOURCE_REF_REQUIRED');
  if(confidence==null||confidence<0||confidence>1) throw new Error('READINESS_CONFIDENCE_INVALID');
  if(observedAtMs>nowMs+5*MINUTE) throw new Error('READINESS_OBSERVED_AT_FUTURE');
  if(expiresAtMs!=null&&expiresAtMs<=observedAtMs) throw new Error('READINESS_EXPIRY_INVALID');

  if(kind==='DESIGN'&&state==='READY'&&!sourceVersion){
    throw new Error('READINESS_DESIGN_READY_VERSION_REQUIRED');
  }

  const maxTtl=ttlLimitMs(kind,state);
  if(maxTtl!=null){
    if(expiresAtMs==null) throw new Error('READINESS_EXPIRY_REQUIRED');
    if(expiresAtMs-observedAtMs>maxTtl) throw new Error('READINESS_EXPIRY_TOO_LONG');
  }

  return {
    lineId,kind,state,sourceKind,sourceRef,sourceVersion,confidence,
    observedAtMs,expiresAtMs,
    evidence:input.evidence==null?{}:input.evidence
  };
}

async function assertLineExistsExactlyOnce(db,lineId){
  const row=await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM employee_core_lines_v1 WHERE line_id=?) AS imported,
      (SELECT COUNT(*) FROM t12_prod_lines WHERE line_id=?) AS native
  `).bind(lineId,lineId).first();
  const imported=Number(row&&row.imported||0);
  const native=Number(row&&row.native||0);
  if(imported+native===0) throw new Error('READINESS_LINE_NOT_FOUND');
  if(imported+native!==1) throw new Error('READINESS_LINE_IDENTITY_AMBIGUOUS');
  return {imported,native};
}

export async function recordReadinessEvidenceV1(db,input={},options={}){
  if(!db||typeof db.prepare!=='function') throw new Error('READINESS_DB_REQUIRED');
  const normalized=validateReadinessEvidenceV1(input,options);
  const identity=await assertLineExistsExactlyOnce(db,normalized.lineId);

  const hashInput={
    lineId:normalized.lineId,
    kind:normalized.kind,
    state:normalized.state,
    sourceKind:normalized.sourceKind,
    sourceRef:normalized.sourceRef,
    sourceVersion:normalized.sourceVersion,
    confidence:normalized.confidence,
    observedAtMs:normalized.observedAtMs,
    expiresAtMs:normalized.expiresAtMs,
    evidence:normalized.evidence
  };
  const inputHash=await autonomyInputHashV1(hashInput);
  const evidenceId=text(options.evidenceId||('readiness-'+inputHash.slice(0,24)));
  const evidenceJson=stableCanonicalJsonV1(normalized.evidence);

  const result=await db.prepare(`
    INSERT OR IGNORE INTO autonomous_readiness_evidence (
      evidence_id,line_id,evidence_kind,evidence_state,
      source_kind,source_ref,source_version,confidence,
      evidence_json,observed_at_ms,expires_at_ms
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    evidenceId,
    normalized.lineId,
    normalized.kind,
    normalized.state,
    normalized.sourceKind,
    normalized.sourceRef,
    normalized.sourceVersion,
    normalized.confidence,
    evidenceJson,
    normalized.observedAtMs,
    normalized.expiresAtMs
  ).run();

  return {
    success:true,
    evidenceId,
    inputHash,
    inserted:Number(result&&result.meta&&result.meta.changes||0)>0,
    identity,
    evidence:{
      ...normalized,
      evidenceJson
    }
  };
}
