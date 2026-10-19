import assert from 'node:assert/strict';
import {
  verifyEmployeeSessionCloudFirst,
  verifyEmployeeSessionViaPost,
  handleCloudSessionBridgeV3
} from '../cloudflare-d1/src/cloud-session-bridge-v3.mjs';
import { employeeLegacyGoogleUpstreamDisabled } from '../cloudflare-d1/src/employee-legacy-google-cutover-guard-v1.mjs';

// A real Worker route with an intentionally absent D1 binding behaves as a
// Native-session MISS; the fake network spy then detects forbidden fallback.
// No real employee identity, session, Cloudflare service, or Google request.
const fakeOrigin='https://ui.example.test';
const upstream='https://script.google.com/macros/s/FAKE-ONLY-NETWORK-SPY/exec';
const flags=['true','TRUE',true,'1','yes','on',' ON ','tru','unexpected-value'];
const disabled=[undefined,null,'','false','FALSE','off','no','0'];
const env=flag=>({
  TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:flag,
  CORS_ORIGINS:fakeOrigin,
  EDGE_SESSION_SECRET:'fake-only-edge-session-signing-key-not-production',
  APPS_SCRIPT_API_URL:upstream,
  // No DB: native miss, must not fall through to Google for Native-only.
  DB:undefined
});
const makeReq=(path)=>new Request('https://cloud.example.test'+path,{
  method:'POST',
  headers:{Origin:fakeOrigin,'content-type':'application/json'},
  body:JSON.stringify({username:'FAKE_STAFF',token:'FAKE_SECRET_SESSION'})
});
const originalFetch=globalThis.fetch;
let calls=0;
globalThis.fetch=async(url,options)=>{
  calls++;
  assert.equal(String(url),upstream);
  assert.equal(options.method,'POST');
  return new Response(JSON.stringify({
    success:true,user:{username:'FAKE_STAFF',role:'service',department:'التصميم'}
  }),{status:200,headers:{'content-type':'application/json'}});
};
try{
  for(const flag of flags){
    assert.equal(employeeLegacyGoogleUpstreamDisabled(env(flag)),true,String(flag));
    const prior=calls;
    const verified=await verifyEmployeeSessionCloudFirst('FAKE_STAFF','FAKE_SECRET_SESSION',env(flag));
    assert.equal(verified.ok,false,String(flag));
    assert.equal(verified.kind,'auth',String(flag));
    assert.equal(verified.authSource,'d1-native-employee-v1');
    assert.equal(calls,prior,String(flag)+': native miss MUST NOT reach Google');

    const direct=await verifyEmployeeSessionViaPost('FAKE_STAFF','FAKE_SECRET_SESSION',env(flag));
    assert.equal(direct.ok,false,String(flag)+': direct helper must not bypass guard');
    assert.equal(direct.kind,'auth',String(flag));
    assert.equal(calls,prior,String(flag)+': direct helper MUST NOT reach Google');

    for(const path of ['/v1/edge/session','/v1/edge/orders/session']){
      const reply=await handleCloudSessionBridgeV3(makeReq(path),env(flag));
      assert.equal(reply.status,401,String(flag)+' '+path);
      const payload=await reply.json();
      assert.equal(payload.success,false);
      assert.equal(payload.code,'employee-session-rejected');
      assert.equal(JSON.stringify(payload).includes('FAKE_SECRET_SESSION'),false);
      assert.equal(reply.headers.get('cache-control'),'no-store');
      assert.equal(calls,prior,String(flag)+' '+path+' MUST NOT reach Google');
    }
  }
  for(const flag of disabled){
    assert.equal(employeeLegacyGoogleUpstreamDisabled(env(flag)),false,String(flag));
    const prior=calls;
    const verified=await verifyEmployeeSessionCloudFirst('FAKE_STAFF','FAKE_SECRET_SESSION',env(flag));
    assert.equal(verified.ok,true,String(flag));
    assert.equal(verified.authSource,'apps-script-post',String(flag));
    assert.equal(calls,prior+1,'only explicit OFF keeps compatibility');
  }
  // OPTIONS is CORS preflight, not an auth decision and never sends credentials.
  const before=calls;
  const preflight=await handleCloudSessionBridgeV3(
    new Request('https://cloud.example.test/v1/edge/orders/session',{
      method:'OPTIONS',headers:{Origin:fakeOrigin}
    }),env('tru'));
  assert.equal(preflight.status,204);
  assert.equal(calls,before);
  console.log('ZERO_GOOGLE_CLOUD_BRIDGE_TWO_ROUTES_NATIVE_ONLY=PASS');
  console.log('ZERO_GOOGLE_CLOUD_BRIDGE_DIRECT_UPSTREAM_FAIL_CLOSED=PASS');
  console.log('ZERO_GOOGLE_CLOUD_BRIDGE_EXPLICIT_OFF_COMPATIBILITY=PASS');
  console.log('ZERO_GOOGLE_CUSTOMER_LEGACY_MIGRATION=STILL_OPEN');
  console.log('PRODUCTION_MUTATION=NO');
} finally{
  globalThis.fetch=originalFetch;
}
