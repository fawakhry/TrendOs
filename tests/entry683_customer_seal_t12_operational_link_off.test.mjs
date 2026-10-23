import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 inspectSealedCustomerDraftT12LinkV0 as inspect,
 CUSTOMER_SEAL_T12_LINK_POLICY_V0 as POLICY,
 CUSTOMER_SEAL_T12_LINK_SEAL_SQL_V0 as SEAL,
 CUSTOMER_SEAL_T12_LINK_ORDER_SQL_V0 as ORDER,
 CUSTOMER_SEAL_T12_LINK_LINES_SQL_V0 as LINES
} from '../cloudflare-d1/src/customer-portal-native-seal-t12-link-read-v0.mjs';
const D='CDR-'+'22'.repeat(16),ORDER_ID='FAKE-ORDER-981';
const SNAP=['ENTRY682_CUSTOMER_DRAFT_SEAL_V1',D,'C1','عميل وهمي','01012345678',1800000000000,
 [['CDI-'+'33'.repeat(16),1,'طباعة','FAKE PRINTER ITEM',1,'',0,0]],[]];
const KEY='cld1_1800000000000_'+D.slice(4);
const seal={draftId:D,customerId:'C1',requestKey:KEY,snapshotJson:JSON.stringify(SNAP),
 stage:'SEALED',draftCustomerId:'C1',draftCreatedAtMs:1800000000000};
const order={requestKey:KEY,ledgerOrderId:ORDER_ID,ledgerStatus:'COMMITTED',
 ledgerActor:'signed-stage-actor',orderId:ORDER_ID,orderRequestKey:KEY,
 orderCustomerName:SNAP[3],orderPhone:SNAP[4],orderDepartment:'طباعة',
 orderNotes:'',orderSource:'customer-native-draft',orderActor:'signed-stage-actor',
 orderCustomerMode:'registered',orderStatus:'طلب جديد'};
const line={lineId:ORDER_ID+'-01',orderId:ORDER_ID,requestKey:KEY,ordinal:1,
 department:'طباعة',itemName:'FAKE PRINTER ITEM',qty:1,heatPress:0,
 flyPrint:0,status:'طلب جديد'};
