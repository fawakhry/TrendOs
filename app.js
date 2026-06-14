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
    saving: false,
    editing: false
  };

  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? "" : v);

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
      "<th>حفظ</th>" +
      "</tr>";

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="empty">لا توجد أوردرات مطابقة.</td></tr>';
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
  }

  function statusSelect(current) {
    return '<select class="row-status">' + statuses.map(function (s) {
      return '<option value="' + escapeHtml(s) + '"' + (text(current) === s ? " selected" : "") + '>' + escapeHtml(s) + '</option>';
    }).join("") + '</select>';
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

    ["tableSearch", "statusFilter", "priorityFilter"].forEach(function (id) {
      $(id).addEventListener("input", applyFiltersAndRender);
      $(id).addEventListener("change", applyFiltersAndRender);
    });

    wireCustomerSearch();
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireEvents();
    if (loadSession()) bootMain();
    else showLogin();
  });
})();
