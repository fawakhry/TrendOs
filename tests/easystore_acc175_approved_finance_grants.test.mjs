import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8')
  .replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'')
  .replace(/^export /gm,'');
assert.ok(source.includes('function approvedAccountingModeV1('));
let trusted={username:'ACC175_SYNTHETIC_PRINCIPAL',role:'admin',department:'إدارة'};
const sandbox={
 TextEncoder,Response,Request,Headers,URL,URLSearchParams,Date,Intl,Math,JSON,console,
 verifyEmployeeSessionCloudFirst:async (username,token)=>{
   if(username!=='ACC175_SYNTHETIC_PRINCIPAL'||token!=='ACC175_LOCAL_FAKE_TOKEN'){
     return {ok:false,message:'fake session rejected'};
   }
   return {ok:true,authSource:'ACC175_FAKE_VERIFIED_SESSION',
     body:{user:{...trusted}}};
 }
};
const ctx=vm.createContext(sandbox);
vm.runInContext(source+"\n;globalThis.ACC175_AUTH=authenticate;globalThis.ACC175_WORKER=handleEmployeeAccountingNativeRequest;",ctx,{timeout:12000});
const req=(user='ACC175_SYNTHETIC_PRINCIPAL',token='ACC175_LOCAL_FAKE_TOKEN')=>
 new Request('https://acc175.invalid/v1/employee/accounting',{
   method:'POST',headers:{Origin:'https://fawakhry.github.io',
     Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({action:'saveEasyStorePurchaseV2',username:user,role:'admin',department:'إدارة'})
 });
const check=async (env={})=>ctx.ACC175_AUTH(req(),{
  username:'ACC175_SYNTHETIC_PRINCIPAL',role:'admin',department:'إدارة',
  token:'ACC175_WRONG_CLIENT_TOKEN'
},env);
const strict=(grants,mode='ENFORCE')=>({
 ACCOUNTING_FINANCE_GRANTS_MODE_V1:mode,
 ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify({version:1,grants})
});
const real='ACC175_SYNTHETIC_PRINCIPAL';
{
 const legacy=await check();
 assert.equal(legacy.ok,true,'unconfigured opt-in must not alter staff access');
 assert.equal(legacy.mode,'full');
 const downgraded=await check(strict([{username:real,mode:'print'}]));
 assert.equal(downgraded.ok,true);
 assert.equal(downgraded.mode,'print','approved policy must override verified admin claim');
 assert.equal(downgraded.department,'طباعة');
 const laser=await check(strict([{username:real,mode:'laser'}]));
 assert.equal(laser.ok,true);
 assert.equal(laser.mode,'laser');
 assert.equal(laser.department,'ليزر');
 const final=await check(strict([{username:real,mode:'final'}]));
 assert.equal(final.ok,true);
 assert.equal(final.mode,'final');
}
{
 trusted={username:real,role:'service',department:''};
 const deniedLegacy=await check();
 assert.equal(deniedLegacy.ok,false,'unconfigured service still has no finance access');
 const granted=await check(strict([{username:real,mode:'full'}]));
 assert.equal(granted.ok,true,'synthetic owner-approved roster is authoritative when enforced');
 assert.equal(granted.mode,'full');
 const absent=await check(strict([{username:'ACC175_SOME_OTHER_PERSON',mode:'full'}]));
 assert.equal(absent.ok,false,'client-supplied role/admin cannot override signed-in user mismatch');
 assert.equal(absent.status,403);
}
{
 // Deliberately suspicious verified employee name would pass legacy substring
 // heuristic; enforced exact roster must deny even when the client forges role.
 trusted={username:real,role:'admin',department:'foo'};
 const fuzzy=await check(strict([{username:'ACC175_SYNTHETIC',mode:'full'}]));
 assert.equal(fuzzy.ok,false,'substring identities are never enough in strict roster');
 const wildcard=await check(strict([{username:'ACC175_*',mode:'full'}]));
 assert.equal(wildcard.ok,false,'wildcard grants must be blocked');
 const dupe=await check(strict([{username:real,mode:'full'},{
   username:real.toLowerCase(),mode:'print'}]));
 assert.equal(dupe.ok,false,'duplicate normalized usernames deny all');
 const unknownRole=await check(strict([{username:real,mode:'admin'}]));
 assert.equal(unknownRole.ok,false);
 const unsupportedField=await check(strict([{username:real,mode:'full',admin:true}]));
 assert.equal(unsupportedField.ok,false);
 const noGrant=await check(strict([]));
 assert.equal(noGrant.ok,false,'empty policy must deny all rather than fall back');
 const invalidVersion=await check({
   ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
   ACCOUNTING_FINANCE_GRANTS_V1:JSON.stringify({version:2,grants:[{username:real,mode:'full'}]})
 });
 assert.equal(invalidVersion.ok,false);
 const invalidJson=await check({
   ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE',
   ACCOUNTING_FINANCE_GRANTS_V1:'{NOT_JSON'
 });
 assert.equal(invalidJson.ok,false);
 const missingRoster=await check({ACCOUNTING_FINANCE_GRANTS_MODE_V1:'ENFORCE'});
 assert.equal(missingRoster.ok,false);
 const wrongGate=await check(strict([{username:real,mode:'full'}],'ALLOW_ALL'));
 assert.equal(wrongGate.ok,false);
}
{
 trusted={role:'admin',department:'إدارة'};
 const untrustedFallback=await check(strict([{username:real,mode:'full'}]));
 assert.equal(untrustedFallback.ok,false,
   'missing username in verified cloud response must not reuse browser username to grant');
}
{
 trusted={username:real,role:'admin',department:'إدارة'};
 const badSession=await ctx.ACC175_AUTH(req(real,'INVALID_FAKE_TOKEN'),{username:real},
   strict([{username:real,mode:'full'}]));
 assert.equal(badSession.ok,false);
 assert.equal(badSession.status,401);
}
{
 // A policy granting full rights must never override Production READONLY.
 const readonlyEnv={
  ...strict([{username:real,mode:'full'}]),
  CORS_ORIGINS:'https://fawakhry.github.io',
  DB:{prepare:()=>({
    first:async()=>({mode:'READONLY',next_invoice_number:1,policy_epoch:1})
  })}
 };
 const deny=await ctx.ACC175_WORKER(req(),readonlyEnv);
 const result=await deny.json();
 assert.equal(deny.status,503);
 assert.equal(result.code,'employee-accounting-readonly');
}
console.log('ACC175_DEFAULT_LEGACY_STAFF_ACCESS_UNCHANGED=PASS');
console.log('ACC175_EXPLICIT_TRUSTED_IDENTITY_GRANT_AND_SCOPE=PASS');
console.log('ACC175_FUZZY_CLIENT_ROLE_WILDCARD_DUPLICATE_DENIED=PASS');
console.log('ACC175_MISSING_INVALID_POLICY_FAIL_CLOSED=PASS');
console.log('ACC175_MISSING_VERIFIED_IDENTITY_DENIED=PASS');
console.log('ACC175_INVALID_SESSION_DENIED=PASS');
console.log('ACC175_READONLY_ALWAYS_DENIES_FINANCE_POST=PASS');
console.log('ACC175_OWNER_ROSTER_ACTIVATION=NOT_PERFORMED');
console.log('ACC175_PRODUCTION_USER_PERMISSIONS_UNCHANGED=YES');
