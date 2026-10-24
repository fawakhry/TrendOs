/* ACC243 — EXISTING EasyStore ACCOUNTING_CONNECTOR_CONTRACT_V1
 * order_line_approved cryptographic contract REHEARSAL ONLY.
 * NO runtime route, Cloudflare access, Worker import, real employee signer,
 * signed operational event or payment. Never derive approval from
 * ACC242's accounting approval_status or T12's runtime status.
 * Accepts ONLY clearly labeled fake signed approval source.
 */
export const ACC243_POLICY=Object.freeze({
 version:'ACC243_ORDER_LINE_APPROVED_FAKE_HMAC_NO_GO',
 originalContract:'ACCOUNTING_CONNECTOR_CONTRACT_V1',
 fixtureOnly:true,workerWired:false,sourceRuntimeApprovalAvailable:false,
 independentSignerVerified:false,officialCustomerOwnershipAttested:false,
 replayLedgerQualified:false,realSignedLineApprovalsVerified:false,
 financeWrites:false,invoicePostingAllowed:false,financeRelease:'NO_GO'
});
const owned=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,ks)=>plain(x)&&Object.keys(x).length===ks.length&&ks.every(k=>owned(x,k));
const id=x=>typeof x==='string'&&x.length>=1&&x.length<=160&&
 x===x.trim()&&x.normalize('NFC')===x&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(x);
const pk=['order_id','line_id','customer_id','department','approval_ref',
 'actor_ref','fixture_only','financial_authority'];
const ek=['contract_version','event_id','event_type','occurred_at',
 'source_system','source_entity_type','source_entity_id','correlation_id',
 'idempotency_key','evidence_refs','payload'];
const fail=code=>Object.freeze({success:false,code,sourceOnly:true,
 fixtureSignaturesVerified:false,independentSignerVerified:false,
 realSignedLineApprovalsVerified:false,ownerAttested:false,
 financeAuthorized:false,canRequestInvoice:false,canPostCash:false,
 connectorEventPublished:false,financeRelease:'NO_GO'});
