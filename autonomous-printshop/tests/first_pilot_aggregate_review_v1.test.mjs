import assert from 'node:assert/strict';
import {buildFirstPilotAggregateReviewV1 as review} from '../core/first-pilot-aggregate-review-v1.mjs';

// AP-106: owner-observed screenshot counts, not a new query and not Cairo-local.
// No actual order, line, customer or machine identity appears in this test.
const historical=review({
  basis:'AP106_UTC_HISTORICAL',
  rows:[
    {department:'طباعة',dueBucket:'OVERDUE_UTC',lineCount:16},
    {department:'طباعة',dueBucket:'DUE_TODAY_UTC',lineCount:14},
    {department:'طباعة',dueBucket:'FUTURE_UTC',lineCount:9}
  ],
  expectedPrintingLines:39,
  readinessEvidenceRows:0
});
assert.equal(historical.classification,'AGGREGATE_VALIDATED_SYNTACTICALLY');
assert.equal(historical.dateAuthority,'HISTORICAL_UTC_NOT_CAIRO_REVALIDATED');
assert.deepEqual(historical.safeSummary.printing,
  {overdue:16,dueToday:14,future:9,requiresDateReview:0,total:39});
assert.equal(historical.historicalReadinessEvidenceRows,0);
assert.equal(historical.observedReadinessNotCurrent,true);
assert.equal(historical.humanQueues.overdue,'ESCALATE_TO_AUTHORIZED_HUMAN_WITHOUT_AUTOMATED_ASSIGNMENT');
assert.equal(historical.humanQueues.future,'POTENTIAL_MANUAL_EVIDENCE_REVIEW_ONLY');
assert.equal(historical.sourceAuthenticatedForIndividualLine,false);
assert.equal(historical.pilotLineSelected,false);
assert.equal(historical.candidateExists,false);
assert.equal(historical.strictEligible,null);
assert.equal(historical.assignmentAllowed,false);
assert.equal(historical.operatorTaskActivationAllowed,false);
assert.equal(historical.readyWriteAllowed,false);
assert.equal(historical.productionWriteAllowed,false);
assert.ok(historical.evidenceToAcquire.DESIGN.includes('SAME_LINE_PRIVATE_ASSET_SHA256'));
assert.ok(historical.evidenceToAcquire.MATERIAL.includes('POSITIVE_CONSUMPTION'));
assert.ok(historical.evidenceToAcquire.MACHINE.includes('SERIAL_OR_ASSET_TAG'));

// Synthetic AP-107 Cairo-local SELECT result with rejection buckets.
// Accepted row format still cannot identify a line or certify runtime.
const cairo=review({
  basis:'AP107_CAIRO_LOCAL',
  rows:[
    {department:'طباعة',dueBucket:'OVERDUE_HUMAN_REVIEW',lineCount:3},
    {department:'طباعة',dueBucket:'DUE_TODAY_HUMAN_REVIEW',lineCount:2},
    {department:'طباعة',dueBucket:'FUTURE_DATE_EVIDENCE_REVIEW',lineCount:1},
    {department:'طباعة',dueBucket:'INVALID_CALENDAR_DATE_REVIEW',lineCount:1},
    {department:'طباعة',dueBucket:'FLY_FLAG_REVIEW',lineCount:1},
    {department:'ليزر',dueBucket:'DATE_FORMAT_OR_TIME_REVIEW',lineCount:2}
  ],expectedPrintingLines:8
});
assert.equal(cairo.classification,'AGGREGATE_VALIDATED_SYNTACTICALLY');
assert.equal(cairo.dateAuthority,'CAIRO_QUERY_CLAIM_NOT_LIVE_VERIFIED');
assert.equal(cairo.safeSummary.printing.requiresDateReview,2);
assert.equal(cairo.safeSummary.laser.requiresDateReview,2);
assert.equal(cairo.pilotLineSelected,false);
assert.equal(cairo.sameLineEvidenceVerified,false);

// Inject PII into raw rows and even unfamiliar status fields: never echo.
// Invalid/duplicate/mismatching counts fail CLOSED, not zero real candidates.
const privateMarker='CUSTOMER_PHONE_AND_PRIVATE_LINE_010SECRET';
for(const raw of [
  [{department:privateMarker,dueBucket:'OVERDUE_HUMAN_REVIEW',lineCount:1,
    customer:privateMarker,lineId:privateMarker}],
  [{department:'طباعة',dueBucket:privateMarker,lineCount:1}],
  [{department:'طباعة',dueBucket:'OVERDUE_HUMAN_REVIEW',lineCount:'16'}],
  [{department:'طباعة',dueBucket:'OVERDUE_HUMAN_REVIEW',lineCount:-1}],
  [{department:'طباعة',dueBucket:'OVERDUE_HUMAN_REVIEW',lineCount:NaN}],
  [{department:'طباعة',dueBucket:'OVERDUE_HUMAN_REVIEW',lineCount:1},
   {department:'طباعة',dueBucket:'OVERDUE_HUMAN_REVIEW',lineCount:2}]
]){
  const result=review({basis:'AP107_CAIRO_LOCAL',rows:raw});
  assert.equal(result.classification,'BLOCKED_SAFE');
  assert.equal(result.pilotLineSelected,false);
  assert.equal(result.safeSummary.printing.total,0);
  assert.equal(result.strictEligible,null);
  assert.equal(JSON.stringify(result).includes(privateMarker),false);
}
const mismatch=review({basis:'AP106_UTC_HISTORICAL',
  rows:[{department:'طباعة',dueBucket:'FUTURE_UTC',lineCount:9}],expectedPrintingLines:39});
assert.deepEqual(mismatch.validationProblems,['PRINTING_TOTAL_MISMATCH']);
assert.equal(mismatch.classification,'BLOCKED_SAFE');
assert.equal(review({basis:'ATTACKER_SOURCE',rows:[]}).classification,'BLOCKED_SAFE');
assert.equal(review({basis:'AP107_CAIRO_LOCAL',rows:null}).classification,'BLOCKED_SAFE');
assert.equal(review({basis:'AP107_CAIRO_LOCAL',rows:[],readinessEvidenceRows:'0'}).classification,'BLOCKED_SAFE');
assert.equal(review({basis:'AP107_CAIRO_LOCAL',rows:[],expectedPrintingLines:0}).pilotLineSelected,false);
for(const result of [historical,cairo,mismatch]){
  const encoded=JSON.stringify(result);
  for(const key of ['orderId','lineId','customerName','sourceRef','serialOrAssetTag','PRIVATE_LINE']){
    assert.equal(encoded.includes('\"'+key+'\":'),false);
  }
}
console.log('AP109_AP106_16_14_9_HISTORICAL_ONLY=PASS');
console.log('AP109_AP107_SYNTHETIC_CAIRO_REVIEW_BUCKETS=PASS');
console.log('AP109_MALFORMED_DUPLICATE_SOURCE_COUNTS=BLOCKED_SAFE');
console.log('AP109_NO_IDENTIFIERS_NO_AUTO_SELECTION=PASS');
console.log('AP109_LIVE_D1=NOT_QUERIED; BUSINESS_WRITES=0; PRODUCTION_DEPLOY=NO');
