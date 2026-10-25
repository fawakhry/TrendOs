/** ACC253 private signed live transport qualification, STILL finance OFF.
 * No user or customer input, no stored identity, no order, no money SQL writes.
 * Called only via private service binding under Stage OFF + temporary toggle.
 */
import {readOfficialCustomersV1} from '../src/accounting-customer-facts-contract-v1.mjs';
import {VERSION,PATH,signSessionBody}
  from '../src/accounting-employee-session-bridge-v1.mjs';
const response=(code,status=503)=>new Response(JSON.stringify({
  success:false,code,financeRelease:'NO_GO',financeWrites:'OFF'
}),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export async function signedSourceStageSmoke(env){
  if(typeof env?.TRENDOS_EMPLOYEE_SESSION_HMAC_V1!=='string' ||
     env.TRENDOS_EMPLOYEE_SESSION_HMAC_V1.length<32 ||
     typeof env?.TRENDOS_CUSTOMER_FACTS_HMAC_V1!=='string' ||
     env.TRENDOS_CUSTOMER_FACTS_HMAC_V1.length<32 ||
     typeof env?.TRENDOS_EMPLOYEE_SESSION?.fetch!=='function' ||
     typeof env?.TRENDOS_CUSTOMER_FACTS?.fetch!=='function')
    return response('stage-signed-bridges-not-bound');
  try {
    // Pinned valid envelope with nonexistent customer ID; no PII returned.
    // This validates HMAC signing, response MAC verification and nonce echo.
    const customers=await readOfficialCustomersV1(env,{
      operation:'BY_ID',customerId:'ACC253-PROBE-ABSENT'
    });
    if(!Array.isArray(customers)||customers.length!==0)
      return response('customer-stage-signed-source-not-empty');
    // Original operational Stage mode is intentionally OFF. A VALID signed
    // session packet must get the native-only-control 503 gate, rather than
    // the invalid HMAC 401 gate. Never create a session/user for this test.
    const v={version:VERSION,username:'acc253_probed_not_user',
      token:'ACC253_EXPLICIT_NONREAL_NO_SESSION_TOKEN',
      issuedAt:Date.now(),nonce:crypto.randomUUID()};
    const raw=JSON.stringify(v),secret=env.TRENDOS_EMPLOYEE_SESSION_HMAC_V1;
    const result=await env.TRENDOS_EMPLOYEE_SESSION.fetch(new Request(
      'https://private-stage-session.internal'+PATH,{method:'POST',
      headers:{'content-type':'application/json',
        'x-native-session-mac':await signSessionBody(secret,raw)},body:raw
    }));
    const body=await result.json();
    if(result.status!==503 || body?.code!=='native-auth-control-not-qualified')
      return response('native-source-valid-signature-or-off-control-unverified');
    return new Response(JSON.stringify({
      success:true,code:'ACC253_LIVE_SIGNED_INTERNAL_STAGE_SOURCE_PASS',
      customerFactsHmacAuthenticated:true,employeePacketHmacAccepted:true,
      nativeAuthControl:'OFF',financeWrites:'OFF',financeRelease:'NO_GO',
      employeeLoginQualified:false,customerIdentityQualified:false,
      invoicePostingQualified:false
    }),{status:200,headers:{
      'content-type':'application/json; charset=utf-8','cache-control':'no-store'
    }});
  }catch{return response('isolated-stage-signed-source-smoke-unavailable');}
}
