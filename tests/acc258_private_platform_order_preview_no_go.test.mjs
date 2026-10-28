import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../cloudflare-d1/easystore-finance-stage/trendos-platform-order-preview-acc258.mjs';
import {
 VERSION,PATH,DOMAIN,POLICY,sign,verify,validRequest,validReply,
 readPrivatePreviewIsolated
} from '../cloudflare-d1/src/t12-platform-order-private-preview-acc258.mjs';
import {
 ACC257_PLATFORM_ORDER_SQL as ORDER,ACC257_PLATFORM_LINES_SQL as LINES,
 ACC257_PLATFORM_ACTIVITY_SQL as ACTIVITY,ACC257_PLATFORM_OUTBOX_SQL as OUTBOX,
 ACC257_PLATFORM_RUNTIME_SQL as RUNTIME
} from '../cloudflare-d1/src/t12-platform-order-context-readonly-acc257.mjs';
import {signBody as signAcc251} from '../cloudflare-d1/src/accounting-original-order-context-v1.mjs';

const SECRET='fake-isolated-acc258-dedicated-secret-never-install-production';
const ID='4323',KEY='cld1_FAKE_258',AT='2026-09-21 14:13:20';
const headers={'content-type':'application/json'};
function mockDb({cancelled=false,broken=false}={}){
 let reads=0;
 const values=new Map([
  [ORDER,[{orderId:ID,requestKey:KEY,orderActor:'fake-employee',
   orderStatus:'طلب جديد',orderCreatedAt:AT,
   ledgerOrderId:ID,ledgerRequestKey:KEY,ledgerActor:'fake-employee',
   ledgerStatus:'COMMITTED',ledgerCreatedAt:AT}]],
  [LINES,[{lineId:ID+'-01',orderId:ID,requestKey:KEY,ordinal:1,
   department:'طباعة',assignedTo:'وائل',lineStatus:'طلب جديد',lineCreatedAt:AT},
   {lineId:ID+'-02',orderId:ID,requestKey:KEY,ordinal:2,
   department:'ليزر',assignedTo:'جابر',lineStatus:'طلب جديد',lineCreatedAt:AT}]],
  [ACTIVITY,[{eventKey:'activity',requestKey:KEY,orderId:ID,
   eventType:'order-create',activityCreatedAt:AT}]],
  [OUTBOX,[{eventKey:'queue:01',requestKey:KEY,orderId:ID,
   lineId:ID+'-01',eventType:'trend-master-status-intent',
   deliveryStatus:'pending',outboxCreatedAt:AT},
   {eventKey:'queue:02',requestKey:KEY,orderId:ID,
   lineId:ID+'-02',eventType:'trend-master-status-intent',
   deliveryStatus:'done',outboxCreatedAt:AT}]],
  [RUNTIME,[{lineId:ID+'-01',orderId:ID,runtimeStatus:null,
   runtimeActor:null,runtimeVersion:null,runtimeEventCount:0,
   lastEventType:null,lastEventStatus:null,lastEventActor:null},
   {lineId:ID+'-02',orderId:ID,runtimeStatus:cancelled?'ملغى':null,
   runtimeActor:cancelled?'fake-gaber':null,
   runtimeVersion:cancelled?1:null,runtimeEventCount:cancelled?1:0,
   lastEventType:cancelled?'line-update':null,
   lastEventStatus:cancelled?'ملغى':null,
   lastEventActor:cancelled?'fake-gaber':null}]]
 ]);
 const db={
  prepare(sql){assert.ok(values.has(sql),'ACC258 may read only 5 existing native T12 queries');
   return {bind(orderId){assert.equal(orderId,ID);return {sql}}}},
  async batch(stmts){reads++;if(broken)throw Error('private-cloud-error');
   return stmts.map(x=>({success:true,results:values.get(x.sql)}))}
 };
 return {db,reads:()=>reads};
}
const envFor=db=>({
 DB:db,TRENDOS_PLATFORM_ORDER_PREVIEW_MODE:'ISOLATED_SOURCE_ONLY',
 TRENDOS_PLATFORM_ORDER_PREVIEW_HMAC:SECRET
});
const request=(q,signature)=>new Request('https://internal.invalid'+PATH,{
 method:'POST',headers:{...headers,'x-acc258-signature':signature},
 body:JSON.stringify(q)
});
const fresh=()=>({version:VERSION,orderId:ID,issuedAt:Date.now(),nonce:crypto.randomUUID()});
async function run(db,q=fresh(),secret=SECRET){
 const body=JSON.stringify(q),sig=await sign(secret,body);
 return worker.fetch(request(q,sig),envFor(db));
}
test('ACC258 HMAC is dedicated, domain-separated and fails closed',async()=>{
 const raw=JSON.stringify(fresh());
 const sig=await sign(SECRET,raw);
 assert.equal(await verify(SECRET,raw,sig),true);
 assert.equal(await verify(SECRET,raw+' ',sig),false);
 assert.equal(await verify(SECRET+'x',raw,sig),false);
 assert.equal(await verify(SECRET,raw,await signAcc251(SECRET,raw)),false);
 assert.equal(DOMAIN.includes('PREVIEW_ONLY'),true);
 await assert.rejects(()=>sign('too-short',raw));
 assert.equal(POLICY.invoicePostingAllowed,false);
});
test('ACC258 signed native T12 preview uses exact original 5 SELECT; never PII nor financial authority',async()=>{
 const fixture=mockDb();
 const r=await run(fixture.db);
 assert.equal(r.status,200);
 const body=await r.text(),view=JSON.parse(body);
 assert.equal(await verify(SECRET,body,r.headers.get('x-acc258-signature')),true);
 assert.equal(validReply(view,{version:VERSION,orderId:ID,
  issuedAt:view.issuedAt,nonce:view.nonce}),true);
 assert.equal(view.sourceContextId,'trendos_t12_native:order:4323');
 assert.deepEqual(view.lines.map(x=>x.lineId),['4323-01','4323-02']);
 assert.equal(view.customerOwnershipAttested,false);
 assert.equal(view.realSignedLineApprovalsVerified,false);
 assert.equal(view.canRequestInvoice,false);
 assert.equal(view.financeAuthorized,false);
 assert.equal(view.posted,false);
 assert.equal(view.productionRelease,'NO_GO');
 assert.match(view.snapshotId,/^[0-9a-f]{64}$/);
 assert.equal(Object.keys(view).some(k=>/customer|phone|invoice/i.test(k)&&k!=='customerOwnershipAttested'&&k!=='canRequestInvoice'),false);
 assert.equal(JSON.stringify(view).includes('customerName'),false);
 assert.equal(fixture.reads(),1);
});
test('ACC258 independently signed private client, repeatable source snapshot id, no finance inbox',async()=>{
 const fixture=mockDb(),env=envFor(fixture.db);
 const client={...env,TRENDOS_PLATFORM_ORDER_PREVIEW:{
   fetch:req=>worker.fetch(req,env)
 }};
 const a=await readPrivatePreviewIsolated(client,ID);
 const b=await readPrivatePreviewIsolated(client,ID);
 assert.equal(a.sourceContextId,b.sourceContextId);
 assert.equal(a.snapshotId,b.snapshotId);
 assert.equal(a.financeAuthorized,false);
 assert.equal(fixture.reads(),2);
 await assert.rejects(()=>readPrivatePreviewIsolated({...client,TRENDOS_PLATFORM_ORDER_PREVIEW_MODE:'OFF'},ID),/OFF/);
 await assert.rejects(()=>readPrivatePreviewIsolated(client,'legacy-sheet-row'),/INVALID/);
});
test('ACC258 refuses unsigned, replay-expired, wrong method, unexpected fields or invalid order',async()=>{
 const fixture=mockDb(),q=fresh();
 assert.equal(validRequest({...q,customerId:'fake'}),false);
 assert.equal((await worker.fetch(new Request('https://internal.invalid'+PATH,{method:'GET'}),envFor(fixture.db))).status,405);
 assert.equal((await worker.fetch(request(q,'0'.repeat(64)),envFor(fixture.db))).status,401);
 assert.equal((await run(fixture.db,{...q,issuedAt:Date.now()-300000})).status,400);
 assert.equal((await run(fixture.db,{...q,customerId:'spoof'})).status,400);
 assert.equal((await run(fixture.db,{...q,orderId:'not-native'})).status,400);
 assert.equal(fixture.reads(),0);
});
test('ACC258 hard OFF, mismatched secret, broken DB and canceled native runtime never expose preview',async()=>{
 const fixture=mockDb(),q=fresh();
 assert.equal((await worker.fetch(request(q,await sign(SECRET,JSON.stringify(q))),{
  ...envFor(fixture.db),TRENDOS_PLATFORM_ORDER_PREVIEW_MODE:'OFF'})).status,503);
 assert.equal((await run(mockDb({cancelled:true}).db)).status,409);
 assert.equal((await run(mockDb({broken:true}).db)).status,409);
 const e=envFor(fixture.db);e.TRENDOS_PLATFORM_ORDER_PREVIEW_HMAC='wrong-but-long-enough-secret-01234567';
 const reply=await worker.fetch(request(q,await sign(SECRET,JSON.stringify(q))),e);
 assert.equal(reply.status,401);
});
test('ACC258 response validator rejects finance grants, customer IDs and omitted revisions',async()=>{
 const f=mockDb(),q=fresh(),r=await run(f.db,q),v=await r.json();
 assert.equal(validReply(v,q),true);
 for(const altered of [
  {...v,customerId:'fake'},
  {...v,financeAuthorized:true},
  {...v,realSignedLineApprovalsVerified:true},
  {...v,canRequestInvoice:true},
  {...v,productionRelease:'GO'},
  {...v,sourceSystem:'sheet_rows'},
  {...v,operationalRevision:{lineVersions:[]}}
 ])assert.equal(validReply(altered,q),false);
});
test('ACC258 is intentionally unimported and unconfigured for production',()=>{
 const main=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.equal(main.includes('t12-platform-order-private-preview-acc258'),false);
 assert.equal(main.includes('trendos-platform-order-preview-acc258'),false);
 assert.equal(POLICY.financialWritesAllowed,false);
 for(const s of [ORDER,LINES,ACTIVITY,OUTBOX,RUNTIME])
  assert.doesNotMatch(s,/\bsheet_rows\b|\borders\b|t12_customers|customer_name|customer_phone/i);
});
