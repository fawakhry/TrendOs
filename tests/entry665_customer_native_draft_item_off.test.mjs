import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  addNativeCustomerDraftItemV0,handleNativeCustomerDraftItemV0,
  nativeDraftItemPayloadMacV0,newNativeDraftItemIdV0,
  NATIVE_DRAFT_ITEM_INSERT_SQL_V0,NATIVE_DRAFT_ITEM_READBACK_SQL_V0,
  NATIVE_DRAFT_ITEM_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-native-draft-item-v0.mjs';
import {fingerprintCustomerSessionV0} from '../cloudflare-d1/src/customer-portal-native-orders-v0.mjs';
const TOKEN='ab'.repeat(32),SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const NOW=1800000000000,ORIGIN='https://customer.fake.test';
const DRAFT_ID='CDR-'+'22'.repeat(16),KEY='ef'.repeat(16),ITEM_ID='CDI-'+'33'.repeat(16);
const random={getRandomValues(a){a.fill(51);return a;}};
const fields={draftId:DRAFT_ID,requestKey:KEY,department:'طباعة',
  itemName:'مج طباعة تجريبي',qty:2,notes:'بدون بيانات عميل',
  heatPress:false,flyPrint:true};
let hits=[];
function db(changes=1,existing={itemId:ITEM_ID,ordinal:1},broken=false){
  return{prepare(sql){
    const mode=sql.includes('INSERT OR IGNORE')?'insert':'readback';
    hits.push({mode,phase:'prepare'});
    return{bind(...args){
      hits.push({mode,phase:'bind',args});
      return{
        async run(){if(broken)throw Error('PRIVATE_SQL');return{meta:{changes}};},
        async first(){if(broken)throw Error('PRIVATE_SQL');return existing;}
      };
    }};
  }};
}
const run=(overrides={},storage=db())=>addNativeCustomerDraftItemV0({
  ...fields,db:storage,secret:SECRET,token:TOKEN,nowMs:NOW,random,...overrides
});
const req=(obj={requestKey:KEY,department:'طباعة',itemName:'مج طباعة تجريبي',
 qty:2,notes:'بدون بيانات عميل',heatPress:false,flyPrint:true},
 headers={},method='POST')=>new Request(
 'https://api.fake.invalid/v1/customer/native/drafts/'+DRAFT_ID+'/items',
 {method,headers:{Origin:ORIGIN,Authorization:'Bearer '+TOKEN,
   'content-type':'application/json',...headers},
  ...(method==='POST'?{body:typeof obj==='string'?obj:JSON.stringify(obj)}:{})}
);
const env=(extra={})=>({DB:db(),CORS_ORIGINS:ORIGIN,
 TRENDOS_CUSTOMER_NATIVE_DRAFT_ITEM_V0_ENABLED:'true',
 TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET:SECRET,...extra});
