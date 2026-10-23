import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 CUSTOMER_NATIVE_FILE_MAX_BYTES_V0,NATIVE_CUSTOMER_FILE_R2_POLICY_V0,
 CUSTOMER_NATIVE_FILE_RESERVE_SQL_V0,CUSTOMER_NATIVE_FILE_READBACK_SQL_V0,
 CUSTOMER_NATIVE_FILE_FINALIZE_CAS_SQL_V0,
 classifyNativeCustomerFileV0,newNativeCustomerFileIdV0,
 storeNativeCustomerDraftFileV0,handleNativeCustomerDraftFileR2V0
} from '../cloudflare-d1/src/customer-portal-native-draft-file-r2-v0.mjs';
import {fingerprintCustomerSessionV0} from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';
const TOKEN='ab'.repeat(32),SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const NOW=1800000000000,ORIGIN='https://customer.fake.test';
const DRAFT='CDR-'+'22'.repeat(16),ITEM='CDI-'+'33'.repeat(16),KEY='cd'.repeat(16);
const FILE='CDF-'+'44'.repeat(16),OBJECT='customer-drafts/'+FILE;
const random={getRandomValues(a){a.fill(68);return a;}};
const png=Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3,4,5]);
const jpeg=Uint8Array.from([255,216,255,224,0,1,2,3]);
const pdf=new TextEncoder().encode('%PDF-1.7\n');
let log=[];
function fakeDb({reserved=1,readback={fileId:FILE,state:'READY'},finalized=1,broken=false}={}){
 return{prepare(sql){
   const kind=sql.includes('INSERT OR IGNORE')?'reserve':
     sql.includes('SELECT f.file_id')?'readback':'finalize';
   log.push({kind,phase:'prepare'});
   return{bind(...args){
     log.push({kind,phase:'bind',args});
     return{
       async run(){if(broken)throw Error('PRIVATE_SQL');return {meta:{changes:kind==='reserve'?reserved:finalized}};},
       async first(){if(broken)throw Error('PRIVATE_SQL');return readback;}
     };
   }};
 }};
}
const fakeR2=(options={})=>({async put(key,bytes,opts){
 log.push({kind:'r2-put',key,size:bytes.byteLength,opts});
 if(options.throw)throw Error('PRIVATE_R2');
 return options.nullResult?null:{etag:'fake',key};
}});
const run=(options={})=>storeNativeCustomerDraftFileV0({
 db:fakeDb(),bucket:fakeR2(),token:TOKEN,secret:SECRET,
 draftId:DRAFT,itemId:ITEM,requestKey:KEY,bytes:png,
 contentType:'image/png',nowMs:NOW,random,...options
});
const request=(bytes=png,headers={},method='POST')=>new Request(
 'https://cloud.fake.invalid/v1/customer/native/drafts/'+DRAFT+'/items/'+ITEM+'/files',
 {method,headers:{Origin:ORIGIN,Authorization:'Bearer '+TOKEN,
   'x-idempotency-key':KEY,'content-type':'image/png',...headers},
   ...(method==='POST'?{body:bytes}:{})}
);
const env=(changes={})=>({DB:fakeDb(),CUSTOMER_DRAFT_FILES_BUCKET:fakeR2(),
 CORS_ORIGINS:ORIGIN,TRENDOS_CUSTOMER_NATIVE_DRAFT_FILE_R2_V0_ENABLED:'true',
 TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,...changes});
