import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  evaluateDesignPreflightV1,
  getRecipeByIdV1
} from '../core/design-preflight-v1.mjs';

const catalog=JSON.parse(fs.readFileSync('autonomous-printshop/design/DESIGN_RECIPE_CATALOG_V1.json','utf8'));
assert.equal(catalog.status,'SHADOW_CANDIDATE');
assert.equal(catalog.recipes.length,4);

const mug=getRecipeByIdV1(catalog,'MUG_20X9_TWO_PHOTOS_CENTER_TEXT_V1');
assert.ok(mug);

let r=evaluateDesignPreflightV1({
  artifact:{widthMm:200,heightMm:90,dpi:300},
  recipe:mug,
  signals:{
    assetRoles:['PHOTO_LEFT','PHOTO_RIGHT'],
    identity_preserved:true,
    exact_text_verified:true,
    layout_verified:true,
    verifiedExactTexts:['محظوظه إن لاقيتك ❤️']
  },
  requirements:{requiredTexts:['محظوظه إن لاقيتك ❤️']}
});
assert.equal(r.result,'PASS');
assert.equal(r.productionReady,true);

r=evaluateDesignPreflightV1({
  artifact:{widthMm:200,heightMm:90,dpi:300},
  recipe:mug,
  signals:{
    assetRoles:['PHOTO_LEFT','PHOTO_RIGHT'],
    exact_text_verified:true,
    layout_verified:true,
    verifiedExactTexts:['X']
  }
});
assert.equal(r.result,'UNKNOWN');
assert.ok(r.unknown.some(x=>x.includes('IDENTITY')));

r=evaluateDesignPreflightV1({
  artifact:{widthMm:199,heightMm:90,dpi:299},
  recipe:mug,
  signals:{
    assetRoles:['PHOTO_LEFT'],
    identity_preserved:false,
    exact_text_verified:false,
    layout_verified:false
  }
});
assert.equal(r.result,'FAIL');
assert.ok(r.failures.includes('DPI_TOO_LOW'));
assert.ok(r.failures.includes('ASSET_ROLE_MISSING:PHOTO_RIGHT'));
assert.ok(r.failures.includes('IDENTITY_CHANGE_DETECTED'));

const sticker=getRecipeByIdV1(catalog,'GRADUATION_CUT_STICKER_7X10_V1');
r=evaluateDesignPreflightV1({
  artifact:{widthMm:70,heightMm:100,dpi:300},
  recipe:sticker,
  signals:{
    assetRoles:['PORTRAIT'],
    identity_preserved:true,
    white_background_verified:true,
    closed_cut_stroke_verified:true,
    exact_text_verified:true,
    verifiedExactTexts:['Senior 2027']
  },
  requirements:{requiredTexts:['Senior 2027']}
});
assert.equal(r.result,'PASS');

const id=getRecipeByIdV1(catalog,'OFFICIAL_ID_4X6_V1');
r=evaluateDesignPreflightV1({
  artifact:{widthMm:40,heightMm:60,dpi:300},
  recipe:id,
  signals:{
    assetRoles:['PORTRAIT'],
    identity_preserved:true,
    white_background_verified:true,
    color_correction_verified:true
  }
});
assert.equal(r.result,'UNKNOWN');
assert.ok(r.unknown.includes('BORDER_1PX_VERIFIED_UNKNOWN'));

console.log('AUTONOMOUS_PRINTSHOP_DESIGN_PREFLIGHT_V1=PASS');
console.log('MISSING_VISUAL_EVIDENCE=UNKNOWN');
console.log('EXPLICIT_VIOLATION=FAIL');
console.log('PASS=ALL_REQUIRED_CHECKS_PROVEN');
