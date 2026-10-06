export const MATERIAL_POST_CUTOVER_REQUALIFICATION_VERSION='MATERIAL_POST_CUTOVER_REQUALIFICATION_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

export function qualifyMaterialPostCutoverV1(input={}){
  const accountingMode=upper(input.accountingMode)||'ABSENT';
  const accountingEpoch=Math.max(0,Math.trunc(num(input.accountingEpoch)));
  const checkpointRef=text(input.accountingCheckpointRef);
  const stockAuthorityConfirmed=input.stockAuthorityConfirmed===true;
  const appsScriptBusinessAuthority=input.appsScriptBusinessAuthority===true;
  const googleBusinessCalls=Math.max(0,Math.trunc(num(input.googleBusinessCalls)));
  const activeMaterials=Math.max(0,Math.trunc(num(input.activeMaterials)));
  const stockMoves=Math.max(0,Math.trunc(num(input.stockMoves)));
  const deptLinesWithLineId=Math.max(0,Math.trunc(num(input.deptLinesWithLineId)));
  const deptLinesWithMaterial=Math.max(0,Math.trunc(num(input.deptLinesWithMaterial)));
  const deptLinesWithConsumption=Math.max(0,Math.trunc(num(input.deptLinesWithConsumption)));

  const reasons=[];
  if(accountingMode!=='GENERAL') reasons.push('ACCOUNTING_GENERAL_NOT_ACTIVE');
  if(!/^ACC-\d{3,}$/.test(checkpointRef)) reasons.push('ACCOUNTING_CUTOVER_CHECKPOINT_REQUIRED');
  if(!stockAuthorityConfirmed) reasons.push('STOCK_AUTHORITY_NOT_CONFIRMED');
  if(appsScriptBusinessAuthority) reasons.push('APPS_SCRIPT_BUSINESS_AUTHORITY_STILL_ACTIVE');
  if(googleBusinessCalls!==0) reasons.push('GOOGLE_BUSINESS_CALLS_NOT_ZERO');
  if(activeMaterials<=0) reasons.push('ACTIVE_MATERIALS_MISSING');
  if(deptLinesWithLineId<=0) reasons.push('ACCOUNTING_LINE_LINKAGE_MISSING');
  if(deptLinesWithMaterial<=0) reasons.push('MATERIAL_MAPPING_MISSING');
  if(deptLinesWithConsumption<=0) reasons.push('MATERIAL_CONSUMPTION_MISSING');

  const qualified=reasons.length===0;
  return {
    version:MATERIAL_POST_CUTOVER_REQUALIFICATION_VERSION,
    qualifiedForShadowReadyEvaluation:qualified,
    activationPerformed:false,
    readyEvidenceWritten:false,
    accountingMode,
    accountingEpoch,
    accountingCheckpointRef:checkpointRef,
    stockAuthorityConfirmed,
    reasons,
    counts:{
      activeMaterials,
      stockMoves,
      deptLinesWithLineId,
      deptLinesWithMaterial,
      deptLinesWithConsumption
    }
  };
}
