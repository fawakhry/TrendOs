import assert from 'node:assert/strict';
import {reviewProtectedFirstLineD1V1 as review,
  PRIVATE_FIRST_LINE_D1_SELECT_SQL as QUERY}
  from '../core/private-first-line-d1-review-v1.mjs';
// AP-123 synthetic D1-compatible adapter; never connects to real Cloudflare.
const now=Date.parse('2026-10-10T15:00:00.000Z');
const line='FAKE_PROTECTED_LINE_001';
const SECRET='CUSTOMER_NAME_PHONE_AND_PRIVATE_ASSET_NEVER_RETURNED';
const record={lineId:line,status:'طلب جديد',department:'طباعة',
  dueDate:'2026-10-12',flyPrint:'0',lineActive:1,
  orderActive:1,archived:0,originRank:1,sourceAmbiguous:0,
  notes:SECRET,customer:SECRET,storageRef:SECRET};
let readCount=0, bindValues=[];
const makeDb=(rows=[record],fail=false)=>({prepare(query){
  assert.equal(query,QUERY);
  assert.match(query,/^\s*WITH legacy AS/);
  assert.equal(query.match(/\?/g)?.length,2);
  assert.doesNotMatch(query,/\b(?:INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER)\b/i);
  return {bind(...params){
    bindValues=params;
    return {async all(){
      readCount+=1;
      if(fail)throw new Error(SECRET);
      return {results:rows};
    }};
  }};
}});
const authorizeRead=async ({selectedPrivateLineKey,operation})=>({
  allowed:true,scope:'AUTONOMOUS_FIRST_LINE_HUMAN_REVIEW',
  selectedPrivateLineKey:operation==='READ_PRIVATE_FIRST_LINE_FOR_HUMAN_REVIEW'
    ?selectedPrivateLineKey:'DENIED'
});
const run=(x={})=>review({db:makeDb(),authorizeRead,
  selectedPrivateLineKey:line,nowMs:now,...x});
let out=await run();
assert.equal(out.status,'HUMAN_REVIEW_ONLY');
assert.equal(out.manualReviewPacketExists,true);
assert.equal(out.privateD1SourceRead,true);
assert.equal(out.protectedHostVerifiedByThisModule,false);
assert.equal(out.independentDesignMaterialMachineProofs,false);
assert.deepEqual(bindValues,[line,line]);
assert.equal(readCount,1);
for(const marker of [line,SECRET,'originRank','sourceAmbiguous']){
  assert.equal(JSON.stringify(out).includes(marker),false);
}
const before=readCount;
for(const x of [
  {authorizeRead:null},
  {authorizeRead:async()=>({allowed:false})},
  {authorizeRead:async()=>({allowed:true,scope:'OTHER',
    selectedPrivateLineKey:line})},
  {authorizeRead:async()=>({allowed:true,
    scope:'AUTONOMOUS_FIRST_LINE_HUMAN_REVIEW',
    selectedPrivateLineKey:'ANOTHER_LINE'})},
  {authorizeRead:async()=>{throw new Error(SECRET);}},
  {selectedPrivateLineKey:''},
  {nowMs:0}
]){
  const result=await run(x);
  assert.equal(result.status,'BLOCKED_SAFE');
  assert.equal(result.privateD1SourceRead,false);
  assert.equal(result.assignmentAllowed,false);
  assert.equal(result.productionWriteAllowed,false);
  assert.equal(JSON.stringify(result).includes(SECRET),false);
}
assert.equal(readCount,before,'NO_PRIVATE_D1_READ_WITHOUT_GUARD');

const blocked=async (rows,reason)=>{
  const result=await run({db:makeDb(rows)});
  assert.equal(result.status,'BLOCKED_SAFE');
  assert.equal(result.reviewReason,reason);
  assert.equal(result.assignmentAllowed,false);
  assert.equal(JSON.stringify(result).includes(line),false);
};
await blocked([],'PRIVATE_LINE_NOT_FOUND_OR_NOT_VERIFIED');
await blocked([record,record],'PRIVATE_D1_RESULT_UNVERIFIED');
await blocked([{...record,lineId:'SPOOFED'}],'PRIVATE_LINE_SOURCE_AMBIGUOUS');
await blocked([{...record,sourceAmbiguous:1}],'PRIVATE_LINE_SOURCE_AMBIGUOUS');
await blocked([{...record,status:'تحت التنفيذ'}],'LINE_STATUS_OR_ARCHIVE_REVIEW');
await blocked([{...record,archived:1}],'LINE_STATUS_OR_ARCHIVE_REVIEW');
await blocked([{...record,orderActive:0}],'LINE_STATUS_OR_ARCHIVE_REVIEW');
await blocked([{...record,flyPrint:1}],'FLY_FLAG_REVIEW');
await blocked([{...record,dueDate:'2026-10-09'}],'OVERDUE_HUMAN_ESCALATION');
await blocked([{...record,dueDate:'2026-10-10'}],'DUE_TODAY_HUMAN_REVIEW');
await blocked([{...record,dueDate:'2026-02-30'}],'DUE_DATE_UNVERIFIED');

out=await run({db:makeDb([record],true)});
assert.equal(out.status,'BLOCKED_SAFE');
assert.equal(out.reviewReason,'PRIVATE_D1_READ_UNAVAILABLE');
assert.equal(JSON.stringify(out).includes(SECRET),false);
const forged={...record,get sourceAmbiguous(){throw new Error(SECRET);}};
out=await run({db:makeDb([forged])});
assert.equal(out.reviewReason,'PRIVATE_D1_RESULT_UNVERIFIED');
assert.equal(out.privateD1SourceRead,false);
console.log('AP123_AUTH_FIRST_AND_BOUND_TWO_PARAM_LINE_READ=PASS');
console.log('AP123_ACTIVE_ORDER_PRIVATE_LINE_MANUAL_ONLY=PASS');
console.log('AP123_MALFORMED_OR_CHANGED_LIVE_ORDER_FAIL_CLOSED=PASS');
console.log('AP123_NO_CUSTOMER_PII_OR_RAW_LINE_ID_OUTPUT=PASS');
console.log('AP123_LIVE_D1=NOT_ACCESSED; WORKER_NOT_DEPLOYED; ASSIGNMENT=0');
