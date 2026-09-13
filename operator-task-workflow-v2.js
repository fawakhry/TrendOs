(function(){
'use strict';
if(window.__TRENDOS_OPERATOR_TASK_V2__)return;
window.__TRENDOS_OPERATOR_TASK_V2__=true;
if(window.MATBAGY_OPERATOR_TASK_V2!==true)return;

const DEFAULT_EDGE_API='https://trendos-d1-api.trendmall-contact.workers.dev';
const APPS_SCRIPT_API=String(window.TREND_API_URL||window.API_URL||'').trim();
const SESSION_PATH='/v1/edge/session';
const ROUTES={
  status:{method:'GET',path:'/v1/operator/tasks/status'},
  claimNext:{method:'POST',path:'/v1/operator/tasks/claim-next',mutation:true},
  completeTask:{method:'POST',path:'/v1/operator/tasks/complete',mutation:true},
  flyPrint:{method:'GET',path:'/v1/operator/fly-print'},
  pressCandidates:{method:'GET',path:'/v1/operator/press-candidates'},
  metrics:{method:'GET',path:'/v1/operator/tasks/metrics'}
};
const SESSION_SKEW_MS=30000;
let edgeSession={token:'',expiresAt:0,inflight:null};
let root=null,last=null,busy=false,pressOpen=false,pressItems=[],timer=null,bootTimer=null;

function txt(v){return String(v==null?'':v).trim();}
function norm(v){return txt(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
function state(){return window.trendosState||window.state||{};}
function user(){return state().user||null;}
function employeeSession(){
  const u=user()||{};let saved={};
  try{saved=JSON.parse(sessionStorage.getItem('trendos_session')||'{}').user||{};}catch(e){}
  return {
    username:txt(u.username||u.name||saved.username||saved.name||sessionStorage.getItem('matbagy_username')||sessionStorage.getItem('matbagy_user_name')),
    token:txt(u.token||saved.token||window.sessionToken||sessionStorage.getItem('matbagy_session_token'))
  };
}
function edgeBase(){return txt(window.MATBAGY_OPERATOR_TASK_EDGE_API_URL||window.MATBAGY_EDGE_ORDERS_API_URL||window.MATBAGY_EDGE_API_URL||DEFAULT_EDGE_API).replace(/\/+$/,'');}
function clearEdgeSession(){edgeSession.token='';edgeSession.expiresAt=0;edgeSession.inflight=null;}
function esc(v){return txt(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function fmtSec(sec){sec=Math.max(0,Math.floor(Number(sec)||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function taskSec(task){if(!task)return 0;if(task.state==='COMPLETED')return Number(task.workSec||0);const start=new Date(task.startedAt).getTime();return isFinite(start)?Math.max(0,Math.floor((Date.now()-start)/1000)):0;}
function requestId(op,extra){
  const suffix=txt(extra&&extra.taskId)||Date.now().toString(36);
  if(window.crypto&&typeof window.crypto.randomUUID==='function')return 'ot2-'+op+'-'+suffix+'-'+window.crypto.randomUUID();
  return 'ot2-'+op+'-'+suffix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
}
async function parseJson(r){
  const raw=await r.text();let body;
  try{body=JSON.parse(raw||'{}');}catch(e){throw new Error('Operator Task Edge لا يرجع JSON.');}
  if(!r.ok&&body&&body.success!==false)body.success=false;
  if(!r.ok&&body&&!body.message)body.message='Operator Task Edge HTTP '+r.status;
  return body;
}
async function exchangeEdgeSession(){
  const current=employeeSession();
  if(!current.username||!current.token)throw new Error('جلسة الموظف غير متاحة لإنشاء Edge session.');
  const r=await fetch(edgeBase()+SESSION_PATH,{method:'POST',cache:'no-store',credentials:'omit',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify({username:current.username,token:current.token})});
  const body=await parseJson(r);
  if(!r.ok||!body||body.success!==true)throw new Error(body&&body.message||'تعذر إنشاء Edge session.');
  edgeSession.token=txt(body.edgeToken);
  edgeSession.expiresAt=Date.parse(body.expiresAt||'')||(Date.now()+Math.max(60000,Number(body.expiresIn||600)*1000));
  if(!edgeSession.token)throw new Error('Edge session token غير موجود.');
  return edgeSession.token;
}
async function ensureEdgeSession(){
  if(edgeSession.token&&edgeSession.expiresAt-SESSION_SKEW_MS>Date.now())return edgeSession.token;
  if(edgeSession.inflight)return edgeSession.inflight;
  edgeSession.inflight=exchangeEdgeSession().finally(function(){edgeSession.inflight=null;});
  return edgeSession.inflight;
}
function safeMutationBody(op,extra){
  extra=extra||{};
  if(op==='claimNext')return {};
  if(op==='completeTask')return {taskId:txt(extra.taskId),finalStatus:txt(extra.finalStatus),notes:txt(extra.notes),materialClosePayload:txt(extra.materialClosePayload)};
  return {};
}
async function edgeApiOnce(op,extra,idempotencyKey,retry){
  const route=ROUTES[op];if(!route)throw new Error('عملية Operator Task غير مدعومة عبر Edge: '+op);
  const token=await ensureEdgeSession();
  const headers={accept:'application/json',authorization:'Bearer '+token};
  const opts={method:route.method,cache:'no-store',credentials:'omit',headers:headers};
  if(route.method==='POST'){
    headers['content-type']='application/json';
    if(route.mutation)headers['idempotency-key']=idempotencyKey;
    opts.body=JSON.stringify(safeMutationBody(op,extra));
  }
  const r=await fetch(edgeBase()+route.path,opts);
  if(r.status===401&&retry!==false){clearEdgeSession();return edgeApiOnce(op,extra,idempotencyKey,false);}
  return parseJson(r);
}
async function api(op,extra){
  const route=ROUTES[op];if(!route)throw new Error('عملية Operator Task غير مدعومة عبر Edge: '+op);
  const key=route.mutation?requestId(op,extra):'';
  return edgeApiOnce(op,extra,key,true);
}
function legacyMaterialAuth(extra){const u=employeeSession();return Object.assign({username:u.username,token:u.token},extra||{});}
async function materialApi(op,extra){
  if(String(op||'').indexOf('gaberMaterial')!==0)throw new Error('Material API operation خارج النطاق.');
  const payload=legacyMaterialAuth(Object.assign({op:op},extra||{}));
  if(typeof window.trendosSecureApiV1922==='function'){
    try{const d=await window.trendosSecureApiV1922('operatorTaskV2',payload);if(d&&!(norm(d.message).includes('غير معروف')||norm(d.message).includes('غير منشور')))return d;}catch(e){}
  }
  if(!APPS_SCRIPT_API)throw new Error('Material backend URL غير متاح.');
  const r=await fetch(APPS_SCRIPT_API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action:'operatorTaskV2'},payload)),cache:'no-store',credentials:'omit'});
  const raw=await r.text();try{return JSON.parse(raw);}catch(e){throw new Error('Material backend لا يرجع JSON.');}
}
function hide(el){if(el)el.style.display='none';}
function privacyMask(role){
  if(role!=='WAEL'&&role!=='GABER')return;
  hide(document.getElementById('currentOrderBar'));
  hide(document.getElementById('statsBar'));
  const search=document.getElementById('tableSearch');if(search)hide(search.closest('.filters'));
  const table=document.getElementById('ordersTable');if(table)hide(table.closest('.table-wrap'));
  hide(document.getElementById('paginationBar'));
  const bulk=document.getElementById('bulkStatusMsg');if(bulk){const box=bulk.closest('.bulk-status-card,.bulk-status-box,.bulk-status');if(box)hide(box);}
  if(role==='WAEL')hide(document.getElementById('trendPressControlV1'));
}
function ensureRoot(){if(root)return root;const anchor=document.getElementById('currentOrderBar')||document.getElementById('ordersTable')||document.getElementById('mainView');if(!anchor)return null;root=document.createElement('section');root.id='trendOperatorTaskV2';root.style.cssText='direction:rtl;margin:12px 0;padding:14px;border:1px solid #d8e2ec;border-radius:14px;background:#fff;box-shadow:0 8px 22px rgba(20,45,70,.08);font-family:Tahoma,Arial,sans-serif;color:#153047';anchor.parentNode.insertBefore(root,anchor);root.addEventListener('click',onClick);return root;}
function css(){return '<style>#trendOperatorTaskV2 button{border:0;border-radius:10px;padding:10px 14px;background:#0f766e;color:#fff;font-weight:700;cursor:pointer}#trendOperatorTaskV2 button.ghost{background:#edf2f5;color:#153047}#trendOperatorTaskV2 button.done{background:#18623c}#trendOperatorTaskV2 button:disabled{opacity:.45;cursor:not-allowed}#trendOperatorTaskV2 input,#trendOperatorTaskV2 select{box-sizing:border-box;padding:7px;border:1px solid #ccd7df;border-radius:7px;background:#fff}</style>';}
function taskHtml(task){
  if(!task)return '<div style="padding:16px;border:1px dashed #b8c5d1;border-radius:12px;text-align:center"><b>الشغل العادي بيتوزع كتاسكات</b><div style="font-size:12px;color:#66788a;margin:7px 0 12px">مش هتظهر لك قائمة الأوردرات. النظام هيختار: عاجل أولًا، ثم أقرب/أقدم ميعاد تسليم، ثم رقم الأوردر.</div><button data-ot="claim">هات تاسك جديد وابدأ</button></div>';
  return '<div style="border:1px solid #d8e2ec;border-radius:12px;padding:13px">'+
    '<div style="display:flex;justify-content:space-between;gap:10px"><div><b style="font-size:18px">أوردر '+esc(task.orderId)+'</b><div style="font-size:12px;color:#66788a">بند '+esc(task.lineId)+' • '+esc(task.department||'-')+'</div></div><b data-ot-timer style="font-size:22px;direction:ltr">'+fmtSec(taskSec(task))+'</b></div>'+
    '<div style="margin-top:9px"><b>'+esc(task.itemName||'-')+'</b>'+(task.qty?' • الكمية: '+esc(task.qty):'')+'</div>'+
    '<div style="font-size:12px;color:#66788a;margin-top:5px">'+esc(task.customer||'-')+' • '+esc(task.priority||'عادي')+(task.expectedDelivery?' • التسليم: '+esc(task.expectedDelivery):'')+'</div>'+
    '<div style="margin-top:9px"><span style="padding:5px 9px;border-radius:8px;background:#e8f5ee">بدء التنفيذ</span></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:11px"><button data-ot="ready" class="done">جاهز للاستلام</button><button data-ot="delivered" class="done">تم التسليم</button></div></div>';
}
function flyHtml(items){items=Array.isArray(items)?items:[];let out='<div style="font-size:11px;color:#66788a;margin:3px 0 8px">ظاهر دائمًا — خارج نظام التاسكات ولا يؤثر على ترتيب التاسك التالي.</div>';if(!items.length)return out+'<div style="padding:8px;color:#66788a;font-size:12px">لا توجد طباعة ع الطاير حاليًا.</div>';return out+items.map(function(x){return '<div style="padding:9px 0;border-top:1px solid #edf1f4"><b>⚡ أوردر '+esc(x.orderId)+'</b> — '+esc(x.itemName||'-')+'<div style="font-size:11px;color:#66788a">'+esc(x.customer||'-')+(x.qty?' • كمية '+esc(x.qty):'')+'</div></div>';}).join('');}
function pressHtml(count){
  let out='<div style="font-size:11px;color:#66788a;margin:3px 0 8px">فلتر تجميعي للمكبس فقط؛ لا يفتح قائمة الشغل العادي.</div><button data-ot="pressToggle" class="ghost">فلتر المكبس ('+Number(count||0)+')</button>';
  if(!pressOpen)return out;
  if(!pressItems.length)return out+'<div style="padding:8px;color:#66788a;font-size:12px">لا توجد أوردرات مكبس حاليًا.</div>';
  return out+'<div style="margin-top:8px;border:1px solid #edf1f4;border-radius:10px;padding:8px">'+pressItems.map(function(x){return '<div style="padding:8px 0;border-bottom:1px solid #f1f3f5"><b>🔥 أوردر '+esc(x.orderId)+'</b> — '+esc(x.itemName||'-')+'<div style="font-size:11px;color:#66788a">'+esc(x.customer||'-')+' • بند '+esc(x.lineId)+' • '+esc(x.status||'-')+'</div></div>';}).join('')+'</div>';
}
async function mountGaberMaterial(d){
  if(!d||d.role!=='GABER'||d.materialControlEnabled!==true||!d.task)return;
  const mount=document.getElementById('trendGaberMaterialV1Mount');if(!mount)return;
  const mod=window.TrendOSGaberMaterialUiV1;if(!mod||typeof mod.mountTask!=='function'){mount.innerHTML='<div style="margin-top:10px;color:#9b1c1c">واجهة قفلة خامات جابر غير محملة.</div>';return;}
  try{const bootstrap=await materialApi('gaberMaterialBootstrap',{taskId:d.task.taskId});if(!bootstrap||!bootstrap.success)throw new Error(bootstrap&&bootstrap.message||'تعذر تحميل بيانات خامات التاسك.');if(!last||!last.task||last.task.taskId!==d.task.taskId)return;mod.mountTask(mount,{task:d.task,bootstrap:bootstrap,api:materialApi});}catch(err){mount.innerHTML='<div style="margin-top:10px;color:#9b1c1c">'+esc(err&&err.message||err)+'</div>';}
}
function renderEmployee(d){const r=ensureRoot();if(!r)return;last=d;privacyMask(d.role);const title=d.role==='WAEL'?'شغل وائل — الطباعة':'شغل جابر — الليزر';let html=css()+'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><b style="font-size:19px">'+title+'</b><div style="font-size:12px;color:#66788a">التاسك العادي بيتحدد تلقائيًا من النظام.</div></div><button data-ot="refresh" class="ghost">تحديث</button></div>';html+=taskHtml(d.task||null);if(d.role==='GABER'&&d.materialControlEnabled===true&&d.task)html+='<div id="trendGaberMaterialV1Mount"></div>';if(d.role==='WAEL'){html+='<div style="margin-top:12px;border:1px solid #f1d18a;border-radius:12px;padding:10px"><b>⚡ الطباعة على الطاير</b>'+flyHtml(d.flyPrint)+'</div>';html+='<div style="margin-top:12px;border:1px solid #f1d18a;border-radius:12px;padding:10px"><b>🔥 المكبس</b>'+pressHtml(d.pressCandidateCount)+'</div>';}r.innerHTML=html;if(d.role==='GABER'&&d.materialControlEnabled===true&&d.task)mountGaberMaterial(d);}
function renderManager(m,status){const r=ensureRoot();if(!r)return;last=status||{role:'MANAGER'};const rows=m&&m.employees||[];let html=css()+'<div style="display:flex;justify-content:space-between"><b>📊 أداء التاسكات</b><button data-ot="metrics" class="ghost">تحديث</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:10px">'+rows.map(function(x){return '<div style="border:1px solid #edf1f4;border-radius:10px;padding:10px"><b>'+esc(x.employee)+'</b><div>'+Number(x.completedOrders||0)+' أوردر • '+Number(x.completedTasks||0)+' تاسك</div><small>إجمالي '+fmtSec(x.totalWorkSec)+' • متوسط '+fmtSec(x.averageWorkSec)+'</small></div>';}).join('')+'</div>';if(status&&status.materialControlEnabled===true)html+='<div id="trendGaberMaterialManagerV1Mount"></div>';r.innerHTML=html;if(status&&status.materialControlEnabled===true){const mod=window.TrendOSGaberMaterialUiV1,mount=document.getElementById('trendGaberMaterialManagerV1Mount');if(mod&&mount&&typeof mod.mountManager==='function')mod.mountManager(mount,{api:materialApi});else if(mount)mount.innerHTML='<div style="margin-top:10px;color:#9b1c1c">واجهة رقابة خامات جابر غير محملة.</div>';}}
async function refresh(){if(busy||!user())return;busy=true;try{const d=await api('status');if(!d||!d.success||d.enabled!==true){last=d;return;}if(d.role==='MANAGER'){const m=await api('metrics');if(m&&m.success)renderManager(m,d);return;}renderEmployee(d);}catch(e){console.warn('Operator Task V2 Edge:',e);}finally{busy=false;}}
async function act(op,extra){if(busy)return null;busy=true;try{const d=await api(op,extra);if(!d||!d.success)throw new Error(d&&d.message||'تعذر تنفيذ العملية.');return d;}catch(e){alert(txt(e&&e.message||e));return null;}finally{busy=false;}}
async function onClick(e){const b=e.target&&e.target.closest?e.target.closest('[data-ot]'):null;if(!b)return;const a=b.getAttribute('data-ot');if(a==='refresh'){await refresh();return;}if(a==='claim'){const d=await act('claimNext');if(d)await refresh();return;}if(a==='ready'||a==='delivered'){if(!last||!last.task)return;const finalStatus=a==='ready'?'جاهز للاستلام':'تم التسليم';const extra={taskId:last.task.taskId,finalStatus:finalStatus};if(last.role==='GABER'&&last.materialControlEnabled===true){const mod=window.TrendOSGaberMaterialUiV1;if(!mod||typeof mod.getPayload!=='function'){alert('واجهة قفلة خامات جابر غير جاهزة.');return;}try{extra.materialClosePayload=JSON.stringify(mod.getPayload(last.task));}catch(err){alert(txt(err&&err.message||err));return;}}if(!confirm('تأكيد تحويل التاسك إلى '+finalStatus+'؟'))return;const d=await act('completeTask',extra);if(d){alert('الوقت الفعلي: '+fmtSec(d.actualWorkSec||d.task&&d.task.workSec));await refresh();}return;}if(a==='pressToggle'){if(pressOpen){pressOpen=false;pressItems=[];if(last)renderEmployee(last);return;}const d=await act('pressCandidates');if(d){pressItems=Array.isArray(d.items)?d.items:[];pressOpen=true;if(last)renderEmployee(last);}return;}if(a==='metrics'){const m=await act('metrics');if(m)renderManager(m,last&&last.role==='MANAGER'?last:null);}}
function tick(){if(!root||!last||!last.task)return;const el=root.querySelector('[data-ot-timer]');if(el)el.textContent=fmtSec(taskSec(last.task));}
function boot(){if(!user())return;if(!root)refresh();}
window.TrendOSOperatorTaskV2Transport={mode:'cloudflare-edge-bearer-apps-script-authority',api:edgeBase(),routes:Object.keys(ROUTES).reduce(function(out,k){out[k]=ROUTES[k].path;return out;},{}),materialMode:'flagged-apps-script-until-separate-material-edge-track',clearSession:clearEdgeSession,stats:function(){return {sessionExpiresAt:edgeSession.expiresAt||0,hasSession:!!edgeSession.token};}};
timer=setInterval(tick,1000);bootTimer=setInterval(boot,2500);boot();
})();