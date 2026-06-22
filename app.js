(function () {
  "use strict";

  const API_URL = (window.TREND_API_URL || window.API_URL || "").trim();
  const REFRESH_MS = 10000;
  const UI_VERSION = "1856_PATCH_13_CUSTOMERS_EDIT_TAB_VISIBLE";

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
    "متوقف",
    "ملغى"
  ];

  // حالات لا تظهر في شاشة التشغيل بعد حفظها.
  // تفضل موجودة في الشيت للتاريخ والمتابعة، لكنها تختفي من شاشة المستخدمين.
  const HIDDEN_FROM_USER_SCREENS = ["جاهز للاستلام", "تم التسليم", "مكرر", "تم التنفيذ", "جاهز للطباعة", "ملغى"];
  const DUPLICATE_CLOSED_STATUSES = ["تم التسليم", "ملغى", "مكرر"];
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


  const AR_WEEK_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const PICKUP_DAY_ALIASES = {
    "الاحد": "الأحد", "الأحد": "الأحد", "احد": "الأحد", "حد": "الأحد",
    "الاثنين": "الاثنين", "الإثنين": "الاثنين", "اثنين": "الاثنين", "اتنين": "الاثنين", "الأتنين": "الاثنين", "الاتنين": "الاثنين",
    "الثلاثاء": "الثلاثاء", "ثلاثاء": "الثلاثاء", "تلات": "الثلاثاء", "التلات": "الثلاثاء", "التلاتاء": "الثلاثاء",
    "الاربعاء": "الأربعاء", "الأربعاء": "الأربعاء", "اربعاء": "الأربعاء", "أربعاء": "الأربعاء", "الاربع": "الأربعاء",
    "الخميس": "الخميس", "خميس": "الخميس",
    "الجمعة": "الجمعة", "جمعه": "الجمعة", "جمعة": "الجمعة",
    "السبت": "السبت", "سبت": "السبت"
  };

  function normalizePickupDayName(value) {
    const raw = text(value).trim();
    if (!raw) return "";
    const key = raw.replace(/[إأآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
    return PICKUP_DAY_ALIASES[raw] || PICKUP_DAY_ALIASES[key] || "";
  }

  function parsePickupDays(value) {
    const raw = text(value).trim();
    if (!raw) return [];
    const parts = raw.split(/[،,\/|+\-\n]+| و /g);
    const out = [];
    parts.forEach(function (p) {
      const day = normalizePickupDayName(p);
      if (day && out.indexOf(day) === -1) out.push(day);
    });
    // لو مكتوبة بجملة كاملة وفيها أسماء أيام بدون فواصل.
    AR_WEEK_DAYS.forEach(function (day) {
      if (raw.indexOf(day) !== -1 && out.indexOf(day) === -1) out.push(day);
    });
    return out;
  }

  function pickupDaysText(value) {
    return parsePickupDays(value).join("، ");
  }

  function tomorrowArabicDayName() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return AR_WEEK_DAYS[d.getDay()];
  }

  function customerHasPickupTomorrow(row) {
    const days = parsePickupDays(row && (row.customerPickupDays || row.pickupDays || row.deliveryDays || row["أيام استلام العميل"] || row["أيام التسليم"]));
    return days.indexOf(tomorrowArabicDayName()) !== -1;
  }

  function selectedPickupDaysFromForm() {
    const wrap = $("newClientPickupDays");
    if (!wrap) return "";
    const days = [];
    Array.prototype.forEach.call(wrap.querySelectorAll("input[type=checkbox]"), function (cb) {
      if (cb.checked && days.indexOf(cb.value) === -1) days.push(cb.value);
    });
    return days.join("، ");
  }

  function clearPickupDaysForm() {
    const wrap = $("newClientPickupDays");
    if (!wrap) return;
    Array.prototype.forEach.call(wrap.querySelectorAll("input[type=checkbox]"), function (cb) { cb.checked = false; });
  }

  function setPickupDaysForm(daysValue) {
    const wrap = $("newClientPickupDays");
    if (!wrap) return;
    const days = parsePickupDays(daysValue);
    Array.prototype.forEach.call(wrap.querySelectorAll("input[type=checkbox]"), function (cb) {
      cb.checked = days.indexOf(cb.value) !== -1;
    });
  }

  function customerPhoneDisplay(c) {
    return safeDisplayPhone((c && (c.phone || c.extraPhone)) || "") || "بدون رقم";
  }

  function setCustomerFormMode(mode) {
    const editing = mode === "edit";
    const btn = $("createCustomerBtn");
    const cancel = $("cancelCustomerEditBtn");
    if (btn) btn.textContent = editing ? "حفظ تعديل العميل" : "إضافة العميل";
    if (cancel) cancel.classList.toggle("hidden", !editing);
  }

  function resetCustomerForm() {
    state.editingCustomerRowNumber = "";
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
    clearPickupDaysForm();
    setCustomerFormMode("add");
  }

  function setCustomerPickupInfo(daysValue) {
    state.selectedCustomerPickupDays = pickupDaysText(daysValue);
    const box = $("customerPickupInfoBox");
    if (!box) return;
    if (!state.selectedCustomerPickupDays) {
      box.classList.add("hidden");
      box.innerHTML = "";
      return;
    }
    const tomorrow = tomorrowArabicDayName();
    const isTomorrow = parsePickupDays(state.selectedCustomerPickupDays).indexOf(tomorrow) !== -1;
    box.classList.remove("hidden");
    box.innerHTML = '<b>أيام استلام العميل:</b> ' + escapeHtml(state.selectedCustomerPickupDays) +
      (isTomorrow ? ' <span class="tomorrow-pill">هيظهر في استلامات بكرة</span>' : '<span class="pickup-days-pill">بكرة: ' + escapeHtml(tomorrow) + '</span>');
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

  function cleanPhoneForDuplicate(value) {
    let digits = arabicDigitsToEnglish(value).replace(/[^0-9]/g, "");
    if (digits.indexOf("0020") === 0 && digits.length >= 14) digits = "0" + digits.slice(4);
    if (digits.indexOf("20") === 0 && digits.length >= 12) digits = "0" + digits.slice(2);
    return digits;
  }

  function isOpenDuplicateStatus(status) {
    const s = text(status).trim();
    return DUPLICATE_CLOSED_STATUSES.indexOf(s) === -1;
  }

  function localOpenOrdersForCustomer(customerName, customerPhone) {
    const nameKey = normalizeArabic(customerName);
    const phoneKey = cleanPhoneForDuplicate(customerPhone);
    const grouped = {};
    (state.rows || []).forEach(function (r) {
      if (!isOpenDuplicateStatus(r.status || "طلب جديد")) return;
      const rowNameKey = normalizeArabic(r.customer || r.customerName || "");
      const rowPhoneKey = cleanPhoneForDuplicate(r.customerPhone || r.phone || "");
      const matchedByPhone = phoneKey && rowPhoneKey && phoneKey === rowPhoneKey;
      const matchedByName = nameKey && rowNameKey && nameKey === rowNameKey;
      if (!matchedByPhone && !matchedByName) return;
      const orderId = r.orderId || r.lineId || "-";
      if (!grouped[orderId]) {
        grouped[orderId] = {
          orderId: orderId,
          customer: r.customer || r.customerName || "",
          customerPhone: r.customerPhone || r.phone || "",
          status: r.status || "",
          department: r.department || "",
          itemName: r.itemName || "",
          priority: r.priority || "",
          expectedDeliveryText: r.expectedDeliveryText || r.expectedDeliveryAt || "",
          linesCount: 0
        };
      }
      grouped[orderId].linesCount += 1;
    });
    return Object.keys(grouped).map(function (k) { return grouped[k]; }).slice(0, 8);
  }

  function duplicateOrdersListText(openOrders) {
    return (openOrders || []).map(function (o, i) {
      return (i + 1) + ") أوردر " + (o.orderId || "-") +
        " | " + (o.department || "-") +
        " | " + (o.status || "-") +
        (o.itemName ? " | " + o.itemName : "") +
        (o.expectedDeliveryText ? " | تسليم: " + o.expectedDeliveryText : "");
    }).join("\n");
  }

  function renderOpenOrderWarning(openOrders) {
    const box = $("openOrderWarning");
    if (!box) return;
    if (!openOrders || !openOrders.length) {
      box.classList.add("hidden");
      box.innerHTML = "";
      return;
    }
    box.classList.remove("hidden");
    box.innerHTML = '' +
      '<div class="open-order-warning-title">⚠️ العميل له أوردر مفتوح قبل كده</div>' +
      '<div class="open-order-warning-text">راجع الأوردرات دي قبل تسجيل أوردر جديد، علشان نعرف هل ده تكرار ولا طلب جديد فعلاً.</div>' +
      '<div class="open-order-warning-list">' + openOrders.map(function (o) {
        return '<div class="open-order-warning-row">' +
          '<b>أوردر ' + escapeHtml(o.orderId || "-") + '</b>' +
          '<span>' + escapeHtml([o.department || "", o.status || "", o.itemName || ""].filter(Boolean).join(" | ")) + '</span>' +
          (o.expectedDeliveryText ? '<small>التسليم المتوقع: ' + escapeHtml(o.expectedDeliveryText) + '</small>' : '') +
        '</div>';
      }).join("") + '</div>' +
      '<div class="open-order-warning-actions">اضغط إضافة الأوردر مرة أخرى واختر: أوردر جديد أو إلغاء التسجيل.</div>';
  }

  async function checkOpenOrdersForRegistration() {
    const customerNameEl = $("newCustomerName");
    const customerPhoneEl = $("newCustomerPhone");
    const customerName = customerNameEl ? customerNameEl.value.trim() : "";
    const customerPhone = customerPhoneEl ? customerPhoneEl.value.trim() : "";
    if (!customerName && !customerPhone) {
      renderOpenOrderWarning([]);
      return [];
    }
    try {
      const res = await api("checkOpenCustomerOrders", authParams({ customerName: customerName, customerPhone: customerPhone }));
      if (res && res.success) {
        const openOrders = Array.isArray(res.openOrders) ? res.openOrders : [];
        renderOpenOrderWarning(openOrders);
        return openOrders;
      }
    } catch (e) {
      // fallback إلى البيانات المحملة في الشاشة حتى لو فحص السيرفر تعذر
    }
    const local = localOpenOrdersForCustomer(customerName, customerPhone);
    renderOpenOrderWarning(local);
    return local;
  }

  function scheduleOpenOrderCheck() {
    clearTimeout(state.openOrderCheckTimer);
    state.openOrderCheckTimer = setTimeout(function () { checkOpenOrdersForRegistration(); }, 450);
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
    openOrderCheckTimer: null,
    selectedCustomerPickupDays: "",
    customersList: [],
    customersListLoading: false,
    editingCustomerRowNumber: ""
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

  function expectedDateForRow(row) {
    const received = parseRowDate(row.receivedAt || row.createdAt || row.created || "");
    let expected = parseRowDate(row.expectedDeliveryAt || row.expectedDeliveryText || row.expectedDelivery || "");
    if (!expected && received) expected = addDays(startOfDay(received), 2);
    return expected;
  }

  function isFinalTomorrowPickupStatus(status) {
    return ["تم التسليم", "ملغى", "مكرر"].indexOf(text(status)) !== -1;
  }

  function isTomorrowPickupRow(row) {
    if (isFinalTomorrowPickupStatus(row.status)) return false;
    // Patch 10: الأولوية لأيام استلام العميل المسجلة في شيت العملاء.
    // مثال: لو العميل يستلم الاثنين والخميس، كل أوردراته المفتوحة تظهر يوم الأحد/الأربعاء في استلامات بكرة.
    if (customerHasPickupTomorrow(row)) return true;
    // توافق مع الأوردرات القديمة التي لها تاريخ تسليم متوقع مكتوب بالفعل.
    const expected = expectedDateForRow(row);
    const tomorrow = addDays(startOfDay(new Date()), 1);
    return sameDay(expected, tomorrow);
  }

  function isTomorrowPickupClosed(row) {
    const status = text(row.status);
    return isReadyForCustomer(status) || isFinalTomorrowPickupStatus(status);
  }

  function isTomorrowPickupOpen(row) {
    return isTomorrowPickupRow(row) && !isTomorrowPickupClosed(row);
  }

  function tomorrowPickupBlockers(rows) {
    return (rows || []).filter(isTomorrowPickupOpen).sort(function (a, b) {
      return (priorityRank(a.priority) - priorityRank(b.priority)) || String(a.orderId || "").localeCompare(String(b.orderId || ""));
    });
  }

  function defaultWorkSortRank(row) {
    const p = text(row.priority) || "عادي";
    if (p === "عاجل" || p === "VIP") return 0;
    if (isTomorrowPickupOpen(row)) return 1;
    if (isOverdueRow(row)) return 2;
    if (isTodayWorkRow(row)) return 3;
    if (p === "عادي" || !p) return 4;
    if (p === "مؤجل") return 5;
    return 6;
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
      return v && keys.indexOf(v) !== -1;
    });
  }

  function toggleRemoteFilesButton() {
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
      return v && keys.indexOf(v) !== -1;
    });
  }

  function toggleEmployeeQuickToolButtons() {
    ["matbagySheetsBtn", "matbagyRotetBtn"].forEach(function (id) {
      const btn = $(id);
      if (!btn) return;
      btn.classList.toggle("hidden", !employeeCanOpenQuickTools());
    });
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
    { id: "responses", label: "الردود والذكاء", hint: "معرفة واتس AI وقواعد الردود." },
    { id: "ads", label: "الإعلانات", hint: "إعلانات العملاء وتظبيط الصور." }
  ];

  const ADMIN_CARD_AREAS = {
    managementDashboard: "matbagy",
    platformSectionsCard: "matbagy",
    serviceRoutesCard: "matbagy",
    addOrderCard: "rahma",
    addCustomerCard: "rahma",
    customersListCard: "rahma",
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
    const username = normalizeArabic(user.username || user.name || "");
    return role === "admin" || role === "service" || username === "ضياء" || username === "رحمه" || username === "رحمة";
  }

  function setupAdminWorkspace() {
    const hub = $("adminWorkspaceHub");
    const list = $("adminWorkspaceTabs");
    if (!hub || !list) return;
    const show = canSeeAdminWorkspace();
    hub.classList.toggle("hidden", !show);
    if (!show) return;
    const uname = normalizeArabic((state.user || {}).username || (state.user || {}).name || "");
    if ((uname === "رحمه" || uname === "رحمة") && state.adminArea === "matbagy") state.adminArea = "rahma";
    list.innerHTML = ADMIN_AREAS.map(function (area) {
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
    const username = normalizeArabic(user.username || user.name || "");
    return role === "admin" || username === "ضياء" || username === "رحمه" || username === "رحمة";
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
      "مشكلة": "يوجد ملاحظة وسيتم التواصل معك",
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
    const username = normalizeArabic(user.username || user.name || "");
    return role === "admin" || username === "ضياء" || username === "رحمه" || username === "رحمة";
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
    const listCard = $("customersListCard");
    if (listCard) listCard.classList.toggle("hidden", !canAdd);
    if (canAdd) loadCustomersList(false);
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
      '<div class="dash-note">متابعة ' + escapeHtml(deptName) + ' — شغل اليوم = الأوردرات المستلمة أمس. استلامات بكرة تعتمد على أيام استلام العميل أو تاريخ التسليم المتوقع.</div>' +
      dashboardItem("تقييم القسم", score + "%", score >= 80 ? "done" : (score >= 50 ? "ready" : "danger")) +
      dashboardItem("إنجاز الشغل", completion + "%", "done") +
      dashboardItem("تقييم الوقت", timeScore + "%", timeScore >= 80 ? "done" : "danger") +
      dashboardItem("شغل اليوم", todayWork, "todaywork") +
      dashboardItem("بنود شغل اليوم", todayLines, "") +
      dashboardItem("أوردرات شغل اليوم", todayOrders, "") +
      dashboardItem("استلامات بكرة", d.tomorrowPickupOrders || d.tomorrowPickupLines || 0, (Number(d.tomorrowNotClosedOrders || d.tomorrowNotClosedLines || 0) > 0 ? "tomorrow danger" : "tomorrow")) +
      dashboardItem("غير مقفل لبكرة", d.tomorrowNotClosedOrders || d.tomorrowNotClosedLines || 0, (Number(d.tomorrowNotClosedOrders || d.tomorrowNotClosedLines || 0) > 0 ? "danger" : "done")) +
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

    // V1856 Patch 09: ممنوع قفل اليوم وفيه استلامات بكرة لم تُقفل.
    await loadRows(true);
    const blockers = tomorrowPickupBlockers(state.rows || []);
    if (blockers.length) {
      const statusFilter = $("statusFilter");
      const priorityFilter = $("priorityFilter");
      if (statusFilter) statusFilter.value = "__TOMORROW_PICKUPS__";
      if (priorityFilter) priorityFilter.value = "";
      applyFiltersAndRender(true);

      const sample = blockers.slice(0, 12).map(function (r) {
        return "#" + (r.orderId || "-") +
          " | " + (r.customer || "-") +
          " | " + (r.itemName || r.department || "-") +
          " | الحالة: " + (r.status || "طلب جديد");
      });
      alert([
        "ممنوع قفل اليوم الآن.",
        "",
        "يوجد " + blockers.length + " بند/أوردر من استلامات بكرة لم يتم تقفيله.",
        "لازم قبل نهاية اليوم يتحول إلى: جاهز للاستلام / تم التنفيذ / تم التسليم / ملغى / مكرر.",
        "",
        "تم فتح تاب/فلتر: استلامات بكرة تلقائياً.",
        "",
        sample.join("\n"),
        blockers.length > sample.length ? "... وباقي البنود ظاهرة في الجدول." : ""
      ].filter(Boolean).join("\n"));
      return;
    }

    await loadDashboard(true);
    const d = state.dashboard || {};
    const deptName = d.departmentName || screens[state.screen] || "القسم";
    const prepared = Number(d.readyOrders || 0) + Number(d.deliveredTodayOrders || 0);
    const score = d.performanceScore == null ? 0 : d.performanceScore;
    const msg = [
      "ملخص نهاية اليوم - " + deptName,
      "",
      "تم تجهيز: " + prepared + " شات/أوردر",
      "استلامات بكرة: " + (d.tomorrowPickupOrders || d.tomorrowPickupLines || 0),
      "غير مقفل لبكرة: " + (d.tomorrowNotClosedOrders || d.tomorrowNotClosedLines || 0),
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
      else if (status === "__TOMORROW_PICKUPS__" && !isTomorrowPickupRow(r)) return false;
      else if (status === "__TOMORROW_OPEN__" && !isTomorrowPickupOpen(r)) return false;
      else if (status === "__DELIVERED_TODAY__" && !isDeliveredTodayRow(r)) return false;
      else if (status === "__DEBTS__" && !hasDebt(r)) return false;
      else if (status === "__FLY_PRINT__" && !isFlyPrint(r.flyPrint || r.quickPrint || r.fastPrint || r["طباعة على الطاير"] || r["طباعة ع الطاير"])) return false;
      else if (status === "__PROBLEM_STOPPED__" && ["مشكلة", "متوقف"].indexOf(text(r.status)) === -1) return false;
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

  function isQuickStatActive(kind) {
    const status = $("statusFilter") ? ($("statusFilter").value || "") : "";
    const priority = $("priorityFilter") ? ($("priorityFilter").value || "__ACTIVE__") : "__ACTIVE__";
    const heat = $("heatPressFilter") ? ($("heatPressFilter").value || "") : "";
    if (kind === "shown") return !status && priority === "__ACTIVE__" && !heat;
    if (kind === "urgent") return !status && priority === "عاجل" && !heat;
    if (kind === "normal") return !status && priority === "عادي" && !heat;
    if (kind === "overdue") return status === "__OVERDUE__";
    if (kind === "debts") return status === "__DEBTS__";
    if (kind === "press") return heat === "only" && !status && !priority;
    if (kind === "tomorrow") return status === "__TOMORROW_PICKUPS__";
    if (kind === "tomorrowOpen") return status === "__TOMORROW_OPEN__";
    if (kind === "fly") return status === "__FLY_PRINT__";
    if (kind === "cancelled") return status === "ملغى";
    if (kind === "problem") return status === "__PROBLEM_STOPPED__";
    return false;
  }

  function statTab(kind, label, count, className) {
    const cls = "stat-tab " + (className || "") + (isQuickStatActive(kind) ? " active" : "");
    return '<button type="button" class="' + cls + '" data-stat-filter="' + escapeHtml(kind) + '">' +
      escapeHtml(label) + ': <b>' + Number(count || 0) + '</b></button>';
  }

  function renderStats(rows) {
    const total = rows.length;
    const urgent = rows.filter(function (r) { return text(r.priority) === "عاجل" || text(r.priority) === "VIP"; }).length;
    const normal = rows.filter(function (r) { return !text(r.priority) || text(r.priority) === "عادي"; }).length;
    const problem = rows.filter(function (r) { return ["مشكلة", "متوقف"].indexOf(text(r.status)) !== -1; }).length;
    const overdue = rows.filter(isOverdueRow).length;
    const debts = rows.filter(hasDebt).length;
    const heatPress = rows.filter(function (r) { return isHeatPress(r.heatPress || r.press || r.isPress || r["مكبس"] || r["مكبس حراري"]); }).length;
    const cancelled = rows.filter(function (r) { return text(r.status) === "ملغى"; }).length;
    const tomorrowPickups = rows.filter(isTomorrowPickupRow).length;
    const tomorrowOpen = rows.filter(isTomorrowPickupOpen).length;
    const flyPrint = rows.filter(function (r) {
      return isFlyPrint(r.flyPrint || r.quickPrint || r.fastPrint || r["طباعة على الطاير"] || r["طباعة ع الطاير"]);
    }).length;
    $("statsBar").innerHTML =
      statTab("shown", "المعروض", total, "") +
      statTab("urgent", "عاجل", urgent, "") +
      statTab("normal", "عادي", normal, "") +
      statTab("overdue", "متأخر", overdue, "stat-danger") +
      statTab("debts", "مديونية", debts, "stat-danger") +
      statTab("press", "مكبس", heatPress, "stat-press") +
      statTab("tomorrow", "استلامات بكرة", tomorrowPickups, "stat-tomorrow") +
      statTab("tomorrowOpen", "غير مقفل لبكرة", tomorrowOpen, "stat-danger") +
      statTab("fly", "طباعة على الطاير", flyPrint, "stat-fly") +
      statTab("cancelled", "ملغى", cancelled, "stat-cancelled") +
      statTab("problem", "مشاكل/متوقف", problem, "");
  }

  function applyQuickStatFilter(kind) {
    const statusFilter = $("statusFilter");
    const priorityFilter = $("priorityFilter");
    const heatPressFilter = $("heatPressFilter");
    const tableSearch = $("tableSearch");
    if (tableSearch) tableSearch.value = "";
    if (statusFilter) statusFilter.value = "";
    if (priorityFilter) priorityFilter.value = "";
    if (heatPressFilter) heatPressFilter.value = "";

    const labels = {
      shown: "المعروض",
      urgent: "عاجل",
      normal: "عادي",
      overdue: "متأخر",
      debts: "مديونية",
      press: "مكبس",
      tomorrow: "استلامات بكرة",
      tomorrowOpen: "غير مقفل لبكرة",
      fly: "طباعة على الطاير",
      cancelled: "ملغى",
      problem: "مشاكل/متوقف"
    };

    if (kind === "shown") {
      if (priorityFilter) priorityFilter.value = "__ACTIVE__";
    } else if (kind === "urgent") {
      if (priorityFilter) priorityFilter.value = "عاجل";
    } else if (kind === "normal") {
      if (priorityFilter) priorityFilter.value = "عادي";
    } else if (kind === "overdue") {
      if (statusFilter) statusFilter.value = "__OVERDUE__";
    } else if (kind === "debts") {
      if (statusFilter) statusFilter.value = "__DEBTS__";
    } else if (kind === "press") {
      if (heatPressFilter) heatPressFilter.value = "only";
    } else if (kind === "tomorrow") {
      if (statusFilter) statusFilter.value = "__TOMORROW_PICKUPS__";
    } else if (kind === "tomorrowOpen") {
      if (statusFilter) statusFilter.value = "__TOMORROW_OPEN__";
    } else if (kind === "fly") {
      if (statusFilter) statusFilter.value = "__FLY_PRINT__";
    } else if (kind === "cancelled") {
      if (statusFilter) statusFilter.value = "ملغى";
    } else if (kind === "problem") {
      if (statusFilter) statusFilter.value = "__PROBLEM_STOPPED__";
    }

    state.currentPage = 1;
    applyFiltersAndRender(true);
    setLoading("تم فتح تاب: " + (labels[kind] || "-"));
  }

  function compactOrderCell(r) {
    const overdue = isOverdueRow(r) ? ' <span class="overdue-pill">متأخر</span>' : '';
    const tomorrow = isTomorrowPickupRow(r) ? ' <span class="tomorrow-pill">استلام بكرة</span>' : '';
    const tomorrowOpen = isTomorrowPickupOpen(r) ? ' <span class="tomorrow-lock-pill">لازم يتقفل</span>' : '';
    const cancelled = text(r.status) === "ملغى" ? ' <span class="cancelled-pill">ملغى</span>' : '';
    const pickupDays = pickupDaysText(r.customerPickupDays || r.pickupDays || r.deliveryDays || "");
    return '<div class="order-main"><b>' + escapeHtml(r.orderId || "-") + '</b>' + overdue + tomorrow + tomorrowOpen + cancelled + '</div>' +
      '<div class="muted-line">البند: ' + escapeHtml(r.lineId || "-") + '</div>' +
      '<div class="muted-line">التسليم: ' + escapeHtml(displayExpectedDelivery(r) || "-") + '</div>' +
      (pickupDays ? '<div class="muted-line">أيام استلام العميل: <span class="pickup-days-pill">' + escapeHtml(pickupDays) + '</span></div>' : '');
  }

  function compactCustomerCell(r) {
    const debt = hasDebt(r) ? '<span class="debt-pill">' + escapeHtml(debtLabel(r)) + '</span>' : '';
    const pickupDays = pickupDaysText(r.customerPickupDays || r.pickupDays || r.deliveryDays || "");
    return '<div class="order-main"><b>' + escapeHtml(r.customer || "-") + '</b> ' + debt + '</div>' +
      '<div class="muted-line phone-line">' + escapeHtml(safeDisplayPhone(r.customerPhone) || "بدون رقم") + '</div>' +
      (pickupDays ? '<div class="muted-line">استلام: <span class="pickup-days-pill">' + escapeHtml(pickupDays) + '</span></div>' : '') +
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



  async function loadCustomersList(force) {
    const card = $("customersListCard");
    if (!card || card.classList.contains("hidden")) return;
    if (state.customersListLoading) return;
    if (!force && state.customersList && state.customersList.length) {
      renderCustomersList();
      return;
    }
    state.customersListLoading = true;
    setMsg("customersListStatus", "جاري تحميل العملاء...", false);
    const wrap = $("customersList");
    if (wrap) wrap.innerHTML = '<div class="dash-empty">جاري تحميل العملاء...</div>';
    try {
      const res = await api("listCustomers", authParams({ limit: 500 }));
      if (!res.success) {
        setMsg("customersListStatus", res.message || "تعذر تحميل العملاء.", true);
        state.customersList = [];
        renderCustomersList();
        return;
      }
      state.customersList = Array.isArray(res.customers) ? res.customers : [];
      setMsg("customersListStatus", "عدد العملاء: " + state.customersList.length, false);
      renderCustomersList();
    } catch (err) {
      setMsg("customersListStatus", err.message || "خطأ أثناء تحميل العملاء.", true);
      state.customersList = [];
      renderCustomersList();
    } finally {
      state.customersListLoading = false;
    }
  }

  function customerSearchBlob(c) {
    return normalizeArabic([
      c.name, c.manager, c.phone, c.extraPhone, c.type,
      c.pickupDays, c.deliveryDays, c.active, c.branchName, c.notes
    ].join(" "));
  }

  function renderCustomersList() {
    const wrap = $("customersList");
    if (!wrap) return;
    const q = normalizeArabic(($("customersListSearch") || {}).value || "");
    let customers = state.customersList || [];
    if (q) customers = customers.filter(function (c) { return customerSearchBlob(c).indexOf(q) !== -1; });

    if (!customers.length) {
      wrap.innerHTML = '<div class="dash-empty">لا يوجد عملاء مطابقين.</div>';
      return;
    }

    wrap.innerHTML = customers.map(function (c) {
      const days = pickupDaysText(c.pickupDays || c.deliveryDays || "");
      const active = text(c.active || "نعم") === "لا" ? '<span class="cancelled-pill">غير مفعل</span>' : '<span class="pickup-days-pill">مفعل</span>';
      const debt = numericAmount(c.debtAmount || c.debt) > 0 ? '<span class="debt-pill">مديونية: ' + escapeHtml(c.debtAmount || c.debt) + '</span>' : '';
      return '<div class="customer-list-row" data-row-number="' + escapeHtml(c.rowNumber || "") + '">' +
        '<div class="customer-list-main">' +
          '<b>' + escapeHtml(c.name || "-") + '</b> ' + active + ' ' + debt +
          '<small>' + escapeHtml([customerPhoneDisplay(c), c.extraPhone ? ("إضافي: " + safeDisplayPhone(c.extraPhone)) : "", c.type || "", c.manager ? ("المسؤول: " + c.manager) : ""].filter(Boolean).join(" | ")) + '</small>' +
          (days ? '<div class="muted-line">أيام الاستلام: <span class="pickup-days-pill">' + escapeHtml(days) + '</span></div>' : '<div class="muted-line">أيام الاستلام: لم تحدد بعد</div>') +
          (c.branchName ? '<div class="muted-line">فرع مطبعجي: ' + escapeHtml(c.branchName) + '</div>' : '') +
        '</div>' +
        '<div class="customer-list-actions">' +
          '<button type="button" class="ghost customer-edit-btn" data-row-number="' + escapeHtml(c.rowNumber || "") + '">تعديل</button>' +
        '</div>' +
      '</div>';
    }).join("");

    Array.prototype.forEach.call(wrap.querySelectorAll(".customer-edit-btn"), function (btn) {
      btn.onclick = function () { startEditCustomer(btn.getAttribute("data-row-number")); };
    });
  }

  function startEditCustomer(rowNumber) {
    const c = (state.customersList || []).find(function (x) { return String(x.rowNumber || "") === String(rowNumber || ""); });
    if (!c) {
      setMsg("customersListStatus", "لم أجد العميل للتعديل. اضغط تحديث العملاء وجرب تاني.", true);
      return;
    }
    state.editingCustomerRowNumber = c.rowNumber || "";
    if ($("newClientName")) $("newClientName").value = c.name || "";
    if ($("newClientManager")) $("newClientManager").value = c.manager || (state.user || {}).name || (state.user || {}).username || "";
    if ($("newClientPhone")) $("newClientPhone").value = c.phone || "";
    if ($("newClientExtraPhone")) $("newClientExtraPhone").value = c.extraPhone || "";
    if ($("newClientType")) $("newClientType").value = c.type || "";
    if ($("newClientDebt")) $("newClientDebt").value = numericAmount(c.debtAmount || c.debt || 0);
    if ($("newClientActive")) $("newClientActive").value = c.active || "نعم";
    if ($("newClientNotes")) $("newClientNotes").value = c.notes || "";
    if ($("newClientBranch")) $("newClientBranch").value = c.branchCode || "";
    setPickupDaysForm(c.pickupDays || c.deliveryDays || "");
    setCustomerFormMode("edit");
    setMsg("addCustomerStatus", "تعديل العميل: " + (c.name || "") + " — عدل البيانات واضغط حفظ تعديل العميل.", false);
    const card = $("addCustomerCard");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const editingRow = state.editingCustomerRowNumber || "";

    const params = authParams({
      rowNumber: editingRow,
      customerName: $("newClientName").value.trim(),
      manager: $("newClientManager").value.trim() || ((state.user || {}).name || (state.user || {}).username || ""),
      phone: $("newClientPhone").value.trim(),
      extraPhone: $("newClientExtraPhone").value.trim(),
      customerType: ($("newClientType").value.trim() || "خارجي"),
      debtAmount: $("newClientDebt") ? $("newClientDebt").value.trim() : "0",
      franchiseBranchCode: $("newClientBranch") ? $("newClientBranch").value.trim() : "",
      franchiseBranchName: (function () { const sel = $("newClientBranch"); return sel && sel.value && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text : ""; })(),
      pickupDays: selectedPickupDaysFromForm(),
      deliveryDays: selectedPickupDaysFromForm(),
      active: $("newClientActive").value || "نعم",
      notes: $("newClientNotes").value.trim()
    });

    if (!params.customerName) {
      setMsg("addCustomerStatus", "اسم الشات / العميل مطلوب.", true);
      return;
    }

    const btn = $("createCustomerBtn");
    btn.disabled = true;
    btn.textContent = editingRow ? "جاري حفظ التعديل..." : "جاري إضافة العميل...";

    try {
      const res = await api(editingRow ? "updateCustomer" : "createCustomer", params);
      if (!res.success) {
        setMsg("addCustomerStatus", res.message || (editingRow ? "فشل تعديل العميل." : "فشل إضافة العميل في الشيت."), true);
        return;
      }

      setMsg("addCustomerStatus", res.message || (editingRow ? "تم تعديل العميل." : "تم إضافة العميل في شيت العملاء."), false);
      resetCustomerForm();
      await loadCustomersList(true);
    } catch (err) {
      setMsg("addCustomerStatus", err.message || (editingRow ? "خطأ أثناء تعديل العميل." : "خطأ أثناء إضافة العميل."), true);
    } finally {
      btn.disabled = false;
      setCustomerFormMode(state.editingCustomerRowNumber ? "edit" : "add");
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

  async function handleOrderCreated(res, params) {
    const expectedText = formatDisplayDate(res.expectedDeliveryText) || formatDisplayDate(res.expectedDeliveryAt) || expectedDeliveryTextFromNow();
    setMsg("addOrderStatus", "تم إضافة الأوردر: " + res.orderId + " | التسليم المتوقع: " + expectedText + (res.debtHold || ((res.debtInfo || {}).hasDebt) ? " | تنبيه: العميل عليه مديونية" : "") + (res.duplicateOverride ? " | تم التسجيل كأوردر جديد رغم وجود أوردر مفتوح" : ""), false);

    const registrationRow = {
      customer: params.customerName,
      customerPhone: params.customerPhone,
      orderId: res.orderId,
      lineId: res.lineId,
      itemName: params.itemName || ("أوردر جديد - " + params.department),
      department: params.department,
      status: "طلب جديد",
      expectedDeliveryText: expectedText,
      customerPickupDays: res.customerPickupDays || params.customerPickupDays || "",
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
      const el = $(id);
      if (el) el.value = "";
    });
    if ($("newQty")) $("newQty").value = 1;
    if ($("newHeatPress")) $("newHeatPress").checked = false;
    if ($("newFlyPrint")) $("newFlyPrint").checked = false;
    updateHeatPressVisibility();
    updateFlyPrintVisibility();
    if ($("customerSuggestions")) $("customerSuggestions").classList.add("hidden");
    setCustomerPickupInfo("");
    renderOpenOrderWarning([]);
    state.editing = false;
    await loadRows(true);
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
      customerPickupDays: state.selectedCustomerPickupDays || "",
      pickupDays: state.selectedCustomerPickupDays || "",
      notes: $("newNotes").value.trim()
    });

    if (!params.customerName || !params.department) {
      setMsg("addOrderStatus", "اسم الشات والقسم مطلوبين.", true);
      return;
    }

    const btn = $("createOrderBtn");
    btn.disabled = true;
    btn.textContent = "فحص الأوردرات المفتوحة...";

    try {
      const openOrders = await checkOpenOrdersForRegistration();
      if (openOrders.length) {
        const ok = confirm("تنبيه مهم: العميل له أوردر مفتوح قبل كده.\n\n" + duplicateOrdersListText(openOrders) + "\n\nلو ده نفس الأوردر القديم اضغط إلغاء وراجع الأوردر الموجود.\nلو ده طلب جديد فعلاً اضغط موافق لتسجيله كأوردر جديد.");
        if (!ok) {
          setMsg("addOrderStatus", "تم إيقاف التسجيل. راجع الأوردر المفتوح وحدد هل هو تكرار ولا أوردر جديد.", true);
          return;
        }
        params.duplicateOverride = "نعم";
      }

      btn.textContent = "جاري الإضافة...";
      const res = await api("createManualOrder", params);
      if (!res.success) {
        if (res.duplicateWarning && Array.isArray(res.openOrders) && res.openOrders.length) {
          renderOpenOrderWarning(res.openOrders);
          const ok = confirm("تنبيه مهم: العميل له أوردر مفتوح قبل كده.\n\n" + duplicateOrdersListText(res.openOrders) + "\n\nلو ده نفس الأوردر القديم اضغط إلغاء. لو ده طلب جديد فعلاً اضغط موافق لتسجيله.");
          if (ok) {
            params.duplicateOverride = "نعم";
            const res2 = await api("createManualOrder", params);
            if (!res2.success) {
              setMsg("addOrderStatus", res2.message || "فشل إضافة الأوردر في الشيت.", true);
              return;
            }
            return handleOrderCreated(res2, params);
          }
        }
        setMsg("addOrderStatus", res.message || "فشل إضافة الأوردر في الشيت.", true);
        return;
      }

await handleOrderCreated(res, params);
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
        renderOpenOrderWarning([]);
        setCustomerPickupInfo("");
        return;
      }
      scheduleOpenOrderCheck();
      state.suggestionTimer = setTimeout(function () { searchCustomers(q); }, 300);
    });

    const phoneInput = $("newCustomerPhone");
    if (phoneInput && phoneInput.dataset.openOrderWired !== "1") {
      phoneInput.dataset.openOrderWired = "1";
      phoneInput.addEventListener("input", scheduleOpenOrderCheck);
      phoneInput.addEventListener("blur", checkOpenOrdersForRegistration);
    }
    input.addEventListener("blur", function () { setTimeout(checkOpenOrdersForRegistration, 250); });
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
          '<small>' + escapeHtml([c.phone || "", c.type || "", c.pickupDays ? ("استلام: " + c.pickupDays) : ""].filter(Boolean).join(" | ")) + '</small>' +
          '</button>';
      }).join("");

      box.classList.remove("hidden");
      Array.prototype.forEach.call(box.querySelectorAll("button"), function (btn) {
        btn.onclick = function () {
          const c = customers[Number(btn.dataset.i)];
          $("newCustomerName").value = c.name || "";
          $("newCustomerPhone").value = c.phone || "";
          $("newCustomerType").value = c.type || "";
          setCustomerPickupInfo(c.pickupDays || c.deliveryDays || "");
          box.classList.add("hidden");
          checkOpenOrdersForRegistration();
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
    const proofTextButton = $("insertProofTextBtn");
    if (proofTextButton) proofTextButton.addEventListener("click", insertProofReviewText);

    const cancelInvoiceButton = $("cancelInvoiceBtn");
    if (cancelInvoiceButton) cancelInvoiceButton.addEventListener("click", closeInvoiceModal);
    const saveInvoiceButton = $("saveInvoiceBtn");
    if (saveInvoiceButton) saveInvoiceButton.addEventListener("click", saveInvoiceLine);
    $("createOrderBtn").addEventListener("click", createOrder);
    const createCustomerButton = $("createCustomerBtn");
    if (createCustomerButton) createCustomerButton.addEventListener("click", createCustomer);
    const cancelCustomerEditButton = $("cancelCustomerEditBtn");
    if (cancelCustomerEditButton) cancelCustomerEditButton.addEventListener("click", function () {
      resetCustomerForm();
      setMsg("addCustomerStatus", "تم إلغاء التعديل.", false);
    });
    const refreshCustomersListButton = $("refreshCustomersListBtn");
    if (refreshCustomersListButton) refreshCustomersListButton.addEventListener("click", function () { loadCustomersList(true); });
    const customersListSearch = $("customersListSearch");
    if (customersListSearch) customersListSearch.addEventListener("input", renderCustomersList);
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

    const statsBar = $("statsBar");
    if (statsBar) {
      statsBar.addEventListener("click", function (evt) {
        const btn = evt.target.closest ? evt.target.closest("[data-stat-filter]") : null;
        if (!btn || !statsBar.contains(btn)) return;
        applyQuickStatFilter(btn.getAttribute("data-stat-filter"));
      });
    }

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
