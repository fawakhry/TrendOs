import assert from 'node:assert/strict';
import {createOrderIntentCandidate} from '../cloudflare-d1/t12-preview/t12-order-create-client-intent-candidate.mjs';

const params={username:'wael',token:'secret',customerName:'test',department:'طباعة',
  itemName:'mug',qty:'2'};
let serial=0;
const ids=createOrderIntentCandidate({newRequestId(){
  return 'co_1790000000000_' + String(++serial).padStart(5,'0');
}});
const original=ids.prepare(params);
assert.equal(original.kind,'NEW');
assert.equal(serial,1);
assert.equal(ids.prepare({...params,token:'rotated-secret'}).requestId,original.requestId);
assert.equal(serial,1,'retry must never generate a new client key');
assert.equal(ids.status().hasUnresolvedIntent,true);

assert.equal(ids.noteTimeoutOrUnknown().kind,'VERIFY_OR_RETRY_SAME_ID_ONLY');
const afterTimeout=ids.prepare({...params,token:'other-session'});
assert.equal(afterTimeout.kind,'REUSE_EXACT_ID');
assert.equal(afterTimeout.requestId,original.requestId);
assert.equal(ids.prepare({...params,qty:'3'}).kind,
  'BLOCKED_DIFFERENT_PAYLOAD_WHILE_OLD_REQUEST_UNRESOLVED');
assert.equal(serial,1,'changed content cannot generate another key during unknown');
assert.throws(()=>ids.noteTerminal('NETWORK_ERROR'),/INTENT_TERMINAL_NOT_PROVEN/);
assert.throws(()=>ids.noteWarningOnlyNoMutation(true),/INTENT_WARNING_NOT_PROVEN_NO_WRITE/);
assert.throws(()=>ids.confirmForcePayload({...params,forceCreate:'YES'}),
  /INTENT_UNRESOLVED_PREVIOUS_REQUEST/);
assert.equal(ids.noteTerminal('SERVER_COMMITTED').kind,'CLEARED_VERIFIED_TERMINAL');
assert.equal(ids.status().hasUnresolvedIntent,false);
const next=ids.prepare(params);
assert.notEqual(next.requestId,original.requestId);
assert.equal(serial,2);
assert.equal(ids.noteTerminal('SERVER_REJECTED_NO_WRITE').kind,'CLEARED_VERIFIED_TERMINAL');

const forced=createOrderIntentCandidate({newRequestId:()=>'co_1790000000010_force123'});
const first=forced.prepare(params);
assert.equal(forced.noteWarningOnlyNoMutation(true).requestId,first.requestId);
const confirm=forced.confirmForcePayload({...params,forceCreate:'YES'});
assert.equal(confirm.kind,'SAME_ID_WITH_EXPLICIT_FORCE');
assert.equal(confirm.requestId,first.requestId);
assert.equal(forced.prepare({...params,forceCreate:'YES'}).requestId,first.requestId);
assert.equal(forced.prepare(params).kind,
  'BLOCKED_DIFFERENT_PAYLOAD_WHILE_OLD_REQUEST_UNRESOLVED');
assert.equal(forced.noteTerminal('SERVER_COMMITTED').kind,'CLEARED_VERIFIED_TERMINAL');

assert.throws(()=>createOrderIntentCandidate({newRequestId:()=> 'short'}).prepare(params),
  /INTENT_INVALID_GENERATED_ID/);
assert.throws(()=>createOrderIntentCandidate({newRequestId:()=> 'co_1790000000000_test'})
  .prepare({...params,extra:{bad:true}}),/INTENT_UNSUPPORTED_PAYLOAD/);
console.log('Client intent isolated PASS: same ID after timeout, changed request blocked, only verified terminal clears, force confirmation same ID');
