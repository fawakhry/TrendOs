/**
 * TrendOS Handover / OPS Integrity V1
 * GitHub-only implementation checkpoint. Not wired to production routes yet.
 * Requires trendos-integrity-v1.gs and current TrendOS helpers when installed.
 */
const TRENDOS_HANDOVER_OPS_VERSION_V1 = 'TRENDOS_HANDOVER_OPS_INTEGRITY_V1_20260830';
const TRENDOS_HANDOVER_SHEET_V1 = 'إدارة - تسليم الشيفت';
const TRENDOS_OPS_EVENTS_SHEET_V1 = 'إدارة - أحداث التشغيل V1';
const TRENDOS_HANDOVER_HEADERS_V1 = [
  'ID','التاريخ/الوقت','الموظف','القسم','رقم الأوردر/المهمة','Line ID','تاريخ العمل','الشيفت',
  'الحالة الحقيقية','سبب التوقف','الخطوة التالية','يسلم إلى','حالة الاستلام','ملاحظة المدير',
  'State Fingerprint','مفتاح الحدث','Revision','استلم بواسطة','وقت الاستلام','آخر تحديث'
];
const TRENDOS_OPS_EVENT_HEADERS_V1 = [
  'Event ID','وقت الإنشاء','نوع الحدث','Request ID','الموظف','القسم','رقم الأوردر','Line ID','تاريخ العمل',
  'State Fingerprint','المحتوى','Evidence JSON','Coach Note ID','Followed Up At','الحالة','مفتاح الحدث','آخر تحديث'
];

function trendosHandoverTextV1_(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
function trendosHandoverSearchKeyV1_(v){ return trendosHandoverTextV1_(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ة]/g,'ه'); }
function trendosHandoverStableJsonV1_(v){ return typeof trendosStableJsonV1_ === 'function' ? trendosStableJsonV1_(v) : JSON.stringify(v||{}); }
function trendosHandoverHashV1_(v){
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, trendosHandoverTextV1_(v), Utilities.Charset.UTF_8);
  return bytes.map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('').slice(0,32);
}
function trendosHandoverStateFingerprintV1_(state){
  state = state || {};
  return trendosHandoverHashV1_(trendosHandoverStableJsonV1_({
    status: trendosHandoverTextV1_(state.status),
    blocker: trendosHandoverTextV1_(state.blocker),
    nextAction: trendosHandoverTextV1_(state.nextAction),
    nextOwner: trendosHandoverTextV1_(state.nextOwner),
    department: trendosHandoverTextV1_(state.department)
  }));
}
function trendosHandoverEnsureSchemaV1_(){
  const ss=trendosSpreadsheetV1_(); let sh=ss.getSheetByName(TRENDOS_HANDOVER_SHEET_V1);
  if(!sh){ sh=ss.insertSheet(TRENDOS_HANDOVER_SHEET_V1); if(sh.getMaxColumns()<TRENDOS_HANDOVER_HEADERS_V1.length) sh.insertColumnsAfter(sh.getMaxColumns(),TRENDOS_HANDOVER_HEADERS_V1.length-sh.getMaxColumns()); sh.getRange(1,1,1,TRENDOS_HANDOVER_HEADERS_V1.length).setValues([TRENDOS_HANDOVER_HEADERS_V1]); sh.setFrozenRows(1); return sh; }
  const requiredLegacy=['ID','التاريخ/الوقت','الموظف','القسم','رقم الأوردر/المهمة','الحالة الحقيقية','سبب التوقف','الخطوة التالية','يسلم إلى','حالة الاستلام','ملاحظة المدير','آخر تحديث'];
  const current=sh.getLastColumn()>0?sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(trendosHandoverTextV1_):[], counts={}; current.forEach(h=>{if(h)counts[h]=(counts[h]||0)+1;});
  requiredLegacy.forEach(h=>{if(!counts[h])throw new Error('Handover schema missing required legacy header: '+h);if(counts[h]>1)throw new Error('Handover schema has duplicate header: '+h);});
  TRENDOS_HANDOVER_HEADERS_V1.forEach(h=>{if((counts[h]||0)>1)throw new Error('Handover schema has duplicate header: '+h);});
  const missing=TRENDOS_HANDOVER_HEADERS_V1.filter(h=>!counts[h]);
  if(missing.length){const start=sh.getLastColumn()+1;if(sh.getMaxColumns()<start+missing.length-1)sh.insertColumnsAfter(sh.getMaxColumns(),start+missing.length-1-sh.getMaxColumns());sh.getRange(1,start,1,missing.length).setValues([missing]);}
  sh.setFrozenRows(1); return sh;
}
function trendosOpsEventsSheetV1_(){
  return trendosEnsureSheetV1_(TRENDOS_OPS_EVENTS_SHEET_V1, TRENDOS_OPS_EVENT_HEADERS_V1);
}
function trendosHandoverHeaderMapV1_(sh){ return trendosHeaderMapV1_(sh); }
function trendosHandoverValueV1_(sh,row,header){ const m=trendosHandoverHeaderMapV1_(sh); return m[header]?sh.getRange(row,m[header]).getValue():''; }
function trendosHandoverSetV1_(sh,row,values){ return trendosSetV1_(sh,row,values); }
function trendosHandoverAppendV1_(sh,values,headers){ return trendosAppendV1_(sh,values,headers); }
function trendosHandoverFindByEventKeyV1_(sh,key){ return trendosFindKeyRowV1_(sh,'مفتاح الحدث',key); }
function trendosOpsFindByEventKeyV1_(sh,key){ return trendosFindKeyRowV1_(sh,'مفتاح الحدث',key); }
function trendosOpsFindByRequestIdV1_(sh,requestId){ return trendosFindKeyRowV1_(sh,'Request ID',requestId); }

