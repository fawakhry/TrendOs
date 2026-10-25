/**
 * ACC251 — REAL private source/consumer transport CONTRACT for original T12
 * order_created context only. Separate from fake ACC247 SQLite receiver.
 * No finance D1, no invoice, no order_line_approved, no customer ownership
 * grant, no user-session secret. Never expose this on a public route.
 */
export const VERSION='TRENDOS_EASYSTORE_ORIGINAL_ORDER_CONTEXT_V1';
export const PATH='/internal/easystore/original-order-context/v1';
export const DOMAIN='ACC251_ORIGINAL_ORDER_CONTEXT_V1\n';
export const MAX_SKEW_MS=60000;
export const MAX_RESPONSE_CHARS=12000;
export const POLICY=Object.freeze({
 onlyPrivateServiceBinding:true,dedicatedSecretRequired:true,
 originalT12InspectorRequired:true,
 allowedEffect:'prepare_context_only',financialAuthority:false,
 verifiedCustomerOwnership:false,signedLineApprovals:false,
 invoicePostingAllowed:false,financeRelease:'NO_GO'
});
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,fields)=>plain(x)&&Object.keys(x).length===fields.length&&
 fields.every(k=>own(x,k));
const id=x=>typeof x==='string'&&x.length>=1&&x.length<=160&&
 x===x.trim()&&x.normalize('NFC')===x&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(x);
const nonce=x=>typeof x==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(x);
const stamp=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(x)&&
 Number.isFinite(Date.parse(x))&&new Date(Date.parse(x)).toISOString().slice(0,19)+'Z'===x;
const requestFields=['version','orderId','customerId','issuedAt','nonce'];
const replyFields=['version','orderId','customerId','issuedAt','nonce','source',
 'contextOnly','financialAuthority','ownerAttested','approvedLineEventsVerified',
 'sourceCreatedAt','operationalRevision','lines'];
const lineFields=['lineId','department','ordinal'];
const revisionFields=['customerVersion','lineVersions'];
const versionFields=['lineId','version'];
const departments=new Set(['طباعة','ليزر']);
const epoch=n=>Number.isSafeInteger(n)&&n>0;
export function validRequest(x,now=Date.now()){
 return exact(x,requestFields)&&x.version===VERSION&&id(x.orderId)&&
  id(x.customerId)&&epoch(x.issuedAt)&&Math.abs(now-x.issuedAt)<=MAX_SKEW_MS&&
  nonce(x.nonce);
}
export function validReply(x,request){
 if(!exact(x,replyFields)||!validRequest(request,x.issuedAt)||
    x.version!==VERSION||x.orderId!==request.orderId||
    x.customerId!==request.customerId||x.issuedAt!==request.issuedAt||
    x.nonce!==request.nonce||x.source!=='TrendOS'||
    x.contextOnly!==true||x.financialAuthority!==false||
    x.ownerAttested!==false||x.approvedLineEventsVerified!==false||
    !stamp(x.sourceCreatedAt)||!Array.isArray(x.lines)||
    x.lines.length<1||x.lines.length>2||!exact(x.operationalRevision,revisionFields)||
    !Number.isSafeInteger(x.operationalRevision.customerVersion)||
    x.operationalRevision.customerVersion<1||
    !Array.isArray(x.operationalRevision.lineVersions)||
    x.operationalRevision.lineVersions.length!==x.lines.length)return false;
 const seenDepartments=new Set();
 for(let i=0;i<x.lines.length;i++){
  const l=x.lines[i],r=x.operationalRevision.lineVersions[i];
  if(!exact(l,lineFields)||!exact(r,versionFields)||
     l.lineId!==x.orderId+'-'+String(i+1).padStart(2,'0')||
     l.ordinal!==i+1||!departments.has(l.department)||
     seenDepartments.has(l.department)||r.lineId!==l.lineId||
     !Number.isSafeInteger(r.version)||r.version<0)return false;
  seenDepartments.add(l.department);
 }
 return true;
}
async function keyFor(secret){
 if(typeof secret!=='string'||secret.length<32||secret.length>512)
  throw Error('ACC251_PRIVATE_KEY_NOT_CONFIGURED');
 return crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function signBody(secret,body){
 if(typeof body!=='string'||body.length>MAX_RESPONSE_CHARS)
  throw Error('ACC251_BODY_NOT_BOUNDED');
 const key=await keyFor(secret);
 const data=new TextEncoder().encode(DOMAIN+body);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,data));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
