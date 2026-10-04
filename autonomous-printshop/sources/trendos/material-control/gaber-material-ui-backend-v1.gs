/**
 * TrendOS — Gaber Material UI/Report Backend V1
 * GITHUB CANDIDATE ONLY / NOT DEPLOYED.
 *
 * Narrow facade used only through Operator Task V2 sub-ops.
 * No top-level doGet/doPost/router definitions are introduced here.
 */
const GABER_MATERIAL_WASTE_REQUESTS_V1_SHEET='حسابات - طلبات اعتماد هوالك جابر V1';
const GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS=[
  'Request ID','Request Fingerprint','Waste ID','Task ID','Order ID','Line ID','Material ID','Material Name','Qty','Reason Code','Evidence Ref','Operator','Requested At','Payload JSON'
];

function gmuTextV1_(v){return String(v==null?'':v).trim();}
function gmuNormV1_(v){return gmuTextV1_(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
function gmuNumV1_(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function gmuDateKeyV1_(v){
  if(!v)return '';
  if(v instanceof Date&&!isNaN(v.getTime())){try{return Utilities.formatDate(v,'Africa/Cairo','yyyy-MM-dd');}catch(e){return v.toISOString().slice(0,10);}}
  const s=gmuTextV1_(v);if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
  const d=new Date(v);if(isNaN(d.getTime()))return '';
  try{return Utilities.formatDate(d,'Africa/Cairo','yyyy-MM-dd');}catch(e){return d.toISOString().slice(0,10);}
}
function gmuIsoV1_(v){if(!v)return '';if(typeof otIsoV2_==='function')return otIsoV2_(v);try{return Utilities.formatDate(new Date(v),'Africa/Cairo',"yyyy-MM-dd'T'HH:mm:ssXXX");}catch(e){return gmuTextV1_(v);}}
function gmuStableV1_(v){if(Array.isArray(v))return '['+v.map(gmuStableV1_).join(',')+']';if(v&&typeof v==='object'){return '{'+Object.keys(v).sort().filter(function(k){return v[k]!==undefined;}).map(function(k){return JSON.stringify(k)+':'+gmuStableV1_(v[k]);}).join(',')+'}';}return JSON.stringify(v);}
function gmuFingerprintV1_(v){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,gmuStableV1_(v),Utilities.Charset.UTF_8);return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/,'').slice(0,28);}
function gmuFlagGateV1_(){
  if(typeof otRequireEnabledV2_!=='function')throw new Error('Operator Task V2 backend غير متاح.');
  otRequireEnabledV2_();
  if(typeof otGaberMaterialControlEnabledV2_!=='function'||otGaberMaterialControlEnabledV2_()!==true)throw new Error('كنترول خامات جابر غير مفعّل.');
}
function gmuRoleV1_(auth){return typeof otRoleV2_==='function'?otRoleV2_(auth):gmuTextV1_(auth&&auth.operatorTaskRole);}
function gmuSsV1_(){return typeof gmcSsV1_==='function'?gmcSsV1_():(typeof ss_==='function'?ss_():SpreadsheetApp.getActiveSpreadsheet());}
function gmuRequestStoreV1_(create){
  const ss=gmuSsV1_();let sh=ss&&ss.getSheetByName(GABER_MATERIAL_WASTE_REQUESTS_V1_SHEET);
  if(!sh&&create){sh=ss.insertSheet(GABER_MATERIAL_WASTE_REQUESTS_V1_SHEET);sh.getRange(1,1,1,GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS.length).setValues([GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS]);sh.setFrozenRows(1);}
  if(!sh)return {ok:false,code:'GABER_WASTE_REQUEST_STORE_MISSING',sheet:null};
  if(sh.getLastColumn()!==GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS.length)return {ok:false,code:'GABER_WASTE_REQUEST_STORE_SCHEMA_MISMATCH',sheet:sh};
  const h=sh.getRange(1,1,1,GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS.length).getValues()[0].map(gmuTextV1_);
  if(JSON.stringify(h)!==JSON.stringify(GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS))return {ok:false,code:'GABER_WASTE_REQUEST_STORE_SCHEMA_MISMATCH',sheet:sh};
  return {ok:true,sheet:sh};
}
function gaberMaterialInitUiStoreV1_(auth){
  if(gmuRoleV1_(auth)!=='MANAGER')return {success:false,message:'تهيئة طلبات اعتماد التالف متاحة للإدارة فقط.'};
  const s=gmuRequestStoreV1_(true);if(!s.ok)return {success:false,code:s.code,message:'تعذر تهيئة مخزن طلبات اعتماد التالف.'};return {success:true,requestStore:GABER_MATERIAL_WASTE_REQUESTS_V1_SHEET};
}
function gmuTaskForAuthV1_(p,auth){
  const role=gmuRoleV1_(auth),wanted=gmuTextV1_(p&&p.taskId);
  if(role==='GABER'){
    const active=typeof otActiveIndexV2_==='function'?otActiveIndexV2_().byEmployee[gmuNormV1_(typeof otUserNameV2_==='function'?otUserNameV2_(auth):'')]:null;
    const task=active&&typeof otTaskViewV2_==='function'?otTaskViewV2_(active):null;
    if(!task)return {ok:false,code:'GABER_ACTIVE_TASK_REQUIRED',message:'لا يوجد تاسك ليزر نشط لجابر.'};
    if(wanted&&wanted!==gmuTextV1_(task.taskId))return {ok:false,code:'GABER_TASK_ID_MISMATCH',message:'التاسك المطلوب ليس التاسك النشط لجابر.'};
    return {ok:true,task:task};
  }
  if(role==='MANAGER'){
    if(!wanted)return {ok:false,code:'TASK_ID_REQUIRED',message:'Task ID مطلوب.'};
    const row=typeof otFindTaskV2_==='function'?otFindTaskV2_(wanted):null,task=row&&typeof otTaskViewV2_==='function'?otTaskViewV2_(row):null;
    return task?{ok:true,task:task}:{ok:false,code:'TASK_NOT_FOUND',message:'التاسك غير موجود.'};
  }
  return {ok:false,code:'GABER_MATERIAL_ROLE_FORBIDDEN',message:'غير مصرح بواجهة خامات الليزر.'};
}
function gmuCatalogV1_(){
  if(typeof gmcMaterialCatalogV1_!=='function')return {ok:false,code:'ACCOUNTING_MATERIAL_CATALOG_DEPENDENCY_MISSING',rows:[]};
  const c=gmcMaterialCatalogV1_();if(!c.ok)return {ok:false,code:'ACCOUNTING_MATERIAL_CATALOG_INVALID',blockers:c.blockers||[],rows:[]};
  return {ok:true,rows:c.rows.filter(function(x){const d=gmuNormV1_(x.department);return x.active!==false&&(!d||d.indexOf('ليزر')!==-1||d==='مشترك'||d==='عام');})};
}
function gmuPublicCatalogV1_(rows){return (rows||[]).map(function(x){return {materialId:gmuTextV1_(x.materialId),materialName:gmuTextV1_(x.materialName),unit:gmuTextV1_(x.unit)||'unit',unitCost:Number(x.unitCost)||0,department:gmuTextV1_(x.department)};});}
function gmuTaskPurchasesV1_(task,catalog){
  if(typeof gmcDailyPurchaseRowsV1_!=='function')return {ok:false,code:'EASYSTORE_PURCHASE_DEPENDENCY_MISSING',rows:[]};
  const src=gmcDailyPurchaseRowsV1_();if(!src.ok)return {ok:false,code:'EASYSTORE_DAILY_PURCHASE_STORE_INVALID',blockers:src.blockers||[],rows:[]};
  const workDate=gmuDateKeyV1_(task.startedAt)||gmuDateKeyV1_(new Date()),out=[];
  src.rows.forEach(function(r){
    if(gmuNormV1_(r.department)!==gmuNormV1_(task.department)||gmuDateKeyV1_(r.workDate)!==workDate)return;
    if(typeof gmcPurchaseInactiveV1_==='function'&&gmcPurchaseInactiveV1_(r))return;if(!(Number(r.stockAppliedQty)>0))return;
    const x=typeof gmcResolveCatalogMaterialV1_==='function'?gmcResolveCatalogMaterialV1_({materialName:r.material},catalog,task.department):{ok:false};if(!x.ok)return;
    out.push({purchaseId:r.id,materialId:x.row.materialId,materialName:x.row.materialName,unit:x.row.unit,qty:Number(r.qty)||0,stockAppliedQty:Number(r.stockAppliedQty)||0,supplier:gmuTextV1_(r.supplier),invoiceNo:gmuTextV1_(r.officialInvoiceNo||r.receiptNo),total:Number(r.total)||0});
  });
  return {ok:true,rows:out};
}
function gmuPersistedCloseV1_(task){
  if(typeof gmcExistingSheetV1_!=='function'||typeof gmcCheckSchemaV1_!=='function'||typeof gmcLedgerRecordsV1_!=='function')return null;
  const sh=gmcExistingSheetV1_(GABER_MATERIAL_LEDGER_V1_SHEET),schema=gmcCheckSchemaV1_(sh,GABER_MATERIAL_LEDGER_V1_HEADERS);if(!schema.ok)return null;
  const rows=gmcLedgerRecordsV1_(sh).filter(function(r){return r.taskId===gmuTextV1_(task.taskId)&&r.orderId===gmuTextV1_(task.orderId)&&r.lineId===gmuTextV1_(task.lineId);});
  if(!rows.length)return null;return {materialCloseId:rows[0].materialCloseId,transactionId:rows[0].transactionId,eventCount:rows.length,createdAt:rows[0].createdAt};
}
function gaberMaterialBootstrapV1_(p,auth){
  gmuFlagGateV1_();const t=gmuTaskForAuthV1_(p,auth);if(!t.ok)return {success:false,code:t.code,message:t.message};const task=t.task;
  if(typeof otIsGaberLaserTaskV2_==='function'&&!otIsGaberLaserTaskV2_(task))return {success:false,code:'NOT_GABER_LASER_TASK',message:'التاسك ليس تاسك ليزر/جابر.'};
  const c=gmuCatalogV1_();if(!c.ok)return {success:false,code:c.code,blockers:c.blockers||[],message:'تعذر قراءة كتالوج خامات EasyStore.'};const purchases=gmuTaskPurchasesV1_(task,c.rows);
  if(!purchases.ok)return {success:false,code:purchases.code,blockers:purchases.blockers||[],message:'تعذر قراءة مشتريات EasyStore الفعلية.'};
  return {success:true,task:{taskId:task.taskId,orderId:task.orderId,lineId:task.lineId,department:task.department,employee:task.employee,startedAt:task.startedAt},materials:gmuPublicCatalogV1_(c.rows),purchases:purchases.rows,persistedClose:gmuPersistedCloseV1_(task)};
}

function gmuParseRequestV1_(p){const raw=p&&(p.requestJson||p.requestPayload);if(raw&&typeof raw==='object')return raw;if(!gmuTextV1_(raw))return null;try{return JSON.parse(String(raw));}catch(e){return null;}}
function gmuRequestRowsV1_(){
  const s=gmuRequestStoreV1_(false);if(!s.ok)return {ok:false,code:s.code,rows:[]};const sh=s.sheet;if(sh.getLastRow()<2)return {ok:true,rows:[]};
  return {ok:true,rows:sh.getRange(2,1,sh.getLastRow()-1,GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS.length).getValues().map(function(r){return {requestId:gmuTextV1_(r[0]),fingerprint:gmuTextV1_(r[1]),wasteId:gmuTextV1_(r[2]),taskId:gmuTextV1_(r[3]),orderId:gmuTextV1_(r[4]),lineId:gmuTextV1_(r[5]),materialId:gmuTextV1_(r[6]),materialName:gmuTextV1_(r[7]),qty:Number(r[8])||0,reasonCode:gmuTextV1_(r[9]),evidenceRef:gmuTextV1_(r[10]),operator:gmuTextV1_(r[11]),requestedAt:gmuTextV1_(r[12]),payloadJson:gmuTextV1_(r[13])};})};
}
function gaberMaterialRequestWasteV1_(p,auth){
  gmuFlagGateV1_();if(gmuRoleV1_(auth)!=='GABER')return {success:false,code:'WASTE_REQUEST_GABER_ONLY',message:'طلب اعتماد التالف متاح لجابر فقط.'};const t=gmuTaskForAuthV1_(p,auth);if(!t.ok)return {success:false,code:t.code,message:t.message};const req=gmuParseRequestV1_(p);if(!req)return {success:false,code:'WASTE_REQUEST_PAYLOAD_REQUIRED',message:'بيانات طلب اعتماد التالف مطلوبة.'};
  const task=t.task;['taskId','orderId','lineId'].forEach(function(k){if(gmuTextV1_(req[k])&&gmuTextV1_(req[k])!==gmuTextV1_(task[k]))throw new Error('WASTE_REQUEST_TASK_IDENTITY_MISMATCH');});
  const c=gmuCatalogV1_();if(!c.ok)return {success:false,code:c.code,message:'كتالوج الخامات غير متاح.'};const x=typeof gmcResolveCatalogMaterialV1_==='function'?gmcResolveCatalogMaterialV1_(req,c.rows,task.department):{ok:false};if(!x.ok)return {success:false,code:'MATERIAL_ID_MAPPING_REQUIRED',blockers:[x.blocker],message:'الخامة غير معروفة محاسبيًا.'};
  const wasteId=gmuTextV1_(req.wasteId),qty=gmuNumV1_(req.qty),reasonCode=gmuTextV1_(req.reasonCode).toUpperCase(),evidenceRef=gmuTextV1_(req.evidenceRef);if(!wasteId||!(qty>0)||!reasonCode)return {success:false,code:'WASTE_REQUEST_DATA_REQUIRED',message:'Waste ID والكمية والسبب مطلوبة.'};
  if(typeof GABER_MATERIAL_ABNORMAL_WASTE_REASONS_V1!=='undefined'&&GABER_MATERIAL_ABNORMAL_WASTE_REASONS_V1.indexOf(reasonCode)===-1)return {success:false,code:'WASTE_REQUEST_NOT_ABNORMAL',message:'الهالك الطبيعي لا يحتاج طلب اعتماد إداري.'};if(!evidenceRef)return {success:false,code:'WASTE_EVIDENCE_REQUIRED',message:'مرجع إثبات التالف غير الطبيعي مطلوب.'};
  const body={wasteId:wasteId,taskId:gmuTextV1_(task.taskId),orderId:gmuTextV1_(task.orderId),lineId:gmuTextV1_(task.lineId),materialId:x.row.materialId,materialName:x.row.materialName,qty:qty,reasonCode:reasonCode,evidenceRef:evidenceRef,operator:typeof otUserNameV2_==='function'?otUserNameV2_(auth):gmuTextV1_(task.employee)};
  const fp=gmuFingerprintV1_(body),requestId='GWR-'+fp,s=gmuRequestStoreV1_(false);if(!s.ok)return {success:false,code:s.code,message:'مخزن طلبات اعتماد التالف غير مهيأ.'};const existing=gmuRequestRowsV1_();if(!existing.ok)return {success:false,code:existing.code,message:'تعذر قراءة طلبات اعتماد التالف.'};
  const sameWaste=existing.rows.filter(function(r){return r.wasteId===body.wasteId&&r.taskId===body.taskId&&r.orderId===body.orderId&&r.lineId===body.lineId&&r.materialId===body.materialId;});if(sameWaste.length){const exact=sameWaste.find(function(r){return r.fingerprint===fp;});if(exact)return {success:true,replayed:true,requestId:exact.requestId,fingerprint:fp};return {success:false,code:'WASTE_REQUEST_CONFLICT',message:'يوجد طلب سابق لنفس Waste ID ببيانات مختلفة.'};}
  const now=typeof gmcNowIsoV1_==='function'?gmcNowIsoV1_():gmuIsoV1_(new Date());s.sheet.getRange(s.sheet.getLastRow()+1,1,1,GABER_MATERIAL_WASTE_REQUESTS_V1_HEADERS.length).setValues([[requestId,fp,body.wasteId,body.taskId,body.orderId,body.lineId,body.materialId,body.materialName,body.qty,body.reasonCode,body.evidenceRef,body.operator,now,JSON.stringify(body)]]);return {success:true,created:true,requestId:requestId,fingerprint:fp,requestedAt:now};
}
function gmuApprovalsV1_(){return typeof gmcApprovalRowsV1_==='function'?gmcApprovalRowsV1_():{ok:false,code:'WASTE_APPROVAL_DEPENDENCY_MISSING',rows:[]};}
function gmuDecisionForRequestV1_(req,approvals){for(let i=0;i<(approvals||[]).length;i++){const a=approvals[i];if(a.wasteId===req.wasteId&&a.taskId===req.taskId&&a.orderId===req.orderId&&a.lineId===req.lineId&&a.materialId===req.materialId)return a;}return null;}
function gaberMaterialPendingWasteV1_(p,auth){
  gmuFlagGateV1_();if(gmuRoleV1_(auth)!=='MANAGER')return {success:false,code:'MANAGER_ONLY',message:'طلبات اعتماد التالف متاحة للإدارة فقط.'};const q=gmuRequestRowsV1_();if(!q.ok)return {success:false,code:q.code,message:'مخزن طلبات اعتماد التالف غير مهيأ.'};const a=gmuApprovalsV1_();if(!a.ok)return {success:false,code:a.code,message:'مخزن قرارات التالف غير مهيأ.'};
  const items=q.rows.slice().reverse().filter(function(r){return !gmuDecisionForRequestV1_(r,a.rows);});return {success:true,items:items};
}
function gaberMaterialWasteDecisionV1_(p,auth){
  gmuFlagGateV1_();if(gmuRoleV1_(auth)!=='MANAGER')return {success:false,code:'MANAGER_ONLY',message:'قرار التالف متاح للإدارة فقط.'};const q=gmuRequestRowsV1_();if(!q.ok)return {success:false,code:q.code,message:'مخزن طلبات التالف غير مهيأ.'};const req=q.rows.find(function(r){return r.requestId===gmuTextV1_(p.requestId);});if(!req)return {success:false,code:'WASTE_REQUEST_NOT_FOUND',message:'طلب اعتماد التالف غير موجود.'};
  if(typeof gaberMaterialRecordWasteApprovalV1_!=='function')return {success:false,code:'WASTE_APPROVAL_WRITER_MISSING',message:'كاتب قرار التالف غير متاح.'};return gaberMaterialRecordWasteApprovalV1_({wasteId:req.wasteId,taskId:req.taskId,orderId:req.orderId,lineId:req.lineId,materialId:req.materialId,decision:gmuTextV1_(p.decision||'APPROVED').toUpperCase(),operator:req.operator,reason:gmuTextV1_(p.reason),evidenceRef:req.evidenceRef},auth);
}

function gmuLedgerEventsV1_(){
  if(typeof gmcExistingSheetV1_!=='function'||typeof gmcCheckSchemaV1_!=='function'||typeof gmcLedgerRecordsV1_!=='function')return {ok:false,code:'GABER_MATERIAL_LEDGER_DEPENDENCY_MISSING',events:[]};const sh=gmcExistingSheetV1_(GABER_MATERIAL_LEDGER_V1_SHEET),schema=gmcCheckSchemaV1_(sh,GABER_MATERIAL_LEDGER_V1_HEADERS);if(!schema.ok)return {ok:false,code:schema.code,events:[]};const rows=gmcLedgerRecordsV1_(sh),events=[],bad=[];rows.forEach(function(r){try{events.push(JSON.parse(r.payloadJson));}catch(e){bad.push(r.eventId);}});return bad.length?{ok:false,code:'GABER_MATERIAL_LEDGER_PAYLOAD_CORRUPT',badEventIds:bad,events:[]}:{ok:true,events:events};
}
function gmuStockBalanceFactsV1_(workDate,catalog){
  const ss=gmuSsV1_(),materials=ss.getSheetByName(typeof SHEET_NAME_ACC_MATERIALS!=='undefined'?SHEET_NAME_ACC_MATERIALS:'حسابات - الخامات'),openingById={},closingById={};
  if(materials&&materials.getLastRow()>=2){const v=materials.getDataRange().getValues(),m=typeof gmcHeaderMapV1_==='function'?gmcHeaderMapV1_(v[0]):{};v.slice(1).forEach(function(r){const id=gmuTextV1_(typeof gmcCellV1_==='function'?gmcCellV1_(r,m,'ID'):''),stock=gmuNumV1_(typeof gmcCellV1_==='function'?gmcCellV1_(r,m,'رصيد المخزن'):'');if(id&&stock!=null&&stock>=0)closingById[id]=stock;});}
  const moves=ss.getSheetByName(typeof SHEET_NAME_ACC_STOCK_MOVES!=='undefined'?SHEET_NAME_ACC_STOCK_MOVES:'حسابات - حركة المخزون');
  if(moves&&moves.getLastRow()>=2){const v=moves.getDataRange().getValues(),m=typeof gmcHeaderMapV1_==='function'?gmcHeaderMapV1_(v[0]):{},byName={};(catalog||[]).forEach(function(c){const k=gmuNormV1_(c.materialName);if(!byName[k])byName[k]=[];byName[k].push(c);});const earliest={};v.slice(1).forEach(function(r){const when=typeof gmcCellV1_==='function'?gmcCellV1_(r,m,'وقت الحركة'):'',d=gmuDateKeyV1_(when);if(d!==workDate)return;const name=gmuNormV1_(typeof gmcCellV1_==='function'?gmcCellV1_(r,m,'الخامة'):''),matches=byName[name]||[];if(matches.length!==1)return;const id=matches[0].materialId,before=gmuNumV1_(typeof gmcCellV1_==='function'?gmcCellV1_(r,m,'رصيد قبل الحركة'):''),ts=new Date(when).getTime();if(before==null||before<0)return;if(!earliest[id]||(!isNaN(ts)&&ts<earliest[id].ts))earliest[id]={ts:isNaN(ts)?Number.MAX_SAFE_INTEGER:ts,before:before};});Object.keys(earliest).forEach(function(id){openingById[id]=earliest[id].before;});}
  const opening=[],closing=[];(catalog||[]).forEach(function(c){if(Object.prototype.hasOwnProperty.call(openingById,c.materialId))opening.push({materialId:c.materialId,unit:c.unit,qty:openingById[c.materialId]});if(Object.prototype.hasOwnProperty.call(closingById,c.materialId))closing.push({materialId:c.materialId,unit:c.unit,qty:closingById[c.materialId]});});return {opening:opening,closing:closing};
}
function gaberMaterialDailyReportV1_(p,auth){
  gmuFlagGateV1_();const role=gmuRoleV1_(auth);if(role!=='GABER'&&role!=='MANAGER')return {success:false,code:'REPORT_ROLE_FORBIDDEN',message:'تقرير خامات الليزر غير متاح لهذا المستخدم.'};const workDate=gmuDateKeyV1_(p&&p.workDate)||gmuDateKeyV1_(new Date()),c=gmuCatalogV1_();if(!c.ok)return {success:false,code:c.code,message:'تعذر قراءة كتالوج الخامات.'};const l=gmuLedgerEventsV1_();if(!l.ok)return {success:false,code:l.code,badEventIds:l.badEventIds||[],message:'تعذر قراءة ledger خامات جابر.'};
  const movement=typeof TrendOSGaberMaterialMovementLedgerV1!=='undefined'?TrendOSGaberMaterialMovementLedgerV1:null,reporter=typeof TrendOSGaberLedgerDailyReportV1!=='undefined'?TrendOSGaberLedgerDailyReportV1:null;if(!movement||typeof movement.deriveDailyMaterialFacts!=='function'||!reporter||typeof reporter.build!=='function')return {success:false,code:'GABER_DAILY_REPORT_DEPENDENCY_MISSING',message:'مكوّنات تقرير خامات جابر غير مكتملة.'};const facts=movement.deriveDailyMaterialFacts(l.events,{workDate:workDate,department:'ليزر'}),balances=gmuStockBalanceFactsV1_(workDate,c.rows),report=reporter.build({workDate:workDate,department:'ليزر',ledgerFacts:facts,openingBalances:balances.opening,actualClosingBalances:balances.closing});return {success:true,report:report};
}

function gaberMaterialUiRouteV1_(op,p,auth){
  if(op==='gaberMaterialBootstrap')return gaberMaterialBootstrapV1_(p,auth);
  if(op==='gaberMaterialRequestWaste')return gaberMaterialRequestWasteV1_(p,auth);
  if(op==='gaberMaterialPendingWaste')return gaberMaterialPendingWasteV1_(p,auth);
  if(op==='gaberMaterialWasteDecision')return gaberMaterialWasteDecisionV1_(p,auth);
  if(op==='gaberMaterialDailyReport')return gaberMaterialDailyReportV1_(p,auth);
  return {success:false,message:'عملية Gaber Material UI غير معروفة.'};
}