function trendosHandoverActiveLineLookupV1_(lineId,opt){
  opt = opt || {};
  const normalized = trendosNormalizeLineId_(lineId);
  if(!normalized) throw new Error('Line ID غير صالح.');
  if(typeof opt.lineLookup === 'function'){
    const x=opt.lineLookup(normalized)||{}, id=trendosNormalizeLineId_(x.lineId||normalized), status=trendosHandoverTextV1_(x.status);
    if(id!==normalized)throw new Error('Injected Line lookup returned mismatched Line ID.');
    if(typeof trendosIsOpenLineStatus_==='function' && !trendosIsOpenLineStatus_(status))throw new Error('Line ID ليس سطر تشغيل مفتوح: '+normalized);
    return {rowNumber:x.rowNumber||0,lineId:id,orderId:trendosNormalizeOrderId_(x.orderId),department:trendosHandoverTextV1_(x.department),status:status,assignedTo:trendosHandoverTextV1_(x.assignedTo)};
  }
  const sh = ss_().getSheetByName(SHEET_NAME_LINES);
  if(!sh || sh.getLastRow()<2) throw new Error('شيت بنود الأوردرات غير متاح.');
  const h = headersMap_(sh), cLine = firstCol_(h,['رقم البند','Line ID'],0), cOrder = firstCol_(h,['رقم الأوردر','Order ID'],0),
        cDept = firstCol_(h,['القسم','Department'],0), cStatus = firstCol_(h,['الحالة','Status'],0), cAssigned = firstCol_(h,['مسؤول القسم','المستلم'],0);
  if(!cLine || !cStatus) throw new Error('أعمدة Line ID/الحالة غير مكتملة.');
  const data = sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(), found=[];
  data.forEach((r,i)=>{
    const id = trendosNormalizeLineId_(valueAt_(r,cLine));
    if(id!==normalized) return;
    const status = trendosHandoverTextV1_(valueAt_(r,cStatus));
    if(typeof trendosIsOpenLineStatus_==='function' && !trendosIsOpenLineStatus_(status)) return;
    if(typeof trendosIsOpenLineStatus_!=='function' && trendosIsDuplicateStatus_(status)) return;
    found.push({rowNumber:i+2,lineId:id,orderId:trendosNormalizeOrderId_(valueAt_(r,cOrder)),department:trendosHandoverTextV1_(valueAt_(r,cDept)),status:status,assignedTo:trendosHandoverTextV1_(valueAt_(r,cAssigned))});
  });
  if(found.length===0) throw new Error('Line ID غير موجود كسطر تشغيل فعال: '+normalized);
  if(found.length>1) throw new Error('Integrity Error: أكثر من سطر فعال لنفس Line ID: '+normalized);
  return found[0];
}

