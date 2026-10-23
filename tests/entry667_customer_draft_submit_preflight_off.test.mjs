import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 preflightNativeCustomerDraftSubmitV0,
 CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0,
 CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0,
 CUSTOMER_DRAFT_SUBMIT_FILES_SQL_V0,
 CUSTOMER_DRAFT_SUBMIT_EXISTING_T12_REQUEST_SQL_V0,
 CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-native-submit-preflight-v0.mjs';

const TOKEN='ab'.repeat(32),SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const DRAFT='CDR-'+'22'.repeat(16),ITEM='CDI-'+'33'.repeat(16),NOW=1800000000000;
const owner={draftId:DRAFT,createdAtMs:NOW-60000,draftState:'DRAFT',
 customerId:'C1',customerName:'عميل وهمي',customerPhone:'01012345678',customerSource:'cloud-native'};
const lines=[{itemId:ITEM,ordinal:1,department:'طباعة',itemName:'مج طباعة',qty:2,
 notes:'',heatPress:0,flyPrint:0}];
let calls=[];
function fake({account=owner,items=lines,files={fileCount:0,notReady:0},
 prior=null,broken=false,invalidBatch=false}={}){
 return{prepare(sql){
  const kind=sql.includes('SELECT d.draft_id AS draftId')?'scope':
    sql.includes('SELECT i.item_id AS itemId')?'items':
    sql.includes('FROM t12_prod_request_ledger')?'ledger':'files';
  calls.push({kind,phase:'prepare'});
  return{bind(...args){calls.push({kind,phase:'bind',args});return{
   kind,
   async first(){throw Error('NON_TRANSACTIONAL_FIRST_FORBIDDEN');},
   async all(){throw Error('NON_TRANSACTIONAL_ALL_FORBIDDEN');}
  }};
 }},
 async batch(stmts){
  calls.push({kind:'transaction',phase:'batch',count:stmts.length});
  if(broken)throw Error('FAKE_PRIVATE_SQL');
  if(invalidBatch)return [{success:true,results:[account]},{success:false,results:items},
   {success:true,results:[files]},{success:true,results:[]}];
  return stmts.map(s=>({success:true,results:
   s.kind==='scope'?(account?[account]:[]):
   s.kind==='items'?items:s.kind==='files'?[files]:prior?[prior]:[]}));
 }};
}
const run=(db=fake(),options={})=>preflightNativeCustomerDraftSubmitV0({
 db,token:TOKEN,secret:SECRET,draftId:DRAFT,nowMs:NOW,...options
});
test('no separate official order writer, no new order or customer HTTP route',()=>{
 const index=readFileSync('cloudflare-d1/src/index_v2.js','utf8');
 assert.doesNotMatch(index,/customer-portal-native-submit-preflight-v0/);
 const source=readFileSync('cloudflare-d1/src/customer-portal-native-submit-preflight-v0.mjs','utf8');
 const statements=source.split('\n').filter(line=>!/^\s*(?:\*|\/\*|\/\/)/.test(line)).join('\n');
 assert.doesNotMatch(statements,/createT12GeneralOrder\\s*\\(|INSERT INTO t12_prod_orders/);
 assert.match(source,/db\\.batch\\s*\\(/);
 assert.doesNotMatch(source,/APPS_SCRIPT_API_URL|script\.google\.com|fetch\s*\(/);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.officialOrderCreatorCalled,false);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.workerEntryWired,false);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.maxCompatibleItems,1);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.filesAllowed,0);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.readOnlyD1Batch,true);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.productionRelease,'NO_GO');
 for(const sql of [CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0,
  CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0,CUSTOMER_DRAFT_SUBMIT_FILES_SQL_V0,
  CUSTOMER_DRAFT_SUBMIT_EXISTING_T12_REQUEST_SQL_V0])
  assert.match(sql,/SELECT/);
 assert.match(CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0,/s\.session_version=a\.session_version/);
 assert.match(CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0,/ctl\.mode='GENERAL'/);
 assert.match(CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0,/c\.source='cloud-native'/);
});
test('one exact owner-verified eligible item uses canonical T12 without any write',async()=>{
 calls=[];
 const value=await run();
 assert.equal(value.status,200);
 assert.equal(value.body.preflightEligible,true);
 assert.equal(value.body.officialOrderCreated,false);
 assert.equal(value.body.productionWriteAuthorized,false);
 assert.equal(value.body.needsTrustedEmployeeDelegate,true);
 assert.deepEqual(calls.filter(x=>x.phase==='prepare').map(x=>x.kind),['scope','items','files','ledger']);
 assert.equal(calls.filter(x=>x.phase==='bind').length,4);
 assert.deepEqual(calls.filter(x=>x.phase==='batch').map(x=>x.count),[4]);
 assert.equal(value.body.transactionalReadBatch,true);
 assert.equal(value.body.snapshotSealed,false);
 const raw=JSON.stringify(value);
 assert.equal(raw.includes('01012345678'),false);
 assert.equal(raw.includes('عميل وهمي'),false);
 assert.equal(raw.includes('C1'),false);
 assert.equal(raw.includes(TOKEN),false);
});
test('existing T12 request key, whether PREPARED or COMMITTED, always requires trusted reconciliation',async()=>{
 for(const status of ['PREPARED','COMMITTED','UNKNOWN']){
  calls=[];
  const res=await run(fake({prior:{status}}));
  assert.equal(res.status,409);
  assert.equal(res.body.code,'T12_EXISTING_REQUEST_REQUIRES_TRUSTED_RECONCILIATION');
  assert.equal(res.body.officialOrderCreated,false);
  assert.equal(calls.filter(x=>x.kind==='ledger'&&x.phase==='bind').length,1);
  assert.equal(calls.filter(x=>x.kind==='ledger'&&x.phase==='bind')[0].args[0],DRAFT);
  assert.doesNotMatch(JSON.stringify(res),/customerId|requestKey|orderId/);
 }
});
test('short registered phone fails T12 writer identity within the read transaction',async()=>{
 calls=[];
 const res=await run(fake({account:{...owner,customerPhone:'123'}}));
 assert.equal(res.status,409);
 assert.equal(res.body.code,'T12_CUSTOMER_STRONG_IDENTITY_REQUIRED');
 assert.deepEqual(calls.filter(x=>x.phase==='batch').map(x=>x.count),[4]);
});
test('owner and session failures refuse even with four batched reads',async()=>{
 for(const x of [null,{...owner,draftId:'CDR-'+'44'.repeat(16)}]){
  calls=[];const res=await run(fake({account:x}));
  assert.equal(res.status,404);
  assert.deepEqual(calls.filter(v=>v.phase==='batch').map(v=>v.count),[4]);
 }
 assert.equal((await run(fake(),{token:'bad'})).status,401);
 assert.equal((await run(fake(),{draftId:'bad'})).status,400);
 assert.equal((await run(fake(),{secret:'short'})).status,503);
});
test('missing transaction capability or unsuccessful batch fails closed',async()=>{
 const adapter=fake();delete adapter.batch;
 const absent=await run(adapter);
 assert.equal(absent.status,503);
 const partial=await run(fake({invalidBatch:true}));
 assert.equal(partial.status,503);
 assert.equal(partial.body.code,'SUBMIT_PREFLIGHT_TRANSACTION_UNVERIFIED');
 assert.equal(partial.body.officialOrderCreated,false);
 assert.equal(partial.body.preflightEligible,undefined);
});
test('zero, two, or more than two independent items cannot silently submit',async()=>{
 for(const items of [[],[...lines,...lines],[...lines,...lines,...lines]]){
  const x=await run(fake({items}));
  assert.equal(x.status,409);
  assert.equal(x.body.officialOrderCreated,false);
 }
});
test('any attached file including READY refuses T12 handoff, never loses R2 file',async()=>{
 for(const files of [{fileCount:1,notReady:1},{fileCount:1,notReady:0},
  {fileCount:20,notReady:0},{fileCount:null,notReady:null}]){
  const x=await run(fake({files}));
  assert.notEqual(x.status,200);
  assert.equal(x.body.officialOrderCreated,false);
 }
});
test('T12 preflight never silently drops laser print flags or source notes',async()=>{
 for(const item of [
  {...lines[0],department:'ليزر',heatPress:1},
  {...lines[0],department:'ليزر',flyPrint:1},
  {...lines[0],heatPress:2},
  {...lines[0],flyPrint:-1},
  {...lines[0],notes:'ملاحظة مهمة  '}
 ]){
  const x=await run(fake({items:[item]}));
  assert.equal(x.status,409,JSON.stringify(item));
  assert.equal(x.body.officialOrderCreated,false);
 }
 for(const item of [
  {...lines[0],department:'ليزر',heatPress:0,flyPrint:0},
  {...lines[0],department:'طباعة',heatPress:1,flyPrint:1,notes:'ملاحظة مهمة'}
 ]){
  const x=await run(fake({items:[item]}));
  assert.equal(x.status,200,JSON.stringify(item));
  assert.equal(x.body.officialOrderCreated,false);
 }
});
test('bad source customer data, unsupported line and fake D1 failure fail shut',async()=>{
 for(const account of [
  {...owner,createdAtMs:10},
  {...owner,createdAtMs:NOW+70000},
  {...owner,customerPhone:''},
  {...owner,customerName:''}
 ]){
  const x=await run(fake({account}));assert.notEqual(x.status,200);
 }
 for(const item of [
  {...lines[0],itemId:'FAKE'},
  {...lines[0],ordinal:2},
  {...lines[0],department:'حسابات'},
  {...lines[0],qty:0}
 ]){
  const x=await run(fake({items:[item]}));assert.notEqual(x.status,200);
 }
 const err=await run(fake({broken:true}));
 assert.equal(err.status,503);assert.doesNotMatch(JSON.stringify(err),/FAKE_PRIVATE_SQL/);
});
