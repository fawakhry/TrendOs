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
function trendosHealthDisplayValV1_(row,aliases){return trendosHealthValV1_(row&&row.__display||{},aliases);}
function trendosHealthLineIdV1_(row){
  const aliases=['lineId','رقم البند','Line ID'],raw=trendosHealthValV1_(row,aliases),shown=trendosHealthDisplayValV1_(row,aliases);
  if(typeof trendosLineIdFromSheetCellV1_==='function')return trendosLineIdFromSheetCellV1_(raw,shown);
  return typeof trendosNormalizeLineId_==='function'?trendosNormalizeLineId_(raw):trendosHealthTextV1_(raw);
}
function trendosHealthResolutionSplitV1_(metricId,dup,evidenceBuilder,validator){
  const open=[],acknowledged=[],invalid=[];
  (dup.keys||[]).forEach(function(key){
    const rows=dup.groups[key]||[],evidence=evidenceBuilder(key,rows);
    let resolution={resolved:false,missing:true};
    if(typeof trendosIntegrityResolutionV1_==='function')resolution=trendosIntegrityResolutionV1_(metricId,key,evidence);
    if(resolution.resolved&&(!validator||validator(key,rows,resolution)))acknowledged.push({key:key,count:rows.length,resolution:resolution});
    else{open.push({key:key,count:rows.length,resolution:resolution});if(resolution.stale||resolution.conflict)invalid.push(key);}
  });
  return{
    open:open,acknowledged:acknowledged,invalid:invalid,
    openExcess:open.reduce(function(n,x){return n+Math.max(0,x.count-1);},0),
    acknowledgedExcess:acknowledged.reduce(function(n,x){return n+Math.max(0,x.count-1);},0)
  };
}
function trendosHealthInvoiceDraftDtoV1_(r){
  return{
    draftId:trendosHealthTextV1_(trendosHealthValV1_(r,['Draft ID','ID'])),
    orderId:trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID']),
    subtotal:trendosHealthNumV1_(trendosHealthValV1_(r,['subtotal','الإجمالي المقترح','الإجمالي النهائي'])),
    status:trendosHealthValV1_(r,['status','الحالة']),
    blocker:trendosHealthValV1_(r,['سبب التعطيل','blocker']),
    invoiceNo:trendosHealthValV1_(r,['رقم الفاتورة','Invoice No']),
    messageStatus:trendosHealthValV1_(r,['حالة رسالة واتساب','messageStatus']),
    metaId:trendosHealthValV1_(r,['Meta Message ID','metaId']),
    updatedAt:trendosHealthValV1_(r,['آخر تحديث','Updated At','تاريخ التحديث'])
  };
}

