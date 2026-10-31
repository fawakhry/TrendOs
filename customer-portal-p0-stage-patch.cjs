/* Stage-only, fail-closed Apps Script customer privacy patch candidate.
 * Explicitly does NOT edit Code.gs or deploy Apps Script.
 * Given a clean, current Code.gs string, generate a reviewable candidate in memory.
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function once(text, source, replacement, label) {
  const start=text.indexOf(source);
  if (start < 0 || text.indexOf(source,start+1)>=0) throw new Error("BASELINE_MISMATCH:"+label);
  return text.slice(0,start)+replacement+text.slice(start+source.length);
}
function segment(text,startName,endName){
 const start=text.indexOf("function "+startName+"("),end=text.indexOf("function "+endName+"(",start+10);
 if (start<0 || end<=start) throw new Error("FUNCTION_BOUNDARY_MISMATCH:"+startName);
 return {start,end,body:text.slice(start,end)};
}
function prepareCandidate(base) {
  if(typeof base!=="string") throw new Error("BASE_NOT_TEXT");
  const listing=segment(base,"getCustomerOrders_","makeCustomerOrderSeparator_");
  let list=listing.body;
  list=once(list,
    '  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 0);',
    '  // Fail closed: missing Customer Code column cannot prove owner identity.\n' +
    '  if (!colCode) return { success: false, message: "تعذر التحقق من ملكية الأوردرات. تواصل مع مطبعجي." };\n' +
    '  const colCustomer = firstCol_(h, ["اسم الشات / المكتب", "اسم العميل", "Customer Name"], 0);',
    "CUSTOMER_CODE_COLUMN_REQUIRED"
  );
  list=once(list,
    '  const nameKey = searchKey_(customer.name);\n','',"REMOVE_NAME_FALLBACK");
  list=once(list,
    '    const rowNameKey = searchKey_(valueAt_(row, colCustomer));\n' +
    '    if (rowCode !== customer.customerCode && (!nameKey || rowNameKey !== nameKey)) continue;',
    '    // Only a verified customer code may own an order; names are NOT identifiers.\n' +
    '    if (!rowCode || rowCode !== customer.customerCode) continue;',
    "EXACT_CUSTOMER_CODE");
  let result=base.slice(0,listing.start)+list+base.slice(listing.end);

  const upload=segment(result,"uploadCustomerDraftFile_","collectDraftItems_");
  let content=upload.body;
  content=once(content,
   '  const size = Number(payload.size || 0) || 0;\n' +
   '  if (!draftId || !itemId || !base64) return { success: false, message: "بيانات رفع الملف ناقصة." };\n' +
   '  if (size > CUSTOMER_UPLOAD_MAX_BYTES) return { success: false, message: "حجم الملف أكبر من الحد المسموح 25MB." };',
   '  const size = Number(payload.size || 0) || 0;\n' +
   '  if (!draftId || !itemId || !base64) return { success: false, message: "بيانات رفع الملف ناقصة." };\n' +
   '  // Fail before decoding oversized/noncanonical base64 or untrusted size.\n' +
   '  if (!Number.isSafeInteger(size) || size <= 0 || size > CUSTOMER_UPLOAD_MAX_BYTES ||\n' +
   '      base64.length > 4 * Math.ceil(CUSTOMER_UPLOAD_MAX_BYTES / 3) + 8 ||\n' +
   '      !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {\n' +
   '    return { success: false, message: "حجم أو صيغة الملف غير صحيحة." };\n' +
   '  }',
   "UPLOAD_BASE64_AND_SIZE_CHECK");
  content=once(content,
    '  const bytes = Utilities.base64Decode(base64);\n' +
    '  const blob = Utilities.newBlob(bytes, mimeType, fileName);\n' +
    '  const folder = DriveApp.getFolderById(itemFolderId);\n' +
    '  const file = folder.createFile(blob);\n' +
    '  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}\n' +
    '  const now = new Date();',
    '  const bytes = Utilities.base64Decode(base64);\n' +
    '  if (bytes.length !== size || bytes.length > CUSTOMER_UPLOAD_MAX_BYTES) {\n' +
    '    return { success: false, message: "حجم الملف الفعلي لا يطابق البيانات المرسلة." };\n' +
    '  }\n' +
    '  // Stage gate only; folder share mode does NOT verify inherited/group ACLs.\n' +
    '  const folder = DriveApp.getFolderById(itemFolderId);\n' +
    '  if (folder.getSharingAccess() !== DriveApp.Access.PRIVATE) {\n' +
    '    return { success: false, message: "تخزين صور العميل غير خاص؛ تم إيقاف الرفع لحماية الصور." };\n' +
    '  }\n' +
    '  const blob = Utilities.newBlob(bytes, mimeType, fileName);\n' +
    '  const file = folder.createFile(blob);\n' +
    '  try {\n' +
    '    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);\n' +
    '    if (file.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error("CREATED_FILE_NOT_PRIVATE");\n' +
    '  } catch (err) {\n' +
    '    try { file.setTrashed(true); } catch (cleanupError) {}\n' +
    '    return { success: false, message: "تعذر تأمين خصوصية الملف؛ تم إيقاف الرفع." };\n' +
    '  }\n' +
    '  const now = new Date();',
    "PRIVATE_DRIVE_UPLOAD_AND_ACTUAL_BYTE_CHECK");
  result=result.slice(0,upload.start)+content+result.slice(upload.end);
  if(result===base) throw new Error("EMPTY_PATCH");
  return result;
}
function sha(text){return crypto.createHash("sha256").update(text,"utf8").digest("hex");}
if(require.main===module){
 if(process.argv[2]!=="--dry-run") {
  process.stderr.write("No write/deploy mode exists. Use --dry-run to inspect only.\n"); process.exit(2);
 }
 const input=fs.readFileSync(path.join(__dirname,"Code.gs"),"utf8");
 const candidate=prepareCandidate(input);
 process.stdout.write("CUSTOMER_P0_CANDIDATE_GENERATED_IN_MEMORY=YES\n");
 process.stdout.write("SOURCE_CODE_GS_UNMODIFIED=YES\n");
 process.stdout.write("BASE_SHA256="+sha(input)+"\nCANDIDATE_SHA256="+sha(candidate)+"\n");
 process.stdout.write("BACKEND_DEPLOY=NO\n");
}
module.exports={prepareCandidate,sha};
