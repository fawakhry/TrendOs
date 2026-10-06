import assert from 'node:assert/strict';
import {
  classifyCloudOrderFileDesignSourceV1,
  summarizeCloudOrderFileDesignDiscoveryV1
} from '../core/cloud-order-file-design-discovery-v1.mjs';

let q=classifyCloudOrderFileDesignSourceV1({
  orderId:'TM1',lineId:'TM1-01',fileId:'f1',r2Key:'orders/TM1/f1.png',
  mimeType:'image/png',activeLineMatch:true,archived:false
});
assert.equal(q.provenanceQualified,true);
assert.equal(q.artifactCandidate,false);
assert.equal(q.reason,'CLOUD_LINE_FILE_PROVENANCE_HASH_REQUIRED');
assert.equal(q.readyAllowed,false);
assert.equal(q.approvalState,'NOT_CONFIRMED');
assert.equal(q.preflightState,'UNKNOWN');
assert.equal(q.piiExposed,false);

q=classifyCloudOrderFileDesignSourceV1({
  orderId:'TM1',lineId:'',fileId:'f1',r2Key:'orders/TM1/f1.png',
  mimeType:'image/png',activeLineMatch:false
});
assert.equal(q.provenanceQualified,false);
assert.ok(q.reasons.includes('LINE_ID_REQUIRED'));
assert.ok(q.reasons.includes('ACTIVE_ORDER_LINE_MATCH_REQUIRED'));

q=classifyCloudOrderFileDesignSourceV1({
  orderId:'TM1',lineId:'TM1-01',fileId:'f1',r2Key:'orders/TM1/f1.txt',
  mimeType:'text/plain',activeLineMatch:true
});
assert.equal(q.provenanceQualified,false);
assert.ok(q.reasons.includes('DESIGN_MIME_NOT_QUALIFIED'));

q=classifyCloudOrderFileDesignSourceV1({
  orderId:'TM1',lineId:'TM1-01',fileId:'f1',r2Key:'orders/TM1/f1.pdf',
  mimeType:'application/pdf',activeLineMatch:true,contentSha256:'b'.repeat(64)
});
assert.equal(q.provenanceQualified,true);
assert.equal(q.artifactCandidate,true);
assert.equal(q.readyAllowed,false);

const s=summarizeCloudOrderFileDesignDiscoveryV1([
  {order_id:'TM1',line_id:'TM1-01',file_id:'f1',r2_key:'x',mime_type:'image/png',active_line_match:1},
  {order_id:'TM2',line_id:'',file_id:'f2',r2_key:'y',mime_type:'application/pdf',active_line_match:0},
  {order_id:'TM3',line_id:'TM3-01',file_id:'f3',r2_key:'z',mime_type:'text/plain',active_line_match:1}
]);
assert.equal(s.total,3);
assert.equal(s.designMime,2);
assert.equal(s.lineLinked,2);
assert.equal(s.activeLineMatched,2);
assert.equal(s.provenanceQualified,1);
assert.equal(s.artifactCandidates,0);
assert.equal(s.readyAllowed,0);

console.log('CLOUD_ORDER_FILE_DESIGN_DISCOVERY_V1=PASS');
console.log('R2_LINE_PROVENANCE_SUPPORTED=YES');
console.log('HASH_REQUIRED_FOR_ARTIFACT=YES');
console.log('FILE_EQUALS_APPROVAL=NO');
console.log('FILE_EQUALS_READY=NO');
