import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectNativeCustomerDraftHandoffManifestV0 as inspect,
 CUSTOMER_DRAFT_HANDOFF_FILES_SQL_V0 as FILE_SQL,
 CUSTOMER_DRAFT_HANDOFF_MANIFEST_POLICY_V0 as POLICY} from
 '../cloudflare-d1/src/customer-portal-native-handoff-manifest-v0.mjs';
const NOW=1800000000000;
const TOKEN='ab'.repeat(32),SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const DRAFT='CDR-'+'22'.repeat(16),IT1='CDI-'+'33'.repeat(16),IT2='CDI-'+'44'.repeat(16);
const FILE='CDF-'+'66'.repeat(16);
const owner={draftId:DRAFT,createdAtMs:NOW-10000,customerId:'C1',
 customerName:'عميل وهمي',customerPhone:'01012345678'};
const items=[
 {itemId:IT1,ordinal:1,department:'طباعة',itemName:'مج طباعة',qty:2,notes:'note',heatPress:1,flyPrint:1},
 {itemId:IT2,ordinal:2,department:'ليزر',itemName:'قطعة ليزر',qty:1,notes:'',heatPress:0,flyPrint:0}
];
const file={fileId:FILE,draftId:DRAFT,itemId:IT1,customerId:'C1',
 fileState:'READY',contentType:'image/png',byteSize:1024,
 sha256Hex:'a'.repeat(64),objectKey:'customer-drafts/'+FILE,
 createdAtMs:NOW-10000,updatedAtMs:NOW-5000};
let queries=[];
function fake({account=owner,lines=items,attachments=[file],
 broken=false,invalidBatch=false}={}){
 return{prepare(sql){
  const kind=sql.includes('SELECT d.draft_id AS draftId')?'owner':
   sql===FILE_SQL?'files':'items';
  queries.push({kind,phase:'prepare'});
  return{bind(...args){queries.push({kind,phase:'bind',args});return{
   kind,
   async first(){throw Error('NON_TRANSACTIONAL_FIRST_FORBIDDEN');},
   async all(){throw Error('NON_TRANSACTIONAL_ALL_FORBIDDEN');}
  }}};
 },
 async batch(stmts){
  queries.push({kind:'transaction',phase:'batch',count:stmts.length});
  if(broken)throw Error('PRIVATE_SCHEMA');
  if(invalidBatch)return[{success:true,results:[account]},{success:false,results:lines},
    {success:true,results:attachments}];
  return stmts.map(s=>({success:true,results:
    s.kind==='owner'?(account?[account]:[]):
    s.kind==='items'?lines:attachments}));
 }};
}
const run=(fixture=fake(),opts={})=>inspect({db:fixture,token:TOKEN,secret:SECRET,
 draftId:DRAFT,nowMs:NOW,...opts});
