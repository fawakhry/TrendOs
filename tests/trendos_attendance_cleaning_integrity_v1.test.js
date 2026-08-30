const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('trendos-attendance-cleaning-integrity-v1.gs','utf8');

class Range{
  constructor(sh,r,c,nr=1,nc=1){Object.assign(this,{sh,r,c,nr,nc});}
  getValues(){const out=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++)row.push(this.sh.getCell(this.r+i,this.c+j));out.push(row);}return out;}
  setValue(v){this.sh.setCell(this.r,this.c,v);return this;}
  setValues(vals){for(let i=0;i<this.nr;i++)for(let j=0;j<this.nc;j++)this.sh.setCell(this.r+i,this.c+j,vals[i][j]);return this;}
}
class Sheet{
  constructor(headers){this.rows=[headers.slice()];}
  getLastRow(){return this.rows.length;}
  getLastColumn(){return Math.max(...this.rows.map(r=>r.length));}
  getMaxColumns(){return this.getLastColumn();}
  insertColumnsAfter(after,count){while(this.rows[0].length<after+count)this.rows[0].push('');}
  getRange(r,c,nr=1,nc=1){return new Range(this,r,c,nr,nc);}
  appendRow(row){this.rows.push(row.slice());}
  getCell(r,c){return (this.rows[r-1]&&this.rows[r-1][c-1]!==undefined)?this.rows[r-1][c-1]:'';}
  setCell(r,c,v){while(this.rows.length<r)this.rows.push([]);while(this.rows[r-1].length<c)this.rows[r-1].push('');this.rows[r-1][c-1]=v;}
  setFrozenRows(){}
}
class Spreadsheet{constructor(){this.s={};}getSheetByName(n){return this.s[n]||null;}insertSheet(n){return this.s[n]=new Sheet([]);}}

