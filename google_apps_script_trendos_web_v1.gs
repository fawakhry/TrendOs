const SHEET_NAME_USERS = "المستخدمين";
const SHEET_NAME_LINES = "بنود الأوردرات";
const DEFAULT_PASSWORD = "0000";

function doGet(e) {
  const action = String(e.parameter.action || "").trim();
  if (action === "login") return login(e);
  if (action === "getRows") return getRows(e);
  if (action === "updateLine") return updateLine(e);
  if (action === "changePassword") return changePassword(e);
  return output({ success:false, message:"Action غير معروف." });
}
function ss_(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function output(data){ return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function normalize(v){ return String(v || "").trim(); }

function headersMap_(sheet){
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h,i)=>{ if(h) map[normalize(h)] = i + 1; });
  return map;
}
function ensureUsersSetup_(){
  const sheet = ss_().getSheetByName(SHEET_NAME_USERS);
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
  const colName = h["اسم المستخدم"], colDept = h["القسم"], colRole = h["الصلاحية"], colActive = h["مفعل؟"], colPassword = h["كلمة المرور"], colMustChange = h["يجب تغيير كلمة المرور؟"], colToken = h["Token"], colLastLogin = h["آخر دخول"];
  for(let i=1;i<data.length;i++){
    const row = data[i];
    const name = normalize(row[colName-1]);
    if(name === username){
      return { sheet, rowNumber:i+1, username:name, department:normalize(row[colDept-1]), role:normalize(row[colRole-1]), active:normalize(row[colActive-1]), password:normalize(row[colPassword-1]) || DEFAULT_PASSWORD, mustChange:normalize(row[colMustChange-1]), token:normalize(row[colToken-1]), colPassword, colToken, colLastLogin };
    }
  }
  return null;
}
function roleFromArabic_(role, department){
  const r = normalize(role), d = normalize(department);
  if(r.includes("مدير") || r.toLowerCase() === "admin") return "admin";
  if(d.includes("طباعة") || r.includes("طباعة")) return "print";
  if(d.includes("ليزر") || r.includes("ليزر")) return "laser";
  if(d.includes("مكبس") || r.includes("مكبس")) return "press";
  if(r.includes("خدمة") || d.includes("خدمة")) return "service";
  return "service";
}
function login(e){
  const username = normalize(e.parameter.username), password = normalize(e.parameter.password);
  if(!username || !password) return output({ success:false, message:"اكتب اسم المستخدم وكلمة المرور." });
  const user = findUser_(username);
  if(!user) return output({ success:false, message:"المستخدم غير موجود." });
  if(user.active && user.active !== "نعم") return output({ success:false, message:"هذا المستخدم غير مفعل." });
  if(user.password !== password) return output({ success:false, message:"كلمة المرور غير صحيحة." });
  const token = Utilities.getUuid();
  user.sheet.getRange(user.rowNumber, user.colToken).setValue(token);
  if(user.colLastLogin) user.sheet.getRange(user.rowNumber, user.colLastLogin).setValue(new Date());
  return output({ success:true, user:{ username:user.username, name:user.username, department:user.department, role:roleFromArabic_(user.role, user.department), mustChange:user.mustChange === "نعم" || user.password === DEFAULT_PASSWORD, token }});
}
function authorize_(username, token){
  const user = findUser_(normalize(username));
  if(!user) return { ok:false, message:"المستخدم غير موجود." };
  if(user.active && user.active !== "نعم") return { ok:false, message:"المستخدم غير مفعل." };
  if(!token || user.token !== token) return { ok:false, message:"انتهت الجلسة. سجل الدخول مرة أخرى." };
  return { ok:true, user };
}
function getRows(e){
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return output({ success:false, message:auth.message });
  const screen = normalize(e.parameter.screen);
  const lines = ss_().getSheetByName(SHEET_NAME_LINES);
  const data = lines.getDataRange().getValues();
  const h = headersMap_(lines);
  const rows = [];
  for(let i=1;i<data.length;i++){
    const row = data[i];
    const orderId = row[(h["رقم الأوردر"] || 1)-1];
    const lineId = row[(h["رقم البند"] || 6)-1];
    const customer = row[(h["اسم الشات / المكتب"] || 3)-1];
    const department = normalize(row[(h["القسم"] || 5)-1]);
    const itemName = row[(h["اسم البند / نوع الشغل"] || 7)-1];
    const qty = row[(h["الكمية"] || 8)-1];
    const priority = row[(h["الأولوية"] || 10)-1];
    const status = row[(h["الحالة"] || 11)-1];
    const notes = row[(h["ملاحظات"] || 14)-1];
    if(!orderId && !lineId) continue;
    if(screen === "print" && department !== "طباعة") continue;
    if(screen === "laser" && department !== "ليزر") continue;
    if(screen === "press" && normalize(row[(h["مكبس حراري"] || 18)-1]) !== "نعم") continue;
    if(screen === "service" && status === "تم التسليم") continue;
    rows.push({ rowNumber:i+1, orderId, lineId, customer, department, itemName, qty, priority, status, notes });
  }
  return output({ success:true, rows });
}
function updateLine(e){
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return output({ success:false, message:auth.message });
  const lineId = normalize(e.parameter.lineId), status = normalize(e.parameter.status), notes = normalize(e.parameter.notes);
  if(!lineId) return output({ success:false, message:"Line ID ناقص." });
  const sheet = ss_().getSheetByName(SHEET_NAME_LINES);
  const data = sheet.getDataRange().getValues();
  const h = headersMap_(sheet);
  const colLineId = h["رقم البند"] || 6, colStatus = h["الحالة"] || 11, colNotes = h["ملاحظات"] || 14, colUpdated = h["آخر تحديث"] || 13;
  for(let i=1;i<data.length;i++){
    if(normalize(data[i][colLineId-1]) === lineId){
      sheet.getRange(i+1, colStatus).setValue(status);
      sheet.getRange(i+1, colNotes).setValue(notes);
      sheet.getRange(i+1, colUpdated).setValue(new Date());
      return output({ success:true, message:"تم الحفظ." });
    }
  }
  return output({ success:false, message:"البند غير موجود." });
}
function changePassword(e){
  const auth = authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return output({ success:false, message:auth.message });
  const oldPassword = normalize(e.parameter.oldPassword), newPassword = normalize(e.parameter.newPassword);
  if(!oldPassword || !newPassword) return output({ success:false, message:"اكتب كلمة المرور القديمة والجديدة." });
  if(newPassword.length < 4) return output({ success:false, message:"كلمة المرور الجديدة لا تقل عن 4 أرقام/حروف." });
  if(auth.user.password !== oldPassword) return output({ success:false, message:"كلمة المرور القديمة غير صحيحة." });
  auth.user.sheet.getRange(auth.user.rowNumber, auth.user.colPassword).setValue(newPassword);
  const h = headersMap_(auth.user.sheet);
  if(h["يجب تغيير كلمة المرور؟"]) auth.user.sheet.getRange(auth.user.rowNumber, h["يجب تغيير كلمة المرور؟"]).setValue("لا");
  return output({ success:true, message:"تم تغيير كلمة المرور." });
}
