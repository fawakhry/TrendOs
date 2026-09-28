import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');
const store=new Map();
const sessionStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const originalCalls=[];
async function original(action,params){originalCalls.push({action,params});return {success:true,legacy:true};}
let createCalls=0;
async function fetchMock(url,options={}){
  const u=String(url);
  if(u.includes('/v1/t12/orders/create/health')) return new Response(JSON.stringify({success:true,schemaReady:true,mode:'CANARY',nextOrderNumber:4323,canaryRemaining:1,generalCutover:false}),{status:200});
  if(u.includes('/v1/edge/orders/session')) return new Response(JSON.stringify({success:true,edgeToken:'edge-token',expiresIn:600}),{status:200});
  if(u.endsWith('/v1/t12/orders/create')){
    createCalls++;
    return new Response(JSON.stringify({success:false,cloudNative:true,reason:'registered-customer-phone-required',retryAutomatically:false}),{status:400,headers:{'content-type':'application/json'}});
  }
  throw new Error('unexpected fetch '+u);
}
const sandbox={console,Map,Set,Date,JSON,Math,Number,String,Array,Object,RegExp,Promise,URLSearchParams,Response,Request,Headers,setInterval,clearInterval,setTimeout,clearTimeout,sessionStorage,fetch:fetchMock,
MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.trendmall-contact.workers.dev',MATBAGY_EDGE_ORDERS_READ_V1_ENABLED:true,MATBAGY_EDGE_ORDERS_CANARY_ONLY:false,MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS:['print','laser','press','service'],state:{user:{username:'admin',token:'employee-token'}},trendosSecureApiV1922:original};
sandbox.window=sandbox;
vm.runInNewContext(source,sandbox,{filename:'trendos-edge-orders-read-v1.js'});

const r=await sandbox.trendosSecureApiV1922('createManualOrder',{
  clientRequestId:'co_1790000050000_abcdef1234567',
  customerMode:'عميل مسجل',
  customerExternalId:'999004',
  customerName:'Known',
  customerPhone:'',
  department:'طباعة',
  itemName:'Item',
  qty:1,
  priority:'عادي',
  status:'طلب جديد',
  source:'عميل مسجل'
});
assert.equal(r.success,false);
assert.equal(r.httpStatus,400);
assert.equal(r.reason,'registered-customer-phone-required');
assert.equal(r.message,'العميل المسجل لازم يكون له رقم هاتف قبل فتح الأوردر.');
assert.equal(createCalls,1);
assert.equal(originalCalls.filter(x=>x.action==='createManualOrder').length,0);
console.log('T12 exact CREATE error surface PASS');
