(function(){
  'use strict';
  if(window.__TRENDOS_CUSTOMER_FEEDBACK_V1__) return;
  window.__TRENDOS_CUSTOMER_FEEDBACK_V1__=true;
  if(window.MATBAGY_CUSTOMER_FEEDBACK_V1===false) return;
  const API_URL=String(window.TREND_API_URL||window.API_URL||'').trim();
  if(!API_URL)return;
  const INTERVAL=10*60*1000;
  const MIN_SCAN_MS=8*60*1000;
  const AUTO_SCAN=window.MATBAGY_CUSTOMER_FEEDBACK_AUTO_SCAN_V1===true;
  let timer=null,busy=false,lastScanAt=0;
  function state(){return window.trendosState||window.state||{};}
  function user(){return state().user||null;}
  function ready(){const u=user()||{};return !!(u.token&&(u.username||u.name));}
  async function api(op,extra){const u=user()||{},p=Object.assign({action:'customerFeedbackV1',op:op,username:u.username||u.name||'',token:u.token||''},extra||{}),q=new URLSearchParams();Object.keys(p).forEach(k=>q.set(k,String(p[k]==null?'':p[k])));const r=await fetch(API_URL+(API_URL.includes('?')?'&':'?')+q.toString(),{cache:'no-store',credentials:'omit'});const d=await r.json();if(!d||d.success===false)throw new Error((d&&d.message)||'Customer Feedback unavailable');return d;}
  async function scan(options){const opts=options||{};if(busy||!ready())return {skipped:true,reason:busy?'in-flight':'not-ready'};if(document.hidden&&!opts.force)return {skipped:true,reason:'hidden'};if(!opts.force&&lastScanAt&&Date.now()-lastScanAt<MIN_SCAN_MS)return {skipped:true,reason:'min-interval'};busy=true;lastScanAt=Date.now();try{return await api('scan');}catch(e){return {success:false,message:String(e&&e.message||e)};}finally{busy=false;}}
  function start(){if(timer||!AUTO_SCAN)return;setTimeout(function(){scan({source:'boot-delayed'});},15000);timer=setInterval(function(){scan({source:'interval'});},INTERVAL);window.addEventListener('focus',function(){scan({source:'focus'});});}
  const w=setInterval(()=>{if(ready()){clearInterval(w);start();}},500);
  window.TrendCustomerFeedbackV1={scan:function(){return scan({force:true,source:'manual'});}};
})();
