/************************************************************
 * TrendOS Apps Script Timeout Hotfix V2 — APPEND ONLY SAFE
 * Date: 2026-09-03 Africa/Cairo
 *
 * Paste this at the VERY END of the live Apps Script project.
 * It overrides getRows_ and getDashboard_ with bounded reads and cache.
 * It performs ZERO writes while reading screens.
 ************************************************************/

var TRENDOS_TIMEOUT_HOTFIX_V2 = true;
var TRENDOS_TIMEOUT_HOTFIX_DEFAULT_LIMIT_V2 = 120;
var TRENDOS_TIMEOUT_HOTFIX_MAX_LIMIT_V2 = 200;
var TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V2 = 1200;
var TRENDOS_TIMEOUT_HOTFIX_DASHBOARD_CACHE_SECONDS_V2 = 20;

function th2Text_(v) { return String(v == null ? '' : v).trim(); }
function th2Norm_(v) { try { if (typeof normalize_ === 'function') return normalize_(v); } catch(e) {} return th2Text_(v); }
function th2Phone_(v) { try { if (typeof cleanPhone_ === 'function') return cleanPhone_(v); } catch(e) {} return th2Text_(v).replace(/\D/g, ''); }
function th2LinesName_() { try { if (typeof SHEET_NAME_LINES !== 'undefined' && SHEET_NAME_LINES) return SHEET_NAME_LINES; } catch(e) {} return 'بنود الأوردرات'; }
function th2Ss_() { return (typeof ss_ === 'function') ? ss_() : SpreadsheetApp.getActiveSpreadsheet(); }
function th2Sheet_(name) { return th2Ss_().getSheetByName(name); }
function th2Limit_(e) { var p=(e&&e.parameter)||{}, n=Number(p.limit||TRENDOS_TIMEOUT_HOTFIX_DEFAULT_LIMIT_V2); if(!isFinite(n)) n=TRENDOS_TIMEOUT_HOTFIX_DEFAULT_LIMIT_V2; return Math.max(1, Math.min(n, TRENDOS_TIMEOUT_HOTFIX_MAX_LIMIT_V2)); }
function th2Screen_(e) { var p=(e&&e.parameter)||{}; return th2Norm_(p.screen||'service').toLowerCase(); }
function th2Date_(v) { try { if (typeof dateText_ === 'function') return dateText_(v) || v; } catch(e) {} if (v instanceof Date) { try { return Utilities.formatDate(v, 'Africa/Cairo', 'dd/MM/yyyy HH:mm'); } catch(err) {} } return v; }
function th2SameDay_(v,d){ return (v instanceof Date && d instanceof Date && v.getFullYear()===d.getFullYear() && v.getMonth()===d.getMonth() && v.getDate()===d.getDate()); }
function th2Closed_(s){ s=th2Norm_(s); return s==='تم التسليم'||s==='ملغى'||s==='ملغي'||s==='مكرر'; }
function th2Ready_(s,r){ s=th2Norm_(s); r=th2Norm_(r).toLowerCase(); return s==='جاهز للاستلام'||r==='نعم'||r==='yes'; }
function th2PriorityRank_(p){ p=th2Norm_(p); if(p==='VIP')return 0; if(p==='عاجل')return 1; return 5; }
function th2HeaderMap_(headers){ var m={}; (headers||[]).forEach(function(h,i){ h=th2Text_(h); if(h) m[h]=i+1; }); return m; }
function th2Col_(h,names,fallback){ for(var i=0;i<names.length;i++){ if(h[names[i]]) return h[names[i]]; } return fallback||0; }
function th2Val_(row,col){ return col ? row[col-1] : ''; }

function th2ViewForScreen_(screen){
  screen=String(screen||'').toLowerCase();
  if(screen.indexOf('press')!==-1 || screen.indexOf('مكبس')!==-1 || screen.indexOf('heat')!==-1) return 'واجهة المكبس';
  if(screen.indexOf('laser')!==-1 || screen.indexOf('ليزر')!==-1) return 'واجهة الليزر';
  if(screen.indexOf('print')!==-1 || screen.indexOf('طباعة')!==-1) return 'واجهة الطباعة';
  if(screen.indexOf('service')!==-1 || screen.indexOf('customer')!==-1 || screen.indexOf('خدمة')!==-1) return 'واجهة خدمة العملاء';
  return '';
}

