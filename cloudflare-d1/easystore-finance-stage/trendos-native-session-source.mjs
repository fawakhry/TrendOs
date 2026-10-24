/** ACC236 private read-only ORIGINAL native session verification.
 * The SOURCE Worker only binds TrendOS operational Stage DB. No Google,
 * session creation, last_seen update, customer financial ledger or public URL.
 */
import {verifyNativeEmployeeSession} from '../src/employee-auth-native-v1.mjs';
import {VERSION,PATH,validRequest,signSessionBody,verifySessionBody}
  from '../src/accounting-employee-session-bridge-v1.mjs';

function rejected(code,status=401){
  return new Response(JSON.stringify({ok:false,code}),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store'
  }});
}
export default {async fetch(request,env){
  if(new URL(request.url).pathname!==PATH)return rejected('not-found',404);
  if(request.method!=='POST')return rejected('method-not-allowed',405);
  if(env?.TRENDOS_NATIVE_SESSION_SOURCE_V1!=='ENFORCE'||
    env?.TRENDOS_EMPLOYEE_AUTH_V1_ENABLED!=='true'||
    env?.TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1!=='true'||
    !env?.DB || typeof env?.TRENDOS_EMPLOYEE_SESSION_HMAC_V1!=='string'||
    env.TRENDOS_EMPLOYEE_SESSION_HMAC_V1.length<32)
    return rejected('source-disabled',503);
  try{
    const raw=await request.text();
    if(raw.length>4096||!await verifySessionBody(
      env.TRENDOS_EMPLOYEE_SESSION_HMAC_V1,raw,
      request.headers.get('x-native-session-mac')))return rejected('signature-rejected');
    let body;try{body=JSON.parse(raw);}catch{return rejected('malformed-body',400);}
    if(!validRequest(body))return rejected('expired-or-invalid-packet');
    // Require the ORIGINAL native auth control be in Native-only mode.
    const ctrl=await env.DB.prepare(
      "SELECT mode FROM employee_auth_control_v1 WHERE singleton=1 AND marker='T12_EMPLOYEE_AUTH_V1'"
    ).first();
    if(!ctrl||ctrl.mode!=='NATIVE')return rejected('native-auth-control-not-qualified',503);
    const native=await verifyNativeEmployeeSession(
      body.username,body.token,env,Date.now(),{readOnly:true}
    );
    const u=native?.body?.user;
    if(!native?.hit||!u||u.active!==true||u.mustChange===true||
      !Number.isSafeInteger(native.expiresAtMs)||
      !['admin','service','print','press','laser'].includes(u.role)||
      typeof u.username!=='string'||u.username.length>128)
      return rejected('native-session-rejected');
    const responseBody=JSON.stringify({
      version:VERSION,nonce:body.nonce,issuedAt:body.issuedAt,ok:true,
      user:{username:u.username,role:u.role,department:u.department},
      authSource:'d1-native-employee-v1-readonly',expiresAtMs:native.expiresAtMs
    });
    return new Response(responseBody,{status:200,headers:{
      'content-type':'application/json; charset=utf-8','cache-control':'no-store',
      'x-native-session-mac':
        await signSessionBody(env.TRENDOS_EMPLOYEE_SESSION_HMAC_V1,responseBody)
    }});
  }catch{return rejected('native-session-unavailable',503);}
}};
