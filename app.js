const CONFIG = window.TRENDOS_CONFIG || {};
let currentUser = null;
let currentScreen = null;
let rowsCache = [];
let customerSearchTimer = null;
let forcedPasswordChange = false;

const $ = (id) => document.getElementById(id);

const SCREENS = {
  admin: { label: "الإدارة", title: "كل بنود التشغيل" },
  print: { label: "الطباعة", title: "شاشة الطباعة" },
  laser: { label: "الليزر", title: "شاشة الليزر" },
  press: { label: "المكبس", title: "شاشة المكبس" },
  service: { label: "خدمة العملاء", title: "شاشة خدمة العملاء" }
};

const STATUS_OPTIONS = ["طلب جديد","جاهز للطباعة","بدأ التنفيذ","تحت التنفيذ","تم التنفيذ","جاهز للاستلام","تم التسليم","مشكلة","متوقف"];

init();

function init(){
  bindEvents();
  const saved = localStorage.getItem("trendos_user");
  if(saved){
    currentUser = JSON.parse(saved);
    showMain();
  }
}

function bindEvents(){
  $("loginBtn").addEventListener("click", login);
  $("password").addEventListener("keydown", e => { if(e.key === "Enter") login(); });
  $("logoutBtn").addEventListener("click", logout);
  $("refreshBtn").addEventListener("click", loadRows);
  $("changePassBtn").addEventListener("click", () => openPasswordModal(false));
  $("cancelPassBtn").addEventListener("click", () => { if(!forcedPasswordChange) closePasswordModal(); });
  $("savePassBtn").addEventListener("click", changePassword);
  $("createOrderBtn").addEventListener("click", createManualOrder);
  $("newDepartment").addEventListener("change", suggestAssignedTo);
  $("newCustomerName").addEventListener("input", handleCustomerInput);
  $("newCustomerName").addEventListener("blur", () => setTimeout(()=>hideSuggestions(), 180));
  $("tableSearch").addEventListener("input", applyTableFilters);
  $("statusFilter").addEventListener("change", applyTableFilters);
  $("priorityFilter").addEventListener("change", applyTableFilters);
}

function api(params){
  return new Promise((resolve, reject) => {
    if(!CONFIG.apiUrl || CONFIG.apiUrl.includes("PUT_APPS_SCRIPT")){
      reject(new Error("رابط API غير مضبوط في config.js"));
      return;
    }

    const callbackName = "trendos_jsonp_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const query = new URLSearchParams({ ...params, callback: callbackName }).toString();
    const script = document.createElement("script");
    let done = false;

    window[callbackName] = (data) => {
      done = true;
      cleanup();
      resolve(data);
    };

    const cleanup = () => {
      delete window[callbackName];
      if(script.parentNode) script.parentNode.removeChild(script);
    };

    script.onerror = () => {
      if(done) return;
      cleanup();
      reject(new Error("فشل الاتصال بالسيرفر. تأكد من رابط Apps Script وصلاحيات Web App."));
    };

    script.src = CONFIG.apiUrl + "?" + query;
    document.body.appendChild(script);

    setTimeout(() => {
      if(done) return;
      cleanup();
      reject(new Error("انتهت مهلة الاتصال بالسيرفر."));
    }, 20000);
  });
}

async function login(){
  const username = $("username").value.trim();
  const password = $("password").value.trim();
  const msg = $("loginMsg");

  if(!username || !password){
    msg.textContent = "اكتب اسم المستخدم وكلمة المرور.";
    return;
  }

  msg.textContent = "جاري تسجيل الدخول...";

  try{
    const data = await api({ action:"login", username, password });

    if(!data.success){
      msg.textContent = data.message || "بيانات الدخول غير صحيحة.";
      return;
    }

    currentUser = data.user;
    localStorage.setItem("trendos_user", JSON.stringify(currentUser));
    showMain();

    if(currentUser.mustChange){
      openPasswordModal(true);
    }
  }catch(e){
    msg.textContent = e.message;
  }
}

function logout(){
  localStorage.removeItem("trendos_user");
  currentUser = null;
  location.reload();
}

function showMain(){
  $("loginView").classList.add("hidden");
  $("mainView").classList.remove("hidden");
  $("welcomeTitle").textContent = `أهلاً ${currentUser.name}`;
  $("roleLabel").textContent = `الصلاحية: ${currentUser.role} | القسم: ${currentUser.department || "-"}`;
  buildTabs();

  currentScreen = CONFIG.defaultScreens?.[currentUser.role] || currentUser.role || "service";
  if(!SCREENS[currentScreen]) currentScreen = "service";

  setScreen(currentScreen);
}

