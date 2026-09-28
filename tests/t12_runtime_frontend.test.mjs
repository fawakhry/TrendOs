import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');
const store=new Map();
const sessionStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const originalCalls=[];
async function original(action,params){
  originalCalls.push({action,params});
  if(action==='getRowsPageV1931')return {success:true,rows:[{orderId:'4319',lineId:'4319-01',department:'طباعة',status:'طلب جديد'}],pagination:{page:1,pageSize:20,totalRows:1,totalPages:1}};
  if(action==='updateLine')return {success:true,legacy:true};
  if(action==='markCustomerNotified')return {success:true,legacyNotify:true};
  return {success:true};
}
const fetchCalls=[];
async function mockFetch(url,options={}){
  const u=String(url); fetchCalls.push({url:u,options});
  if(u.includes('/v1/edge/orders/session')) return new Response(JSON.stringify({success:true,edgeToken:'edge-token',expiresIn:600}),{status:200});
  if(u.includes('/v1/edge/orders/02cr/page')) return new Response(JSON.stringify({success:false,code:'EDGE_MIRROR_STALE',message:'stale'}),{status:503});
  if(u.includes('/v1/t12/orders/read-overlay')) return new Response(JSON.stringify({success:true,readOnly:true,dataSource:'t12-prod-native',rows:[{orderId:'4322',lineId:'4322-01',department:'طباعة',status:'طلب جديد',notes:'',cloudNative:true}],control:{nextOrderNumber:4323,canaryRemaining:0}}),{status:200});
  if(u.includes('/v1/t12/orders/line-runtime/update')) return new Response(JSON.stringify({success:true,cloudNative:true,orderId:'4322',lineId:'4322-01',status:'بدأ التنفيذ',notes:'اختبار'}),{status:200});
  if(u.includes('/v1/t12/orders/line-runtime/notify')) return new Response(JSON.stringify({success:true,cloudNative:true,orderId:'4322',lineId:'4322-01',customerNotified:'نعم'}),{status:200});
  throw new Error('unexpected fetch '+u);
}
const sandbox={console,Map,Set,Date,JSON,Math,Number,String,Array,Object,RegExp,Promise,URLSearchParams,Response,Request,Headers,setInterval,clearInterval,setTimeout,clearTimeout,sessionStorage,fetch:mockFetch,
MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.trendmall-contact.workers.dev',MATBAGY_EDGE_ORDERS_READ_V1_ENABLED:true,MATBAGY_EDGE_ORDERS_CANARY_ONLY:false,MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS:['print','laser','press','service'],state:{user:{username:'admin',token:'employee-token'}},trendosSecureApiV1922:original};
sandbox.window=sandbox;
vm.runInNewContext(source,sandbox,{filename:'trendos-edge-orders-read-v1.js'});

const rows=await sandbox.trendosSecureApiV1922('getRowsPageV1931',{screen:'print',page:1,pageSize:20,statusFilter:'__ACTIVE__'});
assert.equal(rows.rows[0].lineId,'4322-01');
assert.equal(rows.rows[0].cloudNative,true);

const beforeUpdateOriginal=originalCalls.filter(x=>x.action==='updateLine').length;
const saved=await sandbox.trendosSecureApiV1922('updateLine',{orderId:'4322',lineId:'4322-01',status:'بدأ التنفيذ',notes:'اختبار'});
assert.equal(saved.success,true);
assert.equal(saved.cloudNative,true);
assert.equal(originalCalls.filter(x=>x.action==='updateLine').length,beforeUpdateOriginal);
const updateFetch=fetchCalls.find(x=>x.url.includes('/line-runtime/update'));
assert.ok(updateFetch);
assert.deepEqual(JSON.parse(updateFetch.options.body),{orderId:'4322',lineId:'4322-01',status:'بدأ التنفيذ',notes:'اختبار'});

const beforeNotifyOriginal=originalCalls.filter(x=>x.action==='markCustomerNotified').length;
const notified=await sandbox.trendosSecureApiV1922('markCustomerNotified',{orderId:'4322',lineId:'4322-01',whatsappType:'ready_notify',message:'جاهز'});
assert.equal(notified.success,true);
assert.equal(notified.cloudNative,true);
assert.equal(originalCalls.filter(x=>x.action==='markCustomerNotified').length,beforeNotifyOriginal);
assert.ok(fetchCalls.some(x=>x.url.includes('/line-runtime/notify')));

console.log('T12 runtime frontend routing PASS');
