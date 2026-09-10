/**
 * TrendOS Operator Task Workflow V2 — GitHub candidate only.
 * Owner contract 2026-09-10:
 * - ordinary work is hidden and server-dispatched as one active Task per operator;
 * - claimNext starts the authoritative timer immediately and moves source status to بدء التنفيذ;
 * - ordering: urgent first -> valid delivery due date ascending -> Order ID/sequence ascending;
 * - missing/invalid due dates are excluded from automatic dispatch (fail-closed exception count);
 * - Wael: Fly Print is always-visible READ-ONLY lane OUTSIDE Tasks; Press is a scoped READ-ONLY view;
 * - Gaber: no Fly Print and no Press capabilities;
 * - completion at جاهز للاستلام or تم التسليم closes the authoritative timer.
 *
 * SAFETY: writes are disabled unless TRENDOS_OPERATOR_TASK_V2_ENABLED=true.
 * Installing this file alone is inert and does not create sheets.
 */
const TRENDOS_OPERATOR_TASK_V2_VERSION='TRENDOS_OPERATOR_TASK_V2_20260910';
const TRENDOS_OPERATOR_TASK_V2_ENABLED_PROP='TRENDOS_OPERATOR_TASK_V2_ENABLED';
const TRENDOS_OPERATOR_TASK_V2_PENDING_PROP='TRENDOS_OPERATOR_TASK_V2_PENDING_STATUSES';
const TRENDOS_OPERATOR_TASK_V2_SHEET='تشغيل - مهام المشغلين V2';
const TRENDOS_OPERATOR_TASK_V2_TZ='Africa/Cairo';
const TRENDOS_OPERATOR_TASK_V2_HEADERS=[
  'Task ID','Line ID','Order ID','Source Row','Employee','Department',
  'Claimed At','Started At','Completed At','Work Sec','Final Status','State',
  'Item Name','Customer','Priority','Expected Delivery','Source Status Before','Created By'
];

