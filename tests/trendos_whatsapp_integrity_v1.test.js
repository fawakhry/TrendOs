const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=process.argv[2]||process.cwd();
const source=fs.readFileSync(root+'/trendos-whatsapp-integrity-v1.gs','utf8');
const idem=new Map();let metaCalls=0,mode='ok',logged=[],d1Calls=0,feedbackCalls=0;
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
const ctx={console,Date,JSON,Object,Array,String,Number,Math,RegExp,isFinite,isNaN,
  trendosSha256HexV1_(v){return crypto.createHash('sha256').update(String(v)).digest('hex');},trendosNormalizeOrderId_(v){const s=String(v==null?'':v).trim();return /^[A-Za-z0-9_-]+$/.test(s)?s.toUpperCase():'';},
  trendosWithLock_(scope,fn){assert.equal(scope,'script');return fn();},
  trendosIdempotencyLookup_(k){return idem.has(k)?clone(idem.get(k)):null;},
  trendosIdempotencyClaimUnlockedV1_(k,meta,opt={}){const old=idem.get(k);if(old){old.attempts=(old.attempts||1)+1;if(old.status==='FAILED'&&opt.retryFailed){old.status='CLAIMED';old.lastError='';return{claimed:true,duplicate:true,retried:true,rowNumber:old.rowNumber};}return{claimed:false,duplicate:true,completed:old.status==='COMPLETED',inProgress:old.status==='CLAIMED',failed:old.status==='FAILED',existing:clone(old),rowNumber:old.rowNumber};}const rec={eventKey:k,eventType:meta.eventType,entityId:meta.entityId,status:'CLAIMED',attempts:1,rowNumber:idem.size+1,result:null,lastError:''};idem.set(k,rec);return{claimed:true,rowNumber:rec.rowNumber};},
  trendosIdempotencyCompleteUnlockedV1_(k,result,opt={}){const r=idem.get(k);if(!r)throw Error('missing');r.status=opt.failed?'FAILED':'COMPLETED';r.result=clone(result);r.lastError=opt.failed?String(opt.error||''):'';return clone(r);},
  trendosIdempotencyComplete_(k,result){return ctx.trendosIdempotencyCompleteUnlockedV1_(k,result);},
  trendosIdempotencyFail_(k,err){return ctx.trendosIdempotencyCompleteUnlockedV1_(k,{error:String(err.message||err)},{failed:true,error:String(err.message||err)});},
  trendosIdempotencySheetV1_(){return{};},trendosSetV1_(_sh,row,patch){for(const r of idem.values())if(r.rowNumber===row){if(patch['آخر خطأ']!==undefined)r.lastError=patch['آخر خطأ'];}},
  cmPhone_(v){return String(v||'').replace(/\D/g,'');},cmMetaSend_(){metaCalls++;if(mode==='ambiguous')throw Error('تعذر الاتصال بـ WhatsApp Cloud API من Apps Script: timeout');if(mode==='reject')throw Error('WhatsApp Cloud API رفض الإرسال: outside window');if(mode==='config')throw Error('إعداد واتساب غير مكتمل. راجع');return{messages:[{id:'wamid-'+metaCalls}]};},
  cmRisk_(t){return{needsManager:/refund/i.test(t),reason:'risk'};},cmLatestOrderContext_(){return{customerName:'عميل',orderId:'100',orderStatus:'تحت التنفيذ'};},v1932Role_(){return'admin';},
  cmAuth_(){return{ok:true,user:{username:'ضياء',role:'admin'}};},customerManagerV1_(){return{success:true,legacy:true};},v1932Auth_(){return{ok:true,user:{username:'ضياء',role:'admin'}};},customerFeedbackV1_(){return{success:true,legacy:true};},
  cmEnsureAll_(){},ss_(){return{};},CM_SHEET_MESSAGES_V1932:'مدير العملاء - الرسائل',headersMap_(){return{};},appendByHeaders_(){},cmSetByPhone_(){},Utilities:{getUuid(){return'uuid';}},
  cmD1SyncBatchSafe_(){d1Calls++;},
  customerFeedbackWebhookV1_(){feedbackCalls++;return{success:true,handled:1};},
  cfLatestDeliveredEvents_(){return[];},cfOrderPhone_(){return'';},cfSheet_(){throw Error('unused');}
};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'trendos-whatsapp-integrity-v1.gs'});
ctx.trendosWaEnsureMessageLoggedV1_=function(m){const old=logged.find(x=>x.metaId===m.metaId);if(old)return{created:false,duplicatePrevented:true,id:old.id};const x=Object.assign({id:'CM-'+(logged.length+1)},m);logged.push(x);return{created:true,id:x.id};};
ctx.trendosWaEnsureMessageLoggedUnlockedV1_=ctx.trendosWaEnsureMessageLoggedV1_;