function th2Read_(sheet, maxRows, maxCols){
  if(!sheet) return [];
  var lastRow=Math.max(1, sheet.getLastRow());
  var lastCol=Math.max(1, Math.min(sheet.getLastColumn(), maxCols || sheet.getLastColumn()));
  var header=sheet.getRange(1,1,1,lastCol).getValues()[0];
  if(lastRow<2) return [header];
  var scanRows=Math.max(1, Math.min(maxRows || TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V2, TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V2));
  var startRow=Math.max(2, lastRow-scanRows+1);
  var numRows=Math.max(0, lastRow-startRow+1);
  var body=numRows ? sheet.getRange(startRow,1,numRows,lastCol).getValues() : [];
  return [header].concat(body);
}

function th2MatchesScreen_(screen, dept, press){
  try { if (typeof dashboardMatchesScreen_ === 'function') return dashboardMatchesScreen_(screen, dept, press); } catch(e) {}
  var s=String(screen||'').toLowerCase(), d=th2Norm_(dept).toLowerCase();
  if(!s || s==='service') return true;
  if(s.indexOf('press')!==-1 || s.indexOf('مكبس')!==-1) return !!press || d.indexOf('مكبس')!==-1;
  if(s.indexOf('laser')!==-1 || s.indexOf('ليزر')!==-1) return d.indexOf('ليزر')!==-1 || d.indexOf('laser')!==-1;
  if(s.indexOf('print')!==-1 || s.indexOf('طباعة')!==-1) return d.indexOf('طباعة')!==-1 || d.indexOf('print')!==-1;
  return true;
}

