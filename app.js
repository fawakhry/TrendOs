(function () {
  "use strict";

  const API_URL = (window.TREND_API_URL || window.API_URL || "").trim();
  const REFRESH_MS = 10000;
  const UI_VERSION = "1840_WHATSAPP_SAME_TAB";

  const screens = {
    service: "خدمة العملاء",
    print: "الطباعة",
    laser: "الليزر",
    press: "المكبس"
  };

  const roleScreens = {
    admin: ["service", "print", "laser", "press"],
    service: ["service"],
    print: ["print"],
    laser: ["laser"],
    press: ["press"]
  };

  // الحالات التي يحتاجها المستخدم في التشغيل فقط.
  // تم حذف: جاهز للطباعة / تم التنفيذ / مكرر من الاختيارات اليومية حتى لا تلخبط التشغيل.
  const statuses = [
    "طلب جديد",
    "بدأ التنفيذ",
    "تحت التنفيذ",
    "جاهز للاستلام",
    "تم التسليم",
    "مشكلة",
    "متوقف"
  ];

  // حالات لا تظهر في شاشة التشغيل بعد حفظها.
  // تفضل موجودة في الشيت للتاريخ والمتابعة، لكنها تختفي من شاشة المستخدمين.
  const HIDDEN_FROM_USER_SCREENS = ["جاهز للاستلام", "تم التسليم", "مكرر", "تم التنفيذ", "جاهز للطباعة"];
  const PRIORITY_RANK = { "عاجل": 0, "VIP": 0, "عادي": 1, "": 1, "مؤجل": 2 };

  function isHiddenFromUserScreens(status) {
    return HIDDEN_FROM_USER_SCREENS.indexOf(text(status)) !== -1;
  }

  function priorityRank(priority) {
    const p = text(priority);
    return Object.prototype.hasOwnProperty.call(PRIORITY_RANK, p) ? PRIORITY_RANK[p] : 9;
  }

  function isActiveDefaultPriority(priority) {
    const p = text(priority) || "عادي";
    return p === "عاجل" || p === "عادي" || p === "VIP";
  }

  function isHeatPress(value) {
    const v = text(value).trim();
    return v === "نعم" || v === "true" || v === "TRUE" || v === "1" || v === "on" || v === "مكبس";
  }

  function isFlyPrint(value) {
    const v = text(value).trim().toLowerCase();
    return v === "نعم" || v === "true" || v === "1" || v === "on" || v === "طباعة على الطاير" || v === "طباعة ع الطاير" || v === "على الطاير" || v === "ع الطاير";
  }

  function numericAmount(value) {
    const raw = arabicDigitsToEnglish(value).replace(/[^0-9.\-]/g, "");
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  }

  function hasDebt(row) {
    return !!(row && (row.debtHold === true || row.debtHold === "نعم" || numericAmount(row.debtAmount || row.remainingBalance || row.customerDebt) > 0));
  }

  function debtAmount(row) {
    return numericAmount((row && (row.debtAmount || row.remainingBalance || row.customerDebt)) || 0);
  }

  function debtLabel(row) {
    const amount = debtAmount(row);
    return amount > 0 ? (amount + " ج مديونية") : "مديونية";
  }

  function showHeatPressForDepartment(department) {
    const d = text(department);
    return d === "طباعة" || d === "متعدد الأقسام";
  }

  function updateHeatPressVisibility() {
    const box = $("heatPressBox");
    const chk = $("newHeatPress");
    const dep = $("newDepartment");
    if (!box || !chk || !dep) return;
    const show = showHeatPressForDepartment(dep.value);
    box.classList.toggle("hidden", !show);
    if (!show) chk.checked = false;
  }

  function showFlyPrintForDepartment(department) {
    return text(department) === "طباعة";
  }

  function updateFlyPrintVisibility() {
    const box = $("flyPrintBox");
    const chk = $("newFlyPrint");
    const dep = $("newDepartment");
    if (!box || !chk || !dep) return;
    const show = showFlyPrintForDepartment(dep.value);
    box.classList.toggle("hidden", !show);
    if (!show) chk.checked = false;
    syncFlyPrintRules();
  }

  function syncFlyPrintRules() {
    const chk = $("newFlyPrint");
    const dep = $("newDepartment");
    const priority = $("newPriority");
    if (!chk || !dep || !priority) return;
    const checked = chk.checked && text(dep.value) === "طباعة";
    if (checked) {
      priority.value = "عاجل";
      priority.disabled = true;
      setMsg("addOrderStatus", "طباعة على الطاير = عاجل والتسليم نفس اليوم.", false);
    } else {
      priority.disabled = false;
    }
  }

  const state = {
    user: null,
    screen: "service",
    rows: [],
    dashboard: null,
    knowledge: [],
    refreshTimer: null,
    suggestionTimer: null,
    tableSuggestionTimer: null,
    saving: false,
    editing: false,
    currentPage: 1,
    pageSize: 5,
    urgentNotificationTimer: null,
    urgentNotificationEnabled: false,
    urgentNotificationSeen: {}
  };

  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? "" : v);

  function normalizeArabic(value) {
    return text(value)
      .toLowerCase()
      .replace(/[إأآا]/g, "ا")
      .replace(/[ى]/g, "ي")
      .replace(/[ؤ]/g, "و")
      .replace(/[ئ]/g, "ي")
      .replace(/[ةه]/g, "ه")
      .replace(/\s+/g, " ")
      .trim();
  }

  function safeRole(role) {
    return role && roleScreens[role] ? role : "service";
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }



  function arabicDigitsToEnglish(value) {
    const map = { "٠":"0", "١":"1", "٢":"2", "٣":"3", "٤":"4", "٥":"5", "٦":"6", "٧":"7", "٨":"8", "٩":"9" };
    return text(value).replace(/[٠-٩]/g, function (d) { return map[d] || d; });
  }

  function whatsappPhone(phone) {
    let digits = arabicDigitsToEnglish(phone).replace(/[^0-9]/g, "");
    if (!digits) return "";
    if (digits.length === 10 && digits.charAt(0) === "1") digits = "20" + digits;
    else if (digits.length === 11 && digits.charAt(0) === "0") digits = "20" + digits.slice(1);
    else if (digits.length === 12 && digits.slice(0, 2) === "20") digits = digits;
    else if (digits.length > 12 && digits.slice(0, 2) === "00") digits = digits.slice(2);
    return digits;
  }

  function isReadyForCustomer(status) {
    return ["تم التنفيذ", "جاهز للاستلام", "تم التسليم"].indexOf(text(status)) !== -1;
  }

  function formatDisplayDate(value) {
    if (!value) return "";
    const raw = text(value).trim();
    if (!raw || raw === "-" || raw.indexOf("#ERROR") !== -1 || raw.indexOf("#VALUE") !== -1) return "";

    // لو القيمة جاية من Google Sheets كـ Date String زي:
    // Tue Jun 16 2026 10:00:00 GMT+0300 ...
    // نعرضها كتاريخ مختصر بدل النص الطويل.
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }

    return raw;
  }

  function displayExpectedDelivery(row) {
    return formatDisplayDate(row.expectedDeliveryText) ||
      formatDisplayDate(row.expectedDeliveryAt || row.expectedDelivery) ||
      expectedDeliveryTextFromNow();
  }

  function parseRowDate(value) {
    const raw = text(value).trim();
    if (!raw) return null;
    let m = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  function isOverdueRow(row) {
    if (row && (row.overdue === true || row.overdue === "نعم" || row.overdue === "true")) return true;
    const status = text(row.status);
    if (["تم التنفيذ", "جاهز للاستلام", "تم التسليم", "مكرر"].indexOf(status) !== -1) return false;
    const d = parseRowDate(row.expectedDeliveryAt || row.expectedDeliveryText || row.expectedDelivery);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  function startOfDay(date) {
    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function sameDay(a, b) {
    if (!a || !b) return false;
    const da = startOfDay(a);
    const db = startOfDay(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
    return da.getTime() === db.getTime();
  }

  function isTodayWorkRow(row) {
    // شغل اليوم = أوردر مستلم امبارح، والمفروض يتسلم بكرة.
    const received = parseRowDate(row.receivedAt || row.createdAt || row.created || "");
    let expected = parseRowDate(row.expectedDeliveryAt || row.expectedDeliveryText || row.expectedDelivery || "");
    if (!expected && received) expected = addDays(received, 2);
    const today = startOfDay(new Date());
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);
    return sameDay(received, yesterday) && sameDay(expected, tomorrow);
  }

  function isDeliveredTodayRow(row) {
    if (text(row.status) !== "تم التسليم") return false;
    const updated = parseRowDate(row.updatedAt || row.deliveredAt || "");
    return sameDay(updated, new Date());
  }

  function defaultWorkSortRank(row) {
    const p = text(row.priority) || "عادي";
    if (p === "عاجل" || p === "VIP") return 0;
    if (isOverdueRow(row)) return 1;
    if (isTodayWorkRow(row)) return 2;
    if (p === "عادي" || !p) return 3;
    if (p === "مؤجل") return 4;
    return 5;
  }

  function displayPhone(phone) {
    let digits = arabicDigitsToEnglish(phone).replace(/[^0-9]/g, "");
    if (!digits) return "";
    if (digits.indexOf("0020") === 0 && digits.length >= 14) digits = "0" + digits.slice(4);
    else if (digits.indexOf("20") === 0 && digits.length === 12) digits = "0" + digits.slice(2);
    else if (digits.length === 10 && digits.charAt(0) === "1") digits = "0" + digits;
    return digits;
  }

  function safeDisplayPhone(phone) {
    const s = text(phone).trim();
    if (!s || s.indexOf("#ERROR") !== -1 || s.indexOf("#VALUE") !== -1) return "";
    return displayPhone(s);
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function expectedDeliveryTextFromNow() {
    return addDays(new Date(), 2).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  }

  function buildWhatsAppMessage(row, mode) {
    const customer = row.customer ? " يا " + row.customer : "";
    const orderId = row.orderId || row.lineId || "-";
    const item = row.itemName || "الأوردر";
    const dept = row.department || "-";
    const status = row.status || "طلب جديد";
    const expected = displayExpectedDelivery(row);

    if (mode === "registered") {
      const debtWarning = hasDebt(row) ? `\n\nتنبيه مهم: يوجد مديونية حالية ${debtLabel(row)}.\nهنستقبل الأوردر ونسجله، لكن التسليم النهائي أو متابعة التشغيل الكاملة تتوقف لحين تقفيل المديونية.` : "";
      return `أهلاً${customer} 🌟
تم تسجيل الأوردر بنجاح.
رقم الأوردر: ${orderId}
نوع الشغل: ${item}
القسم: ${dept}
التسليم المتوقع: ${expected}${debtWarning}

ملاحظة مهمة: لو حضرتك هتبعت شغل جديد بعد كده، هيتم تسجيله كأوردر جديد برقم جديد عشان نقدر نتابعه صح.
Trend Mall`;
    }

    if (mode === "ready") {
      if (status === "تم التسليم") {
        return `أهلاً${customer} 🌟
تم تسليم الأوردر رقم ${orderId}.
شكراً لتعاملكم مع Trend Mall.`;
      }
      if (status === "جاهز للاستلام" || status === "تم التنفيذ") {
        return `أهلاً${customer} 🌟
الأوردر رقم ${orderId} جاهز للاستلام.
نوع الشغل: ${item}
القسم: ${dept}
Trend Mall`;
      }
      return `أهلاً${customer} 🌟
تم الانتهاء من تنفيذ الأوردر رقم ${orderId}.
نوع الشغل: ${item}
القسم: ${dept}
يمكنك التواصل معنا لتأكيد الاستلام.
Trend Mall`;
    }

    return `أهلاً${customer} 👋
بخصوص الأوردر رقم ${orderId}
الحالة الحالية: ${status}
القسم: ${dept}
نوع الشغل: ${item}${row.notes ? "\nملاحظات: " + row.notes : ""}
التسليم المتوقع: ${expected}
Trend Mall`;
  }

  let trendosWhatsAppWindow = null;

  function openWhatsAppUrl(phone, message) {
    const normalized = whatsappPhone(phone);
    if (!normalized) {
      alert("رقم العميل غير موجود أو غير صالح لفتح واتساب.");
      return false;
    }

    // V1841: افتح كل رسائل TrendOS في نافذة/تاب واتساب واحد ثابت.
    // ملاحظة مهمة: المتصفح لا يسمح لموقع TrendOS بالبحث داخل التابات القديمة التي فتحها المستخدم يدويًا،
    // لذلك أول مرة بعد التحديث افتح واتساب من زر TrendOS نفسه، وبعدها سيتم استخدام نفس التاب.
    const url = "https://web.whatsapp.com/send?phone=" + normalized + "&text=" + encodeURIComponent(message || "");
    const targetName = "TrendOS_WhatsApp";

    try {
      if (trendosWhatsAppWindow && !trendosWhatsAppWindow.closed) {
        trendosWhatsAppWindow.location.href = url;
        trendosWhatsAppWindow.focus();
        return true;
      }
    } catch (err) {
      // بعض المتصفحات تفصل مرجع النافذة بعد الانتقال إلى واتساب، فنرجع لاسم التاب الثابت.
    }

    trendosWhatsAppWindow = window.open(url, targetName);

    if (!trendosWhatsAppWindow) {
      alert("المتصفح منع فتح واتساب. اسمح بفتح النوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى.");
      return false;
    }

    try { trendosWhatsAppWindow.focus(); } catch (err) {}
    return true;
  }

  function buildUrl(action, params, callbackName) {
    const query = new URLSearchParams();
    query.set("action", action);
    if (callbackName) query.set("callback", callbackName);
    Object.keys(params || {}).forEach(function (key) {
      const value = params[key];
      if (value !== undefined && value !== null) query.set(key, value);
    });
    return API_URL + (API_URL.indexOf("?") === -1 ? "?" : "&") + query.toString();
  }

  function api(action, params) {
    return new Promise(function (resolve, reject) {
      if (!API_URL || API_URL.indexOf("PUT_YOUR_WEB_APP_URL_HERE") !== -1) {
        reject(new Error("رابط Web App غير موجود في config.js"));
        return;
      }

      const callbackName = "trendos_cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const script = document.createElement("script");
      const timer = setTimeout(function () {
        cleanup();
        reject(new Error("انتهت مهلة الاتصال بالسيرفر."));
      }, 25000);

      function cleanup() {
        clearTimeout(timer);
        try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
        if (script && script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (data) {
        cleanup();
        resolve(data || {});
      };

      script.onerror = function () {
        cleanup();
        reject(new Error("فشل الاتصال بالسيرفر. راجع رابط Web App أو صلاحيات النشر."));
      };

      script.src = buildUrl(action, params || {}, callbackName);
      document.body.appendChild(script);
    });
  }

  function authParams(extra) {
    const user = state.user || {};
    return Object.assign({
      username: user.username || user.name || "",
      token: user.token || ""
    }, extra || {});
  }


  /*********************** إشعارات طباعة على الطاير ***********************/

  function urgentNotificationsSupported() {
    return typeof window !== "undefined" && "Notification" in window;
  }

  function urgentNotificationStorageKey() {
    const user = state.user || {};
    return "trendos_fly_print_notifications_" + (user.username || user.name || "guest");
  }

  function loadUrgentNotificationPreference() {
    try {
      return localStorage.getItem(urgentNotificationStorageKey()) === "1";
    } catch (e) {
      return false;
    }
  }

  function saveUrgentNotificationPreference(enabled) {
    try {
      localStorage.setItem(urgentNotificationStorageKey(), enabled ? "1" : "0");
    } catch (e) {}
  }

  function urgentNotifyKey(row) {
    return [row.orderId || "", row.lineId || "", row.status || "", displayExpectedDelivery(row) || "", row.flyPrint || row.quickPrint || ""].join("|");
  }

  function urgentNotificationRows(rows) {
    const excluded = ["تم التسليم", "جاهز للاستلام", "ملغى", "مكرر"];
    return (rows || []).filter(function (r) {
      const status = text(r.status);
      const fly = isFlyPrint(r.flyPrint || r.quickPrint || r.fastPrint || r["طباعة على الطاير"] || r["طباعة ع الطاير"]);
      if (!fly) return false;
      if (excluded.indexOf(status) !== -1) return false;
      if (isHiddenFromUserScreens(status)) return false;
      return true;
    });
  }

  function showUrgentBrowserNotification(row) {
    if (!urgentNotificationsSupported() || Notification.permission !== "granted") return;
    const title = "طباعة على الطاير: " + (row.orderId || row.lineId || "-");
    const body = [
      "العميل: " + (row.customer || "-"),
      "القسم: " + (row.department || "-"),
      "الحالة: " + (row.status || "طلب جديد"),
      "التسليم: " + (displayExpectedDelivery(row) || "-")
    ].join("\n");

    try {
      const notification = new Notification(title, {
        body: body,
        tag: "trendos-fly-print-" + (row.lineId || row.orderId || Date.now()),
        renotify: true,
        icon: ""
      });
      notification.onclick = function () {
        try { window.focus(); } catch (e) {}
      };
    } catch (e) {}
  }

  async function checkUrgentNotifications() {
    if (!state.urgentNotificationEnabled) return;
    try {
      const res = await api("getRows", authParams({ screen: state.screen }));
      if (!res.success) return;
      const urgentRows = urgentNotificationRows(Array.isArray(res.rows) ? res.rows : []);
      urgentRows.forEach(function (row) {
        const key = urgentNotifyKey(row);
        if (state.urgentNotificationSeen[key]) return;
        state.urgentNotificationSeen[key] = true;
        showUrgentBrowserNotification(row);
      });
    } catch (e) {}
  }

  function updateUrgentNotificationButton() {
    const btn = $("urgentNotificationsBtn");
    if (!btn) return;
    if (!urgentNotificationsSupported()) {
      btn.textContent = "🔕 المتصفح لا يدعم الإشعارات";
      btn.disabled = true;
      return;
    }
    btn.classList.toggle("active", !!state.urgentNotificationEnabled);
    btn.textContent = state.urgentNotificationEnabled ? "🔔 إشعارات طباعة على الطاير مفعلة" : "🔔 تفعيل إشعارات طباعة على الطاير";
  }

  function startUrgentNotificationTimer() {
    stopUrgentNotificationTimer();
    if (!state.urgentNotificationEnabled) return;
    checkUrgentNotifications();
    state.urgentNotificationTimer = setInterval(checkUrgentNotifications, 10 * 60 * 1000);
  }

  function stopUrgentNotificationTimer() {
    if (state.urgentNotificationTimer) clearInterval(state.urgentNotificationTimer);
    state.urgentNotificationTimer = null;
  }

  async function enableUrgentNotifications() {
    if (!urgentNotificationsSupported()) {
      alert("المتصفح الحالي لا يدعم إشعارات سطح المكتب.");
      return;
    }

    if (Notification.permission === "denied") {
      alert("الإشعارات مرفوضة من المتصفح. فعّلها من إعدادات الموقع أولًا.");
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("لم يتم تفعيل الإشعارات.");
        return;
      }
    }

    state.urgentNotificationEnabled = true;
    saveUrgentNotificationPreference(true);
    updateUrgentNotificationButton();
    startUrgentNotificationTimer();
    alert("تم تفعيل إشعارات طباعة على الطاير. سيتم الفحص كل 10 دقائق.");
  }

  function setMsg(id, msg, isError) {
    const el = $(id);
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("error", !!isError);
    el.classList.toggle("ok", !!msg && !isError);
  }

  function setLoading(msg, isError) {
    const el = $("loadingText");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("error", !!isError);
  }

  function showLogin() {
    $("loginView").classList.remove("hidden");
    $("mainView").classList.add("hidden");
    $("passwordModal").classList.add("hidden");
    stopRefresh();
  }

  function showMain() {
    $("loginView").classList.add("hidden");
    $("mainView").classList.remove("hidden");
  }

  function saveSession() {
    localStorage.setItem("trendos_session", JSON.stringify({ user: state.user, screen: state.screen }));
  }

  function loadSession() {
    try {
      const data = JSON.parse(localStorage.getItem("trendos_session") || "null");
      if (data && data.user && data.user.token) {
        state.user = data.user;
        state.screen = data.screen || "service";
        return true;
      }
    } catch (e) {}
    return false;
  }

  function clearSession() {
    localStorage.removeItem("trendos_session");
    state.user = null;
    state.rows = [];
  }

  async function doLogin() {
    const username = $("username").value.trim();
    const password = $("password").value.trim();
    setMsg("loginMsg", "", false);

    if (!username || !password) {
      setMsg("loginMsg", "اكتب اسم المستخدم وكلمة المرور.", true);
      return;
    }

    const btn = $("loginBtn");
    btn.disabled = true;
    btn.textContent = "جاري الدخول...";

    try {
      const res = await api("login", { username, password });
      if (!res.success) {
        setMsg("loginMsg", res.message || "فشل تسجيل الدخول.", true);
        return;
      }

      state.user = res.user || {};
      const allowed = roleScreens[safeRole(state.user.role)] || ["service"];
      state.screen = allowed.indexOf(state.screen) !== -1 ? state.screen : allowed[0];
      saveSession();
      bootMain();
      if (state.user.mustChange) openPasswordModal();
    } catch (err) {
      setMsg("loginMsg", err.message || "حصل خطأ أثناء الدخول.", true);
    } finally {
      btn.disabled = false;
      btn.textContent = "دخول";
    }
  }

  function bootMain() {
    showMain();
    state.urgentNotificationEnabled = loadUrgentNotificationPreference();
    renderHeader();
    renderTabs();
    toggleAddOrder();
    toggleAddCustomer();
    toggleDashboard();
    toggleKnowledge();
    setupCollapsibleCards();
    toggleEndDayButton();
    loadRows();
    updateUrgentNotificationButton();
    startRefresh();
    if (state.urgentNotificationEnabled) startUrgentNotificationTimer();
  }

  function renderHeader() {
    const user = state.user || {};
    $("welcomeTitle").textContent = "أهلاً " + (user.name || user.username || "");
    $("roleLabel").textContent = "القسم: " + (user.department || "-") + " | الصلاحية: " + (user.role || "-");
    $("screenTitle").textContent = screens[state.screen] || "الأوردرات";
    toggleEndDayButton();
  }

  function renderTabs() {
    const tabs = $("tabs");
    tabs.innerHTML = "";
    const allowed = roleScreens[safeRole((state.user || {}).role)] || ["service"];

    allowed.forEach(function (screen) {
      const btn = document.createElement("button");
      btn.className = screen === state.screen ? "active" : "";
      btn.textContent = screens[screen];
      btn.onclick = function () {
        state.screen = screen;
        state.editing = false;
        saveSession();
        renderHeader();
        renderTabs();
        toggleAddOrder();
        toggleAddCustomer();
        toggleDashboard();
        toggleKnowledge();
        setupCollapsibleCards();
        toggleEndDayButton();
        loadRows();
      };
      tabs.appendChild(btn);
    });
  }

  function toggleAddOrder() {
    const role = safeRole((state.user || {}).role);
    const canAdd = role === "admin" || role === "service";
    $("addOrderCard").classList.toggle("hidden", !canAdd);
  }


  function toggleAddCustomer() {
    const role = safeRole((state.user || {}).role);
    const username = normalizeArabic((state.user || {}).username || (state.user || {}).name || "");
    const canAdd = role === "admin" || role === "service" || username === "ضياء" || username === "رحمه" || username === "رحمة";
    const card = $("addCustomerCard");
    if (card) card.classList.toggle("hidden", !canAdd);
    const manager = $("newClientManager");
    if (manager && !manager.value.trim()) manager.value = (state.user || {}).name || (state.user || {}).username || "";
  }

  function toggleDashboard() {
    const card = $("managementDashboard");
    if (!card) return;
    // V1822: متابعة اليوم تظهر لكل المستخدمين بوضوح، حتى نتاكد أن النسخة الجديدة اتحملت.
    card.classList.remove("hidden");
    loadDashboard(false);
  }

  async function loadDashboard(force) {
    const card = $("managementDashboard");
    if (!card) return;
    const status = $("dashboardStatus");
    if (status) status.textContent = "جاري تحديث المتابعة...";
    try {
      const res = await api("getDashboard", authParams({ screen: state.screen }));
      if (!res.success) {
        if (status) status.textContent = res.message || "تعذر تحميل المتابعة";
        return;
      }
      state.dashboard = res.dashboard || res;
      renderDashboard(state.dashboard);
      if (status) status.textContent = "آخر تحديث: " + new Date().toLocaleTimeString("ar-EG");
    } catch (err) {
      if (status) status.textContent = err.message || "خطأ في تحميل المتابعة";
    }
  }

  function dashboardItem(label, value, cls) {
    return '<div class="dash-item ' + (cls || '') + '"><span>' + escapeHtml(label) + '</span><b>' + escapeHtml(value == null ? 0 : value) + '</b></div>';
  }

  function renderDashboard(d) {
    const grid = $("dashboardGrid");
    if (!grid) return;
    const deptName = d.departmentName || screens[state.screen] || "القسم";
    const byDept = d.byDepartment || {};
    const todayWork = d.todayWorkSheets || 0;
    const todayLines = d.todayWorkLines || 0;
    const todayOrders = d.todayWorkOrders || d.todayOrders || 0;
    const score = d.performanceScore == null ? 0 : d.performanceScore;
    const completion = d.completionPercent == null ? 0 : d.completionPercent;
    const timeScore = d.timeScore == null ? 0 : d.timeScore;
    grid.innerHTML =
      '<div class="dash-note">متابعة ' + escapeHtml(deptName) + ' — شغل اليوم = الأوردرات المستلمة أمس والمفروض تتسلم بكرة.</div>' +
      dashboardItem("تقييم القسم", score + "%", score >= 80 ? "done" : (score >= 50 ? "ready" : "danger")) +
      dashboardItem("إنجاز الشغل", completion + "%", "done") +
      dashboardItem("تقييم الوقت", timeScore + "%", timeScore >= 80 ? "done" : "danger") +
      dashboardItem("شغل اليوم", todayWork, "todaywork") +
      dashboardItem("بنود شغل اليوم", todayLines, "") +
      dashboardItem("أوردرات شغل اليوم", todayOrders, "") +
      dashboardItem("متأخر", d.overdue || 0, "danger") +
      dashboardItem("تم التسليم اليوم", d.deliveredToday || 0, "done") +
      dashboardItem("جاهز للاستلام", d.readyForPickup || 0, "ready") +
      dashboardItem("عاجل مفتوح", d.urgent || 0, "urgent") +
      dashboardItem("عادي مفتوح", d.normal || 0, "") +
      dashboardItem("إجمالي مفتوح", d.activeOrders || 0, "") +
      dashboardItem("مديونية", d.debtOrders || 0, "danger") +
      dashboardItem("مكبس حراري", d.heatPress || byDept["مكبس"] || 0, "press");
  }




  /*********************** كروت قابلة للفتح والقفل + نهاية اليوم V1839 ***********************/

  function setupCollapsibleCard(cardId, storageKey, defaultCollapsed) {
    const card = $(cardId);
    if (!card || card.dataset.collapsibleReady === "1") return;
    const header = card.querySelector(".table-tools");
    if (!header) return;

    const body = document.createElement("div");
    body.className = "collapsible-body";
    const nodes = [];
    let node = header.nextSibling;
    while (node) {
      const next = node.nextSibling;
      nodes.push(node);
      node = next;
    }
    nodes.forEach(function (n) { body.appendChild(n); });
    card.appendChild(body);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghost collapse-toggle";
    header.appendChild(btn);

    let collapsed = !!defaultCollapsed;
    try {
      const saved = localStorage.getItem("trendos_collapse_" + storageKey);
      if (saved === "open") collapsed = false;
      if (saved === "closed") collapsed = true;
    } catch (e) {}

    function apply() {
      card.classList.toggle("collapsed-card", collapsed);
      btn.textContent = collapsed ? "فتح ▼" : "قفل ▲";
    }

    btn.addEventListener("click", function () {
      collapsed = !collapsed;
      try { localStorage.setItem("trendos_collapse_" + storageKey, collapsed ? "closed" : "open"); } catch (e) {}
      apply();
    });

    card.dataset.collapsibleReady = "1";
    apply();
  }

  function setupCollapsibleCards() {
    setupCollapsibleCard("addOrderCard", "add_order", true);
    setupCollapsibleCard("addCustomerCard", "add_customer", true);
    setupCollapsibleCard("aiKnowledgeCard", "ai_knowledge", true);
  }

  function canUseEndDayButton() {
    const role = safeRole((state.user || {}).role);
    const dep = normalizeArabic((state.user || {}).department || "");
    return state.screen === "print" || state.screen === "laser" || role === "print" || role === "laser" || dep.indexOf("طباعه") !== -1 || dep.indexOf("ليزر") !== -1;
  }

  function toggleEndDayButton() {
    const btn = $("endDayBtn");
    if (!btn) return;
    btn.classList.toggle("hidden", !canUseEndDayButton());
  }

  function workLevel(score) {
    score = Number(score || 0);
    if (score >= 85) return "ممتاز";
    if (score >= 70) return "جيد جدًا";
    if (score >= 50) return "جيد";
    return "محتاج متابعة";
  }

  async function showEndDaySummary() {
    if (!canUseEndDayButton()) return;
    await loadDashboard(true);
    const d = state.dashboard || {};
    const deptName = d.departmentName || screens[state.screen] || "القسم";
    const prepared = Number(d.readyOrders || 0) + Number(d.deliveredTodayOrders || 0);
    const score = d.performanceScore == null ? 0 : d.performanceScore;
    const msg = [
      "ملخص نهاية اليوم - " + deptName,
      "",
      "تم تجهيز: " + prepared + " شات/أوردر",
      "تم التسليم اليوم: " + (d.deliveredToday || 0),
      "جاهز للاستلام: " + (d.readyForPickup || 0),
      "بنود شغل اليوم: " + (d.todayWorkLines || 0),
      "المنجز من شغل اليوم: " + (d.todayWorkDoneLines || 0),
      "المتأخر: " + (d.overdue || 0),
      "",
      "تقييم القسم: " + score + "%",
      "إنجاز الشغل: " + (d.completionPercent || 0) + "%",
      "تقييم الوقت: " + (d.timeScore || 0) + "%",
      "مستوى الشغل: " + workLevel(score)
    ].join("\n");
    alert(msg);
  }

  function canManageKnowledge() {
    const role = safeRole((state.user || {}).role);
    const username = normalizeArabic((state.user || {}).username || (state.user || {}).name || "");
    return role === "admin" || role === "service" || username === "ضياء" || username === "رحمه" || username === "رحمة";
  }

  function toggleKnowledge() {
    const card = $("aiKnowledgeCard");
    if (!card) return;
    const can = canManageKnowledge();
    card.classList.toggle("hidden", !can);
    if (can) loadKnowledge(false);
  }

  function clearKnowledgeForm() {
    ["knowledgeId", "knowledgeTitle", "knowledgeKeywords", "knowledgeContent", "knowledgeNotes"].forEach(function (id) {
      const el = $(id);
      if (el) el.value = "";
    });
    if ($("knowledgeCategory")) $("knowledgeCategory").value = "قواعد التشغيل";
    if ($("knowledgePriority")) $("knowledgePriority").value = "عادية";
    if ($("knowledgeActive")) $("knowledgeActive").value = "نعم";
    setMsg("knowledgeStatus", "قاعدة جديدة جاهزة للكتابة.", false);
  }

  async function loadKnowledge(force) {
    if (!canManageKnowledge()) return;
    const list = $("knowledgeList");
    const status = $("knowledgeStatus");
    if (status) status.textContent = "جاري تحميل المعرفة...";
    try {
      const res = await api("getKnowledge", authParams({}));
      if (!res.success) {
        if (status) status.textContent = res.message || "تعذر تحميل المعرفة";
        if (list) list.innerHTML = '<div class="dash-empty">تعذر تحميل المعرفة</div>';
        return;
      }
      state.knowledge = Array.isArray(res.rows) ? res.rows : [];
      renderKnowledge();
      if (status) status.textContent = "تم تحميل " + state.knowledge.length + " قاعدة معرفة";
    } catch (err) {
      if (status) status.textContent = err.message || "خطأ في تحميل المعرفة";
      if (list) list.innerHTML = '<div class="dash-empty">خطأ في تحميل المعرفة</div>';
    }
  }

  function renderKnowledge() {
    const list = $("knowledgeList");
    if (!list) return;
    const q = normalizeArabic(($("knowledgeSearch") || {}).value || "");
    let rows = state.knowledge || [];
    if (q) {
      rows = rows.filter(function (r) {
        return normalizeArabic([r.category, r.title, r.keywords, r.content, r.notes].join(" ")).indexOf(q) !== -1;
      });
    }

    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد قواعد معرفة مطابقة.</div>';
      return;
    }

    list.innerHTML = rows.map(function (r) {
      const activeCls = text(r.active) === "نعم" ? "active" : "inactive";
      return '<div class="knowledge-item ' + activeCls + '" data-id="' + escapeHtml(r.id || "") + '">' +
        '<div class="knowledge-item-head"><b>' + escapeHtml(r.title || "بدون عنوان") + '</b><span>' + escapeHtml(r.category || "") + '</span></div>' +
        '<p>' + escapeHtml(text(r.content).slice(0, 160)) + (text(r.content).length > 160 ? '...' : '') + '</p>' +
        '<small>مفعل: ' + escapeHtml(r.active || "نعم") + ' | أولوية: ' + escapeHtml(r.priority || "عادية") + '</small>' +
        '<div class="row"><button type="button" class="ghost edit-knowledge" data-id="' + escapeHtml(r.id || "") + '">تعديل</button></div>' +
        '</div>';
    }).join("");

    Array.prototype.forEach.call(list.querySelectorAll(".edit-knowledge"), function (btn) {
      btn.onclick = function () {
        const id = btn.getAttribute("data-id");
        const row = (state.knowledge || []).find(function (x) { return text(x.id) === text(id); });
        if (row) fillKnowledgeForm(row);
      };
    });
  }

  function fillKnowledgeForm(row) {
    $("knowledgeId").value = row.id || "";
    $("knowledgeCategory").value = row.category || "قواعد التشغيل";
    $("knowledgeTitle").value = row.title || "";
    $("knowledgeKeywords").value = row.keywords || "";
    $("knowledgeContent").value = row.content || "";
    $("knowledgePriority").value = row.priority || "عادية";
    $("knowledgeActive").value = row.active || "نعم";
    $("knowledgeNotes").value = row.notes || "";
    setMsg("knowledgeStatus", "تعديل قاعدة: " + (row.title || row.id), false);
    const card = $("aiKnowledgeCard");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveKnowledge() {
    if (!canManageKnowledge()) return;
    const title = ($("knowledgeTitle") || {}).value.trim();
    const content = ($("knowledgeContent") || {}).value.trim();
    if (!title || !content) {
      setMsg("knowledgeStatus", "العنوان والمحتوى مطلوبين.", true);
      return;
    }
    const btn = $("saveKnowledgeBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "جاري الحفظ...";
    }
    try {
      const res = await api("saveKnowledge", authParams({
        id: ($("knowledgeId") || {}).value,
        category: ($("knowledgeCategory") || {}).value,
        title: title,
        keywords: ($("knowledgeKeywords") || {}).value,
        content: content,
        priority: ($("knowledgePriority") || {}).value,
        active: ($("knowledgeActive") || {}).value,
        notes: ($("knowledgeNotes") || {}).value
      }));
      if (!res.success) {
        setMsg("knowledgeStatus", res.message || "فشل حفظ المعرفة.", true);
        return;
      }
      setMsg("knowledgeStatus", res.message || "تم حفظ المعرفة.", false);
      clearKnowledgeForm();
      await loadKnowledge(true);
    } catch (err) {
      setMsg("knowledgeStatus", err.message || "خطأ أثناء حفظ المعرفة.", true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "حفظ المعرفة";
      }
    }
  }

  async function loadRows(force) {
    if (!force && (state.saving || state.editing)) return;

    setLoading("جاري تحميل الأوردرات...");
    try {
      const res = await api("getRows", authParams({ screen: state.screen }));
      if (!res.success) {
        setLoading(res.message || "فشل تحميل الأوردرات.", true);
        if ((res.message || "").indexOf("انتهت الجلسة") !== -1) logout();
        return;
      }

      state.rows = Array.isArray(res.rows) ? res.rows : [];
      applyFiltersAndRender();
      loadDashboard(false);
      setLoading("آخر تحديث: " + new Date().toLocaleTimeString("ar-EG"));
    } catch (err) {
      setLoading(err.message || "خطأ في التحميل.", true);
    }
  }

  function applyFiltersAndRender(resetPage) {
    const q = ($("tableSearch").value || "").trim().toLowerCase();
    const qNormalized = normalizeArabic(q);
    const status = $("statusFilter").value || "";
    const priority = $("priorityFilter").value || "__ACTIVE__";
    const heatPressFilter = $("heatPressFilter") ? ($("heatPressFilter").value || "") : "";

    const filtered = state.rows.filter(function (r) {
      const blob = [r.orderId, r.lineId, r.customer, r.customerPhone, r.department, r.itemName, r.notes]
        .map(text).join(" ").toLowerCase();
      const blobNormalized = normalizeArabic(blob);
      if (q && blob.indexOf(q) === -1 && blobNormalized.indexOf(qNormalized) === -1) return false;

      const press = isHeatPress(r.heatPress || r.press || r.isPress || r["مكبس"] || r["مكبس حراري"]);
      if (heatPressFilter === "only" && !press) return false;
      if (heatPressFilter === "without" && press) return false;

      // فلاتر محسوبة ومتراكمة مع فلتر الأولوية وفلتر المكبس.
      if (status === "__OVERDUE__" && !isOverdueRow(r)) return false;
      else if (status === "__TODAY_WORK__" && (isHiddenFromUserScreens(r.status) || !isTodayWorkRow(r))) return false;
      else if (status === "__DELIVERED_TODAY__" && !isDeliveredTodayRow(r)) return false;
      else if (!status || status.indexOf("__") !== 0) {
        if (isHiddenFromUserScreens(r.status)) return false;
        if (status && text(r.status) !== status) return false;
      }

      if (priority === "__ACTIVE__" && !isActiveDefaultPriority(r.priority)) return false;
      if (priority && priority !== "__ACTIVE__" && text(r.priority) !== priority) return false;
      return true;
    }).sort(function (a, b) {
      return (defaultWorkSortRank(a) - defaultWorkSortRank(b)) || String(a.orderId || "").localeCompare(String(b.orderId || ""));
    });

    if (resetPage === true) state.currentPage = 1;

    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    renderCurrentOrder(filtered);
    renderStats(filtered);
    renderTable(filtered);
    renderPagination(filtered.length);
  }

  function renderCurrentOrder(rows) {
    const bar = $("currentOrderBar");
    if (!bar) return;

    const finishedStatuses = ["تم التنفيذ", "جاهز للاستلام", "تم التسليم", "مكرر"];

    const candidates = rows.map(function (r, i) {
      return { row: r, index: i };
    }).filter(function (x) {
      return finishedStatuses.indexOf(text(x.row.status)) === -1;
    }).sort(function (a, b) {
      return (priorityRank(a.row.priority) - priorityRank(b.row.priority)) || (a.index - b.index);
    });

    if (!candidates.length) {
      bar.classList.add("hidden");
      bar.innerHTML = "";
      return;
    }

    const r = candidates[0].row;
    bar.classList.remove("hidden");
    bar.innerHTML =
      '<b>الأوردر الحالي في قسم ' + escapeHtml(screens[state.screen] || "-") + ': </b>' +
      '<span>' + escapeHtml(r.orderId || "-") + '</span>' +
      (r.lineId ? ' <small> | البند: ' + escapeHtml(r.lineId) + '</small>' : '') +
      (r.customer ? ' <small> | العميل: ' + escapeHtml(r.customer) + '</small>' : '') +
      (r.priority ? ' <small> | الأولوية: ' + escapeHtml(r.priority) + '</small>' : '');
  }

  function renderStats(rows) {
    const total = rows.length;
    const urgent = rows.filter(function (r) { return text(r.priority) === "عاجل" || text(r.priority) === "VIP"; }).length;
    const normal = rows.filter(function (r) { return !text(r.priority) || text(r.priority) === "عادي"; }).length;
    const problem = rows.filter(function (r) { return ["مشكلة", "متوقف"].indexOf(text(r.status)) !== -1; }).length;
    const overdue = rows.filter(isOverdueRow).length;
    const debts = rows.filter(hasDebt).length;
    const heatPress = rows.filter(function (r) { return isHeatPress(r.heatPress || r.press || r.isPress || r["مكبس"] || r["مكبس حراري"]); }).length;
    const flyPrint = rows.filter(function (r) {
      return isFlyPrint(r.flyPrint || r.quickPrint || r.fastPrint || r["طباعة على الطاير"] || r["طباعة ع الطاير"]);
    }).length;
    $("statsBar").innerHTML =
      '<span>المعروض: <b>' + total + '</b></span>' +
      '<span>عاجل: <b>' + urgent + '</b></span>' +
      '<span>عادي: <b>' + normal + '</b></span>' +
      '<span class="stat-danger">متأخر: <b>' + overdue + '</b></span>' +
      '<span class="stat-danger">مديونية: <b>' + debts + '</b></span>' +
      '<span class="stat-press">مكبس: <b>' + heatPress + '</b></span>' +
      '<span class="stat-fly">طباعة على الطاير: <b>' + flyPrint + '</b></span>' +
      '<span>مشاكل/متوقف: <b>' + problem + '</b></span>';
  }

  function compactOrderCell(r) {
    const overdue = isOverdueRow(r) ? ' <span class="overdue-pill">متأخر</span>' : '';
    return '<div class="order-main"><b>' + escapeHtml(r.orderId || "-") + '</b>' + overdue + '</div>' +
      '<div class="muted-line">البند: ' + escapeHtml(r.lineId || "-") + '</div>' +
      '<div class="muted-line">التسليم: ' + escapeHtml(displayExpectedDelivery(r) || "-") + '</div>';
  }

  function compactCustomerCell(r) {
    const debt = hasDebt(r) ? '<span class="debt-pill">' + escapeHtml(debtLabel(r)) + '</span>' : '';
    return '<div class="order-main"><b>' + escapeHtml(r.customer || "-") + '</b> ' + debt + '</div>' +
      '<div class="muted-line phone-line">' + escapeHtml(safeDisplayPhone(r.customerPhone) || "بدون رقم") + '</div>' +
      (hasDebt(r) ? '<div class="muted-line debt-warning">تنبيه: التسليم متوقف لحين السداد</div>' : '');
  }

  function compactWorkCell(r) {
    const press = isHeatPress(r.heatPress || r.press || r.isPress || r["مكبس"] || r["مكبس حراري"]) ? '<span class="press-pill">🔥 مكبس</span>' : '';
    const fly = isFlyPrint(r.flyPrint || r.quickPrint || r.fastPrint || r["طباعة على الطاير"] || r["طباعة ع الطاير"]) ? '<span class="fly-pill">⚡ طباعة على الطاير</span>' : '';
    return '<div class="order-main"><b>' + escapeHtml(r.itemName || "-") + '</b> ' + press + ' ' + fly + '</div>' +
      '<div class="muted-line">القسم: ' + escapeHtml(r.department || "-") + '</div>' +
      '<div class="muted-line">الكمية: ' + escapeHtml(r.qty || "-") + '</div>';
  }

  function statusBadges(r) {
    const press = isHeatPress(r.heatPress || r.press || r.isPress || r["مكبس"] || r["مكبس حراري"]) ? '<span class="press-pill">🔥 مكبس</span>' : '';
    const fly = isFlyPrint(r.flyPrint || r.quickPrint || r.fastPrint || r["طباعة على الطاير"] || r["طباعة ع الطاير"]) ? '<span class="fly-pill">⚡ طباعة على الطاير</span>' : '';
    return '<div class="badges-row"><span class="priority-pill">' + escapeHtml(r.priority || "-") + '</span>' + press + fly + '</div>';
  }

  function renderTable(rows) {
    const table = $("ordersTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;
    const start = (state.currentPage - 1) * state.pageSize;
    const pageRows = rows.slice(start, start + state.pageSize);

    thead.innerHTML =
      "<tr>" +
      "<th>الأوردر والتسليم</th>" +
      "<th>العميل</th>" +
      "<th>الشغل</th>" +
      "<th>الأولوية والحالة</th>" +
      "<th>ملاحظات</th>" +
      "<th>واتساب / حفظ</th>" +
      "</tr>";

    if (!pageRows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">لا توجد أوردرات مطابقة.</td></tr>';
      return;
    }

    tbody.innerHTML = pageRows.map(function (r, i) {
      return "<tr data-i=\"" + i + "\">" +
        "<td class=\"order-cell\">" + compactOrderCell(r) + "</td>" +
        "<td class=\"customer-cell\">" + compactCustomerCell(r) + "</td>" +
        "<td class=\"work-cell\">" + compactWorkCell(r) + "</td>" +
        "<td class=\"status-cell\"><div class=\"priority-pill\">" + escapeHtml(r.priority || "-") + "</div>" + statusSelect(r.status) + "</td>" +
        "<td class=\"notes-cell\"><input class=\"row-notes\" value=\"" + escapeHtml(r.notes) + "\" placeholder=\"ملاحظات\"></td>" +
        "<td class=\"actions-cell\">" + whatsappActions(r, i) + "<button class=\"primary save-line\" data-i=\"" + i + "\">حفظ</button></td>" +
        "</tr>";
    }).join("");

    Array.prototype.forEach.call(tbody.querySelectorAll(".row-status, .row-notes"), function (el) {
      el.addEventListener("focus", function () { state.editing = true; });
      el.addEventListener("input", function () { state.editing = true; });
      el.addEventListener("change", function () { state.editing = true; });
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".save-line"), function (btn) {
      btn.addEventListener("click", function () {
        saveLine(pageRows[Number(btn.dataset.i)], btn.closest("tr"));
      });
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".wa-status"), function (btn) {
      btn.addEventListener("click", function () {
        sendWhatsApp(pageRows[Number(btn.dataset.i)], "status", btn);
      });
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".wa-ready"), function (btn) {
      btn.addEventListener("click", function () {
        sendWhatsApp(pageRows[Number(btn.dataset.i)], "ready", btn);
      });
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".invoice-open"), function (btn) {
      btn.addEventListener("click", function () {
        openInvoiceModal(pageRows[Number(btn.dataset.i)]);
      });
    });
  }

  function renderPagination(totalRows) {
    let bar = $("paginationBar");
    const wrap = document.querySelector(".table-wrap");
    if (!bar && wrap && wrap.parentNode) {
      bar = document.createElement("div");
      bar.id = "paginationBar";
      bar.className = "pagination";
      wrap.parentNode.insertBefore(bar, wrap.nextSibling);
    }
    if (!bar) return;

    const totalPages = Math.max(1, Math.ceil(totalRows / state.pageSize));
    if (totalRows <= state.pageSize) {
      bar.innerHTML = totalRows ? '<span>صفحة 1 من 1</span>' : '';
      return;
    }

    let html = '<button type="button" data-page="prev"' + (state.currentPage <= 1 ? ' disabled' : '') + '>السابق</button>';
    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 9 && p !== 1 && p !== totalPages && Math.abs(p - state.currentPage) > 2) {
        if (p === 2 || p === totalPages - 1) html += '<span class="dots">...</span>';
        continue;
      }
      html += '<button type="button" data-page="' + p + '" class="' + (p === state.currentPage ? 'active' : '') + '">' + p + '</button>';
    }
    html += '<button type="button" data-page="next"' + (state.currentPage >= totalPages ? ' disabled' : '') + '>التالي</button>';
    html += '<span>صفحة ' + state.currentPage + ' من ' + totalPages + ' — كل صفحة 5 أوردرات</span>';
    bar.innerHTML = html;

    Array.prototype.forEach.call(bar.querySelectorAll("button"), function (btn) {
      btn.onclick = function () {
        const target = btn.dataset.page;
        if (target === "prev") state.currentPage -= 1;
        else if (target === "next") state.currentPage += 1;
        else state.currentPage = Number(target) || 1;
        applyFiltersAndRender(false);
        const card = document.querySelector("#ordersTable");
        if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
  }



  function whatsappActions(row, i) {
    const disabled = whatsappPhone(row.customerPhone) ? "" : " disabled";
    const notified = text(row.customerNotified) === "نعم" ? '<small class="wa-notified">تم الإبلاغ</small>' : "";
    return '<div class="whatsapp-actions">' +
      '<button type="button" class="wa-btn wa-status" data-i="' + i + '"' + disabled + '>AI يرد بالحالة</button>' +
      '<button type="button" class="wa-btn wa-ready" data-i="' + i + '"' + disabled + '>رسالة انتهاء</button>' +
      '<button type="button" class="wa-btn invoice-open" data-i="' + i + '">تسعير</button>' +
      notified +
      '</div>';
  }

  function statusSelect(current) {
    return '<select class="row-status">' + statuses.map(function (s) {
      return '<option value="' + escapeHtml(s) + '"' + (text(current) === s ? " selected" : "") + '>' + escapeHtml(s) + '</option>';
    }).join("") + '</select>';
  }



  async function sendWhatsApp(row, mode, btn) {
    if (!row) return;
    const message = buildWhatsAppMessage(row, mode === "ready" ? "ready" : "status");
    const opened = openWhatsAppUrl(row.customerPhone, message);
    if (!opened) return;

    const confirmText = mode === "ready"
      ? "تم فتح واتساب برسالة الانتهاء للعميل. هل تم إرسال الرسالة؟"
      : "تم فتح واتساب برد الحالة. هل تم إرسال الرد للعميل؟";

    if (!confirm(confirmText)) return;

    const oldText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "جاري التسجيل...";
    }
    setLoading("جاري تسجيل رسالة الواتساب في الشيت...");

    try {
      const res = await api("markCustomerNotified", authParams({
        rowNumber: row.rowNumber || "",
        orderId: row.orderId || "",
        lineId: row.lineId || "",
        whatsappType: mode === "ready" ? "ready_notify" : "status_reply",
        message: message
      }));

      if (!res.success) {
        alert(res.message || "تم فتح واتساب، لكن لم يتم تسجيل الإبلاغ في الشيت.");
        setLoading(res.message || "لم يتم تسجيل الإبلاغ في الشيت.", true);
        return;
      }

      row.customerNotified = mode === "ready" ? "نعم" : row.customerNotified;
      state.editing = false;
      await loadRows(true);
      setLoading("تم تسجيل رسالة الواتساب في الشيت.");
    } catch (err) {
      alert(err.message || "خطأ أثناء تسجيل الواتساب.");
      setLoading(err.message || "خطأ أثناء تسجيل الواتساب.", true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldText;
      }
    }
  }

  async function saveLine(row, tr) {
    if (!row || !tr) return;

    const status = tr.querySelector(".row-status").value;
    const notes = tr.querySelector(".row-notes").value;
    const btn = tr.querySelector(".save-line");

    state.saving = true;
    btn.disabled = true;
    btn.textContent = "جاري الحفظ...";
    setLoading("جاري حفظ التعديل في الشيت...");

    try {
      const res = await api("updateLine", authParams({
        rowNumber: row.rowNumber || "",
        orderId: row.orderId || "",
        lineId: row.lineId || "",
        status: status,
        notes: notes
      }));

      if (!res.success) {
        alert(res.message || "لم يتم الحفظ في الشيت.");
        setLoading(res.message || "لم يتم الحفظ في الشيت.", true);
        return;
      }

      const oldStatus = row.status;
      row.status = status;
      row.notes = notes;
      btn.textContent = "تم الحفظ";
      state.editing = false;

      if (shouldOpenInvoiceAfterStatus(status, oldStatus)) {
        openInvoiceModal(Object.assign({}, row, { status: status, notes: notes }));
      }

      await loadRows(true);
      setTimeout(function () { btn.textContent = "حفظ"; }, 900);
    } catch (err) {
      alert(err.message || "خطأ أثناء الحفظ.");
      setLoading(err.message || "خطأ أثناء الحفظ.", true);
    } finally {
      state.saving = false;
      btn.disabled = false;
    }
  }



  function shouldOpenInvoiceAfterStatus(newStatus, oldStatus) {
    const n = text(newStatus);
    const o = text(oldStatus);
    return (n === "جاهز للاستلام" || n === "تم التسليم") && n !== o;
  }

  function openInvoiceModal(row) {
    state.invoiceRow = row || null;
    const modal = $("invoiceModal");
    if (!modal || !row) return;
    $("invoiceOrderTitle").textContent = "فاتورة / تسعير: " + (row.orderId || "-") + " — " + (row.customer || "-");
    $("invoiceLineId").value = row.lineId || "";
    $("invoiceWorkDone").value = row.itemName || "";
    $("invoiceQty").value = row.qty || 1;
    $("invoiceNotes").value = row.notes || "";
    $("invoiceMsg").textContent = "اكتب ما تم تنفيذه فعليًا. سيظهر لضياء للتسعير وإضافته لفاتورة العميل.";
    modal.classList.remove("hidden");
  }

  function closeInvoiceModal() {
    const modal = $("invoiceModal");
    if (modal) modal.classList.add("hidden");
    state.invoiceRow = null;
  }

  async function saveInvoiceLine() {
    const row = state.invoiceRow;
    if (!row) return;
    const btn = $("saveInvoiceBtn");
    const msg = $("invoiceMsg");
    const workDone = ($("invoiceWorkDone").value || "").trim();
    if (!workDone) {
      if (msg) msg.textContent = "اكتب اللى اتعمل عشان يروح للتسعير.";
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "جاري الحفظ...";
    }
    try {
      const res = await api("createInvoiceLine", authParams({
        rowNumber: row.rowNumber || "",
        orderId: row.orderId || "",
        lineId: row.lineId || "",
        customerName: row.customer || "",
        customerPhone: row.customerPhone || "",
        department: row.department || "",
        itemName: row.itemName || "",
        workDone: workDone,
        qty: $("invoiceQty").value || row.qty || 1,
        notes: $("invoiceNotes").value || ""
      }));
      if (!res.success) {
        if (msg) msg.textContent = res.message || "تعذر حفظ بند الفاتورة.";
        return;
      }
      if (msg) msg.textContent = "تم إرسال بند الفاتورة لضياء للتسعير.";
      setTimeout(closeInvoiceModal, 700);
    } catch (err) {
      if (msg) msg.textContent = err.message || "خطأ في حفظ بند الفاتورة.";
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "إرسال للتسعير";
      }
    }
  }

  async function createCustomer() {
    setMsg("addCustomerStatus", "", false);

    const params = authParams({
      customerName: $("newClientName").value.trim(),
      manager: $("newClientManager").value.trim() || ((state.user || {}).name || (state.user || {}).username || ""),
      phone: $("newClientPhone").value.trim(),
      extraPhone: $("newClientExtraPhone").value.trim(),
      customerType: $("newClientType").value.trim(),
      debtAmount: $("newClientDebt") ? $("newClientDebt").value.trim() : "0",
      active: $("newClientActive").value || "نعم",
      notes: $("newClientNotes").value.trim()
    });

    if (!params.customerName) {
      setMsg("addCustomerStatus", "اسم الشات / العميل مطلوب.", true);
      return;
    }

    const btn = $("createCustomerBtn");
    btn.disabled = true;
    btn.textContent = "جاري إضافة العميل...";

    try {
      const res = await api("createCustomer", params);
      if (!res.success) {
        setMsg("addCustomerStatus", res.message || "فشل إضافة العميل في الشيت.", true);
        return;
      }

      setMsg("addCustomerStatus", res.message || "تم إضافة العميل في شيت العملاء.", false);
      ["newClientName", "newClientPhone", "newClientExtraPhone", "newClientType", "newClientNotes"].forEach(function (id) {
        const el = $(id);
        if (el) el.value = "";
      });
      const debtInput = $("newClientDebt");
      if (debtInput) debtInput.value = "0";
      const manager = $("newClientManager");
      if (manager) manager.value = (state.user || {}).name || (state.user || {}).username || "";
      const active = $("newClientActive");
      if (active) active.value = "نعم";
    } catch (err) {
      setMsg("addCustomerStatus", err.message || "خطأ أثناء إضافة العميل.", true);
    } finally {
      btn.disabled = false;
      btn.textContent = "إضافة العميل";
    }
  }

  async function recordRegistrationWhatsApp(res, params, message) {
    try {
      await api("markCustomerNotified", authParams({
        rowNumber: "",
        orderId: res.orderId || "",
        lineId: res.lineId || "",
        whatsappType: "order_registered",
        message: message
      }));
    } catch (e) {
      setLoading("تم فتح واتساب، لكن لم يتم تسجيل رسالة التسجيل في الشيت.", true);
    }
  }

  async function createOrder() {
    setMsg("addOrderStatus", "", false);

    const params = authParams({
      customerName: $("newCustomerName").value.trim(),
      customerPhone: $("newCustomerPhone").value.trim(),
      customerType: $("newCustomerType").value.trim(),
      department: $("newDepartment").value,
      heatPress: ($("newHeatPress") && $("newHeatPress").checked) ? "نعم" : "لا",
      flyPrint: ($("newFlyPrint") && $("newFlyPrint").checked && text($("newDepartment").value) === "طباعة") ? "نعم" : "لا",
      itemName: $("newItemName").value.trim(),
      qty: $("newQty").value || "1",
      priority: (($("newFlyPrint") && $("newFlyPrint").checked && text($("newDepartment").value) === "طباعة") ? "عاجل" : $("newPriority").value),
      status: $("newStatus").value,
      assignedTo: $("newAssignedTo").value.trim(),
      notes: $("newNotes").value.trim()
    });

    if (!params.customerName || !params.department) {
      setMsg("addOrderStatus", "اسم الشات والقسم مطلوبين.", true);
      return;
    }

    const btn = $("createOrderBtn");
    btn.disabled = true;
    btn.textContent = "جاري الإضافة...";

    try {
      const res = await api("createManualOrder", params);
      if (!res.success) {
        setMsg("addOrderStatus", res.message || "فشل إضافة الأوردر في الشيت.", true);
        return;
      }

      const expectedText = formatDisplayDate(res.expectedDeliveryText) || formatDisplayDate(res.expectedDeliveryAt) || expectedDeliveryTextFromNow();
      setMsg("addOrderStatus", "تم إضافة الأوردر: " + res.orderId + " | التسليم المتوقع: " + expectedText + (res.debtHold || ((res.debtInfo || {}).hasDebt) ? " | تنبيه: العميل عليه مديونية" : ""), false);

      const registrationRow = {
        customer: params.customerName,
        customerPhone: params.customerPhone,
        orderId: res.orderId,
        lineId: res.lineId,
        itemName: params.itemName || ("أوردر جديد - " + params.department),
        department: params.department,
        status: "طلب جديد",
        expectedDeliveryText: expectedText,
        debtAmount: res.debtAmount || ((res.debtInfo || {}).amount) || 0,
        debtHold: res.debtHold || ((res.debtInfo || {}).hasDebt ? "نعم" : "لا")
      };

      if (params.customerPhone) {
        const msg = buildWhatsAppMessage(registrationRow, "registered");
        const opened = openWhatsAppUrl(params.customerPhone, msg);
        if (opened && confirm("تم فتح واتساب برسالة تسجيل الأوردر للعميل. هل تم إرسال الرسالة؟")) {
          await recordRegistrationWhatsApp(res, params, msg);
        }
      }

      ["newCustomerName", "newCustomerPhone", "newCustomerType", "newItemName", "newAssignedTo", "newNotes"].forEach(function (id) {
        $(id).value = "";
      });
      $("newQty").value = 1;
      if ($("newHeatPress")) $("newHeatPress").checked = false;
      if ($("newFlyPrint")) $("newFlyPrint").checked = false;
      updateHeatPressVisibility();
      updateFlyPrintVisibility();
      $("customerSuggestions").classList.add("hidden");
      state.editing = false;
      await loadRows(true);
    } catch (err) {
      setMsg("addOrderStatus", err.message || "خطأ أثناء إضافة الأوردر.", true);
    } finally {
      btn.disabled = false;
      btn.textContent = "إضافة الأوردر";
    }
  }

  function wireCustomerSearch() {
    const input = $("newCustomerName");
    const box = $("customerSuggestions");
    if (!input || !box) return;

    input.addEventListener("input", function () {
      clearTimeout(state.suggestionTimer);
      const q = input.value.trim();
      if (!q) {
        box.classList.add("hidden");
        box.innerHTML = "";
        return;
      }
      state.suggestionTimer = setTimeout(function () { searchCustomers(q); }, 300);
    });
  }

  async function searchCustomers(q) {
    const box = $("customerSuggestions");
    try {
      const res = await api("searchCustomers", authParams({ q: q }));
      const customers = res.success && Array.isArray(res.customers) ? res.customers : [];
      if (!customers.length) {
        box.classList.add("hidden");
        box.innerHTML = "";
        return;
      }

      box.innerHTML = customers.map(function (c, i) {
        return '<button type="button" data-i="' + i + '">' +
          '<b>' + escapeHtml(c.name) + '</b>' +
          '<small>' + escapeHtml(c.phone || "") + ' ' + escapeHtml(c.type || "") + '</small>' +
          '</button>';
      }).join("");

      box.classList.remove("hidden");
      Array.prototype.forEach.call(box.querySelectorAll("button"), function (btn) {
        btn.onclick = function () {
          const c = customers[Number(btn.dataset.i)];
          $("newCustomerName").value = c.name || "";
          $("newCustomerPhone").value = c.phone || "";
          $("newCustomerType").value = c.type || "";
          box.classList.add("hidden");
        };
      });
    } catch (e) {
      box.classList.add("hidden");
    }
  }


  function wireTableCustomerSearch() {
    const input = $("tableSearch");
    if (!input || input.dataset.autocompleteWired === "1") return;
    input.dataset.autocompleteWired = "1";

    const holder = document.createElement("div");
    holder.className = "suggest-box table-search-suggest";
    input.parentNode.insertBefore(holder, input);
    holder.appendChild(input);

    const box = document.createElement("div");
    box.id = "tableCustomerSuggestions";
    box.className = "suggestions hidden";
    holder.appendChild(box);

    input.addEventListener("input", function () {
      applyFiltersAndRender(true);
      clearTimeout(state.tableSuggestionTimer);
      const q = input.value.trim();
      if (q.length < 2) {
        box.classList.add("hidden");
        box.innerHTML = "";
        return;
      }
      state.tableSuggestionTimer = setTimeout(function () {
        searchCustomersForTable(q, box, input);
      }, 250);
    });

    document.addEventListener("click", function (e) {
      if (!holder.contains(e.target)) box.classList.add("hidden");
    });
  }

  async function searchCustomersForTable(q, box, input) {
    try {
      const res = await api("searchCustomers", authParams({ q: q }));
      const customers = res.success && Array.isArray(res.customers) ? res.customers : [];
      const qKey = normalizeArabic(q);
      const filtered = customers.filter(function (c) {
        return normalizeArabic([c.name, c.phone, c.extraPhone, c.type, c.manager].join(" ")).indexOf(qKey) !== -1;
      }).slice(0, 10);

      if (!filtered.length) {
        box.classList.add("hidden");
        box.innerHTML = "";
        return;
      }

      box.innerHTML = filtered.map(function (c, i) {
        return '<button type="button" data-i="' + i + '">' +
          '<b>' + escapeHtml(c.name || "") + '</b>' +
          '<span>' + escapeHtml([c.phone || c.extraPhone || "", c.type || ""].filter(Boolean).join(" | ")) + '</span>' +
          '</button>';
      }).join("");

      box.classList.remove("hidden");
      Array.prototype.forEach.call(box.querySelectorAll("button"), function (btn) {
        btn.onclick = function () {
          const c = filtered[Number(btn.dataset.i)];
          input.value = c.name || "";
          box.classList.add("hidden");
          applyFiltersAndRender(true);
        };
      });
    } catch (e) {
      box.classList.add("hidden");
    }
  }

  function openPasswordModal() {
    $("passwordModal").classList.remove("hidden");
    setMsg("passMsg", "", false);
  }

  function closePasswordModal() {
    $("passwordModal").classList.add("hidden");
    ["oldPassword", "newPassword", "confirmPassword"].forEach(function (id) { $(id).value = ""; });
  }

  async function changePassword() {
    const oldPassword = $("oldPassword").value.trim();
    const newPassword = $("newPassword").value.trim();
    const confirmPassword = $("confirmPassword").value.trim();

    if (!oldPassword || !newPassword) {
      setMsg("passMsg", "اكتب كلمة المرور القديمة والجديدة.", true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg("passMsg", "تأكيد كلمة المرور غير مطابق.", true);
      return;
    }

    try {
      const res = await api("changePassword", authParams({ oldPassword: oldPassword, newPassword: newPassword }));
      if (!res.success) {
        setMsg("passMsg", res.message || "فشل تغيير كلمة المرور.", true);
        return;
      }
      setMsg("passMsg", res.message || "تم تغيير كلمة المرور.", false);
      setTimeout(closePasswordModal, 900);
    } catch (err) {
      setMsg("passMsg", err.message || "خطأ أثناء تغيير كلمة المرور.", true);
    }
  }

  function startRefresh() {
    stopRefresh();
    state.refreshTimer = setInterval(function () { loadRows(false); }, REFRESH_MS);
  }

  function stopRefresh() {
    if (state.refreshTimer) clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }

  function logout() {
    stopUrgentNotificationTimer();
    clearSession();
    showLogin();
  }

  function wireEvents() {
    $("loginBtn").addEventListener("click", doLogin);
    $("password").addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
    $("username").addEventListener("keydown", function (e) { if (e.key === "Enter") $("password").focus(); });

    $("refreshBtn").addEventListener("click", function () { state.editing = false; loadRows(true); });
    $("logoutBtn").addEventListener("click", logout);
    $("changePassBtn").addEventListener("click", openPasswordModal);
    $("cancelPassBtn").addEventListener("click", closePasswordModal);
    $("savePassBtn").addEventListener("click", changePassword);
    const cancelInvoiceButton = $("cancelInvoiceBtn");
    if (cancelInvoiceButton) cancelInvoiceButton.addEventListener("click", closeInvoiceModal);
    const saveInvoiceButton = $("saveInvoiceBtn");
    if (saveInvoiceButton) saveInvoiceButton.addEventListener("click", saveInvoiceLine);
    $("createOrderBtn").addEventListener("click", createOrder);
    const createCustomerButton = $("createCustomerBtn");
    if (createCustomerButton) createCustomerButton.addEventListener("click", createCustomer);
    const departmentSelect = $("newDepartment");
    if (departmentSelect) {
      departmentSelect.addEventListener("change", function () {
        updateHeatPressVisibility();
        updateFlyPrintVisibility();
      });
      updateHeatPressVisibility();
      updateFlyPrintVisibility();
    }

    const flyPrintCheck = $("newFlyPrint");
    if (flyPrintCheck) flyPrintCheck.addEventListener("change", syncFlyPrintRules);

    const endDayButton = $("endDayBtn");
    if (endDayButton) endDayButton.addEventListener("click", showEndDaySummary);

    setupCollapsibleCards();
    toggleEndDayButton();

    ["tableSearch", "statusFilter", "priorityFilter", "heatPressFilter"].forEach(function (id) {
      if (!$(id)) return;
      $(id).addEventListener("input", function () { applyFiltersAndRender(true); });
      $(id).addEventListener("change", function () { applyFiltersAndRender(true); });
    });

    const urgentBtn = $("urgentNotificationsBtn");
    if (urgentBtn) urgentBtn.addEventListener("click", enableUrgentNotifications);

    const saveKnowledgeButton = $("saveKnowledgeBtn");
    if (saveKnowledgeButton) saveKnowledgeButton.addEventListener("click", saveKnowledge);
    const newKnowledgeButton = $("newKnowledgeBtn");
    if (newKnowledgeButton) newKnowledgeButton.addEventListener("click", clearKnowledgeForm);
    const refreshKnowledgeButton = $("refreshKnowledgeBtn");
    if (refreshKnowledgeButton) refreshKnowledgeButton.addEventListener("click", function () { loadKnowledge(true); });
    const knowledgeSearch = $("knowledgeSearch");
    if (knowledgeSearch) knowledgeSearch.addEventListener("input", renderKnowledge);

    wireCustomerSearch();
    wireTableCustomerSearch();
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireEvents();
    if (loadSession()) bootMain();
    else showLogin();
  });
})();
