/**
 * TrendOS WhatsApp / Webhook Integrity V1
 * PREPARED ONLY - do not deploy blindly.
 * Requires trendos-integrity-v1.gs and the current Customer Manager / Feedback helpers.
 */
const TRENDOS_WHATSAPP_INTEGRITY_VERSION_V1='TRENDOS_WHATSAPP_INTEGRITY_V1_20260830';

function trendosWaTxtV1_(v){return String(v==null?'':v).trim();}
function trendosWaPhoneV1_(v){try{return cmPhone_(v);}catch(e){return trendosWaTxtV1_(v).replace(/\D/g,'');}}
function trendosWaRequestIdV1_(p){p=p||{};return trendosWaTxtV1_(p.clientRequestId||p.requestId||p.idempotencyKey||p.idempotency_key);}
function trendosWaOutKeyV1_(requestId){return'WHATSAPP_OUT|'+trendosWaTxtV1_(requestId);}
function trendosWaInKeyV1_(metaId){return'WHATSAPP_IN|'+trendosWaTxtV1_(metaId);}
function trendosWaFingerprintV1_(phone,text){const raw=trendosWaPhoneV1_(phone)+'\n'+trendosWaTxtV1_(text);return'WA-FP|'+trendosSha256HexV1_(raw).slice(0,40);}
function trendosWaSafeRetryErrorV1_(err){const s=trendosWaTxtV1_(err&&err.message||err);return /إعداد واتساب غير مكتمل|رقم العميل غير موجود أو غير صالح|رقم العميل غير صالح للإرسال|WhatsApp Cloud API رفض الإرسال/.test(s);}
function trendosWaMarkClaimErrorUnlockedV1_(row,error,prefix){if(!row)return;const sh=trendosIdempotencySheetV1_();trendosSetV1_(sh,row,{'آخر خطأ':trendosWaTxtV1_(prefix||'')+trendosWaTxtV1_(error&&error.message||error),'آخر تحديث':new Date()});}

/**
 * Exactly-once automatic-send boundary.
 * CLAIMED means "network result may be unknown" and MUST NOT be auto retried.
 * FAILED is used only when we know Meta did not accept the message and same requestId may retry.
 */
