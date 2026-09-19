/*
 * T12 isolated preview handler. This file is intentionally outside src/index_v2.js
 * routing and outside production Wrangler entrypoints.
 */
import { verifyEdgeSessionToken } from '../src/edge-gateway.mjs';
import { persistT12OrderCreateShadow } from '../src/t12-order-create-shadow-store.mjs';

export const T12_SHADOW_PATH = '/v1/t12/order-create/shadow';
export const T12_SHADOW_HANDLER_VERSION = 'TRENDOS_T12_ORDER_CREATE_SHADOW_HANDLER_20260919';

function text(v){return String(v==null?'':v).trim();}
function enabled(v){return ['1','true','yes','on','enabled'].includes(text(v).toLowerCase());}
function json(body,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
  });
}
function bearer(request){
  const m=text(request.headers.get('authorization')).match(/^Bearer\s+(.+)$/i);
  return m?text(m[1]):'';
}
export function isT12OrderCreateShadowPath(path){
  return (String(path||'').replace(/\/+$/,'')||'/')===T12_SHADOW_PATH;
}
export async function handleT12OrderCreateShadowRequest(request,env={}){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!isT12OrderCreateShadowPath(path)) return json({success:false,code:'t12-route-not-found'},404);
  if(request.method!=='POST') return json({success:false,code:'t12-method-not-allowed'},405);
  if(!enabled(env.TRENDOS_T12_ORDER_CREATE_SHADOW_ENABLED)){
    return json({success:false,code:'t12-shadow-disabled',productionCutoverAuthorized:false},423);
  }
  if(!text(env.EDGE_SESSION_SECRET)) return json({success:false,code:'t12-auth-not-configured'},503);
  const verified=await verifyEdgeSessionToken(bearer(request),text(env.EDGE_SESSION_SECRET));
  if(!verified.ok) return json({success:false,code:'t12-unauthorized',reason:verified.reason},401);
  let body={};
  try{body=await request.json();}catch(err){return json({success:false,code:'t12-invalid-json'},400);}
  const result=await persistT12OrderCreateShadow(
    env.DB,body,text(verified.payload&&verified.payload.sub),
    {mode:'isolated-shadow-qualification',allowShadowMutation:true}
  );
  if(result.success){
    return json({
      ...result,
      route:T12_SHADOW_PATH,
      handlerVersion:T12_SHADOW_HANDLER_VERSION,
      shadowOnly:true,
      productionCutoverAuthorized:false
    },result.idempotent?200:201);
  }
  const status=result.conflict?409:
    (result.reason==='shadow-intent-invalid'?400:
      (result.reason==='shadow-transaction-failed'?500:422));
  return json({...result,route:T12_SHADOW_PATH,handlerVersion:T12_SHADOW_HANDLER_VERSION,shadowOnly:true},status);
}