let r=ctx.trendosWhatsAppSendExactOnceV1_({phone:'01000000000',text:'hello'});assert.equal(r.requestIdRequired,true);assert.equal(metaCalls,0);
r=ctx.trendosWhatsAppSendExactOnceV1_({requestId:'REQ-1',phone:'01000000000',text:'hello'});assert.equal(r.success,true);assert.equal(r.metaMessageId,'wamid-1');assert.equal(metaCalls,1);
r=ctx.trendosWhatsAppSendExactOnceV1_({requestId:'REQ-1',phone:'01000000000',text:'hello'});assert.equal(r.success,true);assert.equal(r.duplicatePrevented,true);assert.equal(r.result.metaMessageId,'wamid-1');assert.equal(metaCalls,1);
r=ctx.trendosWhatsAppSendExactOnceV1_({requestId:'REQ-1',phone:'01000000000',text:'different'});assert.equal(r.requestReuseMismatch,true);assert.equal(metaCalls,1);
mode='ambiguous';r=ctx.trendosWhatsAppSendExactOnceV1_({requestId:'REQ-2',phone:'01000000000',text:'amb'});assert.equal(r.ambiguousSend,true);assert.equal(metaCalls,2);r=ctx.trendosWhatsAppSendExactOnceV1_({requestId:'REQ-2',phone:'01000000000',text:'amb'});assert.equal(r.retryBlocked,true);assert.equal(metaCalls,2);
mode='reject';r=ctx.trendosWhatsAppSendExactOnceV1_({requestId:'REQ-3',phone:'01000000000',text:'retry'});assert.equal(r.retrySafe,true);assert.equal(metaCalls,3);mode='ok';r=ctx.trendosWhatsAppSendExactOnceV1_({requestId:'REQ-3',phone:'01000000000',text:'retry'});assert.equal(r.success,true);assert.equal(metaCalls,4);

r=ctx.trendosCustomerManagerV1_({parameter:{op:'send',phone:'01000000000',text:'رسالة',clientRequestId:'CM-1'}});assert.equal(r.success,true);assert.equal(logged.length,1);const callsAfterCm=metaCalls;r=ctx.trendosCustomerManagerV1_({parameter:{op:'send',phone:'01000000000',text:'رسالة',clientRequestId:'CM-1'}});assert.equal(r.success,true);assert.equal(r.duplicatePrevented,true);assert.equal(logged.length,1);assert.equal(metaCalls,callsAfterCm);

ctx.trendosWaIncomingDataV1_=function(_value,m){return{phone:'01000000000',customerName:'عميل',orderId:'100',status:'تحت التنفيذ',direction:'in',text:m.text.body,at:new Date(0),source:'WhatsApp Cloud API',sendStatus:'مستلمة',metaId:m.id,needsManager:false,reason:'',byUser:''};};
const p={entry:[{changes:[{value:{contacts:[],messages:[{id:'wamid-IN-1',from:'201000000000',timestamp:'1',text:{body:'5 ممتاز'}}]}}]}]};
const logBefore=logged.length,fbBefore=feedbackCalls;r=ctx.trendosWhatsAppWebhookV1_(p);assert.equal(r.success,true);assert.equal(r.inserted,1);r=ctx.trendosWhatsAppWebhookV1_(p);assert.equal(r.duplicates,1);assert.equal(logged.length,logBefore+1);assert.equal(feedbackCalls,fbBefore+1);

assert.ok(source.includes("trendosWithLock_('script'"));assert.ok(source.includes('WHATSAPP_OUT|'));assert.ok(source.includes('WHATSAPP_IN|'));assert.ok(source.includes('clientRequestId'));assert.ok(source.includes('AMBIGUOUS_SEND'));assert.ok(source.includes('retryFailed:true'));assert.ok(source.includes('trendosCustomerFeedbackScanV1_'));assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(source));
console.log('TrendOS WhatsApp integrity V1 tests: OK');
