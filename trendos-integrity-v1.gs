/** TrendOS Integrity Foundation V1 — GitHub checkpoint only; do not deploy blindly. */
const TRENDOS_INTEGRITY_VERSION_V1='TRENDOS_INTEGRITY_V1_20260830';
const TRENDOS_TZ_V1='Africa/Cairo';
const TRENDOS_SPECIAL_SCHEDULE_SHEET_V1='تشغيل - مواعيد خاصة';
const TRENDOS_ATTENDANCE_SETTINGS_SHEET_V1='إعدادات الدوام';
const TRENDOS_IDEMPOTENCY_SHEET_V1='إدارة - سجل التكامل';
const TRENDOS_AUTOMATION_RUN_SHEET_V1='إدارة - سجل تشغيل الأتمتة';
const TRENDOS_IDEMPOTENCY_HEADERS_V1=['مفتاح الحدث','نوع الحدث','الكيان','تاريخ العمل','الحالة','وقت الحجز','وقت الإكمال','النتيجة JSON','آخر خطأ','عدد المحاولات','بواسطة','آخر تحديث'];
const TRENDOS_AUTOMATION_RUN_HEADERS_V1=['Run ID','مفتاح التشغيل','الدالة','تاريخ العمل','وقت البداية','وقت النهاية','الحالة','صفوف مقروءة','صفوف مضافة','صفوف محدثة','تكرارات متجاهلة','عدد الأخطاء','Retry Count','التفاصيل JSON','آخر خطأ','آخر تحديث'];

function trendosTextV1_(v){return String(v==null?'':v).trim();}
function trendosAsciiDigitsV1_(v){const m={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};return trendosTextV1_(v).replace(/[٠-٩۰-۹]/g,c=>m[c]||c);}
function trendosIsDateObjectV1_(v){return Object.prototype.toString.call(v)==='[object Date]';}
function trendosNormalizeIdTokenV1_(v){
  if(v==null||v===''||trendosIsDateObjectV1_(v))return '';
  if(typeof v==='number')return isFinite(v)&&Math.floor(v)===v?String(v):'';
  let s=trendosAsciiDigitsV1_(v).replace(/[‐‑‒–—―]/g,'-').replace(/\u00a0/g,' ').trim();
  if(s[0]==="'")s=s.slice(1).trim();
  if(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s/i.test(s)||/^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}/.test(s))return '';
  if(/^\d+\.0+$/.test(s))s=s.replace(/\.0+$/,'');
  return s.replace(/\s+/g,'').toUpperCase();
}
function trendosNormalizeOrderId_(v){const s=trendosNormalizeIdTokenV1_(v);return s&&/^[A-Z0-9][A-Z0-9_-]*$/.test(s)?s:'';}
function trendosNormalizeLineId_(v){const s=trendosNormalizeIdTokenV1_(v),m=s.match(/^(.+)-(\d{1,3})$/);if(!m)return '';const oid=trendosNormalizeOrderId_(m[1]),n=Number(m[2]);return oid&&isFinite(n)&&n>=1&&n<=999?oid+'-'+String(n).padStart(2,'0'):'';}

