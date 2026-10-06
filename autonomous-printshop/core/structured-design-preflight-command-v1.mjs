import { evaluateDesignPreflightV1, getRecipeByIdV1 } from './design-preflight-v1.mjs';

export const STRUCTURED_DESIGN_PREFLIGHT_COMMAND_VERSION='STRUCTURED_DESIGN_PREFLIGHT_COMMAND_V1';

function text(v){return String(v==null?'':v).trim();}
function safeId(v,label,max=180){
  const s=text(v);
  if(!s||s.length>max||!/^[A-Za-z0-9_.:\/-]+$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function hash(v,label){
  const s=text(v).toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(s)) throw new Error(label+'_INVALID');
  return s;
}
function positiveOrNull(v){
  if(v==null||v==='') return null;
  const n=Number(v);
  if(!Number.isFinite(n)||n<=0) throw new Error('MEASUREMENT_INVALID');
  return n;
}
function q(v){return "'"+text(v).replace(/'/g,"''")+"'";}
function json(v){return q(JSON.stringify(v));}

export function evaluateAndBuildStructuredDesignPreflightV1(input={}){
  const preflightRunId=safeId(input.preflightRunId,'PREFLIGHT_RUN_ID');
  const artifactId=safeId(input.artifactId,'ARTIFACT_ID');
  const lineId=safeId(input.lineId,'LINE_ID');
  const recipeId=safeId(input.recipeId,'RECIPE_ID');
  const subjectSha256=hash(input.subjectSha256,'SUBJECT_SHA256');
  const verificationRef=text(input.verificationRef);
  const observedAtMs=Math.trunc(Number(input.observedAtMs||0));
  if(!verificationRef) throw new Error('VERIFICATION_REF_REQUIRED');
  if(!Number.isFinite(observedAtMs)||observedAtMs<=0) throw new Error('OBSERVED_AT_INVALID');

  const recipe=getRecipeByIdV1(input.catalog,recipeId);
  if(!recipe) throw new Error('RECIPE_NOT_FOUND');

  const artifact={
    widthMm:positiveOrNull(input.widthMm),
    heightMm:positiveOrNull(input.heightMm),
    dpi:positiveOrNull(input.dpi)
  };

  const signals={
    assetRoles:Array.isArray(input.assetRoles)?input.assetRoles:[],
    verifiedExactTexts:Array.isArray(input.verifiedExactTexts)?input.verifiedExactTexts:[],
    detectedTexts:Array.isArray(input.detectedTexts)?input.detectedTexts:[],
    identity_preserved:input.identity_preserved,
    white_background_verified:input.white_background_verified,
    closed_cut_stroke_verified:input.closed_cut_stroke_verified,
    exact_text_verified:input.exact_text_verified,
    layout_verified:input.layout_verified,
    color_correction_verified:input.color_correction_verified,
    border_1px_verified:input.border_1px_verified
  };

  const requirements={
    dimensionToleranceMm:input.dimensionToleranceMm==null?0.5:Number(input.dimensionToleranceMm),
    requiredTexts:Array.isArray(input.requiredTexts)?input.requiredTexts:[],
    forbiddenTexts:Array.isArray(input.forbiddenTexts)?input.forbiddenTexts:[]
  };

  const evaluation=evaluateDesignPreflightV1({artifact,recipe,signals,requirements});
  const checksJson={
    commandVersion:STRUCTURED_DESIGN_PREFLIGHT_COMMAND_VERSION,
    verificationRef,
    subjectSha256,
    evaluation,
    measurements:artifact,
    assetRoles:signals.assetRoles,
    requiredTexts:requirements.requiredTexts,
    forbiddenTexts:requirements.forbiddenTexts
  };

  const sql=[
    "INSERT OR IGNORE INTO autonomous_design_preflight_runs(",
    " preflight_run_id,artifact_id,line_id,result,recipe_id,policy_version,checks_json,observed_at_ms",
    ") SELECT ",
    q(preflightRunId)+","+q(artifactId)+","+q(lineId)+","+q(evaluation.result)+","+q(recipeId)+",'structured-v1',"+json(checksJson)+","+String(observedAtMs),
    " WHERE EXISTS(SELECT 1 FROM autonomous_design_control WHERE singleton_id=1 AND mode='SHADOW')",
    " AND EXISTS(",
    "   SELECT 1 FROM autonomous_design_artifacts",
    "   WHERE artifact_id="+q(artifactId),
    "     AND line_id="+q(lineId),
    "     AND lower(content_sha256)="+q(subjectSha256),
    " );"
  ].join('\n');

  return {
    version:STRUCTURED_DESIGN_PREFLIGHT_COMMAND_VERSION,
    evaluation,
    sql,
    directReadinessWrite:false,
    directApprovalWrite:false,
    directArtifactWrite:false
  };
}
