import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const ledger=require(path.resolve(here,'..','gaber-material-movement-ledger-v1.js'));
const persistence=require(path.resolve(here,'..','gaber-material-persistence-v1.js'));

function consumed(id='C1',qty=3){return {eventId:id,type:'PRODUCTION_CONSUMED',workDate:'2026-09-10',department:'ليزر',employee:'جابر',taskId:'T-3910',orderId:'3910',lineId:'3910-01',materialId:'MAT-1',materialName:'محفظة',unit:'قطعة',qty,unitCost:100,sourceRef:'OPERATOR_TASK_V2:T-3910'};}
function meta(){return {taskId:'T-3910',orderId:'3910',lineId:'3910-01',decisionFingerprint:'GM1-decision',createdAt:'2026-09-10T20:45:00+03:00'};}

test('prepares deterministic append-only records for a valid movement batch',()=>{
  const p=persistence.prepareAppendTransaction([], [consumed('C1',3),consumed('C2',2)], ledger, meta());
  assert.equal(p.canCommit,true);
  assert.equal(p.appendCount,2);
  assert.equal(p.records.length,2);
  assert.ok(p.transactionId.startsWith('GMTX-'));
  assert.ok(p.materialCloseId.startsWith('GMC-'));
  assert.deepEqual(p.records.map(r=>r.eventId),['C1','C2']);
  assert.equal(new Set(p.records.map(r=>r.transactionId)).size,1);
  assert.equal(new Set(p.records.map(r=>r.materialCloseId)).size,1);
});

test('identical retry is replay-safe and appends zero rows',()=>{
  const first=persistence.prepareAppendTransaction([], [consumed()], ledger, meta());
  const retry=persistence.prepareAppendTransaction(first.records, [consumed()], ledger, meta());
  assert.equal(retry.canCommit,true);
  assert.equal(retry.isReplay,true);
  assert.equal(retry.appendCount,0);
  assert.deepEqual(Array.from(retry.replayedEventIds),['C1']);
  assert.equal(retry.materialCloseId,first.materialCloseId);
});

test('same Event ID with changed payload fails atomically',()=>{
  const first=persistence.prepareAppendTransaction([], [consumed('C1',3)], ledger, meta());
  const conflict=persistence.prepareAppendTransaction(first.records,[consumed('C1',4),consumed('C2',1)],ledger,meta());
  assert.equal(conflict.canCommit,false);
  assert.equal(conflict.records.length,0);
  assert.ok(conflict.blockers.some(b=>b.code==='MOVEMENT_EVENT_ID_CONFLICT'));
});

test('corrupt stored payload/fingerprint fails closed before any new append',()=>{
  const first=persistence.prepareAppendTransaction([], [consumed()], ledger, meta());
  const corrupt={...first.records[0],eventFingerprint:'tampered'};
  const p=persistence.prepareAppendTransaction([corrupt],[consumed('C2',1)],ledger,meta());
  assert.equal(p.canCommit,false);
  assert.equal(p.records.length,0);
  assert.ok(p.blockers.some(b=>b.code==='PERSISTENCE_FINGERPRINT_MISMATCH'));
});

test('persistence requires stable Task/Order/Line and decision identity',()=>{
  const p=persistence.prepareAppendTransaction([], [consumed()], ledger, {taskId:'T-3910'});
  assert.equal(p.canCommit,false);
  const codes=p.blockers.map(b=>b.code);
  assert.ok(codes.includes('PERSISTENCE_ORDER_ID_REQUIRED'));
  assert.ok(codes.includes('PERSISTENCE_LINE_ID_REQUIRED'));
  assert.ok(codes.includes('PERSISTENCE_DECISION_FINGERPRINT_REQUIRED'));
});

test('missing movement ledger dependency fails closed',()=>{
  const p=persistence.prepareAppendTransaction([], [consumed()], null, meta());
  assert.equal(p.canCommit,false);
  assert.equal(p.blockers[0].code,'MOVEMENT_LEDGER_DEPENDENCY_MISSING');
});

test('transaction identity is deterministic for exact same close',()=>{
  const a=persistence.prepareAppendTransaction([], [consumed('C1',3),consumed('C2',2)], ledger, meta());
  const b=persistence.prepareAppendTransaction([], [consumed('C1',3),consumed('C2',2)], ledger, meta());
  assert.equal(a.transactionId,b.transactionId);
  assert.equal(a.transactionFingerprint,b.transactionFingerprint);
  assert.equal(a.materialCloseId,b.materialCloseId);
  assert.equal(persistence.stableStringify(a.records),persistence.stableStringify(b.records));
});