function trendosHandoverEventKeyV1_(input){
  const d = trendosBusinessDate_(input.businessDate || new Date()), shift=trendosHandoverTextV1_(input.shift), employee=trendosHandoverSearchKeyV1_(input.employee), lineId=trendosNormalizeLineId_(input.lineId), fp=trendosHandoverTextV1_(input.stateFingerprint);
  if(!shift) throw new Error('الشيفت مطلوب لتسليم الشيفت.');
  if(!employee) throw new Error('الموظف مطلوب لتسليم الشيفت.');
  if(!lineId) throw new Error('Line ID مطلوب لتسليم الشيفت.');
  if(!fp) throw new Error('State Fingerprint مطلوب.');
  return trendosEventKey_('HANDOVER',lineId,d,{shift:shift,employee:employee,stateFingerprint:fp});
}

function trendosCreateHandoverV1_(input,opt){
  input=input||{}; opt=opt||{};
  return trendosWithLock_('script',function(){
    const line = trendosHandoverActiveLineLookupV1_(input.lineId,opt);
    const orderId = trendosNormalizeOrderId_(input.orderId || line.orderId);
    if(input.orderId && orderId!==trendosNormalizeOrderId_(line.orderId)) throw new Error('Order ID لا يطابق Line ID.');
    const employee = trendosHandoverTextV1_(input.employee), department=trendosHandoverTextV1_(input.department||line.department), shift=trendosHandoverTextV1_(input.shift), businessDate=trendosBusinessDate_(input.businessDate||new Date());
    const status=trendosHandoverTextV1_(input.status||line.status), blocker=trendosHandoverTextV1_(input.blocker), nextAction=trendosHandoverTextV1_(input.nextAction), nextOwner=trendosHandoverTextV1_(input.nextOwner);
    if(!employee || !shift || !status || !nextAction || !nextOwner) throw new Error('الموظف والشيفت والحالة والخطوة التالية والمسؤول التالي مطلوبة.');
    const stateFingerprint = trendosHandoverStateFingerprintV1_({status,blocker,nextAction,nextOwner,department});
    const eventKey = trendosHandoverEventKeyV1_({businessDate,shift,employee,lineId:line.lineId,stateFingerprint});
    const sh = trendosHandoverEnsureSchemaV1_(), existingRow=trendosHandoverFindByEventKeyV1_(sh,eventKey);
    if(existingRow){
      return {success:true,duplicate:true,replayed:true,id:trendosHandoverValueV1_(sh,existingRow,'ID'),eventKey: eventKey,lineId:line.lineId,orderId:orderId,stateFingerprint:stateFingerprint,rowNumber:existingRow};
    }
    const id='HO-'+Utilities.getUuid().slice(0,8).toUpperCase(), now=new Date();
    const revision=stateFingerprint.slice(0,12).toUpperCase();
    const row=trendosHandoverAppendV1_(sh,{
      'ID':id,'التاريخ/الوقت':now,'الموظف':employee,'القسم':department,'رقم الأوردر/المهمة':orderId,'Line ID':line.lineId,'تاريخ العمل':businessDate,'الشيفت':shift,
      'الحالة الحقيقية':status,'سبب التوقف':blocker,'الخطوة التالية':nextAction,'يسلم إلى':nextOwner,'حالة الاستلام':'في انتظار الاستلام','ملاحظة المدير':'',
      'State Fingerprint':stateFingerprint,'مفتاح الحدث':eventKey,'Revision':revision,'استلم بواسطة':'','وقت الاستلام':'','آخر تحديث':now
    },TRENDOS_HANDOVER_HEADERS_V1);
    return {success:true,duplicate:false,id,eventKey,lineId:line.lineId,orderId,stateFingerprint,revision,rowNumber:row};
  },30000);
}