function trendosWhatsAppSendExactOnceV1_(opt){
  opt=opt||{};
  const requestId=trendosWaTxtV1_(opt.requestId),phone=trendosWaPhoneV1_(opt.phone),text=trendosWaTxtV1_(opt.text),by=trendosWaTxtV1_(opt.by||'TrendOS');
  if(!requestId)return{success:false,requestIdRequired:true,message:'clientRequestId مطلوب لإرسال واتساب الآمن.'};
  if(!phone||!text)return{success:false,message:'الهاتف والرسالة مطلوبان.'};
  const eventKey=trendosWaOutKeyV1_(requestId),fingerprint=trendosWaFingerprintV1_(phone,text);
  const gate=trendosWithLock_('script',function(){
    const old=trendosIdempotencyLookup_(eventKey);
    if(old&&trendosWaTxtV1_(old.entityId)&&trendosWaTxtV1_(old.entityId)!==fingerprint){
      return{success:false,requestReuseMismatch:true,message:'نفس clientRequestId استُخدم لمحتوى مختلف؛ تم منع الإرسال.'};
    }
    const claim=trendosIdempotencyClaimUnlockedV1_(eventKey,{eventType:'WHATSAPP_OUT',entityId:fingerprint,businessDate:new Date(),by:by},{retryFailed:true});
    if(!claim.claimed){
      if(claim.completed&&claim.existing&&claim.existing.result){return{success:true,duplicatePrevented:true,alreadySent:true,result:claim.existing.result,eventKey:eventKey};}
      if(claim.inProgress)return{success:false,ambiguousSend:true,retryBlocked:true,eventKey:eventKey,message:'محاولة الإرسال السابقة غير محسومة؛ تم منع إعادة الإرسال تلقائيًا.'};
      return{success:false,retryBlocked:true,eventKey:eventKey,message:'تعذر حجز عملية إرسال واتساب.'};
    }
    return{success:true,claimed:true,eventKey:eventKey,rowNumber:claim.rowNumber};
  },30000);
  if(!gate.success)return gate;
  if(gate.alreadySent){return Object.assign({metaMessageId:gate.result&&gate.result.metaMessageId||'',requestId:requestId},gate);}

  let meta;
  try{
    if(typeof cmMetaSend_!=='function')throw new Error('محرك WhatsApp Cloud API غير متاح.');
    meta=cmMetaSend_(phone,text);
  }catch(err){
    if(trendosWaSafeRetryErrorV1_(err)){
      trendosIdempotencyFail_(eventKey,err);
      return{success:false,retrySafe:true,eventKey:eventKey,requestId:requestId,message:trendosWaTxtV1_(err&&err.message||err)};
    }
    trendosWithLock_('script',function(){trendosWaMarkClaimErrorUnlockedV1_(gate.rowNumber,err,'AMBIGUOUS_SEND: ');},30000);
    return{success:false,ambiguousSend:true,retryBlocked:true,eventKey:eventKey,requestId:requestId,message:'تعذر تأكيد نتيجة الإرسال؛ لن يعيد TrendOS إرسال نفس الطلب تلقائيًا.',error:trendosWaTxtV1_(err&&err.message||err)};
  }
  const mid=meta&&meta.messages&&meta.messages[0]?trendosWaTxtV1_(meta.messages[0].id):'';
  if(!mid){
    trendosWithLock_('script',function(){trendosWaMarkClaimErrorUnlockedV1_(gate.rowNumber,'Meta accepted request without Message ID','AMBIGUOUS_SEND: ');},30000);
    return{success:false,ambiguousSend:true,retryBlocked:true,eventKey:eventKey,requestId:requestId,message:'Meta لم ترجع Message ID؛ تم منع Auto Retry.'};
  }
  const result={requestId:requestId,phone:phone,metaMessageId:mid,sentAt:new Date().toISOString()};
  try{trendosIdempotencyComplete_(eventKey,result);}catch(err){
    return{success:false,sendAccepted:true,ambiguousLedger:true,retryBlocked:true,eventKey:eventKey,requestId:requestId,metaMessageId:mid,message:'Meta قبلت الرسالة لكن تعذر تثبيت سجل idempotency؛ لا تعِد الإرسال.',error:trendosWaTxtV1_(err&&err.message||err)};
  }
  return{success:true,eventKey:eventKey,requestId:requestId,metaMessageId:mid,result:result};
}