test('manifest is never a new route, R2 writer or T12 order writer',()=>{
 const src=readFileSync('cloudflare-d1/src/customer-portal-native-handoff-manifest-v0.mjs','utf8');
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(worker,/customer-portal-native-handoff-manifest-v0/);
 assert.doesNotMatch(src,/APPS_SCRIPT_API_URL|fetch\s*\(/);
 assert.doesNotMatch(src,/createT12GeneralOrder\s*\(|\bINSERT INTO\b|\bUPDATE\s+customer_portal_native/);
 assert.match(FILE_SQL,/LIMIT 251/);
 assert.equal(POLICY.httpRouteAvailable,false);
 assert.equal(POLICY.manifestPersisted,false);
 assert.equal(POLICY.crossReadAtomic,true);
 assert.equal(POLICY.readOnlyD1Batch,true);
 assert.equal(POLICY.immutableSnapshot,false);
});
test('all 2 independent lines and READY R2 metadata represented without exposing PII',async()=>{
 queries=[];
 const x=await run();
 assert.equal(x.status,200);
 assert.equal(x.body.itemCount,2);
 assert.equal(x.body.fileCount,1);
 assert.match(x.body.manifestDigest,/^[a-f0-9]{64}$/);
 assert.equal(x.body.handoffReady,false);
 assert.equal(x.body.snapshotSealed,false);
 assert.equal(x.body.officialOrderCreated,false);
 assert.deepEqual(queries.filter(x=>x.phase==='prepare').map(x=>x.kind),
   ['owner','items','files']);
 assert.equal(queries.filter(x=>x.phase==='batch').length,1);
 assert.equal(queries.filter(x=>x.phase==='batch')[0].count,3);
 assert.equal(queries.filter(x=>x.phase==='bind').at(-1).args[0],DRAFT);
 assert.equal(x.body.transactionalReadBatch,true);
 assert.equal(x.body.atomicConsistencyVerified,false);
 for(const leak of ['C1','عميل وهمي','01012345678','customer-drafts/',TOKEN,FILE,IT1])
  assert.equal(JSON.stringify(x).includes(leak),false,leak);
 const different=await run(fake({lines:[items[0],{...items[1],qty:2}]}));
 assert.notEqual(different.body.manifestDigest,x.body.manifestDigest);
 const differentFile=await run(fake({attachments:[{...file,sha256Hex:'b'.repeat(64)}]}));
 assert.notEqual(differentFile.body.manifestDigest,x.body.manifestDigest);
});
test('contiguous 1..50 items supported but 51 items denied',async()=>{
 const many=Array.from({length:50},(_,n)=>({...items[0],
  ordinal:n+1,itemId:'CDI-'+(n+1).toString(16).padStart(32,'0')}));
 assert.equal((await run(fake({lines:many,attachments:[]}))).body.itemCount,50);
 const exceeded=await run(fake({lines:[...many,{...items[1],ordinal:51}],attachments:[]}));
 assert.equal(exceeded.status,409);
});
test('missing ordinal, duplicate item ID, invalid quantity and flags fail closed',async()=>{
 for(const lines of [
  [],[items[1]],[items[0],{...items[1],ordinal:3}],
  [items[0],{...items[1],itemId:IT1}],
  [{...items[0],qty:0}],[{...items[1],heatPress:1}],
  [{...items[0],itemName:'bad '}]]){
  queries=[];const r=await run(fake({lines,attachments:[]}));
  assert.equal(r.status,409);
  // D1 transactional batch must stage all 3 SELECTs; invalid items still
  // fail closed before returning a file manifest or digest.
  assert.deepEqual(queries.filter(x=>x.phase==='batch').map(x=>x.count),[3]);
  assert.equal(r.body.manifestDigest,undefined);
 }
});
test('pending, misplaced, wrongly owned, malformed, duplicate files rejected',async()=>{
 for(const attachments of [
  [{...file,fileState:'PENDING'}],[{...file,customerId:'C2'}],
  [{...file,itemId:'CDI-'+'99'.repeat(16)}],
  [{...file,objectKey:'public/'+FILE}],[{...file,sha256Hex:'bAD'}],
  [{...file,contentType:'text/plain'}],[file,file],
  Array.from({length:6},(_,n)=>({...file,
   fileId:'CDF-'+(n+1).toString(16).padStart(32,'0'),
   objectKey:'customer-drafts/CDF-'+(n+1).toString(16).padStart(32,'0')})),
  Array.from({length:251},(_,n)=>({...file,
   fileId:'CDF-'+(n+1).toString(16).padStart(32,'0'),
   objectKey:'customer-drafts/CDF-'+(n+1).toString(16).padStart(32,'0')}))
 ]){
  const r=await run(fake({attachments}));
  assert.equal(r.status,409);
  assert.equal(r.body.handoffReady,false);
 }
});
test('fail closed if adapter lacks D1 batch or a batch query did not succeed',async()=>{
 const without=fake();delete without.batch;
 const missing=await run(without);
 assert.equal(missing.status,503);
 assert.equal(missing.body.manifestDigest,undefined);
 const partial=await run(fake({invalidBatch:true}));
 assert.equal(partial.status,503);
 assert.equal(partial.body.code,'MANIFEST_READ_TRANSACTION_NOT_VERIFIED');
 assert.equal(partial.body.snapshotSealed,false);
});
test('D1 batch must replace all independent first/all SELECT calls',async()=>{
 queries=[];
 const x=await run(fake());
 assert.equal(x.body.transactionalReadBatch,true);
 assert.deepEqual(queries.filter(y=>y.phase==='batch').map(y=>y.count),[3]);
});
test('owner/session expiry, no DB, read errors never produce a digest',async()=>{
 for(const x of [
  await run(fake({account:null})),
  await run(fake({account:{...owner,customerId:''}})),
  await run(fake({broken:true})),
  await run(fake(),{token:'wrong'}),
  await run(fake(),{db:null}),
  await run(fake(),{draftId:'bad'})
 ]){
  assert.equal(x.body.success,false);
  assert.equal(x.body.manifestDigest,undefined);
  assert.equal(x.body.officialOrderCreated,false);
  assert.doesNotMatch(JSON.stringify(x),/PRIVATE_SCHEMA/);
 }
});
