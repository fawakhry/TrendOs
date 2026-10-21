import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 preflightNativeCustomerDraftSubmitV0,
 CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0,
 CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0,
 CUSTOMER_DRAFT_SUBMIT_FILES_SQL_V0,
 CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0
} from '../cloudflare-d1/src/customer-portal-native-submit-preflight-v0.mjs';

const TOKEN='ab'.repeat(32),SECRET='FAKE-only-32-char-native-session-hmac-secret-not-real';
const DRAFT='CDR-'+'22'.repeat(16),ITEM='CDI-'+'33'.repeat(16),NOW=1800000000000;
const owner={draftId:DRAFT,createdAtMs:NOW-60000,draftState:'DRAFT',
 customerId:'C1',customerName:'عميل وهمي',customerPhone:'01012345678',customerSource:'cloud-native'};
const lines=[{itemId:ITEM,ordinal:1,department:'طباعة',itemName:'مج طباعة',qty:2,
 notes:'',heatPress:0,flyPrint:0}];
let calls=[];
function fake({account=owner,items=lines,files={fileCount:0,notReady:0},broken=false}={}){
 return{prepare(sql){
  const kind=sql.includes('SELECT d.draft_id AS draftId')?'scope':
    sql.includes('SELECT i.item_id AS itemId')?'items':'files';
  calls.push({kind,phase:'prepare'});
  return{bind(...args){calls.push({kind,phase:'bind',args});
   return{
     async first(){if(broken)throw Error('FAKE_PRIVATE_SQL');return kind==='scope'?account:files;},
     async all(){if(broken)throw Error('FAKE_PRIVATE_SQL');return{results:items};}
   };
  }};
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
 assert.doesNotMatch(statements,/createT12GeneralOrder\s*\(|INSERT INTO t12_prod_orders|db\.batch\s*\(/);
 assert.doesNotMatch(source,/APPS_SCRIPT_API_URL|script\.google\.com|fetch\s*\(/);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.officialOrderCreatorCalled,false);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.workerEntryWired,false);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.maxCompatibleItems,1);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.filesAllowed,0);
 assert.equal(CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0.productionRelease,'NO_GO');
 for(const sql of [CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0,
  CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0,CUSTOMER_DRAFT_SUBMIT_FILES_SQL_V0])
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
 assert.deepEqual(calls.filter(x=>x.phase==='prepare').map(x=>x.kind),['scope','items','files']);
 assert.equal(calls.filter(x=>x.phase==='bind').length,3);
 const raw=JSON.stringify(value);
 assert.equal(raw.includes('01012345678'),false);
 assert.equal(raw.includes('عميل وهمي'),false);
 assert.equal(raw.includes('C1'),false);
 assert.equal(raw.includes(TOKEN),false);
});
test('owner and session failures refuse before inspecting item list',async()=>{
 for(const x of [null,{...owner,draftId:'CDR-'+'44'.repeat(16)}]){
  calls=[];const res=await run(fake({account:x}));
  assert.equal(res.status,404);
  assert.equal(calls.filter(v=>v.kind==='items').length,0);
 }
 assert.equal((await run(fake(),{token:'bad'})).status,401);
 assert.equal((await run(fake(),{draftId:'bad'})).status,400);
 assert.equal((await run(fake(),{secret:'short'})).status,503);
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
