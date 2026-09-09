/**
 * TrendOS Work Queue V1 — candidate only.
 *
 * Operational contract:
 * - Gaber/Wael never receive the normal queue list. claimNext reveals only the line
 *   atomically reserved for the authenticated employee.
 * - One active regular task per employee.
 * - Server timestamps are authoritative for claim/start/pause/resume/finish.
 * - Wael alone gets the always-visible Fly Print exception and the temporary Press batch list.
 * - Press timing belongs to one batch, never multiplied by the number of orders.
 * - All source-order status writes are delegated to the existing updateLine_ contract.
 *
 * SAFETY: mutation is disabled unless Script Property TRENDOS_WORK_QUEUE_V1_ENABLED is true.
 * Merely installing this file does not create sheets or mutate Orders.
 */
const TRENDOS_WORK_QUEUE_V1_VERSION='TRENDOS_WORK_QUEUE_V1_20260909';
const TRENDOS_WORK_QUEUE_ENABLED_PROP_V1='TRENDOS_WORK_QUEUE_V1_ENABLED';
const TRENDOS_WORK_QUEUE_TASKS_SHEET_V1='تشغيل - مهام الأوردرات V1';
const TRENDOS_WORK_QUEUE_PRESS_BATCH_SHEET_V1='تشغيل - دفعات المكبس V1';
const TRENDOS_WORK_QUEUE_PRESS_MEMBERS_SHEET_V1='تشغيل - بنود دفعات المكبس V1';
const TRENDOS_WORK_QUEUE_TZ_V1='Africa/Cairo';

const TRENDOS_WORK_QUEUE_TASK_HEADERS_V1=[
  'Task ID','Line ID','Order ID','Source Row','Employee','Department','Source',
  'Claimed At','Started At','Paused At','Paused Total Sec','Completed At','Work Sec',
  'Final Status','State','Pause Reason','Item Name','Customer','Priority',
  'Expected Delivery','Created By'
];
const TRENDOS_WORK_QUEUE_PRESS_HEADERS_V1=[
  'Batch ID','Operator','Started At','Completed At','Duration Sec','Order Count',
  'Line Count','Line IDs JSON','State','Notes'
];
const TRENDOS_WORK_QUEUE_PRESS_MEMBER_HEADERS_V1=[
  'Batch ID','Line ID','Order ID','Source Row','Item Name','Customer','Priority',
  'Added At','Completed At','State'
];

