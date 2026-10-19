/*
 * Entry660 — first future customer Google-less read lane, SOURCE ONLY / OFF.
 *
 * NOT imported by the deployed index_v2 Worker and DOES NOT replace the
 * customer getCustomerOrders Google action. Existing employee/orders D1 code
 * remains owned by its existing agent. This module is a prepared isolated
 * handler requiring an explicit env flag AND already-proven D1-native session.
 *
 * The customer_id is derived ONLY from the verified D1 session fingerprint.
 * Never accept customer_id, code, phone, name, owner link, or role from URL.
 */
export const CUSTOMER_NATIVE_ORDERS_READ_PATH_V0='/v1/customer/native/orders';
export const CUSTOMER_NATIVE_ORDERS_READ_VERSION_V0='ENTRY660_CUSTOMER_NATIVE_ORDERS_READ_OFF_V0';
const SESSION_MAX_MS=8*60*60*1000;
const MAX_PAGE=40;
const text=x=>String(x==null?'':x).trim();
const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const isInt=x=>Number.isSafeInteger(x);
const hex=a=>Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');

export async function fingerprintCustomerSessionV0(token,secret){
  if(!hex64(token)||typeof secret!=='string'||secret.length<32)
    throw new TypeError('invalid-customer-native-session-context');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new TextEncoder().encode(JSON.stringify(['trendos-customer-native-session-v1',token]));
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC',key,bytes)));
}

// Only independently enrolled ACTIVE accounts qualify. The account/customer
// code equality is ONE additional check, not proof by itself. Session token is
// HMAC-fingerprinted; revocation and account version are rechecked every read.
// GENERAL-only until a separately approved per-customer CANARY policy exists.
export const CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0=`
SELECT a.customer_id AS customerId
  FROM customer_portal_native_sessions_v1 s
  JOIN customer_portal_native_accounts_v1 a
    ON a.customer_id=s.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE s.token_fingerprint_hex=?
   AND s.source='d1-customer-native'
   AND s.revoked_at_ms IS NULL
   AND s.issued_at_ms>0 AND s.issued_at_ms<=?
   AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
   AND s.expires_at_ms-s.issued_at_ms<=28800000
   AND a.session_version=s.session_version
   AND a.state='ACTIVE'
   AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000
   AND length(a.verified_enrollment_ref)>0
   AND c.active='نعم'
   AND TRIM(COALESCE(c.legacy_chat_code,''))<>''
   AND a.portal_code=TRIM(c.legacy_chat_code)
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
 LIMIT 1
`;

// SQL limits what may reach a customer. No historical Sheets matches, fuzzy
// name/phone matching, customer-wide employee reads or cross-user caching.
// Verified proof and current external_customer_id are both enforced.
export const CUSTOMER_NATIVE_ORDER_LINES_SQL_V0=`
SELECT o.order_id AS orderId, o.created_at AS createdAt,
       l.line_id AS lineId, l.ordinal AS ordinal,
       l.department AS department, l.item_name AS itemName,
       l.qty AS qty, COALESCE(rt.status,l.status) AS status
  FROM customer_portal_native_order_ownership_v1 own
  JOIN t12_prod_orders o ON o.order_id=own.order_id
  JOIN t12_prod_lines l ON l.order_id=o.order_id
  LEFT JOIN t12_prod_line_runtime rt ON rt.line_id=l.line_id
 WHERE own.customer_id=?
   AND own.status='VERIFIED'
   AND own.source='t12-cloud-native'
   AND own.proof_method='OWNER_REVIEWED_EXACT_ID'
   AND length(TRIM(own.proof_ref))>0
   AND length(TRIM(own.verified_by))>0
   AND length(TRIM(own.verified_at))>0
   AND (TRIM(COALESCE(o.external_customer_id,''))=''
        OR TRIM(o.external_customer_id)=own.customer_id)
 ORDER BY o.created_at DESC, o.order_id DESC, l.ordinal ASC
 LIMIT ? OFFSET ?
`;

