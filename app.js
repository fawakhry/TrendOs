(function () {
  "use strict";

  const API_URL = (window.TREND_API_URL || window.API_URL || "").trim();
  const REFRESH_MS = 10000;
  const UI_VERSION = "1857_ES14_ACCOUNTING_MERGE";

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
  // تم حذف: جاهز للطباعة / تم التنفيذ / مشكلة من الاختيارات اليومية. مكرر أصبح حالة تشغيلية مخفية عن العميل.
  const statuses = [
    "طلب جديد",
    "بدأ التنفيذ",
    "تحت التنفيذ",
    "جاهز للاستلام",
    "تم التسليم",
    "متوقف",
    "مكرر",
    "ملغى"
  ];

  // حالات لا تظهر في شاشة التشغيل بعد حفظها.
  // تفضل موجودة في الشيت للتاريخ والمتابعة، لكنها تختفي من شاشة المستخدمين.
  const HIDDEN_FROM_USER_SCREENS = ["جاهز للاستلام", "تم التسليم", "مكرر", "تم التنفيذ", "جاهز للطباعة", "ملغى"];
  const PROOF_REVIEW_TEXT = "المراجعة مسئولية العميل والمكان غير مسئول عن اى اخطاء إملائية\nالبروفة مبعوته للمراجعه !!\nلو سمحت المراجعة جيدا على الشكل و البيانات بشكل دقيق قبل الرد على البروفة\nفى إنتظار حضرتك .....";
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
    orderConversationBusy: false,
    customerImageViewerFiles: [],
    customerImageViewerIndex: 0,
    customerImageViewerMode: "readonly",
    platformAds: [],
    platformSections: [],
    franchiseBranches: [],
    customerLocation: null,
    customerSelectedFranchise: null,
    customerSelectedSection: null,
    customerDesignOfferItemId: "",
    whiteLabelSettings: null,
    leadNumbers: [],
    serviceRoutes: [],
    marketplaceVendors: [],
    marketplaceProducts: [],
    customerSelectedMarketVendor: null,
    customerSelectedMarketProduct: null,
    adminArea: "matbagy",
    visitorPreview: false,
    platformAdEditor: { scale: 1, offsetX: 0, offsetY: 0, dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0, objectUrl: "" },
    accounting: { materials: [], templates: [], deptLines: [], finalInvoices: [], summary: {}, permissions: {}, loaded: false, selectedOrderLines: [] }
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

  function currentUserNameKey(user) {
    user = user || state.user || {};
    return normalizeArabic(user.username || user.name || "");
  }

  function userAliasMatch(user, aliases) {
    const key = currentUserNameKey(user);
    if (!key) return false;
    return (aliases || []).map(function (v) { return normalizeArabic(v); }).some(function (alias) {
      return alias && (key === alias || key.indexOf(alias) !== -1 || alias.indexOf(key) !== -1);
    });
  }

  function isDiaaUser(user) {
    return userAliasMatch(user, ["ضياء", "diaa"]);
  }

  function isRahmaUser(user) {
    return userAliasMatch(user, ["رحمه", "رحمة", "rahma"]);
  }

  function isRevanUser(user) {
    return userAliasMatch(user, ["ريفان", "ريڤان", "revan", "rivan"]);
  }

  function isWaelUser(user) {
    return userAliasMatch(user, ["وائل", "wael"]);
  }

  function isGaberUser(user) {
    return userAliasMatch(user, ["جابر", "gaber", "jaber"]);
  }

  function isRahmaRestrictedUser(user) {
    return isRahmaUser(user || state.user || {});
  }

  function isEmployeeLoggedIn(user) {
    user = user || state.user || {};
    return !!(user && (user.username || user.name || user.role));
  }

  function canAddManualOrder() {
    const user = state.user || {};
    const role = safeRole(user.role);
    return role === "admin" || role === "service" || isDiaaUser(user) || isRahmaUser(user);
  }

  function canCodeCustomers() {
    const user = state.user || {};
    const role = safeRole(user.role);
    return role === "admin" || role === "service" || isDiaaUser(user) || isRahmaUser(user);
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
    if (["تم التنفيذ", "جاهز للاستلام", "تم التسليم", "مكرر", "ملغى"].indexOf(status) !== -1) return false;
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

    if (status === "ملغى") {
      return `أهلاً${customer} 👋
تم تسجيل إلغاء الأوردر رقم ${orderId} بناءً على طلب حضرتك.
نوع الشغل: ${item}
القسم: ${dept}${row.notes ? "\nملاحظات: " + row.notes : ""}
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


  /*********************** V1856 Patch 03 - بوابة ملفات سيرفر المطبعة ***********************/

  function localFileServerUrl() {
    const configured = text(window.MATBAGY_FILE_SERVER_URL || "").trim();
    return configured || "http://192.168.1.10:5050";
  }

  function openLocalFileServer() {
    const url = localFileServerUrl();
    if (!url) {
      alert("رابط بوابة ملفات السيرفر غير مضبوط في config.js");
      return;
    }
    window.open(url, "Matbagy_Server_Files");
  }


  /*********************** V1856 Patch 04 - ملفات مطبعجي من البيت + عميل طباعة ع الطاير ***********************/

  function remoteFileServerUrl() {
    const remote = text(window.MATBAGY_REMOTE_FILES_URL || "").trim();
    const local = localFileServerUrl();
    return remote || local;
  }

  function fastPrintUploadUrl() {
    const direct = text(window.MATBAGY_FAST_PRINT_UPLOAD_URL || "").trim();
    return direct || remoteFileServerUrl();
  }

  function filesEmployeeKeys() {
    const u = state.user || {};
    return [u.username, u.name]
      .map(function (v) { return normalizeArabic(v); })
      .filter(Boolean);
  }

  function employeeCanOpenRemoteFiles() {
    const allowed = Array.isArray(window.MATBAGY_FILES_ALLOWED_EMPLOYEES) ? window.MATBAGY_FILES_ALLOWED_EMPLOYEES : ["ضياء", "جابر", "وائل", "diaa", "gaber", "wael"];
    const keys = filesEmployeeKeys();
    return allowed.map(function (v) { return normalizeArabic(v); }).some(function (v) {
      return v && keys.some(function (k) { return k === v || k.indexOf(v) !== -1 || v.indexOf(k) !== -1; });
    });
  }



  /*********************** Patch 12 - تثبيت أزرار نوت وحسابات مطبعجي ***********************/
  function ensureEmployeeMainActionButtons() {
    const holder = document.querySelector(".top-actions") || document.querySelector(".topbar") || document.body;
    if (!holder) return;

    function makeButton(id, textValue, extraClass, afterId, clickHandler) {
      let btn = $(id);
      if (!btn) {
        btn = document.createElement("button");
        btn.id = id;
        btn.type = "button";
        btn.className = "ghost quick-tool-btn" + (extraClass ? " " + extraClass : "");
        btn.textContent = textValue;
        const after = afterId ? $(afterId) : null;
        if (after && after.parentNode) after.parentNode.insertBefore(btn, after.nextSibling);
        else holder.appendChild(btn);
      }
      if (!btn.dataset.patch12Bound && typeof clickHandler === "function") {
        btn.addEventListener("click", clickHandler);
        btn.dataset.patch12Bound = "1";
      }
      return btn;
    }

    makeButton("matbagyNoteBtn", "📝 نوت مطبعجي", "note-btn", "matbagyRotetBtn", openMatbagyNotePanel);
    makeButton("accountingBtn", "💰 حسابات مطبعجي", "accounting-btn", "matbagyNoteBtn", openAccountingPanel);
  }

  function toggleRemoteFilesButton() {
    ensureEmployeeMainActionButtons();
    const btn = $("remoteFilesBtn");
    if (!btn) return;
    btn.classList.toggle("hidden", !employeeCanOpenRemoteFiles());
  }

  function employeeToolKeys() {
    const u = state.user || {};
    return [u.username, u.name]
      .map(function (v) { return normalizeArabic(v); })
      .filter(Boolean);
  }

  function employeeCanOpenQuickTools() {
    const allowed = Array.isArray(window.MATBAGY_EMPLOYEE_TOOLS_ALLOWED) ? window.MATBAGY_EMPLOYEE_TOOLS_ALLOWED : ["ضياء", "جابر", "وائل", "diaa", "gaber", "wael"];
    const keys = employeeToolKeys();
    return allowed.map(function (v) { return normalizeArabic(v); }).some(function (v) {
      return v && keys.some(function (k) { return k === v || k.indexOf(v) !== -1 || v.indexOf(k) !== -1; });
    });
  }

  function employeeCanOpenMatbagyNote() {
    return isEmployeeLoggedIn();
  }

  function toggleEmployeeQuickToolButtons() {
    ensureEmployeeMainActionButtons();
    ["matbagySheetsBtn", "matbagyRotetBtn"].forEach(function (id) {
      const btn = $(id);
      if (!btn) return;
      btn.classList.toggle("hidden", !employeeCanOpenQuickTools());
    });
    const noteBtn = $("matbagyNoteBtn");
    if (noteBtn) noteBtn.classList.toggle("hidden", !employeeCanOpenMatbagyNote());
  }

  function openEmployeeTool(baseUrl, windowName, label) {
    const base = text(baseUrl || "").trim();
    if (!base) {
      alert("رابط " + label + " غير مضبوط في config.js");
      return;
    }
    if (!employeeCanOpenQuickTools()) {
      alert("هذا الزر متاح حالياً لحسابات ضياء وجابر ووائل فقط.");
      return;
    }
    const u = state.user || {};
    let url = base;
    if (window.MATBAGY_EMPLOYEE_TOOL_SSO !== false) {
      url = withQuery(url, {
        from: "trendos",
        username: u.username || u.name || "",
        name: u.name || u.username || "",
        token: u.token || ""
      });
    }
    window.open(url, windowName || "Matbagy_Tool");
  }

  function openMatbagySheetsTool() {
    openEmployeeTool(window.MATBAGY_SHEETS_URL, "Matbagy_Sheets", "مطبعجي شيتات");
  }

  function openMatbagyRotetTool() {
    openEmployeeTool(window.MATBAGY_ROTET_URL, "Matbagy_Rotet", "روتيت مطبعجي");
  }

  function openMatbagyNotePanel() {
    if (!employeeCanOpenMatbagyNote()) {
      alert("نوت مطبعجي متاحة للموظفين فقط.");
      return;
    }
    const card = $("aiKnowledgeCard");
    if (!card) {
      alert("شاشة نوت مطبعجي غير موجودة في هذه النسخة. ارفع index.html و app.js معًا.");
      return;
    }

    // Patch 14: الزر أصبح فتح/إغلاق حقيقي، ويفتح الكارت كامل وليس مطوي.
    const isOpen = !card.classList.contains("hidden") && !card.classList.contains("admin-area-off") && !card.classList.contains("collapsed-card");
    if (isOpen) {
      card.classList.add("hidden");
      return;
    }

    if (canSeeAdminWorkspace()) {
      state.adminArea = "responses";
      setupAdminWorkspace();
      applyAdminWorkspaceTab();
    }

    card.classList.remove("hidden");
    card.classList.remove("admin-area-off");
    card.classList.remove("collapsed-card");
    try { localStorage.setItem("trendos_collapse_ai_knowledge", "open"); } catch (e) {}
    const collapseBtn = card.querySelector(".collapse-toggle");
    if (collapseBtn) collapseBtn.textContent = "قفل ▲";
    loadKnowledge(false);
    setTimeout(function () { card.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  }



  /*********************** Patch 11/12 - حسابات مطبعجي حسب القسم + تثبيت الأزرار ***********************/

  function currentAccountingMode() {
    const user = state.user || {};
    const role = safeRole(user.role);
    if (isDiaaUser(user) || role === "admin") return "full";
    if (isRahmaUser(user) || isRevanUser(user)) return "final";
    if (isWaelUser(user) || role === "print") return "print";
    if (isGaberUser(user) || role === "laser") return "laser";
    return "none";
  }

  function canOpenAccounting() {
    return currentAccountingMode() !== "none";
  }

  function accountingDepartmentForMode(mode) {
    mode = mode || currentAccountingMode();
    if (mode === "print") return "طباعة";
    if (mode === "laser") return "ليزر";
    return "";
  }

  function accountingCanManageMaterials() {
    return currentAccountingMode() === "full";
  }

  function accountingCanCloseFinalInvoice() {
    const mode = currentAccountingMode();
    return mode === "full" || mode === "final";
  }

  function accountingCanEnterDeptLine() {
    const mode = currentAccountingMode();
    return mode === "full" || mode === "print" || mode === "laser";
  }

  function toggleAccountingButton() {
    ensureEmployeeMainActionButtons();
    const btn = $("accountingBtn");
    if (!btn) return;
    btn.classList.toggle("hidden", !canOpenAccounting());
  }

  function forceVisibleMainButtonsPatch13() {
    ensureEmployeeMainActionButtons();
    const noteBtn = $("matbagyNoteBtn");
    if (noteBtn && isEmployeeLoggedIn()) noteBtn.classList.remove("hidden");
    const accBtn = $("accountingBtn");
    if (accBtn && canOpenAccounting()) accBtn.classList.remove("hidden");
  }

  function openAccountingPanel() {
    if (!canOpenAccounting()) {
      alert("حسابات مطبعجي غير مفعلة لهذا المستخدم.");
      return;
    }
    const modal = $("accountingModal");
    if (modal) modal.classList.remove("hidden");
    prepareAccountingUiByRole();
    loadAccountingData(true);
  }

  function closeAccountingPanel() {
    const modal = $("accountingModal");
    if (modal) modal.classList.add("hidden");
  }

  function prepareAccountingUiByRole() {
    const mode = currentAccountingMode();
    const title = $("accountingRoleTitle");
    const hint = $("accountingRoleHint");
    const materialBox = $("accountingMaterialBox");
    const templateBox = $("accountingTemplateBox");
    const deptBox = $("accountingDeptLineBox");
    const finalBox = $("accountingFinalInvoiceBox");
    const profitBox = $("accountingProfitBox");

    if (title) {
      if (mode === "full") title.textContent = "حسابات مطبعجي - ضياء / الإدارة";
      else if (mode === "final") title.textContent = "حسابات مطبعجي - تقفيل فواتير";
      else if (mode === "print") title.textContent = "حسابات مطبعجي - قسم الطباعة";
      else if (mode === "laser") title.textContent = "حسابات مطبعجي - قسم الليزر";
      else title.textContent = "حسابات مطبعجي";
    }

    if (hint) {
      if (mode === "full") hint.textContent = "ضياء يرى كل الأقسام، يضيف الخامات والبنود الثابتة، ويراجع الربح والخسارة لكل قسم.";
      else if (mode === "final") hint.textContent = "رحمه / ريفان تقفل الفاتورة النهائية وتستدعي أجزاء وائل وجابر من نفس رقم الأوردر.";
      else hint.textContent = "كل قسم يسجل فاتورته وتكلفته فقط. التجميع النهائي عند رحمه أو ريفان أو ضياء.";
    }

    if (materialBox) materialBox.classList.toggle("hidden", !accountingCanManageMaterials());
    if (templateBox) templateBox.classList.toggle("hidden", !accountingCanManageMaterials());
    if (deptBox) deptBox.classList.toggle("hidden", !accountingCanEnterDeptLine());
    if (finalBox) finalBox.classList.toggle("hidden", !accountingCanCloseFinalInvoice());
    if (profitBox) profitBox.classList.toggle("hidden", mode !== "full");

    const deptSelect = $("accDeptLineDepartment");
    if (deptSelect) {
      const lockedDept = accountingDepartmentForMode(mode);
      if (lockedDept) {
        deptSelect.value = lockedDept;
        deptSelect.disabled = true;
      } else {
        deptSelect.disabled = false;
      }
    }
  }

  async function initAccountingSheets() {
    setMsg("accountingMsg", "جاري تجهيز شيتات حسابات مطبعجي...", false);
    try {
      const res = await api("initAccounting", authParams({}));
      if (!res.success) {
        setMsg("accountingMsg", res.message || "تعذر تجهيز شيتات الحسابات.", true);
        return;
      }
      setMsg("accountingMsg", res.message || "تم تجهيز شيتات الحسابات.", false);
      await loadAccountingData(true);
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في تجهيز الحسابات.", true);
    }
  }

  async function loadAccountingData(force) {
    if (!canOpenAccounting()) return;
    setMsg("accountingMsg", "جاري تحميل حسابات مطبعجي...", false);
    try {
      const res = await api("getAccounting", authParams({}));
      if (!res.success) {
        setMsg("accountingMsg", res.message || "تعذر تحميل الحسابات.", true);
        return;
      }
      state.accounting = {
        materials: Array.isArray(res.materials) ? res.materials : [],
        templates: Array.isArray(res.templates) ? res.templates : [],
        deptLines: Array.isArray(res.deptLines) ? res.deptLines : [],
        finalInvoices: Array.isArray(res.finalInvoices) ? res.finalInvoices : [],
        summary: res.summary || {},
        permissions: res.permissions || {},
        loaded: true,
        selectedOrderLines: []
      };
      renderAccountingPanel();
      setMsg("accountingMsg", "تم تحميل الحسابات.", false);
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في تحميل الحسابات.", true);
    }
  }

  function accountingMoney(value) {
    const n = numericAmount(value);
    return n.toLocaleString("ar-EG") + " ج";
  }

  function accountingLineCost(row) {
    return numericAmount(row.totalCost || row["إجمالي التكلفة"] || row.materialCost) + 0;
  }

  function accountingLineSale(row) {
    return numericAmount(row.salePrice || row["سعر البيع"] || 0);
  }

  function renderAccountingPanel() {
    renderAccountingSummary();
    renderAccountingMaterials();
    renderAccountingTemplates();
    renderAccountingDeptLines();
    renderAccountingFinalInvoices();
    syncAccountingMaterialOptions();
  }

  function renderAccountingSummary() {
    const box = $("accountingSummary");
    if (!box) return;
    const summary = state.accounting.summary || {};
    const rows = summary.byDepartment || [];
    if (!rows.length) {
      box.innerHTML = '<div class="dash-empty">لا توجد حركة حسابات بعد.</div>';
      return;
    }
    const showProfit = currentAccountingMode() === "full";
    box.innerHTML = rows.map(function (r) {
      const profitPart = showProfit ? '<span>مكسب: <b>' + accountingMoney(r.profit) + '</b></span>' : '';
      return '<div class="acc-summary-card">' +
        '<b>' + escapeHtml(r.department || "-") + '</b>' +
        '<span>مبيعات: <b>' + accountingMoney(r.sales) + '</b></span>' +
        '<span>تكلفة: <b>' + accountingMoney(r.cost) + '</b></span>' +
        profitPart +
        '<small>بنود: ' + escapeHtml(r.count || 0) + '</small>' +
      '</div>';
    }).join("");
  }

  function renderAccountingMaterials() {
    const list = $("accountingMaterialsList");
    if (!list) return;
    const rows = state.accounting.materials || [];
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد خامات. ضياء يضيف خامات الليزر وخامات الطباعة من هنا.</div>';
      return;
    }
    list.innerHTML = rows.slice(0, 40).map(function (r) {
      return '<div class="acc-list-item"><b>' + escapeHtml(r.materialName || r["اسم الخامة"] || "-") + '</b>' +
        '<span>' + escapeHtml(r.department || r["القسم"] || "-") + ' | ' + escapeHtml(r.unit || r["الوحدة"] || "-") + ' | ' + accountingMoney(r.unitCost || r["سعر الوحدة"]) + '</span>' +
        '<small>هالك: ' + escapeHtml(r.wastePercent || r["نسبة الهالك"] || 0) + '%</small></div>';
    }).join("");
  }

  function renderAccountingTemplates() {
    const list = $("accountingTemplatesList");
    if (!list) return;
    const rows = state.accounting.templates || [];
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد بنود ثابتة. أضف رول لامينشن، رولات طباعة 30/50/60، واستهلاك حبر البلوتر.</div>';
      return;
    }
    list.innerHTML = rows.slice(0, 60).map(function (r) {
      return '<div class="acc-list-item"><b>' + escapeHtml(r.itemName || r["اسم البند"] || "-") + '</b>' +
        '<span>' + escapeHtml(r.department || r["القسم"] || "-") + ' | ' + escapeHtml(r.size || r["المقاس"] || "-") + ' | إنتاج: ' + escapeHtml(r.outputCount || r["الناتج"] || "-") + '</span>' +
        '<small>خامة: ' + escapeHtml(r.materialName || r["الخامة"] || "-") + ' | سعر مقترح: ' + accountingMoney(r.salePrice || r["سعر بيع مقترح"]) + '</small></div>';
    }).join("");
  }

  const saveAccountingFinalInvoiceBeforePatch16 = saveAccountingFinalInvoice;

  async function saveAccountingFinalInvoice() {
    const selectedProduct = (($("accFinalProductSelect") || {}).value || "").trim();
    if (selectedProduct) {
      const missing = collectMaterialRequirements(selectedProduct, 1).filter(function (x) { return x.missing; });
      if (missing.length) {
        setMsg("accountingMsg", "لا يمكن تقفيل الفاتورة. في باند ناقص لاستخراج " + selectedProduct + ": " + missing.map(function (m) { return m.materialName + " مطلوب " + m.required + " والمتاح " + m.available; }).join(" / "), true);
        return;
      }
      if ($("accFinalManualDescription") && !$("accFinalManualDescription").value.trim()) $("accFinalManualDescription").value = selectedProduct;
    }
    return saveAccountingFinalInvoiceBeforePatch16();
  }

  function renderAccountingDeptLines() {
    const list = $("accountingDeptLinesList");
    if (!list) return;
    const rows = state.accounting.deptLines || [];
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد فواتير أقسام مسجلة حتى الآن.</div>';
      return;
    }
    list.innerHTML = rows.slice(0, 80).map(function (r) {
      const profit = accountingLineSale(r) - accountingLineCost(r);
      const showProfit = currentAccountingMode() === "full";
      return '<div class="acc-line-card">' +
        '<div><b>' + escapeHtml(r.orderId || r["رقم الأوردر"] || "-") + '</b> <span>' + escapeHtml(r.department || r["القسم"] || "-") + '</span></div>' +
        '<p>' + escapeHtml(r.itemName || r["اسم البند"] || "-") + '</p>' +
        '<small>بيع: ' + accountingMoney(accountingLineSale(r)) + ' | تكلفة: ' + accountingMoney(accountingLineCost(r)) + (showProfit ? (' | ربح: ' + accountingMoney(profit)) : '') + '</small>' +
        '<small>تقفيل: ' + escapeHtml(r.closeStatus || r["حالة التقفيل"] || "مفتوح") + ' | بواسطة: ' + escapeHtml(r.createdBy || r["مسجل بواسطة"] || "-") + '</small>' +
      '</div>';
    }).join("");
  }

  function renderAccountingFinalInvoices() {
    const list = $("accountingFinalInvoicesList");
    if (!list) return;
    const rows = state.accounting.finalInvoices || [];
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد فواتير نهائية مقفلة.</div>';
      return;
    }
    list.innerHTML = rows.slice(0, 40).map(function (r) {
      return '<div class="acc-list-item"><b>' + escapeHtml(r.invoiceNo || r["رقم الفاتورة"] || "-") + '</b>' +
        '<span>أوردر: ' + escapeHtml(r.orderId || r["رقم الأوردر"] || "-") + ' | عميل: ' + escapeHtml(r.customerName || r["اسم العميل"] || "-") + '</span>' +
        '<small>إجمالي: ' + accountingMoney(r.finalTotal || r["الإجمالي النهائي"]) + ' | مدفوع: ' + accountingMoney(r.paid || r["المدفوع"]) + ' | باقي: ' + accountingMoney(r.remaining || r["الباقي"]) + '</small></div>';
    }).join("");
  }

  function syncAccountingMaterialOptions() {
    const select = $("accDeptLineMaterial");
    if (!select) return;
    const dept = ($("accDeptLineDepartment") || {}).value || accountingDepartmentForMode();
    const rows = (state.accounting.materials || []).filter(function (r) {
      const d = text(r.department || r["القسم"]);
      return !dept || d === dept || d === "مشترك" || d === "عام";
    });
    const current = select.value;
    select.innerHTML = '<option value="">بدون خامة محددة</option>' + rows.map(function (r) {
      const name = r.materialName || r["اسم الخامة"] || "";
      return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
    }).join("");
    if (current) select.value = current;
    accountingSmartFillFromMaterial(false);
  }

  async function saveAccountingMaterial() {
    if (!accountingCanManageMaterials()) return;
    const name = (($("accMaterialName") || {}).value || "").trim();
    if (!name) {
      setMsg("accountingMsg", "اكتب اسم الخامة.", true);
      return;
    }
    try {
      const res = await api("saveAccountingMaterial", authParams({
        department: ($("accMaterialDepartment") || {}).value,
        materialName: name,
        unit: ($("accMaterialUnit") || {}).value,
        unitCost: ($("accMaterialUnitCost") || {}).value,
        width: ($("accMaterialWidth") || {}).value,
        height: ($("accMaterialHeight") || {}).value,
        wastePercent: ($("accMaterialWaste") || {}).value,
        notes: ($("accMaterialNotes") || {}).value,
        active: "نعم"
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم حفظ الخامة." : "فشل الحفظ."), !res.success);
      if (res.success) {
        ["accMaterialName", "accMaterialUnitCost", "accMaterialWidth", "accMaterialHeight", "accMaterialWaste", "accMaterialNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        await loadAccountingData(true);
      }
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في حفظ الخامة.", true);
    }
  }

  async function saveAccountingTemplate() {
    if (!accountingCanManageMaterials()) return;
    const itemName = (($("accTemplateItemName") || {}).value || "").trim();
    if (!itemName) {
      setMsg("accountingMsg", "اكتب اسم البند الثابت.", true);
      return;
    }
    try {
      const res = await api("saveAccountingTemplate", authParams({
        department: ($("accTemplateDepartment") || {}).value,
        category: ($("accTemplateCategory") || {}).value,
        itemName: itemName,
        size: ($("accTemplateSize") || {}).value,
        materialName: ($("accTemplateMaterial") || {}).value,
        outputCount: ($("accTemplateOutputCount") || {}).value,
        inkCost: ($("accTemplateInkCost") || {}).value,
        fixedCost: ($("accTemplateFixedCost") || {}).value,
        salePrice: ($("accTemplateSalePrice") || {}).value,
        notes: ($("accTemplateNotes") || {}).value,
        active: "نعم"
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم حفظ البند الثابت." : "فشل الحفظ."), !res.success);
      if (res.success) {
        ["accTemplateItemName", "accTemplateSize", "accTemplateMaterial", "accTemplateOutputCount", "accTemplateInkCost", "accTemplateFixedCost", "accTemplateSalePrice", "accTemplateNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        await loadAccountingData(true);
      }
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في حفظ البند الثابت.", true);
    }
  }

  function accountingSmartReadNumber(id) {
    return numericAmount((($(id) || {}).value) || 0);
  }

  function accountingSmartSetValue(id, value) {
    const el = $(id);
    if (el) el.value = value == null ? "" : String(value);
  }

  function accountingSmartFindMaterial() {
    const name = (($("accDeptLineMaterial") || {}).value || "").trim();
    if (!name) return null;
    return (state.accounting.materials || []).find(function (r) {
      return text(r.materialName || r["اسم الخامة"] || r["الخامة"]) === name;
    }) || null;
  }

  function accountingSmartNormalizeRawHeight(value, unit) {
    value = numericAmount(value);
    unit = text(unit || "auto");
    if (!value) return 0;
    if (unit === "m") return value * 100;
    if (unit === "cm") return value;
    // تلقائي: لو الرقم صغير في خامات الرول غالبًا بالمتر؛ لو كبير يبقى سم.
    if (value <= 300) return value * 100;
    return value;
  }

  function accountingSmartBestPieces(rawW, rawH, itemW, itemH) {
    rawW = numericAmount(rawW); rawH = numericAmount(rawH); itemW = numericAmount(itemW); itemH = numericAmount(itemH);
    if (!rawW || !rawH || !itemW || !itemH) return 0;
    const a = Math.floor(rawW / itemW) * Math.floor(rawH / itemH);
    const b = Math.floor(rawW / itemH) * Math.floor(rawH / itemW);
    return Math.max(a, b, 0);
  }

  function accountingSmartGuessType() {
    const mode = (($("accSmartMode") || {}).value || "auto");
    if (mode !== "auto") return mode;
    const txt = normalizeArabic([
      ($("accDeptLineItemName") || {}).value,
      ($("accDeptLineType") || {}).value,
      ($("accDeptLineMaterial") || {}).value
    ].join(" "));
    if (txt.indexOf("لامنيشن") !== -1 || txt.indexOf("لامنشن") !== -1 || txt.indexOf("لام") !== -1) return "lamination";
    if (txt.indexOf("حبر") !== -1 || txt.indexOf("بلوتر") !== -1 || txt.indexOf("رول") !== -1) return "plotter";
    if (txt.indexOf("ليزر") !== -1 || txt.indexOf("اكريلك") !== -1 || txt.indexOf("خشب") !== -1 || txt.indexOf("دابل") !== -1) return "laser";
    return "paper";
  }

  function accountingSmartFillFromMaterial(force) {
    const mat = accountingSmartFindMaterial();
    if (!mat) return;
    const unitCost = numericAmount(mat.unitCost || mat["سعر الوحدة"]);
    const width = numericAmount(mat.width || mat["عرض الخام"]);
    const height = numericAmount(mat.height || mat["طول الخام"]);
    const waste = numericAmount(mat.wastePercent || mat["نسبة الهالك"]);
    if (force || !accountingSmartReadNumber("accSmartRawCost")) accountingSmartSetValue("accSmartRawCost", unitCost || "");
    if (force || !accountingSmartReadNumber("accSmartRawWidth")) accountingSmartSetValue("accSmartRawWidth", width || "");
    if (force || !accountingSmartReadNumber("accSmartRawHeight")) accountingSmartSetValue("accSmartRawHeight", height || "");
    if (force || !accountingSmartReadNumber("accSmartWaste")) accountingSmartSetValue("accSmartWaste", waste || 10);
  }

  function accountingSmartPresetChanged() {
    const val = (($("accSmartPreset") || {}).value || "").toLowerCase();
    const m = val.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
    if (m) {
      accountingSmartSetValue("accSmartWidth", m[1]);
      accountingSmartSetValue("accSmartHeight", m[2]);
      const item = $("accDeptLineItemName");
      if (item && !item.value.trim()) item.value = "مقاس " + m[1] + "×" + m[2];
    }
    calculateSmartAccountingCost(false);
  }

  function calculateSmartAccountingCost(showMsg) {
    accountingSmartFillFromMaterial(false);
    const itemW = accountingSmartReadNumber("accSmartWidth");
    const itemH = accountingSmartReadNumber("accSmartHeight");
    const qty = Math.max(1, accountingSmartReadNumber("accSmartQty") || numericAmount(($("accDeptLineQty") || {}).value) || 1);
    const wastePercent = accountingSmartReadNumber("accSmartWaste");
    const rawCost = accountingSmartReadNumber("accSmartRawCost");
    const rawW = accountingSmartReadNumber("accSmartRawWidth");
    const rawH = accountingSmartNormalizeRawHeight(accountingSmartReadNumber("accSmartRawHeight"), (($("accSmartRawHeightUnit") || {}).value || "auto"));
    const inkCostM2 = accountingSmartReadNumber("accSmartInkCostM2");
    const labor = accountingSmartReadNumber("accSmartLabor");
    const result = $("accSmartResult");
    const type = accountingSmartGuessType();

    if (!itemW || !itemH || !qty) {
      if (result) result.innerHTML = "اكتب عرض وطول الشغل والكمية أولًا.";
      return null;
    }

    const itemAreaCm = itemW * itemH;
    const totalAreaCm = itemAreaCm * qty * (1 + wastePercent / 100);
    const totalAreaM = totalAreaCm / 10000;
    let piecesPerRaw = accountingSmartBestPieces(rawW, rawH, itemW, itemH);
    let materialQty = 0;
    let materialCost = 0;
    let rawAreaCm = rawW * rawH;

    if (rawCost && rawAreaCm) {
      materialQty = totalAreaCm / rawAreaCm;
      materialCost = rawCost * materialQty;
    } else if (rawCost && piecesPerRaw) {
      materialQty = qty / piecesPerRaw;
      materialCost = rawCost * materialQty;
    }

    const inkCost = inkCostM2 ? totalAreaM * inkCostM2 : 0;
    const totalCost = materialCost + inkCost + labor;

    const labelMap = { lamination: "لامنيشن", paper: "ورق / رولات طباعة", plotter: "بلوتر", laser: "ليزر" };
    const aiLine = "AI اختار نوع الحساب: " + (labelMap[type] || "تلقائي");
    const piecesLine = piecesPerRaw ? ("تقريبًا الخام الواحد يطلع " + piecesPerRaw + " قطعة من المقاس ده.") : "لم يتم حساب عدد القطع لأن بيانات الخام غير كاملة.";
    const msg = [
      "<b>" + escapeHtml(aiLine) + "</b>",
      "المساحة المطلوبة مع الهالك: <b>" + totalAreaM.toFixed(3) + " م²</b>",
      piecesLine,
      "استهلاك الخام: <b>" + materialQty.toFixed(4) + "</b>",
      "تكلفة الخامة: <b>" + accountingMoney(materialCost) + "</b>",
      inkCost ? ("تكلفة الحبر: <b>" + accountingMoney(inkCost) + "</b>") : "تكلفة الحبر: غير محسوبة",
      labor ? ("تكلفة تشغيل إضافية: <b>" + accountingMoney(labor) + "</b>") : "",
      "الإجمالي المقترح للتكلفة: <b>" + accountingMoney(totalCost) + "</b>"
    ].filter(Boolean).join("<br>");

    state.accounting.smartCalc = { materialQty: materialQty, materialCost: materialCost, inkCost: inkCost, labor: labor, totalCost: totalCost, type: type };
    if (result) result.innerHTML = msg;
    return state.accounting.smartCalc;
  }

  function applySmartAccountingCost() {
    const calc = calculateSmartAccountingCost(true);
    if (!calc) return;
    if ($("accDeptLineQty") && $("accSmartQty")) $("accDeptLineQty").value = $("accSmartQty").value || $("accDeptLineQty").value;
    if ($("accDeptLineMaterialQty")) $("accDeptLineMaterialQty").value = calc.materialQty ? calc.materialQty.toFixed(4) : "";
    if ($("accDeptLineMaterialCost")) $("accDeptLineMaterialCost").value = (calc.materialCost + calc.inkCost).toFixed(2);
    if ($("accDeptLineLaborCost") && calc.labor) $("accDeptLineLaborCost").value = calc.labor.toFixed(2);
    setMsg("accountingMsg", "تم تطبيق حساب AI على فاتورة القسم. راجع سعر البيع ثم احفظ فاتورة القسم.", false);
  }

  async function saveAccountingDeptLine() {
    if (!accountingCanEnterDeptLine()) return;
    const orderId = (($("accDeptLineOrderId") || {}).value || "").trim();
    const itemName = (($("accDeptLineItemName") || {}).value || "").trim();
    if (!orderId || !itemName) {
      setMsg("accountingMsg", "رقم الأوردر واسم البند مطلوبين لتسجيل فاتورة القسم.", true);
      return;
    }
    try {
      if (!numericAmount(($("accDeptLineMaterialCost") || {}).value || 0) && $("accSmartWidth") && $("accSmartHeight")) {
        calculateSmartAccountingCost(false);
        if (state.accounting.smartCalc && state.accounting.smartCalc.totalCost > 0) {
          applySmartAccountingCost();
        }
      }
      const res = await api("saveAccountingDeptLine", authParams({
        orderId: orderId,
        lineId: ($("accDeptLineLineId") || {}).value,
        customerName: ($("accDeptLineCustomer") || {}).value,
        department: ($("accDeptLineDepartment") || {}).value,
        itemType: ($("accDeptLineType") || {}).value,
        itemName: itemName,
        qty: ($("accDeptLineQty") || {}).value,
        materialName: ($("accDeptLineMaterial") || {}).value,
        materialQty: ($("accDeptLineMaterialQty") || {}).value,
        materialCost: ($("accDeptLineMaterialCost") || {}).value,
        laborCost: ($("accDeptLineLaborCost") || {}).value,
        otherCost: ($("accDeptLineOtherCost") || {}).value,
        salePrice: ($("accDeptLineSalePrice") || {}).value,
        notes: ($("accDeptLineNotes") || {}).value
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم تسجيل فاتورة القسم." : "فشل الحفظ."), !res.success);
      if (res.success) {
        ["accDeptLineLineId", "accDeptLineItemName", "accDeptLineMaterialQty", "accDeptLineMaterialCost", "accDeptLineLaborCost", "accDeptLineOtherCost", "accDeptLineSalePrice", "accDeptLineNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        await loadAccountingData(true);
      }
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في تسجيل فاتورة القسم.", true);
    }
  }

  function loadAccountingOrderLinesFromLocal() {
    const orderId = (($("accFinalOrderId") || {}).value || "").trim();
    const list = $("accountingOrderLinesList");
    if (!list) return;
    if (!orderId) {
      setMsg("accountingMsg", "اكتب رقم الأوردر الأول لاستدعاء أجزاء وائل وجابر.", true);
      return;
    }
    const rows = (state.accounting.deptLines || []).filter(function (r) {
      return text(r.orderId || r["رقم الأوردر"]) === orderId && text(r.closeStatus || r["حالة التقفيل"] || "مفتوح") !== "تم التقفيل";
    });
    state.accounting.selectedOrderLines = rows;
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد بنود أقسام مفتوحة لهذا الأوردر. يمكن كتابة فاتورة نهائية يدوية.</div>';
      updateAccountingFinalTotals();
      return;
    }
    const customer = rows[0].customerName || rows[0]["اسم العميل"] || "";
    if (($("accFinalCustomer") || {}).value === "") $("accFinalCustomer").value = customer;
    list.innerHTML = rows.map(function (r, i) {
      return '<label class="acc-order-line-check"><input type="checkbox" class="acc-final-line-check" data-i="' + i + '" checked> ' +
        '<span><b>' + escapeHtml(r.department || r["القسم"] || "-") + '</b> - ' + escapeHtml(r.itemName || r["اسم البند"] || "-") + '</span>' +
        '<small>بيع: ' + accountingMoney(accountingLineSale(r)) + ' | تكلفة: ' + accountingMoney(accountingLineCost(r)) + '</small></label>';
    }).join("");
    Array.prototype.forEach.call(list.querySelectorAll(".acc-final-line-check"), function (chk) {
      chk.addEventListener("change", updateAccountingFinalTotals);
    });
    updateAccountingFinalTotals();
  }

  function selectedFinalInvoiceLines() {
    const list = $("accountingOrderLinesList");
    const rows = state.accounting.selectedOrderLines || [];
    if (!list) return [];
    const selected = [];
    Array.prototype.forEach.call(list.querySelectorAll(".acc-final-line-check"), function (chk) {
      if (chk.checked) {
        const i = Number(chk.getAttribute("data-i"));
        if (rows[i]) selected.push(rows[i]);
      }
    });
    return selected;
  }

  function updateAccountingFinalTotals() {
    const selected = selectedFinalInvoiceLines();
    let subtotal = selected.reduce(function (sum, r) { return sum + accountingLineSale(r); }, 0);
    const manualAmount = numericAmount(($("accFinalManualAmount") || {}).value || 0);
    subtotal += manualAmount;
    const discount = numericAmount(($("accFinalDiscount") || {}).value || 0);
    const paid = numericAmount(($("accFinalPaid") || {}).value || 0);
    const finalTotal = Math.max(0, subtotal - discount);
    const remaining = Math.max(0, finalTotal - paid);
    if ($("accFinalSubtotal")) $("accFinalSubtotal").textContent = accountingMoney(subtotal);
    if ($("accFinalTotal")) $("accFinalTotal").textContent = accountingMoney(finalTotal);
    if ($("accFinalRemaining")) $("accFinalRemaining").textContent = accountingMoney(remaining);
  }

  async function saveAccountingFinalInvoice() {
    if (!accountingCanCloseFinalInvoice()) return;
    const orderId = (($("accFinalOrderId") || {}).value || "").trim();
    const customerName = (($("accFinalCustomer") || {}).value || "").trim();
    if (!orderId || !customerName) {
      setMsg("accountingMsg", "رقم الأوردر واسم العميل مطلوبين لتقفيل الفاتورة.", true);
      return;
    }
    const selected = selectedFinalInvoiceLines();
    const lineIds = selected.map(function (r) { return r.id || r.ID || r["ID"] || ""; }).filter(Boolean);
    const subtotal = selected.reduce(function (sum, r) { return sum + accountingLineSale(r); }, 0) + numericAmount(($("accFinalManualAmount") || {}).value || 0);
    const discount = numericAmount(($("accFinalDiscount") || {}).value || 0);
    const paid = numericAmount(($("accFinalPaid") || {}).value || 0);
    const finalTotal = Math.max(0, subtotal - discount);
    const remaining = Math.max(0, finalTotal - paid);
    try {
      const res = await api("saveAccountingFinalInvoice", authParams({
        orderId: orderId,
        customerName: customerName,
        lineIds: JSON.stringify(lineIds),
        manualDescription: ($("accFinalManualDescription") || {}).value,
        manualAmount: ($("accFinalManualAmount") || {}).value,
        subtotal: subtotal,
        discount: discount,
        finalTotal: finalTotal,
        paid: paid,
        remaining: remaining,
        status: ($("accFinalStatus") || {}).value,
        notes: ($("accFinalNotes") || {}).value
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم تقفيل الفاتورة." : "فشل التقفيل."), !res.success);
      if (res.success) {
        ["accFinalManualDescription", "accFinalManualAmount", "accFinalDiscount", "accFinalPaid", "accFinalNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        if ($("accountingOrderLinesList")) $("accountingOrderLinesList").innerHTML = "";
        await loadAccountingData(true);
      }
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في تقفيل الفاتورة.", true);
    }
  }

  function withQuery(url, params) {
    const base = text(url || "").replace(/\/+$/, "");
    const query = new URLSearchParams();
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null) query.set(key, params[key]);
    });
    return base + (base.indexOf("?") === -1 ? "?" : "&") + query.toString();
  }

  function openRemoteFileServer() {
    const base = remoteFileServerUrl();
    if (!base) {
      alert("رابط ملفات مطبعجي غير مضبوط في config.js");
      return;
    }
    if (!employeeCanOpenRemoteFiles()) {
      alert("صلاحية ملفات مطبعجي مفعلة حالياً فقط لحسابات ضياء وجابر ووائل.");
      return;
    }
    const u = state.user || {};
    if (!u.token) {
      alert("انتهت جلسة الموظف. سجل الدخول مرة أخرى ثم افتح ملفات مطبعجي.");
      return;
    }
    const url = withQuery(text(base).replace(/\/+$/, "") + "/trendos-sso", {
      username: u.username || u.name || "",
      token: u.token || ""
    });
    window.open(url, "Matbagy_Remote_Files");
  }

  function customerFastPrintKeys() {
    const c = state.customer || {};
    return [c.customerCode, c.code, c.phone, c.mobile, c.name, c.customerName]
      .map(function (v) { return normalizeArabic(v); })
      .filter(Boolean);
  }

  function customerCanUseFastPrintFolder() {
    const c = state.customer || {};
    const direct = text(c.fastPrintAccess || c.allowFastPrintAccess || c.serverFilesAccess || c.quickPrintAccess || "");
    if (direct === true || direct === "نعم" || direct === "true" || direct === "TRUE" || direct === "1") return true;
    const allowed = Array.isArray(window.MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS) ? window.MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS : [];
    if (!allowed.length) return false;
    const keys = customerFastPrintKeys();
    return allowed.map(function (v) { return normalizeArabic(v); }).some(function (v) {
      return v && keys.indexOf(v) !== -1;
    });
  }

  function updateCustomerFastPrintAccessButton() {
    const btn = $("customerFastPrintFilesBtn");
    if (!btn) return;
    btn.classList.toggle("hidden", !customerCanUseFastPrintFolder());
  }

  function openCustomerFastPrintFiles() {
    if (!customerCanUseFastPrintFolder()) {
      alert("هذه الخدمة غير مفعلة على حسابك. تواصل مع مطبعجي لتفعيل رفع الملفات الجاهزة للطباعة.");
      return;
    }
    const url = fastPrintUploadUrl();
    if (!url) {
      alert("رابط رفع ملفات طباعة ع الطاير غير مضبوط حالياً.");
      return;
    }
    window.open(url, "Matbagy_Fast_Print_Upload");
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
    loadPlatformAds(false);
    loadPlatformSections(false);
    loadFranchiseBranches(false);
    loadMarketplace(false);
    loadWhiteLabelSettings(false);
  }

  function renderCustomerHeader() {
    const c = state.customer || {};
    const title = $("customerWelcomeTitle");
    const meta = $("customerMeta");
    if (state.visitorPreview) {
      if (title) title.textContent = "معاينة واجهة الزائر";
      if (meta) meta.textContent = "هذه معاينة فقط من لوحة ضياء، لا تسجل أوردرات ولا تغير بيانات العملاء.";
      updateCustomerPreviewChrome();
      return;
    }
    if (title) title.textContent = "أهلاً " + (c.name || "عميل مطبعجي");
    if (meta) {
      const branchName = c.branchName || c.franchiseBranchName || c.branchPublicName || "";
      meta.textContent = "كود الشات: " + (c.customerCode || "-") + " | " + (branchName ? ("فرعك: " + branchName + " | ") : "") + "منصة مطبعجي بنها";
    }
    updateCustomerPreviewChrome();
  }


  /*********************** V1854 - نسخة مطابع White Label + سحب أرقام العملاء الآمن ***********************/

  function canManageWhiteLabel() {
    const user = state.user || {};
    const role = safeRole(user.role);
    const username = normalizeArabic(user.username || user.name || "");
    return role === "admin" || username === "ضياء";
  }

  function toggleWhiteLabelDashboard() {
    const card = $("whiteLabelCard");
    if (!card) return;
    const can = canManageWhiteLabel();
    card.classList.toggle("hidden", !can);
    if (can) loadWhiteLabelSettings(true);
  }

  function togglePhoneLeadsDashboard() {
    const card = $("phoneLeadsCard");
    if (!card) return;
    const can = canManageWhiteLabel();
    card.classList.toggle("hidden", !can);
  }

  function applyWhiteLabelBrand(settings) {
    settings = settings || state.whiteLabelSettings || {};
    const platformName = text(settings.platformName || settings.brandName || "").trim();
    const primaryColor = text(settings.primaryColor || "").trim();
    const whatsapp = text(settings.whatsappNumber || "").trim();
    if (platformName) {
      document.title = platformName + " - منصة الطلبات";
      const title = $("brandTitle");
      if (title) title.textContent = platformName;
      const entry = $("entryBrandTitle");
      if (entry) entry.textContent = platformName;
    }
    if (primaryColor) document.documentElement.style.setProperty("--brand", primaryColor);
    if (whatsapp) window.MATBAGY_BRAND_WHATSAPP = whatsapp;
  }

  async function loadWhiteLabelSettings(forAdmin) {
    try {
      const params = forAdmin ? authParams({}) : {};
      const res = await api("getWhiteLabelSettings", params);
      if (!res.success) {
        if (forAdmin) setMsg("whiteLabelStatus", res.message || "تعذر تحميل إعدادات النسخة.", true);
        return;
      }
      state.whiteLabelSettings = res.settings || {};
      applyWhiteLabelBrand(state.whiteLabelSettings);
      if (forAdmin) renderWhiteLabelDashboard();
    } catch (err) {
      if (forAdmin) setMsg("whiteLabelStatus", err.message || "خطأ في تحميل إعدادات النسخة.", true);
    }
  }

  function checkboxValue(id) {
    const el = $(id);
    return el && el.checked ? "نعم" : "لا";
  }

  function setChecked(id, value, defaultChecked) {
    const el = $(id);
    if (!el) return;
    const v = text(value || "");
    el.checked = v ? (v !== "لا") : !!defaultChecked;
  }

  function renderWhiteLabelDashboard() {
    const s = state.whiteLabelSettings || {};
    const set = function (id, value) { const el = $(id); if (el) el.value = value || ""; };
    set("whiteLabelPlatformName", s.platformName || "");
    set("whiteLabelOwnerName", s.ownerName || "");
    set("whiteLabelWhatsapp", s.whatsappNumber || "");
    set("whiteLabelDomain", s.domain || "");
    set("whiteLabelPrimaryColor", s.primaryColor || "#075e54");
    set("whiteLabelLogoUrl", s.logoUrl || "");
    set("whiteLabelNotes", s.notes || "");
    setChecked("whiteFeatureCustomerPortal", s.featureCustomerPortal, true);
    setChecked("whiteFeatureOrderChat", s.featureOrderChat, true);
    setChecked("whiteFeatureDesigner", s.featureDesigner, true);
    setChecked("whiteFeatureMatbagySheets", s.featureMatbagySheets, false);
    setChecked("whiteFeatureAds", s.featureAds, true);
    setChecked("whiteFeatureFranchise", s.featureFranchise, false);
    setChecked("whiteFeatureMarketplace", s.featureMarketplace, false);
    setChecked("whiteFeaturePhoneLeads", s.featurePhoneLeads, false);
    renderWhiteLabelFeatureSummary(s);
  }

  function renderWhiteLabelFeatureSummary(settings) {
    const box = $("whiteLabelSummary");
    if (!box) return;
    settings = settings || state.whiteLabelSettings || {};
    const kept = [];
    const removed = [];
    const pairs = [
      ["بوابة العملاء", settings.featureCustomerPortal, true],
      ["شات الطلبات والملفات", settings.featureOrderChat, true],
      ["المصمم الذكي كخدمة", settings.featureDesigner, true],
      ["لوحة إعلانات العملاء", settings.featureAds, true],
      ["مطبعجي شيتات", settings.featureMatbagySheets, false],
      ["فروع وفرنشايز مطبعجي مصر", settings.featureFranchise, false],
      ["Marketplace الشركاء القومي", settings.featureMarketplace, false],
      ["سحب/تجميع أرقام العملاء", settings.featurePhoneLeads, false]
    ];
    pairs.forEach(function (p) {
      const value = text(p[1] || "");
      const active = value ? value !== "لا" : !!p[2];
      (active ? kept : removed).push(p[0]);
    });
    box.innerHTML = '<div class="white-summary-col"><b>يتساب للمطبعة</b><span>' + kept.map(escapeHtml).join(' - ') + '</span></div>' +
      '<div class="white-summary-col"><b>يتشال/يتقفل عنها</b><span>' + removed.map(escapeHtml).join(' - ') + '</span></div>';
  }

  async function saveWhiteLabelSettings() {
    if (!canManageWhiteLabel()) return;
    const payload = authParams({
      platformName: (($("whiteLabelPlatformName") || {}).value || "").trim(),
      ownerName: (($("whiteLabelOwnerName") || {}).value || "").trim(),
      whatsappNumber: (($("whiteLabelWhatsapp") || {}).value || "").trim(),
      domain: (($("whiteLabelDomain") || {}).value || "").trim(),
      primaryColor: (($("whiteLabelPrimaryColor") || {}).value || "").trim(),
      logoUrl: (($("whiteLabelLogoUrl") || {}).value || "").trim(),
      notes: (($("whiteLabelNotes") || {}).value || "").trim(),
      featureCustomerPortal: checkboxValue("whiteFeatureCustomerPortal"),
      featureOrderChat: checkboxValue("whiteFeatureOrderChat"),
      featureDesigner: checkboxValue("whiteFeatureDesigner"),
      featureMatbagySheets: checkboxValue("whiteFeatureMatbagySheets"),
      featureAds: checkboxValue("whiteFeatureAds"),
      featureFranchise: checkboxValue("whiteFeatureFranchise"),
      featureMarketplace: checkboxValue("whiteFeatureMarketplace"),
      featurePhoneLeads: checkboxValue("whiteFeaturePhoneLeads")
    });
    if (!payload.platformName) {
      setMsg("whiteLabelStatus", "اكتب اسم المنصة أو اسم المطبعة.", true);
      return;
    }
    try {
      setMsg("whiteLabelStatus", "جاري حفظ نسخة المطبعة...", false);
      const res = await apiPost("saveWhiteLabelSettings", payload);
      if (!res.success) {
        setMsg("whiteLabelStatus", res.message || "فشل حفظ إعدادات النسخة.", true);
        return;
      }
      state.whiteLabelSettings = res.settings || payload;
      applyWhiteLabelBrand(state.whiteLabelSettings);
      renderWhiteLabelDashboard();
      setMsg("whiteLabelStatus", res.message || "تم حفظ إعدادات نسخة المطبعة.", false);
    } catch (err) {
      setMsg("whiteLabelStatus", err.message || "خطأ أثناء حفظ إعدادات النسخة.", true);
    }
  }

  async function loadPhoneLeads() {
    if (!canManageWhiteLabel()) return;
    const source = (($("phoneLeadsSource") || {}).value || "customers");
    const optInOnly = (($("phoneLeadsOptInOnly") || {}).checked) ? "نعم" : "لا";
    const btn = $("loadPhoneLeadsBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري التجميع..."; }
    try {
      setMsg("phoneLeadsStatus", "جاري تجميع الأرقام من قاعدة بياناتك فقط...", false);
      const res = await api("getLeadPhoneNumbers", authParams({ source: source, optInOnly: optInOnly }));
      if (!res.success) {
        setMsg("phoneLeadsStatus", res.message || "تعذر تحميل الأرقام.", true);
        return;
      }
      state.leadNumbers = Array.isArray(res.numbers) ? res.numbers : [];
      renderPhoneLeads();
      setMsg("phoneLeadsStatus", "تم تجميع " + state.leadNumbers.length + " رقم صالح. استخدمها فقط لعملاء وافقوا على التواصل.", false);
    } catch (err) {
      setMsg("phoneLeadsStatus", err.message || "خطأ في تجميع الأرقام.", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "تجميع الأرقام"; }
    }
  }

  function renderPhoneLeads() {
    const box = $("phoneLeadsList");
    if (!box) return;
    const rows = state.leadNumbers || [];
    if (!rows.length) {
      box.innerHTML = '<div class="dash-empty">لم يتم تجميع أرقام بعد.</div>';
      return;
    }
    box.innerHTML = rows.slice(0, 300).map(function (r) {
      return '<div class="phone-lead-row"><b>' + escapeHtml(r.phone || "") + '</b><span>' + escapeHtml(r.name || "عميل") + '</span><small>' + escapeHtml(r.source || "") + '</small></div>';
    }).join('') + (rows.length > 300 ? '<div class="dash-empty">تم عرض أول 300 رقم فقط من أصل ' + rows.length + '.</div>' : '');
  }

  function copyPhoneLeads() {
    const rows = state.leadNumbers || [];
    if (!rows.length) { setMsg("phoneLeadsStatus", "لا توجد أرقام لنسخها.", true); return; }
    const body = rows.map(function (r) { return [r.phone || "", r.name || "", r.source || ""].join("\t"); }).join("\n");
    navigator.clipboard.writeText(body).then(function () {
      setMsg("phoneLeadsStatus", "تم نسخ الأرقام. استخدمها في تواصل مسموح فقط.", false);
    }).catch(function () {
      setMsg("phoneLeadsStatus", "تعذر النسخ من المتصفح.", true);
    });
  }


  function copyCustomerInviteLinks() {
    const rows = state.leadNumbers || [];
    if (!rows.length) { setMsg("phoneLeadsStatus", "اجمع الأرقام أولًا قبل إنشاء الدعوات.", true); return; }
    const portalLink = location.origin + location.pathname + "?v=1856";
    const lines = rows.map(function (r) {
      const phone = r.phone || "";
      const name = r.name || "عميل مطبعجي";
      return phone + "\t" + name + "\t" + "أهلاً " + name + "، تم تجهيز دخولك على منصة مطبعجي. افتح الرابط وادخل بكود الشات/رقمك لمتابعة طلباتك: " + portalLink;
    }).join("\n");
    navigator.clipboard.writeText(lines).then(function () {
      setMsg("phoneLeadsStatus", "تم نسخ دعوات المنصة. استخدمها فقط لعملاء مطبعجي أو المصرح لهم بالتواصل.", false);
    }).catch(function () {
      setMsg("phoneLeadsStatus", "تعذر نسخ دعوات المنصة.", true);
    });
  }

  function downloadPhoneLeadsCsv() {
    const rows = state.leadNumbers || [];
    if (!rows.length) { setMsg("phoneLeadsStatus", "لا توجد أرقام للتصدير.", true); return; }
    const header = ["phone", "name", "source"];
    const csv = [header.join(",")].concat(rows.map(function (r) {
      return [r.phone || "", r.name || "", r.source || ""].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(",");
    })).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matbagy_customer_numbers.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }




  /*********************** V1855 - تنظيم لوحة الإدارة وربط الخدمات بالمطابع ***********************/

  const ADMIN_AREAS = [
    { id: "matbagy", label: "شغل مطبعجي", hint: "الأوردرات والخدمات اليومية." },
    { id: "rahma", label: "رحمة / خدمة العملاء", hint: "إضافة العملاء، استقبال الأوردرات، ودعوات العملاء." },
    { id: "franchise", label: "الفرنشايز", hint: "الفروع والشركاء ونسب مطبعجي." },
    { id: "marketplace", label: "ماركت بليس", hint: "مساحات وبائعين ومنتجات تحت مظلة مطبعجي." },
    { id: "members", label: "الأعضاء والنسخ", hint: "نسخ المطابع والأرقام والعملاء." },
    { id: "responses", label: "نوت مطبعجي", hint: "ملاحظات ومعرفة واتس AI وقواعد الردود." },
    { id: "ads", label: "الإعلانات", hint: "إعلانات العملاء وتظبيط الصور." }
  ];

  const ADMIN_CARD_AREAS = {
    managementDashboard: "matbagy",
    platformSectionsCard: "matbagy",
    serviceRoutesCard: "matbagy",
    addOrderCard: "rahma",
    addCustomerCard: "rahma",
    phoneLeadsCard: "rahma",
    franchiseBranchesCard: "franchise",
    marketplaceCard: "marketplace",
    whiteLabelCard: "members",
    aiKnowledgeCard: "responses",
    platformAdsCard: "ads"
  };

  function canSeeAdminWorkspace() {
    const user = state.user || {};
    const role = safeRole(user.role);
    return role === "admin" || role === "service" || isDiaaUser(user) || isRahmaUser(user);
  }

  function setupAdminWorkspace() {
    const hub = $("adminWorkspaceHub");
    const list = $("adminWorkspaceTabs");
    if (!hub || !list) return;
    const show = canSeeAdminWorkspace();
    hub.classList.toggle("hidden", !show);
    if (!show) return;
    const areas = isRahmaRestrictedUser() ? ADMIN_AREAS.filter(function (area) { return area.id === "rahma"; }) : ADMIN_AREAS.slice();
    if (!areas.some(function (area) { return area.id === state.adminArea; })) {
      state.adminArea = areas.length ? areas[0].id : "matbagy";
    }
    list.innerHTML = areas.map(function (area) {
      return '<button type="button" class="admin-tab-btn ' + (state.adminArea === area.id ? 'active' : '') + '" data-admin-area="' + area.id + '">' +
        '<b>' + escapeHtml(area.label) + '</b><small>' + escapeHtml(area.hint) + '</small></button>';
    }).join("");
    Array.prototype.slice.call(list.querySelectorAll("button[data-admin-area]")).forEach(function (btn) {
      btn.onclick = function () {
        state.adminArea = btn.getAttribute("data-admin-area") || "matbagy";
        setupAdminWorkspace();
        applyAdminWorkspaceTab();
      };
    });
    applyAdminWorkspaceTab();
  }

  function applyAdminWorkspaceTab() {
    if (!canSeeAdminWorkspace()) return;
    Object.keys(ADMIN_CARD_AREAS).forEach(function (id) {
      const card = $(id);
      if (!card) return;
      if (isRahmaRestrictedUser()) {
        const rahmaAllowedCards = ["managementDashboard", "addOrderCard", "addCustomerCard"];
        card.classList.toggle("admin-area-off", rahmaAllowedCards.indexOf(id) === -1);
        return;
      }
      // Patch 09: إضافة الأوردر وتكويد العميل لا يختفوا مع تنقل تاب الإدارة.
      // ظهورهم الفعلي يفضل تحت تحكم toggleAddOrder/toggleAddCustomer حسب الصلاحية.
      if (id === "addOrderCard" || id === "addCustomerCard") {
        card.classList.remove("admin-area-off");
        return;
      }
      const area = ADMIN_CARD_AREAS[id];
      card.classList.toggle("admin-area-off", area !== state.adminArea);
    });
  }

  function helpIcon(textValue) {
    return '<span class="help-dot" title="' + escapeHtml(textValue) + '">؟</span>';
  }

  function canManageServiceRoutes() {
    const user = state.user || {};
    const role = safeRole(user.role);
    if (isRahmaRestrictedUser(user)) return false;
    return role === "admin" || isDiaaUser(user);
  }

  function toggleServiceRoutesDashboard() {
    const card = $("serviceRoutesCard");
    if (!card) return;
    const can = canManageServiceRoutes();
    card.classList.toggle("hidden", !can);
    if (can) loadServiceRoutes(true);
  }

  async function loadServiceRoutes(forAdmin) {
    try {
      const res = await api("getServiceProviderRoutes", authParams({ includeInactive: "نعم" }));
      if (!res.success) {
        if (forAdmin) setMsg("serviceRoutesStatus", res.message || "تعذر تحميل ربط الخدمات.", true);
        return;
      }
      state.serviceRoutes = Array.isArray(res.routes) ? res.routes : [];
      renderServiceRoutesDashboard();
      refreshServiceRouteSelectors();
    } catch (err) {
      if (forAdmin) setMsg("serviceRoutesStatus", err.message || "خطأ في تحميل ربط الخدمات.", true);
    }
  }

  function refreshServiceRouteSelectors() {
    const serviceSel = $("routeServiceSelect");
    if (serviceSel) {
      const old = serviceSel.value || "";
      const sections = state.platformSections || [];
      serviceSel.innerHTML = '<option value="">اكتب الخدمة يدويًا</option>' + sections.map(function (sec) {
        const code = escapeHtml(sec.sectionCode || sec.name || "");
        return '<option value="' + code + '">' + escapeHtml(sec.name || sec.sectionCode || "خدمة") + '</option>';
      }).join("");
      if (old) serviceSel.value = old;
    }
    const branchSel = $("routeBranchCode");
    if (branchSel) {
      const old = branchSel.value || "";
      const branches = state.franchiseBranches || [];
      branchSel.innerHTML = '<option value="">بدون فرع محدد</option>' + branches.map(function (b) {
        const code = escapeHtml(b.branchCode || "");
        return '<option value="' + code + '">' + escapeHtml(branchOptionLabel(b)) + '</option>';
      }).join("");
      if (old) branchSel.value = old;
    }
  }

  function selectedRouteServiceName() {
    const manual = (($("routeServiceName") || {}).value || "").trim();
    if (manual) return manual;
    const sel = $("routeServiceSelect");
    if (!sel || !sel.value) return "";
    const sec = (state.platformSections || []).find(function (x) { return text(x.sectionCode || x.name) === text(sel.value); });
    return sec ? (sec.name || sel.value) : sel.value;
  }

  function fillServiceRouteForm(route) {
    if (!route) return;
    const set = function (id, v) { const el = $(id); if (el) el.value = v == null ? "" : v; };
    set("routeCode", route.routeCode || "");
    set("routeServiceSelect", route.serviceCode || "");
    set("routeServiceName", route.serviceName || "");
    set("routeServiceType", route.serviceType || "طباعة");
    set("routeChannel", route.channelType || "رقم مطبعة");
    set("routeProviderName", route.providerName || "");
    set("routeWhatsapp", route.whatsappNumber || "");
    set("routeBranchCode", route.branchCode || "");
    set("routeUnit", route.unit || "قطعة");
    set("routeBillingMode", route.billingMode || "نسبة على الوحدة");
    set("routeCommissionValue", route.commissionValue || "");
    set("routeMonthlySubscription", route.monthlySubscription || "");
    set("routeSubscriptionFrom", route.subscriptionFrom || "");
    set("routeSubscriptionTo", route.subscriptionTo || "");
    set("routeActive", route.active || "نعم");
    set("routeNotes", route.notes || "");
    setMsg("serviceRoutesStatus", "تم تحميل الربط للتعديل. عدّل ثم اضغط حفظ.", false);
  }

  function renderServiceRoutesDashboard() {
    const list = $("serviceRoutesList");
    if (!list) return;
    const routes = state.serviceRoutes || [];
    if (!routes.length) {
      list.innerHTML = '<div class="dash-empty">لا يوجد ربط خدمات حتى الآن. ابدأ بربط Banner أو DTF برقم مطبعة أو فرع.</div>';
      return;
    }
    list.innerHTML = routes.map(function (r, idx) {
      return '<div class="service-route-item">' +
        '<div><b>' + escapeHtml(r.serviceName || "خدمة") + '</b>' +
        '<span>' + escapeHtml(r.channelType || "") + ' — ' + escapeHtml(r.providerName || r.branchName || "") + '</span>' +
        '<small>وحدة: ' + escapeHtml(r.unit || "قطعة") + ' | محاسبة: ' + escapeHtml(r.billingMode || "") + ' | قيمة مطبعجي: ' + escapeHtml(r.commissionValue || r.monthlySubscription || "-") + '</small>' +
        '<small>اشتراك: ' + escapeHtml(r.subscriptionFrom || "-") + ' → ' + escapeHtml(r.subscriptionTo || "-") + ' | مفعل: ' + escapeHtml(r.active || "نعم") + '</small></div>' +
        '<button type="button" class="ghost small" data-route-index="' + idx + '">تعديل</button>' +
      '</div>';
    }).join("");
    Array.prototype.slice.call(list.querySelectorAll("button[data-route-index]")).forEach(function (btn) {
      btn.onclick = function () {
        const idx = Number(btn.getAttribute("data-route-index"));
        fillServiceRouteForm((state.serviceRoutes || [])[idx]);
      };
    });
  }

  async function saveServiceRoute() {
    if (!canManageServiceRoutes()) return;
    const serviceName = selectedRouteServiceName();
    const providerName = (($("routeProviderName") || {}).value || "").trim();
    const whatsapp = (($("routeWhatsapp") || {}).value || "").trim();
    const branchCode = (($("routeBranchCode") || {}).value || "").trim();
    if (!serviceName) { setMsg("serviceRoutesStatus", "اختار أو اكتب اسم الخدمة.", true); return; }
    if (!providerName && !whatsapp && !branchCode) { setMsg("serviceRoutesStatus", "اكتب رقم مطبعة أو اختار فرع أو اكتب اسم مسؤول مثل رحمة.", true); return; }
    const branch = (state.franchiseBranches || []).find(function (b) { return text(b.branchCode) === branchCode; });
    const payload = authParams({
      routeCode: (($("routeCode") || {}).value || "").trim(),
      serviceCode: (($("routeServiceSelect") || {}).value || "").trim(),
      serviceName: serviceName,
      serviceType: (($("routeServiceType") || {}).value || "طباعة"),
      channelType: (($("routeChannel") || {}).value || "رقم مطبعة"),
      providerName: providerName,
      whatsappNumber: whatsapp,
      branchCode: branchCode,
      branchName: branch ? branchOptionLabel(branch) : "",
      unit: (($("routeUnit") || {}).value || "قطعة"),
      billingMode: (($("routeBillingMode") || {}).value || "نسبة على الوحدة"),
      commissionValue: (($("routeCommissionValue") || {}).value || ""),
      monthlySubscription: (($("routeMonthlySubscription") || {}).value || ""),
      subscriptionFrom: (($("routeSubscriptionFrom") || {}).value || ""),
      subscriptionTo: (($("routeSubscriptionTo") || {}).value || ""),
      active: (($("routeActive") || {}).value || "نعم"),
      notes: (($("routeNotes") || {}).value || "")
    });
    const btn = $("saveServiceRouteBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري الحفظ..."; }
    setMsg("serviceRoutesStatus", "جاري حفظ ربط الخدمة...", false);
    try {
      const res = await apiPost("saveServiceProviderRoute", payload);
      if (!res.success) throw new Error(res.message || "تعذر حفظ ربط الخدمة.");
      ["routeCode", "routeServiceName", "routeProviderName", "routeWhatsapp", "routeCommissionValue", "routeMonthlySubscription", "routeSubscriptionFrom", "routeSubscriptionTo", "routeNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
      setMsg("serviceRoutesStatus", res.message || "تم حفظ ربط الخدمة.", false);
      await loadServiceRoutes(true);
    } catch (err) {
      setMsg("serviceRoutesStatus", err.message || "خطأ أثناء حفظ ربط الخدمة.", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "حفظ ربط الخدمة"; }
    }
  }

  /*********************** أقسام المنصة V1851 ***********************/

  function canManagePlatformSections() {
    const user = state.user || {};
    const role = safeRole(user.role);
    const username = normalizeArabic(user.username || user.name || "");
    return role === "admin" || username === "ضياء";
  }

  function togglePlatformSectionsDashboard() {
    const card = $("platformSectionsCard");
    if (!card) return;
    const can = canManagePlatformSections();
    card.classList.toggle("hidden", !can);
    if (can) loadPlatformSections(true);
  }

  function platformSectionImageUrl(section, size) {
    if (!section) return "";
    if (section.thumbnailUrl) return text(section.thumbnailUrl);
    const fileId = text(section.fileId || "");
    if (fileId) return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(fileId) + "&sz=w" + (size || 900);
    return text(section.imageUrl || section.fileUrl || "");
  }

  async function loadPlatformSections(forAdmin) {
    try {
      const params = forAdmin ? authParams({ includeInactive: "نعم" }) : { activeOnly: "نعم" };
      const res = await api("getPlatformSections", params);
      if (!res.success) {
        if (forAdmin) setMsg("platformSectionsStatus", res.message || "تعذر تحميل أقسام المنصة.", true);
        return;
      }
      state.platformSections = Array.isArray(res.sections) ? res.sections : [];
      refreshServiceRouteSelectors();
      if (forAdmin) renderPlatformSectionsDashboard();
      else renderCustomerPlatformSections();
    } catch (err) {
      if (forAdmin) setMsg("platformSectionsStatus", err.message || "خطأ في تحميل أقسام المنصة.", true);
    }
  }

  function renderPlatformSectionsDashboard() {
    const list = $("platformSectionsList");
    if (!list) return;
    const sections = state.platformSections || [];
    if (!sections.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد أقسام منصة حتى الآن. أضف DTF أو Banner أو UV من النموذج بالأعلى.</div>';
      return;
    }
    list.innerHTML = sections.map(function (sec) {
      const img = escapeHtml(platformSectionImageUrl(sec, 360));
      const active = text(sec.active || "نعم");
      return '<div class="platform-section-admin-item">' +
        (img ? '<img src="' + img + '" alt="' + escapeHtml(sec.name || "قسم") + '" loading="lazy">' : '<div class="section-empty-icon">🖨️</div>') +
        '<div><b>' + escapeHtml(sec.name || "قسم") + '</b>' +
        '<span>' + escapeHtml(sec.description || "") + '</span>' +
        '<small>نوع التنفيذ: ' + escapeHtml(sec.executionType || "وسيط") + ' | مفعل: ' + escapeHtml(active) + ' | ترتيب: ' + escapeHtml(sec.sortOrder || "") + '</small>' +
        (sec.designPrice ? '<small>خدمة المصمم الذكي: ' + escapeHtml(sec.designPrice) + ' ج</small>' : '') +
        '</div></div>';
    }).join("");
  }

  function renderCustomerPlatformSections() {
    const wrap = $("customerPlatformSections");
    if (!wrap) return;
    const sections = (state.platformSections || []).filter(function (sec) { return text(sec.active || "نعم") !== "لا"; });
    if (!sections.length) {
      wrap.innerHTML = '<div class="hint">أقسام الخدمات قيد التجهيز.</div>';
      return;
    }
    wrap.innerHTML = sections.map(function (sec) {
      const img = escapeHtml(platformSectionImageUrl(sec, 600));
      return '<button type="button" class="platform-section-card" data-section-code="' + escapeHtml(sec.sectionCode || "") + '">' +
        (img ? '<img src="' + img + '" alt="' + escapeHtml(sec.name || "قسم") + '" loading="lazy">' : '<div class="platform-section-fallback">🖨️</div>') +
        '<b>' + escapeHtml(sec.name || "قسم") + '</b>' +
        '<span>' + escapeHtml(sec.description || "اسأل عن السعر وابعت الملفات من شات الخدمة.") + '</span>' +
      '</button>';
    }).join("");

    Array.prototype.forEach.call(wrap.querySelectorAll(".platform-section-card"), function (btn) {
      btn.onclick = function () {
        const code = btn.getAttribute("data-section-code");
        const section = (state.platformSections || []).find(function (x) { return text(x.sectionCode) === text(code); });
        openCustomerPlatformSection(section);
      };
    });
  }

  function applyCustomerSelectedSectionToComposer() {
    const dep = $("customerOrderDepartment");
    const item = $("customerOrderItem");
    const section = state.customerSelectedSection;
    if (!dep) return;

    if (section && section.name) {
      const name = text(section.name);
      let found = false;
      Array.prototype.forEach.call(dep.options, function (opt) { if (opt.value === name || opt.textContent === name) found = true; });
      if (!found) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        dep.appendChild(opt);
      }
      dep.value = name;
      dep.disabled = true;
      if (item) item.placeholder = "اكتب طلبك في " + name + ": المقاس / الكمية / الخامة / أي تفاصيل";
    } else {
      dep.disabled = false;
      const allowed = ["طباعة", "ليزر"];
      Array.prototype.slice.call(dep.options).forEach(function (opt) {
        if (allowed.indexOf(opt.value || opt.textContent) === -1) opt.remove();
      });
      if (item) item.placeholder = "اكتب نوع الشغل: تابلوه 30×40 / مج / قص ليزر";
    }
  }

  function openCustomerPlatformSection(section) {
    if (!section) return;
    state.customerSelectedSection = section;
    state.customerViewMode = "newOrder";
    resetCustomerDraft();
    renderCustomerHome();
    applyCustomerSelectedSectionToComposer();
    renderCustomerDraft();
  }

  async function savePlatformSection() {
    if (!canManagePlatformSections()) return;
    const name = (($("platformSectionName") || {}).value || "").trim();
    if (!name) {
      setMsg("platformSectionsStatus", "اكتب اسم القسم أولًا.", true);
      return;
    }
    const fileInput = $("platformSectionImage");
    const file = fileInput && fileInput.files && fileInput.files[0];
    const payload = authParams({
      sectionCode: (($("platformSectionCode") || {}).value || "").trim(),
      name: name,
      description: (($("platformSectionDescription") || {}).value || "").trim(),
      sectionType: (($("platformSectionType") || {}).value || "طباعة"),
      executionType: (($("platformSectionExecution") || {}).value || "وسيط"),
      active: (($("platformSectionActive") || {}).value || "نعم"),
      sortOrder: (($("platformSectionSort") || {}).value || ""),
      supplierName: (($("platformSectionSupplier") || {}).value || ""),
      supplierWhatsapp: (($("platformSectionWhatsapp") || {}).value || ""),
      designPrice: (($("platformSectionDesignPrice") || {}).value || "10"),
      notes: (($("platformSectionNotes") || {}).value || "")
    });

    const btn = $("savePlatformSectionBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري الحفظ..."; }
    setMsg("platformSectionsStatus", "جاري حفظ القسم...", false);
    try {
      if (file) {
        if (!/^image\//i.test(file.type || "")) throw new Error("صورة القسم يجب أن تكون ملف صورة.");
        payload.fileName = file.name;
        payload.mimeType = file.type || "image/png";
        payload.size = file.size || 0;
        payload.base64 = await fileToBase64(file);
      }
      const res = await apiPost("savePlatformSection", payload);
      if (!res.success) throw new Error(res.message || "تعذر حفظ القسم.");
      ["platformSectionCode", "platformSectionName", "platformSectionDescription", "platformSectionSupplier", "platformSectionWhatsapp", "platformSectionNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
      if ($("platformSectionSort")) $("platformSectionSort").value = "";
      if ($("platformSectionDesignPrice")) $("platformSectionDesignPrice").value = "10";
      if (fileInput) fileInput.value = "";
      setMsg("platformSectionsStatus", "تم حفظ القسم وظهوره للعملاء.", false);
      await loadPlatformSections(true);
    } catch (err) {
      setMsg("platformSectionsStatus", err.message || "خطأ أثناء حفظ القسم.", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "حفظ القسم"; }
    }
  }

  function attachDesignOfferHandlers() {
    Array.prototype.forEach.call(document.querySelectorAll(".design-offer-yes"), function (btn) {
      btn.onclick = function () { addSmartDesignerService(); };
    });
    Array.prototype.forEach.call(document.querySelectorAll(".design-offer-no"), function (btn) {
      btn.onclick = function () {
        state.customerDesignOfferItemId = "";
        setMsg("customerOrderMsg", "تمام، اعتبرنا الملف جاهز للتنفيذ بدون خدمة تصميم.", false);
        renderCustomerDraft();
      };
    });
  }

  function latestItemWithFilesForDesignOffer() {
    const draft = state.customerDraft;
    if (!draft || draft.submitted || !draft.items || !draft.items.length) return null;
    for (let i = draft.items.length - 1; i >= 0; i--) {
      const item = draft.items[i];
      if (item && item.itemName !== "خدمة المصمم الذكي" && item.files && item.files.length) return item;
    }
    return null;
  }

  function addSmartDesignerService() {
    const draft = ensureCustomerDraftStarted();
    const section = state.customerSelectedSection || {};
    const price = Number(section.designPrice || 10) || 10;
    draft.items.push({
      itemId: "DESIGN-" + Date.now(),
      department: "تصميم",
      itemName: "خدمة المصمم الذكي",
      qty: "1",
      notes: "مساعدة في تجهيز التصميم للطباعة - تكلفة مقترحة: " + price + " ج",
      heatPress: "لا",
      flyPrint: "لا",
      files: []
    });
    state.customerDesignOfferItemId = "";
    renderCustomerDraft();
    setMsg("customerOrderMsg", "تم إضافة خدمة المصمم الذكي للمسودة بسعر " + price + " ج. اكتب تفاصيل التصميم في الرسالة التالية.", false);
  }




  /*********************** مطبعجي مصر - الفروع والفرنشايز V1852 ***********************/

  function canManageFranchiseBranches() {
    const user = state.user || {};
    const role = safeRole(user.role);
    const username = normalizeArabic(user.username || user.name || "");
    return role === "admin" || username === "ضياء";
  }

  function toggleFranchiseBranchesDashboard() {
    const card = $("franchiseBranchesCard");
    if (!card) return;
    const can = canManageFranchiseBranches();
    card.classList.toggle("hidden", !can);
    if (can) loadFranchiseBranches(true);
  }

  async function loadFranchiseBranches(forAdmin) {
    try {
      const params = forAdmin ? authParams({ includeInactive: "نعم" }) : { activeOnly: "نعم", publicOnly: "نعم" };
      const res = await api("getFranchiseBranches", params);
      if (!res.success) {
        if (forAdmin) setMsg("franchiseBranchesStatus", res.message || "تعذر تحميل فروع مطبعجي.", true);
        return;
      }
      state.franchiseBranches = Array.isArray(res.branches) ? res.branches : [];
      refreshFranchiseBranchSelects();
      if (forAdmin) renderFranchiseBranchesDashboard();
      else renderCustomerFranchiseBranches();
    } catch (err) {
      if (forAdmin) setMsg("franchiseBranchesStatus", err.message || "خطأ في تحميل فروع مطبعجي.", true);
    }
  }

  function branchPublicName(branch) {
    const area = text(branch && (branch.publicArea || branch.city || branch.governorate) || "مصر");
    return "فرع مطبعجي - " + area;
  }

  function branchIsPublic(branch) {
    const visibility = text(branch.customerVisibility || "ظاهر كفرع مطبعجي");
    const active = text(branch.active || "نعم") !== "لا";
    const role = text(branch.branchRole || "");
    return active && visibility !== "مخفي" && role !== "شريك تنفيذ مخفي";
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    const a = Number(lat1), b = Number(lon1), c = Number(lat2), d = Number(lon2);
    if ([a, b, c, d].some(function (x) { return isNaN(x); })) return null;
    const R = 6371;
    const toRad = function (x) { return x * Math.PI / 180; };
    const dLat = toRad(c - a);
    const dLon = toRad(d - b);
    const q = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
  }

  function decorateBranchesWithDistance(branches) {
    const loc = state.customerLocation;
    return (branches || []).map(function (b) {
      const copy = Object.assign({}, b);
      if (loc) copy.distanceKm = distanceKm(loc.lat, loc.lng, b.latitude, b.longitude);
      return copy;
    }).sort(function (a, b) {
      const da = a.distanceKm == null ? 999999 : a.distanceKm;
      const db = b.distanceKm == null ? 999999 : b.distanceKm;
      return da - db || String(a.publicArea || a.city || "").localeCompare(String(b.publicArea || b.city || ""));
    });
  }

  function branchOptionLabel(branch) {
    if (!branch) return "";
    return (branch.brandName || branchPublicName(branch) || branch.branchCode || "فرع مطبعجي") + (branch.branchCode ? " — " + branch.branchCode : "");
  }

  function refreshFranchiseBranchSelects() {
    const branches = state.franchiseBranches || [];
    ["newClientBranch", "assignCustomerBranchSelect"].forEach(function (id) {
      const sel = $(id);
      if (!sel) return;
      const oldValue = sel.value || "";
      const first = id === "newClientBranch" ? '<option value="">بدون فرع محدد</option>' : '<option value="">اختر فرع مطبعجي</option>';
      sel.innerHTML = first + branches.map(function (b) {
        const code = escapeHtml(b.branchCode || "");
        return '<option value="' + code + '">' + escapeHtml(branchOptionLabel(b)) + '</option>';
      }).join("");
      if (oldValue) sel.value = oldValue;
    });
  }

  function fillFranchiseBranchForm(branch) {
    if (!branch) return;
    const set = function (id, value) { const el = $(id); if (el) el.value = value == null ? "" : value; };
    set("franchiseBranchCode", branch.branchCode || "");
    set("franchiseBrandName", branch.brandName || "");
    set("franchisePartnerName", branch.partnerName || "");
    set("franchiseGovernorate", branch.governorate || "");
    set("franchiseCity", branch.city || "");
    set("franchisePublicArea", branch.publicArea || "");
    set("franchiseLat", branch.latitude || "");
    set("franchiseLng", branch.longitude || "");
    set("franchiseRole", branch.branchRole || "فرنشايز كامل");
    set("franchiseVisibility", branch.customerVisibility || "ظاهر كفرع مطبعجي");
    set("franchiseActive", branch.active || "نعم");
    set("franchiseCommission", branch.commissionRate || "15");
    set("franchiseMonthly", branch.monthlySubscription || "");
    if ($("franchiseCanReceive")) $("franchiseCanReceive").checked = text(branch.canReceiveOrders || "نعم") !== "لا";
    if ($("franchiseCanExecute")) $("franchiseCanExecute").checked = text(branch.canExecute || "نعم") !== "لا";
    if ($("franchiseCanDeliver")) $("franchiseCanDeliver").checked = text(branch.canDeliver || "نعم") !== "لا";
    set("franchisePublicDescription", branch.publicDescription || "");
    set("franchiseNotes", branch.internalNotes || "");
    setMsg("franchiseBranchesStatus", "تم تحميل بيانات الفرع للتعديل. عدّل ثم اضغط حفظ.", false);
    const form = document.querySelector(".franchise-branch-form");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderFranchiseBranchesDashboard() {
    const list = $("franchiseBranchesList");
    if (!list) return;
    const branches = state.franchiseBranches || [];
    refreshFranchiseBranchSelects();
    if (!branches.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد فروع أو فرنشايز حتى الآن. أضف أول فرع مطبعجي من النموذج بالأعلى.</div>';
      return;
    }
    list.innerHTML = branches.map(function (b) {
      return '<div class="franchise-admin-item" data-branch-code="' + escapeHtml(b.branchCode || "") + '">' +
        '<div class="franchise-badge">م</div>' +
        '<div class="franchise-admin-main"><b>' + escapeHtml(b.brandName || b.partnerName || "فرع مطبعجي") + '</b>' +
        '<span>' + escapeHtml((b.governorate || "") + " - " + (b.city || "") + " - " + (b.publicArea || "")) + '</span>' +
        '<small>الكود: ' + escapeHtml(b.branchCode || "-") + ' | الدور: ' + escapeHtml(b.branchRole || "فرنشايز كامل") + ' | ظهور العميل: ' + escapeHtml(b.customerVisibility || "ظاهر كفرع مطبعجي") + ' | مفعل: ' + escapeHtml(b.active || "نعم") + '</small>' +
        '<small>نسبة مطبعجي: ' + escapeHtml(b.commissionRate || "") + '% | اشتراك شهري: ' + escapeHtml(b.monthlySubscription || "") + ' | GPS: ' + escapeHtml(b.latitude || "-") + ', ' + escapeHtml(b.longitude || "-") + '</small></div>' +
        '<div class="franchise-admin-actions"><button type="button" class="ghost edit-franchise-branch" data-branch-code="' + escapeHtml(b.branchCode || "") + '">تعديل</button></div>' +
        '</div>';
    }).join("");
    Array.prototype.forEach.call(list.querySelectorAll(".edit-franchise-branch"), function (btn) {
      btn.onclick = function () {
        const code = btn.getAttribute("data-branch-code");
        const branch = (state.franchiseBranches || []).find(function (x) { return text(x.branchCode) === text(code); });
        fillFranchiseBranchForm(branch);
      };
    });
  }

  function renderCustomerFranchiseBranches() {
    const wrap = $("customerFranchiseBranches");
    if (!wrap) return;
    const branches = decorateBranchesWithDistance((state.franchiseBranches || []).filter(branchIsPublic));
    if (!branches.length) {
      wrap.innerHTML = '<div class="hint">فروع مطبعجي المعتمدة قيد التجهيز في منطقتك. يمكنك إرسال الطلب لمطبعجي ليتم توزيعه داخليًا.</div>';
      return;
    }
    wrap.innerHTML = branches.slice(0, 6).map(function (b) {
      const distance = b.distanceKm == null ? "" : '<small>يبعد تقريبًا ' + escapeHtml(b.distanceKm.toFixed(1)) + ' كم</small>';
      return '<button type="button" class="franchise-branch-card" data-branch-code="' + escapeHtml(b.branchCode || "") + '">' +
        '<div class="franchise-card-top"><span>واجهة مطبعجي</span><b>' + escapeHtml(branchPublicName(b)) + '</b></div>' +
        '<p>' + escapeHtml(b.publicDescription || "استلام وتسليم ومتابعة من خلال مطبعجي.") + '</p>' +
        distance +
        '<em>' + escapeHtml(b.branchRole || "فرنشايز كامل") + '</em>' +
      '</button>';
    }).join("");

    Array.prototype.forEach.call(wrap.querySelectorAll(".franchise-branch-card"), function (btn) {
      btn.onclick = function () {
        const code = btn.getAttribute("data-branch-code");
        const branch = (state.franchiseBranches || []).find(function (x) { return text(x.branchCode) === text(code); });
        selectCustomerFranchise(branch);
      };
    });
  }

  function requestCustomerGps() {
    const status = $("customerFranchiseStatus");
    if (!navigator.geolocation) {
      if (status) status.textContent = "المتصفح لا يدعم تحديد الموقع. اكتب عنوانك داخل الطلب.";
      return;
    }
    if (status) status.textContent = "جاري تحديد موقعك...";
    navigator.geolocation.getCurrentPosition(function (pos) {
      state.customerLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (status) status.textContent = "تم تحديد موقعك. تم ترتيب فروع مطبعجي حسب الأقرب.";
      renderCustomerFranchiseBranches();
    }, function () {
      if (status) status.textContent = "لم يتم السماح بالموقع. يمكنك إرسال الطلب لمطبعجي وسيتم توزيع التنفيذ داخليًا.";
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  }

  function selectCustomerFranchise(branch) {
    state.customerSelectedFranchise = branch || null;
    state.customerSelectedSection = null;
    state.customerViewMode = "newOrder";
    if (!state.customerDraft || state.customerDraft.submitted) resetCustomerDraft();
    renderCustomerHome();
    applyCustomerSelectedSectionToComposer();
    renderCustomerDraft();
    setMsg("customerOrderMsg", branch ? ("تم اختيار " + branchPublicName(branch) + ". التسليم والمتابعة باسم مطبعجي.") : "", false);
  }

  async function saveFranchiseBranch() {
    if (!canManageFranchiseBranches()) return;
    const nameValue = (( $("franchiseBrandName") || {} ).value || "").trim();
    if (!nameValue) {
      setMsg("franchiseBranchesStatus", "اكتب اسم الفرع أو الشريك أولًا.", true);
      return;
    }
    const payload = authParams({
      branchCode: (( $("franchiseBranchCode") || {} ).value || "").trim(),
      brandName: nameValue,
      partnerName: (( $("franchisePartnerName") || {} ).value || "").trim(),
      governorate: (( $("franchiseGovernorate") || {} ).value || "").trim(),
      city: (( $("franchiseCity") || {} ).value || "").trim(),
      publicArea: (( $("franchisePublicArea") || {} ).value || "").trim(),
      latitude: (( $("franchiseLat") || {} ).value || "").trim(),
      longitude: (( $("franchiseLng") || {} ).value || "").trim(),
      branchRole: (( $("franchiseRole") || {} ).value || "فرنشايز كامل"),
      customerVisibility: (( $("franchiseVisibility") || {} ).value || "ظاهر كفرع مطبعجي"),
      active: (( $("franchiseActive") || {} ).value || "نعم"),
      commissionRate: (( $("franchiseCommission") || {} ).value || "15"),
      monthlySubscription: (( $("franchiseMonthly") || {} ).value || ""),
      canReceiveOrders: ($("franchiseCanReceive") && $("franchiseCanReceive").checked) ? "نعم" : "لا",
      canExecute: ($("franchiseCanExecute") && $("franchiseCanExecute").checked) ? "نعم" : "لا",
      canDeliver: ($("franchiseCanDeliver") && $("franchiseCanDeliver").checked) ? "نعم" : "لا",
      publicDescription: (( $("franchisePublicDescription") || {} ).value || "").trim(),
      internalNotes: (( $("franchiseNotes") || {} ).value || "").trim()
    });
    const btn = $("saveFranchiseBranchBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري الحفظ..."; }
    try {
      const res = await apiPost("saveFranchiseBranch", payload);
      if (!res.success) throw new Error(res.message || "تعذر حفظ فرع مطبعجي.");
      ["franchiseBranchCode", "franchiseBrandName", "franchisePartnerName", "franchiseGovernorate", "franchiseCity", "franchisePublicArea", "franchiseLat", "franchiseLng", "franchiseMonthly", "franchisePublicDescription", "franchiseNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
      if ($("franchiseCommission")) $("franchiseCommission").value = "15";
      setMsg("franchiseBranchesStatus", res.message || "تم حفظ فرع مطبعجي.", false);
      await loadFranchiseBranches(true);
    } catch (err) {
      setMsg("franchiseBranchesStatus", err.message || "خطأ أثناء حفظ فرع مطبعجي.", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "حفظ الفرع / الفرنشايز"; }
    }
  }
  async function assignCustomerToBranch() {
    if (!canManageFranchiseBranches()) return;
    const customer = (($("assignCustomerQuery") || {}).value || "").trim();
    const branchCode = (($("assignCustomerBranchSelect") || {}).value || "").trim();
    if (!customer || !branchCode) {
      setMsg("assignCustomerBranchStatus", "اكتب كود/اسم العميل واختر الفرع.", true);
      return;
    }
    const branch = (state.franchiseBranches || []).find(function (b) { return text(b.branchCode) === branchCode; }) || {};
    const btn = $("assignCustomerBranchBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري التعيين..."; }
    try {
      const res = await api("assignCustomerBranch", authParams({
        customerQuery: customer,
        branchCode: branchCode,
        branchName: branch.brandName || branchPublicName(branch)
      }));
      if (!res.success) throw new Error(res.message || "تعذر تعيين العميل على الفرع.");
      setMsg("assignCustomerBranchStatus", res.message || "تم ربط العميل بالفرع.", false);
      if ($("assignCustomerQuery")) $("assignCustomerQuery").value = "";
      await loadFranchiseBranches(true);
    } catch (err) {
      setMsg("assignCustomerBranchStatus", err.message || "خطأ أثناء تعيين العميل.", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "ربط العميل بالفرع"; }
    }
  }

  /*********************** لوحة الإعلانات V1850 ***********************/

  function canManagePlatformAds() {
    const user = state.user || {};
    const role = safeRole(user.role);
    const username = normalizeArabic(user.username || user.name || "");
    return role === "admin" || username === "ضياء";
  }

  function togglePlatformAdsDashboard() {
    const card = $("platformAdsCard");
    if (!card) return;
    const can = canManagePlatformAds();
    card.classList.toggle("hidden", !can);
    if (can) loadPlatformAds(true);
  }

  function adImageUrl(ad, size) {
    if (!ad) return "";
    if (ad.thumbnailUrl) return text(ad.thumbnailUrl);
    const fileId = text(ad.fileId || ad.id || "");
    if (fileId) return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(fileId) + "&sz=w" + (size || 1200);
    return text(ad.fileUrl || ad.url || "");
  }

  async function loadPlatformAds(forAdmin) {
    try {
      const params = forAdmin ? authParams({ includeInactive: "نعم" }) : { activeOnly: "نعم" };
      const res = await api("getPlatformAds", params);
      if (!res.success) {
        if (forAdmin) setMsg("platformAdsStatus", res.message || "تعذر تحميل الإعلانات.", true);
        return;
      }
      state.platformAds = Array.isArray(res.ads) ? res.ads : [];
      if (forAdmin) renderPlatformAdsDashboard();
      else renderCustomerAdsBoard();
    } catch (err) {
      if (forAdmin) setMsg("platformAdsStatus", err.message || "خطأ في تحميل الإعلانات.", true);
    }
  }

  function adTransformStyle(ad) {
    const scale = Number(ad && ad.scale || 1) || 1;
    const x = Number(ad && ad.offsetX || 0) || 0;
    const y = Number(ad && ad.offsetY || 0) || 0;
    return "transform: translate(" + x + "px," + y + "px) scale(" + scale + ");";
  }

  function renderPlatformAdsDashboard() {
    const list = $("platformAdsList");
    if (!list) return;
    const ads = state.platformAds || [];
    if (!ads.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد إعلانات حتى الآن.</div>';
      return;
    }
    list.innerHTML = ads.map(function (ad) {
      const img = escapeHtml(adImageUrl(ad, 900));
      const url = escapeHtml(ad.fileUrl || "#");
      const active = text(ad.active || ad["مفعل"] || "نعم");
      const adId = escapeHtml(ad.adId || ad.id || "");
      return '<div class="platform-ad-item premium-ad-item" data-ad-id="' + adId + '">' +
        (img ? '<a class="ad-thumb-canvas" href="' + url + '" target="_blank" rel="noopener"><img src="' + img + '" alt="إعلان" loading="lazy" style="' + escapeHtml(adTransformStyle(ad)) + '"></a>' : '') +
        '<div><b>إعلان واجهة العملاء</b>' +
        '<span>مفعل: ' + escapeHtml(active || "نعم") + '</span>' +
        '<small>المكان: ' + escapeHtml(adPlacement(ad) === 'marketplace' ? 'قبل سوق مطبعجي' : (adPlacement(ad) === 'branches' ? 'قبل فروع مطبعجي' : 'أعلى الواجهة')) + '</small>' +
        '<small>تكبير: ' + escapeHtml(ad.scale || 1) + ' | إزاحة: ' + escapeHtml(ad.offsetX || 0) + ' / ' + escapeHtml(ad.offsetY || 0) + '</small>' +
        '<small>' + escapeHtml(ad.createdAt || "") + '</small></div>' +
        '<div class="platform-ad-actions"><button type="button" class="danger small delete-platform-ad" data-ad-id="' + adId + '">حذف الإعلان</button></div>' +
      '</div>';
    }).join("");
    Array.prototype.forEach.call(list.querySelectorAll(".delete-platform-ad"), function (btn) {
      btn.onclick = function () { deletePlatformAd(btn.getAttribute("data-ad-id") || ""); };
    });
  }

  function adPlacement(ad) {
    const p = text(ad && (ad.placement || ad.adPlacement || ad["مكان الإعلان"] || "top")).trim();
    if (p === "marketplace" || p === "قبل سوق مطبعجي") return "marketplace";
    if (p === "branches" || p === "قبل فروع مطبعجي") return "branches";
    return "top";
  }

  function renderAdsIntoBoard(boardId, placement, ads) {
    const board = $(boardId);
    if (!board) return;
    const list = (ads || []).filter(function (ad) { return adPlacement(ad) === placement; });
    if (!list.length) {
      board.classList.add("hidden");
      board.innerHTML = "";
      return;
    }
    board.classList.remove("hidden");
    board.innerHTML = list.slice(0, 3).map(function (ad) {
      const img = escapeHtml(adImageUrl(ad, 1200));
      const url = escapeHtml(ad.fileUrl || "#");
      return '<a class="customer-ad-slide premium-customer-ad" href="' + url + '" target="_blank" rel="noopener">' +
        (img ? '<img src="' + img + '" alt="إعلان" loading="lazy" style="' + escapeHtml(adTransformStyle(ad)) + '">' : '') +
      '</a>';
    }).join("");
  }

  function renderCustomerAdsBoard() {
    const ads = (state.platformAds || []).filter(function (ad) {
      const active = text(ad.active || ad["مفعل"] || "نعم");
      return active !== "لا";
    });
    renderAdsIntoBoard("customerAdsBoard", "top", ads);
    renderAdsIntoBoard("customerAdsBoardMarketplace", "marketplace", ads);
    renderAdsIntoBoard("customerAdsBoardBranches", "branches", ads);
  }

  async function deletePlatformAd(adId) {
    if (!canManagePlatformAds()) return;
    adId = text(adId).trim();
    if (!adId) {
      setMsg("platformAdsStatus", "رقم الإعلان غير موجود للحذف.", true);
      return;
    }
    if (!window.confirm("هل تريد حذف هذا الإعلان من واجهة العملاء؟")) return;
    setMsg("platformAdsStatus", "جاري حذف الإعلان...", false);
    try {
      const res = await api("deletePlatformAd", authParams({ adId: adId }));
      if (!res.success) throw new Error(res.message || "تعذر حذف الإعلان.");
      setMsg("platformAdsStatus", res.message || "تم حذف الإعلان.", false);
      await loadPlatformAds(true);
    } catch (err) {
      setMsg("platformAdsStatus", err.message || "خطأ أثناء حذف الإعلان.", true);
    }
  }


  function resetPlatformAdEditor() {
    const ed = state.platformAdEditor || {};
    if (ed.objectUrl) {
      try { URL.revokeObjectURL(ed.objectUrl); } catch (e) {}
    }
    state.platformAdEditor = { scale: 1, offsetX: 0, offsetY: 0, dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0, objectUrl: "" };
    if ($("platformAdZoom")) $("platformAdZoom").value = "1";
    if ($("platformAdOffsetX")) $("platformAdOffsetX").value = "0";
    if ($("platformAdOffsetY")) $("platformAdOffsetY").value = "0";
    if ($("platformAdPlacement")) $("platformAdPlacement").value = "top";
    updatePlatformAdPlacementPreview();
    updatePlatformAdPreview();
  }

  function updatePlatformAdPlacementPreview() {
    const select = $("platformAdPlacement");
    const wrap = $("platformAdPreviewWrap");
    const placement = select && select.value ? select.value : "top";
    const targetId = placement === "marketplace" ? "platformAdPreviewSlotMarketplace" : (placement === "branches" ? "platformAdPreviewSlotBranches" : "platformAdPreviewSlotTop");
    const target = $(targetId);
    if (target && wrap && wrap.parentNode !== target) target.appendChild(wrap);
    ["platformAdPreviewSlotTop", "platformAdPreviewSlotMarketplace", "platformAdPreviewSlotBranches"].forEach(function (id) {
      const el = $(id);
      if (el) el.classList.toggle("active", id === targetId);
    });
  }

  function updatePlatformAdPreview() {
    updatePlatformAdPlacementPreview();
    const preview = $("platformAdPreviewImg");
    const wrap = $("platformAdPreviewWrap");
    const ed = state.platformAdEditor || {};
    if (!preview || !wrap) return;
    if (!ed.objectUrl) {
      wrap.classList.add("empty");
      preview.removeAttribute("src");
      preview.style.transform = "";
      return;
    }
    wrap.classList.remove("empty");
    preview.src = ed.objectUrl;
    preview.style.transform = "translate(" + (ed.offsetX || 0) + "px," + (ed.offsetY || 0) + "px) scale(" + (ed.scale || 1) + ")";
    if ($("platformAdZoomLabel")) $("platformAdZoomLabel").textContent = Number(ed.scale || 1).toFixed(2) + "x";
  }

  function setPlatformAdEditorFile(file) {
    if (!file) return resetPlatformAdEditor();
    const ed = state.platformAdEditor || {};
    if (ed.objectUrl) {
      try { URL.revokeObjectURL(ed.objectUrl); } catch (e) {}
    }
    state.platformAdEditor = { scale: 1, offsetX: 0, offsetY: 0, dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0, objectUrl: URL.createObjectURL(file) };
    if ($("platformAdZoom")) $("platformAdZoom").value = "1";
    if ($("platformAdOffsetX")) $("platformAdOffsetX").value = "0";
    if ($("platformAdOffsetY")) $("platformAdOffsetY").value = "0";
    updatePlatformAdPlacementPreview();
    updatePlatformAdPreview();
  }

  function syncPlatformAdEditorFromInputs() {
    const ed = state.platformAdEditor || {};
    ed.scale = Number(($("platformAdZoom") || {}).value || ed.scale || 1) || 1;
    ed.offsetX = Number(($("platformAdOffsetX") || {}).value || ed.offsetX || 0) || 0;
    ed.offsetY = Number(($("platformAdOffsetY") || {}).value || ed.offsetY || 0) || 0;
    state.platformAdEditor = ed;
    updatePlatformAdPreview();
  }

  function bindPlatformAdEditor() {
    const fileInput = $("platformAdFile");
    if (fileInput && !fileInput.dataset.adBound) {
      fileInput.dataset.adBound = "1";
      fileInput.addEventListener("change", function () {
        const file = fileInput.files && fileInput.files[0];
        setPlatformAdEditorFile(file);
      });
    }
    ["platformAdZoom", "platformAdOffsetX", "platformAdOffsetY", "platformAdPlacement"].forEach(function (id) {
      const el = $(id);
      if (el && !el.dataset.adBound) {
        el.dataset.adBound = "1";
        el.addEventListener("input", syncPlatformAdEditorFromInputs);
        el.addEventListener("change", syncPlatformAdEditorFromInputs);
      }
    });
    const resetBtn = $("platformAdResetViewBtn");
    if (resetBtn && !resetBtn.dataset.adBound) {
      resetBtn.dataset.adBound = "1";
      resetBtn.addEventListener("click", function () {
        const file = fileInput && fileInput.files && fileInput.files[0];
        setPlatformAdEditorFile(file);
      });
    }
    const wrap = $("platformAdPreviewWrap");
    if (wrap && !wrap.dataset.panBound) {
      wrap.dataset.panBound = "1";
      const point = function (ev) {
        const t = ev.touches && ev.touches[0];
        return { x: t ? t.clientX : ev.clientX, y: t ? t.clientY : ev.clientY };
      };
      const start = function (ev) {
        if (!(state.platformAdEditor || {}).objectUrl) return;
        const p = point(ev);
        state.platformAdEditor.dragging = true;
        state.platformAdEditor.startX = p.x;
        state.platformAdEditor.startY = p.y;
        state.platformAdEditor.baseX = state.platformAdEditor.offsetX || 0;
        state.platformAdEditor.baseY = state.platformAdEditor.offsetY || 0;
        wrap.classList.add("dragging");
        ev.preventDefault();
      };
      const move = function (ev) {
        const ed = state.platformAdEditor || {};
        if (!ed.dragging) return;
        const p = point(ev);
        ed.offsetX = Math.round((ed.baseX || 0) + p.x - (ed.startX || 0));
        ed.offsetY = Math.round((ed.baseY || 0) + p.y - (ed.startY || 0));
        if ($("platformAdOffsetX")) $("platformAdOffsetX").value = ed.offsetX;
        if ($("platformAdOffsetY")) $("platformAdOffsetY").value = ed.offsetY;
        updatePlatformAdPreview();
        ev.preventDefault();
      };
      const end = function () { if (state.platformAdEditor) state.platformAdEditor.dragging = false; wrap.classList.remove("dragging"); };
      wrap.addEventListener("mousedown", start);
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);
      wrap.addEventListener("touchstart", start, { passive: false });
      window.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", end);
    }
  }

  async function uploadPlatformAd() {
    if (!canManagePlatformAds()) return;
    const fileInput = $("platformAdFile");
    const file = fileInput && fileInput.files && fileInput.files[0];
    const title = (($("platformAdTitle") || {}).value || "").trim();
    const active = (($("platformAdActive") || {}).value || "نعم");
    if (!file) {
      setMsg("platformAdsStatus", "اختار صورة الإعلان أولًا.", true);
      return;
    }
    if (!/^image\//i.test(file.type || "")) {
      setMsg("platformAdsStatus", "لوحة الإعلانات تقبل صور فقط.", true);
      return;
    }
    const btn = $("uploadPlatformAdBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري الرفع..."; }
    setMsg("platformAdsStatus", "جاري رفع الإعلان على Drive...", false);
    try {
      const base64 = await fileToBase64(file);
      const res = await apiPost("uploadPlatformAd", authParams({
        title: title,
        active: active,
        adScale: String((state.platformAdEditor || {}).scale || 1),
        adOffsetX: String((state.platformAdEditor || {}).offsetX || 0),
        adOffsetY: String((state.platformAdEditor || {}).offsetY || 0),
        adFit: (($("platformAdFit") || {}).value || "cover"),
        adPlacement: (($("platformAdPlacement") || {}).value || "top"),
        fileName: file.name,
        mimeType: file.type || "image/png",
        size: file.size || 0,
        base64: base64
      }));
      if (!res.success) throw new Error(res.message || "فشل رفع الإعلان.");
      if ($("platformAdTitle")) $("platformAdTitle").value = "";
      if (fileInput) fileInput.value = "";
      resetPlatformAdEditor();
      setMsg("platformAdsStatus", "تم رفع الإعلان وتحديث لوحة العملاء.", false);
      await loadPlatformAds(true);
    } catch (err) {
      setMsg("platformAdsStatus", err.message || "خطأ أثناء رفع الإعلان.", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "رفع الإعلان"; }
    }
  }

  function publicStatus(status) {
    const s = text(status);
    const map = {
      "طلب جديد": "تم استلام الطلب",
      "بدأ التنفيذ": "جاري تجهيز الطلب",
      "تحت التنفيذ": "تحت التنفيذ",
      "متوقف": "متوقف مؤقتًا وسيتم التواصل معك",
      "جاهز للاستلام": "جاهز للاستلام",
      "تم التسليم": "تم التسليم",
      "ملغى": "تم إلغاء الطلب",
      "مكرر": "مكرر"
    };
    return map[s] || s || "تم استلام الطلب";
  }


  /*********************** V1856 - ماركت بليس مطبعجي + واتساب كامل ***********************/

  function canManageMarketplace() {
    const user = state.user || {};
    const role = safeRole(user.role);
    if (isRahmaRestrictedUser(user)) return false;
    return role === "admin" || isDiaaUser(user);
  }

  function toggleMarketplaceDashboard() {
    const card = $("marketplaceCard");
    if (!card) return;
    const can = canManageMarketplace();
    card.classList.toggle("hidden", !can);
    if (can) loadMarketplace(true);
  }

  async function loadMarketplace(forAdmin) {
    try {
      const params = forAdmin ? authParams({ includeInactive: "نعم" }) : {};
      const res = await api("getMarketplace", params);
      if (!res.success) {
        if (forAdmin) setMsg("marketplaceStatus", res.message || "تعذر تحميل الماركت بليس.", true);
        return;
      }
      state.marketplaceVendors = Array.isArray(res.vendors) ? res.vendors : [];
      state.marketplaceProducts = Array.isArray(res.products) ? res.products : [];
      if (forAdmin) renderMarketplaceAdmin();
      renderCustomerMarketplace();
    } catch (err) {
      if (forAdmin) setMsg("marketplaceStatus", err.message || "خطأ في تحميل الماركت بليس.", true);
    }
  }

  function marketVendorImage(vendor) {
    return vendor.thumbnailUrl || vendor.imageUrl || vendor.fileUrl || "";
  }

  function marketProductImage(product) {
    return product.thumbnailUrl || product.imageUrl || product.fileUrl || "";
  }

  function renderMarketplaceAdmin() {
    const vendorSelect = $("marketProductVendor");
    if (vendorSelect) {
      vendorSelect.innerHTML = '<option value="">اختار البائع</option>' + (state.marketplaceVendors || []).map(function (v) {
        return '<option value="' + escapeHtml(v.vendorCode || "") + '">' + escapeHtml(v.vendorName || v.name || "") + '</option>';
      }).join("");
    }
    const box = $("marketplaceAdminList");
    if (!box) return;
    const vendors = state.marketplaceVendors || [];
    const products = state.marketplaceProducts || [];
    if (!vendors.length) { box.innerHTML = '<div class="dash-empty">لا توجد مساحات ماركت بليس حتى الآن.</div>'; return; }
    box.innerHTML = vendors.map(function (v) {
      const list = products.filter(function (p) { return p.vendorCode === v.vendorCode; });
      return '<div class="market-admin-vendor">' +
        '<div class="market-admin-head"><b>' + escapeHtml(v.vendorName || "مساحة") + '</b><span>' + escapeHtml(v.category || "") + ' • نسبة مطبعجي: ' + escapeHtml(v.commission || "0") + '%</span></div>' +
        '<div class="market-admin-meta">واتساب: ' + escapeHtml(v.whatsapp || "-") + ' • مفعل: ' + escapeHtml(v.active || "نعم") + '</div>' +
        '<div class="market-admin-products">' + (list.length ? list.map(function (p) { return '<span>' + escapeHtml(p.productName || "منتج") + ' - ' + escapeHtml(p.price || "") + ' ج / ' + escapeHtml(p.unit || "قطعة") + '</span>'; }).join("") : '<small>لم يتم إضافة منتجات بعد.</small>') + '</div>' +
      '</div>';
    }).join("");
  }

  async function saveMarketplaceVendor() {
    if (!canManageMarketplace()) return;
    const file = ($("marketVendorImage") && $("marketVendorImage").files && $("marketVendorImage").files[0]) ? $("marketVendorImage").files[0] : null;
    const payload = authParams({
      vendorCode: (($("marketVendorCode") || {}).value || "").trim(),
      vendorName: (($("marketVendorName") || {}).value || "").trim(),
      category: (($("marketVendorCategory") || {}).value || "").trim(),
      whatsapp: (($("marketVendorWhatsapp") || {}).value || "").trim(),
      commission: (($("marketVendorCommission") || {}).value || "0").trim(),
      active: (($("marketVendorActive") || {}).value || "نعم"),
      sortOrder: (($("marketVendorSort") || {}).value || "").trim(),
      notes: (($("marketVendorNotes") || {}).value || "").trim()
    });
    try {
      if (!payload.vendorName) { setMsg("marketplaceStatus", "اسم البائع/المساحة مطلوب.", true); return; }
      if (file) {
        if (file.size > 25 * 1024 * 1024) throw new Error("الصورة أكبر من 25MB.");
        payload.fileName = file.name; payload.mimeType = file.type || "image/png"; payload.size = file.size || 0; payload.base64 = await fileToBase64(file);
      }
      setMsg("marketplaceStatus", "جاري حفظ مساحة الماركت بليس...", false);
      const res = await apiPost("saveMarketplaceVendor", payload);
      if (!res.success) throw new Error(res.message || "تعذر حفظ البائع.");
      ["marketVendorCode","marketVendorName","marketVendorCategory","marketVendorWhatsapp","marketVendorSort","marketVendorNotes"].forEach(function(id){ const el=$(id); if(el) el.value=""; });
      if ($("marketVendorCommission")) $("marketVendorCommission").value = "10";
      if ($("marketVendorImage")) $("marketVendorImage").value = "";
      setMsg("marketplaceStatus", res.message || "تم حفظ البائع.", false);
      loadMarketplace(true);
    } catch (err) { setMsg("marketplaceStatus", err.message || "خطأ في حفظ البائع.", true); }
  }

  async function saveMarketplaceProduct() {
    if (!canManageMarketplace()) return;
    const file = ($("marketProductImage") && $("marketProductImage").files && $("marketProductImage").files[0]) ? $("marketProductImage").files[0] : null;
    const payload = authParams({
      vendorCode: (($("marketProductVendor") || {}).value || "").trim(),
      productCode: (($("marketProductCode") || {}).value || "").trim(),
      productName: (($("marketProductName") || {}).value || "").trim(),
      description: (($("marketProductDesc") || {}).value || "").trim(),
      price: (($("marketProductPrice") || {}).value || "").trim(),
      unit: (($("marketProductUnit") || {}).value || "قطعة"),
      active: (($("marketProductActive") || {}).value || "نعم"),
      sortOrder: (($("marketProductSort") || {}).value || "").trim()
    });
    try {
      if (!payload.vendorCode) { setMsg("marketplaceStatus", "اختار البائع أولًا.", true); return; }
      if (!payload.productName) { setMsg("marketplaceStatus", "اسم المنتج مطلوب.", true); return; }
      if (file) {
        if (file.size > 25 * 1024 * 1024) throw new Error("الصورة أكبر من 25MB.");
        payload.fileName = file.name; payload.mimeType = file.type || "image/png"; payload.size = file.size || 0; payload.base64 = await fileToBase64(file);
      }
      setMsg("marketplaceStatus", "جاري حفظ المنتج...", false);
      const res = await apiPost("saveMarketplaceProduct", payload);
      if (!res.success) throw new Error(res.message || "تعذر حفظ المنتج.");
      ["marketProductCode","marketProductName","marketProductDesc","marketProductPrice","marketProductSort"].forEach(function(id){ const el=$(id); if(el) el.value=""; });
      if ($("marketProductImage")) $("marketProductImage").value = "";
      setMsg("marketplaceStatus", res.message || "تم حفظ المنتج.", false);
      loadMarketplace(true);
    } catch (err) { setMsg("marketplaceStatus", err.message || "خطأ في حفظ المنتج.", true); }
  }

  function renderCustomerMarketplace() {
    const board = $("customerMarketplaceBoard");
    if (!board) return;
    const vendors = (state.marketplaceVendors || []).filter(function (v) { return (v.active || "نعم") !== "لا"; });
    if (!vendors.length) { board.innerHTML = '<div class="hint">سوق مطبعجي قيد التجهيز.</div>'; return; }
    board.innerHTML = vendors.map(function (v, i) {
      const img = marketVendorImage(v);
      return '<button type="button" class="market-vendor-card" data-vendor-index="' + i + '">' +
        (img ? '<img src="' + escapeHtml(img) + '" alt="" loading="lazy">' : '<span class="market-vendor-placeholder">🛍️</span>') +
        '<b>' + escapeHtml(v.vendorName || "مساحة") + '</b><small>' + escapeHtml(v.category || "منتجات وخدمات") + '</small>' +
      '</button>';
    }).join("");
    Array.prototype.forEach.call(board.querySelectorAll(".market-vendor-card"), function (btn) {
      btn.onclick = function () { openCustomerMarketVendor(Number(btn.getAttribute("data-vendor-index") || 0)); };
    });
  }

  function openCustomerMarketVendor(index) {
    const vendors = (state.marketplaceVendors || []).filter(function (v) { return (v.active || "نعم") !== "لا"; });
    const vendor = vendors[index];
    if (!vendor) return;
    state.customerSelectedMarketVendor = vendor;
    const box = $("customerMarketplaceProducts");
    if (!box) return;
    const products = (state.marketplaceProducts || []).filter(function (p) { return p.vendorCode === vendor.vendorCode && (p.active || "نعم") !== "لا"; });
    box.classList.remove("hidden");
    box.innerHTML = '<div class="market-products-head"><b>' + escapeHtml(vendor.vendorName || "مساحة") + '</b><span>كل الطلبات تحت مظلة مطبعجي</span></div>' +
      (products.length ? products.map(function (p, i) {
        const img = marketProductImage(p);
        return '<button type="button" class="market-product-card" data-product-index="' + i + '">' +
          (img ? '<img src="' + escapeHtml(img) + '" alt="" loading="lazy">' : '<span>📦</span>') +
          '<b>' + escapeHtml(p.productName || "منتج") + '</b><small>' + escapeHtml(p.description || "") + '</small><em>' + escapeHtml(p.price || "") + (p.price ? ' ج / ' : '') + escapeHtml(p.unit || "قطعة") + '</em>' +
        '</button>';
      }).join("") : '<div class="hint">لم يتم إضافة منتجات لهذه المساحة بعد.</div>');
    Array.prototype.forEach.call(box.querySelectorAll(".market-product-card"), function (btn) {
      btn.onclick = function () { openMarketplaceProductOrder(products[Number(btn.getAttribute("data-product-index") || 0)], vendor); };
    });
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function openMarketplaceProductOrder(product, vendor) {
    if (!product || !vendor) return;
    state.customerSelectedMarketVendor = vendor;
    state.customerSelectedMarketProduct = product;
    state.customerSelectedSection = { name: product.productName || vendor.vendorName || "ماركت بليس", sectionType: "ماركت بليس", designPrice: 10 };
    state.customerViewMode = "newOrder";
    if (!state.customerDraft || state.customerDraft.submitted) resetCustomerDraft();
    renderCustomerHome();
    const item = $("customerOrderItem"); if (item) item.value = product.productName || "";
    const notes = $("customerOrderNotes"); if (notes) notes.value = "طلب من سوق مطبعجي: " + (vendor.vendorName || "") + (product.price ? " | السعر المبدئي: " + product.price + " ج" : "");
    refreshCustomerPendingPreview();
  }

  function renderCustomerHome() {
    updateCustomerFastPrintAccessButton();
    const home = $("customerHomePanel");
    const orderPanel = $("customerNewOrderPanel");
    const ordersPanel = $("customerOrdersPanel");
    const designerPanel = $("customerDesignerPanel");
    [home, orderPanel, ordersPanel, designerPanel].forEach(function (el) { if (el) el.classList.add("hidden"); });
    if (state.customerViewMode !== "newOrder") state.customerSelectedSection = null;

    if (state.customerViewMode === "newOrder") {
      if (orderPanel) orderPanel.classList.remove("hidden");
      if (!state.customerDraft) resetCustomerDraft();
      applyCustomerSelectedSectionToComposer();
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
    if (state.visitorPreview) { state.customerOrders = []; renderCustomerOrders(); const status = $("customerOrdersStatus"); if (status) status.textContent = "المعاينة لا تعرض أوردرات حقيقية."; return; }
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

  function makeCustomerPendingFile(file) {
    let previewUrl = "";
    try { previewUrl = URL.createObjectURL(file); } catch (e) {}
    return {
      file: file,
      name: file.name || "ملف",
      mimeType: file.type || "application/octet-stream",
      type: file.type || "application/octet-stream",
      size: file.size || 0,
      lastModified: file.lastModified || 0,
      previewUrl: previewUrl,
      localPreview: true
    };
  }

  function pendingFileKey(file) {
    return [file && file.name || "", file && file.size || 0, file && file.lastModified || 0].join("|");
  }

  function syncCustomerPendingFilesFromInput(evt) {
    const input = evt && evt.target ? evt.target : ($("customerOrderFiles") || $("customerOrderDocs"));
    const selected = input && input.files ? Array.prototype.slice.call(input.files) : [];
    const current = state.customerPendingFiles || [];
    const existing = {};
    current.forEach(function (f) {
      existing[pendingFileKey(f.file || f)] = true;
    });

    selected.forEach(function (file) {
      const key = pendingFileKey(file);
      if (existing[key]) return;
      current.push(makeCustomerPendingFile(file));
      existing[key] = true;
    });

    state.customerPendingFiles = current;
    if (input) input.value = ""; // يسمح بإضافة صور أو مستندات جديدة بدون استبدال السابق.
    renderCustomerDraft();
    if (state.customerPendingFiles.length) {
      const imgCount = state.customerPendingFiles.filter(isImageAttachment).length;
      const docCount = state.customerPendingFiles.length - imgCount;
      setMsg("customerOrderMsg", "تم تجهيز " + imgCount + " صورة و " + docCount + " ملف داخل الرسالة. اختر مرفقات أخرى للإضافة أو اضغط إرسال.", false);
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

  function renderChatAttachments(files, mode, context) {
    const list = Array.isArray(files) ? files : [];
    if (!list.length) return "";

    context = context || {};
    const images = [];
    const docs = [];
    list.forEach(function (f, originalIndex) {
      if (isImageAttachment(f)) images.push({ file: f, originalIndex: originalIndex });
      else docs.push(f);
    });
    let html = "";

    if (images.length) {
      const visible = images.slice(0, 3);
      const extra = Math.max(0, images.length - visible.length);
      const group = escapeHtml(context.group || "readonly");
      const itemIndex = context.itemIndex == null ? "" : String(context.itemIndex);
      html += '<div class="wa-image-grid count-' + visible.length + '">' + visible.map(function (entry, index) {
        const file = entry.file;
        const name = escapeHtml(attachmentName(file));
        const img = escapeHtml(driveImagePreviewUrl(file, 650));
        const more = extra && index === visible.length - 1 ? '<span class="wa-image-more">+' + extra + '</span>' : '';
        return '<button type="button" class="wa-image-tile wa-image-open" data-image-group="' + group + '" data-item-index="' + escapeHtml(itemIndex) + '" data-image-index="' + entry.originalIndex + '" title="' + name + '">' +
          '<img src="' + img + '" alt="' + name + '" loading="lazy" onerror="this.parentNode.classList.add(&quot;image-failed&quot;)">' +
          more +
          '</button>';
      }).join("") + '</div>';
    }

    if (docs.length) {
      html += '<div class="wa-doc-list">' + docs.map(function (f) { return renderChatAttachment(f, mode); }).join("") + '</div>';
    }

    return html;
  }

  function imageViewerFilesFromContext(group, itemIndex) {
    const draft = state.customerDraft || { items: [] };
    if (group === "pending") {
      return (state.customerPendingFiles || []).filter(isImageAttachment).map(function (f) {
        return { file: f, sourceIndex: (state.customerPendingFiles || []).indexOf(f), canDelete: true };
      });
    }
    if (group === "draftItem") {
      const item = (draft.items || [])[Number(itemIndex) || 0] || {};
      return (item.files || []).filter(isImageAttachment).map(function (f) {
        return { file: f, sourceIndex: -1, canDelete: false };
      });
    }
    return [];
  }

  function attachCustomerImageHandlers() {
    const box = $("customerDraftMessages");
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll(".wa-image-open"), function (btn) {
      btn.onclick = function () {
        const group = btn.getAttribute("data-image-group") || "readonly";
        const itemIndex = btn.getAttribute("data-item-index") || "";
        const originalIndex = Number(btn.getAttribute("data-image-index") || 0);
        const files = imageViewerFilesFromContext(group, itemIndex);
        let viewerIndex = 0;
        files.forEach(function (entry, i) {
          if (entry.sourceIndex === originalIndex) viewerIndex = i;
        });
        openCustomerImageViewer(files, viewerIndex, group === "pending" ? "pending" : "readonly");
      };
    });
  }

  function openCustomerImageViewer(files, index, mode) {
    state.customerImageViewerFiles = Array.isArray(files) ? files : [];
    state.customerImageViewerIndex = Math.max(0, Math.min(Number(index) || 0, state.customerImageViewerFiles.length - 1));
    state.customerImageViewerMode = mode || "readonly";
    const modal = $("customerImageViewerModal");
    if (modal) modal.classList.remove("hidden");
    renderCustomerImageViewer();
  }

  function closeCustomerImageViewer() {
    const modal = $("customerImageViewerModal");
    if (modal) modal.classList.add("hidden");
    state.customerImageViewerFiles = [];
    state.customerImageViewerIndex = 0;
  }

  function renderCustomerImageViewer() {
    const files = state.customerImageViewerFiles || [];
    const entry = files[state.customerImageViewerIndex];
    const img = $("customerImageViewerImg");
    const title = $("customerImageViewerTitle");
    const counter = $("customerImageViewerCounter");
    const del = $("customerImageDeleteBtn");
    if (!entry) {
      closeCustomerImageViewer();
      return;
    }
    if (img) img.src = driveImagePreviewUrl(entry.file, 1400);
    if (title) title.textContent = attachmentName(entry.file);
    if (counter) counter.textContent = (state.customerImageViewerIndex + 1) + " / " + files.length;
    if (del) del.classList.toggle("hidden", !(state.customerImageViewerMode === "pending" && entry.canDelete));
  }

  function moveCustomerImageViewer(step) {
    const files = state.customerImageViewerFiles || [];
    if (!files.length) return;
    state.customerImageViewerIndex = (state.customerImageViewerIndex + step + files.length) % files.length;
    renderCustomerImageViewer();
  }

  function deleteCurrentPendingImage() {
    const files = state.customerImageViewerFiles || [];
    const entry = files[state.customerImageViewerIndex];
    if (!entry || state.customerImageViewerMode !== "pending") return;
    const all = state.customerPendingFiles || [];
    const target = entry.file;
    const idx = all.indexOf(target);
    if (idx >= 0) {
      if (target.previewUrl) { try { URL.revokeObjectURL(target.previewUrl); } catch (e) {} }
      all.splice(idx, 1);
    }
    state.customerPendingFiles = all;
    const newFiles = imageViewerFilesFromContext("pending", "");
    if (!newFiles.length) {
      closeCustomerImageViewer();
    } else {
      state.customerImageViewerFiles = newFiles;
      state.customerImageViewerIndex = Math.min(state.customerImageViewerIndex, newFiles.length - 1);
      renderCustomerImageViewer();
    }
    renderCustomerDraft();
    setMsg("customerOrderMsg", state.customerPendingFiles.length ? "تم حذف الصورة. باقي " + state.customerPendingFiles.length + " ملف جاهز للإرسال." : "تم حذف كل الصور/الملفات المؤقتة.", false);
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
    if (title) title.textContent = draft.orderId ? ("أوردر " + draft.orderId) : (state.customerSelectedSection ? ("خدمة " + state.customerSelectedSection.name) : (draft.draftId ? "مسودة " + draft.draftId : "طلب جديد"));
    if (meta) meta.textContent = draft.submitted ? "تم تحويل الطلب لأوردر رسمي" : (draft.items.length ? ("متصل الآن • " + draft.items.length + " بند") : "متصل الآن • لم يبدأ التنفيذ");
    if (!box) return;

    let html = '<div class="wa-date-chip">اليوم</div>' +
      '<div class="chat-bubble system wa-system-bubble">أهلاً بك في دردشة الطلب. اسأل عن السعر أو ابعت الملفات والملاحظات. بعد ما تجهز كل البنود اضغط بدء التنفيذ لاستلام رقم الأوردر.</div>';
    if (draft.items.length) {
      html += draft.items.map(function (item, index) {
        const files = item.files || [];
        const fileHtml = files.length ? renderChatAttachments(files, "customer", { group: "draftItem", itemIndex: index }) : '<span class="wa-file-card muted"><span class="wa-file-icon">📎</span><span>لم يتم إرفاق ملفات</span></span>';

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
      const pendingFileHtml = pendingFiles.length ? renderChatAttachments(pendingFiles, "customer", { group: "pending" }) : "";
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
    const offerItem = latestItemWithFilesForDesignOffer();
    const hasDesignService = (draft.items || []).some(function (it) { return it.itemName === "خدمة المصمم الذكي"; });
    if (!draft.submitted && offerItem && !hasDesignService) {
      const section = state.customerSelectedSection || {};
      const price = Number(section.designPrice || 10) || 10;
      html += '<div class="chat-bubble system wa-system-bubble design-offer-bubble">' +
        '<b>مصمم مطبعجي الذكي</b><br>هل تريد مساعدة في تجهيز التصميم للطباعة؟<br>' +
        '<small>رسوم التصميم المقترحة: ' + escapeHtml(price) + ' ج</small>' +
        '<div class="design-offer-actions"><button type="button" class="primary design-offer-yes">نعم، ساعدني في التصميم</button><button type="button" class="ghost design-offer-no">لا، الملف جاهز</button></div>' +
      '</div>';
    }
    if (draft.submitted) {
      html += '<div class="chat-bubble done wa-done-bubble">تم استلام الطلب بنجاح ✅<br>رقم الأوردر: <b>' + escapeHtml(draft.orderId || "-") + '</b><br>تابع الحالة من أوردراتي.</div>';
    }
    box.innerHTML = html;
    attachCustomerImageHandlers();
    attachDesignOfferHandlers();
    box.scrollTop = box.scrollHeight;
  }

  function clearCustomerDraftInputs() {
    ["customerOrderItem", "customerOrderNotes"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
    if ($("customerOrderQty")) $("customerOrderQty").value = "1";
    if ($("customerOrderFiles")) $("customerOrderFiles").value = "";
    if ($("customerOrderDocs")) $("customerOrderDocs").value = "";
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
    if (state.visitorPreview) { setMsg("customerOrderMsg", "هذه معاينة فقط. استخدم عميل التجربة ضياء / 1234 لإرسال طلب حقيقي للتجربة.", true); return; }
    if (!state.customer || state.customerDraftBusy) return;
    setMsg("customerOrderMsg", "", false);
    const dep = ($("customerOrderDepartment") || {}).value || "طباعة";
    const itemName = (($("customerOrderItem") || {}).value || "").trim();
    const qty = (($("customerOrderQty") || {}).value || "1").trim();
    const notes = (($("customerOrderNotes") || {}).value || "").trim();
    const heatPress = dep === "طباعة" && $("customerHeatPress") && $("customerHeatPress").checked ? "نعم" : "لا";
    const flyPrint = dep === "طباعة" && $("customerFlyPrint") && $("customerFlyPrint").checked ? "نعم" : "لا";
    const files = (state.customerPendingFiles || []).map(function (f) { return f.file || f; });

    if (!itemName && !notes && !files.length) {
      setMsg("customerOrderMsg", "اكتب نوع الشغل أو ارفع ملفات البند.", true);
      return;
    }

    const btn = $("customerAddDraftItemBtn");
    state.customerDraftBusy = true;
    if (btn) { btn.disabled = true; btn.textContent = "جاري الإضافة..."; }

    try {
      const draftId = await ensureCustomerDraftOnServer();
      const selectedBranch = state.customerSelectedFranchise;
      const selectedVendor = state.customerSelectedMarketVendor;
      const selectedProduct = state.customerSelectedMarketProduct;
      const branchNote = selectedBranch ? ("\nفرع مطبعجي المختار: " + branchPublicName(selectedBranch) + " | كود الفرع: " + (selectedBranch.branchCode || "")) : "";
      const marketNote = selectedVendor ? ("\nسوق مطبعجي: " + (selectedVendor.vendorName || "") + " | كود البائع: " + (selectedVendor.vendorCode || "") + (selectedProduct ? " | المنتج: " + (selectedProduct.productName || "") : "")) : "";
      const res = await api("addCustomerDraftItem", customerAuthParams({
        draftId: draftId,
        department: dep,
        itemName: itemName || (files.length ? "ملفات مرفوعة" : "بند جديد"),
        qty: qty,
        notes: notes + branchNote + marketNote,
        heatPress: heatPress,
        flyPrint: flyPrint,
        franchiseBranchCode: selectedBranch ? (selectedBranch.branchCode || "") : ""
      }));
      if (!res.success) throw new Error(res.message || "تعذر إضافة البند.");
      const uploaded = await uploadFilesForDraftItem(draftId, res.itemId, files);
      const draft = ensureCustomerDraftStarted();
      draft.items.push({
        itemId: res.itemId,
        department: dep,
        itemName: itemName || (files.length ? "ملفات مرفوعة" : "بند جديد"),
        qty: qty,
        notes: notes + (state.customerSelectedFranchise ? ("\nفرع مطبعجي المختار: " + branchPublicName(state.customerSelectedFranchise)) : "") + (state.customerSelectedMarketVendor ? ("\nسوق مطبعجي: " + (state.customerSelectedMarketVendor.vendorName || "")) : ""),
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
    if (state.visitorPreview) { setMsg("customerOrderMsg", "هذه معاينة فقط. استخدم عميل التجربة ضياء / 1234 لإرسال طلب حقيقي للتجربة.", true); return; }
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
    if (state.visitorPreview) {
      closeVisitorPreview();
      return;
    }
    clearCustomerSession();
    showEntryChoice();
  }

  function canOpenVisitorPreview() {
    const user = state.user || {};
    const role = safeRole(user.role);
    const username = normalizeArabic(user.username || user.name || "");
    return role === "admin" || username === "ضياء";
  }

  function toggleVisitorPreviewButton() {
    const btn = $("visitorPreviewBtn");
    if (!btn) return;
    btn.classList.toggle("hidden", !canOpenVisitorPreview());
  }

  function updateCustomerPreviewChrome() {
    const preview = !!state.visitorPreview;
    const changeBtn = $("customerChangePassBtn");
    const logoutBtn = $("customerLogoutBtn");
    const ordersBtn = $("customerShowOrdersBtn");
    if (changeBtn) changeBtn.classList.toggle("hidden", preview);
    if (logoutBtn) {
      logoutBtn.textContent = preview ? "رجوع للوحة ضياء" : "خروج";
      logoutBtn.classList.toggle("danger", !preview);
      logoutBtn.classList.toggle("primary", preview);
    }
    if (ordersBtn) {
      ordersBtn.disabled = preview;
      ordersBtn.title = preview ? "المعاينة للواجهة فقط بدون أوردرات حقيقية." : "";
    }
  }

  function openVisitorPreview() {
    if (!canOpenVisitorPreview()) return;
    state.visitorPreview = true;
    state.customer = {
      customerCode: "PREVIEW",
      name: "زائر تجربة",
      token: "",
      branchName: "واجهة مطبعجي كما تظهر للزائر"
    };
    state.customerViewMode = "home";
    showCustomerMain();
    renderCustomerHeader();
    renderCustomerHome();
    updateCustomerPreviewChrome();
    loadPlatformAds(false);
    loadPlatformSections(false);
    loadFranchiseBranches(false);
    loadMarketplace(false);
    loadWhiteLabelSettings(false);
  }

  function closeVisitorPreview() {
    state.visitorPreview = false;
    state.customer = null;
    state.customerDraft = null;
    showMain();
    updateCustomerPreviewChrome();
    renderHeader();
    toggleVisitorPreviewButton();
    renderTabs();
    setupAdminWorkspace();
    applyAdminWorkspaceTab();
    loadRows(false);
    startRefresh();
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
    togglePlatformAdsDashboard();
    togglePlatformSectionsDashboard();
    toggleFranchiseBranchesDashboard();
    toggleWhiteLabelDashboard();
    togglePhoneLeadsDashboard();
    toggleServiceRoutesDashboard();
    toggleMarketplaceDashboard();
    setupAdminWorkspace();
    toggleAddOrder();
    toggleAddCustomer();
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
    toggleVisitorPreviewButton();
    toggleRemoteFilesButton();
    toggleEmployeeQuickToolButtons();
    toggleAccountingButton();
    forceVisibleMainButtonsPatch13();
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
        togglePlatformAdsDashboard();
        togglePlatformSectionsDashboard();
        toggleFranchiseBranchesDashboard();
        toggleWhiteLabelDashboard();
        togglePhoneLeadsDashboard();
        toggleServiceRoutesDashboard();
        toggleMarketplaceDashboard();
        setupAdminWorkspace();
        loadRows();
      };
      tabs.appendChild(btn);
    });
  }

  function toggleAddOrder() {
    const card = $("addOrderCard");
    if (!card) return;
    card.classList.toggle("hidden", !canAddManualOrder());
  }


  function toggleAddCustomer() {
    const canAdd = canCodeCustomers();
    const card = $("addCustomerCard");
    if (card) card.classList.toggle("hidden", !canAdd);
    const manager = $("newClientManager");
    if (manager && !manager.value.trim()) manager.value = (state.user || {}).name || (state.user || {}).username || "";
    if (canAdd && !(state.franchiseBranches || []).length) loadFranchiseBranches(canManageFranchiseBranches());
    else if (canAdd) refreshFranchiseBranchSelects();
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
    return isEmployeeLoggedIn();
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
      else if (status && status.indexOf("__") !== 0) {
        // عند اختيار حالة محددة مثل ملغى أو جاهز للاستلام نعرضها حتى لو مخفية من الشاشة اليومية.
        if (text(r.status) !== status) return false;
      } else {
        // بدون فلتر حالة: أخفي الحالات النهائية/المخفية من شاشة التشغيل اليومية.
        if (isHiddenFromUserScreens(r.status)) return false;
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

    const finishedStatuses = ["تم التنفيذ", "جاهز للاستلام", "تم التسليم", "مكرر", "ملغى"];

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
    const problem = rows.filter(function (r) { return ["متوقف"].indexOf(text(r.status)) !== -1; }).length;
    const overdue = rows.filter(isOverdueRow).length;
    const debts = rows.filter(hasDebt).length;
    const heatPress = rows.filter(function (r) { return isHeatPress(r.heatPress || r.press || r.isPress || r["مكبس"] || r["مكبس حراري"]); }).length;
    const cancelled = rows.filter(function (r) { return text(r.status) === "ملغى"; }).length;
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
      '<span class="stat-cancelled">ملغى: <b>' + cancelled + '</b></span>' +
      '<span>مشاكل/متوقف: <b>' + problem + '</b></span>';
  }

  function compactOrderCell(r) {
    const overdue = isOverdueRow(r) ? ' <span class="overdue-pill">متأخر</span>' : '';
    const cancelled = text(r.status) === "ملغى" ? ' <span class="cancelled-pill">ملغى</span>' : '';
    return '<div class="order-main"><b>' + escapeHtml(r.orderId || "-") + '</b>' + overdue + cancelled + '</div>' +
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
    const cancelled = text(r.status) === "ملغى" ? '<span class="cancelled-pill">ملغى</span>' : '';
    return '<div class="badges-row"><span class="priority-pill">' + escapeHtml(r.priority || "-") + '</span>' + press + fly + cancelled + '</div>';
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
    const row = state.orderConversationRow || {};
    const customerName = (lines[0] && lines[0].customer) || row.customer || "عميل مطبعجي";

    let html = '<div class="staff-wa-shell">';
    html += '<div class="staff-wa-head"><div class="wa-avatar staff-avatar">م</div><div><b>' + escapeHtml(customerName) + '</b><span>محادثة أوردر ' + escapeHtml(row.orderId || "-") + ' — متابعة وبروفات</span></div></div>';
    html += '<div class="staff-wa-wall wa-chat-wall">';

    html += '<div class="chat-bubble system staff-system-bubble"><b>تفاصيل البند / الأوردر</b>';
    if (!lines.length) html += '<br>لا توجد تفاصيل بنود متاحة.';
    else html += lines.map(function (line) {
      return '<div class="staff-line-summary">' +
        '<b>' + escapeHtml(line.lineId || line.orderId || "-") + '</b>' +
        '<span>القسم: ' + escapeHtml(line.department || "-") + '</span>' +
        '<span>الشغل: ' + escapeHtml(line.itemName || "-") + '</span>' +
        '<span>الكمية: ' + escapeHtml(line.qty || "1") + '</span>' +
        '<span>الحالة: ' + escapeHtml(line.status || "طلب جديد") + '</span>' +
        (line.notes ? '<p>' + escapeHtml(line.notes).replace(/\n/g, '<br>') + '</p>' : '') +
        (line.itemFolderUrl ? '<a href="' + escapeHtml(line.itemFolderUrl) + '" target="_blank">فتح فولدر البند على Drive</a>' : '') +
        '</div>';
    }).join('');
    html += '</div>';

    if (files.length) {
      html += '<div class="chat-bubble customer"><div class="bubble-title">ملفات العميل</div><div class="bubble-files order-files-grid staff-order-files">' + files.map(function (f) { return renderOrderAttachmentCard(f); }).join('') + '</div></div>';
    } else {
      html += '<div class="chat-bubble system">لا توجد ملفات مرفوعة لهذا البند حتى الآن.</div>';
    }

    if (!messages.length) html += '<div class="chat-bubble system">لم يتم إضافة متابعة بعد. اكتب رسالة أو ارفع بروفة للعميل.</div>';
    else html += messages.map(function (m) {
      const cls = m.senderType === "عميل" ? "customer" : "staff";
      return '<div class="chat-bubble ' + cls + '">' +
        '<div class="bubble-title">' + escapeHtml(m.senderName || m.senderType || "متابعة") + '</div>' +
        (m.text ? '<div>' + escapeHtml(m.text).replace(/\n/g, '<br>') + '</div>' : '') +
        (m.fileUrl ? '<div class="bubble-files">' + renderChatAttachment({ fileName: m.fileName, fileUrl: m.fileUrl, fileId: m.fileId, mimeType: m.mimeType }, cls) + '</div>' : '') +
        (m.createdAt ? '<div class="bubble-meta">' + escapeHtml(m.createdAt) + '</div>' : '') +
        '</div>';
    }).join('');

    html += '</div></div>';
    body.innerHTML = html;
    const wall = body.querySelector(".staff-wa-wall");
    if (wall) wall.scrollTop = wall.scrollHeight;
  }

  function insertProofReviewText() {
    const box = $("orderConversationText");
    if (!box) return;
    const current = (box.value || "").trim();
    if (current && current.indexOf("المراجعة مسئولية العميل") === -1) box.value = current + "\n\n" + PROOF_REVIEW_TEXT;
    else if (!current) box.value = PROOF_REVIEW_TEXT;
    box.focus();
  }

  function withProofReviewText(message, hasFiles) {
    let msg = text(message).trim();
    if (!hasFiles) return msg;
    if (msg.indexOf("المراجعة مسئولية العميل") !== -1) return msg;
    return (msg ? msg + "\n\n" : "") + PROOF_REVIEW_TEXT;
  }

  async function sendOrderConversationMessage() {
    if (state.orderConversationBusy) return;
    const row = state.orderConversationRow;
    if (!row) return;
    const textBox = $("orderConversationText");
    const fileInput = $("orderConversationFiles");
    let msg = (textBox && textBox.value || "").trim();
    const files = fileInput && fileInput.files ? Array.prototype.slice.call(fileInput.files) : [];
    msg = withProofReviewText(msg, files.length > 0);
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

  function invoiceCatalogRowsForOrderRow(row) {
    const dept = row && row.department || (typeof accountingDepartmentForMode === "function" ? accountingDepartmentForMode() : "");
    if (typeof accountingCatalogRowsForDepartment === "function") return accountingCatalogRowsForDepartment(dept || "");
    return [];
  }

  function invoiceCatalogValue(row) { return (row.type || "MAT") + "|" + (row.name || ""); }

  function invoiceCatalogByValue(value) {
    const row = state.invoiceRow || {};
    const rows = invoiceCatalogRowsForOrderRow(row);
    return rows.find(function (r) { return invoiceCatalogValue(r) === value; }) || null;
  }

  function fillInvoiceCatalogOptions(row) {
    const sel = $("invoiceItemSelect");
    if (!sel) return;
    const rows = invoiceCatalogRowsForOrderRow(row);
    sel.innerHTML = '<option value="">اختار الصنف من مطبخ الحسابات</option>' + rows.map(function (r) {
      const sale = r.sale ? (" — سعر " + accountingMoney(r.sale)) : "";
      return '<option value="' + escapeHtml(invoiceCatalogValue(r)) + '">' + escapeHtml((r.name || "") + " — " + (r.department || "عام") + sale) + '</option>';
    }).join("");
  }

  function invoiceSelectedCatalogItem() {
    const val = (($("invoiceItemSelect") || {}).value || "").trim();
    if (!val) return null;
    return invoiceCatalogByValue(val);
  }

  function applyInvoiceItemSelection() {
    const item = invoiceSelectedCatalogItem();
    const work = $("invoiceWorkDone");
    const sale = $("invoiceSalePrice");
    const dept = $("invoiceItemDept");
    const shared = $("invoiceSharedLine");
    if (!item) {
      if (work) work.value = "";
      if (sale) sale.value = "0";
      if (dept) dept.value = "";
      if (shared) { shared.checked = false; shared.disabled = false; }
      return;
    }
    if (work) work.value = item.name || "";
    if (sale) sale.value = item.sale ? Number(item.sale).toFixed(2) : "0";
    if (dept) dept.value = item.department || "";
    const isShared = /مشترك|shared|عام/.test(searchKey_(item.department || ""));
    if (shared) { shared.checked = isShared; shared.disabled = isShared; }
  }

  function openEasyStoreLaserForInvoice() {
    const row = state.invoiceRow || {};
    const customer = encodeURIComponent(($("invoiceCustomer") || {}).value || row.customer || "");
    const orderId = encodeURIComponent(($("invoiceOrderId") || {}).value || row.orderId || "");
    const user = encodeURIComponent((state.user && (state.user.username || state.user.name)) || "جابر");
    const token = encodeURIComponent((state.user && state.user.token) || "");
    window.open("https://fawakhry.github.io/EasyStore/?screen=dept&mode=laser&name=" + user + "&username=" + user + "&token=" + token + "&department=ليزر&customer=" + customer + "&orderId=" + orderId + "&v=es14-v1857-accounting-merge", "_blank");
  }

  async function openInvoiceModal(row) {
    state.invoiceRow = row || null;
    const modal = $("invoiceModal");
    if (!modal || !row) return;
    if (canOpenAccounting && canOpenAccounting() && (!state.accounting || !state.accounting.loaded)) {
      try { await loadAccountingData(true); } catch (err) {}
    }
    $("invoiceOrderTitle").textContent = "فاتورة القسم: " + (row.orderId || "-") + " — " + (row.customer || "-");
    $("invoiceLineId").value = row.lineId || "";
    if ($("invoiceCustomer")) $("invoiceCustomer").value = row.customer || "";
    if ($("invoiceOrderId")) $("invoiceOrderId").value = row.orderId || "";
    if ($("invoiceQty")) $("invoiceQty").value = row.qty || 1;
    if ($("invoiceNotes")) $("invoiceNotes").value = row.notes || "";
    fillInvoiceCatalogOptions(row);
    if ($("invoiceItemSelect")) $("invoiceItemSelect").onchange = applyInvoiceItemSelection;
    const laserTools = $("invoiceLaserTools");
    if (laserTools) laserTools.classList.toggle("hidden", !/جابر|ليزر|laser|gaber|jaber/.test(searchKey_((state.user && (state.user.username || state.user.name || state.user.role || state.user.department)) || row.department || "")));
    const laserBtn = $("invoiceOpenEasyLaserBtn");
    if (laserBtn) laserBtn.onclick = openEasyStoreLaserForInvoice;
    applyInvoiceItemSelection();
    $("invoiceMsg").textContent = "اختار الصنف والكمية والسعر، ثم سجل البند. لو الصنف مشترك سيظهر عند القسم الآخر تلقائيًا.";
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
    const item = invoiceSelectedCatalogItem();
    if (!item) {
      if (msg) msg.textContent = "اختار الصنف من القائمة قبل التسجيل.";
      return;
    }
    const qty = numericAmount(($("invoiceQty") || {}).value || 1) || 1;
    const salePrice = numericAmount(($("invoiceSalePrice") || {}).value || item.sale || 0);
    if (!salePrice) {
      if (msg) msg.textContent = "اكتب سعر الفاتورة.";
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = "جاري التسجيل..."; }
    try {
      const isShared = (($("invoiceSharedLine") || {}).checked || /مشترك|shared|عام/.test(searchKey_(item.department || ""))) ? "نعم" : "لا";
      const res = await api("saveAccountingDeptLine", authParams({
        rowNumber: row.rowNumber || "",
        orderId: ($("invoiceOrderId") || {}).value || row.orderId || "",
        lineId: row.lineId || "",
        customerName: ($("invoiceCustomer") || {}).value || row.customer || "",
        customerPhone: row.customerPhone || "",
        department: row.department || "",
        itemType: isShared === "نعم" ? "بند مشترك" : "قسم فقط",
        itemName: item.name || "",
        qty: qty,
        materialName: item.type === "MAT" ? item.name : "",
        materialQty: qty,
        materialCost: "0",
        laborCost: "0",
        otherCost: "0",
        systemCost: "0",
        systemSalePrice: item.sale || salePrice,
        salePrice: salePrice,
        itemDepartment: item.department || "",
        sharedLine: isShared,
        billingStatus: "جاهز للفوترة",
        notes: ($("invoiceNotes") || {}).value || ""
      }));
      if (!res.success) {
        if (msg) msg.textContent = res.message || "تعذر تسجيل بند الفاتورة.";
        return;
      }
      if (msg) msg.textContent = isShared === "نعم" ? "تم تسجيل بند مشترك وسيظهر عند القسم الآخر." : "تم تسجيل بند الفاتورة.";
      setTimeout(closeInvoiceModal, 800);
    } catch (err) {
      if (msg) msg.textContent = err.message || "خطأ في تسجيل بند الفاتورة.";
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "تسجيل البند"; }
    }
  }

  async function ensureDemoCustomer() {
    if (!canOpenVisitorPreview()) return;
    const btn = $("createDemoCustomerBtn");
    if (btn) { btn.disabled = true; btn.textContent = "جاري تجهيز عميل التجربة..."; }
    setMsg("addCustomerStatus", "جاري تجهيز عميل تجربة ضياء...", false);
    try {
      const res = await api("ensureDemoCustomer", authParams({}));
      if (!res.success) {
        setMsg("addCustomerStatus", res.message || "تعذر تجهيز عميل التجربة.", true);
        return;
      }
      setMsg("addCustomerStatus", res.message || "تم تجهيز عميل التجربة: كود الشات diaa وكلمة المرور 1234.", false);
    } catch (err) {
      setMsg("addCustomerStatus", err.message || "خطأ أثناء تجهيز عميل التجربة.", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "تجهيز عميل تجربة ضياء / 1234"; }
    }
  }

  async function createCustomer() {
    setMsg("addCustomerStatus", "", false);

    const params = authParams({
      customerName: $("newClientName").value.trim(),
      manager: $("newClientManager").value.trim() || ((state.user || {}).name || (state.user || {}).username || ""),
      phone: $("newClientPhone").value.trim(),
      extraPhone: $("newClientExtraPhone").value.trim(),
      customerType: ($("newClientType").value.trim() || "خارجي"),
      debtAmount: $("newClientDebt") ? $("newClientDebt").value.trim() : "0",
      franchiseBranchCode: $("newClientBranch") ? $("newClientBranch").value.trim() : "",
      franchiseBranchName: (function () { const sel = $("newClientBranch"); return sel && sel.value && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text : ""; })(),
      active: $("newClientActive").value || "نعم",
      notes: $("newClientNotes").value.trim()
    });

    if (!params.customerName) {
      setMsg("addCustomerStatus", "اسم الشات / العميل مطلوب.", true);
      return;
    }

    const btn = $("createCustomerBtn");
    btn.disabled = true;
    btn.textContent = "جاري حفظ العميل...";

    try {
      const res = await api("createCustomer", params);
      if (!res.success) {
        setMsg("addCustomerStatus", res.message || "فشل حفظ بيانات العميل في الشيت.", true);
        return;
      }

      setMsg("addCustomerStatus", res.message || "تم حفظ بيانات العميل في شيت العملاء.", false);
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
      const branchSelect = $("newClientBranch");
      if (branchSelect) branchSelect.value = "";
    } catch (err) {
      setMsg("addCustomerStatus", err.message || "خطأ أثناء إضافة العميل.", true);
    } finally {
      btn.disabled = false;
      btn.textContent = "حفظ / تعديل العميل";
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

  async function hardRefreshMainScreen() {
    const btn = $("refreshBtn");
    const oldText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "جاري التحديث...";
    }
    state.editing = false;
    state.saving = false;
    try {
      await loadRows(true);
      try { await loadDashboard(true); } catch (e) {}
      try { if ($("matbagyNoteModal") && !$('matbagyNoteModal').classList.contains('hidden')) await loadMatbagyNotesServer(); } catch (e) {}
      try { if ($("accountingModal") && !$('accountingModal').classList.contains('hidden')) await loadAccountingData(true); } catch (e) {}
      setLoading("تم التحديث الآن: " + new Date().toLocaleTimeString("ar-EG"));
    } catch (err) {
      setLoading((err && err.message) || "تعذر التحديث.", true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldText || "تحديث الآن";
      }
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



  /*********************** Patch 15 - نوت مستقل + خامات محفوظة بمكونات ***********************/

  function matbagyNoteStorageKey() {
    const user = state.user || {};
    return "matbagy_internal_notes_v1";
  }

  function loadMatbagyNotesLocal() {
    try { return JSON.parse(localStorage.getItem(matbagyNoteStorageKey()) || "[]"); }
    catch (e) { return []; }
  }

  function saveMatbagyNotesLocal(rows) {
    try { localStorage.setItem(matbagyNoteStorageKey(), JSON.stringify(rows || [])); }
    catch (e) {}
  }

  function renderMatbagyNotesLocal() {
    const list = $("matbagyNotesList");
    if (!list) return;
    const rows = state.matbagyNotes || loadMatbagyNotesLocal();
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد نوتات محفوظة بعد.</div>';
      return;
    }
    list.innerHTML = rows.slice(0, 60).map(function (r, i) {
      return '<div class="matbagy-note-item">' +
        '<div><b>' + escapeHtml(r.title || "نوت بدون عنوان") + '</b> <span>' + escapeHtml(r.category || "عام") + '</span></div>' +
        '<p>' + escapeHtml(r.content || "") + '</p>' +
        '<small>' + escapeHtml(r.by || "") + ' - ' + escapeHtml(r.time || "") + '</small>' +
        '<button type="button" class="ghost small-note-delete" data-note-index="' + i + '">حذف</button>' +
      '</div>';
    }).join("");
    list.querySelectorAll(".small-note-delete").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = Number(btn.getAttribute("data-note-index"));
        const all = loadMatbagyNotesLocal();
        all.splice(idx, 1);
        saveMatbagyNotesLocal(all);
        renderMatbagyNotesLocal();
      });
    });
  }

  function openMatbagyNotePanel() {
    if (!employeeCanOpenMatbagyNote()) {
      alert("نوت مطبعجي متاحة للموظفين فقط.");
      return;
    }
    const modal = $("matbagyNoteModal");
    if (!modal) {
      alert("شاشة نوت مطبعجي غير موجودة. ارفع index.html و app.js معًا من Patch 18.");
      return;
    }
    modal.classList.remove("hidden");
    makeMatbagyNoteDraggable();
    restoreMatbagyNotePosition();
    loadMatbagyNotesServer();
    setTimeout(function () {
      const content = $("matbagyNoteContent");
      if (content) content.focus();
    }, 80);
  }

  function closeMatbagyNotePanel() {
    const modal = $("matbagyNoteModal");
    if (modal) modal.classList.add("hidden");
  }

  function matbagyNotePositionKey() {
    return "matbagy_note_dock_position_v2";
  }

  function applyMatbagyNotePosition(pos) {
    const card = document.querySelector("#matbagyNoteModal .matbagy-note-card");
    if (!card || !pos) return;
    const margin = 10;
    const width = card.offsetWidth || 390;
    const height = card.offsetHeight || 520;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const left = Math.min(Math.max(margin, Number(pos.left) || margin), maxLeft);
    const top = Math.min(Math.max(margin, Number(pos.top) || margin), maxTop);
    card.style.left = left + "px";
    card.style.top = top + "px";
    card.style.right = "auto";
  }

  function restoreMatbagyNotePosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(matbagyNotePositionKey()) || "null");
      if (saved) {
        applyMatbagyNotePosition(saved);
        return;
      }
    } catch (e) {}
    const card = document.querySelector("#matbagyNoteModal .matbagy-note-card");
    if (!card) return;
    card.style.top = "92px";
    card.style.right = "22px";
    card.style.left = "auto";
  }

  function makeMatbagyNoteDraggable() {
    const dock = $("matbagyNoteModal");
    if (!dock || dock.dataset.dragReady === "1") return;
    dock.dataset.dragReady = "1";
    const card = dock.querySelector(".matbagy-note-card");
    const handle = dock.querySelector(".matbagy-note-drag-handle") || dock.querySelector(".modal-head-row");
    if (!card || !handle) return;

    function startDrag(e) {
      if (e.target && (e.target.closest("button") || e.target.closest("input") || e.target.closest("select") || e.target.closest("textarea"))) return;
      const point = e.touches ? e.touches[0] : e;
      const rect = card.getBoundingClientRect();
      const offsetX = point.clientX - rect.left;
      const offsetY = point.clientY - rect.top;
      card.classList.add("dragging");
      dock.classList.add("dragging-note");
      card.style.right = "auto";
      card.style.left = rect.left + "px";
      card.style.top = rect.top + "px";

      function move(ev) {
        const p = ev.touches ? ev.touches[0] : ev;
        if (!p) return;
        ev.preventDefault && ev.preventDefault();
        applyMatbagyNotePosition({ left: p.clientX - offsetX, top: p.clientY - offsetY });
      }
      function stop() {
        card.classList.remove("dragging");
        dock.classList.remove("dragging-note");
        const r = card.getBoundingClientRect();
        try { localStorage.setItem(matbagyNotePositionKey(), JSON.stringify({ left: r.left, top: r.top })); } catch (e) {}
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", stop);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", stop);
      }
      window.addEventListener("mousemove", move, { passive: false });
      window.addEventListener("mouseup", stop);
      window.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", stop);
    }
    handle.addEventListener("mousedown", startDrag);
    handle.addEventListener("touchstart", startDrag, { passive: false });
    window.addEventListener("resize", restoreMatbagyNotePosition);
  }

  function clearMatbagyNoteForm() {
    ["matbagyNoteTitle", "matbagyNoteContent"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
    setMsg("matbagyNoteMsg", "", false);
  }

  async function loadMatbagyNotesServer() {
    renderMatbagyNotesLocal();
    try {
      const res = await api("getMatbagyNotes", authParams({}));
      if (res && res.success) {
        state.matbagyNotes = res.notes || [];
        saveMatbagyNotesLocal(state.matbagyNotes);
        renderMatbagyNotesLocal();
      }
    } catch (e) {
      setMsg("matbagyNoteMsg", "تعذر تحميل النوت من السيرفر، ظاهر آخر حفظ محلي.", true);
    }
  }

  async function saveMatbagyNoteLocal() {
    const title = (($("matbagyNoteTitle") || {}).value || "").trim();
    const content = (($("matbagyNoteContent") || {}).value || "").trim();
    const category = (($("matbagyNoteCategory") || {}).value || "عام").trim();
    if (!title && !content) {
      setMsg("matbagyNoteMsg", "اكتب عنوان أو محتوى النوت الأول.", true);
      return;
    }
    try {
      const res = await api("saveMatbagyNote", authParams({ title: title || "نوت مطبعجي", content: content, category: category }));
      if (!res || !res.success) throw new Error((res && res.message) || "تعذر حفظ النوت على السيرفر.");
      clearMatbagyNoteForm();
      setMsg("matbagyNoteMsg", res.message || "تم حفظ النوت في شيت نوت مطبعجي.", false);
      await loadMatbagyNotesServer();
    } catch (err) {
      const u = state.user || {};
      const rows = loadMatbagyNotesLocal();
      rows.unshift({ title: title || "نوت مطبعجي", content: content, category: category, by: u.name || u.username || "موظف", time: new Date().toLocaleString("ar-EG") });
      state.matbagyNotes = rows;
      saveMatbagyNotesLocal(rows);
      clearMatbagyNoteForm();
      renderMatbagyNotesLocal();
      setMsg("matbagyNoteMsg", "تم حفظ النوت محليًا لأن الاتصال بالسيرفر لم يكتمل. راجع Deploy لو عايزها تظهر لكل الموظفين.", true);
    }
  }

  function exportMatbagyNotesLocal() {
    const rows = state.matbagyNotes || loadMatbagyNotesLocal();
    const textValue = rows.map(function (r) {
      return "[" + (r.category || "عام") + "] " + (r.title || "نوت") + "\n" + (r.content || "") + "\n" + (r.by || "") + " - " + (r.time || "");
    }).join("\n\n----------------\n\n");
    copyText(textValue || "لا توجد نوتات.");
    setMsg("matbagyNoteMsg", "تم نسخ النوتات.", false);
  }

  function materialTextKey(value) {
    return normalizeArabic(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function materialDisplayCost(mat) {
    return numericAmount(mat && (mat.computedUnitCost || mat["تكلفة محسوبة"]) || 0) || numericAmount(mat && (mat.unitCost || mat["سعر الوحدة"]) || 0);
  }

  function materialComponents(mat) {
    const raw = mat && (mat.componentsJson || mat["مكونات الخامة"] || "");
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(String(raw)); } catch (e) { return []; }
  }

  function materialByName(name) {
    const key = materialTextKey(name);
    if (!key) return null;
    return (state.accounting.materials || []).find(function (m) {
      return materialTextKey(m.materialName || m["اسم الخامة"]) === key;
    }) || null;
  }

  function collectMaterialRecipeComponents() {
    const rows = [];
    for (let i = 1; i <= 4; i++) {
      const name = (($("accRecipeMaterial" + i) || {}).value || "").trim();
      const qty = numericAmount(($("accRecipeQty" + i) || {}).value || 0);
      const extra = numericAmount(($("accRecipeExtra" + i) || {}).value || 0);
      if (name || qty || extra) rows.push({ materialName: name, qty: qty, extraCost: extra });
    }
    return rows.filter(function (r) { return r.materialName || r.extraCost; });
  }

  function setMaterialRecipeComponents(rows) {
    rows = rows || [];
    for (let i = 1; i <= 4; i++) {
      const r = rows[i - 1] || {};
      if ($("accRecipeMaterial" + i)) $("accRecipeMaterial" + i).value = r.materialName || "";
      if ($("accRecipeQty" + i)) $("accRecipeQty" + i).value = r.qty || "";
      if ($("accRecipeExtra" + i)) $("accRecipeExtra" + i).value = r.extraCost || "";
    }
  }

  function calculateMaterialRecipeCost(showMsg) {
    const kind = (($("accMaterialKind") || {}).value || "raw");
    const result = $("accMaterialRecipeResult");
    const rows = collectMaterialRecipeComponents();
    let total = 0;
    const lines = [];
    rows.forEach(function (r) {
      const mat = materialByName(r.materialName);
      const unit = mat ? materialDisplayCost(mat) : 0;
      const lineCost = (numericAmount(r.qty) * unit) + numericAmount(r.extraCost);
      total += lineCost;
      lines.push(escapeHtml(r.materialName || "تكلفة إضافية") + " = " + accountingMoney(unit) + " × " + (numericAmount(r.qty) || 0) + (r.extraCost ? (" + " + accountingMoney(r.extraCost)) : "") + " = <b>" + accountingMoney(lineCost) + "</b>");
    });
    if (kind !== "composite") {
      total = numericAmount(($("accMaterialUnitCost") || {}).value || 0);
      if (result) result.innerHTML = "خامة مباشرة. التكلفة الحالية: <b>" + accountingMoney(total) + "</b>";
      return { total: total, lines: [] };
    }
    if (!rows.length) {
      if (result) result.innerHTML = "اختار مكون واحد على الأقل للخامة المركبة.";
      return { total: 0, lines: [] };
    }
    if ($("accMaterialUnitCost")) $("accMaterialUnitCost").value = total.toFixed(2);
    if (result) result.innerHTML = lines.join("<br>") + "<hr>تكلفة الخامة المحفوظة = <b>" + accountingMoney(total) + "</b>";
    if (showMsg) setMsg("accountingMsg", "تم حساب تكلفة الخامة من المكونات. اضغط حفظ / تحديث الخامة.", false);
    return { total: total, lines: lines };
  }

  function syncMaterialRecipeOptions() {
    const selects = document.querySelectorAll(".acc-recipe-material");
    if (!selects.length) return;
    const current = Array.from(selects).map(function (s) { return s.value; });
    const opts = '<option value="">اختار مكون محفوظ</option>' + (state.accounting.materials || []).map(function (m) {
      const name = m.materialName || m["اسم الخامة"] || "";
      return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + ' - ' + accountingMoney(materialDisplayCost(m)) + '</option>';
    }).join("");
    selects.forEach(function (sel, idx) { sel.innerHTML = opts; sel.value = current[idx] || ""; });
  }

  function editAccountingMaterialPatch15(index) {
    const m = (state.accounting.materials || [])[index];
    if (!m) return;
    const set = function (id, v) { const el = $(id); if (el) el.value = v == null ? "" : v; };
    set("accMaterialDepartment", m.department || m["القسم"] || "طباعة");
    set("accMaterialName", m.materialName || m["اسم الخامة"] || "");
    set("accMaterialKind", m.materialKind || m["نوع الخامة"] || (materialComponents(m).length ? "composite" : "raw"));
    set("accMaterialUnit", m.unit || m["الوحدة"] || "");
    set("accMaterialUnitCost", materialDisplayCost(m) || "");
    set("accMaterialWidth", m.width || m["عرض الخام"] || "");
    set("accMaterialHeight", m.height || m["طول الخام"] || "");
    set("accMaterialWaste", m.wastePercent || m["نسبة الهالك"] || "");
    set("accMaterialNotes", m.notes || m["ملاحظات"] || "");
    syncMaterialRecipeOptions();
    setMaterialRecipeComponents(materialComponents(m));
    calculateMaterialRecipeCost(false);
    setMsg("accountingMsg", "تم تحميل الخامة للتعديل. عدل السعر أو المكونات ثم اضغط حفظ / تحديث الخامة.", false);
  }

  function renderAccountingMaterials() {
    const list = $("accountingMaterialsList");
    if (!list) return;
    const rows = state.accounting.materials || [];
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لم يتم تسجيل خامات بعد.</div>';
      syncMaterialRecipeOptions();
      return;
    }
    list.innerHTML = rows.map(function (r, idx) {
      const comps = materialComponents(r);
      const kind = r.materialKind || r["نوع الخامة"] || (comps.length ? "composite" : "raw");
      const compText = comps.length ? ('<small>المكونات: ' + comps.map(function (c) { return escapeHtml(c.materialName || "تكلفة") + ' × ' + (c.qty || 0); }).join(' + ') + '</small>') : '';
      return '<div class="acc-list-item material-item">' +
        '<div><b>' + escapeHtml(r.materialName || r["اسم الخامة"] || "-") + '</b> <span class="material-kind-pill">' + (kind === "composite" ? "مركبة" : "مباشرة") + '</span></div>' +
        '<span>' + escapeHtml(r.department || r["القسم"] || "-") + ' | ' + escapeHtml(r.unit || r["الوحدة"] || "-") + ' | تكلفة: ' + accountingMoney(materialDisplayCost(r)) + '</span>' +
        compText +
        '<button class="ghost edit-material-btn" type="button" data-material-index="' + idx + '">تعديل السعر / المكونات</button>' +
      '</div>';
    }).join("");
    list.querySelectorAll(".edit-material-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { editAccountingMaterialPatch15(Number(btn.getAttribute("data-material-index"))); });
    });
    syncMaterialRecipeOptions();
  }

  function syncAccountingMaterialOptions() {
    const select = $("accDeptLineMaterial");
    if (!select) return;
    const dept = ($("accDeptLineDepartment") || {}).value || accountingDepartmentForMode();
    const rows = (state.accounting.materials || []).filter(function (r) {
      const d = r.department || r["القسم"] || "";
      return !dept || d === dept || d === "مشترك" || d === "عام";
    });
    const oldValue = select.value;
    select.innerHTML = '<option value="">بدون خامة محددة</option>' + rows.map(function (r) {
      const name = r.materialName || r["اسم الخامة"] || "";
      return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + ' - ' + accountingMoney(materialDisplayCost(r)) + '</option>';
    }).join("");
    if (oldValue) select.value = oldValue;
    accountingSmartFillFromMaterial(false);
    syncMaterialRecipeOptions();
  }

  function accountingSmartFindMaterial() {
    const name = (($("accDeptLineMaterial") || {}).value || "").trim();
    return materialByName(name);
  }

  function accountingSmartFillFromMaterial(force) {
    const mat = accountingSmartFindMaterial();
    if (!mat) return;
    const unitCost = materialDisplayCost(mat);
    const width = numericAmount(mat.width || mat["عرض الخام"]);
    const height = numericAmount(mat.height || mat["طول الخام"]);
    const waste = numericAmount(mat.wastePercent || mat["نسبة الهالك"]);
    if (force || !accountingSmartReadNumber("accSmartRawCost")) accountingSmartSetValue("accSmartRawCost", unitCost || "");
    if (force || !accountingSmartReadNumber("accSmartRawWidth")) accountingSmartSetValue("accSmartRawWidth", width || "");
    if (force || !accountingSmartReadNumber("accSmartRawHeight")) accountingSmartSetValue("accSmartRawHeight", height || "");
    if (force || !accountingSmartReadNumber("accSmartWaste")) accountingSmartSetValue("accSmartWaste", waste || 10);
  }

  async function saveAccountingMaterial() {
    if (!accountingCanManageMaterials()) return;
    const name = (($("accMaterialName") || {}).value || "").trim();
    if (!name) {
      setMsg("accountingMsg", "اكتب اسم الخامة.", true);
      return;
    }
    const kind = (($("accMaterialKind") || {}).value || "raw");
    let calc = { total: numericAmount(($("accMaterialUnitCost") || {}).value || 0), lines: [] };
    if (kind === "composite") calc = calculateMaterialRecipeCost(true);
    const comps = kind === "composite" ? collectMaterialRecipeComponents() : [];
    try {
      const res = await api("saveAccountingMaterial", authParams({
        department: ($("accMaterialDepartment") || {}).value,
        materialName: name,
        materialKind: kind,
        unit: ($("accMaterialUnit") || {}).value,
        unitCost: calc.total || ($("accMaterialUnitCost") || {}).value,
        calculatedUnitCost: calc.total || ($("accMaterialUnitCost") || {}).value,
        width: ($("accMaterialWidth") || {}).value,
        height: ($("accMaterialHeight") || {}).value,
        wastePercent: ($("accMaterialWaste") || {}).value,
        componentsJson: JSON.stringify(comps),
        formula: comps.map(function (c) { return (c.materialName || "تكلفة") + " × " + (c.qty || 0) + (c.extraCost ? (" + " + c.extraCost) : ""); }).join(" + "),
        notes: ($("accMaterialNotes") || {}).value,
        active: "نعم"
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم حفظ الخامة." : "فشل الحفظ."), !res.success);
      if (res.success) {
        ["accMaterialName", "accMaterialUnitCost", "accMaterialWidth", "accMaterialHeight", "accMaterialWaste", "accMaterialNotes", "accMaterialUnit"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        if ($("accMaterialKind")) $("accMaterialKind").value = "raw";
        setMaterialRecipeComponents([]);
        if ($("accMaterialRecipeResult")) $("accMaterialRecipeResult").innerHTML = "تم الحفظ. تقدر تعدل السعر في أي وقت من زر تعديل.";
        await loadAccountingData(true);
      }
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في حفظ الخامة.", true);
    }
  }

  async function recalculateAccountingMaterialsPatch15() {
    if (!accountingCanManageMaterials()) return;
    setMsg("accountingMsg", "جاري تحديث تكاليف الخامات المركبة...", false);
    try {
      const res = await api("recalculateAccountingMaterials", authParams({}));
      setMsg("accountingMsg", res.message || (res.success ? "تم التحديث." : "فشل التحديث."), !res.success);
      if (res.success) await loadAccountingData(true);
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في تحديث تكاليف الخامات.", true);
    }
  }



  /*********************** Patch 18 - نوت جانبية + مخزون خامات + تعويض تالف ***********************/

  const prepareAccountingUiByRoleBeforePatch16 = prepareAccountingUiByRole;

  function isAccountingOperatorMode() {
    const mode = currentAccountingMode();
    return mode === "print" || mode === "laser";
  }

  function materialStockQty(mat) {
    return numericAmount(mat && (mat.stockQty || mat["رصيد المخزن"] || mat.stock || mat["المخزون"]) || 0);
  }

  function materialMinStock(mat) {
    return numericAmount(mat && (mat.minStock || mat["حد تنبيه النقص"] || mat["حد النقص"]) || 0);
  }

  function prepareAccountingUiByRole() {
    prepareAccountingUiByRoleBeforePatch16();
    const operator = isAccountingOperatorMode();
    const smartBox = $("accSmartCalcBox");
    const operatorBox = $("accOperatorAutoCostBox");
    if (smartBox) smartBox.classList.toggle("hidden", operator);
    if (operatorBox) operatorBox.classList.toggle("hidden", !operator);
    document.querySelectorAll(".acc-cost-sensitive").forEach(function (el) {
      el.classList.toggle("acc-hidden-cost", operator);
    });
    ["accDeptLineMaterialQty", "accDeptLineMaterialCost", "accDeptLineLaborCost", "accDeptLineOtherCost"].forEach(function (id) {
      const el = $(id);
      if (el) el.tabIndex = operator ? -1 : 0;
    });
    updateOperatorAutoCostMessage();
    updateAccountingWasteDiff();
  }

  function openMatbagyNotePanel() {
    if (!employeeCanOpenMatbagyNote()) {
      alert("نوت مطبعجي متاحة للموظفين فقط.");
      return;
    }
    const modal = $("matbagyNoteModal");
    if (!modal) {
      alert("شاشة نوت مطبعجي غير موجودة. ارفع index.html و app.js معًا من Patch 18.");
      return;
    }
    modal.classList.remove("hidden");
    loadMatbagyNotesServer();
    setTimeout(function(){ const t = $("matbagyNoteContent"); if (t) t.focus(); }, 120);
  }

  function closeMatbagyNotePanel() {
    const modal = $("matbagyNoteModal");
    if (modal) modal.classList.add("hidden");
  }

  function syncAccountingMaterialOptions() {
    const select = $("accDeptLineMaterial");
    const finalSelect = $("accFinalProductSelect");
    const dept = ($("accDeptLineDepartment") || {}).value || accountingDepartmentForMode();
    const operator = isAccountingOperatorMode();
    const rows = (state.accounting.materials || []).filter(function (r) {
      const d = r.department || r["القسم"] || "";
      return !dept || d === dept || d === "مشترك" || d === "عام";
    });
    const optHtml = '<option value="">بدون خامة محددة</option>' + rows.map(function (r) {
      const name = r.materialName || r["اسم الخامة"] || "";
      const comps = materialComponents(r);
      const stock = materialStockQty(r);
      const stockText = stock ? (" | رصيد " + stock) : "";
      const priceText = operator ? "" : (" - " + accountingMoney(materialDisplayCost(r)));
      const kindText = comps.length ? " مركب" : "";
      return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + escapeHtml(kindText) + escapeHtml(priceText + stockText) + '</option>';
    }).join("");
    if (select) {
      const oldValue = select.value;
      select.innerHTML = optHtml;
      if (oldValue) select.value = oldValue;
    }
    if (finalSelect) {
      const old = finalSelect.value;
      finalSelect.innerHTML = '<option value="">بدون بند محفوظ</option>' + (state.accounting.materials || []).map(function (r) {
        const name = r.materialName || r["اسم الخامة"] || "";
        const d = r.department || r["القسم"] || "";
        return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + ' - ' + escapeHtml(d) + '</option>';
      }).join("");
      if (old) finalSelect.value = old;
    }
    accountingSmartFillFromMaterial(false);
    syncMaterialRecipeOptions();
    updateOperatorAutoCostMessage();
  }

  function renderAccountingMaterials() {
    const list = $("accountingMaterialsList");
    if (!list) return;
    const rows = state.accounting.materials || [];
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لم يتم تسجيل خامات بعد.</div>';
      syncMaterialRecipeOptions();
      return;
    }
    list.innerHTML = rows.map(function (r, idx) {
      const comps = materialComponents(r);
      const kind = r.materialKind || r["نوع الخامة"] || (comps.length ? "composite" : "raw");
      const stock = materialStockQty(r);
      const min = materialMinStock(r);
      const stockClass = min && stock <= min ? "acc-stock-alert" : "acc-stock-ok";
      const stockText = '<span class="acc-stock-pill ' + stockClass + '">رصيد: ' + escapeHtml(stock || 0) + '</span>';
      const compText = comps.length ? ('<small>المكونات: ' + comps.map(function (c) { return escapeHtml(c.materialName || "تكلفة") + ' × ' + (c.qty || 0); }).join(' + ') + '</small>') : '';
      return '<div class="acc-list-item material-item">' +
        '<div><b>' + escapeHtml(r.materialName || r["اسم الخامة"] || "-") + '</b> <span class="material-kind-pill">' + (kind === "composite" ? "مركبة" : "مباشرة") + '</span> ' + stockText + '</div>' +
        '<span>' + escapeHtml(r.department || r["القسم"] || "-") + ' | ' + escapeHtml(r.unit || r["الوحدة"] || "-") + ' | تكلفة: ' + accountingMoney(materialDisplayCost(r)) + '</span>' +
        compText +
        '<button class="ghost edit-material-btn" type="button" data-material-index="' + idx + '">تعديل السعر / المخزون / المكونات</button>' +
      '</div>';
    }).join("");
    list.querySelectorAll(".edit-material-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { editAccountingMaterialPatch15(Number(btn.getAttribute("data-material-index"))); });
    });
    syncMaterialRecipeOptions();
  }

  function editAccountingMaterialPatch15(index) {
    const m = (state.accounting.materials || [])[index];
    if (!m) return;
    const set = function (id, v) { const el = $(id); if (el) el.value = v == null ? "" : v; };
    set("accMaterialDepartment", m.department || m["القسم"] || "طباعة");
    set("accMaterialName", m.materialName || m["اسم الخامة"] || "");
    set("accMaterialKind", m.materialKind || m["نوع الخامة"] || (materialComponents(m).length ? "composite" : "raw"));
    set("accMaterialUnit", m.unit || m["الوحدة"] || "");
    set("accMaterialStockQty", m.stockQty || m["رصيد المخزن"] || "");
    set("accMaterialMinStock", m.minStock || m["حد تنبيه النقص"] || "");
    set("accMaterialUnitCost", materialDisplayCost(m) || "");
    set("accMaterialWidth", m.width || m["عرض الخام"] || "");
    set("accMaterialHeight", m.height || m["طول الخام"] || "");
    set("accMaterialWaste", m.wastePercent || m["نسبة الهالك"] || "");
    set("accMaterialNotes", m.notes || m["ملاحظات"] || "");
    syncMaterialRecipeOptions();
    setMaterialRecipeComponents(materialComponents(m));
    calculateMaterialRecipeCost(false);
    setMsg("accountingMsg", "تم تحميل الخامة للتعديل. عدل السعر أو الرصيد أو المكونات ثم اضغط حفظ / تحديث الخامة.", false);
  }

  function syncMaterialRecipeOptions() {
    const selects = document.querySelectorAll(".acc-recipe-material");
    if (!selects.length) return;
    const current = Array.from(selects).map(function (s) { return s.value; });
    const opts = '<option value="">اختار مكون محفوظ</option>' + (state.accounting.materials || []).map(function (m) {
      const name = m.materialName || m["اسم الخامة"] || "";
      const stock = materialStockQty(m);
      return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + ' - ' + accountingMoney(materialDisplayCost(m)) + ' | رصيد ' + escapeHtml(stock || 0) + '</option>';
    }).join("");
    selects.forEach(function (sel, idx) { sel.innerHTML = opts; sel.value = current[idx] || ""; });
  }

  async function saveAccountingMaterial() {
    if (!accountingCanManageMaterials()) return;
    const name = (($("accMaterialName") || {}).value || "").trim();
    if (!name) {
      setMsg("accountingMsg", "اكتب اسم الخامة.", true);
      return;
    }
    const kind = (($("accMaterialKind") || {}).value || "raw");
    let calc = { total: numericAmount(($("accMaterialUnitCost") || {}).value || 0), lines: [] };
    if (kind === "composite") calc = calculateMaterialRecipeCost(true);
    const comps = kind === "composite" ? collectMaterialRecipeComponents() : [];
    try {
      const res = await api("saveAccountingMaterial", authParams({
        department: ($("accMaterialDepartment") || {}).value,
        materialName: name,
        materialKind: kind,
        unit: ($("accMaterialUnit") || {}).value,
        stockQty: ($("accMaterialStockQty") || {}).value,
        minStock: ($("accMaterialMinStock") || {}).value,
        unitCost: calc.total || ($("accMaterialUnitCost") || {}).value,
        calculatedUnitCost: calc.total || ($("accMaterialUnitCost") || {}).value,
        width: ($("accMaterialWidth") || {}).value,
        height: ($("accMaterialHeight") || {}).value,
        wastePercent: ($("accMaterialWaste") || {}).value,
        componentsJson: JSON.stringify(comps),
        formula: comps.map(function (c) { return (c.materialName || "تكلفة") + " × " + (c.qty || 0) + (c.extraCost ? (" + " + c.extraCost) : ""); }).join(" + "),
        notes: ($("accMaterialNotes") || {}).value,
        active: "نعم"
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم حفظ الخامة." : "فشل الحفظ."), !res.success);
      if (res.success) {
        ["accMaterialName", "accMaterialUnitCost", "accMaterialWidth", "accMaterialHeight", "accMaterialWaste", "accMaterialNotes", "accMaterialUnit", "accMaterialStockQty", "accMaterialMinStock"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        if ($("accMaterialKind")) $("accMaterialKind").value = "raw";
        setMaterialRecipeComponents([]);
        if ($("accMaterialRecipeResult")) $("accMaterialRecipeResult").innerHTML = "تم الحفظ. تقدر تعدل السعر أو الرصيد في أي وقت من زر تعديل.";
        await loadAccountingData(true);
      }
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في حفظ الخامة.", true);
    }
  }

  function collectMaterialRequirements(materialName, qty, path) {
    const mat = materialByName(materialName);
    const needs = [];
    qty = numericAmount(qty) || 1;
    path = path || [];
    if (!mat) {
      needs.push({ missing: true, materialName: materialName || "بند غير معروف", required: qty, available: 0, reason: "غير مسجل في الخامات" });
      return needs;
    }
    const comps = materialComponents(mat);
    if (!comps.length) {
      // لو الخامة المختارة مباشرة في الفاتورة نسمح بها حتى لو لم يتم ضبط المخزون بعد.
      // أما لو هي مكون داخل منتج مركب مثل تابلوه، لازم يتوفر لها رصيد.
      if (!path.length) return needs;
      const available = materialStockQty(mat);
      if (available < qty) needs.push({ missing: true, materialName: mat.materialName || mat["اسم الخامة"], required: qty, available: available, reason: "رصيد غير كاف" });
      return needs;
    }
    comps.forEach(function (c) {
      const req = qty * (numericAmount(c.qty) || 0);
      if (!req && !c.materialName) return;
      needs.push.apply(needs, collectMaterialRequirements(c.materialName, req || 1, path.concat([materialName])));
    });
    return needs;
  }

  function validateSelectedMaterialAvailability() {
    const matName = (($("accDeptLineMaterial") || {}).value || "").trim();
    if (!matName) return { ok: true, missing: [] };
    const qty = numericAmount(($("accDeptLineQty") || {}).value || 1) || 1;
    const missing = collectMaterialRequirements(matName, qty).filter(function (x) { return x.missing; });
    if (missing.length) return { ok: false, missing: missing };
    return { ok: true, missing: [] };
  }

  function accountingAutoCostFromSelectedMaterial() {
    const mat = accountingSmartFindMaterial();
    const qty = numericAmount(($("accDeptLineQty") || {}).value || 1) || 1;
    if (!mat) return 0;
    const cost = materialDisplayCost(mat) * qty;
    if ($("accDeptLineMaterialQty")) $("accDeptLineMaterialQty").value = qty;
    if ($("accDeptLineMaterialCost")) $("accDeptLineMaterialCost").value = cost.toFixed(2);
    if ($("accDeptLineLaborCost") && !numericAmount($("accDeptLineLaborCost").value)) $("accDeptLineLaborCost").value = "0";
    if ($("accDeptLineOtherCost") && !numericAmount($("accDeptLineOtherCost").value)) $("accDeptLineOtherCost").value = "0";
    return cost + numericAmount(($("accDeptLineLaborCost") || {}).value || 0) + numericAmount(($("accDeptLineOtherCost") || {}).value || 0);
  }

  function updateOperatorAutoCostMessage() {
    const box = $("accOperatorAutoCostMsg");
    if (!box) return;
    const mat = accountingSmartFindMaterial();
    if (!mat) {
      box.textContent = "اختار بند محفوظ، والسيستم يحسب التكلفة داخليًا بدون إظهار أسعار الخامات.";
      return;
    }
    const validation = validateSelectedMaterialAvailability();
    const systemCost = accountingAutoCostFromSelectedMaterial();
    if (!validation.ok) {
      box.innerHTML = '<span class="acc-stock-alert">ناقص لاستخراج البند: ' + validation.missing.map(function (m) { return escapeHtml(m.materialName) + ' مطلوب ' + escapeHtml(m.required) + ' والمتاح ' + escapeHtml(m.available); }).join(' / ') + '</span>';
    } else {
      box.innerHTML = 'تم اختيار <b>' + escapeHtml(mat.materialName || mat["اسم الخامة"] || "") + '</b> — التكلفة اتحسبت داخليًا ولا تظهر أسعار الخامات للمنفذ.';
    }
    updateAccountingWasteDiff(systemCost);
  }

  function updateAccountingWasteDiff(systemCost) {
    if (systemCost === undefined) systemCost = accountingAutoCostFromSelectedMaterial();
    const sale = numericAmount(($("accDeptLineSalePrice") || {}).value || 0);
    const diff = Math.max(0, sale - (systemCost || 0));
    if ($("accDeptLinePriceDiff")) $("accDeptLinePriceDiff").value = diff ? diff.toFixed(2) : "";
    const damage = numericAmount(($("accDeptLineDamageCost") || {}).value || 0);
    const covered = numericAmount(($("accDeptLineDamageCovered") || {}).value || 0);
    const rem = Math.max(0, damage - covered);
    if ($("accDeptLineDamageRemaining")) $("accDeptLineDamageRemaining").value = rem ? rem.toFixed(2) : "";
    const msg = $("accWasteMsg");
    if (msg) msg.textContent = damage ? ("كان عليه " + accountingMoney(damage) + " / عوض " + accountingMoney(covered) + " / باقي " + accountingMoney(rem)) : "لو خامة باظت، سجل قيمتها والمبلغ اللي اتعوض. الفرق يتحفظ في بند تعويض تالف مستقل.";
  }

  function finalProductSelectChanged() {
    const name = (($("accFinalProductSelect") || {}).value || "").trim();
    if (!name) return;
    const mat = materialByName(name);
    if ($("accFinalManualDescription")) $("accFinalManualDescription").value = name;
    const validation = collectMaterialRequirements(name, 1).filter(function (x) { return x.missing; });
    if (validation.length) {
      setMsg("accountingMsg", "لا يمكن استخراج " + name + " لأن في باند ناقص: " + validation.map(function (m) { return m.materialName + " مطلوب " + m.required + " والمتاح " + m.available; }).join(" / "), true);
    } else {
      setMsg("accountingMsg", "تم اختيار بند محفوظ. اكتبي قيمة البيع النهائية أو استدعي أجزاء وائل وجابر.", false);
    }
  }

  const saveAccountingFinalInvoiceBeforePatch16Final = saveAccountingFinalInvoice;

  async function saveAccountingFinalInvoice() {
    const selectedProduct = (($("accFinalProductSelect") || {}).value || "").trim();
    if (selectedProduct) {
      const missing = collectMaterialRequirements(selectedProduct, 1).filter(function (x) { return x.missing; });
      if (missing.length) {
        setMsg("accountingMsg", "لا يمكن تقفيل الفاتورة. في باند ناقص لاستخراج " + selectedProduct + ": " + missing.map(function (m) { return m.materialName + " مطلوب " + m.required + " والمتاح " + m.available; }).join(" / "), true);
        return;
      }
      if ($("accFinalManualDescription") && !$("accFinalManualDescription").value.trim()) $("accFinalManualDescription").value = selectedProduct;
    }
    return saveAccountingFinalInvoiceBeforePatch16Final();
  }

  function renderAccountingDeptLines() {
    const list = $("accountingDeptLinesList");
    if (!list) return;
    const rows = state.accounting.deptLines || [];
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty">لا توجد فواتير أقسام مسجلة حتى الآن.</div>';
      return;
    }
    list.innerHTML = rows.slice(0, 80).map(function (r) {
      const profit = accountingLineSale(r) - accountingLineCost(r);
      const mode = currentAccountingMode();
      const showProfit = mode === "full";
      const showCost = mode === "full" || mode === "final";
      const damage = numericAmount(r.damageCost || r["تكلفة التالف"] || 0);
      const covered = numericAmount(r.damageCovered || r["تعويض التالف"] || 0);
      const remaining = numericAmount(r.damageRemaining || r["باقي على الموظف"] || Math.max(0, damage - covered));
      const costLine = showCost ? ('تكلفة: ' + accountingMoney(accountingLineCost(r)) + (showProfit ? (' | ربح: ' + accountingMoney(profit)) : '')) : 'التكلفة محسوبة داخليًا';
      const damageLine = damage ? ('<small>تالف: كان عليه ' + accountingMoney(damage) + ' | عوض ' + accountingMoney(covered) + ' | باقي ' + accountingMoney(remaining) + '</small>') : '';
      return '<div class="acc-line-card">' +
        '<div><b>' + escapeHtml(r.orderId || r["رقم الأوردر"] || "-") + '</b> <span>' + escapeHtml(r.department || r["القسم"] || "-") + '</span></div>' +
        '<p>' + escapeHtml(r.itemName || r["اسم البند"] || "-") + '</p>' +
        '<small>بيع: ' + accountingMoney(accountingLineSale(r)) + ' | ' + costLine + '</small>' +
        damageLine +
        '<small>تقفيل: ' + escapeHtml(r.closeStatus || r["حالة التقفيل"] || "مفتوح") + ' | بواسطة: ' + escapeHtml(r.createdBy || r["مسجل بواسطة"] || "-") + '</small>' +
      '</div>';
    }).join("");
  }

  async function saveAccountingDeptLine() {
    if (!accountingCanEnterDeptLine()) return;
    const orderId = (($("accDeptLineOrderId") || {}).value || "").trim();
    const itemName = (($("accDeptLineItemName") || {}).value || "").trim();
    if (!orderId || !itemName) {
      setMsg("accountingMsg", "رقم الأوردر واسم البند مطلوبين لتسجيل فاتورة القسم.", true);
      return;
    }
    const validation = validateSelectedMaterialAvailability();
    if (!validation.ok) {
      setMsg("accountingMsg", "لا يمكن حفظ الفاتورة. في باند ناقص لاستخراج المنتج: " + validation.missing.map(function (m) { return m.materialName + " مطلوب " + m.required + " والمتاح " + m.available; }).join(" / "), true);
      return;
    }
    try {
      if (isAccountingOperatorMode()) accountingAutoCostFromSelectedMaterial();
      else if (!numericAmount(($("accDeptLineMaterialCost") || {}).value || 0) && $("accSmartWidth") && $("accSmartHeight")) {
        calculateSmartAccountingCost(false);
        if (state.accounting.smartCalc && state.accounting.smartCalc.totalCost > 0) applySmartAccountingCost();
      }
      updateAccountingWasteDiff();
      const damageCost = ($("accDeptLineDamageCost") || {}).value || "";
      const damageCovered = ($("accDeptLineDamageCovered") || {}).value || "";
      const damageRemaining = ($("accDeptLineDamageRemaining") || {}).value || "";
      const priceDiff = ($("accDeptLinePriceDiff") || {}).value || "";
      const baseNotes = ($("accDeptLineNotes") || {}).value || "";
      const damageNote = numericAmount(damageCost) ? ("\n[تعويض تالف] كان عليه: " + damageCost + " / عوض: " + damageCovered + " / باقي: " + damageRemaining + " / فرق عن السيستم: " + priceDiff) : "";
      const res = await api("saveAccountingDeptLine", authParams({
        orderId: orderId,
        lineId: ($("accDeptLineLineId") || {}).value,
        customerName: ($("accDeptLineCustomer") || {}).value,
        department: ($("accDeptLineDepartment") || {}).value,
        itemType: ($("accDeptLineType") || {}).value,
        itemName: itemName,
        qty: ($("accDeptLineQty") || {}).value,
        materialName: ($("accDeptLineMaterial") || {}).value,
        materialQty: ($("accDeptLineMaterialQty") || {}).value,
        materialCost: ($("accDeptLineMaterialCost") || {}).value,
        laborCost: ($("accDeptLineLaborCost") || {}).value,
        otherCost: ($("accDeptLineOtherCost") || {}).value,
        systemCost: numericAmount(($("accDeptLineMaterialCost") || {}).value || 0) + numericAmount(($("accDeptLineLaborCost") || {}).value || 0) + numericAmount(($("accDeptLineOtherCost") || {}).value || 0),
        priceDiff: priceDiff,
        damageCost: damageCost,
        damageCovered: damageCovered,
        damageRemaining: damageRemaining,
        salePrice: ($("accDeptLineSalePrice") || {}).value,
        notes: baseNotes + damageNote
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم تسجيل فاتورة القسم." : "فشل الحفظ."), !res.success);
      if (res.success) {
        ["accDeptLineLineId", "accDeptLineItemName", "accDeptLineMaterialQty", "accDeptLineMaterialCost", "accDeptLineLaborCost", "accDeptLineOtherCost", "accDeptLineSalePrice", "accDeptLineNotes", "accDeptLineDamageCost", "accDeptLineDamageCovered", "accDeptLineDamageRemaining", "accDeptLinePriceDiff"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        await loadAccountingData(true);
      }
    } catch (err) {
      setMsg("accountingMsg", err.message || "خطأ في تسجيل فاتورة القسم.", true);
    }
  }


  /*********************** Patch 18 - مطبخ الحسابات + بنود مسعرة + فرق سعر للهوالك ***********************/

  function accountingIsFullKitchenMode() {
    return currentAccountingMode() === "full";
  }

  function materialOfficialSalePrice(mat) {
    return numericAmount(mat && (mat.salePrice || mat["سعر بيع رسمي"] || mat["سعر بيع مقترح"]) || 0);
  }

  function templateItemName(tpl) {
    return tpl && (tpl.itemName || tpl["اسم البند"] || "") || "";
  }

  function templateMaterialName(tpl) {
    return tpl && (tpl.materialName || tpl["الخامة"] || tpl["اسم الخامة"] || "") || "";
  }

  function templateCost(tpl) {
    if (!tpl) return 0;
    const mat = materialByName(templateMaterialName(tpl));
    const base = mat ? materialDisplayCost(mat) : 0;
    const output = numericAmount(tpl.outputCount || tpl["الناتج"] || 0);
    const materialPart = output > 0 ? (base / output) : base;
    return materialPart + numericAmount(tpl.inkCost || tpl["تكلفة حبر"] || 0) + numericAmount(tpl.fixedCost || tpl["تكلفة ثابتة"] || 0);
  }

  function templateSalePrice(tpl) {
    return numericAmount(tpl && (tpl.salePrice || tpl["سعر بيع مقترح"] || tpl["سعر بيع رسمي"]) || 0);
  }

  function accountingTplByName(name) {
    const key = materialTextKey(name);
    if (!key) return null;
    return (state.accounting.templates || []).find(function (t) {
      return materialTextKey(templateItemName(t)) === key;
    }) || null;
  }

  function accountingSelectedCatalogItem() {
    const raw = (($("accDeptLineMaterial") || {}).value || "").trim();
    if (!raw) return null;
    if (raw.indexOf("TPL|") === 0) {
      const name = raw.slice(4);
      const tpl = accountingTplByName(name);
      if (!tpl) return null;
      const mat = materialByName(templateMaterialName(tpl));
      return {
        source: "template",
        name: templateItemName(tpl),
        department: tpl.department || tpl["القسم"] || "",
        materialName: templateMaterialName(tpl),
        unitCost: templateCost(tpl),
        systemSalePrice: templateSalePrice(tpl),
        material: mat,
        template: tpl
      };
    }
    const clean = raw.indexOf("MAT|") === 0 ? raw.slice(4) : raw;
    const mat = materialByName(clean);
    if (!mat) return null;
    const sale = materialOfficialSalePrice(mat);
    return {
      source: "material",
      name: mat.materialName || mat["اسم الخامة"] || clean,
      department: mat.department || mat["القسم"] || "",
      materialName: mat.materialName || mat["اسم الخامة"] || clean,
      unitCost: materialDisplayCost(mat),
      systemSalePrice: sale || materialDisplayCost(mat),
      material: mat,
      template: null
    };
  }

  function accountingSystemPriceForSelectedItem() {
    const item = accountingSelectedCatalogItem();
    if (!item) return 0;
    const qty = Math.max(1, numericAmount(($("accDeptLineQty") || {}).value || 1) || 1);
    return numericAmount(item.systemSalePrice) * qty;
  }

  function accountingSetSystemPriceField(value) {
    const el = $("accDeptLineSystemPrice");
    if (el) el.value = value ? Number(value).toFixed(2) : "";
  }

  function toggleAccountingButton() {
    ensureEmployeeMainActionButtons();
    const btn = $("accountingBtn");
    if (!btn) return;
    btn.classList.toggle("hidden", !canOpenAccounting());
    if (canOpenAccounting()) btn.textContent = accountingIsFullKitchenMode() ? "💰 مطبخ الحسابات" : "💰 حسابات مطبعجي";
  }

  const prepareAccountingUiByRoleBeforePatch18 = prepareAccountingUiByRole;
  function prepareAccountingUiByRole() {
    prepareAccountingUiByRoleBeforePatch18();
    const mode = currentAccountingMode();
    const operator = mode === "print" || mode === "laser";
    const laser = mode === "laser";
    const title = $("accountingRoleTitle");
    const hint = $("accountingRoleHint");
    const card = document.querySelector(".accounting-card");
    if (card) card.classList.toggle("acc-operator-laser", laser && operator);
    if (title) {
      if (mode === "full") title.textContent = "مطبخ الحسابات - ضياء";
      else if (mode === "final") title.textContent = "حسابات مطبعجي - تقفيل الفواتير";
      else if (mode === "print") title.textContent = "حسابات مطبعجي - وائل / الطباعة";
      else if (mode === "laser") title.textContent = "حسابات مطبعجي - جابر / الليزر";
    }
    if (hint) {
      if (mode === "full") hint.textContent = "هنا تسجيل الأسعار والخامات والتركيبات والبنود المسعرة. أي بند محفوظ هنا يظهر تلقائيًا للموظفين في الفواتير.";
      else if (mode === "print") hint.textContent = "اختار البند المسعر فقط واكتب سعر القطعة في الفاتورة. تكلفة الخامة مخفية وتتسجل داخليًا.";
      else if (mode === "laser") hint.textContent = "اختار البند المسعر، واستخدم حاسبة AI للمقاسات المتغيرة. تكلفة الخامة مخفية وتتسجل داخليًا.";
      else if (mode === "final") hint.textContent = "رحمه / ريفان تقفل الفاتورة النهائية وتستدعي أجزاء وائل وجابر، أو تضيف بند محفوظ من مطبخ الحسابات.";
    }
    const smartBox = $("accSmartCalcBox");
    const operatorBox = $("accOperatorAutoCostBox");
    if (smartBox) smartBox.classList.toggle("hidden", mode === "print");
    if (operatorBox) operatorBox.classList.toggle("hidden", !operator);
    document.querySelectorAll(".acc-cost-sensitive").forEach(function (el) { el.classList.toggle("acc-hidden-cost", operator); });
    ["accDeptLineMaterialQty", "accDeptLineMaterialCost", "accDeptLineLaborCost", "accDeptLineOtherCost"].forEach(function (id) {
      const el = $(id); if (el) el.tabIndex = operator ? -1 : 0;
    });
    const itemName = $("accDeptLineItemName");
    if (itemName) itemName.readOnly = operator;
    const sale = $("accDeptLineSalePrice");
    if (sale && operator) sale.placeholder = "يمكن تعديله لهذه الفاتورة فقط";
    updateOperatorAutoCostMessage();
    updateAccountingWasteDiff();
  }

  function accountingCatalogRowsForDepartment(dept) {
    const rows = [];
    (state.accounting.materials || []).forEach(function (m) {
      const d = m.department || m["القسم"] || "";
      if (dept && !(d === dept || d === "مشترك" || d === "عام")) return;
      const name = m.materialName || m["اسم الخامة"] || "";
      if (!name) return;
      rows.push({ type: "MAT", name: name, department: d, cost: materialDisplayCost(m), sale: materialOfficialSalePrice(m) || materialDisplayCost(m), stock: materialStockQty(m), composite: materialComponents(m).length > 0 });
    });
    (state.accounting.templates || []).forEach(function (t) {
      const d = t.department || t["القسم"] || "";
      if (dept && !(d === dept || d === "مشترك" || d === "عام")) return;
      const name = templateItemName(t);
      if (!name) return;
      rows.push({ type: "TPL", name: name, department: d, cost: templateCost(t), sale: templateSalePrice(t), stock: 0, composite: false });
    });
    const seen = {};
    return rows.filter(function (r) { const k = r.type + "|" + materialTextKey(r.name); if (seen[k]) return false; seen[k] = true; return true; });
  }

  function syncAccountingMaterialOptions() {
    const select = $("accDeptLineMaterial");
    const finalSelect = $("accFinalProductSelect");
    const dept = ($("accDeptLineDepartment") || {}).value || accountingDepartmentForMode();
    const operator = isAccountingOperatorMode();
    const rows = accountingCatalogRowsForDepartment(dept);
    const optHtml = '<option value="">اختار بند محفوظ</option>' + rows.map(function (r) {
      const value = r.type + "|" + r.name;
      const official = r.sale ? (" | سعر رسمي " + accountingMoney(r.sale)) : "";
      const cost = (!operator && r.cost) ? (" | تكلفة " + accountingMoney(r.cost)) : "";
      const stock = (!operator && r.stock) ? (" | رصيد " + r.stock) : "";
      const badge = r.type === "TPL" ? "بند" : (r.composite ? "تركيبة" : "خامة");
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(r.name + " - " + badge + official + cost + stock) + '</option>';
    }).join("");
    if (select) { const oldValue = select.value; select.innerHTML = optHtml; if (oldValue) select.value = oldValue; }
    if (finalSelect) {
      const allRows = accountingCatalogRowsForDepartment("");
      const old = finalSelect.value;
      finalSelect.innerHTML = '<option value="">بدون بند محفوظ</option>' + allRows.map(function (r) {
        const value = r.type + "|" + r.name;
        return '<option value="' + escapeHtml(value) + '">' + escapeHtml(r.name + " - " + (r.department || "عام")) + '</option>';
      }).join("");
      if (old) finalSelect.value = old;
    }
    accountingSmartFillFromMaterial(false);
    syncMaterialRecipeOptions();
    updateOperatorAutoCostMessage();
  }

  function accountingSmartFindMaterial() {
    const item = accountingSelectedCatalogItem();
    if (!item) return null;
    return item.material || materialByName(item.materialName || item.name);
  }

  function accountingAutoCostFromSelectedMaterial() {
    const item = accountingSelectedCatalogItem();
    const qty = Math.max(1, numericAmount(($("accDeptLineQty") || {}).value || 1) || 1);
    if (!item) { accountingSetSystemPriceField(0); return 0; }
    const cost = numericAmount(item.unitCost) * qty;
    if ($("accDeptLineItemName")) $("accDeptLineItemName").value = item.name;
    if ($("accDeptLineMaterialQty")) $("accDeptLineMaterialQty").value = qty;
    if ($("accDeptLineMaterialCost")) $("accDeptLineMaterialCost").value = cost.toFixed(2);
    if ($("accDeptLineLaborCost") && !numericAmount($("accDeptLineLaborCost").value)) $("accDeptLineLaborCost").value = "0";
    if ($("accDeptLineOtherCost") && !numericAmount($("accDeptLineOtherCost").value)) $("accDeptLineOtherCost").value = "0";
    const official = accountingSystemPriceForSelectedItem();
    accountingSetSystemPriceField(official);
    const sale = $("accDeptLineSalePrice");
    if (sale && official && !numericAmount(sale.value)) sale.value = official.toFixed(2);
    return cost + numericAmount(($("accDeptLineLaborCost") || {}).value || 0) + numericAmount(($("accDeptLineOtherCost") || {}).value || 0);
  }

  function updateOperatorAutoCostMessage() {
    const box = $("accOperatorAutoCostMsg");
    if (!box) return;
    const item = accountingSelectedCatalogItem();
    if (!item) {
      box.textContent = "اختار بند محفوظ من مطبخ الحسابات، والسيستم يحسب التكلفة داخليًا بدون إظهار أسعار الخامات.";
      return;
    }
    const validation = validateSelectedMaterialAvailability();
    const systemCost = accountingAutoCostFromSelectedMaterial();
    const systemPrice = accountingSystemPriceForSelectedItem();
    if (!validation.ok) {
      box.innerHTML = '<span class="acc-stock-alert">ناقص لاستخراج البند: ' + validation.missing.map(function (m) { return escapeHtml(m.materialName) + ' مطلوب ' + escapeHtml(m.required) + ' والمتاح ' + escapeHtml(m.available); }).join(' / ') + '</span>';
    } else {
      box.innerHTML = 'البند: <b>' + escapeHtml(item.name) + '</b> — سعر السيستم الرسمي: <b>' + accountingMoney(systemPrice) + '</b>. يمكن تعديل سعر هذه الفاتورة فقط.';
    }
    updateAccountingWasteDiff(systemCost);
  }

  function updateAccountingWasteDiff(systemCost) {
    if (systemCost === undefined) systemCost = accountingAutoCostFromSelectedMaterial();
    const sale = numericAmount(($("accDeptLineSalePrice") || {}).value || 0);
    const systemPrice = numericAmount(($("accDeptLineSystemPrice") || {}).value || 0) || accountingSystemPriceForSelectedItem();
    const rawDiff = sale && systemPrice ? (sale - systemPrice) : 0;
    const diff = Math.abs(rawDiff);
    if ($("accDeptLinePriceDiff")) $("accDeptLinePriceDiff").value = diff ? diff.toFixed(2) : "";
    const damage = numericAmount(($("accDeptLineDamageCost") || {}).value || 0);
    const coveredManual = numericAmount(($("accDeptLineDamageCovered") || {}).value || 0);
    const autoCover = rawDiff > 0 ? rawDiff : 0;
    const covered = coveredManual || autoCover;
    const rem = Math.max(0, damage - covered);
    if ($("accDeptLineDamageCovered") && autoCover && !coveredManual) $("accDeptLineDamageCovered").value = autoCover.toFixed(2);
    if ($("accDeptLineDamageRemaining")) $("accDeptLineDamageRemaining").value = rem ? rem.toFixed(2) : "";
    const msg = $("accWasteMsg");
    if (msg) {
      const diffText = diff ? (rawDiff > 0 ? "فرق زيادة عن سعر السيستم: " : "فرق نقص عن سعر السيستم: ") + accountingMoney(diff) + ". " : "";
      msg.textContent = diffText + (damage ? ("كان عليه " + accountingMoney(damage) + " / عوض " + accountingMoney(covered) + " / باقي " + accountingMoney(rem)) : "أي تعديل عن سعر السيستم يتسجل في هوالك القسم، ولا يغير السعر في قاعدة البيانات.");
    }
  }

  function finalProductSelectChanged() {
    const raw = (($("accFinalProductSelect") || {}).value || "").trim();
    if (!raw) return;
    let name = raw;
    let materialName = raw;
    if (raw.indexOf("TPL|") === 0) {
      const tpl = accountingTplByName(raw.slice(4));
      if (tpl) { name = templateItemName(tpl); materialName = templateMaterialName(tpl); }
    } else if (raw.indexOf("MAT|") === 0) {
      const mat = materialByName(raw.slice(4));
      if (mat) { name = mat.materialName || mat["اسم الخامة"] || raw.slice(4); materialName = name; }
    }
    if ($("accFinalManualDescription")) $("accFinalManualDescription").value = name;
    const validation = collectMaterialRequirements(materialName, 1).filter(function (x) { return x.missing; });
    if (validation.length) setMsg("accountingMsg", "لا يمكن استخراج " + name + " لأن في باند ناقص: " + validation.map(function (m) { return m.materialName + " مطلوب " + m.required + " والمتاح " + m.available; }).join(" / "), true);
    else setMsg("accountingMsg", "تم اختيار بند محفوظ من مطبخ الحسابات. اكتبي قيمة البيع النهائية أو استدعي أجزاء وائل وجابر.", false);
  }

  const saveAccountingDeptLineBeforePatch18 = saveAccountingDeptLine;
  async function saveAccountingDeptLine() {
    if (!accountingCanEnterDeptLine()) return;
    const item = accountingSelectedCatalogItem();
    if (isAccountingOperatorMode() && !item) {
      setMsg("accountingMsg", "اختار بند محفوظ من مطبخ الحسابات قبل حفظ فاتورة القسم.", true);
      return;
    }
    if (item && $("accDeptLineItemName")) $("accDeptLineItemName").value = item.name;
    const orderId = (($("accDeptLineOrderId") || {}).value || "").trim();
    const itemName = (($("accDeptLineItemName") || {}).value || (item && item.name) || "").trim();
    if (!orderId || !itemName) { setMsg("accountingMsg", "رقم الأوردر واسم البند مطلوبين لتسجيل فاتورة القسم.", true); return; }
    const validation = validateSelectedMaterialAvailability();
    if (!validation.ok) {
      setMsg("accountingMsg", "لا يمكن حفظ الفاتورة. في باند ناقص لاستخراج المنتج: " + validation.missing.map(function (m) { return m.materialName + " مطلوب " + m.required + " والمتاح " + m.available; }).join(" / "), true);
      return;
    }
    try {
      if (currentAccountingMode() === "laser" && $("accSmartWidth") && numericAmount(($("accSmartWidth") || {}).value)) {
        calculateSmartAccountingCost(false); if (state.accounting.smartCalc && state.accounting.smartCalc.totalCost > 0) applySmartAccountingCost();
      } else if (isAccountingOperatorMode()) accountingAutoCostFromSelectedMaterial();
      else if (!numericAmount(($("accDeptLineMaterialCost") || {}).value || 0) && $("accSmartWidth") && $("accSmartHeight")) { calculateSmartAccountingCost(false); if (state.accounting.smartCalc && state.accounting.smartCalc.totalCost > 0) applySmartAccountingCost(); }
      updateAccountingWasteDiff();
      const damageCost = ($("accDeptLineDamageCost") || {}).value || "";
      const damageCovered = ($("accDeptLineDamageCovered") || {}).value || "";
      const damageRemaining = ($("accDeptLineDamageRemaining") || {}).value || "";
      const priceDiff = ($("accDeptLinePriceDiff") || {}).value || "";
      const systemPrice = ($("accDeptLineSystemPrice") || {}).value || "";
      const baseNotes = ($("accDeptLineNotes") || {}).value || "";
      const diffNote = numericAmount(priceDiff) ? ("\n[فرق سعر الفاتورة عن السيستم] سعر السيستم: " + systemPrice + " / السعر المسجل: " + (($("accDeptLineSalePrice") || {}).value || "0") + " / الفرق للهوالك: " + priceDiff) : "";
      const damageNote = numericAmount(damageCost) ? ("\n[تعويض تالف] كان عليه: " + damageCost + " / عوض: " + damageCovered + " / باقي: " + damageRemaining) : "";
      const selectedMaterialName = item ? (item.materialName || item.name) : (($("accDeptLineMaterial") || {}).value || "");
      const res = await api("saveAccountingDeptLine", authParams({
        orderId: orderId,
        lineId: ($("accDeptLineLineId") || {}).value,
        customerName: ($("accDeptLineCustomer") || {}).value,
        department: ($("accDeptLineDepartment") || {}).value,
        itemType: ($("accDeptLineType") || {}).value,
        itemName: itemName,
        qty: ($("accDeptLineQty") || {}).value,
        materialName: selectedMaterialName,
        materialQty: ($("accDeptLineMaterialQty") || {}).value,
        materialCost: ($("accDeptLineMaterialCost") || {}).value,
        laborCost: ($("accDeptLineLaborCost") || {}).value,
        otherCost: ($("accDeptLineOtherCost") || {}).value,
        systemCost: numericAmount(($("accDeptLineMaterialCost") || {}).value || 0) + numericAmount(($("accDeptLineLaborCost") || {}).value || 0) + numericAmount(($("accDeptLineOtherCost") || {}).value || 0),
        systemSalePrice: systemPrice,
        priceDiff: priceDiff,
        damageCost: damageCost,
        damageCovered: damageCovered,
        damageRemaining: damageRemaining,
        salePrice: ($("accDeptLineSalePrice") || {}).value,
        notes: baseNotes + diffNote + damageNote
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم تسجيل فاتورة القسم." : "فشل الحفظ."), !res.success);
      if (res.success) {
        ["accDeptLineLineId", "accDeptLineItemName", "accDeptLineMaterialQty", "accDeptLineMaterialCost", "accDeptLineLaborCost", "accDeptLineOtherCost", "accDeptLineSalePrice", "accDeptLineSystemPrice", "accDeptLineNotes", "accDeptLineDamageCost", "accDeptLineDamageCovered", "accDeptLineDamageRemaining", "accDeptLinePriceDiff"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        if ($("accDeptLineMaterial")) $("accDeptLineMaterial").value = "";
        await loadAccountingData(true);
      }
    } catch (err) { setMsg("accountingMsg", err.message || "خطأ في تسجيل فاتورة القسم.", true); }
  }

  const saveAccountingMaterialBeforePatch18 = saveAccountingMaterial;
  async function saveAccountingMaterial() {
    if (!accountingCanManageMaterials()) return;
    const name = (($("accMaterialName") || {}).value || "").trim();
    if (!name) { setMsg("accountingMsg", "اكتب اسم الخامة أو البند المسعر.", true); return; }
    const kind = (($("accMaterialKind") || {}).value || "raw");
    let calc = { total: numericAmount(($("accMaterialUnitCost") || {}).value || 0), lines: [] };
    if (kind === "composite") calc = calculateMaterialRecipeCost(true);
    const comps = kind === "composite" ? collectMaterialRecipeComponents() : [];
    try {
      const res = await api("saveAccountingMaterial", authParams({
        department: ($("accMaterialDepartment") || {}).value,
        materialName: name,
        materialKind: kind,
        unit: ($("accMaterialUnit") || {}).value,
        stockQty: ($("accMaterialStockQty") || {}).value,
        minStock: ($("accMaterialMinStock") || {}).value,
        unitCost: calc.total || ($("accMaterialUnitCost") || {}).value,
        calculatedUnitCost: calc.total || ($("accMaterialUnitCost") || {}).value,
        salePrice: ($("accMaterialSalePrice") || {}).value,
        width: ($("accMaterialWidth") || {}).value,
        height: ($("accMaterialHeight") || {}).value,
        wastePercent: ($("accMaterialWaste") || {}).value,
        componentsJson: JSON.stringify(comps),
        formula: comps.map(function (c) { return (c.materialName || "تكلفة") + " × " + (c.qty || 0) + (c.extraCost ? (" + " + c.extraCost) : ""); }).join(" + "),
        notes: ($("accMaterialNotes") || {}).value,
        active: "نعم"
      }));
      setMsg("accountingMsg", res.message || (res.success ? "تم حفظ البند في مطبخ الحسابات." : "فشل الحفظ."), !res.success);
      if (res.success) {
        ["accMaterialName", "accMaterialUnitCost", "accMaterialSalePrice", "accMaterialWidth", "accMaterialHeight", "accMaterialWaste", "accMaterialNotes", "accMaterialUnit", "accMaterialStockQty", "accMaterialMinStock"].forEach(function (id) { const el = $(id); if (el) el.value = ""; });
        if ($("accMaterialKind")) $("accMaterialKind").value = "raw";
        setMaterialRecipeComponents([]);
        if ($("accMaterialRecipeResult")) $("accMaterialRecipeResult").innerHTML = "تم الحفظ. البند هيظهر تلقائيًا في فواتير الموظفين.";
        await loadAccountingData(true);
      }
    } catch (err) { setMsg("accountingMsg", err.message || "خطأ في حفظ مطبخ الحسابات.", true); }
  }



  const applySmartAccountingCostBeforePatch18 = applySmartAccountingCost;
  function applySmartAccountingCost() {
    const calc = calculateSmartAccountingCost(true);
    if (!calc) return;
    if ($("accDeptLineQty") && $("accSmartQty")) $("accDeptLineQty").value = $("accSmartQty").value || $("accDeptLineQty").value;
    if ($("accDeptLineMaterialQty")) $("accDeptLineMaterialQty").value = calc.materialQty ? calc.materialQty.toFixed(4) : "";
    if ($("accDeptLineMaterialCost")) $("accDeptLineMaterialCost").value = (calc.materialCost + calc.inkCost).toFixed(2);
    if ($("accDeptLineLaborCost") && calc.labor) $("accDeptLineLaborCost").value = calc.labor.toFixed(2);
    const official = accountingSystemPriceForSelectedItem();
    const systemPrice = official || calc.totalCost;
    accountingSetSystemPriceField(systemPrice);
    if ($("accDeptLineSalePrice") && systemPrice && !numericAmount($("accDeptLineSalePrice").value)) $("accDeptLineSalePrice").value = systemPrice.toFixed(2);
    updateAccountingWasteDiff(calc.totalCost);
    setMsg("accountingMsg", "تم تطبيق حساب AI على فاتورة القسم. يمكن تعديل سعر القطعة لهذه الفاتورة فقط، والفرق يروح في هوالك القسم.", false);
  }



  function accountingMaterialNameForValidationFromSelect(selectId) {
    const raw = ((selectId ? $(selectId) : $("accDeptLineMaterial")) || {}).value || "";
    if (!raw) return "";
    if (raw.indexOf("TPL|") === 0) {
      const tpl = accountingTplByName(raw.slice(4));
      return tpl ? templateMaterialName(tpl) : raw.slice(4);
    }
    if (raw.indexOf("MAT|") === 0) return raw.slice(4);
    return raw;
  }

  function validateSelectedMaterialAvailability() {
    const matName = accountingMaterialNameForValidationFromSelect("accDeptLineMaterial");
    if (!matName) return { ok: true, missing: [] };
    const qty = numericAmount(($("accDeptLineQty") || {}).value || 1) || 1;
    const missing = collectMaterialRequirements(matName, qty).filter(function (x) { return x.missing; });
    if (missing.length) return { ok: false, missing: missing };
    return { ok: true, missing: [] };
  }

  const saveAccountingFinalInvoiceBeforePatch18 = saveAccountingFinalInvoice;
  async function saveAccountingFinalInvoice() {
    const sel = $("accFinalProductSelect");
    const raw = (sel && sel.value || "").trim();
    if (raw) {
      let displayName = raw;
      let matName = raw;
      if (raw.indexOf("TPL|") === 0) {
        const tpl = accountingTplByName(raw.slice(4));
        if (tpl) { displayName = templateItemName(tpl); matName = templateMaterialName(tpl); }
      } else if (raw.indexOf("MAT|") === 0) {
        const mat = materialByName(raw.slice(4));
        if (mat) { displayName = mat.materialName || mat["اسم الخامة"] || raw.slice(4); matName = displayName; }
      }
      const missing = collectMaterialRequirements(matName, 1).filter(function (x) { return x.missing; });
      if (missing.length) {
        setMsg("accountingMsg", "لا يمكن تقفيل الفاتورة. في باند ناقص لاستخراج " + displayName + ": " + missing.map(function (m) { return m.materialName + " مطلوب " + m.required + " والمتاح " + m.available; }).join(" / "), true);
        return;
      }
      if ($("accFinalManualDescription") && !$("accFinalManualDescription").value.trim()) $("accFinalManualDescription").value = displayName;
      const old = sel.value;
      sel.value = "";
      try { return await saveAccountingFinalInvoiceBeforePatch18(); }
      finally { sel.value = old; }
    }
    return saveAccountingFinalInvoiceBeforePatch18();
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
    on("customerGoHomeBtn", "click", function () { state.customerSelectedSection = null; state.customerViewMode = "home"; renderCustomerHome(); });
    on("customerShowOrdersBtn", "click", function () { state.customerViewMode = "orders"; renderCustomerHome(); loadCustomerOrders(); });
    on("customerShowNewOrderBtn", "click", function () { state.customerSelectedSection = null; state.customerViewMode = "newOrder"; if (!state.customerDraft || state.customerDraft.submitted) resetCustomerDraft(); renderCustomerHome(); applyCustomerSelectedSectionToComposer(); });
    on("customerShowDesignerBtn", "click", function () { state.customerViewMode = "designer"; renderCustomerHome(); });
    on("customerUseGpsBtn", "click", requestCustomerGps);
    on("customerRefreshMarketplaceBtn", "click", function () { loadMarketplace(false); });
    on("customerOpenMatbagySheetsBtn", "click", function () { window.open("https://fawakhry.github.io/Matbagy/?from=matbagy-platform", "_blank"); });
    on("remoteFilesBtn", "click", openRemoteFileServer);
    on("matbagySheetsBtn", "click", openMatbagySheetsTool);
    on("matbagyRotetBtn", "click", openMatbagyRotetTool);
    on("matbagyNoteBtn", "click", openMatbagyNotePanel);
    on("accountingBtn", "click", openAccountingPanel);
    on("serverFilesBtn", "click", openLocalFileServer);
    on("customerFastPrintFilesBtn", "click", openCustomerFastPrintFiles);
    on("customerOrderDepartment", "change", function () { updateCustomerPrintOptions(); refreshCustomerPendingPreview(); });
    on("customerOrderFiles", "change", syncCustomerPendingFilesFromInput);
    on("customerOrderDocs", "change", syncCustomerPendingFilesFromInput);
    on("customerOrderItem", "input", refreshCustomerPendingPreview);
    on("customerOrderNotes", "input", refreshCustomerPendingPreview);
    on("customerOrderQty", "input", refreshCustomerPendingPreview);
    on("customerHeatPress", "change", refreshCustomerPendingPreview);
    on("customerFlyPrint", "change", refreshCustomerPendingPreview);
    on("customerCreateOrderBtn", "click", createCustomerPortalOrder);
    on("customerAddDraftItemBtn", "click", addCustomerDraftItem);
    on("customerSubmitDraftBtn", "click", submitCustomerDraft);
    on("customerResetDraftBtn", "click", startNewCustomerDraft);
    on("customerBackFromChatBtn", "click", function () { state.customerSelectedSection = null; state.customerViewMode = "home"; renderCustomerHome(); });
    on("copyCustomerSeparatorBtn", "click", copyCustomerSeparator);
    on("customerChangePassBtn", "click", openCustomerPasswordModal);
    on("customerCancelPassBtn", "click", closeCustomerPasswordModal);
    on("customerSavePassBtn", "click", changeCustomerPassword);
    on("customerImageCloseBtn", "click", closeCustomerImageViewer);
    on("customerImagePrevBtn", "click", function () { moveCustomerImageViewer(-1); });
    on("customerImageNextBtn", "click", function () { moveCustomerImageViewer(1); });
    on("customerImageDeleteBtn", "click", deleteCurrentPendingImage);
    on("uploadPlatformAdBtn", "click", uploadPlatformAd);
    on("refreshPlatformAdsBtn", "click", function () { loadPlatformAds(true); });
    on("visitorPreviewBtn", "click", openVisitorPreview);
    on("createDemoCustomerBtn", "click", ensureDemoCustomer);
    bindPlatformAdEditor();
    on("saveServiceRouteBtn", "click", saveServiceRoute);
    on("refreshServiceRoutesBtn", "click", function () { loadServiceRoutes(true); });
    on("saveMarketVendorBtn", "click", saveMarketplaceVendor);
    on("saveMarketProductBtn", "click", saveMarketplaceProduct);
    on("refreshMarketplaceBtn", "click", function () { loadMarketplace(true); });
    on("routeServiceSelect", "change", function () {
      const service = selectedRouteServiceName();
      const manual = $("routeServiceName");
      if (manual && !manual.value.trim()) manual.placeholder = service || "اسم خدمة يدوي";
    });

    $("loginBtn").addEventListener("click", doLogin);
    $("password").addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
    $("username").addEventListener("keydown", function (e) { if (e.key === "Enter") $("password").focus(); });

    $("refreshBtn").addEventListener("click", hardRefreshMainScreen);
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
    const proofTextButton = $("insertProofTextBtn");
    if (proofTextButton) proofTextButton.addEventListener("click", insertProofReviewText);

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

    const savePlatformSectionButton = $("savePlatformSectionBtn");
    if (savePlatformSectionButton) savePlatformSectionButton.addEventListener("click", savePlatformSection);
    const refreshPlatformSectionsButton = $("refreshPlatformSectionsBtn");
    if (refreshPlatformSectionsButton) refreshPlatformSectionsButton.addEventListener("click", function () { loadPlatformSections(true); });
    const saveFranchiseBranchButton = $("saveFranchiseBranchBtn");
    if (saveFranchiseBranchButton) saveFranchiseBranchButton.addEventListener("click", saveFranchiseBranch);
    const refreshFranchiseBranchesButton = $("refreshFranchiseBranchesBtn");
    if (refreshFranchiseBranchesButton) refreshFranchiseBranchesButton.addEventListener("click", function () { loadFranchiseBranches(true); });
    const assignCustomerBranchButton = $("assignCustomerBranchBtn");
    if (assignCustomerBranchButton) assignCustomerBranchButton.addEventListener("click", assignCustomerToBranch);

    const saveWhiteLabelButton = $("saveWhiteLabelBtn");
    if (saveWhiteLabelButton) saveWhiteLabelButton.addEventListener("click", saveWhiteLabelSettings);
    const refreshWhiteLabelButton = $("refreshWhiteLabelBtn");
    if (refreshWhiteLabelButton) refreshWhiteLabelButton.addEventListener("click", function () { loadWhiteLabelSettings(true); });
    const loadPhoneLeadsButton = $("loadPhoneLeadsBtn");
    if (loadPhoneLeadsButton) loadPhoneLeadsButton.addEventListener("click", loadPhoneLeads);
    const copyPhoneLeadsButton = $("copyPhoneLeadsBtn");
    if (copyPhoneLeadsButton) copyPhoneLeadsButton.addEventListener("click", copyPhoneLeads);
    const downloadPhoneLeadsButton = $("downloadPhoneLeadsBtn");
    if (downloadPhoneLeadsButton) downloadPhoneLeadsButton.addEventListener("click", downloadPhoneLeadsCsv);
    const copyInviteButton = $("copyCustomerInviteLinksBtn");
    if (copyInviteButton) copyInviteButton.addEventListener("click", copyCustomerInviteLinks);

    const saveKnowledgeButton = $("saveKnowledgeBtn");
    if (saveKnowledgeButton) saveKnowledgeButton.addEventListener("click", saveKnowledge);
    const newKnowledgeButton = $("newKnowledgeBtn");
    if (newKnowledgeButton) newKnowledgeButton.addEventListener("click", clearKnowledgeForm);
    const refreshKnowledgeButton = $("refreshKnowledgeBtn");
    if (refreshKnowledgeButton) refreshKnowledgeButton.addEventListener("click", function () { loadKnowledge(true); });
    const knowledgeSearch = $("knowledgeSearch");
    if (knowledgeSearch) knowledgeSearch.addEventListener("input", renderKnowledge);

    on("closeAccountingBtn", "click", closeAccountingPanel);
    on("refreshAccountingBtn", "click", function () { loadAccountingData(true); });
    on("initAccountingBtn", "click", initAccountingSheets);
    on("saveAccountingMaterialBtn", "click", saveAccountingMaterial);
    on("saveAccountingTemplateBtn", "click", saveAccountingTemplate);
    on("saveAccountingDeptLineBtn", "click", saveAccountingDeptLine);
    on("loadAccountingOrderLinesBtn", "click", loadAccountingOrderLinesFromLocal);
    on("saveAccountingFinalInvoiceBtn", "click", saveAccountingFinalInvoice);
    on("calcSmartAccountingBtn", "click", function () { calculateSmartAccountingCost(true); });
    on("applySmartAccountingCalcBtn", "click", applySmartAccountingCost);
    on("accSmartPreset", "change", accountingSmartPresetChanged);
    ["accSmartMode", "accSmartWidth", "accSmartHeight", "accSmartQty", "accSmartWaste", "accSmartRawCost", "accSmartRawWidth", "accSmartRawHeight", "accSmartRawHeightUnit", "accSmartInkCostM2", "accSmartLabor", "accDeptLineItemName"].forEach(function (id) { on(id, "input", function () { calculateSmartAccountingCost(false); }); on(id, "change", function () { calculateSmartAccountingCost(false); }); });
    ["accFinalDiscount", "accFinalPaid", "accFinalManualAmount"].forEach(function (id) { on(id, "input", updateAccountingFinalTotals); });
    on("accDeptLineDepartment", "change", function () { syncAccountingMaterialOptions(); calculateSmartAccountingCost(false); });
    on("accDeptLineMaterial", "change", function () { accountingSmartFillFromMaterial(true); accountingAutoCostFromSelectedMaterial(); calculateSmartAccountingCost(false); updateOperatorAutoCostMessage(); });
    on("accDeptLineQty", "input", function () { if ($("accSmartQty")) $("accSmartQty").value = ($("accDeptLineQty") || {}).value || 1; accountingAutoCostFromSelectedMaterial(); calculateSmartAccountingCost(false); updateOperatorAutoCostMessage(); });
    ["accDeptLineSalePrice", "accDeptLineDamageCost", "accDeptLineDamageCovered"].forEach(function (id) { on(id, "input", function () { updateAccountingWasteDiff(); }); });
    on("accFinalProductSelect", "change", finalProductSelectChanged);

    on("closeMatbagyNoteBtn", "click", closeMatbagyNotePanel);
    on("saveMatbagyNoteBtn", "click", saveMatbagyNoteLocal);
    on("clearMatbagyNoteBtn", "click", clearMatbagyNoteForm);
    on("exportMatbagyNotesBtn", "click", exportMatbagyNotesLocal);
    on("calcAccountingMaterialRecipeBtn", "click", function () { calculateMaterialRecipeCost(true); });
    on("recalcAccountingMaterialsBtn", "click", recalculateAccountingMaterialsPatch15);
    on("accMaterialKind", "change", function () { calculateMaterialRecipeCost(false); });
    ["accRecipeMaterial1", "accRecipeMaterial2", "accRecipeMaterial3", "accRecipeMaterial4", "accRecipeQty1", "accRecipeQty2", "accRecipeQty3", "accRecipeQty4", "accRecipeExtra1", "accRecipeExtra2", "accRecipeExtra3", "accRecipeExtra4"].forEach(function (id) {
      on(id, "input", function () { calculateMaterialRecipeCost(false); });
      on(id, "change", function () { calculateMaterialRecipeCost(false); });
    });

    wireCustomerSearch();
    wireTableCustomerSearch();
  }



  /*********************** Patch 19 - تشغيل نهائي: نوت متحركة + شيتات SSO + EasyStore + فاتورة للعميل ***********************/

  function patch19UserMode() {
    const u = state.user || {};
    const key = normalizeArabic([u.username, u.name, u.role, u.department].join(" "));
    if (key.indexOf("ضياء") !== -1 || key.indexOf("diaa") !== -1 || key.indexOf("admin") !== -1 || key.indexOf("ادارة") !== -1 || key.indexOf("إدارة") !== -1) return "admin";
    if (key.indexOf("رحمه") !== -1 || key.indexOf("رحمة") !== -1 || key.indexOf("rahma") !== -1 || key.indexOf("ريفان") !== -1 || key.indexOf("ريڤان") !== -1 || key.indexOf("revan") !== -1 || key.indexOf("rivan") !== -1) return "final";
    if (key.indexOf("جابر") !== -1 || key.indexOf("gaber") !== -1 || key.indexOf("jaber") !== -1 || key.indexOf("laser") !== -1 || key.indexOf("ليزر") !== -1) return "laser";
    if (key.indexOf("وائل") !== -1 || key.indexOf("wael") !== -1 || key.indexOf("print") !== -1 || key.indexOf("طباعة") !== -1) return "print";
    return "employee";
  }

  function patch19RoleDepartment(mode) {
    mode = mode || patch19UserMode();
    if (mode === "print") return "طباعة";
    if (mode === "laser") return "ليزر";
    if (mode === "final") return "تقفيل";
    if (mode === "admin") return "إدارة";
    return "موظف";
  }

  function patch19CanSeeNote(row) {
    const cat = text(row.category || row["القسم"] || "الجميع");
    const by = normalizeArabic(row.by || row["حفظ بواسطة"] || "");
    const u = state.user || {};
    const me = normalizeArabic(u.username || u.name || "");
    const mode = patch19UserMode();
    if (!cat || cat === "عام" || cat === "الجميع") return true;
    if (cat === "نوت خاصة بي") return by && me && (by === me || by.indexOf(me) !== -1 || me.indexOf(by) !== -1);
    if (mode === "admin") return true;
    if (cat === "قسم الطباعة") return mode === "print";
    if (cat === "قسم الليزر") return mode === "laser";
    if (cat === "رحمة وريفان") return mode === "final";
    return true;
  }

  function renderMatbagyNotesLocal() {
    const list = $("matbagyNotesList");
    if (!list) return;
    const rows = (state.matbagyNotes || loadMatbagyNotesLocal() || []).filter(patch19CanSeeNote);
    if (!rows.length) {
      list.innerHTML = '<div class="dash-empty compact-note-empty">لا توجد نوتات ظاهرة لك.</div>';
      return;
    }
    list.innerHTML = rows.slice(0, 40).map(function (r, i) {
      const cat = escapeHtml(r.category || "الجميع");
      const content = escapeHtml(r.content || r.note || "");
      const by = escapeHtml(r.by || "");
      const time = escapeHtml(r.time || "");
      return '<div class="matbagy-note-item patch19-note-item">' +
        '<div class="note-item-head"><span>' + cat + '</span><button type="button" class="ghost small-note-delete" data-note-index="' + i + '">حذف</button></div>' +
        '<p>' + content + '</p>' +
        '<small>' + by + (time ? ' • ' + time : '') + '</small>' +
      '</div>';
    }).join("");
    list.querySelectorAll(".small-note-delete").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = Number(btn.getAttribute("data-note-index"));
        const all = loadMatbagyNotesLocal();
        const visible = all.filter(patch19CanSeeNote);
        const target = visible[idx];
        const next = all.filter(function (x) { return x !== target; });
        state.matbagyNotes = next;
        saveMatbagyNotesLocal(next);
        renderMatbagyNotesLocal();
      });
    });
  }

  function patch19NotePositionKey() {
    const u = state.user || {};
    return "matbagy_note_position_patch19_" + (u.username || u.name || "employee");
  }

  function patch19ClampNotePosition(left, top) {
    const card = document.querySelector("#matbagyNoteModal .matbagy-note-card");
    if (!card) return { left: left || 20, top: top || 80 };
    const margin = 8;
    const width = card.offsetWidth || 390;
    const height = card.offsetHeight || 520;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - Math.min(height, window.innerHeight - margin * 2) - margin);
    return {
      left: Math.min(Math.max(margin, Number(left) || margin), maxLeft),
      top: Math.min(Math.max(margin, Number(top) || margin), maxTop)
    };
  }

  function patch19ApplyNotePosition(pos) {
    const card = document.querySelector("#matbagyNoteModal .matbagy-note-card");
    if (!card) return;
    const p = patch19ClampNotePosition(pos && pos.left, pos && pos.top);
    card.style.left = p.left + "px";
    card.style.top = p.top + "px";
    card.style.right = "auto";
  }

  function patch19RestoreNotePosition() {
    const card = document.querySelector("#matbagyNoteModal .matbagy-note-card");
    if (!card) return;
    try {
      const saved = JSON.parse(localStorage.getItem(patch19NotePositionKey()) || "null");
      if (saved) { patch19ApplyNotePosition(saved); return; }
    } catch (e) {}
    const defaultLeft = Math.max(12, window.innerWidth - (card.offsetWidth || 390) - 24);
    patch19ApplyNotePosition({ left: defaultLeft, top: 88 });
  }

  function patch19MakeNoteDraggable() {
    const dock = $("matbagyNoteModal");
    const card = dock && dock.querySelector(".matbagy-note-card");
    if (!dock || !card || dock.dataset.patch19Drag === "1") return;
    dock.dataset.patch19Drag = "1";
    const handle = dock.querySelector(".matbagy-note-drag-handle") || card;
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function down(ev) {
      const target = ev.target;
      if (target && target.closest && target.closest("button,input,select,textarea,.matbagy-notes-list")) return;
      const p = ev.touches ? ev.touches[0] : ev;
      if (!p) return;
      const rect = card.getBoundingClientRect();
      dragging = true;
      offsetX = p.clientX - rect.left;
      offsetY = p.clientY - rect.top;
      card.classList.add("dragging");
      card.style.left = rect.left + "px";
      card.style.top = rect.top + "px";
      card.style.right = "auto";
      ev.preventDefault && ev.preventDefault();
    }
    function move(ev) {
      if (!dragging) return;
      const p = ev.touches ? ev.touches[0] : ev;
      if (!p) return;
      patch19ApplyNotePosition({ left: p.clientX - offsetX, top: p.clientY - offsetY });
      ev.preventDefault && ev.preventDefault();
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("dragging");
      const rect = card.getBoundingClientRect();
      try { localStorage.setItem(patch19NotePositionKey(), JSON.stringify({ left: rect.left, top: rect.top })); } catch (e) {}
    }
    handle.addEventListener("mousedown", down);
    handle.addEventListener("touchstart", down, { passive: false });
    window.addEventListener("mousemove", move, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    window.addEventListener("resize", patch19RestoreNotePosition);
  }

  function openMatbagyNotePanel() {
    if (!employeeCanOpenMatbagyNote()) { alert("نوت مطبعجي متاحة للموظفين فقط."); return; }
    const modal = $("matbagyNoteModal");
    if (!modal) { alert("شاشة نوت مطبعجي غير موجودة. ارفع index.html و app.js معًا من Patch 19."); return; }
    modal.classList.remove("hidden");
    patch19MakeNoteDraggable();
    patch19RestoreNotePosition();
    renderMatbagyNotesLocal();
    loadMatbagyNotesServer();
    setTimeout(function () { const t = $("matbagyNoteContent"); if (t) t.focus(); }, 80);
  }

  function clearMatbagyNoteForm() {
    const t = $("matbagyNoteContent"); if (t) t.value = "";
    const title = $("matbagyNoteTitle"); if (title) title.value = "نوت مطبعجي";
    setMsg("matbagyNoteMsg", "", false);
  }

  async function saveMatbagyNoteLocal() {
    const content = (($("matbagyNoteContent") || {}).value || "").trim();
    const category = (($("matbagyNoteCategory") || {}).value || "الجميع").trim();
    const title = "نوت مطبعجي - " + category;
    if (!content) { setMsg("matbagyNoteMsg", "اكتب النوت الأول.", true); return; }
    try {
      const res = await api("saveMatbagyNote", authParams({ title: title, content: content, category: category }));
      if (!res || !res.success) throw new Error((res && res.message) || "تعذر حفظ النوت على السيرفر.");
      clearMatbagyNoteForm();
      setMsg("matbagyNoteMsg", res.message || "تم حفظ النوت.", false);
      await loadMatbagyNotesServer();
    } catch (err) {
      const u = state.user || {};
      const rows = loadMatbagyNotesLocal();
      rows.unshift({ title: title, content: content, category: category, by: u.username || u.name || "موظف", time: new Date().toLocaleString("ar-EG") });
      state.matbagyNotes = rows;
      saveMatbagyNotesLocal(rows);
      clearMatbagyNoteForm();
      renderMatbagyNotesLocal();
      setMsg("matbagyNoteMsg", "تم حفظ النوت محليًا. راجع Deploy لو عايزها تظهر لكل الموظفين.", true);
    }
  }

  function patch19OpenEmployeeTool(baseUrl, windowName, label, extraParams) {
    const base = text(baseUrl || "").trim();
    if (!base) { alert("رابط " + label + " غير مضبوط في config.js"); return; }
    if (!isEmployeeLoggedIn()) { alert("سجل دخول الموظف الأول."); return; }
    const u = state.user || {};
    const params = Object.assign({
      from: "trendos",
      sso: "1",
      skipLogin: "1",
      noPassword: "1",
      username: u.username || u.name || "",
      name: u.name || u.username || "",
      token: u.token || "",
      roleMode: patch19UserMode(),
      department: patch19RoleDepartment()
    }, extraParams || {});
    try {
      localStorage.setItem("MATBAGY_EMPLOYEE_SSO", JSON.stringify({ at: Date.now(), user: u, params: params }));
    } catch (e) {}
    window.open(withQuery(base, params), windowName || "Matbagy_Tool");
  }

  function openMatbagySheetsTool() {
    patch19OpenEmployeeTool(window.MATBAGY_SHEETS_URL, "Matbagy_Sheets", "مطبعجي شيتات", { tool: "sheets" });
  }

  function patch19OpenEasyStoreAccounting() {
    const mode = currentAccountingMode ? currentAccountingMode() : patch19UserMode();
    const url = text(window.MATBAGY_EASY_STORE_URL || "").trim();
    if (!url) {
      alert("رابط Easy Store غير مضبوط في config.js");
      return;
    }
    patch19OpenEmployeeTool(url, "Matbagy_EasyStore_Accounting", "إيزي ستور الحسابات", {
      module: "accounting",
      screen: mode === "full" || mode === "admin" ? "kitchen" : (mode === "final" ? "final_invoice" : "dept_invoice"),
      mode: mode,
      hideCosts: (mode === "print" || mode === "laser") ? "1" : "0",
      laserAi: mode === "laser" ? "1" : "0",
      finalInvoice: mode === "final" ? "1" : "0",
      wasteByDepartment: "1"
    });
  }

  function openAccountingPanel() {
    patch19OpenEasyStoreAccounting();
  }

  function patch19Money(n) {
    n = numericAmount(n);
    return n ? n.toLocaleString("ar-EG", { maximumFractionDigits: 2 }) + " ج" : "0 ج";
  }

  function patch19InvoiceDataForOrder(row) {
    row = row || {};
    const orderId = text(row.orderId || "");
    const acc = state.accounting || {};
    const finals = (acc.finalInvoices || []).filter(function (x) { return text(x.orderId || x["رقم الأوردر"]) === orderId; });
    const finalInvoice = finals.length ? finals[finals.length - 1] : null;
    const lines = (acc.deptLines || []).filter(function (x) { return text(x.orderId || x["رقم الأوردر"]) === orderId; });
    const items = [];
    lines.forEach(function (x) {
      items.push({
        name: x.itemName || x["اسم البند"] || "بند",
        qty: numericAmount(x.qty || x["الكمية"] || 1) || 1,
        amount: numericAmount(x.salePrice || x["سعر البيع"] || 0),
        dept: x.department || x["القسم"] || ""
      });
    });
    const manualName = finalInvoice && (finalInvoice["بند يدوي"] || finalInvoice.manualDescription);
    const manualAmount = finalInvoice && numericAmount(finalInvoice["قيمة بند يدوي"] || finalInvoice.manualAmount || 0);
    if (manualName || manualAmount) items.push({ name: manualName || "بند يدوي", qty: 1, amount: manualAmount, dept: "نهائي" });
    const subtotal = finalInvoice ? numericAmount(finalInvoice.finalTotal || finalInvoice["الإجمالي النهائي"] || 0) : items.reduce(function (s, x) { return s + numericAmount(x.amount); }, 0);
    const paid = finalInvoice ? numericAmount(finalInvoice.paid || finalInvoice["المدفوع"] || 0) : 0;
    const remaining = finalInvoice ? numericAmount(finalInvoice.remaining || finalInvoice["الباقي"] || Math.max(0, subtotal - paid)) : Math.max(0, subtotal - paid);
    return {
      orderId: orderId,
      invoiceNo: finalInvoice ? (finalInvoice.invoiceNo || finalInvoice["رقم الفاتورة"] || "") : "مسودة-" + orderId,
      customer: (finalInvoice && (finalInvoice.customerName || finalInvoice["اسم العميل"])) || row.customer || row.customerName || "عميل مطبعجي",
      phone: row.customerPhone || "",
      status: (finalInvoice && (finalInvoice.status || finalInvoice["الحالة"])) || row.status || "",
      items: items.length ? items : [{ name: row.work || row.item || "خدمة مطبعجي", qty: 1, amount: 0, dept: row.department || "" }],
      subtotal: subtotal,
      paid: paid,
      remaining: remaining
    };
  }

  function patch19InvoiceText(row) {
    const inv = patch19InvoiceDataForOrder(row);
    const lines = [
      "فاتورة مطبعجي",
      "رقم الفاتورة: " + inv.invoiceNo,
      "رقم الأوردر: " + inv.orderId,
      "العميل: " + inv.customer,
      "--------------------"
    ];
    inv.items.forEach(function (x, i) { lines.push((i + 1) + ") " + x.name + " × " + x.qty + " = " + patch19Money(x.amount)); });
    lines.push("--------------------");
    lines.push("الإجمالي: " + patch19Money(inv.subtotal));
    lines.push("المدفوع: " + patch19Money(inv.paid));
    lines.push("الباقي: " + patch19Money(inv.remaining));
    return lines.join("\n");
  }

  async function patch19EnsureAccountingLoaded() {
    if (state.accounting && ((state.accounting.finalInvoices || []).length || (state.accounting.deptLines || []).length)) return;
    try { await loadAccountingData(true); } catch (e) {}
  }

  function patch19PrintableInvoiceHtml(row) {
    const inv = patch19InvoiceDataForOrder(row);
    const tr = inv.items.map(function (x, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(x.name) + '</td><td>' + escapeHtml(x.dept || '') + '</td><td>' + escapeHtml(x.qty) + '</td><td>' + escapeHtml(patch19Money(x.amount)) + '</td></tr>';
    }).join('');
    return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة ' + escapeHtml(inv.invoiceNo) + '</title>' +
      '<style>body{font-family:Tahoma,Arial,sans-serif;background:#f4f7f6;margin:0;padding:24px;color:#0f172a}.invoice{max-width:760px;margin:auto;background:#fff;border-radius:24px;padding:28px;box-shadow:0 12px 38px #0002}.head{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #0f8f78;padding-bottom:16px;margin-bottom:18px}.brand{font-size:28px;font-weight:900;color:#0f766e}.badge{background:#ecfdf5;border:1px solid #99f6e4;border-radius:999px;padding:8px 14px;font-weight:800}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #dbe7e4;padding:10px;text-align:right}th{background:#ecfdf5;color:#065f46}.totals{margin-top:18px;display:grid;gap:8px;max-width:320px;margin-right:auto}.totals div{display:flex;justify-content:space-between;border:1px solid #dbe7e4;border-radius:12px;padding:10px}.total{background:#0f8f78;color:#fff;font-weight:900}@media print{body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0}}</style></head><body>' +
      '<div class="invoice"><div class="head"><div><div class="brand">مطبعجي</div><div>فاتورة عميل</div></div><div class="badge">' + escapeHtml(inv.invoiceNo) + '</div></div>' +
      '<p><b>رقم الأوردر:</b> ' + escapeHtml(inv.orderId) + '</p><p><b>العميل:</b> ' + escapeHtml(inv.customer) + '</p><p><b>التاريخ:</b> ' + new Date().toLocaleString("ar-EG") + '</p>' +
      '<table><thead><tr><th>#</th><th>البند</th><th>القسم</th><th>الكمية</th><th>القيمة</th></tr></thead><tbody>' + tr + '</tbody></table>' +
      '<div class="totals"><div class="total"><span>الإجمالي</span><b>' + escapeHtml(patch19Money(inv.subtotal)) + '</b></div><div><span>المدفوع</span><b>' + escapeHtml(patch19Money(inv.paid)) + '</b></div><div><span>الباقي</span><b>' + escapeHtml(patch19Money(inv.remaining)) + '</b></div></div>' +
      '<p style="margin-top:22px;color:#64748b">شكراً لاختياركم مطبعجي.</p></div><script>setTimeout(function(){window.print()},450)</script></body></html>';
  }

  async function patch19OpenInvoicePdf(row) {
    await patch19EnsureAccountingLoaded();
    const html = patch19PrintableInvoiceHtml(row);
    const w = window.open("", "Matbagy_Customer_Invoice");
    if (!w) { alert("اسمح بفتح النوافذ المنبثقة لطباعة الفاتورة PDF."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  async function patch19DownloadInvoiceImage(row) {
    await patch19EnsureAccountingLoaded();
    const inv = patch19InvoiceDataForOrder(row);
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = Math.max(900, 520 + inv.items.length * 70);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#0f766e"; ctx.fillRect(0,0,canvas.width,130);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 44px Arial"; ctx.textAlign = "right"; ctx.fillText("فاتورة مطبعجي", 1120, 78);
    ctx.fillStyle = "#0f172a"; ctx.font = "28px Arial";
    let y = 180;
    ctx.fillText("رقم الفاتورة: " + inv.invoiceNo, 1120, y); y += 45;
    ctx.fillText("رقم الأوردر: " + inv.orderId, 1120, y); y += 45;
    ctx.fillText("العميل: " + inv.customer, 1120, y); y += 60;
    ctx.strokeStyle = "#d1e4df"; ctx.lineWidth = 2; ctx.strokeRect(70, y - 35, 1060, 50);
    ctx.font = "bold 24px Arial"; ctx.fillText("البند", 1040, y); ctx.fillText("الكمية", 360, y); ctx.fillText("القيمة", 190, y); y += 55;
    ctx.font = "24px Arial";
    inv.items.forEach(function (x) { ctx.fillText(String(x.name).slice(0,45), 1040, y); ctx.fillText(String(x.qty), 360, y); ctx.fillText(patch19Money(x.amount), 190, y); y += 52; });
    y += 25; ctx.fillStyle = "#0f766e"; ctx.font = "bold 30px Arial"; ctx.fillText("الإجمالي: " + patch19Money(inv.subtotal), 1120, y); y += 45;
    ctx.fillStyle = "#0f172a"; ctx.font = "26px Arial"; ctx.fillText("المدفوع: " + patch19Money(inv.paid), 1120, y); y += 40; ctx.fillText("الباقي: " + patch19Money(inv.remaining), 1120, y);
    const link = document.createElement("a");
    link.download = "matbagy-invoice-" + (inv.orderId || Date.now()) + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function patch19CopyInvoiceAndOpenWhatsApp(row) {
    await patch19EnsureAccountingLoaded();
    const message = patch19InvoiceText(row) + "\n\nتم تجهيز فاتورتك، ويمكن إرسالها لك PDF أو صورة.";
    const copied = await copyWhatsAppMessage(row.customerPhone, message);
    if (copied) alert("تم نسخ نص الفاتورة وفتح واتساب. لو عايز ملف PDF اضغط زر فاتورة PDF واحفظها ثم ارفقها للعميل.");
  }

  function patch28OpenEasyStoreInvoice(row) {
    row = row || {};
    const mode = currentAccountingMode ? currentAccountingMode() : patch19UserMode();
    const url = text(window.MATBAGY_EASY_STORE_URL || "").trim();
    if (!url) { alert("رابط EasyStore غير مضبوط في config.js"); return; }
    patch19OpenEmployeeTool(url, "Matbagy_EasyStore_Invoice", "فاتورة العميل", {
      module: "accounting",
      screen: "sales",
      mode: mode === "full" || mode === "admin" ? "full" : "final",
      orderId: row.orderId || "",
      customer: row.customer || row.customerName || "",
      pullLines: "1",
      mutualInvoice: "1"
    });
  }

  function whatsappActions(row, i) {
    const disabled = whatsappPhone(row.customerPhone) ? "" : " disabled";
    const notified = text(row.customerNotified) === "نعم" ? '<small class="wa-notified">تم الإبلاغ</small>' : "";
    const orderId = escapeHtml(row.orderId || "");
    return '<div class="whatsapp-actions patch28-actions">' +
      '<button type="button" class="wa-btn wa-status" data-i="' + i + '"' + disabled + '>نسخ رد الحالة</button>' +
      '<button type="button" class="wa-btn wa-ready" data-i="' + i + '"' + disabled + '>نسخ رسالة انتهاء</button>' +
      '<span class="wa-invoice-menu-wrap"><button type="button" class="wa-btn wa-invoice-menu" data-order="' + orderId + '">فاتورة العميل ▾</button>' +
      '<span class="wa-invoice-menu-list hidden">' +
      '<button type="button" class="wa-invoice-pricing" data-order="' + orderId + '">تسعير / تعديل بند</button>' +
      '<button type="button" class="wa-invoice-collect" data-order="' + orderId + '">تجميع وائل + جابر</button>' +
      '<button type="button" class="wa-invoice-copy" data-order="' + orderId + '"' + disabled + '>واتساب / نسخ</button>' +
      '<button type="button" class="wa-invoice-pdf" data-order="' + orderId + '">PDF</button>' +
      '<button type="button" class="wa-invoice-image" data-order="' + orderId + '">صورة</button>' +
      '</span></span>' +
      '<button type="button" class="wa-btn wa-open-chat" data-i="' + i + '"' + disabled + '>فتح واتساب</button>' +
      '<button type="button" class="wa-btn order-chat-open" data-i="' + i + '">محادثة الأوردر</button>' +
      notified +
      '</div>';
  }

  function patch19RowByButton(btn) {
    const orderId = btn && btn.getAttribute("data-order");
    if (!orderId) return null;
    return (state.rows || []).find(function (r) { return text(r.orderId) === text(orderId); }) || { orderId: orderId };
  }

  document.addEventListener("click", function (ev) {
    const menuBtn = ev.target.closest && ev.target.closest(".wa-invoice-menu");
    const pricingBtn = ev.target.closest && ev.target.closest(".wa-invoice-pricing");
    const collectBtn = ev.target.closest && ev.target.closest(".wa-invoice-collect");
    const copyBtn = ev.target.closest && ev.target.closest(".wa-invoice-copy");
    const pdfBtn = ev.target.closest && ev.target.closest(".wa-invoice-pdf");
    const imgBtn = ev.target.closest && ev.target.closest(".wa-invoice-image");
    if (menuBtn) {
      const wrap = menuBtn.closest(".wa-invoice-menu-wrap");
      const list = wrap && wrap.querySelector(".wa-invoice-menu-list");
      document.querySelectorAll(".wa-invoice-menu-list").forEach(function(x){ if(x !== list) x.classList.add("hidden"); });
      if (list) list.classList.toggle("hidden");
      return;
    }
    if (pricingBtn) { const row = patch19RowByButton(pricingBtn); if (typeof openInvoiceModal === "function") openInvoiceModal(row); return; }
    if (collectBtn) { patch28OpenEasyStoreInvoice(patch19RowByButton(collectBtn)); return; }
    if (copyBtn) { patch19CopyInvoiceAndOpenWhatsApp(patch19RowByButton(copyBtn)); return; }
    if (pdfBtn) { patch19OpenInvoicePdf(patch19RowByButton(pdfBtn)); return; }
    if (imgBtn) { patch19DownloadInvoiceImage(patch19RowByButton(imgBtn)); return; }
  });

  function patch19RebindTopButtons() {
    const note = $("matbagyNoteBtn");
    if (note && note.dataset.patch19Note !== "1") { note.dataset.patch19Note = "1"; note.addEventListener("click", openMatbagyNotePanel); }
    const acc = $("accountingBtn");
    if (acc) acc.textContent = "💰 إيزي ستور الحسابات";
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireEvents();
    if (loadSession()) bootMain();
    else if (loadCustomerSession()) bootCustomerMain();
    else showEntryChoice();
    setTimeout(forceVisibleMainButtonsPatch13, 300);
    setTimeout(forceVisibleMainButtonsPatch13, 1200);
    setTimeout(patch19RebindTopButtons, 500);
    setTimeout(patch19RebindTopButtons, 1500);
  });
  /*********************** Patch 22 - Sheets SSO No Phone + EasyStore Gaber Laser Mode ***********************/
  window.MATBAGY_PATCH_22 = "Sheets SSO + Gaber Laser EasyStore";

  function patch22EmployeeToolParams(extraParams) {
    const u = state.user || {};
    return Object.assign({
      from: "trendos",
      sso: "1",
      employeeSSO: "1",
      skipLogin: "1",
      noPassword: "1",
      noPhone: "1",
      noActivation: "1",
      phoneRequired: "0",
      activationRequired: "0",
      trustedEmployee: "1",
      username: u.username || u.name || "",
      name: u.name || u.username || "",
      token: u.token || "",
      roleMode: patch19UserMode ? patch19UserMode() : "employee",
      department: patch19RoleDepartment ? patch19RoleDepartment() : "موظف"
    }, extraParams || {});
  }

  function patch22OpenEmployeeTool(baseUrl, windowName, label, extraParams) {
    const base = text(baseUrl || "").trim();
    if (!base) { alert("رابط " + label + " غير مضبوط في config.js"); return; }
    if (!isEmployeeLoggedIn()) { alert("سجل دخول الموظف الأول."); return; }
    const params = patch22EmployeeToolParams(extraParams);
    try { localStorage.setItem("MATBAGY_EMPLOYEE_SSO", JSON.stringify({ at: Date.now(), user: state.user || {}, params: params })); } catch (e) {}
    window.open(withQuery(base, params), windowName || "Matbagy_Tool");
  }

  openMatbagySheetsTool = function () {
    patch22OpenEmployeeTool(window.MATBAGY_SHEETS_URL, "Matbagy_Sheets", "مطبعجي شيتات", {
      tool: "sheets",
      openWithoutPhone: "1",
      bypassPhoneVerification: "1",
      bypassActivation: "1",
      employeePortal: "1"
    });
  };

  patch19OpenEasyStoreAccounting = function () {
    const mode = currentAccountingMode ? currentAccountingMode() : patch19UserMode();
    const userMode = patch19UserMode ? patch19UserMode() : mode;
    const url = text(window.MATBAGY_EASY_STORE_URL || "").trim();
    if (!url) { alert("رابط EasyStore غير مضبوط في config.js"); return; }
    patch22OpenEmployeeTool(url, "Matbagy_EasyStore_Accounting", "إيزي ستور الحسابات", {
      module: "accounting",
      screen: (mode === "full" || mode === "admin" || userMode === "admin") ? "kitchen" : (mode === "final" || userMode === "final" ? "final_invoice" : "dept_invoice"),
      mode: mode,
      roleMode: userMode,
      hideCosts: (mode === "print" || mode === "laser" || userMode === "print" || userMode === "laser") ? "1" : "0",
      laserAi: (mode === "laser" || userMode === "laser") ? "1" : "0",
      useLaserMaterialsFromKitchen: (mode === "laser" || userMode === "laser") ? "1" : "0",
      finalInvoice: (mode === "final" || userMode === "final") ? "1" : "0",
      wasteByDepartment: "1"
    });
  };

  openAccountingPanel = function () {
    patch19OpenEasyStoreAccounting();
  };

  function patch22RebindEmployeeButtons() {
    const sheets = $("matbagySheetsBtn");
    if (sheets) {
      sheets.onclick = openMatbagySheetsTool;
      sheets.title = "يفتح برنامج الشيتات للموظف بدون رقم تليفون أو تفعيل";
    }
    const acc = $("accountingBtn");
    if (acc) {
      acc.textContent = "💰 إيزي ستور الحسابات";
      acc.onclick = openAccountingPanel;
      acc.title = "يفتح EasyStore بإعدادات الموظف وحاسبة جابر لخامات الليزر";
    }
  }

  setTimeout(patch22RebindEmployeeButtons, 700);
  setTimeout(patch22RebindEmployeeButtons, 1800);



  /*********************** Patch 23 - Button Safety Binding + Clickable Stats + SSO Repair ***********************/
  window.TRENDOS_PATCH_VERSION = "1856_PATCH_23_BUTTONS_SSO_REPAIR";

  function patch23SafeCall(fnName, fallback) {
    try {
      if (typeof window[fnName] === "function") return window[fnName]();
      if (typeof fallback === "function") return fallback();
    } catch (e) {
      alert((e && e.message) || "تعذر تنفيذ الأمر.");
    }
  }

  function patch23SetValue(id, value) {
    const el = $(id);
    if (!el) return false;
    el.value = value;
    try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
    return true;
  }

  function patch23ReloadOrders() {
    try {
      if (typeof refreshNow === "function") return refreshNow();
      if (typeof loadDashboard === "function") loadDashboard();
      if (typeof loadOrders === "function") return loadOrders();
      if (typeof refreshOrders === "function") return refreshOrders();
      location.reload();
    } catch (e) {
      location.reload();
    }
  }

  function patch23OpenStatsFilter(kind) {
    const map = {
      all: ["statusFilter", ""],
      urgent: ["priorityFilter", "عاجل"],
      normal: ["priorityFilter", "عادي"],
      late: ["statusFilter", "متأخر"],
      debt: ["statusFilter", "مديونية"],
      heat: ["heatPressFilter", "نعم"],
      fly: ["priorityFilter", "عاجل"],
      cancelled: ["statusFilter", "ملغى"]
    };
    const m = map[kind];
    if (!m) return;
    patch23SetValue(m[0], m[1]);
    const sec = document.getElementById("ordersSection") || document.getElementById("workSection") || document.querySelector(".orders-table,.orders-list,.orders-card");
    if (sec && sec.scrollIntoView) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      if (typeof renderOrdersTable === "function") renderOrdersTable();
      if (typeof applyFilters === "function") applyFilters();
      if (typeof renderOrders === "function") renderOrders();
    } catch (e) {}
  }

  function patch23MakeStatsClickable() {
    const boxes = Array.prototype.slice.call(document.querySelectorAll(".quick-stats span,.stat-row span,.dashboard-stats span,.follow-stats span,.followup-stats span"));
    boxes.forEach(function (el) {
      const t = (el.textContent || "").trim();
      if (!t) return;
      let kind = "";
      if (t.indexOf("المعروض") !== -1 || t.indexOf("إجمالي") !== -1) kind = "all";
      else if (t.indexOf("عاجل") !== -1) kind = "urgent";
      else if (t.indexOf("عادي") !== -1) kind = "normal";
      else if (t.indexOf("متأخر") !== -1) kind = "late";
      else if (t.indexOf("مديون") !== -1) kind = "debt";
      else if (t.indexOf("مكبس") !== -1) kind = "heat";
      else if (t.indexOf("الطاير") !== -1) kind = "fly";
      else if (t.indexOf("ملغ") !== -1) kind = "cancelled";
      if (!kind) return;
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.style.cursor = "pointer";
      el.title = "اضغط لفلترة الأوردرات";
      el.onclick = function () { patch23OpenStatsFilter(kind); };
    });
  }

  function patch23BindMainButtons() {
    const bind = function(id, fn, title){
      const el = $(id);
      if (!el) return;
      el.onclick = function(ev){ ev && ev.preventDefault && ev.preventDefault(); fn(); };
      if (title) el.title = title;
      el.classList.remove("hidden");
    };

    bind("refreshBtn", patch23ReloadOrders, "تحديث الأوردرات والمتابعة الآن");
    bind("matbagySheetsBtn", function(){
      if (typeof openMatbagySheetsTool === "function") return openMatbagySheetsTool();
      if (typeof patch22OpenEmployeeTool === "function") return patch22OpenEmployeeTool(window.MATBAGY_SHEETS_URL, "Matbagy_Sheets", "مطبعجي شيتات", { noPhone:"1", noActivation:"1", bypassPhoneVerification:"1" });
      return openEmployeeTool(window.MATBAGY_SHEETS_URL, "Matbagy_Sheets", "مطبعجي شيتات");
    }, "فتح مطبعجي شيتات بدون تليفون أو تفعيل للموظف");
    bind("matbagyRotetBtn", function(){
      if (typeof openMatbagyRotetTool === "function") return openMatbagyRotetTool();
      return openEmployeeTool(window.MATBAGY_ROTET_URL, "Matbagy_Rotet", "روتيت مطبعجي");
    }, "فتح روتيت مطبعجي");
    bind("remoteFilesBtn", function(){
      if (typeof openMatbagyFilesSSO === "function") return openMatbagyFilesSSO();
      if (typeof openRemoteFiles === "function") return openRemoteFiles();
      if (typeof openMatbagyRemoteFiles === "function") return openMatbagyRemoteFiles();
    }, "فتح ملفات مطبعجي");
    bind("matbagyNoteBtn", function(){
      if (typeof openMatbagyNotePanel === "function") return openMatbagyNotePanel();
      if (typeof patch19OpenMatbagyNote === "function") return patch19OpenMatbagyNote();
    }, "فتح نوت مطبعجي");
    bind("accountingBtn", function(){
      if (typeof openAccountingPanel === "function") return openAccountingPanel();
      if (typeof patch19OpenEasyStoreAccounting === "function") return patch19OpenEasyStoreAccounting();
    }, "فتح EasyStore / مطبخ الحسابات حسب صلاحية الموظف");
    bind("logoutBtn", function(){ if (typeof logout === "function") logout(); else location.reload(); });
    bind("changePassBtn", function(){ if (typeof showChangePassword === "function") showChangePassword(); else { const m=$("changePassModal"); if(m) m.classList.remove("hidden"); }});
    patch23MakeStatsClickable();
  }

  document.addEventListener("click", function(ev){
    const btn = ev.target && ev.target.closest && ev.target.closest("button");
    if (!btn) return;
    const id = btn.id || "";
    if (id === "refreshBtn" || id === "matbagySheetsBtn" || id === "matbagyRotetBtn" || id === "remoteFilesBtn" || id === "matbagyNoteBtn" || id === "accountingBtn") {
      patch23BindMainButtons();
    }
  }, true);

  setInterval(patch23MakeStatsClickable, 3000);
  setTimeout(patch23BindMainButtons, 300);
  setTimeout(patch23BindMainButtons, 1200);
  setTimeout(patch23BindMainButtons, 2500);


  /*********************** Batch 25 - Full Accounting Core Cache + Status + Tool SSO ***********************/
  window.TRENDOS_PATCH_VERSION = "1856_BATCH_25_FULL_ACCOUNTING_CORE";
  window.TRENDOS_LOADED_APP_VERSION = "Batch 25 - Full Accounting Core";

  function batch24SetVersionBadges() {
    try {
      document.querySelectorAll('.version-badge').forEach(function(el){
        el.textContent = 'مطبعجي مصر V1857 - ES14 Accounting Merge';
      });
      var old = document.getElementById('batch24VersionLine');
      if (!old) {
        var host = document.querySelector('.top-card,.header-card,.hero,.topbar') || document.body.firstElementChild;
        var div = document.createElement('div');
        div.id = 'batch24VersionLine';
        div.className = 'version-badge';
        div.style.marginTop = '6px';
        div.style.fontSize = '12px';
        div.style.opacity = '.85';
        div.textContent = 'Loaded: app.js Batch 24 / config.js Batch 24';
        if (host && host.appendChild) host.appendChild(div);
      }
    } catch(e){}
  }

  function batch24HardProgramUpdate() {
    try {
      var u = new URL(location.href);
      u.searchParams.set('v', '1856-batch24-' + Date.now());
      location.replace(u.toString());
    } catch(e) {
      location.href = location.pathname + '?v=1856-batch24-' + Date.now();
    }
  }

  function batch24DataRefresh() {
    try {
      if (typeof loadRows === 'function') return loadRows(true);
      if (typeof refreshNow === 'function') return refreshNow();
      if (typeof loadDashboard === 'function') loadDashboard();
      if (typeof loadOrders === 'function') return loadOrders();
      if (typeof refreshOrders === 'function') return refreshOrders();
    } catch (e) {}
  }

  function batch24AddProgramUpdateButton(){
    try {
      var refresh = document.getElementById('refreshBtn');
      if (!refresh) return;
      refresh.textContent = 'تحديث البيانات';
      refresh.title = 'يجلب آخر الأوردرات والبيانات من الشيتات';
      refresh.onclick = function(ev){ ev && ev.preventDefault && ev.preventDefault(); batch24DataRefresh(); };
      if (!document.getElementById('programUpdateBtn')) {
        var b = document.createElement('button');
        b.id = 'programUpdateBtn';
        b.className = refresh.className || 'ghost';
        b.textContent = 'تحديث البرنامج';
        b.title = 'يعيد تحميل ملفات البرنامج ويكسر الكاش';
        b.onclick = function(ev){ ev && ev.preventDefault && ev.preventDefault(); batch24HardProgramUpdate(); };
        refresh.parentNode.insertBefore(b, refresh.nextSibling);
      }
    } catch(e){}
  }

  function batch24EnsureStatusOptions(){
    try {
      var sel = document.getElementById('statusFilter');
      if (!sel) return;
      Array.from(sel.options).forEach(function(o){ if ((o.value || o.textContent) === 'مشكلة') o.remove(); });
      if (!Array.from(sel.options).some(function(o){ return (o.value || o.textContent) === 'مكرر'; })) {
        var opt = document.createElement('option');
        opt.textContent = 'مكرر';
        sel.appendChild(opt);
      }
    } catch(e){}
  }

  function batch24OpenSheetsNoActivation(){
    if (typeof patch22OpenEmployeeTool === 'function') {
      return patch22OpenEmployeeTool(window.MATBAGY_SHEETS_URL, 'Matbagy_Sheets', 'مطبعجي شيتات', {
        tool:'sheets', sso:'1', employeeSSO:'1', skipLogin:'1', noPhone:'1', noActivation:'1',
        openWithoutPhone:'1', bypassPhoneVerification:'1', bypassActivation:'1', employeePortal:'1'
      });
    }
    return openEmployeeTool(window.MATBAGY_SHEETS_URL, 'Matbagy_Sheets', 'مطبعجي شيتات');
  }
  openMatbagySheetsTool = batch24OpenSheetsNoActivation;

  function batch24RebindStable(){
    batch24SetVersionBadges();
    batch24AddProgramUpdateButton();
    batch24EnsureStatusOptions();
    var sheets = document.getElementById('matbagySheetsBtn');
    if (sheets) sheets.onclick = batch24OpenSheetsNoActivation;
    var acc = document.getElementById('accountingBtn');
    if (acc) {
      acc.textContent = '💰 مطبخ الحسابات';
      acc.onclick = function(ev){ ev && ev.preventDefault && ev.preventDefault(); if (typeof openAccountingPanel === 'function') openAccountingPanel(); };
    }
  }
  setTimeout(batch24RebindStable, 250);
  setTimeout(batch24RebindStable, 1200);
  setInterval(function(){ batch24EnsureStatusOptions(); }, 5000);

})();


/*********************** Batch 25 - Stable Full Accounting Core + Strong Filters + Sheets SSO ***********************/
(function(){
  window.TRENDOS_PATCH_VERSION = "1856_BATCH_25_FULL_ACCOUNTING_CORE";
  window.TRENDOS_LOADED_APP_VERSION = "Batch 25 - Full Accounting Core";

  function qs(id){ return document.getElementById(id); }
  function norm(v){ return String(v||'').replace(/\s+/g,' ').trim(); }
  function employeePayload(extra){
    var u = (window.state && window.state.user) || (window.currentUser) || {};
    var name = u.name || u.username || localStorage.getItem('matbagy_user_name') || 'ضياء';
    var username = u.username || u.name || name;
    var role = u.role || u.permission || u.section || u.department || '';
    var dept = /جابر|gaber|jaber|ليزر/i.test(name+' '+role) ? 'ليزر' : (/وائل|wael|طباعة/i.test(name+' '+role) ? 'طباعة' : '');
    var p = Object.assign({
      from:'trendos', sso:'1', employeeSSO:'1', skipLogin:'1', noPhone:'1', noActivation:'1',
      bypassPhoneVerification:'1', bypassActivation:'1', openWithoutPhone:'1', employeePortal:'1',
      phoneRequired:'0', activationRequired:'0', requirePhone:'0', requireActivation:'0',
      username: username, name: name, role: role, department: dept,
      token: (window.sessionToken || localStorage.getItem('matbagy_session_token') || ''),
      ts: Date.now()
    }, extra || {});
    try { localStorage.setItem('MATBAGY_EMPLOYEE_SSO', JSON.stringify({user:u, params:p, createdAt:Date.now()})); } catch(e){}
    return p;
  }
  function openTool(url, win, extra){
    if (!url) { alert('الرابط غير مضبوط في config.js'); return; }
    var u = new URL(url, location.href);
    var p = employeePayload(extra);
    Object.keys(p).forEach(function(k){ u.searchParams.set(k, p[k]); });
    window.open(u.toString(), win || '_blank');
  }
  window.openMatbagySheetsTool = function(){
    return openTool(window.MATBAGY_SHEETS_URL || 'https://fawakhry.github.io/Matbagy/?from=trendos', 'Matbagy_Sheets', {tool:'sheets'});
  };
  window.openMatbagyEasyStoreAccounting = function(){
    return openTool(window.MATBAGY_EASY_STORE_URL || 'https://fawakhry.github.io/EasyStore/', 'EasyStore_Matbagy', {tool:'easystore', mode:'accounting'});
  };

  function setSelect(id, value){
    var el = qs(id); if (!el) return false;
    var v = String(value||'');
    var found = Array.from(el.options || []).some(function(o){ return String(o.value||o.textContent) === v; });
    if (v && !found) { var op=document.createElement('option'); op.value=v; op.textContent=v; el.appendChild(op); }
    el.value = v;
    try { el.dispatchEvent(new Event('input', {bubbles:true})); } catch(e){}
    try { el.dispatchEvent(new Event('change', {bubbles:true})); } catch(e){}
    return true;
  }
  function runFilter(){
    try { if (typeof applyFiltersAndRender === 'function') return applyFiltersAndRender(true); } catch(e){}
    try { if (typeof renderTable === 'function' && window.state && Array.isArray(state.rows)) return renderTable(state.rows); } catch(e){}
    try { if (typeof loadRows === 'function') return loadRows(false); } catch(e){}
  }
  function clearFilters(){ setSelect('statusFilter',''); setSelect('priorityFilter',''); setSelect('heatPressFilter',''); var s=qs('tableSearch'); if(s){s.value=''; s.dispatchEvent(new Event('input',{bubbles:true}));} }
  function applyFollowFilter(kind){
    if (kind === 'all') clearFilters();
    if (kind === 'urgent') { setSelect('priorityFilter','عاجل'); setSelect('statusFilter',''); setSelect('heatPressFilter',''); }
    if (kind === 'normal') { setSelect('priorityFilter','عادي'); setSelect('statusFilter',''); setSelect('heatPressFilter',''); }
    if (kind === 'late') { setSelect('statusFilter','__OVERDUE__'); setSelect('priorityFilter',''); setSelect('heatPressFilter',''); }
    if (kind === 'today') { setSelect('statusFilter','__TODAY_WORK__'); setSelect('priorityFilter',''); setSelect('heatPressFilter',''); }
    if (kind === 'deliveredToday') { setSelect('statusFilter','__DELIVERED_TODAY__'); setSelect('priorityFilter',''); setSelect('heatPressFilter',''); }
    if (kind === 'debt') { setSelect('statusFilter','مديونية'); setSelect('priorityFilter',''); setSelect('heatPressFilter',''); }
    if (kind === 'heat') { setSelect('heatPressFilter','only'); setSelect('statusFilter',''); setSelect('priorityFilter',''); }
    if (kind === 'fly') { var search=qs('tableSearch'); if(search){search.value='طباعة على الطاير'; search.dispatchEvent(new Event('input',{bubbles:true}));} setSelect('statusFilter',''); }
    if (kind === 'cancelled') { setSelect('statusFilter','ملغى'); setSelect('priorityFilter',''); setSelect('heatPressFilter',''); }
    if (kind === 'duplicate') { setSelect('statusFilter','مكرر'); setSelect('priorityFilter',''); setSelect('heatPressFilter',''); }
    if (kind === 'stopped') { setSelect('statusFilter','متوقف'); setSelect('priorityFilter',''); setSelect('heatPressFilter',''); }
    try { document.querySelectorAll('.batch25-active-filter').forEach(function(x){x.classList.remove('batch25-active-filter')}); } catch(e){}
    runFilter();
    var sec = qs('ordersSection') || qs('workSection') || document.querySelector('.filters');
    if (sec && sec.scrollIntoView) sec.scrollIntoView({behavior:'smooth', block:'start'});
  }
  function kindFromText(t){
    t = norm(t);
    if (/المعروض|إجمالي|كل/.test(t)) return 'all';
    if (/عاجل/.test(t)) return 'urgent';
    if (/عادي/.test(t)) return 'normal';
    if (/متأخر/.test(t)) return 'late';
    if (/شغل اليوم/.test(t)) return 'today';
    if (/تسليمات اليوم|تم التسليم اليوم/.test(t)) return 'deliveredToday';
    if (/مديون/.test(t)) return 'debt';
    if (/مكبس/.test(t)) return 'heat';
    if (/الطاير/.test(t)) return 'fly';
    if (/ملغ/.test(t)) return 'cancelled';
    if (/مكرر/.test(t)) return 'duplicate';
    if (/متوقف|مشاكل\/متوقف/.test(t)) return 'stopped';
    return '';
  }
  function makeStatClickable(){
    var nodes = Array.from(document.querySelectorAll('.stats *, #statsBar *, .pill, .badge, .stat, .quick-stat, .status-pill'));
    nodes.forEach(function(el){
      if (!el || el.dataset.batch25FilterReady) return;
      var kind = kindFromText(el.textContent || '');
      if (!kind) return;
      el.dataset.batch25FilterReady = kind;
      el.style.cursor = 'pointer';
      el.title = 'اضغط للفلترة: ' + norm(el.textContent);
      el.setAttribute('role','button');
      el.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); el.classList.add('batch25-active-filter'); applyFollowFilter(kind); }, true);
    });
  }
  function ensureStatusOptions(){
    var sel=qs('statusFilter'); if(!sel) return;
    Array.from(sel.options||[]).forEach(function(o){ if ((o.value||o.textContent)==='مشكلة') o.remove(); });
    if(!Array.from(sel.options||[]).some(function(o){return (o.value||o.textContent)==='مكرر'})){
      var op=document.createElement('option'); op.textContent='مكرر'; sel.appendChild(op);
    }
  }
  function hardRefresh(){
    try { var u=new URL(location.href); u.searchParams.set('v','1856-batch25-'+Date.now()); location.replace(u.toString()); } catch(e){ location.reload(true); }
  }
  function bindMain(){
    ensureStatusOptions(); makeStatClickable();
    var refresh=qs('refreshBtn'); if(refresh){ refresh.textContent='تحديث البيانات'; refresh.onclick=function(ev){ev&&ev.preventDefault(); try{ if(typeof loadRows==='function') return loadRows(true); }catch(e){} location.reload();}; }
    var sheets=qs('matbagySheetsBtn'); if(sheets){ sheets.onclick=function(ev){ev&&ev.preventDefault(); return window.openMatbagySheetsTool();}; sheets.title='يفتح برنامج الشيتات للموظف بدون تليفون أو تفعيل'; }
    var acc=qs('accountingBtn'); if(acc){ acc.textContent='💰 إيزي ستور الحسابات'; acc.onclick=function(ev){ev&&ev.preventDefault(); return window.openMatbagyEasyStoreAccounting();}; }
    if(refresh && !qs('programUpdateBtn')){ var b=document.createElement('button'); b.id='programUpdateBtn'; b.className=refresh.className||'ghost'; b.textContent='تحديث البرنامج'; b.onclick=function(ev){ev&&ev.preventDefault(); hardRefresh();}; refresh.parentNode.insertBefore(b, refresh.nextSibling); }
    document.querySelectorAll('.version-badge').forEach(function(el){ if(/Patch|Batch|V1856/.test(el.textContent||'')) el.textContent='مطبعجي مصر V1857 - ES14 Accounting Merge'; });
  }
  document.addEventListener('click', function(ev){ var k=kindFromText((ev.target&&ev.target.textContent)||''); if(k && ev.target.closest && ev.target.closest('#statsBar,.stats,.quick-stats,.follow-stats')){ev.preventDefault(); applyFollowFilter(k);} }, true);
  setTimeout(bindMain,300); setTimeout(bindMain,1500); setInterval(bindMain,4000);
})();


/*********************** Patch 28 - Mutual Invoice Bridge marker ***********************/
window.MATBAGY_PATCH_31 = "Customer Draft Loader + Mutual Invoice Flow";
window.MATBAGY_PATCH_28 = "Mutual Invoice + Client Invoice Menu + EasyStore pull Wael/Gaber";


/*********************** Batch 30 - Dept Invoice Emergency Fix + Gaber Inline Calculator ***********************/
(function(){
  'use strict';
  window.TRENDOS_PATCH_VERSION = '1856_BATCH_30_DEPT_INVOICE_FIX';
  window.TRENDOS_LOADED_APP_VERSION = 'Batch 30 - Dept Invoice Fix';

  function $(id){ return document.getElementById(id); }
  function txt(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function norm(v){ return txt(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/[ؤ]/g,'و').replace(/[ئ]/g,'ي'); }
  function num(v){ var n = parseFloat(String(v||'').replace(/[٬,]/g,'.').replace(/[^0-9.\-]/g,'')); return isFinite(n) ? n : 0; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function isGaber(){
    var u = (window.state && window.state.user) || {};
    var raw = [u.name,u.username,u.role,u.department,localStorage.getItem('matbagy_user_name'),localStorage.getItem('matbagy_username')].join(' ');
    return /جابر|gaber|jaber|laser|ليزر/i.test(raw);
  }
  function isWael(){
    var u = (window.state && window.state.user) || {};
    var raw = [u.name,u.username,u.role,u.department,localStorage.getItem('matbagy_user_name'),localStorage.getItem('matbagy_username')].join(' ');
    return /وائل|wael|print|طباعة/i.test(raw);
  }
  function currentUser(){
    var u = (window.state && window.state.user) || {};
    return {
      name: u.name || u.username || localStorage.getItem('matbagy_user_name') || localStorage.getItem('matbagy_username') || (isGaber()?'جابر':isWael()?'وائل':'ضياء'),
      username: u.username || u.name || localStorage.getItem('matbagy_username') || localStorage.getItem('matbagy_user_name') || (isGaber()?'جابر':isWael()?'وائل':'ضياء'),
      token: u.token || window.sessionToken || localStorage.getItem('matbagy_session_token') || '',
      department: isGaber() ? 'ليزر' : (isWael() ? 'طباعة' : (u.department || ''))
    };
  }
  function apiJsonp(action, params){
    return new Promise(function(resolve,reject){
      var base = String(window.TREND_API_URL || window.API_URL || '').trim();
      if(!base) return reject(new Error('رابط Apps Script غير مضبوط في config.js'));
      var cb = 'p30cb_' + Date.now() + '_' + Math.random().toString(16).slice(2);
      var s = document.createElement('script');
      var done = false;
      function clean(){ if(done) return; done = true; try{ delete window[cb]; }catch(e){ window[cb]=undefined; } if(s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function(res){ clean(); resolve(res || {}); };
      var user = currentUser();
      var q = new URLSearchParams(Object.assign({action:action, callback:cb, username:user.username, name:user.name, token:user.token, department:user.department, mode:isGaber()?'laser':(isWael()?'print':'full'), _ts:Date.now()}, params || {}));
      s.onerror = function(){ clean(); reject(new Error('فشل الاتصال بالسيرفر')); };
      s.src = base + '?' + q.toString();
      document.body.appendChild(s);
      setTimeout(function(){ if(!done){ clean(); reject(new Error('انتهت مهلة الاتصال بالسيرفر')); } }, 20000);
    });
  }
  function rowFromButton(btn){
    var tr = btn && btn.closest && btn.closest('tr');
    var order = '';
    if(btn) order = btn.getAttribute('data-order') || '';
    if(!order && tr){ var b = tr.querySelector('.order-cell .order-main b, td:first-child b'); if(b) order = txt(b.textContent); }
    var lineId = '';
    if(tr){ var ol = txt((tr.querySelector('.order-cell')||{}).textContent||''); var m = ol.match(/البند\s*:\s*([^\n]+)/); if(m) lineId = txt(m[1]); }
    var customer = '';
    if(tr){ var cb = tr.querySelector('.customer-cell .order-main b'); if(cb) customer = txt(cb.textContent); }
    var phone = '';
    if(tr){ var ph = tr.querySelector('.phone-line'); if(ph) phone = txt(ph.textContent); }
    var item = '';
    if(tr){ var ib = tr.querySelector('.work-cell .order-main b'); if(ib) item = txt(ib.textContent); }
    var dept = '';
    if(tr){ var wt = txt((tr.querySelector('.work-cell')||{}).textContent||''); var dm = wt.match(/القسم\s*:\s*([^\n]+)/); if(dm) dept = txt(dm[1]); }
    var qty = 1;
    if(tr){ var wt2 = txt((tr.querySelector('.work-cell')||{}).textContent||''); var qm = wt2.match(/الكمية\s*:\s*([^\n]+)/); if(qm) qty = num(qm[1]) || 1; }
    if(isGaber()) dept = 'ليزر';
    if(isWael()) dept = 'طباعة';
    return { orderId: order, lineId: lineId, customer: customer, customerName: customer, customerPhone: phone, itemName: item, department: dept, qty: qty };
  }
  function ensureInvoiceModal(){
    var modal = $('invoiceModal');
    if(modal) return modal;
    var html = '<section id="invoiceModal" class="modal hidden"><div class="modal-card invoice-card p30-invoice-card">'+
      '<h2 id="invoiceOrderTitle">فاتورة / تسعير</h2>'+
      '<p class="hint">اختار الصنف والكمية والسعر. لو الحساب لجابر، زر الحاسبة موجود هنا وداخل صفحته.</p>'+
      '<input id="invoiceLineId" type="hidden"><input id="invoiceItemDept" type="hidden">'+
      '<label>اسم العميل</label><input id="invoiceCustomer" readonly>'+
      '<label>رقم الأوردر</label><input id="invoiceOrderId" readonly>'+
      '<label>الصنف</label><select id="invoiceItemSelect"></select><input id="invoiceWorkDone" placeholder="اسم الصنف المختار" readonly>'+
      '<div id="invoiceLaserTools" class="invoice-laser-tools hidden"><button id="invoiceOpenEasyLaserBtn" type="button" class="ghost">حاسبة جابر / حساب شغلانة</button><button id="invoiceInlineLaserBtn" type="button" class="ghost">حاسبة داخلية سريعة</button><span>لو الشغل مقاسات، احسبه وأضفه للبند.</span></div>'+
      '<div id="invoiceInlineLaserBox" class="p30-laser-box hidden"><div class="grid four"><label>الخامة<input id="p30LaserMat" placeholder="خشب / أكريلك"></label><label>عرض سم<input id="p30LaserW" type="number"></label><label>طول سم<input id="p30LaserH" type="number"></label><label>كمية<input id="p30LaserQty" type="number" value="1"></label></div><div class="grid four"><label>سعر مقترح<input id="p30LaserSale" type="number"></label><label>هالك %<input id="p30LaserWaste" type="number" value="10"></label><label>معامل<input id="p30LaserFactor" type="number" value="2.2"></label><button type="button" id="p30ApplyLaser" class="primary">تطبيق على البند</button></div><p id="p30LaserMsg" class="msg"></p></div>'+
      '<label>الكمية</label><input id="invoiceQty" type="number" min="1" value="1">'+
      '<label>سعر الفاتورة</label><input id="invoiceSalePrice" type="number" min="0" value="0">'+
      '<label class="invoice-shared-check"><input id="invoiceSharedLine" type="checkbox"> بند مشترك يظهر عند القسم الآخر إجباريًا</label>'+
      '<label>ملاحظات القسم</label><input id="invoiceNotes" placeholder="اختياري">'+
      '<div class="row"><button id="saveInvoiceBtn" class="primary">تسجيل البند</button><button id="saveAndOpenFinalInvoiceBtn" class="primary">تسجيل وفتح الفاتورة</button><button id="cancelInvoiceBtn" class="ghost">إلغاء</button></div><p id="invoiceMsg" class="msg"></p>'+
      '</div></section>';
    document.body.insertAdjacentHTML('beforeend', html);
    modal = $('invoiceModal');
    return modal;
  }
  function catalogRows(){ return window.MATBAGY_P30_CATALOG || []; }
  function setCatalogRows(rows){ window.MATBAGY_P30_CATALOG = rows || []; }
  function optionValue(r,i){ return [r.type||'TPL', r.name||'', r.department||'', i].join('|'); }
  function fillCatalog(row){
    var sel = $('invoiceItemSelect'); if(!sel) return;
    var d = isGaber() ? 'ليزر' : (isWael() ? 'طباعة' : (row.department || ''));
    var rows = catalogRows().filter(function(r){ var rd = txt(r.department || 'عام'); return !d || rd === d || rd === 'مشترك' || rd === 'عام'; });
    if(!rows.length && row.itemName){ rows = [{type:'ORDER', name: row.itemName, department: d || row.department || 'عام', sale: 0}]; }
    sel.innerHTML = '<option value="">اختار الصنف</option>' + rows.map(function(r,i){ var sale = r.sale ? ' — ' + r.sale + ' ج' : ''; return '<option value="'+esc(optionValue(r,i))+'">'+esc(r.name+' — '+(r.department||'عام')+sale)+'</option>'; }).join('');
  }
  function selectedCatalogItem(){
    var sel = $('invoiceItemSelect'); if(!sel || !sel.value) return null;
    var parts = sel.value.split('|'); var idx = Number(parts[3]);
    var rows = catalogRows();
    return rows[idx] || {type:parts[0], name:parts[1], department:parts[2], sale:0};
  }
  function applySelection(){
    var item = selectedCatalogItem();
    if(!item) return;
    if($('invoiceWorkDone')) $('invoiceWorkDone').value = item.name || '';
    if($('invoiceItemDept')) $('invoiceItemDept').value = item.department || '';
    if($('invoiceSalePrice')) $('invoiceSalePrice').value = item.sale ? Number(item.sale).toFixed(2) : ($('invoiceSalePrice').value || '0');
    var sh = $('invoiceSharedLine');
    var shared = /مشترك|shared|عام/.test(norm(item.department || ''));
    if(sh){ sh.checked = shared; sh.disabled = shared; }
  }
  async function loadCatalog(row){
    try{
      var res = await apiJsonp('getAccounting', {});
      var rows = [];
      function add(r, type){
        var name = r.itemName || r.templateName || r.materialName || r.name || r['اسم البند'] || r['اسم الصنف'] || r['اسم الخامة'] || '';
        if(!name) return;
        rows.push({type:type, name:name, department:r.department || r.dept || r['القسم'] || 'عام', sale:num(r.salePrice || r.systemSale || r.price || r['سعر بيع رسمي'] || r['بيع']), cost:num(r.unitCost || r.fixedCost || r.cost)});
      }
      (res.templates || res.items || []).forEach(function(r){ add(r,'TPL'); });
      (res.materials || res.rawMaterials || []).forEach(function(r){ add(r,'MAT'); });
      if(rows.length) setCatalogRows(rows);
    }catch(e){}
    fillCatalog(row);
  }
  function openEasyStoreLaser(row){
    var base = String(window.MATBAGY_EASY_STORE_URL || 'https://fawakhry.github.io/EasyStore/').trim();
    var u = new URL(base, location.href);
    var cu = currentUser();
    u.searchParams.set('from','trendos'); u.searchParams.set('sso','1'); u.searchParams.set('employeeSSO','1');
    u.searchParams.set('screen','dept'); u.searchParams.set('mode','laser'); u.searchParams.set('department','ليزر'); u.searchParams.set('laserAi','1');
    u.searchParams.set('name', cu.name || 'جابر'); u.searchParams.set('username', cu.username || 'جابر'); u.searchParams.set('token', cu.token || '');
    u.searchParams.set('customer', (row && (row.customer || row.customerName)) || (($('invoiceCustomer')||{}).value||''));
    u.searchParams.set('orderId', (row && row.orderId) || (($('invoiceOrderId')||{}).value||''));
    u.searchParams.set('v','es14-v1857-accounting-merge');
    window.open(u.toString(), 'Matbagy_Gaber_Calc');
  }
  function toggleInlineLaser(){ var b=$('invoiceInlineLaserBox'); if(b) b.classList.toggle('hidden'); }
  function applyInlineLaser(){
    var mat = txt(($('p30LaserMat')||{}).value || 'ليزر');
    var w = num(($('p30LaserW')||{}).value), h = num(($('p30LaserH')||{}).value), q = num(($('p30LaserQty')||{}).value)||1;
    var sale = num(($('p30LaserSale')||{}).value);
    if(!sale){
      var factor = num(($('p30LaserFactor')||{}).value)||2.2;
      var area = Math.max(1, w*h/10000);
      sale = Math.ceil(area * 100 * factor);
    }
    if($('invoiceWorkDone')) $('invoiceWorkDone').value = 'ليزر ' + mat + (w&&h ? ' ' + w + '×' + h : '');
    if($('invoiceQty')) $('invoiceQty').value = q;
    if($('invoiceSalePrice')) $('invoiceSalePrice').value = sale.toFixed(2);
    if($('invoiceItemDept')) $('invoiceItemDept').value = 'ليزر';
    if($('invoiceMsg')) $('invoiceMsg').textContent = 'تم تطبيق ناتج حاسبة جابر على البند. اضغط تسجيل البند.';
  }
  async function saveDeptLine(openFinal){
    var msg = $('invoiceMsg');
    var item = selectedCatalogItem();
    var work = txt(($('invoiceWorkDone')||{}).value);
    if(!item && !work){ if(msg) msg.textContent = 'اختار الصنف أو استخدم حاسبة جابر قبل التسجيل.'; return; }
    var row = window.MATBAGY_P30_INVOICE_ROW || {};
    var qty = num(($('invoiceQty')||{}).value)||1;
    var sale = num(($('invoiceSalePrice')||{}).value);
    if(!sale){ if(msg) msg.textContent = 'اكتب سعر الفاتورة.'; return; }
    var btn = $('saveInvoiceBtn'); if(btn){btn.disabled=true; btn.textContent='جاري التسجيل...';}
    try{
      var dep = isGaber() ? 'ليزر' : (isWael() ? 'طباعة' : (row.department || currentUser().department || ''));
      var itemDept = (($('invoiceItemDept')||{}).value || (item && item.department) || dep);
      var shared = (($('invoiceSharedLine')||{}).checked || /مشترك|shared|عام/.test(norm(itemDept))) ? 'نعم' : 'لا';
      var payload = {
        rowNumber: row.rowNumber || '', orderId: (($('invoiceOrderId')||{}).value || row.orderId || ''), lineId: row.lineId || '',
        customerName: (($('invoiceCustomer')||{}).value || row.customer || ''), customerPhone: row.customerPhone || '', department: dep,
        itemType: shared === 'نعم' ? 'بند مشترك' : 'قسم فقط', itemName: work || (item && item.name) || '', qty: qty,
        materialName: item && item.type === 'MAT' ? item.name : '', materialQty: qty, materialCost:'0', laborCost:'0', otherCost:'0', systemCost:'0',
        systemSalePrice: item && item.sale ? item.sale : sale, salePrice: sale, itemDepartment:itemDept, sharedLine:shared, billingStatus:'جاهز للفوترة', notes:(($('invoiceNotes')||{}).value || '')
      };
      if(!payload.orderId || !payload.itemName){ if(msg) msg.textContent='رقم الأوردر والصنف مطلوبين.'; return; }
      var res = await apiJsonp('saveAccountingDeptLine', payload);
      if(!res || res.success === false){ throw new Error(res && res.message || 'تعذر تسجيل البند في الشيت.'); }
      if(msg) msg.textContent = shared === 'نعم' ? 'تم تسجيل بند مشترك وسيظهر عند القسم الآخر.' : 'تم تسجيل البند بنجاح.';
      if(openFinal) setTimeout(function(){ openFinalInvoice(row); }, 400);
      else setTimeout(function(){ var m=$('invoiceModal'); if(m) m.classList.add('hidden'); }, 700);
    }catch(e){ if(msg) msg.textContent = e.message || 'تعذر تسجيل البند.'; }
    finally{ if(btn){btn.disabled=false; btn.textContent='تسجيل البند';} }
  }
  function openFinalInvoice(row){
    row = row || window.MATBAGY_P30_INVOICE_ROW || {};
    var base = String(window.MATBAGY_EASY_STORE_URL || 'https://fawakhry.github.io/EasyStore/').trim();
    var u = new URL(base, location.href); var cu = currentUser();
    u.searchParams.set('from','trendos'); u.searchParams.set('sso','1'); u.searchParams.set('employeeSSO','1'); u.searchParams.set('screen','sales'); u.searchParams.set('mode','final');
    u.searchParams.set('pullLines','1'); u.searchParams.set('mutualInvoice','1'); u.searchParams.set('autoLoadCustomer','1'); u.searchParams.set('orderId', row.orderId || (($('invoiceOrderId')||{}).value||'')); u.searchParams.set('customer', row.customer || row.customerName || (($('invoiceCustomer')||{}).value||''));
    u.searchParams.set('name', cu.name); u.searchParams.set('username', cu.username); u.searchParams.set('token', cu.token || ''); u.searchParams.set('v','es14-v1857-accounting-merge');
    window.open(u.toString(), 'Matbagy_EasyStore_Invoice');
  }
  function openInvoice(row){
    row = row || {};
    window.MATBAGY_P30_INVOICE_ROW = row;
    var modal = ensureInvoiceModal();
    if($('invoiceOrderTitle')) $('invoiceOrderTitle').textContent = 'فاتورة القسم: ' + (row.orderId || '-') + ' — ' + (row.customer || row.customerName || '-');
    if($('invoiceLineId')) $('invoiceLineId').value = row.lineId || '';
    if($('invoiceCustomer')) $('invoiceCustomer').value = row.customer || row.customerName || '';
    if($('invoiceOrderId')) $('invoiceOrderId').value = row.orderId || '';
    if($('invoiceQty')) $('invoiceQty').value = row.qty || 1;
    if($('invoiceNotes')) $('invoiceNotes').value = row.notes || '';
    if($('invoiceSalePrice')) $('invoiceSalePrice').value = '0';
    if($('invoiceWorkDone')) $('invoiceWorkDone').value = row.itemName || '';
    var laserTools = $('invoiceLaserTools'); if(laserTools) laserTools.classList.toggle('hidden', !isGaber());
    if($('invoiceOpenEasyLaserBtn')) $('invoiceOpenEasyLaserBtn').onclick = function(){ openEasyStoreLaser(row); };
    if($('invoiceInlineLaserBtn')) $('invoiceInlineLaserBtn').onclick = toggleInlineLaser;
    if($('p30ApplyLaser')) $('p30ApplyLaser').onclick = applyInlineLaser;
    if($('cancelInvoiceBtn')) $('cancelInvoiceBtn').onclick = function(){ modal.classList.add('hidden'); };
    if($('saveInvoiceBtn')) $('saveInvoiceBtn').onclick = function(ev){ ev && ev.preventDefault(); saveDeptLine(false); };
    if($('saveAndOpenFinalInvoiceBtn')) $('saveAndOpenFinalInvoiceBtn').onclick = function(ev){ ev && ev.preventDefault(); saveDeptLine(true); };
    if($('invoiceItemSelect')) $('invoiceItemSelect').onchange = applySelection;
    if($('invoiceMsg')) $('invoiceMsg').textContent = 'جاري تحميل الأصناف...';
    modal.classList.remove('hidden');
    loadCatalog(row).then(function(){ if($('invoiceMsg')) $('invoiceMsg').textContent = 'اختار الصنف والكمية والسعر ثم سجل البند.'; });
  }
  function ensureGaberCalcButton(){
    if(!isGaber()) return;
    if($('p30GaberCalcMainBtn')) return;
    var anchor = $('accountingBtn') || $('matbagySheetsBtn') || document.querySelector('header .actions button, .top-actions button, .toolbar button');
    if(!anchor || !anchor.parentNode) return;
    var b = document.createElement('button');
    b.id = 'p30GaberCalcMainBtn';
    b.type = 'button';
    b.className = anchor.className || 'ghost';
    b.textContent = 'حاسبة جابر';
    b.title = 'حاسبة الليزر وحساب شغلانة لنفس نظام EasyStore';
    b.onclick = function(ev){ ev.preventDefault(); openEasyStoreLaser({}); };
    anchor.parentNode.insertBefore(b, anchor.nextSibling);
  }
  document.addEventListener('click', function(ev){
    var t = ev.target;
    var btn = t && t.closest && t.closest('.wa-invoice-pricing,.invoice-open');
    if(btn){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation && ev.stopImmediatePropagation(); openInvoice(rowFromButton(btn)); return false; }
  }, true);
  window.MATBAGY_P30_OPEN_INVOICE = openInvoice;
  window.MATBAGY_P30_OPEN_GABER_CALC = function(){ openEasyStoreLaser({}); };
  setTimeout(ensureGaberCalcButton, 300); setTimeout(ensureGaberCalcButton, 1500); setInterval(ensureGaberCalcButton, 4000);
})();


/*********************** V1857 / ES14 - Accounting Merge Final Overrides ***********************/
(function(){
  'use strict';
  window.TRENDOS_PATCH_VERSION = '1857_ES14_ACCOUNTING_MERGE';
  window.TRENDOS_LOADED_APP_VERSION = 'V1857 + ES14 Accounting Merge';
  window.MATBAGY_V1857_ES14 = true;

  function $(id){ return document.getElementById(id); }
  function txt(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function norm(v){ return txt(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/[ؤ]/g,'و').replace(/[ئ]/g,'ي'); }
  function sessionUser(){
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('trendos_session') || '{}').user || {}; } catch(e) { saved = {}; }
    var u = (window.state && window.state.user) || saved || {};
    return {
      name: u.name || u.username || localStorage.getItem('matbagy_user_name') || localStorage.getItem('matbagy_username') || '',
      username: u.username || u.name || localStorage.getItem('matbagy_username') || localStorage.getItem('matbagy_user_name') || '',
      token: u.token || localStorage.getItem('matbagy_session_token') || '',
      role: u.role || '',
      department: u.department || ''
    };
  }
  function userMode(){
    var u = sessionUser();
    var k = norm([u.name,u.username,u.role,u.department].join(' '));
    if(/ضياء|diaa|admin|مدير|اداره|ادارة/.test(k)) return 'admin';
    if(/رحمه|رحمة|rahma|ريفان|ريڤان|revan|rivan/.test(k)) return 'final';
    if(/جابر|gaber|jaber|laser|ليزر/.test(k)) return 'laser';
    if(/وائل|wael|print|طباعة/.test(k)) return 'print';
    return 'employee';
  }
  function canOpenPurchases(){
    var mode = userMode();
    return mode === 'admin' || mode === 'final';
  }
  function departmentForMode(){
    var mode = userMode();
    if(mode === 'laser') return 'ليزر';
    if(mode === 'print') return 'طباعة';
    if(mode === 'final') return 'تقفيل';
    if(mode === 'admin') return 'إدارة';
    return '';
  }
  function easyStoreBase(){ return txt(window.MATBAGY_EASY_STORE_URL || 'https://fawakhry.github.io/EasyStore/'); }
  function openEasyStore(params, windowName){
    var base = easyStoreBase();
    if(!base){ alert('رابط EasyStore غير مضبوط في config.js'); return false; }
    var u = new URL(base, location.href);
    var cu = sessionUser();
    params = params || {};
    u.searchParams.set('from','trendos');
    u.searchParams.set('sso','1');
    u.searchParams.set('employeeSSO','1');
    u.searchParams.set('name', cu.name || cu.username || 'موظف');
    u.searchParams.set('username', cu.username || cu.name || 'موظف');
    u.searchParams.set('token', cu.token || '');
    u.searchParams.set('mode', params.mode || userMode());
    u.searchParams.set('department', params.department || departmentForMode());
    u.searchParams.set('purchaseAllowed', canOpenPurchases() ? '1' : '0');
    u.searchParams.set('canPurchase', canOpenPurchases() ? '1' : '0');
    u.searchParams.set('deptOnly', canOpenPurchases() ? '0' : '1');
    u.searchParams.set('hideCostForDept', (userMode()==='laser' || userMode()==='print') ? '1' : '0');
    u.searchParams.set('v', window.MATBAGY_EASYSTORE_VERSION_PARAM || 'es14-v1857-accounting-merge');
    Object.keys(params).forEach(function(k){ if(params[k] !== undefined && params[k] !== null && k !== 'mode' && k !== 'department') u.searchParams.set(k, params[k]); });
    window.open(u.toString(), windowName || 'Matbagy_EasyStore_ES14');
    return true;
  }

  window.openMatbagyEasyStoreAccounting = function(){
    var mode = userMode();
    if(mode === 'laser') return openEasyStore({screen:'dept', mode:'laser', department:'ليزر', laserAi:'1'}, 'Matbagy_EasyStore_Gaber');
    if(mode === 'print') return openEasyStore({screen:'dept', mode:'print', department:'طباعة'}, 'Matbagy_EasyStore_Wael');
    if(mode === 'final') return openEasyStore({screen:'sales', mode:'final', pullLines:'1', mutualInvoice:'1'}, 'Matbagy_EasyStore_Final');
    return openEasyStore({screen:'dashboard', mode:'admin'}, 'Matbagy_EasyStore_Admin');
  };

  window.MATBAGY_P30_OPEN_GABER_CALC = function(row){
    return openEasyStore({screen:'dept', mode:'laser', department:'ليزر', laserAi:'1', customer:(row&&row.customer)||'', orderId:(row&&row.orderId)||''}, 'Matbagy_Gaber_Calc_ES14');
  };

  function hideForbiddenPurchaseEntrypoints(){
    if(canOpenPurchases()) return;
    Array.prototype.slice.call(document.querySelectorAll('button,a')).forEach(function(el){
      var t = txt(el.textContent || el.title || '');
      if(/مشتريات|فاتورة\s*شراء|purchase/i.test(t)){
        el.classList.add('hidden');
        el.setAttribute('data-v1857-hidden-purchase','1');
      }
    });
  }

  function bindV1857(){
    var acc = $('accountingBtn');
    if(acc){
      acc.textContent = '💰 إيزي ستور الحسابات V1857';
      acc.title = canOpenPurchases() ? 'حسابات ومبيعات ومشتريات حسب الصلاحية' : 'فاتورة القسم فقط بدون مشتريات وبدون تكلفة';
      acc.onclick = function(ev){ if(ev){ev.preventDefault(); ev.stopPropagation();} return window.openMatbagyEasyStoreAccounting(); };
    }
    var g = $('p30GaberCalcMainBtn');
    if(g){
      g.textContent = 'حاسبة جابر ES14';
      g.onclick = function(ev){ if(ev){ev.preventDefault(); ev.stopPropagation();} return window.MATBAGY_P30_OPEN_GABER_CALC({}); };
    }
    Array.prototype.slice.call(document.querySelectorAll('.version-badge')).forEach(function(el){ el.textContent = 'مطبعجي مصر V1857 - ES14 Accounting Merge'; });
    hideForbiddenPurchaseEntrypoints();
  }
  document.addEventListener('DOMContentLoaded', bindV1857);
  setTimeout(bindV1857, 300); setTimeout(bindV1857, 1600); setInterval(bindV1857, 5000);
})();


/*********************** V1857 Fix 5 - Accounting UI fixes requested by Diaa ***********************/
(function(){
  'use strict';
  window.MATBAGY_V1857_FIX5 = true;
  function $(id){ return document.getElementById(id); }
  function txt(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function norm(v){ return txt(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/[ؤ]/g,'و').replace(/[ئ]/g,'ي'); }
  function num(v){ var n=parseFloat(String(v||'').replace(/[٬,]/g,'.').replace(/[^0-9.\-]/g,'')); return isFinite(n)?n:0; }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
  function msg(t,bad){ var m=$('invoiceMsg')||$('accountingMsg')||$('mainMsg'); if(m){m.textContent=t||''; m.classList.toggle('error',!!bad); m.classList.toggle('ok',!!t&&!bad);} }
  function userDept(){
    var u = (window.state && window.state.user) || {};
    var k = norm([u.name,u.username,u.role,u.department,localStorage.getItem('matbagy_user_name'),localStorage.getItem('matbagy_username')].join(' '));
    if(/جابر|gaber|jaber|ليزر|laser/.test(k)) return 'ليزر';
    if(/وائل|wael|طباع|print/.test(k)) return 'طباعة';
    return txt(u.department||'');
  }
  function apiJsonp(action, params){
    return new Promise(function(resolve,reject){
      var base = txt(window.TREND_API_URL || window.API_URL || ''); if(!base){reject(new Error('رابط السيرفر غير مضبوط'));return;}
      var cb = 'trendos_fix5_' + Date.now() + '_' + Math.floor(Math.random()*99999);
      var s = document.createElement('script');
      var u = (window.state && window.state.user) || {};
      var q = new URLSearchParams(Object.assign({action:action,callback:cb,username:u.username||u.name||'',name:u.name||u.username||'',token:u.token||'',_ts:Date.now()}, params||{}));
      var done=false; function clean(){ if(done) return; done=true; try{delete window[cb];}catch(e){window[cb]=undefined;} if(s.parentNode) s.parentNode.removeChild(s); }
      window[cb]=function(r){ clean(); resolve(r||{}); };
      s.onerror=function(){ clean(); reject(new Error('فشل الاتصال بالسيرفر')); };
      s.src = base + (base.indexOf('?')===-1?'?':'&') + q.toString();
      document.body.appendChild(s); setTimeout(function(){ if(!done){ clean(); reject(new Error('انتهت مهلة السيرفر')); } }, 20000);
    });
  }
  function closeClientInvoiceMenus(){
    ['clientInvoiceMenu','waInvoiceMenu','invoiceCustomerMenu'].forEach(function(id){ var el=$(id); if(el) el.classList.add('hidden'); });
    document.querySelectorAll('.clientInvoiceMenu,.wa-invoice-menu-list,.floating-menu,.dropdown-menu').forEach(function(el){ if(/فاتورة|invoice|menu/i.test(el.id+' '+el.className)) el.classList.add('hidden'); });
  }
  window.toggleClientInvoiceMenu = function(ev){
    if(ev){ ev.preventDefault&&ev.preventDefault(); ev.stopPropagation&&ev.stopPropagation(); }
    var m = $('clientInvoiceMenu'); if(!m) return false;
    var open = m.classList.contains('hidden'); closeClientInvoiceMenus(); if(open) m.classList.remove('hidden'); return false;
  };
  document.addEventListener('click', function(ev){ var t=ev.target; if(t && t.closest && t.closest('#clientInvoiceMenu,.clientInvoiceMenu,[onclick*="toggleClientInvoiceMenu"]')) return; closeClientInvoiceMenus(); }, true);
  document.addEventListener('keydown', function(ev){ if(ev.key==='Escape') closeClientInvoiceMenus(); }, true);

  var catalogCache = [];
  function rowName(r){ return txt(r.itemName||r.templateName||r.materialName||r.name||r['اسم البند']||r['اسم الصنف']||r['اسم الخامة']||''); }
  function rowDept(r){ return txt(r.department||r.dept||r['القسم']||'عام'); }
  function rowSale(r){ return num(r.salePrice||r.systemSale||r.price||r['سعر بيع رسمي']||r['سعر بيع مقترح']||r['بيع']||0); }
  function rowActive(r){ return !/لا|موقوف|متوقف|inactive|archived/i.test(txt(r.active||r['مفعل']||'نعم')); }
  function currentDeptFilter(){ return userDept() || txt(($('invoiceItemDept')||{}).value||''); }
  function fillInvoiceCatalogFromCache(){
    var sel = $('invoiceItemSelect'); if(!sel) return;
    var d = currentDeptFilter();
    var rows = catalogCache.filter(function(r){ var rd=rowDept(r); return rowActive(r) && (!d || rd===d || rd==='مشترك' || rd==='عام'); });
    if(!rows.length) rows = catalogCache.filter(rowActive);
    sel.innerHTML = '<option value="">اختار الصنف</option>' + rows.map(function(r,i){return '<option value="fix5|'+i+'">'+esc(rowName(r)+' — '+rowDept(r)+(rowSale(r)?' — '+rowSale(r)+' ج':''))+'</option>';}).join('');
    sel.onchange = function(){ var m=String(sel.value||'').match(/^fix5\|(\d+)$/); if(!m) return; var r=rows[Number(m[1])]; if(!r) return; if($('invoiceWorkDone')) $('invoiceWorkDone').value=rowName(r); if($('invoiceItemDept')) $('invoiceItemDept').value=rowDept(r); if($('invoiceSalePrice')) $('invoiceSalePrice').value=rowSale(r)||$('invoiceSalePrice').value||0; };
  }
  async function refreshInvoiceCatalog(){
    try{
      var res = await apiJsonp('getAccounting',{});
      catalogCache = [];
      (res.templates||[]).forEach(function(r){ if(rowName(r)) catalogCache.push(r); });
      (res.materials||[]).forEach(function(r){ if(rowName(r)) catalogCache.push(r); });
      fillInvoiceCatalogFromCache();
    }catch(e){}
  }
  function ensureInvoiceRowsPanel(){
    var card = document.querySelector('#invoiceModal .invoice-card,.p30-invoice-card'); if(!card || $('fix5RowsPanel')) return;
    var panel=document.createElement('div'); panel.id='fix5RowsPanel'; panel.className='v1857-fix5-row-panel';
    panel.innerHTML='<h4>بنود الفاتورة قبل التسجيل</h4><div class="hint">اختار صنف وسعره ثم اضغط إضافة صف. بعد إدخال كل البنود اضغط تسجيل كل الصفوف.</div><div id="fix5RowsList" class="empty">لا توجد صفوف مضافة.</div><div class="v1857-fix5-row-actions"><button type="button" id="fix5AddRowBtn" class="ghost">إضافة صف / باند</button><button type="button" id="fix5SaveRowsBtn" class="primary">تسجيل كل الصفوف</button><button type="button" id="fix5ClearRowsBtn" class="danger">تفريغ الصفوف</button></div>';
    var save=$('saveInvoiceBtn'); if(save && save.parentNode) save.parentNode.parentNode.insertBefore(panel, save.parentNode); else card.appendChild(panel);
    $('fix5AddRowBtn').onclick=addInvoiceRowBuffer; $('fix5SaveRowsBtn').onclick=saveInvoiceRowBuffer; $('fix5ClearRowsBtn').onclick=function(){ window.MATBAGY_FIX5_INVOICE_ROWS=[]; renderInvoiceRowsBuffer(); };
  }
  function getCurrentRow(){
    return {itemName:txt(($('invoiceWorkDone')||{}).value), itemDept:txt(($('invoiceItemDept')||{}).value)||currentDeptFilter(), qty:num(($('invoiceQty')||{}).value)||1, sale:num(($('invoiceSalePrice')||{}).value), shared:!!(($('invoiceSharedLine')||{}).checked), notes:txt(($('invoiceNotes')||{}).value)};
  }
  function addInvoiceRowBuffer(){ var r=getCurrentRow(); if(!r.itemName || !r.sale){ msg('اختار الصنف واكتب السعر قبل إضافة الصف.', true); return; } window.MATBAGY_FIX5_INVOICE_ROWS=window.MATBAGY_FIX5_INVOICE_ROWS||[]; window.MATBAGY_FIX5_INVOICE_ROWS.push(r); renderInvoiceRowsBuffer(); msg('تم إضافة الصف. أضف صف آخر أو سجل كل الصفوف.', false); }
  function renderInvoiceRowsBuffer(){
    var box=$('fix5RowsList'); if(!box) return; var rows=window.MATBAGY_FIX5_INVOICE_ROWS||[];
    if(!rows.length){ box.className='empty'; box.innerHTML='لا توجد صفوف مضافة.'; return; }
    box.className='';
    var total=rows.reduce(function(s,r){return s+(num(r.sale)*num(r.qty));},0);
    box.innerHTML='<table class="v1857-fix5-row-table"><thead><tr><th>الصنف</th><th>القسم</th><th>كمية</th><th>سعر</th><th>إجمالي</th><th>حذف</th></tr></thead><tbody>'+rows.map(function(r,i){return '<tr><td>'+esc(r.itemName)+'</td><td>'+esc(r.itemDept)+'</td><td>'+r.qty+'</td><td>'+r.sale+'</td><td>'+(r.qty*r.sale).toFixed(2)+'</td><td><button type="button" class="danger small" onclick="MATBAGY_FIX5_REMOVE_INVOICE_ROW('+i+')">حذف</button></td></tr>';}).join('')+'</tbody></table><b>الإجمالي: '+total.toFixed(2)+' ج</b>';
  }
  window.MATBAGY_FIX5_REMOVE_INVOICE_ROW=function(i){ var rows=window.MATBAGY_FIX5_INVOICE_ROWS||[]; rows.splice(i,1); renderInvoiceRowsBuffer(); };
  async function callSaveSingle(row){
    if($('invoiceWorkDone')) $('invoiceWorkDone').value=row.itemName; if($('invoiceItemDept')) $('invoiceItemDept').value=row.itemDept; if($('invoiceQty')) $('invoiceQty').value=row.qty; if($('invoiceSalePrice')) $('invoiceSalePrice').value=row.sale; if($('invoiceSharedLine')) $('invoiceSharedLine').checked=!!row.shared; if($('invoiceNotes')) $('invoiceNotes').value=row.notes||'';
    var btn=$('saveInvoiceBtn'); if(btn) btn.click();
    await new Promise(function(r){setTimeout(r,650);});
  }
  async function saveInvoiceRowBuffer(){
    var rows=(window.MATBAGY_FIX5_INVOICE_ROWS||[]).slice(); if(!rows.length){ msg('أضف صف واحد على الأقل.', true); return; }
    for(var i=0;i<rows.length;i++){ await callSaveSingle(rows[i]); }
    window.MATBAGY_FIX5_INVOICE_ROWS=[]; msg('تم تسجيل كل صفوف الفاتورة.', false);
  }
  function bindInvoiceFixes(){ ensureInvoiceRowsPanel(); refreshInvoiceCatalog(); renderInvoiceRowsBuffer(); }
  document.addEventListener('click', function(ev){ var btn=ev.target&&ev.target.closest&&ev.target.closest('.wa-invoice-pricing,.invoice-open'); if(btn){ setTimeout(bindInvoiceFixes,350); setTimeout(bindInvoiceFixes,1000); } }, true);
  setInterval(function(){ if($('invoiceModal') && !$('invoiceModal').classList.contains('hidden')) bindInvoiceFixes(); }, 3000);
})();
