/**
 * TrendOS Attendance + Cleaning Integrity V1
 * GitHub checkpoint only. Requires trendos-integrity-v1.gs and existing Attendance helpers.
 * DO NOT deploy blindly.
 */
const TRENDOS_ATT_CLEAN_INTEGRITY_VERSION_V1 = 'TRENDOS_ATT_CLEAN_INTEGRITY_V1_20260830';
const TRENDOS_ATTENDANCE_SHEET_V1 = 'سجل الدوام';
const TRENDOS_CLEANING_SHEET_V1 = 'تشغيل - النظافة اليومية';

function trendosAttCleanTextV1_(v){ return String(v == null ? '' : v).trim(); }
function trendosAttCleanBoolV1_(v){
  if (typeof v === 'boolean') return v;
  const s = trendosAttCleanTextV1_(v).toLowerCase();
  if (['نعم','yes','true','1','on','تم','done','ok'].indexOf(s) !== -1) return true;
  if (['لا','no','false','0','off'].indexOf(s) !== -1) return false;
  return null;
}
function trendosAttCleanDateV1_(v){
  if (typeof trendosBusinessDate_ === 'function') {
    const d = trendosBusinessDate_(v);
    if (d) return d;
  }
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v, 'Africa/Cairo', 'yyyy-MM-dd');
  const s = trendosAttCleanTextV1_(v).replace(/\//g,'-');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[1]+'-'+m[2]+'-'+m[3] : '';
}
function trendosAttCleanHeadersV1_(sheet){
  if (typeof headersMap_ === 'function') return headersMap_(sheet);
  const out={};
  if (!sheet || sheet.getLastColumn()<1) return out;
  sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].forEach(function(v,i){ const k=trendosAttCleanTextV1_(v); if(k) out[k]=i+1; });
  return out;
}
function trendosAttCleanFirstColV1_(h,names,fallback){
  if (typeof firstCol_ === 'function') return firstCol_(h,names,fallback||0);
  for (let i=0;i<names.length;i++) if (h[names[i]]) return h[names[i]];
  return fallback||0;
}
function trendosAttCleanValueV1_(row,col){ return col ? row[col-1] : ''; }
function trendosAttCleanSafeSetV1_(sheet,row,col,value){
  if (!col) return;
  if (typeof safeSet_ === 'function') return safeSet_(sheet,row,col,value);
  sheet.getRange(row,col).setValue(value);
}
function trendosAttCleanAppendByHeadersV1_(sheet,values){
  if (typeof appendByHeaders_ === 'function') return appendByHeaders_(sheet,values);
  const h=trendosAttCleanHeadersV1_(sheet), row=new Array(sheet.getLastColumn()).fill('');
  Object.keys(values||{}).forEach(function(k){ if(h[k]) row[h[k]-1]=values[k]; });
  sheet.appendRow(row);
}

