import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const events=[];
const windowObject={
  MATBAGY_EMPLOYEE_NATIVE_AUTH_V1:true,
  MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1:false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1:false,
  MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES:[],
  MATBAGY_EMPLOYEE_API_URL:'https://trendos-d1-api.example.test',
  MATBAGY_EDGE_ORDERS_API_URL:'https://trendos-d1-api.example.test',
  dispatchEvent(ev){events.push(ev);return true;},
  CustomEvent:class CustomEvent{constructor(type,opts={}){this.type=type;this.detail=opts.detail||{};}}
};

let mode='verify-reject';
const sandbox={
  window:windowObject,console,URL,Set,Map,JSON,Error,AbortController,TextEncoder,
  setTimeout,clearTimeout,setInterval,clearInterval,
  fetch:async function(url){
    const u=String(url);
    let body={success:false,message:'Employee session rejected'};
    if(mode==='login-reject') body={success:false,message:'اسم المستخدم أو كلمة المرور غير صحيحة.'};
    if(mode==='password-reject') body={success:false,message:'كلمة المرور القديمة غير صحيحة.'};
    return {
      ok:false,
      status:401,
      url:u,
      async text(){return JSON.stringify(body);}
    };
  }
};
vm.runInNewContext(source,sandbox,{filename:'employee-api-dispatcher-v1.js'});

await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('verifyEmployeeSession',{username:'u',token:'stale'}),
  err=>err&&err.status===401
);
assert.equal(events.length,1);
assert.equal(events[0].type,'trendos:employee-session-invalid');
assert.equal(events[0].detail.status,401);

events.length=0; mode='login-reject';
await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('login',{username:'u',password:'bad'}),
  err=>err&&err.status===401
);
assert.equal(events.length,0,'bad login must not invalidate an unrelated existing session');

events.length=0; mode='password-reject';
await assert.rejects(
  ()=>windowObject.trendosEmployeeApiV1('changePassword',{username:'u',token:'valid',oldPassword:'bad',newPassword:'new-pass'}),
  err=>err&&err.status===401
);
assert.equal(events.length,0,'wrong old password must not be treated as session invalidation');

console.log('ENTRY652_RUNTIME_401_DISPATCH=PASS');
console.log('VERIFY_401_INVALIDATES=YES');
console.log('LOGIN_401_INVALIDATES=NO');
console.log('WRONG_OLD_PASSWORD_401_INVALIDATES=NO');
