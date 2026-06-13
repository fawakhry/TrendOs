const SHEET_NAME_USERS = "المستخدمين";
const SHEET_NAME_LINES = "بنود الأوردرات";
const SHEET_NAME_ORDERS = "الأوردرات";
const SHEET_NAME_CUSTOMERS = "العملاء";
const DEFAULT_PASSWORD = "0000";

function doGet(e) {
  const action = String(e.parameter.action || "").trim();
  const callback = String(e.parameter.callback || "").trim();

  let result;

  try {
    if (action === "login") result = login_(e);
    else if (action === "getRows") result = getRows_(e);
    else if (action === "updateLine") result = updateLine_(e);
    else if (action === "changePassword") result = changePassword_(e);
    else if (action === "createManualOrder") result = createManualOrder_(e);
    else if (action === "searchCustomers") result = searchCustomers_(e);
    else result = { success:false, message:"Action غير معروف." };
  } catch (err) {
    result = { success:false, message:"خطأ في السيرفر: " + err.message };
  }

  return output_(result, callback);
}

function ss_(){ return SpreadsheetApp.getActiveSpreadsheet(); }

function output_(data, callback){
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function normalize_(v){ return String(v || "").trim(); }

function headersMap_(sheet){
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h,i)=>{ if(h) map[normalize_(h)] = i + 1; });
  return map;
}

function firstCol_(h, names, fallback){
  for(var i=0;i<names.length;i++){
    if(h[names[i]]) return h[names[i]];
  }
  return fallback || 0;
}

function ensureUsersSetup_(){
  const sheet = ss_().getSheetByName(SHEET_NAME_USERS);
  if(!sheet) throw new Error('شيت المستخدمين غير موجود.');

  let h = headersMap_(sheet);
  if(!h["Token"]) sheet.getRange(1, sheet.getLastColumn()+1).setValue("Token");

  h = headersMap_(sheet);
  if(!h["آخر دخول"]) sheet.getRange(1, sheet.getLastColumn()+1).setValue("آخر دخول");
}

function findUser_(username){
  ensureUsersSetup_();

  const sheet = ss_().getSheetByName(SHEET_NAME_USERS);
  const data = sheet.getDataRange().getValues();
  const h = headersMap_(sheet);

  const colName = h["اسم المستخدم"];
  const colDept = h["القسم"];
  const colRole = h["الصلاحية"];
  const colActive = h["مفعل؟"];
  const colPassword = h["كلمة المرور"];
  const colMustChange = h["يجب تغيير كلمة المرور؟"];
  const colToken = h["Token"];
  const colLastLogin = h["آخر دخول"];

  if(!colName) throw new Error('عمود "اسم المستخدم" غير موجود في شيت المستخدمين.');
  if(!colPassword) throw new Error('عمود "كلمة المرور" غير موجود في شيت المستخدمين.');

  for(let i=1;i<data.length;i++){
    const row = data[i];
    const name = normalize_(row[colName-1]);

    if(name === username){
      return {
        sheet,
        rowNumber:i+1,
        username:name,
        department: colDept ? normalize_(row[colDept-1]) : "",
        role: colRole ? normalize_(row[colRole-1]) : "",
        active: colActive ? normalize_(row[colActive-1]) : "نعم",
        password: normalize_(row[colPassword-1]) || DEFAULT_PASSWORD,
        mustChange: colMustChange ? normalize_(row[colMustChange-1]) : "",
        token: colToken ? normalize_(row[colToken-1]) : "",
        colPassword,
        colToken,
        colLastLogin
      };
    }
  }
  return null;
}

function roleFromArabic_(role, department){
  const r = normalize_(role);
  const d = normalize_(department);

  if(r.includes("مدير") || r.toLowerCase() === "admin") return "admin";
  if(d.includes("طباعة") || r.includes("طباعة") || r.toLowerCase() === "print") return "print";
  if(d.includes("ليزر") || r.includes("ليزر") || r.toLowerCase() === "laser") return "laser";
  if(d.includes("مكبس") || r.includes("مكبس") || r.toLowerCase() === "press") return "press";
  if(r.includes("خدمة") || d.includes("خدمة") || r.toLowerCase() === "service") return "service";
  return "service";
}