function trendosAttendanceColumnsV1_(sheet){
  const h=trendosAttCleanHeadersV1_(sheet);
  return {
    h:h,
    sessionId:trendosAttCleanFirstColV1_(h,['معرف الجلسة'],1),
    date:trendosAttCleanFirstColV1_(h,['التاريخ'],2),
    employee:trendosAttCleanFirstColV1_(h,['الموظف'],3),
    department:trendosAttCleanFirstColV1_(h,['القسم'],4),
    start:trendosAttCleanFirstColV1_(h,['بداية اليوم'],5),
    end:trendosAttCleanFirstColV1_(h,['نهاية اليوم'],6),
    dayStatus:trendosAttCleanFirstColV1_(h,['حالة اليوم'],11),
    lastPulse:trendosAttCleanFirstColV1_(h,['آخر نبضة حضور'],12),
    scheduled:trendosAttCleanFirstColV1_(h,['موعد الحضور'],17),
    clockin:trendosAttCleanFirstColV1_(h,['تسجيل الحضور'],18),
    difference:trendosAttCleanFirstColV1_(h,['فرق الدقائق'],19),
    attendanceStatus:trendosAttCleanFirstColV1_(h,['حالة الحضور'],20)
  };
}
function trendosAttendanceSheetV1_(){
  const sh=ss_().getSheetByName(TRENDOS_ATTENDANCE_SHEET_V1);
  if (!sh) throw new Error('شيت سجل الدوام غير موجود.');
  if (typeof ensureHeaderIfAnyMissing_ === 'function') ensureHeaderIfAnyMissing_(sh,['موعد الحضور','تسجيل الحضور','فرق الدقائق','حالة الحضور']);
  return sh;
}
function trendosAttendanceSessionRowsV1_(employee,dateKey){
  const sh=trendosAttendanceSheetV1_(), c=trendosAttendanceColumnsV1_(sh), out=[];
  if (sh.getLastRow()<2) return out;
  const data=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  data.forEach(function(row,i){
    if (trendosAttCleanTextV1_(trendosAttCleanValueV1_(row,c.employee)) !== employee) return;
    if (trendosAttCleanDateV1_(trendosAttCleanValueV1_(row,c.date)) !== dateKey) return;
    out.push({
      rowNumber:i+2,
      sessionId:trendosAttCleanTextV1_(trendosAttCleanValueV1_(row,c.sessionId)),
      status:trendosAttCleanTextV1_(trendosAttCleanValueV1_(row,c.dayStatus)),
      clockInAt:trendosAttCleanValueV1_(row,c.clockin),
      row:row,
      sheet:sh,
      columns:c
    });
  });
  return out;
}
function trendosAttendanceCanonicalSessionV1_(rows){
  rows=(rows||[]).slice();
  if(!rows.length) return null;
  rows.sort(function(a,b){
    function score(x){
      const ended=trendosAttCleanTextV1_(x.status)==='انتهى اليوم';
      const clocked=!!x.clockInAt;
      return (clocked?4:0)+(ended?0:2);
    }
    const d=score(b)-score(a);
    return d || a.rowNumber-b.rowNumber;
  });
  const x=rows[0];
  x.duplicateSessionsDetected=Math.max(0,rows.length-1);
  x.allRows=rows;
  return x;
}
function trendosAttendanceScheduleV1_(dateKey){
  if (typeof trendosBusinessSchedule_ === 'function') return trendosBusinessSchedule_(dateKey);
  return {date:dateKey,businessDay:true,start:(typeof attClockSchedule_==='function'?attClockSchedule_():'12:00'),end:'21:00',source:'LEGACY'};
}
function trendosAttendanceCreateSessionUnlockedV1_(auth,dateKey){
  const sh=trendosAttendanceSheetV1_(), now=new Date();
  const username=trendosAttCleanTextV1_(auth.user.username||auth.user.name), department=trendosAttCleanTextV1_(auth.user.department);
  const sessionId='AT-'+dateKey.replace(/-/g,'')+'-'+username+'-'+Utilities.getUuid().slice(0,8);
  trendosAttCleanAppendByHeadersV1_(sh,{
    'معرف الجلسة':sessionId,'التاريخ':dateKey,'الموظف':username,'القسم':department,'بداية اليوم':now,'نهاية اليوم':'',
    'إجمالي وقت التواجد':'00:00','وقت العمل الفعلي':'00:00','وقت التوقف':'00:00','راحة اليوم المستخدمة':'0 دقيقة',
    'حالة اليوم':'يعمل','آخر نبضة حضور':now,'أوردرات مكتملة':0,'بنود مكتملة':0,'ملاحظات':'','مراجعة المدير':''
  });
  const rows=trendosAttendanceSessionRowsV1_(username,dateKey), session=trendosAttendanceCanonicalSessionV1_(rows);
  if (!session || session.sessionId!==sessionId) throw new Error('تعذر تثبيت جلسة دوام واحدة بعد الإنشاء.');
  if (typeof attendanceAppendPulseV1_ === 'function') attendanceAppendPulseV1_(session,auth,'start_day',{source:'TrendOS Integrity V1'});
  return session;
}
function trendosAttendanceEnsureSessionUnlockedV1_(auth,dateKey){
  const username=trendosAttCleanTextV1_(auth.user.username||auth.user.name), schedule=trendosAttendanceScheduleV1_(dateKey);
  if (!schedule.businessDay) return {success:true,closedDay:true,schedule:schedule,session:null};
  const rows=trendosAttendanceSessionRowsV1_(username,dateKey);
  const session=trendosAttendanceCanonicalSessionV1_(rows)||trendosAttendanceCreateSessionUnlockedV1_(auth,dateKey);
  return {success:true,closedDay:false,schedule:schedule,session:session,duplicateSessionsDetected:session.duplicateSessionsDetected||0};
}
function trendosAttendanceMinutesV1_(hhmm){ const m=String(hhmm||'').match(/^(\d{1,2}):(\d{2})/); return m?Number(m[1])*60+Number(m[2]):0; }
function trendosAttendanceClockinStatusV1_(actual,scheduled,grace){
  const diff=trendosAttendanceMinutesV1_(actual)-trendosAttendanceMinutesV1_(scheduled), g=Math.max(0,Number(grace||0)||0);
  let status='في الموعد';
  if(diff>g) status='متأخر '+diff+' دقيقة'; else if(diff<0) status='مبكر '+Math.abs(diff)+' دقيقة';
  return {differenceMinutes:diff,attendanceStatus:status};
}
function trendosAttendanceClockinUnlockedV1_(auth,dateKey){
  const ensured=trendosAttendanceEnsureSessionUnlockedV1_(auth,dateKey);
  if (ensured.closedDay) return {success:true,closedDay:true,noClockinRequired:true,schedule:ensured.schedule,message:'اليوم عطلة تشغيلية حسب تقويم TrendOS.'};
  const session=ensured.session, sh=session.sheet, c=trendosAttendanceColumnsV1_(sh), row=sh.getRange(session.rowNumber,1,1,sh.getLastColumn()).getValues()[0];
  const existing=trendosAttCleanValueV1_(row,c.clockin), scheduled=trendosAttCleanTextV1_(trendosAttCleanValueV1_(row,c.scheduled))||ensured.schedule.start||'12:00';
  if(existing){
    return {success:true,alreadyRecorded:true,sessionId:session.sessionId,scheduledStart:scheduled,clockInAt:existing,differenceMinutes:Number(trendosAttCleanValueV1_(row,c.difference)||0),attendanceStatus:trendosAttCleanTextV1_(trendosAttCleanValueV1_(row,c.attendanceStatus)),duplicateSessionsDetected:ensured.duplicateSessionsDetected||0};
  }
  const now=new Date(), actual=Utilities.formatDate(now,'Africa/Cairo','HH:mm');
  let grace=0;
  try{ if(typeof attClockSettings_==='function') grace=Math.max(0,Number(attClockSettings_().ATTENDANCE_LATE_GRACE_MINUTES||0)); }catch(e){}
  const calc=trendosAttendanceClockinStatusV1_(actual,scheduled,grace);
  trendosAttCleanSafeSetV1_(sh,session.rowNumber,c.scheduled,scheduled);
  trendosAttCleanSafeSetV1_(sh,session.rowNumber,c.clockin,now);
  trendosAttCleanSafeSetV1_(sh,session.rowNumber,c.difference,calc.differenceMinutes);
  trendosAttCleanSafeSetV1_(sh,session.rowNumber,c.attendanceStatus,calc.attendanceStatus);
  if (typeof SpreadsheetApp!=='undefined' && SpreadsheetApp.flush) SpreadsheetApp.flush();
  return {success:true,sessionId:session.sessionId,scheduledStart:scheduled,clockInAt:Utilities.formatDate(now,'Africa/Cairo',"yyyy-MM-dd'T'HH:mm:ssXXX"),clockInTime:actual,differenceMinutes:calc.differenceMinutes,attendanceStatus:calc.attendanceStatus,duplicateSessionsDetected:ensured.duplicateSessionsDetected||0};
}
function trendosAttendanceClockinV1_(e){
  e=e||{parameter:{}}; const p=e.parameter||{}, auth=authorize_(p.username,p.token); if(!auth.ok)return{success:false,message:auth.message};
  const dateKey=trendosBusinessDate_(new Date());
  return trendosWithLock_('script',function(){ return trendosAttendanceClockinUnlockedV1_(auth,dateKey); },30000);
}
function trendosAttendanceSessionClockedInV1_(session){
  if(!session) return false;
  const sh=session.sheet, c=trendosAttendanceColumnsV1_(sh), row=sh.getRange(session.rowNumber,1,1,sh.getLastColumn()).getValues()[0];
  return !!trendosAttCleanValueV1_(row,c.clockin);
}
function trendosAttendanceRecentEventV1_(sessionId,type,withinSeconds){
  if(typeof attendanceEventsV1_!=='function') return false;
  const ev=attendanceEventsV1_(sessionId), now=new Date().getTime(), maxMs=Math.max(0,Number(withinSeconds||0))*1000;
  for(let i=ev.length-1;i>=0;i--){
    if(ev[i].type!==type) continue;
    const t=ev[i].time instanceof Date?ev[i].time.getTime():new Date(ev[i].time).getTime();
    return isFinite(t)&&now-t>=0&&now-t<=maxMs;
  }
  return false;
}
function trendosAttendanceCurrentSummaryV1_(session){
  return typeof attendanceComputeV1_==='function'?attendanceComputeV1_(session.sessionId):{status:'not_started',restMinutes:0,needsReview:false};
}
function trendosAttendanceEventDecisionV1_(op,summary){
  const s=trendosAttCleanTextV1_(summary&&summary.status);
  if(s==='ended') return {apply:false,alreadyApplied:op==='end',message:op==='end'?'تم إنهاء اليوم بالفعل.':'اليوم منتهي ولا يمكن إضافة حدث تشغيل جديد.'};
  if(op==='pause'&&s==='paused') return {apply:false,alreadyApplied:true,message:'Pause مسجل بالفعل.'};
  if(op==='resume'&&s==='working') return {apply:false,alreadyApplied:true,message:'الموظف في حالة عمل بالفعل.'};
  if(op==='restStart'&&s==='rest') return {apply:false,alreadyApplied:true,message:'Rest مسجل بالفعل.'};
  if(op==='prayerStart'&&s==='prayer') return {apply:false,alreadyApplied:true,message:'استراحة الصلاة مسجلة بالفعل.'};
  if(op==='missedCheck'&&s==='review') return {apply:false,alreadyApplied:true,message:'حالة المراجعة مسجلة بالفعل.'};
  return {apply:true};
}
function trendosAttendanceStateUnlockedV1_(auth,dateKey){
  const cfg=typeof attendanceSettingsV1_==='function'?attendanceSettingsV1_():{requireStart:true}, rows=trendosAttendanceSessionRowsV1_(trendosAttCleanTextV1_(auth.user.username||auth.user.name),dateKey), session=trendosAttendanceCanonicalSessionV1_(rows);
  if(!session) return {success:true,state:{status:'not_started',workMinutes:0,pauseMinutes:0,restMinutes:0,totalMinutes:0,ordersCompleted:0,linesCompleted:0},config:cfg,duplicateSessionsDetected:0};
  const state=typeof attendanceUpdateSessionV1_==='function'?(attendanceUpdateSessionV1_(session,auth)||{status:'not_started'}):trendosAttendanceCurrentSummaryV1_(session);
  return {success:true,state:state,config:cfg,sessionId:session.sessionId,duplicateSessionsDetected:session.duplicateSessionsDetected||0,clockedIn:trendosAttendanceSessionClockedInV1_(session)};
}
function trendosAttendanceV1_(e){
  e=e||{parameter:{}}; const p=e.parameter||{}, auth=authorize_(p.username,p.token); if(!auth.ok)return{success:false,message:auth.message};
  const op=trendosAttCleanTextV1_(p.op||'state'), dateKey=trendosBusinessDate_(new Date());
  if(op==='config') return {success:true,config:(typeof attendanceSettingsV1_==='function'?attendanceSettingsV1_():{}),schedule:trendosAttendanceScheduleV1_(dateKey)};
  return trendosWithLock_('script',function(){
    const schedule=trendosAttendanceScheduleV1_(dateKey);
    if(!schedule.businessDay) return {success:true,closedDay:true,noAttendanceRequired:true,schedule:schedule,state:{status:'closed_day'},config:(typeof attendanceSettingsV1_==='function'?attendanceSettingsV1_():{})};
    if(op==='state') return trendosAttendanceStateUnlockedV1_(auth,dateKey);
    if(op==='start'){
      const clock=trendosAttendanceClockinUnlockedV1_(auth,dateKey);
      const state=trendosAttendanceStateUnlockedV1_(auth,dateKey); state.clockin=clock; return state;
    }
    const rows=trendosAttendanceSessionRowsV1_(trendosAttCleanTextV1_(auth.user.username||auth.user.name),dateKey), session=trendosAttendanceCanonicalSessionV1_(rows);
    if(!session) return {success:false,clockInRequired:true,message:'سجل الحضور وابدأ اليوم أولاً.'};
    const cfg=typeof attendanceSettingsV1_==='function'?attendanceSettingsV1_():{requireStart:true};
    if(cfg.requireStart!==false&&!trendosAttendanceSessionClockedInV1_(session)) return {success:false,clockInRequired:true,message:'يجب تسجيل الحضور قبل أحداث التشغيل.'};
    const summary=trendosAttendanceCurrentSummaryV1_(session), decision=trendosAttendanceEventDecisionV1_(op,summary);
    if(!decision.apply){ const state=trendosAttendanceStateUnlockedV1_(auth,dateKey); state.alreadyApplied=!!decision.alreadyApplied; state.message=decision.message; return state; }
    if(op==='restStart'&&Number(summary.restMinutes||0)>=Number(cfg.dailyRestMinutes||30)) return {success:false,message:'تم استخدام Rest اليومي بالكامل.'};
    const map={pause:'pause',resume:'resume',restStart:'rest_start',prayerStart:'prayer_break_start',confirm:'presence_confirmed',heartbeat:'heartbeat',missedCheck:'missed_check',end:'end_day'}, type=map[op];
    if(!type) return {success:false,message:'أمر دوام غير معروف.'};
    if(type!=='heartbeat'&&trendosAttendanceRecentEventV1_(session.sessionId,type,60)){ const state=trendosAttendanceStateUnlockedV1_(auth,dateKey); state.alreadyApplied=true; state.message='تم تجاهل تكرار نفس حدث الحضور خلال دقيقة.'; return state; }
    attendanceAppendPulseV1_(session,auth,type,{source:trendosAttCleanTextV1_(p.source)||'TrendOS Integrity V1',note:trendosAttCleanTextV1_(p.note),responseSeconds:Number(p.responseSeconds||0),review:op==='missedCheck',reviewReason:op==='missedCheck'?'لم يتم تأكيد التواجد خلال المهلة':'',auto:op==='heartbeat'||op==='missedCheck'});
    return trendosAttendanceStateUnlockedV1_(auth,dateKey);
  },30000);
}

