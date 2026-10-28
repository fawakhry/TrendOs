/* ACC258 — signed PRIVATE operational preview of the existing native T12 order.
 * Preview is NOT an EasyStore finance event, acknowledgement, invoice request,
 * customer ownership proof, or departmental financial approval.
 * OFF by default. Never import into a publicly routed Worker.
 */
export const VERSION='TRENDOS_T12_NATIVE_PLATFORM_PREVIEW_ACC258_V1';
export const PATH='/internal/easystore/t12-native-order-preview/acc258';
export const DOMAIN='ACC258_NATIVE_PLATFORM_PREVIEW_ONLY\n';
export const MAX_BYTES=8000;
export const MAX_SKEW_MS=60000;
export const POLICY=Object.freeze({
 sourceSystem:'trendos_t12_native',privateServiceBindingOnly:true,
 isolatedModeOnly:true,customerOwnershipAttested:false,
 realSignedLineApprovalsVerified:false,financeAuthorized:false,
 invoicePostingAllowed:false,financialWritesAllowed:false,
 productionRelease:'NO_GO'
});
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==='string'&&/^[0-9]{4,18}$/.test(x);
const stamp=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(x)&&
 Number.isFinite(Date.parse(x))&&new Date(Date.parse(x)).toISOString().slice(0,19)+'Z'===x;