function wqTxtV1_(v){return String(v==null?'':v).trim();}
function wqNormV1_(v){return wqTxtV1_(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
function wqBoolV1_(v){const n=wqNormV1_(v);return n==='1'||n==='true'||n==='yes'||n==='on'||n==='نعم'||n==='مفعل';}
function wqNowV1_(){return new Date();}
function wqIsoV1_(d){if(!d)return '';try{return Utilities.formatDate(new Date(d),TRENDOS_WORK_QUEUE_TZ_V1,"yyyy-MM-dd'T'HH:mm:ssXXX");}catch(e){return String(d);}}
function wqUserNameV1_(auth){return wqTxtV1_(auth&&auth.user&&(auth.user.username||auth.user.name));}
function wqUserRoleV1_(auth){return wqNormV1_(auth&&auth.user&&auth.user.role);}
function wqNameHasV1_(value,aliases){const n=wqNormV1_(value);return (aliases||[]).some(function(a){a=wqNormV1_(a);return !!a&&(n===a||n.indexOf(a)!==-1||a.indexOf(n)!==-1);});}
function wqRoleV1_(auth){
  const name=wqUserNameV1_(auth),role=wqUserRoleV1_(auth);
  if(role==='admin'||wqNameHasV1_(name,['ضياء','diaa']))return 'MANAGER';
  if(wqNameHasV1_(name,['وائل','wael']))return 'WAEL';
  if(wqNameHasV1_(name,['جابر','gaber','jaber']))return 'GABER';
  return 'OTHER';
}
function wqEnabledV1_(){
  try{return wqBoolV1_(PropertiesService.getScriptProperties().getProperty(TRENDOS_WORK_QUEUE_ENABLED_PROP_V1));}
  catch(e){return false;}
}
function wqAuthV1_(p){
  const auth=authorize_(wqTxtV1_(p.username),wqTxtV1_(p.token));
  if(!auth||!auth.ok)return auth||{ok:false,message:'تعذر التحقق من المستخدم.'};
  const role=wqRoleV1_(auth);
  if(role==='OTHER')return {ok:false,message:'نظام الدور متاح لجابر ووائل والإدارة فقط.'};
  auth.workQueueRole=role;
  return auth;
}
function wqRequireEnabledV1_(){
  if(!wqEnabledV1_())throw new Error('Work Queue V1 غير مفعّل تشغيليًا.');
}
function wqWithLockV1_(fn){
  if(typeof trendosWithLock_==='function')return trendosWithLock_('script',fn,30000);
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{return fn();}finally{lock.releaseLock();}
}
function wqHeaderMapV1_(headers){const out={};(headers||[]).forEach(function(h,i){out[wqTxtV1_(h)]=i;});return out;}
function wqGetV1_(row,map,keys){
  for(let i=0;i<keys.length;i++){const idx=map[keys[i]];if(idx!==undefined&&idx!==null){const v=row[idx];if(v!==''&&v!==null&&v!==undefined)return v;}}
  return '';
}
function wqSheetV1_(name,headers,create){
  const ss=typeof ss_==='function'?ss_():SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName(name);
  if(!sh&&create){sh=ss.insertSheet(name);sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);}
  if(!sh)return null;
  if(sh.getLastColumn()!==headers.length)throw new Error(name+': schema column count mismatch.');
  const actual=sh.getRange(1,1,1,headers.length).getValues()[0].map(wqTxtV1_);
  if(JSON.stringify(actual)!==JSON.stringify(headers))throw new Error(name+': schema headers mismatch.');
  return sh;
}
function wqTaskSheetV1_(create){return wqSheetV1_(TRENDOS_WORK_QUEUE_TASKS_SHEET_V1,TRENDOS_WORK_QUEUE_TASK_HEADERS_V1,create);}
function wqPressBatchSheetV1_(create){return wqSheetV1_(TRENDOS_WORK_QUEUE_PRESS_BATCH_SHEET_V1,TRENDOS_WORK_QUEUE_PRESS_HEADERS_V1,create);}
function wqPressMemberSheetV1_(create){return wqSheetV1_(TRENDOS_WORK_QUEUE_PRESS_MEMBERS_SHEET_V1,TRENDOS_WORK_QUEUE_PRESS_MEMBER_HEADERS_V1,create);}
function wqRowsV1_(sh,headers){
  if(!sh||sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,headers.length).getValues().map(function(v,i){return {row:i+2,values:v};});
}
function wqTaskObjV1_(x){
  if(!x)return null;const r=x.values||x;
  return {
    taskId:wqTxtV1_(r[0]),lineId:wqTxtV1_(r[1]),orderId:wqTxtV1_(r[2]),sourceRow:Number(r[3]||0),
    employee:wqTxtV1_(r[4]),department:wqTxtV1_(r[5]),source:wqTxtV1_(r[6]),
    claimedAt:wqIsoV1_(r[7]),startedAt:wqIsoV1_(r[8]),pausedAt:wqIsoV1_(r[9]),
    pausedTotalSec:Number(r[10]||0),completedAt:wqIsoV1_(r[11]),workSec:Number(r[12]||0),
    finalStatus:wqTxtV1_(r[13]),state:wqTxtV1_(r[14]),pauseReason:wqTxtV1_(r[15]),
    itemName:wqTxtV1_(r[16]),customer:wqTxtV1_(r[17]),priority:wqTxtV1_(r[18]),
    expectedDelivery:wqIsoV1_(r[19])
  };
}
function wqTaskActiveStateV1_(state){return ['CLAIMED','RUNNING','PAUSED'].indexOf(wqTxtV1_(state).toUpperCase())!==-1;}
function wqActiveTasksV1_(){
  const sh=wqTaskSheetV1_(false),out={byEmployee:{},byLine:{},rows:[]};
  wqRowsV1_(sh,TRENDOS_WORK_QUEUE_TASK_HEADERS_V1).forEach(function(x){
    const o=wqTaskObjV1_(x);if(!wqTaskActiveStateV1_(o.state))return;
    out.rows.push(x);out.byLine[o.lineId]=x;out.byEmployee[wqNormV1_(o.employee)]=x;
  });return out;
}
function wqActiveTaskForEmployeeV1_(employee){return wqActiveTasksV1_().byEmployee[wqNormV1_(employee)]||null;}
function wqFindTaskV1_(taskId){
  const rows=wqRowsV1_(wqTaskSheetV1_(false),TRENDOS_WORK_QUEUE_TASK_HEADERS_V1);
  for(let i=rows.length-1;i>=0;i--){if(wqTxtV1_(rows[i].values[0])===wqTxtV1_(taskId))return rows[i];}
  return null;
}
function wqPriorityRankV1_(v){const n=wqNormV1_(v);if(n==='عاجل'||n==='vip')return 0;if(n==='عادي'||!n)return 1;if(n==='موجل'||n==='مؤجل')return 2;return 3;}
function wqExpectedMsV1_(v){if(!v)return Number.MAX_SAFE_INTEGER;const d=v instanceof Date?v:new Date(v);const t=d.getTime();return isFinite(t)?t:Number.MAX_SAFE_INTEGER;}
function wqStableLineIdV1_(raw,orderId){
  const order=wqTxtV1_(orderId);
  if(raw instanceof Date&&!isNaN(raw.getTime())){
    const y=raw.getFullYear(),m=raw.getMonth()+1;
    if(/^\d+$/.test(order)&&Number(order)===y&&m>=1&&m<=12)return order+'-'+String(m).padStart(2,'0');
  }
  if(typeof raw==='number'&&isFinite(raw)&&/^\d+$/.test(order)){
    const d=new Date(Date.UTC(1899,11,30)+Math.round(raw)*86400000);
    if(d.getUTCFullYear()===Number(order)&&d.getUTCDate()===1)return order+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
  }
  return wqTxtV1_(raw);
}
function wqSourceRowsV1_(){
  const ss=typeof ss_==='function'?ss_():SpreadsheetApp.getActiveSpreadsheet();
  const name=typeof SHEET_NAME_LINES!=='undefined'?SHEET_NAME_LINES:'بنود الأوردرات';
  const sh=ss.getSheetByName(name)||ss.getSheetByName('بنود الأوردرات');
  if(!sh||sh.getLastRow()<2)return [];
  const data=sh.getDataRange().getValues(),map=wqHeaderMapV1_(data[0]),out=[];
  for(let i=1;i<data.length;i++){
    const r=data[i],orderId=wqTxtV1_(wqGetV1_(r,map,['رقم الأوردر','Order ID']));
    const rawLine=wqGetV1_(r,map,['رقم البند','Line ID']);
    const lineId=wqStableLineIdV1_(rawLine,orderId);
    if(!orderId||!lineId)continue;
    out.push({
      rowNumber:i+1,orderId:orderId,lineId:lineId,
      customer:wqTxtV1_(wqGetV1_(r,map,['اسم الشات / المكتب','اسم العميل','Customer Name'])),
      department:wqTxtV1_(wqGetV1_(r,map,['القسم','Department'])),
      itemName:wqTxtV1_(wqGetV1_(r,map,['اسم البند / نوع الشغل','اسم البند','Item Name'])),
      qty:wqTxtV1_(wqGetV1_(r,map,['الكمية','Qty'])),
      assignedTo:wqTxtV1_(wqGetV1_(r,map,['مسؤول القسم','Assigned To'])),
      priority:wqTxtV1_(wqGetV1_(r,map,['الأولوية','Priority']))||'عادي',
      status:wqTxtV1_(wqGetV1_(r,map,['الحالة','Status']))||'طلب جديد',
      ready:wqTxtV1_(wqGetV1_(r,map,['جاهز؟','جاهز','Ready'])),
      heatPress:wqTxtV1_(wqGetV1_(r,map,['مكبس','مكبس حراري','مكبس؟','Press','Heat Press'])),
      flyPrint:wqTxtV1_(wqGetV1_(r,map,['طباعة على الطاير','طباعة ع الطاير','طباعة فورية','Ready Print','Fly Print','Quick Print'])),
      receivedAt:wqGetV1_(r,map,['تاريخ الاستلام','تاريخ الإنشاء','Received At']),
      expectedAt:wqGetV1_(r,map,['تاريخ التسليم المتوقع','Expected Delivery']),
      notes:wqTxtV1_(wqGetV1_(r,map,['ملاحظات','Notes']))
    });
  }
  return out;
}
function wqIsPressV1_(r){const n=wqNormV1_(r&&r.heatPress);return n==='نعم'||n==='yes'||n==='true'||n==='1'||n==='on'||n==='مكبس'||wqNormV1_(r&&r.department).indexOf('مكبس')!==-1;}
function wqIsFlyV1_(r){const n=wqNormV1_(r&&r.flyPrint);return n==='نعم'||n==='yes'||n==='true'||n==='1'||n==='on'||n==='طباعه علي الطاير'||n==='طباعه ع الطاير'||n==='ع الطاير'||n==='علي الطاير';}
function wqFinalStatusV1_(s){return ['جاهز للاستلام','تم التسليم','مكرر','ملغي','ملغى'].indexOf(wqTxtV1_(s))!==-1;}
function wqPendingStatusV1_(s){
  const raw='طلب جديد';
  let allowed=[raw];
  try{const p=PropertiesService.getScriptProperties().getProperty('TRENDOS_WORK_QUEUE_PENDING_STATUSES_V1');if(wqTxtV1_(p))allowed=String(p).split(',').map(wqTxtV1_);}catch(e){}
  return allowed.indexOf(wqTxtV1_(s)||raw)!==-1;
}
function wqPressReadyStatusV1_(s){
  let allowed=['بدأ التنفيذ','تحت التنفيذ','جاهز للطباعة','تم التنفيذ'];
  try{const p=PropertiesService.getScriptProperties().getProperty('TRENDOS_WORK_QUEUE_PRESS_READY_STATUSES_V1');if(wqTxtV1_(p))allowed=String(p).split(',').map(wqTxtV1_);}catch(e){}
  return allowed.indexOf(wqTxtV1_(s))!==-1;
}
function wqDepartmentForRoleV1_(role){return role==='GABER'?'ليزر':role==='WAEL'?'طباعة':'';}
function wqIsNormalCandidateV1_(row,role){
  if(!row||wqFinalStatusV1_(row.status)||!wqPendingStatusV1_(row.status))return false;
  const dep=wqNormV1_(row.department);
  if(role==='GABER')return dep==='ليزر'||dep.indexOf('ليزر')!==-1;
  if(role==='WAEL'){
    if(!(dep==='طباعه'||dep.indexOf('طباع')!==-1))return false;
    if(wqIsFlyV1_(row)||wqIsPressV1_(row))return false;
    return true;
  }
  return false;
}
function wqSortCandidatesV1_(rows){
  return (rows||[]).slice().sort(function(a,b){
    const p=wqPriorityRankV1_(a.priority)-wqPriorityRankV1_(b.priority);if(p)return p;
    const e=wqExpectedMsV1_(a.expectedAt)-wqExpectedMsV1_(b.expectedAt);if(e)return e;
    const r=Number(a.rowNumber||0)-Number(b.rowNumber||0);if(r)return r;
    return wqTxtV1_(a.lineId).localeCompare(wqTxtV1_(b.lineId));
  });
}
function wqPublicLineV1_(r){return {
  lineId:r.lineId,orderId:r.orderId,rowNumber:r.rowNumber,customer:r.customer,department:r.department,
  itemName:r.itemName,qty:r.qty,priority:r.priority,status:r.status,heatPress:r.heatPress,flyPrint:r.flyPrint,
  expectedDelivery:wqIsoV1_(r.expectedAt),notes:r.notes
};}
function wqOpenPressLineIdsV1_(){
  const sh=wqPressBatchSheetV1_(false);if(!sh)return {};
  const open={};wqRowsV1_(sh,TRENDOS_WORK_QUEUE_PRESS_HEADERS_V1).forEach(function(x){
    if(wqTxtV1_(x.values[8]).toUpperCase()!=='RUNNING')return;
    let ids=[];try{ids=JSON.parse(wqTxtV1_(x.values[7])||'[]');}catch(e){}
    (ids||[]).forEach(function(id){open[wqTxtV1_(id)]=true;});
  });return open;
}
function wqNormalCandidatesV1_(role){
  const active=wqActiveTasksV1_(),pressOpen=wqOpenPressLineIdsV1_();
  return wqSortCandidatesV1_(wqSourceRowsV1_().filter(function(r){
    return wqIsNormalCandidateV1_(r,role)&&!active.byLine[r.lineId]&&!pressOpen[r.lineId];
  }));
}
function wqFlyCandidatesV1_(){
  const active=wqActiveTasksV1_(),pressOpen=wqOpenPressLineIdsV1_();
  return wqSortCandidatesV1_(wqSourceRowsV1_().filter(function(r){
    const dep=wqNormV1_(r.department);
    return !wqFinalStatusV1_(r.status)&&(dep==='طباعه'||dep.indexOf('طباع')!==-1)&&wqIsFlyV1_(r)&&!active.byLine[r.lineId]&&!pressOpen[r.lineId];
  }));
}
function wqPressCandidatesV1_(){
  const active=wqActiveTasksV1_(),pressOpen=wqOpenPressLineIdsV1_();
  return wqSortCandidatesV1_(wqSourceRowsV1_().filter(function(r){
    return !wqFinalStatusV1_(r.status)&&wqIsPressV1_(r)&&wqPressReadyStatusV1_(r.status)&&!active.byLine[r.lineId]&&!pressOpen[r.lineId];
  }));
}
function wqAppendTaskV1_(row,auth,source){
  const sh=wqTaskSheetV1_(true),now=wqNowV1_(),employee=wqUserNameV1_(auth),taskId='WQ-'+Utilities.getUuid();
  sh.appendRow([
    taskId,row.lineId,row.orderId,row.rowNumber,employee,row.department,source,now,'','',0,'',0,'','CLAIMED','',
    row.itemName,row.customer,row.priority,row.expectedAt||'',employee
  ]);
  return wqFindTaskV1_(taskId);
}
function wqClaimNextV1_(auth){
  const role=auth.workQueueRole;if(role!=='GABER'&&role!=='WAEL')throw new Error('المطالبة بتاسك جديد متاحة لجابر ووائل فقط.');
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();
    const existing=wqActiveTaskForEmployeeV1_(wqUserNameV1_(auth));
    if(existing)return {success:true,alreadyActive:true,task:wqTaskObjV1_(existing)};
    const list=wqNormalCandidatesV1_(role);
    if(!list.length)return {success:true,empty:true,message:'لا يوجد تاسك جديد مستحق الآن.'};
    const task=wqAppendTaskV1_(list[0],auth,'NORMAL_QUEUE');
    return {success:true,claimed:true,task:wqTaskObjV1_(task)};
  });
}
function wqClaimFlyV1_(p,auth){
  if(auth.workQueueRole!=='WAEL')throw new Error('طباعة ع الطاير متاحة لوائل فقط.');
  const wanted=wqTxtV1_(p.lineId);
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();
    const existing=wqActiveTaskForEmployeeV1_(wqUserNameV1_(auth));
    if(existing)return {success:false,message:'أنهِ أو أوقف التاسك الحالي قبل فتح طباعة ع الطاير.',task:wqTaskObjV1_(existing)};
    const row=wqFlyCandidatesV1_().filter(function(x){return x.lineId===wanted;})[0];
    if(!row)return {success:false,message:'الأوردر لم يعد متاحًا كطباعة ع الطاير.'};
    const task=wqAppendTaskV1_(row,auth,'FLY_PRINT');
    return {success:true,claimed:true,task:wqTaskObjV1_(task)};
  });
}
function wqFindSourceLineV1_(lineId,rowNumber){
  const rows=wqSourceRowsV1_();
  for(let i=0;i<rows.length;i++){if(rows[i].lineId===wqTxtV1_(lineId)&&(!rowNumber||Number(rows[i].rowNumber)===Number(rowNumber)))return rows[i];}
  return null;
}
function wqTaskViewV1_(taskRow){
  const task=wqTaskObjV1_(taskRow);if(!task)return null;
  const src=wqFindSourceLineV1_(task.lineId,task.sourceRow);
  if(src){task.qty=src.qty;task.sourceStatus=src.status;task.notes=src.notes;task.heatPress=src.heatPress;task.flyPrint=src.flyPrint;}
  return task;
}
function wqSourceStatusWriteV1_(task,auth,status,notes){
  if(typeof updateLine_!=='function')return {success:false,message:'updateLine_ غير متاح في Apps Script Head.'};
  const e={parameter:{
    username:wqTxtV1_(auth.user.username||auth.user.name),token:wqTxtV1_(auth.user.token||''),
    rowNumber:String(task.sourceRow||''),lineId:task.lineId,orderId:task.orderId,status:status,notes:wqTxtV1_(notes||'')
  }};
  // authorize_ normally returns the token-bearing user from the request; auth.user.token may not be echoed.
  if(!e.parameter.token)e.parameter.token=wqTxtV1_(auth.__requestToken||'');
  return updateLine_(e);
}
function wqAuthorizedTaskV1_(taskRow,auth){
  if(!taskRow)throw new Error('التاسك غير موجود.');
  const task=wqTaskObjV1_(taskRow);
  if(auth.workQueueRole==='MANAGER')return task;
  if(wqNormV1_(task.employee)!==wqNormV1_(wqUserNameV1_(auth)))throw new Error('التاسك محجوز لموظف آخر.');
  return task;
}
function wqWorkSecondsV1_(startedAt,completedAt,pausedTotalSec,pausedAt){
  if(!startedAt)return 0;
  const start=new Date(startedAt).getTime(),end=new Date(completedAt||wqNowV1_()).getTime();
  if(!isFinite(start)||!isFinite(end))return 0;
  let paused=Number(pausedTotalSec||0);
  if(pausedAt){const p=new Date(pausedAt).getTime();if(isFinite(p)&&end>p)paused+=Math.floor((end-p)/1000);}
  return Math.max(0,Math.floor((end-start)/1000)-paused);
}
function wqStartTaskV1_(p,auth){
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();const row=wqFindTaskV1_(p.taskId),task=wqAuthorizedTaskV1_(row,auth);
    if(task.state==='RUNNING')return {success:true,alreadyRunning:true,task:task};
    if(task.state!=='CLAIMED')return {success:false,message:'التاسك ليس في حالة تسمح ببدء التنفيذ.',task:task};
    const src=wqFindSourceLineV1_(task.lineId,task.sourceRow);if(!src||wqFinalStatusV1_(src.status))return {success:false,message:'البند لم يعد صالحًا لبدء التنفيذ.'};
    const write=wqSourceStatusWriteV1_(task,auth,'بدأ التنفيذ',src.notes||'');
    if(!write||write.success!==true)return {success:false,message:(write&&write.message)||'تعذر تحديث حالة البند.'};
    const sh=wqTaskSheetV1_(true),now=wqNowV1_();
    sh.getRange(row.row,9).setValue(now);sh.getRange(row.row,15).setValue('RUNNING');
    return {success:true,task:wqTaskObjV1_(wqFindTaskV1_(task.taskId))};
  });
}
function wqPauseTaskV1_(p,auth){
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();const row=wqFindTaskV1_(p.taskId),task=wqAuthorizedTaskV1_(row,auth);
    if(task.state!=='RUNNING')return {success:false,message:'لا يمكن إيقاف عداد غير شغال.',task:task};
    const reason=wqTxtV1_(p.reason);if(!reason)return {success:false,message:'اكتب سبب التوقف.'};
    const src=wqFindSourceLineV1_(task.lineId,task.sourceRow),write=wqSourceStatusWriteV1_(task,auth,'متوقف',(src&&src.notes?src.notes+'\n':'')+'توقف Work Queue: '+reason);
    if(!write||write.success!==true)return {success:false,message:(write&&write.message)||'تعذر تحديث حالة البند.'};
    const sh=wqTaskSheetV1_(true),now=wqNowV1_();
    sh.getRange(row.row,10).setValue(now);sh.getRange(row.row,15).setValue('PAUSED');sh.getRange(row.row,16).setValue(reason);
    return {success:true,task:wqTaskObjV1_(wqFindTaskV1_(task.taskId))};
  });
}
function wqResumeTaskV1_(p,auth){
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();const row=wqFindTaskV1_(p.taskId),task=wqAuthorizedTaskV1_(row,auth);
    if(task.state!=='PAUSED')return {success:false,message:'التاسك غير متوقف.',task:task};
    const now=wqNowV1_(),pausedAt=row.values[9],oldPaused=Number(row.values[10]||0);
    const extra=pausedAt?Math.max(0,Math.floor((now-new Date(pausedAt))/1000)):0;
    const src=wqFindSourceLineV1_(task.lineId,task.sourceRow),write=wqSourceStatusWriteV1_(task,auth,'تحت التنفيذ',src&&src.notes||'');
    if(!write||write.success!==true)return {success:false,message:(write&&write.message)||'تعذر تحديث حالة البند.'};
    const sh=wqTaskSheetV1_(true);
    sh.getRange(row.row,10).setValue('');sh.getRange(row.row,11).setValue(oldPaused+extra);sh.getRange(row.row,15).setValue('RUNNING');sh.getRange(row.row,16).setValue('');
    return {success:true,task:wqTaskObjV1_(wqFindTaskV1_(task.taskId))};
  });
}
function wqCompleteTaskV1_(p,auth){
  const finalStatus=wqTxtV1_(p.finalStatus);
  if(['جاهز للاستلام','تم التسليم'].indexOf(finalStatus)===-1)return {success:false,message:'حالة الإنهاء يجب أن تكون جاهز للاستلام أو تم التسليم.'};
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();const row=wqFindTaskV1_(p.taskId),task=wqAuthorizedTaskV1_(row,auth);
    if(['RUNNING','PAUSED'].indexOf(task.state)===-1)return {success:false,message:'ابدأ التاسك قبل إنهائه.',task:task};
    const src=wqFindSourceLineV1_(task.lineId,task.sourceRow),write=wqSourceStatusWriteV1_(task,auth,finalStatus,src&&src.notes||'');
    if(!write||write.success!==true)return {success:false,message:(write&&write.message)||'تعذر تحديث حالة البند.'};
    const now=wqNowV1_(),workSec=wqWorkSecondsV1_(row.values[8],now,row.values[10],row.values[9]);
    let pausedTotal=Number(row.values[10]||0);
    if(row.values[9])pausedTotal+=Math.max(0,Math.floor((now-new Date(row.values[9]))/1000));
    const sh=wqTaskSheetV1_(true);
    sh.getRange(row.row,10).setValue('');sh.getRange(row.row,11).setValue(pausedTotal);
    sh.getRange(row.row,12).setValue(now);sh.getRange(row.row,13).setValue(workSec);
    sh.getRange(row.row,14).setValue(finalStatus);sh.getRange(row.row,15).setValue('COMPLETED');sh.getRange(row.row,16).setValue('');
    return {success:true,task:wqTaskObjV1_(wqFindTaskV1_(task.taskId))};
  });
}
function wqPressOpenBatchV1_(){
  const rows=wqRowsV1_(wqPressBatchSheetV1_(false),TRENDOS_WORK_QUEUE_PRESS_HEADERS_V1);
  for(let i=rows.length-1;i>=0;i--){if(wqTxtV1_(rows[i].values[8]).toUpperCase()==='RUNNING')return rows[i];}
  return null;
}
function wqFindPressBatchV1_(batchId){
  const rows=wqRowsV1_(wqPressBatchSheetV1_(false),TRENDOS_WORK_QUEUE_PRESS_HEADERS_V1);
  for(let i=rows.length-1;i>=0;i--){if(wqTxtV1_(rows[i].values[0])===wqTxtV1_(batchId))return rows[i];}
  return null;
}
function wqPressBatchObjV1_(x){
  if(!x)return null;const r=x.values||x;let ids=[];try{ids=JSON.parse(wqTxtV1_(r[7])||'[]');}catch(e){}
  return {batchId:wqTxtV1_(r[0]),operator:wqTxtV1_(r[1]),startedAt:wqIsoV1_(r[2]),completedAt:wqIsoV1_(r[3]),durationSec:Number(r[4]||0),orderCount:Number(r[5]||0),lineCount:Number(r[6]||0),lineIds:ids,state:wqTxtV1_(r[8]),notes:wqTxtV1_(r[9])};
}
function wqSelectedIdsV1_(p){
  let ids=p.selectedLineIds||p.lineIds||[];
  if(typeof ids==='string'){try{ids=JSON.parse(ids);}catch(e){ids=ids.split(',');}}
  const seen={},out=[];(ids||[]).forEach(function(v){v=wqTxtV1_(v);if(v&&!seen[v]){seen[v]=true;out.push(v);}});
  return out;
}
function wqPressStartV1_(p,auth){
  if(auth.workQueueRole!=='WAEL')return {success:false,message:'دفعات المكبس في Work Queue متاحة لوائل فقط.'};
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();
    const regular=wqActiveTaskForEmployeeV1_(wqUserNameV1_(auth));
    if(regular&&wqTaskObjV1_(regular).state!=='PAUSED')return {success:false,message:'أوقف التاسك الجاري مؤقتًا قبل بدء دفعة المكبس.',task:wqTaskObjV1_(regular)};
    const open=wqPressOpenBatchV1_();if(open)return {success:false,message:'هناك دفعة مكبس شغالة بالفعل.',batch:wqPressBatchObjV1_(open)};
    const ids=wqSelectedIdsV1_(p);if(!ids.length)return {success:false,message:'اختر أوردر واحد على الأقل للمكبس.'};
    const candidates=wqPressCandidatesV1_(),by={};candidates.forEach(function(r){by[r.lineId]=r;});
    const selected=[];for(let i=0;i<ids.length;i++){if(!by[ids[i]])return {success:false,message:'أحد بنود المكبس لم يعد متاحًا: '+ids[i]};selected.push(by[ids[i]]);}
    const batchId='PRESS-BATCH-'+Utilities.getUuid(),now=wqNowV1_(),orders={};
    selected.forEach(function(r){orders[r.orderId]=true;});
    const sh=wqPressBatchSheetV1_(true),members=wqPressMemberSheetV1_(true);
    sh.appendRow([batchId,wqUserNameV1_(auth),now,'','',Object.keys(orders).length,selected.length,JSON.stringify(ids),'RUNNING','']);
    const memberRows=selected.map(function(r){return [batchId,r.lineId,r.orderId,r.rowNumber,r.itemName,r.customer,r.priority,now,'','RUNNING'];});
    if(memberRows.length)members.getRange(members.getLastRow()+1,1,memberRows.length,TRENDOS_WORK_QUEUE_PRESS_MEMBER_HEADERS_V1.length).setValues(memberRows);
    return {success:true,batch:wqPressBatchObjV1_(wqPressOpenBatchV1_())};
  });
}
function wqPressStopV1_(p,auth){
  if(auth.workQueueRole!=='WAEL'&&auth.workQueueRole!=='MANAGER')return {success:false,message:'قفل دفعة المكبس غير مسموح.'};
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();const open=wqPressOpenBatchV1_();if(!open)return {success:false,message:'لا توجد دفعة مكبس شغالة.'};
    const batch=wqPressBatchObjV1_(open);
    if(auth.workQueueRole!=='MANAGER'&&wqNormV1_(batch.operator)!==wqNormV1_(wqUserNameV1_(auth)))return {success:false,message:'دفعة المكبس تخص موظفًا آخر.'};
    const now=wqNowV1_(),start=new Date(open.values[2]).getTime(),sec=isFinite(start)?Math.max(0,Math.floor((now-start)/1000)):0;
    const sh=wqPressBatchSheetV1_(true);sh.getRange(open.row,4).setValue(now);sh.getRange(open.row,5).setValue(sec);sh.getRange(open.row,9).setValue('COMPLETED');sh.getRange(open.row,10).setValue(wqTxtV1_(p.notes));
    const mem=wqPressMemberSheetV1_(true),rows=wqRowsV1_(mem,TRENDOS_WORK_QUEUE_PRESS_MEMBER_HEADERS_V1);
    rows.forEach(function(x){if(wqTxtV1_(x.values[0])===batch.batchId&&wqTxtV1_(x.values[9])==='RUNNING'){mem.getRange(x.row,9).setValue(now);mem.getRange(x.row,10).setValue('COMPLETED');}});
    return {success:true,batch:wqPressBatchObjV1_(wqFindPressBatchV1_(batch.batchId)),completedAt:wqIsoV1_(now),durationSec:sec};
  });
}
function wqManagerV1_(auth){if(auth.workQueueRole!=='MANAGER')throw new Error('هذه العملية للإدارة فقط.');}
function wqManagerReleaseV1_(p,auth){
  wqManagerV1_(auth);
  return wqWithLockV1_(function(){
    wqRequireEnabledV1_();const row=wqFindTaskV1_(p.taskId),task=wqAuthorizedTaskV1_(row,auth);
    if(!wqTaskActiveStateV1_(task.state))return {success:true,alreadyClosed:true,task:task};
    const now=wqNowV1_(),workSec=wqWorkSecondsV1_(row.values[8],now,row.values[10],row.values[9]),sh=wqTaskSheetV1_(true);
    sh.getRange(row.row,12).setValue(now);sh.getRange(row.row,13).setValue(workSec);sh.getRange(row.row,15).setValue('RELEASED');sh.getRange(row.row,16).setValue('Manager release: '+wqTxtV1_(p.reason));
    return {success:true,task:wqTaskObjV1_(wqFindTaskV1_(task.taskId))};
  });
}
function wqMetricsV1_(auth){
  wqManagerV1_(auth);
  const tasks=wqRowsV1_(wqTaskSheetV1_(false),TRENDOS_WORK_QUEUE_TASK_HEADERS_V1),by={};
  tasks.forEach(function(x){
    const t=wqTaskObjV1_(x);if(t.state!=='COMPLETED')return;
    const k=t.employee||'غير معروف';if(!by[k])by[k]={employee:k,completedTasks:0,completedOrders:0,totalWorkSec:0,averageWorkSec:0,_orders:{}};
    by[k].completedTasks++;by[k].totalWorkSec+=Number(t.workSec||0);
    const orderKey=t.orderId||t.taskId;by[k]._orders[orderKey]=(by[k]._orders[orderKey]||0)+Number(t.workSec||0);
  });
  Object.keys(by).forEach(function(k){
    by[k].completedOrders=Object.keys(by[k]._orders).length;
    by[k].averageWorkSec=by[k].completedOrders?Math.round(by[k].totalWorkSec/by[k].completedOrders):0;
    delete by[k]._orders;
  });
  const batches=wqRowsV1_(wqPressBatchSheetV1_(false),TRENDOS_WORK_QUEUE_PRESS_HEADERS_V1).filter(function(x){return wqTxtV1_(x.values[8])==='COMPLETED';});
  const press={batches:batches.length,orders:0,totalSec:0,averageBatchSec:0};
  batches.forEach(function(x){press.orders+=Number(x.values[5]||0);press.totalSec+=Number(x.values[4]||0);});
  press.averageBatchSec=press.batches?Math.round(press.totalSec/press.batches):0;
  return {success:true,employees:Object.keys(by).map(function(k){return by[k];}),press:press};
}
function wqStatusV1_(auth){
  const enabled=wqEnabledV1_(),role=auth.workQueueRole;
  if(!enabled)return {success:true,enabled:false,version:TRENDOS_WORK_QUEUE_V1_VERSION,role:role};
  const employee=wqUserNameV1_(auth),active=wqActiveTaskForEmployeeV1_(employee);
  const result={success:true,enabled:true,version:TRENDOS_WORK_QUEUE_V1_VERSION,role:role,task:wqTaskViewV1_(active)};
  if(role==='WAEL'){
    result.flyPrint=wqFlyCandidatesV1_().map(wqPublicLineV1_);
    result.pressBatch=wqPressBatchObjV1_(wqPressOpenBatchV1_());
    result.pressCandidateCount=wqPressCandidatesV1_().length;
  }
  return result;
}
function workQueueV1_(e){
  const p=(e&&e.parameter)||{},auth=wqAuthV1_(p);if(!auth||!auth.ok)return {success:false,message:auth&&auth.message||'غير مصرح.'};
  auth.__requestToken=wqTxtV1_(p.token);
  const op=wqTxtV1_(p.op||'status');
  try{
    if(op==='status')return wqStatusV1_(auth);
    if(op==='claimNext')return wqClaimNextV1_(auth);
    if(op==='claimFly')return wqClaimFlyV1_(p,auth);
    if(op==='startTask')return wqStartTaskV1_(p,auth);
    if(op==='pauseTask')return wqPauseTaskV1_(p,auth);
    if(op==='resumeTask')return wqResumeTaskV1_(p,auth);
    if(op==='completeTask')return wqCompleteTaskV1_(p,auth);
    if(op==='pressCandidates'){wqRequireEnabledV1_();if(auth.workQueueRole!=='WAEL')return {success:false,message:'قائمة المكبس متاحة لوائل فقط.'};return {success:true,items:wqPressCandidatesV1_().map(wqPublicLineV1_),batch:wqPressBatchObjV1_(wqPressOpenBatchV1_())};}
    if(op==='pressStart')return wqPressStartV1_(p,auth);
    if(op==='pressStop')return wqPressStopV1_(p,auth);
    if(op==='managerRelease')return wqManagerReleaseV1_(p,auth);
    if(op==='metrics')return wqMetricsV1_(auth);
    return {success:false,message:'عملية Work Queue غير معروفة.'};
  }catch(err){return {success:false,message:wqTxtV1_(err&&err.message||err)};}
}