function allowedScreens(){
  if(currentUser.role === "admin") return ["admin","service","print","laser","press"];
  if(currentUser.role === "print") return ["print"];
  if(currentUser.role === "laser") return ["laser"];
  if(currentUser.role === "press") return ["press"];
  if(currentUser.role === "service") return ["service"];
  return ["service"];
}

function canCreateOrders(){
  return currentUser && (currentUser.role === "admin" || currentUser.role === "service");
}

function buildTabs(){
  const tabs = $("tabs");
  tabs.innerHTML = "";

  allowedScreens().forEach(key=>{
    const btn = document.createElement("button");
    btn.className = "tab";
    btn.textContent = SCREENS[key].label;
    btn.onclick = () => setScreen(key);
    btn.dataset.screen = key;
    tabs.appendChild(btn);
  });
}

function setScreen(screen){
  currentScreen = screen;
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.screen === screen));
  $("screenTitle").textContent = SCREENS[screen].title;

  if(canCreateOrders() && (screen === "service" || screen === "admin")){
    $("addOrderCard").classList.remove("hidden");
    suggestAssignedTo();
  }else{
    $("addOrderCard").classList.add("hidden");
  }

  loadRows();
}

async function loadRows(){
  $("loadingText").textContent = "جاري التحميل...";

  try{
    const data = await api({
      action:"getRows",
      username:currentUser.username,
      token:currentUser.token,
      screen:currentScreen
    });

    if(!data.success) throw new Error(data.message || "تعذر تحميل البيانات.");

    rowsCache = sortRows(data.rows || []);
    renderCurrentOrder(rowsCache);
    renderStats(rowsCache);
    applyTableFilters();
    $("loadingText").textContent = `عدد البنود: ${rowsCache.length}`;
  }catch(e){
    $("loadingText").textContent = e.message;
  }
}

function priorityRank(p){
  if(p === "عاجل") return 0;
  if(p === "عادي") return 1;
  if(p === "مؤجل") return 2;
  return 3;
}

function sortRows(rows){
  return [...rows].sort((a,b)=>{
    // عاجل أولاً
    const p = priorityRank(a.priority) - priorityRank(b.priority);
    if(p !== 0) return p;

    // بعد ذلك الأقدم ثم الأحدث حسب ترتيب الصف في الشيت
    const ar = Number(a.rowNumber || 0);
    const br = Number(b.rowNumber || 0);
    if(ar && br) return ar - br;

    return String(a.orderId || "").localeCompare(String(b.orderId || ""));
  });
}

