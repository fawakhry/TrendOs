(function(){
  'use strict';
  if(window.__TRENDOS_CUSTOMER_FEEDBACK_V1__) return;
  window.__TRENDOS_CUSTOMER_FEEDBACK_V1__=true;
  if(window.MATBAGY_CUSTOMER_FEEDBACK_V1===false) return;


  const INTERVAL=10*60*1000;
  const MIN_SCAN_MS=8*60*1000;
  const AUTO_SCAN=window.MATBAGY_CUSTOMER_FEEDBACK_AUTO_SCAN_V1===true;
  let timer=null,busy=false,lastScanAt=0;
  function state(){return window.trendosState||window.state||{};}
  function user(){return state().user||null;}
  function ready(){const u=user()||{};return !!(u.token&&(u.username||u.name));}
  async function api(op,extra){if(typeof window.trendosEmployeeApiV1!=='function')throw new Error('Cloud dispatcher غير جاهز.');const d=await window.trendosEmployeeApiV1('customerFeedbackV1',Object.assign({op:op,username:(user()||{}).username||(user()||{}).name||'',token:(user()||{}).token||''},extra||{}));if(!d||d.success===false)throw Object.assign(new Error((d&&d.message)||'Cloud API unavailable'),{code:d&&d.code});return d;}
  async function scan(options){
    const opts=options||{};
    if(busy||!ready())return {skipped:true,reason:busy?'in-flight':'not-ready'};
    if(document.hidden&&!opts.force)return {skipped:true,reason:'hidden'};
    if(!opts.force&&lastScanAt&&Date.now()-lastScanAt<MIN_SCAN_MS)return {skipped:true,reason:'min-interval'};
    busy=true;lastScanAt=Date.now();
    try{return await api('scan');}catch(e){return {success:false,message:String(e&&e.message||e)};}finally{busy=false;}
  }
  function start(){if(timer||!AUTO_SCAN)return;setTimeout(function(){scan({source:'boot-delayed'});},15000);timer=setInterval(function(){scan({source:'interval'});},INTERVAL);window.addEventListener('focus',function(){scan({source:'focus'});});}
  const w=setInterval(()=>{if(ready()){clearInterval(w);start();}},500);
  window.TrendCustomerFeedbackV1={scan:function(){return scan({force:true,source:'manual'});}};
})();