function login_(e){
  const username = normalize_(e.parameter.username);
  const password = normalize_(e.parameter.password);

  if(!username || !password) return { success:false, message:"اكتب اسم المستخدم وكلمة المرور." };

  const user = findUser_(username);
  if(!user) return { success:false, message:"المستخدم غير موجود." };
  if(user.active && user.active !== "نعم") return { success:false, message:"هذا المستخدم غير مفعل." };
  if(user.password !== password) return { success:false, message:"كلمة المرور غير صحيحة." };

  const token = Utilities.getUuid();
  user.sheet.getRange(user.rowNumber, user.colToken).setValue(token);
  if(user.colLastLogin) user.sheet.getRange(user.rowNumber, user.colLastLogin).setValue(new Date());

  return {
    success:true,
    user:{
      username:user.username,
      name:user.username,
      department:user.department,
      role:roleFromArabic_(user.role, user.department),
      mustChange:user.mustChange === "نعم" || user.password === DEFAULT_PASSWORD,
      token
    }
  };
}

function authorize_(username, token){
  const user = findUser_(normalize_(username));
  if(!user) return { ok:false, message:"المستخدم غير موجود." };
  if(user.active && user.active !== "نعم") return { ok:false, message:"المستخدم غير مفعل." };
  if(!token || user.token !== token) return { ok:false, message:"انتهت الجلسة. سجل الدخول مرة أخرى." };
  return { ok:true, user };
}

function searchCustomers_(e){
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return { success:false, message:auth.message };

  const q = normalize_(e.parameter.q).toLowerCase();
  if(!q) return { success:true, customers:[] };

  const sheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  if(!sheet) return { success:false, message:"شيت العملاء غير موجود." };

  const data = sheet.getDataRange().getValues();
  const h = headersMap_(sheet);

  const colName = firstCol_(h, ["اسم الشات / المكتب","اسم العميل","Customer Name"], 1);
  const colManager = firstCol_(h, ["اسم المسؤول","المسؤول","Manager"], 2);
  const colPhone = firstCol_(h, ["رقم العميل الأساسي","رقم العميل","رقم الهاتف","Phone"], 3);
  const colExtra = firstCol_(h, ["رقم إضافي","رقم إضافى","Extra Phone"], 4);
  const colType = firstCol_(h, ["نوع العميل","Customer Type"], 5);
  const colActive = firstCol_(h, ["مفعل؟"], 6);

  const out = [];
  const seen = {};

  for(let i=1;i<data.length;i++){
    const row = data[i];

    if(colActive && normalize_(row[colActive-1]) && normalize_(row[colActive-1]) !== "نعم") continue;

    const name = normalize_(row[colName-1]);
    const manager = colManager ? normalize_(row[colManager-1]) : "";
    const phone = colPhone ? normalize_(row[colPhone-1]) : "";
    const extra = colExtra ? normalize_(row[colExtra-1]) : "";
    const type = colType ? normalize_(row[colType-1]) : "";

    const blob = [name, manager, phone, extra, type].join(" ").toLowerCase();

    if(blob.indexOf(q) !== -1){
      const key = name + "|" + phone;
      if(!seen[key]){
        seen[key] = true;
        out.push({ name, manager, phone: phone || extra, extraPhone: extra, type });
      }
    }

    if(out.length >= 12) break;
  }

  return { success:true, customers:out };
}

function getRows_(e){
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return { success:false, message:auth.message };

  const screen = normalize_(e.parameter.screen);
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  if(!lines) return { success:false, message:"شيت بنود الأوردرات غير موجود." };

  const data = lines.getDataRange().getValues();
  const h = headersMap_(lines);
  const rows = [];

  const colOrderId = firstCol_(h, ["رقم الأوردر","Order ID"], 1);
  const colLineId = firstCol_(h, ["رقم البند","Line ID"], 6);
  const colCustomer = firstCol_(h, ["اسم الشات / المكتب","اسم العميل","Customer Name"], 3);
  const colPhone = firstCol_(h, ["رقم العميل الخارجي","رقم العميل","رقم الهاتف","Phone"], 17);
  const colDept = firstCol_(h, ["القسم","Department"], 5);
  const colItem = firstCol_(h, ["اسم البند / نوع الشغل","اسم البند","Item Name"], 7);
  const colQty = firstCol_(h, ["الكمية","Qty"], 8);
  const colPriority = firstCol_(h, ["الأولوية","Priority"], 10);
  const colStatus = firstCol_(h, ["الحالة","Status"], 11);
  const colNotes = firstCol_(h, ["ملاحظات","Notes"], 14);
  const colPress = firstCol_(h, ["مكبس حراري","مكبس؟"], 18);

  for(let i=1;i<data.length;i++){
    const row = data[i];

    const orderId = row[colOrderId-1];
    const lineId = row[colLineId-1];
    const customer = row[colCustomer-1];
    const customerPhone = row[colPhone-1];
    const department = normalize_(row[colDept-1]);
    const itemName = row[colItem-1];
    const qty = row[colQty-1];
    const priority = row[colPriority-1];
    const status = row[colStatus-1];
    const notes = row[colNotes-1];

    if(!orderId && !lineId) continue;

    if(screen === "print" && department !== "طباعة") continue;
    if(screen === "laser" && department !== "ليزر") continue;
    if(screen === "press" && normalize_(row[colPress-1]) !== "نعم") continue;
    if(screen === "service" && status === "تم التسليم") continue;

    rows.push({ rowNumber:i+1, orderId, lineId, customer, customerPhone, department, itemName, qty, priority, status, notes });
  }

  return { success:true, rows };
}

