(function () {
  "use strict";

  if (window.__TRENDOS_ATTENDANCE_V1_LOADED__) return;
  window.__TRENDOS_ATTENDANCE_V1_LOADED__ = true;

  const API_URL = String(window.TREND_API_URL || window.API_URL || "").trim();
  const ENABLED = window.MATBAGY_ATTENDANCE_V1 !== false;
  if (!ENABLED || !API_URL) return;

  const ui = {
    root: null,
    overlay: null,
    presenceModal: null,
    prayerModal: null,
    timer: null,
    stateTimer: null,
    heartbeatTimer: null,
    presenceTimer: null,
    presenceDeadlineTimer: null,
    prayerTimer: null,
    current: null,
    config: null,
    lastPrayerKey: "",
    presenceOpen: false
  };

  function txt(v) { return String(v == null ? "" : v); }
  function currentUser() {
    const s = window.trendosState || window.state || {};
    return s.user || null;
  }
  function isAdminUser(user) {
    const u = user || currentUser() || {};
    const role = txt(u.role).toLowerCase();
    const key = txt(u.username || u.name).trim().toLowerCase();
    return role === "admin" || key === "ضياء" || key === "diaa";
  }
  function authParams(extra) {
    const u = currentUser() || {};
    return Object.assign({
      username: u.username || u.name || "",
      token: u.token || ""
    }, extra || {});
  }
  async function callAttendance(op, extra) {
    const u = currentUser();
    if (!u || !(u.username || u.name) || !u.token) throw new Error("لا توجد جلسة موظف صالحة.");
    const params = authParams(Object.assign({ action: "attendanceV1", op: op }, extra || {}));
    const qs = new URLSearchParams();
    Object.keys(params).forEach(function (k) {
      const v = params[k];
      if (v !== undefined && v !== null) qs.set(k, String(v));
    });
    const res = await fetch(API_URL + (API_URL.indexOf("?") === -1 ? "?" : "&") + qs.toString(), { cache: "no-store", credentials: "omit" });
    const data = await res.json();
    if (!data || data.success === false) throw new Error((data && data.message) || "تعذر تنفيذ أمر الدوام.");
    return data;
  }

  function injectStyles() {
    if (document.getElementById("trendAttendanceV1Styles")) return;
    const style = document.createElement("style");
    style.id = "trendAttendanceV1Styles";
    style.textContent = `
      #trendAttendanceV1{position:fixed;left:14px;bottom:14px;z-index:2147482000;width:min(360px,calc(100vw - 28px));font-family:Tahoma,Arial,sans-serif;direction:rtl;background:#fff;border:1px solid #d8e2ec;border-radius:16px;box-shadow:0 10px 35px rgba(20,45,70,.18);overflow:hidden;color:#153047}
      #trendAttendanceV1 .ta-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:#123a59;color:#fff}
      #trendAttendanceV1 .ta-head strong{font-size:14px}.ta-badge{font-size:12px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.16)}
      #trendAttendanceV1 .ta-body{padding:11px}.ta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.ta-stat{background:#f5f8fb;border:1px solid #e6edf4;border-radius:10px;padding:8px}.ta-stat b{display:block;font-size:16px;margin-top:3px}
      #trendAttendanceV1 .ta-actions{display:flex;flex-wrap:wrap;gap:7px}.ta-btn{border:0;border-radius:10px;padding:9px 11px;min-height:40px;font-weight:700;cursor:pointer;background:#e9f0f6;color:#123a59}.ta-btn.primary{background:#0f766e;color:#fff}.ta-btn.warn{background:#f59e0b;color:#15202b}.ta-btn.danger{background:#b42318;color:#fff}.ta-btn:disabled{opacity:.45;cursor:not-allowed}
      #trendAttendanceV1 .ta-note{font-size:12px;color:#66788a;margin-top:8px;line-height:1.5}
      .ta-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(8,25,40,.72);display:flex;align-items:center;justify-content:center;padding:18px;direction:rtl;font-family:Tahoma,Arial,sans-serif}.ta-modal.hidden{display:none}.ta-card{width:min(470px,100%);background:#fff;border-radius:18px;padding:20px;color:#153047;box-shadow:0 24px 80px rgba(0,0,0,.25)}.ta-card h2{margin:0 0 8px;font-size:22px}.ta-card p{line-height:1.65}.ta-card .ta-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
      .ta-start-overlay{position:fixed;inset:0;z-index:2147482500;background:rgba(8,25,40,.86);display:flex;align-items:center;justify-content:center;padding:18px;direction:rtl;font-family:Tahoma,Arial,sans-serif}.ta-start-overlay.hidden{display:none}.ta-start-box{width:min(520px,100%);background:#fff;border-radius:20px;padding:24px;text-align:center;color:#153047}.ta-start-box h2{margin:0 0 8px}.ta-start-box p{line-height:1.7;color:#5c7082}.ta-start-box button{min-width:180px}
      @media (max-width:600px){#trendAttendanceV1{left:8px;bottom:8px;width:calc(100vw - 16px)}#trendAttendanceV1 .ta-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function statusLabel(s) {
    const m = { working:"يعمل", paused:"Pause", rest:"Rest", prayer:"صلاة", ended:"انتهى اليوم", review:"يحتاج مراجعة", not_started:"لم يبدأ" };
    return m[s] || s || "-";
  }
  function fmtMinutes(mins) {
    mins = Math.max(0, Number(mins || 0));
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0");
  }

  function buildUi() {
    injectStyles();
    if (!ui.root) {
      ui.root = document.createElement("section");
      ui.root.id = "trendAttendanceV1";
      ui.root.innerHTML = `
        <div class="ta-head"><strong>🟢 تشغيل الموظف</strong><span class="ta-badge" data-ta="status">-</span></div>
        <div class="ta-body">
          <div class="ta-grid">
            <div class="ta-stat">وقت العمل<b data-ta="work">00:00</b></div>
            <div class="ta-stat">التوقف<b data-ta="pause">00:00</b></div>
            <div class="ta-stat">الراحة<b data-ta="rest">00/30 د</b></div>
            <div class="ta-stat">إنجاز اليوم<b data-ta="orders">0 أوردر</b></div>
          </div>
          <div class="ta-actions">
            <button type="button" class="ta-btn primary" data-action="start">بداية اليوم</button>
            <button type="button" class="ta-btn warn" data-action="pause">Pause</button>
            <button type="button" class="ta-btn primary" data-action="resume">Resume</button>
            <button type="button" class="ta-btn" data-action="rest">Rest</button>
            <button type="button" class="ta-btn danger" data-action="end">نهاية اليوم</button>
          </div>
          <div class="ta-note" data-ta="note">يتم احتساب وقت العمل الفعلي من بداية اليوم مع استبعاد Pause وRest واستراحة الصلاة.</div>
        </div>`;
      document.body.appendChild(ui.root);
      ui.root.addEventListener("click", onRootClick);
    }
    if (!ui.overlay) {
      ui.overlay = document.createElement("div");
      ui.overlay.className = "ta-start-overlay hidden";
      ui.overlay.innerHTML = `<div class="ta-start-box"><h2>ابدأ يوم العمل</h2><p>قبل استخدام TrendOS اضغط «بداية اليوم» لبدء احتساب وقت العمل والإنجاز. عند الخروج استخدم Pause، ولك Rest إجمالي 30 دقيقة خلال اليوم.</p><button type="button" class="ta-btn primary" data-action="overlayStart">بداية اليوم</button></div>`;
      document.body.appendChild(ui.overlay);
      ui.overlay.addEventListener("click", function (e) { if (e.target && e.target.dataset.action === "overlayStart") startDay(); });
    }
    if (!ui.presenceModal) {
      ui.presenceModal = document.createElement("div");
      ui.presenceModal.className = "ta-modal hidden";
      ui.presenceModal.innerHTML = `<div class="ta-card"><h2>تأكيد التواجد</h2><p>أكد أنك موجود في المكان وتتابع شغلك الآن. هذا التنبيه لا يخصم أو يقرر أي إجراء وظيفي تلقائيًا؛ عدم الرد يرسل الحالة للمراجعة.</p><div class="ta-actions"><button type="button" class="ta-btn primary" data-action="confirmPresence">أنا موجود وبعمل</button><button type="button" class="ta-btn warn" data-action="presencePause">أنا خارج المكان - Pause</button></div></div>`;
      document.body.appendChild(ui.presenceModal);
      ui.presenceModal.addEventListener("click", onPresenceClick);
    }
    if (!ui.prayerModal) {
      ui.prayerModal = document.createElement("div");
      ui.prayerModal.className = "ta-modal hidden";
      ui.prayerModal.innerHTML = `<div class="ta-card"><h2 data-prayer-title>موعد استراحة الصلاة</h2><p>يمكن إيقاف عداد العمل خلال استراحة الصلاة. لا يتم تسجيل أو تقييم ممارسة دينية فردية؛ المسجل فقط هو توقف العمل التشغيلي.</p><div class="ta-actions"><button type="button" class="ta-btn primary" data-action="prayerStart">بدء استراحة الصلاة</button><button type="button" class="ta-btn" data-action="prayerLater">تذكير بعد 5 دقائق</button></div></div>`;
      document.body.appendChild(ui.prayerModal);
      ui.prayerModal.addEventListener("click", onPrayerClick);
    }
  }

  async function notify(title, body) {
    try {
      if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body: body });
    } catch (e) {}
  }
  async function requestNotifyPermission() {
    try {
      if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    } catch (e) {}
  }

  function stateName() { return (ui.current && ui.current.status) || "not_started"; }
  function render() {
    if (!ui.root) return;
    const cur = ui.current || {};
    const cfg = ui.config || {};
    const get = function (k) { return ui.root.querySelector('[data-ta="'+k+'"]'); };
    get("status").textContent = statusLabel(cur.status || "not_started");
    get("work").textContent = fmtMinutes(cur.workMinutes);
    get("pause").textContent = fmtMinutes(cur.pauseMinutes);
    get("rest").textContent = Math.floor(Number(cur.restMinutes || 0)) + "/" + Math.floor(Number(cfg.dailyRestMinutes || 30)) + " د";
    get("orders").textContent = Number(cur.ordersCompleted || 0) + " أوردر";
    const s = stateName();
    const buttons = {};
    ui.root.querySelectorAll("[data-action]").forEach(function (b) { buttons[b.dataset.action] = b; });
    if (buttons.start) buttons.start.disabled = s !== "not_started" && s !== "ended";
    if (buttons.pause) buttons.pause.disabled = s !== "working";
    if (buttons.resume) buttons.resume.disabled = ["paused","rest","prayer","review"].indexOf(s) === -1;
    if (buttons.rest) buttons.rest.disabled = s !== "working" || Number(cur.restMinutes || 0) >= Number(cfg.dailyRestMinutes || 30);
    if (buttons.end) buttons.end.disabled = s === "not_started" || s === "ended";
    const exempt = !!(cfg.exemptAdmins && isAdminUser());
    ui.overlay.classList.toggle("hidden", exempt || s !== "not_started");
  }

  async function loadState() {
    const user = currentUser();
    if (!user || !user.token) return;
    try {
      const res = await callAttendance("state");
      ui.current = res.state || { status: "not_started" };
      ui.config = res.config || ui.config || {};
      render();
    } catch (err) {
      if (ui.root) {
        const note = ui.root.querySelector('[data-ta="note"]');
        if (note) note.textContent = "وحدة الدوام غير متصلة بالـ backend بعد: " + err.message;
      }
    }
  }

  async function startDay() {
    try {
      await requestNotifyPermission();
      const res = await callAttendance("start");
      ui.current = res.state;
      ui.config = res.config || ui.config;
      render();
      notify("TrendOS", "تم بدء يوم العمل.");
      schedulePresenceCheck(true);
    } catch (err) { alert(err.message); }
  }
  async function event(op) {
    try {
      const res = await callAttendance(op);
      ui.current = res.state;
      ui.config = res.config || ui.config;
      render();
      schedulePresenceCheck(false);
      return res;
    } catch (err) { alert(err.message); throw err; }
  }
  async function endDay() {
    if (!confirm("إنهاء يوم العمل الآن؟ سيتم تثبيت إجمالي ساعات العمل والإنجاز.")) return;
    try { await event("end"); notify("TrendOS", "تم إنهاء يوم العمل."); } catch (e) {}
  }
  function onRootClick(e) {
    const a = e.target && e.target.dataset && e.target.dataset.action;
    if (!a) return;
    if (a === "start") startDay();
    else if (a === "pause") event("pause");
    else if (a === "resume") event("resume");
    else if (a === "rest") event("restStart");
    else if (a === "end") endDay();
  }

  function schedulePresenceCheck(immediateReset) {
    if (ui.presenceTimer) clearTimeout(ui.presenceTimer);
    const cfg = ui.config || {};
    const minutes = Math.max(5, Number(cfg.presenceCheckMinutes || 30));
    if (stateName() !== "working") return;
    ui.presenceTimer = setTimeout(openPresenceCheck, (immediateReset ? minutes : minutes) * 60000);
  }
  function openPresenceCheck() {
    if (stateName() !== "working" || ui.presenceOpen) return;
    ui.presenceOpen = true;
    ui.presenceModal.classList.remove("hidden");
    notify("TrendOS - تأكيد التواجد", "أكد أنك موجود وتتابع التشغيل الآن.");
    if (ui.presenceDeadlineTimer) clearTimeout(ui.presenceDeadlineTimer);
    const responseMinutes = Math.max(1, Number((ui.config || {}).presenceResponseMinutes || 10));
    ui.presenceDeadlineTimer = setTimeout(async function () {
      if (!ui.presenceOpen) return;
      ui.presenceOpen = false;
      ui.presenceModal.classList.add("hidden");
      try { const res = await callAttendance("missedCheck"); ui.current = res.state; render(); } catch (e) {}
      notify("TrendOS", "لم يتم تأكيد التواجد؛ تم إرسال الحالة للمراجعة فقط.");
      schedulePresenceCheck(true);
    }, responseMinutes * 60000);
  }
  async function onPresenceClick(e) {
    const a = e.target && e.target.dataset && e.target.dataset.action;
    if (!a) return;
    if (ui.presenceDeadlineTimer) clearTimeout(ui.presenceDeadlineTimer);
    ui.presenceOpen = false;
    ui.presenceModal.classList.add("hidden");
    try {
      if (a === "confirmPresence") {
        const res = await callAttendance("confirm"); ui.current = res.state; render();
      } else if (a === "presencePause") {
        await event("pause");
      }
    } catch (err) { alert(err.message); }
    schedulePresenceCheck(true);
  }

  async function sendHeartbeat() {
    if (stateName() !== "working") return;
    try { await callAttendance("heartbeat"); } catch (e) {}
  }

  function hmToMinutes(hm) {
    const m = String(hm || "").match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }
  function checkPrayerTime() {
    if (!ui.current || stateName() !== "working") return;
    const prayers = ui.current.prayerTimes || {};
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    Object.keys(prayers).forEach(function (name) {
      const pMin = hmToMinutes(prayers[name]);
      if (pMin === null || Math.abs(currentMin - pMin) > 1) return;
      const key = now.toISOString().slice(0,10) + "|" + name;
      if (ui.lastPrayerKey === key) return;
      ui.lastPrayerKey = key;
      const title = ui.prayerModal.querySelector("[data-prayer-title]");
      if (title) title.textContent = "موعد استراحة الصلاة - " + name;
      ui.prayerModal.dataset.prayerName = name;
      ui.prayerModal.classList.remove("hidden");
      notify("TrendOS - وقت الصلاة", "يمكن إيقاف التشغيل خلال استراحة الصلاة.");
    });
  }
  async function onPrayerClick(e) {
    const a = e.target && e.target.dataset && e.target.dataset.action;
    if (!a) return;
    if (a === "prayerLater") {
      ui.prayerModal.classList.add("hidden");
      setTimeout(function () { if (stateName() === "working") ui.prayerModal.classList.remove("hidden"); }, 5 * 60000);
      return;
    }
    if (a === "prayerStart") {
      ui.prayerModal.classList.add("hidden");
      try { await event("prayerStart"); } catch (e2) {}
    }
  }

  function wireVisibility() {
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && currentUser() && currentUser().token) loadState();
    });
    window.addEventListener("beforeunload", function () {
      // لا نُنهي الجلسة تلقائياً. غلق الصفحة ليس دليلاً كافياً على مغادرة الموظف.
    });
  }

  function beginLoops() {
    if (ui.stateTimer) clearInterval(ui.stateTimer);
    if (ui.heartbeatTimer) clearInterval(ui.heartbeatTimer);
    if (ui.prayerTimer) clearInterval(ui.prayerTimer);
    ui.stateTimer = setInterval(loadState, 60000);
    ui.heartbeatTimer = setInterval(sendHeartbeat, 5 * 60000);
    ui.prayerTimer = setInterval(checkPrayerTime, 60000);
  }

  function waitForLogin() {
    buildUi();
    const poll = setInterval(function () {
      const u = currentUser();
      if (!u || !u.token) {
        ui.root.style.display = "none";
        if (ui.overlay) ui.overlay.classList.add("hidden");
        return;
      }
      ui.root.style.display = "block";
      loadState();
      beginLoops();
      clearInterval(poll);
    }, 800);
  }

  wireVisibility();
  waitForLogin();
})();