/***** OVERRIDE: Fast read rows endpoint. *****/
function getRows_(e){
  var auth=authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return { success:false, message:auth.message };

  var screen=th2Screen_(e), limit=th2Limit_(e), viewName=th2ViewForScreen_(screen);
  var sourceSheet=viewName ? th2Sheet_(viewName) : null;
  var sheet=sourceSheet || th2Sheet_(th2LinesName_());
  if(!sheet) return { success:false, message:'مصدر بيانات البنود غير موجود.' };

  var data=th2Read_(sheet, sourceSheet ? 500 : TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V2, 92);
  if(!data.length) return { success:true, rows:[], hotfix:'TIMEOUT_HOTFIX_V2' };

  var h=th2HeaderMap_(data[0]);
  var cOrder=th2Col_(h,['رقم الأوردر','Order ID','orderId'],1), cCode=th2Col_(h,['كود الأوردر'],2);
  var cCustomer=th2Col_(h,['اسم الشات / المكتب','اسم العميل','Customer Name','customerName'],3);
  var cDept=th2Col_(h,['القسم','القسم الرئيسي','Department','department'],5);
  var cLine=th2Col_(h,['رقم البند','Line ID','lineId'],6), cItem=th2Col_(h,['اسم البند / نوع الشغل','اسم البند','وصف مختصر','Item Name','itemName'],7);
  var cQty=th2Col_(h,['الكمية','Qty','qty','عدد البنود'],8), cAssigned=th2Col_(h,['مسؤول القسم','Assigned To'],9);
  var cPriority=th2Col_(h,['الأولوية','Priority'],10), cStatus=th2Col_(h,['الحالة','الحالة العامة','Status','status'],11);
  var cReady=th2Col_(h,['جاهز؟','جاهز','Ready','بنود جاهزة'],12), cUpdated=th2Col_(h,['آخر تحديث','Updated At','updatedAt'],13);
  var cNotes=th2Col_(h,['ملاحظات','Notes','notes'],14), cPhone=th2Col_(h,['رقم العميل الخارجي','رقم العميل','رقم الهاتف','Phone','customerPhone'],17);
  var cPress=th2Col_(h,['مكبس','مكبس حراري','مكبس؟','Press','Heat Press'],18), cFly=th2Col_(h,['طباعة على الطاير','طباعة ع الطاير','طباعة فورية','Ready Print','Fly Print','Quick Print'],0);
  var cReceived=th2Col_(h,['تاريخ الاستلام','تاريخ الإنشاء','Received At'],0), cExpected=th2Col_(h,['تاريخ التسليم المتوقع','Expected Delivery'],0), cExpectedText=th2Col_(h,['الوقت المتوقع'],0);
  var includeClosed=String(((e&&e.parameter)||{}).includeClosed||'').toLowerCase()==='true';
  var out=[];

  for(var i=1;i<data.length;i++){
    var row=data[i];
    var orderId=th2Norm_(th2Val_(row,cOrder)) || th2Norm_(th2Val_(row,cCode));
    var lineId=th2Norm_(th2Val_(row,cLine));
    var dept=th2Norm_(th2Val_(row,cDept));
    var status=th2Norm_(th2Val_(row,cStatus)) || 'طلب جديد';
    var press=th2Norm_(th2Val_(row,cPress));
    if(!orderId && !lineId) continue;
    if(!includeClosed && th2Closed_(status)) continue;
    if(!sourceSheet && !th2MatchesScreen_(screen, dept, press==='نعم'||String(press).toLowerCase()==='yes')) continue;
    out.push({
      rowNumber:i+1, orderId:orderId, orderCode:th2Norm_(th2Val_(row,cCode))||orderId, lineId:lineId,
      customer:th2Norm_(th2Val_(row,cCustomer)), customerPhone:th2Phone_(th2Val_(row,cPhone)),
      department:dept, itemName:th2Norm_(th2Val_(row,cItem)), qty:th2Val_(row,cQty)||1,
      assignedTo:th2Norm_(th2Val_(row,cAssigned)), priority:th2Norm_(th2Val_(row,cPriority))||'عادي',
      status:status, ready:th2Norm_(th2Val_(row,cReady)), heatPress:press,
      flyPrint:th2Norm_(th2Val_(row,cFly)), quickPrint:th2Norm_(th2Val_(row,cFly)),
      debtAmount:0, debtHold:'لا', debtNotes:'',
      updatedAt:th2Date_(th2Val_(row,cUpdated)), notes:th2Norm_(th2Val_(row,cNotes)),
      receivedAt:th2Date_(th2Val_(row,cReceived)), expectedDeliveryAt:th2Date_(th2Val_(row,cExpected)),
      expectedDeliveryText:th2Date_(th2Val_(row,cExpectedText)||th2Val_(row,cExpected)),
      hotfixSource:sourceSheet ? viewName : th2LinesName_()
    });
  }
  out.sort(function(a,b){ var pa=th2PriorityRank_(a.priority), pb=th2PriorityRank_(b.priority); if(pa!==pb) return pa-pb; return String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')); });
  return { success:true, rows:out.slice(0,limit), limited:true, limit:limit, hotfix:'TIMEOUT_HOTFIX_V2' };
}

/***** OVERRIDE: Fast cached dashboard endpoint. *****/
function getDashboard_(e){
  var auth=authorize_(e.parameter.username, e.parameter.token);
  if(!auth.ok) return { success:false, message:auth.message };
  var screen=th2Screen_(e), cacheKey='trendos_dash_hotfix_v2_'+screen;
  try { var cached=CacheService.getScriptCache().get(cacheKey); if(cached) return JSON.parse(cached); } catch(e1) {}

  var lines=th2Sheet_(th2LinesName_());
  if(!lines) return { success:false, message:'شيت بنود الأوردرات غير موجود.' };
  var dash=(typeof emptyDashboard_==='function') ? emptyDashboard_(screen) : {screen:screen,departmentName:screen,todayWorkLines:0,todayWorkSheets:0,todayWorkDoneLines:0,activeOrders:0,activeLines:0,activeSheets:0,urgent:0,normal:0,overdue:0,readyForPickup:0,readyOrders:0,delivered:0,deliveredToday:0,deliveredTodayOrders:0,duplicate:0,heatPress:0,debtOrders:0,completionPercent:0,timeScore:100,performanceScore:0,byDepartment:{'طباعة':0,'ليزر':0,'مكبس':0}};
  var data=th2Read_(lines, TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V2, 92), h=th2HeaderMap_(data[0]||[]);
  var cOrder=th2Col_(h,['رقم الأوردر','Order ID'],1), cCode=th2Col_(h,['كود الأوردر'],2), cDept=th2Col_(h,['القسم','Department'],5);
  var cQty=th2Col_(h,['الكمية','Qty'],8), cPriority=th2Col_(h,['الأولوية','Priority'],10), cStatus=th2Col_(h,['الحالة','Status'],11), cReady=th2Col_(h,['جاهز؟','جاهز','Ready'],12), cUpdated=th2Col_(h,['آخر تحديث','Updated At'],13), cPress=th2Col_(h,['مكبس','مكبس حراري','مكبس؟','Press','Heat Press'],18), cDebt=th2Col_(h,['مديونية العميل'],0);
  var today=new Date(), activeSet={}, readySet={}, deliveredTodaySet={};

  for(var i=1;i<data.length;i++){
    var row=data[i], orderId=th2Norm_(th2Val_(row,cOrder)) || th2Norm_(th2Val_(row,cCode));
    var dept=th2Norm_(th2Val_(row,cDept))||'غير محدد', status=th2Norm_(th2Val_(row,cStatus))||'طلب جديد', ready=th2Norm_(th2Val_(row,cReady)), priority=th2Norm_(th2Val_(row,cPriority))||'عادي', qty=Number(th2Val_(row,cQty))||1, press=th2Norm_(th2Val_(row,cPress)), updated=th2Val_(row,cUpdated);
    if(!orderId && !dept) continue;
    if(!th2MatchesScreen_(screen,dept,press==='نعم'||String(press).toLowerCase()==='yes')) continue;
    if(dept.indexOf('طباعة')!==-1 && dash.byDepartment) dash.byDepartment['طباعة']=(dash.byDepartment['طباعة']||0)+1;
    if(dept.indexOf('ليزر')!==-1 && dash.byDepartment) dash.byDepartment['ليزر']=(dash.byDepartment['ليزر']||0)+1;
    if(dept.indexOf('مكبس')!==-1 && dash.byDepartment) dash.byDepartment['مكبس']=(dash.byDepartment['مكبس']||0)+1;
    if(th2SameDay_(updated,today)) dash.todayWorkLines += 1;
    dash.todayWorkSheets += qty;
    if(status==='تم التسليم') { dash.delivered += 1; if(th2SameDay_(updated,today)){ dash.deliveredToday += 1; if(orderId) deliveredTodaySet[orderId]=true; } continue; }
    if(status==='مكرر') dash.duplicate += 1;
    if(press==='نعم'||String(press).toLowerCase()==='yes') dash.heatPress += 1;
    if(priority==='عاجل'||priority==='VIP') dash.urgent += 1; else dash.normal += 1;
    if(th2Ready_(status,ready)){ dash.readyForPickup += 1; if(orderId) readySet[orderId]=true; }
    if(!th2Closed_(status)){ dash.activeLines += 1; dash.activeSheets += qty; if(orderId) activeSet[orderId]=true; }
    if(Number(th2Val_(row,cDebt))>0) dash.debtOrders += 1;
  }
  dash.activeOrders=Object.keys(activeSet).length;
  dash.readyOrders=Object.keys(readySet).length;
  dash.deliveredTodayOrders=Object.keys(deliveredTodaySet).length;
  dash.todayWorkOrders=dash.activeOrders;
  var total=dash.activeLines+dash.delivered;
  dash.completionPercent=total?Math.round((dash.delivered/total)*100):0;
  dash.timeScore=dash.overdue?Math.max(0,100-dash.overdue*5):100;
  dash.performanceScore=Math.round((dash.completionPercent*0.6)+(dash.timeScore*0.4));
  dash.updatedAt=Utilities.formatDate(new Date(),'Africa/Cairo','dd/MM/yyyy HH:mm:ss');
  var result={ success:true, dashboard:dash, cachedForSeconds:TRENDOS_TIMEOUT_HOTFIX_DASHBOARD_CACHE_SECONDS_V2, hotfix:'TIMEOUT_HOTFIX_V2' };
  try { CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), TRENDOS_TIMEOUT_HOTFIX_DASHBOARD_CACHE_SECONDS_V2); } catch(e2) {}
  return result;
}

function trendosTimeoutHotfixV2Health_(){
  return { success:true, hotfix:'TIMEOUT_HOTFIX_V2', defaultLimit:TRENDOS_TIMEOUT_HOTFIX_DEFAULT_LIMIT_V2, maxLimit:TRENDOS_TIMEOUT_HOTFIX_MAX_LIMIT_V2, maxScanRows:TRENDOS_TIMEOUT_HOTFIX_MAX_SCAN_ROWS_V2, dashboardCacheSeconds:TRENDOS_TIMEOUT_HOTFIX_DASHBOARD_CACHE_SECONDS_V2, readPathWritesAllowed:false, deployedAt:Utilities.formatDate(new Date(),'Africa/Cairo','dd/MM/yyyy HH:mm:ss') };
}
