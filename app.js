(function(){
  'use strict';

  var BUILD = window.TREND_BUILD || 'TrendOS V1884 Data Normalizer Production';
  var API_URL = String(window.TREND_API_URL || window.API_URL || '').trim();
  var app = document.getElementById('app');
  var state = {
    user:null,
    active:'home',
    data:{customers:[],orders:[],lines:[],notes:[],audit:[]},
    loading:false,
    orderSaving:false,
    message:''
  };

  var ROLES = {
    admin:{label:'مدير كامل',screens:['home','orders','customers','invoices','notes','links','settings']},
    sales:{label:'مبيعات',screens:['home','orders','customers','invoices','notes','links']},
    print:{label:'قسم الطباعة',screens:['home','orders','notes','links']},
    laser:{label:'قسم الليزر',screens:['home','orders','notes','links']}
  };
  var USERS_FALLBACK = [
    {name:'ضياء',username:'diaa',password:'1234',role:'admin',department:'مشترك'},
    {name:'رحمه',username:'rahma',password:'1234',role:'sales',department:'مبيعات'},
    {name:'ريفان',username:'revan',password:'1234',role:'sales',department:'مبيعات'},
    {name:'وائل',username:'wael',password:'1234',role:'print',department:'طباعة'},
    {name:'جابر',username:'gaber',password:'1234',role:'laser',department:'ليزر'}
  ];

  function $(id){ return document.getElementById(id); }
  function text(v){ return (v===undefined || v===null) ? '' : String(v); }
  function loginKey(v){ return text(v).trim().replace(/[ـ\u064B-\u065F\u0670]/g,'').replace(/[إأآا]/g,'ا').replace(/[ةه]$/,'ه').replace(/\s+/g,' ').toLowerCase(); }
  function esc(v){ return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function num(v){ var n = Number(String(v||0).replace(/,/g,'')); return isFinite(n)?n:0; }
  function money(v){ return num(v).toLocaleString('ar-EG',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function pick(row, keys){ row=row||{}; for(var i=0;i<keys.length;i++){ var v=row[keys[i]]; if(v!==undefined && v!==null && text(v).trim()!=='') return v; } return ''; }
  function closedStatus(s){ s=text(s).trim(); return ['تم التسليم','ملغي','ملغى','مغلق','مقفل','مدمج في أوردر مفتوح','merged'].indexOf(s)>=0; }
  function normalizeCustomerRow(r){
    var name = pick(r,['name','customerName','اسم الشات / المكتب','اسم العميل','Customer Name']);
    var phone = pick(r,['phone','mobile','customerPhone','رقم العميل الأساسي','رقم الهاتف','Phone','رقم العميل']);
    return Object.assign({}, r, {id:text(pick(r,['id','كود العميل','ID'])||phone||name), name:text(name), customerName:text(name), phone:text(phone), mobile:text(phone), type:text(pick(r,['type','نوع العميل','Customer Type'])), balance:num(pick(r,['balance','رصيد العميل','رصيد العميل.1','مديونية حالية','مديونية','الرصيد الحالي'])), openOrders:num(pick(r,['openOrders','أوردر مفتوح','أوردرات مفتوحة'])), notes:text(pick(r,['notes','ملاحظات']))});
  }
  function normalizeOrderRow(r){
    var status=text(pick(r,['status','الحالة العامة','الحالة']))||'طلب جديد';
    var oid=pick(r,['id','orderId','رقم الأوردر','كود الأوردر']);
    var name=pick(r,['customerName','اسم الشات / المكتب','اسم العميل']);
    var phone=pick(r,['customerPhone','phone','رقم العميل الأساسي','رقم الهاتف','رقم العميل']);
    var explicit=pick(r,['open']);
    var open= explicit!=='' ? truth(explicit) && !closedStatus(status) : !closedStatus(status);
    return Object.assign({}, r, {id:text(oid),orderId:text(oid),customerName:text(name),customerPhone:text(phone),department:text(pick(r,['department','القسم الرئيسي','القسم']))||'مشترك',status:status,open:open,notes:text(pick(r,['notes','ملاحظات','ملاحظات العميل'])),firstCreatedAt:pick(r,['firstCreatedAt','تاريخ الإنشاء','timestamp','وقت التسجيل']),lastAdditionAt:pick(r,['lastAdditionAt','آخر تحديث','updatedAt','وقت التسجيل','timestamp']),updatedAt:pick(r,['updatedAt','آخر تحديث','timestamp'])});
  }
  function normalizeLineRow(r){
    var oid=pick(r,['orderId','رقم الأوردر','كود الأوردر']);
    var lid=pick(r,['id','lineId','رقم البند']);
    var item=pick(r,['itemName','name','اسم البند / نوع الشغل','اسم البند','نوع الشغل الأصلي','اللي اتعمل فعليًا','وصف مختصر']);
    var name=pick(r,['customerName','اسم الشات / المكتب','اسم العميل']);
    var phone=pick(r,['customerPhone','phone','رقم العميل الأساسي','رقم الهاتف','رقم العميل']);
    var status=text(pick(r,['status','الحالة','حالة التقفيل','حالة الفوترة']))||'طلب جديد';
    var sale=num(pick(r,['sale','price','سعر البيع','سعر ضياء','سعر النظام','الإجمالي','total']));
    return Object.assign({}, r, {id:text(lid|| (oid?oid+'-01':'')),lineId:text(lid),orderId:text(oid),customerName:text(name),customerPhone:text(phone),department:text(pick(r,['department','القسم','قسم الصنف']))||'مشترك',itemName:text(item),name:text(item),qty:num(pick(r,['qty','الكمية'])||1),status:status,price:sale,sale:sale,total:num(pick(r,['total','الإجمالي']))||sale,notes:text(pick(r,['notes','ملاحظات','ملاحظات القسم','ملاحظات العميل'])),createdBy:text(pick(r,['createdBy','مسجل بواسطة','مسؤول القسم','تم الإرسال بواسطة'])),shared:text(pick(r,['shared','بند مشترك','مشترك']))});
  }
  function normalizeNoteRow(r){ return Object.assign({},r,{scope:text(pick(r,['scope','القسم','النطاق']))||'الجميع',priority:text(pick(r,['priority','الأولوية','العنوان']))||'عادي',note:text(pick(r,['note','النوت','ملاحظات','text'])),createdBy:text(pick(r,['createdBy','حفظ بواسطة','مسجل بواسطة','بواسطة'])),timestamp:pick(r,['timestamp','وقت الحفظ','وقت التسجيل','آخر تحديث'])}); }
  function now(){ return new Date().toLocaleString('ar-EG'); }
  function dateObj(v){ var d = v instanceof Date ? v : new Date(v); return isFinite(d.getTime()) ? d : null; }
  function dateKey(v){ var d = dateObj(v); return d ? d.toISOString().slice(0,10) : ''; }
  function prettyDate(v){ var d = dateObj(v); return d ? d.toLocaleDateString('ar-EG') : ''; }
  function isOpenOrder(o){ var st=text(o.status).trim(); return truth(o.open)!==false && ['تم التسليم','ملغي','ملغى','مغلق','مقفل','مدمج في أوردر مفتوح'].indexOf(st)<0; }
  function role(){ return (state.user && state.user.role) || 'sales'; }
  function isAdmin(){ return role()==='admin'; }
  function userDept(){ return state.user && (state.user.department || (role()==='print'?'طباعة':role()==='laser'?'ليزر':'مشترك')); }
  function can(screen){ return (ROLES[role()]||ROLES.sales).screens.indexOf(screen) >= 0; }
  function setMsg(m,bad){ state.message = m ? '<div class="notice '+(bad?'bad':'')+'">'+esc(m)+'</div>' : ''; render(); }
  function q(obj){ var p=new URLSearchParams(); Object.keys(obj||{}).forEach(function(k){ if(obj[k]!==undefined && obj[k]!==null) p.set(k, obj[k]); }); return p.toString(); }

  function api(action, data){
    data = data || {};
    if(!API_URL) return Promise.reject(new Error('رابط السيرفر غير مضبوط في config.js'));
    return new Promise(function(resolve,reject){
      var cb = 'TRENDOS_CLEAN_' + Date.now() + '_' + Math.floor(Math.random()*99999);
      var done = false;
      var script = document.createElement('script');
      function clean(){
        if(done) return; done = true;
        try{ delete window[cb]; }catch(e){ window[cb]=undefined; }
        if(script.parentNode) script.parentNode.removeChild(script);
      }
      window[cb] = function(res){ clean(); resolve(res || {}); };
      script.onerror = function(){ clean(); reject(new Error('فشل الاتصال بالسيرفر')); };
      script.src = API_URL + (API_URL.indexOf('?')>=0?'&':'?') + q(Object.assign({}, data, {action:action, callback:cb, _t:Date.now()}));
      document.body.appendChild(script);
      window.setTimeout(function(){ if(!done){ clean(); reject(new Error('انتهت مهلة الاتصال بالسيرفر')); } }, 22000);
    });
  }

  function localLogin(username,password){
    var k = loginKey(username);
    var pass = text(password).trim();
    return USERS_FALLBACK.find(function(u){
      var same = loginKey(u.username)===k || loginKey(u.name)===k;
      var passOk = !u.password || !pass || u.password===pass;
      return same && passOk;
    });
  }

  function login(){
    var username = text($('loginUser') && $('loginUser').value).trim();
    var password = text($('loginPass') && $('loginPass').value).trim();
    if(!username){ showLogin('اكتب اسم المستخدم أو اضغط على اسم من الأزرار السريعة.'); return; }
    var btn = app.querySelector('#loginBtn');
    if(btn) btn.disabled = true;

    // V1884: دخول المستخدمين الداخليين محليًا أولًا حتى لو رابط السيرفر واقع أو لم يتم نشر Apps Script بعد.
    // الربط بالشيت يتم بعد فتح الواجهة من زر تحديث البيانات أو بعد أي حفظ فعلي.
    var local = localLogin(username,password);
    if(local){
      state.user = normalizeUser(local);
      state.active = 'home';
      render();
      refreshData(true);
      return;
    }

    if(API_URL){
      api('login',{username:username,password:password,app:'TrendOS'}).then(function(res){
        if(!res.success) throw new Error(res.message || 'بيانات الدخول غير صحيحة');
        state.user = normalizeUser(res.user || res);
        state.active = 'home';
        render();
        return refreshData(false);
      }).catch(function(e){
        showLogin((e.message || 'تعذر الدخول') + ' — جرّب الاسم العربي: ضياء / رحمه / ريفان / وائل / جابر أو كلمة المرور 1234.');
      });
    } else {
      showLogin('رابط السيرفر غير مضبوط، واسم المستخدم غير موجود ضمن مستخدمي التشغيل الداخليين.');
    }
  }
  function normalizeUser(u){
    var name = text(u.name || u.fullName || u.username || 'مستخدم');
    var rawRole = text(u.role || u.mode || '').toLowerCase();
    var roleName = rawRole.indexOf('admin')>=0 || rawRole==='full' || name==='ضياء' ? 'admin' : rawRole.indexOf('print')>=0 || name==='وائل' ? 'print' : rawRole.indexOf('laser')>=0 || name==='جابر' ? 'laser' : 'sales';
    return {name:name,username:text(u.username||name),role:roleName,department:text(u.department || (roleName==='print'?'طباعة':roleName==='laser'?'ليزر':roleName==='sales'?'مبيعات':'مشترك')),permissions:u.permissions||''};
  }
  function showLogin(error){
    app.innerHTML = '<div class="loginShell"><div class="loginCard">'+
      '<div class="brand"><div class="logo">م</div><div><h1 style="margin:0">TrendOS مطبعجي</h1><div class="muted">'+esc(BUILD)+'</div></div></div>'+
      (error?'<div class="notice bad">'+esc(error)+'</div>':'')+
      '<div class="field"><label>اسم المستخدم</label><input id="loginUser" autocomplete="username" placeholder="ضياء / رحمه / ريفان / وائل / جابر"></div>'+
      '<div class="field"><label>كلمة المرور</label><input id="loginPass" type="password" autocomplete="current-password"></div>'+
      '<button id="loginBtn" class="btn" style="width:100%">دخول</button>'+
      '<div class="actions" style="margin-top:10px;justify-content:center"><button type="button" class="btn small ghost" data-login="ضياء">ضياء</button><button type="button" class="btn small ghost" data-login="رحمه">رحمه</button><button type="button" class="btn small ghost" data-login="ريفان">ريفان</button><button type="button" class="btn small ghost" data-login="وائل">وائل</button><button type="button" class="btn small ghost" data-login="جابر">جابر</button></div>'+
      '<p class="muted" style="font-size:12px">زر الدخول يعمل بالماوس وبزر Enter. كلمة المرور الافتراضية: فارغة أو 1234. أزرار الأسماء تفتح محليًا حتى لو السيرفر لا يرد.</p>'+
      '</div></div>';
    $('loginBtn').onclick = login;
    Array.prototype.forEach.call(app.querySelectorAll('[data-login]'), function(b){ b.onclick=function(){ $('loginUser').value=b.getAttribute('data-login'); $('loginPass').value=''; login(); }; });
    ['loginUser','loginPass'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('keydown',function(ev){ if(ev.key==='Enter') login(); }); });
    var first=$('loginUser'); if(first) first.focus();
  }

  function refreshData(silent){
    if(!state.user) return Promise.resolve();
    state.loading = true;
    if(!silent) render();
    if(!API_URL){
      state.loading=false;
      if(!silent) setMsg('تم فتح الواجهة بدون رابط سيرفر. اضبط config.js للربط بالشيت.', true);
      return Promise.resolve();
    }
    return api('getTrendOSData',{username:state.user.username,role:state.user.role,department:state.user.department}).then(function(res){
      if(!res.success) throw new Error(res.message || 'تعذر تحميل البيانات');
      state.data.customers = (Array.isArray(res.customers)?res.customers:[]).map(normalizeCustomerRow).filter(function(c){return text(c.name)||text(c.phone);});
      state.data.orders = (Array.isArray(res.orders)?res.orders:[]).map(normalizeOrderRow).filter(function(o){return text(o.id)||text(o.customerName);});
      state.data.lines = (Array.isArray(res.lines)?res.lines:[]).map(normalizeLineRow).filter(function(l){return text(l.orderId)||text(l.customerName)||text(l.itemName);});
      state.data.notes = (Array.isArray(res.notes)?res.notes:[]).map(normalizeNoteRow);
      state.data.audit = Array.isArray(res.audit)?res.audit:[];
      state.loading=false;
      if(!silent) setMsg('تم تحديث البيانات يدويًا: '+now()); else render();
    }).catch(function(e){ state.loading=false; setMsg(e.message || 'خطأ في تحميل البيانات', true); });
  }
  function manualAppRefresh(){ window.location.reload(); }
  function openUrl(kind){
    var map = {
      easy: window.TREND_EASYSTORE_URL,
      files: window.TREND_FILES_URL,
      sheets: window.TREND_SHEETS_URL,
      route: window.TREND_ROUTE_URL
    };
    var url = text(map[kind]).trim();
    if(!url || url === 'AUTO_FROM_BACKEND'){ alert('الرابط غير مضبوط في config.js'); return; }
    window.open(url,'_blank','noopener');
  }
  function openSheetsAuto(){
    var url = text(window.TREND_SHEETS_URL).trim();
    if(url && url !== 'AUTO_FROM_BACKEND'){ window.open(url,'_blank','noopener'); return; }
    if(!API_URL){ alert('رابط السيرفر غير مضبوط، ولا يمكن جلب رابط الشيت تلقائيًا.'); return; }
    var win = null;
    try { win = window.open('', '_blank'); if(win) win.document.write('<title>شيتات مطبعجي</title><p style="font-family:Arial;direction:rtl">جار فتح شيتات مطبعجي...</p>'); } catch(e) {}
    api('getSheetInfo', {username: state.user && state.user.username}).then(function(res){
      if(!res.success || !res.url) throw new Error(res.message || 'لم يتم العثور على رابط Google Sheet من السيرفر.');
      if(win) win.location.href = res.url; else window.open(res.url,'_blank','noopener');
    }).catch(function(e){
      if(win) win.close();
      alert(e.message || 'تعذر فتح شيتات مطبعجي');
    });
  }

  function nav(){
    var tabs = [
      ['home','الرئيسية'],['orders','الأوردرات'],['customers','العملاء'],['invoices','الفواتير'],['notes','نوت مطبعجي'],['links','ملفات وشيتات'],['settings','تهيئة']
    ].filter(function(t){ return can(t[0]); });
    return '<div class="tabs">'+tabs.map(function(t){ return '<button class="tab '+(state.active===t[0]?'active':'')+'" data-tab="'+t[0]+'">'+t[1]+'</button>'; }).join('')+'</div>';
  }

  function render(){
    if(!state.user){ showLogin(); return; }
    var screen = screenHtml();
    app.innerHTML = '<div class="topbar"><div class="topInner"><div class="brand" style="margin:0"><div class="logo">م</div><div><b>TrendOS منصة مطبعجي الأم</b><div class="muted">'+esc(BUILD)+'</div></div></div><div class="topActions"><span class="userBadge">'+esc(state.user.name)+' • '+esc((ROLES[role()]||{}).label||role())+'</span><button class="btn ghost" id="manualRefreshBtn">تحديث البيانات</button><button class="btn secondary" id="programRefreshBtn">تحديث البرنامج</button><button class="btn" id="easyBtn">EasyStore / برنامج الحسابات</button><button class="btn secondary" id="logoutBtn">خروج</button></div></div></div>'+
      '<main class="wrap">'+state.message+(state.loading?'<div class="notice">جار تحميل البيانات...</div>':'')+nav()+screen+'<div class="footerHint">'+esc(BUILD)+' — تحديث يدوي فقط بعد زر تحديث أو بعد حفظ فعلي.</div></main>'+noteModal();
    bindMain();
  }
  function bindMain(){
    document.querySelectorAll('[data-tab]').forEach(function(b){ b.onclick=function(){ state.active=b.getAttribute('data-tab'); state.message=''; render(); }; });
    var r=$('manualRefreshBtn'); if(r) r.onclick=function(){ refreshData(false); };
    var pr=$('programRefreshBtn'); if(pr) pr.onclick=manualAppRefresh;
    var e=$('easyBtn'); if(e) e.onclick=function(){ openUrl('easy'); };
    var lo=$('logoutBtn'); if(lo) lo.onclick=function(){ state.user=null; showLogin(); };
    bindScreen();
  }

  function screenHtml(){
    if(state.active==='orders') return screenOrders();
    if(state.active==='customers') return screenCustomers();
    if(state.active==='invoices') return screenInvoices();
    if(state.active==='notes') return screenNotes();
    if(state.active==='links') return screenLinks();
    if(state.active==='settings') return screenSettings();
    return screenHome();
  }
  function countOpenOrders(){ return (state.data.orders||[]).filter(function(o){ return truth(o.open)!==false && text(o.status)!=='تم التسليم' && text(o.status)!=='ملغى'; }).length; }
  function truth(v){ if(v===false) return false; var s=text(v).toLowerCase(); return !(s==='false'||s==='0'||s==='no'||s==='مغلق'); }
  function screenHome(){
    var dept = userDept();
    var visibleLines = filterByRole(state.data.lines||[]);
    return '<div class="grid four"><div class="card"><h3>العملاء</h3><div class="pill">'+(state.data.customers||[]).length+' عميل</div></div><div class="card"><h3>الأوردرات المفتوحة</h3><div class="pill warn">'+countOpenOrders()+' أوردر</div></div><div class="card"><h3>بنود القسم</h3><div class="pill">'+visibleLines.length+' بند</div></div><div class="card"><h3>القسم</h3><div class="pill">'+esc(dept)+'</div></div></div>'+
      '<div class="card"><div class="sectionTitle"><h2>أهم أزرار الربط</h2><span class="muted">كلها تنفيذ مباشر بدون تحميل بديل</span></div><div class="actions"><button class="btn" onclick="TrendOS.openEasy()">برنامج الحسابات</button><button class="btn secondary" onclick="TrendOS.openNotes()">نوت مطبعجي</button><button class="btn secondary" onclick="TrendOS.openFiles()">ملفات مطبعجي</button><button class="btn secondary" onclick="TrendOS.openSheets()">شيتات مطبعجي</button><button class="btn secondary" onclick="TrendOS.openRoute()">روتيت مطبعجي</button></div></div>'+
      '<div class="card"><h2>آخر بنود التشغيل</h2>'+linesTable(visibleLines.slice(0,12))+'</div>';
  }
  function filterByRole(rows){
    if(isAdmin() || role()==='sales') return rows;
    var dept = userDept();
    return (rows||[]).filter(function(r){ return text(r.department||r['القسم'])===dept || text(r.shared||r['مشترك'])==='true' || text(r.department)==='مشترك'; });
  }
  function linesTable(rows){
    if(!rows || !rows.length) return '<div class="empty">لا توجد بنود ظاهرة لهذا المستخدم.</div>';
    return '<div class="tableWrap"><table><thead><tr><th>الأوردر</th><th>العميل</th><th>القسم</th><th>البند</th><th>الحالة</th><th>السعر</th><th>تنفيذ</th></tr></thead><tbody>'+rows.map(function(r,i){
      return '<tr><td>'+esc(r.orderId||r.id||'')+'</td><td>'+esc(r.customerName||'')+'</td><td>'+esc(r.department||'')+'</td><td>'+esc(r.itemName||r.name||'')+'</td><td><span class="status '+(text(r.status)==='تم التسليم'?'ok':'')+'">'+esc(r.status||'طلب جديد')+'</span></td><td>'+money(r.sale||r.price||0)+'</td><td><select data-line-status="'+esc(r.id||r.lineId||'')+'"><option>طلب جديد</option><option>بدأ التنفيذ</option><option>تحت التنفيذ</option><option>جاهز للاستلام</option><option>تم التسليم</option><option>متوقف</option><option>ملغى</option></select></td></tr>';
    }).join('')+'</tbody></table></div>';
  }
  function screenOrders(){
    return '<div class="card"><div class="sectionTitle"><h2>الأوردرات وبنود التشغيل</h2><button class="btn secondary" id="newOrderToggle">إضافة أوردر يدوي</button></div><div id="newOrderBox" style="display:none">'+newOrderForm()+'</div>'+linesTable(filterByRole(state.data.lines||[]))+'</div>';
  }
  function newOrderForm(){
    if(!(isAdmin() || role()==='sales')) return '<div class="empty">إضافة الأوردرات متاحة للمبيعات والإدارة فقط.</div>';
    return '<div class="softBox"><div class="grid four"><div class="field"><label>العميل</label><input id="ordCustomer" list="customersList" placeholder="اكتب اسم العميل"></div><div class="field"><label>رقم العميل</label><input id="ordPhone"></div><div class="field"><label>القسم</label><select id="ordDept"><option>طباعة</option><option>ليزر</option><option>مشترك</option></select></div><div class="field"><label>البند</label><input id="ordItem"></div></div><div id="orderOpenHint"></div><div class="field"><label>ملاحظات</label><textarea id="ordNotes"></textarea></div><button class="btn" id="saveOrderBtn">حفظ الأوردر</button><datalist id="customersList">'+(state.data.customers||[]).map(function(c){return '<option value="'+esc(c.name||c.customerName||'')+'">'+esc(c.phone||'')+'</option>';}).join('')+'</datalist></div>';
  }
  function screenCustomers(){
    if(!can('customers')) return '<div class="empty">غير مصرح.</div>';
    var rows = state.data.customers||[];
    return '<div class="card"><div class="sectionTitle"><h2>العملاء</h2><span class="pill">'+rows.length+' عميل</span></div><div class="grid three"><div class="field"><label>اختيار/بحث عميل</label><input id="customerSearch" list="customersList2" placeholder="اكتب الاسم أو الهاتف"></div><div class="field"><label>هاتف جديد</label><input id="newCustomerPhone"></div><div class="field"><label>نوع / مسؤول</label><input id="newCustomerType"></div></div><button class="btn" id="saveCustomerBtn">حفظ / تحديث العميل</button><datalist id="customersList2">'+rows.map(function(c){ return '<option value="'+esc(c.name||c.customerName||'')+'">'+esc(c.phone||'')+'</option>'; }).join('')+'</datalist><div id="customerContext"></div>'+customersTable(rows)+'</div>';
  }
  function customersTable(rows){
    if(!rows.length) return '<div class="empty">لا يوجد عملاء.</div>';
    return '<div class="tableWrap"><table><thead><tr><th>العميل</th><th>الهاتف</th><th>الرصيد</th><th>أوردرات مفتوحة</th></tr></thead><tbody>'+rows.map(function(c){ var open=openOrdersFor(c).length; return '<tr><td>'+esc(c.name||c.customerName||'')+'</td><td>'+esc(c.phone||c.mobile||'')+'</td><td>'+money(c.balance||0)+'</td><td>'+(open?'<span class="pill warn">'+open+'</span>':'0')+'</td></tr>'; }).join('')+'</tbody></table></div>';
  }
  function openOrdersFor(c){ var name=text(c.name||c.customerName); var phone=text(c.phone||c.mobile); return (state.data.orders||[]).filter(function(o){ return truth(o.open)!==false && (text(o.customerName)===name || (phone && text(o.customerPhone)===phone)); }); }
  function screenInvoices(){
    if(!can('invoices')) return '<div class="empty">غير مصرح.</div>';
    return '<div class="card"><h2>الفواتير</h2><p class="muted">الفاتورة النهائية تتم من EasyStore، وهذا الزر يفتح البرنامج المرتبط مباشرة.</p><button class="btn" onclick="TrendOS.openEasy()">فتح فاتورة المبيعات في EasyStore</button></div>';
  }
  function screenNotes(){
    var rows = state.data.notes||[];
    return '<div class="card"><div class="sectionTitle"><h2>نوت مطبعجي</h2><button class="btn" id="openNoteWriter">إضافة نوت</button></div>'+notesList(rows)+'</div>';
  }
  function notesList(rows){ if(!rows.length) return '<div class="empty">لا توجد نوتات.</div>'; return rows.map(function(n){ return '<div class="noteItem"><b>'+esc(n.scope||'الجميع')+'</b><p>'+esc(n.note||n.text||'')+'</p><div class="muted">'+esc(n.createdBy||'')+' • '+esc(n.timestamp||n.date||'')+'</div></div>'; }).join(''); }
  function noteModal(){
    return '<div id="noteModal" class="drawer hidden"><div class="modal"><div class="sectionTitle"><h2>نوت مطبعجي</h2><button class="btn secondary" id="closeNoteModal">إغلاق</button></div><div class="grid two"><div class="field"><label>النطاق</label><select id="noteScope"><option>الجميع</option><option>قسم الطباعة</option><option>قسم الليزر</option><option>رحمه وريفان</option><option>نوت خاصة بى</option></select></div><div class="field"><label>تنبيه</label><select id="notePriority"><option>عادي</option><option>مهم</option><option>عاجل</option></select></div></div><div class="field"><label>النوت</label><textarea id="noteText"></textarea></div><button class="btn" id="saveNoteBtn">حفظ النوت</button></div></div>';
  }
  function screenLinks(){
    return '<div class="grid three"><div class="card"><h2>EasyStore</h2><p class="muted">برنامج الحسابات والفواتير.</p><button class="btn" onclick="TrendOS.openEasy()">فتح</button></div><div class="card"><h2>ملفات مطبعجي</h2><p class="muted">رابط ملفات التشغيل على السيرفر أو Cloudflare.</p><button class="btn secondary" onclick="TrendOS.openFiles()">فتح</button></div><div class="card"><h2>شيتات مطبعجي</h2><p class="muted">Google Sheets المرتبطة.</p><button class="btn secondary" onclick="TrendOS.openSheets()">فتح</button></div><div class="card"><h2>روتيت مطبعجي</h2><p class="muted">رابط الراوتر/المسارات إن وجد.</p><button class="btn secondary" onclick="TrendOS.openRoute()">فتح</button></div></div>';
  }
  function screenSettings(){
    if(!isAdmin()) return '<div class="empty">زر التهيئة ظاهر لضياء فقط.</div>';
    return '<div class="card"><h2>تهيئة وربط</h2><div class="notice">تهيئة وضع الصفر الخاصة بالحسابات موجودة داخل EasyStore فقط حتى لا تختلط مع TrendOS.</div><button class="btn" onclick="TrendOS.openEasy()">فتح إعدادات EasyStore</button></div>';
  }
  function bindScreen(){
    document.querySelectorAll('[data-line-status]').forEach(function(sel){
      sel.onchange=function(){ updateLineStatus(sel.getAttribute('data-line-status'), sel.value); };
    });
    var tog=$('newOrderToggle'); if(tog) tog.onclick=function(){ var box=$('newOrderBox'); if(box) box.style.display = box.style.display==='none'?'block':'none'; };
    var saveO=$('saveOrderBtn'); if(saveO) saveO.onclick=saveOrder;
    ['ordCustomer','ordPhone','ordItem'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('input', renderOrderOpenHint); });
    renderOrderOpenHint();
    var saveC=$('saveCustomerBtn'); if(saveC) saveC.onclick=saveCustomer;
    var search=$('customerSearch'); if(search) search.oninput=showCustomerContext;
    var openN=$('openNoteWriter'); if(openN) openN.onclick=openNoteModal;
    var closeN=$('closeNoteModal'); if(closeN) closeN.onclick=closeNoteModal;
    var saveN=$('saveNoteBtn'); if(saveN) saveN.onclick=saveNote;
  }
  function updateLineStatus(id,status){
    if(!id){ setMsg('لا يوجد رقم بند للتحديث.',true); return; }
    api('updateLineStatus',{id:id,status:status,username:state.user.username}).then(function(res){ if(!res.success) throw new Error(res.message||'لم يتم الحفظ'); return refreshData(true); }).then(function(){ setMsg('تم تحديث الحالة.'); }).catch(function(e){ setMsg(e.message,true); });
  }
  function saveOrder(){
    if(state.orderSaving) return;
    var customer=text($('ordCustomer') && $('ordCustomer').value).trim();
    var phone=text($('ordPhone') && $('ordPhone').value).trim();
    var dept=text($('ordDept') && $('ordDept').value).trim();
    var item=text($('ordItem') && $('ordItem').value).trim();
    var notes=text($('ordNotes') && $('ordNotes').value).trim();
    if(!customer || !item){ setMsg('اكتب اسم العميل والبند.',true); return; }
    var btn=$('saveOrderBtn');
    state.orderSaving = true;
    if(btn){ btn.disabled=true; btn.textContent='جار الحفظ...'; }
    api('createManualOrder',{customerName:customer,customerPhone:phone,department:dept,itemName:item,notes:notes,username:state.user.username,role:state.user.role,departmentUser:state.user.department}).then(function(res){
      if(!res.success) throw new Error(res.message||'لم يتم الحفظ');
      return refreshData(true).then(function(){ return res; });
    }).then(function(res){
      setMsg(res.message || 'تم حفظ الأوردر بدون تكرار.');
    }).catch(function(e){
      setMsg(e.message,true);
    }).then(function(){
      state.orderSaving=false;
      var b=$('saveOrderBtn'); if(b){ b.disabled=false; b.textContent='حفظ الأوردر'; }
    });
  }
  function renderOrderOpenHint(){
    var box=$('orderOpenHint'); if(!box) return;
    var customer=text($('ordCustomer') && $('ordCustomer').value).trim();
    var phone=text($('ordPhone') && $('ordPhone').value).trim();
    if(!customer && !phone){ box.innerHTML=''; return; }
    var c=(state.data.customers||[]).find(function(x){ return (customer && text(x.name||x.customerName)===customer) || (phone && text(x.phone||x.mobile)===phone); });
    if(c && !phone && $('ordPhone')) $('ordPhone').value=text(c.phone||c.mobile||'');
    var open=(state.data.orders||[]).filter(function(o){
      return isOpenOrder(o) && ((customer && text(o.customerName)===customer) || (phone && text(o.customerPhone)===phone));
    });
    if(!open.length){ box.innerHTML='<div class="notice">لا يوجد أوردر مفتوح لهذا العميل في البيانات المحملة. سيتم إنشاء أوردر جديد.</div>'; return; }
    var o=open[0];
    var last=o.lastAdditionAt || o.updatedAt || o.timestamp || o.firstCreatedAt;
    var same=dateKey(last)===dateKey(new Date());
    box.innerHTML='<div class="notice '+(same?'':'bad')+'">تنبيه: هذا العميل له أوردر مفتوح '+(same?'اليوم':'من تاريخ '+esc(prettyDate(last)))+' — عند الحفظ سيستخدم البرنامج نفس الأوردر ولن ينشئ أوردر ثاني.</div>';
  }
  function saveCustomer(){
    var name=text($('customerSearch').value).trim(); var phone=text($('newCustomerPhone').value).trim(); var type=text($('newCustomerType').value).trim();
    if(!name){ setMsg('اكتب اسم العميل.',true); return; }
    api('saveCustomer',{name:name,phone:phone,type:type,username:state.user.username}).then(function(res){ if(!res.success) throw new Error(res.message||'لم يتم الحفظ'); return refreshData(true); }).then(function(){ setMsg('تم حفظ العميل.'); }).catch(function(e){ setMsg(e.message,true); });
  }
  function showCustomerContext(){
    var v=text($('customerSearch').value).trim(); var box=$('customerContext'); if(!box) return; if(!v){ box.innerHTML=''; return; }
    var c=(state.data.customers||[]).find(function(x){ return text(x.name||x.customerName)===v || text(x.phone||x.mobile)===v; });
    if(!c){ box.innerHTML='<div class="notice">عميل جديد. سيتم حفظه عند الضغط على زر الحفظ.</div>'; return; }
    var open=openOrdersFor(c); if($('newCustomerPhone')) $('newCustomerPhone').value=text(c.phone||c.mobile||''); if($('newCustomerType')) $('newCustomerType').value=text(c.type||'');
    box.innerHTML='<div class="notice '+(open.length?'bad':'')+'">الرصيد الحالي: '+money(c.balance||0)+' — الأوردرات المفتوحة: '+open.length+'</div>';
  }
  function openNoteModal(){ var m=$('noteModal'); if(m) m.classList.remove('hidden'); }
  function closeNoteModal(){ var m=$('noteModal'); if(m) m.classList.add('hidden'); }
  function saveNote(){
    var note=text($('noteText').value).trim(); if(!note){ alert('اكتب النوت.'); return; }
    api('saveMatbagyNote',{note:note,scope:text($('noteScope').value),priority:text($('notePriority').value),createdBy:state.user.name,username:state.user.username}).then(function(res){ if(!res.success) throw new Error(res.message||'لم يتم الحفظ'); closeNoteModal(); return refreshData(true); }).then(function(){ setMsg('تم حفظ النوت.'); }).catch(function(e){ setMsg(e.message,true); });
  }

  window.TrendOS = {
    refresh:function(){ refreshData(false); },
    openEasy:function(){ openUrl('easy'); },
    openNotes:function(){ state.active='notes'; render(); openNoteModal(); },
    openFiles:function(){ openUrl('files'); },
    openSheets:function(){ openSheetsAuto(); },
    openRoute:function(){ openUrl('route'); }
  };

  document.addEventListener('DOMContentLoaded',function(){ render(); });
  if(document.readyState !== 'loading') render();
})();
