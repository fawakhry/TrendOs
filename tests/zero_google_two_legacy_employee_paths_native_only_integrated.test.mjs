import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleLegacyBrowserTransport,
  LEGACY_BROWSER_ACTIONS
} from '../cloudflare-d1/src/legacy-browser-transport-v1.mjs';
import {handleEdgeGatewayRequest} from '../cloudflare-d1/src/edge-gateway.mjs';

// Source-level, fully fabricated integration. No customer/employee credentials,
// real Apps Script, D1 or Cloudflare service is used.
const origin='https://fawakhry.github.io';
const google='https://script.google.com/macros/s/FAKE-NO-NETWORK/exec';
const fakeEnv=flag=>({
  CORS_ORIGINS:origin,
  EDGE_SESSION_SECRET:'FAKE_ONLY_EDGE_SESSION_SECRET',
  APPS_SCRIPT_API_URL:google,
  TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:flag
});
const legacy=action=>new Request('https://edge.invalid/v1/legacy-api',{
  method:'POST',headers:{Origin:origin,'content-type':'application/json'},
  body:JSON.stringify({action,username:'fake-staff',token:'never-a-real-token'})
});
const edge=()=>new Request('https://edge.invalid/v1/edge/session',{
  method:'POST',headers:{Origin:origin,'content-type':'application/json'},
  body:JSON.stringify({username:'fake-staff',token:'never-a-real-token'})
});
const employeeActions=['login','verifyEmployeeSession','operatorTaskV2','hrV1',
  'attendanceV1','getDashboard','getAccounting'];
const customerActions=['customerLogin','customerLogout','changeCustomerPassword',
  'getCustomerOrders','getCustomerPortalAccountsV1859','createCustomerDraft',
  'addCustomerDraftItem','submitCustomerDraft','uploadCustomerDraftFile'];

test('Native-only true denies BOTH employee Google legacy endpoints before fetch',async()=>{
  const original=globalThis.fetch;
  let fetches=0;
  globalThis.fetch=async()=>{fetches++;throw Error('UNEXPECTED_EXTERNAL_FETCH');};
  try{
    for(const flag of ['true','TRUE',true]){
      for(const action of employeeActions){
        const [legacyResult,edgeResult]=await Promise.all([
          handleLegacyBrowserTransport(legacy(action),fakeEnv(flag)),
          handleEdgeGatewayRequest(edge(),fakeEnv(flag))
        ]);
        assert.equal(legacyResult.status,403,action);
        assert.equal(edgeResult.status,403,action);
        assert.equal((await legacyResult.json()).code,'LEGACY_EMPLOYEE_UPSTREAM_RETIRED');
        assert.equal((await edgeResult.json()).code,'LEGACY_EDGE_SESSION_NATIVE_ONLY');
      }
    }
    assert.equal(fetches,0,'neither path may reach Google for a Native-only employee');
  }finally{globalThis.fetch=original;}
});

test('residual customer-session Apps Script actions are explicitly NOT Zero Google',async()=>{
  for(const action of customerActions){
    assert.equal(LEGACY_BROWSER_ACTIONS.has(action),true,action);
  }
  const original=globalThis.fetch;
  const calls=[];
  globalThis.fetch=async(url,options)=>{
    calls.push({url:String(url),method:options?.method??''});
    return new Response(JSON.stringify({success:true,fixture:'synthetic-only'}),{
      status:200,headers:{'content-type':'application/json'}
    });
  };
  try{
    const response=await handleLegacyBrowserTransport(legacy('getCustomerOrders'),fakeEnv('true'));
    assert.equal(response.status,200);
    assert.equal(calls.length,1);
    assert.equal(calls[0].url,google,'customer path still depends on legacy Google by design');
    assert.equal(calls[0].method,'POST');
  }finally{globalThis.fetch=original;}
});
