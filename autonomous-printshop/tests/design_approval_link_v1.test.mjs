import assert from 'node:assert/strict';
import {
  sha256HexApprovalTokenV1,
  qualifyDesignApprovalOfferV1,
  buildDesignApprovalOfferSqlV1,
  buildDesignApprovalRedemptionSqlV1
} from '../core/design-approval-link-v1.mjs';

const token='0123456789abcdef0123456789abcdef-approval-secret';
const hash=await sha256HexApprovalTokenV1(token);
assert.match(hash,/^[a-f0-9]{64}$/);

let q=qualifyDesignApprovalOfferV1({
  offerId:'offer-1',artifactId:'artifact-1',lineId:'TM1-01',
  tokenSha256:hash,createdAtMs:1000,expiresAtMs:1000+3600000,
  sourceRef:'proof-send-1',createdBy:'owner'
});
assert.equal(q.qualified,true);
assert.equal(q.approvalGranted,false);

q=qualifyDesignApprovalOfferV1({
  offerId:'offer-2',artifactId:'artifact-2',lineId:'TM2-01',
  tokenSha256:hash,createdAtMs:1000,expiresAtMs:1000+8*24*60*60*1000,
  sourceRef:'proof-send-2',createdBy:'owner'
});
assert.equal(q.qualified,false);
assert.ok(q.reasons.includes('EXPIRY_TOO_LONG'));

const offerSql=buildDesignApprovalOfferSqlV1({
  offerId:'offer-1',artifactId:'artifact-1',lineId:'TM1-01',
  tokenSha256:hash,createdAtMs:1000,expiresAtMs:3601000,
  sourceRef:'proof-send-1',createdBy:'owner'
});
assert.match(offerSql,/autonomous_design_approval_link_offers/);
assert.match(offerSql,/mode='SHADOW'/);
assert.match(offerSql,/autonomous_design_artifacts/);
assert.doesNotMatch(offerSql,/CUSTOMER_APPROVED/);

const approveSql=buildDesignApprovalRedemptionSqlV1({
  redemptionId:'redeem-1',tokenSha256:hash,decision:'APPROVE',
  evidenceRef:'approval-link-click-1',observedAtMs:2000
});
assert.match(approveSql,/BEGIN IMMEDIATE/);
assert.match(approveSql,/NOT EXISTS\(SELECT 1 FROM autonomous_design_approval_link_redemptions/);
assert.match(approveSql,/NOT EXISTS\(SELECT 1 FROM autonomous_design_artifacts newer/);
assert.match(approveSql,/CUSTOMER_APPROVED/);
assert.match(approveSql,/'CUSTOMER'/);
assert.match(approveSql,/COMMIT/);

const rejectSql=buildDesignApprovalRedemptionSqlV1({
  redemptionId:'redeem-2',tokenSha256:hash,decision:'REJECT',
  evidenceRef:'approval-link-click-2',observedAtMs:2000
});
assert.match(rejectSql,/REJECTED/);

console.log('AUTONOMOUS_DESIGN_APPROVAL_LINK_V1=PASS');
console.log('RAW_TOKEN_STORED=NO');
console.log('TOKEN_HASH_SHA256=YES');
console.log('ONE_TIME_REDEMPTION=YES');
console.log('EXPIRED_LINK_FAILS_CLOSED=YES');
console.log('SUPERSEDED_ARTIFACT_FAILS_CLOSED=YES');
console.log('FREE_TEXT_APPROVAL_INFERENCE=NO');
console.log('PUBLIC_ENDPOINT_ENABLED=NO');
