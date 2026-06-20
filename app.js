(function () {
  "use strict";

  const API_URL = (window.TREND_API_URL || window.API_URL || "").trim();
  const REFRESH_MS = 10000;
  const UI_VERSION = "1847_INLINE_IMAGE_CHAT";

  const screens = {
    service: "خدمة العملاء",
    print: "الطباعة",
    laser: "الليزر"
  };

  const roleScreens = {
    admin: ["service", "print", "laser"],
    service: ["service"],
    print: ["print"],
    laser: ["laser"],
    // المكبس ليس قسم مستقل. أي مستخدم قديم بصلاحية press يرى شاشة الطباعة فقط.
    press: ["print"]
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
    urgentNotificationSeen: {},
    customer: null,
    customerOrders: [],
    customerViewMode: "home",
    customerDraft: null,
    customerDraftBusy: false,
    orderConversationRow: null,
    orderConversation: null,
    orderConversationBusy: false
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

  let lastCopiedWhatsAppPhone = "";

  async function copyTextToClipboard(textValue) {
    const value = text(textValue || "");
    if (!value) return false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (err) {
        // نستخدم fallback بالأسفل.
      }
    }

    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "readonly");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      area.style.top = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return !!ok;
    } catch (err) {
      return false;
    }
  }

  async function copyWhatsAppMessage(phone, message) {
    const normalized = whatsappPhone(phone);
    if (!normalized) {
      alert("رقم العميل غير موجود أو غير صالح.");
      return false;
    }

    lastCopiedWhatsAppPhone = normalized;
    const ok = await copyTextToClipboard(message || "");
    if (!ok) {
      alert("لم أستطع نسخ الرسالة تلقائيًا. انسخها يدويًا من التنبيه التالي:\n\n" + (message || ""));
      return false;
    }
    return true;
  }

  function openWhatsAppChatOnly(phone) {
    const normalized = whatsappPhone(phone || lastCopiedWhatsAppPhone);
    if (!normalized) {
      alert("رقم العميل غير موجود لفتح واتساب.");
      return false;
    }
    const url = "https://web.whatsapp.com/send?phone=" + normalized;
    window.open(url, "TrendOS_WhatsApp");
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



  async function apiPost(action, payload) {
    if (!API_URL || API_URL.indexOf("PUT_YOUR_WEB_APP_URL_HERE") !== -1) {
      throw new Error("رابط Web App غير موجود في config.js");
    }
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    });
    const textValue = await res.text();
    try {
      return JSON.parse(textValue || "{}");
    } catch (err) {
      throw new Error("رد السيرفر غير واضح أثناء رفع الملفات.");
    }
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = function () { reject(new Error("تعذر قراءة الملف: " + (file && file.name ? file.name : ""))); };
      reader.readAsDataURL(file);
    });
  }

  function resetCustomerDraft() {
    revokeCustomerPendingFiles();
    state.customerDraft = { draftId: "", items: [], submitted: false, orderId: "" };
    renderCustomerDraft();
    setMsg("customerOrderMsg", "", false);
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

  function hideAllRootViews() {
    ["entryView", "loginView", "customerLoginView", "customerView", "mainView"].forEach(function (id) {
      const el = $(id);
      if (el) el.classList.add("hidden");
    });
    const passModal = $("passwordModal");
    if (passModal) passModal.classList.add("hidden");
    const customerPassModal = $("customerPasswordModal");
    if (customerPassModal) customerPassModal.classList.add("hidden");
  }

  function showEntryChoice() {
    stopRefresh();
    stopUrgentNotificationTimer();
    hideAllRootViews();
    const entry = $("entryView");
    if (entry) entry.classList.remove("hidden");
  }

  function showLogin() {
    stopRefresh();
    hideAllRootViews();
    $("loginView").classList.remove("hidden");
  }

  function showCustomerLogin() {
    stopRefresh();
    hideAllRootViews();
    const view = $("customerLoginView");
    if (view) view.classList.remove("hidden");
  }

  function showMain() {
    hideAllRootViews();
    $("mainView").classList.remove("hidden");
  }

  function showCustomerMain() {
    stopRefresh();
    hideAllRootViews();
    const view = $("customerView");
    if (view) view.classList.remove("hidden");
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

  function saveCustomerSession() {
    localStorage.setItem("matbagy_platform_customer_session", JSON.stringify({ customer: state.customer }));
  }

  function loadCustomerSession() {
    try {
      const data = JSON.parse(localStorage.getItem("matbagy_platform_customer_session") || "null");
      if (data && data.customer && data.customer.token && data.customer.customerCode) {
        state.customer = data.customer;
        return true;
      }
    } catch (e) {}
    return false;
  }

  function clearCustomerSession() {
    localStorage.removeItem("matbagy_platform_customer_session");
    state.customer = null;
    state.customerOrders = [];
    state.customerDraft = null;
  }

  function customerAuthParams(extra) {
    const c = state.customer || {};
    return Object.assign({ customerCode: c.customerCode || c.code || "", token: c.token || "" }, extra || {});
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

  async function doCustomerLogin() {
    const customerCode = ($("customerCode") || {}).value ? $("customerCode").value.trim() : "";
    const password = ($("customerPassword") || {}).value ? $("customerPassword").value.trim() : "";
    setMsg("customerLoginMsg", "", false);

    if (!customerCode || !password) {
      setMsg("customerLoginMsg", "اكتب كود الشات وكلمة المرور.", true);
      return;
    }

    const btn = $("customerLoginBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري الدخول..."; }

    try {
      const res = await api("customerLogin", { customerCode: customerCode, password: password });
      if (!res.success) {
        setMsg("customerLoginMsg", res.message || "فشل دخول العميل.", true);
        return;
      }
      state.customer = res.customer || {};
      saveCustomerSession();
      bootCustomerMain();
      if (state.customer.mustChange) openCustomerPasswordModal();
    } catch (err) {
      setMsg("customerLoginMsg", err.message || "حصل خطأ أثناء دخول العميل.", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "دخول العميل"; }
    }
  }

  function bootCustomerMain() {
    showCustomerMain();
    renderCustomerHeader();
    renderCustomerHome();
    loadCustomerOrders();
  }

  function renderCustomerHeader() {
    const c = state.customer || {};
    const title = $("customerWelcomeTitle");
    const meta = $("customerMeta");
    if (title) title.textContent = "أهلاً " + (c.name || "عميل مطبعجي");
    if (meta) meta.textContent = "كود الشات: " + (c.customerCode || "-") + " | منصة مطبعجي بنها";
  }

  function publicStatus(status) {
    const s = text(status);
    const map = {
      "طلب جديد": "تم استلام الطلب",
      "بدأ التنفيذ": "جاري تجهيز الطلب",
      "تحت التنفيذ": "تحت التنفيذ",
      "متوقف": "متوقف مؤقتًا وسيتم التواصل معك",
      "مشكلة": "يوجد ملاحظة وسيتم التواصل معك",
      "جاهز للاستلام": "جاهز للاستلام",
      "تم التسليم": "تم التسليم",
      "ملغى": "ملغي",
      "مكرر": "مكرر"
    };
    return map[s] || s || "تم استلام الطلب";
  }

  function renderCustomerHome() {
    const home = $("customerHomePanel");
    const orderPanel = $("customerNewOrderPanel");
    const ordersPanel = $("customerOrdersPanel");
    const designerPanel = $("customerDesignerPanel");
    [home, orderPanel, ordersPanel, designerPanel].forEach(function (el) { if (el) el.classList.add("hidden"); });

    if (state.customerViewMode === "newOrder") {
      if (orderPanel) orderPanel.classList.remove("hidden");
      if (!state.customerDraft) resetCustomerDraft();
      updateCustomerPrintOptions();
      renderCustomerDraft();
    } else if (state.customerViewMode === "designer") {
      if (designerPanel) designerPanel.classList.remove("hidden");
    } else if (state.customerViewMode === "orders") {
      if (ordersPanel) ordersPanel.classList.remove("hidden");
    } else {
      if (home) home.classList.remove("hidden");
    }
  }

  async function loadCustomerOrders() {
    if (!state.customer) return;
    const status = $("customerOrdersStatus");
    if (status) status.textContent = "جاري تحميل أوردراتك...";
    try {
      const res = await api("getCustomerOrders", customerAuthParams({}));
      if (!res.success) {
        if (status) status.textContent = res.message || "تعذر تحميل الأوردرات.";
        return;
      }
      state.customerOrders = Array.isArray(res.orders) ? res.orders : [];
      renderCustomerOrders();
      if (status) status.textContent = "تم تحميل " + state.customerOrders.length + " أوردر.";
    } catch (err) {
      if (status) status.textContent = err.message || "خطأ أثناء تحميل الأوردرات.";
    }
  }

  function renderCustomerOrders() {
    const list = $("customerOrdersList");
    if (!list) return;
    const rows = state.customerOrders || [];
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد أوردرات مسجلة على كود الشات حتى الآن.</div>';
      return;
    }
    list.innerHTML = rows.map(function (r) {
      return '<div class="customer-order-card">' +
        '<div class="customer-order-head"><b>أوردر ' + escapeHtml(r.orderId || "-") + '</b><span>' + escapeHtml(publicStatus(r.status)) + '</span></div>' +
        '<div class="muted-line">القسم: ' + escapeHtml(r.department || "-") + '</div>' +
        '<div class="muted-line">نوع الشغل: ' + escapeHtml(r.itemName || "-") + '</div>' +
        '<div class="muted-line">التسليم المتوقع: ' + escapeHtml(formatDisplayDate(r.expectedDeliveryText || r.expectedDeliveryAt || r.expectedDelivery) || "-") + '</div>' +
        (r.notes ? '<div class="customer-note">' + escapeHtml(r.notes) + '</div>' : '') +
      '</div>';
    }).join("");
  }

  function updateCustomerPrintOptions() {
    const dep = $("customerOrderDepartment");
    const pressBox = $("customerHeatPressBox");
    const flyBox = $("customerFlyPrintBox");
    const show = dep && dep.value === "طباعة";
    if (pressBox) pressBox.classList.toggle("hidden", !show);
    if (flyBox) flyBox.classList.toggle("hidden", !show);
    if (!show) {
      if ($("customerHeatPress")) $("customerHeatPress").checked = false;
      if ($("customerFlyPrint")) $("customerFlyPrint").checked = false;
    }
  }


  function revokeCustomerPendingFiles() {
    (state.customerPendingFiles || []).forEach(function (f) {
      if (f && f.previewUrl) {
        try { URL.revokeObjectURL(f.previewUrl); } catch (e) {}
      }
    });
    state.customerPendingFiles = [];
  }

  function syncCustomerPendingFilesFromInput() {
    const input = $("customerOrderFiles");
    revokeCustomerPendingFiles();
    const list = input && input.files ? Array.prototype.slice.call(input.files) : [];
    state.customerPendingFiles = list.map(function (file) {
      let previewUrl = "";
      try { previewUrl = URL.createObjectURL(file); } catch (e) {}
      return {
        file: file,
        name: file.name || "ملف",
        mimeType: file.type || "application/octet-stream",
        type: file.type || "application/octet-stream",
        size: file.size || 0,
        previewUrl: previewUrl,
        localPreview: true
      };
    });
    renderCustomerDraft();
    if (state.customerPendingFiles.length) {
      setMsg("customerOrderMsg", "تم اختيار " + state.customerPendingFiles.length + " ملف. اضغط زر الإرسال لإضافتهم للطلب.", false);
    }
  }

  function refreshCustomerPendingPreview() {
    if (state.customerPendingFiles && state.customerPendingFiles.length) renderCustomerDraft();
  }

  function ensureCustomerDraftStarted() {
    if (!state.customerDraft) resetCustomerDraft();
    return state.customerDraft;
  }

  function customerChatTime() {
    return new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  }

  /*********************** مرفقات المحادثة - عرض الصور مثل واتساب V1848 ***********************/

  function attachmentName(file) {
    return text(file && (file.name || file.fileName || file.title || "ملف"));
  }

  function attachmentUrl(file) {
    return text(file && (file.url || file.fileUrl || file.webViewLink || file.previewUrl || ""));
  }

  function attachmentFileId(file) {
    const direct = text(file && (file.fileId || file.id || ""));
    if (direct) return direct;
    const url = attachmentUrl(file);
    let m = url.match(/[?&]id=([^&]+)/);
    if (m && m[1]) return decodeURIComponent(m[1]);
    m = url.match(/\/d\/([^/]+)/);
    if (m && m[1]) return decodeURIComponent(m[1]);
    m = url.match(/\/file\/d\/([^/]+)/);
    if (m && m[1]) return decodeURIComponent(m[1]);
    return "";
  }

  function attachmentMime(file) {
    return text(file && (file.mimeType || file.type || ""));
  }

  function isImageAttachment(file) {
    const mime = attachmentMime(file).toLowerCase();
    if (mime.indexOf("image/") === 0) return true;
    const name = attachmentName(file).toLowerCase();
    return /\.(jpg|jpeg|png|gif|bmp|webp|heic|heif)$/i.test(name);
  }

  function driveImagePreviewUrl(file, size) {
    const ready = text(file && file.thumbnailUrl);
    if (ready) return ready;
    const id = attachmentFileId(file);
    if (id) return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w" + (size || 900);
    const url = attachmentUrl(file);
    return url;
  }

  function fileKindIcon(file) {
    const name = attachmentName(file).toLowerCase();
    const mime = attachmentMime(file).toLowerCase();
    if (mime.indexOf("pdf") !== -1 || name.endsWith(".pdf")) return "📄";
    if (mime.indexOf("zip") !== -1 || /\.(zip|rar|7z)$/i.test(name)) return "🗜️";
    if (/\.(psd|ai|cdr|eps)$/i.test(name)) return "🎨";
    return "📎";
  }

  function renderChatAttachment(file, mode) {
    const name = escapeHtml(attachmentName(file));
    const url = attachmentUrl(file);
    const safeUrl = escapeHtml(url || "#");
    const target = url ? ' href="' + safeUrl + '" target="_blank" rel="noopener"' : '';
    if (isImageAttachment(file)) {
      const img = escapeHtml(driveImagePreviewUrl(file, mode === "small" ? 420 : 900));
      return '<a class="chat-image-card ' + (mode === "staff" ? "staff-image" : "") + '"' + target + '>' +
        '<img src="' + img + '" alt="' + name + '" loading="lazy" onerror="this.parentNode.classList.add(&quot;image-failed&quot;)">' +
        '<span class="chat-image-caption">' + name + '</span>' +
        '</a>';
    }
    return '<a class="wa-file-card chat-doc-card"' + target + '><span class="wa-file-icon">' + fileKindIcon(file) + '</span><span>' + name + '</span></a>';
  }

  function renderOrderAttachmentCard(file) {
    const isFolder = file && file.recordType === "بند";
    if (isFolder) {
      return '<a class="order-file-card" href="' + escapeHtml(attachmentUrl(file) || "#") + '" target="_blank" rel="noopener">' +
        '<b>📁 ' + escapeHtml(attachmentName(file) || file.itemName || "فولدر البند") + '</b>' +
        '<span>' + escapeHtml([file.department, file.itemName].filter(Boolean).join(" | ")) + '</span>' +
        (file.notes ? '<small>' + escapeHtml(file.notes).slice(0, 90) + '</small>' : '') +
        '</a>';
    }
    if (isImageAttachment(file)) {
      return '<a class="order-image-card" href="' + escapeHtml(attachmentUrl(file) || "#") + '" target="_blank" rel="noopener">' +
        '<img src="' + escapeHtml(driveImagePreviewUrl(file, 520)) + '" alt="' + escapeHtml(attachmentName(file)) + '" loading="lazy">' +
        '<b>' + escapeHtml(attachmentName(file)) + '</b>' +
        '<span>' + escapeHtml([file.department, file.itemName].filter(Boolean).join(" | ")) + '</span>' +
        '</a>';
    }
    return '<a class="order-file-card" href="' + escapeHtml(attachmentUrl(file) || "#") + '" target="_blank" rel="noopener">' +
      '<b>' + fileKindIcon(file) + ' ' + escapeHtml(attachmentName(file) || "ملف") + '</b>' +
      '<span>' + escapeHtml([file.department, file.itemName].filter(Boolean).join(" | ")) + '</span>' +
      (file.notes ? '<small>' + escapeHtml(file.notes).slice(0, 90) + '</small>' : '') +
      '</a>';
  }

  function renderCustomerDraft() {
    const draft = ensureCustomerDraftStarted();
    const title = $("customerDraftTitle");
    const meta = $("customerDraftMeta");
    const box = $("customerDraftMessages");
    if (title) title.textContent = draft.orderId ? ("أوردر " + draft.orderId) : (draft.draftId ? "مسودة " + draft.draftId : "طلب جديد");
    if (meta) meta.textContent = draft.submitted ? "تم تحويل الطلب لأوردر رسمي" : (draft.items.length ? ("متصل الآن • " + draft.items.length + " بند") : "متصل الآن • لم يبدأ التنفيذ");
    if (!box) return;

    let html = '<div class="wa-date-chip">اليوم</div>' +
      '<div class="chat-bubble system wa-system-bubble">أهلاً بك في دردشة الطلب. أرسل كل بند كرسالة منفصلة مع صوره وملفاته، وفي النهاية اضغط بدء التنفيذ لاستلام رقم الأوردر.</div>';
    if (draft.items.length) {
      html += draft.items.map(function (item, index) {
        const files = item.files || [];
        const fileHtml = files.length ? files.map(function (f) {
          return renderChatAttachment(f, "customer");
        }).join("") : '<span class="wa-file-card muted"><span class="wa-file-icon">📎</span><span>لم يتم إرفاق ملفات</span></span>';

        return '<div class="chat-bubble customer wa-out-bubble">' +
          '<div class="bubble-title">' + escapeHtml(item.itemName || "بند جديد") + '</div>' +
          '<div class="wa-bubble-line">القسم: <b>' + escapeHtml(item.department || "-") + '</b> • الكمية: <b>' + escapeHtml(item.qty || "1") + '</b></div>' +
          (item.heatPress === "نعم" ? '<div class="wa-badge">🔥 مكبس حراري</div>' : '') +
          (item.flyPrint === "نعم" ? '<div class="wa-badge">⚡ طباعة على الطاير</div>' : '') +
          (item.notes ? '<div class="bubble-meta">' + escapeHtml(item.notes) + '</div>' : '') +
          '<div class="bubble-files wa-file-list">' + fileHtml + '</div>' +
          '<div class="wa-bubble-footer"><span>' + customerChatTime() + '</span><span class="wa-checks">✓✓</span></div>' +
        '</div>';
      }).join("");
    }
    const pendingFiles = state.customerPendingFiles || [];
    const pendingItem = (($("customerOrderItem") || {}).value || "").trim();
    const pendingNotes = (($("customerOrderNotes") || {}).value || "").trim();
    if (!draft.submitted && (pendingFiles.length || pendingItem || pendingNotes)) {
      const dep = (($("customerOrderDepartment") || {}).value || "طباعة");
      const qty = (($("customerOrderQty") || {}).value || "1");
      const pendingFileHtml = pendingFiles.length ? pendingFiles.map(function (f) {
        return renderChatAttachment(f, "customer");
      }).join("") : "";
      html += '<div class="chat-bubble customer wa-out-bubble wa-draft-preview-bubble">' +
        '<div class="wa-draft-label">جاهز للإرسال</div>' +
        '<div class="bubble-title">' + escapeHtml(pendingItem || (pendingFiles.length ? "صور/ملفات مرفوعة" : "بند جديد")) + '</div>' +
        '<div class="wa-bubble-line">القسم: <b>' + escapeHtml(dep) + '</b> • الكمية: <b>' + escapeHtml(qty) + '</b></div>' +
        (dep === "طباعة" && $("customerHeatPress") && $("customerHeatPress").checked ? '<div class="wa-badge">🔥 مكبس حراري</div>' : '') +
        (dep === "طباعة" && $("customerFlyPrint") && $("customerFlyPrint").checked ? '<div class="wa-badge">⚡ طباعة على الطاير</div>' : '') +
        (pendingNotes ? '<div class="bubble-meta">' + escapeHtml(pendingNotes) + '</div>' : '') +
        (pendingFileHtml ? '<div class="bubble-files wa-file-list">' + pendingFileHtml + '</div>' : '') +
        '<div class="wa-bubble-footer"><span>قبل الإرسال</span><span class="wa-checks">○</span></div>' +
      '</div>';
    }
    if (draft.submitted) {
      html += '<div class="chat-bubble done wa-done-bubble">تم استلام الطلب بنجاح ✅<br>رقم الأوردر: <b>' + escapeHtml(draft.orderId || "-") + '</b><br>تابع الحالة من أوردراتي.</div>';
    }
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  }

  function clearCustomerDraftInputs() {
    ["customerOrderItem", "customerOrderNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
    if ($("customerOrderQty")) $("customerOrderQty").value = "1";
    if ($("customerOrderFiles")) $("customerOrderFiles").value = "";
    revokeCustomerPendingFiles();
    if ($("customerHeatPress")) $("customerHeatPress").checked = false;
    if ($("customerFlyPrint")) $("customerFlyPrint").checked = false;
    updateCustomerPrintOptions();
  }

  async function ensureCustomerDraftOnServer() {
    const draft = ensureCustomerDraftStarted();
    if (draft.draftId) return draft.draftId;
    const res = await api("createCustomerDraft", customerAuthParams({}));
    if (!res.success) throw new Error(res.message || "تعذر إنشاء مسودة الطلب.");
    draft.draftId = res.draftId;
    draft.folderUrl = res.folderUrl || "";
    renderCustomerDraft();
    return draft.draftId;
  }

  async function uploadFilesForDraftItem(draftId, itemId, files) {
    const uploaded = [];
    const list = Array.prototype.slice.call(files || []);
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (file.size > 25 * 1024 * 1024) throw new Error("الملف أكبر من 25MB: " + file.name);
      setMsg("customerOrderMsg", "جاري رفع الملف " + (i + 1) + " من " + list.length + ": " + file.name, false);
      const base64 = await fileToBase64(file);
      const res = await apiPost("uploadCustomerDraftFile", customerAuthParams({
        draftId: draftId,
        itemId: itemId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size || 0,
        base64: base64
      }));
      if (!res.success) throw new Error(res.message || "فشل رفع الملف: " + file.name);
      uploaded.push({ name: file.name, url: res.fileUrl || "", fileId: res.fileId || "", mimeType: file.type || res.mimeType || "" });
    }
    return uploaded;
  }

  async function addCustomerDraftItem() {
    if (!state.customer || state.customerDraftBusy) return;
    setMsg("customerOrderMsg", "", false);
    const dep = ($("customerOrderDepartment") || {}).value || "طباعة";
    const itemName = (($("customerOrderItem") || {}).value || "").trim();
    const qty = (($("customerOrderQty") || {}).value || "1").trim();
    const notes = (($("customerOrderNotes") || {}).value || "").trim();
    const heatPress = dep === "طباعة" && $("customerHeatPress") && $("customerHeatPress").checked ? "نعم" : "لا";
    const flyPrint = dep === "طباعة" && $("customerFlyPrint") && $("customerFlyPrint").checked ? "نعم" : "لا";
    const files = ($("customerOrderFiles") || {}).files || [];

    if (!itemName && !notes && !files.length) {
      setMsg("customerOrderMsg", "اكتب نوع الشغل أو ارفع ملفات البند.", true);
      return;
    }

    const btn = $("customerAddDraftItemBtn");
    state.customerDraftBusy = true;
    if (btn) { btn.disabled = true; btn.textContent = "جاري الإضافة..."; }

    try {
      const draftId = await ensureCustomerDraftOnServer();
      const res = await api("addCustomerDraftItem", customerAuthParams({
        draftId: draftId,
        department: dep,
        itemName: itemName || (files.length ? "ملفات مرفوعة" : "بند جديد"),
        qty: qty,
        notes: notes,
        heatPress: heatPress,
        flyPrint: flyPrint
      }));
      if (!res.success) throw new Error(res.message || "تعذر إضافة البند.");
      const uploaded = await uploadFilesForDraftItem(draftId, res.itemId, files);
      const draft = ensureCustomerDraftStarted();
      draft.items.push({
        itemId: res.itemId,
        department: dep,
        itemName: itemName || (files.length ? "ملفات مرفوعة" : "بند جديد"),
        qty: qty,
        notes: notes,
        heatPress: heatPress,
        flyPrint: flyPrint,
        files: uploaded
      });
      renderCustomerDraft();
      clearCustomerDraftInputs();
      setMsg("customerOrderMsg", "تم إضافة البند للمسودة. أضف بند آخر أو اضغط بدء التنفيذ.", false);
    } catch (err) {
      setMsg("customerOrderMsg", err.message || "خطأ أثناء إضافة البند.", true);
    } finally {
      state.customerDraftBusy = false;
      if (btn) { btn.disabled = false; btn.textContent = "➤"; }
    }
  }

  async function submitCustomerDraft() {
    if (!state.customer || state.customerDraftBusy) return;
    const draft = ensureCustomerDraftStarted();
    if (!draft.draftId || !draft.items.length) {
      setMsg("customerOrderMsg", "أضف بند واحد على الأقل قبل بدء التنفيذ.", true);
      return;
    }
    if (!confirm("سيتم بدء التنفيذ الآن وإنشاء رقم أوردر رسمي. هل أنت متأكد؟")) return;

    const btn = $("customerSubmitDraftBtn");
    state.customerDraftBusy = true;
    if (btn) { btn.disabled = true; btn.textContent = "جاري إنشاء رقم الأوردر..."; }
    try {
      const res = await api("submitCustomerDraft", customerAuthParams({ draftId: draft.draftId }));
      if (!res.success) throw new Error(res.message || "تعذر بدء التنفيذ.");
      draft.submitted = true;
      draft.orderId = res.orderId || "";
      renderCustomerDraft();
      setMsg("customerOrderMsg", "تم استلام طلبك. رقم الأوردر: " + (res.orderId || "-"), false);
      await loadCustomerOrders();
    } catch (err) {
      setMsg("customerOrderMsg", err.message || "خطأ أثناء بدء التنفيذ.", true);
    } finally {
      state.customerDraftBusy = false;
      if (btn) { btn.disabled = false; btn.textContent = "بدء التنفيذ واستلام رقم الأوردر"; }
    }
  }

  function startNewCustomerDraft() {
    if (state.customerDraft && state.customerDraft.items && state.customerDraft.items.length && !state.customerDraft.submitted) {
      if (!confirm("المسودة الحالية لم يتم بدء تنفيذها. هل تريد فتح مسودة جديدة؟")) return;
    }
    resetCustomerDraft();
    clearCustomerDraftInputs();
  }

  function createCustomerPortalOrder() {
    // تم الاحتفاظ باسم الدالة القديم للتوافق، لكنه الآن يضيف بندًا لمسودة الطلب.
    return addCustomerDraftItem();
  }

  function buildCustomerOrderSeparator(orderId, department, itemText) {
    const c = state.customer || {};
    return [
      "✅ فاصل أوردر منصة مطبعجي بنها",
      "كود الشات: " + (c.customerCode || "-"),
      "اسم الشات: " + (c.name || "-"),
      "رقم الأوردر: " + (orderId || "-"),
      "القسم: " + (department || "-"),
      itemText ? "المطلوب: " + itemText : "",
      "",
      "كل الملفات والصور والرسائل الموجودة فوق هذا الفاصل، وبعد آخر فاصل أوردر سابق، تخص رقم الأوردر المكتوب هنا فقط.",
      "أي شغل جديد بعد هذا الفاصل يحتاج رقم أوردر جديد."
    ].filter(Boolean).join("\n");
  }

  async function copyCustomerSeparator() {
    const value = ($("customerSeparatorText") || {}).value || "";
    const ok = await copyTextToClipboard(value);
    alert(ok ? "تم نسخ فاصل الأوردر." : "لم أستطع النسخ تلقائيًا. انسخه يدويًا من المربع.");
  }

  function openCustomerPasswordModal() {
    const modal = $("customerPasswordModal");
    if (modal) modal.classList.remove("hidden");
    setMsg("customerPassMsg", "", false);
  }

  function closeCustomerPasswordModal() {
    const modal = $("customerPasswordModal");
    if (modal) modal.classList.add("hidden");
    ["customerOldPassword", "customerNewPassword", "customerConfirmPassword"].forEach(function (id) { if ($(id)) $(id).value = ""; });
  }

  async function changeCustomerPassword() {
    const oldPassword = (($("customerOldPassword") || {}).value || "").trim();
    const newPassword = (($("customerNewPassword") || {}).value || "").trim();
    const confirmPassword = (($("customerConfirmPassword") || {}).value || "").trim();
    if (!oldPassword || !newPassword) {
      setMsg("customerPassMsg", "اكتب كلمة المرور الحالية والجديدة.", true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg("customerPassMsg", "تأكيد كلمة المرور غير مطابق.", true);
      return;
    }
    try {
      const res = await api("changeCustomerPassword", customerAuthParams({ oldPassword: oldPassword, newPassword: newPassword }));
      if (!res.success) {
        setMsg("customerPassMsg", res.message || "فشل تغيير كلمة المرور.", true);
        return;
      }
      if (state.customer) state.customer.mustChange = false;
      saveCustomerSession();
      setMsg("customerPassMsg", res.message || "تم تغيير كلمة المرور.", false);
      setTimeout(closeCustomerPasswordModal, 900);
    } catch (err) {
      setMsg("customerPassMsg", err.message || "خطأ أثناء تغيير كلمة المرور.", true);
    }
  }

  function customerLogout() {
    clearCustomerSession();
    showEntryChoice();
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

    Array.prototype.forEach.call(tbody.querySelectorAll(".wa-open-chat"), function (btn) {
      btn.addEventListener("click", function () {
        const row = pageRows[Number(btn.dataset.i)];
        if (row) openWhatsAppChatOnly(row.customerPhone);
      });
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".order-chat-open"), function (btn) {
      btn.addEventListener("click", function () {
        openOrderConversationModal(pageRows[Number(btn.dataset.i)]);
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
      '<button type="button" class="wa-btn wa-status" data-i="' + i + '"' + disabled + '>نسخ رد الحالة</button>' +
      '<button type="button" class="wa-btn wa-ready" data-i="' + i + '"' + disabled + '>نسخ رسالة انتهاء</button>' +
      '<button type="button" class="wa-btn wa-open-chat" data-i="' + i + '"' + disabled + '>فتح واتساب</button>' +
      '<button type="button" class="wa-btn order-chat-open" data-i="' + i + '">محادثة الأوردر</button>' +
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
    const copied = await copyWhatsAppMessage(row.customerPhone, message);
    if (!copied) return;

    const confirmText = mode === "ready"
      ? "تم نسخ رسالة الانتهاء. افتح تبويب واتساب والصقها للعميل. هل تم إرسال الرسالة؟"
      : "تم نسخ رد الحالة. افتح تبويب واتساب والصقه للعميل. هل تم إرسال الرد؟";

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





  /*********************** V1845 - محادثة الأوردر للموظف ***********************/

  function closeOrderConversationModal() {
    const modal = $("orderConversationModal");
    if (modal) modal.classList.add("hidden");
    state.orderConversationRow = null;
    state.orderConversation = null;
    state.orderConversationBusy = false;
  }

  function orderConversationAuthPayload(extra) {
    return authParams(extra || {});
  }

  async function openOrderConversationModal(row) {
    if (!row) return;
    state.orderConversationRow = row;
    const modal = $("orderConversationModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    const title = $("orderConversationTitle");
    const meta = $("orderConversationMeta");
    const body = $("orderConversationBody");
    if (title) title.textContent = "محادثة الأوردر " + (row.orderId || "-");
    if (meta) meta.textContent = "جاري تحميل التفاصيل والملفات...";
    if (body) body.innerHTML = '<div class="dash-empty">جاري تحميل محادثة الأوردر...</div>';
    await loadOrderConversation(row);
  }

  async function loadOrderConversation(row) {
    row = row || state.orderConversationRow;
    if (!row) return;
    const meta = $("orderConversationMeta");
    try {
      const res = await api("getOrderConversation", orderConversationAuthPayload({
        orderId: row.orderId || "",
        lineId: row.lineId || ""
      }));
      if (!res.success) throw new Error(res.message || "تعذر تحميل محادثة الأوردر.");
      state.orderConversation = res;
      if (meta) meta.textContent = "العميل: " + ((res.lines && res.lines[0] && res.lines[0].customer) || row.customer || "-") + " | البند: " + (row.lineId || "كل البنود");
      renderOrderConversation();
    } catch (err) {
      if (meta) meta.textContent = err.message || "خطأ في تحميل المحادثة.";
      const body = $("orderConversationBody");
      if (body) body.innerHTML = '<div class="dash-empty error">' + escapeHtml(err.message || "خطأ في تحميل المحادثة") + '</div>';
    }
  }

  function renderOrderConversation() {
    const data = state.orderConversation || {};
    const body = $("orderConversationBody");
    if (!body) return;
    const lines = data.lines || [];
    const files = data.files || [];
    const messages = data.messages || [];

    let html = '';
    html += '<div class="order-chat-section"><h4>تفاصيل البند / الأوردر</h4>';
    html += lines.map(function (line) {
      return '<div class="order-chat-line-card">' +
        '<b>' + escapeHtml(line.lineId || line.orderId || "-") + '</b>' +
        '<span>القسم: ' + escapeHtml(line.department || "-") + '</span>' +
        '<span>الشغل: ' + escapeHtml(line.itemName || "-") + '</span>' +
        '<span>الكمية: ' + escapeHtml(line.qty || "1") + '</span>' +
        '<span>الحالة: ' + escapeHtml(line.status || "طلب جديد") + '</span>' +
        (line.notes ? '<p>' + escapeHtml(line.notes).replace(/\n/g, '<br>') + '</p>' : '') +
        (line.itemFolderUrl ? '<a href="' + escapeHtml(line.itemFolderUrl) + '" target="_blank">فتح فولدر البند على Drive</a>' : '') +
        '</div>';
    }).join('') + '</div>';

    html += '<div class="order-chat-section"><h4>ملفات العميل</h4>';
    if (!files.length) html += '<div class="dash-empty">لا توجد ملفات مرفوعة لهذا البند حتى الآن.</div>';
    else html += '<div class="order-files-grid">' + files.map(function (f) {
      return renderOrderAttachmentCard(f);
    }).join('') + '</div>';
    html += '</div>';

    html += '<div class="order-chat-section"><h4>المتابعة والبروفات</h4><div class="order-conversation-messages">';
    if (!messages.length) html += '<div class="chat-bubble system">لم يتم إضافة متابعة بعد. اكتب رسالة أو ارفع بروفة للعميل.</div>';
    else html += messages.map(function (m) {
      const cls = m.senderType === "عميل" ? "customer" : "staff";
      return '<div class="chat-bubble ' + cls + '">' +
        '<div class="bubble-title">' + escapeHtml(m.senderName || m.senderType || "متابعة") + '</div>' +
        (m.text ? '<div>' + escapeHtml(m.text).replace(/\n/g, '<br>') + '</div>' : '') +
        (m.fileUrl ? '<div class="bubble-files">' + renderChatAttachment({ fileName: m.fileName, fileUrl: m.fileUrl, fileId: m.fileId, mimeType: m.mimeType }, "staff") + '</div>' : '') +
        (m.createdAt ? '<div class="bubble-meta">' + escapeHtml(m.createdAt) + '</div>' : '') +
        '</div>';
    }).join('');
    html += '</div></div>';
    body.innerHTML = html;
  }

  async function sendOrderConversationMessage() {
    if (state.orderConversationBusy) return;
    const row = state.orderConversationRow;
    if (!row) return;
    const textBox = $("orderConversationText");
    const fileInput = $("orderConversationFiles");
    const msg = (textBox && textBox.value || "").trim();
    const files = fileInput && fileInput.files ? Array.prototype.slice.call(fileInput.files) : [];
    if (!msg && !files.length) {
      setMsg("orderConversationMsg", "اكتب رسالة أو ارفع ملف بروفة أولًا.", true);
      return;
    }
    const btn = $("sendOrderConversationBtn");
    state.orderConversationBusy = true;
    if (btn) { btn.disabled = true; btn.textContent = "جاري الإرسال..."; }
    setMsg("orderConversationMsg", "جاري حفظ المتابعة...", false);
    try {
      if (files.length) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.size > 25 * 1024 * 1024) throw new Error("الملف أكبر من 25MB: " + file.name);
          setMsg("orderConversationMsg", "جاري رفع ملف " + (i + 1) + " من " + files.length + ": " + file.name, false);
          const base64 = await fileToBase64(file);
          const res = await apiPost("uploadOrderConversationFile", orderConversationAuthPayload({
            orderId: row.orderId || "",
            lineId: row.lineId || "",
            message: i === 0 ? msg : "",
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size || 0,
            base64: base64
          }));
          if (!res.success) throw new Error(res.message || "فشل رفع ملف البروفة.");
        }
      } else {
        const res = await api("sendOrderConversationMessage", orderConversationAuthPayload({
          orderId: row.orderId || "",
          lineId: row.lineId || "",
          message: msg
        }));
        if (!res.success) throw new Error(res.message || "تعذر حفظ الرسالة.");
      }
      if (textBox) textBox.value = "";
      if (fileInput) fileInput.value = "";
      setMsg("orderConversationMsg", "تم حفظ المتابعة في محادثة الأوردر.", false);
      await loadOrderConversation(row);
    } catch (err) {
      setMsg("orderConversationMsg", err.message || "خطأ أثناء إرسال المتابعة.", true);
    } finally {
      state.orderConversationBusy = false;
      if (btn) { btn.disabled = false; btn.textContent = "إرسال المتابعة / البروفة"; }
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
      department: text($("newDepartment").value) === "مكبس" ? "طباعة" : $("newDepartment").value,
      heatPress: ((text($("newDepartment").value) === "مكبس") || ($("newHeatPress") && $("newHeatPress").checked)) ? "نعم" : "لا",
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
        const copied = await copyWhatsAppMessage(params.customerPhone, msg);
        if (copied && confirm("تم نسخ رسالة تسجيل الأوردر. افتح تبويب واتساب والصقها للعميل. هل تم إرسال الرسالة؟")) {
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
    showEntryChoice();
  }

  function wireEvents() {
    function on(id, eventName, handler) {
      const el = $(id);
      if (el) el.addEventListener(eventName, handler);
    }

    on("employeeEntryBtn", "click", showLogin);
    on("customerEntryBtn", "click", showCustomerLogin);
    on("backToEntryFromLogin", "click", showEntryChoice);
    on("backToEntryFromCustomer", "click", showEntryChoice);

    on("customerLoginBtn", "click", doCustomerLogin);
    on("customerPassword", "keydown", function (e) { if (e.key === "Enter") doCustomerLogin(); });
    on("customerCode", "keydown", function (e) { if (e.key === "Enter" && $("customerPassword")) $("customerPassword").focus(); });
    on("customerLogoutBtn", "click", customerLogout);
    on("customerRefreshOrdersBtn", "click", loadCustomerOrders);
    on("customerGoHomeBtn", "click", function () { state.customerViewMode = "home"; renderCustomerHome(); });
    on("customerShowOrdersBtn", "click", function () { state.customerViewMode = "orders"; renderCustomerHome(); loadCustomerOrders(); });
    on("customerShowNewOrderBtn", "click", function () { state.customerViewMode = "newOrder"; if (!state.customerDraft || state.customerDraft.submitted) resetCustomerDraft(); renderCustomerHome(); });
    on("customerShowDesignerBtn", "click", function () { state.customerViewMode = "designer"; renderCustomerHome(); });
    on("customerOpenMatbagySheetsBtn", "click", function () { window.open("https://fawakhry.github.io/Matbagy/?from=matbagy-platform", "_blank"); });
    on("customerOrderDepartment", "change", function () { updateCustomerPrintOptions(); refreshCustomerPendingPreview(); });
    on("customerOrderFiles", "change", syncCustomerPendingFilesFromInput);
    on("customerOrderItem", "input", refreshCustomerPendingPreview);
    on("customerOrderNotes", "input", refreshCustomerPendingPreview);
    on("customerOrderQty", "input", refreshCustomerPendingPreview);
    on("customerHeatPress", "change", refreshCustomerPendingPreview);
    on("customerFlyPrint", "change", refreshCustomerPendingPreview);
    on("customerCreateOrderBtn", "click", createCustomerPortalOrder);
    on("customerAddDraftItemBtn", "click", addCustomerDraftItem);
    on("customerSubmitDraftBtn", "click", submitCustomerDraft);
    on("customerResetDraftBtn", "click", startNewCustomerDraft);
    on("customerBackFromChatBtn", "click", function () { state.customerViewMode = "home"; renderCustomerHome(); });
    on("copyCustomerSeparatorBtn", "click", copyCustomerSeparator);
    on("customerChangePassBtn", "click", openCustomerPasswordModal);
    on("customerCancelPassBtn", "click", closeCustomerPasswordModal);
    on("customerSavePassBtn", "click", changeCustomerPassword);

    $("loginBtn").addEventListener("click", doLogin);
    $("password").addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
    $("username").addEventListener("keydown", function (e) { if (e.key === "Enter") $("password").focus(); });

    $("refreshBtn").addEventListener("click", function () { state.editing = false; loadRows(true); });
    $("logoutBtn").addEventListener("click", logout);
    $("changePassBtn").addEventListener("click", openPasswordModal);
    $("cancelPassBtn").addEventListener("click", closePasswordModal);
    $("savePassBtn").addEventListener("click", changePassword);
    const cancelConversationButton = $("closeOrderConversationBtn");
    if (cancelConversationButton) cancelConversationButton.addEventListener("click", closeOrderConversationModal);
    const sendConversationButton = $("sendOrderConversationBtn");
    if (sendConversationButton) sendConversationButton.addEventListener("click", sendOrderConversationMessage);
    const refreshConversationButton = $("refreshOrderConversationBtn");
    if (refreshConversationButton) refreshConversationButton.addEventListener("click", function () { loadOrderConversation(); });

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
    else if (loadCustomerSession()) bootCustomerMain();
    else showEntryChoice();
  });
})();