function trendosReceiveHandoverV1_(input){
  input=input||{};
  return trendosWithLock_('script',function(){
    const id=trendosHandoverTextV1_(input.id), receiver=trendosHandoverTextV1_(input.receiver), note=trendosHandoverTextV1_(input.managerNote);
    if(!id || !receiver) throw new Error('ID والمستلم مطلوبان.');
    const sh=trendosHandoverEnsureSchemaV1_(), row=trendosFindKeyRowV1_(sh,'ID',id);
    if(!row) throw new Error('سجل تسليم الشيفت غير موجود.');
    const current=trendosHandoverTextV1_(trendosHandoverValueV1_(sh,row,'حالة الاستلام'));
    const existingReceiver=trendosHandoverTextV1_(trendosHandoverValueV1_(sh,row,'استلم بواسطة'));
    if(current==='تم الاستلام'){
      if(existingReceiver && trendosHandoverSearchKeyV1_(existingReceiver)!==trendosHandoverSearchKeyV1_(receiver)) throw new Error('تم استلام التسليم بالفعل بواسطة موظف آخر.');
      return {success:true,duplicate:true,id,receivedBy:existingReceiver||receiver};
    }
    const expected=trendosHandoverTextV1_(trendosHandoverValueV1_(sh,row,'يسلم إلى'));
    if(expected && trendosHandoverSearchKeyV1_(expected)!==trendosHandoverSearchKeyV1_(receiver)) throw new Error('المستلم لا يطابق المسؤول المحدد في التسليم.');
    const now=new Date();
    trendosHandoverSetV1_(sh,row,{'حالة الاستلام':'تم الاستلام','استلم بواسطة':receiver,'وقت الاستلام':now,'ملاحظة المدير':note,'آخر تحديث':now});
    return {success:true,duplicate:false,id,receivedBy:receiver,receivedAt:now};
  },30000);
}

function trendosOpsReplyEventKeyV1_(input){
  const requestId=trendosHandoverTextV1_(input.requestId), employee=trendosHandoverSearchKeyV1_(input.employee), d=trendosBusinessDate_(input.businessDate||new Date());
  if(!requestId) throw new Error('requestId مطلوب لرد التشغيل.');
  return trendosEventKey_('OPS_REPLY',requestId,d,{employee:employee,lineId:trendosNormalizeLineId_(input.lineId||'')||''});
}
function trendosSaveOpsReplyV1_(input,opt){
  input=input||{}; opt=opt||{};
  return trendosWithLock_('script',function(){
    const requestId=trendosHandoverTextV1_(input.requestId), employee=trendosHandoverTextV1_(input.employee), content=trendosHandoverTextV1_(input.content), department=trendosHandoverTextV1_(input.department), businessDate=trendosBusinessDate_(input.businessDate||new Date());
    if(!requestId || !employee || !content) throw new Error('requestId والموظف والرد مطلوبون.');
    let lineId='', orderId=trendosNormalizeOrderId_(input.orderId||'');
    if(input.lineId){ const line=trendosHandoverActiveLineLookupV1_(input.lineId,opt); lineId=line.lineId; if(orderId && orderId!==line.orderId) throw new Error('Order ID لا يطابق Line ID.'); orderId=orderId||line.orderId; }
    const sh=trendosOpsEventsSheetV1_(), existingReq=trendosOpsFindByRequestIdV1_(sh,requestId);
    if(existingReq){ return {success:true,duplicate:true,replayed:true,eventId:trendosHandoverValueV1_(sh,existingReq,'Event ID'),requestId,rowNumber:existingReq}; }
    const key=trendosOpsReplyEventKeyV1_({requestId,employee,businessDate,lineId}), now=new Date(), id='OPS-'+Utilities.getUuid().slice(0,8).toUpperCase();
    const evidence={source:'OPS_REPLY',orderId:orderId||'',lineId:lineId||'',employee:employee,department:department||''};
    const row=trendosHandoverAppendV1_(sh,{'Event ID':id,'وقت الإنشاء':now,'نوع الحدث':'OPS_REPLY','Request ID':requestId,'الموظف':employee,'القسم':department,'رقم الأوردر':orderId,'Line ID':lineId,'تاريخ العمل':businessDate,'State Fingerprint':'','المحتوى':content,'Evidence JSON':trendosHandoverStableJsonV1_(evidence),'Coach Note ID':'','Followed Up At':'','الحالة':'OPEN','مفتاح الحدث':key,'آخر تحديث':now},TRENDOS_OPS_EVENT_HEADERS_V1);
    return {success:true,duplicate:false,eventId:id,requestId,eventKey:key,rowNumber:row,lineId,orderId};
  },30000);
}

