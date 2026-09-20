import assert from 'node:assert/strict';
import {
  evaluateT12CreateCutoverState,
  T12_CREATE_CUTOVER_REQUIRED_EVIDENCE,
  T12_CREATE_CUTOVER_STATE_VERSION
} from '../cloudflare-d1/src/t12-order-create-cutover-state.mjs';

assert.match(T12_CREATE_CUTOVER_STATE_VERSION,/T12_CREATE_CUTOVER_STATE/);

const all=Object.fromEntries(T12_CREATE_CUTOVER_REQUIRED_EVIDENCE.map(k=>[k,true]));

let x=evaluateT12CreateCutoverState({});
assert.equal(x.state,'github-shadow-engineering');
assert.equal(x.productionActivationAuthorized,false);
assert.equal(x.ownerDecisionRequired,false);

const authorityBlocked=['allocatorSeedPinned','googleCreateFreezeMechanismQualified',
  'allGoogleCreateEntrypointsFenceQualified',
  'allGoogleOrderLineMutationEntrypointsFenceQualified',
  'cloudNativeOrderLineLifecycleParityQualified','legacyReplayContinuityQualified',
  'stableClientRequestAcrossTimeoutQualified','r5MirrorWriterFenceQualified',
  'cloudReadAndFallbackParityQualified','rollbackMechanismQualified'];
const shadowQualified={...all,productionVersion155SourceExact:false,
  ...Object.fromEntries(authorityBlocked.map(key=>[key,false]))};
x=evaluateT12CreateCutoverState(shadowQualified);
assert.equal(x.state,'live-source-reconciliation-required');
assert.deepEqual(x.missing,['productionVersion155SourceExact']);

x=evaluateT12CreateCutoverState({...shadowQualified,productionVersion155SourceExact:true});
assert.equal(x.state,'exclusive-authority-design-required');
assert.deepEqual(new Set(x.missing),new Set(authorityBlocked));

x=evaluateT12CreateCutoverState(all);
assert.equal(x.state,'engineering-ready-for-owner-decision');
assert.equal(x.ownerDecisionRequired,true);
assert.equal(x.productionActivationAuthorized,false);
assert.equal(x.currentProductionAuthorityMustRemainGoogleUntilDecision,true);

for(const key of [
  'allGoogleCreateEntrypointsFenceQualified',
  'allGoogleOrderLineMutationEntrypointsFenceQualified',
  'cloudNativeOrderLineLifecycleParityQualified','legacyReplayContinuityQualified',
  'stableClientRequestAcrossTimeoutQualified','r5MirrorWriterFenceQualified',
  'cloudReadAndFallbackParityQualified'
]){
  const blocked=evaluateT12CreateCutoverState({...all,[key]:false});
  assert.equal(blocked.state,'exclusive-authority-design-required');
  assert.ok(blocked.missing.includes(key));
  assert.equal(blocked.productionActivationAuthorized,false);
}
for(const key of T12_CREATE_CUTOVER_REQUIRED_EVIDENCE){
  const ev={...all,[key]:false};
  const r=evaluateT12CreateCutoverState(ev);
  assert.notEqual(r.state,'engineering-ready-for-owner-decision','missing gate must block readiness: '+key);
  assert.equal(r.productionActivationAuthorized,false);
}

console.log('T12 cutover readiness state machine PASS; no evidence set can self-authorize Production activation.');