function trendosHealthAnalyzeSnapshotV1_(snap){
  snap=snap||{};const lines=Array.isArray(snap.lines)?snap.lines:[],attendance=Array.isArray(snap.attendance)?snap.attendance:[],cleaning=Array.isArray(snap.cleaning)?snap.cleaning:[],drafts=Array.isArray(snap.drafts)?snap.drafts:[],ops=Array.isArray(snap.opsEvents)?snap.opsEvents:[],runs=Array.isArray(snap.automationRuns)?snap.automationRuns:[];
  const metrics=[],lineGroups={},orderGroups={},invalidLine=[];
  lines.forEach(function(r){
    const raw=trendosHealthValV1_(r,['lineId','رقم البند','Line ID']),lineId=trendosHealthLineIdV1_(r),orderRaw=trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID','كود الأوردر']),orderId=typeof trendosNormalizeOrderId_==='function'?trendosNormalizeOrderId_(orderRaw):trendosHealthTextV1_(orderRaw),status=trendosHealthTextV1_(trendosHealthValV1_(r,['status','الحالة','Status']));
    if((trendosHealthTextV1_(raw)||trendosHealthDisplayValV1_(r,['lineId','رقم البند','Line ID']))&&!lineId)invalidLine.push(trendosHealthDisplayValV1_(r,['lineId','رقم البند','Line ID'])||trendosHealthTextV1_(raw));
    if(lineId&&!trendosHealthClosedStatusV1_(status)){(lineGroups[lineId]||(lineGroups[lineId]=[])).push(r);}
    if(orderId){const g=orderGroups[orderId]||(orderGroups[orderId]={rows:[],allClosed:true});g.rows.push(r);if(!trendosHealthClosedStatusV1_(status))g.allClosed=false;}
  });
  const dupLineIds=Object.keys(lineGroups).filter(k=>lineGroups[k].length>1);
  metrics.push(trendosHealthMetricV1_('ACTIVE_DUPLICATE_LINE_IDS','Orders/Lines','Active duplicate Line IDs',dupLineIds.length,dupLineIds,{groups:dupLineIds.map(k=>({lineId:k,count:lineGroups[k].length}))},{p0:true}));
  metrics.push(trendosHealthMetricV1_('INVALID_LINE_IDS','Orders/Lines','Invalid/date-coerced Line IDs',invalidLine.length,invalidLine,{values:invalidLine},{p0:true}));

  function duplicateBy(rows,keyFn){const g={};rows.forEach(r=>{const k=keyFn(r);if(k)(g[k]||(g[k]=[])).push(r);});const keys=Object.keys(g).filter(k=>g[k].length>1);return{keys,groups:g,excess:keys.reduce((n,k)=>n+g[k].length-1,0)};}
  const attDup=duplicateBy(attendance,function(r){const employee=trendosHealthTextV1_(trendosHealthValV1_(r,['employee','الموظف'])),d=trendosHealthDateV1_(trendosHealthValV1_(r,['date','التاريخ']));return employee&&d?employee+'|'+d:'';});
  const attSplit=trendosHealthResolutionSplitV1_('DUPLICATE_ATTENDANCE_SESSIONS',attDup,function(k,rows){return trendosIntegrityGroupEvidenceV1_('DUPLICATE_ATTENDANCE_SESSIONS',k,rows);});
  metrics.push(trendosHealthMetricV1_('DUPLICATE_ATTENDANCE_SESSIONS','Attendance','Unresolved duplicate attendance employee/day sessions',attSplit.openExcess,attSplit.open.map(x=>x.key),{groups:attSplit.open,acknowledged:attSplit.acknowledged,invalidResolutions:attSplit.invalid},{p0:true}));
  const cleanDup=duplicateBy(cleaning,function(r){const employee=trendosHealthTextV1_(trendosHealthValV1_(r,['employee','الموظف'])),d=trendosHealthDateV1_(trendosHealthValV1_(r,['date','التاريخ','تاريخ العمل']));return employee&&d?employee+'|'+d:'';});
  const cleanSplit=trendosHealthResolutionSplitV1_('DUPLICATE_CLEANING_RECORDS',cleanDup,function(k,rows){return trendosIntegrityGroupEvidenceV1_('DUPLICATE_CLEANING_RECORDS',k,rows);});
  metrics.push(trendosHealthMetricV1_('DUPLICATE_CLEANING_RECORDS','Cleaning','Unresolved duplicate cleaning employee/day records',cleanSplit.openExcess,cleanSplit.open.map(x=>x.key),{groups:cleanSplit.open,acknowledged:cleanSplit.acknowledged,invalidResolutions:cleanSplit.invalid},{p0:true}));

  const draftDup=duplicateBy(drafts,function(r){const raw=trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID']);return typeof trendosNormalizeOrderId_==='function'?trendosNormalizeOrderId_(raw):trendosHealthTextV1_(raw);});
  const draftSplit=trendosHealthResolutionSplitV1_('DUPLICATE_INVOICE_DRAFTS',draftDup,function(k,rows){
    const dto=rows.map(trendosHealthInvoiceDraftDtoV1_);
    return typeof trendosIntegrityInvoiceDraftEvidenceV1_==='function'?trendosIntegrityInvoiceDraftEvidenceV1_(dto):dto;
  },function(k,rows,resolution){
    if(!resolution.canonicalId)return false;
    const ids=rows.map(function(r){return trendosHealthInvoiceDraftDtoV1_(r).draftId;}).filter(Boolean),known={};
    resolution.supersededIds.forEach(function(id){known[id]=true;});
    return ids.indexOf(resolution.canonicalId)!==-1&&resolution.supersededIds.indexOf(resolution.canonicalId)===-1&&
      ids.every(function(id){return id===resolution.canonicalId||known[id];})&&
      resolution.supersededIds.every(function(id){return ids.indexOf(id)!==-1;});
  });
  metrics.push(trendosHealthMetricV1_('DUPLICATE_INVOICE_DRAFTS','Invoice','Unresolved active invoice Draft rows per Order',draftSplit.openExcess,draftSplit.open.map(x=>x.key),{groups:draftSplit.open,acknowledged:draftSplit.acknowledged,invalidResolutions:draftSplit.invalid},{p0:true}));
  const draftOrderIds={};drafts.forEach(r=>{const raw=trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID']),id=typeof trendosNormalizeOrderId_==='function'?trendosNormalizeOrderId_(raw):trendosHealthTextV1_(raw);if(id)draftOrderIds[id]=1;});
  const closedWithDraft=Object.keys(draftOrderIds).filter(id=>orderGroups[id]&&orderGroups[id].rows.length&&orderGroups[id].allClosed);
  metrics.push(trendosHealthMetricV1_('CLOSED_ORDERS_WITH_DRAFT','Invoice','Closed/delivered Orders with Draft',closedWithDraft.length,closedWithDraft,{}, {p0:true}));
  const unpriced=drafts.filter(r=>{const total=trendosHealthNumV1_(trendosHealthValV1_(r,['subtotal','الإجمالي المقترح','الإجمالي النهائي'])),st=trendosHealthNormV1_(trendosHealthValV1_(r,['status','الحالة']));return total<=0&&(st.indexOf('تسعير')!==-1||st.indexOf('اعتماد')!==-1);}).map(r=>trendosHealthTextV1_(trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID']))).filter(Boolean);
  metrics.push(trendosHealthMetricV1_('UNPRICED_DRAFTS','Invoice','Drafts waiting pricing/approval',unpriced.length,unpriced,{}, {p0:false,status:unpriced.length?'WARN':'PASS'}));

  const sourceItems=Array.isArray(snap.pressSourceItems)?snap.pressSourceItems:[],viewItems=Array.isArray(snap.pressViewItems)?snap.pressViewItems:[],viewAuthoritative=!!snap.pressViewAuthoritative;
  const sourceIds=[...new Set(sourceItems.map(x=>trendosHealthTextV1_(trendosHealthValV1_(x,['lineId','Line ID','رقم البند']))).filter(Boolean))],viewIds=[...new Set(viewItems.map(x=>trendosHealthTextV1_(trendosHealthValV1_(x,['lineId','Line ID','رقم البند']))).filter(Boolean))];
  const sourceOnly=sourceIds.filter(x=>viewIds.indexOf(x)===-1),viewOnly=viewIds.filter(x=>sourceIds.indexOf(x)===-1),pressMismatch=(sourceIds.length!==viewIds.length||sourceOnly.length||viewOnly.length)?1:0;
  metrics.push(trendosHealthMetricV1_('PRESS_SOURCE_VIEW_MISMATCH','Press',viewAuthoritative?'Press Source Queue vs authoritative View Queue mismatch':'Press view provider is not proven authoritative',pressMismatch,sourceOnly.concat(viewOnly),{sourceCount:sourceIds.length,viewCount:viewIds.length,sourceOnly,viewOnly,viewProvider:snap.pressViewProvider||'',authoritative:viewAuthoritative},{p0:viewAuthoritative,status:viewAuthoritative?(pressMismatch?'FAIL':'PASS'):'WARN'}));
  const sessionIds=new Set((snap.pressSessionLineIds||[]).map(trendosHealthTextV1_));
  const pressDoneGroups={};lines.forEach(r=>{const st=trendosHealthTextV1_(trendosHealthValV1_(r,['status','الحالة','Status'])),id=trendosHealthLineIdV1_(r);if(!id||!trendosHealthPressFlagV1_(r))return;if(['تم التنفيذ','جاهز للاستلام','تم التسليم'].indexOf(st)!==-1&&!sessionIds.has(id))(pressDoneGroups[id]||(pressDoneGroups[id]=[])).push(r);});
  const pressDoneDup={keys:Object.keys(pressDoneGroups),groups:pressDoneGroups};
  const pressDoneSplit=trendosHealthResolutionSplitV1_('PRESS_COMPLETED_WITHOUT_SESSION',pressDoneDup,function(k,rows){return trendosIntegrityGroupEvidenceV1_('PRESS_COMPLETED_WITHOUT_SESSION',k,rows);});
  metrics.push(trendosHealthMetricV1_('PRESS_COMPLETED_WITHOUT_SESSION','Press','Unresolved Press-completed Lines without session evidence',pressDoneSplit.open.length,pressDoneSplit.open.map(x=>x.key),{groups:pressDoneSplit.open,acknowledged:pressDoneSplit.acknowledged,invalidResolutions:pressDoneSplit.invalid},{p0:true}));
  const acknowledgedCount=attSplit.acknowledgedExcess+cleanSplit.acknowledgedExcess+draftSplit.acknowledgedExcess+pressDoneSplit.acknowledged.length;
  metrics.push(trendosHealthMetricV1_('ACKNOWLEDGED_LEGACY_BASELINES','Core','Exact historical/superseded records acknowledged by evidence hash',acknowledgedCount,[].concat(attSplit.acknowledged.map(x=>x.key),cleanSplit.acknowledged.map(x=>x.key),draftSplit.acknowledged.map(x=>x.key),pressDoneSplit.acknowledged.map(x=>x.key)),{}, {p0:false,status:acknowledgedCount?'WARN':'PASS'}));

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

function trendosHealthRowsFromSheetV1_(name){const sh=trendosSpreadsheetV1_().getSheetByName(name);if(!sh||sh.getLastRow()<2)return[];const range=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()),vals=range.getValues(),display=range.getDisplayValues(),headers=vals[0].map(trendosHealthTextV1_);return vals.slice(1).map(function(row,i){const o={__rowNumber:i+2,__display:{}};headers.forEach((h,j)=>{if(h){o[h]=row[j];o.__display[h]=display[i+1][j];}});return o;});}
function trendosHealthPressViewV1_(){if(typeof trendosPressViewQueueV1_==='function'){const x=trendosPressViewQueueV1_();return{items:x&&x.items||[],provider:'trendosPressViewQueueV1_',authoritative:true};}return{items:trendosHealthRowsFromSheetV1_('واجهة المكبس'),provider:'واجهة المكبس (legacy fallback)',authoritative:false};}
function trendosHealthPressSessionLineIdsV1_(){return trendosHealthRowsFromSheetV1_('تشغيل - بنود جلسات المكبس V1').filter(r=>trendosHealthNormV1_(r['تم في الجلسة؟'])==='نعم').map(r=>trendosHealthTextV1_(r['Line ID'])).filter(Boolean);}
function trendosHealthSnapshotV1_(){
  const press=typeof trendosPressQueueV1_==='function'?trendosPressQueueV1_():{items:[]},pressView=trendosHealthPressViewV1_();
  return{
    lines:trendosHealthRowsFromSheetV1_(typeof SHEET_NAME_LINES!=='undefined'?SHEET_NAME_LINES:'بنود الأوردرات'),
    attendance:trendosHealthRowsFromSheetV1_('سجل الدوام'),cleaning:trendosHealthRowsFromSheetV1_('تشغيل - النظافة اليومية'),
    drafts:trendosHealthRowsFromSheetV1_('حسابات - مسودات الفواتير'),pressSourceItems:press.items||[],pressViewItems:pressView.items||[],pressViewProvider:pressView.provider||'',pressViewAuthoritative:!!pressView.authoritative,pressSessionLineIds:trendosHealthPressSessionLineIdsV1_(),
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