function trendosOpsCoachEventKeyV1_(input){
  const employee=trendosHandoverSearchKeyV1_(input.employee), lineId=trendosNormalizeLineId_(input.lineId), d=trendosBusinessDate_(input.businessDate||new Date()), fp=trendosHandoverTextV1_(input.stateFingerprint);
  if(!employee || !lineId || !fp) throw new Error('employee/Line ID/state fingerprint required.');
  return trendosEventKey_('OPS_COACH',lineId,d,{employee:employee,stateFingerprint:fp});
}
function trendosCreateOpsCoachV1_(input,opt){
  input=input||{}; opt=opt||{};
  return trendosWithLock_('script',function(){
    const line=trendosHandoverActiveLineLookupV1_(input.lineId,opt), employee=trendosHandoverTextV1_(input.employee), department=trendosHandoverTextV1_(input.department||line.department), message=trendosHandoverTextV1_(input.message), businessDate=trendosBusinessDate_(input.businessDate||new Date());
    if(!employee || !message) throw new Error('الموظف ورسالة المتابعة مطلوبان.');
    const fp=trendosHandoverTextV1_(input.stateFingerprint)||trendosHandoverStateFingerprintV1_({status:input.status||line.status,blocker:input.blocker,nextAction:input.nextAction,nextOwner:employee,department:department});
    const key=trendosOpsCoachEventKeyV1_({employee,lineId:line.lineId,businessDate,stateFingerprint:fp}), sh=trendosOpsEventsSheetV1_(), existing=trendosOpsFindByEventKeyV1_(sh,key);
    if(existing) return {success:true,duplicate:true,replayed:true,eventId:trendosHandoverValueV1_(sh,existing,'Event ID'),eventKey:key,stateFingerprint:fp,rowNumber:existing};
    const now=new Date(),id='COACH-'+Utilities.getUuid().slice(0,8).toUpperCase(),evidence=input.evidence||{orderId:line.orderId,lineId:line.lineId,status:input.status||line.status,department:department};
    const row=trendosHandoverAppendV1_(sh,{'Event ID':id,'وقت الإنشاء':now,'نوع الحدث':'OPS_COACH','Request ID':'','الموظف':employee,'القسم':department,'رقم الأوردر':line.orderId,'Line ID':line.lineId,'تاريخ العمل':businessDate,'State Fingerprint':fp,'المحتوى':message,'Evidence JSON':trendosHandoverStableJsonV1_(evidence),'Coach Note ID':'','Followed Up At':'','الحالة':'OPEN','مفتاح الحدث':key,'آخر تحديث':now},TRENDOS_OPS_EVENT_HEADERS_V1);
    return {success:true,duplicate:false,eventId:id,eventKey:key,stateFingerprint:fp,rowNumber:row};
  },30000);
}

function trendosOpsMarkReplyFollowedUpV1_(input){
  input=input||{};
  return trendosWithLock_('script',function(){
    const eventId=trendosHandoverTextV1_(input.eventId), coachNoteId=trendosHandoverTextV1_(input.coachNoteId);
    if(!eventId) throw new Error('Event ID مطلوب.');
    const sh=trendosOpsEventsSheetV1_(),row=trendosFindKeyRowV1_(sh,'Event ID',eventId);
    if(!row) throw new Error('OPS event غير موجود.');
    const type=trendosHandoverTextV1_(trendosHandoverValueV1_(sh,row,'نوع الحدث'));
    if(type!=='OPS_REPLY') throw new Error('الحدث ليس OPS_REPLY.');
    const followed=trendosHandoverValueV1_(sh,row,'Followed Up At');
    if(followed) return {success:true,duplicate:true,eventId,followedUpAt:followed,coachNoteId:trendosHandoverValueV1_(sh,row,'Coach Note ID')};
    const now=new Date(); trendosHandoverSetV1_(sh,row,{'Followed Up At':now,'Coach Note ID':coachNoteId,'الحالة':'FOLLOWED_UP','آخر تحديث':now});
    return {success:true,duplicate:false,eventId,followedUpAt:now,coachNoteId};
  },30000);
}

