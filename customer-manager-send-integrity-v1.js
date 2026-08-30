(function(){
  'use strict';
  if(window.__TRENDOS_CM_SEND_INTEGRITY_V1__)return;
  window.__TRENDOS_CM_SEND_INTEGRITY_V1__=true;
  var STORAGE_KEY='trendosCmPendingSendV1';
  function txt(v){return String(v==null?'':v).trim();}
  function fingerprint(p){return txt(p&&p.phone)+'\n'+txt(p&&p.text);}
  function randomId(){try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return'cm_'+window.crypto.randomUUID();}catch(e){}return'cm_'+Date.now()+'_'+Math.random().toString(16).slice(2);}
  function load(){try{return JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null');}catch(e){return null;}}
  function save(v){try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(v));}catch(e){}}
  function clear(id){try{var x=load();if(!id||x&&x.requestId===id)sessionStorage.removeItem(STORAGE_KEY);}catch(e){}}
  function requestFor(p){var fp=fingerprint(p),old=load();if(old&&old.fingerprint===fp&&old.requestId)return old.requestId;var id=randomId();save({fingerprint:fp,requestId:id,createdAt:new Date().toISOString()});return id;}
  function patch(){
    var base=window.trendosSecureApiV1922;
    if(typeof base!=='function'||base.__trendosCmSendIntegrityV1)return false;
    async function wrapped(action,params){
      params=Object.assign({},params||{});
      if(action==='customerManagerV1'&&txt(params.op)==='send'){
        var id=txt(params.clientRequestId||params.requestId||params.idempotencyKey)||requestFor(params);
        params.clientRequestId=id;
        try{
          var out=await base.call(this,action,params);
          if(out&&out.success)clear(id);
          return out;
        }catch(err){
          // Keep the same request ID in sessionStorage. A retry must reuse it.
          throw err;
        }
      }
      return base.call(this,action,params);
    }
    wrapped.__trendosCmSendIntegrityV1=true;
    wrapped.__trendosCmSendIntegrityBase=base;
    window.trendosSecureApiV1922=wrapped;
    return true;
  }
  if(!patch()){
    var tries=0,t=setInterval(function(){tries++;if(patch()||tries>=60)clearInterval(t);},500);
  }
  window.TrendOSCustomerManagerSendIntegrityV1={requestFor:requestFor,clear:clear,patch:patch};
})();
