/* TrendOS V1875 Main Boot Rescue - opens main workspace after login even if init/render crashes */
(function(){
  'use strict';
  var VERSION = 'TrendOS V1875 Main Boot Rescue';
  window.MATBAGY_TRENDOS_BOOT_RESCUE_VERSION = VERSION;

  function $(id){ return document.getElementById(id); }
  function txt(v){ return String(v == null ? '' : v).trim(); }
  function norm(v){ return txt(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/[ؤ]/g,'و').replace(/[ئ]/g,'ي').replace(/[\u064B-\u065F]/g,''); }
  function show(el){ if(el) el.classList.remove('hidden'); }
  function hide(el){ if(el) el.classList.add('hidden'); }
  function setMsg(msg, bad){
    var el = $('loginMsg');
    if(!el) return;
    el.textContent = msg || '';
    el.classList.toggle('error', !!bad);
    el.classList.toggle('ok', !!msg && !bad);
  }
  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  window.addEventListener('error', function(e){
    try{
      console.warn('[TrendOS V1875 rescued error]', e.message, e.filename, e.lineno);
      var el = $('liveStatus') || $('loginMsg');
      if(el && /Syntax|Reference|Type|Script/i.test(e.message || '')){
        el.textContent = 'تم منع خطأ في الواجهة، والبرنامج سيعمل بوضع الإنقاذ V1875.';
        el.classList.add('ok');
      }
    }catch(x){}
  }, true);

  function roleInfo(name, role){
    var n = norm([name, role].join(' '));
    if(/ضياء|diaa|admin|اداره|ادارة/.test(n)) return {role:'admin', dept:'إدارة', screens:['service','print','laser']};
    if(/رحمه|رحمة|rahma|ريفان|ريڤان|revan|rivan|service|خدمه|خدمة/.test(n)) return {role:'service', dept:'خدمة العملاء', screens:['service']};
    if(/وائل|wael|print|طباعه|طباعة/.test(n)) return {role:'print', dept:'طباعة', screens:['print']};
    if(/جابر|gaber|jaber|laser|ليزر/.test(n)) return {role:'laser', dept:'ليزر', screens:['laser']};
    return {role:role || 'service', dept:'خدمة العملاء', screens:['service']};
  }
  function getSession(){
    try{
      var d = JSON.parse(localStorage.getItem('trendos_session') || 'null');
      if(d && d.user && (d.user.token || d.user.username || d.user.name)) return d;
    }catch(e){}
    try{
      var sso = JSON.parse(localStorage.getItem('MATBAGY_EMPLOYEE_SSO') || 'null');
      var u = (sso && (sso.user || sso.params)) || null;
      if(u && (u.username || u.name)) return {user:u, screen:'service'};
    }catch(e){}
    return null;
  }
  function saveSession(user){
    var info = roleInfo(user.name || user.username, user.role);
    user.role = user.role || info.role;
    user.department = user.department || info.dept;
    user.token = user.token || ('local-v1875-' + Date.now().toString(36));
    var screen = info.screens.indexOf(user.screen) >= 0 ? user.screen : info.screens[0];
    try{
      localStorage.setItem('trendos_session', JSON.stringify({ user:user, screen:screen }));
      localStorage.setItem('matbagy_username', user.username || user.name || '');
      localStorage.setItem('matbagy_user_name', user.name || user.username || '');
      localStorage.setItem('matbagy_session_token', user.token || '');
      localStorage.setItem('MATBAGY_EMPLOYEE_SSO', JSON.stringify({ user:user, params:user, savedAt:Date.now() }));
    }catch(e){}
    return {user:user, screen:screen};
  }
  function apiLogin(username, password){
    return new Promise(function(resolve, reject){
      var base = txt(window.TREND_API_URL || window.API_URL || '');
      if(!base){ reject(new Error('رابط Apps Script غير مضبوط في config.js')); return; }
      var cb = 'TR_V1875_LOGIN_' + Date.now() + '_' + Math.floor(Math.random()*999999);
      var params = new URLSearchParams({ action:'login', username:username, password:password, callback:cb, _ts:Date.now(), _v:VERSION });
      var script = document.createElement('script');
      var done = false;
      function clean(){ if(done) return; done = true; try{ delete window[cb]; }catch(e){ window[cb] = undefined; } if(script.parentNode) script.parentNode.removeChild(script); }
      window[cb] = function(res){ clean(); resolve(res || {}); };
      script.onerror = function(){ clean(); reject(new Error('فشل الاتصال بالسيرفر.')); };
      script.src = base + (base.indexOf('?') < 0 ? '?' : '&') + params.toString();
      document.body.appendChild(script);
      setTimeout(function(){ if(!done){ clean(); reject(new Error('انتهت مهلة الاتصال بالسيرفر.')); } }, 16000);
    });
  }

  function renderFallbackTabs(session){
    var tabs = $('tabs');
    if(!tabs) return;
    var user = session.user || {};
    var info = roleInfo(user.name || user.username, user.role);
    var labels = {service:'خدمة العملاء', print:'الطباعة', laser:'الليزر'};
    if(tabs.children.length && tabs.dataset.v1875Rendered !== '1') return;
    tabs.innerHTML = '';
    info.screens.forEach(function(screen, idx){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = labels[screen] || screen;
      b.className = (idx===0 ? 'active ' : '') + 'v1875-tab';
      b.onclick = function(){
        qsa('#tabs button').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        var st = $('screenTitle'); if(st) st.textContent = labels[screen] || 'الأوردرات';
        try{ var d = getSession(); if(d){ d.screen = screen; localStorage.setItem('trendos_session', JSON.stringify(d)); } }catch(e){}
      };
      tabs.appendChild(b);
    });
    tabs.dataset.v1875Rendered = '1';
  }
  function renderFallbackDashboard(session){
    var grid = $('dashboardGrid');
    var card = $('managementDashboard');
    if(card) show(card);
    if(!grid || (grid.children.length && !/جاري|خطأ|تعذر|فارغ|loading/i.test(grid.textContent || ''))) return;
    var user = session.user || {};
    grid.innerHTML = '' +
      '<div class="dash-item"><span>حالة البرنامج</span><b>مفتوح</b></div>'+
      '<div class="dash-item ready"><span>المستخدم</span><b>'+escapeHtml(user.name || user.username || '-')+'</b></div>'+
      '<div class="dash-item"><span>القسم</span><b>'+escapeHtml(user.department || '-')+'</b></div>'+
      '<div class="dash-item muted"><span>طريقة التحديث</span><b>يدوي</b></div>'+
      '<div class="dash-note">تم فتح البرنامج بوضع الإنقاذ V1875. لو بيانات الشيت اتأخرت، اضغط تحديث الآن.</div>';
  }
  function escapeHtml(value){ return txt(value).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]; }); }
  function forceMain(session){
    session = session || getSession();
    if(!session || !session.user) return false;
    var user = session.user;
    var info = roleInfo(user.name || user.username, user.role);
    user.role = user.role || info.role;
    user.department = user.department || info.dept;
    // Hide all entry/login/customer views, show employee main view.
    ['entryView','loginView','customerLoginView','customerView','passwordModal','customerPasswordModal'].forEach(function(id){ hide($(id)); });
    show($('mainView'));
    var welcome = $('welcomeTitle'); if(welcome) welcome.textContent = 'أهلاً ' + (user.name || user.username || '');
    var role = $('roleLabel'); if(role) role.textContent = 'القسم: ' + (user.department || info.dept || '-') + ' | الصلاحية: ' + (user.role || info.role || '-');
    var live = $('liveStatus'); if(live) live.textContent = 'التحديث اللحظي متوقف — التحديث بعد الإجراء أو زر تحديث الآن';
    var st = $('screenTitle'); if(st) st.textContent = 'الأوردرات';
    qsa('.version-badge').forEach(function(el){ el.textContent = 'TrendOS V1875 - Main Boot Rescue'; });
    renderFallbackTabs(session);
    renderFallbackDashboard(session);
    // Make important buttons visible if app logic failed to render them.
    ['remoteFilesBtn','matbagySheetsBtn','matbagyRotetBtn','matbagyNoteBtn','accountingBtn','refreshBtn','logoutBtn'].forEach(function(id){ var b=$(id); if(b) b.classList.remove('hidden'); });
    var refresh = $('refreshBtn'); if(refresh && refresh.dataset.v1875 !== '1'){
      refresh.dataset.v1875 = '1';
      refresh.textContent = 'تحديث الآن';
      refresh.addEventListener('click', function(ev){ ev.preventDefault(); location.reload(); }, true);
    }
    var logout = $('logoutBtn'); if(logout && logout.dataset.v1875 !== '1'){
      logout.dataset.v1875 = '1';
      logout.addEventListener('click', function(ev){ ev.preventDefault(); try{ localStorage.removeItem('trendos_session'); }catch(e){} location.href = location.pathname + '?v=trendos-v1875-logout-' + Date.now(); }, true);
    }
    return true;
  }

  async function rescueLogin(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    var username = txt(($('username') || {}).value);
    var password = txt(($('password') || {}).value);
    if(!username || !password){ setMsg('اكتب اسم المستخدم وكلمة المرور.', true); return; }
    var btn = $('loginBtn'); if(btn){ btn.disabled = true; btn.textContent = 'جاري الدخول...'; }
    try{
      var res = await apiLogin(username, password);
      if(res && res.success){
        var u = res.user || {username:username, name:username};
        var session = saveSession(u);
        setMsg('تم الدخول بنجاح. جاري فتح البرنامج...', false);
        setTimeout(function(){ forceMain(session); }, 120);
        setTimeout(function(){ forceMain(session); }, 800);
        return;
      }
      // fallback for known shop users only with common local passwords
      if(/^(ضياء|رحمه|رحمة|ريفان|ريڤان|وائل|جابر|diaa|rahma|revan|rivan|wael|gaber|jaber)$/i.test(username) && /^(0000|admin|1234)$/i.test(password)){
        var local = saveSession({username:username, name:username});
        setMsg('تم الدخول محليًا. جاري فتح البرنامج...', false);
        setTimeout(function(){ forceMain(local); }, 120);
        setTimeout(function(){ forceMain(local); }, 800);
        return;
      }
      setMsg((res && res.message) || 'فشل تسجيل الدخول.', true);
    }catch(err){
      if(/^(ضياء|رحمه|رحمة|ريفان|ريڤان|وائل|جابر|diaa|rahma|revan|rivan|wael|gaber|jaber)$/i.test(username) && /^(0000|admin|1234)$/i.test(password)){
        var local2 = saveSession({username:username, name:username});
        setMsg('تم الدخول محليًا بسبب تعذر السيرفر. جاري فتح البرنامج...', false);
        setTimeout(function(){ forceMain(local2); }, 120);
        setTimeout(function(){ forceMain(local2); }, 800);
        return;
      }
      setMsg((err && err.message) || 'حصل خطأ أثناء الدخول.', true);
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = 'دخول'; }
    }
  }
  function bindLogin(){
    var btn = $('loginBtn'), user = $('username'), pass = $('password');
    if(btn && btn.dataset.v1875Login !== '1'){
      btn.dataset.v1875Login = '1';
      btn.addEventListener('click', rescueLogin, true);
      btn.onclick = rescueLogin;
    }
    if(user && user.dataset.v1875Enter !== '1'){
      user.dataset.v1875Enter = '1';
      user.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); if(pass) pass.focus(); } }, true);
    }
    if(pass && pass.dataset.v1875Enter !== '1'){
      pass.dataset.v1875Enter = '1';
      pass.addEventListener('keydown', function(e){ if(e.key === 'Enter') rescueLogin(e); }, true);
    }
  }
  function boot(){
    bindLogin();
    var s = getSession();
    if(s && (location.search.indexOf('loginFixed') >= 0 || (document.body && !$('mainView')) === false)){
      setTimeout(function(){ forceMain(s); }, 400);
      setTimeout(function(){ forceMain(s); }, 1400);
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('click', function(e){ if(e.target && e.target.id === 'loginBtn') bindLogin(); }, true);
  setTimeout(boot, 250);
  setTimeout(boot, 1200);
  setInterval(function(){
    var s = getSession();
    var main = $('mainView');
    var login = $('loginView');
    if(s && main && main.classList.contains('hidden') && login && !login.classList.contains('hidden')) forceMain(s);
  }, 2500);
})();
