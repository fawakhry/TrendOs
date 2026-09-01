/**
 * TrendOS Press Integrity V1
 * GitHub checkpoint only. Requires trendos-integrity-v1.gs.
 * DO NOT deploy blindly.
 */
const TRENDOS_PRESS_INTEGRITY_VERSION_V1 = 'TRENDOS_PRESS_INTEGRITY_V1_20260830';
const TRENDOS_PRESS_DISPLAY_SHEET_V1 = 'تشغيل - جلسات المكبس';
const TRENDOS_PRESS_SETTINGS_SHEET_V1 = 'تشغيل - إعدادات المكبس';
const TRENDOS_PRESS_META_SHEET_V1 = 'تشغيل - تكامل جلسات المكبس V1';
const TRENDOS_PRESS_ITEMS_SHEET_V1 = 'تشغيل - بنود جلسات المكبس V1';
const TRENDOS_PRESS_LINES_SHEET_V1 = 'بنود الأوردرات';
const TRENDOS_PRESS_META_HEADERS_V1 = [
  'Session ID','تاريخ العمل','الحالة','المشغل','الداعم','موعد التشغيل الثابت','وقت البداية','وقت القفل',
  'Queue Lines Start','Queue Orders Start','Queue Lines End','Queue Orders End','Completed Lines','Completed Orders',
  'قدرة المكبس kW','استهلاك kWh','تعريفة الكهرباء جنيه/kWh','تكلفة الكهرباء','تكلفة كهرباء/أوردر',
  'Snapshot Hash','Snapshot JSON','Stop Payload JSON','Result JSON','آخر خطأ','آخر تحديث'
];
const TRENDOS_PRESS_ITEM_HEADERS_V1 = [
  'Session ID','تاريخ العمل','Order ID','Line ID','العميل','الأولوية','الحالة عند البداية','الحالة عند القفل','تم في الجلسة؟','وقت القفل','ملاحظات'
];