const allowedDepartments=new Set(['طباعة','ليزر']);
const signature=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s);
function canonical(v){
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 if(plain(v))return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
 if(typeof v==='string'||typeof v==='boolean'||(typeof v==='number'&&Number.isSafeInteger(v)))
   return JSON.stringify(v);
 throw new TypeError('UNSUPPORTED_SIGNATURE_FIELD');
}
function validEnvelope(e,nowMs){
 if(!exact(e,ek)||!exact(e.payload,pk))return false;
 const p=e.payload,stamp=Date.parse(e.occurred_at);
 if(!id(e.source_entity_id)||!id(e.correlation_id)||!id(p.order_id)||
    !id(p.line_id)||!id(p.customer_id)||!id(p.approval_ref)||
    !id(p.actor_ref)||!allowedDepartments.has(p.department)||
    e.contract_version!=='ACCOUNTING_CONNECTOR_CONTRACT_V1'||
    e.event_type!=='order_line_approved'||
    e.source_system!=='TrendOS'||e.source_entity_type!=='line'||
    e.source_entity_id!==p.line_id||e.correlation_id!==p.order_id||
    e.event_id!=='t12:order_line_approved:'+p.line_id+':'+p.approval_ref||
    e.idempotency_key!==e.event_id||
    p.fixture_only!==true||p.financial_authority!==false||
    !Array.isArray(e.evidence_refs)||e.evidence_refs.length!==1||
    e.evidence_refs[0]!=='acc243:fake-approval:'+p.approval_ref)return false;
 if(typeof e.occurred_at!=='string'||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(e.occurred_at)||
    !Number.isSafeInteger(stamp)||stamp<=0||
    new Date(stamp).toISOString().slice(0,19)+'Z'!==e.occurred_at||
    stamp-nowMs>60_000||nowMs-stamp>300_000)return false;
 return true;
}
function keyQualified(key){
 return key?.type==='secret'&&key.algorithm?.name==='HMAC'&&
    key.algorithm?.hash?.name==='SHA-256'&&
    Array.isArray(key.usages)&&key.usages.includes('verify');
}
function decodeSignature(sig){
 if(!signature(sig))return null;
 try{
  const bin=atob(sig.replace(/-/g,'+').replace(/_/g,'/')+'=');
  if(bin.length!==32)return null;
  return Uint8Array.from(bin,c=>c.charCodeAt(0));
 }catch{return null;}
}
export async function verifyACC243FakeSignedLineApprovals({
 sourceResponse,lineagePreview,messages,verifyKey,expectedKeyId,nowMs,
 mode
}={}){
 if(mode!=='ISOLATED_FAKE_APPROVAL_FIXTURE')
  return fail('ACC243_DEFAULT_OFF');
 const c=sourceResponse?.body;
 if(!id(expectedKeyId)||!Number.isSafeInteger(nowMs)||nowMs<=0||
    !keyQualified(verifyKey)||!globalThis.crypto?.subtle||
    !Array.isArray(messages)||messages.length<1||messages.length>2)
  return fail('ACC243_FIXTURE_INPUT_INVALID');
 // This checks known source and finance preview shape only, not remote proof.
 if(sourceResponse?.status!==200||c?.success!==true||
    c.source!=='original-t12-at-create-source-only'||
    c.sourceOnly!==true||c.readOnly!==true||
    c.operationalSourceShapeVerified!==true||
    c.officialCustomerOwnershipAttested!==false||
    c.financeAuthorized!==false||c.departmentApprovalsVerified!==false||
    c.canRequestInvoice!==false||c.connectorEventPublished!==false||
    c.posted!==false||!id(c.orderId)||!id(c.officialCustomerId)||
    !Array.isArray(c.lines)||c.lineCount!==c.lines.length||
    c.lines.length!==messages.length||
    lineagePreview?.status!==200||lineagePreview?.success!==true||
    lineagePreview.orderId!==c.orderId||
    lineagePreview.officialCustomerId!==c.officialCustomerId||
    lineagePreview.originalAccountingLineageShapeMatched!==true||
    lineagePreview.nativeDepartmentApprovalRowsObserved!==true||
    lineagePreview.signedLineApprovalsVerified!==false||
    lineagePreview.ownerAttested!==false||
    lineagePreview.financeAuthorized!==false||
    lineagePreview.canRequestInvoice!==false||
    lineagePreview.canPostCash!==false||
    lineagePreview.sourceOnly!==true||lineagePreview.readOnly!==true)
  return fail('ACC242_ORIGINAL_LINEAGE_PREVIEW_NOT_QUALIFIED');
 const expected=new Map();
 for(let i=0;i<c.lines.length;i++){
  const l=c.lines[i];
  if(!id(l?.lineId)||l.lineId!==c.orderId+'-'+String(i+1).padStart(2,'0')||
     l.ordinal!==i+1||!allowedDepartments.has(l.department)||
     expected.has(l.lineId))return fail('ORIGINAL_T12_LINE_SET_INVALID');
  expected.set(l.lineId,l.department);
 }
 if(expected.size===2&&new Set(expected.values()).size!==2)
  return fail('ORIGINAL_T12_DEPARTMENT_SET_INVALID');
 const seenLineIds=new Set(),seenEvents=new Set(),seenApprovals=new Set();
 for(const m of messages){
  if(!exact(m,['key_id','algorithm','envelope','signature'])||
     m.key_id!==expectedKeyId||m.algorithm!=='HMAC-SHA256'||
     !validEnvelope(m.envelope,nowMs))return fail('ACC243_FIXTURE_ENVELOPE_UNTRUSTED');
  const e=m.envelope,p=e.payload;
  if(p.order_id!==c.orderId||p.customer_id!==c.officialCustomerId||
     !expected.has(p.line_id)||expected.get(p.line_id)!==p.department)
   return fail('ORDER_CUSTOMER_DEPARTMENT_SOURCE_BINDING_MISMATCH');
  if(seenLineIds.has(p.line_id)||seenEvents.has(e.event_id)||
     seenApprovals.has(p.approval_ref))
   return fail('DUPLICATED_LINE_OR_APPROVAL_IDEMPOTENCY_KEY');
  const bytes=decodeSignature(m.signature);
  if(!bytes)return fail('MALFORMED_ACC243_SIGNATURE');
  let verified=false;
  try{
   verified=await crypto.subtle.verify('HMAC',verifyKey,bytes,
      new TextEncoder().encode(canonical(e)));
  }catch{return fail('ACC243_CRYPTO_VERIFIER_UNAVAILABLE');}
  if(!verified)return fail('ACC243_SIGNATURE_TAMPERED');
  seenLineIds.add(p.line_id);seenEvents.add(e.event_id);
  seenApprovals.add(p.approval_ref);
 }
 if(seenLineIds.size!==expected.size)
  return fail('INCOMPLETE_FAKE_SIGNED_APPROVAL_LINE_SET');
 return Object.freeze({
  success:true,fixtureSignaturesVerified:true,fixtureOnly:true,sourceOnly:true,
  contractVersion:'ACCOUNTING_CONNECTOR_CONTRACT_V1',
  expectedOrderId:c.orderId,syntheticSignedLineCount:seenLineIds.size,
  originalAccountingLineageShapeMatched:true,
  independentSignerVerified:false,realSignedLineApprovalsVerified:false,
  ownerAttested:false,independentEmployeeGrantsVerified:false,
  consumerReplayLedgerVerified:false,
  financeAuthorized:false,canRequestInvoice:false,canPostCash:false,
  connectorEventPublished:false,financeRelease:'NO_GO',
  nextRequiredGate:'REAL_INDEPENDENT_SOURCE_APPROVAL_SIGNER_AND_OWNER_ATTESTATION'
 });
}
