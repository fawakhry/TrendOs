(function(){
  'use strict';
  if(window.__TRENDOS_OPERATIONS_HUB_V1__) return;
  window.__TRENDOS_OPERATIONS_HUB_V1__=true;
  const BUILD='V1932_PLATFORM_FIXES_20260904_POLL_SAFE';
  const targets=[
    {id:'trendAttendanceV1',label:'🕘 الحضور والتشغيل'},
    {id:'trendPressControlV1',label:'🔥 متابعة المكبس'},
    {id:'employeeManagerStripsV2',label:'🤖 متابعة التشغيل'},
    {id:'trendEmployeeAndonV1',label:'🚨 طلب مساعدة'}
  ];
  let root,drawer,body,active='';
  function ensurePollCoordinator(){
    if(window.TrendPollCoordinatorV1||document.getElementById('trendPollCoordinatorV1Script'))return;
    const s=document.createElement('script');
    s.id='trendPollCoordinatorV1Script';
    s.src='trendos-poll-coordinator-v1.js?v=20260904a';
    s.async=true;
    (document.head||document.documentElement).appendChild(s);
  }
  function inject(){
    ensurePollCoordinator();
    if(document.getElementById('trendOperationsHubV1Style'))return;
    const s=document.createElement('style');s.id='trendOperationsHubV1Style';s.textContent=`
      #trendOperationsHubV1{position:fixed;left:12px;bottom:12px;z-index:2147483500;direction:rtl;font-family:Tahoma,Arial,sans-serif}
      #trendOperationsHubV1 .toh-launch{border:0;border-radius:999px;background:#123a59;color:#fff;padding:11px 15px;font-weight:800;box-shadow:0 10px 30px rgba(15,45,70,.25);cursor:pointer}
      #trendOperationsHubV1 .toh-drawer{display:none;position:absolute;left:0;bottom:52px;width:min(410px,calc(100vw - 24px));max-height:min(78vh,720px);overflow:auto;background:#f7fafc;border:1px solid #d8e2ec;border-radius:16px;box-shadow:0 18px 55px rgba(15,45,70,.28)}
      #trendOperationsHubV1.open .toh-drawer{display:block}.toh-head{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;background:#123a59;color:#fff;padding:10px 12px}.toh-head button{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:8px;padding:6px 8px;cursor:pointer}
      .toh-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:8px;background:#eef4f8}.toh-tabs button{border:1px solid #cad8e4;background:#fff;border-radius:9px;padding:7px 9px;font-weight:700;cursor:pointer}.toh-tabs button.active{background:#0f766e;color:#fff;border-color:#0f766e}
      .toh-body{padding:8px}.toh-empty{padding:18px;text-align:center;color:#667085}.toh-version{font-size:10px;color:#667085;padding:0 10px 9px}
      #trendOperationsHubV1 .toh-body>#trendAttendanceV1,#trendOperationsHubV1 .toh-body>#trendPressControlV1,#trendOperationsHubV1 .toh-body>#employeeManagerStripsV2,#trendOperationsHubV1 .toh-body>#trendEmployeeAndonV1{position:static!important;inset:auto!important;width:auto!important;max-width:none!important;margin:0!important;box-shadow:none!important}
      #mgr1932Btn{display:none!important}@media(max-width:600px){#trendOperationsHubV1{left:8px;bottom:8px}.toh-drawer{width:calc(100vw - 16px)!important;max-height:82vh!important}}
    `;document.head.appendChild(s);
  }
  function refreshAll(){
    // Do not synthesize a window focus event here. Several modules already listen
    // to focus, so the old implementation multiplied one manual refresh into
    // multiple concurrent Apps Script reads.
    ['TrendEmployeeManagerStripsV2','TrendEmployeeOpsCoachV1','TrendPressControlV1'].forEach(k=>{try{if(window[k]&&typeof window[k].refresh==='function')window[k].refresh({force:true,source:'operations-hub'});}catch(e){}});
    document.dispatchEvent(new CustomEvent('trendos:refresh',{detail:{source:'operations-hub',force:true}}));
  }
  function available(){
    const a=targets.filter(t=>{const el=document.getElementById(t.id);return el&&getComputedStyle(el).display!=='none';});
    if(document.getElementById('mgr1932Btn'))a.push({id:'mgr1932Btn',label:'📊 لوحة المدير',action:true});
    return a;
  }
  function renderTabs(){
    const a=available();const tabs=root.querySelector('.toh-tabs');
    tabs.innerHTML=a.map(t=>'<button type="button" data-target="'+t.id+'" class="'+(active===t.id?'active':'')+'">'+t.label+'</button>').join('');
    if(!a.length){body.innerHTML='<div class="toh-empty">لا توجد أدوات تشغيل متاحة لهذا الحساب.</div>';return;}
    if(!active||!a.some(t=>t.id===active))show(a[0].id);
  }
  function show(id){
    const item=available().find(t=>t.id===id);if(!item)return;
    if(item.action){document.getElementById(id).click();return;}
    const el=document.getElementById(id);if(!el)return;
    active=id;body.innerHTML='';body.appendChild(el);renderTabs();
  }
  function build(){
    inject();if(root)return;
    root=document.createElement('aside');root.id='trendOperationsHubV1';root.innerHTML='<button class="toh-launch" type="button">⚙ مركز التشغيل</button><div class="toh-drawer"><div class="toh-head"><b>مركز التشغيل</b><span><button data-refresh type="button">تحديث</button> <button data-close type="button">إغلاق</button></span></div><div class="toh-tabs"></div><div class="toh-body"></div><div class="toh-version">الإصدار '+BUILD+'</div></div>';
    document.body.appendChild(root);drawer=root.querySelector('.toh-drawer');body=root.querySelector('.toh-body');
    root.querySelector('.toh-launch').onclick=()=>{root.classList.toggle('open');if(root.classList.contains('open'))renderTabs();};
    root.querySelector('[data-close]').onclick=()=>root.classList.remove('open');
    root.querySelector('[data-refresh]').onclick=refreshAll;
    root.querySelector('.toh-tabs').onclick=e=>{const b=e.target.closest('[data-target]');if(b)show(b.dataset.target);};
    const observer=new MutationObserver(()=>{if(root.classList.contains('open'))renderTabs();});observer.observe(document.body,{childList:true,subtree:false});
    setTimeout(renderTabs,1200);setTimeout(renderTabs,3500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
  window.TRENDOS_PLATFORM_VERSION=BUILD;
})();