/*
 * T12 standalone TEST Worker candidate. NOT imported by production Worker,
 * not referenced by production Wrangler. DEFAULT OFF. NO production DB binding.
 * Dedicated NEW Cloudflare TEST D1 binding name: T12_SYNTHETIC_DB.
 * Do not deploy before owner confirms a separate newly created TEST database.
 * Only fabricated records permitted; never copy customers/orders/backup here.
 */
import {createT12CloudNativeSynthetic} from '../src/t12-cloud-native-synthetic-create.mjs';

export const T12_SYNTHETIC_TEST_ROUTE='/__t12/synthetic/order-create';
function json(data,status){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store'
  }});
}
const fail=(code,status=423)=>json({
  success:false,syntheticOnly:true,productionAuthorized:false,code
},status);
const enabled=x=>String(x||'').toLowerCase()==='true';
async function hasPrivateTestBearer(request,secret){
  const actual=String(request.headers.get('Authorization')||'');
  const match=/^Bearer ([A-Za-z0-9._~-]{32,256})$/.exec(actual);
  if(!match||typeof secret!=='string'||secret.length<32)return false;
  const subtle=globalThis.crypto&&globalThis.crypto.subtle;
  if(!subtle)return false;
  const enc=new TextEncoder();
  const [x,y]=await Promise.all([
    subtle.digest('SHA-256',enc.encode(match[1])),
    subtle.digest('SHA-256',enc.encode(secret))
  ]);
  const a=new Uint8Array(x),b=new Uint8Array(y);
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
export async function handleT12SyntheticTestRequest(request,env={}){
  if(new URL(request.url).pathname!==T12_SYNTHETIC_TEST_ROUTE)
    return fail('test-route-not-found',404);
  if(request.method!=='POST')return fail('test-post-only',405);
  if(!enabled(env.T12_SYNTHETIC_TEST_ENABLED))
    return fail('test-disabled');
  // Refuse any accidentally copied production Worker binding/configuration.
  if(env.DB||env.APPS_SCRIPT_API_URL||env.EDGE_SESSION_SECRET||
     !env.T12_SYNTHETIC_DB||typeof env.T12_SYNTHETIC_DB.batch!=='function'||
     env.T12_SYNTHETIC_TEST_ATTESTATION!=='ISOLATED_T12_SYNTHETIC_ONLY')
    return fail('test-database-isolation-not-proven',503);
  if(!env.T12_SYNTHETIC_TEST_BEARER_SECRET||
     String(env.T12_SYNTHETIC_TEST_BEARER_SECRET).length<32)
    return fail('test-auth-not-configured',503);
  if(!await hasPrivateTestBearer(request,env.T12_SYNTHETIC_TEST_BEARER_SECRET))
    return fail('test-unauthorized',401);
  let p;
  try{p=await request.json();}catch{return fail('invalid-test-json',400);}
  if(!p||Object.prototype.toString.call(p)!=='[object Object]'||
     !String(p.customerName||'').startsWith('SYNTHETIC TEST ')||
     String(p.customerPhone||'')!=='01000000000'||
     !String(p.itemName||'').startsWith('TEST '))
    return fail('fabricated-test-records-only',400);
  const out=await createT12CloudNativeSynthetic(
    env.T12_SYNTHETIC_DB,p,'T12-SYNTHETIC-OPERATOR',{
      mode:'isolated-cloud-native-synthetic-qualification',
      allowSyntheticBusinessCreate:true,
      testDatabaseIsolationVerified:true,
      googleCreateFrozenInTest:true,
      r5MirrorFencedInTest:true,
      edgeSessionVerifiedInTest:true
    }
  );
  const status=out.success?(out.idempotent?200:201):
    (out.reason==='same-key-actor-or-payload-conflict'?409:
    (out.reason==='transaction-outcome-unknown-no-retry'||out.reason==='committed-data-not-verified-no-retry'?503:422));
  // No customer records, original private key/value backup or auth in log.
  return json(out,status);
}
export default {fetch:handleT12SyntheticTestRequest};
