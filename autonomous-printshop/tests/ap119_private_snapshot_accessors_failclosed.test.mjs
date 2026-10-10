import assert from 'node:assert/strict';
import {buildLiveLineSnapshotHumanReviewV1 as review} from '../core/live-line-snapshot-human-review-v1.mjs';
// In-memory synthetic inputs only; no D1/Cloudflare operations.
const now=Date.parse('2026-10-10T12:00:00.000Z');
const secret='SYNTHETIC_PRIVATE_CUSTOMER_NEVER_ECHO';
const line='SYNTHETIC_PROTECTED_LINE';
const goodLine={lineId:line,status:'طلب جديد',department:'طباعة',
  lineActive:true,orderActive:true,archived:false,flyPrint:0,
  dueDate:'2026-10-12'};
const source={kind:'D1_QUALIFIED_SHADOW',authorizedRead:true,
  snapshotComplete:true,observedAtMs:now-1000};
const input={rows:[goodLine],events:[],source,selectedPrivateLineKey:line,nowMs:now};
assert.equal(review(input).status,'HUMAN_REVIEW_ONLY');
const badLine={...goodLine,get status(){throw new Error(secret);}};
const badId={...goodLine,get lineId(){throw new Error(secret);}};
const badSource={...source,get kind(){throw new Error(secret);}};
const badEnvelope={...source,get observedAtMs(){throw new Error(secret);}};
const badEvents=new Proxy([],{
  get(target,key){if(key==='length')return 0;return Reflect.get(target,key); }
});
const poisonRows=new Proxy([goodLine],{get(target,key){
  if(key==='filter')throw new Error(secret);
  return Reflect.get(target,key);
}});
const poisonArray=new Proxy([],{get(target,key){
 if(key==='length')throw new Error(secret);
 return Reflect.get(target,key);
}});
for(const variation of [
  {...input,rows:[badLine]},
  {...input,rows:[badId]},
  {...input,rows:poisonRows},
  {...input,rows:poisonArray},
  {...input,events:poisonArray},
  {...input,source:badSource},
  {...input,source:badEnvelope},
  null
]){
  const out=review(variation);
  assert.equal(out.status,'BLOCKED_SAFE');
  assert.equal(out.reviewReason,'PRIVATE_SNAPSHOT_INPUT_UNVERIFIED');
  assert.equal(out.manualReviewPacketExists,false);
  assert.equal(out.sourceAuthenticatedIndependently,false);
  assert.equal(out.productionWriteAllowed,false);
  assert.equal(out.assignmentAllowed,false);
  assert.equal(out.operatorTaskActivationAllowed,false);
  assert.equal(out.pilotLineSelected,false);
  const result=JSON.stringify(out);
  assert.equal(result.includes(secret),false);
  assert.equal(result.includes(line),false);
}
assert.equal(review({...input,events:badEvents}).status,'HUMAN_REVIEW_ONLY');
assert.equal(review(input).status,'HUMAN_REVIEW_ONLY');
console.log('AP119_PRIVATE_SNAPSHOT_ROW_SOURCE_ACCESSORS=BLOCKED_SAFE');
console.log('AP119_SNAPSHOT_PROXY_ERRORS_NEVER_ECHO_PRIVATE_VALUES=PASS');
console.log('AP119_VALID_SNAPSHOT_RECOVERY=HUMAN_ONLY');
console.log('AP119_LIVE_D1=NOT_QUERIED; BUSINESS_WRITES=0; PRODUCTION_DEPLOY=NO');
