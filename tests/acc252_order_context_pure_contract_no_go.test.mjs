// ACC252 safe promotion of the already-tested ACC251 source/consumer contract.
// Inert module only: no Worker route, D1 binding, secret or finance operation.
// Every byte of production/client/order data here is synthetic.
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {
 VERSION, PATH, DOMAIN, POLICY, MAX_SKEW_MS,
 validRequest, validReply, signBody, verifyBody, contextFromOriginal,
 readOriginalOrderContextV1
} from '../cloudflare-d1/src/accounting-original-order-context-v1.mjs';
if (!globalThis.crypto) globalThis.crypto=webcrypto;
const KEY='ACC252_FAKE_PRIVATE_ORDER_CONTEXT_HMAC'.repeat(3);
const WRONG='ACC252_DIFFERENT_HMAC_FOR_REJECT'.repeat(3);
const ORDER='ORD-ACC252-FAKE', CUSTOMER='CUS-ACC252-FAKE';
const line={lineId:ORDER+'-01',department:'طباعة',ordinal:1};
const request=(other={})=>({
 version:VERSION,orderId:ORDER,customerId:CUSTOMER,
 issuedAt:Date.now(),nonce:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',...other
});
const source=()=>({status:200,body:{
 success:true,source:'original-t12-at-create-source-only',
 sourceOnly:true,readOnly:true,operationalSourceShapeVerified:true,
 officialCustomerOwnershipAttested:false,departmentApprovalsVerified:false,
 financeAuthorized:false,canRequestInvoice:false,posted:false,
 connectorEventPublished:false,orderId:ORDER,officialCustomerId:CUSTOMER,
 sourceCreatedAt:'2026-09-21T14:13:20Z',lineCount:1,
 lines:[line],operationalRevision:{
 customerVersion:1,lineVersions:[{lineId:line.lineId,version:0}]
 }
}});
function fakePrivateService({badHmac=false,alter=null}={}){
 return {async fetch(req){
  assert.equal(new URL(req.url).pathname,PATH);
  assert.equal(req.method,'POST');
  const raw=await req.text();
  assert.equal(await verifyBody(KEY,raw,req.headers.get('x-order-context-signature')),true);
  const params=JSON.parse(raw);
  const result=contextFromOriginal(source(),params);
  assert.equal(validReply(result,params),true);
  const packet=alter?alter(result):result;
  const body=JSON.stringify(packet);
  return new Response(body,{status:200,headers:{
   'x-order-context-signature':await signBody(badHmac?WRONG:KEY,body)
  }});
 }};
}
const env=(options)=>({
 EASYSTORE_ORDER_CONTEXT_SOURCE_V1:'REMOTE_REQUIRED',
 TRENDOS_ORDER_CONTEXT_HMAC_V1:KEY,
 TRENDOS_ORDER_CONTEXT:fakePrivateService(options)
});
test('contract can be imported with zero routes, money, approvals or credentials',()=>{
 assert.equal(VERSION,'TRENDOS_EASYSTORE_ORIGINAL_ORDER_CONTEXT_V1');
 assert.equal(DOMAIN,'ACC251_ORIGINAL_ORDER_CONTEXT_V1\n');
 assert.equal(POLICY.onlyPrivateServiceBinding,true);
 assert.equal(POLICY.financialAuthority,false);
 assert.equal(POLICY.invoicePostingAllowed,false);
 assert.equal(POLICY.verifiedCustomerOwnership,false);
 assert.equal(POLICY.signedLineApprovals,false);
 assert.equal(POLICY.financeRelease,'NO_GO');
 assert.equal(POLICY.allowedEffect,'prepare_context_only');
});
test('exact request and signed context-only source shape accepted',async()=>{
 const r=request();
 assert.equal(validRequest(r),true);
 const context=contextFromOriginal(source(),r);
 assert.equal(validReply(context,r),true);
 assert.deepEqual(context.lines,[line]);
 assert.equal(context.contextOnly,true);
 assert.equal(context.financialAuthority,false);
 assert.equal(context.ownerAttested,false);
 assert.equal(context.approvedLineEventsVerified,false);
 assert.equal(JSON.stringify(context).includes('price'),false);
 const s=JSON.stringify(context),mac=await signBody(KEY,s);
 assert.equal(await verifyBody(KEY,s,mac),true);
 assert.equal(await verifyBody(WRONG,s,mac),false);
 assert.equal(await verifyBody(KEY,s.replace('طباعة','ليزر'),mac),false);
});
test('request rejects replay age, missing/extraneous fields and bad IDs',()=>{
 assert.equal(validRequest(request({issuedAt:Date.now()-MAX_SKEW_MS-2000})),false);
 assert.equal(validRequest(request({issuedAt:Date.now()+MAX_SKEW_MS+2000})),false);
 assert.equal(validRequest(request({ownerVerified:true})),false);
 assert.equal(validRequest(request({customerId:'  '+CUSTOMER})),false);
 assert.equal(validRequest(request({nonce:'no'})),false);
});
test('new context cannot be forged from unqualified original source',()=>{
 const r=request();
 const bad=source();bad.body.departmentApprovalsVerified=true;
 assert.equal(contextFromOriginal(bad,r),null);
 const wrong=source();wrong.body.officialCustomerId='CUS-OTHER';
 assert.equal(contextFromOriginal(wrong,r),null);
 const fakePrice=source();fakePrice.body.lines[0].price=999999;
 // Response still never includes caller/source price.
 assert.equal(Object.hasOwn(contextFromOriginal(fakePrice,r).lines[0],'price'),false);
});
test('private synthetic service-binding roundtrip verifies both HMACs and original nonce',async()=>{
 const reply=await readOriginalOrderContextV1(env(),{orderId:ORDER,customerId:CUSTOMER});
 assert.equal(reply.customerId,CUSTOMER);
 assert.equal(reply.orderId,ORDER);
 assert.deepEqual(reply.lines,[line]);
 assert.equal(reply.financialAuthority,false);
 assert.equal(reply.ownerAttested,false);
 assert.equal(reply.approvedLineEventsVerified,false);
});
test('inert private reader rejects missing binding and disabled scope',async()=>{
 await assert.rejects(()=>readOriginalOrderContextV1({},{orderId:ORDER,customerId:CUSTOMER}),
  /ACC251_PRIVATE_ORDER_SOURCE_NOT_CONNECTED/);
 await assert.rejects(()=>readOriginalOrderContextV1({
  ...env(),EASYSTORE_ORDER_CONTEXT_SOURCE_V1:'OFF'
 },{orderId:ORDER,customerId:CUSTOMER}),
  /ACC251_PRIVATE_ORDER_SOURCE_NOT_CONNECTED/);
});
test('untrusted sender response HMAC and signed approval escalation both fail',async()=>{
 await assert.rejects(()=>readOriginalOrderContextV1(
  env({badHmac:true}),{orderId:ORDER,customerId:CUSTOMER}),
  /ACC251_ORIGINAL_ORDER_REPLY_NOT_AUTHENTIC/);
 await assert.rejects(()=>readOriginalOrderContextV1(env({
  alter:reply=>({...reply,financialAuthority:true})
 }),{orderId:ORDER,customerId:CUSTOMER}),
  /ACC251_ORDER_REPLY_NOT_BOUND_TO_REQUEST/);
 await assert.rejects(()=>readOriginalOrderContextV1(env({
  alter:reply=>({...reply,approvedLineEventsVerified:true})
 }),{orderId:ORDER,customerId:CUSTOMER}),
  /ACC251_ORDER_REPLY_NOT_BOUND_TO_REQUEST/);
});
test('cross-domain HMAC or tampered payload cannot be treated as proof',async()=>{
 const body=JSON.stringify(request()),sig=await signBody(KEY,body);
 assert.equal(await verifyBody(KEY,body,sig),true);
 assert.equal(await verifyBody(KEY,body+' ',sig),false);
 assert.equal(await verifyBody(KEY,body,'0'.repeat(64)),false);
 assert.equal(await verifyBody(KEY,body,'nonsense'),false);
});
