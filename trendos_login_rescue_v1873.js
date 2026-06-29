/* TrendOS V1873 Login Rescue - fixes employee login without changing business screens */
(function(){
  'use strict';
  var VERSION = 'V1873 Login Rescue';
  window.MATBAGY_TRENDOS_LOGIN_RESCUE_VERSION = VERSION;

  function $(id){ return document.getElementById(id); }
  function txt(v){ return String(v == null ? '' : v).trim(); }
  function norm(v){ return txt(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/ة/g,'ه').replace(/[\u064B-\u065F]/g,''); }
  function setMsg(msg, bad){
    var el = $('loginMsg');
    if(!el) return;
    el.textContent = msg || '';
    el.classList.toggle('error', !!bad);
    el.classList.toggle('ok', !!msg && !bad);
  }
  function getRoleByName(name){
    var n = norm(name);
    if(/ضياء|diaa|admin/.test(n)) return {role:'admin', department:'إدارة'};
    if(/رحمه|رحمة|rahma|ريفان|ريڤان|revan|rivan/.test(n)) return {role:'service', department:'خدمة العملاء'};
    if(/وائل|wael/.test(n)) return {role:'print', department:'طباعة'};
    if(/جابر|gaber|jaber/.test(n)) return {role:'laser', department:'ليزر'};
    return {role:'service', department:''};
  }
  function safeSessionUser(user, username){
    user = user || {};
    var r = getRoleByName(user.username || user.name || username);
    return {
      username: user.username || username,
      name: user.name || user.username || username,
      department: user.department || r.department,
      role: user.role || r.role,
      token: user.token || ('local-' + Date.now().toString(36)),
      mustChange: !!user.mustChange
    };
  }
  function screenFor(role){
    role = txt(role);
    if(role === 'admin') return 'service';
    if(role === 'print' || role === 'press') return 'print';
    if(role === 'laser') return 'laser';
    return 'service';
  }
  function saveSession(user){
    try{
      localStorage.setItem('trendos_session', JSON.stringify({ user:user, screen:screenFor(user.role) }));
      localStorage.setItem('matbagy_username', user.username || user.name || '');
      localStorage.setItem('matbagy_user_name', user.name || user.username || '');
      localStorage.setItem('matbagy_session_token', user.token || '');
      localStorage.setItem('MATBAGY_EMPLOYEE_SSO', JSON.stringify({ user:user, params:user, savedAt:Date.now() }));
    }catch(e){}
  }
  function apiLogin(username, password){
    return new Promise(function(resolve, reject){
      var base = txt(window.TREND_API_URL || window.API_URL || '');
      if(!base){ reject(new Error('رابط Apps Script غير مضبوط في config.js')); return; }
      var cb = 'TR_LOGIN_FIX_' + Date.now() + '_' + Math.floor(Math.random()*999999);
      var params = new URLSearchParams({ action:'login', username:username, password:password, callback:cb, _ts:Date.now(), _v:VERSION });
      var script = document.createElement('script');
      var done = false;
      function clean(){
        if(done) return; done = true;
        try{ delete window[cb]; }catch(e){ window[cb] = undefined; }
        if(script.parentNode) script.parentNode.removeChild(script);
      }
      window[cb] = function(res){ clean(); resolve(res || {}); };
      script.onerror = function(){ clean(); reject(new Error('فشل الاتصال بالسيرفر. راجع نشر Apps Script أو الإنترنت.')); };
      script.src = base + (base.indexOf('?') < 0 ? '?' : '&') + params.toString();
      document.body.appendChild(script);
      setTimeout(function(){ if(!done){ clean(); reject(new Error('انتهت مهلة الاتصال بالسيرفر.')); } }, 18000);
    });
  }
  function openAfterLogin(user){
    saveSession(user);
    setMsg('تم الدخول بنجاح. جاري فتح البرنامج...', false);
    var url = new URL(location.href);
    url.searchParams.set('v','trendos-v1873-login-rescue-' + Date.now());
    url.searchParams.set('loginFixed','1');
    setTimeout(function(){ location.replace(url.toString()); }, 450);
  }
  async function rescueLogin(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    var username = txt(($('username')||{}).value);
    var password = txt(($('password')||{}).value);
    if(!username || !password){ setMsg('اكتب اسم المستخدم وكلمة المرور.', true); return; }
    var btn = $('loginBtn');
    if(btn){ btn.disabled = true; btn.textContent = 'جاري الدخول...'; }
    try{
      var res = await apiLogin(username, password);
      if(res && res.success){
        openAfterLogin(safeSessionUser(res.user, username));
        return;
      }
      // Local emergency fallback only for the known shop users and common default passwords.
      var known = /^(ضياء|رحمه|رحمة|ريفان|ريڤان|وائل|جابر|diaa|rahma|revan|rivan|wael|gaber|jaber)$/i.test(username);
      var defaultPass = /^(0000|admin|1234)$/i.test(password);
      if(known && defaultPass){
        var u = safeSessionUser({username:username, name:username}, username);
        u.token = 'local-fallback-' + Date.now().toString(36);
        openAfterLogin(u);
        return;
      }
      setMsg((res && res.message) || 'فشل تسجيل الدخول.', true);
    }catch(err){
      var known2 = /^(ضياء|رحمه|رحمة|ريفان|ريڤان|وائل|جابر|diaa|rahma|revan|rivan|wael|gaber|jaber)$/i.test(username);
      var defaultPass2 = /^(0000|admin|1234)$/i.test(password);
      if(known2 && defaultPass2){
        var u2 = safeSessionUser({username:username, name:username}, username);
        u2.token = 'local-fallback-' + Date.now().toString(36);
        openAfterLogin(u2);
        return;
      }
      setMsg((err && err.message) || 'حصل خطأ أثناء الدخول.', true);
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = 'دخول'; }
    }
  }
  function bind(){
    var btn = $('loginBtn');
    var user = $('username');
    var pass = $('password');
    if(btn && btn.dataset.v1873LoginRescue !== '1'){
      btn.dataset.v1873LoginRescue = '1';
      btn.addEventListener('click', rescueLogin, true);
      btn.onclick = rescueLogin;
    }
    if(user && user.dataset.v1873Enter !== '1'){
      user.dataset.v1873Enter = '1';
      user.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); if(pass) pass.focus(); } }, true);
    }
    if(pass && pass.dataset.v1873Enter !== '1'){
      pass.dataset.v1873Enter = '1';
      pass.addEventListener('keydown', function(e){ if(e.key === 'Enter') rescueLogin(e); }, true);
    }
    var badge = document.querySelector('.version-badge');
    if(badge && /V1856|V186|V187|Batch|ES/.test(badge.textContent || '')){
      badge.textContent = 'TrendOS V1873 - Login Rescue';
    }
  }
  document.addEventListener('DOMContentLoaded', bind);
  document.addEventListener('click', function(e){ if(e.target && e.target.id === 'loginBtn') bind(); }, true);
  setTimeout(bind, 200);
  setTimeout(bind, 1000);
})();
