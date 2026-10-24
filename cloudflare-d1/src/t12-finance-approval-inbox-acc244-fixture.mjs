/* ACC244 — fake, offline-only consumer inbox rehearsal for EXISTING
 * ACCOUNTING_CONNECTOR_CONTRACT_V1 / ACC243 fixture HMAC messages.
 * Uses disposable node:sqlite-like DB with .exec and .prepare().get/run.
 * No Worker import, real D1 binding, production migration or finance POST.
 * Does not turn synthetic signatures into real operational approvals.
 */
import {verifyACC243FakeSignedLineApprovals as check}
  from './t12-finance-line-approved-acc243-fixture-verify.mjs';

export const ACC244_POLICY=Object.freeze({
 mode:'OFF',acceptedMode:'ISOLATED_FAKE_SQLITE_INBOX',
 standaloneFixtureDDL:true,workerWired:false,realD1Touched:false,
 durableProductionConsumer:false,independentSignerAttested:false,
 realDepartmentApprovalAttested:false,ownerAttested:false,
 financeWrites:false,financeRelease:'NO_GO'
});
export const ACC244_FIXTURE_SCHEMA=`
CREATE TABLE acc244_fixture_control (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1),
 marker TEXT NOT NULL CHECK(marker='ACC244_FAKE_SQLITE_ONLY'),
 mode TEXT NOT NULL CHECK(mode='ISOLATED_FAKE_SQLITE_INBOX')
);
INSERT INTO acc244_fixture_control(singleton,marker,mode)
VALUES(1,'ACC244_FAKE_SQLITE_ONLY','ISOLATED_FAKE_SQLITE_INBOX');
CREATE TABLE acc244_fake_line_approval_inbox (
 event_id TEXT PRIMARY KEY NOT NULL,
 idempotency_key TEXT UNIQUE NOT NULL,
 order_id TEXT NOT NULL,
 line_id TEXT NOT NULL UNIQUE,
 customer_id TEXT NOT NULL,
 department TEXT NOT NULL,
 message_json TEXT NOT NULL,
 sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 state TEXT NOT NULL CHECK(state='FAKE_STORED_NO_POST'),
 created_at_ms INTEGER NOT NULL
);
CREATE TRIGGER acc244_immutable BEFORE UPDATE ON acc244_fake_line_approval_inbox
BEGIN SELECT RAISE(ABORT,'ACC244_FAKE_SIGNED_BYTES_IMMUTABLE'); END;
CREATE TRIGGER acc244_no_delete BEFORE DELETE ON acc244_fake_line_approval_inbox
BEGIN SELECT RAISE(ABORT,'ACC244_FAKE_INBOX_NO_DELETE'); END;
`;
const stop=code=>({success:false,code,fixtureOnly:true,
 storedForFinance:false,consumerAcknowledged:false,
 financeAuthorized:false,canPostInvoice:false,canPostCash:false,
 productionRelease:'NO_GO'});
const control='SELECT marker,mode FROM acc244_fixture_control WHERE singleton=1';
const insert=`INSERT OR IGNORE INTO acc244_fake_line_approval_inbox
 (event_id,idempotency_key,order_id,line_id,customer_id,department,
  message_json,sha256,state,created_at_ms)
 VALUES (?,?,?,?,?,?,?,?,'FAKE_STORED_NO_POST',?)`;
const fetch=`SELECT event_id AS eventId,idempotency_key AS idempotencyKey,
 order_id AS orderId,line_id AS lineId,customer_id AS customerId,
 department,message_json AS messageJson,sha256,state,created_at_ms AS createdAtMs
 FROM acc244_fake_line_approval_inbox WHERE event_id=? LIMIT 1`;
async function digest(str){
 const bytes=new TextEncoder().encode(str);
 const result=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(result),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function storeACC244FakeLineApprovals({
 sourceResponse,lineagePreview,messages,verifyKey,expectedKeyId,
 nowMs,mode,fakeDb
}={}){
 if(mode!=='ISOLATED_FAKE_SQLITE_INBOX')
  return stop('ACC244_DEFAULT_OFF');
 if(!fakeDb||typeof fakeDb.exec!=='function'||
    typeof fakeDb.prepare!=='function')return stop('ACC244_DISPOSABLE_SQLITE_REQUIRED');
 try{
  const ctl=fakeDb.prepare(control).get();
  if(ctl?.marker!=='ACC244_FAKE_SQLITE_ONLY'||
     ctl?.mode!=='ISOLATED_FAKE_SQLITE_INBOX')
   return stop('ACC244_FAKE_SQLITE_MARKER_MISSING');
 }catch{return stop('ACC244_FAKE_SQLITE_MARKER_MISSING');}
 const checkResult=await check({
  sourceResponse,lineagePreview,messages,verifyKey,expectedKeyId,nowMs,
  mode:'ISOLATED_FAKE_APPROVAL_FIXTURE'
 });
 if(checkResult.success!==true||checkResult.fixtureSignaturesVerified!==true||
    checkResult.financeAuthorized!==false||
    checkResult.realSignedLineApprovalsVerified!==false)
  return stop('ACC243_FAKE_SIGNED_SET_REJECTED');
 const records=[];
 try{
  for(const m of messages)records.push({
   m,body:JSON.stringify(m),hash:await digest(JSON.stringify(m))
  });
 }catch{return stop('ACC244_FAKE_HASH_UNAVAILABLE');}
 let started=false,inserted=0;
 try{
  fakeDb.exec('SAVEPOINT acc244_fake_inbox');
  started=true;
  for(const item of records){
   const {m,body,hash}=item,e=m.envelope,p=e.payload;
   const r=fakeDb.prepare(insert).run(
    e.event_id,e.idempotency_key,p.order_id,p.line_id,p.customer_id,
    p.department,body,hash,nowMs);
   const actual=fakeDb.prepare(fetch).get(e.event_id);
   if(!actual||actual.eventId!==e.event_id||
      actual.idempotencyKey!==e.idempotency_key||
      actual.orderId!==p.order_id||actual.lineId!==p.line_id||
      actual.customerId!==p.customer_id||actual.department!==p.department||
      actual.messageJson!==body||actual.sha256!==hash||
      actual.state!=='FAKE_STORED_NO_POST'||r?.changes>1){
    throw new Error('ACC244_FAKE_INBOX_CONFLICT');
   }
   inserted+=r?.changes===1?1:0;
  }
  fakeDb.exec('RELEASE SAVEPOINT acc244_fake_inbox');
  started=false;
  return {success:true,fixtureOnly:true,fakeInboxStored:true,
   signedFakeLineCount:records.length,newFakeRows:inserted,
   deduplicatedFakeRows:records.length-inserted,
   consumerAcknowledged:false,ownerAttested:false,
   independentSignerVerified:false,realSignedLineApprovalsVerified:false,
   productionReplayLedgerQualified:false,
   financeAuthorized:false,canPostInvoice:false,canPostCash:false,
   workerWired:false,productionRelease:'NO_GO'};
 }catch{
  if(started){
   try{fakeDb.exec('ROLLBACK TO SAVEPOINT acc244_fake_inbox');}
   catch{/* failed rollback is still NO_GO */}
   try{fakeDb.exec('RELEASE SAVEPOINT acc244_fake_inbox');}
   catch{/* never publish an acknowledgement */}
  }
  return stop('ACC244_FAKE_INBOX_CONFLICT_OR_TX_FAILED');
 }
}
