/* ACC233 — source-only cryptographic transport rehearsal for EXISTING
 * EasyStore ACCOUNTING_CONNECTOR_CONTRACT_V1: order_created ONLY.
 * It is not a department approval, customer ownership attestation,
 * independent production signer, financial grant, or finance POST.
 * No Worker import, HTTP endpoint, cloud secret, database writer or new ledger.
 *
 * The ONLY source input is the original T12 read-only, five-query inspector;
 * never sign a caller-provided operational candidate.
 */
import {inspectT12EmployeeOrderFinanceCandidate} from './t12-employee-order-finance-intake-sourceonly.mjs';

export const T12_FINANCE_ORDER_CREATED_SIGNER_VERSION='ACC233_V1_ORDER_CREATED_OFF';
export const T12_FINANCE_ORDER_CREATED_POLICY=Object.freeze({
  contractVersion:'ACCOUNTING_CONNECTOR_CONTRACT_V1',
  sourceOnly:true,defaultMode:'OFF',workerWired:false,httpRouteAvailable:false,
  originalSourceReaderRequired:true,onlyEventType:'order_created',
  financialAuthority:false,customerOwnershipAttested:false,
  departmentApprovalsVerified:false,invoicePostingAllowed:false,
  replayLedgerVerified:false,independentKeyCustodyVerified:false
});
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,want)=>plain(v)&&Object.keys(v).length===want.length&&
  want.every(k=>hasOwn(v,k));
const valid=v=>typeof v==='string'&&v.length>0&&v.length<=160&&
  v===v.trim()&&v.normalize('NFC')===v&&
  !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(v);
const fail=code=>Object.freeze({
 success:false,code,sourceOnly:true,financialAuthority:false,
 officialCustomerOwnershipAttested:false,departmentApprovalsVerified:false,
 invoicePostingAllowed:false,connectorEventPublished:false,
 replayLedgerVerified:false,productionRelease:'NO_GO'
});
const allowedDepartments=new Set(['طباعة','ليزر']);
const envelopeFields=['contract_version','event_id','event_type','occurred_at',
 'source_system','source_entity_type','source_entity_id','correlation_id',
 'idempotency_key','evidence_refs','payload'];
const payloadFields=['order_id','customer_id','expected_line_count','lines',
 'source_only','customer_ownership_attested','department_approvals_verified',
 'finance_authorized'];
