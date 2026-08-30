/**
 * TrendOS Order / Line Integrity V1
 * GitHub checkpoint only. Requires trendos-integrity-v1.gs. DO NOT deploy blindly.
 *
 * Purpose:
 * - make Line ID the authoritative business key for line mutations
 * - serialize Draft Item add / Draft file upload / Draft submit with the same ScriptLock
 * - make customer Draft submit retry-safe by checkpointing the allocated Order ID on the draft row
 * - reject ambiguous active duplicate Line IDs instead of mutating an arbitrary row
 */

const TRENDOS_ORDER_LINE_INTEGRITY_VERSION_V1 = 'TRENDOS_ORDER_LINE_INTEGRITY_V1_20260830';

function trendosOrderLineLegacyTextV1_(value) {
  return typeof normalize_ === 'function' ? normalize_(value) : trendosTextV1_(value);
}

function trendosOrderLineFirstColV1_(headerMap, names, fallback) {
  if (typeof firstCol_ === 'function') return firstCol_(headerMap, names, fallback || 0);
  for (let i = 0; i < names.length; i++) if (headerMap[names[i]]) return headerMap[names[i]];
  return fallback || 0;
}

function trendosOrderLineHeadersV1_(sheet) {
  return typeof headersMap_ === 'function' ? headersMap_(sheet) : trendosHeaderMapV1_(sheet);
}

function trendosOrderLineValueAtV1_(row, col) {
  if (!col) return '';
  if (typeof valueAt_ === 'function') return valueAt_(row, col);
  return row[col - 1];
}

function trendosOrderLineColumnsV1_(sheet) {
  const h = trendosOrderLineHeadersV1_(sheet);
  return {
    h:h,
    orderId:trendosOrderLineFirstColV1_(h, ['رقم الأوردر','Order ID'], 1),
    orderCode:trendosOrderLineFirstColV1_(h, ['كود الأوردر'], 0),
    lineId:trendosOrderLineFirstColV1_(h, ['رقم البند','Line ID'], 6),
    status:trendosOrderLineFirstColV1_(h, ['الحالة','Status'], 11),
    ready:trendosOrderLineFirstColV1_(h, ['جاهز؟','جاهز','Ready'], 12),
    updated:trendosOrderLineFirstColV1_(h, ['آخر تحديث','Updated At'], 13),
    notes:trendosOrderLineFirstColV1_(h, ['ملاحظات','Notes'], 14),
    customer:trendosOrderLineFirstColV1_(h, ['اسم الشات / المكتب','اسم العميل','Customer Name'], 3),
    department:trendosOrderLineFirstColV1_(h, ['القسم','Department'], 5),
    debt:trendosOrderLineFirstColV1_(h, ['مديونية العميل'], 0),
    debtHold:trendosOrderLineFirstColV1_(h, ['إيقاف بسبب مديونية؟','مديونية؟'], 0)
  };
}

function trendosOrderLineScanLineRowsV1_(sheet, lineId) {
  lineId = trendosNormalizeLineId_(lineId);
  if (!sheet || !lineId || sheet.getLastRow() < 2) return [];
  const cols = trendosOrderLineColumnsV1_(sheet);
  if (!cols.lineId) throw new Error('Line ID column is missing.');
  const width = Math.max(cols.orderId, cols.orderCode, cols.lineId, cols.status, 1);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  const out = [];
  for (let i = 0; i < data.length; i++) {
    const rawLine = trendosOrderLineValueAtV1_(data[i], cols.lineId);
    if (trendosNormalizeLineId_(rawLine) !== lineId) continue;
    const status = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(data[i], cols.status));
    const orderId = trendosNormalizeOrderId_(trendosOrderLineValueAtV1_(data[i], cols.orderId)) || trendosNormalizeOrderId_(trendosOrderLineValueAtV1_(data[i], cols.orderCode));
    out.push({rowNumber:i + 2,lineId:lineId,orderId:orderId,status:status,duplicate:trendosIsDuplicateStatus_(status),row:data[i]});
  }
  return out;
}