function updateLine_(e){
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return { success:false, message:auth.message };

  const lineId = normalize_(e.parameter.lineId);
  const status = normalize_(e.parameter.status);
  const notes = normalize_(e.parameter.notes);

  if(!lineId) return { success:false, message:"Line ID ناقص." };

  const sheet = ss_().getSheetByName(SHEET_NAME_LINES);
  if(!sheet) return { success:false, message:"شيت بنود الأوردرات غير موجود." };

  const data = sheet.getDataRange().getValues();
  const h = headersMap_(sheet);

  const colLineId = firstCol_(h, ["رقم البند","Line ID"], 6);
  const colStatus = firstCol_(h, ["الحالة","Status"], 11);
  const colNotes = firstCol_(h, ["ملاحظات","Notes"], 14);
  const colUpdated = firstCol_(h, ["آخر تحديث","Updated At"], 13);

  for(let i=1;i<data.length;i++){
    if(normalize_(data[i][colLineId-1]) === lineId){
      sheet.getRange(i+1, colStatus).setValue(status);
      sheet.getRange(i+1, colNotes).setValue(notes);
      sheet.getRange(i+1, colUpdated).setValue(new Date());
      return { success:true, message:"تم الحفظ." };
    }
  }

  return { success:false, message:"البند غير موجود." };
}

function changePassword_(e){
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return { success:false, message:auth.message };

  const oldPassword = normalize_(e.parameter.oldPassword);
  const newPassword = normalize_(e.parameter.newPassword);

  if(!oldPassword || !newPassword) return { success:false, message:"اكتب كلمة المرور القديمة والجديدة." };
  if(newPassword.length < 4) return { success:false, message:"كلمة المرور الجديدة لا تقل عن 4 أرقام/حروف." };
  if(auth.user.password !== oldPassword) return { success:false, message:"كلمة المرور القديمة غير صحيحة." };

  auth.user.sheet.getRange(auth.user.rowNumber, auth.user.colPassword).setValue(newPassword);

  const h = headersMap_(auth.user.sheet);
  if(h["يجب تغيير كلمة المرور؟"]) auth.user.sheet.getRange(auth.user.rowNumber, h["يجب تغيير كلمة المرور؟"]).setValue("لا");

  return { success:true, message:"تم تغيير كلمة المرور." };
}

function canCreateOrder_(user){
  const role = roleFromArabic_(user.role, user.department);
  return role === "admin" || role === "service";
}

