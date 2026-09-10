/**
 * TrendOS — Gaber Material Persistence Backend V1
 * GITHUB CANDIDATE ONLY / NOT ROUTED / NOT DEPLOYED.
 *
 * Implements gaberMaterialTaskCloseGateV1_ expected by Operator Task V2.
 * Runtime activation remains protected by TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED.
 * The gate NEVER creates persistence sheets implicitly.
 */
const GABER_MATERIAL_LEDGER_V1_SHEET='حسابات - حركة خامات جابر V1';
const GABER_MATERIAL_WASTE_APPROVALS_V1_SHEET='حسابات - اعتماد هوالك جابر V1';
const GABER_MATERIAL_LEDGER_V1_HEADERS=[
  'Record ID','Transaction ID','Transaction Fingerprint','Material Close ID','Event ID','Event Fingerprint',
  'Work Date','Department','Type','Material ID','Task ID','Order ID','Line ID','Purchase ID','Waste ID','Source Ref','Created At','Payload JSON'
];
const GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS=[
  'Approval ID','Waste ID','Task ID','Order ID','Line ID','Material ID','Decision','Approver','Reason','Approved At','Evidence Ref'
];
const GABER_MATERIAL_ABNORMAL_WASTE_REASONS_V1=[
  'MATERIAL_DEFECT','MACHINE_FAULT','SETUP_ERROR','WRONG_SIZE','OPERATOR_ERROR','DESIGN_OR_FILE_ERROR','REWORK','OTHER'
];

