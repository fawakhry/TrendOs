(function () {
  "use strict";

  if (window.__TRENDOS_ATTENDANCE_V1_LOADED__) return;
  window.__TRENDOS_ATTENDANCE_V1_LOADED__ = true;

  const API_URL = String(window.TREND_API_URL || window.API_URL || "").trim();
  if (!API_URL || window.MATBAGY_ATTENDANCE_V1 === false) return;

  const VERSION = "V1.1_HYBRID_20260824";
  const CATEGORY = "ATTENDANCE_V1";
  const CHECK_DEFAULT = 30;
  const RESPONSE_DEFAULT = 10;
  const REST_DEFAULT = 30;

  const ui = {
    root: null,
    overlay: null,
    presenceModal: null,
    prayerModal: null,
    employeeBox: null,
    managerBox: null,
    current: null,
    config: null,
    mode: "detect",
    presenceOpen: false,
    presenceOpenedAt: 0,
    lastPrayerKey: "",
    timers: {}
  };

  function txt(v) { return String(v == null ? "" : v); }
  function nowMs() { return Date.now(); }
  function currentUser() {
    const s = window.trendosState || window.state || {};
    return s.user || null;
  }
  function userName(user) {
    const u = user || currentUser() || {};
    return txt(u.username || u.name).trim();
  }
  function isAdminUser(user) {
    const u = user || currentUser() || {};
    const role = txt(u.role).toLowerCase();
    const key = userName(u).toLowerCase();
    return role === "admin" || key === "ضياء" || key === "diaa";
  }
  function dateKey(ts) {
    const d = ts ? new Date(ts) : new Date();
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(d);
  }
  function storageKey(username) {
    return "trendAttendanceV1|" + username + "|" + dateKey();
  }
  function safeJson(s, fallback) {
    try { return JSON.parse(s); } catch (e) { return fallback; }
  }
  function authParams(extra) {
    const u = currentUser() || {};
    return Object.assign({
      username: u.username || u.name || "",
      token: u.token || ""
    }, extra || {});
  }
  async function api(action, extra) {
    const params = authParams(Object.assign({ action: action }, extra || {}));
    const qs = new URLSearchParams();
    Object.keys(params).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null) qs.set(k, String(params[k]));
    });
    const res = await fetch(API_URL + (API_URL.indexOf("?") === -1 ? "?" : "&") + qs.toString(), {
      cache: "no-store", credentials: "omit"
    });
    const data = await res.json();
    return data || {};
  }
  async function callAttendanceBackend(op, extra) {
    const out = await api("attendanceV1", Object.assign({ op: op }, extra || {}));
    if (!out || out.success === false) throw new Error((out && out.message) || "Attendance backend unavailable");
    return out;
  }

  function defaultConfig() {
    return {
      requireStart: true,
      presenceCheckMinutes: CHECK_DEFAULT,
      presenceResponseMinutes: RESPONSE_DEFAULT,
      dailyRestMinutes: REST_DEFAULT,
      prayerReminders: true,
      prayerLocation: "Benha, Egypt",
      desktopNotifications: true,
      exemptAdmins: true,
      printWalkinPriority: "أعلى أولوية",
      managerAlertPolicy: "استثناءات فقط"
    };
  }
  function blankLocal(username) {
    return {
      version: VERSION,
      username: username,
      department: txt((currentUser() || {}).department),
      date: dateKey(),
      sessionId: "LOCAL-" + dateKey().replace(/-/g, "") + "-" + username + "-" + Math.random().toString(36).slice(2, 9),
      status: "not_started",
      events: [],
      startedAt: "",
      endedAt: "",
      lastPresenceAt: "",
      needsReview: false,
      ordersCompleted: 0,
      linesCompleted: 0
    };
  }
  function loadLocal(username) {
    const raw = localStorage.getItem(storageKey(username));
    const obj = safeJson(raw || "", null);
    return obj && obj.date === dateKey() ? obj : blankLocal(username);
  }
  function saveLocal(obj) {
    if (!obj || !obj.username) return;
    localStorage.setItem(storageKey(obj.username), JSON.stringify(obj));
  }
  function pushLocalEvent(type, extra) {
    const u = userName();
    let st = ui.current && ui.current.__local ? ui.current.__local : loadLocal(u);
    const event = Object.assign({ type: type, at: new Date().toISOString() }, extra || {});
    st.events = Array.isArray(st.events) ? st.events : [];
    st.events.push(event);
    if (st.events.length > 120) st.events = st.events.slice(-120);
    if (type === "start_day") {
      if (!st.startedAt) st.startedAt = event.at;
      st.endedAt = "";
      st.status = "working";
    } else if (type === "pause") st.status = "paused";
    else if (type === "resume" || type === "presence_confirmed") {
      st.status = "working"; st.needsReview = false;
      if (type === "presence_confirmed") st.lastPresenceAt = event.at;
    } else if (type === "rest_start") st.status = "rest";
    else if (type === "prayer_break_start") st.status = "prayer";
    else if (type === "missed_check") { st.status = "review"; st.needsReview = true; }
    else if (type === "end_day") { st.status = "ended"; st.endedAt = event.at; }
    st.__localFlag = true;
    saveLocal(st);
    return st;
  }

  function computeLocal(st) {
    st = st || blankLocal(userName());
    const events = (st.events || []).map(function (e) {
      return { type: e.type, at: new Date(e.at) };
    }).filter(function (e) { return !isNaN(e.at.getTime()); })
      .sort(function (a, b) { return a.at - b.at; });

    let start = null, end = null, workStart = null, restStart = null;
    let workMs = 0, restMs = 0, status = st.status || "not_started";
    function closeWork(t) { if (workStart) { workMs += Math.max(0, t - workStart); workStart = null; } }
    function closeRest(t) { if (restStart) { restMs += Math.max(0, t - restStart); restStart = null; } }

    events.forEach(function (e) {
      const t = e.at;
      if (e.type === "start_day") {
        if (!start) start = t;
        closeRest(t);
        if (!workStart) workStart = t;
        status = "working";
      } else if (e.type === "resume" || e.type === "presence_confirmed") {
        closeRest(t);
        if (!workStart) workStart = t;
        status = "working";
      } else if (e.type === "pause") {
        closeWork(t); closeRest(t); status = "paused";
      } else if (e.type === "rest_start") {
        closeWork(t); if (!restStart) restStart = t; status = "rest";
      } else if (e.type === "prayer_break_start") {
        closeWork(t); closeRest(t); status = "prayer";
      } else if (e.type === "missed_check") {
        status = "review";
      } else if (e.type === "end_day") {
        closeWork(t); closeRest(t); end = t; status = "ended";
      }
    });

    const now = end || new Date();
    if (!end && workStart) workMs += Math.max(0, now - workStart);
    if (!end && restStart) restMs += Math.max(0, now - restStart);
    const totalMs = start ? Math.max(0, now - start) : 0;
    return {
      status: status,
      startAt: start ? start.toISOString() : (st.startedAt || ""),
      endAt: end ? end.toISOString() : (st.endedAt || ""),
      totalMinutes: Math.floor(totalMs / 60000),
      workMinutes: Math.floor(workMs / 60000),
      restMinutes: Math.floor(restMs / 60000),
      pauseMinutes: Math.floor(Math.max(0, totalMs - workMs) / 60000),
      needsReview: !!st.needsReview,
      lastPulseAt: st.lastPresenceAt || "",
      ordersCompleted: Number(st.ordersCompleted || 0),
      linesCompleted: Number(st.linesCompleted || 0),
      __local: st
    };
  }

  async function saveCentralSnapshot(eventType, localState, note) {
    try {
      const cur = computeLocal(localState);
      const payload = {
        v: VERSION,
        event: eventType,
        at: new Date().toISOString(),
        username: localState.username,
        department: localState.department || "",
        date: localState.date,
        sessionId: localState.sessionId,
        status: cur.status,
        startAt: cur.startAt,
        endAt: cur.endAt,
        workMinutes: cur.workMinutes,
        pauseMinutes: cur.pauseMinutes,
        restMinutes: cur.restMinutes,
        totalMinutes: cur.totalMinutes,
        needsReview: cur.needsReview,
        ordersCompleted: cur.ordersCompleted,
        linesCompleted: cur.linesCompleted,
        note: note || ""
      };
      await api("saveMatbagyNote", {
        category: CATEGORY,
        title: "ATT|" + localState.username + "|" + localState.date + "|" + eventType,
        content: JSON.stringify(payload)
      });
    } catch (e) {}
  }

  async function loadCentralLatestForUser(username) {
    try {
      const out = await api("getMatbagyNotes", {});
      if (!out.success || !Array.isArray(out.notes)) return null;
      const prefix = "ATT|" + username + "|" + dateKey() + "|";
      for (let i = 0; i < out.notes.length; i++) {
        const n = out.notes[i] || {};
        if (txt(n.category) !== CATEGORY || txt(n.title).indexOf(prefix) !== 0) continue;
        const p = safeJson(txt(n.content), null);
        if (p && p.username === username && p.date === dateKey()) return p;
      }
    } catch (e) {}
    return null;
  }

  function applyCentralSnapshotToLocal(st, snap) {
    if (!snap || !st || st.events.length) return st;
    const at = snap.at || new Date().toISOString();
    if (snap.status === "working") st.events.push({ type: "start_day", at: snap.startAt || at });
    else if (snap.status === "paused") {
      st.events.push({ type: "start_day", at: snap.startAt || at });
      st.events.push({ type: "pause", at: at });
    } else if (snap.status === "rest") {
      st.events.push({ type: "start_day", at: snap.startAt || at });
      st.events.push({ type: "rest_start", at: at });
    } else if (snap.status === "prayer") {
      st.events.push({ type: "start_day", at: snap.startAt || at });
      st.events.push({ type: "prayer_break_start", at: at });
    } else if (snap.status === "review") {
      st.events.push({ type: "start_day", at: snap.startAt || at });
      st.events.push({ type: "missed_check", at: at });
      st.needsReview = true;
    } else if (snap.status === "ended") {
      st.events.push({ type: "start_day", at: snap.startAt || at });
      st.events.push({ type: "end_day", at: snap.endAt || at });
    }
    st.startedAt = snap.startAt || st.startedAt;
    st.endedAt = snap.endAt || st.endedAt;
    st.ordersCompleted = Number(snap.ordersCompleted || 0);
    st.linesCompleted = Number(snap.linesCompleted || 0);
    saveLocal(st);
    return st;
  }

  async function detectMode() {
    if (ui.mode !== "detect") return ui.mode;
    try {
      const out = await callAttendanceBackend("state");
      ui.mode = "backend";
      ui.current = out.state || null;
      ui.config = Object.assign(defaultConfig(), out.config || {});
      return ui.mode;
    } catch (e) {
      ui.mode = "fallback";
      ui.config = defaultConfig();
      return ui.mode;
    }
  }

  async function loadProductivityFallback(st) {
    try {
      const out = await api("getActivityLog", {});
      if (!out.success || !Array.isArray(out.rows)) return st;
      const orders = {}, lines = {};
      out.rows.forEach(function (r) {
        if (txt(r.by).trim() !== st.username) return;
        const status = txt(r.newStatus);
        if (["جاهز للاستلام", "تم التسليم", "تم التنفيذ"].indexOf(status) === -1) return;
        const t = new Date(r.time);
        if (isNaN(t.getTime()) || dateKey(t) !== dateKey()) return;
        if (r.orderId) orders[r.orderId] = true;
        if (r.lineId) lines[r.lineId] = true;
      });
      st.ordersCompleted = Object.keys(orders).length;
      st.linesCompleted = Object.keys(lines).length;
      saveLocal(st);
    } catch (e) {}
    return st;
  }

  async function loadState() {
    const user = currentUser();
    if (!user || !user.token) return;
    await detectMode();
    if (ui.mode === "backend") {
      try {
        const out = await callAttendanceBackend("state");
        ui.current = out.state || { status: "not_started" };
        ui.config = Object.assign(defaultConfig(), out.config || {});
      } catch (e) { ui.mode = "fallback"; }
    }
    if (ui.mode === "fallback") {
      let st = loadLocal(userName(user));
      if (!st.events.length) {
        const snap = await loadCentralLatestForUser(st.username);
        st = applyCentralSnapshotToLocal(st, snap);
      }
      await loadProductivityFallback(st);
      ui.current = computeLocal(st);
      ui.config = ui.config || defaultConfig();
      await loadPrayerTimesFallback();
    }
    render();
  }

  async function doEvent(op, note) {
    await detectMode();
    if (ui.mode === "backend") {
      const out = await callAttendanceBackend(op);
      ui.current = out.state;
      ui.config = Object.assign(defaultConfig(), out.config || {});
      render();
      setTimeout(schedulePresenceCheck, 0);
      return out;
    }
    const typeMap = {
      start: "start_day", pause: "pause", resume: "resume", restStart: "rest_start",
      prayerStart: "prayer_break_start", confirm: "presence_confirmed",
      missedCheck: "missed_check", end: "end_day"
    };
    const type = typeMap[op];
    if (!type) throw new Error("أمر دوام غير معروف");
    const cur = ui.current || {};
    if (op === "restStart" && Number(cur.restMinutes || 0) >= Number((ui.config || {}).dailyRestMinutes || REST_DEFAULT)) {
      throw new Error("تم استخدام Rest اليومي بالكامل.");
    }
    const st = pushLocalEvent(type, { note: note || "" });
    await loadProductivityFallback(st);
    ui.current = computeLocal(st);
    if (type !== "presence_confirmed") await saveCentralSnapshot(type, st, note);
    render();
    setTimeout(schedulePresenceCheck, 0);
    return { success: true, state: ui.current, config: ui.config };
  }

  async function requestNotifyPermission() {
    try {
      if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    } catch (e) {}
  }
  function notify(title, body) {
    try {
      if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body: body });
    } catch (e) {}
  }
  function fmtMinutes(mins) {
    mins = Math.max(0, Number(mins || 0));
    return String(Math.floor(mins / 60)).padStart(2, "0") + ":" + String(Math.floor(mins % 60)).padStart(2, "0");
  }
  function statusLabel(s) {
    return ({ working:"يعمل", paused:"Pause", rest:"Rest", prayer:"صلاة", ended:"انتهى اليوم", review:"يحتاج مراجعة", not_started:"لم يبدأ" })[s] || s || "-";
  }

  function injectStyles() {
    if (document.getElementById("trendAttendanceV1Styles")) return;
    const style = document.createElement("style");
    style.id = "trendAttendanceV1Styles";
    style.textContent = `
      #trendAttendanceV1{position:fixed;left:14px;bottom:14px;z-index:2147482000;width:min(390px,calc(100vw - 28px));font-family:Tahoma,Arial,sans-serif;direction:rtl;background:#fff;border:1px solid #d8e2ec;border-radius:16px;box-shadow:0 10px 35px rgba(20,45,70,.18);overflow:hidden;color:#153047}
      #trendAttendanceV1 .ta-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:#123a59;color:#fff}
      #trendAttendanceV1 .ta-body{padding:11px}.ta-badge{font-size:12px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.16)}
      .ta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.ta-stat{background:#f5f8fb;border:1px solid #e6edf4;border-radius:10px;padding:8px}.ta-stat b{display:block;font-size:16px;margin-top:3px}
      .ta-actions{display:flex;flex-wrap:wrap;gap:7px}.ta-btn{border:0;border-radius:10px;padding:9px 11px;min-height:40px;font-weight:700;cursor:pointer;background:#e9f0f6;color:#123a59}.ta-btn.primary{background:#0f766e;color:#fff}.ta-btn.warn{background:#f59e0b;color:#15202b}.ta-btn.danger{background:#b42318;color:#fff}.ta-btn:disabled{opacity:.45;cursor:not-allowed}
      .ta-note{font-size:12px;color:#66788a;margin-top:8px;line-height:1.5}.ta-mode{font-size:10px;opacity:.7;margin-top:5px}
      .ta-modal,.ta-start-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(8,25,40,.76);display:flex;align-items:center;justify-content:center;padding:18px;direction:rtl;font-family:Tahoma,Arial,sans-serif}.ta-modal.hidden,.ta-start-overlay.hidden{display:none}
      .ta-card,.ta-start-box{width:min(520px,100%);background:#fff;border-radius:18px;padding:22px;color:#153047;box-shadow:0 24px 80px rgba(0,0,0,.25)}.ta-start-box{text-align:center}.ta-card h2,.ta-start-box h2{margin:0 0 8px}.ta-card p,.ta-start-box p{line-height:1.65}
      .ta-manager-list{max-height:320px;overflow:auto}.ta-emp{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:6px;padding:8px;border-bottom:1px solid #e7edf3;font-size:12px}.ta-emp.review{background:#fff0f0}.ta-emp b{font-size:13px}
      @media(max-width:600px){#trendAttendanceV1{left:8px;bottom:8px;width:calc(100vw - 16px)}}
    `;
    document.head.appendChild(style);
  }

  function buildUi() {
    injectStyles();
    if (!ui.root) {
      ui.root = document.createElement("section");
      ui.root.id = "trendAttendanceV1";
      ui.root.innerHTML = `
        <div class="ta-head"><strong data-ta="title">🟢 تشغيل الموظف</strong><span class="ta-badge" data-ta="status">-</span></div>
        <div class="ta-body">
          <div data-ta="employeeBox">
            <div class="ta-grid">
              <div class="ta-stat">وقت العمل<b data-ta="work">00:00</b></div>
              <div class="ta-stat">التوقف<b data-ta="pause">00:00</b></div>
              <div class="ta-stat">الراحة<b data-ta="rest">00/30 د</b></div>
              <div class="ta-stat">إنجاز اليوم<b data-ta="orders">0 أوردر</b></div>
            </div>
            <div class="ta-actions">
              <button class="ta-btn primary" data-action="start">بداية اليوم</button>
              <button class="ta-btn warn" data-action="pause">Pause</button>
              <button class="ta-btn primary" data-action="resume">Resume</button>
              <button class="ta-btn" data-action="rest">Rest</button>
              <button class="ta-btn danger" data-action="end">نهاية اليوم</button>
            </div>
            <div class="ta-note">العمل الفعلي يستبعد Pause وRest واستراحة الصلاة.</div>
          </div>
          <div data-ta="managerBox" class="hidden">
            <div class="ta-manager-list" data-ta="managerList">جاري قراءة حالة الموظفين...</div>
          </div>
          <div class="ta-mode" data-ta="mode"></div>
        </div>`;
      document.body.appendChild(ui.root);
      ui.root.addEventListener("click", onRootClick);
      ui.employeeBox = ui.root.querySelector('[data-ta="employeeBox"]');
      ui.managerBox = ui.root.querySelector('[data-ta="managerBox"]');
    }
    if (!ui.overlay) {
      ui.overlay = document.createElement("div");
      ui.overlay.className = "ta-start-overlay hidden";
      ui.overlay.innerHTML = `<div class="ta-start-box"><h2>ابدأ يوم العمل</h2><p>اضغط «بداية اليوم» قبل بدء التشغيل. عند الخروج استخدم Pause. Rest اليومي 30 دقيقة افتراضيًا.</p><button class="ta-btn primary" data-action="overlayStart">بداية اليوم</button></div>`;
      document.body.appendChild(ui.overlay);
      ui.overlay.addEventListener("click", function (e) { if (e.target.dataset.action === "overlayStart") startDay(); });
    }
    if (!ui.presenceModal) {
      ui.presenceModal = document.createElement("div");
      ui.presenceModal.className = "ta-modal hidden";
      ui.presenceModal.innerHTML = `<div class="ta-card"><h2>تأكيد التواجد</h2><p>أكد أنك موجود في المكان وتتابع التشغيل الآن. عدم الرد يرفع الحالة للمراجعة فقط.</p><div class="ta-actions"><button class="ta-btn primary" data-action="confirmPresence">أنا موجود وبعمل</button><button class="ta-btn warn" data-action="presencePause">أنا خارج المكان - Pause</button></div></div>`;
      document.body.appendChild(ui.presenceModal);
      ui.presenceModal.addEventListener("click", onPresenceClick);
    }
    if (!ui.prayerModal) {
      ui.prayerModal = document.createElement("div");
      ui.prayerModal.className = "ta-modal hidden";
      ui.prayerModal.innerHTML = `<div class="ta-card"><h2 data-prayer-title>موعد استراحة الصلاة</h2><p>يمكن إيقاف عداد التشغيل خلال الاستراحة. لا يتم تسجيل أو تقييم ممارسة دينية فردية.</p><div class="ta-actions"><button class="ta-btn primary" data-action="prayerStart">بدء الاستراحة</button><button class="ta-btn" data-action="prayerLater">تذكير بعد 5 دقائق</button></div></div>`;
      document.body.appendChild(ui.prayerModal);
      ui.prayerModal.addEventListener("click", onPrayerClick);
    }
  }

  function render() {
    if (!ui.root || !currentUser()) return;
    const admin = isAdminUser();
    ui.employeeBox.classList.toggle("hidden", admin);
    ui.managerBox.classList.toggle("hidden", !admin);
    ui.root.querySelector('[data-ta="title"]').textContent = admin ? "📊 مدير التشغيل" : "🟢 تشغيل الموظف";
    ui.root.querySelector('[data-ta="mode"]').textContent = ui.mode === "backend" ? "Attendance Backend" : "Hybrid fallback متصل بـ TrendOS";
    if (admin) {
      ui.root.querySelector('[data-ta="status"]').textContent = "إدارة";
      ui.overlay.classList.add("hidden");
      renderManager();
      return;
    }
    const cur = ui.current || { status:"not_started" };
    const cfg = ui.config || defaultConfig();
    ui.root.querySelector('[data-ta="status"]').textContent = statusLabel(cur.status);
    ui.root.querySelector('[data-ta="work"]').textContent = fmtMinutes(cur.workMinutes);
    ui.root.querySelector('[data-ta="pause"]').textContent = fmtMinutes(cur.pauseMinutes);
    ui.root.querySelector('[data-ta="rest"]').textContent = Math.floor(Number(cur.restMinutes || 0)) + "/" + Number(cfg.dailyRestMinutes || REST_DEFAULT) + " د";
    ui.root.querySelector('[data-ta="orders"]').textContent = Number(cur.ordersCompleted || 0) + " أوردر";
    const buttons = {};
    ui.root.querySelectorAll("[data-action]").forEach(function (b) { buttons[b.dataset.action] = b; });
    const s = cur.status || "not_started";
    if (buttons.start) buttons.start.disabled = s !== "not_started" && s !== "ended";
    if (buttons.pause) buttons.pause.disabled = s !== "working";
    if (buttons.resume) buttons.resume.disabled = ["paused","rest","prayer","review"].indexOf(s) === -1;
    if (buttons.rest) buttons.rest.disabled = s !== "working" || Number(cur.restMinutes || 0) >= Number(cfg.dailyRestMinutes || REST_DEFAULT);
    if (buttons.end) buttons.end.disabled = s === "not_started" || s === "ended";
    ui.overlay.classList.toggle("hidden", !(cfg.requireStart && s === "not_started"));
  }

  async function startDay() {
    try {
      await requestNotifyPermission();
      await doEvent("start");
      notify("TrendOS", "تم بدء يوم العمل.");
      schedulePresenceCheck();
    } catch (e) { alert(e.message); }
  }
  async function endDay() {
    if (!confirm("إنهاء يوم العمل الآن؟")) return;
    try { await doEvent("end"); notify("TrendOS", "تم إنهاء يوم العمل."); } catch (e) { alert(e.message); }
  }
  async function onRootClick(e) {
    const a = e.target && e.target.dataset && e.target.dataset.action;
    if (!a) return;
    try {
      if (a === "start") await startDay();
      else if (a === "pause") await doEvent("pause");
      else if (a === "resume") await doEvent("resume");
      else if (a === "rest") await doEvent("restStart");
      else if (a === "end") await endDay();
    } catch (err) { alert(err.message); }
  }

  function schedulePresenceCheck() {
    clearTimeout(ui.timers.presence);
    const cur = ui.current || {};
    if (cur.status !== "working" || isAdminUser()) return;
    const minutes = Math.max(5, Number((ui.config || {}).presenceCheckMinutes || CHECK_DEFAULT));
    ui.timers.presence = setTimeout(openPresenceCheck, minutes * 60000);
  }
  function openPresenceCheck() {
    if (!ui.current || ui.current.status !== "working" || ui.presenceOpen || isAdminUser()) return;
    ui.presenceOpen = true;
    ui.presenceOpenedAt = nowMs();
    ui.presenceModal.classList.remove("hidden");
    notify("TrendOS - تأكيد التواجد", "أكد أنك موجود وتتابع التشغيل الآن.");
    clearTimeout(ui.timers.presenceDeadline);
    const mins = Math.max(1, Number((ui.config || {}).presenceResponseMinutes || RESPONSE_DEFAULT));
    ui.timers.presenceDeadline = setTimeout(async function () {
      if (!ui.presenceOpen) return;
      ui.presenceOpen = false;
      ui.presenceModal.classList.add("hidden");
      try { await doEvent("missedCheck", "لم يتم الرد خلال مهلة تأكيد التواجد"); } catch (e) {}
      notify("TrendOS", "تم رفع عدم تأكيد التواجد للمراجعة.");
      schedulePresenceCheck();
    }, mins * 60000);
  }
  async function onPresenceClick(e) {
    const a = e.target && e.target.dataset && e.target.dataset.action;
    if (!a) return;
    clearTimeout(ui.timers.presenceDeadline);
    ui.presenceOpen = false;
    ui.presenceModal.classList.add("hidden");
    try {
      if (a === "confirmPresence") await doEvent("confirm");
      else if (a === "presencePause") await doEvent("pause");
    } catch (err) { alert(err.message); }
    schedulePresenceCheck();
  }

  function hmToMinutes(hm) {
    const m = txt(hm).match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }
  async function loadPrayerTimesFallback() {
    if (ui.mode !== "fallback" || !(ui.config || {}).prayerReminders) return;
    if (ui.current && ui.current.prayerTimes && Object.keys(ui.current.prayerTimes).length) return;
    try {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2,"0"), mm = String(d.getMonth()+1).padStart(2,"0"), yy = d.getFullYear();
      const url = "https://api.aladhan.com/v1/timingsByCity/" + dd + "-" + mm + "-" + yy + "?city=Benha&country=Egypt&method=5";
      const res = await fetch(url, { cache:"no-store" });
      const obj = await res.json();
      const t = obj && obj.data && obj.data.timings ? obj.data.timings : {};
      const clean = {};
      ["Fajr","Dhuhr","Asr","Maghrib","Isha"].forEach(function (k) { if (t[k]) clean[k] = txt(t[k]).slice(0,5); });
      if (ui.current) ui.current.prayerTimes = clean;
    } catch (e) {}
  }
  function checkPrayerTime() {
    if (!ui.current || ui.current.status !== "working" || isAdminUser()) return;
    const prayers = ui.current.prayerTimes || {};
    const d = new Date(), cur = d.getHours()*60+d.getMinutes();
    Object.keys(prayers).forEach(function (name) {
      const p = hmToMinutes(prayers[name]);
      if (p === null || Math.abs(cur-p) > 1) return;
      const key = dateKey() + "|" + name;
      if (ui.lastPrayerKey === key) return;
      ui.lastPrayerKey = key;
      ui.prayerModal.querySelector("[data-prayer-title]").textContent = "موعد استراحة الصلاة - " + name;
      ui.prayerModal.classList.remove("hidden");
      notify("TrendOS - استراحة الصلاة", "يمكن إيقاف عداد التشغيل خلال الاستراحة.");
    });
  }
  async function onPrayerClick(e) {
    const a = e.target && e.target.dataset && e.target.dataset.action;
    if (!a) return;
    if (a === "prayerLater") {
      ui.prayerModal.classList.add("hidden");
      setTimeout(function () { if (ui.current && ui.current.status === "working") ui.prayerModal.classList.remove("hidden"); }, 5*60000);
    } else if (a === "prayerStart") {
      ui.prayerModal.classList.add("hidden");
      try { await doEvent("prayerStart"); } catch (err) { alert(err.message); }
    }
  }

  async function renderManager() {
    if (!isAdminUser() || !ui.managerBox) return;
    const list = ui.root.querySelector('[data-ta="managerList"]');
    try {
      const out = await api("getMatbagyNotes", {});
      const latest = {};
      (out.notes || []).forEach(function (n) {
        if (txt(n.category) !== CATEGORY) return;
        const p = safeJson(txt(n.content), null);
        if (!p || p.date !== dateKey() || !p.username) return;
        const prev = latest[p.username];
        if (!prev || new Date(p.at) > new Date(prev.at)) latest[p.username] = p;
      });
      const names = Object.keys(latest).sort();
      if (!names.length) {
        list.innerHTML = '<div class="ta-note">لا توجد جلسات موظفين مسجلة اليوم حتى الآن.</div>';
        return;
      }
      list.innerHTML = names.map(function (name) {
        const p = latest[name];
        return '<div class="ta-emp '+(p.needsReview?'review':'')+'"><b>'+escapeHtml(name)+'</b><span>'+escapeHtml(statusLabel(p.status))+'</span><span>'+fmtMinutes(p.workMinutes)+' عمل</span><span>'+escapeHtml(p.department||'-')+'</span><span>'+Number(p.ordersCompleted||0)+' أوردر</span><span>'+ (p.needsReview?'⚠ مراجعة':'✓') +'</span></div>';
      }).join("");
      const review = names.filter(function (n) { return latest[n].needsReview; });
      if (review.length) notify("TrendOS - مدير التشغيل", "يوجد موظف يحتاج مراجعة: " + review.join("، "));
    } catch (e) {
      list.innerHTML = '<div class="ta-note">تعذر قراءة لوحة الموظفين الآن.</div>';
    }
  }
  function escapeHtml(v) {
    return txt(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  function beginLoops() {
    clearInterval(ui.timers.state);
    clearInterval(ui.timers.prayer);
    clearInterval(ui.timers.manager);
    ui.timers.state = setInterval(async function () {
      await loadState();
    }, 60000);
    ui.timers.prayer = setInterval(checkPrayerTime, 60000);
    ui.timers.manager = setInterval(function () { if (isAdminUser()) renderManager(); }, 120000);
    schedulePresenceCheck();
  }

  function waitForLogin() {
    buildUi();
    const poll = setInterval(async function () {
      const u = currentUser();
      if (!u || !u.token) {
        ui.root.style.display = "none";
        ui.overlay.classList.add("hidden");
        return;
      }
      clearInterval(poll);
      ui.root.style.display = "block";
      await loadState();
      beginLoops();
    }, 700);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && currentUser() && currentUser().token) loadState();
  });
  waitForLogin();
})();