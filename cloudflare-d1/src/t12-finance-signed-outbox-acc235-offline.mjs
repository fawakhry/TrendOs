/* ACC235: disposable SQLITE ONLY rehearsal for retaining EXACT original
 * ACC233/234 HMAC-signed TrendOS V1 order_created bytes across retry/crash.
 * NOT a production schema/migration, shared D1, Cloudflare Worker import,
 * provider receipt, delivery, finance approval, billing or live connector.
 * Source truth comes ONLY from the existing T12 inspector-backed signer.
 */
import {
 buildT12SignedOrderCreatedSourceOnly as originalSigned,
 verifyT12SignedOrderCreatedSourceOnly as verifySigned
} from './t12-finance-connector-v1-order-created-sourceonly.mjs';

export const ACC235_SIGNED_OUTBOX_POLICY=Object.freeze({
 defaultMode:'OFF',fixtureMode:'ISOLATED_SQLITE_FIXTURE',
 standaloneTestSchemaOnly:true,workerWired:false,httpRouteAvailable:false,
 noExternalTransport:true,immutableSignedBytes:true,
 consumerAckQualified:false,realLedgerQualified:false,
 departmentalApprovalAttested:false,financialPostingAllowed:false,
 productionRelease:'NO_GO'
});
export const ACC235_ISOLATED_SCHEMA=`
CREATE TABLE acc235_signed_outbox_fixture(
 event_id TEXT PRIMARY KEY NOT NULL,
 order_id TEXT NOT NULL,
 idempotency_key TEXT NOT NULL UNIQUE,
 payload_json TEXT NOT NULL,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','LEASED','DEAD_LETTER')),
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
 lease_owner TEXT NOT NULL DEFAULT '',
 lease_until_ms INTEGER NOT NULL DEFAULT 0,
 created_at_ms INTEGER NOT NULL
);
CREATE TRIGGER acc235_immutable_signed_message
BEFORE UPDATE OF event_id,order_id,idempotency_key,payload_json,payload_sha256,created_at_ms
ON acc235_signed_outbox_fixture BEGIN
 SELECT RAISE(ABORT,'ACC235_SIGNED_BYTES_IMMUTABLE');
END;
CREATE TRIGGER acc235_no_delete
BEFORE DELETE ON acc235_signed_outbox_fixture BEGIN
 SELECT RAISE(ABORT,'ACC235_SIGNED_OUTBOX_NO_DELETE');
END;
`;
const stop=code=>({success:false,code,sourceOnly:true,financeAuthorized:false,
 postingAllowed:false,connectorEventPublished:false,consumerAcknowledged:false,
 productionRelease:'NO_GO'});
const isId=x=>typeof x==='string'&&x.length>0&&x.length<=160&&
 x===x.trim()&&x.normalize('NFC')===x&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(x);
