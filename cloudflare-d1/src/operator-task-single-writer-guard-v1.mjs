// BOOK24-TASK-AUTHORITY: optional, read-only cross-lane safety gate.
// This only fences the Operator V2 *Edge proxy*. Direct Apps Script/Work
// Queue V1 calls are separate authorities and are NOT protected by this gate.
// Deployment flag is OFF by default to preserve the existing legacy lane.
function txt(v){return String(v==null?'':v).trim();}
const TRUE_VALUES=new Set(['1','true','yes','on']);
const FALSE_VALUES=new Set(['0','false','no','off','']);
function writerGuardSettingV1(env){
  // Absent/explicit OFF preserve the legacy lane while migrating.
  // A nonempty typo such as "tru" MUST NOT silently disable a safety fence.
  // Re-read the value on every guarded request: no cached opt-in state.
  const raw=txt(env&&env.TRENDOS_OPERATOR_TASK_SINGLE_WRITER_GUARD_V1).toLowerCase();
  if(TRUE_VALUES.has(raw))return 'ENABLED';
  if(FALSE_VALUES.has(raw))return 'DISABLED';
  return 'INVALID';
}
export function operatorTaskSingleWriterGuardEnabledV1(env){
  return writerGuardSettingV1(env)==='ENABLED';
}
export async function checkOperatorEdgeD1WriterConflictV1(env){
  const setting=writerGuardSettingV1(env);
  if(setting==='INVALID')
    return {allowed:false,checked:true,reason:'OPERATOR_TASK_WRITER_GUARD_VALUE_INVALID'};
  if(setting==='DISABLED')
    return {allowed:true,checked:false,reason:'OPERATOR_TASK_WRITER_GUARD_DISABLED'};
  if(!env||!env.DB||typeof env.DB.prepare!=='function')
    return {allowed:false,checked:true,reason:'OPERATOR_TASK_D1_AUTHORITY_UNKNOWN'};
  try{
    // Absolutely no D1 writes here: inspect the one authoritative mode row.
    const row=await env.DB.prepare(
      "SELECT mode FROM operator_task_control WHERE singleton_id=1 LIMIT 1"
    ).first();
    if(!row)return {allowed:false,checked:true,reason:'OPERATOR_TASK_D1_AUTHORITY_UNKNOWN'};
    const mode=txt(row.mode).toUpperCase();
    if(mode==='OFF'||mode==='SHADOW')
      return {allowed:true,checked:true,reason:'OPERATOR_TASK_D1_NON_WRITER',d1Mode:mode};
    if(mode==='CANARY'||mode==='GENERAL')
      return {allowed:false,checked:true,reason:'OPERATOR_TASK_D1_WRITER_CONFLICT',d1Mode:mode};
    return {allowed:false,checked:true,reason:'OPERATOR_TASK_D1_AUTHORITY_UNKNOWN'};
  }catch(_err){
    // Missing migration, transient D1 outage and malformed control fail closed
    // only when the guard was deliberately activated by the owner.
    return {allowed:false,checked:true,reason:'OPERATOR_TASK_D1_AUTHORITY_UNKNOWN'};
  }
}
