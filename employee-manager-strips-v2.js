(function(){
  'use strict';
  if(window.__TRENDOS_EMPLOYEE_MANAGER_STRIPS_V2__) return;
  window.__TRENDOS_EMPLOYEE_MANAGER_STRIPS_V2__=true;
  if(window.MATBAGY_EMPLOYEE_MANAGER_STRIPS_V2===false) return;

  const API_URL=String(window.TREND_API_URL||window.API_URL||'').trim();
  const REFRESH_MS=60*1000;
  const ui={root:null,rows:[],notes:[],lastOk:0,busy:false,timer:null};
  const txt=v=>String(v==null?'':v).trim();
  const esc=v=>txt(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  function state(){return window.trendosState||window.state||{};}
  function user(){return state().user||null;}
  function name(){const u=user()||{};return txt(u.username||u.name)||'يا بطل';}
  function role(){const u=user()||{};return txt(u.role).toLowerCase();}
  function norm(s){return txt(s).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
  function isAdmin(){const k=norm(name()+' '+role());return role()==='admin'||k.includes('ضياء')||k.includes('diaa');}
  function screen(){return txt(state().screen||'');}
  function auth(extra){const u=user()||{};return Object.assign({username:u.username||u.name||'',token:u.token||'',screen:screen()},extra||{});}
  async function api(action,extra){
    if(!API_URL) throw new Error('API غير مضبوط');
    const q=new URLSearchParams(); const p=auth(Object.assign({action},extra||{}));
    Object.keys(p).forEach(k=>q.set(k,txt(p[k])));
    const r=await fetch(API_URL+(API_URL.includes('?')?'&':'?')+q.toString(),{cache:'no-store',credentials:'omit'});
    const d=await r.json(); if(!d||d.success===false) throw new Error((d&&d.message)||'تعذر تحديث المتابعة'); return d;
  }
  function isDone(r){return ['تم التسليم','جاهز للاستلام','ملغى','ملغي','مكرر'].includes(txt(r.status));}
  function isUrgent(r){const p=norm(r.priority),f=norm(r.flyPrint||r.quickPrint||r.fastPrint||r['طباعة على الطاير']||r['طباعة ع الطاير']);return p.includes('عاجل')||p==='vip'||f==='نعم'||f==='true'||f==='1'||f.includes('الطاير');}
  function parseDate(v){const s=txt(v);if(!s)return null;let m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3],23,59,59);m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);if(m)return new Date(+m[3],+m[1]-1,+m[2],23,59,59);const d=new Date(s);return isNaN(d.getTime())?null:d;}
  function expected(r){return parseDate(r.expectedDeliveryAt||r.expectedDelivery||r.expectedDeliveryText||r.deliveryDate||'');}
  function updated(r){return parseDate(r.updatedAt||r.lastUpdate||r.updated||r.statusUpdatedAt||'');}
  function orderId(r){return txt(r.orderId||r.id||r.lineId||'-');}
  function customer(r){return txt(r.customer||r.customerName||r.chatName||'العميل');}
  function latestManagerNote(){
    const me=norm(name());
    const rows=(ui.notes||[]).filter(n=>{
      const cat=norm(n.category||n['القسم']||'');
      const title=norm(n.title||n['العنوان']||'');
      return cat==='ops_coach'&&title.includes(me);
    });
    return rows.length?rows[0]:null;
  }
  function commandFor(r,type){
    const me=name(),id=orderId(r),cust=customer(r),st=txt(r.status||'طلب جديد');
    if(type==='overdue') return `يا ${me}، راجع أوردر ${id} للعميل ${cust} دلوقتي؛ هو متأخر. حدّث حالته أو اكتب سبب التوقف.`;
    if(type==='urgent') return `يا ${me}، ابدأ أوردر ${id} للعميل ${cust} قبل الشغل العادي، وبعد ما تبدأ غيّر الحالة إلى «بدأ التنفيذ».`;
    if(type==='stale') return `يا ${me}، أوردر ${id} للعميل ${cust} حالته «${st}» من غير تحديث. كمّل التنفيذ أو اكتب سبب التوقف الآن.`;
    return `يا ${me}، افتح أوردر ${id} للعميل ${cust} واشتغل عليه حسب ترتيب الـQueue، وحدّث حالته أول بأول.`;
  }
  function model(){
    const now=new Date(),active=(ui.rows||[]).filter(r=>!isDone(r));
    const urgent=active.filter(isUrgent);
    const overdue=active.filter(r=>{const d=expected(r);return d&&d.getTime()<now.getTime();});
    const stale=active.filter(r=>{const s=txt(r.status),d=updated(r);return (s==='بدأ التنفيذ'||s==='تحت التنفيذ')&&d&&(now-d)>60*60*1000;});
    let tone='ok',title='🤖 المطلوب منك الآن',msg=`يا ${name()}، تابع أول أوردر في الـQueue وحدّث حالته أول بأول.`,primary=null,primaryType='normal';
    if(overdue.length){tone='hot';primary=overdue[0];primaryType='overdue';msg=commandFor(primary,'overdue');}
    else if(urgent.length){tone='warn';primary=urgent[0];primaryType='urgent';msg=commandFor(primary,'urgent');}
    else if(stale.length){tone='warn';primary=stale[0];primaryType='stale';msg=commandFor(primary,'stale');}
    else if(active.length){primary=active[0];msg=commandFor(primary,'normal');}
    else msg=`يا ${name()}، مفيش أوردرات نشطة ظاهرة عندك دلوقتي. راجع شات القسم أو استنى الشغل التالي.`;
    return {active,urgent,overdue,stale,tone,title,msg,primary,primaryType};
  }
  function styles(){
    if(document.getElementById('employeeManagerStripsV2Style'))return;
    const s=document.createElement('style');s.id='employeeManagerStripsV2Style';s.textContent=`
      #employeeManagerStripsV2{position:fixed;right:14px;bottom:14px;z-index:2147483400;width:min(350px,calc(100vw - 28px));direction:rtl;font-family:Tahoma,Arial,sans-serif;color:#153047}
      #employeeManagerStripsV2 .ems-panel{display:none;background:#fff;border:1px solid #d9e3ec;border-radius:14px;box-shadow:0 14px 38px rgba(15,45,70,.22);margin-bottom:7px;overflow:hidden}.ems-panel.open{display:block!important}.ems-panel-head{padding:10px 12px;background:#123a59;color:#fff;font-weight:800;cursor:grab;touch-action:none;user-select:none}.ems-panel-head:active{cursor:grabbing}.ems-list{max-height:320px;overflow:auto;padding:7px 10px}.ems-item{padding:10px 6px;border-bottom:1px solid #edf1f4;font-size:13px;line-height:1.65}.ems-item:last-child{border-bottom:0}.ems-command{font-weight:800}.ems-order{font-size:11px;color:#66788a;margin-top:3px}
      #employeeManagerStripsV2 .ems-strip{width:100%;border:1px solid #d9e3ec;background:#fff;border-radius:14px;box-shadow:0 8px 28px rgba(15,45,70,.16);padding:10px 11px;display:flex;align-items:center;gap:9px;cursor:grab;text-align:right;margin-top:7px;color:#153047;touch-action:none;user-select:none}.ems-strip:active{cursor:grabbing}.ems-dot{width:10px;height:10px;border-radius:50%;background:#039855;box-shadow:0 0 0 4px rgba(3,152,85,.10);flex:0 0 auto}.ems-strip.warn .ems-dot{background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.12)}.ems-strip.hot .ems-dot{background:#d92d20;box-shadow:0 0 0 4px rgba(217,45,32,.12)}.ems-main{min-width:0;flex:1}.ems-title{font-size:12px;font-weight:900}.ems-msg{font-size:12px;color:#4b5f70;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.ems-count{font-size:11px;font-weight:800;background:#f1f5f9;border-radius:999px;padding:4px 7px}.ems-manager{border-right:4px solid #005bff!important}.ems-manager .ems-dot{background:#005bff;box-shadow:0 0 0 4px rgba(0,91,255,.10)}
      @media(max-width:600px){#employeeManagerStripsV2{right:8px;bottom:8px;width:min(350px,calc(100vw - 16px))}}
    `;
    (document.head||document.documentElement).appendChild(s);
  }
  function build(){
    if(isAdmin()||!user()||!user().token)return;
    styles();
    const old=document.getElementById('trendOpsCoach'); if(old) old.style.display='none';
    if(ui.root)return;
    const d=document.createElement('aside');d.id='employeeManagerStripsV2';d.innerHTML=`
      <div class="ems-panel" data-panel="coach"><div class="ems-panel-head">🤖 المطلوب منك الآن — اسحب اللوحة من هنا</div><div class="ems-list" data-list="coach"></div></div>
      <button class="ems-strip" data-strip="coach" type="button"><span class="ems-dot"></span><span class="ems-main"><div class="ems-title" data-title="coach">🤖 المطلوب منك الآن</div><div class="ems-msg" data-msg="coach">جاري قراءة الشغل...</div></span><span class="ems-count" data-count>0</span></button>
      <div class="ems-panel" data-panel="manager"><div class="ems-panel-head">👁️ رسالة مدير التشغيل — اسحب اللوحة من هنا</div><div class="ems-list" data-list="manager"></div></div>
      <button class="ems-strip ems-manager" data-strip="manager" type="button"><span class="ems-dot"></span><span class="ems-main"><div class="ems-title">👁️ مدير التشغيل معاك</div><div class="ems-msg" data-msg="manager">جاري قراءة آخر توجيه...</div></span></button>`;
    document.body.appendChild(d);ui.root=d;
    d.querySelectorAll('[data-strip]').forEach(b=>b.addEventListener('click',()=>{const p=d.querySelector('[data-panel="'+b.dataset.strip+'"]');p.classList.toggle('open');}));
    render(); refresh(); ui.timer=setInterval(refresh,REFRESH_MS); window.addEventListener('focus',refresh);
  }
  function render(){
    if(!ui.root)return;
    const m=model(),coach=ui.root.querySelector('[data-strip="coach"]');
    coach.className='ems-strip '+m.tone;
    ui.root.querySelector('[data-title="coach"]').textContent=m.title;
    ui.root.querySelector('[data-msg="coach"]').textContent=m.msg;
    ui.root.querySelector('[data-count]').textContent=m.overdue.length||m.urgent.length||m.stale.length||m.active.length;
    let html='';
    const seen=new Set();
    function add(r,type){if(!r)return;const id=orderId(r);if(seen.has(id+'|'+type))return;seen.add(id+'|'+type);html+=`<div class="ems-item"><div class="ems-command">${esc(commandFor(r,type))}</div><div class="ems-order">أوردر ${esc(id)} • ${esc(customer(r))} • ${esc(r.status||'طلب جديد')}</div></div>`;}
    if(m.primary)add(m.primary,m.primaryType);
    m.overdue.slice(0,4).forEach(r=>add(r,'overdue'));
    m.urgent.filter(r=>!m.overdue.includes(r)).slice(0,4).forEach(r=>add(r,'urgent'));
    m.stale.filter(r=>!m.overdue.includes(r)&&!m.urgent.includes(r)).slice(0,4).forEach(r=>add(r,'stale'));
    if(!html)html=`<div class="ems-item"><div class="ems-command">يا ${esc(name())}، مفيش تنبيه مباشر دلوقتي. راجع الشات والشغل الجديد وخليك محدث الحالات أول بأول.</div></div>`;
    ui.root.querySelector('[data-list="coach"]').innerHTML=html;
    const note=latestManagerNote(),msg=ui.root.querySelector('[data-msg="manager"]'),list=ui.root.querySelector('[data-list="manager"]');
    if(note){
      const content=txt(note.content||note['النوت']||'');
      const readable=content||`يا ${name()}، راجع المطلوب منك في الشغل الآن.`;
      msg.textContent=readable;
      list.innerHTML=`<div class="ems-item"><div class="ems-command">${esc(readable)}</div></div>`;
    }else{
      msg.textContent=`يا ${name()}، أنا متابع معاك. نفّذ المطلوب في شريط المدرب فوق.`;
      list.innerHTML=`<div class="ems-item"><div class="ems-command">يا ${esc(name())}، أنا متابع معاك اليوم. نفّذ المطلوب في شريط المدرب، ولو في حاجة موقفاك سجّل سبب التوقف بدل ما تسيب الأوردر ساكت.</div></div>`;
    }
  }
  async function refresh(){
    if(ui.busy||!user()||!user().token)return;ui.busy=true;
    try{
      const out=await Promise.all([api('getRows',{screen:screen()}),api('getMatbagyNotes',{})]);
      const r=out[0]||{},n=out[1]||{};
      if(r.success!==false)ui.rows=Array.isArray(r.rows)?r.rows:[];
      if(n.success!==false)ui.notes=Array.isArray(n.notes)?n.notes:[];
      ui.lastOk=Date.now();render();
    }catch(e){if(ui.root){ui.root.querySelector('[data-msg="coach"]').textContent=`يا ${name()}، المتابعة موجودة لكن البيانات ما اتحدثتش دلوقتي.`;ui.root.querySelector('[data-msg="manager"]').textContent='مدير التشغيل متابع — هنحاول التحديث تلقائيًا.';}}finally{ui.busy=false;}
  }
  window.TrendEmployeeManagerStripsV2={refresh:refresh};
  const t=setInterval(()=>{if(user()&&user().token){clearInterval(t);build();}},400);
})();
