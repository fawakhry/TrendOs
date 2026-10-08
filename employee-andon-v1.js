(function(){
  'use strict';
  if(window.__TRENDOS_EMPLOYEE_ANDON_V1__) return;
  window.__TRENDOS_EMPLOYEE_ANDON_V1__=true;
  if(window.MATBAGY_EMPLOYEE_ANDON_V1===false) return;

  const VERSION='EMPLOYEE_ANDON_STRUCTURED_V2_20261007';
  const DEFAULT_SUPERVISOR_API='https://autonomous-printshop-employee-supervisor.trendmall-contact.workers.dev';
  const REASONS=Object.freeze({
    MACHINE_BREAKDOWN:'عطل ماكينة',
    MATERIAL_MISSING:'خامة ناقصة',
    WAITING_CUSTOMER:'انتظار العميل',
    PRICE_OR_OWNER_DECISION:'محتاج سعر/قرار',
    QUALITY_ISSUE:'مشكلة جودة',
    HELP_NEEDED:'محتاج مساعدة'
  });

  const txt=v=>String(v==null?'':v).trim();
  const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function state(){return window.trendosState||window.state||{};}
  function user(){return state().user||null;}
  function authState(){
    const u=user()||{};
    return {
      username:txt(u.username||u.name),
      token:txt(u.token),
      department:txt(u.department)
    };
  }
  function structuredEnabled(){return window.MATBAGY_EMPLOYEE_ANDON_STRUCTURED_V1===true;}
  function supervisorBase(){
    return txt(window.MATBAGY_EMPLOYEE_SUPERVISOR_API_URL||DEFAULT_SUPERVISOR_API).replace(/\/+$/,'');
  }
  function error(code,message){
    const e=new Error(message||code||'Structured Andon unavailable');
    e.code=code||'EMPLOYEE_ANDON_ERROR';
    return e;
  }
  function reasonLabel(code){return REASONS[txt(code)]||txt(code)||'عائق';}
  function signalSessionInvalidV2(){
    if(typeof window.dispatchEvent!=='function')return false;
    try{
      const detail={status:401,code:'EMPLOYEE_SUPERVISOR_HTTP_401',source:'employee-andon-v1'};
      if(typeof window.CustomEvent==='function')window.dispatchEvent(new window.CustomEvent('trendos:employee-session-invalid',{detail}));
      else window.dispatchEvent({type:'trendos:employee-session-invalid',detail});
      return true;
    }catch(e){return false;}
  }
  function randomId(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
  }
  function hashKey(value){
    const s=txt(value);let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(36);
  }
  function pendingStorageKey(kind,subject){
    const a=authState();
    return 'trendAndonRequestV2|'+a.username+'|'+txt(kind)+'|'+hashKey(subject);
  }
  function pendingRequestId(kind,subject){
    const k=pendingStorageKey(kind,subject);
    let id='';
    try{id=txt(window.sessionStorage&&window.sessionStorage.getItem(k));}catch(e){}
    if(id)return {key:k,id};
    id='ANDON-'+randomId();
    try{if(window.sessionStorage)window.sessionStorage.setItem(k,id);}catch(e){}
    return {key:k,id};
  }
  function clearPending(key){
    try{if(window.sessionStorage)window.sessionStorage.removeItem(key);}catch(e){}
  }
  async function post(path,payload){
    if(!structuredEnabled())throw error('STRUCTURED_ANDON_DISABLED','Structured Andon غير مفعل.');
    const a=authState();
    if(!a.username||!a.token)throw error('EMPLOYEE_SESSION_REQUIRED','جلسة الموظف الحالية مطلوبة.');
    let response;
    try{
      response=await fetch(supervisorBase()+path,{
        method:'POST',
        headers:{
          'accept':'application/json',
          'content-type':'application/json',
          'authorization':'Bearer '+a.token
        },
        body:JSON.stringify(Object.assign({username:a.username},payload||{})),
        cache:'no-store',
        credentials:'omit',
        redirect:'error'
      });
    }catch(e){
      throw error('EMPLOYEE_SUPERVISOR_NETWORK',e&&e.message?e.message:'تعذر الاتصال بخدمة المشرف.');
    }
    const raw=await response.text();
    let out={};
    try{out=JSON.parse(raw||'{}');}catch(e){throw error('EMPLOYEE_SUPERVISOR_INVALID_JSON','رد خدمة المشرف غير صالح.');}
    if(!response.ok||out.success===false){
      if(response.status===401)signalSessionInvalidV2();
      const e=error(out.code||('EMPLOYEE_SUPERVISOR_HTTP_'+response.status),out.message||out.code||'فشل طلب خدمة المشرف.');
      e.status=response.status;e.body=out;throw e;
    }
    return out;
  }
  async function reportBlocker(reasonCode,detailText){
    const code=txt(reasonCode);
    if(!Object.prototype.hasOwnProperty.call(REASONS,code))throw error('REASON_CODE_INVALID','سبب العائق غير معروف.');
    const detail=txt(detailText);
    if(detail.length>500)throw error('DETAIL_TOO_LONG','تفاصيل المشكلة أكبر من 500 حرف.');
    const a=authState();
    const subject=code+'|'+detail;
    const pending=pendingRequestId('REPORT',subject);
    try{
      const out=await post('/blockers/report',{
        clientRequestId:pending.id,
        reasonCode:code,
        detailText:detail,
        department:a.department
      });
      clearPending(pending.key);
      return out;
    }catch(e){
      throw e;
    }
  }
  async function loadOpenBlockers(){
    return post('/blockers/my-open',{});
  }
  async function resolveBlocker(blockerId){
    const id=txt(blockerId);
    if(!id)throw error('BLOCKER_ID_REQUIRED','معرف العائق مطلوب.');
    const pending=pendingRequestId('RESOLVE',id);
    try{
      const out=await post('/blockers/resolve',{
        blockerId:id,
        clientRequestId:pending.id
      });
      clearPending(pending.key);
      return out;
    }catch(e){
      throw e;
    }
  }
  function styles(){
    if(document.getElementById('trendEmployeeAndonV1Style'))return;
    const s=document.createElement('style');s.id='trendEmployeeAndonV1Style';s.textContent=`
      .ems-andon{padding:8px 8px 2px;background:#fff;border-top:1px solid #e6edf3}.ems-andon-title{font:800 11px Tahoma;color:#44566a;margin-bottom:6px}.ems-andon-actions{display:flex;flex-wrap:wrap;gap:5px}.ems-andon-btn{border:1px solid #d8e2ec;background:#f7fafc;color:#153047;border-radius:999px;padding:7px 9px;font:700 10px Tahoma;cursor:pointer}.ems-andon-btn:hover{background:#eef4f8}.ems-andon-btn.hot{border-color:#f0b8b3;background:#fff4f3;color:#9d2018}.ems-andon-btn.warn{border-color:#f5d48f;background:#fff9eb;color:#8a5600}.ems-andon-btn:disabled{opacity:.55;cursor:not-allowed}.ems-andon-status{font:10px Tahoma;color:#66788a;padding:6px 2px 2px}.ems-andon-open{border-top:1px dashed #d8e2ec;margin-top:7px;padding-top:7px}.ems-andon-open-title{font:800 10px Tahoma;color:#44566a;margin-bottom:4px}.ems-andon-open-row{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff8e8;border:1px solid #f4dfad;border-radius:9px;padding:6px 8px;margin-top:4px;font:10px Tahoma;color:#6b4d00}.ems-andon-resolve{border:0;border-radius:8px;background:#e8f7ef;color:#087443;padding:5px 7px;font:700 10px Tahoma;cursor:pointer}.ems-andon-empty{font:10px Tahoma;color:#66788a}
    `;(document.head||document.documentElement).appendChild(s);
  }
  async function refreshOpen(box){
    const host=box&&box.querySelector('[data-andon-open]');
    if(!host)return;
    if(!structuredEnabled()){
      host.innerHTML='<div class="ems-andon-empty">Structured Andon غير مفعل.</div>';
      return;
    }
    host.innerHTML='<div class="ems-andon-empty">جاري قراءة العوائق المفتوحة...</div>';
    try{
      const out=await loadOpenBlockers();
      const rows=Array.isArray(out.blockers)?out.blockers:[];
      if(!rows.length){
        host.innerHTML='<div class="ems-andon-empty">لا توجد عوائق مفتوحة.</div>';
        return;
      }
      host.innerHTML=rows.map(x=>'<div class="ems-andon-open-row"><span>'+esc(reasonLabel(x.reasonCode))+'</span><button type="button" class="ems-andon-resolve" data-resolve-blocker="'+esc(x.blockerId)+'">✅ اتحلت</button></div>').join('');
      host.querySelectorAll('[data-resolve-blocker]').forEach(btn=>btn.addEventListener('click',async()=>{
        const status=box.querySelector('[data-andon-status]'),id=txt(btn.getAttribute('data-resolve-blocker'));
        btn.disabled=true;status.textContent='جاري إغلاق العائق...';
        try{
          await resolveBlocker(id);
          status.textContent='تم تسجيل حل العائق.';
          await refreshOpen(box);
        }catch(e){
          status.textContent='تعذر إغلاق العائق: '+txt(e&&e.message||e);
        }finally{btn.disabled=false;}
      }));
    }catch(e){
      host.innerHTML='<div class="ems-andon-empty">تعذر قراءة العوائق المفتوحة.</div>';
    }
  }
  function attach(){
    const root=document.getElementById('employeeManagerStripsV2');if(!root||root.querySelector('[data-andon-v1]'))return false;
    const compose=root.querySelector('.ems-compose');if(!compose)return false;
    styles();
    const box=document.createElement('div');box.className='ems-andon';box.setAttribute('data-andon-v1','1');box.innerHTML=`
      <div class="ems-andon-title">🚨 لو في حاجة موقفاك اختار السبب فورًا:</div>
      <div class="ems-andon-actions">
        <button type="button" class="ems-andon-btn hot" data-reason-code="MACHINE_BREAKDOWN">🛠 عطل ماكينة</button>
        <button type="button" class="ems-andon-btn warn" data-reason-code="MATERIAL_MISSING">📦 خامة ناقصة</button>
        <button type="button" class="ems-andon-btn warn" data-reason-code="WAITING_CUSTOMER">💬 انتظار العميل</button>
        <button type="button" class="ems-andon-btn warn" data-reason-code="PRICE_OR_OWNER_DECISION">💰 محتاج سعر/قرار</button>
        <button type="button" class="ems-andon-btn" data-reason-code="QUALITY_ISSUE">⚠️ مشكلة جودة</button>
        <button type="button" class="ems-andon-btn" data-reason-code="HELP_NEEDED">❓ محتاج مساعدة</button>
      </div>
      <div class="ems-andon-status" data-andon-status>اكتب سطر يوضح المشكلة لو محتاج، ثم اختار السبب.</div>
      <div class="ems-andon-open"><div class="ems-andon-open-title">العوائق المفتوحة</div><div data-andon-open></div></div>`;
    compose.parentNode.insertBefore(box,compose);
    if(!structuredEnabled()){
      box.querySelectorAll('[data-reason-code]').forEach(b=>b.disabled=true);
      box.querySelector('[data-andon-status]').textContent='Structured Andon غير مفعل.';
      refreshOpen(box);
      return true;
    }
    box.querySelectorAll('[data-reason-code]').forEach(btn=>btn.addEventListener('click',async()=>{
      const reasonCode=txt(btn.dataset.reasonCode),status=box.querySelector('[data-andon-status]'),input=root.querySelector('[data-reply]');
      const detail=txt(input&&input.value);
      btn.disabled=true;status.textContent='جاري إرسال طلب المساعدة...';
      try{
        const out=await reportBlocker(reasonCode,detail);
        if(input)input.value='';
        status.textContent=out.idempotentReplay===true?'البلاغ كان مسجل بالفعل وتم تأكيده.':'تم تسجيل العائق: '+reasonLabel(reasonCode)+'.';
        await refreshOpen(box);
      }catch(e){
        status.textContent='تعذر الإرسال: '+txt(e&&e.message||e);
      }finally{btn.disabled=false;}
    }));
    refreshOpen(box);
    return true;
  }

  window.TrendEmployeeAndonV1={
    version:VERSION,
    structured:true,
    reasonLabel,
    reportBlocker,
    loadOpenBlockers,
    resolveBlocker,
    supervisorBase
  };

  const t=setInterval(()=>{if(attach())clearInterval(t);},300);
})();