const attendanceHeaders=['معرف الجلسة','التاريخ','الموظف','القسم','بداية اليوم','نهاية اليوم','إجمالي وقت التواجد','وقت العمل الفعلي','وقت التوقف','راحة اليوم المستخدمة','حالة اليوم','آخر نبضة حضور','أوردرات مكتملة','بنود مكتملة','ملاحظات','مراجعة المدير','موعد الحضور','تسجيل الحضور','فرق الدقائق','حالة الحضور'];
const cleaningHeaders=['ID','التاريخ','الموظف','القسم','وقت بدء التنظيف','تنظيف الماكينة','تنظيف سطح العمل','إزالة مخلفات أمس','فحص بصري سريع','ترتيب الخامات والأدوات','نظافة المكان العام','مشكلة مكتشفة','وقت الإكمال','الحالة'];
const ss=new Spreadsheet();ss.s['سجل الدوام']=new Sheet(attendanceHeaders);ss.s['تشغيل - النظافة اليومية']=new Sheet(cleaningHeaders);
let businessDay=true,pulses=[],uuidNo=0;
const context={console,Date,JSON,Object,Array,String,Number,Math,RegExp,isFinite,isNaN,
  Utilities:{getUuid(){uuidNo++;return 'abcd1234-'+String(uuidNo).padStart(4,'0')+'-0000-0000-000000000000';},formatDate(d,tz,fmt){assert.strictEqual(tz,'Africa/Cairo');if(fmt==='HH:mm')return '12:30';if(fmt==="yyyy-MM-dd'T'HH:mm:ssXXX")return '2026-08-30T12:30:00+03:00';if(fmt==='yyyy-MM-dd')return '2026-08-30';throw new Error('fmt '+fmt);}},
  SpreadsheetApp:{flush(){}},ss_:()=>ss,
  authorize_:()=>({ok:true,user:{username:'وائل',name:'وائل',department:'طباعة'}}),
  trendosBusinessDate_:(v)=>{if(typeof v==='string'){const m=v.replace(/\//g,'-').match(/^(\d{4}-\d{2}-\d{2})/);if(m)return m[1];}return '2026-08-30';},
  trendosBusinessSchedule_:(d)=>({date:d,businessDay,start:'12:00',end:'21:00',source:businessDay?'DEFAULT_WORKDAY':'DEFAULT_FRIDAY_CLOSED'}),
  trendosWithLock_:(scope,fn)=>{assert.strictEqual(scope,'script');return fn();},
  headersMap_:(sh)=>{const o={};sh.rows[0].forEach((v,i)=>{if(v)o[v]=i+1;});return o;},
  firstCol_:(h,names,fallback)=>{for(const n of names)if(h[n])return h[n];return fallback||0;},
  safeSet_:(sh,r,c,v)=>{if(c)sh.setCell(r,c,v);},
  appendByHeaders_:(sh,vals)=>{const h=context.headersMap_(sh),row=new Array(sh.getLastColumn()).fill('');for(const [k,v] of Object.entries(vals))if(h[k])row[h[k]-1]=v;sh.appendRow(row);},
  ensureHeaderIfAnyMissing_:(sh,headers)=>{const existing=new Set(sh.rows[0]);for(const h of headers)if(!existing.has(h)){sh.rows[0].push(h);for(let i=1;i<sh.rows.length;i++)sh.rows[i].push('');}},
  attendanceSettingsV1_:()=>({requireStart:true,dailyRestMinutes:30}),
  attClockSettings_:()=>({ATTENDANCE_LATE_GRACE_MINUTES:5}),
  attendanceAppendPulseV1_:(session,auth,type,opts)=>{pulses.push({sessionId:session.sessionId,type,time:new Date('2026-08-30T09:30:00Z'),opts});},
  attendanceEventsV1_:(sessionId)=>pulses.filter(x=>x.sessionId===sessionId).map(x=>({type:x.type,time:x.time,state:''})),
  attendanceComputeV1_:(sessionId)=>{const e=pulses.filter(x=>x.sessionId===sessionId);let status='not_started';for(const x of e){if(x.type==='start_day'||x.type==='resume'||x.type==='presence_confirmed')status='working';else if(x.type==='pause')status='paused';else if(x.type==='rest_start')status='rest';else if(x.type==='prayer_break_start')status='prayer';else if(x.type==='missed_check')status='review';else if(x.type==='end_day')status='ended';}return{status,restMinutes:0,workMinutes:0,pauseMinutes:0,totalMinutes:0,needsReview:status==='review'};},
  attendanceUpdateSessionV1_:(session)=>Object.assign({sessionId:session.sessionId},context.attendanceComputeV1_(session.sessionId))
};
vm.createContext(context);vm.runInContext(source,context,{filename:'trendos-attendance-cleaning-integrity-v1.gs'});

assert.deepStrictEqual(JSON.parse(JSON.stringify(context.trendosAttendanceClockinStatusV1_('12:30','12:00',5))),{differenceMinutes:30,attendanceStatus:'متأخر 30 دقيقة'});
assert.strictEqual(context.trendosAttendanceEventDecisionV1_('resume',{status:'working'}).alreadyApplied,true);
assert.strictEqual(context.trendosAttendanceEventDecisionV1_('end',{status:'ended'}).alreadyApplied,true);
const chk=context.trendosCleaningChecklistV1_({machine:true,surface:false,waste:true,visual:true,tools:true,place:true});
assert.strictEqual(chk.ok,true);assert.strictEqual(chk.values.surface,false);assert.strictEqual(context.trendosCleaningChecklistV1_({machine:true}).ok,false);

let out=context.trendosAttendanceV1_({parameter:{op:'start',username:'وائل',token:'t'}});
assert.strictEqual(out.success,true);assert.strictEqual(ss.s['سجل الدوام'].getLastRow(),2);assert.strictEqual(pulses.filter(x=>x.type==='start_day').length,1);
const row1=ss.s['سجل الدوام'].rows[1];assert.ok(row1[17] instanceof Date);assert.strictEqual(row1[16],'12:00');
out=context.trendosAttendanceV1_({parameter:{op:'start',username:'وائل',token:'t'}});
assert.strictEqual(ss.s['سجل الدوام'].getLastRow(),2);assert.strictEqual(pulses.filter(x=>x.type==='start_day').length,1);assert.strictEqual(out.clockin.alreadyRecorded,true);

context.trendosAttendanceV1_({parameter:{op:'pause',username:'وائل',token:'t'}});
context.trendosAttendanceV1_({parameter:{op:'resume',username:'وائل',token:'t'}});
const before=pulses.filter(x=>x.type==='resume').length;
out=context.trendosAttendanceV1_({parameter:{op:'resume',username:'وائل',token:'t'}});
assert.strictEqual(out.alreadyApplied,true);assert.strictEqual(pulses.filter(x=>x.type==='resume').length,before);

const dup=new Array(attendanceHeaders.length).fill('');dup[0]='AT-DUP';dup[1]='2026-08-30';dup[2]='وائل';dup[3]='طباعة';dup[10]='يعمل';ss.s['سجل الدوام'].appendRow(dup);
const rows=context.trendosAttendanceSessionRowsV1_('وائل','2026-08-30'),canonical=context.trendosAttendanceCanonicalSessionV1_(rows);
assert.notStrictEqual(canonical.sessionId,'AT-DUP');assert.strictEqual(canonical.duplicateSessionsDetected,1);
out=context.trendosAttendanceClockinV1_({parameter:{username:'وائل',token:'t'}});assert.strictEqual(out.alreadyRecorded,true);assert.strictEqual(out.duplicateSessionsDetected,1);assert.strictEqual(ss.s['سجل الدوام'].getLastRow(),3);

businessDay=false;const attRowsBefore=ss.s['سجل الدوام'].getLastRow();
out=context.trendosAttendanceV1_({parameter:{op:'start',username:'وائل',token:'t'}});assert.strictEqual(out.closedDay,true);assert.strictEqual(ss.s['سجل الدوام'].getLastRow(),attRowsBefore);
let cleanOut=context.trendosCleaningV1_({parameter:{op:'complete',username:'وائل',token:'t',payload:JSON.stringify({machine:true,surface:true,waste:true,visual:true,tools:true,place:true})}});assert.strictEqual(cleanOut.closedDay,true);assert.strictEqual(ss.s['تشغيل - النظافة اليومية'].getLastRow(),1);

businessDay=true;cleanOut=context.trendosCleaningV1_({parameter:{op:'complete',username:'وائل',token:'t',payload:JSON.stringify({machine:true})}});assert.strictEqual(cleanOut.checklistRequired,true);assert.strictEqual(ss.s['تشغيل - النظافة اليومية'].getLastRow(),1);
cleanOut=context.trendosCleaningV1_({parameter:{op:'complete',username:'وائل',token:'t',payload:JSON.stringify({machine:true,surface:false,waste:true,visual:true,tools:true,place:true,startedAt:'12:05',issue:'ملاحظة اختبار'})}});assert.strictEqual(cleanOut.success,true);assert.strictEqual(ss.s['تشغيل - النظافة اليومية'].getLastRow(),2);
const cr=ss.s['تشغيل - النظافة اليومية'].rows[1],ch=context.headersMap_(ss.s['تشغيل - النظافة اليومية']);
assert.strictEqual(cr[ch['تنظيف الماكينة']-1],'نعم');assert.strictEqual(cr[ch['تنظيف سطح العمل']-1],'لا');assert.strictEqual(cr[ch['مشكلة مكتشفة']-1],'ملاحظة اختبار');assert.strictEqual(cr[ch['وقت بدء التنظيف']-1],'12:05');
cleanOut=context.trendosCleaningV1_({parameter:{op:'complete',username:'وائل',token:'t',payload:JSON.stringify({machine:true,surface:true,waste:true,visual:true,tools:true,place:true})}});assert.strictEqual(cleanOut.alreadyDone,true);assert.strictEqual(ss.s['تشغيل - النظافة اليومية'].getLastRow(),2);
const cr2=cr.slice();cr2[0]='CLN-DUP';ss.s['تشغيل - النظافة اليومية'].appendRow(cr2);
cleanOut=context.trendosCleaningV1_({parameter:{op:'status',username:'وائل',token:'t'}});assert.strictEqual(cleanOut.completed,true);assert.strictEqual(cleanOut.duplicateRowsDetected,1);

assert.ok(source.includes("trendosWithLock_('script'"));assert.ok(source.includes('trendosBusinessSchedule_'));assert.ok(source.includes('checklistRequired:true'));
assert.ok(!source.includes("'تنظيف الماكينة':'نعم','سطح العمل':'نعم'"));assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(source));
console.log('TrendOS attendance + cleaning integrity V1 tests: OK');
