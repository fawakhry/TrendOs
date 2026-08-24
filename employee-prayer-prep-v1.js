(function(){
  'use strict';
  if(window.__TRENDOS_PRAYER_PREP_V1__) return;
  window.__TRENDOS_PRAYER_PREP_V1__=true;
  if(window.MATBAGY_PRAYER_PREP_V1===false) return;

  const LEAD_MINUTES=5;
  const TZ='Africa/Cairo';
  const CITY='Benha';
  const COUNTRY='Egypt';
  const METHOD=5; // Egyptian General Authority of Survey
  const PRAYERS=[['Fajr','الفجر'],['Dhuhr','الظهر'],['Asr','العصر'],['Maghrib','المغرب'],['Isha','العشاء']];
  const state={timings:null,dateKey:'',timer:null,banner:null};
  const txt=v=>String(v==null?'':v).trim();
  function appState(){return window.trendosState||window.state||{};}
  function user(){return appState().user||null;}
  function ready(){const u=user()||{};return !!(u.token&&(u.username||u.name));}
  function cairoParts(d){
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d||new Date());
    const o={};parts.forEach(p=>{if(p.type!=='literal')o[p.type]=p.value;});return o;
  }
  function dateKey(){const p=cairoParts(new Date());return p.year+'-'+p.month+'-'+p.day;}
  function apiDate(){const p=cairoParts(new Date());return p.day+'-'+p.month+'-'+p.year;}
  function nowMinutes(){const p=cairoParts(new Date());return Number(p.hour)*60+Number(p.minute);}
  function hmMinutes(v){const m=txt(v).match(/^(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null;}
  function storageKey(prayer){return 'trendPrayerPrep|'+dateKey()+'|'+prayer;}
  async function loadTimings(){
    const dk=dateKey(); if(state.timings&&state.dateKey===dk) return state.timings;
    const url='https://api.aladhan.com/v1/timingsByCity/'+encodeURIComponent(apiDate())+'?city='+encodeURIComponent(CITY)+'&country='+encodeURIComponent(COUNTRY)+'&method='+METHOD+'&timezonestring='+encodeURIComponent(TZ);
    const r=await fetch(url,{cache:'no-store'});const d=await r.json();
    if(!d||Number(d.code)!==200||!d.data||!d.data.timings) throw new Error('Prayer timings unavailable');
    state.timings=d.data.timings;state.dateKey=dk;return state.timings;
  }
  function ensureBanner(){
    if(state.banner) return state.banner;
    const style=document.createElement('style');style.textContent='#trendPrayerPrepV1{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483900;width:min(520px,calc(100vw - 28px));direction:rtl;background:#fff;border:1px solid #d7e3ea;border-radius:16px;box-shadow:0 14px 45px rgba(12,40,62,.24);padding:13px 15px;font-family:Tahoma,Arial,sans-serif;color:#153047;display:none}#trendPrayerPrepV1.show{display:block}#trendPrayerPrepV1 b{display:block;font-size:15px;margin-bottom:4px}#trendPrayerPrepV1 span{font-size:12px;color:#66788a;line-height:1.55}';document.head.appendChild(style);
    const el=document.createElement('aside');el.id='trendPrayerPrepV1';el.innerHTML='<b data-p-title>موعد الصلاة قريب</b><span data-p-msg></span>';document.body.appendChild(el);state.banner=el;return el;
  }
  function show(prayerAr,hm){
    const el=ensureBanner();el.querySelector('[data-p-title]').textContent='🕌 استعد لصلاة '+prayerAr;
    el.querySelector('[data-p-msg]').textContent='باقي '+LEAD_MINUTES+' دقائق على الموعد ('+hm+'). التنبيه للتذكير فقط ولا يسجل أو يقيّم ممارسة الصلاة.';
    el.classList.add('show');setTimeout(()=>el.classList.remove('show'),60000);
    try{if('Notification' in window&&Notification.permission==='granted')new Notification('استعد لصلاة '+prayerAr,{body:'باقي '+LEAD_MINUTES+' دقائق على الموعد ('+hm+').'});}catch(e){}
  }
  async function tick(){
    if(!ready())return;
    try{
      const timings=await loadTimings(),now=nowMinutes();
      PRAYERS.forEach(([key,ar])=>{const hm=txt(timings[key]),pm=hmMinutes(hm);if(pm===null)return;const diff=pm-now;if(diff===LEAD_MINUTES){const sk=storageKey(key);if(localStorage.getItem(sk))return;localStorage.setItem(sk,'1');show(ar,hm);}});
    }catch(e){}
  }
  function start(){if(state.timer)return;tick();state.timer=setInterval(tick,30000);}
  const w=setInterval(()=>{if(ready()){clearInterval(w);start();}},500);
})();
