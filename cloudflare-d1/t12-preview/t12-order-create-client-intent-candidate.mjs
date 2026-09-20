/**
 * TrendOS isolated frontend candidate: create-order request-id continuity.
 * NOT imported by production app.js; no network/storage/DOM mutations here.
 *
 * Repo app.js creates a fresh co_<timestamp>_<random> inside createOrder()
 * on every click. A new key after timeout can evade server-side SAME-KEY
 * idempotency; this memory-only state machine preserves the exact original
 * request ID across retries until a verified terminal outcome. Page reload
 * still requires operator inspection/reconciliation before another submission.
 *
 * Integration must preserve the ID between the warning-only / forceCreate
 * confirmation and the final send. Pending mutation of payload is prohibited
 * after a request with ambiguous outcome. No silent "Start over" reset.
 */
export function createOrderIntentCandidate({newRequestId}) {
  if (typeof newRequestId !== 'function') throw Error('INTENT_NO_ID_GENERATOR');
  let active=null;
  const omit=new Set(['username','token','sessionToken','callback',
    'clientRequestId','requestId','idempotencyKey','idempotency_key']);
  function fingerprint(payload) {
    if (!payload || Object.prototype.toString.call(payload)!=='[object Object]')
      throw Error('INTENT_INVALID_PAYLOAD');
    const keys=Object.keys(payload).filter(k=>!omit.has(k)).sort();
    const projected={};
    for(const k of keys) {
      const v=payload[k];
      if(v===null||v===undefined||['string','number','boolean'].includes(typeof v))
        projected[k]=String(v??'');
      else throw Error('INTENT_UNSUPPORTED_PAYLOAD');
    }
    return JSON.stringify(projected);
  }
  return Object.freeze({
    prepare(payload) {
      const fp=fingerprint(payload);
      if(active) {
        if(active.fingerprint!==fp) return Object.freeze({
          kind:'BLOCKED_DIFFERENT_PAYLOAD_WHILE_OLD_REQUEST_UNRESOLVED'
        });
        return Object.freeze({kind:'REUSE_EXACT_ID',requestId:active.requestId});
      }
      const id=String(newRequestId()||'');
      if(!/^co_\d{13}_[A-Za-z0-9_-]{4,80}$/.test(id))
        throw Error('INTENT_INVALID_GENERATED_ID');
      active={requestId:id,fingerprint:fp,uncertain:false};
      return Object.freeze({kind:'NEW',requestId:id});
    },
    noteTimeoutOrUnknown() {
      if(!active)throw Error('INTENT_NO_PENDING_REQUEST');
      active.uncertain=true;
      return Object.freeze({kind:'VERIFY_OR_RETRY_SAME_ID_ONLY'});
    },
    noteWarningOnlyNoMutation(confirmedNoWrite) {
      if(!active||confirmedNoWrite!==true||active.uncertain)
        throw Error('INTENT_WARNING_NOT_PROVEN_NO_WRITE');
      // Frontend may then retry with forceCreate:YES and same request ID.
      return Object.freeze({kind:'WARNING_NO_WRITE',requestId:active.requestId});
    },
    confirmForcePayload(payload) {
      if(!active||active.uncertain)throw Error('INTENT_UNRESOLVED_PREVIOUS_REQUEST');
      const forced=fingerprint(payload);
      if(!JSON.parse(forced).forceCreate ||
         JSON.parse(forced).forceCreate!=='YES')
        throw Error('INTENT_FORCE_CONFIRMATION_REQUIRED');
      active.fingerprint=forced;
      return Object.freeze({kind:'SAME_ID_WITH_EXPLICIT_FORCE',
        requestId:active.requestId});
    },
    noteTerminal(result) {
      // Only the server's *definitive* completed/rejected response may
      // discharge the intent. A generic catch/error/HTTP timeout is UNKNOWN.
      if(!active)throw Error('INTENT_NO_PENDING_REQUEST');
      if(!result||!['SERVER_COMMITTED','SERVER_REJECTED_NO_WRITE'].includes(result))
        throw Error('INTENT_TERMINAL_NOT_PROVEN');
      active=null; return Object.freeze({kind:'CLEARED_VERIFIED_TERMINAL'});
    },
    status() {return Object.freeze({
      hasUnresolvedIntent:!!active,unknownOutcome:!!(active&&active.uncertain)
    });}
  });
}