function noGo(code){
  return {success:false,code,source:'customer-d1-native-read-v0',readOnly:true};
}
export async function readVerifiedCustomerOrderLinesV0({
  db,token,secret,nowMs,limit=20,offset=0
}={}){
  if(!db||typeof db.prepare!=='function')return {status:503,body:noGo('NATIVE_CUSTOMER_DB_UNAVAILABLE')};
  if(!isInt(nowMs)||nowMs<=0||!isInt(limit)||limit<1||limit>MAX_PAGE||
    !isInt(offset)||offset<0||offset>10000)
    return {status:400,body:noGo('INVALID_PAGE_OR_TIME')};
  if(!hex64(token))return {status:401,body:noGo('CUSTOMER_SESSION_REJECTED')};
  if(typeof secret!=='string'||secret.length<32)
    return {status:503,body:noGo('CUSTOMER_SESSION_SECRET_UNAVAILABLE')};
  let fingerprint;
  try{fingerprint=await fingerprintCustomerSessionV0(token,secret);}
  catch{return {status:401,body:noGo('CUSTOMER_SESSION_REJECTED')};}
  try{
    const verified=await db.prepare(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0)
      .bind(fingerprint,nowMs,nowMs).first();
    const customerId=text(verified&&verified.customerId);
    if(!customerId)return {status:401,body:noGo('CUSTOMER_SESSION_REJECTED')};
    // Fetch one extra line for hasMore without an unbounded source read.
    const query=await db.prepare(CUSTOMER_NATIVE_ORDER_LINES_SQL_V0)
      .bind(customerId,limit+1,offset).all();
    if(!query||!Array.isArray(query.results))
      return {status:503,body:noGo('CUSTOMER_ORDER_READ_UNAVAILABLE')};
    const rows=query.results.slice(0,limit);
    const lines=rows.map(r=>({
      orderId:text(r.orderId),createdAt:text(r.createdAt),
      lineId:text(r.lineId),ordinal:Number(r.ordinal),
      department:text(r.department),itemName:text(r.itemName),
      qty:Number(r.qty),status:text(r.status)
    }));
    // Defense in depth against malformed D1/adapter data.
    if(lines.some(x=>!x.orderId||!x.lineId||!x.itemName||
      !isInt(x.ordinal)||x.ordinal<1||!Number.isFinite(x.qty)||x.qty<=0))
      return {status:503,body:noGo('CUSTOMER_ORDER_ROW_INVALID')};
    return {status:200,body:{
      success:true,version:CUSTOMER_NATIVE_ORDERS_READ_VERSION_V0,
      source:'customer-d1-native-read-v0',readOnly:true,
      lines,limit,offset,
      hasMore:query.results.length>limit
    }};
  }catch{
    // No SQL details/IDs/credentials leak and NEVER fallback to Apps Script.
    return {status:503,body:noGo('CUSTOMER_NATIVE_SCHEMA_OR_READ_UNAVAILABLE')};
  }
}

function json(body,status,headers={}){
  return new Response(JSON.stringify(body),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',...headers
  }});
}
export function isCustomerNativeOrdersReadPathV0(path){
  return (text(path).replace(/\/+$/,'')||'/')===CUSTOMER_NATIVE_ORDERS_READ_PATH_V0;
}

// Deliberately NOT wired to the Worker. An explicit OFF-by-default source
// switch is additional protection if an agent imports this in future.
export async function handleCustomerNativeOrdersReadV0(request,env={}){
  const url=new URL(request.url);
  if(!isCustomerNativeOrdersReadPathV0(url.pathname))
    return json(noGo('NATIVE_CUSTOMER_ROUTE_NOT_FOUND'),404);
  const origin=text(request.headers.get('Origin'));
  const allowed=text(env.CORS_ORIGINS).split(',').map(text).filter(Boolean);
  if(origin&&!allowed.includes(origin))return json(noGo('ORIGIN_FORBIDDEN'),403);
  const cors=origin?{
    'access-control-allow-origin':origin,'vary':'Origin',
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'authorization,content-type'
  }:{};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='GET')return json(noGo('METHOD_NOT_ALLOWED'),405,cors);
  if(env.TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED!=='true')
    return json(noGo('CUSTOMER_NATIVE_ORDER_ROUTE_OFF'),503,cors);
  // The bearer token is only a non-logged secret; nothing is accepted from
  // browser IDs, cookies, forwarded user headers or legacy customer codes.
  const auth=text(request.headers.get('Authorization'));
  const bearer=/^Bearer\s+([a-f0-9]{64})$/i.exec(auth);
  const token=bearer?bearer[1].toLowerCase():'';
  const rawLimit=url.searchParams.get('limit');
  const rawOffset=url.searchParams.get('offset');
  const page=(raw,fallback)=>raw==null?fallback:
    /^\d+$/.test(raw)?Number(raw):NaN;
  const result=await readVerifiedCustomerOrderLinesV0({
    db:env.DB,secret:env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET,
    token,nowMs:Date.now(),limit:page(rawLimit,20),offset:page(rawOffset,0)
  });
  return json(result.body,result.status,cors);
}

export const CUSTOMER_NATIVE_ORDERS_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,defaultEnabled:false,
  genuineCustomerSessionsIssuedHere:false,customerMutation:false,
  googleFallback:false,financeRead:false,
  productionRelease:'NO_GO',zeroGoogleComplete:false
});