function trendosOrderLineResolveActiveLineV1_(sheet, lineId, rowNumber, orderIdParam) {
  const normalizedLineId = trendosNormalizeLineId_(lineId);
  if (!normalizedLineId) return {ok:false,message:'رقم البند غير صالح أو غير موجود.',invalidLineId:true};
  const rows = trendosOrderLineScanLineRowsV1_(sheet, normalizedLineId);
  const active = rows.filter(function(x){ return !x.duplicate; });
  if (!active.length) return {ok:false,message:'لم يتم العثور على صف نشط لهذا البند.',lineId:normalizedLineId,rows:rows};
  if (active.length > 1) return {ok:false,message:'Integrity Error: يوجد أكثر من صف نشط لنفس Line ID.',lineId:normalizedLineId,activeDuplicate:true,rows:active};
  const target = active[0];
  const requestedRow = Number(rowNumber || 0);
  if (requestedRow > 1 && requestedRow !== target.rowNumber) return {ok:false,message:'تم رفض الحفظ لأن رقم الصف قديم ولا يطابق Line ID الحالي.',lineId:normalizedLineId,staleRow:true,requestedRow:requestedRow,actualRow:target.rowNumber};
  const requestedOrder = trendosNormalizeOrderId_(orderIdParam);
  if (requestedOrder && target.orderId && requestedOrder !== target.orderId) return {ok:false,message:'تم رفض الحفظ لأن Order ID لا يطابق Line ID.',lineId:normalizedLineId,orderMismatch:true,requestedOrderId:requestedOrder,actualOrderId:target.orderId};
  return {ok:true,target:target,lineId:normalizedLineId,orderId:target.orderId || requestedOrder,rows:rows};
}

function trendosCustomerDraftItemRowsV1_(filesSheet, draftId, customerCode) {
  const h = trendosOrderLineHeadersV1_(filesSheet);
  const colDraft = trendosOrderLineFirstColV1_(h, ['رقم المسودة'], 0);
  const colRecord = trendosOrderLineFirstColV1_(h, ['نوع السجل'], 0);
  const colCode = trendosOrderLineFirstColV1_(h, ['كود الشات','كود العميل'], 0);
  const colItem = trendosOrderLineFirstColV1_(h, ['رقم بند المسودة'], 0);
  if (!colDraft || !colRecord || !colItem) throw new Error('Customer Draft files schema is incomplete.');
  const data = filesSheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    if (trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(data[i], colDraft)) !== draftId) continue;
    if (customerCode && colCode && trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(data[i], colCode)) !== customerCode) continue;
    if (trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(data[i], colRecord)) !== 'بند') continue;
    rows.push({rowNumber:i + 1,itemId:trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(data[i], colItem)),row:data[i]});
  }
  return {rows:rows,headers:h,colItem:colItem};
}

function trendosCustomerDraftValidateItemsV1_(filesSheet, draftId, customerCode) {
  const scan = trendosCustomerDraftItemRowsV1_(filesSheet, draftId, customerCode), seen={}, duplicates=[];
  let maxNo = 0;
  scan.rows.forEach(function(x){
    if (!x.itemId) return;
    if (seen[x.itemId]) duplicates.push({itemId:x.itemId,firstRow:seen[x.itemId],duplicateRow:x.rowNumber});
    else seen[x.itemId] = x.rowNumber;
    const m = x.itemId.match(/-I(\d{1,4})$/i);
    if (m) maxNo = Math.max(maxNo, Number(m[1]) || 0);
  });
  return {ok:duplicates.length===0,duplicates:duplicates,count:scan.rows.length,nextNumber:maxNo+1,rows:scan.rows};
}

function trendosCustomerDraftStableBusinessDateV1_(foundDraft) {
  const col = trendosOrderLineFirstColV1_(foundDraft.h, ['تاريخ البداية'], 0);
  const raw = col ? trendosOrderLineValueAtV1_(foundDraft.row, col) : '';
  return trendosBusinessDate_(raw) || trendosBusinessDate_(new Date());
}