function trendosCleaningRowsV1_(sheet,dateKey,employee){
  const h=trendosAttCleanHeadersV1_(sheet), cDate=trendosAttCleanFirstColV1_(h,['التاريخ'],2), cEmployee=trendosAttCleanFirstColV1_(h,['الموظف'],3), out=[];
  if(sheet.getLastRow()<2)return out;
  const data=sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();
  data.forEach(function(row,i){ if(trendosAttCleanDateV1_(trendosAttCleanValueV1_(row,cDate))===dateKey&&trendosAttCleanTextV1_(trendosAttCleanValueV1_(row,cEmployee))===employee) out.push({rowNumber:i+2,row:row}); });
  return out;
}
function trendosCleaningPayloadV1_(p){ let data={}; try{data=JSON.parse(trendosAttCleanTextV1_(p.payload)||'{}')||{};}catch(e){return{ok:false,message:'بيانات النظافة غير صحيحة.'};} return{ok:true,data:data}; }
function trendosCleaningChecklistV1_(data){
  const defs=[
    {key:'machine',aliases:['machine','cleanMachine','machineClean','تنظيف الماكينة']},
    {key:'surface',aliases:['surface','workSurface','surfaceClean','تنظيف سطح العمل','سطح العمل']},
    {key:'waste',aliases:['waste','yesterdayWaste','removeWaste','إزالة مخلفات أمس','مخلفات أمس']},
    {key:'visual',aliases:['visual','visualCheck','quickVisual','فحص بصري سريع','فحص بصري']},
    {key:'tools',aliases:['tools','materialsTools','arrangeTools','ترتيب الخامات والأدوات']},
    {key:'place',aliases:['place','generalPlace','placeClean','نظافة المكان العام','نظافة المكان']}
  ];
  const values={},missing=[];
  defs.forEach(function(d){ let found=null,seen=false; for(let i=0;i<d.aliases.length;i++){ if(Object.prototype.hasOwnProperty.call(data,d.aliases[i])){seen=true;found=trendosAttCleanBoolV1_(data[d.aliases[i]]);break;} } if(!seen||found===null)missing.push(d.key); else values[d.key]=found; });
  return {ok:missing.length===0,values:values,missing:missing};
}
function trendosCleaningSetExistingAliasesV1_(target,h,aliases,value){ aliases.forEach(function(name){ if(h[name])target[name]=value; }); }
function trendosCleaningV1_(e){
  const p=(e&&e.parameter)||{}, auth=authorize_(p.username,p.token); if(!auth.ok)return{success:false,message:auth.message};
  const op=trendosAttCleanTextV1_(p.op||'status'), employee=trendosAttCleanTextV1_(auth.user.name||auth.user.username), dateKey=trendosAttCleanDateV1_(p.date)||trendosBusinessDate_(new Date());
  const sh=ss_().getSheetByName(TRENDOS_CLEANING_SHEET_V1); if(!sh)return{success:false,message:'شيت النظافة غير موجود.'};
  if(op==='status'){
    const rows=trendosCleaningRowsV1_(sh,dateKey,employee), schedule=trendosAttendanceScheduleV1_(dateKey);
    return {success:true,completed:rows.length>0,row:rows.length?rows[0].rowNumber:0,duplicateRowsDetected:Math.max(0,rows.length-1),closedDay:!schedule.businessDay,noCleaningRequired:!schedule.businessDay,schedule:schedule};
  }
  if(op!=='complete')return{success:false,message:'عملية نظافة غير معروفة.'};
  const parsed=trendosCleaningPayloadV1_(p); if(!parsed.ok)return{success:false,message:parsed.message};
  return trendosWithLock_('script',function(){
    const schedule=trendosAttendanceScheduleV1_(dateKey);
    if(!schedule.businessDay)return{success:true,closedDay:true,noCleaningRequired:true,schedule:schedule,message:'لا يوجد التزام نظافة في يوم العطلة إلا عند وجود جدول خاص.'};
    const existing=trendosCleaningRowsV1_(sh,dateKey,employee);
    if(existing.length)return{success:true,alreadyDone:true,duplicatePrevented:true,row:existing[0].rowNumber,duplicateRowsDetected:Math.max(0,existing.length-1),message:'التنظيف مسجل بالفعل.'};
    const checklist=trendosCleaningChecklistV1_(parsed.data);
    if(!checklist.ok)return{success:false,checklistRequired:true,missingChecklist:checklist.missing,message:'يجب إرسال حالة كل بنود قائمة النظافة بدل افتراض أنها تمت.'};
    const h=trendosAttCleanHeadersV1_(sh), now=new Date(), values={
      'ID':'CLN-'+Utilities.getUuid().slice(0,8).toUpperCase(),'التاريخ':dateKey,'الموظف':employee,'القسم':trendosAttCleanTextV1_(auth.user.department||parsed.data.department),'الحالة':'مكتمل'
    };
    const startedAt=parsed.data.startedAt||parsed.data['وقت بدء التنظيف']||'';
    trendosCleaningSetExistingAliasesV1_(values,h,['وقت بدء التنظيف'],startedAt);
    trendosCleaningSetExistingAliasesV1_(values,h,['وقت البدء المتوقع'],schedule.start||'');
    trendosCleaningSetExistingAliasesV1_(values,h,['وقت الإكمال'],now);
    trendosCleaningSetExistingAliasesV1_(values,h,['آخر تحديث'],now);
    trendosCleaningSetExistingAliasesV1_(values,h,['تنظيف الماكينة'],checklist.values.machine?'نعم':'لا');
    trendosCleaningSetExistingAliasesV1_(values,h,['تنظيف سطح العمل','سطح العمل'],checklist.values.surface?'نعم':'لا');
    trendosCleaningSetExistingAliasesV1_(values,h,['إزالة مخلفات أمس','مخلفات أمس'],checklist.values.waste?'نعم':'لا');
    trendosCleaningSetExistingAliasesV1_(values,h,['فحص بصري سريع','فحص بصري'],checklist.values.visual?'نعم':'لا');
    trendosCleaningSetExistingAliasesV1_(values,h,['ترتيب الخامات والأدوات'],checklist.values.tools?'نعم':'لا');
    trendosCleaningSetExistingAliasesV1_(values,h,['نظافة المكان العام','نظافة المكان'],checklist.values.place?'نعم':'لا');
    const issue=trendosAttCleanTextV1_(parsed.data.issue||parsed.data.problem||parsed.data['مشكلة مكتشفة']||parsed.data['تفاصيل المشكلة']);
    trendosCleaningSetExistingAliasesV1_(values,h,['مشكلة مكتشفة','تفاصيل المشكلة'],issue);
    trendosCleaningSetExistingAliasesV1_(values,h,['مشكلة ظهرت؟'],issue?'نعم':'لا');
    trendosAttCleanAppendByHeadersV1_(sh,values);
    if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();
    return{success:true,message:'تم تسجيل النظافة والتجهيز.',row:sh.getLastRow(),version:TRENDOS_ATT_CLEAN_INTEGRITY_VERSION_V1};
  },30000);
}
