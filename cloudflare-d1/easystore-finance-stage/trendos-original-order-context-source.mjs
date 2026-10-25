/**
 * ACC251 — private TrendOS ORIGINAL operational order context source.
 * Separate un-deployed internal Cloudflare Worker; uses existing original T12
 * inspector's 5-SELECT D1 snapshot. NEVER binds finance D1 or posts money.
 * No public URL, no browser bearer, no route in production entrypoint.
 */
import {inspectT12EmployeeOrderFinanceCandidate}
 from '../src/t12-employee-order-finance-intake-sourceonly.mjs';
import {PATH,validRequest,contextFromOriginal,signBody,verifyBody,
 MAX_RESPONSE_CHARS} from '../src/accounting-original-order-context-v1.mjs';
const failure=(code,status=403)=>new Response(JSON.stringify({
 success:false,code,contextOnly:true,financialAuthority:false,
 invoicePostingAllowed:false,financeRelease:'NO_GO'
}),{status,headers:{'content-type':'application/json; charset=utf-8',
 'cache-control':'no-store','x-content-type-options':'nosniff'}});
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path!==PATH)return failure('not-found',404);
  if(request.method!=='POST')return failure('method-not-allowed',405);
  if(env?.TRENDOS_ORDER_CONTEXT_SOURCE_V1!=='ENFORCE'||
     !env.DB||typeof env.DB.batch!=='function'||
     typeof env.TRENDOS_ORDER_CONTEXT_HMAC_V1!=='string'||
     env.TRENDOS_ORDER_CONTEXT_HMAC_V1.length<32)
   return failure('private-original-t12-order-source-off',503);
  let raw;
  try{raw=await request.text();}
  catch{return failure('private-source-request-unavailable',400);}
  if(raw.length>1024)return failure('private-source-request-too-large',413);
  if(!await verifyBody(env.TRENDOS_ORDER_CONTEXT_HMAC_V1,raw,
    request.headers.get('x-order-context-signature')))
   return failure('invalid-private-source-signature',401);
  let payload;
  try{payload=JSON.parse(raw);}catch{return failure('invalid-private-json',400);}
  if(!validRequest(payload))return failure('invalid-or-expired-private-request',400);
  let inspected;
  try{
   inspected=await inspectT12EmployeeOrderFinanceCandidate({
    db:env.DB,orderId:payload.orderId,
    expectedOfficialCustomerId:payload.customerId
   });
  }catch{return failure('original-t12-source-reader-unavailable',503);}
  const context=contextFromOriginal(inspected,payload);
  if(!context)return failure('original-order-customer-context-unqualified',409);
  const response=JSON.stringify(context);
  if(response.length>MAX_RESPONSE_CHARS)
   return failure('context-reply-oversized',503);
  try{
   return new Response(response,{status:200,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','x-content-type-options':'nosniff',
    'x-order-context-signature':await signBody(
     env.TRENDOS_ORDER_CONTEXT_HMAC_V1,response)
   }});
  }catch{return failure('private-reply-signing-unavailable',503);}
 }
};
