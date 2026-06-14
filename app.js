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

  const STATUS_LIST = [
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
    isEditing: false,
    isSaving: false
  };

  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? "" : v);

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeRole(role) {
    return role && roleScreens[role] ? role : "service";
  }

  function buildUrl(action, params, callbackName) {
    const query = new URLSearchParams();
    query.set("action", action);
    if (callbackName) query.set("callback", callbackName);

    Object.keys(params || {}).forEach(function (key) {
      const value = params[key];
      if (value !== undefined && value !== null) query.set(key, value);
    });

    query.set("_t", Date.now().toString());
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
      }, 30000);

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

  function setLiveStatus(msg) {
    const el = $("liveStatus");
    if (!el) return;
    el.textContent = msg || "التحديث اللحظي يعمل كل 10 ثواني";
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
    loadRows(true);
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
        saveSession();
        renderHeader();
        renderTabs();
        toggleAddOrder();
        loadRows(true);
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
    if (!force && (state.isEditing || state.isSaving)) {
      setLiveStatus("التحديث متوقف مؤقتاً أثناء التعديل");
      return;
    }

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
      setLiveStatus("التحديث اللحظي يعمل كل 10 ثواني");
      state.isEditing = false;
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

    renderStats(filtered);
    renderTable(filtered);
  }

  function renderStats(rows) {
    const total = rows.length;
    const urgent = rows.filter((r) => text(r.priority) === "عاجل").length;
    const problem = rows.filter((r) => ["مشكلة", "متوقف"].indexOf(text(r.status)) !== -1).length;

    $("statsBar").innerHTML =
      '<span>الإجمالي: ' + total + '</span>' +
      '<span>عاجل: ' + urgent + '</span>' +
      '<span>مشاكل/متوقف: ' + problem + '</span>';
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
      tbody.innerHTML = '<tr><td colspan="11">لا توجد أوردرات مطابقة.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (r, i) {
      return "<tr data-index=\"" + i + "\" data-line-id=\"" + escapeHtml(r.lineId) + "\">" +
        "<td>" + escapeHtml(r.orderId) + "</td>" +
        "<td>" + escapeHtml(r.lineId) + "</td>" +
        "<td>" + escapeHtml(r.customer) + "</td>" +
        "<td>" + escapeHtml(r.customerPhone) + "</td>" +
        "<td>" + escapeHtml(r.department) + "</td>" +
        "<td>" + escapeHtml(r.itemName) + "</td>" +
        "<td>" + escapeHtml(r.qty) + "</td>" +
        "<td>" + escapeHtml(r.priority) + "</td>" +
        "<td>" + statusSelect(r.status, i) + "</td>" +
        "<td><input class=\"row-notes\" value=\"" + escapeHtml(r.notes) + "\"></td>" +
        "<td><button class=\"save-line\" data-i=\"" + i + "\">حفظ</button></td>" +
        "</tr>";
    }).join("");

    Array.prototype.forEach.call(tbody.querySelectorAll(".row-status, .row-notes"), function (input) {
      input.addEventListener("focus", pauseRefreshForEdit);
      input.addEventListener("input", pauseRefreshForEdit);
      input.addEventListener("change", pauseRefreshForEdit);
    });

    Array.prototype.forEach.call(tbody.querySelectorAll(".save-line"), function (btn) {
      btn.addEventListener("click", function () {
        saveLine(rows[Number(btn.dataset.i)], btn.closest("tr"));
      });
    });
  }

  function statusSelect(current, i) {
    return '<select class="row-status" data-i="' + i + '">' +
      STATUS_LIST.map(function (s) {
        return '<option value="' + escapeHtml(s) + '"' + (s === text(current) ? " selected" : "") + '>' + escapeHtml(s) + '</option>';
      }).join("") +
      '</select>';
  }

  function pauseRefreshForEdit() {
    state.isEditing = true;
    setLiveStatus("التحديث متوقف مؤقتاً أثناء التعديل - اضغط حفظ");
  }

  async function saveLine(row, tr) {
    if (!row || !tr) return;

    const status = tr.querySelector(".row-status").value;
    const notes = tr.querySelector(".row-notes").value;
    const btn = tr.querySelector(".save-line");

    state.isSaving = true;
    state.isEditing = true;
    setLiveStatus("جاري حفظ التعديل في الشيت...");
    btn.disabled = true;
    btn.textContent = "جاري الحفظ";

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
        btn.textContent = "حفظ";
        return;
      }

      row.status = status;
      row.notes = notes;
      btn.textContent = "تم الحفظ";
      setLoading("تم الحفظ في الشيت: " + new Date().toLocaleTimeString("ar-EG"));

      setTimeout(function () {
        state.isSaving = false;
        state.isEditing = false;
        loadRows(true);
      }, 500);
    } catch (err) {
      alert(err.message || "خطأ أثناء الحفظ.");
    } finally {
      setTimeout(function () {
        btn.disabled = false;
        if (btn.textContent !== "تم الحفظ") btn.textContent = "حفظ";
      }, 700);
      state.isSaving = false;
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
        setMsg("addOrderStatus", res.message || "فشل إضافة الأوردر.", true);
        return;
      }

      setMsg("addOrderStatus", "تم إضافة الأوردر في الشيت: " + res.orderId, false);
      ["newCustomerName", "newCustomerPhone", "newCustomerType", "newItemName", "newAssignedTo", "newNotes"].forEach(function (id) {
        $(id).value = "";
      });
      $("newQty").value = 1;
      $("customerSuggestions").classList.add("hidden");
      loadRows(true);
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
      const res = await api("searchCustomers", authParams({ q }));
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
      const res = await api("changePassword", authParams({ oldPassword, newPassword }));
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
    $("refreshBtn").addEventListener("click", function () { loadRows(true); });
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