function trendosTrendMasterRunKeyV1_(now){
  now=now||new Date();
  const d=trendosBusinessDate_(now), hour=Utilities.formatDate(now,'Africa/Cairo','HH');
  return 'TREND_MASTER|'+d+'|'+hour;
}
function trendosRunTrendMasterAutomationSafeV1_(opt){
  opt=opt||{};
  const now=opt.now||new Date(), runKey=trendosHandoverTextV1_(opt.runKey)||trendosTrendMasterRunKeyV1_(now), eventKey=trendosEventKey_('TREND_MASTER_RUN',runKey,trendosBusinessDate_(now),{});
  return trendosWithLock_('script',function(){
    const claim=trendosIdempotencyClaim_(eventKey,{eventType:'TREND_MASTER_RUN',entityId:runKey,businessDate:now,by:trendosHandoverTextV1_(opt.by||'SYSTEM')},{alreadyLocked:true,retryFailed:opt.retryFailed===true});
    if(!claim.claimed){
      const existing=claim.existing||trendosIdempotencyLookup_(eventKey);
      if(claim.failed)return {success:false,duplicate:true,failed:true,runKey,eventKey,message:'محاولة الأتمتة السابقة فشلت؛ يلزم Retry صريح.',result:existing&&existing.result?existing.result:null};
      return {success:true,duplicate:true,inProgress:!!claim.inProgress,runKey,eventKey,result:existing&&existing.result?existing.result:null};
    }
    const run=trendosAutomationRunStart_('runTrendMasterAutomationCoreV1931_',{runKey:runKey,businessDate:now,details:{source:'trendosRunTrendMasterAutomationSafeV1_'}});
    try{
      const result=(typeof opt.runner==='function'?opt.runner():runTrendMasterAutomationCoreV1931_());
      if(result&&result.success===false)throw new Error(result.message||'Trend Master automation returned failure.');
      trendosAutomationRunFinish_(run.runId,{status:'SUCCESS',details:{queued:result&&result.queued||0},rowsCreated:result&&result.queued||0});
      trendosIdempotencyComplete_(eventKey,result,{alreadyLocked:true});
      return Object.assign({success:true,duplicate:false,runKey,eventKey,runId:run.runId},result||{});
    }catch(err){
      trendosAutomationRunFinish_(run.runId,{status:'FAILED',error:err});
      trendosIdempotencyFail_(eventKey,err,{alreadyLocked:true});
      throw err;
    }
  },30000);
}

function trendosHandoverOpsSelfTestV1_(){
  const c=[],q=(n,a,e)=>c.push({name:n,actual:a,expected:e,pass:JSON.stringify(a)===JSON.stringify(e)});
  q('line normalize',trendosNormalizeLineId_('3637-2'),'3637-02');
  const fp1=trendosHandoverStateFingerprintV1_({status:'تحت التنفيذ',blocker:'',nextAction:'طباعة',nextOwner:'وائل',department:'طباعة'}),fp2=trendosHandoverStateFingerprintV1_({department:'طباعة',nextOwner:'وائل',nextAction:'طباعة',blocker:'',status:'تحت التنفيذ'}),fp3=trendosHandoverStateFingerprintV1_({status:'جاهز للاستلام',nextAction:'تسليم',nextOwner:'رحمة',department:'طباعة'});
  q('fingerprint stable',fp1,fp2); q('fingerprint changes',fp1===fp3,false);
  const k1=trendosHandoverEventKeyV1_({businessDate:'2026-08-30',shift:'DAY',employee:'وائل',lineId:'3637-02',stateFingerprint:fp1}),k2=trendosHandoverEventKeyV1_({businessDate:'2026-08-30',shift:'DAY',employee:'وائل',lineId:'3637-02',stateFingerprint:fp1});
  q('event key deterministic',k1,k2);
  return {success:c.every(x=>x.pass),version:TRENDOS_HANDOVER_OPS_VERSION_V1,checks:c};
}