let calls=[];
function db({sealRow=seal,orderRow=order,lines=[line],partial=false,thrown=false}={}){
 return{
  prepare(sql){
   const kind=sql===SEAL?'seal':sql===ORDER?'order':sql===LINES?'lines':'unknown';
   calls.push('prepare:'+kind);
   return{bind(id){calls.push('bind:'+kind+':'+id);return{kind,
    async first(){throw Error('NON_TRANSACTIONAL_FIRST_FORBIDDEN');},
    async all(){throw Error('NON_TRANSACTIONAL_ALL_FORBIDDEN');}
   };}};
  },
  async batch(items){
   calls.push('batch:'+items.length);
   if(thrown)throw Error('PRIVATE_SCHEMA');
   if(partial)return[{success:true,results:[]},{success:false,results:[]},{success:true,results:[]}];
   return items.map(x=>({success:true,results:x.kind==='seal'?(sealRow?[sealRow]:[]):
    x.kind==='order'?(orderRow?[orderRow]:[]):lines}));
  }
 };
}
const run=(d=db(),opts={})=>inspect({db:d,draftId:D,...opts});
test('no route, new writer, invoice, finance D1 access or arbitrary posted event',()=>{
 const worker=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 const src=readFileSync('cloudflare-d1/src/customer-portal-native-seal-t12-link-read-v0.mjs','utf8');
 assert.doesNotMatch(worker,/customer-portal-native-seal-t12-link-read-v0/);
 assert.doesNotMatch(src,/createT12GeneralOrder\s*\(|INSERT INTO|UPDATE\s+t12_|saveAccountingFinalInvoice\s*\(|fetch\s*\(/);
 assert.equal(POLICY.workerEntryWired,false);
 assert.equal(POLICY.httpRouteAvailable,false);
 assert.equal(POLICY.financeConnectorPost,false);
 assert.equal(POLICY.directAccountingD1Access,false);
 assert.equal(POLICY.productionRelease,'NO_GO');
});
test('one transaction finds immutable sealed draft, COMMITTED canonical T12 and one exact line, never financial owner',async()=>{
 calls=[];
 const r=await run();
 assert.equal(r.status,200);
 assert.equal(r.body.operationallyLinked,true);
 assert.equal(r.body.customerOwnerAttested,false);
 assert.equal(r.body.financeAuthorized,false);
 assert.equal(r.body.invoiceAuthorized,false);
 assert.equal(r.body.connectorEventPublished,false);
 assert.equal(r.body.orderId,ORDER_ID);
 assert.deepEqual(r.body.lineIds,[ORDER_ID+'-01']);
 assert.deepEqual(calls.filter(x=>x.startsWith('prepare:')),['prepare:seal','prepare:order','prepare:lines']);
 assert.deepEqual(calls.filter(x=>x.startsWith('batch:')),['batch:3']);
 assert.equal(JSON.stringify(r).includes(SNAP[3]),false);
 assert.equal(JSON.stringify(r).includes(SNAP[4]),false);
 assert.equal(JSON.stringify(r).includes('customer-drafts'),false);
});
test('missing seal, unsealed/wrong owner and tampered canonical request fail closed',async()=>{
 for(const row of [null,{...seal,stage:'DRAFT'},{...seal,customerId:'C2'},
  {...seal,requestKey:'cld1_forged'}, {...seal,draftCreatedAtMs:1800000000001},
  {...seal,snapshotJson:'not-json'}, {...seal,snapshotJson:JSON.stringify([...SNAP.slice(0,2),'C2',...SNAP.slice(3)])}]){
  const r=await run(db({sealRow:row}));assert.notEqual(r.status,200);
  assert.equal(r.body.financeAuthorized,false);
 }
});
test('PREPARED, absent, forged and noncanonical orders never create new order',async()=>{
 for(const row of [null,{...order,ledgerStatus:'PREPARED'},{...order,ledgerStatus:'PENDING'},
  {...order,orderId:'DIFFERENT'}, {...order,ledgerActor:'OTHER'},
  {...order,orderSource:'legacy'}, {...order,orderCustomerName:'انتحال'},
  {...order,orderPhone:'01000000000'}, {...order,orderNotes:'changed'},
  {...order,orderCustomerMode:'new'}, {...order,orderStatus:'مدفوع'}]){
  const r=await run(db({orderRow:row}));assert.notEqual(r.status,200);
  assert.equal(r.body.orderCreated,false);
 }
});
test('no second independent line, missing line, changed department/items/qty/flags',async()=>{
 for(const rows of [[],[line,line],[line,{...line,lineId:'FAKE-2'}],
  [{...line,itemName:'OTHER'}],[{...line,qty:2}],[{...line,heatPress:1}],
  [{...line,flyPrint:1}],[{...line,department:'ليزر'}],
  [{...line,lineId:'DIFFERENT'}],[{...line,requestKey:'other'}]]){
  const r=await run(db({lines:rows}));assert.notEqual(r.status,200);
 }
});
test('multi-item and any READY R2 file never get silently dropped into T12',async()=>{
 const extra=[...SNAP.slice(0,6),[...SNAP[6],['CDI-'+'44'.repeat(16),2,'ليزر','FAKE LASER',1,'',0,0]],[]];
 const attached=[...SNAP.slice(0,7),[['CDF-'+'55'.repeat(16)]]];
 for(const snap of [extra,attached]){
  const r=await run(db({sealRow:{...seal,snapshotJson:JSON.stringify(snap)}}));
  assert.equal(r.body.code,'T12_MULTI_ITEM_OR_R2_HANDOFF_NOT_SUPPORTED');
 }
});
test('missing batch/partial failed SQL/invalid caller results fail shut without private error',async()=>{
 let x=db();delete x.batch;
 assert.equal((await run(x)).status,503);
 assert.equal((await run(db({partial:true}))).status,503);
 const err=await run(db({thrown:true}));
 assert.equal(err.status,503);assert.doesNotMatch(JSON.stringify(err),/PRIVATE_SCHEMA/);
 assert.equal((await run(db(),{draftId:'CUSTOMER-PII'})).status,400);
});