function trendosWaMessageSheetV1_(){cmEnsureAll_();const sh=ss_().getSheetByName(CM_SHEET_MESSAGES_V1932);if(!sh)throw new Error('شيت الرسائل غير موجود.');return sh;}
function trendosWaFindMetaRowUnlockedV1_(metaId){
  metaId=trendosWaTxtV1_(metaId);if(!metaId)return 0;const sh=trendosWaMessageSheetV1_();if(sh.getLastRow()<2)return 0;const h=headersMap_(sh),c=h['Meta Message ID'];if(!c)return 0;const vals=sh.getRange(2,c,sh.getLastRow()-1,1).getDisplayValues();for(let i=vals.length-1;i>=0;i--)if(trendosWaTxtV1_(vals[i][0])===metaId)return i+2;return 0;
}
function trendosWaEnsureMessageLoggedUnlockedV1_(m){
  m=m||{};const sh=trendosWaMessageSheetV1_(),metaId=trendosWaTxtV1_(m.metaId),existing=metaId?trendosWaFindMetaRowUnlockedV1_(metaId):0;
  if(existing){const h=headersMap_(sh),idCol=h['ID']||1;return{created:false,duplicatePrevented:true,id:trendosWaTxtV1_(sh.getRange(existing,idCol).getDisplayValue()),rowNumber:existing};}
  const id=trendosWaTxtV1_(m.id)||('CM-'+Utilities.getUuid());
  appendByHeaders_(sh,{
    'ID':id,'الهاتف':trendosWaPhoneV1_(m.phone),'اسم العميل':trendosWaTxtV1_(m.customerName),'رقم الأوردر':trendosWaTxtV1_(m.orderId),
    'الاتجاه':trendosWaTxtV1_(m.direction||'in'),'النص':trendosWaTxtV1_(m.text),'الوقت':m.at||new Date(),'المصدر':trendosWaTxtV1_(m.source||'TrendOS'),
    'حالة الإرسال':trendosWaTxtV1_(m.sendStatus),'Meta Message ID':metaId,'يحتاج مدير؟':m.needsManager?'نعم':'لا','سبب التصعيد':trendosWaTxtV1_(m.reason),'بواسطة':trendosWaTxtV1_(m.by||m.byUser)
  });
  cmSetByPhone_(trendosWaPhoneV1_(m.phone),{
    'اسم العميل':trendosWaTxtV1_(m.customerName),'رقم الأوردر':trendosWaTxtV1_(m.orderId),'الحالة':trendosWaTxtV1_(m.status),'آخر رسالة':trendosWaTxtV1_(m.text),'آخر وقت':m.at||new Date(),
    'آخر اتجاه':trendosWaTxtV1_(m.direction||'in'),'يحتاج مدير؟':m.needsManager?'نعم':'لا','سبب التصعيد':trendosWaTxtV1_(m.reason),'آخر تحديث':new Date(),'آخر رسالة Meta':metaId
  });
  return{created:true,id:id,rowNumber:sh.getLastRow()};
}
function trendosWaEnsureMessageLoggedV1_(m){return trendosWithLock_('script',function(){return trendosWaEnsureMessageLoggedUnlockedV1_(m);},30000);}

function trendosCustomerManagerSendV1_(p,auth){
  p=p||{};const phone=trendosWaPhoneV1_(p.phone),text=trendosWaTxtV1_(p.text),requestId=trendosWaRequestIdV1_(p);
  if(!phone||!text)return{success:false,message:'الهاتف والرسالة مطلوبان.'};
  if(!requestId)return{success:false,requestIdRequired:true,message:'حدّث واجهة مدير العملاء: clientRequestId مطلوب قبل إرسال واتساب.'};
  const risk=cmRisk_(text),ctx=cmLatestOrderContext_(phone);
  if(risk.needsManager&&v1932Role_(auth)!=='admin')return{success:false,message:'الرسالة تتضمن قرارًا حساسًا وتحتاج اعتماد المدير.'};
  const sent=trendosWhatsAppSendExactOnceV1_({requestId:requestId,phone:phone,text:text,by:auth.user.username});
  if(!sent.success)return sent;
  const mid=sent.metaMessageId||(sent.result&&sent.result.metaMessageId)||'';
  const at=new Date(),messageData={phone:phone,customerName:ctx.customerName,orderId:ctx.orderId,status:ctx.orderStatus,direction:'out',text:text,at:at,source:'WhatsApp Cloud API',sendStatus:'تم الإرسال',metaId:mid,needsManager:risk.needsManager,reason:risk.reason,by:auth.user.username,byUser:auth.user.username};
  const logged=trendosWaEnsureMessageLoggedV1_(messageData);messageData.id=logged.id;
  try{cmD1SyncBatchSafe_([messageData],[phone],'OUTGOING WhatsApp Integrity sync');}catch(e){}
  return{success:true,message:'تم إرسال واتساب.',metaMessageId:mid,requestId:requestId,duplicatePrevented:!!sent.duplicatePrevented,logDuplicatePrevented:!!logged.duplicatePrevented};
}
function trendosCustomerManagerV1_(e){
  e=e||{parameter:{}};const p=e.parameter||{},auth=cmAuth_(p);if(!auth.ok)return{success:false,message:auth.message};const op=trendosWaTxtV1_(p.op||'inbox');
  if(op==='send')return trendosCustomerManagerSendV1_(p,auth);
  return customerManagerV1_(e);
}

