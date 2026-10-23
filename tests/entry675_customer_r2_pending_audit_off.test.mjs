import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditNativeCustomerPendingR2V0,CUSTOMER_R2_PENDING_AUDIT_SQL_V0,
 CUSTOMER_R2_PENDING_AUDIT_POLICY_V0,CUSTOMER_R2_PENDING_MIN_AGE_MS_V0}
 from '../cloudflare-d1/src/customer-portal-native-r2-pending-audit-v0.mjs';
const NOW=1800000000000,FILE='CDF-'+'66'.repeat(16),KEY='customer-drafts/'+FILE;
const row={fileId:FILE,fileState:'PENDING',objectKey:KEY,sha256Hex:'b'.repeat(64),
 byteSize:1024,contentType:'image/png',createdAtMs:NOW-3600000,
 updatedAtMs:NOW-3600000,draftState:'DRAFT'};
const obj={size:1024,httpMetadata:{contentType:'image/png'},
 customMetadata:{source:'trendos-customer-draft-v0'}};
let calls=[];
function fake({record=row,object=obj,sqlFail=false,headFail=false}={}){
 return {
  db:{prepare(sql){calls.push('prepare');assert.equal(sql,CUSTOMER_R2_PENDING_AUDIT_SQL_V0);
   return{bind(id){calls.push('bind:'+id);return{async first(){
    calls.push('first');if(sqlFail)throw Error('PRIVATE_SQL');return record;
   }}}}}},
  bucket:{async head(key){calls.push('head:'+key);if(headFail)throw Error('PRIVATE_R2');return object;},
   async get(){throw Error('MUST_NOT_GET');},
   async put(){throw Error('MUST_NOT_PUT');},
   async delete(){throw Error('MUST_NOT_DELETE');}}
 };
}
async function run(options={},fixture=fake()){
 calls=[];return auditNativeCustomerPendingR2V0({...fixture,fileId:FILE,nowMs:NOW,...options});
}
test('read only: no route, no writes, no accidental publish or SHA claim',()=>{
 const s=readFileSync('cloudflare-d1/src/customer-portal-native-r2-pending-audit-v0.mjs','utf8');
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(worker,/customer-portal-native-r2-pending-audit-v0/);
 assert.doesNotMatch(s,/APPS_SCRIPT_API_URL|fetch\s*\(/);
 assert.match(CUSTOMER_R2_PENDING_AUDIT_SQL_V0,/f\.state='PENDING'/);
 assert.match(CUSTOMER_R2_PENDING_AUDIT_SQL_V0,/f\.customer_id=d\.customer_id/);
 assert.equal(CUSTOMER_R2_PENDING_AUDIT_POLICY_V0.workerEntryWired,false);
 assert.equal(CUSTOMER_R2_PENDING_AUDIT_POLICY_V0.r2Delete,false);
 assert.equal(CUSTOMER_R2_PENDING_AUDIT_POLICY_V0.fileReadyMutation,false);
 assert.equal(CUSTOMER_R2_PENDING_AUDIT_POLICY_V0.verifiedFullSha256,false);
});
test('matching private HEAD still needs operator hash + auth review',async()=>{
 const r=await run();
 assert.equal(r.code,'PENDING_R2_PRESENT_HASH_AND_AUTH_REVIEW_REQUIRED');
 assert.equal(r.inspected,true);assert.equal(r.success,false);
 assert.equal(r.fileReady,false);assert.equal(r.contentHashVerified,false);
 assert.equal(r.readyTransitionAuthorized,false);
 assert.deepEqual(calls,['prepare','bind:'+FILE,'first','head:'+KEY]);
 assert.equal(JSON.stringify(r).includes(KEY),false);
 assert.equal(JSON.stringify(r).includes('b'.repeat(64)),false);
});
test('missing HEAD, mismatched MIME, source and size cannot authorize READY',async()=>{
 for(const item of [null,{...obj,size:2},{...obj,httpMetadata:{contentType:'application/pdf'}},
  {...obj,customMetadata:{source:'fake'}}]){
  const r=await run({},fake({object:item}));
  assert.match(r.code,/MANUAL_REVIEW/);
  assert.equal(r.fileReady,false);
  assert.equal(r.objectDeletionAuthorized,false);
 }
});
test('young PENDING objects not inspected while writer may be in flight',async()=>{
 const r=await run({},fake({record:{...row,updatedAtMs:NOW-CUSTOMER_R2_PENDING_MIN_AGE_MS_V0+1}}));
 assert.equal(r.code,'PENDING_UPLOAD_MAY_BE_IN_FLIGHT');
 assert.equal(calls.some(x=>x.startsWith('head:')),false);
});
test('invalid ownership, draft state or ledger metadata never calls R2',async()=>{
 for(const record of [null,{...row,objectKey:'public/'+FILE},{...row,sha256Hex:'bad'},
 {...row,byteSize:0},{...row,createdAtMs:NOW+1},
 {...row,updatedAtMs:NOW+1},{...row,draftState:'SUBMITTED'},
 {...row,fileState:'READY'},{...row,fileId:'CDF-'+'77'.repeat(16)}]){
  const r=await run({},fake({record}));
  assert.equal(r.fileReady,false);
  assert.equal(calls.some(x=>x.startsWith('head:')),false);
 }
});
test('invalid fileId and missing dependencies fail before D1 or R2',async()=>{
 for(const options of [{fileId:'bad'},{db:null},{bucket:null},{nowMs:0}]){
  calls=[];const r=await auditNativeCustomerPendingR2V0({...fake(),fileId:FILE,nowMs:NOW,...options});
  assert.equal(r.success,false);
  assert.equal(calls.length,0);
 }
});
test('SQLite and R2 metadata errors fail closed without private messages',async()=>{
 for(const cfg of [{sqlFail:true},{headFail:true}]){
  const r=await run({},fake(cfg));
  assert.equal(r.code,'PENDING_LEDGER_OR_R2_INSPECTION_FAILED');
  assert.equal(JSON.stringify(r).includes('PRIVATE_'),false);
 }
});