const clock=n=>Number.isSafeInteger(n)&&n>0;
const DB_SQL=Object.freeze({
 insert:`INSERT INTO acc235_signed_outbox_fixture
 (event_id,order_id,idempotency_key,payload_json,payload_sha256,created_at_ms)
 VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING`,
 find:`SELECT event_id AS eventId,order_id AS orderId,
 idempotency_key AS idempotencyKey,payload_json AS payloadJson,
 payload_sha256 AS payloadSha256,state,attempts,
 lease_owner AS leaseOwner,lease_until_ms AS leaseUntilMs
 FROM acc235_signed_outbox_fixture WHERE event_id=? LIMIT 1`,
 claim:`UPDATE acc235_signed_outbox_fixture
 SET state='LEASED',lease_owner=?,lease_until_ms=?,attempts=attempts+1
 WHERE event_id=? AND attempts<? AND
 (state='PENDING' OR (state='LEASED' AND lease_until_ms<=?))
 RETURNING event_id AS eventId,payload_json AS payloadJson,
 payload_sha256 AS payloadSha256,attempts,lease_owner AS leaseOwner,
 lease_until_ms AS leaseUntilMs`,
 release:`UPDATE acc235_signed_outbox_fixture
 SET state='PENDING',lease_owner='',lease_until_ms=0
 WHERE event_id=? AND state='LEASED' AND lease_owner=? AND
 lease_until_ms>?
 RETURNING event_id AS eventId`,
 dead:`UPDATE acc235_signed_outbox_fixture
 SET state='DEAD_LETTER',lease_owner='',lease_until_ms=0
 WHERE event_id=? AND state<>'DEAD_LETTER' AND
 (state='PENDING' OR lease_until_ms<=?)
 RETURNING event_id AS eventId`
});
async function hash(message){
 const bytes=new TextEncoder().encode(message);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
function adapter(db){
 return db&&typeof db.prepare==='function'&&
 typeof db.prepare(DB_SQL.find)?.bind==='function';
}
async function get(db,eventId){
 return db.prepare(DB_SQL.find).bind(eventId).first();
}
async function checked(db,eventId,verifyKey,expectedKeyId,nowMs){
 let row;
 try{row=await get(db,eventId);}catch{return stop('ISOLATED_OUTBOX_READ_UNAVAILABLE');}
 if(!row)return stop('SIGNED_MESSAGE_NOT_PERSISTED');
 if(row.eventId!==eventId||row.state==='DEAD_LETTER')
  return stop('OUTBOX_ROW_DEAD_OR_CONFLICTED');
 if(typeof row.payloadJson!=='string'||row.payloadJson.length>16384||
    !/^[0-9a-f]{64}$/.test(row.payloadSha256||''))
  return stop('OUTBOX_STORED_BYTES_INVALID');
 let message;try{message=JSON.parse(row.payloadJson);}catch{return stop('OUTBOX_STORED_BYTES_INVALID');}
 try{
  if(await hash(row.payloadJson)!==row.payloadSha256)
   return stop('OUTBOX_STORED_BYTES_TAMPERED');
 }catch{return stop('OUTBOX_HASH_UNAVAILABLE');}
 const v=await verifySigned({message,verifyKey,expectedKeyId,nowMs});
 if(v.success!==true)return stop('OUTBOX_SIGNATURE_STALE_OR_UNVERIFIED');
 if(message.envelope.event_id!==eventId||
    message.envelope.source_entity_id!==row.orderId||
    message.envelope.idempotency_key!==row.idempotencyKey)
  return stop('OUTBOX_ORDER_IDEMPOTENCY_BINDING_CONFLICT');
 return {success:true,row,message};
}
export async function persistOriginalSignedFixtureOnly({
 sourceDb,outboxDb,orderId,expectedOfficialCustomerId,signKey,
 verifyKey,keyId,nowMs,mode
}={}){
 if(mode!=='ISOLATED_SQLITE_FIXTURE')return stop('OUTBOX_DEFAULT_OFF');
 if(!sourceDb||!adapter(outboxDb)||!clock(nowMs)||
    !isId(orderId)||!isId(expectedOfficialCustomerId)||!isId(keyId))
  return stop('OUTBOX_INPUT_INVALID');
 const signed=await originalSigned({
  db:sourceDb,orderId,expectedOfficialCustomerId,
  signKey,keyId,mode:'ISOLATED_SOURCE_ONLY',nowMs
 });
 if(!signed.success)return stop('ORIGINAL_SOURCE_NOT_SIGNABLE');
 const m=signed.message;
 const check=await verifySigned({message:m,verifyKey,expectedKeyId:keyId,nowMs});
 if(check.success!==true)return stop('OUTBOX_SIGNER_VERIFIER_UNMATCHED');
 const serialized=JSON.stringify(m);
 let digest;try{digest=await hash(serialized);}catch{return stop('OUTBOX_HASH_UNAVAILABLE');}
 try{
  // Uniqueness is the SQLite storage CAS. Never use UPSERT to replace bytes.
  await outboxDb.prepare(DB_SQL.insert).bind(
   m.envelope.event_id,orderId,m.envelope.idempotency_key,
   serialized,digest,nowMs).run();
  const existing=await get(outboxDb,m.envelope.event_id);
  if(!existing||existing.payloadJson!==serialized||
     existing.payloadSha256!==digest||existing.orderId!==orderId||
     existing.idempotencyKey!==m.envelope.idempotency_key||
     existing.state==='DEAD_LETTER')
   return stop('OUTBOX_IMMUTABLE_EVENT_IDEMPOTENCY_CONFLICT');
  return {success:true,storedExactMessage:true,
   persistedEventId:existing.eventId,persistedHash:digest,
   sourceOnly:true,connectorEventPublished:false,
   financeAuthorized:false,postingAllowed:false,
   consumerAcknowledged:false,productionRelease:'NO_GO'};
 }catch{return stop('OUTBOX_FIXTURE_WRITE_OR_SCHEMA_UNAVAILABLE');}
}
export async function reserveSignedFixtureForSimulatedRetry({
 outboxDb,eventId,verifyKey,keyId,nowMs,leaseOwner,
 leaseMs=15000,maxAttempts=3,mode
}={}){
 if(mode!=='ISOLATED_SQLITE_FIXTURE')return stop('OUTBOX_DEFAULT_OFF');
 if(!adapter(outboxDb)||!isId(eventId)||!isId(keyId)||
    !isId(leaseOwner)||!clock(nowMs)||
    !Number.isSafeInteger(leaseMs)||leaseMs<1000||leaseMs>60000||
    !Number.isSafeInteger(maxAttempts)||maxAttempts<1||maxAttempts>10)
  return stop('OUTBOX_RESERVATION_INVALID');
 const existing=await checked(outboxDb,eventId,verifyKey,keyId,nowMs);
 if(!existing.success)return existing;
 if(existing.row.state==='LEASED'&&existing.row.leaseUntilMs>nowMs)
  return stop('OUTBOX_ALREADY_LEASED');
 if(existing.row.attempts>=maxAttempts)
  return stop('OUTBOX_RETRY_BUDGET_EXHAUSTED');
 let claimed;
 try{claimed=await outboxDb.prepare(DB_SQL.claim)
  .bind(leaseOwner,nowMs+leaseMs,eventId,maxAttempts,nowMs).first();}
 catch{return stop('OUTBOX_RESERVATION_SQL_UNAVAILABLE');}
 if(!claimed||claimed.eventId!==eventId||
    claimed.payloadJson!==existing.row.payloadJson||
    claimed.payloadSha256!==existing.row.payloadSha256||
    claimed.leaseOwner!==leaseOwner||claimed.leaseUntilMs!==nowMs+leaseMs)
  return stop('OUTBOX_CONCURRENT_RESERVATION_LOST');
 return {success:true,simulationOnly:true,
  originalSignedMessage:existing.message,attempts:claimed.attempts,
  leaseOwner,leaseUntilMs:claimed.leaseUntilMs,
  sourceOnly:true,connectorEventPublished:false,
  financeAuthorized:false,postingAllowed:false,
  consumerAcknowledged:false,productionRelease:'NO_GO'};
}
export async function releaseUnconfirmedFixtureLease({
 outboxDb,eventId,leaseOwner,nowMs,mode
}={}){
 if(mode!=='ISOLATED_SQLITE_FIXTURE')return stop('OUTBOX_DEFAULT_OFF');
 if(!adapter(outboxDb)||!isId(eventId)||!isId(leaseOwner)||!clock(nowMs))
  return stop('OUTBOX_RELEASE_INVALID');
 try{
  const r=await outboxDb.prepare(DB_SQL.release)
   .bind(eventId,leaseOwner,nowMs).first();
  if(!r)return stop('OUTBOX_LEASE_NOT_OWNED_OR_EXPIRED');
  return {success:true,sourceOnly:true,consumerAcknowledged:false,
   connectorEventPublished:false,productionRelease:'NO_GO'};
 }catch{return stop('OUTBOX_RELEASE_SQL_UNAVAILABLE');}
}
export async function isolateDeadLetterFixtureOnly({
 outboxDb,eventId,nowMs,mode
}={}){
 if(mode!=='ISOLATED_SQLITE_FIXTURE')return stop('OUTBOX_DEFAULT_OFF');
 if(!adapter(outboxDb)||!isId(eventId)||!clock(nowMs))
  return stop('OUTBOX_DEAD_LETTER_INVALID');
 try{
  const r=await outboxDb.prepare(DB_SQL.dead).bind(eventId,nowMs).first();
  if(!r)return stop('OUTBOX_NOT_ELIGIBLE_FOR_DEAD_LETTER');
  return {success:true,quarantined:true,sourceOnly:true,
   connectorEventPublished:false,consumerAcknowledged:false,
   postingAllowed:false,productionRelease:'NO_GO'};
 }catch{return stop('OUTBOX_DEAD_LETTER_SQL_UNAVAILABLE');}
}
