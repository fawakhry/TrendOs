(function(){
'use strict';
if(window.__TRENDOS_WORK_QUEUE_V1__)return;
window.__TRENDOS_WORK_QUEUE_V1__=true;
if(window.MATBAGY_WORK_QUEUE_V1!==true)return;

const API=String(window.TREND_API_URL||window.API_URL||'').trim();
if(!API)return;
let root=null,last=null,pressListOpen=false,pressItems=[],busy=false,timer=null,bootTimer=null;

function txt(v){return String(v==null?'':v).trim();}
function norm(v){return txt(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
function state(){return window.trendosState||window.state||{};}
function user(){return state().user||null;}
function isWael(){const u=user()||{},n=norm((u.username||u.name||'')+' '+(u.role||''));return n.indexOf('وائل')!==-1||n.indexOf('wael')!==-1;}
function isGaber(){const u=user()||{},n=norm((u.username||u.name||'')+' '+(u.role||''));return n.indexOf('جابر')!==-1||n.indexOf('gaber')!==-1||n.indexOf('jaber')!==-1;}
function isManager(){const u=user()||{},n=norm((u.username||u.name||'')+' '+(u.role||''));return norm(u.role)==='admin'||n.indexOf('ضياء')!==-1||n.indexOf('diaa')!==-1;}
function auth(extra){const u=user()||{};return Object.assign({username:u.username||u.name||'',token:u.token||''},extra||{});}
function esc(v){return txt(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function fmtSec(sec){sec=Math.max(0,Math.floor(Number(sec)||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function timeSec(task){
  if(!task)return 0;
  if(task.state==='COMPLETED'||task.state==='RELEASED')return Number(task.workSec||0);
  if(!task.startedAt)return 0;
  const start=new Date(task.startedAt).getTime();if(!isFinite(start))return 0;
  const end=task.state==='PAUSED'&&task.pausedAt?new Date(task.pausedAt).getTime():Date.now();
  return Math.max(0,Math.floor((end-start)/1000)-Number(task.pausedTotalSec||0));
}
function batchSec(batch){if(!batch)return 0;if(batch.state==='COMPLETED')return Number(batch.durationSec||0);const t=new Date(batch.startedAt).getTime();return isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/1000)):0;}
async function directApi(p){
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action:'workQueueV1'},p)),cache:'no-store',credentials:'omit'});
  const raw=await r.text();let d=null;try{d=JSON.parse(raw);}catch(e){throw new Error('Work Queue backend لا يرجع JSON.');}return d;
}
async function api(op,extra){
  const p=auth(Object.assign({op:op},extra||{}));
  if(typeof window.trendosSecureApiV1922==='function'){
    try{const d=await window.trendosSecureApiV1922('workQueueV1',p);if(d&&!(norm(d.message).includes('غير معروف')||norm(d.message).includes('غير منشور')))return d;}catch(e){}
  }
  return directApi(p);
}
function hide(el){if(el)el.style.display='none';}
function applyPrivacyMask(role){
  if(role!=='GABER'&&role!=='WAEL')return;
  hide(document.getElementById('currentOrderBar'));
  hide(document.getElementById('statsBar'));
  const search=document.getElementById('tableSearch');if(search)hide(search.closest('.filters'));
  const table=document.getElementById('ordersTable');if(table)hide(table.closest('.table-wrap'));
  hide(document.getElementById('paginationBar'));
  const bulk=document.getElementById('bulkStatusMsg');if(bulk){const box=bulk.closest('.bulk-status-card,.bulk-status-box,.bulk-status');if(box)hide(box);}
  if(role==='WAEL')hide(document.getElementById('trendPressControlV1'));
}
function ensureRoot(){
  if(root)return root;
  const anchor=document.getElementById('currentOrderBar')||document.getElementById('ordersTable');
  if(!anchor)return null;
  root=document.createElement('section');root.id='trendWorkQueueV1';
  root.style.cssText='direction:rtl;margin:12px 0;padding:14px;border:1px solid #d8e2ec;border-radius:14px;background:#fff;box-shadow:0 8px 22px rgba(20,45,70,.08);font-family:Tahoma,Arial,sans-serif;color:#153047';
  const parent=anchor.parentNode;if(parent)parent.insertBefore(root,anchor);
  root.addEventListener('click',onClick);
  return root;
}
function taskHtml(task){
  if(!task)return '<div style="padding:14px;border:1px dashed #b8c5d1;border-radius:12px;text-align:center"><b>الدور مخفي</b><div style="font-size:12px;color:#66788a;margin:6px 0 12px">اضغط هات تاسك جديد، والنظام هيحجز لك الأوردر المستحق فقط.</div><button data-wq="claim" style="border:0;border-radius:10px;padding:11px 18px;background:#0f766e;color:#fff;font-weight:700;cursor:pointer">هات تاسك جديد</button></div>';
  let controls='';
  if(task.state==='CLAIMED')controls='<button data-wq="start">فتح الأوردر وبدء التنفيذ</button>';
  if(task.state==='RUNNING')controls='<button data-wq="pause" class="warn">إيقاف مؤقت</button><button data-wq="ready">جاهز للاستلام</button><button data-wq="delivered">تم التسليم</button>';
  if(task.state==='PAUSED')controls='<button data-wq="resume">استكمال التنفيذ</button><button data-wq="ready">جاهز للاستلام</button><button data-wq="delivered">تم التسليم</button>';
  return '<div class="wq-task" style="border:1px solid #d8e2ec;border-radius:12px;padding:12px">'+
    '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><b style="font-size:18px">أوردر '+esc(task.orderId)+'</b><div style="color:#66788a">بند '+esc(task.lineId)+' • '+esc(task.department||'-')+'</div></div><b data-wq-timer style="font-size:20px;direction:ltr">'+fmtSec(timeSec(task))+'</b></div>'+
    '<div style="margin-top:8px"><b>'+esc(task.itemName||'-')+'</b> • الكمية: '+esc(task.qty||'-')+'</div>'+
    '<div style="font-size:12px;color:#66788a;margin-top:4px">'+esc(task.customer||'-')+' • '+esc(task.priority||'عادي')+(task.expectedDelivery?' • تسليم: '+esc(task.expectedDelivery):'')+'</div>'+
    '<div style="margin-top:9px"><span style="padding:4px 8px;border-radius:8px;background:#eef5f7">'+esc(task.state)+'</span></div>'+
    '<div class="wq-actions" style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px">'+controls+'</div></div>';
}
function flyHtml(items,task){
  items=Array.isArray(items)?items:[];
  if(!items.length)return '<div style="font-size:12px;color:#66788a;padding:8px">لا توجد طباعة ع الطاير حاليًا.</div>';
  return items.map(function(x){
    const disabled=!!task;
    return '<div style="display:flex;gap:8px;justify-content:space-between;align-items:center;border-top:1px solid #edf1f4;padding:8px 0"><div><b>⚡ '+esc(x.orderId)+'</b> — '+esc(x.itemName||'-')+'<div style="font-size:11px;color:#66788a">'+esc(x.customer||'-')+' • '+esc(x.priority||'عاجل')+'</div></div><button data-wq="fly" data-line="'+esc(x.lineId)+'" '+(disabled?'disabled':'')+'>فتح وبدء</button></div>';
  }).join('');
}
function pressHtml(d){
  const batch=d.pressBatch;
  if(batch){
    return '<div style="border:1px solid #e8c976;border-radius:12px;padding:10px;background:#fffaf0"><div style="display:flex;justify-content:space-between"><b>🔥 دفعة المكبس شغالة</b><b data-wq-batch-timer style="direction:ltr">'+fmtSec(batchSec(batch))+'</b></div><div style="font-size:12px;margin-top:5px">'+Number(batch.orderCount||0)+' أوردر • '+Number(batch.lineCount||0)+' بند</div><button data-wq="pressStop" class="danger" style="margin-top:9px">إنهاء دفعة المكبس</button></div>';
  }
  let body='<button data-wq="pressOpen">تشغيل دفعة مكبس</button>';
  if(pressListOpen){
    if(!pressItems.length)body+='<div style="font-size:12px;color:#66788a;margin-top:8px">لا توجد أوردرات جاهزة للمكبس الآن.</div>';
    else{
      body+='<div style="margin-top:8px;border:1px solid #edf1f4;border-radius:10px;padding:8px">';
      body+=pressItems.map(function(x){return '<label style="display:block;padding:6px;border-bottom:1px solid #f0f2f4"><input type="checkbox" data-wq-press-line value="'+esc(x.lineId)+'"> <b>'+esc(x.orderId)+'</b> — '+esc(x.itemName||'-')+' <small>('+esc(x.status||'-')+')</small></label>';}).join('');
      body+='<div style="display:flex;gap:7px;margin-top:8px"><button data-wq="pressStart">بدء الدفعة المختارة</button><button data-wq="pressClose" class="ghost">إغلاق القائمة</button></div></div>';
    }
  }
  return body;
}
function buttonCss(){
  return '<style>#trendWorkQueueV1 button{border:0;border-radius:9px;padding:9px 12px;background:#0f766e;color:#fff;font-weight:700;cursor:pointer}#trendWorkQueueV1 button.warn{background:#b7791f}#trendWorkQueueV1 button.danger{background:#b42318}#trendWorkQueueV1 button.ghost{background:#e9eef2;color:#153047}#trendWorkQueueV1 button:disabled{opacity:.45;cursor:not-allowed}</style>';
}
function renderEmployee(d){
  const r=ensureRoot();if(!r)return;applyPrivacyMask(d.role);last=d;
  const title=d.role==='WAEL'?'نظام شغل وائل':'نظام شغل جابر';
  let html=buttonCss()+'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px"><div><b style="font-size:18px">'+title+'</b><div style="font-size:12px;color:#66788a">الأوردر التالي لا يظهر إلا بعد حجزه لك.</div></div><button data-wq="refresh" class="ghost">تحديث</button></div>';
  html+=taskHtml(d.task||null);
  if(d.role==='WAEL'){
    html+='<div style="margin-top:12px;border:1px solid #f1d18a;border-radius:12px;padding:10px"><b>⚡ طباعة ع الطاير</b>'+flyHtml(d.flyPrint,d.task)+'</div>';
    html+='<div style="margin-top:12px;border:1px solid #f1d18a;border-radius:12px;padding:10px"><b>🔥 المكبس</b><div style="margin-top:8px">'+pressHtml(d)+'</div></div>';
  }
  r.innerHTML=html;
}
function renderManager(metrics){
  if(!root){
    root=document.createElement('section');root.id='trendWorkQueueV1';root.style.cssText='direction:rtl;margin:12px 0;padding:12px;border:1px solid #d8e2ec;border-radius:14px;background:#fff';
    const target=document.getElementById('managementDashboard')||document.getElementById('mainView');if(target)target.parentNode.insertBefore(root,target.nextSibling);
    root.addEventListener('click',onClick);
  }
  const em=(metrics&&metrics.employees)||[],press=(metrics&&metrics.press)||{};
  root.innerHTML=buttonCss()+'<div style="display:flex;justify-content:space-between"><b>📊 إنتاج Work Queue</b><button data-wq="metrics" class="ghost">تحديث</button></div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-top:9px">'+em.map(function(x){return '<div style="border:1px solid #edf1f4;border-radius:10px;padding:9px"><b>'+esc(x.employee)+'</b><div>'+Number(x.completedOrders||0)+' أوردر</div><small>متوسط '+fmtSec(x.averageWorkSec)+' • إجمالي '+fmtSec(x.totalWorkSec)+'</small></div>';}).join('')+
    '<div style="border:1px solid #edf1f4;border-radius:10px;padding:9px"><b>🔥 المكبس</b><div>'+Number(press.batches||0)+' دفعة • '+Number(press.orders||0)+' أوردر</div><small>متوسط الدفعة '+fmtSec(press.averageBatchSec||0)+'</small></div></div>';
}
async function refresh(){
  if(busy||!user())return;busy=true;
  try{
    const d=await api('status');
    if(!d||!d.success||d.enabled!==true){last=d;return;}
    if(d.role==='MANAGER'){const m=await api('metrics');if(m&&m.success)renderManager(m);return;}
    renderEmployee(d);
  }catch(e){console.warn('TrendOS Work Queue V1:',e);}finally{busy=false;}
}
async function act(op,extra){
  if(busy)return null;busy=true;
  try{const d=await api(op,extra);if(!d||!d.success)throw new Error((d&&d.message)||'تعذر تنفيذ العملية.');return d;}
  catch(e){alert(txt(e&&e.message||e));return null;}finally{busy=false;}
}
async function onClick(e){
  const b=e.target&&e.target.closest?e.target.closest('[data-wq]'):null;if(!b)return;
  const a=b.getAttribute('data-wq');
  if(a==='refresh'){await refresh();return;}
  if(a==='claim'){const d=await act('claimNext');if(d)await refresh();return;}
  if(a==='start'){const d=await act('startTask',{taskId:last&&last.task&&last.task.taskId});if(d)await refresh();return;}
  if(a==='pause'){const reason=prompt('سبب التوقف؟','انتظار خامة / عميل / ماكينة');if(reason===null)return;const d=await act('pauseTask',{taskId:last.task.taskId,reason:reason});if(d)await refresh();return;}
  if(a==='resume'){const d=await act('resumeTask',{taskId:last.task.taskId});if(d)await refresh();return;}
  if(a==='ready'||a==='delivered'){
    const finalStatus=a==='ready'?'جاهز للاستلام':'تم التسليم';
    if(!confirm('تحويل الأوردر إلى "'+finalStatus+'" وإنهاء العداد؟'))return;
    const d=await act('completeTask',{taskId:last.task.taskId,finalStatus:finalStatus});if(d)await refresh();return;
  }
  if(a==='fly'){
    const line=b.getAttribute('data-line');const d=await act('claimFly',{lineId:line});
    if(d&&d.task){const s=await act('startTask',{taskId:d.task.taskId});if(s)await refresh();}return;
  }
  if(a==='pressOpen'){
    const d=await act('pressCandidates');if(d){pressItems=d.items||[];pressListOpen=true;await refresh();}return;
  }
  if(a==='pressClose'){pressListOpen=false;pressItems=[];renderEmployee(last);return;}
  if(a==='pressStart'){
    const ids=Array.prototype.slice.call(root.querySelectorAll('[data-wq-press-line]:checked')).map(function(x){return x.value;});
    if(!ids.length){alert('اختار أوردر واحد على الأقل.');return;}
    if(!confirm('بدء دفعة المكبس لـ '+ids.length+' بند؟'))return;
    const d=await act('pressStart',{selectedLineIds:JSON.stringify(ids)});if(d){pressListOpen=false;pressItems=[];await refresh();}return;
  }
  if(a==='pressStop'){
    if(!confirm('إنهاء دفعة المكبس الآن؟ الوقت سيتحسب مرة واحدة للدفعة كلها.'))return;
    const d=await act('pressStop');if(d){pressListOpen=false;pressItems=[];await refresh();}return;
  }
  if(a==='metrics'){const d=await act('metrics');if(d)renderManager(d);return;}
}
function tick(){
  if(!root||!last)return;
  const t=root.querySelector('[data-wq-timer]');if(t&&last.task)t.textContent=fmtSec(timeSec(last.task));
  const b=root.querySelector('[data-wq-batch-timer]');if(b&&last.pressBatch)b.textContent=fmtSec(batchSec(last.pressBatch));
  if(isWael())hide(document.getElementById('trendPressControlV1'));
}
function boot(){
  if(bootTimer)return;
  bootTimer=setInterval(function(){
    if(!user())return;
    if(!(isWael()||isGaber()||isManager()))return;
    clearInterval(bootTimer);bootTimer=null;refresh();timer=setInterval(tick,1000);
  },500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.TrendWorkQueueV1={refresh:refresh,last:function(){return last;},version:'TRENDOS_WORK_QUEUE_V1_20260909'};
})();
