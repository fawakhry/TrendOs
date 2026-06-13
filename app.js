const CONFIG = window.TRENDOS_CONFIG || {};
let currentUser = null;
let currentScreen = null;

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
  if(saved){ currentUser = JSON.parse(saved); showMain(); }
}

function bindEvents(){
  $("loginBtn").addEventListener("click", login);
  $("password").addEventListener("keydown", e => { if(e.key === "Enter") login(); });
  $("logoutBtn").addEventListener("click", logout);
  $("refreshBtn").addEventListener("click", loadRows);
  $("changePassBtn").addEventListener("click", openPasswordModal);
  $("cancelPassBtn").addEventListener("click", closePasswordModal);
  $("savePassBtn").addEventListener("click", changePassword);
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

    function cleanup(){
      delete window[callbackName];
      if(script.parentNode) script.parentNode.removeChild(script);
    }

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
  if(!username || !password){ msg.textContent = "اكتب اسم المستخدم وكلمة المرور."; return; }
  msg.textContent = "جاري تسجيل الدخول...";
  try{
    const data = await api({ action:"login", username, password });
    if(!data.success){ msg.textContent = data.message || "بيانات الدخول غير صحيحة."; return; }
    currentUser = data.user;
    localStorage.setItem("trendos_user", JSON.stringify(currentUser));
    showMain();
  }catch(e){ msg.textContent = e.message; }
}

function logout(){ localStorage.removeItem("trendos_user"); location.reload(); }

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

function buildTabs(){
  const tabs = $("tabs"); tabs.innerHTML = "";
  allowedScreens().forEach(key=>{
    const btn = document.createElement("button");
    btn.className = "tab"; btn.textContent = SCREENS[key].label;
    btn.onclick = () => setScreen(key); btn.dataset.screen = key;
    tabs.appendChild(btn);
  });
}

function setScreen(screen){
  currentScreen = screen;
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.screen === screen));
  $("screenTitle").textContent = SCREENS[screen].title;
  loadRows();
}

async function loadRows(){
  $("loadingText").textContent = "جاري التحميل...";
  try{
    const data = await api({ action:"getRows", username:currentUser.username, token:currentUser.token, screen:currentScreen });
    if(!data.success) throw new Error(data.message || "تعذر تحميل البيانات.");
    renderTable(data.rows || []);
    $("loadingText").textContent = `عدد البنود: ${(data.rows || []).length}`;
  }catch(e){ $("loadingText").textContent = e.message; }
}

function renderTable(rows){
  const thead = $("ordersTable").querySelector("thead");
  const tbody = $("ordersTable").querySelector("tbody");
  const headers = ["Order ID","Line ID","العميل","القسم","البند","الكمية","الأولوية","الحالة","ملاحظات","تحديث"];
  thead.innerHTML = `<tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>`;
  tbody.innerHTML = "";
  rows.forEach(row=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(row.orderId)}</td><td>${esc(row.lineId)}</td><td>${esc(row.customer)}</td>
      <td>${esc(row.department)}</td><td>${esc(row.itemName)}</td><td>${esc(row.qty)}</td>
      <td class="priority">${esc(row.priority)}</td>
      <td><select class="status-select">${STATUS_OPTIONS.map(s=>`<option ${s===row.status?"selected":""}>${s}</option>`).join("")}</select></td>
      <td><input class="note-input" value="${esc(row.notes)}" placeholder="ملاحظات"></td>
      <td><button class="update-btn">حفظ</button></td>`;
    tr.querySelector(".update-btn").onclick = () => updateRow(row, tr);
    tbody.appendChild(tr);
  });
}

async function updateRow(row, tr){
  const status = tr.querySelector(".status-select").value;
  const notes = tr.querySelector(".note-input").value;
  const btn = tr.querySelector(".update-btn");
  btn.textContent = "جاري..."; btn.disabled = true;
  try{
    const data = await api({ action:"updateLine", username:currentUser.username, token:currentUser.token, lineId:row.lineId, status, notes });
    if(!data.success) throw new Error(data.message || "فشل الحفظ.");
    btn.textContent = "تم";
    setTimeout(()=>{btn.textContent="حفظ"; btn.disabled=false;}, 900);
  }catch(e){ alert(e.message); btn.textContent="حفظ"; btn.disabled=false; }
}

function openPasswordModal(){ $("passwordModal").classList.remove("hidden"); $("oldPassword").value=""; $("newPassword").value=""; $("confirmPassword").value=""; $("passMsg").textContent=""; }
function closePasswordModal(){ $("passwordModal").classList.add("hidden"); }

async function changePassword(){
  const oldPassword = $("oldPassword").value.trim();
  const newPassword = $("newPassword").value.trim();
  const confirmPassword = $("confirmPassword").value.trim();
  const msg = $("passMsg");
  if(!oldPassword || !newPassword || !confirmPassword){ msg.textContent = "اكمل كل الخانات."; return; }
  if(newPassword.length < 4){ msg.textContent = "كلمة المرور الجديدة لا تقل عن 4 أرقام/حروف."; return; }
  if(newPassword !== confirmPassword){ msg.textContent = "تأكيد كلمة المرور غير مطابق."; return; }
  msg.textContent = "جاري التغيير...";
  try{
    const data = await api({ action:"changePassword", username:currentUser.username, token:currentUser.token, oldPassword, newPassword });
    if(!data.success){ msg.textContent = data.message || "فشل تغيير كلمة المرور."; return; }
    msg.textContent = "تم تغيير كلمة المرور بنجاح.";
    setTimeout(closePasswordModal, 800);
  }catch(e){ msg.textContent = e.message; }
}

function esc(v){ return String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
