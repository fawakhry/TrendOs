import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';
import {
  T12_CUSTOMER_MASTER_VERSION,
  customerControlState,
  readT12Customer,
  upsertT12Customer
} from './t12-customer-master.mjs';
import { projectLegacyCustomer } from './t12-customer-legacy-projection.mjs';

const BASE='/v1/t12/customers/write';
const HEALTH=BASE+'/health';
const READBACK=BASE+'/readback';
const LEGACY_PROJECTION='/v1/t12/customers/legacy-projection';

function text(v){return String(v==null?'':v).trim();}
function normalizedUser(v){
  return text(v).toLowerCase()
    .replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و')
    .replace(/ئ/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();
}
function origins(env){
  const x=text(env&&env.CORS_ORIGINS).split(',').map(v=>v.trim()).filter(Boolean);
  return x.length?x:['https://fawakhry.github.io'];
}
function cors(req,env){
  const o=text(req.headers.get('Origin')),a=origins(env);
  return {
    'access-control-allow-origin':o&&a.includes(o)?o:a[0],
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type,authorization,x-t12-customer-canary-confirm',
    'access-control-max-age':'86400',
    vary:'Origin'
  };
}
function json(data,status,req,env){
  return new Response(JSON.stringify(data),{
    status:status||200,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...cors(req,env)}
  });
}
function bearer(req){
  const m=text(req.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);
  return m?text(m[1]):'';
}
function canManageCustomers(payload){
  const role=text(payload&&payload.role).toLowerCase();
  const sub=normalizedUser(payload&&payload.sub);
  return role==='admin'||role==='service'||sub==='ضياء'||sub==='diaa'||sub==='رحمه'||sub==='rahma';
}
async function auth(req,env){
  const v=await verifyOrdersEdgeToken(bearer(req),text(env&&env.EDGE_SESSION_SECRET));
  if(!v.ok)return {ok:false,response:json({success:false,code:v.reason},401,req,env)};
  if(!canManageCustomers(v.payload))return {ok:false,response:json({success:false,code:'customer-write-forbidden'},403,req,env)};
  return {ok:true,payload:v.payload};
}

export function isT12CustomerWritePath(path){
  const p=String(path||'').replace(/\/+$/,'')||'/';
  return p===BASE||p===HEALTH||p===READBACK||p===LEGACY_PROJECTION;
}

export async function handleT12CustomerWriteRequest(req,env){
  const url=new URL(req.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(req.method==='OPTIONS'&&isT12CustomerWritePath(path))return new Response(null,{status:204,headers:cors(req,env)});
  if(!isT12CustomerWritePath(path))return null;

  if(path===HEALTH&&req.method==='GET'){
    const state=await customerControlState(env.DB);
    const schemaReady=!!state&&text(state.marker)==='T12_CUSTOMER_MASTER_V1';
    return json({
      success:schemaReady,
      service:'t12-customer-master',
      version:T12_CUSTOMER_MASTER_VERSION,
      schemaReady,
      mode:schemaReady?state.mode:'UNKNOWN',
      canaryRemaining:schemaReady?state.canaryRemaining:0,
      nextCustomerNumber:schemaReady?state.nextCustomerNumber:0,
      customerCount:schemaReady?state.customerCount:0,
      policyEpoch:schemaReady?state.policyEpoch:'',
      generalCutover:schemaReady&&state.mode==='GENERAL'
    },schemaReady?200:503,req,env);
  }

  const a=await auth(req,env);
  if(!a.ok)return a.response;

  if(path===READBACK&&req.method==='GET'){
    const customer=await readT12Customer(env.DB,url.searchParams.get('customerId'));
    return json(customer?{success:true,cloudNative:true,customer}:{success:false,code:'customer-not-found'},customer?200:404,req,env);
  }

  if(path===LEGACY_PROJECTION){
    if(req.method!=='POST')return json({success:false,code:'method-not-allowed'},405,req,env);
    let body={};
    try{body=await req.json();}catch{return json({success:false,code:'invalid-json'},400,req,env);}
    const projected=await projectLegacyCustomer(env.DB,body,text(a.payload.sub));
    let projectionStatus=400;
    if(projected.success)projectionStatus=projected.stored?201:200;
    else if(/conflict|ambiguous/.test(text(projected.reason)))projectionStatus=409;
    else if(/unknown|not-verified|unavailable|incomplete/.test(text(projected.reason)))projectionStatus=503;
    else if(/requires-customer-write-off/.test(text(projected.reason)))projectionStatus=423;
    return json({...projected,authoritativeSource:'apps-script'},projectionStatus,req,env);
  }

  if(path!==BASE||req.method!=='POST')return json({success:false,code:'method-not-allowed'},405,req,env);

  const state=await customerControlState(env.DB);
  if(!state||state.marker!=='T12_CUSTOMER_MASTER_V1')return json({success:false,code:'customer-schema-unavailable'},503,req,env);
  if(state.mode==='OFF')return json({success:false,code:'customer-write-off',mode:'OFF',generalCutover:false},423,req,env);

  const isCanary=state.mode==='CANARY';
  if(isCanary){
    if(text(a.payload&&a.payload.role).toLowerCase()!=='admin')return json({success:false,code:'admin-required-for-customer-canary'},403,req,env);
    const expected=String(Number(state.nextCustomerNumber||0));
    if(text(req.headers.get('x-t12-customer-canary-confirm'))!==expected){
      return json({success:false,code:'exact-customer-canary-confirmation-required',expected},412,req,env);
    }
  }

  let body={};
  try{body=await req.json();}catch{return json({success:false,code:'invalid-json'},400,req,env);}

  const result=await upsertT12Customer(env.DB,body,text(a.payload.sub),{canary:isCanary});
  let status=400;
  if(result.success)status=result.stored?201:200;
  else if(/off|not-enabled|not-armed|budget/.test(text(result.reason)))status=423;
  else if(/conflict|ambiguous/.test(text(result.reason)))status=409;
  else if(/unknown|not-verified|unavailable|incomplete/.test(text(result.reason)))status=503;

  return json({...result,mode:state.mode,generalCutover:state.mode==='GENERAL'},status,req,env);
}
