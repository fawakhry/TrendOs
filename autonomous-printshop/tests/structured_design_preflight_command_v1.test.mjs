import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateAndBuildStructuredDesignPreflightV1 } from '../core/structured-design-preflight-command-v1.mjs';

const catalog=JSON.parse(fs.readFileSync('autonomous-printshop/design/DESIGN_RECIPE_CATALOG_V1.json','utf8'));
const h='a'.repeat(64);

const pass=evaluateAndBuildStructuredDesignPreflightV1({
  preflightRunId:'preflight-pass-1',
  artifactId:'artifact-1',
  lineId:'line-1',
  recipeId:'OFFICIAL_ID_4X6_V1',
  subjectSha256:h,
  verificationRef:'owner-verification:1',
  observedAtMs:1234567890,
  catalog,
  widthMm:40,
  heightMm:60,
  dpi:300,
  assetRoles:['PORTRAIT'],
  identity_preserved:true,
  white_background_verified:true,
  color_correction_verified:true,
  border_1px_verified:true
});
assert.equal(pass.evaluation.result,'PASS');
assert.match(pass.sql,/'PASS'/);
assert.match(pass.sql,/lower\(content_sha256\)/);
assert.match(pass.sql,/autonomous_design_control WHERE singleton_id=1 AND mode='SHADOW'/);
assert.equal(pass.directReadinessWrite,false);
assert.doesNotMatch(pass.sql,/autonomous_readiness_evidence/);
assert.doesNotMatch(pass.sql,/autonomous_design_approval_events/);
assert.doesNotMatch(pass.sql,/autonomous_design_artifacts\(/);

const unknown=evaluateAndBuildStructuredDesignPreflightV1({
  preflightRunId:'preflight-unknown-1',
  artifactId:'artifact-2',
  lineId:'line-2',
  recipeId:'OFFICIAL_ID_4X6_V1',
  subjectSha256:h,
  verificationRef:'owner-verification:2',
  observedAtMs:1234567891,
  catalog,
  widthMm:40,
  heightMm:60,
  assetRoles:['PORTRAIT']
});
assert.equal(unknown.evaluation.result,'UNKNOWN');
assert.ok(unknown.evaluation.unknown.includes('DPI_MISSING'));
assert.ok(!unknown.evaluation.failures.includes('DPI_TOO_LOW'));
assert.match(unknown.sql,/'UNKNOWN'/);

const fail=evaluateAndBuildStructuredDesignPreflightV1({
  preflightRunId:'preflight-fail-1',
  artifactId:'artifact-3',
  lineId:'line-3',
  recipeId:'OFFICIAL_ID_4X6_V1',
  subjectSha256:h,
  verificationRef:'owner-verification:3',
  observedAtMs:1234567892,
  catalog,
  widthMm:40,
  heightMm:60,
  dpi:150,
  assetRoles:['PORTRAIT'],
  identity_preserved:true,
  white_background_verified:true,
  color_correction_verified:true,
  border_1px_verified:true
});
assert.equal(fail.evaluation.result,'FAIL');
assert.ok(fail.evaluation.failures.includes('DPI_TOO_LOW'));
assert.match(fail.sql,/'FAIL'/);

assert.throws(()=>evaluateAndBuildStructuredDesignPreflightV1({
  preflightRunId:'p',artifactId:'a',lineId:'l',recipeId:'UNKNOWN_RECIPE',
  subjectSha256:h,verificationRef:'v',observedAtMs:1,catalog
}),/RECIPE_NOT_FOUND/);

assert.throws(()=>evaluateAndBuildStructuredDesignPreflightV1({
  preflightRunId:'p',artifactId:'a',lineId:'l',recipeId:'OFFICIAL_ID_4X6_V1',
  subjectSha256:h,verificationRef:'',observedAtMs:1,catalog
}),/VERIFICATION_REF_REQUIRED/);

console.log('STRUCTURED_DESIGN_PREFLIGHT_COMMAND_V1=PASS');
console.log('HARD_CODED_PASS=NO');
console.log('EVALUATOR_RESULT_IS_PERSISTED=YES');
console.log('ARTIFACT_LINE_HASH_MATCH_REQUIRED=YES');
console.log('DIRECT_READINESS_WRITE=NO');