function trendosCustomerDraftExistingOrderV1_(foundDraft) {
  const col = trendosOrderLineFirstColV1_(foundDraft.h, ['رقم الأوردر الناتج'], 0);
  return col ? trendosNormalizeOrderId_(trendosOrderLineValueAtV1_(foundDraft.row, col)) : '';
}

function trendosCustomerDraftSetOrderCheckpointV1_(foundDraft, orderId) {
  const col = trendosOrderLineFirstColV1_(foundDraft.h, ['رقم الأوردر الناتج'], 0);
  if (!col) throw new Error('عمود رقم الأوردر الناتج غير موجود في شيت المسودات.');
  safeSet_(foundDraft.sheet, foundDraft.rowNumber, col, orderId);
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.flush) SpreadsheetApp.flush();
}

function trendosCustomerDraftResolveOrderIdV1_(foundDraft, lines, now) {
  const existingOrder = trendosCustomerDraftExistingOrderV1_(foundDraft);
  if (existingOrder) return {orderId:existingOrder,reused:true};
  const orderId = trendosNormalizeOrderId_(makeOrderId_(lines, now, true));
  if (!orderId) throw new Error('تعذر تخصيص Order ID صالح للمسودة.');
  trendosCustomerDraftSetOrderCheckpointV1_(foundDraft, orderId);
  return {orderId:orderId,reused:false};
}

function trendosCustomerDraftAddItemV1_(e) {
  e = e || {parameter:{}};
  const p = e.parameter || {};
  const auth = customerAuthorize_(p.customerCode || p.code, p.token);
  if (!auth.ok) return {success:false,message:auth.message};
  return trendosWithLock_('script', function(){
    const customer = auth.customer, draftId = trendosOrderLineLegacyTextV1_(p.draftId);
    if (!draftId) return {success:false,message:'رقم المسودة مطلوب.'};
    const foundDraft = findDraftRow_(draftId, customer.customerCode);
    if (!foundDraft) return {success:false,message:'المسودة غير موجودة.'};
    const status = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(foundDraft.row, trendosOrderLineFirstColV1_(foundDraft.h, ['حالة المسودة'], 0)));
    if (status && status !== 'مسودة') return {success:false,message:'لا يمكن إضافة بنود بعد بدء التنفيذ.'};
    const sheets = ensureCustomerDraftSheets_(), files = sheets.files;
    const integrity = trendosCustomerDraftValidateItemsV1_(files, draftId, customer.customerCode);
    if (!integrity.ok) return {success:false,integrityError:true,message:'يوجد تكرار في أرقام بنود المسودة ويجب إصلاحه قبل إضافة بند جديد.',duplicates:integrity.duplicates};
    let department = trendosOrderLineLegacyTextV1_(p.department) || 'طباعة';
    if (department !== 'طباعة' && department !== 'ليزر') department = 'طباعة';
    const itemName = trendosOrderLineLegacyTextV1_(p.itemName) || 'بند جديد';
    const qty = Number(p.qty || 1) || 1;
    const notes = trendosOrderLineLegacyTextV1_(p.notes || p.customerNotes);
    const heatPress = department === 'طباعة' && isHeatPressFlag_(p.heatPress || p.press);
    const flyPrint = department === 'طباعة' && isFlyPrintFlag_(p.flyPrint || p.quickPrint || p.fastPrint);
    const branchCode = trendosOrderLineLegacyTextV1_(p.franchiseBranchCode || customer.branchCode || customer.franchiseBranchCode);
    const branchName = trendosOrderLineLegacyTextV1_(p.franchiseBranchName || customer.branchName || customer.franchiseBranchName);
    const seq = integrity.nextNumber, itemId = draftId + '-I' + String(seq).padStart(2,'0');
    const draftFolderId = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(foundDraft.row, trendosOrderLineFirstColV1_(foundDraft.h, ['معرف فولدر المسودة'], 0)));
    const draftFolder = DriveApp.getFolderById(draftFolderId);
    const itemFolder = getOrCreateChildFolder_(draftFolder, 'بند ' + String(seq).padStart(2,'0') + ' - ' + department + ' - ' + safeDriveName_(itemName));
    const now = new Date();
    appendByHeaders_(files, {'نوع السجل':'بند','رقم المسودة':draftId,'رقم بند المسودة':itemId,'كود الشات':customer.customerCode,'اسم العميل':customer.name,'كود فرع مطبعجي':branchCode,'اسم فرع مطبعجي':branchName,'نوع الشغل':itemName,'القسم':department,'الكمية':qty,'ملاحظات العميل':notes,'مكبس':heatPress?'نعم':'لا','طباعة على الطاير':flyPrint?'نعم':'لا','رابط فولدر البند':itemFolder.getUrl(),'معرف فولدر البند':itemFolder.getId(),'تاريخ الرفع':now,'مرفوع بواسطة':'العميل','حالة المسودة':'مسودة'});
    safeSet_(foundDraft.sheet, foundDraft.rowNumber, trendosOrderLineFirstColV1_(foundDraft.h, ['عدد البنود'], 0), integrity.count + 1);
    SpreadsheetApp.flush();
    return {success:true,itemId:itemId,folderUrl:itemFolder.getUrl(),message:'تم إضافة البند للمسودة.',version:TRENDOS_ORDER_LINE_INTEGRITY_VERSION_V1};
  }, 30000);
}

