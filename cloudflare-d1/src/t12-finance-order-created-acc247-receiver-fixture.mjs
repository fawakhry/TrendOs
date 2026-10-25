/* ACC247 — ACCOUNTING_CONNECTOR_CONTRACT_V1 order_created receiver REHEARSAL.
 * Disposable SQLite fixture ONLY. No EasyStore finance DB, D1 migration,
 * Worker import, provider HTTP, finance writer, customer ownership claim,
 * signed real department approval or production Cloudflare event.
 *
 * Deliberately checks a FAKE same-process sender/outbox handoff and rereads
 * the ORIGINAL T12 source at proposed receipt time. Neither local read nor
 * an HMAC test key authenticates a real remote server.
 */
import {inspectT12EmployeeOrderFinanceCandidate as inspectSource}
 from './t12-employee-order-finance-intake-sourceonly.mjs';
import {verifyT12SignedOrderCreatedSourceOnly as verifyHmac}
 from './t12-finance-connector-v1-order-created-sourceonly.mjs';

export const ACC247_RECEIVER_POLICY=Object.freeze({
 defaultMode:'OFF',fixtureMode:'ISOLATED_SQLITE_RECEIVER',
 originalConnector:'ACCOUNTING_CONNECTOR_CONTRACT_V1',
 eventType:'order_created',allowedEffect:'prepare_context_only',
 standaloneFixtureDbOnly:true,workerWired:false,realRecipient:false,
 requiresSourceRevisionOnReceipt:true,requiresFakeSenderLeaseHandoff:true,
 validatesPinnedHmac:true,remoteSourceAttested:false,
 accountOwnerVerified:false,independentSignerVerified:false,
 sourceAndRecipientCommitAtomic:false,financialWritesAllowed:false,
 invoiceRequestAllowed:false,consumerAckQualified:false,
 financeRelease:'NO_GO'
});
export const ACC247_RECEIVER_FIXTURE_SCHEMA=`
CREATE TABLE acc247_fixture_control (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1),
 marker TEXT NOT NULL CHECK(marker='ACC247_FAKE_RECEIVER_ONLY'),
 mode TEXT NOT NULL CHECK(mode='ISOLATED_SQLITE_RECEIVER')
);
INSERT INTO acc247_fixture_control(singleton,marker,mode)
 VALUES (1,'ACC247_FAKE_RECEIVER_ONLY','ISOLATED_SQLITE_RECEIVER');
CREATE TABLE acc247_context_inbox (
 event_id TEXT PRIMARY KEY NOT NULL,
 idempotency_key TEXT UNIQUE NOT NULL,
 order_id TEXT UNIQUE NOT NULL,
 customer_id TEXT NOT NULL,
 signed_payload_json TEXT NOT NULL,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 source_revision_json TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state='SOURCE_CONTEXT_ONLY_NO_POST'),
 received_at_ms INTEGER NOT NULL
);
CREATE TRIGGER acc247_no_update BEFORE UPDATE ON acc247_context_inbox
 BEGIN SELECT RAISE(ABORT,'ACC247_CONTEXT_BYTES_IMMUTABLE'); END;
CREATE TRIGGER acc247_no_delete BEFORE DELETE ON acc247_context_inbox
 BEGIN SELECT RAISE(ABORT,'ACC247_CONTEXT_NO_DELETE'); END;
`;
const stop=code=>Object.freeze({
 success:false,code,fixtureOnly:true,consumerAcknowledged:false,
 customerOwnershipAttested:false,realDepartmentApprovalAttested:false,
 postingAllowed:false,financeAuthorized:false,invoiceRequested:false,
 productionRelease:'NO_GO'
});
const id=x=>typeof x==='string'&&x.length>0&&x.length<=160&&
 x===x.trim()&&x.normalize('NFC')===x&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(x);
const isTime=n=>Number.isSafeInteger(n)&&n>0;
const srcSql=`SELECT event_id AS eventId,order_id AS orderId,
 idempotency_key AS idempotencyKey,payload_json AS payloadJson,
 payload_sha256 AS payloadSha256,state,attempts,
 lease_owner AS leaseOwner,lease_until_ms AS leaseUntilMs,
 lease_source_revision_json AS leaseSourceRevisionJson,
 simulated_handoff_epoch AS simulatedHandoffEpoch
 FROM acc235_signed_outbox_fixture WHERE event_id=? LIMIT 1`;