function trendosBusinessDate_(v){
  if(v==null||v==='')v=new Date();
  if(trendosIsDateObjectV1_(v))return isNaN(v.getTime())?'':Utilities.formatDate(v,TRENDOS_TZ_V1,'yyyy-MM-dd');
  const s=trendosAsciiDigitsV1_(v).trim(),d=s.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})$/),p=s.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  return d?d[1]+'-'+d[2]+'-'+d[3]:p?p[1]+'-'+p[2]+'-'+p[3]:'';
}
function trendosBusinessWeekdayV1_(d){const m=trendosTextV1_(d).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(Date.UTC(+m[1],+m[2]-1,+m[3],12)).getUTCDay():-1;}
function trendosTimeHHmmV1_(v,f){const m=trendosAsciiDigitsV1_(v).match(/^(\d{1,2}):(\d{2})$/);if(!m)return f||'';const h=+m[1],n=+m[2];return h>=0&&h<=23&&n>=0&&n<=59?String(h).padStart(2,'0')+':'+String(n).padStart(2,'0'):(f||'');}
function trendosResolveBusinessScheduleV1_(dateKey,settings,specialRows){
  dateKey=trendosBusinessDate_(dateKey);if(!dateKey)return{date:'',businessDay:false,start:'',end:'',source:'INVALID_DATE',description:'Invalid business date',special:false};
  settings=settings||{};specialRows=Array.isArray(specialRows)?specialRows:[];
  const start=trendosTimeHHmmV1_(settings.DEFAULT_WORKDAY_START||settings.ATTENDANCE_SCHEDULE_START,'12:00'),end=trendosTimeHHmmV1_(settings.DEFAULT_WORKDAY_END,'21:00'),friday=trendosBusinessWeekdayV1_(dateKey)===5;
  let out={date:dateKey,businessDay:!friday,start:start,end:end,source:friday?'DEFAULT_FRIDAY_CLOSED':'DEFAULT_WORKDAY',description:friday?'Friday weekly holiday':'Default workday',special:false};
  for(let i=specialRows.length-1;i>=0;i--){const r=specialRows[i]||{},rd=trendosBusinessDate_(r.date||r['التاريخ']);if(rd!==dateKey)continue;const en=trendosTextV1_(r.enabled!=null?r.enabled:r['مفعل؟']);if(en==='لا'||/^no$/i.test(en)||en==='0'||/^false$/i.test(en))continue;out={date:dateKey,businessDay:true,start:trendosTimeHHmmV1_(r.start||r['بداية العمل'],start),end:trendosTimeHHmmV1_(r.end||r['نهاية العمل'],end),source:'SPECIAL_SCHEDULE',description:trendosTextV1_(r.description||r['الوصف'])||'Special schedule',special:true};break;}
  return out;
}

function trendosSpreadsheetV1_(){if(typeof ss_==='function')return ss_();if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.getActiveSpreadsheet){const s=SpreadsheetApp.getActiveSpreadsheet();if(s)return s;}throw new Error('TrendOS spreadsheet is unavailable.');}
function trendosRowsAsObjectsV1_(sh){if(!sh||sh.getLastRow()<2||sh.getLastColumn()<1)return[];const v=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues(),h=v[0].map(trendosTextV1_);return v.slice(1).map(r=>{const o={};h.forEach((k,i)=>{if(k)o[k]=r[i];});return o;});}
function trendosSettingsMapV1_(){const sh=trendosSpreadsheetV1_().getSheetByName(TRENDOS_ATTENDANCE_SETTINGS_SHEET_V1),o={};trendosRowsAsObjectsV1_(sh).forEach(r=>{const k=trendosTextV1_(r['الإعداد']);if(k&&trendosTextV1_(r['مفعل؟'])!=='لا')o[k]=r['القيمة'];});return o;}
function trendosSpecialScheduleRowsV1_(){return trendosRowsAsObjectsV1_(trendosSpreadsheetV1_().getSheetByName(TRENDOS_SPECIAL_SCHEDULE_SHEET_V1));}
function trendosBusinessSchedule_(v){const d=trendosBusinessDate_(v);return trendosResolveBusinessScheduleV1_(d,trendosSettingsMapV1_(),trendosSpecialScheduleRowsV1_());}
function trendosIsBusinessDay_(v){return!!trendosBusinessSchedule_(v).businessDay;}

function trendosStableValueV1_(v){if(v==null)return null;if(trendosIsDateObjectV1_(v))return isNaN(v.getTime())?null:v.toISOString();if(Array.isArray(v))return v.map(trendosStableValueV1_);if(typeof v==='object'){const o={};Object.keys(v).sort().forEach(k=>o[k]=trendosStableValueV1_(v[k]));return o;}if(typeof v==='number')return isFinite(v)?v:null;if(typeof v==='boolean')return v;return trendosTextV1_(v);}
function trendosStableJsonV1_(v){return JSON.stringify(trendosStableValueV1_(v));}
function trendosSha256HexV1_(v){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,trendosTextV1_(v),Utilities.Charset.UTF_8).map(b=>('0'+((b<0?b+256:b).toString(16))).slice(-2)).join('');}
function trendosEventKey_(type,entity,businessDate,state){type=trendosTextV1_(type).toUpperCase().replace(/\s+/g,'_');entity=trendosNormalizeLineId_(entity)||trendosNormalizeOrderId_(entity)||trendosTextV1_(entity);businessDate=trendosBusinessDate_(businessDate);if(!type||!entity||!businessDate)throw new Error('TrendOS event key requires eventType, entityId and businessDate.');const raw=[type,entity,businessDate,trendosStableJsonV1_(state)].join('|');return'TR1|'+type+'|'+entity+'|'+businessDate+'|'+trendosSha256HexV1_(raw).slice(0,32);}

