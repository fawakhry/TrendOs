export const COMMS_PENDING_PROJECTION_VERSION='COMMS_PENDING_PROJECTION_V1_20261007';

function text(v){return String(v==null?'':v).trim();}
function count(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.trunc(n):0;}
function epoch(v){const n=Number(v);return Number.isFinite(n)&&n>=0?Math.trunc(n):0;}
function isoMs(v){
  const raw=text(v);
  if(!raw)return 0;
  const normalized=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)?raw.replace(' ','T')+'Z':raw;
  const ms=Date.parse(normalized);
  return Number.isFinite(ms)?ms:0;
}
function hours(value){return Math.round(value*10)/10;}

export function buildCommsPendingProjectionV1(row={},options={}){
  const nowMs=Number.isFinite(Number(options.nowMs))?Number(options.nowMs):Date.now();
  const waitingReply=count(row.waitingReply);
  const managerEscalations=count(row.managerEscalations);
  const attentionConversations=count(row.attentionConversations);
  const feedbackSendPending=count(row.feedbackSendPending);
  const feedbackFollowupRequired=count(row.feedbackFollowupRequired);
  const totalPendingSignals=attentionConversations+feedbackSendPending+feedbackFollowupRequired;
  const oldestAt=text(row.oldestAttentionAt);
  const oldestMs=attentionConversations>0?isoMs(oldestAt):0;
  const oldestAttentionAgeHours=oldestMs>0?hours(Math.max(0,nowMs-oldestMs)/3600000):0;

  return {
    version:COMMS_PENDING_PROJECTION_VERSION,
    mode:'READ_ONLY_AGGREGATE',
    control:{
      mode:text(row.commsMode)||'OFF',
      policyEpoch:epoch(row.commsPolicyEpoch)
    },
    counts:{
      waitingReply,
      managerEscalations,
      attentionConversations,
      feedbackSendPending,
      feedbackFollowupRequired,
      totalPendingSignals,
      ownerReviewSignals:managerEscalations+feedbackFollowupRequired
    },
    oldestAttentionAgeHours,
    hasPending:totalPendingSignals>0,
    sendAuthority:false,
    rawPhoneExposed:false,
    customerIdentityExposed:false,
    rawOrderIdsExposed:false,
    messageTextExposed:false,
    employeeIdentityExposed:false
  };
}