const lineFields=['line_id','department','ordinal'];
function validEnvelope(e){
 if(!keys(e,envelopeFields)||!keys(e.payload,payloadFields))return false;
 const p=e.payload,id=e.source_entity_id;
 if(!valid(id)||id.length>120||!valid(p.customer_id)||
    e.contract_version!=='ACCOUNTING_CONNECTOR_CONTRACT_V1'||
    e.event_type!=='order_created'||e.source_system!=='TrendOS'||
    e.source_entity_type!=='order'||e.correlation_id!==id||
    e.event_id!=='t12:order_created:'+id||
    e.idempotency_key!=='t12:order_created:'+id||
    p.order_id!==id||p.source_only!==true||
    p.customer_ownership_attested!==false||
    p.department_approvals_verified!==false||
    p.finance_authorized!==false)return false;
 if(typeof e.occurred_at!=='string'||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(e.occurred_at)||
    !Number.isFinite(Date.parse(e.occurred_at))||
    new Date(e.occurred_at).toISOString().slice(0,19)+'Z'!==e.occurred_at)
  return false;
 if(!Array.isArray(e.evidence_refs)||e.evidence_refs.length!==2||
    e.evidence_refs[0]!=='t12:original-ledger:'+id||
    e.evidence_refs[1]!=='t12:runtime-read:'+id)return false;
 if(!Number.isSafeInteger(p.expected_line_count)||
    p.expected_line_count<1||p.expected_line_count>2||
    !Array.isArray(p.lines)||p.lines.length!==p.expected_line_count)return false;
 const seen=new Set(),departments=new Set();
 for(let i=0;i<p.lines.length;i++){
  const line=p.lines[i];
  if(!keys(line,lineFields)||!valid(line.line_id)||
     line.line_id!==id+'-'+String(i+1).padStart(2,'0')||
     line.ordinal!==i+1||!allowedDepartments.has(line.department)||
     seen.has(line.line_id)||departments.has(line.department))return false;
  seen.add(line.line_id);departments.add(line.department);
 }
 return true;
}
function canonical(v){
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 if(plain(v))return '{'+Object.keys(v).sort().map(k=>
  JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
 if(typeof v==='string'||typeof v==='boolean'||
    (typeof v==='number'&&Number.isSafeInteger(v)))return JSON.stringify(v);
 throw new TypeError('NON_CANONICAL_FIELD');
}
function hmacKey(key,usage){
 return key&&key.type==='secret'&&key.algorithm&&
  key.algorithm.name==='HMAC'&&key.algorithm.hash&&
  key.algorithm.hash.name==='SHA-256'&&
  Array.isArray(key.usages)&&key.usages.includes(usage);
}
function time(nowMs){
 if(nowMs!==undefined&&(!Number.isSafeInteger(nowMs)||nowMs<=0))return null;
 const n=nowMs===undefined?Date.now():nowMs;
 return Number.isSafeInteger(n)&&n>0&&Number.isFinite(new Date(n).getTime())?n:null;
}
function b64url(bytes){
 let b='';for(const v of new Uint8Array(bytes))b+=String.fromCharCode(v);
 return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function signatureBytes(s){
 if(typeof s!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(s))return null;
 try{
  const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'=');
  if(raw.length!==32)return null;
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
 }catch{return null;}
}
function envelopeFromSource(o,at){
 const orderId=o.orderId,customerId=o.officialCustomerId;
 return {
  contract_version:'ACCOUNTING_CONNECTOR_CONTRACT_V1',
  event_id:'t12:order_created:'+orderId,event_type:'order_created',
  occurred_at:new Date(Math.floor(at/1000)*1000).toISOString().slice(0,19)+'Z',
  source_system:'TrendOS',source_entity_type:'order',source_entity_id:orderId,
  correlation_id:orderId,idempotency_key:'t12:order_created:'+orderId,
  evidence_refs:['t12:original-ledger:'+orderId,'t12:runtime-read:'+orderId],
  payload:{order_id:orderId,customer_id:customerId,
   expected_line_count:o.lineCount,
   lines:o.lines.map(l=>({line_id:l.lineId,department:l.department,ordinal:l.ordinal})),
   source_only:true,customer_ownership_attested:false,
   department_approvals_verified:false,finance_authorized:false}
 };
}
export async function buildT12SignedOrderCreatedSourceOnly({
 db,orderId,expectedOfficialCustomerId,signKey,keyId,mode,nowMs
}={}){
 if(mode!=='ISOLATED_SOURCE_ONLY')return fail('SIGNER_DEFAULT_OFF');
 if(!valid(orderId)||orderId.length>120||
    !valid(expectedOfficialCustomerId)||!valid(keyId)||keyId.length>80||
    !hmacKey(signKey,'sign')||!globalThis.crypto?.subtle)
  return fail('SIGNING_INPUT_OR_KEY_UNQUALIFIED');
 const at=time(nowMs);
 if(at===null)return fail('SIGNING_TIME_INVALID');
 const r=await inspectT12EmployeeOrderFinanceCandidate({
  db,orderId,expectedOfficialCustomerId
 });
 const o=r?.body;
 if(r?.status!==200||o?.success!==true||
    o.source!=='original-t12-at-create-source-only'||
    o.operationalSourceShapeVerified!==true||o.readOnly!==true||
    o.sourceOnly!==true||o.officialCustomerOwnershipAttested!==false||
    o.departmentApprovalsVerified!==false||o.financeAuthorized!==false||
    o.canRequestInvoice!==false||o.connectorEventPublished!==false||
    o.posted!==false)
  return fail('ORIGINAL_T12_SOURCE_NOT_QUALIFIED');
 const envelope=envelopeFromSource(o,at);
 if(!validEnvelope(envelope))return fail('ORIGINAL_T12_ENVELOPE_UNQUALIFIED');
 try{
  const bytes=new TextEncoder().encode(canonical(envelope));
  const signature=await crypto.subtle.sign('HMAC',signKey,bytes);
  return {
   success:true,sourceOnly:true,cryptographicallySigned:true,
   message:{key_id:keyId,algorithm:'HMAC-SHA256',envelope,
    signature:b64url(signature)},
   financialAuthority:false,officialCustomerOwnershipAttested:false,
   departmentApprovalsVerified:false,invoicePostingAllowed:false,
   connectorEventPublished:false,replayLedgerVerified:false,
   independentKeyCustodyVerified:false,productionRelease:'NO_GO'
  };
 }catch{return fail('SOURCE_HMAC_SIGNING_UNAVAILABLE');}
}
export async function verifyT12SignedOrderCreatedSourceOnly({
 message,verifyKey,expectedKeyId,nowMs,maxAgeSeconds=300
}={}){
 if(!keys(message,['key_id','algorithm','envelope','signature'])||
    !valid(expectedKeyId)||message.key_id!==expectedKeyId||
    message.algorithm!=='HMAC-SHA256'||!hmacKey(verifyKey,'verify')||
    !globalThis.crypto?.subtle)return fail('UNTRUSTED_SIGNER_OR_ENVELOPE');
 if(!validEnvelope(message.envelope))return fail('INVALID_ORDER_CREATED_CONTRACT');
 const at=time(nowMs);
 if(at===null||!Number.isSafeInteger(maxAgeSeconds)||
    maxAgeSeconds<1||maxAgeSeconds>900)return fail('VERIFIER_TIME_INVALID');
 const diff=at-Date.parse(message.envelope.occurred_at);
 if(diff < -60000||diff>maxAgeSeconds*1000)
  return fail('EXPIRED_OR_FUTURE_SOURCE_EVENT');
 const sig=signatureBytes(message.signature);
 if(!sig)return fail('MALFORMED_SOURCE_SIGNATURE');
 try{
  const bytes=new TextEncoder().encode(canonical(message.envelope));
  if(!await crypto.subtle.verify('HMAC',verifyKey,sig,bytes))
   return fail('SOURCE_SIGNATURE_MISMATCH');
  return {
   success:true,cryptographicSignatureVerified:true,
   eventType:'order_created',orderId:message.envelope.payload.order_id,
   customerId:message.envelope.payload.customer_id,
   lineCount:message.envelope.payload.expected_line_count,
   sourceOnly:true,financialAuthority:false,
   officialCustomerOwnershipAttested:false,departmentApprovalsVerified:false,
   invoicePostingAllowed:false,connectorEventPublished:false,
   replayLedgerVerified:false,independentKeyCustodyVerified:false,
   productionRelease:'NO_GO'
  };
 }catch{return fail('SOURCE_SIGNATURE_VERIFIER_UNAVAILABLE');}
}