function renderCurrentOrder(rows){
  const box = $("currentOrderBar");
  if(!box) return;

  if(!rows || !rows.length){
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  const departments = currentOrderDepartments();
  const cards = [];

  departments.forEach(dep => {
    const current = findCurrentForDepartment(rows, dep);

    if(current){
      cards.push(`
        <div class="current-order-card">
          <span class="dept-name">${esc(dep)}</span>
          <span class="order-number">${esc(current.orderId || "")}</span>
          <span>${esc(current.customer || "")}</span>
          <span class="phone">${esc(current.customerPhone || "")}</span>
          <span>${esc(current.priority || "")}</span>
        </div>
      `);
    }else{
      cards.push(`
        <div class="current-order-card empty">
          <span class="dept-name">${esc(dep)}</span>
          <span>لا يوجد أوردر حالي</span>
        </div>
      `);
    }
  });

  box.innerHTML = `
    <div class="current-order-title">الأوردر الحالي</div>
    ${cards.join("")}
  `;
  box.classList.remove("hidden");
}

function renderStats(rows){
  const counts = {};
  rows.forEach(r => counts[r.status || "بدون حالة"] = (counts[r.status || "بدون حالة"] || 0) + 1);

  const important = ["طلب جديد","جاهز للطباعة","بدأ التنفيذ","تحت التنفيذ","تم التنفيذ","مشكلة"];
  const html = important
    .filter(k => counts[k])
    .map(k => `<span class="stat">${k}: <strong>${counts[k]}</strong></span>`)
    .join("");

  $("statsBar").innerHTML = html || `<span class="stat">لا توجد بنود</span>`;
}

function applyTableFilters(){
  const search = $("tableSearch").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const priority = $("priorityFilter").value;

  let rows = rowsCache;

  if(status) rows = rows.filter(r => r.status === status);
  if(priority) rows = rows.filter(r => r.priority === priority);

  if(search){
    rows = rows.filter(r => {
      const blob = [r.orderId,r.lineId,r.customer,r.customerPhone,r.department,r.itemName,r.priority,r.status,r.notes].join(" ").toLowerCase();
      return blob.includes(search);
    });
  }

  renderTable(rows);
}

function renderTable(rows){
  const thead = $("ordersTable").querySelector("thead");
  const tbody = $("ordersTable").querySelector("tbody");
  const headers = ["رقم الأوردر","Line ID","العميل","رقم العميل","القسم","البند","الكمية","الأولوية","الحالة","ملاحظات","تحديث"];

  thead.innerHTML = `<tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>`;
  tbody.innerHTML = "";

  rows.forEach(row=>{
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${esc(row.orderId)}</td>
      <td>${esc(row.lineId)}</td>
      <td>${esc(row.customer)}</td>
      <td class="phone">${esc(row.customerPhone || "")}</td>
      <td>${esc(row.department)}</td>
      <td>${esc(row.itemName)}</td>
      <td>${esc(row.qty)}</td>
      <td>${priorityBadge(row.priority)}</td>
      <td>
        <select class="status-select">
          ${STATUS_OPTIONS.map(s=>`<option ${s===row.status?"selected":""}>${s}</option>`).join("")}
        </select>
      </td>
      <td><input class="note-input" value="${esc(row.notes)}" placeholder="ملاحظات"></td>
      <td><button class="update-btn">حفظ</button></td>
    `;

    tr.querySelector(".update-btn").onclick = () => updateRow(row, tr);
    tbody.appendChild(tr);
  });
}

function priorityBadge(p){
  let cls = "priority-badge ";
  if(p === "عاجل") cls += "priority-urgent";
  else if(p === "عادي") cls += "priority-normal";
  else if(p === "مؤجل") cls += "priority-later";
  else cls += "priority-later";
  return `<span class="${cls}">${esc(p || "")}</span>`;
}

async function updateRow(row, tr){
  const status = tr.querySelector(".status-select").value;
  const notes = tr.querySelector(".note-input").value;
  const btn = tr.querySelector(".update-btn");

  btn.textContent = "جاري...";
  btn.disabled = true;

  try{
    const data = await api({
      action:"updateLine",
      username:currentUser.username,
      token:currentUser.token,
      lineId:row.lineId,
      status,
      notes
    });

    if(!data.success) throw new Error(data.message || "فشل الحفظ.");

    row.status = status;
    row.notes = notes;

    btn.textContent = "تم";
    setTimeout(()=>{
      btn.textContent="حفظ";
      btn.disabled=false;
      rowsCache = sortRows(rowsCache);
      renderCurrentOrder(rowsCache);
      renderStats(rowsCache);
      applyTableFilters();
    }, 600);
  }catch(e){
    alert(e.message);
    btn.textContent="حفظ";
    btn.disabled=false;
  }
}

function suggestAssignedTo(){
  const dep = $("newDepartment").value;
  let name = "";

  if(dep === "طباعة") name = "وائل";
  if(dep === "ليزر") name = "جابر";
  if(dep === "مكبس") name = "المكبس";
  if(dep === "متعدد الأقسام") name = "وائل + جابر";

  $("newAssignedTo").value = name;
}

function handleCustomerInput(){
  const q = $("newCustomerName").value.trim();

  clearTimeout(customerSearchTimer);

  if(q.length < 1){
    hideSuggestions();
    return;
  }

  customerSearchTimer = setTimeout(() => searchCustomers(q), 250);
}

async function searchCustomers(q){
  try{
    const data = await api({
      action:"searchCustomers",
      username:currentUser.username,
      token:currentUser.token,
      q
    });

    if(!data.success){
      hideSuggestions();
      return;
    }

    renderCustomerSuggestions(data.customers || []);
  }catch(e){
    hideSuggestions();
  }
}

function renderCustomerSuggestions(customers){
  const box = $("customerSuggestions");

  if(!customers.length){
    box.innerHTML = `<div class="suggestion-item"><div class="suggestion-name">لا توجد نتائج</div></div>`;
    box.classList.remove("hidden");
    return;
  }

  box.innerHTML = customers.map((c, idx)=>`
    <div class="suggestion-item" data-idx="${idx}">
      <div class="suggestion-name">${esc(c.name || "")}</div>
      <div class="suggestion-meta">${esc(c.phone || "")}${c.type ? " | " + esc(c.type) : ""}</div>
      ${c.manager ? `<div class="suggestion-meta">${esc(c.manager)}</div>` : ""}
    </div>
  `).join("");

  [...box.querySelectorAll(".suggestion-item")].forEach(item=>{
    item.onclick = () => {
      const c = customers[Number(item.dataset.idx)];
      $("newCustomerName").value = c.name || "";
      $("newCustomerPhone").value = c.phone || "";
      $("newCustomerType").value = c.type || "";
      hideSuggestions();
    };
  });

  box.classList.remove("hidden");
}

function hideSuggestions(){
  $("customerSuggestions").classList.add("hidden");
}

async function createManualOrder(){
  const payload = {
    action:"createManualOrder",
    username:currentUser.username,
    token:currentUser.token,
    customerName:$("newCustomerName").value.trim(),
    customerPhone:$("newCustomerPhone").value.trim(),
    customerType:$("newCustomerType").value.trim(),
    department:$("newDepartment").value,
    itemName:$("newItemName").value.trim(),
    qty:$("newQty").value || "1",
    priority:$("newPriority").value || "عاجل",
    status:$("newStatus").value || "طلب جديد",
    assignedTo:$("newAssignedTo").value.trim(),
    notes:$("newNotes").value.trim()
  };

  const msg = $("addOrderStatus");
  msg.className = "";

  if(!payload.customerName || !payload.department){
    msg.textContent = "لم يتم تسجيل الأوردر: اسم الشات والقسم مطلوبين.";
    msg.classList.add("error-msg");
    return;
  }

  msg.textContent = "جاري إضافة الأوردر...";
  $("createOrderBtn").disabled = true;

  try{
    const data = await api(payload);

    if(!data.success){
      msg.textContent = "لم يتم تسجيل الأوردر: " + (data.message || "خطأ غير معروف.");
      msg.classList.add("error-msg");
      $("createOrderBtn").disabled = false;
      return;
    }

    msg.textContent = `تم تسجيل الأوردر بنجاح: ${data.orderId}${data.linesCreated ? " | عدد البنود: " + data.linesCreated : ""}`;
    msg.classList.add("success-msg");

    ["newCustomerName","newCustomerPhone","newCustomerType","newItemName","newNotes"].forEach(id=>$(id).value = "");
    $("newQty").value = "1";
    $("newPriority").value = "عاجل";
    $("newStatus").value = "طلب جديد";
    suggestAssignedTo();
    hideSuggestions();
    await loadRows();
  }catch(e){
    msg.textContent = "لم يتم تسجيل الأوردر: " + e.message;
    msg.classList.add("error-msg");
  }finally{
    $("createOrderBtn").disabled = false;
  }
}

function openPasswordModal(force){
  forcedPasswordChange = !!force;
  $("passwordModal").classList.remove("hidden");
  $("oldPassword").value="";
  $("newPassword").value="";
  $("confirmPassword").value="";
  $("passMsg").textContent = force ? "يجب تغيير كلمة المرور الافتراضية قبل الاستمرار." : "";
  $("cancelPassBtn").style.display = force ? "none" : "";
}

function closePasswordModal(){
  forcedPasswordChange = false;
  $("passwordModal").classList.add("hidden");
  $("cancelPassBtn").style.display = "";
}

async function changePassword(){
  const oldPassword = $("oldPassword").value.trim();
  const newPassword = $("newPassword").value.trim();
  const confirmPassword = $("confirmPassword").value.trim();
  const msg = $("passMsg");

  if(!oldPassword || !newPassword || !confirmPassword){
    msg.textContent = "اكمل كل الخانات.";
    return;
  }

  if(newPassword.length < 4){
    msg.textContent = "كلمة المرور الجديدة لا تقل عن 4 أرقام/حروف.";
    return;
  }

  if(newPassword !== confirmPassword){
    msg.textContent = "تأكيد كلمة المرور غير مطابق.";
    return;
  }

  msg.textContent = "جاري التغيير...";

  try{
    const data = await api({
      action:"changePassword",
      username:currentUser.username,
      token:currentUser.token,
      oldPassword,
      newPassword
    });

    if(!data.success){
      msg.textContent = data.message || "فشل تغيير كلمة المرور.";
      return;
    }

    currentUser.mustChange = false;
    localStorage.setItem("trendos_user", JSON.stringify(currentUser));

    msg.textContent = "تم تغيير كلمة المرور بنجاح.";
    setTimeout(closePasswordModal, 800);
  }catch(e){
    msg.textContent = e.message;
  }
}

function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