function trendosPressTextV1_(v){return String(v==null?'':v).trim();}
function trendosPressNormV1_(v){return trendosPressTextV1_(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه');}
function trendosPressNumV1_(v){const n=Number(v);return isFinite(n)?n:0;}
function trendosPressHeadersV1_(sheet){return sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(trendosPressTextV1_);}
function trendosPressHeaderIndicesV1_(headers,aliases){
  const out=[];aliases.forEach(function(a){headers.forEach(function(h,i){if(h===a&&out.indexOf(i)===-1)out.push(i);});});return out;
}
function trendosPressCandidateValueV1_(row,indices,normalizer){
  const vals=[];indices.forEach(function(i){const raw=row[i],txt=trendosPressTextV1_(raw);if(txt)vals.push({raw:raw,text:txt,index:i});});
  if(!vals.length)return{value:'',conflict:false,values:[]};
  const norm=normalizer||trendosPressTextV1_,normalized=[];
  vals.forEach(function(x){const v=norm(x.raw);if(v&&normalized.indexOf(v)===-1)normalized.push(v);});
  return{value:vals[0].raw,conflict:normalized.length>1,values:normalized};
}
function trendosPressLineCandidateV1_(row,displayRow,indices){
  const normalized=[];
  (indices||[]).forEach(function(i){
    const raw=row&&row[i],shown=displayRow&&displayRow[i];
    const id=typeof trendosLineIdFromSheetCellV1_==='function'
      ?trendosLineIdFromSheetCellV1_(raw,shown)
      :trendosNormalizeLineId_(raw);
    if(id&&normalized.indexOf(id)===-1)normalized.push(id);
  });
  return{value:normalized[0]||'',conflict:normalized.length>1,values:normalized};
}
function trendosPressSettingsV1_(){
  const out={};const sh=ss_().getSheetByName(TRENDOS_PRESS_SETTINGS_SHEET_V1);if(!sh||sh.getLastRow()<2)return out;
  const rows=sh.getRange(2,1,sh.getLastRow()-1,Math.min(4,sh.getLastColumn())).getValues();
  rows.forEach(function(r){const k=trendosPressTextV1_(r[0]),enabled=trendosPressNormV1_(r[3]);if(!k)return;if(enabled&&['لا','no','false','0','off'].indexOf(enabled)!==-1)return;out[k]=r[1];});
  return out;
}
function trendosPressConfigV1_(){
  const s=trendosPressSettingsV1_();
  return{
    fixedStart:trendosPressTextV1_(s.PRESS_FIXED_START||s.PRESS_BATCH_START)||'17:00',
    graceMinutes:Math.max(0,trendosPressNumV1_(s.PRESS_START_GRACE_MINUTES||s.PRESS_GRACE_MINUTES||15)),
    primary:trendosPressTextV1_(s.PRESS_PRIMARY||s.PRESS_PRIMARY_OPERATOR)||'ريفان',
    support:trendosPressTextV1_(s.PRESS_SUPPORT||s.PRESS_SUPPORT_OPERATOR)||'وائل',
    powerKw:trendosPressTextV1_(s.PRESS_POWER_KW),
    rate:trendosPressTextV1_(s.ELECTRICITY_RATE_EGP_KWH)
  };
}
function trendosPressAuthV1_(p){
  const a=authorize_(p.username,p.token);if(!a.ok)return a;const cfg=trendosPressConfigV1_(),key=trendosPressNormV1_((a.user.username||a.user.name||'')+' '+(a.user.role||''));
  const allowed=key.indexOf('ضياء')!==-1||key.indexOf('diaa')!==-1||key.indexOf(trendosPressNormV1_(cfg.primary))!==-1||key.indexOf(trendosPressNormV1_(cfg.support))!==-1||trendosPressNormV1_(a.user.role)==='admin';
  return allowed?a:{ok:false,message:'تشغيل المكبس متاح للمشغلين المعتمدين والإدارة فقط.'};
}
function trendosPressClosedStatusV1_(status){
  const s=trendosPressTextV1_(status);return['تم التسليم','جاهز للاستلام','تم التنفيذ','ملغى','ملغي','مكرر'].indexOf(s)!==-1;
}
function trendosPressHeatFlagV1_(v){const s=trendosPressNormV1_(v);return s==='نعم'||s==='yes'||s==='true'||s==='1'||s.indexOf('مكبس')!==-1;}
function trendosPressQueueV1_(){
  const sh=ss_().getSheetByName(TRENDOS_PRESS_LINES_SHEET_V1);if(!sh||sh.getLastRow()<2)return{count:0,orderCount:0,urgent:0,items:[],integrityErrors:[]};
  const headers=trendosPressHeadersV1_(sh),idx={
    order:trendosPressHeaderIndicesV1_(headers,['رقم الأوردر','Order ID','كود الأوردر']),
    line:trendosPressHeaderIndicesV1_(headers,['رقم البند','Line ID']),
    customer:trendosPressHeaderIndicesV1_(headers,['اسم الشات / المكتب','اسم العميل','Customer Name']),
    dept:trendosPressHeaderIndicesV1_(headers,['القسم','Department']),
    press:trendosPressHeaderIndicesV1_(headers,['مكبس حراري','مكبس','مكبس؟','Press','Heat Press']),
    status:trendosPressHeaderIndicesV1_(headers,['الحالة','Status']),
    priority:trendosPressHeaderIndicesV1_(headers,['الأولوية','Priority'])
  };
  if(!idx.order.length||!idx.line.length||!idx.status.length)throw new Error('Press queue requires Order ID, Line ID and Status columns.');
  const range=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()),data=range.getValues(),display=range.getDisplayValues(),items=[],errors=[],seen={};
  data.forEach(function(row,i){
    const dept=trendosPressTextV1_(trendosPressCandidateValueV1_(row,idx.dept).value),flag=trendosPressCandidateValueV1_(row,idx.press).value,status=trendosPressTextV1_(trendosPressCandidateValueV1_(row,idx.status).value);
    if(trendosPressClosedStatusV1_(status))return;if(!(trendosPressNormV1_(dept).indexOf('مكبس')!==-1||trendosPressHeatFlagV1_(flag)))return;
    const orderRaw=trendosPressCandidateValueV1_(row,idx.order,trendosNormalizeOrderId_),lineRaw=trendosPressLineCandidateV1_(row,display[i],idx.line);
    const orderId=trendosNormalizeOrderId_(orderRaw.value),lineId=lineRaw.value;
    if(orderRaw.conflict)errors.push({rowNumber:i+2,type:'ORDER_ID_CONFLICT',values:orderRaw.values});
    if(lineRaw.conflict)errors.push({rowNumber:i+2,type:'LINE_ID_CONFLICT',values:lineRaw.values});
    if(!orderId||!lineId){errors.push({rowNumber:i+2,type:'INVALID_PRESS_ID',orderId:orderId,lineId:lineId});return;}
    if(seen[lineId]){errors.push({rowNumber:i+2,type:'DUPLICATE_PRESS_LINE_ID',lineId:lineId,firstRow:seen[lineId]});return;}seen[lineId]=i+2;
    const customer=trendosPressTextV1_(trendosPressCandidateValueV1_(row,idx.customer).value),priority=trendosPressTextV1_(trendosPressCandidateValueV1_(row,idx.priority).value);
    items.push({rowNumber:i+2,orderId:orderId,lineId:lineId,customer:customer,status:status,priority:priority});
  });
  const orders={};items.forEach(function(x){orders[x.orderId]=1;});
  return{count:items.length,orderCount:Object.keys(orders).length,urgent:items.filter(function(x){const p=trendosPressNormV1_(x.priority);return p.indexOf('عاجل')!==-1||p==='vip';}).length,items:items,integrityErrors:errors};
}
function trendosPressMetaSheetV1_(){return trendosEnsureSheetV1_(TRENDOS_PRESS_META_SHEET_V1,TRENDOS_PRESS_META_HEADERS_V1);}
function trendosPressItemsSheetV1_(){return trendosEnsureSheetV1_(TRENDOS_PRESS_ITEMS_SHEET_V1,TRENDOS_PRESS_ITEM_HEADERS_V1);}
function trendosPressMapV1_(sh){return trendosHeaderMapV1_(sh);}
function trendosPressFindMetaV1_(sessionId){
  const sh=trendosPressExistingSheetV1_(TRENDOS_PRESS_META_SHEET_V1);if(!sh)return null;const row=trendosFindKeyRowV1_(sh,'Session ID',sessionId);if(!row)return null;const m=trendosPressMapV1_(sh);
  function g(h){return trendosGetV1_(sh,row,m,h);}let snapshot=[],stopPayload=null,result=null;try{snapshot=JSON.parse(trendosPressTextV1_(g('Snapshot JSON'))||'[]');}catch(e){}try{stopPayload=JSON.parse(trendosPressTextV1_(g('Stop Payload JSON'))||'null');}catch(e){}try{result=JSON.parse(trendosPressTextV1_(g('Result JSON'))||'null');}catch(e){}
  return{sheet:sh,rowNumber:row,sessionId:trendosPressTextV1_(g('Session ID')),businessDate:trendosPressTextV1_(g('تاريخ العمل')),status:trendosPressTextV1_(g('الحالة')),operator:trendosPressTextV1_(g('المشغل')),support:trendosPressTextV1_(g('الداعم')),fixedStart:trendosPressTextV1_(g('موعد التشغيل الثابت')),startedAt:g('وقت البداية'),endedAt:g('وقت القفل'),queueLinesStart:Number(g('Queue Lines Start')||0),queueOrdersStart:Number(g('Queue Orders Start')||0),queueLinesEnd:Number(g('Queue Lines End')||0),queueOrdersEnd:Number(g('Queue Orders End')||0),completedLines:Number(g('Completed Lines')||0),completedOrders:Number(g('Completed Orders')||0),powerKw:g('قدرة المكبس kW'),kwh:g('استهلاك kWh'),rate:g('تعريفة الكهرباء جنيه/kWh'),cost:g('تكلفة الكهرباء'),costPerOrder:g('تكلفة كهرباء/أوردر'),snapshotHash:trendosPressTextV1_(g('Snapshot Hash')),snapshot:snapshot,stopPayload:stopPayload,result:result,lastError:trendosPressTextV1_(g('آخر خطأ'))};
}
function trendosPressExistingSheetV1_(name){return ss_().getSheetByName(name)||null;}
function trendosPressOpenMetaRowsV1_(){
  const sh=trendosPressExistingSheetV1_(TRENDOS_PRESS_META_SHEET_V1);if(!sh||sh.getLastRow()<2)return[];const m=trendosPressMapV1_(sh),cStatus=m['الحالة'],cId=m['Session ID'];if(!cStatus||!cId)return[];
  const data=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(),out=[];data.forEach(function(r,i){const s=trendosPressTextV1_(r[cStatus-1]);if(['OPENING','OPEN','CLOSING'].indexOf(s)!==-1)out.push(trendosPressFindMetaV1_(trendosPressTextV1_(r[cId-1])));});return out.filter(Boolean);
}
function trendosPressSnapshotHashV1_(items){return trendosSha256HexV1_(trendosStableJsonV1_(items||[]));}
function trendosPressCreateMetaV1_(auth,queue,cfg,dateKey){
  const sh=trendosPressMetaSheetV1_(),id='PRESS-'+Utilities.getUuid(),now=new Date(),snapshot=queue.items.map(function(x){return{orderId:x.orderId,lineId:x.lineId,customer:x.customer,status:x.status,priority:x.priority};});
  const values={'Session ID':id,'تاريخ العمل':dateKey,'الحالة':'OPENING','المشغل':trendosPressTextV1_(auth.user.username||auth.user.name),'الداعم':cfg.support,'موعد التشغيل الثابت':cfg.fixedStart,'وقت البداية':now,'Queue Lines Start':queue.count,'Queue Orders Start':queue.orderCount,'قدرة المكبس kW':cfg.powerKw,'تعريفة الكهرباء جنيه/kWh':cfg.rate,'Snapshot Hash':trendosPressSnapshotHashV1_(snapshot),'Snapshot JSON':JSON.stringify(snapshot),'آخر تحديث':now};
  trendosAppendV1_(sh,values,TRENDOS_PRESS_META_HEADERS_V1);if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();return trendosPressFindMetaV1_(id);
}
function trendosPressItemKeyV1_(sessionId,lineId){return sessionId+'|'+lineId;}
function trendosPressEnsureItemsV1_(meta){
  const sh=trendosPressItemsSheetV1_(),m=trendosPressMapV1_(sh),existing={};if(sh.getLastRow()>1){const data=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();data.forEach(function(r){const sid=trendosPressTextV1_(r[m['Session ID']-1]),lid=trendosNormalizeLineId_(r[m['Line ID']-1]);if(sid&&lid)existing[trendosPressItemKeyV1_(sid,lid)]=1;});}
  (meta.snapshot||[]).forEach(function(x){const key=trendosPressItemKeyV1_(meta.sessionId,x.lineId);if(existing[key])return;trendosAppendV1_(sh,{'Session ID':meta.sessionId,'تاريخ العمل':meta.businessDate,'Order ID':x.orderId,'Line ID':x.lineId,'العميل':x.customer,'الأولوية':x.priority,'الحالة عند البداية':x.status,'تم في الجلسة؟':'لا'},TRENDOS_PRESS_ITEM_HEADERS_V1);existing[key]=1;});
}
function trendosPressDisplaySheetV1_(){
  const sh=ss_().getSheetByName(TRENDOS_PRESS_DISPLAY_SHEET_V1);if(!sh)throw new Error('شيت جلسات المكبس غير موجود.');const headers=trendosPressHeadersV1_(sh),required=['Session ID','التاريخ','المشغل','بداية فعلية','قفل فعلي','Queue عند البداية','Queue عند القفل','عدد الأوردرات المكبوسة','الحالة / ملاحظات'];required.forEach(function(h){if(headers.indexOf(h)===-1)throw new Error('Press display schema missing: '+h);});return sh;
}
function trendosPressUpsertDisplayV1_(meta,patch){
  const sh=trendosPressDisplaySheetV1_(),h=trendosPressMapV1_(sh),row=trendosFindKeyRowV1_(sh,'Session ID',meta.sessionId),values=Object.assign({'Session ID':meta.sessionId,'التاريخ':meta.businessDate,'المشغل':meta.operator,'الداعم':meta.support,'موعد التشغيل الثابت':meta.fixedStart,'بداية فعلية':meta.startedAt,'Queue عند البداية':meta.queueLinesStart},patch||{});
  if(row)trendosSetV1_(sh,row,values);else trendosAppendV1_(sh,values,trendosPressHeadersV1_(sh));
}
function trendosPressRepairOpenV1_(meta){trendosPressEnsureItemsV1_(meta);trendosPressUpsertDisplayV1_(meta,{'الحالة / ملاحظات':'شغال'});trendosSetV1_(meta.sheet,meta.rowNumber,{'الحالة':'OPEN','آخر خطأ':'','آخر تحديث':new Date()});if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();return trendosPressFindMetaV1_(meta.sessionId);}
function trendosPressStartUnlockedV1_(auth){
  const open=trendosPressOpenMetaRowsV1_();if(open.length>1)return{success:false,integrityError:true,multipleOpenSessions:true,sessions:open.map(function(x){return x.sessionId;}),message:'Integrity Error: يوجد أكثر من Session مكبس مفتوحة.'};
  if(open.length===1){const existing=open[0];if(existing.status==='CLOSING')return{success:true,alreadyOpen:true,closing:true,session:trendosPressSessionResponseV1_(existing),queue:trendosPressQueueV1_()};const meta=existing.status==='OPENING'?trendosPressRepairOpenV1_(existing):existing;return{success:true,alreadyOpen:true,session:trendosPressSessionResponseV1_(meta),queue:trendosPressQueueV1_()};}
  const queue=trendosPressQueueV1_();if(queue.integrityErrors.length)return{success:false,integrityError:true,queue:queue,message:'لا يمكن فتح جلسة المكبس لأن Queue تحتوي Line/Order IDs غير قابلة للتتبع.'};
  const cfg=trendosPressConfigV1_(),dateKey=trendosBusinessDate_(new Date()),meta=trendosPressCreateMetaV1_(auth,queue,cfg,dateKey);return{success:true,alreadyOpen:false,session:trendosPressSessionResponseV1_(trendosPressRepairOpenV1_(meta)),queue:queue};
}
function trendosPressParseLineIdsV1_(v){
  let a=[];if(Array.isArray(v))a=v;else{const s=trendosPressTextV1_(v);if(!s)return[];try{const p=JSON.parse(s);a=Array.isArray(p)?p:String(s).split(/[\s,;]+/);}catch(e){a=s.split(/[\s,;]+/);}}
  const out=[];a.forEach(function(x){const id=trendosNormalizeLineId_(x);if(id&&out.indexOf(id)===-1)out.push(id);});return out.sort();
}
function trendosPressLineStatesV1_(lineIds){
  const want={};(lineIds||[]).forEach(function(id){want[id]=1;});const out={};if(!Object.keys(want).length)return out;const sh=ss_().getSheetByName(TRENDOS_PRESS_LINES_SHEET_V1);if(!sh||sh.getLastRow()<2)return out;
  const headers=trendosPressHeadersV1_(sh),iLine=trendosPressHeaderIndicesV1_(headers,['رقم البند','Line ID']),iStatus=trendosPressHeaderIndicesV1_(headers,['الحالة','Status']),range=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()),data=range.getValues(),display=range.getDisplayValues();
  data.forEach(function(r,i){const lid=trendosPressLineCandidateV1_(r,display[i],iLine).value;if(!want[lid])return;const status=trendosPressTextV1_(trendosPressCandidateValueV1_(r,iStatus).value);if(!out[lid]||status!=='مكرر')out[lid]=status;});return out;
}
function trendosPressValidateStopPayloadV1_(meta,p){
  let ids=trendosPressParseLineIdsV1_(p.completedLineIds||p.lineIds||'');
  if(meta.status==='CLOSING'&&meta.stopPayload){const stored=trendosPressParseLineIdsV1_(meta.stopPayload.completedLineIds||[]);if(ids.length&&JSON.stringify(ids)!==JSON.stringify(stored))return{ok:false,conflict:true,message:'Stop retry payload does not match the checkpointed stop payload.'};ids=stored;}
  const snapshotMap={};(meta.snapshot||[]).forEach(function(x){snapshotMap[x.lineId]=x;});const invalid=ids.filter(function(id){return!snapshotMap[id];});if(invalid.length)return{ok:false,invalidLineIds:invalid,message:'Completed Line IDs must be a subset of the session start snapshot.'};
  const submitted=trendosPressNumV1_(p.ordersPressed);if(!ids.length&&submitted>0)return{ok:false,lineIdsRequired:true,message:'لا يمكن تسجيل أوردرات مكبوسة بالعدد فقط. أرسل Line IDs المكتملة لتتبع الجلسة.'};
  const orders={};ids.forEach(function(id){orders[snapshotMap[id].orderId]=1;});if(submitted>0&&submitted!==Object.keys(orders).length)return{ok:false,countMismatch:true,submittedOrders:submitted,derivedOrders:Object.keys(orders).length,message:'عدد الأوردرات لا يطابق Line IDs المكتملة.'};
  return{ok:true,completedLineIds:ids,completedOrders:Object.keys(orders).length};
}
function trendosPressCheckpointClosingV1_(meta,validated){
  if(meta.status==='CLOSING')return meta;trendosSetV1_(meta.sheet,meta.rowNumber,{'الحالة':'CLOSING','Stop Payload JSON':JSON.stringify({completedLineIds:validated.completedLineIds}),'آخر تحديث':new Date()});if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();return trendosPressFindMetaV1_(meta.sessionId);
}
function trendosPressCloseItemsV1_(meta,completedIds,end){
  const sh=trendosPressItemsSheetV1_(),m=trendosPressMapV1_(sh),done={},states=trendosPressLineStatesV1_((meta.snapshot||[]).map(function(x){return x.lineId;}));completedIds.forEach(function(x){done[x]=1;});if(sh.getLastRow()<2)return;
  const data=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();data.forEach(function(r,i){const sid=trendosPressTextV1_(r[m['Session ID']-1]),lid=trendosNormalizeLineId_(r[m['Line ID']-1]);if(sid!==meta.sessionId||!lid)return;trendosSetV1_(sh,i+2,{'الحالة عند القفل':states[lid]||'','تم في الجلسة؟':done[lid]?'نعم':'لا','وقت القفل':end});});
}
function trendosPressEnergyV1_(meta,end,completedOrders){
  const start=new Date(meta.startedAt),minutes=isNaN(start.getTime())?0:Math.max(1,Math.round((end.getTime()-start.getTime())/60000)),power=trendosPressNumV1_(meta.powerKw),rate=trendosPressNumV1_(meta.rate);
  const kwh=power>0?Number((power*minutes/60).toFixed(3)):'',cost=(power>0&&rate>0)?Number((power*minutes/60*rate).toFixed(2)):'',cpo=(completedOrders>0&&cost!=='')?Number((cost/completedOrders).toFixed(2)):'';
  return{minutes:minutes,power:power>0?power:'',rate:rate>0?rate:'',kwh:kwh,cost:cost,costPerOrder:cpo};
}
function trendosPressFinishClosingV1_(meta,validated){
  const end=meta.endedAt instanceof Date?meta.endedAt:new Date(),queueEnd=trendosPressQueueV1_();if(queueEnd.integrityErrors.length)return{success:false,integrityError:true,queue:queueEnd,message:'Queue الحالية بها IDs غير قابلة للتتبع؛ لم يتم إغلاق الجلسة.'};
  trendosPressEnsureItemsV1_(meta);trendosPressCloseItemsV1_(meta,validated.completedLineIds,end);const energy=trendosPressEnergyV1_(meta,end,validated.completedOrders),result={sessionId:meta.sessionId,endedAt:end,completedLineIds:validated.completedLineIds,completedLines:validated.completedLineIds.length,completedOrders:validated.completedOrders,queueLinesEnd:queueEnd.count,queueOrdersEnd:queueEnd.orderCount,durationMinutes:energy.minutes,powerKw:energy.power,kwh:energy.kwh,rate:energy.rate,cost:energy.cost,costPerOrder:energy.costPerOrder};
  trendosPressUpsertDisplayV1_(meta,{'قفل فعلي':end,'مدة التشغيل - دقيقة':energy.minutes,'Queue عند القفل':queueEnd.count,'عدد الأوردرات المكبوسة':validated.completedOrders,'دقيقة/أوردر':validated.completedOrders>0?Number((energy.minutes/validated.completedOrders).toFixed(2)):'','قدرة المكبس kW':energy.power,'استهلاك تقديري kWh':energy.kwh,'تعريفة الكهرباء جنيه/kWh':energy.rate,'تكلفة كهرباء تقديرية':energy.cost,'تكلفة كهرباء/أوردر':energy.costPerOrder,'الحالة / ملاحظات':energy.cost===''?'مقفول — تكلفة الكهرباء غير محسوبة لعدم وجود إعداد معتمد':'مقفول'});
  trendosSetV1_(meta.sheet,meta.rowNumber,{'الحالة':'CLOSED','وقت القفل':end,'Queue Lines End':queueEnd.count,'Queue Orders End':queueEnd.orderCount,'Completed Lines':validated.completedLineIds.length,'Completed Orders':validated.completedOrders,'استهلاك kWh':energy.kwh,'تكلفة الكهرباء':energy.cost,'تكلفة كهرباء/أوردر':energy.costPerOrder,'Result JSON':JSON.stringify(result),'آخر خطأ':'','آخر تحديث':end});if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();return{success:true,alreadyClosed:false,session:trendosPressSessionResponseV1_(trendosPressFindMetaV1_(meta.sessionId)),result:result,queue:queueEnd};
}
function trendosPressStopUnlockedV1_(p){
  const sessionId=trendosPressTextV1_(p.sessionId);if(!sessionId)return{success:false,sessionIdRequired:true,message:'Session ID مطلوب لإغلاق المكبس بشكل idempotent.'};const meta=trendosPressFindMetaV1_(sessionId);if(!meta)return{success:false,message:'Session المكبس غير موجودة.'};
  if(meta.status==='CLOSED')return{success:true,alreadyClosed:true,session:trendosPressSessionResponseV1_(meta),result:meta.result||null};if(['OPEN','OPENING','CLOSING'].indexOf(meta.status)===-1)return{success:false,integrityError:true,message:'حالة Session غير صالحة للإغلاق: '+meta.status};
  if(meta.status==='OPENING')trendosPressRepairOpenV1_(meta);const current=trendosPressFindMetaV1_(sessionId),validated=trendosPressValidateStopPayloadV1_(current,p);if(!validated.ok)return Object.assign({success:false},validated);const closing=trendosPressCheckpointClosingV1_(current,validated);return trendosPressFinishClosingV1_(closing,validated);
}
function trendosPressSessionResponseV1_(meta){if(!meta)return null;return{sessionId:meta.sessionId,businessDate:meta.businessDate,status:meta.status,operator:meta.operator,support:meta.support,fixedStart:meta.fixedStart,startedAt:meta.startedAt,endedAt:meta.endedAt,queueStart:meta.queueLinesStart,queueOrdersStart:meta.queueOrdersStart,completedLines:meta.completedLines,completedOrders:meta.completedOrders,powerKw:meta.powerKw,kwh:meta.kwh,rate:meta.rate,cost:meta.cost,costPerOrder:meta.costPerOrder};}
function trendosPressStatusV1_(){
  const open=trendosPressOpenMetaRowsV1_(),queue=trendosPressQueueV1_(),cfg=trendosPressConfigV1_();return{success:true,settings:cfg,queue:queue,session:open.length===1?trendosPressSessionResponseV1_(open[0]):null,multipleOpenSessions:open.length>1,openSessionIds:open.map(function(x){return x.sessionId;}),costConfigReady:trendosPressNumV1_(cfg.powerKw)>0&&trendosPressNumV1_(cfg.rate)>0,version:TRENDOS_PRESS_INTEGRITY_VERSION_V1};
}
function trendosPressControlV1_(e){
  e=e||{parameter:{}};const p=e.parameter||{},auth=trendosPressAuthV1_(p);if(!auth.ok)return{success:false,message:auth.message};const op=trendosPressTextV1_(p.op||'status');if(op==='status')return trendosPressStatusV1_();return trendosWithLock_('script',function(){if(op==='start')return trendosPressStartUnlockedV1_(auth);if(op==='stop')return trendosPressStopUnlockedV1_(p);return{success:false,message:'عملية مكبس غير معروفة.'};},30000);
}
