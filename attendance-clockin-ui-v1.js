(function(){
  'use strict';
  if(window.__TRENDOS_ATT_CLOCKIN_UI_V1__)return;window.__TRENDOS_ATT_CLOCKIN_UI_V1__=true;
  const API=String(window.TREND_API_URL||window.API_URL||'').trim();
  function txt(v){return String(v==null?'':v).trim();}
  function user(){const s=window.trendosState||window.state||{};return s.user||null;}
  function uname(){const u=user()||{};return txt(u.username||u.name);}
  function auth(extra){const u=user()||{};return Object.assign({username:u.username||u.name||'',token:u.token||''},extra||{});}
  function cairoParts(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const m={};p.forEach(x=>m[x.type]=x.value);return {date:m.year+'-'+m.month+'-'+m.day,time:m.hour+':'+m.minute};}
  function mins(hm){const m=String(hm||'').match(/^(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):0;}
  function schedule(date){return (window.TRENDOS_WORKDAY_OVERRIDES&&window.TRENDOS_WORKDAY_OVERRIDES[date])||window.TRENDOS_ATTENDANCE_START||window.TRENDOS_DEFAULT_WORKDAY_START||'12:00';}
  async function get(action,extra){if(!API)throw new Error('API غير مضبوط');const p=auth(Object.assign({action:action},extra||{})),q=new URLSearchParams();Object.keys(p).forEach(k=>q.set(k,String(p[k]==null?'':p[k])));const r=await fetch(API+(API.indexOf('?')<0?'?':'&')+q.toString(),{cache:'no-store',credentials:'omit'});return await r.json();}
  function statusLocal(){const c=cairoParts(),sc=schedule(c.date),d=mins(c.time)-mins(sc);return {date:c.date,scheduledStart:sc,clockInTime:c.time,differenceMinutes:d,attendanceStatus:d>0?'متأخر '+d+' دقيقة':d<0?'مبكر '+Math.abs(d)+' دقيقة':'في الموعد'};}
  function show(info){const root=document.getElementById('trendAttendanceV1');if(!root)return;let box=root.querySelector('[data-ta="clockin"]');if(!box){box=document.createElement('div');box.dataset.ta='clockin';box.style.cssText='margin-top:8px;padding:8px 10px;border-radius:10px;background:#f5f8fb;border:1px solid #e6edf4;font-size:12px;font-weight:700;';const body=root.querySelector('.ta-body');if(body)body.appendChild(box);}const late=Number(info.differenceMinutes||0)>0;box.textContent='الحضور: '+txt(info.clockInTime||'')+' — '+txt(info.attendanceStatus||'');box.style.color=late?'#b42318':'#0f766e';}
  async function fallbackRecord(){const u=uname(),c=statusLocal(),key='trendClockinV1|'+u+'|'+c.date;if(!u||localStorage.getItem(key))return c;try{const existing=await get('getMatbagyNotes',{});if(existing&&Array.isArray(existing.notes)){const title='CLOCKIN|'+u+'|'+c.date;if(existing.notes.some(n=>txt(n.title)===title)){localStorage.setItem(key,'1');return c;}}}catch(e){}
    try{await get('saveMatbagyNote',{category:'ATTENDANCE_CLOCKIN_V1',title:'CLOCKIN|'+u+'|'+c.date,content:JSON.stringify(Object.assign({username:u,at:new Date().toISOString(),source:'TrendOS fallback'},c))});localStorage.setItem(key,'1');}catch(e){}return c;}
  async function recordClockin(){const u=user();if(!u||!u.token)return;const c=cairoParts(),key='trendClockinV1|'+uname()+'|'+c.date;if(localStorage.getItem(key)){show(statusLocal());return;}try{const out=await get('attendanceClockinV1',{op:'clockin'});if(out&&out.success){localStorage.setItem(key,'1');show(out);try{if('Notification'in window&&Notification.permission==='granted')new Notification('TrendOS - تسجيل الحضور',{body:'تم تسجيل حضورك '+txt(out.clockInTime||'')+' — '+txt(out.attendanceStatus||'')});}catch(e){}return;}}catch(e){}
    const local=await fallbackRecord();show(local);
  }
  function relabel(){const root=document.getElementById('trendAttendanceV1');if(root){root.querySelectorAll('[data-action="start"]').forEach(b=>b.textContent='🕘 تسجيل حضور وبدء اليوم');const title=root.querySelector('[data-ta="title"]');if(title&&title.textContent.indexOf('مدير')<0)title.textContent='🕘 الحضور والتشغيل';}
    document.querySelectorAll('.ta-start-overlay').forEach(o=>{const h=o.querySelector('h2');if(h)h.textContent='تسجيل الحضور';const p=o.querySelector('p');if(p)p.textContent='سجّل حضورك أول ما توصل. موعد العمل الرسمي 12:00 ظهرًا، وبعد التسجيل يبدأ يوم التشغيل.';const b=o.querySelector('[data-action="overlayStart"]');if(b)b.textContent='🕘 تسجيل حضور وبدء اليوم';});}
  document.addEventListener('click',function(e){const a=e.target&&e.target.dataset&&e.target.dataset.action;if(a==='start'||a==='overlayStart')setTimeout(recordClockin,900);},true);
  function boot(){relabel();setTimeout(relabel,700);setTimeout(relabel,1800);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();setInterval(relabel,5000);
})();
