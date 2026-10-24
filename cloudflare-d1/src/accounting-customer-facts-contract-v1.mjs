/**
 * ACC235: narrow, private TrendOS -> EasyStore official CUSTOMER FACT read.
 * NOT ACCOUNTING_CONNECTOR_CONTRACT_V1 financial event authority.
 * Uses internal Worker service binding + separately provisioned shared HMAC
 * secret. No public URL, CORS, browser key or data writes.
 */
export const VERSION = 'TRENDOS_CUSTOMER_FACTS_V1';
export const PATH = '/internal/easystore/customer-facts/v1';
export const MAX_SKEW_MS = 60000;
export const MAX_RESPONSE_CHARS = 1000000;
const enc = new TextEncoder();
const idPattern = /^[\p{L}\p{N}_.:\-]{3,180}$/u;
const ops = new Set(['BY_ID','EXACT_NAME','SEARCH_NAME','LIST_ACTIVE']);
const text = v => typeof v === 'string' ? v.trim() : '';
export const validId = v => idPattern.test(text(v));
export const validName = v => text(v).length >= 1 && text(v).length <= 160 &&
  !/[\u0000-\u001f\u007f]/u.test(v);
export const validQuery = v => text(v).length >= 1 && text(v).length <= 80 &&
  !/[\u0000-\u001f\u007f]/u.test(v);
export const limitFor = n => Number.isInteger(n) && n >= 1 && n <= 500;
export function validEnvelope(x, now = Date.now()) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
  const keys = ['version','operation','customerId','name','query','limit','issuedAt','nonce'];
  if (Object.keys(x).length !== keys.length || keys.some(k=>!Object.hasOwn(x,k))) return false;
  if (x.version !== VERSION || !ops.has(x.operation) || !limitFor(x.limit) ||
    !Number.isSafeInteger(x.issuedAt) || Math.abs(now-x.issuedAt)>MAX_SKEW_MS ||
    typeof x.nonce !== 'string' || !/^[a-f0-9-]{36}$/i.test(x.nonce)) return false;
  if (x.operation==='BY_ID') return validId(x.customerId) &&
    x.name==='' && x.query==='' && x.limit===1;
  if (x.operation==='EXACT_NAME') return x.customerId==='' &&
    validName(x.name) && x.query==='' && x.limit===2;
  if (x.operation==='SEARCH_NAME') return x.customerId==='' &&
    x.name==='' && validQuery(x.query) && x.limit<=12;
  return x.customerId==='' && x.name==='' && x.query==='';
}
export function newEnvelope(operation, {customerId='',name='',query='',limit=100}={}) {
  const issuedAt=Date.now();
  const v={version:VERSION,operation,customerId,name,query,
    limit: operation==='BY_ID'?1:operation==='EXACT_NAME'?2:limit,
    issuedAt,nonce:crypto.randomUUID()};
  if (!validEnvelope(v,issuedAt)) throw new Error('invalid-official-customer-query');
  return v;
}
async function keyFor(secret) {
  if (typeof secret!=='string' || secret.length<32) throw new Error('customer-facts-secret-not-configured');
  return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function signBody(secret, body) {
  const k=await keyFor(secret);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',k,enc.encode(body)));
  return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verifyBody(secret, body, hex) {
  if (typeof hex!=='string' || !/^[a-f0-9]{64}$/i.test(hex)) return false;
  const bytes=new Uint8Array(hex.match(/../g).map(x=>parseInt(x,16)));
  try { return await crypto.subtle.verify('HMAC',await keyFor(secret),bytes,enc.encode(body)); }
  catch { return false; }
}
export function safeCustomers(x, max) {
  if (!Array.isArray(x) || x.length>max) throw new Error('customer-facts-response-overflow');
  return x.map(c=>{
    if (!c || typeof c!=='object' || !validId(c.customer_id) ||
      !validName(c.customer_name) || !['نعم','لا'].includes(c.active) ||
      typeof c.manager!=='string' || typeof c.phone!=='string' ||
      typeof c.extra_phone!=='string' || typeof c.customer_type!=='string') {
      throw new Error('customer-facts-invalid-official-record');
    }
    if ([c.manager,c.phone,c.extra_phone,c.customer_type].some(v=>v.length>180))
      throw new Error('customer-facts-oversized-field');
    // Strictly whitelist operational identity/contact fields, NEVER debt_amount
    // or payment/financial columns from TrendOS.
    return {customer_id:c.customer_id, customer_name:c.customer_name,
      manager:c.manager,phone:c.phone,extra_phone:c.extra_phone,
      customer_type:c.customer_type,active:c.active};
  });
}
export async function readOfficialCustomersV1(env, params) {
  if (env?.EASYSTORE_CUSTOMER_SOURCE_V1!=='REMOTE_REQUIRED')
    throw new Error('isolated-customer-source-not-enforced');
  if (!env?.TRENDOS_CUSTOMER_FACTS || typeof env.TRENDOS_CUSTOMER_FACTS.fetch!=='function')
    throw new Error('trendos-customer-facts-service-unbound');
  const secret=env?.TRENDOS_CUSTOMER_FACTS_HMAC_V1;
  const envelope=newEnvelope(params.operation,params);
  const body=JSON.stringify(envelope);
  const request=new Request('https://trendos-customer-facts.internal'+PATH,{
    method:'POST',headers:{'content-type':'application/json',
      'x-trendos-customer-facts-signature':await signBody(secret,body)},body
  });
  const response=await env.TRENDOS_CUSTOMER_FACTS.fetch(request);
  if (!response.ok) throw new Error('trendos-customer-facts-rejected');
  const raw=await response.text();
  if (raw.length>MAX_RESPONSE_CHARS ||
      !await verifyBody(secret,raw,response.headers.get('x-trendos-customer-facts-signature')))
    throw new Error('trendos-customer-facts-response-untrusted');
  let packet;
  try { packet=JSON.parse(raw); }catch {throw new Error('trendos-customer-facts-invalid-json');}
  if (!packet || packet.version!==VERSION || packet.nonce!==envelope.nonce ||
    packet.issuedAt!==envelope.issuedAt || packet.source!=='TrendOS' ||
    packet.financialAuthority!==false || !Object.hasOwn(packet,'customers'))
    throw new Error('trendos-customer-facts-response-mismatch');
  const customers=safeCustomers(packet.customers,envelope.limit);
  if (params.operation==='BY_ID' && customers.some(c=>c.customer_id!==params.customerId))
    throw new Error('customer-facts-id-mismatch');
  if (params.operation==='EXACT_NAME' && customers.some(c=>c.customer_name.toLowerCase()!==params.name.toLowerCase()))
    throw new Error('customer-facts-name-mismatch');
  return customers;
}
