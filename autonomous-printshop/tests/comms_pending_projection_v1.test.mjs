import assert from 'node:assert/strict';
import {buildCommsPendingProjectionV1,COMMS_PENDING_PROJECTION_VERSION} from '../core/comms-pending-projection-v1.mjs';

const now=Date.parse('2026-10-07T16:00:00Z');

const dormant=buildCommsPendingProjectionV1({
  commsMode:'READONLY',
  commsPolicyEpoch:2,
  feedbackEnabledAtMs:0,
  waitingReply:5,
  managerEscalations:2,
  attentionConversations:6,
  feedbackSendPending:3,
  feedbackFollowupRequired:1,
  oldestAttentionAt:'2026-10-07 10:30:00'
},{nowMs:now});

assert.equal(dormant.version,COMMS_PENDING_PROJECTION_VERSION);
assert.equal(dormant.mode,'READ_ONLY_AGGREGATE');
assert.deepEqual(dormant.control,{
  mode:'READONLY',
  policyEpoch:2,
  feedbackEnabledAtMs:0,
  feedbackOperational:false
});
assert.deepEqual(dormant.counts,{
  waitingReply:5,
  managerEscalations:2,
  attentionConversations:6,
  feedbackSendPending:0,
  feedbackFollowupRequired:0,
  feedbackDormantSendBacklog:3,
  feedbackDormantFollowupBacklog:1,
  feedbackDormantBacklog:4,
  totalPendingSignals:6,
  ownerReviewSignals:2
});
assert.equal(dormant.oldestAttentionAgeHours,5.5);
assert.equal(dormant.hasPending,true);

const active=buildCommsPendingProjectionV1({
  commsMode:'READONLY',
  commsPolicyEpoch:3,
  feedbackEnabledAtMs:Date.parse('2026-10-07T12:00:00Z'),
  waitingReply:5,
  managerEscalations:2,
  attentionConversations:6,
  feedbackSendPending:3,
  feedbackFollowupRequired:1,
  oldestAttentionAt:'2026-10-07 10:30:00'
},{nowMs:now});
assert.equal(active.control.feedbackOperational,true);
assert.equal(active.counts.feedbackSendPending,3);
assert.equal(active.counts.feedbackFollowupRequired,1);
assert.equal(active.counts.feedbackDormantBacklog,0);
assert.equal(active.counts.totalPendingSignals,10);
assert.equal(active.counts.ownerReviewSignals,3);

for(const out of [dormant,active]){
  assert.equal(out.sendAuthority,false);
  assert.equal(out.rawPhoneExposed,false);
  assert.equal(out.customerIdentityExposed,false);
  assert.equal(out.rawOrderIdsExposed,false);
  assert.equal(out.messageTextExposed,false);
  assert.equal(out.employeeIdentityExposed,false);
}

const zero=buildCommsPendingProjectionV1({
  commsMode:'READONLY',commsPolicyEpoch:2,feedbackEnabledAtMs:0,
  waitingReply:-1,managerEscalations:'x',attentionConversations:0,
  feedbackSendPending:null,feedbackFollowupRequired:undefined,
  oldestAttentionAt:'CUSTOMER_SECRET'
},{nowMs:now});
assert.equal(zero.counts.totalPendingSignals,0);
assert.equal(zero.counts.feedbackDormantBacklog,0);
assert.equal(zero.oldestAttentionAgeHours,0);
assert.equal(zero.hasPending,false);
assert.equal(JSON.stringify(zero).includes('CUSTOMER_SECRET'),false);

console.log('COMMS_PENDING_PROJECTION_V1=PASS');
console.log('FEEDBACK_DISABLED_BACKLOG=DORMANT_DIAGNOSTIC_ONLY');
console.log('COMMS_PENDING_AGGREGATE_ONLY=PASS');
console.log('COMMS_SEND_AUTHORITY=NO');
console.log('CUSTOMER_PII_EXPOSED=NO');
