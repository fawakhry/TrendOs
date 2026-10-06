import assert from 'node:assert/strict';
import { selectDesignRecipeV1 } from '../core/design-recipe-selector-v1.mjs';

let r=selectDesignRecipeV1({itemName:'مج 20x9 سم'});
assert.equal(r.state,'MATCHED');
assert.equal(r.recipeId,'MUG_20X9_TWO_PHOTOS_CENTER_TEXT_V1');
assert.equal(r.widthMm,200);
assert.equal(r.heightMm,90);

r=selectDesignRecipeV1({itemName:'صورة شخصية 4x6 سم'});
assert.equal(r.state,'MATCHED');
assert.equal(r.recipeId,'OFFICIAL_ID_4X6_V1');

r=selectDesignRecipeV1({itemName:'استيكر تخرج 7x10 سم'});
assert.equal(r.state,'MATCHED');
assert.equal(r.recipeId,'GRADUATION_CUT_STICKER_7X10_V1');

r=selectDesignRecipeV1({itemName:'كولاج 50x70 سم'});
assert.equal(r.state,'MATCHED');
assert.equal(r.recipeId,'COLLAGE_50X70_V1');

r=selectDesignRecipeV1({itemName:'تابلوه 30x40 سم'});
assert.equal(r.state,'UNKNOWN');
assert.equal(r.recipeId,'');
assert.equal(r.preflightWritten,false);
assert.equal(r.readinessWritten,false);

r=selectDesignRecipeV1({itemName:'مج',widthMm:200,heightMm:90});
assert.equal(r.state,'MATCHED');
assert.equal(r.dimensionSource,'EXPLICIT');

r=selectDesignRecipeV1({itemName:'استيكر 7x10 سم'});
assert.equal(r.state,'UNKNOWN');

r=selectDesignRecipeV1({itemName:'صور شخصية'});
assert.equal(r.state,'UNKNOWN');

console.log('AUTONOMOUS_DESIGN_RECIPE_SELECTOR_V1=PASS');
console.log('EXACT_KIND_AND_DIMENSIONS_REQUIRED=YES');
console.log('NO_MATCH_EQUALS_UNKNOWN=YES');
console.log('SELECTOR_WRITES_PREFLIGHT=NO');
console.log('SELECTOR_WRITES_READINESS=NO');
