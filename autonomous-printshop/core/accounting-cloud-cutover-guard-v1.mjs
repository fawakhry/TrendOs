export const ACCOUNTING_CLOUD_CUTOVER_GUARD_VERSION='ACCOUNTING_CLOUD_CUTOVER_GUARD_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

export function classifyAccountingCloudCutoverV1(input={}){
  const mode=upper(input.mode)||'ABSENT';
  const policyEpoch=Math.max(0,Math.trunc(num(input.policyEpoch)));
  const writeCanaryReady=!!input.writeCanaryReady;
  const writeCanaryEnabled=!!input.writeCanaryEnabled;
  const allowedUsers=Math.max(0,Math.trunc(num(input.allowedUsers)));
  const allowedActions=Math.max(0,Math.trunc(num(input.allowedActions)));
  const maxCommands=Math.max(0,Math.trunc(num(input.maxCommands)));
  const commandsStarted=Math.max(0,Math.trunc(num(input.commandsStarted)));
  const activeMaterials=Math.max(0,Math.trunc(num(input.activeMaterials)));
  const stockMoves=Math.max(0,Math.trunc(num(input.stockMoves)));
  const deptLinesWithLineId=Math.max(0,Math.trunc(num(input.deptLinesWithLineId)));
  const deptLinesWithMaterial=Math.max(0,Math.trunc(num(input.deptLinesWithMaterial)));
  const deptLinesWithConsumption=Math.max(0,Math.trunc(num(input.deptLinesWithConsumption)));
  const sourceDataPresent=
    activeMaterials>0 &&
    deptLinesWithLineId>0 &&
    deptLinesWithMaterial>0 &&
    deptLinesWithConsumption>0;

  let stage='ACCOUNTING_UNAVAILABLE';
  let blockerCollectionAllowed=false;
  let readyEvidenceAllowed=false;
  let frozen=true;
  let reason='ACCOUNTING_CLOUD_AUTHORITY_UNAVAILABLE';

  if(mode==='READONLY'){
    blockerCollectionAllowed=true;
    frozen=false;
    if(sourceDataPresent){
      stage='CLOUD_READ_MODEL_PRESENT_READONLY';
      reason='ACCOUNTING_READONLY_SOURCE_PRESENT_BLOCKERS_ONLY';
    }else{
      stage='CLOUD_BACKEND_READONLY_DATA_PENDING';
      reason='ACCOUNTING_CLOUD_DATA_MIGRATION_PENDING';
    }
  }else if(mode==='CANARY'){
    stage='CLOUD_WRITE_CANARY_ACTIVE';
    reason='ACCOUNTING_CLOUD_CANARY_ACTIVE_MATERIAL_FROZEN';
  }else if(mode==='GENERAL'){
    stage='CLOUD_GENERAL_REQUIRES_AUTONOMOUS_REQUALIFICATION';
    reason='ACCOUNTING_POST_CUTOVER_REQUALIFICATION_REQUIRED';
  }else if(mode==='OFF'){
    stage='ACCOUNTING_OFF';
    reason='ACCOUNTING_CLOUD_AUTHORITY_OFF';
  }

  return {
    version:ACCOUNTING_CLOUD_CUTOVER_GUARD_VERSION,
    mode,
    policyEpoch,
    stage,
    sourceDataPresent,
    blockerCollectionAllowed,
    readyEvidenceAllowed,
    frozen,
    reason,
    writeCanary:{
      ready:writeCanaryReady,
      enabled:writeCanaryEnabled,
      allowedUsers,
      allowedActions,
      maxCommands,
      commandsStarted,
      commandsRemaining:Math.max(0,maxCommands-commandsStarted),
      armed:writeCanaryEnabled&&(allowedUsers>0||allowedActions>0||maxCommands>0)
    },
    counts:{
      activeMaterials,
      stockMoves,
      deptLinesWithLineId,
      deptLinesWithMaterial,
      deptLinesWithConsumption
    }
  };
}
