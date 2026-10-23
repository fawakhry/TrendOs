/*
 * TrendOS customer platform — independently deployable STAGE-ONLY Worker V0.
 *
 * NOT imported from production-shadow/index.js or src/index_v2.js.
 * No existing employee/T12/Google route, live D1 customer master, auth bridge,
 * finance writer or default Wrangler config is touched. NO deployment.
 */
import {
  CUSTOMER_NATIVE_ORDERS_READ_PATH_V0,
  handleCustomerNativeOrdersReadV0
} from '../src/customer-portal-native-orders-v0.mjs';
import {
  isCustomerNativeLogoutPathV0,
  handleCustomerNativeLogoutV0
} from '../src/customer-portal-native-logout-v0.mjs';
import {
  CUSTOMER_NATIVE_LOGIN_HTTP_PATH_V0,
  handleCustomerNativeLoginHttpV0
} from '../src/customer-portal-native-login-http-off-v0.mjs';

import {createCustomerStageDurableRateGateV0}
  from './login-throttle-v0.mjs';
export {CustomerLoginThrottleStageV0}
  from './login-throttle-v0.mjs';

const PATHS=Object.freeze([
  CUSTOMER_NATIVE_LOGIN_HTTP_PATH_V0,
  '/v1/customer/native/logout',
  CUSTOMER_NATIVE_ORDERS_READ_PATH_V0
]);
const OWN_STAGE_MODE='isolated-customer-stage-v0';
const text=x=>typeof x==='string'?x.trim():'';
const json=(code,status=503)=>new Response(
  JSON.stringify({success:false,code,source:'customer-stage-isolated-v0'}),
  {status,headers:{'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','x-content-type-options':'nosniff'}}
);
function originAllowed(request,env){
  const origin=text(request.headers.get('Origin'));
  if (!origin||origin==='null') return false;
  const origins=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  // No wildcard or default production browser origin.
  return origins.length>0&&origins.includes(origin);
}
function isCustomerStagePathV0(path){
  return PATHS.includes(path);
}
export default {
  async fetch(request,env={}){
    let url;
    try { url=new URL(request.url); }
    catch{return json('CUSTOMER_STAGE_BAD_URL',400);}
    // No forwards to base Worker or Apps Script, even on unknown route.
    const path=url.pathname;
    if (!isCustomerStagePathV0(path))
      return json('CUSTOMER_STAGE_ROUTE_NOT_FOUND',404);
    // Independent stage-only environment guard; checked-in config is OFF.
    // This intentionally does NOT rely on a browser flag or a production var.
    if (env.TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED!=='true'||
        env.TRENDOS_CUSTOMER_PORTAL_STAGE_MODE!==OWN_STAGE_MODE)
      return json('CUSTOMER_STAGE_OFF',503);
    if (!originAllowed(request,env))
      return json('CUSTOMER_STAGE_ORIGIN_FORBIDDEN',403);
    // Reject user-controlled customerId/code/phone, unexpected query and hash.
    // Only the original orders handler may accept bounded pagination values.
    if (url.hash||
        (path!==CUSTOMER_NATIVE_ORDERS_READ_PATH_V0&&url.search)||
        (path===CUSTOMER_NATIVE_ORDERS_READ_PATH_V0&&
         Array.from(url.searchParams.keys()).some(x=>!['limit','offset'].includes(x))))
      return json('CUSTOMER_STAGE_QUERY_DENIED',400);
    // These handlers each require a second independent env flag and secure
    // D1/secret/bearer/origin evidence, so an accidental single-flag enable
    // still cannot allow public login or mutation.
    try{
      if (path===CUSTOMER_NATIVE_LOGIN_HTTP_PATH_V0) {
        // Authoritative Stage binding only. Never trust an injected fake
        // env.CUSTOMER_NATIVE_LOGIN_RATE_GATE_V0 in a deployed Worker.
        const rateGate=createCustomerStageDurableRateGateV0(env);
        return await handleCustomerNativeLoginHttpV0(request,{
          ...env,CUSTOMER_NATIVE_LOGIN_RATE_GATE_V0:rateGate
        });
      }
      if (isCustomerNativeLogoutPathV0(path))
        return await handleCustomerNativeLogoutV0(request,env);
      return await handleCustomerNativeOrdersReadV0(request,env);
    }catch{
      // No data, password, DB error, tenant identifiers or stack leak.
      return json('CUSTOMER_STAGE_REQUEST_UNAVAILABLE',503);
    }
  }
};

