import assert from 'node:assert/strict';
import fs from 'node:fs';

const core=fs.readFileSync(new URL('../Code.gs',import.meta.url),'utf8');
const integrity=fs.readFileSync(new URL('../trendos-order-line-integrity-v1.gs',import.meta.url),'utf8');

assert.ok(core.includes('const TRENDOS_LEGACY_ORDER_CREATE_DISABLED_V1 = true;'));
for (const action of ['createOrder','createMatbagyOrder','clientCreateOrder','createCustomerPortalOrder','submitCustomerDraft','createManualOrder','trendosCustomerDraftSubmitV1']) {
  assert.ok(core.includes(action+': true'), 'missing fenced action '+action);
}
const routePos=core.indexOf('const legacyCreateFence = trendosLegacyOrderCreateFenceV1_(action);');
const manualRoutePos=core.indexOf('action === "createManualOrder"');
const mbRoutePos=core.indexOf('action === "createOrder"');
assert.ok(routePos>0 && routePos<manualRoutePos && routePos<mbRoutePos, 'route fence must run before legacy create handlers');

const allocStart=core.indexOf('function makeOrderId_(');
const allocBody=core.slice(allocStart,allocStart+800);
assert.ok(allocBody.includes('TRENDOS_LEGACY_ORDER_CREATE_DISABLED_V1 === true'));
assert.ok(allocBody.includes('T12_CLOUD_ORDER_ID_AUTHORITY'));

const draftStart=integrity.indexOf('function trendosCustomerDraftSubmitV1_(');
const draftBody=integrity.slice(draftStart,draftStart+900);
assert.ok(draftBody.includes('trendosLegacyOrderCreateFenceV1_'));
assert.ok(draftBody.includes('trendosCustomerDraftSubmitV1'));

console.log('T12 legacy create fence PASS');
