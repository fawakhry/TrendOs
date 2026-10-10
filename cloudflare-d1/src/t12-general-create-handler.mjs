import { verifyOrdersEdgeToken } from './edge-orders-read-v1.mjs';
import { createT12GeneralOrder, T12_GENERAL_CREATE_VERSION } from './t12-general-create.mjs';
import { T12_CUSTOMER_LANE_POLICY_VERSION } from './t12-customer-lane-policy.mjs';

const BASE='/v1/t12/orders/create';
const HEALTH=BASE+'/health';
const READBACK=BASE+'/readback';

function text(v){return String(v==null?'':v).trim();}
function origins(env){
  const x=text(env&&env.CORS_ORIGINS).split(',').map(v=>v.trim()).filter(Boolean);
  return x.length?x:['https://fawakhry.github.io'];
}
function cors(req,env){
  const o=text(req.headers.get('Origin')),a=origins(env);
  return {
    'access-control-allow-origin':o&&a.includes(o)?o:a[0],
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type,authorization,x-t12-general-canary-confirm',
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
async function auth(req,env){
  const v=await verifyOrdersEdgeToken(bearer(req),text(env&&env.EDGE_SESSION_SECRET));
  if(!v.ok)return {ok:false,response:json({success:false,code:v.reason},401,req,env)};
  const sub=text(v.payload&&v.payload.sub),role=text(v.payload&&v.payload.role).toLowerCase();
  if(!sub||role==='customer'||role==='client')return {ok:false,response:json({success:false,code:'employee-session-required'},403,req,env)};
  return {ok:true,payload:v.payload};
}
async function control(db){
  try{
    const row=await db.prepare(`
      SELECT g.marker,g.mode,g.canary_remaining AS canaryRemaining,g.policy_epoch AS policyEpoch,
             g.updated_at AS updatedAt,c.next_order_number AS nextOrderNumber,
             c.canary_remaining AS legacyCanaryRemaining
        FROM t12_prod_general_create_control g
        JOIN t12_prod_create_control c ON c.singleton=g.singleton
       WHERE g.singleton=1
       LIMIT 1
    `).first();
    return row||null;
  }catch{return null;}
}
async function duplicateGuardReady(db){
  try{
    const row=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='t12_prod_duplicate_order_guard' LIMIT 1").first();
    return !!row;
  }catch{return false;}
}
async function customerLaneClaimReady(db){
  try{
    const found=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='t12_prod_customer_lane_claim' LIMIT 1").first();
    return !!found;
  }catch{return false;}
}
async function readback(db,orderId){
  const id=text(orderId);
  if(!id)return {success:false,code:'order-id-required'};
  const order=await db.prepare(`
    SELECT order_id AS orderId,request_key AS requestKey,customer_mode AS customerMode,
           customer_name AS customerName,customer_phone AS customerPhone,
           external_customer_id AS externalCustomerId,department,priority,status,source,notes,
           actor,created_at AS createdAt,updated_at AS updatedAt
      FROM t12_prod_orders WHERE order_id=? LIMIT 1
  `).bind(id).first();
  if(!order)return {success:false,code:'order-not-found'};
  const lines=await db.prepare(`
    SELECT line_id AS lineId,ordinal,department,assigned_to AS assignedTo,item_name AS itemName,
           qty,priority,status,heat_press AS heatPress,fly_print AS flyPrint,
           created_at AS createdAt,updated_at AS updatedAt
      FROM t12_prod_lines WHERE order_id=? ORDER BY ordinal
  `).bind(id).all();
  return {success:true,order,lines:(lines&&lines.results)||[]};
}

export function isT12GeneralCreatePath(path){
  const p=String(path||'').replace(/\/+$/,'')||'/';
  return p===BASE||p===HEALTH||p===READBACK;
}

export async function handleT12GeneralCreateRequest(req,env){
  const url=new URL(req.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(req.method==='OPTIONS'&&isT12GeneralCreatePath(path))return new Response(null,{status:204,headers:cors(req,env)});
  if(!isT12GeneralCreatePath(path))return null;

  if(path===HEALTH&&req.method==='GET'){
    const ctl=await control(env.DB);
    const guardReady=await duplicateGuardReady(env.DB);
    const laneReady=await customerLaneClaimReady(env.DB);
    const schemaReady=!!ctl&&text(ctl.marker)==='T12_GENERAL_CREATE_V1'&&guardReady&&laneReady;
    return json({
      success:schemaReady,
      service:'t12-general-create',
      version:T12_GENERAL_CREATE_VERSION,
      customerLanePolicyVersion:T12_CUSTOMER_LANE_POLICY_VERSION,
      schemaReady,
      duplicateGuardReady:guardReady,
      customerLaneClaimReady:laneReady,
      mode:schemaReady?text(ctl.mode):'UNKNOWN',
      canaryRemaining:schemaReady?Number(ctl.canaryRemaining||0):0,
      nextOrderNumber:schemaReady?Number(ctl.nextOrderNumber||0):0,
      legacyCanaryRemaining:schemaReady?Number(ctl.legacyCanaryRemaining||0):0,
      policyEpoch:schemaReady?text(ctl.policyEpoch):'',
      generalCutover:schemaReady&&text(ctl.mode)==='GENERAL'
    },schemaReady?200:503,req,env);
  }

  const a=await auth(req,env);if(!a.ok)return a.response;

  if(path===READBACK&&req.method==='GET'){
    const r=await readback(env.DB,url.searchParams.get('orderId'));
    return json(r,r.success?200:404,req,env);
  }
  if(path!==BASE||req.method!=='POST')return json({success:false,code:'method-not-allowed'},405,req,env);

  const ctl=await control(env.DB);
  if(!ctl||text(ctl.marker)!=='T12_GENERAL_CREATE_V1')return json({success:false,code:'general-create-schema-unavailable'},503,req,env);
  const mode=text(ctl.mode);
  if(mode==='OFF')return json({success:false,code:'general-create-off',mode,generalCutover:false},423,req,env);

  const role=text(a.payload&&a.payload.role).toLowerCase();
  const isCanary=mode==='CANARY';
  if(isCanary){
    if(role!=='admin')return json({success:false,code:'admin-required-for-create-canary'},403,req,env);
    const expected=String(Number(ctl.nextOrderNumber||0));
    if(text(req.headers.get('x-t12-general-canary-confirm'))!==expected){
      return json({success:false,code:'exact-next-order-canary-confirmation-required',expected},412,req,env);
    }
  }

  let body={};try{body=await req.json();}catch{return json({success:false,code:'invalid-json'},400,req,env);}
  const result=await createT12GeneralOrder(env.DB,body,text(a.payload.sub),{canary:isCanary});
  let status=400;
  if(result.success)status=result.stored?201:200;
  else if(/not-enabled|not-armed|budget|off/.test(text(result.reason)))status=423;
  else if(result.duplicatePrevented===true||/conflict|duplicate/.test(text(result.reason)))status=409;
  else if(/unknown|not-verified|unavailable/.test(text(result.reason)))status=503;

  return json({
    ...result,
    mode,
    generalCutover:mode==='GENERAL'
  },status,req,env);
}