function trendosEnsureSheetV1_(name,headers){
  const ss=trendosSpreadsheetV1_();let sh=ss.getSheetByName(name),created=!sh;if(!sh)sh=ss.insertSheet(name);
  if(sh.getMaxColumns()<headers.length)sh.insertColumnsAfter(sh.getMaxColumns(),headers.length-sh.getMaxColumns());
  const cur=sh.getRange(1,1,1,headers.length).getValues()[0].map(trendosTextV1_),any=cur.some(Boolean),exact=headers.every((h,i)=>cur[i]===h);
  if(!exact&&any&&!created)throw new Error('TrendOS integrity sheet schema mismatch: '+name);
  if(!exact)sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);return sh;
}
function trendosExistingSheetV1_(name){return trendosSpreadsheetV1_().getSheetByName(name)||null;}
function trendosHeaderMapV1_(sh){const o={};if(!sh||sh.getLastColumn()<1)return o;sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].forEach((v,i)=>{const k=trendosTextV1_(v);if(k)o[k]=i+1;});return o;}
function trendosGetV1_(sh,row,map,h){return map[h]?sh.getRange(row,map[h]).getValue():'';}
function trendosSetV1_(sh,row,values){const m=trendosHeaderMapV1_(sh);Object.keys(values||{}).forEach(h=>{if(m[h])sh.getRange(row,m[h]).setValue(values[h]);});}
function trendosAppendV1_(sh,values,headers){const m=trendosHeaderMapV1_(sh),a=new Array(Math.max(sh.getLastColumn(),headers.length)).fill('');Object.keys(values||{}).forEach(h=>{if(m[h])a[m[h]-1]=values[h];});sh.appendRow(a);return sh.getLastRow();}
function trendosFindKeyRowV1_(sh,header,key){if(!sh||sh.getLastRow()<2)return 0;const m=trendosHeaderMapV1_(sh),c=m[header];if(!c)return 0;const v=sh.getRange(2,c,sh.getLastRow()-1,1).getValues();for(let i=v.length-1;i>=0;i--)if(trendosTextV1_(v[i][0])===trendosTextV1_(key))return i+2;return 0;}

function trendosGetLockV1_(scope){scope=trendosTextV1_(scope||'script').toLowerCase();if(scope==='user')return LockService.getUserLock();if(scope==='document'&&LockService.getDocumentLock){const l=LockService.getDocumentLock();if(l)return l;}return LockService.getScriptLock();}
function trendosWithLock_(scope,fn,waitMs){if(typeof fn!=='function')throw new Error('trendosWithLock_ requires a function.');const l=trendosGetLockV1_(scope);l.waitLock(Math.max(1000,Number(waitMs||30000)||30000));try{return fn();}finally{l.releaseLock();}}

