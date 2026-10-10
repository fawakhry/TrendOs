import assert from 'node:assert/strict';
import {buildLiveLineSnapshotHumanReviewV1 as review} from '../core/live-line-snapshot-human-review-v1.mjs';

// Synthetic in-memory attack fixtures ONLY; no real customer, DB, network.
const now=Date.parse('2026-10-10T15:00:00Z');
const key='SYNTHETIC_PRIVATE_LINE';
const SECRET='SENSITIVE_CUSTOMER_SOURCE_REF_MUST_NOT_LEAK';
const params={
 selectedPrivateLineKey:key,nowMs:now,
 source:{kind:'D1_QUALIFIED_SHADOW',authorizedRead:true,snapshotComplete:true,
   observedAtMs:now-1000},
 rows:[{lineId:key,department:'طباعة',status:'طلب جديد',lineActive:true,
   orderActive:true,archived:false,flyPrint:0,dueDate:'2026-10-12'}]
};
const event={lineId:key,kind:'DESIGN',state:'READY',
 sourceKind:'DESIGN_PREFLIGHT',sourceRef:SECRET,
 sourceVersion:'a'.repeat(64),observedAtMs:now-500,expiresAtMs:now+10000,
 evidence:{preflightResult:'PASS',approvalState:'OWNER_APPROVED',
   approvalGate:'REQUIRED',assetBindingState:'READY',privateNote:SECRET}
};
assert.equal(review({...params,events:[event]}).status,'HUMAN_REVIEW_ONLY');
// The underlying private reviewer cannot JSON.stringify cyclic evidence;
// the public review helper must return fixed denial without exceptions.
const cyclic={...event,evidence:{...event.evidence}};
cyclic.evidence.self=cyclic.evidence;
const bigint={...event,evidence:{...event.evidence,sequence:1n}};
const getter={...event,get lineId(){throw new Error(SECRET);}};
for(const poison of [cyclic,bigint,getter]){
 const result=review({...params,events:[poison]});
 assert.equal(result.status,'BLOCKED_SAFE');
 assert.equal(result.reviewReason,'PRIVATE_EVIDENCE_INPUT_UNVERIFIED');
 assert.equal(result.manualReviewPacketExists,false);
 assert.equal(result.pilotLineSelected,false);
 assert.equal(result.assignmentAllowed,false);
 assert.equal(result.productionWriteAllowed,false);
 assert.equal(result.readyWriteAllowed,false);
 assert.equal(result.sourceAuthenticatedIndependently,false);
 assert.ok(!JSON.stringify(result).includes(SECRET));
 assert.ok(!JSON.stringify(result).includes(key));
}
// No persistent state: valid clean records still support human-only review.
const recovered=review({...params,events:[event]});
assert.equal(recovered.status,'HUMAN_REVIEW_ONLY');
assert.equal(recovered.evidenceStatusByKind.DESIGN,
  'DESIGN_EXTERNAL_PROVENANCE_REVIEW_REQUIRED');
assert.equal(recovered.sameLineEvidenceVerified,false);
console.log('AP117_PRIVATE_CYCLIC_BIGINT_GETTER=FAIL_CLOSED');
console.log('AP117_MALFORMED_SOURCE_NEVER_EXPOSES_EXCEPTION=PASS');
console.log('AP117_CLEAN_REVIEW_RECOVERS_HUMAN_ONLY=PASS');
console.log('AP117_PRODUCTION_DEPLOY=NO; D1_WRITES=0');