function trendosWaSinglePayloadV1_(value,m){return{object:'whatsapp_business_account',entry:[{changes:[{value:{contacts:(value&&value.contacts)||[],messages:[m]}}]}]};}
function trendosWaIncomingDataV1_(value,m){
  const phone=trendosWaPhoneV1_(m&&m.from),text=trendosWaTxtV1_(m&&m.text&&m.text.body),metaId=trendosWaTxtV1_(m&&m.id);if(!phone||!text||!metaId)return null;
  const names={};((value&&value.contacts)||[]).forEach(function(c){names[trendosWaTxtV1_(c.wa_id)]=trendosWaTxtV1_(c.profile&&c.profile.name);});
  const ctx=cmLatestOrderContext_(phone),risk=cmRisk_(text),at=new Date(Number(m.timestamp||0)*1000||Date.now());
  return{phone:phone,customerName:names[trendosWaTxtV1_(m.from)]||ctx.customerName,orderId:ctx.orderId,status:ctx.orderStatus,direction:'in',text:text,at:at,source:'WhatsApp Cloud API',sendStatus:'مستلمة',metaId:metaId,needsManager:risk.needsManager,reason:risk.reason,byUser:''};
}
function trendosWaProcessIncomingOneV1_(value,m){
  const data=trendosWaIncomingDataV1_(value,m);if(!data)return{success:true,skipped:true,reason:'UNSUPPORTED_OR_MISSING_META_ID'};
  const eventKey=trendosWaInKeyV1_(data.metaId),single=trendosWaSinglePayloadV1_(value,m);
  const result=trendosWithLock_('script',function(){
    const before=trendosIdempotencyLookup_(eventKey);
    if(before&&before.status==='COMPLETED')return{success:true,duplicatePrevented:true,completed:true,eventKey:eventKey,result:before.result};
    const claim=trendosIdempotencyClaimUnlockedV1_(eventKey,{eventType:'WHATSAPP_IN',entityId:data.metaId,businessDate:data.at,by:'Meta Webhook'},{retryFailed:true});
    if(!claim.claimed&&claim.completed)return{success:true,duplicatePrevented:true,completed:true,eventKey:eventKey,result:claim.existing&&claim.existing.result};
    // A stale CLAIMED event is recoverable here because every local side effect below is itself idempotent.
    let feedback=null;
    try{if(typeof customerFeedbackWebhookV1_==='function')feedback=customerFeedbackWebhookV1_(single);}catch(err){trendosIdempotencyCompleteUnlockedV1_(eventKey,{error:trendosWaTxtV1_(err&&err.message||err)},{failed:true,error:err});throw err;}
    const logged=trendosWaEnsureMessageLoggedUnlockedV1_(data);data.id=logged.id;
    const completed=trendosIdempotencyCompleteUnlockedV1_(eventKey,{metaMessageId:data.metaId,messageId:logged.id,phone:data.phone,feedbackHandled:feedback&&feedback.handled||0});
    return{success:true,eventKey:eventKey,data:data,logged:logged,feedback:feedback,completed:completed};
  },30000);
  if(result.success&&!result.duplicatePrevented&&result.data){try{cmD1SyncBatchSafe_([result.data],[result.data.phone],'INCOMING WhatsApp Integrity sync');}catch(e){}}
  return result;
}
function trendosWhatsAppWebhookV1_(payload){
  let received=0,inserted=0,duplicates=0,skipped=0,failed=0;const errors=[];
  ((payload&&payload.entry)||[]).forEach(function(entry){((entry&&entry.changes)||[]).forEach(function(ch){const value=ch.value||{};((value.messages)||[]).forEach(function(m){received++;try{const r=trendosWaProcessIncomingOneV1_(value,m);if(r.skipped)skipped++;else if(r.duplicatePrevented)duplicates++;else if(r.success){if(r.logged&&r.logged.created)inserted++;else duplicates++;}}catch(err){failed++;errors.push(trendosWaTxtV1_(err&&err.message||err));}});});});
  return{success:failed===0,received:received,inserted:inserted,duplicates:duplicates,skipped:skipped,failed:failed,errors:errors};
}