export async function verifyBody(secret,body,signature){
 if(typeof signature!=='string'||!/^[0-9a-f]{64}$/.test(signature)||
    typeof body!=='string'||body.length>MAX_RESPONSE_CHARS)return false;
 try{
  const key=await keyFor(secret);
  const sig=Uint8Array.from(signature.match(/../g),x=>parseInt(x,16));
  return await crypto.subtle.verify('HMAC',key,sig,
   new TextEncoder().encode(DOMAIN+body));
 }catch{return false;}
}
export function contextFromOriginal(source,request){
 const c=source?.body;
 if(source?.status!==200||c?.success!==true||
    c.source!=='original-t12-at-create-source-only'||
    c.sourceOnly!==true||c.readOnly!==true||
    c.operationalSourceShapeVerified!==true||
    c.officialCustomerOwnershipAttested!==false||
    c.departmentApprovalsVerified!==false||c.financeAuthorized!==false||
    c.canRequestInvoice!==false||c.posted!==false||
    c.connectorEventPublished!==false||
    c.orderId!==request.orderId||
    c.officialCustomerId!==request.customerId||
    !Array.isArray(c.lines)||!c.operationalRevision)return null;
 const out={
  version:VERSION,orderId:request.orderId,customerId:request.customerId,
  issuedAt:request.issuedAt,nonce:request.nonce,source:'TrendOS',
  contextOnly:true,financialAuthority:false,ownerAttested:false,
  approvedLineEventsVerified:false,sourceCreatedAt:c.sourceCreatedAt,
  operationalRevision:{
   customerVersion:c.operationalRevision.customerVersion,
   lineVersions:c.operationalRevision.lineVersions.map(v=>({
    lineId:v.lineId,version:v.version
   }))
  },
  lines:c.lines.map(v=>({lineId:v.lineId,department:v.department,ordinal:v.ordinal}))
 };
 return validReply(out,request)?out:null;
}
export async function readOriginalOrderContextV1(env,{orderId,customerId}={}){
 if(env?.EASYSTORE_ORDER_CONTEXT_SOURCE_V1!=='REMOTE_REQUIRED'||
    typeof env?.TRENDOS_ORDER_CONTEXT?.fetch!=='function')
  throw Error('ACC251_PRIVATE_ORDER_SOURCE_NOT_CONNECTED');
 const secret=env?.TRENDOS_ORDER_CONTEXT_HMAC_V1;
 const request={version:VERSION,orderId,customerId,
  issuedAt:Date.now(),nonce:crypto.randomUUID()};
 if(!validRequest(request))throw Error('ACC251_EXACT_ORDER_CUSTOMER_REQUIRED');
 const body=JSON.stringify(request);
 const signed=await signBody(secret,body);
 const response=await env.TRENDOS_ORDER_CONTEXT.fetch(new Request(
  'https://trendos-order-context.internal'+PATH,{method:'POST',
   headers:{'content-type':'application/json','x-order-context-signature':signed},body
  }));
 if(!response.ok)throw Error('ACC251_ORIGINAL_ORDER_SOURCE_REJECTED');
 const raw=await response.text();
 if(!await verifyBody(secret,raw,response.headers.get('x-order-context-signature')))
  throw Error('ACC251_ORIGINAL_ORDER_REPLY_NOT_AUTHENTIC');
 let reply;try{reply=JSON.parse(raw);}catch{throw Error('ACC251_REPLY_JSON_INVALID');}
 if(!validReply(reply,request)||!validRequest(request))
  throw Error('ACC251_ORDER_REPLY_NOT_BOUND_TO_REQUEST');
 return Object.freeze(reply);
}