function trendosCustomerDraftUploadFileV1_(payload) {
  payload = payload || {};
  const auth = customerAuthorize_(payload.customerCode || payload.code, payload.token);
  if (!auth.ok) return {success:false,message:auth.message};
  return trendosWithLock_('script', function(){
    const draftId = trendosOrderLineLegacyTextV1_(payload.draftId);
    const foundDraft = findDraftRow_(draftId, auth.customer.customerCode);
    if (!foundDraft) return {success:false,message:'المسودة غير موجودة.'};
    const status = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(foundDraft.row, trendosOrderLineFirstColV1_(foundDraft.h, ['حالة المسودة'], 0)));
    if (status && status !== 'مسودة') return {success:false,message:'لا يمكن رفع ملفات بعد بدء التنفيذ.'};
    return uploadCustomerDraftFile_(payload);
  }, 30000);
}

function trendosCustomerDraftSubmitV1_(e) {
  e = e || {parameter:{}};
  const p = e.parameter || {};
  const auth = customerAuthorize_(p.customerCode || p.code, p.token);
  if (!auth.ok) return {success:false,message:auth.message};
  return trendosWithLock_('script', function(){
    const customer = auth.customer, draftId = trendosOrderLineLegacyTextV1_(p.draftId);
    if (!draftId) return {success:false,message:'رقم المسودة مطلوب.'};
    const foundDraft = findDraftRow_(draftId, customer.customerCode);
    if (!foundDraft) return {success:false,message:'المسودة غير موجودة.'};
    const statusCol = trendosOrderLineFirstColV1_(foundDraft.h, ['حالة المسودة'], 0);
    const currentStatus = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(foundDraft.row, statusCol));
    const existingOrder = trendosCustomerDraftExistingOrderV1_(foundDraft);
    if (currentStatus && currentStatus !== 'مسودة') {
      if (!existingOrder) return {success:false,integrityError:true,message:'المسودة مسجلة كبدأ تنفيذها ولكن رقم الأوردر الناتج مفقود. تم إيقاف التحويل لحماية البيانات.',version:TRENDOS_ORDER_LINE_INTEGRITY_VERSION_V1};
      return {success:true,orderId:existingOrder,message:'تم بدء التنفيذ لهذه المسودة من قبل.',duplicatePrevented:true,version:TRENDOS_ORDER_LINE_INTEGRITY_VERSION_V1};
    }

    const sheets = ensureCustomerDraftSheets_(), files = sheets.files;
    const itemIntegrity = trendosCustomerDraftValidateItemsV1_(files, draftId, customer.customerCode);
    if (!itemIntegrity.ok) return {success:false,integrityError:true,message:'لا يمكن بدء التنفيذ: يوجد تكرار في أرقام بنود المسودة.',duplicates:itemIntegrity.duplicates};
    const items = collectDraftItems_(draftId, customer.customerCode);
    if (!items.length) return {success:false,message:'لا توجد بنود داخل المسودة.'};
    if (items.length !== itemIntegrity.count) return {success:false,integrityError:true,message:'عدد بنود المسودة لا يطابق البيانات الخام. تم إيقاف التحويل لحماية الأوردر.',rawItemCount:itemIntegrity.count,collectedItemCount:items.length};

    const ss = ss_(), lines = ss.getSheetByName(SHEET_NAME_LINES), ordersSheet = ss.getSheetByName(SHEET_NAME_ORDERS);
    if (!lines) return {success:false,message:'شيت بنود الأوردرات غير موجود.'};
    ensureWhatsAppHeaders_(lines); ensurePressColumn_(lines); ensureFlyPrintColumn_(lines);
    ensureHeaderIfAnyMissing_(lines, ['كود الشات','كود العميل','مصدر الطلب','أنشئ بواسطة','ملاحظات العميل','رابط فولدر البند','رابط ملفات البند','رقم المسودة','القسم الرئيسي','كود فرع مطبعجي','اسم فرع مطبعجي']);
    if (ordersSheet) ensureHeaderIfAnyMissing_(ordersSheet, ['كود الشات','كود العميل','مصدر الطلب','أنشئ بواسطة','ملاحظات العميل','رابط فولدر الطلب','رقم المسودة','كود فرع مطبعجي','اسم فرع مطبعجي']);

    const now = new Date();
    const orderResolution = trendosCustomerDraftResolveOrderIdV1_(foundDraft, lines, now);
    const orderId = orderResolution.orderId;
    const anyFly = items.some(function(x){return x.flyPrint;});
    const deps = items.map(function(x){return x.department;}).filter(Boolean);
    const summaryDepartment = deps.every(function(d){return d===deps[0];}) ? (deps[0] || 'طباعة') : 'طباعة + ليزر';
    const summaryName = items.map(function(x){return x.itemName;}).join(' + ').slice(0,180) || 'طلب من بوابة العميل';
    const expectedDeliveryAt = anyFly ? new Date(now) : expectedDeliveryDate_(now);
    const expectedDeliveryText = anyFly ? (formatDateAr_(expectedDeliveryAt) + ' - نفس اليوم') : formatDateAr_(expectedDeliveryAt);
    const draftFolderUrl = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(foundDraft.row, trendosOrderLineFirstColV1_(foundDraft.h, ['رابط فولدر المسودة'], 0)));
    const orderBranchCode = items.map(function(x){return x.branchCode;}).filter(Boolean)[0] || customer.branchCode || '';
    const orderBranchName = items.map(function(x){return x.branchName;}).filter(Boolean)[0] || customer.branchName || '';
    const common = {orderId:orderId,now:now,customerName:customer.name,customerPhone:customer.phone,customerType:customer.type,department:summaryDepartment,itemName:summaryName,qty:1,priority:anyFly?'عاجل':'عادي',status:'طلب جديد',lineCount:items.length,readyCount:0,notReadyCount:items.length,partial:'لا',notes:'طلب من بوابة العميل - '+items.length+' بند',receivedAt:now,expectedDeliveryAt:expectedDeliveryAt,expectedDeliveryText:expectedDeliveryText,heatPress:items.some(function(x){return x.heatPress;}),flyPrint:anyFly,debtAmount:0,debtNotes:'',customerCode:customer.customerCode,source:'بوابة العميل - شات الطلب',createdBy:'العميل',customerNotes:'مسودة: '+draftId,draftId:draftId,draftFolderUrl:draftFolderUrl,franchiseBranchCode:orderBranchCode,franchiseBranchName:orderBranchName};

    upsertOrderSummary_(common);
    const lineResults=[], itemLineMap={};
    for (let idx=0; idx<items.length; idx++) {
      const item=items[idx], lineId=trendosNormalizeLineId_(orderId+'-'+String(idx+1).padStart(2,'0'));
      if (!lineId) throw new Error('تعذر تكوين Line ID صالح للمسودة '+draftId+'.');
      const filesText=(item.files||[]).map(function(f){return f.name+': '+f.url;}).join('\n');
      const notes=[item.notes||'',filesText?'ملفات البند:\n'+filesText:'',item.itemFolderUrl?'فولدر البند: '+item.itemFolderUrl:''].filter(Boolean).join('\n');
      itemLineMap[item.itemId]=lineId;
      const appendResult=appendLine_(ss,Object.assign({},common,{lineId:lineId,department:item.department||'طباعة',itemName:item.itemName||'بند جديد',qty:item.qty||1,assignedTo:defaultAssigned_(item.department||'طباعة'),priority:item.flyPrint?'عاجل':'عادي',heatPress:item.heatPress,flyPrint:item.flyPrint,notes:notes,customerNotes:item.notes||'',itemFolderUrl:item.itemFolderUrl||'',filesText:filesText,franchiseBranchCode:item.branchCode||orderBranchCode,franchiseBranchName:item.branchName||orderBranchName}));
      if (!appendResult || appendResult.success===false) throw new Error(appendResult&&appendResult.message?appendResult.message:'تعذر حفظ بند '+lineId+'.');
      lineResults.push({lineId:lineId,department:item.department,itemName:item.itemName,duplicatePrevented:!!appendResult.duplicatePrevented});
    }

    safeSet_(foundDraft.sheet, foundDraft.rowNumber, statusCol, 'تم بدء التنفيذ');
    safeSet_(foundDraft.sheet, foundDraft.rowNumber, trendosOrderLineFirstColV1_(foundDraft.h, ['تاريخ الإرسال للتنفيذ'], 0), now);
    trendosCustomerDraftSetOrderCheckpointV1_(foundDraft, orderId);

    const fh = trendosOrderLineHeadersV1_(files), fData = files.getDataRange().getValues();
    const colDraft = trendosOrderLineFirstColV1_(fh,['رقم المسودة'],0), colOrder = trendosOrderLineFirstColV1_(fh,['رقم الأوردر'],0), colLineFinal = trendosOrderLineFirstColV1_(fh,['رقم البند'],0), colItemDraft = trendosOrderLineFirstColV1_(fh,['رقم بند المسودة'],0), colFileStatus = trendosOrderLineFirstColV1_(fh,['حالة المسودة'],0);
    for (let i=1;i<fData.length;i++) if (trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(fData[i],colDraft))===draftId) {
      const draftItemId=trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(fData[i],colItemDraft));
      safeSet_(files,i+1,colOrder,orderId);
      if(colLineFinal&&draftItemId&&itemLineMap[draftItemId]) safeSet_(files,i+1,colLineFinal,itemLineMap[draftItemId]);
      safeSet_(files,i+1,colFileStatus,'تم بدء التنفيذ');
    }
    appendActivityLog_({time:now,orderId:orderId,lineId:orderId+'-01',customer:customer.name,department:summaryDepartment,action:'بدء تنفيذ طلب من بوابة العميل',newStatus:'طلب جديد',by:'العميل '+customer.customerCode,details:'تم تحويل المسودة '+draftId+' إلى أوردر رسمي بعدد بنود '+items.length});
    SpreadsheetApp.flush();
    return {success:true,orderId:orderId,lines:lineResults,count:lineResults.length,message:'تم بدء التنفيذ واستلام رقم الأوردر.',version:TRENDOS_ORDER_LINE_INTEGRITY_VERSION_V1,resumedOrder:orderResolution.reused};
  }, 30000);
}

