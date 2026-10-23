/** ACC235 read-only official T12 customer facts; internal service binding only.
 * No finance SQL, no employee authentication substitute, no financial POST.
 * Deployment is intentionally gated and the Worker has no public route.
 */
import {PATH,VERSION,validEnvelope,verifyBody,signBody,safeCustomers,MAX_RESPONSE_CHARS}
  from '../src/accounting-customer-facts-contract-v1.mjs';

function reply(code,status=403) {
  return new Response(JSON.stringify({success:false,code}),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store'
  }});
}
async function readFacts(env,e) {
  let sql='SELECT customer_id,customer_name,manager,phone,extra_phone,customer_type,active FROM t12_customers ';
  let args=[];
  if(e.operation==='BY_ID'){sql+='WHERE customer_id=? LIMIT 1';args=[e.customerId];}
  else if(e.operation==='EXACT_NAME'){
    sql+='WHERE lower(customer_name)=lower(?) ORDER BY customer_id LIMIT 2';
    args=[e.name];
  }else if(e.operation==='SEARCH_NAME'){
    const escaped=e.query.replace(/[\\%_]/g, x=>'\\'+x);
    sql+="WHERE active='نعم' AND lower(customer_name) LIKE lower(?) ESCAPE '\\' ORDER BY updated_at DESC,customer_id LIMIT ?";
    args=['%'+escaped+'%',e.limit];
  }else{
    sql+="WHERE active='نعم' ORDER BY updated_at DESC,customer_id LIMIT ?";
    args=[e.limit];
  }
  const stmt=env.DB.prepare(sql).bind(...args);
  const records=e.operation==='BY_ID'?[await stmt.first()].filter(Boolean):(await stmt.all()).results||[];
  return safeCustomers(records,e.limit);
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if (url.pathname!==PATH) return reply('not-found',404);
    if(request.method!=='POST') return reply('method-not-allowed',405);
    if(env?.TRENDOS_CUSTOMER_FACTS_SOURCE_V1!=='ENFORCE' || !env?.DB ||
      typeof env.TRENDOS_CUSTOMER_FACTS_HMAC_V1!=='string' ||
      env.TRENDOS_CUSTOMER_FACTS_HMAC_V1.length<32)
      return reply('operational-facts-source-disabled',503);
    try {
      const raw=await request.text();
      if(raw.length>4096 ||
         !await verifyBody(env.TRENDOS_CUSTOMER_FACTS_HMAC_V1,raw,
           request.headers.get('x-trendos-customer-facts-signature'))) return reply('unauthorized',401);
      let e;try{e=JSON.parse(raw);}catch{return reply('invalid-envelope',400);}
      if(!validEnvelope(e))return reply('invalid-or-expired-envelope',400);
      const customers=await readFacts(env,e);
      const payload=JSON.stringify({version:VERSION,nonce:e.nonce,issuedAt:e.issuedAt,
        source:'TrendOS',financialAuthority:false,customers});
      if(payload.length>MAX_RESPONSE_CHARS)return reply('facts-response-overflow',503);
      return new Response(payload,{status:200,headers:{
        'content-type':'application/json; charset=utf-8','cache-control':'no-store',
        'x-trendos-customer-facts-signature':
          await signBody(env.TRENDOS_CUSTOMER_FACTS_HMAC_V1,payload)
      }});
    }catch {
      // Never expose SQL, operational records or exceptions to callers.
      return reply('operational-customer-facts-unavailable',503);
    }
  }
};
