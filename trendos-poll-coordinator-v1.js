(function(){
  'use strict';
  if(window.TrendPollCoordinatorV1) return;

  const entries = new Map();
  function now(){ return Date.now(); }
  function isHidden(){ return typeof document !== 'undefined' && !!document.hidden; }
  function entry(key){
    const k=String(key||'default');
    if(!entries.has(k)) entries.set(k,{inFlight:null,lastStartedAt:0,lastCompletedAt:0,lastError:null,skippedHidden:0,skippedFresh:0,coalesced:0});
    return entries.get(k);
  }
  function run(key, task, options){
    const opts=Object.assign({minIntervalMs:0,allowHidden:false,force:false},options||{});
    if(typeof task!=='function') return Promise.reject(new Error('poll task must be a function'));
    const e=entry(key);
    if(!opts.allowHidden && isHidden()){
      e.skippedHidden+=1;
      return Promise.resolve({skipped:true,reason:'hidden'});
    }
    if(e.inFlight){
      e.coalesced+=1;
      return e.inFlight;
    }
    const age=now()-e.lastStartedAt;
    if(!opts.force && e.lastStartedAt && age<Math.max(0,Number(opts.minIntervalMs)||0)){
      e.skippedFresh+=1;
      return Promise.resolve({skipped:true,reason:'min-interval',ageMs:age});
    }
    e.lastStartedAt=now();
    e.lastError=null;
    e.inFlight=Promise.resolve().then(task).then(function(result){
      e.lastCompletedAt=now();
      return result;
    }).catch(function(err){
      e.lastCompletedAt=now();
      e.lastError=err;
      throw err;
    }).finally(function(){ e.inFlight=null; });
    return e.inFlight;
  }
  function stats(key){
    if(key){
      const e=entry(key);
      return {key:String(key),inFlight:!!e.inFlight,lastStartedAt:e.lastStartedAt,lastCompletedAt:e.lastCompletedAt,skippedHidden:e.skippedHidden,skippedFresh:e.skippedFresh,coalesced:e.coalesced,lastError:e.lastError?String(e.lastError.message||e.lastError):''};
    }
    const out={};
    entries.forEach(function(e,k){out[k]={inFlight:!!e.inFlight,lastStartedAt:e.lastStartedAt,lastCompletedAt:e.lastCompletedAt,skippedHidden:e.skippedHidden,skippedFresh:e.skippedFresh,coalesced:e.coalesced,lastError:e.lastError?String(e.lastError.message||e.lastError):''};});
    return out;
  }
  window.TrendPollCoordinatorV1={version:'V1_20260904',run:run,stats:stats};
})();
