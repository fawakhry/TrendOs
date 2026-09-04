(function(){
  'use strict';
  if(window.__TRENDOS_EMPLOYEE_MANAGER_STRIPS_V2__) return;
  window.__TRENDOS_EMPLOYEE_MANAGER_STRIPS_V2__=true;
  if(window.MATBAGY_EMPLOYEE_MANAGER_STRIPS_V2===false) return;

  const API_URL=String(window.TREND_API_URL||window.API_URL||'').trim();
  const REFRESH_MS=60*1000;
  const MIN_REFRESH_MS=45*1000;
  const ui={root:null,rows:[],notes:[],lastOk:0,lastRefreshAt:0,busy:false,sending:false,timer:null};
  const txt=v=>String(v==null?'':v).trim();
  const esc=v=>txt(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  function state(){return window.trendosState||window.state||{};}
  function user(){return state().user||null;}
  function name(){const u=user()||{};return txt(u.username||u.name)||'الموظف';}
  function role(){const u=user()||{};return txt(u.role).toLowerCase();}
  function norm(s){return txt(s).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
  function isAdmin(){const k=norm(name()+' '+role());return role()==='admin'||k.includes('ضياء')||k.includes('diaa');}
  function screen(){return txt(state().screen||'');}
  function auth(extra){const u=user()||{};return Object.assign({username:u.username||u.name||'',token:u.token||'',screen:screen()},extra||{});}
  async function api(action,extra){
    if(!API_URL) throw new Error('API غير مضبوط');
    const p=auth(extra||{});let d;
    if(typeof window.trendosSecureApiV1922==='function')d=await window.trendosSecureApiV1922(action,p);
    else{const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action},p)),cache:'no-store',credentials:'omit'});d=await r.json();}
    if(!d||d.success===false)throw new Error((d&&d.message)||'تعذر تحديث المتابعة');return d;
  }
  function isDone(r){return ['تم التسليم','جاهز للاستلام','ملغى','ملغي','مكرر'].includes(txt(r.status));}
  function isUrgent(r){const p=norm(r.priority),f=norm(r.flyPrint||r.quickPrint||r.fastPrint||r['طباعة على الطاير']||r['طباعة ع الطاير']);return p.includes('عاجل')||p==='vip'||f==='نعم'||f==='true'||f==='1'||f.includes('الطاير');}
  function parseDate(v){const s=txt(v);if(!s)return null;let m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3],23,59,59);m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);if(m)return new Date(+m[3],+m[1]-1,+m[2],23,59,59);const d=new Date(s);return isNaN(d.getTime())?null:d;}
  function expected(r){return parseDate(r.expectedDeliveryAt||r.expectedDelivery||r.expectedDeliveryText||r.deliveryDate||'');}
  function updated(r){return parseDate(r.updatedAt||r.lastUpdate||r.updated||r.statusUpdatedAt||'');}
  function orderId(r){return txt(r.orderId||r.id||r.lineId||'-');}
  function customer(r){return txt(r.customer||r.customerName||r.chatName||'العميل');}
  function noteCategory(n){return norm(n.category||n['القسم']||'');}
  function noteTitle(n){return txt(n.title||n['العنوان']||'');}
  function noteContent(n){return txt(n.content||n['النوت']||'');}
  function noteTime(n){return txt(n.updatedAt||n.savedAt||n.time||n['آخر تحديث']||n['وقت الحفظ']||'');}
  function noteForMe(n){const me=norm(name());return norm(noteTitle(n)).includes(me);}
  function conversation(){
    return (ui.notes||[]).filter(n=>noteForMe(n)&&['ops_coach','ops_reply'].includes(noteCategory(n))).slice(0,20).reverse();
  }
  function latestManagerNote(){const c=conversation().filter(n=>noteCategory(n)==='ops_coach');return c.length?c[c.length-1]:null;}
  function commandFor(r,type){
    const me=name(),id=orderId(r),cust=customer(r),st=txt(r.status||'طلب جديد');
    if(type==='overdue') return `يا ${me}، راجع أوردر ${id} للعميل ${cust} دلوقتي؛ هو متأخر. حدّث حالته أو اكتب لي سبب التوقف.`;
    if(type==='urgent') return `يا ${me}، ابدأ أوردر ${id} للعميل ${cust} قبل الشغل العادي، وبعد ما تبدأ غيّر الحالة إلى «بدأ التنفيذ».`;
    if(type==='stale') return `يا ${me}، أوردر ${id} للعميل ${cust} حالته «${st}» من غير تحديث. كمّل التنفيذ أو اكتب لي سبب التوقف الآن.`;
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
      #employeeManagerStripsV2{position:fixed;right:14px;bottom:14px;z-index:2147483400;width:min(370px,calc(100vw - 28px));direction:rtl;font-family:Tahoma,Arial,sans-serif;color:#153047}
      #employeeManagerStripsV2 .ems-panel{display:none;background:#fff;border:1px solid #d9e3ec;border-radius:14px;box-shadow:0 14px 38px rgba(15,45,70,.22);margin-bottom:7px;overflow:hidden}.ems-panel.open{display:block!important}.ems-panel-head{padding:10px 12px;background:#123a59;color:#fff;font-weight:800;cursor:grab;touch-action:none;user-select:none}.ems-panel-head:active{cursor:grabbing}.ems-list{max-height:300px;overflow:auto;padding:7px 10px}.ems-item{padding:10px 6px;border-bottom:1px solid #edf1f4;font-size:13px;line-height:1.65}.ems-item:last-child{border-bottom:0}.ems-command{font-weight:800}.ems-order{font-size:11px;color:#66788a;margin-top:3px}
      #employeeManagerStripsV2 .ems-strip{width:100%;border:1px solid #d9e3ec;background:#fff;border-radius:14px;box-shadow:0 8px 28px rgba(15,45,70,.16);padding:10px 11px;display:flex;align-items:center;gap:9px;cursor:grab;text-align:right;margin-top:7px;color:#153047;touch-action:none;user-select:none}.ems-strip:active{cursor:grabbing}.ems-dot{width:10px;height:10px;border-radius:50%;background:#039855;box-shadow:0 0 0 4px rgba(3,152,85,.10);flex:0 0 auto}.ems-strip.warn .ems-dot{background:#f59e0b}.ems-strip.hot .ems-dot{background:#d92d20}.ems-main{min-width:0;flex:1}.ems-title{font-size:12px;font-weight:900}.ems-msg{font-size:12px;color:#4b5f70;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.ems-count{font-size:11px;font-weight:800;background:#f1f5f9;border-radius:999px;padding:4px 7px}.ems-manager{border-right:4px solid #005bff!important}.ems-manager .ems-dot{background:#005bff}
      .ems-chat{padding:8px;background:#f6f8fb;max-height:280px;overflow:auto}.ems-bubble{max-width:88%;padding:8px 10px;border-radius:12px;margin:6px 0;font-size:12px;line-height:1.55;white-space:pre-wrap}.ems-bubble.manager{background:#e8f0ff;margin-left:auto;border-bottom-right-radius:4px}.ems-bubble.employee{background:#eaf8ef;margin-right:auto;border-bottom-left-radius:4px}.ems-bubble small{display:block;color:#72808d;margin-top:4px;font-size:9px}.ems-compose{display:flex;gap:6px;padding:8px;border-top:1px solid #e6edf3;background:#fff}.ems-compose textarea{flex:1;resize:none;min-height:42px;max-height:90px;border:1px solid #ccd8e2;border-radius:10px;padding:8px;font:12px Tahoma;direction:rtl}.ems-compose button{border:0;border-radius:10px;background:#005bff;color:#fff;font-weight:800;padding:0 12px;cursor:pointer}.ems-compose button:disabled{opacity:.5}.ems-send-status{padding:0 10px 8px;font-size:10px;color:#66788a}
      @media(max-width:600px){#employeeManagerStripsV2{right:8px;bottom:8px;width:min(370px,calc(100vw - 16px))}}
    `;(document.head||document.documentElement).appendChild(s);
  }
  function build(){
    if(isAdmin()||!user()||!user().token)return;styles();const old=document.getElementById('trendOpsCoach');if(old)old.style.display='none';if(ui.root)return;
    const d=document.createElement('aside');d.id='employeeManagerStripsV2';d.innerHTML=`
      <div class="ems-panel" data-panel="coach"><div class="ems-panel-head">🤖 المطلوب منك الآن — اسحب اللوحة من هنا</div><div class="ems-list" data-list="coach"></div></div>
      <button class="ems-strip" data-strip="coach" type="button"><span class="ems-dot"></span><span class="ems-main"><div class="ems-title" data-title="coach">🤖 المطلوب منك الآن</div><div class="ems-msg" data-msg="coach">جاري قراءة الشغل...</div></span><span class="ems-count" data-count>0</span></button>
      <div class="ems-panel" data-panel="manager"><div class="ems-panel-head">💬 محادثة مدير التشغيل — اسحب اللوحة من هنا</div><div class="ems-chat" data-chat></div><div class="ems-compose"><textarea data-reply placeholder="اكتب ردك هنا: الشغل واقف عشان... / خلصت الأوردر... / محتاج العميل يرد..."></textarea><button data-send type="button">إرسال</button></div><div class="ems-send-status" data-send-status>ردك يوصل لمدير التشغيل ويتراجع في المتابعة.</div></div>
      <button class="ems-strip ems-manager" data-strip="manager" type="button"><span class="ems-dot"></span><span class="ems-main"><div class="ems-title">💬 مدير التشغيل معاك</div><div class="ems-msg" data-msg="manager">افتح واكتب ردك لو في حاجة موقفاك.</div></span></button>`;
    document.body.appendChild(d);ui.root=d;
    d.querySelectorAll('[data-strip]').forEach(b=>b.addEventListener('click',()=>{const p=d.querySelector('[data-panel="'+b.dataset.strip+'"]');p.classList.toggle('open');}));
    d.querySelector('[data-send]').addEventListener('click',sendReply);
    d.querySelector('[data-reply]').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendReply();}});
    render();refresh({force:true,source:'boot'});ui.timer=setInterval(function(){refresh({source:'interval'});},REFRESH_MS);window.addEventListener('focus',function(){refresh({source:'focus'});});
  }
  function renderConversation(){
    if(!ui.root)return;const chat=ui.root.querySelector('[data-chat]'),c=conversation();
    if(!c.length){chat.innerHTML=`<div class="ems-bubble manager">يا ${esc(name())}، أنا متابع معاك اليوم. لو أوردر واقف أو محتاج قرار اكتب لي هنا.</div>`;return;}
    chat.innerHTML=c.map(n=>{const employee=noteCategory(n)==='ops_reply';return `<div class="ems-bubble ${employee?'employee':'manager'}"><b>${employee?'أنت':'مدير التشغيل'}</b><br>${esc(noteContent(n))}${noteTime(n)?`<small>${esc(noteTime(n))}</small>`:''}</div>`;}).join('');
    chat.scrollTop=chat.scrollHeight;
  }
  async function sendReply(){
    if(ui.sending||!ui.root)return;const input=ui.root.querySelector('[data-reply]'),button=ui.root.querySelector('[data-send]'),status=ui.root.querySelector('[data-send-status]'),content=txt(input.value);if(!content){status.textContent='اكتب ردك الأول.';return;}
    ui.sending=true;button.disabled=true;status.textContent='جاري إرسال ردك...';
    try{
      const stamp=new Date().toISOString();
      await api('saveMatbagyNote',{category:'OPS_REPLY',title:`OPS_REPLY|${name()}|${stamp}`,content:content});
      input.value='';status.textContent='تم إرسال ردك لمدير التشغيل ✅';await refresh({force:true,source:'post-write'});
    }catch(e){status.textContent='تعذر إرسال الرد الآن: '+txt(e.message);}
    finally{ui.sending=false;button.disabled=false;}
  }
  function render(){
    if(!ui.root)return;const m=model(),coach=ui.root.querySelector('[data-strip="coach"]');coach.className='ems-strip '+m.tone;ui.root.querySelector('[data-title="coach"]').textContent=m.title;ui.root.querySelector('[data-msg="coach"]').textContent=m.msg;ui.root.querySelector('[data-count]').textContent=m.overdue.length||m.urgent.length||m.stale.length||m.active.length;
    let html='';const seen=new Set();function add(r,type){if(!r)return;const id=orderId(r);if(seen.has(id+'|'+type))return;seen.add(id+'|'+type);html+=`<div class="ems-item"><div class="ems-command">${esc(commandFor(r,type))}</div><div class="ems-order">أوردر ${esc(id)} • ${esc(customer(r))} • ${esc(r.status||'طلب جديد')}</div></div>`;}
    if(m.primary)add(m.primary,m.primaryType);m.overdue.slice(0,4).forEach(r=>add(r,'overdue'));m.urgent.filter(r=>!m.overdue.includes(r)).slice(0,4).forEach(r=>add(r,'urgent'));m.stale.filter(r=>!m.overdue.includes(r)&&!m.urgent.includes(r)).slice(0,4).forEach(r=>add(r,'stale'));
    if(!html)html=`<div class="ems-item"><div class="ems-command">يا ${esc(name())}، مفيش تنبيه مباشر دلوقتي. راجع الشات والشغل الجديد وخليك محدث الحالات أول بأول.</div></div>`;ui.root.querySelector('[data-list="coach"]').innerHTML=html;
    const note=latestManagerNote(),msg=ui.root.querySelector('[data-msg="manager"]');msg.textContent=note?noteContent(note):`يا ${name()}، لو في حاجة موقفاك افتح المحادثة واكتب لي.`;renderConversation();
  }
  async function refresh(options){
    const opts=options||{};
    if(!user()||!user().token)return {skipped:true,reason:'not-ready'};
    if(document.hidden&&!opts.force)return {skipped:true,reason:'hidden'};
    if(ui.busy)return {skipped:true,reason:'in-flight'};
    if(!opts.force&&ui.lastRefreshAt&&Date.now()-ui.lastRefreshAt<MIN_REFRESH_MS)return {skipped:true,reason:'min-interval'};
    const task=async function(){
      ui.busy=true;ui.lastRefreshAt=Date.now();
      try{
        const out=await Promise.all([api('getRows',{screen:screen()}),api('getMatbagyNotes',{employee:name(),limit:50})]);
        const r=out[0]||{},n=out[1]||{};
        if(r.success!==false)ui.rows=Array.isArray(r.rows)?r.rows:[];
        if(n.success!==false)ui.notes=Array.isArray(n.notes)?n.notes:[];
        ui.lastOk=Date.now();render();return {success:true};
      }catch(e){
        if(ui.root){ui.root.querySelector('[data-msg="coach"]').textContent=`يا ${name()}، المتابعة موجودة لكن البيانات ما اتحدثتش دلوقتي.`;ui.root.querySelector('[data-msg="manager"]').textContent='المحادثة موجودة — هنحاول التحديث تلقائيًا.';}
        return {success:false,message:txt(e&&e.message||e)};
      }finally{ui.busy=false;}
    };
    if(window.TrendPollCoordinatorV1&&typeof window.TrendPollCoordinatorV1.run==='function')return window.TrendPollCoordinatorV1.run('employee-manager',task,{minIntervalMs:MIN_REFRESH_MS,force:!!opts.force});
    return task();
  }
  window.TrendEmployeeManagerStripsV2={refresh:refresh};
  const t=setInterval(()=>{if(user()&&user().token){clearInterval(t);build();}},400);
})();
