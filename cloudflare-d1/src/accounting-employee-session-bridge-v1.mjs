/**
 * ACC236: private ORIGINAL native employee-session verification across D1s.
 * No separate identity issuer, no session minting, no employee roster copy.
 * Service binding + independent HMAC key; offline/source-only until Stage gates.
 */
import {signBody,verifyBody} from './accounting-customer-facts-contract-v1.mjs';
export const VERSION='EASYSTORE_TRENDOS_NATIVE_SESSION_VERIFY_V1';
export const PATH='/internal/easystore/native-employee-session/v1';
const DOMAIN='ACC236_NATIVE_SESSION_VERIFY_V1\n';
const clean=v=>typeof v==='string'?v.trim():'';
function validUsername(v){return typeof v==='string'&&v.length>=2&&v.length<=128&&
  v===v.trim()&&!/[\u0000-\u001f\u007f]/u.test(v);}
export function validRequest(v,now=Date.now()){
  return !!v&&typeof v==='object'&&!Array.isArray(v)&&
    Object.keys(v).length===5&&
    ['version','username','token','issuedAt','nonce'].every(k=>Object.hasOwn(v,k))&&
    v.version===VERSION&&validUsername(v.username)&&
    typeof v.token==='string'&&v.token.length>=8&&v.token.length<=2048&&
    !/[\u0000-\u001f\u007f]/u.test(v.token)&&
    Number.isSafeInteger(v.issuedAt)&&Math.abs(now-v.issuedAt)<=60000&&
    typeof v.nonce==='string'&&/^[a-f0-9-]{36}$/i.test(v.nonce);
}
export const signSessionBody=(secret,body)=>signBody(secret,DOMAIN+body);
export const verifySessionBody=(secret,body,mac)=>verifyBody(secret,DOMAIN+body,mac);
export async function verifyEmployeeSessionIsolatedV1(username,token,env){
  if(env?.EASYSTORE_EMPLOYEE_AUTH_SOURCE_V1!=='REMOTE_NATIVE_REQUIRED')
    throw Error('isolated-native-session-source-not-enforced');
  if(typeof env?.TRENDOS_EMPLOYEE_SESSION?.fetch!=='function')
    throw Error('native-session-source-binding-missing');
  const req={version:VERSION,username:clean(username),token:clean(token),
    issuedAt:Date.now(),nonce:crypto.randomUUID()};
  if(!validRequest(req))return {ok:false,message:'Employee session rejected'};
  const body=JSON.stringify(req),secret=env?.TRENDOS_EMPLOYEE_SESSION_HMAC_V1;
  const response=await env.TRENDOS_EMPLOYEE_SESSION.fetch(
    new Request('https://trendos-native-session.internal'+PATH,{
      method:'POST',headers:{'content-type':'application/json',
        'x-native-session-mac':await signSessionBody(secret,body)},body})
  );
  if(!response.ok)return {ok:false,message:'Employee session rejected'};
  const raw=await response.text();
  if(raw.length>4096||!await verifySessionBody(secret,raw,
      response.headers.get('x-native-session-mac')))
    throw Error('native-session-response-untrusted');
  let v;try{v=JSON.parse(raw);}catch{throw Error('native-session-response-invalid-json');}
  if(!v||Object.keys(v).sort().join(',')!==
      ['authSource','expiresAtMs','issuedAt','nonce','ok','user','version'].sort().join(',')||
    v.version!==VERSION||v.nonce!==req.nonce||v.issuedAt!==req.issuedAt||
    v.ok!==true||v.authSource!=='d1-native-employee-v1-readonly'||
    !Number.isSafeInteger(v.expiresAtMs)||v.expiresAtMs<=Date.now()||
    v.expiresAtMs>Date.now()+86400000||
    !v.user||Object.keys(v.user).sort().join(',')!==['username','role','department'].sort().join(',')||
    !validUsername(v.user.username)||!['admin','service','print','press','laser'].includes(v.user.role)||
    typeof v.user.department!=='string'||v.user.department.length>120)
    throw Error('native-session-response-invalid-claims');
  return {ok:true,body:{success:true,user:v.user,username:v.user.username},
    authSource:v.authSource};
}