function trendosFeedbackFindRowUnlockedV1_(orderId){const sh=cfSheet_();if(sh.getLastRow()<2)return 0;const h=headersMap_(sh),c=h['رقم الأوردر'];if(!c)return 0;const vals=sh.getRange(2,c,sh.getLastRow()-1,1).getDisplayValues();for(let i=vals.length-1;i>=0;i--)if(trendosNormalizeOrderId_(vals[i][0])===trendosNormalizeOrderId_(orderId))return i+2;return 0;}
function trendosFeedbackPatchUnlockedV1_(row,patch){const sh=cfSheet_(),h=headersMap_(sh);Object.keys(patch||{}).forEach(function(k){if(h[k])sh.getRange(row,h[k]).setValue(patch[k]);});}
function trendosCustomerFeedbackScanV1_(auth){
  let queued=0,sent=0,failed=0,ambiguous=0;
  cfLatestDeliveredEvents_().forEach(function(ev){
    const orderId=trendosNormalizeOrderId_(ev.orderId);if(!orderId)return;const phone=cfOrderPhone_(orderId);if(!phone)return;
    const reservation=trendosWithLock_('script',function(){
      const old=trendosFeedbackFindRowUnlockedV1_(orderId);if(old)return{created:false,rowNumber:old};
      const sh=cfSheet_(),id='FB-'+trendosSha256HexV1_('FEEDBACK|'+orderId).slice(0,8).toUpperCase(),now=new Date();
      appendByHeaders_(sh,{'ID':id,'رقم الأوردر':orderId,'اسم العميل':ev.customer,'الهاتف':phone,'وقت التسليم':ev.at,'وقت طلب التقييم':now,'حالة الطلب':'SENDING','التقييم':'','ملاحظة العميل':'','وقت الرد':'','يحتاج متابعة؟':'لا','حالة المتابعة':'','مسؤول المتابعة':'','آخر تحديث':now});
      return{created:true,rowNumber:sh.getLastRow(),id:id};
    },30000);
    if(!reservation.created)return;
    queued++;
    const requestId='FEEDBACK_REQUEST|'+orderId;
    const text='رأيك يهمنا 🌟\nتم تسليم الأوردر رقم '+orderId+'.\nقيّم تجربتك مع Trend Mall من 1 إلى 5.\nولو عندك ملاحظة اكتبها بعد الرقم، مثال: 4 الخدمة ممتازة';
    const out=trendosWhatsAppSendExactOnceV1_({requestId:requestId,phone:phone,text:text,by:auth&&auth.user&&auth.user.username||'TrendOS'});
    trendosWithLock_('script',function(){
      const row=trendosFeedbackFindRowUnlockedV1_(orderId);if(!row)return;
      if(out.success){trendosFeedbackPatchUnlockedV1_(row,{'حالة الطلب':'تم الإرسال','آخر تحديث':new Date()});sent++;}
      else if(out.ambiguousSend||out.ambiguousLedger){trendosFeedbackPatchUnlockedV1_(row,{'حالة الطلب':'غير محسوم - لا تعِد الإرسال تلقائيًا','آخر تحديث':new Date()});ambiguous++;}
      else{trendosFeedbackPatchUnlockedV1_(row,{'حالة الطلب':'فشل الإرسال - مراجعة يدوية','آخر تحديث':new Date()});failed++;}
    },30000);
  });
  return{success:true,queued:queued,sent:sent,failed:failed,ambiguous:ambiguous};
}
function trendosCustomerFeedbackV1_(e){
  e=e||{parameter:{}};const p=e.parameter||{},auth=v1932Auth_(p);if(!auth.ok)return{success:false,message:auth.message};if(!p.op||p.op==='scan')return trendosCustomerFeedbackScanV1_(auth);return customerFeedbackV1_(e);
}