const isNonce=x=>typeof x==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(x);
const lines=['lineId','department','ordinal'];
const versions=['lineId','version'];
export function validRequest(r,now=Date.now()){
 return exact(r,['version','orderId','issuedAt','nonce'])&&
 r.version===VERSION&&id(r.orderId)&&Number.isSafeInteger(r.issuedAt)&&
 Math.abs(now-r.issuedAt)<=MAX_SKEW_MS&&isNonce(r.nonce);
}
export function validReply(r,q){
 if(!exact(r,['version','orderId','issuedAt','nonce','sourceSystem',
 'sourceContextId','snapshotId','sourceCreatedAt','lines','operationalRevision',
 'customerOwnershipAttested','realSignedLineApprovalsVerified',
 'financeAuthorized','canRequestInvoice','posted','productionRelease'])||
 !validRequest(q,r.issuedAt)||r.version!==VERSION||
 r.orderId!==q.orderId||r.issuedAt!==q.issuedAt||r.nonce!==q.nonce||
 r.sourceSystem!=='trendos_t12_native'||
 r.sourceContextId!=='trendos_t12_native:order:'+q.orderId||
 !/^[0-9a-f]{64}$/.test(r.snapshotId||'')||
 !stamp(r.sourceCreatedAt)||!Array.isArray(r.lines)||
 r.lines.length<1||r.lines.length>2||
 !exact(r.operationalRevision,['lineVersions'])||
 !Array.isArray(r.operationalRevision.lineVersions)||
 r.operationalRevision.lineVersions.length!==r.lines.length||
 r.customerOwnershipAttested!==false||
 r.realSignedLineApprovalsVerified!==false||
 r.financeAuthorized!==false||r.canRequestInvoice!==false||
 r.posted!==false||r.productionRelease!=='NO_GO')return false;
 const departments=new Set();
 for(let i=0;i<r.lines.length;i++){
  const l=r.lines[i],v=r.operationalRevision.lineVersions[i];
  if(!exact(l,lines)||!exact(v,versions)||
    l.lineId!==q.orderId+'-'+String(i+1).padStart(2,'0')||
    l.ordinal!==i+1||!['طباعة','ليزر'].includes(l.department)||
    departments.has(l.department)||v.lineId!==l.lineId||
    !Number.isSafeInteger(v.version)||v.version<0)return false;
  departments.add(l.department);
 }
 return true;
}
async function key(secret){
 if(typeof secret!=='string'||secret.length<32||secret.length>512)
  throw Error('ACC258_DEDICATED_PRIVATE_SECRET_REQUIRED');
 return crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
 {name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function sign(secret,body){
 if(typeof body!=='string'||body.length>MAX_BYTES)throw Error('ACC258_BODY_LIMIT');
 const k=await key(secret);
 const bytes=await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(DOMAIN+body));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verify(secret,body,signature){
 if(typeof signature!=='string'||!/^[0-9a-f]{64}$/.test(signature)||
 typeof body!=='string'||body.length>MAX_BYTES)return false;
 try{
  const k=await key(secret);
  const bytes=Uint8Array.from(signature.match(/../g),x=>parseInt(x,16));
  return await crypto.subtle.verify('HMAC',k,bytes,new TextEncoder().encode(DOMAIN+body));
 }catch{return false;}
}
export async function fromNativeSource(s,q){
 const c=s?.body;
 if(s?.status!==200||!c||c.success!==true||
 c.sourceSystem!=='trendos_t12_native'||c.sourceOnly!==true||
 c.readOnly!==true||c.operationalShapeVerified!==true||
 c.customerOwnershipAttested!==false||
 c.realSignedLineApprovalsVerified!==false||
 c.financeAuthorized!==false||c.canRequestInvoice!==false||
 c.posted!==false||c.productionRelease!=='NO_GO'||
 c.orderId!==q.orderId||!stamp(c.sourceCreatedAt)||
 !Array.isArray(c.lines)||!c.operationalRevision)return null;
 const out={
  version:VERSION,orderId:q.orderId,issuedAt:q.issuedAt,nonce:q.nonce,
  sourceSystem:'trendos_t12_native',
  sourceContextId:'trendos_t12_native:order:'+q.orderId,
  snapshotId:'',sourceCreatedAt:c.sourceCreatedAt,
  lines:c.lines.map(x=>({lineId:x.lineId,department:x.department,ordinal:x.ordinal})),
  operationalRevision:{lineVersions:c.operationalRevision.lineVersions.map(x=>({
   lineId:x.lineId,version:x.version
  }))},
  customerOwnershipAttested:false,realSignedLineApprovalsVerified:false,
  financeAuthorized:false,canRequestInvoice:false,posted:false,
  productionRelease:'NO_GO'
 };
 const fingerprint=JSON.stringify({source:out.sourceContextId,
  createdAt:out.sourceCreatedAt,lines:out.lines,
  versions:out.operationalRevision.lineVersions});
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint));
 out.snapshotId=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 return validReply(out,q)?out:null;
}
export async function readPrivatePreviewIsolated(env,orderId){
 if(env?.TRENDOS_PLATFORM_ORDER_PREVIEW_MODE!=='ISOLATED_SOURCE_ONLY'||
 typeof env?.TRENDOS_PLATFORM_ORDER_PREVIEW?.fetch!=='function')
  throw Error('ACC258_PRIVATE_SOURCE_OFF');
 const q={version:VERSION,orderId,issuedAt:Date.now(),nonce:crypto.randomUUID()};
 if(!validRequest(q))throw Error('ACC258_ORDER_ID_INVALID');
 const body=JSON.stringify(q),secret=env.TRENDOS_PLATFORM_ORDER_PREVIEW_HMAC;
 const signature=await sign(secret,body);
 const response=await env.TRENDOS_PLATFORM_ORDER_PREVIEW.fetch(
  new Request('https://private-preview.invalid'+PATH,{method:'POST',
  headers:{'content-type':'application/json','x-acc258-signature':signature},
  body})
 );
 if(!response.ok)throw Error('ACC258_SOURCE_REJECTED');
 const raw=await response.text();
 if(!await verify(secret,raw,response.headers.get('x-acc258-signature')))
  throw Error('ACC258_UNAUTHENTIC_SOURCE_RESPONSE');
 let r;try{r=JSON.parse(raw)}catch{throw Error('ACC258_RESPONSE_NOT_JSON')}
 if(!validReply(r,q)||!validRequest(q))throw Error('ACC258_SOURCE_CONTEXT_INVALID');
 return Object.freeze(r);
}
