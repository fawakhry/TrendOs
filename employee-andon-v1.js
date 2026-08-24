(function(){
  'use strict';
  if(window.__TRENDOS_EMPLOYEE_ANDON_V1__) return;
  window.__TRENDOS_EMPLOYEE_ANDON_V1__=true;
  if(window.MATBAGY_EMPLOYEE_ANDON_V1===false) return;

  const API_URL=String(window.TREND_API_URL||window.API_URL||'').trim();
  const txt=v=>String(v==null?'':v).trim();
  function state(){return window.trendosState||window.state||{};}
  function user(){return state().user||null;}
  function name(){const u=user()||{};return txt(u.username||u.name)||'الموظف';}
  function screen(){return txt(state().screen||'');}
  async function api(action,extra){
    const u=user()||{},p=Object.assign({username:u.username||u.name||'',token:u.token||'',screen:screen()},extra||{});let d;
    if(typeof window.trendosSecureApiV1922==='function')d=await window.trendosSecureApiV1922(action,p);
    else{const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action},p)),cache:'no-store',credentials:'omit'});d=await r.json();}
    if(!d||d.success===false)throw new Error((d&&d.message)||'تعذر إرسال طلب المساعدة');return d;
  }
  function styles(){
    if(document.getElementById('trendEmployeeAndonV1Style'))return;
    const s=document.createElement('style');s.id='trendEmployeeAndonV1Style';s.textContent=`
      .ems-andon{padding:8px 8px 2px;background:#fff;border-top:1px solid #e6edf3}.ems-andon-title{font:800 11px Tahoma;color:#44566a;margin-bottom:6px}.ems-andon-actions{display:flex;flex-wrap:wrap;gap:5px}.ems-andon-btn{border:1px solid #d8e2ec;background:#f7fafc;color:#153047;border-radius:999px;padding:7px 9px;font:700 10px Tahoma;cursor:pointer}.ems-andon-btn:hover{background:#eef4f8}.ems-andon-btn.hot{border-color:#f0b8b3;background:#fff4f3;color:#9d2018}.ems-andon-btn.warn{border-color:#f5d48f;background:#fff9eb;color:#8a5600}.ems-andon-btn.ok{border-color:#a9e3c5;background:#effcf5;color:#087443}.ems-andon-status{font:10px Tahoma;color:#66788a;padding:6px 2px 2px}
    `;(document.head||document.documentElement).appendChild(s);
  }
  function attach(){
    const root=document.getElementById('employeeManagerStripsV2');if(!root||root.querySelector('[data-andon-v1]'))return false;
    const compose=root.querySelector('.ems-compose');if(!compose)return false;
    styles();
    const box=document.createElement('div');box.className='ems-andon';box.setAttribute('data-andon-v1','1');box.innerHTML=`
      <div class="ems-andon-title">🚨 لو في حاجة موقفاك اختار السبب فورًا:</div>
      <div class="ems-andon-actions">
        <button type="button" class="ems-andon-btn hot" data-andon="عطل ماكينة">🛠 عطل ماكينة</button>
        <button type="button" class="ems-andon-btn warn" data-andon="خامة ناقصة">📦 خامة ناقصة</button>
        <button type="button" class="ems-andon-btn warn" data-andon="انتظار العميل">💬 انتظار العميل</button>
        <button type="button" class="ems-andon-btn warn" data-andon="محتاج سعر أو قرار">💰 محتاج سعر/قرار</button>
        <button type="button" class="ems-andon-btn" data-andon="مشكلة جودة">⚠️ مشكلة جودة</button>
        <button type="button" class="ems-andon-btn" data-andon="محتاج مساعدة">❓ محتاج مساعدة</button>
        <button type="button" class="ems-andon-btn ok" data-andon="تم حل المشكلة">✅ اتحلت</button>
      </div>
      <div class="ems-andon-status" data-andon-status>بعد الاختيار اكتب سطر يوضح الأوردر أو المشكلة لو محتاج.</div>`;
    compose.parentNode.insertBefore(box,compose);
    box.querySelectorAll('[data-andon]').forEach(btn=>btn.addEventListener('click',async()=>{
      const reason=btn.dataset.andon,status=box.querySelector('[data-andon-status]'),input=root.querySelector('[data-reply]');
      const detail=txt(input&&input.value);const message=`ANDON | ${reason}${detail?' | '+detail:''}`;
      btn.disabled=true;status.textContent='جاري إرسال طلب المساعدة...';
      try{
        const stamp=new Date().toISOString();
        await api('saveMatbagyNote',{category:'OPS_REPLY',title:`OPS_REPLY|${name()}|ANDON|${reason}|${stamp}`,content:message});
        if(input)input.value='';status.textContent=`تم الإرسال: ${reason}. مدير التشغيل هيراجعها.`;
        if(window.TrendEmployeeManagerStripsV2&&window.TrendEmployeeManagerStripsV2.refresh)setTimeout(()=>window.TrendEmployeeManagerStripsV2.refresh(),300);
      }catch(e){status.textContent='تعذر الإرسال: '+e.message;}finally{btn.disabled=false;}
    }));
    return true;
  }
  const t=setInterval(()=>{if(attach())clearInterval(t);},300);
})();