function trendosIdempotencySheetV1_(){return trendosEnsureSheetV1_(TRENDOS_IDEMPOTENCY_SHEET_V1,TRENDOS_IDEMPOTENCY_HEADERS_V1);}
function trendosIdempotencyLookup_(key){const sh=trendosExistingSheetV1_(TRENDOS_IDEMPOTENCY_SHEET_V1);if(!sh)return null;const row=trendosFindKeyRowV1_(sh,'مفتاح الحدث',key);if(!row)return null;const m=trendosHeaderMapV1_(sh),raw=trendosTextV1_(trendosGetV1_(sh,row,m,'النتيجة JSON'));let result=null;if(raw)try{result=JSON.parse(raw);}catch(e){result=raw;}return{eventKey:trendosGetV1_(sh,row,m,'مفتاح الحدث'),eventType:trendosGetV1_(sh,row,m,'نوع الحدث'),entityId:trendosGetV1_(sh,row,m,'الكيان'),businessDate:trendosGetV1_(sh,row,m,'تاريخ العمل'),status:trendosGetV1_(sh,row,m,'الحالة'),claimedAt:trendosGetV1_(sh,row,m,'وقت الحجز'),completedAt:trendosGetV1_(sh,row,m,'وقت الإكمال'),result:result,lastError:trendosGetV1_(sh,row,m,'آخر خطأ'),attempts:Number(trendosGetV1_(sh,row,m,'عدد المحاولات')||0),rowNumber:row};}
function trendosIdempotencyClaimUnlockedV1_(key,meta,opt){meta=meta||{};opt=opt||{};const sh=trendosIdempotencySheetV1_(),row=trendosFindKeyRowV1_(sh,'مفتاح الحدث',key),now=new Date();if(row){const m=trendosHeaderMapV1_(sh),status=trendosTextV1_(trendosGetV1_(sh,row,m,'الحالة')),attempts=Number(trendosGetV1_(sh,row,m,'عدد المحاولات')||0)+1;if(status==='FAILED'&&opt.retryFailed===true){trendosSetV1_(sh,row,{'الحالة':'CLAIMED','وقت الحجز':now,'وقت الإكمال':'','آخر خطأ':'','عدد المحاولات':attempts,'بواسطة':trendosTextV1_(meta.by),'آخر تحديث':now});return{claimed:true,duplicate:true,retried:true,completed:false,inProgress:true,failed:false,eventKey:key,rowNumber:row};}trendosSetV1_(sh,row,{'عدد المحاولات':attempts,'آخر تحديث':now});return{claimed:false,duplicate:true,completed:status==='COMPLETED',inProgress:status==='CLAIMED',failed:status==='FAILED',existing:trendosIdempotencyLookup_(key)};}
  const nr=trendosAppendV1_(sh,{'مفتاح الحدث':key,'نوع الحدث':trendosTextV1_(meta.eventType),'الكيان':trendosTextV1_(meta.entityId),'تاريخ العمل':trendosBusinessDate_(meta.businessDate),'الحالة':'CLAIMED','وقت الحجز':now,'وقت الإكمال':'','النتيجة JSON':'','آخر خطأ':'','عدد المحاولات':1,'بواسطة':trendosTextV1_(meta.by),'آخر تحديث':now},TRENDOS_IDEMPOTENCY_HEADERS_V1);return{claimed:true,duplicate:false,completed:false,inProgress:true,failed:false,eventKey:key,rowNumber:nr};}
function trendosIdempotencyClaim_(key,meta,opt){opt=opt||{};if(!trendosTextV1_(key))throw new Error('eventKey is required.');return opt.alreadyLocked?trendosIdempotencyClaimUnlockedV1_(key,meta,opt):trendosWithLock_('script',()=>trendosIdempotencyClaimUnlockedV1_(key,meta,opt),opt.waitMs||30000);}
function trendosIdempotencyCompleteUnlockedV1_(key,result,opt){opt=opt||{};const sh=trendosIdempotencySheetV1_(),row=trendosFindKeyRowV1_(sh,'مفتاح الحدث',key);if(!row)throw new Error('Cannot complete unknown TrendOS event: '+key);const now=new Date();trendosSetV1_(sh,row,{'الحالة':opt.failed?'FAILED':'COMPLETED','وقت الإكمال':opt.failed?'':now,'النتيجة JSON':result===undefined?'':trendosStableJsonV1_(result),'آخر خطأ':opt.failed?trendosTextV1_(opt.error||result):'','آخر تحديث':now});return trendosIdempotencyLookup_(key);}
function trendosIdempotencyComplete_(key,result,opt){opt=opt||{};return opt.alreadyLocked?trendosIdempotencyCompleteUnlockedV1_(key,result,opt):trendosWithLock_('script',()=>trendosIdempotencyCompleteUnlockedV1_(key,result,opt),opt.waitMs||30000);}
function trendosIdempotencyFail_(key,error,opt){opt=opt||{};opt.failed=true;opt.error=error&&error.message?error.message:trendosTextV1_(error);return trendosIdempotencyComplete_(key,{error:opt.error},opt);}

