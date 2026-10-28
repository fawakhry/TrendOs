/* ACC258 — separate, un-deployed private Worker entrypoint; NO public route.
 * The existing T12 native platform database is the sole operational source.
 */
import {inspectPlatformNativeOrderContextReadOnly} from '../src/t12-platform-order-context-readonly-acc257.mjs';
import {PATH,validRequest,fromNativeSource,sign,verify} from '../src/t12-platform-order-private-preview-acc258.mjs';
const deny=(code,status=403)=>new Response(JSON.stringify({
 success:false,code,financeAuthorized:false,canRequestInvoice:false,
 productionRelease:'NO_GO'
}),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export default {
 async fetch(request,env){
  if(new URL(request.url).pathname!==PATH)return deny('not-found',404);
  if(request.method!=='POST')return deny('method-not-allowed',405);
  if(env?.TRENDOS_PLATFORM_ORDER_PREVIEW_MODE!=='ISOLATED_SOURCE_ONLY'||
   !env.DB||typeof env.DB.batch!=='function'||typeof env.DB.prepare!=='function')
   return deny('native-preview-disabled',503);
  let raw;
  try{raw=await request.text()}catch{return deny('unreadable-request',400)}
  if(raw.length>1024)return deny('oversized-request',413);
  if(!await verify(env.TRENDOS_PLATFORM_ORDER_PREVIEW_HMAC,raw,
    request.headers.get('x-acc258-signature')))
   return deny('bad-signature',401);
  let q;try{q=JSON.parse(raw)}catch{return deny('invalid-json',400)}
  if(!validRequest(q))return deny('invalid-or-expired-request',400);
  let context;
  try{
   const source=await inspectPlatformNativeOrderContextReadOnly({
     db:env.DB,orderId:q.orderId});
   context=await fromNativeSource(source,q);
  }catch{return deny('original-native-source-unavailable',503)}
  if(!context)return deny('native-order-not-qualified',409);
  const body=JSON.stringify(context);
  try{return new Response(body,{status:200,headers:{
   'content-type':'application/json','cache-control':'no-store',
   'x-content-type-options':'nosniff',
   'x-acc258-signature':await sign(env.TRENDOS_PLATFORM_ORDER_PREVIEW_HMAC,body)
  }})}catch{return deny('response-signing-failed',503)}
 }
};
