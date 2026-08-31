/** TrendOS Integrity V1 public runtime tools.
 * Public names intentionally do not end with `_` so Apps Script Editor can run them manually.
 * These wrappers do not enable any feature flag and do not deploy or mutate routing.
 */
function trendosIntegritySelfTestV1(){
  if(typeof trendosIntegritySelfTestV1_!=='function'){
    throw new Error('TrendOS Integrity foundation is not installed or not parsed.');
  }
  return trendosIntegritySelfTestV1_();
}

function trendosIntegrityDependencyHealthV1(){
  if(typeof trendosIntegrityDependencyHealthV1_!=='function'){
    return {
      success:false,
      codeReady:false,
      message:'TrendOS Integrity router/dependency health is not installed yet.',
      missing:['trendosIntegrityDependencyHealthV1_']
    };
  }
  return trendosIntegrityDependencyHealthV1_();
}