function gmcTextV1_(v){return String(v==null?'':v).trim();}
function gmcNormV1_(v){return gmcTextV1_(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
function gmcNumV1_(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function gmcNowIsoV1_(){try{return Utilities.formatDate(new Date(),'Africa/Cairo',"yyyy-MM-dd'T'HH:mm:ssXXX");}catch(e){return new Date().toISOString();}}
function gmcWorkDateV1_(){try{return Utilities.formatDate(new Date(),'Africa/Cairo','yyyy-MM-dd');}catch(e){return new Date().toISOString().slice(0,10);}}
function gmcHeaderMapV1_(headers){const out={};(headers||[]).forEach(function(h,i){out[gmcTextV1_(h)]=i;});return out;}
function gmcCellV1_(row,map,name){const i=map[name];return i===undefined?'':row[i];}
function gmcServerUserV1_(auth){return gmcTextV1_(auth&&auth.user&&(auth.user.username||auth.user.name));}
function gmcFailV1_(code,message,blockers){return {success:false,canClose:false,code:code,blockers:blockers&&blockers.length?blockers:[{code:code}],message:message};}
function gmcSsV1_(){return typeof ss_==='function'?ss_():SpreadsheetApp.getActiveSpreadsheet();}
function gmcExistingSheetV1_(name){const ss=gmcSsV1_();return ss&&ss.getSheetByName(name);}

function gmcCheckSchemaV1_(sheet,headers){
  if(!sheet)return {ok:false,code:'GABER_MATERIAL_STORE_MISSING'};
  if(sheet.getLastColumn()!==headers.length)return {ok:false,code:'GABER_MATERIAL_STORE_SCHEMA_MISMATCH'};
  const actual=sheet.getRange(1,1,1,headers.length).getValues()[0].map(gmcTextV1_);
  if(JSON.stringify(actual)!==JSON.stringify(headers))return {ok:false,code:'GABER_MATERIAL_STORE_SCHEMA_MISMATCH'};
  return {ok:true};
}

/** Explicit pre-activation admin initializer. Never called by the Task close gate. */
function gaberMaterialInitStoresV1_(auth){
  if(typeof otRoleV2_!=='function'||otRoleV2_(auth)!=='MANAGER')return {success:false,message:'تهيئة مخازن خامات جابر متاحة للإدارة فقط.'};
  const ss=gmcSsV1_();
  function ensure(name,headers){
    let sh=ss.getSheetByName(name);
    if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);}
    const schema=gmcCheckSchemaV1_(sh,headers);if(!schema.ok)throw new Error(schema.code+': '+name);return sh;
  }
  ensure(GABER_MATERIAL_LEDGER_V1_SHEET,GABER_MATERIAL_LEDGER_V1_HEADERS);
  ensure(GABER_MATERIAL_WASTE_APPROVALS_V1_SHEET,GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS);
  return {success:true,ledgerSheet:GABER_MATERIAL_LEDGER_V1_SHEET,approvalSheet:GABER_MATERIAL_WASTE_APPROVALS_V1_SHEET};
}

function gmcParsePayloadV1_(p){
  const raw=p&& (p.materialClosePayload||p.materialCloseJson||p.gaberMaterialClosePayload);
  if(raw&&typeof raw==='object')return raw;
  if(!gmcTextV1_(raw))return null;
  try{return JSON.parse(String(raw));}catch(e){return null;}
}

function gmcRejectClientIdentityMismatchV1_(payload,task){
  const blockers=[];
  [['taskId','TASK_ID_MISMATCH'],['orderId','ORDER_ID_MISMATCH'],['lineId','LINE_ID_MISMATCH']].forEach(function(pair){
    const field=pair[0],code=pair[1],actual=gmcTextV1_(payload&&payload[field]),expected=gmcTextV1_(task&&task[field]);
    if(actual&&actual!==expected)blockers.push({code:code,expected:expected,actual:actual});
  });
  return blockers;
}

function gmcMaterialCatalogV1_(){
  const sheetName=typeof SHEET_NAME_ACC_MATERIALS!=='undefined'?SHEET_NAME_ACC_MATERIALS:'حسابات - الخامات';
  const sh=gmcExistingSheetV1_(sheetName);
  if(!sh||sh.getLastRow()<2)return {ok:false,blockers:[{code:'ACCOUNTING_MATERIAL_CATALOG_MISSING'}],rows:[]};
  const values=sh.getDataRange().getValues(),map=gmcHeaderMapV1_(values[0]),required=['ID','القسم','اسم الخامة','الوحدة','تكلفة محسوبة','سعر الوحدة'];
  const missing=required.filter(function(h){return map[h]===undefined;});
  if(missing.length)return {ok:false,blockers:[{code:'ACCOUNTING_MATERIAL_CATALOG_SCHEMA_MISMATCH',missing:missing}],rows:[]};
  const rows=[];
  for(let i=1;i<values.length;i++){
    const r=values[i],id=gmcTextV1_(gmcCellV1_(r,map,'ID')),name=gmcTextV1_(gmcCellV1_(r,map,'اسم الخامة'));
    if(!id||!name)continue;
    const calculated=gmcNumV1_(gmcCellV1_(r,map,'تكلفة محسوبة')),unitPrice=gmcNumV1_(gmcCellV1_(r,map,'سعر الوحدة'));
    rows.push({
      materialId:id,id:id,materialName:name,name:name,department:gmcTextV1_(gmcCellV1_(r,map,'القسم')),
      unit:gmcTextV1_(gmcCellV1_(r,map,'الوحدة'))||'unit',unitCost:calculated&&calculated>0?calculated:(unitPrice&&unitPrice>0?unitPrice:0),
      active:map['مفعل']===undefined?true:gmcNormV1_(gmcCellV1_(r,map,'مفعل'))!=='لا'
    });
  }
  return {ok:true,rows:rows};
}

function gmcResolveCatalogMaterialV1_(raw,catalog,department){
  raw=raw||{};const id=gmcTextV1_(raw.materialId||raw.itemId),name=gmcNormV1_(raw.materialName||raw.name||raw.itemName),dept=gmcNormV1_(department||raw.department);
  let matches=(catalog||[]).filter(function(row){
    if(row.active===false)return false;
    const rd=gmcNormV1_(row.department),deptOk=!dept||!rd||rd===dept||rd==='مشترك'||rd==='عام';
    if(!deptOk)return false;
    return id?gmcTextV1_(row.materialId)===id:gmcNormV1_(row.materialName)===name;
  });
  if(matches.length!==1)return {ok:false,blocker:{code:matches.length?'MATERIAL_ID_MAPPING_AMBIGUOUS':'MATERIAL_ID_MAPPING_REQUIRED',materialId:id,materialName:gmcTextV1_(raw.materialName||raw.name),matchCount:matches.length}};
  const row=matches[0];
  if(!(Number(row.unitCost)>0))return {ok:false,blocker:{code:'ACCOUNTING_COST_UNAVAILABLE',materialId:row.materialId,materialName:row.materialName}};
  return {ok:true,row:row};
}

function gmcHydrateTaskMaterialsV1_(payload,task,catalog){
  const blockers=[],materials=[];
  (Array.isArray(payload.materials)?payload.materials:[]).forEach(function(raw,index){
    const resolved=gmcResolveCatalogMaterialV1_(raw,catalog,task.department);
    if(!resolved.ok){blockers.push(Object.assign({materialIndex:index},resolved.blocker));return;}
    const row=resolved.row;
    materials.push(Object.assign({},raw,{materialId:row.materialId,name:row.materialName,materialName:row.materialName,unit:row.unit,unitCost:row.unitCost}));
  });
  if(!materials.length)blockers.push({code:'TASK_MATERIALS_REQUIRED'});
  return {materials:materials,blockers:blockers};
}

function gmcApprovalRowsV1_(){
  const sh=gmcExistingSheetV1_(GABER_MATERIAL_WASTE_APPROVALS_V1_SHEET);
  const schema=gmcCheckSchemaV1_(sh,GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS);
  if(!schema.ok)return {ok:false,code:schema.code,rows:[]};
  if(sh.getLastRow()<2)return {ok:true,rows:[]};
  const v=sh.getRange(2,1,sh.getLastRow()-1,GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS.length).getValues();
  return {ok:true,rows:v.map(function(r){return {approvalId:gmcTextV1_(r[0]),wasteId:gmcTextV1_(r[1]),taskId:gmcTextV1_(r[2]),orderId:gmcTextV1_(r[3]),lineId:gmcTextV1_(r[4]),materialId:gmcTextV1_(r[5]),decision:gmcTextV1_(r[6]).toUpperCase(),approver:gmcTextV1_(r[7]),reason:gmcTextV1_(r[8]),approvedAt:gmcTextV1_(r[9]),evidenceRef:gmcTextV1_(r[10])};}).reverse()};
}

function gmcHydrateWastesV1_(payload,task,catalog){
  const approvals=gmcApprovalRowsV1_();
  if(!approvals.ok)return {wastes:[],blockers:[{code:approvals.code}]};
  const blockers=[],wastes=[];
  (Array.isArray(payload.wastes)?payload.wastes:[]).forEach(function(raw,index){
    const resolved=gmcResolveCatalogMaterialV1_(raw,catalog,task.department);
    if(!resolved.ok){blockers.push(Object.assign({wasteIndex:index},resolved.blocker));return;}
    const row=resolved.row,wasteId=gmcTextV1_(raw.wasteId||raw.id);
    const approval=approvals.rows.find(function(a){return a.wasteId===wasteId&&a.taskId===gmcTextV1_(task.taskId)&&a.orderId===gmcTextV1_(task.orderId)&&a.lineId===gmcTextV1_(task.lineId)&&a.materialId===row.materialId;});
    wastes.push(Object.assign({},raw,{
      wasteId:wasteId,materialId:row.materialId,unitCost:row.unitCost,
      taskId:gmcTextV1_(task.taskId),orderId:gmcTextV1_(task.orderId),lineId:gmcTextV1_(task.lineId),
      approval:approval&&approval.decision==='APPROVED'?{approved:true,approver:approval.approver,reason:approval.reason,approvalId:approval.approvalId}:null
    }));
  });
  return {wastes:wastes,blockers:blockers};
}

function gmcDailyPurchaseRowsV1_(){
  const sheetName=typeof SHEET_NAME_ACC_DEPT_DAILY_PURCHASES!=='undefined'?SHEET_NAME_ACC_DEPT_DAILY_PURCHASES:'حسابات - مشتريات الأقسام اليومية';
  const sh=gmcExistingSheetV1_(sheetName);
  if(!sh)return {ok:false,blockers:[{code:'EASYSTORE_DAILY_PURCHASE_STORE_MISSING'}],rows:[]};
  if(sh.getLastRow()<2)return {ok:true,rows:[]};
  const v=sh.getDataRange().getValues(),m=gmcHeaderMapV1_(v[0]),required=['ID','تاريخ العمل','الموظف','القسم','المورد','رقم فاتورة المورد','الخامة','الكمية','سعر الوحدة','الإجمالي','الحالة','حالة المخزون','كمية أضيفت للمخزون'];
  const missing=required.filter(function(h){return m[h]===undefined;});
  if(missing.length)return {ok:false,blockers:[{code:'EASYSTORE_DAILY_PURCHASE_SCHEMA_MISMATCH',missing:missing}],rows:[]};
  return {ok:true,rows:v.slice(1).map(function(r){return {
    id:gmcTextV1_(gmcCellV1_(r,m,'ID')),purchaseId:gmcTextV1_(gmcCellV1_(r,m,'ID')),requestId:gmcTextV1_(gmcCellV1_(r,m,'مفتاح الطلب')),
    workDate:gmcCellV1_(r,m,'تاريخ العمل'),createdAt:gmcCellV1_(r,m,'وقت التسجيل'),employee:gmcTextV1_(gmcCellV1_(r,m,'الموظف')),department:gmcTextV1_(gmcCellV1_(r,m,'القسم')),
    supplier:gmcTextV1_(gmcCellV1_(r,m,'المورد')),receiptNo:gmcTextV1_(gmcCellV1_(r,m,'رقم فاتورة المورد')),officialInvoiceNo:gmcTextV1_(gmcCellV1_(r,m,'رقم فاتورة الشراء الرسمية')),
    material:gmcTextV1_(gmcCellV1_(r,m,'الخامة')),qty:gmcNumV1_(gmcCellV1_(r,m,'الكمية')),unitPrice:gmcNumV1_(gmcCellV1_(r,m,'سعر الوحدة')),total:gmcNumV1_(gmcCellV1_(r,m,'الإجمالي')),
    paymentType:gmcTextV1_(gmcCellV1_(r,m,'نوع الدفع')),status:gmcTextV1_(gmcCellV1_(r,m,'الحالة')),stockStatus:gmcTextV1_(gmcCellV1_(r,m,'حالة المخزون')),
    stockAppliedAt:gmcCellV1_(r,m,'وقت إضافة المخزون'),stockAppliedQty:gmcNumV1_(gmcCellV1_(r,m,'كمية أضيفت للمخزون')),stockAfter:gmcNumV1_(gmcCellV1_(r,m,'رصيد المخزون بعد الإضافة')),
    stockReversedAt:gmcCellV1_(r,m,'وقت عكس المخزون'),stockReversalReason:gmcTextV1_(gmcCellV1_(r,m,'سبب عكس المخزون')),notes:gmcTextV1_(gmcCellV1_(r,m,'ملاحظات'))
  };}).filter(function(r){return !!r.id;})};
}

function gmcHydratePurchasesV1_(payload,task,catalog){
  const declaration=gmcTextV1_(payload.purchaseDeclaration).toUpperCase(),refs=Array.isArray(payload.purchases)?payload.purchases:[];
  if(declaration==='NO_PURCHASE')return refs.length?{purchases:[],blockers:[{code:'PURCHASE_DECLARATION_CONFLICT'}]}:{purchases:[],blockers:[]};
  if(declaration!=='PURCHASE_RECORDED')return {purchases:[],blockers:[{code:'PURCHASE_DECLARATION_REQUIRED'}]};
  if(!refs.length)return {purchases:[],blockers:[{code:'PURCHASE_RECORD_REQUIRED'}]};
  const source=gmcDailyPurchaseRowsV1_();if(!source.ok)return {purchases:[],blockers:source.blockers};
  const blockers=[],out=[];
  refs.forEach(function(ref,index){
    const id=gmcTextV1_(ref&& (ref.purchaseId||ref.id)),row=source.rows.find(function(r){return r.id===id;});
    if(!row){blockers.push({code:'PURCHASE_RECORD_REQUIRED',purchaseIndex:index,purchaseId:id,reason:'EASYSTORE_PURCHASE_NOT_FOUND'});return;}
    if(gmcNormV1_(row.department)!==gmcNormV1_(task.department)){blockers.push({code:'PURCHASE_DEPARTMENT_MISMATCH',purchaseId:id});return;}
    const resolved=gmcResolveCatalogMaterialV1_({materialName:row.material},catalog,task.department);
    if(!resolved.ok){blockers.push(Object.assign({purchaseId:id},resolved.blocker));return;}
    const rr=resolved.row;
    out.push(Object.assign({},row,{materialId:rr.materialId,materialName:rr.materialName,unitName:rr.unit,unitPrice:row.unitPrice&&row.unitPrice>0?row.unitPrice:rr.unitCost,evidenceRef:'EASYSTORE:DPP:'+id}));
  });
  return {purchases:out,blockers:blockers};
}

function gmcLedgerRecordsV1_(sh){
  if(sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,GABER_MATERIAL_LEDGER_V1_HEADERS.length).getValues().map(function(r){return {
    recordId:gmcTextV1_(r[0]),transactionId:gmcTextV1_(r[1]),transactionFingerprint:gmcTextV1_(r[2]),materialCloseId:gmcTextV1_(r[3]),eventId:gmcTextV1_(r[4]),eventFingerprint:gmcTextV1_(r[5]),
    workDate:gmcTextV1_(r[6]),department:gmcTextV1_(r[7]),type:gmcTextV1_(r[8]),materialId:gmcTextV1_(r[9]),taskId:gmcTextV1_(r[10]),orderId:gmcTextV1_(r[11]),lineId:gmcTextV1_(r[12]),purchaseId:gmcTextV1_(r[13]),wasteId:gmcTextV1_(r[14]),sourceRef:gmcTextV1_(r[15]),createdAt:gmcTextV1_(r[16]),payloadJson:gmcTextV1_(r[17])
  };});
}
function gmcRecordMatrixV1_(records){return (records||[]).map(function(r){return [r.recordId,r.transactionId,r.transactionFingerprint,r.materialCloseId,r.eventId,r.eventFingerprint,r.workDate,r.department,r.type,r.materialId,r.taskId,r.orderId,r.lineId,r.purchaseId,r.wasteId,r.sourceRef,r.createdAt,r.payloadJson];});}

function gmcDependenciesV1_(){
  const control=typeof TrendOSGaberMaterialControlV1!=='undefined'?TrendOSGaberMaterialControlV1:null;
  const adapter=typeof TrendOSGaberEasyStoreLedgerAdapterV1!=='undefined'?TrendOSGaberEasyStoreLedgerAdapterV1:null;
  const ledger=typeof TrendOSGaberMaterialMovementLedgerV1!=='undefined'?TrendOSGaberMaterialMovementLedgerV1:null;
  const persistence=typeof TrendOSGaberMaterialPersistenceV1!=='undefined'?TrendOSGaberMaterialPersistenceV1:null;
  const missing=[];
  if(!control||typeof control.buildDecision!=='function')missing.push('gaber-material-control-v1');
  if(!adapter||typeof adapter.buildCandidateBatch!=='function')missing.push('gaber-easystore-ledger-adapter-v1');
  if(!ledger||typeof ledger.buildAppendPlan!=='function')missing.push('gaber-material-movement-ledger-v1');
  if(!persistence||typeof persistence.prepareAppendTransaction!=='function')missing.push('gaber-material-persistence-v1');
  return {ok:missing.length===0,control:control,adapter:adapter,ledger:ledger,persistence:persistence,missing:missing};
}

function gaberMaterialTaskCloseGateV1_(p,task,auth){
  p=p||{};task=task||{};
  if(typeof otGaberMaterialControlEnabledV2_!=='function'||otGaberMaterialControlEnabledV2_()!==true)return gmcFailV1_('GABER_MATERIAL_CONTROL_DISABLED','كنترول خامات جابر غير مفعّل.');
  const deps=gmcDependenciesV1_();if(!deps.ok)return gmcFailV1_('GABER_MATERIAL_BACKEND_DEPENDENCY_MISSING','مكوّنات قفلة الخامات غير مكتملة.',[{code:'GABER_MATERIAL_BACKEND_DEPENDENCY_MISSING',missing:deps.missing}]);
  const payload=gmcParsePayloadV1_(p);if(!payload)return gmcFailV1_('GABER_MATERIAL_CLOSE_PAYLOAD_REQUIRED','بيانات تسوية خامات التاسك مطلوبة.');
  const identityBlockers=gmcRejectClientIdentityMismatchV1_(payload,task);if(identityBlockers.length)return gmcFailV1_('GABER_MATERIAL_TASK_IDENTITY_MISMATCH','بيانات القفلة لا تخص نفس التاسك.',identityBlockers);

  const ledgerSheet=gmcExistingSheetV1_(GABER_MATERIAL_LEDGER_V1_SHEET),ledgerSchema=gmcCheckSchemaV1_(ledgerSheet,GABER_MATERIAL_LEDGER_V1_HEADERS);
  if(!ledgerSchema.ok)return gmcFailV1_(ledgerSchema.code,'مخزن حركة خامات جابر غير مهيأ أو Schema غير مطابق.');
  const approvalSheet=gmcExistingSheetV1_(GABER_MATERIAL_WASTE_APPROVALS_V1_SHEET),approvalSchema=gmcCheckSchemaV1_(approvalSheet,GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS);
  if(!approvalSchema.ok)return gmcFailV1_(approvalSchema.code,'مخزن اعتماد هوالك جابر غير مهيأ أو Schema غير مطابق.');

  const catalog=gmcMaterialCatalogV1_();if(!catalog.ok)return gmcFailV1_('ACCOUNTING_MATERIAL_CATALOG_INVALID','كتالوج خامات EasyStore غير صالح للقفلة.',catalog.blockers);
  const mh=gmcHydrateTaskMaterialsV1_(payload,task,catalog.rows),wh=gmcHydrateWastesV1_(payload,task,catalog.rows),ph=gmcHydratePurchasesV1_(payload,task,catalog.rows);
  const hydrateBlockers=[].concat(mh.blockers||[],wh.blockers||[],ph.blockers||[]);if(hydrateBlockers.length)return gmcFailV1_('GABER_MATERIAL_HYDRATION_BLOCKED','تعذر التحقق من الخامات/المشتريات/التالف من المصادر المحاسبية.',hydrateBlockers);

  const serverClose={
    taskId:gmcTextV1_(task.taskId),orderId:gmcTextV1_(task.orderId),lineId:gmcTextV1_(task.lineId),
    operator:gmcServerUserV1_(auth)||gmcTextV1_(task.employee)||'جابر',department:gmcTextV1_(task.department)||'ليزر',
    workDate:gmcTextV1_(payload.workDate)||gmcWorkDateV1_(),startedAt:gmcTextV1_(task.startedAt||payload.startedAt),completedAt:gmcNowIsoV1_(),
    purchaseDeclaration:gmcTextV1_(payload.purchaseDeclaration).toUpperCase(),purchases:ph.purchases,materials:mh.materials,wastes:wh.wastes,
    lineRevenue:gmcNumV1_(payload.lineRevenue),directOperatingCost:gmcNumV1_(payload.directOperatingCost)||0,otherDirectCost:gmcNumV1_(payload.otherDirectCost)||0,
    policy:{abnormalRequiresApproval:true,evidenceRequiredReasons:GABER_MATERIAL_ABNORMAL_WASTE_REASONS_V1,approvalRequiredReasons:GABER_MATERIAL_ABNORMAL_WASTE_REASONS_V1,abnormalReasons:GABER_MATERIAL_ABNORMAL_WASTE_REASONS_V1}
  };
  const decision=deps.control.buildDecision(serverClose);
  if(!decision||decision.canClose!==true)return {success:true,canClose:false,blockers:decision&&decision.blockers||[{code:'GABER_MATERIAL_CLOSE_DECISION_INVALID'}],decisionFingerprint:gmcTextV1_(decision&&decision.decisionFingerprint),message:'لا يمكن إنهاء التاسك قبل تسوية الخامات والتالف.'};

  const batch=deps.adapter.buildCandidateBatch({purchases:ph.purchases,taskCloses:[serverClose],materialCatalog:catalog.rows});
  if(!batch||batch.canAppend!==true)return gmcFailV1_('GABER_MATERIAL_EVENT_BUILD_BLOCKED','تعذر بناء حركات الخامات.',batch&&batch.blockers||[]);
  const existing=gmcLedgerRecordsV1_(ledgerSheet);
  const prepared=deps.persistence.prepareAppendTransaction(existing,batch.events,deps.ledger,{
    taskId:serverClose.taskId,orderId:serverClose.orderId,lineId:serverClose.lineId,decisionFingerprint:decision.decisionFingerprint,createdAt:serverClose.completedAt
  });
  if(!prepared||prepared.canCommit!==true)return gmcFailV1_('GABER_MATERIAL_PERSISTENCE_BLOCKED','تعذر تجهيز قفلة خامات آمنة.',prepared&&prepared.blockers||[]);

  if(prepared.records&&prepared.records.length){
    const matrix=gmcRecordMatrixV1_(prepared.records),start=ledgerSheet.getLastRow()+1;
    ledgerSheet.getRange(start,1,matrix.length,GABER_MATERIAL_LEDGER_V1_HEADERS.length).setValues(matrix);
  }
  return {success:true,canClose:true,materialCloseId:prepared.materialCloseId,decisionFingerprint:decision.decisionFingerprint,transactionId:prepared.transactionId,replayed:prepared.isReplay===true,appendCount:prepared.appendCount||0,blockers:[],message:prepared.isReplay?'قفلة الخامات محفوظة بالفعل وتم التحقق منها.':'تم حفظ قفلة الخامات وحركاتها بنجاح.'};
}

/** Candidate manager-only waste approval writer; not routed in this phase. */
function gaberMaterialRecordWasteApprovalV1_(p,auth){
  p=p||{};
  if(typeof otRoleV2_!=='function'||otRoleV2_(auth)!=='MANAGER')return {success:false,message:'اعتماد التالف غير الطبيعي متاح للإدارة فقط.'};
  const sh=gmcExistingSheetV1_(GABER_MATERIAL_WASTE_APPROVALS_V1_SHEET),schema=gmcCheckSchemaV1_(sh,GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS);
  if(!schema.ok)return {success:false,message:'مخزن الاعتمادات غير مهيأ.',code:schema.code};
  const approver=gmcServerUserV1_(auth),operator=gmcTextV1_(p.operator);
  if(operator&&gmcNormV1_(operator)===gmcNormV1_(approver))return {success:false,message:'لا يجوز اعتماد التالف بواسطة نفس منفذ التاسك.',code:'WASTE_SELF_APPROVAL_FORBIDDEN'};
  const wasteId=gmcTextV1_(p.wasteId),taskId=gmcTextV1_(p.taskId),orderId=gmcTextV1_(p.orderId),lineId=gmcTextV1_(p.lineId),materialId=gmcTextV1_(p.materialId),decision=gmcTextV1_(p.decision||'APPROVED').toUpperCase();
  if(!wasteId||!taskId||!orderId||!lineId||!materialId||['APPROVED','REJECTED'].indexOf(decision)===-1)return {success:false,message:'بيانات اعتماد التالف غير مكتملة.',code:'WASTE_APPROVAL_DATA_REQUIRED'};
  const approvalId='GWA-'+Utilities.getUuid(),now=gmcNowIsoV1_();
  sh.getRange(sh.getLastRow()+1,1,1,GABER_MATERIAL_WASTE_APPROVALS_V1_HEADERS.length).setValues([[approvalId,wasteId,taskId,orderId,lineId,materialId,decision,approver,gmcTextV1_(p.reason),now,gmcTextV1_(p.evidenceRef)]]);
  return {success:true,approvalId:approvalId,wasteId:wasteId,decision:decision,approver:approver,approvedAt:now};
}