function createManualOrder_(e){
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return { success:false, message:auth.message };
  if(!canCreateOrder_(auth.user)) return { success:false, message:"ليس لديك صلاحية إضافة أوردر." };

  const customerName = normalize_(e.parameter.customerName);
  const customerPhone = normalize_(e.parameter.customerPhone);
  const customerType = normalize_(e.parameter.customerType);
  const department = normalize_(e.parameter.department);
  let itemName = normalize_(e.parameter.itemName);
  const qty = Number(e.parameter.qty || 1) || 1;
  const priority = normalize_(e.parameter.priority) || "عاجل";
  const status = normalize_(e.parameter.status) || "طلب جديد";
  const notes = normalize_(e.parameter.notes);

  if(!customerName || !department){
    return { success:false, message:"اسم الشات والقسم مطلوبين." };
  }

  if(!itemName){
    itemName = "أوردر جديد - " + department;
  }

  const ss = ss_();
  const lines = ss.getSheetByName(SHEET_NAME_LINES);
  if(!lines) return { success:false, message:"شيت بنود الأوردرات غير موجود." };

  const now = new Date();
  const orderId = makeOrderId_(lines, now);

  let departments = [];

  if(department === "متعدد الأقسام"){
    departments = [
      { department:"طباعة", assignedTo:"وائل", suffix:"طباعة" },
      { department:"ليزر", assignedTo:"جابر", suffix:"ليزر" }
    ];
  }else{
    departments = [
      { department:department, assignedTo:(normalize_(e.parameter.assignedTo) || defaultAssigned_(department)), suffix:department }
    ];
  }

  appendOrder_(ss, {
    orderId, now, customerName, customerPhone, customerType,
    department, itemName, qty, priority, status,
    assignedTo: departments.map(d=>d.assignedTo).join(" + "),
    notes,
    lineCount: departments.length
  });

  departments.forEach(function(d, idx){
    const lineNo = String(idx + 1).padStart(2, "0");
    const lineId = orderId + "-" + lineNo;

    appendLine_(ss, {
      orderId, lineId, now, customerName, customerPhone, customerType,
      department: d.department,
      itemName: departments.length > 1 ? (itemName + " - " + d.suffix) : itemName,
      qty, priority, status,
      assignedTo: d.assignedTo,
      notes
    });
  });

  return {
    success:true,
    orderId,
    lineId: orderId + "-01",
    linesCreated: departments.length,
    message:"تم إضافة الأوردر."
  };
}

function defaultAssigned_(department){
  if(department === "طباعة") return "وائل";
  if(department === "ليزر") return "جابر";
  if(department === "مكبس") return "المكبس";
  if(department === "متعدد الأقسام") return "وائل + جابر";
  return "";
}

function makeOrderId_(sheet, now){
  const tz = Session.getScriptTimeZone();
  const datePart = Utilities.formatDate(now, tz, "yyMMdd");
  const seq = Math.max(1, sheet.getLastRow());
  return "TM" + datePart + String(seq).padStart(4, "0");
}

function appendByHeaders_(sheet, values){
  const h = headersMap_(sheet);
  const lastCol = sheet.getLastColumn();
  const row = new Array(lastCol).fill("");

  Object.keys(values).forEach(function(key){
    if(h[key]) row[h[key]-1] = values[key];
  });

  sheet.appendRow(row);
}

function appendOrder_(ss, o){
  const sheet = ss.getSheetByName(SHEET_NAME_ORDERS);
  if(!sheet) return;

  appendByHeaders_(sheet, {
    "رقم الأوردر": o.orderId,
    "كود الأوردر": o.orderId,
    "تاريخ الإنشاء": o.now,
    "اسم الشات / المكتب": o.customerName,
    "اسم العميل": o.customerName,
    "رقم العميل": o.customerPhone,
    "رقم العميل الخارجي": o.customerPhone,
    "نوع العميل": o.customerType,
    "القسم الرئيسي": o.department,
    "وصف الأوردر": o.itemName,
    "الأولوية": o.priority,
    "الحالة": o.status,
    "آخر تحديث": o.now,
    "عدد البنود": o.lineCount || 1,
    "ملاحظات": o.notes
  });
}

function appendLine_(ss, o){
  const sheet = ss.getSheetByName(SHEET_NAME_LINES);

  appendByHeaders_(sheet, {
    "رقم الأوردر": o.orderId,
    "كود الأوردر": o.orderId,
    "اسم الشات / المكتب": o.customerName,
    "اسم العميل": o.customerName,
    "رقم العميل": o.customerPhone,
    "رقم العميل الخارجي": o.customerPhone,
    "نوع العميل": o.customerType,
    "القسم": o.department,
    "رقم البند": o.lineId,
    "Line ID": o.lineId,
    "اسم البند / نوع الشغل": o.itemName,
    "اسم البند": o.itemName,
    "الكمية": o.qty,
    "مسؤول القسم": o.assignedTo,
    "الأولوية": o.priority,
    "الحالة": o.status,
    "جاهز؟": "نعم",
    "آخر تحديث": o.now,
    "ملاحظات": o.notes,
    "مكبس حراري": o.department === "مكبس" ? "نعم" : "لا"
  });
}