function otTxtV2_(v){return String(v==null?'':v).trim();}
function otNormV2_(v){return otTxtV2_(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
function otBoolV2_(v){const n=otNormV2_(v);return n==='1'||n==='true'||n==='yes'||n==='on'||n==='نعم'||n==='مفعل';}
function otNowV2_(){return new Date();}
function otIsoV2_(d){if(!d)return '';try{return Utilities.formatDate(new Date(d),TRENDOS_OPERATOR_TASK_V2_TZ,"yyyy-MM-dd'T'HH:mm:ssXXX");}catch(e){return otTxtV2_(d);}}
function otHeaderMapV2_(headers){const out={};(headers||[]).forEach(function(h,i){out[otTxtV2_(h)]=i;});return out;}
function otGetV2_(row,map,keys){for(let i=0;i<keys.length;i++){const idx=map[keys[i]];if(idx!==undefined&&idx!==null){const v=row[idx];if(v!==''&&v!==null&&v!==undefined)return v;}}return '';}
function otNameHasV2_(value,aliases){const n=otNormV2_(value);return (aliases||[]).some(function(a){a=otNormV2_(a);return !!a&&(n===a||n.indexOf(a)!==-1||a.indexOf(n)!==-1);});}
function otUserNameV2_(auth){return otTxtV2_(auth&&auth.user&&(auth.user.username||auth.user.name));}
function otRoleV2_(auth){
  const user=auth&&auth.user||{},name=otTxtV2_(user.username||user.name),role=otNormV2_(user.role);
  if(role==='admin'||otNameHasV2_(name,['ضياء','diaa']))return 'MANAGER';
  if(otNameHasV2_(name,['وائل','wael']))return 'WAEL';
  if(otNameHasV2_(name,['جابر','gaber','jaber']))return 'GABER';
  return 'OTHER';
}
function otEnabledV2_(){try{return otBoolV2_(PropertiesService.getScriptProperties().getProperty(TRENDOS_OPERATOR_TASK_V2_ENABLED_PROP));}catch(e){return false;}}
function otRequireEnabledV2_(){if(!otEnabledV2_())throw new Error('Operator Task V2 غير مفعّل تشغيليًا.');}
function otAuthorizeV2_(p){
  const auth=authorize_(otTxtV2_(p.username),otTxtV2_(p.token));
  if(!auth||!auth.ok)return auth||{ok:false,message:'تعذر التحقق من المستخدم.'};
  auth.operatorTaskRole=otRoleV2_(auth);
  auth.__requestToken=otTxtV2_(p.token);
  if(auth.operatorTaskRole==='OTHER')return {ok:false,message:'نظام التاسكات متاح لوائل وجابر والإدارة فقط.'};
  return auth;
}
function otWithLockV2_(fn){
  if(typeof trendosWithLock_==='function')return trendosWithLock_('script',fn,30000);
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{return fn();}finally{lock.releaseLock();}
}
function otSheetV2_(create){
  const ss=typeof ss_==='function'?ss_():SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName(TRENDOS_OPERATOR_TASK_V2_SHEET);
  if(!sh&&create){sh=ss.insertSheet(TRENDOS_OPERATOR_TASK_V2_SHEET);sh.getRange(1,1,1,TRENDOS_OPERATOR_TASK_V2_HEADERS.length).setValues([TRENDOS_OPERATOR_TASK_V2_HEADERS]);sh.setFrozenRows(1);}
  if(!sh)return null;
  if(sh.getLastColumn()!==TRENDOS_OPERATOR_TASK_V2_HEADERS.length)throw new Error('Operator Task V2 schema column count mismatch.');
  const actual=sh.getRange(1,1,1,TRENDOS_OPERATOR_TASK_V2_HEADERS.length).getValues()[0].map(otTxtV2_);
  if(JSON.stringify(actual)!==JSON.stringify(TRENDOS_OPERATOR_TASK_V2_HEADERS))throw new Error('Operator Task V2 schema headers mismatch.');
  return sh;
}
function otRowsV2_(sh){if(!sh||sh.getLastRow()<2)return [];return sh.getRange(2,1,sh.getLastRow()-1,TRENDOS_OPERATOR_TASK_V2_HEADERS.length).getValues().map(function(v,i){return {row:i+2,values:v};});}
function otTaskObjV2_(x){
  if(!x)return null;const r=x.values||x;
  return {taskId:otTxtV2_(r[0]),lineId:otTxtV2_(r[1]),orderId:otTxtV2_(r[2]),sourceRow:Number(r[3]||0),employee:otTxtV2_(r[4]),department:otTxtV2_(r[5]),claimedAt:otIsoV2_(r[6]),startedAt:otIsoV2_(r[7]),completedAt:otIsoV2_(r[8]),workSec:Number(r[9]||0),finalStatus:otTxtV2_(r[10]),state:otTxtV2_(r[11]),itemName:otTxtV2_(r[12]),customer:otTxtV2_(r[13]),priority:otTxtV2_(r[14]),expectedDelivery:otIsoV2_(r[15]),sourceStatusBefore:otTxtV2_(r[16])};
}
function otActiveStateV2_(s){return ['STARTING','RUNNING'].indexOf(otTxtV2_(s).toUpperCase())!==-1;}
function otActiveIndexV2_(){
  const out={byEmployee:{},byLine:{}};
  otRowsV2_(otSheetV2_(false)).forEach(function(x){const t=otTaskObjV2_(x);if(!otActiveStateV2_(t.state))return;out.byEmployee[otNormV2_(t.employee)]=x;out.byLine[t.lineId]=x;});
  return out;
}
function otFindTaskV2_(taskId){const rows=otRowsV2_(otSheetV2_(false));for(let i=rows.length-1;i>=0;i--){if(otTxtV2_(rows[i].values[0])===otTxtV2_(taskId))return rows[i];}return null;}
function otStableLineIdV2_(raw,orderId){
  const order=otTxtV2_(orderId);
  if(raw instanceof Date&&!isNaN(raw.getTime())){const y=raw.getFullYear(),m=raw.getMonth()+1;if(/^\d+$/.test(order)&&Number(order)===y&&m>=1&&m<=12)return order+'-'+String(m).padStart(2,'0');}
  if(typeof raw==='number'&&isFinite(raw)&&/^\d+$/.test(order)){const d=new Date(Date.UTC(1899,11,30)+Math.round(raw)*86400000);if(d.getUTCFullYear()===Number(order)&&d.getUTCDate()===1)return order+'-'+String(d.getUTCMonth()+1).padStart(2,'0');}
  return otTxtV2_(raw);
}
function otSourceRowsV2_(){
  const ss=typeof ss_==='function'?ss_():SpreadsheetApp.getActiveSpreadsheet();
  const sheetName=typeof SHEET_NAME_LINES!=='undefined'?SHEET_NAME_LINES:'بنود الأوردرات';
  const sh=ss.getSheetByName(sheetName)||ss.getSheetByName('بنود الأوردرات');if(!sh||sh.getLastRow()<2)return [];
  const data=sh.getDataRange().getValues(),map=otHeaderMapV2_(data[0]),out=[];
  for(let i=1;i<data.length;i++){
    const r=data[i],orderId=otTxtV2_(otGetV2_(r,map,['رقم الأوردر','Order ID'])),lineId=otStableLineIdV2_(otGetV2_(r,map,['رقم البند','Line ID']),orderId);
    if(!orderId||!lineId)continue;
    out.push({rowNumber:i+1,orderId:orderId,lineId:lineId,customer:otTxtV2_(otGetV2_(r,map,['اسم الشات / المكتب','اسم العميل','Customer Name'])),department:otTxtV2_(otGetV2_(r,map,['القسم','Department'])),itemName:otTxtV2_(otGetV2_(r,map,['اسم البند / نوع الشغل','اسم البند','Item Name'])),qty:otTxtV2_(otGetV2_(r,map,['الكمية','Qty'])),priority:otTxtV2_(otGetV2_(r,map,['الأولوية','Priority']))||'عادي',status:otTxtV2_(otGetV2_(r,map,['الحالة','Status']))||'طلب جديد',heatPress:otTxtV2_(otGetV2_(r,map,['مكبس','مكبس حراري','مكبس؟','Press','Heat Press'])),flyPrint:otTxtV2_(otGetV2_(r,map,['طباعة على الطاير','طباعة ع الطاير','طباعة فورية','Ready Print','Fly Print','Quick Print'])),expectedAt:otGetV2_(r,map,['تاريخ التسليم المتوقع','ميعاد التسليم','Expected Delivery']),notes:otTxtV2_(otGetV2_(r,map,['ملاحظات','Notes']))});
  }
  return out;
}
function otIsFlyV2_(r){const n=otNormV2_(r&&r.flyPrint);return n==='نعم'||n==='yes'||n==='true'||n==='1'||n==='on'||n.indexOf('الطاير')!==-1;}
function otIsPressV2_(r){const n=otNormV2_(r&&r.heatPress),d=otNormV2_(r&&r.department);return n==='نعم'||n==='yes'||n==='true'||n==='1'||n==='on'||n==='مكبس'||d.indexOf('مكبس')!==-1;}
function otFinalStatusV2_(s){return ['جاهز للاستلام','تم التسليم','مكرر','ملغي','ملغى'].indexOf(otTxtV2_(s))!==-1;}
function otPendingStatusV2_(s){
  let allowed=['طلب جديد'];try{const raw=PropertiesService.getScriptProperties().getProperty(TRENDOS_OPERATOR_TASK_V2_PENDING_PROP);if(otTxtV2_(raw))allowed=String(raw).split(',').map(otTxtV2_);}catch(e){}
  return allowed.indexOf(otTxtV2_(s)||'طلب جديد')!==-1;
}
function otUrgentRankV2_(priority){const n=otNormV2_(priority);return n.indexOf('عاجل')!==-1||n==='urgent'?0:1;}
function otDueMsV2_(v){if(v===null||v===undefined||v==='')return null;const d=v instanceof Date?v:new Date(v),t=d.getTime();return isFinite(t)?t:null;}
function otOrderSeqV2_(orderId){const s=otTxtV2_(orderId);if(/^\d+$/.test(s))return {numeric:true,value:Number(s),text:s};return {numeric:false,value:Number.MAX_SAFE_INTEGER,text:s};}
function otCompareOrderV2_(a,b){const aa=otOrderSeqV2_(a),bb=otOrderSeqV2_(b);if(aa.numeric&&bb.numeric&&aa.value!==bb.value)return aa.value-bb.value;if(aa.numeric!==bb.numeric)return aa.numeric?-1:1;return aa.text.localeCompare(bb.text);}
function otSortCandidatesV2_(rows){
  return (rows||[]).slice().sort(function(a,b){const p=otUrgentRankV2_(a.priority)-otUrgentRankV2_(b.priority);if(p)return p;const ad=otDueMsV2_(a.expectedAt),bd=otDueMsV2_(b.expectedAt);if(ad!==bd)return ad-bd;const o=otCompareOrderV2_(a.orderId,b.orderId);if(o)return o;return otTxtV2_(a.lineId).localeCompare(otTxtV2_(b.lineId));});
}
function otDepartmentEligibleV2_(r,role){const d=otNormV2_(r&&r.department);if(role==='GABER')return d==='ليزر'||d.indexOf('ليزر')!==-1;if(role==='WAEL')return d==='طباعه'||d.indexOf('طباع')!==-1;return false;}
function otNormalCandidateBaseV2_(r,role){if(!r||otFinalStatusV2_(r.status)||!otPendingStatusV2_(r.status)||!otDepartmentEligibleV2_(r,role))return false;if(role==='WAEL'&&otIsFlyV2_(r))return false;return true;}
function otDispatchPoolV2_(role){
  const active=otActiveIndexV2_(),eligible=[],exceptions=[];
  otSourceRowsV2_().forEach(function(r){if(!otNormalCandidateBaseV2_(r,role)||active.byLine[r.lineId])return;const due=otDueMsV2_(r.expectedAt);if(due===null){exceptions.push({lineId:r.lineId,orderId:r.orderId,reason:'MISSING_OR_INVALID_DELIVERY_DUE_DATE'});return;}eligible.push(r);});
  return {eligible:otSortCandidatesV2_(eligible),exceptions:exceptions};
}
function otPublicLineV2_(r){return {lineId:r.lineId,orderId:r.orderId,customer:r.customer,itemName:r.itemName,qty:r.qty,priority:r.priority,status:r.status,expectedDelivery:otIsoV2_(r.expectedAt),heatPress:r.heatPress,flyPrint:r.flyPrint};}
function otFlyLaneV2_(){return otSourceRowsV2_().filter(function(r){return !otFinalStatusV2_(r.status)&&otDepartmentEligibleV2_(r,'WAEL')&&otIsFlyV2_(r);}).map(otPublicLineV2_);}
function otPressLaneV2_(){return otSourceRowsV2_().filter(function(r){return !otFinalStatusV2_(r.status)&&otIsPressV2_(r);}).sort(function(a,b){const ad=otDueMsV2_(a.expectedAt),bd=otDueMsV2_(b.expectedAt);if(ad!==null&&bd!==null&&ad!==bd)return ad-bd;if(ad===null&&bd!==null)return 1;if(ad!==null&&bd===null)return -1;const o=otCompareOrderV2_(a.orderId,b.orderId);return o||otTxtV2_(a.lineId).localeCompare(otTxtV2_(b.lineId));}).map(otPublicLineV2_);}
function otSourceStatusWriteV2_(task,auth,status,notes){
  if(typeof updateLine_!=='function')return {success:false,message:'updateLine_ غير متاح في Apps Script Head.'};
  const user=auth.user||{},e={parameter:{username:otTxtV2_(user.username||user.name),token:otTxtV2_(user.token||auth.__requestToken),rowNumber:String(task.sourceRow||''),lineId:task.lineId,orderId:task.orderId,status:status,notes:otTxtV2_(notes||'')}};
  return updateLine_(e);
}
function otAppendStartingTaskV2_(row,auth,now){
  const sh=otSheetV2_(true),employee=otUserNameV2_(auth),taskId='OT2-'+Utilities.getUuid();
  sh.appendRow([taskId,row.lineId,row.orderId,row.rowNumber,employee,row.department,now,now,'',0,'','STARTING',row.itemName,row.customer,row.priority,row.expectedAt||'',row.status,employee]);
  return otFindTaskV2_(taskId);
}
function otClaimNextV2_(auth){
  if(auth.operatorTaskRole!=='WAEL'&&auth.operatorTaskRole!=='GABER')return {success:false,message:'سحب التاسك متاح لوائل وجابر فقط.'};
  return otWithLockV2_(function(){
    otRequireEnabledV2_();const employee=otUserNameV2_(auth),active=otActiveIndexV2_().byEmployee[otNormV2_(employee)];
    if(active)return {success:true,alreadyActive:true,task:otTaskObjV2_(active)};
    const pool=otDispatchPoolV2_(auth.operatorTaskRole);
    if(!pool.eligible.length)return {success:true,empty:true,exceptionCount:pool.exceptions.length,message:pool.exceptions.length?'لا يوجد تاسك قابل للتوزيع تلقائيًا؛ توجد بنود تحتاج مراجعة ميعاد التسليم.':'لا يوجد تاسك جديد مستحق الآن.'};
    const source=pool.eligible[0],now=otNowV2_(),taskRow=otAppendStartingTaskV2_(source,auth,now),task=otTaskObjV2_(taskRow);
    const write=otSourceStatusWriteV2_(task,auth,'بدء التنفيذ',source.notes||'');
    const sh=otSheetV2_(true);
    if(!write||write.success!==true){sh.getRange(taskRow.row,9).setValue(otNowV2_());sh.getRange(taskRow.row,11).setValue(source.status);sh.getRange(taskRow.row,12).setValue('START_FAILED');return {success:false,message:(write&&write.message)||'تعذر تحويل البند إلى بدء التنفيذ.',task:otTaskObjV2_(otFindTaskV2_(task.taskId))};}
    sh.getRange(taskRow.row,12).setValue('RUNNING');
    return {success:true,claimed:true,started:true,exceptionCount:pool.exceptions.length,task:otTaskObjV2_(otFindTaskV2_(task.taskId))};
  });
}
function otAuthorizedTaskV2_(row,auth){if(!row)throw new Error('التاسك غير موجود.');const t=otTaskObjV2_(row);if(auth.operatorTaskRole==='MANAGER')return t;if(otNormV2_(t.employee)!==otNormV2_(otUserNameV2_(auth)))throw new Error('التاسك محجوز لموظف آخر.');return t;}
function otCompleteTaskV2_(p,auth){
  const finalStatus=otTxtV2_(p.finalStatus);if(['جاهز للاستلام','تم التسليم'].indexOf(finalStatus)===-1)return {success:false,message:'حالة الإنهاء يجب أن تكون جاهز للاستلام أو تم التسليم.'};
  return otWithLockV2_(function(){
    otRequireEnabledV2_();const row=otFindTaskV2_(p.taskId),task=otAuthorizedTaskV2_(row,auth);
    if(task.state==='COMPLETED')return {success:true,alreadyCompleted:true,task:task};
    if(task.state!=='RUNNING')return {success:false,message:'التاسك ليس في حالة تنفيذ تسمح بالإنهاء.',task:task};
    const source=otSourceRowsV2_().filter(function(r){return r.lineId===task.lineId&&Number(r.rowNumber)===Number(task.sourceRow);})[0];
    const write=otSourceStatusWriteV2_(task,auth,finalStatus,source&&source.notes||'');if(!write||write.success!==true)return {success:false,message:(write&&write.message)||'تعذر تحديث حالة البند.'};
    const now=otNowV2_(),start=new Date(row.values[7]).getTime(),end=now.getTime(),workSec=isFinite(start)?Math.max(0,Math.floor((end-start)/1000)):0,sh=otSheetV2_(true);
    sh.getRange(row.row,9).setValue(now);sh.getRange(row.row,10).setValue(workSec);sh.getRange(row.row,11).setValue(finalStatus);sh.getRange(row.row,12).setValue('COMPLETED');
    return {success:true,completed:true,actualWorkSec:workSec,task:otTaskObjV2_(otFindTaskV2_(task.taskId))};
  });
}
function otTaskViewV2_(row){const t=otTaskObjV2_(row);if(!t)return null;const src=otSourceRowsV2_().filter(function(r){return r.lineId===t.lineId&&Number(r.rowNumber)===Number(t.sourceRow);})[0];if(src){t.qty=src.qty;t.sourceStatus=src.status;t.notes=src.notes;t.heatPress=src.heatPress;}return t;}
function otStatusV2_(auth){
  const enabled=otEnabledV2_(),role=auth.operatorTaskRole;if(!enabled)return {success:true,enabled:false,version:TRENDOS_OPERATOR_TASK_V2_VERSION,role:role};
  const active=otActiveIndexV2_().byEmployee[otNormV2_(otUserNameV2_(auth))],result={success:true,enabled:true,version:TRENDOS_OPERATOR_TASK_V2_VERSION,role:role,task:otTaskViewV2_(active)};
  if(role==='WAEL'){result.flyPrint=otFlyLaneV2_();result.pressCandidateCount=otPressLaneV2_().length;}
  return result;
}
function otMetricsV2_(auth){
  if(auth.operatorTaskRole!=='MANAGER')return {success:false,message:'التقارير متاحة للإدارة فقط.'};
  const by={};otRowsV2_(otSheetV2_(false)).forEach(function(x){const t=otTaskObjV2_(x);if(t.state!=='COMPLETED')return;const k=t.employee||'غير معروف';if(!by[k])by[k]={employee:k,completedTasks:0,completedOrders:0,totalWorkSec:0,averageWorkSec:0,_orders:{}};by[k].completedTasks++;by[k].totalWorkSec+=Number(t.workSec||0);by[k]._orders[t.orderId||t.taskId]=true;});
  Object.keys(by).forEach(function(k){by[k].completedOrders=Object.keys(by[k]._orders).length;by[k].averageWorkSec=by[k].completedTasks?Math.round(by[k].totalWorkSec/by[k].completedTasks):0;delete by[k]._orders;});
  return {success:true,employees:Object.keys(by).map(function(k){return by[k];})};
}
function operatorTaskV2_(e){
  const p=e&&e.parameter||{},auth=otAuthorizeV2_(p);if(!auth||!auth.ok)return {success:false,message:auth&&auth.message||'غير مصرح.'};const op=otTxtV2_(p.op||'status');
  try{
    if(op==='status')return otStatusV2_(auth);
    if(op==='claimNext')return otClaimNextV2_(auth);
    if(op==='completeTask')return otCompleteTaskV2_(p,auth);
    if(op==='pressCandidates'){otRequireEnabledV2_();if(auth.operatorTaskRole!=='WAEL')return {success:false,message:'فلتر المكبس متاح لوائل فقط.'};return {success:true,items:otPressLaneV2_()};}
    if(op==='metrics'){otRequireEnabledV2_();return otMetricsV2_(auth);}
    return {success:false,message:'عملية Operator Task V2 غير معروفة.'};
  }catch(err){return {success:false,message:otTxtV2_(err&&err.message||err)};}
}
