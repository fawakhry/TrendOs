import assert from 'node:assert/strict';
import { materialReadinessEvidenceCandidatesV2 } from '../core/material-readiness-candidate-v2.mjs';

const now=1700000000000;
const rows=[
  {lineId:'L1',department:'ليزر',materialName:'MDF',materialConsumption:3,materialId:'M1',stockQty:2,materialVersion:4},
  {lineId:'L2',department:'طباعة',materialName:'ورق',materialConsumption:5,materialId:'M2',stockQty:10,materialVersion:7}
];

let out=materialReadinessEvidenceCandidatesV2(rows,{nowMs:now});
assert.equal(out.length,1);
assert.equal(out[0].lineId,'L1');
assert.equal(out[0].state,'BLOCKED');
assert.equal(out.some(x=>x.state==='READY'),false);

out=materialReadinessEvidenceCandidatesV2(rows,{
  nowMs:now,
  allowReady:true,
  accountingGeneral:false,
  postCutoverQualified:true,
  stockAuthorityConfirmed:true
});
assert.equal(out.some(x=>x.state==='READY'),false);

out=materialReadinessEvidenceCandidatesV2(rows,{
  nowMs:now,
  allowReady:true,
  accountingGeneral:true,
  postCutoverQualified:false,
  stockAuthorityConfirmed:true
});
assert.equal(out.some(x=>x.state==='READY'),false);

out=materialReadinessEvidenceCandidatesV2(rows,{
  nowMs:now,
  allowReady:true,
  accountingGeneral:true,
  postCutoverQualified:true,
  stockAuthorityConfirmed:false
});
assert.equal(out.some(x=>x.state==='READY'),false);

out=materialReadinessEvidenceCandidatesV2(rows,{
  nowMs:now,
  allowReady:true,
  accountingGeneral:true,
  postCutoverQualified:true,
  stockAuthorityConfirmed:true
});
assert.equal(out.length,2);
const ready=out.find(x=>x.lineId==='L2');
assert.equal(ready.state,'READY');
assert.equal(ready.expiresAtMs-ready.observedAtMs,30*60*1000);
assert.equal(ready.evidence.postCutoverQualified,true);

console.log('MATERIAL_READINESS_CANDIDATE_V2=PASS');
console.log('READY_DEFAULT=DISABLED');
console.log('GENERAL_REQUIRED=YES');
console.log('POST_CUTOVER_QUALIFICATION_REQUIRED=YES');
console.log('STOCK_AUTHORITY_CONFIRMATION_REQUIRED=YES');
console.log('BLOCKED_EVIDENCE_ALLOWED_WITHOUT_READY=YES');
