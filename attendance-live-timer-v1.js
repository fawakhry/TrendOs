(function(){
'use strict';
if(window.__TRENDOS_ATTENDANCE_LIVE_TIMER_V1__)return;
window.__TRENDOS_ATTENDANCE_LIVE_TIMER_V1__=true;

const API=String(window.TREND_API_URL||window.API_URL||'').trim();
const STORAGE_PREFIX='trendAttendanceLiveV1|';
let snap=null,timer=null,poll=null,busy=false;

function txt(v){return String(v==null?'':v).trim();}
function appState(){return window.trendosState||window.state||{};}
function user(){return appState().user||null;}
function uname(){const u=user()||{};return txt(u.username||u.name);}
function key(){return STORAGE_PREFIX+uname()+'|'+new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function num(v){const n=Number(v);return isFinite(n)?Math.max(0,n):0;}
function loadSaved(){try{return JSON.parse(localStorage.getItem(key())||'null');}catch(e){return null;}}
function save(){try{if(snap)localStorage.setItem(key(),JSON.stringify(snap));}catch(e){}}
function fmt(sec){sec=Math.max(0,Math.floor(num(sec)));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function active(s){return ['working','paused','rest','prayer','review'].includes(txt(s));}
function auth(extra){const u=user()||{};return Object.assign({username:u.username||u.name||'',token:u.token||''},extra||{});}
async function api(){if(!API||!user()||!user().token)return null;const p=auth({action:'attendanceV1',op:'state'}),q=new URLSearchParams();Object.keys(p).forEach(k=>q.set(k,txt(p[k])));const r=await fetch(API+(API.includes('?')?'&':'?')+q.toString(),{cache:'no-store',credentials:'omit'});const d=await r.json();return d&&d.success!==false?d:null;}
function toSnapshot(st){const now=Date.now(),server={sessionId:txt(st.sessionId),status:txt(st.status||'not_started'),fetchedAt:now,workSec:Math.round(num(st.workMinutes)*60),pauseSec:Math.round(num(st.pauseMinutes)*60),restSec:Math.round(num(st.restMinutes)*60),orders:num(st.ordersCompleted),startAt:txt(st.startAt),endAt:txt(st.endAt)};const old=loadSaved();if(old&&old.sessionId&&server.sessionId&&old.sessionId===server.sessionId&&active(server.status)&&active(old.status)){
  // The server currently returns whole minutes. Keep the locally accumulated seconds only
  // when they are within one minute of the authoritative server value, so refresh never jumps backwards.
  if(num(old.workSec)>=server.workSec&&num(old.workSec)-server.workSec<60)server.workSec=num(old.workSec);
  if(num(old.pauseSec)>=server.pauseSec&&num(old.pauseSec)-server.pauseSec<60)server.pauseSec=num(old.pauseSec);
  if(num(old.restSec)>=server.restSec&&num(old.restSec)-server.restSec<60)server.restSec=num(old.restSec);
 }
 return server;
}
async function refresh(){if(busy)return;busy=true;try{const d=await api();if(d&&d.state){snap=toSnapshot(d.state);save();render();}}catch(e){}finally{busy=false;}}
function current(){if(!snap)return null;const out=Object.assign({},snap),delta=active(out.status)?Math.max(0,Math.floor((Date.now()-num(out.fetchedAt))/1000)):0;if(out.status==='working')out.workSec+=delta;else if(['paused','rest','prayer','review'].includes(out.status))out.pauseSec+=delta;if(out.status==='rest')out.restSec+=delta;return out;}
function render(){const root=document.getElementById('trendAttendanceV1'),c=current();if(!root||!c)return;const w=root.querySelector('[data-ta="work"]'),p=root.querySelector('[data-ta="pause"]'),r=root.querySelector('[data-ta="rest"]'),o=root.querySelector('[data-ta="orders"]');if(w)w.textContent=fmt(c.workSec);if(p)p.textContent=fmt(c.pauseSec);if(r){const limit=Number((window.__TRENDOS_ATTENDANCE_REST_LIMIT__||30));r.textContent=Math.floor(c.restSec/60)+'/'+limit+' د';}if(o)o.textContent=Math.floor(c.orders||0)+' أوردر';}
function tick(){if(!snap){const saved=loadSaved();if(saved){snap=saved;snap.fetchedAt=Date.now();}}render();if(snap&&Date.now()%5000<1100){const c=current();if(c){snap.workSec=c.workSec;snap.pauseSec=c.pauseSec;snap.restSec=c.restSec;snap.fetchedAt=Date.now();save();}}}
function bind(){document.addEventListener('click',function(e){const a=e.target&&e.target.dataset&&e.target.dataset.action;if(['start','overlayStart','pause','resume','rest','end','confirmPresence','presencePause','prayerStart'].includes(a))setTimeout(refresh,1200);},true);document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(refresh,200);});window.addEventListener('focus',function(){setTimeout(refresh,200);});}
function boot(){const wait=setInterval(function(){if(user()&&user().token&&document.getElementById('trendAttendanceV1')){clearInterval(wait);const saved=loadSaved();if(saved){snap=saved;snap.fetchedAt=Date.now();render();}refresh();timer=setInterval(tick,1000);poll=setInterval(refresh,30000);bind();}},500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
