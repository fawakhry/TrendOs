/** TrendOS Integrity V1 public runtime tools.
 * Public names intentionally do not end with `_` so Apps Script Editor can run them manually.
 * These wrappers do not enable any feature flag and do not deploy or mutate routing.
 */
function trendosIntegritySelfTestV1(){
  if(typeof trendosIntegritySelfTestV1_!=='function'){
    throw new Error('TrendOS Integrity foundation is not installed or not parsed.');
  }
  const result=trendosIntegritySelfTestV1_();
  try{Logger.log(JSON.stringify(result));}catch(e){}
  if(!result||result.success!==true){
    const failed=result&&Array.isArray(result.checks)?result.checks.filter(function(x){return !x.pass;}).map(function(x){return x.name;}).join(', '):'unknown';
    throw new Error('TrendOS Integrity self-test failed: '+failed);
  }
  return result;
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
  const result=trendosIntegrityDependencyHealthV1_();
  try{Logger.log(JSON.stringify(result));}catch(e){}
  return result;
}
