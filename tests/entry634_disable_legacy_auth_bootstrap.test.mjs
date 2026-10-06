import assert from 'node:assert/strict';
import {
  handleEmployeeNativeAuthRequest,
  employeeAuthLegacyBootstrapEnabled,
  employeeAuthNativeOnlyEnabled
} from '../cloudflare-d1/src/employee-auth-native-v1.mjs';

function dbNoUser(){
  return {
    prepare(sql){
      return {
        bind(){ return this; },
        async first(){
          if(String(sql).includes('employee_auth_control_v1')){
            return {marker:'T12_EMPLOYEE_AUTH_V1',mode:'TRANSITIONAL',policyEpoch:23};
          }
          if(String(sql).includes('FROM employee_auth_users_v1')) return null;
          return null;
        },
        async run(){ return {success:true}; }
      };
    }
  };
}

const env={
  DB:dbNoUser(),
  TRENDOS_EMPLOYEE_AUTH_V1_ENABLED:'true',
  TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED:'false',
  TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1:'false',
  TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED:'false',
  APPS_SCRIPT_API_URL:'https://example.invalid/legacy-login'
};
assert.equal(employeeAuthLegacyBootstrapEnabled(env),false);
assert.equal(employeeAuthNativeOnlyEnabled(env),false);

let upstreamCalls=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{upstreamCalls+=1;throw new Error('legacy upstream must not be called');};
try{
  const req=new Request('https://trendos-d1-api.example.test/v1/employee/auth/login',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({username:'not-native-yet',password:'x'})
  });
  const res=await handleEmployeeNativeAuthRequest(req,env);
  const body=await res.json();
  assert.equal(res.status,409);
  assert.equal(body.success,false);
  assert.equal(body.code,'employee-native-migration-required');
  assert.equal(upstreamCalls,0);
} finally {
  globalThis.fetch=originalFetch;
}

console.log('ENTRY634_BOOTSTRAP_DISABLED_FAIL_CLOSED=PASS');
console.log('ENTRY634_APPS_SCRIPT_FETCH_CALLS=0');
console.log('ENTRY634_NATIVE_ONLY_REMAINS=false');
console.log('ENTRY634_PRODUCTION_MUTATION=NO');