function trendosUpdateLineV1_(e) {
  e = e || {parameter:{}};
  const p = e.parameter || {};
  const auth = authorize_(p.username,p.token);
  if (!auth.ok) return {success:false,message:auth.message};
  return trendosWithLock_('script', function(){
    const sheet = ss_().getSheetByName(SHEET_NAME_LINES);
    if (!sheet) return {success:false,message:'شيت بنود الأوردرات غير موجود.'};
    ensureWhatsAppHeaders_(sheet);
    const cols = trendosOrderLineColumnsV1_(sheet), resolved = trendosOrderLineResolveActiveLineV1_(sheet,p.lineId,p.rowNumber,p.orderId);
    if (!resolved.ok) return Object.assign({success:false},resolved);
    const targetRow = resolved.target.rowNumber, lineId = resolved.lineId, orderId = resolved.orderId;
    const rowValues = sheet.getRange(targetRow,1,1,sheet.getLastColumn()).getValues()[0];
    const customerName = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(rowValues,cols.customer));
    const status = trendosOrderLineLegacyTextV1_(p.status) || 'طلب جديد', notes = trendosOrderLineLegacyTextV1_(p.notes);
    const oldStatus = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(rowValues,cols.status)), oldNotes = trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(rowValues,cols.notes));
    const debtInfo = isCustomerDebtBlocked_(customerName), debtAmount = parseDebtAmount_(debtInfo.amount || 0), debtHold = debtAmount > 0;
    const debtRestriction = debtHold ? (debtDeliveryRestrictionMapV1931_()[searchKey_(customerName)] || null) : null;
    if (status === 'تم التسليم') { const gate=trendosDeliveryGateV1931_(orderId,customerName,null,debtAmount,debtRestriction); if(!gate.ok)return{success:false,deliveryBlocked:true,gate:gate,message:'لا يمكن تسجيل تم التسليم: '+gate.message+'.'}; }
    if (oldStatus === status && oldNotes === notes) return {success:true,noOp:true,duplicatePrevented:true,message:'الحالة والملاحظات محفوظة بالفعل.',rowNumber:targetRow,orderId:orderId,lineId:lineId,status:status,debtAmount:debtAmount,debtHold:debtHold?'نعم':'لا',debtRestriction:debtRestriction,version:TRENDOS_ORDER_LINE_INTEGRITY_VERSION_V1};
    const now = new Date();
    if (cols.ready === cols.status + 1 && cols.updated === cols.status + 2 && cols.notes === cols.status + 3) sheet.getRange(targetRow,cols.status,1,4).setValues([[status,isReadyStatus_(status)?'نعم':'لا',now,notes]]);
    else { safeSet_(sheet,targetRow,cols.status,status); if(cols.ready)safeSet_(sheet,targetRow,cols.ready,isReadyStatus_(status)?'نعم':'لا'); if(cols.updated)safeSet_(sheet,targetRow,cols.updated,now); if(cols.notes)safeSet_(sheet,targetRow,cols.notes,notes); }
    if(cols.debt)safeSet_(sheet,targetRow,cols.debt,debtAmount); if(cols.debtHold)safeSet_(sheet,targetRow,cols.debtHold,debtHold?'نعم':'لا');
    if(orderId)syncOrderFromLines_(orderId);
    appendActivityLog_({time:now,orderId:orderId,lineId:lineId,customer:customerName,department:trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(rowValues,cols.department)),action:'تعديل حالة / ملاحظات',oldStatus:oldStatus,newStatus:status,oldNotes:oldNotes,newNotes:notes,by:auth.user.username,details:debtAmount>0?'تم الحفظ مع تنبيه مديونية':'تم الحفظ من شاشة TrendOS'});
    if(oldStatus!==status)queueOrderStatusMessageV1931_({orderId:orderId,lineId:lineId,customer:customerName,department:trendosOrderLineLegacyTextV1_(trendosOrderLineValueAtV1_(rowValues,cols.department)),status:status,by:auth.user.username});
    trendosBumpDataVersionV1931_();
    return {success:true,message:'تم حفظ الحالة بأمان باستخدام Line ID.',rowNumber:targetRow,orderId:orderId,lineId:lineId,status:status,debtAmount:debtAmount,debtHold:debtHold?'نعم':'لا',debtRestriction:debtRestriction,version:TRENDOS_ORDER_LINE_INTEGRITY_VERSION_V1};
  },30000);
}
