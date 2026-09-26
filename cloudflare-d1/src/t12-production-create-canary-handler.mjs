import {verifyOrdersEdgeToken} from './edge-orders-read-v1.mjs';
import {createT12ProductionCanary,readT12ProductionCanaryOrder,T12_PROD_CREATE_CANARY_VERSION} from './t12-production-create-canary.mjs';
const BASE='/v1/t12/orders/create-canary';
function text(v){return String(v==null?'':v).trim();} function enabled(v){return text(v).toLowerCase()==='true';}
function origins(env){const x=text(env.CORS_ORIGINS).split(',').map(v=>v.trim()).filter(Boolean);return x.length?x:['https://fawakhry.github.io'];}
function cors(req,env){const o=text(req.headers.get('Origin')),a=origins(env);return {'access-control-allow-origin':o&&a.includes(o)?o:a[0],'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization,x-t12-canary-confirm','access-control-max-age':'86400',vary:'Origin'};}
function json(d,s,h){return new Response(JSON.stringify(d),{status:s||200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...(h||{})}});}
function bearer(req){const m=text(req.headers.get('Authorization')).match(/^Bearer\s+(.+)$/i);return m?text(m[1]):'';}
async function authAdmin(req,env){const v=await verifyOrdersEdgeToken(bearer(req),text(env.EDGE_SESSION_SECRET));if(!v.ok)return {ok:false,response:json({success:false,code:v.reason},401,cors(req,env))};if(text(v.payload.role).toLowerCase()!=='admin')return {ok:false,response:json({success:false,code:'admin-required'},403,cors(req,env))};return {ok:true,session:v.payload};}
export function isT12ProductionCreateCanaryPath(path){const p=String(path||'').replace(/\/+$/,'')||'/';return p===BASE||p===BASE+'/health'||p===BASE+'/readback';}
export async function handleT12ProductionCreateCanaryRequest(req,env){
  const url=new URL(req.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(req.method==='OPTIONS'&&isT12ProductionCreateCanaryPath(path))return new Response(null,{status:204,headers:cors(req,env)});
  if(req.method==='GET'&&path===BASE+'/health'){
    let database=false,schemaReady=false,control=null;try{database=!!(await env.DB.prepare('SELECT 1 AS ok').first());const t=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('t12_prod_create_control','t12_prod_request_ledger','t12_prod_orders','t12_prod_lines')").all();schemaReady=new Set((t.results||[]).map(x=>text(x.name))).size===4;if(schemaReady)control=await env.DB.prepare('SELECT next_order_number AS nextOrderNumber,canary_remaining AS canaryRemaining,policy_epoch AS policyEpoch FROM t12_prod_create_control WHERE singleton=1').first();}catch{}
    return json({success:database,service:'trendos-t12-production-create-canary',version:T12_PROD_CREATE_CANARY_VERSION,database,schemaReady,enabled:enabled(env.TRENDOS_T12_PROD_CREATE_CANARY_ENABLED),control:control?{nextOrderNumber:Number(control.nextOrderNumber||0),canaryRemaining:Number(control.canaryRemaining||0),policyEpoch:text(control.policyEpoch)}:null,generalCutover:false},database?200:503,cors(req,env));
  }
  if(!isT12ProductionCreateCanaryPath(path))return null;
  if(!enabled(env.TRENDOS_T12_PROD_CREATE_CANARY_ENABLED))return json({success:false,enabled:false,canaryOnly:true,generalCutover:false},423,cors(req,env));
  const auth=await authAdmin(req,env);if(!auth.ok)return auth.response;
  if(req.method==='GET'&&path===BASE+'/readback'){const r=await readT12ProductionCanaryOrder(env.DB,url.searchParams.get('orderId'));return json({...r,canaryOnly:true,generalCutover:false},r.success?200:404,cors(req,env));}
  if(req.method!=='POST'||path!==BASE)return json({success:false,code:'method-not-allowed'},405,cors(req,env));
  if(text(req.headers.get('x-t12-canary-confirm'))!=='4322')return json({success:false,code:'explicit-canary-confirmation-required'},412,cors(req,env));
  let body={};try{body=await req.json();}catch{return json({success:false,code:'invalid-json'},400,cors(req,env));}
  const r=await createT12ProductionCanary(env.DB,body,text(auth.session.sub),{mode:'production-canary-one-shot',allowProductionCanaryMutation:true,ownerFreshStartApproved:true,googleHistoricalBackfillRequired:false,recurringMirrorWriterFenced:true});
  const status=r.success?(r.stored?201:200):r.reason==='production-canary-budget-exhausted'?423:r.reason==='same-key-actor-payload-or-policy-conflict'?409:400;
  return json({...r,generalCutover:false},status,cors(req,env));
}
