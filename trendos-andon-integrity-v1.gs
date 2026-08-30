/** TrendOS ANDON Integrity V1 — GitHub checkpoint only. Requires handover/OPS module. */
const TRENDOS_ANDON_INTEGRITY_VERSION_V1='TRENDOS_ANDON_INTEGRITY_V1_20260830';
function trendosSaveAndonV1_(input,opt){
  input=input||{};opt=opt||{};
  return trendosWithLock_('script',function(){
    const requestId=trendosHandoverTextV1_(input.requestId),employee=trendosHandoverTextV1_(input.employee),department=trendosHandoverTextV1_(input.department),reason=trendosHandoverTextV1_(input.reason),details=trendosHandoverTextV1_(input.details),businessDate=trendosBusinessDate_(input.businessDate||new Date());
    if(!requestId||!employee||!reason)throw new Error('requestId والموظف وسبب طلب المساعدة مطلوبون.');
    let lineId='',orderId=trendosNormalizeOrderId_(input.orderId||'');
    if(input.lineId){const line=trendosHandoverActiveLineLookupV1_(input.lineId,opt);lineId=line.lineId;if(orderId&&orderId!==line.orderId)throw new Error('Order ID لا يطابق Line ID.');orderId=orderId||line.orderId;}
    const sh=trendosOpsEventsSheetV1_(),existingReq=trendosOpsFindByRequestIdV1_(sh,requestId);
    if(existingReq)return{success:true,duplicate:true,replayed:true,eventId:trendosHandoverValueV1_(sh,existingReq,'Event ID'),requestId,rowNumber:existingReq};
    const stateFingerprint=trendosHandoverHashV1_(trendosHandoverStableJsonV1_({reason:reason,details:details,orderId:orderId,lineId:lineId,department:department}));
    const key=trendosEventKey_('ANDON',lineId||orderId||requestId,businessDate,{employee:trendosHandoverSearchKeyV1_(employee),stateFingerprint:stateFingerprint}),now=new Date(),id='ANDON-'+Utilities.getUuid().slice(0,8).toUpperCase();
    const evidence={source:'ANDON',reason:reason,details:details,orderId:orderId,lineId:lineId,employee:employee,department:department};
    const row=trendosHandoverAppendV1_(sh,{'Event ID':id,'وقت الإنشاء':now,'نوع الحدث':'ANDON','Request ID':requestId,'الموظف':employee,'القسم':department,'رقم الأوردر':orderId,'Line ID':lineId,'تاريخ العمل':businessDate,'State Fingerprint':stateFingerprint,'المحتوى':reason+(details?' | '+details:''),'Evidence JSON':trendosHandoverStableJsonV1_(evidence),'Coach Note ID':'','Followed Up At':'','الحالة':'OPEN','مفتاح الحدث':key,'آخر تحديث':now},TRENDOS_OPS_EVENT_HEADERS_V1);
    return{success:true,duplicate:false,eventId:id,requestId,eventKey:key,rowNumber:row,lineId:lineId,orderId:orderId};
  },30000);
}
function trendosResolveOpsEventV1_(input){
  input=input||{};
  return trendosWithLock_('script',function(){
    const eventId=trendosHandoverTextV1_(input.eventId),by=trendosHandoverTextV1_(input.by),note=trendosHandoverTextV1_(input.note);if(!eventId||!by)throw new Error('Event ID والمسؤول عن الحل مطلوبان.');
    const sh=trendosOpsEventsSheetV1_(),row=trendosFindKeyRowV1_(sh,'Event ID',eventId);if(!row)throw new Error('OPS event غير موجود.');
    const status=trendosHandoverTextV1_(trendosHandoverValueV1_(sh,row,'الحالة'));if(status==='RESOLVED')return{success:true,duplicate:true,eventId:eventId};
    const now=new Date(),oldEvidence=trendosHandoverTextV1_(trendosHandoverValueV1_(sh,row,'Evidence JSON'));let evidence={};try{evidence=oldEvidence?JSON.parse(oldEvidence):{};}catch(e){evidence={raw:oldEvidence};}evidence.resolvedBy=by;evidence.resolutionNote=note;evidence.resolvedAt=now.toISOString();
    trendosHandoverSetV1_(sh,row,{'الحالة':'RESOLVED','Evidence JSON':trendosHandoverStableJsonV1_(evidence),'آخر تحديث':now});return{success:true,duplicate:false,eventId:eventId,resolvedBy:by,resolvedAt:now};
  },30000);
}
function trendosAndonOpenEventsV1_(){
  const sh=trendosExistingSheetV1_(TRENDOS_OPS_EVENTS_SHEET_V1);if(!sh||sh.getLastRow()<2)return[];const m=trendosHeaderMapV1_(sh),vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(),out=[];
  vals.forEach(function(r,i){const type=m['نوع الحدث']?trendosHandoverTextV1_(r[m['نوع الحدث']-1]):'',status=m['الحالة']?trendosHandoverTextV1_(r[m['الحالة']-1]):'';if(type!=='ANDON'||status==='RESOLVED')return;out.push({rowNumber:i+2,eventId:m['Event ID']?trendosHandoverTextV1_(r[m['Event ID']-1]):'',employee:m['الموظف']?trendosHandoverTextV1_(r[m['الموظف']-1]):'',orderId:m['رقم الأوردر']?trendosNormalizeOrderId_(r[m['رقم الأوردر']-1]):'',lineId:m['Line ID']?trendosNormalizeLineId_(r[m['Line ID']-1]):'',status:status});});return out;
}
