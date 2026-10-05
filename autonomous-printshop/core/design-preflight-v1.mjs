function text(v){return String(v==null?'':v).trim();}
function bool(v){return v===true;}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}

export const DESIGN_PREFLIGHT_VERSION='AUTONOMOUS_DESIGN_PREFLIGHT_V1';

function normalizedRoleSet(v){
  return new Set((Array.isArray(v)?v:[]).map(x=>text(x).toUpperCase()).filter(Boolean));
}
function normalizedTextSet(v){
  return new Set((Array.isArray(v)?v:[]).map(x=>text(x)).filter(Boolean));
}
function within(actual,expected,tolerance){
  return Math.abs(actual-expected)<=tolerance;
}

export function evaluateDesignPreflightV1({artifact={},recipe={},signals={},requirements={}}={}){
  const failures=[];
  const unknown=[];
  const checks=[];

  function pass(code,detail=''){checks.push({code,status:'PASS',detail});}
  function fail(code,detail=''){failures.push(code);checks.push({code,status:'FAIL',detail});}
  function unk(code,detail=''){unknown.push(code);checks.push({code,status:'UNKNOWN',detail});}

  const width=finite(artifact.widthMm??artifact.width_mm);
  const height=finite(artifact.heightMm??artifact.height_mm);
  const expectedW=finite(recipe.width_mm);
  const expectedH=finite(recipe.height_mm);
  const tol=finite(requirements.dimensionToleranceMm)??0.5;

  if(expectedW!=null&&expectedH!=null){
    if(width==null||height==null) unk('DIMENSIONS_MISSING');
    else if(within(width,expectedW,tol)&&within(height,expectedH,tol)) pass('DIMENSIONS_EXACT');
    else fail('DIMENSIONS_MISMATCH',String(width)+'x'+String(height)+' != '+String(expectedW)+'x'+String(expectedH));
  }

  const dpi=finite(artifact.dpi);
  const minDpi=finite(recipe.min_dpi);
  if(minDpi!=null){
    if(dpi==null) unk('DPI_MISSING');
    else if(dpi>=minDpi) pass('DPI_MINIMUM');
    else fail('DPI_TOO_LOW',String(dpi)+' < '+String(minDpi));
  }

  const availableRoles=normalizedRoleSet(signals.assetRoles||signals.asset_roles);
  for(const roleRaw of recipe.required_asset_roles||[]){
    const role=text(roleRaw).toUpperCase();
    if(!availableRoles.has(role)) fail('ASSET_ROLE_MISSING:'+role);
    else pass('ASSET_ROLE:'+role);
  }

  const requiredTexts=normalizedTextSet(requirements.requiredTexts||requirements.required_texts);
  const verifiedTexts=normalizedTextSet(signals.verifiedExactTexts||signals.verified_exact_texts);
  for(const value of requiredTexts){
    if(!verifiedTexts.has(value)) fail('EXACT_TEXT_MISMATCH_OR_MISSING:'+value);
    else pass('EXACT_TEXT:'+value);
  }

  const forbiddenTexts=normalizedTextSet(requirements.forbiddenTexts||requirements.forbidden_texts);
  const detectedTexts=normalizedTextSet(signals.detectedTexts||signals.detected_texts);
  for(const value of forbiddenTexts){
    if(detectedTexts.has(value)) fail('FORBIDDEN_TEXT_PRESENT:'+value);
    else pass('FORBIDDEN_TEXT_ABSENT:'+value);
  }

  const signalMap={
    identity_preserved:'IDENTITY_PRESERVED',
    white_background_verified:'WHITE_BACKGROUND_VERIFIED',
    closed_cut_stroke_verified:'CLOSED_CUT_STROKE_VERIFIED',
    exact_text_verified:'EXACT_TEXT_VERIFIED',
    layout_verified:'LAYOUT_VERIFIED',
    color_correction_verified:'COLOR_CORRECTION_VERIFIED',
    border_1px_verified:'BORDER_1PX_VERIFIED'
  };

  for(const key of recipe.required_signals||[]){
    const code=signalMap[key]||String(key).toUpperCase();
    if(signals[key]===true) pass(code);
    else if(signals[key]===false) fail(code+'_FAILED');
    else unk(code+'_UNKNOWN');
  }

  const visual=recipe.visual_rules||{};
  if(visual.identity_preservation==='REQUIRED'){
    if(signals.identity_preserved===false) fail('IDENTITY_CHANGE_DETECTED');
    else if(signals.identity_preserved!==true) unk('IDENTITY_PRESERVATION_UNKNOWN');
  }
  if(visual.background==='WHITE'){
    if(signals.white_background_verified===false) fail('WHITE_BACKGROUND_REQUIRED');
    else if(signals.white_background_verified!==true) unk('WHITE_BACKGROUND_UNKNOWN');
  }
  if(visual.cut_stroke==='CLOSED_BLACK_STRONG'){
    if(signals.closed_cut_stroke_verified===false) fail('CUT_STROKE_INVALID');
    else if(signals.closed_cut_stroke_verified!==true) unk('CUT_STROKE_UNKNOWN');
  }

  const uniqueFailures=[...new Set(failures)];
  const uniqueUnknown=[...new Set(unknown)];

  const result=uniqueFailures.length?'FAIL':uniqueUnknown.length?'UNKNOWN':'PASS';
  return {
    version:DESIGN_PREFLIGHT_VERSION,
    result,
    recipeId:text(recipe.recipe_id),
    checks,
    failures:uniqueFailures,
    unknown:uniqueUnknown,
    productionReady:result==='PASS'
  };
}

export function getRecipeByIdV1(catalog,recipeId){
  const id=text(recipeId);
  return (catalog&&Array.isArray(catalog.recipes)?catalog.recipes:[]).find(x=>text(x.recipe_id)===id)||null;
}
