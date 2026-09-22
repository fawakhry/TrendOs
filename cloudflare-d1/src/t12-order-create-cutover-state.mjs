/*
 * T12 Order-create cutover readiness state machine.
 * PURE / NO IO / NO ROUTING / NO PRODUCTION ACTIVATION.
 */
export const T12_CREATE_CUTOVER_STATE_VERSION='TRENDOS_T12_CREATE_CUTOVER_STATE_20260922_HISTORIC_LINE_IDENTITY_GATE';

const REQUIRED=Object.freeze([
  'productionVersion155SourceExact',
  'canonicalCreateParity',
  'authAndPermissionParity',
  'customerIdentityParity',
  'debtPolicyParity',
  'duplicateAndOpenOrderParity',
  'orderLineSummaryAtomicity',
  'activityAndQueueParity',
  'durableD1Idempotency',
  'timeoutRecoveryNoDuplicate',
  'readYourWriteQualified',
  'allocatorSeedPinned',
  'googleCreateFreezeMechanismQualified',
  'allGoogleCreateEntrypointsFenceQualified',
  'integrityDraftSubmitWriterFenceQualified',
  'historicGoogleReplayKeyRetentionQualified',
  'allGoogleOrderLineMutationEntrypointsFenceQualified',
  'cloudNativeOrderLineLifecycleParityQualified',
  'historicalLineIdentityMappingQualified',
  'legacyReplayContinuityQualified',
  'stableClientRequestAcrossTimeoutQualified',
  'r5MirrorWriterFenceQualified',
  'cloudReadAndFallbackParityQualified',
  'rollbackMechanismQualified'
]);

function result(state,missing=[],extra={}){
  return Object.freeze({
    success:true,
    version:T12_CREATE_CUTOVER_STATE_VERSION,
    state,
    missing:Object.freeze([...missing]),
    productionActivationAuthorized:false,
    ownerDecisionRequired:state==='engineering-ready-for-owner-decision',
    ...extra
  });
}

export function evaluateT12CreateCutoverState(evidence={}){
  const shadowKeys=[
    'canonicalCreateParity','authAndPermissionParity','customerIdentityParity',
    'debtPolicyParity','duplicateAndOpenOrderParity','orderLineSummaryAtomicity',
    'activityAndQueueParity','durableD1Idempotency','timeoutRecoveryNoDuplicate',
    'readYourWriteQualified'
  ];
  const shadowMissing=shadowKeys.filter(k=>evidence[k]!==true);
  if(shadowMissing.length) return result('github-shadow-engineering',shadowMissing);

  if(evidence.productionVersion155SourceExact!==true){
    return result('live-source-reconciliation-required',['productionVersion155SourceExact']);
  }

  const authorityKeys=['allocatorSeedPinned','googleCreateFreezeMechanismQualified',
    'allGoogleCreateEntrypointsFenceQualified',
    'integrityDraftSubmitWriterFenceQualified',
    'historicGoogleReplayKeyRetentionQualified',
    'allGoogleOrderLineMutationEntrypointsFenceQualified',
    'cloudNativeOrderLineLifecycleParityQualified','historicalLineIdentityMappingQualified',
    'legacyReplayContinuityQualified',
    'stableClientRequestAcrossTimeoutQualified','r5MirrorWriterFenceQualified',
    'cloudReadAndFallbackParityQualified','rollbackMechanismQualified'];
  const authorityMissing=authorityKeys.filter(k=>evidence[k]!==true);
  if(authorityMissing.length) return result('exclusive-authority-design-required',authorityMissing);

  const missing=REQUIRED.filter(k=>evidence[k]!==true);
  if(missing.length) return result('evidence-incomplete',missing);

  return result('engineering-ready-for-owner-decision',[],{
    createAuthorityTransferPlanned:true,
    currentProductionAuthorityMustRemainGoogleUntilDecision:true
  });
}

export const T12_CREATE_CUTOVER_REQUIRED_EVIDENCE=REQUIRED;
