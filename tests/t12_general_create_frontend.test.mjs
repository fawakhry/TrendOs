import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');

function makeSandbox(mode='CANARY'){
  const store=new Map();
  const sessionStorage={
    getItem:k=>store.has(k)?store.get(k):null,
    setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k)
  };
  const originalCalls=[];
  async function original(action,params){ originalCalls.push({action,params}); return {success:true,legacy:true}; }
  const createCalls=[];
  let throwFirstCreate=false;

  async function fetchMock(url,options={}){
    const u=String(url);
    if(u.includes('/v1/t12/orders/create/health')){
      return new Response(JSON.stringify({success:true,schemaReady:true,mode,nextOrderNumber:4323,canaryRemaining:mode==='CANARY'?1:0,generalCutover:mode==='GENERAL'}),{status:200});
    }
    if(u.includes('/v1/edge/orders/session')){
      return new Response(JSON.stringify({success:true,edgeToken:'edge-token',expiresIn:600}),{status:200});
    }
    if(u.endsWith('/v1/t12/orders/create')){
      const payload=JSON.parse(options.body);
      createCalls.push({payload,headers:options.headers});
      if(throwFirstCreate && createCalls.length===1) throw new Error('SIM_NETWORK_LOST_ACK');
      return new Response(JSON.stringify({success:true,cloudNative:true,orderId:'4323',lineId:'4323-01',lineIds:['4323-01'],stored:true,generalCutover:mode==='GENERAL'}),{status:201});
    }
    throw new Error('unexpected fetch '+u);
  }

  const sandbox={
    console,Map,Set,Date,JSON,Math,Number,String,Array,Object,RegExp,Promise,
    URLSearchParams,Response,Request,Headers,setInterval,clearInterval,setTimeout,clearTimeout,
    sessionStorage,fetch:fetchMock,
    MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.trendmall-contact.workers.dev',
    MATBAGY_EDGE_ORDERS_READ_V1_ENABLED:true,
    MATBAGY_EDGE_ORDERS_CANARY_ONLY:false,
    MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS:['print','laser','press','service'],
    state:{user:{username:'admin',token:'employee-token'}},
    trendosSecureApiV1922:original
  };
  sandbox.window=sandbox;
  vm.runInNewContext(source,sandbox,{filename:'trendos-edge-orders-read-v1.js'});
  return {sandbox,originalCalls,createCalls,setThrowFirst(){throwFirstCreate=true;}};
}

const baseParams=(key)=>({
  username:'admin',
  token:'secret-employee-token',
  clientRequestId:key,
  customerMode:'خارجي / عابر',
  customerExternalId:'999003',
  customerName:'T12 UI CUSTOMER',
  customerPhone:'01000000002',
  customerType:'خارجي / عابر',
  source:'خارجي / عابر',
  department:'طباعة',
  heatPress:'لا',
  flyPrint:'لا',
  itemName:'T12 UI ITEM',
  qty:'1',
  priority:'عادي',
  status:'طلب جديد',
  assignedTo:'worker-name',
  notes:'ui create test',
  forceCreate:'YES'
});

{
  const x=makeSandbox('CANARY');
  const r=await x.sandbox.trendosSecureApiV1922('createManualOrder',baseParams('co_1790000030000_abcdef1234567'));
  assert.equal(r.success,true);
  assert.equal(r.orderId,'4323');
  assert.equal(x.originalCalls.filter(v=>v.action==='createManualOrder').length,0);
  assert.equal(x.createCalls.length,1);
  const call=x.createCalls[0];
  assert.match(call.payload.clientRequestId,/^cld1_1790000030000_[A-Za-z0-9_-]{16,80}$/);
  assert.equal(call.payload.externalCustomerId,'999003');
  assert.equal(call.payload.customerName,'T12 UI CUSTOMER');
  assert.equal(call.payload.department,'طباعة');
  assert.equal(call.payload.itemName,'T12 UI ITEM');
  assert.equal(Object.hasOwn(call.payload,'assignedTo'),false);
  assert.equal(Object.hasOwn(call.payload,'customerType'),false);
  assert.equal(Object.hasOwn(call.payload,'forceCreate'),false);
  assert.equal(Object.hasOwn(call.payload,'username'),false);
  assert.equal(Object.hasOwn(call.payload,'token'),false);
  assert.equal(call.headers['x-t12-general-canary-confirm'],'4323');
}

{
  const x=makeSandbox('GENERAL');
  x.setThrowFirst();
  const p1=baseParams('co_1790000040000_aaaabbbbccccd');
  const r1=await x.sandbox.trendosSecureApiV1922('createManualOrder',p1);
  assert.equal(r1.success,false);
  assert.equal(r1.code,'T12_CREATE_NETWORK_AMBIGUOUS_NO_RETRY');
  assert.equal(x.createCalls.length,1);
  const firstKey=x.createCalls[0].payload.clientRequestId;

  const p2=baseParams('co_1790000041000_eeeeffffggggh');
  const r2=await x.sandbox.trendosSecureApiV1922('createManualOrder',p2);
  assert.equal(r2.success,true);
  assert.equal(x.createCalls.length,2);
  assert.equal(x.createCalls[1].payload.clientRequestId,firstKey);
  assert.equal(Object.hasOwn(x.createCalls[1].headers,'x-t12-general-canary-confirm'),false);
  assert.equal(x.originalCalls.filter(v=>v.action==='createManualOrder').length,0);
}

console.log('T12 general CREATE frontend routing PASS');
