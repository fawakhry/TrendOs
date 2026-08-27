/* TrendOS Customer Manager + WhatsApp Inbox - V1933
 * UI only: inbox -> thread -> AI draft -> manual send.
 * No automatic sending. Backend remains customerManagerV1 in Apps Script.
 */
(function () {
  'use strict';

  var VERSION = 'V1933_CUSTOMER_MANAGER_20260827';
  var currentPhone = '';
  var conversations = [];
  var busy = false;

  function $(id) { return document.getElementById(id); }
  function text(v) { return String(v == null ? '' : v); }
  function esc(v) {
    return text(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function normalize(v) {
    return text(v).toLowerCase()
      .replace(/[إأآا]/g, 'ا')
      .replace(/[ى]/g, 'ي')
      .replace(/[ةه]/g, 'ه')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function state() {
    return window.trendosState || window.state || {};
  }

  function user() {
    return state().user || {};
  }

  function canUse() {
    var u = user();
    if (!u || !(u.username || u.name)) return false;
    var role = normalize(u.role || '');
    var name = normalize(u.username || u.name || '');
    return role === 'admin' || role === 'service' ||
      role.indexOf('خدم') !== -1 || role.indexOf('ادار') !== -1 ||
      name.indexOf('ضياء') !== -1 || name.indexOf('رحم') !== -1;
  }

  async function callCustomerManager(op, extra) {
    if (typeof window.trendosSecureApiV1922 !== 'function') {
      throw new Error('واجهة TrendOS API غير جاهزة. اعمل تحديث للصفحة.');
    }
    var u = user();
    var params = Object.assign({
      username: u.username || u.name || '',
      token: u.token || '',
      op: op
    }, extra || {});
    return window.trendosSecureApiV1922('customerManagerV1', params);
  }

  function injectStyle() {
    if ($('tmCustomerManagerStyleV1933')) return;
    var style = document.createElement('style');
    style.id = 'tmCustomerManagerStyleV1933';
    style.textContent = [
      '.tm-cm-btn{border:1px solid #16a34a!important;background:#ecfdf3!important;color:#166534!important;font-weight:800!important}',
      '.tm-cm-btn .tm-cm-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-left:5px}',
      '.tm-cm-modal{position:fixed;inset:0;z-index:20050;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Cairo,Tajawal,sans-serif}',
      '.tm-cm-modal.hidden{display:none!important}',
      '.tm-cm-card{width:min(1280px,97vw);height:min(820px,92vh);background:#f8fafc;border-radius:22px;box-shadow:0 30px 90px rgba(15,23,42,.28);overflow:hidden;display:flex;flex-direction:column;border:1px solid #dbe4ef}',
      '.tm-cm-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;background:#fff;border-bottom:1px solid #e2e8f0}',
      '.tm-cm-head h2{margin:0;font-size:21px}.tm-cm-head small{color:#64748b}',
      '.tm-cm-head-actions{display:flex;gap:8px;flex-wrap:wrap}',
      '.tm-cm-head button,.tm-cm-actions button{border:0;border-radius:10px;padding:9px 13px;cursor:pointer;font-family:inherit;font-weight:800}',
      '.tm-cm-refresh{background:#e2e8f0;color:#0f172a}.tm-cm-close{background:#fee2e2;color:#991b1b}',
      '.tm-cm-grid{display:grid;grid-template-columns:minmax(280px,360px) 1fr;min-height:0;flex:1}',
      '.tm-cm-inbox{background:#fff;border-left:1px solid #e2e8f0;overflow:auto;padding:10px}',
      '.tm-cm-search{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:11px;padding:10px 12px;margin-bottom:9px;font-family:inherit}',
      '.tm-cm-conv{width:100%;text-align:right;border:1px solid #e2e8f0;background:#fff;border-radius:13px;padding:11px;margin:0 0 8px;cursor:pointer;font-family:inherit}',
      '.tm-cm-conv:hover,.tm-cm-conv.active{border-color:#22c55e;background:#f0fdf4}',
      '.tm-cm-conv-top{display:flex;justify-content:space-between;gap:8px;align-items:center}',
      '.tm-cm-conv-name{font-weight:900;color:#0f172a}.tm-cm-conv-order{font-size:12px;color:#475569}',
      '.tm-cm-conv-msg{font-size:13px;color:#475569;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tm-cm-danger{display:inline-block;background:#fee2e2;color:#b91c1c;border-radius:999px;padding:2px 7px;font-size:11px;font-weight:900}',
      '.tm-cm-thread-wrap{display:flex;flex-direction:column;min-width:0;min-height:0;background:#eef2f7}',
      '.tm-cm-context{background:#fff;padding:10px 14px;border-bottom:1px solid #e2e8f0;display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.tm-cm-pill{background:#f1f5f9;border-radius:999px;padding:5px 9px;font-size:12px;color:#334155}.tm-cm-pill strong{color:#0f172a}',
      '.tm-cm-risk{background:#fff1f2!important;color:#be123c!important}',
      '.tm-cm-messages{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:9px}',
      '.tm-cm-empty{margin:auto;color:#64748b;text-align:center;padding:25px}',
      '.tm-cm-bubble{max-width:min(680px,82%);padding:10px 12px;border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.06);white-space:pre-wrap;word-break:break-word}',
      '.tm-cm-bubble.in{align-self:flex-start;background:#fff;border-bottom-left-radius:4px;color:#0f172a}',
      '.tm-cm-bubble.out{align-self:flex-end;background:#dcfce7;border-bottom-right-radius:4px;color:#14532d}',
      '.tm-cm-meta{display:block;font-size:10px;color:#94a3b8;margin-top:5px}',
      '.tm-cm-compose{background:#fff;border-top:1px solid #e2e8f0;padding:12px}',
      '.tm-cm-compose textarea{width:100%;box-sizing:border-box;min-height:82px;resize:vertical;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-family:inherit;font-size:14px}',
      '.tm-cm-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;align-items:center}',
      '.tm-cm-ai{background:#e0e7ff;color:#3730a3}.tm-cm-send{background:#16a34a;color:#fff}.tm-cm-handoff{background:#fff7ed;color:#c2410c}.tm-cm-resolve{background:#e0f2fe;color:#0369a1}',
      '.tm-cm-actions button:disabled{opacity:.55;cursor:not-allowed}',
      '.tm-cm-status{font-size:12px;color:#475569;min-height:18px;flex:1}.tm-cm-status.error{color:#b91c1c;font-weight:800}.tm-cm-status.ok{color:#15803d;font-weight:800}',
      '.tm-cm-loading{opacity:.6;pointer-events:none}',
      '@media(max-width:820px){.tm-cm-modal{padding:0}.tm-cm-card{width:100vw;height:100vh;border-radius:0}.tm-cm-grid{grid-template-columns:1fr}.tm-cm-inbox{max-height:32vh;border-left:0;border-bottom:1px solid #e2e8f0}.tm-cm-bubble{max-width:92%}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureUi() {
    injectStyle();

    var top = document.querySelector('.top-actions');
    if (top && !$('tmCustomerManagerBtn')) {
      var btn = document.createElement('button');
      btn.id = 'tmCustomerManagerBtn';
      btn.type = 'button';
      btn.className = 'ghost tm-cm-btn hidden';
      btn.innerHTML = '<span class="tm-cm-dot"></span>💬 مدير العملاء';
      btn.addEventListener('click', openManager);
      top.insertBefore(btn, top.firstChild || null);
    }

    if (!$('tmCustomerManagerModal')) {
      var modal = document.createElement('section');
      modal.id = 'tmCustomerManagerModal';
      modal.className = 'tm-cm-modal hidden';
      modal.innerHTML = '' +
        '<div class="tm-cm-card" dir="rtl">' +
          '<div class="tm-cm-head">' +
            '<div><h2>💬 مدير العملاء وواتساب</h2><small>الرسائل داخل TrendOS — AI يقترح والموظف يرسل يدويًا</small></div>' +
            '<div class="tm-cm-head-actions">' +
              '<button id="tmCmRefresh" class="tm-cm-refresh" type="button">↻ تحديث</button>' +
              '<button id="tmCmClose" class="tm-cm-close" type="button">✕ إغلاق</button>' +
            '</div>' +
          '</div>' +
          '<div class="tm-cm-grid">' +
            '<aside class="tm-cm-inbox">' +
              '<input id="tmCmSearch" class="tm-cm-search" placeholder="ابحث باسم العميل أو الهاتف أو الأوردر">' +
              '<div id="tmCmInboxList"><div class="tm-cm-empty">افتح مدير العملاء لتحميل المحادثات.</div></div>' +
            '</aside>' +
            '<section class="tm-cm-thread-wrap">' +
              '<div id="tmCmContext" class="tm-cm-context"><span class="tm-cm-pill">اختار محادثة من القائمة</span></div>' +
              '<div id="tmCmMessages" class="tm-cm-messages"><div class="tm-cm-empty">الرسائل هتظهر هنا.</div></div>' +
              '<div class="tm-cm-compose">' +
                '<textarea id="tmCmComposer" placeholder="اكتب الرد هنا أو اضغط اقتراح رد AI..." disabled></textarea>' +
                '<div class="tm-cm-actions">' +
                  '<button id="tmCmAi" class="tm-cm-ai" type="button" disabled>✨ اقتراح رد AI</button>' +
                  '<button id="tmCmSend" class="tm-cm-send" type="button" disabled>إرسال واتساب</button>' +
                  '<button id="tmCmHandoff" class="tm-cm-handoff" type="button" disabled>تصعيد للمدير</button>' +
                  '<button id="tmCmResolve" class="tm-cm-resolve" type="button" disabled>تمت المعالجة</button>' +
                  '<span id="tmCmStatus" class="tm-cm-status"></span>' +
                '</div>' +
              '</div>' +
            '</section>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);

      $('tmCmClose').onclick = closeManager;
      $('tmCmRefresh').onclick = function () { loadInbox(true); };
      $('tmCmSearch').addEventListener('input', renderInbox);
      $('tmCmAi').onclick = suggestReply;
      $('tmCmSend').onclick = sendReply;
      $('tmCmHandoff').onclick = handoff;
      $('tmCmResolve').onclick = resolveConversation;
      modal.addEventListener('click', function (e) { if (e.target === modal) closeManager(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeManager(); });
    }

    syncVisibility();
  }

  function syncVisibility() {
    var btn = $('tmCustomerManagerBtn');
    if (!btn) return;
    btn.classList.toggle('hidden', !canUse());
    if (!canUse() && $('tmCustomerManagerModal')) closeManager();
  }

  function setBusy(flag) {
    busy = !!flag;
    var card = $('tmCustomerManagerModal') && $('tmCustomerManagerModal').querySelector('.tm-cm-card');
    if (card) card.classList.toggle('tm-cm-loading', busy);
  }

  function setStatus(message, type) {
    var el = $('tmCmStatus');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'tm-cm-status' + (type ? ' ' + type : '');
  }

  function enableThread(enabled) {
    ['tmCmComposer', 'tmCmAi', 'tmCmSend', 'tmCmHandoff', 'tmCmResolve'].forEach(function (id) {
      if ($(id)) $(id).disabled = !enabled;
    });
  }

  async function openManager() {
    if (!canUse()) return;
    ensureUi();
    $('tmCustomerManagerModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    await loadInbox(false);
  }

  function closeManager() {
    var modal = $('tmCustomerManagerModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  async function loadInbox(force) {
    if (busy) return;
    setBusy(true);
    setStatus(force ? 'جاري تحديث المحادثات...' : 'جاري تحميل المحادثات...', '');
    try {
      var res = await callCustomerManager('inbox', { limit: '120' });
      if (!res || !res.success) throw new Error((res && res.message) || 'تعذر تحميل المحادثات.');
      conversations = Array.isArray(res.conversations) ? res.conversations : [];
      renderInbox();
      setStatus('تم تحميل ' + conversations.length + ' محادثة.', 'ok');
      if (currentPhone) {
        var stillExists = conversations.some(function (c) { return text(c.phone) === currentPhone; });
        if (stillExists) await openThread(currentPhone, true);
      }
    } catch (err) {
      setStatus(err.message || 'تعذر تحميل مدير العملاء.', 'error');
      var list = $('tmCmInboxList');
      if (list) list.innerHTML = '<div class="tm-cm-empty">' + esc(err.message || 'تعذر التحميل') + '</div>';
    } finally {
      setBusy(false);
    }
  }

  function renderInbox() {
    var box = $('tmCmInboxList');
    if (!box) return;
    var q = normalize((($('tmCmSearch') || {}).value || ''));
    var rows = conversations.filter(function (c) {
      if (!q) return true;
      return normalize([c.customerName, c.phone, c.orderId, c.status, c.lastMessage].join(' ')).indexOf(q) !== -1;
    });
    if (!rows.length) {
      box.innerHTML = '<div class="tm-cm-empty">لا توجد محادثات مطابقة.</div>';
      return;
    }
    box.innerHTML = rows.map(function (c) {
      var active = text(c.phone) === currentPhone ? ' active' : '';
      return '<button type="button" class="tm-cm-conv' + active + '" data-phone="' + esc(c.phone) + '">' +
        '<div class="tm-cm-conv-top"><span class="tm-cm-conv-name">' + esc(c.customerName || c.phone || 'عميل') + '</span>' +
        (c.needsManager ? '<span class="tm-cm-danger">يحتاج مدير</span>' : '') + '</div>' +
        '<div class="tm-cm-conv-order">' + (c.orderId ? ('أوردر #' + esc(c.orderId)) : 'بدون أوردر مرتبط') + (c.status ? (' — ' + esc(c.status)) : '') + '</div>' +
        '<div class="tm-cm-conv-msg">' + esc(c.lastMessage || 'لا توجد رسالة') + '</div>' +
      '</button>';
    }).join('');

    Array.prototype.forEach.call(box.querySelectorAll('.tm-cm-conv'), function (btn) {
      btn.onclick = function () { openThread(btn.getAttribute('data-phone') || '', false); };
    });
  }

  function renderContext(ctx, conv) {
    var box = $('tmCmContext');
    if (!box) return;
    ctx = ctx || {};
    conv = conv || {};
    var pills = [];
    pills.push('<span class="tm-cm-pill"><strong>' + esc(ctx.customerName || conv.customerName || 'عميل') + '</strong></span>');
    if (currentPhone) pills.push('<span class="tm-cm-pill">📱 ' + esc(currentPhone) + '</span>');
    if (ctx.orderId || conv.orderId) pills.push('<span class="tm-cm-pill">أوردر <strong>#' + esc(ctx.orderId || conv.orderId) + '</strong></span>');
    if (ctx.orderStatus || conv.status) pills.push('<span class="tm-cm-pill">الحالة: <strong>' + esc(ctx.orderStatus || conv.status) + '</strong></span>');
    if (ctx.expectedDelivery) pills.push('<span class="tm-cm-pill">التسليم المتوقع: ' + esc(ctx.expectedDelivery) + '</span>');
    if (ctx.total) pills.push('<span class="tm-cm-pill">الإجمالي: ' + esc(ctx.total) + '</span>');
    if (ctx.remaining) pills.push('<span class="tm-cm-pill">المتبقي: ' + esc(ctx.remaining) + '</span>');
    if (conv.needsManager) pills.push('<span class="tm-cm-pill tm-cm-risk">⚠ ' + esc(conv.reason || 'يحتاج مراجعة المدير') + '</span>');
    box.innerHTML = pills.join('');
  }

  function renderMessages(messages) {
    var box = $('tmCmMessages');
    if (!box) return;
    messages = Array.isArray(messages) ? messages : [];
    if (!messages.length) {
      box.innerHTML = '<div class="tm-cm-empty">لا توجد رسائل مسجلة لهذا العميل.</div>';
      return;
    }
    box.innerHTML = messages.map(function (m) {
      var dir = m.direction === 'out' ? 'out' : 'in';
      var risk = m.needsManager ? '<span class="tm-cm-danger"> يحتاج مدير</span>' : '';
      return '<div class="tm-cm-bubble ' + dir + '">' + esc(m.text || '') +
        '<span class="tm-cm-meta">' + esc(m.at || '') + (m.sendStatus ? (' — ' + esc(m.sendStatus)) : '') + risk + '</span></div>';
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  async function openThread(phone, silent) {
    phone = text(phone).trim();
    if (!phone) return;
    currentPhone = phone;
    renderInbox();
    enableThread(false);
    if (!silent) setStatus('جاري تحميل المحادثة...', '');
    try {
      var res = await callCustomerManager('thread', { phone: phone, limit: '200' });
      if (!res || !res.success) throw new Error((res && res.message) || 'تعذر تحميل الرسائل.');
      var conv = conversations.find(function (c) { return text(c.phone) === phone; }) || {};
      renderContext(res.context || {}, conv);
      renderMessages(res.messages || []);
      enableThread(true);
      if (!silent) setStatus('جاهز. AI للاقتراح فقط ولن يرسل تلقائيًا.', 'ok');
    } catch (err) {
      setStatus(err.message || 'تعذر تحميل المحادثة.', 'error');
    }
  }

  async function suggestReply() {
    if (!currentPhone || busy) return;
    setBusy(true);
    setStatus('AI بيجهز اقتراح الرد...', '');
    var btn = $('tmCmAi');
    var old = btn ? btn.textContent : '';
    if (btn) btn.textContent = 'جاري الاقتراح...';
    try {
      var res = await callCustomerManager('suggest', { phone: currentPhone });
      if (!res || !res.success) throw new Error((res && res.message) || 'تعذر إنشاء الاقتراح.');
      if (res.needsManager) {
        if ($('tmCmComposer')) $('tmCmComposer').value = '';
        setStatus('⚠ الرسالة حساسة وتحتاج المدير: ' + (res.reason || 'مراجعة مطلوبة'), 'error');
        await loadInbox(true);
        return;
      }
      if ($('tmCmComposer')) {
        $('tmCmComposer').value = text(res.reply || '').trim();
        $('tmCmComposer').focus();
      }
      setStatus(res.aiSafe === false ? 'تم تجهيز Draft مع تنبيه أمان — راجعه قبل الإرسال.' : 'تم تجهيز Draft. راجعه أو عدله ثم اضغط إرسال واتساب.', 'ok');
    } catch (err) {
      setStatus(err.message || 'تعذر إنشاء رد AI.', 'error');
    } finally {
      if (btn) btn.textContent = old || '✨ اقتراح رد AI';
      setBusy(false);
    }
  }

  async function sendReply() {
    if (!currentPhone || busy) return;
    var composer = $('tmCmComposer');
    var message = text(composer && composer.value).trim();
    if (!message) {
      setStatus('اكتب الرسالة أو اضغط اقتراح رد AI أولًا.', 'error');
      return;
    }
    setBusy(true);
    setStatus('جاري إرسال واتساب...', '');
    try {
      var res = await callCustomerManager('send', { phone: currentPhone, text: message });
      if (!res || !res.success) throw new Error((res && res.message) || 'تعذر إرسال واتساب.');
      if (composer) composer.value = '';
      setStatus(res.message || 'تم إرسال واتساب.', 'ok');
      await openThread(currentPhone, true);
      await loadInbox(true);
    } catch (err) {
      setStatus(err.message || 'تعذر إرسال واتساب. راجع اتصال Meta.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handoff() {
    if (!currentPhone || busy) return;
    setBusy(true);
    try {
      var res = await callCustomerManager('handoff', { phone: currentPhone });
      if (!res || !res.success) throw new Error((res && res.message) || 'تعذر التصعيد.');
      setStatus(res.message || 'تم التصعيد للمدير.', 'ok');
      await loadInbox(true);
    } catch (err) {
      setStatus(err.message || 'تعذر التصعيد.', 'error');
    } finally { setBusy(false); }
  }

  async function resolveConversation() {
    if (!currentPhone || busy) return;
    setBusy(true);
    try {
      var res = await callCustomerManager('resolve', { phone: currentPhone });
      if (!res || !res.success) throw new Error((res && res.message) || 'تعذر إنهاء التصعيد.');
      setStatus(res.message || 'تمت المعالجة.', 'ok');
      await loadInbox(true);
    } catch (err) {
      setStatus(err.message || 'تعذر تحديث الحالة.', 'error');
    } finally { setBusy(false); }
  }

  function boot() {
    ensureUi();
    syncVisibility();

    var main = $('mainView');
    if (main && window.MutationObserver) {
      new MutationObserver(function () { ensureUi(); syncVisibility(); }).observe(main, { attributes: true, attributeFilter: ['class'] });
    }

    var login = $('loginBtn');
    if (login) login.addEventListener('click', function () {
      setTimeout(syncVisibility, 600);
      setTimeout(syncVisibility, 1600);
    });
    var logout = $('logoutBtn');
    if (logout) logout.addEventListener('click', function () { setTimeout(syncVisibility, 50); });

    window.TrendOSCustomerManagerV1933 = {
      version: VERSION,
      open: openManager,
      refresh: function () { return loadInbox(true); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
