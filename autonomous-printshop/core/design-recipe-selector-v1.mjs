export const DESIGN_RECIPE_SELECTOR_VERSION='AUTONOMOUS_DESIGN_RECIPE_SELECTOR_V1';

function text(v){return String(v==null?'':v).trim();}
function norm(v){
  return text(v)
    .toLowerCase()
    .replace(/[×x*]/g,'x')
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/\s+/g,' ');
}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function dimsMatch(w,h,ew,eh,tol=1){
  if(w==null||h==null)return false;
  return (Math.abs(w-ew)<=tol&&Math.abs(h-eh)<=tol) ||
         (Math.abs(w-eh)<=tol&&Math.abs(h-ew)<=tol);
}
function parseDimsFromName(name){
  const s=norm(name);
  const m=s.match(/(?:^|[^0-9])(\d{1,4}(?:\.\d+)?)\s*x\s*(\d{1,4}(?:\.\d+)?)(?:\s*(?:سم|cm|مم|mm))?/);
  if(!m)return {widthMm:null,heightMm:null,source:'NONE'};
  let a=Number(m[1]),b=Number(m[2]);
  const unit=/\b(?:سم|cm)\b/.test(s.slice(Math.max(0,m.index-5),m.index+m[0].length+5))?'CM':'AUTO';
  if(unit==='CM'||(a<=100&&b<=100)){a*=10;b*=10;}
  return {widthMm:a,heightMm:b,source:'ITEM_NAME'};
}

export function selectDesignRecipeV1(input={}){
  const itemName=text(input.itemName);
  const n=norm(itemName);
  const explicitW=finite(input.widthMm);
  const explicitH=finite(input.heightMm);
  const parsed=parseDimsFromName(itemName);
  const widthMm=explicitW??parsed.widthMm;
  const heightMm=explicitH??parsed.heightMm;
  const candidates=[];

  const mugKind=/(?:^|\s)(?:مج|مَج|كوب|mug)(?:\s|$)/.test(n);
  if(mugKind&&dimsMatch(widthMm,heightMm,200,90,2)){
    candidates.push({recipeId:'MUG_20X9_TWO_PHOTOS_CENTER_TEXT_V1',reason:'MUG_KIND_AND_20X9_DIMENSIONS'});
  }

  const idKind=/(?:صورة شخصية|صور شخصية|4x6|بطاقة|official id|passport photo)/.test(n);
  if(idKind&&dimsMatch(widthMm,heightMm,40,60,1)){
    candidates.push({recipeId:'OFFICIAL_ID_4X6_V1',reason:'OFFICIAL_ID_KIND_AND_4X6_DIMENSIONS'});
  }

  const stickerKind=/(?:استيكر|ستيكر|sticker)/.test(n);
  const graduationKind=/(?:تخرج|خريج|graduation|graduate|senior)/.test(n);
  if(stickerKind&&graduationKind&&dimsMatch(widthMm,heightMm,70,100,1)){
    candidates.push({recipeId:'GRADUATION_CUT_STICKER_7X10_V1',reason:'GRADUATION_STICKER_AND_7X10_DIMENSIONS'});
  }

  const collageKind=/(?:كولاج|تجميع صور|collage)/.test(n);
  if(collageKind&&dimsMatch(widthMm,heightMm,500,700,2)){
    candidates.push({recipeId:'COLLAGE_50X70_V1',reason:'COLLAGE_KIND_AND_50X70_DIMENSIONS'});
  }

  if(candidates.length!==1){
    return {
      version:DESIGN_RECIPE_SELECTOR_VERSION,
      state:'UNKNOWN',
      recipeId:'',
      reason:candidates.length>1?'AMBIGUOUS_RECIPE_MATCH':'NO_EXACT_RECIPE_MATCH',
      candidateCount:candidates.length,
      dimensionSource:(explicitW!=null&&explicitH!=null)?'EXPLICIT':parsed.source,
      widthMm,
      heightMm,
      preflightWritten:false,
      readinessWritten:false
    };
  }

  return {
    version:DESIGN_RECIPE_SELECTOR_VERSION,
    state:'MATCHED',
    recipeId:candidates[0].recipeId,
    reason:candidates[0].reason,
    candidateCount:1,
    dimensionSource:(explicitW!=null&&explicitH!=null)?'EXPLICIT':parsed.source,
    widthMm,
    heightMm,
    preflightWritten:false,
    readinessWritten:false
  };
}
