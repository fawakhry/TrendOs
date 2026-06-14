(function () {
  "use strict";

  const API_URL = (window.TREND_API_URL || window.API_URL || "").trim();
  const REFRESH_MS = 10000;

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

  const statuses = [
    "طلب جديد",
    "جاهز للطباعة",
    "بدأ التنفيذ",
    "تحت التنفيذ",
    "تم التنفيذ",
    "جاهز للاستلام",
    "تم التسليم",
    "مشكلة",
    "متوقف"
  ];

  const state = {
    user: null,
    screen: "service",
    rows: [],
    refreshTimer: null,
    suggestionTimer: null,
    tableSuggestionTimer: null,
    saving: false,
    editing: false
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

  function buildWhatsAppMessage(row, mode) {
    const customer = row.customer ? " يا " + row.customer : "";
    const orderId = row.orderId || row.lineId || "-";
    const item = row.itemName || "الأوردر";
    const dept = row.department || "-";
    const status = row.status || "طلب جديد";

    if (mode === "ready") {
      if (status === "تم التسليم") {
        return "أهلاً" + customer + " 🌟\nتم تسليم الأوردر رقم " + orderId + ".\nشكراً لتعاملكم مع Trend Mall.";
      }
      return "أهلاً" + customer + " 🌟\nالأوردر رقم " + orderId + " جاهز للاستلام.\nنوع الشغل: " + item + "\nالقسم: " + dept + "\nTrend Mall";
    }

    return "أهلاً" + customer + " 👋\nبخصوص الأوردر رقم " + orderId + "\nالحالة الحالية: " + status + "\nالقسم: " + dept + "\nنوع الشغل: " + item + (row.notes ? "\nملاحظات: " + row.notes : "") + "\nTrend Mall";
  }

  function openWhatsAppUrl(phone, message) {
    const normalized = whatsappPhone(phone);
    if (!normalized) {
      alert("رقم العميل غير موجود أو غير صالح لفتح واتساب.");
      return false;
    }
    const url = "https://wa.me/" + normalized + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener");
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
    renderHeader();
    renderTabs();
    toggleAddOrder();
    toggleAddCustomer();
    loadRows();
    startRefresh();
  }

  function renderHeader() {
    const user = state.user || {};
    $("welcomeTitle").textContent = "أهلاً " + (user.name || user.username || "");
    $("roleLabel").textContent = "القسم: " + (user.department || "-") + " | الصلاحية: " + (user.role || "-");
    $("screenTitle").textContent = screens[state.screen] || "الأوردرات";
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
      setLoading("آخر تحديث: " + new Date().toLocaleTimeString("ar-EG"));
    } catch (err) {
      setLoading(err.message || "خطأ في التحميل.", true);
    }
  }

  function applyFiltersAndRender() {
    const q = ($("tableSearch").value || "").trim().toLowerCase();
    const status = $("statusFilter").value || "";
    const priority = $("priorityFilter").value || "";

    const filtered = state.rows.filter(function (r) {
      const blob = [r.orderId, r.lineId, r.customer, r.customerPhone, r.department, r.itemName, r.notes]
        .map(text).join(" ").toLowerCase();
      if (q && blob.indexOf(q) === -1) return false;
      if (status && text(r.status) !== status) return false;
      if (priority && text(r.priority) !== priority) return false;
      return true;
    });

    renderCurrentOrder(filtered);
    renderStats(filtered);
    renderTable(filtered);
  }

  function renderCurrentOrder(rows) {
    const bar = $("currentOrderBar");
    if (!bar) return;

    const finishedStatuses = ["تم التنفيذ", "جاهز للاستلام", "تم التسليم"];
    const priorityRank = { "عاجل": 0, "VIP": 0, "عادي": 1, "مؤجل": 2 };

    const candidates = rows.map(function (r, i) {
      return { row: r, index: i };
    }).filter(function (x) {
      return finishedStatuses.indexOf(text(x.row.status)) === -1;
    }).sort(function (a, b) {
      const pa = Object.prototype.hasOwnProperty.call(priorityRank, text(a.row.priority)) ? priorityRank[text(a.row.priority)] : 9;
      const pb = Object.prototype.hasOwnProperty.call(priorityRank, text(b.row.priority)) ? priorityRank[text(b.row.priority)] : 9;
      return (pa - pb) || (a.index - b.index);
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
    const urgent = rows.filter(function (r) { return text(r.priority) === "عاجل"; }).length;
    const problem = rows.filter(function (r) { return ["مشكلة", "متوقف"].indexOf(text(r.status)) !== -1; }).length;
    $("statsBar").innerHTML =
      '<span>الإجمالي: <b>' + total + '</b></span>' +
      '<span>عاجل: <b>' + urgent + '</b></span>' +
      '<span>مشاكل/متوقف: <b>' + problem + '</b></span>';
  }

  function renderTable(rows) {
    const table = $("ordersTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    thead.innerHTML =
      "<tr>" +
      "<th>الأوردر</th>" +
      "<th>البند</th>" +
      "<th>العميل</th>" +
      "<th>رقم العميل</th>" +
      "<th>القسم</th>" +
      "<th>نوع الشغل</th>" +
      "<th>الكمية</th>" +
      "<th>الأولوية</th>" +
      "<th>الحالة</th>" +
      "<th>ملاحظات</th>" +
      "<th>AI واتساب</th>" +
      "<th>حفظ</th>" +
      "</tr>";

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="12" class="empty">لا توجد أوردرات مطابقة.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (r, i) {
      return "<tr data-i=\"" + i + "\">" +
        "<td>" + escapeHtml(r.orderId) + "</td>" +
        "<td>" + escapeHtml(r.lineId) + "</td>" +
        "<td>" + escapeHtml(r.customer) + "</td>" +
        "<td>" + escapeHtml(r.customerPhone) + "</td>" +
        "<td>" + escapeHtml(r.department) + "</td>" +
        "<td>" + escapeHtml(r.itemName) + "</td>" +
        "<td>" + escapeHtml(r.qty) + "</td>" +
        "<td>" + escapeHtml(r.priority) + "</td>" +
        "<td>" + statusSelect(r.status) + "</td>" +
        "<td><input class=\"row-notes\" value=\"" + escapeHtml(r.notes) + "\" placeholder=\"ملاحظات\"></td>" +
        "<td>" + whatsappActions(r, i) + "</td>" +
        "<td><button class=\"primary save-line\" data-i=\"" + i + "\">حفظ</button></td>" +
        "</tr>";
    }).join("");

    Array.prototype.forEach.call(tbody.querySelectorAll(".row-status, .row-notes"), function (el) {
      el.addEventListener("focus", function () { state.editing = true; });
      el.addEventListener("input", function () { state.editing = true; });
      el.addEventListener("change", function () { state.editing = true; });
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".save-line"), function (btn) {
      btn.addEventListener("click", function () {
        saveLine(rows[Number(btn.dataset.i)], btn.closest("tr"));
      });
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".wa-status"), function (btn) {
      btn.addEventListener("click", function () {
        sendWhatsApp(rows[Number(btn.dataset.i)], "status", btn);
      });
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".wa-ready"), function (btn) {
      btn.addEventListener("click", function () {
        sendWhatsApp(rows[Number(btn.dataset.i)], "ready", btn);
      });
    });
  }



  function whatsappActions(row, i) {
    const disabled = whatsappPhone(row.customerPhone) ? "" : " disabled";
    const notified = text(row.customerNotified) === "نعم" ? '<small class="wa-notified">تم الإبلاغ</small>' : "";
    const readyDisabled = isReadyForCustomer(row.status) ? disabled : " disabled";
    return '<div class="whatsapp-actions">' +
      '<button type="button" class="wa-btn wa-status" data-i="' + i + '"' + disabled + '>AI يرد بالحالة</button>' +
      '<button type="button" class="wa-btn wa-ready" data-i="' + i + '"' + readyDisabled + '>إبلاغ العميل</button>' +
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
      ? "تم فتح واتساب برسالة الإبلاغ. هل تم إرسال الرسالة للعميل؟"
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

      row.status = status;
      row.notes = notes;
      btn.textContent = "تم الحفظ";
      state.editing = false;
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

  async function createCustomer() {
    setMsg("addCustomerStatus", "", false);

    const params = authParams({
      customerName: $("newClientName").value.trim(),
      manager: $("newClientManager").value.trim() || ((state.user || {}).name || (state.user || {}).username || ""),
      phone: $("newClientPhone").value.trim(),
      extraPhone: $("newClientExtraPhone").value.trim(),
      customerType: $("newClientType").value.trim(),
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

  async function createOrder() {
    setMsg("addOrderStatus", "", false);

    const params = authParams({
      customerName: $("newCustomerName").value.trim(),
      customerPhone: $("newCustomerPhone").value.trim(),
      customerType: $("newCustomerType").value.trim(),
      department: $("newDepartment").value,
      itemName: $("newItemName").value.trim(),
      qty: $("newQty").value || "1",
      priority: $("newPriority").value,
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

      setMsg("addOrderStatus", "تم إضافة الأوردر في الشيت: " + res.orderId, false);
      ["newCustomerName", "newCustomerPhone", "newCustomerType", "newItemName", "newAssignedTo", "newNotes"].forEach(function (id) {
        $(id).value = "";
      });
      $("newQty").value = 1;
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
      applyFiltersAndRender();
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
          applyFiltersAndRender();
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
    $("createOrderBtn").addEventListener("click", createOrder);
    const createCustomerButton = $("createCustomerBtn");
    if (createCustomerButton) createCustomerButton.addEventListener("click", createCustomer);

    ["tableSearch", "statusFilter", "priorityFilter"].forEach(function (id) {
      $(id).addEventListener("input", applyFiltersAndRender);
      $(id).addEventListener("change", applyFiltersAndRender);
    });

    wireCustomerSearch();
    wireTableCustomerSearch();
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireEvents();
    if (loadSession()) bootMain();
    else showLogin();
  });
})();
