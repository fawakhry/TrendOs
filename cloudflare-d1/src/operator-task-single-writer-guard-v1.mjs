// BOOK24-TASK-AUTHORITY: optional, read-only cross-lane safety gate.
// This only fences the Operator V2 *Edge proxy*. Direct Apps Script/Work
// Queue V1 calls are separate authorities and are NOT protected by this gate.
// Deployment flag is OFF by default to preserve the existing legacy lane.
function txt(v){return String(v==null?'':v).trim();}
export function operatorTaskSingleWriterGuardEnabledV1(env){
  return ['1','true','yes','on'].includes(txt(env&&env.TRENDOS_OPERATOR_TASK_SINGLE_WRITER_GUARD_V1).toLowerCase());
}
export async function checkOperatorEdgeD1WriterConflictV1(env){
  if(!operatorTaskSingleWriterGuardEnabledV1(env))
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