test('item staging is default OFF; no live Worker or official order/finance schema',()=>{
 assert.equal(NATIVE_DRAFT_ITEM_POLICY_V0.workerEntryWired,false);
 assert.equal(NATIVE_DRAFT_ITEM_POLICY_V0.productionRelease,'NO_GO');
 assert.equal(NATIVE_DRAFT_ITEM_POLICY_V0.officialOrderCreation,false);
 const src=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(src,/customer-portal-native-draft-item-v0\.mjs/);
 const ddl=readFileSync('cloudflare-d1/migrations/0037_customer_portal_native_draft_items_v1.sql','utf8');
 const statements=ddl.split('\n').filter(x=>!/^\s*--/.test(x)).join('\n');
 assert.match(statements,/CREATE TABLE IF NOT EXISTS customer_portal_native_draft_items_v1/);
 assert.doesNotMatch(statements,/INSERT INTO t12_prod_orders|UPDATE t12_prod_orders/i);
 assert.equal(newNativeDraftItemIdV0(random),ITEM_ID);
});
test('new item binds HMAC auth + content digest; server assigns ordinal no client writes',async()=>{
 hits=[];const x=await run();
 assert.equal(x.status,201);assert.equal(x.body.itemId,ITEM_ID);
 assert.equal(x.body.officialOrderCreated,false);
 const auth=await fingerprintCustomerSessionV0(TOKEN,SECRET);
 const mac=await nativeDraftItemPayloadMacV0(fields,SECRET);
 const insert=hits.find(x=>x.mode==='insert'&&x.phase==='bind');
 assert.deepEqual(insert.args,[
   ITEM_ID,KEY,mac,'طباعة','مج طباعة تجريبي',2,
   'بدون بيانات عميل',0,1,NOW,DRAFT_ID,auth,NOW,NOW
 ]);
 const read=hits.find(x=>x.mode==='readback'&&x.phase==='bind');
 assert.deepEqual(read.args,[KEY,DRAFT_ID,mac,auth,NOW,NOW]);
 assert.match(NATIVE_DRAFT_ITEM_INSERT_SQL_V0,/d\.state='DRAFT'/);
 assert.match(NATIVE_DRAFT_ITEM_INSERT_SQL_V0,/s\.session_version=a\.session_version/);
 assert.match(NATIVE_DRAFT_ITEM_READBACK_SQL_V0,/i\.payload_mac_hex=\?/);
 assert.doesNotMatch(JSON.stringify(x),/FAKE-only|customerId|phone|notes|price/);
});
test('same key and content is idempotent; replay different content or owner denied',async()=>{
 let x=await run({},db(0));
 assert.equal(x.status,200);assert.equal(x.body.alreadyAdded,true);
 x=await run({},db(0,null));
 assert.equal(x.status,409);assert.equal(JSON.stringify(x).includes(ITEM_ID),false);
 x=await run({},db(null));
 assert.equal(x.status,503);
 x=await run({},db(1,{itemId:'wrong',ordinal:1}));
 assert.equal(x.status,409);
});
test('invalid qty, size, department, flags and supplied customer fields reject',async()=>{
 const cases=[
   {qty:0},{qty:100},{qty:1.5},{department:'حسابات'},
   {department:'ليزر',heatPress:true},
   {department:'ليزر',flyPrint:true},
   {itemName:''},{itemName:'x'.repeat(121)},
   {notes:'x'.repeat(1001)},{requestKey:'wrong'},
   {draftId:'other-draft'},{heatPress:'true'}
 ];
 for(const change of cases){
   hits=[];const x=await run(change);assert.equal(x.status,400,JSON.stringify(change).slice(0,80));
   assert.equal(hits.length,0);
 }
 const wrong=await handleNativeCustomerDraftItemV0(req({...fields,customerId:'FAKE-C2'}),env());
 assert.equal(wrong.status,400);
});
test('default OFF, disallowed origin/method/invalid bearer and oversized JSON are denied before D1',async()=>{
 hits=[];
 let resp=await handleNativeCustomerDraftItemV0(req(),env({
   TRENDOS_CUSTOMER_NATIVE_DRAFT_ITEM_V0_ENABLED:undefined
 }));
 assert.equal(resp.status,503);assert.equal(hits.length,0);
 resp=await handleNativeCustomerDraftItemV0(req({}, {Origin:'https://bad.invalid'}),env());
 assert.equal(resp.status,403);
 resp=await handleNativeCustomerDraftItemV0(req({}, {},'GET'),env());
 assert.equal(resp.status,405);
 resp=await handleNativeCustomerDraftItemV0(req({}, {Authorization:'Bearer bad'}),env());
 assert.equal(resp.status,401);
 const oversized=JSON.stringify({
   requestKey:KEY,department:'طباعة',itemName:'y',
   qty:1,notes:'x'.repeat(1700),heatPress:false,flyPrint:false
 });
 resp=await handleNativeCustomerDraftItemV0(req(oversized),env());
 assert.equal(resp.status,400);assert.equal(hits.length,0);
});
test('POST plain item returns safe id only, no files and no production status',async()=>{
 hits=[];
 const resp=await handleNativeCustomerDraftItemV0(req(),env());
 assert.equal(resp.status,201);
 assert.equal(resp.headers.get('cache-control'),'no-store');
 const data=await resp.json();
 assert.equal(data.success,true);
 assert.equal(data.itemId,ITEM_ID);
 assert.deepEqual(Object.keys(data).sort(),[
  'success','source','version','itemId','ordinal','alreadyAdded','officialOrderCreated'
 ].sort());
});
