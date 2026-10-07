import assert from 'node:assert/strict';
import {buildCommsPendingProjectionV1,COMMS_PENDING_PROJECTION_VERSION} from '../core/comms-pending-projection-v1.mjs';

const now=Date.parse('2026-10-07T16:00:00Z');
const out=buildCommsPendingProjectionV1({
  commsMode:'READONLY',
  commsPolicyEpoch:2,
  waitingReply:5,
  managerEscalations:2,
  attentionConversations:6,
  feedbackSendPending:3,
  feedbackFollowupRequired:1,
  oldestAttentionAt:'2026-10-07 10:30:00'
},{nowMs:now});

assert.equal(out.version,COMMS_PENDING_PROJECTION_VERSION);
assert.equal(out.mode,'READ_ONLY_AGGREGATE');
assert.deepEqual(out.control,{mode:'READONLY',policyEpoch:2});
assert.deepEqual(out.counts,{
  waitingReply:5,
  managerEscalations:2,
  attentionConversations:6,
  feedbackSendPending:3,
  feedbackFollowupRequired:1,
  totalPendingSignals:10,
  ownerReviewSignals:3
});
assert.equal(out.oldestAttentionAgeHours,5.5);
assert.equal(out.hasPending,true);
assert.equal(out.sendAuthority,false);
assert.equal(out.rawPhoneExposed,false);
assert.equal(out.customerIdentityExposed,false);
assert.equal(out.rawOrderIdsExposed,false);
assert.equal(out.messageTextExposed,false);
assert.equal(out.employeeIdentityExposed,false);

const zero=buildCommsPendingProjectionV1({
  commsMode:'READONLY',commsPolicyEpoch:2,
  waitingReply:-1,managerEscalations:'x',attentionConversations:0,
  feedbackSendPending:null,feedbackFollowupRequired:undefined,
  oldestAttentionAt:'CUSTOMER_SECRET'
},{nowMs:now});
assert.equal(zero.counts.totalPendingSignals,0);
assert.equal(zero.oldestAttentionAgeHours,0);
assert.equal(zero.hasPending,false);
assert.equal(JSON.stringify(zero).includes('CUSTOMER_SECRET'),false);

console.log('COMMS_PENDING_PROJECTION_V1=PASS');
console.log('COMMS_PENDING_AGGREGATE_ONLY=PASS');
console.log('COMMS_SEND_AUTHORITY=NO');
console.log('CUSTOMER_PII_EXPOSED=NO');
