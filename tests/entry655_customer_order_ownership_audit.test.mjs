import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inspectCustomerOrderOwnershipV0} from '../cloudflare-d1/src/customer-portal-order-ownership-audit-v0.mjs';

const source = fs.readFileSync('cloudflare-d1/src/customer-portal-order-ownership-audit-v0.mjs','utf8');
assert.doesNotMatch(source,/\bfetch\s*\(|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\b|\bDELETE\s+FROM\b/i);
assert.doesNotMatch(source,/customer_name\s*=|customer_phone\s*=|LIKE\s+/i,
  'customer-order ownership must not be granted from a name/phone fallback');
const legacyCode = fs.readFileSync('Code.gs','utf8');
assert.match(legacyCode,/function getCustomerOrders_\(e\)/);
assert.match(legacyCode,/rowCode !== customer.customerCode && \(!nameKey \|\| rowNameKey !== nameKey\)/);
console.log('ENTRY655_UNSAFE_LEGACY_NAME_FALLBACK_INVENTORIED_NOT_REUSED=PASS');

const queries=[];
function mocked(rows,throwOn=''){
  return {prepare(sql){
    const q=String(sql).trim();
    assert.match(q,/^SELECT\s+/i);
    queries.push(q);
    if(throwOn && q.includes(throwOn)) throw new Error('customer PII should NEVER leak');
    const key=q.includes('AS nativeOrderCount')?'orders':
      q.includes('AS verifiedOwnershipCandidates')?'candidate':
      q.includes('AS nativeOrdersWithoutVerifiedLink')?'unlinked':
      q.includes('AS ownerLinkConflicts')?'conflicts':null;
    assert.ok(key,'unexpected SQL');
    return {first:async()=>rows[key]};
  }};
}
const rows={
  orders:{nativeOrderCount:7},
  candidate:{verifiedOwnershipCandidates:2},
  unlinked:{nativeOrdersWithoutVerifiedLink:5},
  conflicts:{ownerLinkConflicts:1}
};
const report=await inspectCustomerOrderOwnershipV0(mocked(rows));
assert.equal(report.success,true);
assert.equal(report.nativeOrderCount,7);
assert.equal(report.verifiedOwnershipCandidates,2);
assert.equal(report.nativeOrdersWithoutVerifiedLink,5);
assert.equal(report.ownerLinkConflicts,1);
assert.equal(report.customerOrderReadAuthority,false);
assert.equal(report.historicalOrderOwnershipProved,false);
assert.equal(report.productionRelease,'NO_GO');
assert.equal(report.zeroGoogleComplete,false);
assert.equal(queries.length,4);
assert.doesNotMatch(JSON.stringify(report),/FAKE-ORDER|FAKE-CUSTOMER|name|phone|PII/i);
console.log('ENTRY655_ONLY_ANONYMOUS_AGGREGATE_SELECT=PASS');

const absent=await inspectCustomerOrderOwnershipV0(null);
assert.equal(absent.success,false);
assert.equal(absent.reason,'DB_UNAVAILABLE');
assert.equal(absent.nativeOrderCount,null);

const bad=await inspectCustomerOrderOwnershipV0(mocked({...rows,candidate:{}}));
assert.equal(bad.reason,'SOURCE_INCOMPLETE');
assert.equal(bad.productionRelease,'NO_GO');

const fail=await inspectCustomerOrderOwnershipV0(mocked(rows,'AS ownerLinkConflicts'));
assert.equal(fail.reason,'SCHEMA_OR_READ_UNAVAILABLE');
assert.doesNotMatch(JSON.stringify(fail),/PII should NEVER leak/);

const all=await inspectCustomerOrderOwnershipV0(mocked({
  orders:{nativeOrderCount:7},candidate:{verifiedOwnershipCandidates:7},
  unlinked:{nativeOrdersWithoutVerifiedLink:0},conflicts:{ownerLinkConflicts:0}
}));
assert.equal(all.success,true);
assert.equal(all.customerOrderReadAuthority,false);
assert.equal(all.productionRelease,'NO_GO');
console.log('ENTRY655_NO_GO_EVEN_WITH_PERFECT_FAKE_LINKS=PASS');
console.log('ENTRY655_LIVE_QUERY_OR_CUSTOMER_ORDER_READ=NO');