function trendosAutomationRunSheetV1_(){return trendosEnsureSheetV1_(TRENDOS_AUTOMATION_RUN_SHEET_V1,TRENDOS_AUTOMATION_RUN_HEADERS_V1);}
function trendosAutomationRunStart_(fn,opt){opt=opt||{};const now=new Date(),d=trendosBusinessDate_(opt.businessDate||now),id=trendosTextV1_(opt.runId)||('RUN-'+d.replace(/-/g,'')+'-'+Utilities.getUuid().slice(0,8).toUpperCase()),sh=trendosAutomationRunSheetV1_(),row=trendosAppendV1_(sh,{'Run ID':id,'مفتاح التشغيل':trendosTextV1_(opt.runKey),'الدالة':trendosTextV1_(fn),'تاريخ العمل':d,'وقت البداية':now,'وقت النهاية':'','الحالة':'RUNNING','صفوف مقروءة':0,'صفوف مضافة':0,'صفوف محدثة':0,'تكرارات متجاهلة':0,'عدد الأخطاء':0,'Retry Count':Number(opt.retryCount||0),'التفاصيل JSON':opt.details===undefined?'':trendosStableJsonV1_(opt.details),'آخر خطأ':'','آخر تحديث':now},TRENDOS_AUTOMATION_RUN_HEADERS_V1);return{runId:id,rowNumber:row,businessDate:d,startedAt:now};}
function trendosAutomationRunFinish_(id,s){s=s||{};const sh=trendosAutomationRunSheetV1_(),row=trendosFindKeyRowV1_(sh,'Run ID',id);if(!row)throw new Error('Unknown automation Run ID: '+id);const now=new Date(),status=trendosTextV1_(s.status||(s.error?'FAILED':'SUCCESS')).toUpperCase();trendosSetV1_(sh,row,{'وقت النهاية':now,'الحالة':status,'صفوف مقروءة':Number(s.rowsRead||0),'صفوف مضافة':Number(s.rowsCreated||0),'صفوف محدثة':Number(s.rowsUpdated||0),'تكرارات متجاهلة':Number(s.duplicatesSkipped||0),'عدد الأخطاء':Number(s.errorCount||(s.error?1:0)),'Retry Count':Number(s.retryCount||0),'التفاصيل JSON':s.details===undefined?'':trendosStableJsonV1_(s.details),'آخر خطأ':s.error&&s.error.message?s.error.message:trendosTextV1_(s.error),'آخر تحديث':now});return{runId:id,rowNumber:row,status:status,finishedAt:now};}

function trendosNormalizeStatusV1_(s){return trendosTextV1_(s).replace(/\s+/g,' ');}
function trendosIsDuplicateStatus_(s){return trendosNormalizeStatusV1_(s)==='مكرر';}
function trendosIsCancelledStatus_(s){s=trendosNormalizeStatusV1_(s);return s==='ملغي'||s==='ملغى'||s==='ملغية';}
function trendosIsDeliveredStatus_(s){return trendosNormalizeStatusV1_(s)==='تم التسليم';}
function trendosIsClosedLineStatus_(s){return trendosIsDuplicateStatus_(s)||trendosIsCancelledStatus_(s)||trendosIsDeliveredStatus_(s);}
function trendosIsOpenLineStatus_(s){s=trendosNormalizeStatusV1_(s);return!!s&&!trendosIsClosedLineStatus_(s);}
function trendosIsFinalInvoiceStatus_(s){s=trendosNormalizeStatusV1_(s);return s==='تم التقفيل'||s==='مقفلة'||s==='مقفل';}

function trendosIntegritySelfTestV1_(){const c=[];const q=(n,a,e)=>c.push({name:n,expected:e,actual:a,pass:JSON.stringify(a)===JSON.stringify(e)});q('order numeric',trendosNormalizeOrderId_(3637),'3637');q('order TM uppercase',trendosNormalizeOrderId_(' tm2606150097 '),'TM2606150097');q('line pad suffix',trendosNormalizeLineId_('3637-2'),'3637-02');q('line arabic digits',trendosNormalizeLineId_('٣٦٣٧-٠٢'),'3637-02');q('date object rejected as line ID',trendosNormalizeLineId_(new Date()),'');q('duplicate closed',trendosIsClosedLineStatus_('مكرر'),true);q('delivered closed',trendosIsClosedLineStatus_('تم التسليم'),true);q('in progress open',trendosIsOpenLineStatus_('تحت التنفيذ'),true);q('stable event key object order',trendosEventKey_('LINE_UPDATE','3637-02','2026-08-30',{b:2,a:1}),trendosEventKey_('LINE_UPDATE','3637-02','2026-08-30',{a:1,b:2}));const f=trendosResolveBusinessScheduleV1_('2026-09-04',{DEFAULT_WORKDAY_START:'12:00'},[]),x=trendosResolveBusinessScheduleV1_('2026-09-04',{DEFAULT_WORKDAY_START:'12:00'},[{'التاريخ':'2026-09-04','بداية العمل':'10:00','نهاية العمل':'22:00','الوصف':'استثناء','مفعل؟':'نعم'}]);q('Friday default closed',f.businessDay,false);q('Friday special opens',x.businessDay,true);q('Friday special start',x.start,'10:00');q('Friday special end',x.end,'22:00');return{success:c.every(x=>x.pass),version:TRENDOS_INTEGRITY_VERSION_V1,checks:c};}
