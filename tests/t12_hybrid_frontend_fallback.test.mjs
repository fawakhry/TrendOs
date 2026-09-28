import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');

const store=new Map();
const sessionStorage={
  getItem(k){ return store.has(k)?store.get(k):null; },
  setItem(k,v){ store.set(k,String(v)); },
  removeItem(k){ store.delete(k); }
};

const originalCalls=[];
async function original(action, params){
  originalCalls.push({action,params});
  if(action==='getRowsPageV1931'){
    return {
      success:true,
      rows:[{orderId:'4319',lineId:'4319-01',customer:'Legacy Customer',department:'طباعة',itemName:'Legacy',status:'طلب جديد',priority:'عادي'}],
      pagination:{page:1,pageSize:20,totalRows:1,totalPages:1,hasOlder:false},
      dashboard:{activeOrders:1}
    };
  }
  if(action==='updateLine') return {success:true,shouldNotReachCloudNative:true};
  return {success:true};
}

const fetchCalls=[];
async function mockFetch(url, options={}){
  const u=String(url);
  fetchCalls.push(u);
  if(u.includes('/v1/edge/orders/session')){
    return new Response(JSON.stringify({success:true,edgeToken:'edge-token',expiresIn:600}),{status:200,headers:{'content-type':'application/json'}});
  }
  if(u.includes('/v1/edge/orders/02cr/page')){
    return new Response(JSON.stringify({success:false,code:'02cr-mirror-stale',fallback:'apps-script',message:'stale mirror'}),{status:503,headers:{'content-type':'application/json'}});
  }
  if(u.includes('/v1/t12/orders/read-overlay')){
    return new Response(JSON.stringify({
      success:true,
      readOnly:true,
      dataSource:'t12-prod-native',
      control:{nextOrderNumber:4323,canaryRemaining:0},
      rows:[{
        orderId:'4322',orderCode:'4322',lineId:'4322-01',
        customer:'T12 CANARY CUSTOMER',customerPhone:'01000000000',
        department:'طباعة',itemName:'T12 CANARY ITEM',qty:1,
        priority:'عادي',status:'طلب جديد',source:'T12 Production Canary',
        cloudNative:true,readOnly:true,writeAuthority:'cloudflare-t12'
      }]
    }),{status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('unexpected fetch '+u);
}

const sandbox={
  console,
  Map,Set,Date,JSON,Math,Number,String,Array,Object,RegExp,Promise,
  URLSearchParams,Response,Request,Headers,
  setInterval,clearInterval,setTimeout,clearTimeout,
  sessionStorage,
  fetch:mockFetch,
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.trendmall-contact.workers.dev',
  MATBAGY_EDGE_ORDERS_READ_V1_ENABLED:true,
  MATBAGY_EDGE_ORDERS_CANARY_ONLY:false,
  MATBAGY_EDGE_ORDERS_CANARY_USERS:['وائل','wael'],
  MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS:['print','laser','press','service'],
  MATBAGY_EDGE_ORDERS_MAX_MIRROR_AGE_MS:300000,
  state:{user:{username:'admin',token:'employee-token'}},
  trendosSecureApiV1922:original
};
sandbox.window=sandbox;

vm.runInNewContext(source,sandbox,{filename:'trendos-edge-orders-read-v1.js'});
assert.equal(typeof sandbox.trendosSecureApiV1922,'function');
assert.notEqual(sandbox.trendosSecureApiV1922,original);

const result=await sandbox.trendosSecureApiV1922('getRowsPageV1931',{
  screen:'print',page:1,pageSize:20,statusFilter:'__ACTIVE__'
});
assert.equal(result.success,true);
assert.equal(result.dataSource,'apps-script+t12-native');
assert.equal(result.rows.length,2);
assert.equal(result.rows[0].orderId,'4322');
assert.equal(result.rows[0].lineId,'4322-01');
assert.equal(result.rows[0].cloudNative,true);
assert.equal(result.rows[1].orderId,'4319');
assert.equal(result.hybridOverlay.enabled,true);
assert.equal(result.hybridOverlay.cloudNativeRows,1);
assert.ok(fetchCalls.some(x=>x.includes('/v1/t12/orders/read-overlay')));

const callsBefore=originalCalls.length;
const blocked=await sandbox.trendosSecureApiV1922('updateLine',{
  orderId:'4322',lineId:'4322-01',status:'بدأ التنفيذ'
});
assert.equal(blocked.success,false);
assert.equal(blocked.code,'T12_CLOUD_NATIVE_READ_ONLY');
assert.equal(originalCalls.length,callsBefore);

const stats=sandbox.TrendOSEdgeOrdersReadV1.stats();
assert.equal(stats.hybridOverlaySuccess,1);
assert.equal(stats.hybridOverlayRows,1);
assert.equal(stats.cloudNativeLineIds,1);

console.log('T12 hybrid frontend fallback isolated PASS');
