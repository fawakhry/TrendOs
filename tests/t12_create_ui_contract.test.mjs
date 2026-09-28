import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');
const store=new Map();
const sessionStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const originalCalls=[];
async function original(action,params){
  originalCalls.push({action,params});
  if(action==='searchCustomers'){
    return {success:true,customers:[{name:'عميل اختبار',phone:'01012345678',type:'داخلي'}]};
  }
  return {success:true,legacy:true};
}
const createCalls=[];
async function fetchMock(url,options={}){
  const u=String(url);
  if(u.includes('/v1/t12/orders/create/health')) return new Response(JSON.stringify({success:true,schemaReady:true,mode:'CANARY',nextOrderNumber:4323,canaryRemaining:1,generalCutover:false}),{status:200});
  if(u.includes('/v1/edge/orders/session')) return new Response(JSON.stringify({success:true,edgeToken:'edge-token',expiresIn:600}),{status:200});
  if(u.endsWith('/v1/t12/orders/create')){
    const payload=JSON.parse(options.body);
    createCalls.push(payload);
    return new Response(JSON.stringify({success:false,reason:'canonical-business-intent-invalid',errors:['item-name-required']}),{status:400,headers:{'content-type':'application/json'}});
  }
  throw new Error('unexpected fetch '+u);
}
const sandbox={console,Map,Set,Date,JSON,Math,Number,String,Array,Object,RegExp,Promise,URLSearchParams,Response,Request,Headers,setInterval,clearInterval,setTimeout,clearTimeout,sessionStorage,fetch:fetchMock,
MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.trendmall-contact.workers.dev',
MATBAGY_EDGE_ORDERS_READ_V1_ENABLED:true,
MATBAGY_EDGE_ORDERS_CANARY_ONLY:false,
MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS:['print','laser','press','service'],
state:{user:{username:'admin',token:'employee-token'}},
trendosSecureApiV1922:original};
sandbox.window=sandbox;
vm.runInNewContext(source,sandbox,{filename:'trendos-edge-orders-read-v1.js'});

const r=await sandbox.trendosSecureApiV1922('createManualOrder',{
  username:'admin',
  token:'employee-token',
  clientRequestId:'co_1790000060000_abcdef1234567',
  customerMode:'عميل مسجل',
  customerName:'عميل اختبار',
  customerPhone:'',
  customerType:'',
  source:'داخلي',
  department:'طباعة',
  heatPress:'لا',
  flyPrint:'لا',
  itemName:'',
  qty:'1',
  priority:'عادي',
  status:'طلب جديد',
  assignedTo:'وائل',
  notes:''
});
assert.equal(originalCalls.filter(x=>x.action==='searchCustomers').length,1);
assert.equal(createCalls.length,1);
assert.equal(createCalls[0].customerPhone,'01012345678');
assert.equal(createCalls[0].itemName,'أوردر جديد - طباعة');
assert.equal(r.success,false);
assert.equal(r.message,'اسم البند مطلوب.');

console.log('T12 Add Order UI contract alignment PASS');
