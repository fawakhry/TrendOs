/** TrendOS Integrity Dashboard / Observability V1 — GitHub checkpoint only. */
const TRENDOS_HEALTH_VERSION_V1='TRENDOS_INTEGRITY_DASHBOARD_V1_20260830';
const TRENDOS_HEALTH_SHEET_V1='إدارة - صحة النظام';
const TRENDOS_HEALTH_HEADERS_V1=['Metric ID','الفئة','المؤشر','العدد','الحالة','P0؟','IDs JSON','التفاصيل JSON','آخر تحديث'];

function trendosHealthTextV1_(v){return String(v==null?'':v).trim();}
function trendosHealthNormV1_(v){return trendosHealthTextV1_(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ة]/g,'ه').replace(/\s+/g,' ').trim();}
function trendosHealthNumV1_(v){const n=Number(v);return isFinite(n)?n:0;}
function trendosHealthValV1_(row,aliases){row=row||{};for(let i=0;i<aliases.length;i++){const k=aliases[i];if(row[k]!==undefined&&row[k]!==null&&trendosHealthTextV1_(row[k])!=='')return row[k];}return'';}
function trendosHealthMetricV1_(id,category,label,count,ids,details,opt){opt=opt||{};count=Math.max(0,Number(count||0));const status=opt.status||(count>0?(opt.issue===false?'OK':'FAIL'):'PASS');return{id,category,label,count,status,p0:!!opt.p0,ids:(ids||[]).map(trendosHealthTextV1_).filter(Boolean),details:details||{}};}
function trendosHealthDateV1_(v){if(typeof trendosBusinessDate_==='function'){const d=trendosBusinessDate_(v);if(d)return d;}const s=trendosHealthTextV1_(v).replace(/\//g,'-'),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[1]+'-'+m[2]+'-'+m[3]:'';}
function trendosHealthClosedStatusV1_(s){if(typeof trendosIsClosedLineStatus_==='function')return trendosIsClosedLineStatus_(s);s=trendosHealthNormV1_(s);return s==='مكرر'||s.indexOf('ملغ')!==-1||s==='تم التسليم';}
function trendosHealthPressFlagV1_(row){const dept=trendosHealthNormV1_(trendosHealthValV1_(row,['department','القسم'])),v=trendosHealthNormV1_(trendosHealthValV1_(row,['press','مكبس حراري','مكبس','مكبس؟','Press','Heat Press']));return dept.indexOf('مكبس')!==-1||['نعم','yes','true','1'].indexOf(v)!==-1||v.indexOf('مكبس')!==-1;}

function trendosHealthAnalyzeSnapshotV1_(snap){
  snap=snap||{};const lines=Array.isArray(snap.lines)?snap.lines:[],attendance=Array.isArray(snap.attendance)?snap.attendance:[],cleaning=Array.isArray(snap.cleaning)?snap.cleaning:[],drafts=Array.isArray(snap.drafts)?snap.drafts:[],ops=Array.isArray(snap.opsEvents)?snap.opsEvents:[],runs=Array.isArray(snap.automationRuns)?snap.automationRuns:[];
  const metrics=[],lineGroups={},orderGroups={},invalidLine=[];
  lines.forEach(function(r){
    const raw=trendosHealthValV1_(r,['lineId','رقم البند','Line ID']),lineId=typeof trendosNormalizeLineId_==='function'?trendosNormalizeLineId_(raw):trendosHealthTextV1_(raw),orderRaw=trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID','كود الأوردر']),orderId=typeof trendosNormalizeOrderId_==='function'?trendosNormalizeOrderId_(orderRaw):trendosHealthTextV1_(orderRaw),status=trendosHealthTextV1_(trendosHealthValV1_(r,['status','الحالة','Status']));
    if(trendosHealthTextV1_(raw)&&!lineId)invalidLine.push(trendosHealthTextV1_(raw));
    if(lineId&&!trendosHealthClosedStatusV1_(status)){(lineGroups[lineId]||(lineGroups[lineId]=[])).push(r);}
    if(orderId){const g=orderGroups[orderId]||(orderGroups[orderId]={rows:[],allClosed:true});g.rows.push(r);if(!trendosHealthClosedStatusV1_(status))g.allClosed=false;}
  });
  const dupLineIds=Object.keys(lineGroups).filter(k=>lineGroups[k].length>1);
  metrics.push(trendosHealthMetricV1_('ACTIVE_DUPLICATE_LINE_IDS','Orders/Lines','Active duplicate Line IDs',dupLineIds.length,dupLineIds,{groups:dupLineIds.map(k=>({lineId:k,count:lineGroups[k].length}))},{p0:true}));
  metrics.push(trendosHealthMetricV1_('INVALID_LINE_IDS','Orders/Lines','Invalid/date-coerced Line IDs',invalidLine.length,invalidLine,{values:invalidLine},{p0:true}));

  function duplicateBy(rows,keyFn){const g={};rows.forEach(r=>{const k=keyFn(r);if(k)(g[k]||(g[k]=[])).push(r);});const keys=Object.keys(g).filter(k=>g[k].length>1);return{keys,groups:g,excess:keys.reduce((n,k)=>n+g[k].length-1,0)};}
  const attDup=duplicateBy(attendance,function(r){const employee=trendosHealthTextV1_(trendosHealthValV1_(r,['employee','الموظف'])),d=trendosHealthDateV1_(trendosHealthValV1_(r,['date','التاريخ']));return employee&&d?employee+'|'+d:'';});
  metrics.push(trendosHealthMetricV1_('DUPLICATE_ATTENDANCE_SESSIONS','Attendance','Duplicate attendance employee/day sessions',attDup.excess,attDup.keys,{groups:attDup.keys.map(k=>({key:k,count:attDup.groups[k].length}))},{p0:true}));
  const cleanDup=duplicateBy(cleaning,function(r){const employee=trendosHealthTextV1_(trendosHealthValV1_(r,['employee','الموظف'])),d=trendosHealthDateV1_(trendosHealthValV1_(r,['date','التاريخ','تاريخ العمل']));return employee&&d?employee+'|'+d:'';});
  metrics.push(trendosHealthMetricV1_('DUPLICATE_CLEANING_RECORDS','Cleaning','Duplicate cleaning employee/day records',cleanDup.excess,cleanDup.keys,{groups:cleanDup.keys.map(k=>({key:k,count:cleanDup.groups[k].length}))},{p0:true}));

  const draftDup=duplicateBy(drafts,function(r){const raw=trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID']);return typeof trendosNormalizeOrderId_==='function'?trendosNormalizeOrderId_(raw):trendosHealthTextV1_(raw);});
  metrics.push(trendosHealthMetricV1_('DUPLICATE_INVOICE_DRAFTS','Invoice','Duplicate invoice Draft rows per Order',draftDup.excess,draftDup.keys,{groups:draftDup.keys.map(k=>({orderId:k,count:draftDup.groups[k].length}))},{p0:true}));
  const draftOrderIds={};drafts.forEach(r=>{const raw=trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID']),id=typeof trendosNormalizeOrderId_==='function'?trendosNormalizeOrderId_(raw):trendosHealthTextV1_(raw);if(id)draftOrderIds[id]=1;});
  const closedWithDraft=Object.keys(draftOrderIds).filter(id=>orderGroups[id]&&orderGroups[id].rows.length&&orderGroups[id].allClosed);
  metrics.push(trendosHealthMetricV1_('CLOSED_ORDERS_WITH_DRAFT','Invoice','Closed/delivered Orders with Draft',closedWithDraft.length,closedWithDraft,{}, {p0:true}));
  const unpriced=drafts.filter(r=>{const total=trendosHealthNumV1_(trendosHealthValV1_(r,['subtotal','الإجمالي المقترح','الإجمالي النهائي'])),st=trendosHealthNormV1_(trendosHealthValV1_(r,['status','الحالة']));return total<=0&&(st.indexOf('تسعير')!==-1||st.indexOf('اعتماد')!==-1);}).map(r=>trendosHealthTextV1_(trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID']))).filter(Boolean);
  metrics.push(trendosHealthMetricV1_('UNPRICED_DRAFTS','Invoice','Drafts waiting pricing/approval',unpriced.length,unpriced,{}, {p0:false,status:unpriced.length?'WARN':'PASS'}));

  const sourceItems=Array.isArray(snap.pressSourceItems)?snap.pressSourceItems:[],viewItems=Array.isArray(snap.pressViewItems)?snap.pressViewItems:[];
  const sourceIds=[...new Set(sourceItems.map(x=>trendosHealthTextV1_(trendosHealthValV1_(x,['lineId','Line ID','رقم البند']))).filter(Boolean))],viewIds=[...new Set(viewItems.map(x=>trendosHealthTextV1_(trendosHealthValV1_(x,['lineId','Line ID','رقم البند']))).filter(Boolean))];
  const sourceOnly=sourceIds.filter(x=>viewIds.indexOf(x)===-1),viewOnly=viewIds.filter(x=>sourceIds.indexOf(x)===-1),pressMismatch=(sourceIds.length!==viewIds.length||sourceOnly.length||viewOnly.length)?1:0;
  metrics.push(trendosHealthMetricV1_('PRESS_SOURCE_VIEW_MISMATCH','Press','Press Source Queue vs View Queue mismatch',pressMismatch,sourceOnly.concat(viewOnly),{sourceCount:sourceIds.length,viewCount:viewIds.length,sourceOnly,viewOnly},{p0:true}));
  const sessionIds=new Set((snap.pressSessionLineIds||[]).map(trendosHealthTextV1_));
  const pressDone=[];lines.forEach(r=>{const st=trendosHealthTextV1_(trendosHealthValV1_(r,['status','الحالة','Status'])),raw=trendosHealthValV1_(r,['lineId','رقم البند','Line ID']),id=typeof trendosNormalizeLineId_==='function'?trendosNormalizeLineId_(raw):trendosHealthTextV1_(raw);if(!id||!trendosHealthPressFlagV1_(r))return;if(['تم التنفيذ','جاهز للاستلام','تم التسليم'].indexOf(st)!==-1&&!sessionIds.has(id))pressDone.push(id);});
  const pressDoneUnique=[...new Set(pressDone)];metrics.push(trendosHealthMetricV1_('PRESS_COMPLETED_WITHOUT_SESSION','Press','Press-completed Lines without session evidence',pressDoneUnique.length,pressDoneUnique,{}, {p0:true}));

  const openAndon=ops.filter(r=>trendosHealthNormV1_(trendosHealthValV1_(r,['type','نوع الحدث']))==='andon'&&trendosHealthNormV1_(trendosHealthValV1_(r,['status','الحالة']))!=='resolved').map(r=>trendosHealthTextV1_(trendosHealthValV1_(r,['eventId','Event ID','ID']))).filter(Boolean);
  metrics.push(trendosHealthMetricV1_('OPEN_ANDON','OPS','Open ANDON events',openAndon.length,openAndon,{}, {p0:false,status:openAndon.length?'WARN':'PASS'}));

  let lastSuccess=null,lastError=null,lastRun=null;runs.forEach(function(r){lastRun=r;const st=trendosHealthNormV1_(trendosHealthValV1_(r,['status','الحالة']));if(st==='success'||st==='completed'||st==='ok')lastSuccess=r;if(st==='failed'||st==='error')lastError=r;});
  metrics.push(trendosHealthMetricV1_('AUTOMATION_LAST_SUCCESS','Automation','Last successful automation run',lastSuccess?1:0,lastSuccess?[trendosHealthTextV1_(trendosHealthValV1_(lastSuccess,['runId','Run ID']))]:[],{run:lastSuccess},{issue:false,status:lastSuccess?'PASS':'WARN'}));
  const latestFailed=!!(lastRun&&['failed','error'].indexOf(trendosHealthNormV1_(trendosHealthValV1_(lastRun,['status','الحالة'])))!==-1);
  metrics.push(trendosHealthMetricV1_('AUTOMATION_LAST_ERROR','Automation','Latest automation state is failed',latestFailed?1:0,lastError?[trendosHealthTextV1_(trendosHealthValV1_(lastError,['runId','Run ID']))]:[],{run:lastError},{p0:true,status:latestFailed?'FAIL':'PASS'}));

  const p0Failed=metrics.filter(m=>m.p0&&m.status==='FAIL').map(m=>m.id);
  metrics.push(trendosHealthMetricV1_('OPEN_CORE_P0_BLOCKERS','Core','Open derived CORE-P0 integrity blockers',p0Failed.length,p0Failed,{derivedFrom:p0Failed},{p0:false,status:p0Failed.length?'FAIL':'PASS'}));
  return{version:TRENDOS_HEALTH_VERSION_V1,generatedAt:new Date(),healthy:p0Failed.length===0,p0Blockers:p0Failed,metrics};
}

function trendosHealthRowsFromSheetV1_(name){const sh=trendosSpreadsheetV1_().getSheetByName(name);if(!sh||sh.getLastRow()<2)return[];const vals=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues(),headers=vals[0].map(trendosHealthTextV1_);return vals.slice(1).map(function(row,i){const o={__rowNumber:i+2};headers.forEach((h,j)=>{if(h)o[h]=row[j];});return o;});}
function trendosHealthPressViewV1_(){if(typeof trendosPressViewQueueV1_==='function'){const x=trendosPressViewQueueV1_();return x&&x.items||[];}return trendosHealthRowsFromSheetV1_('واجهة المكبس');}
function trendosHealthPressSessionLineIdsV1_(){return trendosHealthRowsFromSheetV1_('تشغيل - بنود جلسات المكبس V1').filter(r=>trendosHealthNormV1_(r['تم في الجلسة؟'])==='نعم').map(r=>trendosHealthTextV1_(r['Line ID'])).filter(Boolean);}
function trendosHealthSnapshotV1_(){
  const press=typeof trendosPressQueueV1_==='function'?trendosPressQueueV1_():{items:[]};
  return{
    lines:trendosHealthRowsFromSheetV1_(typeof SHEET_NAME_LINES!=='undefined'?SHEET_NAME_LINES:'بنود الأوردرات'),
    attendance:trendosHealthRowsFromSheetV1_('سجل الدوام'),cleaning:trendosHealthRowsFromSheetV1_('تشغيل - النظافة اليومية'),
    drafts:trendosHealthRowsFromSheetV1_('حسابات - مسودات الفواتير'),pressSourceItems:press.items||[],pressViewItems:trendosHealthPressViewV1_(),pressSessionLineIds:trendosHealthPressSessionLineIdsV1_(),
    opsEvents:trendosHealthRowsFromSheetV1_('إدارة - أحداث التشغيل V1'),automationRuns:trendosHealthRowsFromSheetV1_(typeof TRENDOS_AUTOMATION_RUN_SHEET_V1!=='undefined'?TRENDOS_AUTOMATION_RUN_SHEET_V1:'إدارة - سجل تشغيل الأتمتة')
  };
}
function trendosHealthSheetV1_(){return trendosEnsureSheetV1_(TRENDOS_HEALTH_SHEET_V1,TRENDOS_HEALTH_HEADERS_V1);}
function trendosRefreshIntegrityDashboardV1_(){
  const report=trendosHealthAnalyzeSnapshotV1_(trendosHealthSnapshotV1_()),sh=trendosHealthSheetV1_(),now=new Date();if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  report.metrics.forEach(function(m){trendosAppendV1_(sh,{'Metric ID':m.id,'الفئة':m.category,'المؤشر':m.label,'العدد':m.count,'الحالة':m.status,'P0؟':m.p0?'نعم':'لا','IDs JSON':trendosStableJsonV1_(m.ids),'التفاصيل JSON':trendosStableJsonV1_(m.details),'آخر تحديث':now},TRENDOS_HEALTH_HEADERS_V1);});
  return report;
}
function trendosIntegrityDashboardV1_(e){const p=e&&e.parameter||{},auth=authorize_(p.username,p.token);if(!auth.ok)return{success:false,message:auth.message};const role=trendosHealthNormV1_(auth.user&&auth.user.role);if(role!=='admin'&&trendosHealthNormV1_(auth.user&&auth.user.username).indexOf('ضياء')===-1)return{success:false,message:'صحة النظام متاحة للإدارة فقط.'};const report=trendosRefreshIntegrityDashboardV1_();return{success:true,report,version:TRENDOS_HEALTH_VERSION_V1};}