const controlSql='SELECT marker,mode FROM acc247_fixture_control WHERE singleton=1';
const recipientSql=`SELECT event_id AS eventId,
 idempotency_key AS idempotencyKey,
 order_id AS orderId,customer_id AS customerId,
 signed_payload_json AS signedPayloadJson,payload_sha256 AS payloadSha256,
 source_revision_json AS sourceRevisionJson,state
 FROM acc247_context_inbox WHERE event_id=? LIMIT 1`;
const insertSql=`INSERT OR IGNORE INTO acc247_context_inbox
 (event_id,idempotency_key,order_id,customer_id,signed_payload_json,
  payload_sha256,source_revision_json,state,received_at_ms)
 VALUES (?,?,?,?,?,?,?,'SOURCE_CONTEXT_ONLY_NO_POST',?)`;
async function hash(s){
 const bytes=new TextEncoder().encode(s);
 const b=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function validRevision(x,lines){
 if(!x||typeof x!=='object'||Array.isArray(x)||
    Object.keys(x).length!==2||
    !Number.isSafeInteger(x.customerVersion)||x.customerVersion<1||
    !Array.isArray(x.lineVersions)||x.lineVersions.length!==lines.length)
  return false;
 return x.lineVersions.every((r,i)=>r&&
  Object.keys(r).length===2&&r.lineId===lines[i].line_id&&
  Number.isSafeInteger(r.version)&&r.version>=0);
}
function compareSource(src,msg,sourceRevisionJson){
 const e=msg.envelope,p=e.payload,c=src?.body;
 if(src?.status!==200||c?.success!==true||
    c.source!=='original-t12-at-create-source-only'||
    c.sourceOnly!==true||c.readOnly!==true||
    c.operationalSourceShapeVerified!==true||
    c.officialCustomerOwnershipAttested!==false||
    c.departmentApprovalsVerified!==false||
    c.financeAuthorized!==false||c.canRequestInvoice!==false||
    c.connectorEventPublished!==false||c.posted!==false||
    c.orderId!==p.order_id||c.officialCustomerId!==p.customer_id||
    c.sourceCreatedAt!==e.occurred_at||
    c.lineCount!==p.expected_line_count||
    !Array.isArray(c.lines)||c.lines.length!==p.lines.length)
  return false;
 for(let i=0;i<p.lines.length;i++){
  const a=p.lines[i],b=c.lines[i];
  if(a.line_id!==b?.lineId||a.department!==b?.department||
     a.ordinal!==b?.ordinal)return false;
 }
 const revision=c.operationalRevision;
 if(!validRevision(revision,p.lines))return false;
 const parsed={customerVersion:revision.customerVersion,
   lineVersions:revision.lineVersions.map(r=>({
    lineId:r.lineId,version:r.version
   }))};
 return JSON.stringify(parsed)===sourceRevisionJson;
}
export async function acceptACC247OrderCreatedContextFixtureOnly({
 sourceDb,sourceOutboxDb,recipientDb,message,
 verifyKey,expectedKeyId,nowMs,leaseOwner,leaseAttempt,mode
}={}){
 if(mode!=='ISOLATED_SQLITE_RECEIVER')return stop('ACC247_DEFAULT_OFF');
 if(!sourceDb||typeof sourceDb.batch!=='function'||
    !sourceOutboxDb||typeof sourceOutboxDb.prepare!=='function'||
    !recipientDb||typeof recipientDb.exec!=='function'||
    typeof recipientDb.prepare!=='function'||!globalThis.crypto?.subtle||
    !id(expectedKeyId)||!id(leaseOwner)||!isTime(nowMs)||
    !Number.isSafeInteger(leaseAttempt)||leaseAttempt<1||
    leaseAttempt>10)
  return stop('ACC247_ISOLATED_READER_AND_LEASE_REQUIRED');
 let ctrl;
 try{ctrl=recipientDb.prepare(controlSql).get();}
 catch{return stop('ACC247_RECEIVER_FIXTURE_MARKER_MISSING');}
 if(ctrl?.marker!=='ACC247_FAKE_RECEIVER_ONLY'||
    ctrl?.mode!=='ISOLATED_SQLITE_RECEIVER')
  return stop('ACC247_RECEIVER_FIXTURE_MARKER_MISSING');
 // Exact source-only order_created V1 envelope and pinned supplied HMAC.
 const verified=await verifyHmac({
  message,verifyKey,expectedKeyId,nowMs
 });
 if(verified.success!==true||verified.eventType!=='order_created'||
    verified.financialAuthority!==false||
    verified.invoicePostingAllowed!==false)
  return stop('ACC247_SIGNED_ORDER_CREATED_UNTRUSTED');
 const e=message.envelope,p=e.payload,body=JSON.stringify(message);
 let sender;
 try{sender=await sourceOutboxDb.prepare(srcSql).bind(e.event_id).first();}
 catch{return stop('ACC247_SENDER_OUTBOX_UNAVAILABLE');}
 if(!sender||sender.eventId!==e.event_id||
    sender.orderId!==p.order_id||
    sender.idempotencyKey!==e.idempotency_key||
    sender.state!=='LEASED'||sender.leaseOwner!==leaseOwner||
    sender.attempts!==leaseAttempt||
    sender.simulatedHandoffEpoch!==leaseAttempt||
    !Number.isSafeInteger(sender.leaseUntilMs)||
    sender.leaseUntilMs<=nowMs||sender.payloadJson!==body||
    typeof sender.leaseSourceRevisionJson!=='string'||
    sender.leaseSourceRevisionJson.length>2048||
    !/^[0-9a-f]{64}$/.test(sender.payloadSha256||''))
  return stop('ACC247_SENDER_HANDOFF_OR_SIGNED_BYTES_UNQUALIFIED');
 let digest;
 try{digest=await hash(body);}
 catch{return stop('ACC247_CRYPTO_HASH_UNAVAILABLE');}
 if(digest!==sender.payloadSha256)
  return stop('ACC247_SIGNED_BYTES_HASH_CONFLICT');
 // Independent receiver-time ORIGINAL T12 read. No caller-provided approval,
 // browser/customer name, or finance DB snapshot can replace this recheck.
 let source;
 try{source=await inspectSource({
  db:sourceDb,orderId:p.order_id,
  expectedOfficialCustomerId:p.customer_id
 });}catch{return stop('ACC247_FRESH_T12_ORIGIN_UNAVAILABLE');}
 if(!compareSource(source,message,sender.leaseSourceRevisionJson))
  return stop('ACC247_SOURCE_CHANGED_BEFORE_RECEIPT');
 // Fake consumer's isolated SQLite CAS; no invoice, accounting writer,
 // delivery acknowledgement or authorization emitted.
 let savepoint=false;
 try{
  recipientDb.exec('SAVEPOINT acc247_context_fixture');
  savepoint=true;
  const res=recipientDb.prepare(insertSql).run(
    e.event_id,e.idempotency_key,p.order_id,p.customer_id,body,digest,
    sender.leaseSourceRevisionJson,nowMs
  );
  const existing=recipientDb.prepare(recipientSql).get(e.event_id);
  if(!existing||existing.eventId!==e.event_id||
     existing.idempotencyKey!==e.idempotency_key||
     existing.orderId!==p.order_id||
     existing.customerId!==p.customer_id||
     existing.signedPayloadJson!==body||
     existing.payloadSha256!==digest||
     existing.sourceRevisionJson!==sender.leaseSourceRevisionJson||
     existing.state!=='SOURCE_CONTEXT_ONLY_NO_POST'||
     ![0,1].includes(res?.changes))
   throw Error('CONFLICT');
  recipientDb.exec('RELEASE SAVEPOINT acc247_context_fixture');
  savepoint=false;
  return Object.freeze({
   success:true,fixtureContextStored:true,
   duplicateIdenticalContext:res.changes===0,
   sourceRevisionMatchedAtFixtureReceipt:true,
   fixtureOnly:true,consumerAcknowledged:false,
   customerOwnershipAttested:false,realDepartmentApprovalAttested:false,
   invoiceRequested:false,postingAllowed:false,financeAuthorized:false,
   productionRelease:'NO_GO'
  });
 }catch{
  if(savepoint){
   try{recipientDb.exec('ROLLBACK TO SAVEPOINT acc247_context_fixture');}
   catch{/* fail closed */}
   try{recipientDb.exec('RELEASE SAVEPOINT acc247_context_fixture');}
   catch{/* fail closed */}
  }
  return stop('ACC247_CONTEXT_DUPLICATE_CONFLICT_OR_SQL_ERROR');
 }
}


/* ACC248 — a historical context record is NOT an evergreen invoice grant.
 * Inspect the immutable fake recipient inbox again BEFORE anyone could
 * propose finance treatment. Read only; never mutate or ACK. Do not infer
 * Wael/Gaber line approval, cash, customer ownership or live Cloud trust.
 * Stage table/schema and producer secrets remain separately unqualified.
 * Expired original HMAC cannot authorize downstream use or be re-dated.
 */
export async function auditACC248StoredContextBeforeInvoiceFixtureOnly({
 sourceDb,recipientDb,eventId,verifyKey,expectedKeyId,nowMs,mode
}={}){
 if(mode!=='ISOLATED_SQLITE_RECEIVER')return stop('ACC248_AUDIT_DEFAULT_OFF');
 if(!sourceDb||typeof sourceDb.batch!=='function'||
    typeof sourceDb.prepare!=='function'||
    !recipientDb||typeof recipientDb.prepare!=='function'||
    !globalThis.crypto?.subtle||!id(eventId)||!id(expectedKeyId)||
    !isTime(nowMs))
  return stop('ACC248_SOURCE_AND_CONTEXT_READERS_REQUIRED');
 let control,row;
 try{
  control=recipientDb.prepare(controlSql).get();
  row=recipientDb.prepare(recipientSql).get(eventId);
 }catch{return stop('ACC248_RECEIVER_CONTEXT_SCHEMA_UNAVAILABLE');}
 if(control?.marker!=='ACC247_FAKE_RECEIVER_ONLY'||
    control?.mode!=='ISOLATED_SQLITE_RECEIVER')
  return stop('ACC248_RECEIVER_CONTEXT_MARKER_UNVERIFIED');
 if(!row||row.eventId!==eventId||row.state!=='SOURCE_CONTEXT_ONLY_NO_POST'||
    !id(row.idempotencyKey)||!id(row.orderId)||!id(row.customerId)||
    typeof row.signedPayloadJson!=='string'||
    row.signedPayloadJson.length>16384||
    typeof row.sourceRevisionJson!=='string'||
    row.sourceRevisionJson.length>2048||
    !/^[0-9a-f]{64}$/.test(row.payloadSha256||''))
  return stop('ACC248_NO_TRUSTED_ORIGINAL_CONTEXT_ROW');
 let msg;
 try{msg=JSON.parse(row.signedPayloadJson);}
 catch{return stop('ACC248_IMMUTABLE_CONTEXT_INVALID');}
 const e=msg?.envelope,p=e?.payload;
 if(!e||!p||e.event_id!==eventId||
    e.idempotency_key!==row.idempotencyKey||
    p.order_id!==row.orderId||p.customer_id!==row.customerId||
    e.event_type!=='order_created')
  return stop('ACC248_CONTEXT_SOURCE_BINDING_MISMATCH');
 let digest;
 try{digest=await hash(row.signedPayloadJson);}
 catch{return stop('ACC248_CONTEXT_HASH_UNAVAILABLE');}
 if(digest!==row.payloadSha256)
  return stop('ACC248_CONTEXT_HASH_MISMATCH');
 const verified=await verifyHmac({
  message:msg,verifyKey,expectedKeyId,nowMs
 });
 if(verified.success!==true||verified.eventType!=='order_created'||
    verified.financialAuthority!==false||
    verified.invoicePostingAllowed!==false)
  return stop('ACC248_CONTEXT_HMAC_EXPIRED_OR_UNVERIFIED');
 let actual;
 try{actual=await inspectSource({
  db:sourceDb,orderId:p.order_id,
  expectedOfficialCustomerId:p.customer_id
 });}catch{return stop('ACC248_CURRENT_ORIGINAL_T12_READ_UNAVAILABLE');}
 if(!compareSource(actual,msg,row.sourceRevisionJson))
  return stop('ACC248_CONTEXT_STALE_SINCE_RECEIPT');
 return Object.freeze({
  success:true,fixtureContextCurrent:true,readOnly:true,
  contextPurpose:'prepare_context_only',
  expectedOrderId:p.order_id,
  sourceOnly:true,fixtureOnly:true,
  realSignedLineApprovalsVerified:false,
  customerOwnershipAttested:false,
  independentSignerVerified:false,consumerAcknowledged:false,
  financeAuthorized:false,invoiceRequested:false,postingAllowed:false,
  productionRelease:'NO_GO',
  nextRequiredGate:'REAL_CUSTOMER_OWNER_AND_WAEL_GABER_SIGNED_LINE_APPROVALS'
 });
}
