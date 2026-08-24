(function(){
  'use strict';
  if(window.__TRENDOS_CUSTOMER_FEEDBACK_V1__) return;
  window.__TRENDOS_CUSTOMER_FEEDBACK_V1__=true;
  if(window.MATBAGY_CUSTOMER_FEEDBACK_V1===false) return;
  const API_URL=String(window.TREND_API_URL||window.API_URL||'').trim();
  if(!API_URL)return;
  const INTERVAL=2*60*1000;
  let timer=null,busy=false;
  function state(){return window.trendosState||window.state||{};}
  function user(){return state().user||null;}
  function ready(){const u=user()||{};return !!(u.token&&(u.username||u.name));}
  async function api(op,extra){const u=user()||{},p=Object.assign({action:'customerFeedbackV1',op:op,username:u.username||u.name||'',token:u.token||''},extra||{}),q=new URLSearchParams();Object.keys(p).forEach(k=>q.set(k,String(p[k]==null?'':p[k])));const r=await fetch(API_URL+(API_URL.includes('?')?'&':'?')+q.toString(),{cache:'no-store',credentials:'omit'});const d=await r.json();if(!d||d.success===false)throw new Error((d&&d.message)||'Customer Feedback unavailable');return d;}
  async function scan(){if(busy||!ready())return;busy=true;try{await api('scan');}catch(e){}finally{busy=false;}}
  function start(){if(timer)return;scan();timer=setInterval(scan,INTERVAL);window.addEventListener('focus',scan);}
  const w=setInterval(()=>{if(ready()){clearInterval(w);start();}},500);
  window.TrendCustomerFeedbackV1={scan:scan};
})();