test('R2 binding absent from Worker; route OFF and no public object URL',()=>{
 assert.equal(NATIVE_CUSTOMER_FILE_R2_POLICY_V0.defaultEnabled,false);
 assert.equal(NATIVE_CUSTOMER_FILE_R2_POLICY_V0.workerEntryWired,false);
 assert.equal(NATIVE_CUSTOMER_FILE_R2_POLICY_V0.malwareScanComplete,false);
 assert.equal(NATIVE_CUSTOMER_FILE_R2_POLICY_V0.productionRelease,'NO_GO');
 assert.equal(newNativeCustomerFileIdV0(random),FILE);
 assert.doesNotMatch(readFileSync('cloudflare-d1/wrangler.toml','utf8'),/\[\[r2_buckets\]\]/);
 assert.doesNotMatch(readFileSync('cloudflare-d1/src/index_v2.js','utf8'),
   /customer-portal-native-draft-file-r2-v0\.mjs/);
 assert.match(CUSTOMER_NATIVE_FILE_RESERVE_SQL_V0,/d\.state='DRAFT'/);
 assert.match(CUSTOMER_NATIVE_FILE_READBACK_SQL_V0,/f\.customer_id=a\.customer_id/);
 assert.match(CUSTOMER_NATIVE_FILE_FINALIZE_CAS_SQL_V0,/s\.revoked_at_ms IS NULL/);
});
test('MIME signature and five MiB are strictly checked',()=>{
 for(const [mime,bytes] of [['image/png',png],['image/jpeg',jpeg],['application/pdf',pdf]])
   assert.equal(classifyNativeCustomerFileV0(bytes,mime),true);
 for(const [mime,bytes] of [['image/png',jpeg],['image/jpeg',png],
   ['application/pdf',png],['image/svg+xml',png],['image/png',new Uint8Array(8)]])
   assert.equal(classifyNativeCustomerFileV0(bytes,mime),false);
 assert.equal(classifyNativeCustomerFileV0(
   new Uint8Array(CUSTOMER_NATIVE_FILE_MAX_BYTES_V0+1),'image/png'),false);
});
test('fresh R2 commit only after D1 auth reservation and final D1 session CAS',async()=>{
 log=[];
 const x=await run();
 assert.equal(x.status,201);
 assert.equal(x.body.fileId,FILE);
 assert.equal(x.body.privateObject,true);
 assert.equal(JSON.stringify(x).includes(OBJECT),false);
 assert.deepEqual(log.filter(y=>y.phase==='bind'||y.kind==='r2-put').map(y=>y.kind),
   ['reserve','r2-put','finalize']);
 const mac=await fingerprintCustomerSessionV0(TOKEN,SECRET);
 const args=log.find(y=>y.kind==='reserve'&&y.phase==='bind').args;
 assert.equal(args[0],FILE);assert.equal(args[1],KEY);
 assert.match(args[2],/^[a-f0-9]{64}$/);
 assert.deepEqual(args.slice(3),['image/png',png.length,OBJECT,NOW,NOW,ITEM,DRAFT,mac,NOW,NOW]);
 assert.deepEqual(log.find(y=>y.kind==='finalize'&&y.phase==='bind').args,
  [NOW,FILE,KEY,DRAFT,ITEM,mac,NOW,NOW]);
 assert.equal(log.find(y=>y.kind==='r2-put').key,OBJECT);
});
test('same-key READY replay succeeds without second upload; pending and cross-owner deny',async()=>{
 log=[];const ok=await run({db:fakeDb({reserved:0})});
 assert.equal(ok.status,200);
 assert.equal(ok.body.alreadyUploaded,true);
 assert.equal(log.some(v=>v.kind==='r2-put'),false);
 for(const readback of [null,{fileId:FILE,state:'PENDING'},{fileId:'wrong',state:'READY'}]){
  log=[];const result=await run({db:fakeDb({reserved:0,readback})});
  assert.equal(result.status,409);
  assert.equal(log.some(v=>v.kind==='r2-put'),false);
 }
});
test('ambiguous DB and R2 failure never return a ready file',async()=>{
 for(const options of [{reserved:null},{reserved:2},{reserved:0,readback:null},
   {finalized:0},{broken:true}]){
  const x=await run({db:fakeDb(options)});
  assert.equal(x.body.fileReady,false);
 }
 for(const bucket of [fakeR2({nullResult:true}),fakeR2({throw:true})]){
  const x=await run({bucket});
  assert.equal(x.status,503);
  assert.equal(x.body.fileReady,false);
 }
});
test('invalid bearer, scope, MIME or secret cannot create private object',async()=>{
 for(const change of [{token:'bad'},{draftId:'bad'},{itemId:'bad'},
   {requestKey:'bad'},{contentType:'image/jpeg'},{secret:'weak'}]){
  log=[];const x=await run(change);
  assert.notEqual(x.status,201);
  assert.equal(log.some(y=>y.kind==='r2-put'),false);
 }
});
test('HTTP gate rejects OFF, bad origin, missing bucket, method and body size',async()=>{
 for(const [req,config,status] of [
  [request(),{TRENDOS_CUSTOMER_NATIVE_DRAFT_FILE_R2_V0_ENABLED:undefined},503],
  [request(png,{Origin:'https://evil.invalid'}),{},403],
  [request(png,{},'GET'),{},405],
  [request(),{CUSTOMER_DRAFT_FILES_BUCKET:null},503],
  [request(png,{Authorization:'Bearer bad'}),{},401],
  [request(png,{'x-idempotency-key':'bad'}),{},400],
  [request(png,{'content-type':'image/svg+xml'}),{},415],
  [request(png,{'content-type':'application/pdf'}),{},415],
  [request(new Uint8Array(CUSTOMER_NATIVE_FILE_MAX_BYTES_V0+1)),{},413]
 ]){
  log=[];const x=await handleNativeCustomerDraftFileR2V0(req,env(config));
  assert.equal(x.status,status);
  assert.equal(log.some(y=>y.kind==='r2-put'),false);
  assert.equal(x.headers.get('cache-control'),'no-store');
 }
});
test('successful HTTP returns private file ID only, no object key/PII',async()=>{
 const resp=await handleNativeCustomerDraftFileR2V0(request(),env());
 assert.equal(resp.status,201);
 const body=await resp.json();
 assert.equal(body.success,true);assert.equal(body.privateObject,true);
 assert.equal(JSON.stringify(body).includes('customer-drafts/'),false);
 assert.equal(JSON.stringify(body).includes(SECRET),false);
});
