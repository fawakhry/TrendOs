import assert from 'node:assert/strict';
import fs from 'node:fs';

// Repository-only static coverage. The owner-provided full Apps Script export
// is not committed and cannot prove active feature flag values or live writes.
const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const core=read('Code.gs');
const integrity=read('trendos-order-line-integrity-v1.gs');
const router=read('trendos-integrity-router-v1.gs');
const frontend=read('app.js');
function body(source,name){
  const prefix='function '+name+'(';
  const n=source.split(prefix).length-1;
  assert.equal(n,1,'expected exactly one definition of '+name);
  const st=source.indexOf(prefix),end=source.indexOf('\nfunction ',st+prefix.length);
  return source.slice(st,end<0?undefined:end);
}
for(const name of ['mbCreateOrder_','createCustomerPortalOrder_',
  'submitCustomerDraft_','createManualOrder_']){
  assert.match(body(core,name),/\bmakeOrderId_\s*\(/,name);
}
assert.equal([...core.matchAll(/\bmakeOrderId_\s*\(/g)].length,5,
  'four core allocation calls and one function declaration expected');

// The fifth potential allocation site is in the supplemental ORDER_LINE route.
const helper=body(integrity,'trendosCustomerDraftResolveOrderIdV1_');
assert.match(helper,/\bmakeOrderId_\s*\(\s*lines\s*,\s*now\s*,\s*true\s*\)/);
assert.match(helper,/trendosCustomerDraftExistingOrderV1_\s*\(/);
assert.match(helper,/trendosCustomerDraftSetOrderCheckpointV1_\s*\(/);
assert.equal([...integrity.matchAll(/\bmakeOrderId_\s*\(/g)].length,1,
  'a changed supplemental allocation inventory requires review');
assert.match(body(integrity,'trendosCustomerDraftSubmitV1_'),
  /trendosCustomerDraftResolveOrderIdV1_\s*\(/);
assert.match(router,/trendosCustomerDraftSubmitV1\s*:\s*\{\s*family\s*:\s*['"]ORDER_LINE['"]\s*,\s*fn\s*:\s*function\s*\(\)\s*\{\s*return\s+trendosCustomerDraftSubmitV1_\s*\(\s*e\s*\)/);
assert.match(router,/if\s*\(\s*!trendosIntegrityEnabledV1_\s*\(\s*\)\s*\)\s*return null/);
assert.match(router,/!trendosIntegrityFamilyEnabledV1_\s*\(\s*route\.family\s*\)/);

// The deployed-facing baseline currently starts a fresh legacy key per
// manual submit; in-memory _busy is not sufficient across reload or timeout.
const manual=body(frontend,'createOrder');
assert.match(manual,/createOrderRequestId\s*=\s*['"]co_['"]\s*\+\s*Date\.now\(\)/);
assert.match(manual,/clientRequestId:\s*createOrderRequestId/);
assert.match(manual,/createOrder\._busy\s*=\s*true/);
assert.match(manual,/api\(\s*['"]createManualOrder['"]\s*,\s*sendParams\s*\)/);
console.log('T12 supplemental create-writer inventory PASS: four Code.gs sites + fifth guarded draft site; legacy manual key is not reload-stable.');
