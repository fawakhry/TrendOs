// TrendOS Customer Feedback V1 — request a 1..5 rating after delivered orders and capture WhatsApp replies.
const CFB_SHEET_V1 = 'تقييم العملاء';
const CFB_HEADERS_V1 = ['Feedback ID','رقم الأوردر','اسم العميل','الهاتف','وقت إرسال التقييم','التقييم 1-5','الملاحظة','وقت الرد','الحالة','يحتاج متابعة؟','حالة المتابعة','Meta Message ID','المصدر','آخر تحديث'];
const CFB_TZ_V1 = 'Africa/Cairo';

function cfbText_(v){ return String(v == null ? '' : v).trim(); }
function cfbPhone_(v){ try { return cleanPhone_(v); } catch(e) {} let d=cfbText_(v).replace(/\D/g,''); if(d.indexOf('0020')===0)d='0'+d.slice(4); if(d.indexOf('20')===0&&d.length>=12)d='0'+d.slice(2); if(d.indexOf('1')===0&&d.length===10)d='0'+d; return d; }
function cfbSs_(){ return typeof ss_==='function' ? ss_() : SpreadsheetApp.getActiveSpreadsheet(); }
function cfbMap_(headers){ const m={}; (headers||[]).forEach((h,i)=>m[cfbText_(h)]=i); return m; }
function cfbEnsureSheet_(){ const ss=cfbSs_(); let sh=ss.getSheetByName(CFB_SHEET_V1); if(!sh)sh=ss.insertSheet(CFB_SHEET_V1); if(sh.getMaxColumns()<CFB_HEADERS_V1.length)sh.insertColumnsAfter(sh.getMaxColumns(),CFB_HEADERS_V1.length-sh.getMaxColumns()); sh.getRange(1,1,1,CFB_HEADERS_V1.length).setValues([CFB_HEADERS_V1]); sh.setFrozenRows(1); try{sh.setRightToLeft(true);}catch(e){} return sh; }
function cfbRows_(sh){ if(!sh||sh.getLastRow()<2)return[]; const v=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues(),h=cfbMap_(v[0]); return v.slice(1).map((r,i)=>({rowNumber:i+2,row:r,h:h})); }
function cfbVal_(x,k){ const i=x.h[k]; return i===undefined?'':x.row[i]; }
function cfbGet_(r,h,keys){ for(let i=0;i<keys.length;i++){const ix=h[keys[i]];if(ix!==undefined&&cfbText_(r[ix]))return r[ix];} return ''; }
function cfbOrderContext_(orderId){
  const out={orderId:cfbText_(orderId),customerName:'',phone:'',status:''},ss=cfbSs_(),sh=ss.getSheetByName(typeof SHEET_NAME_ORDERS!=='undefined'?SHEET_NAME_ORDERS:'الأوردرات');
  if(!sh||sh.getLastRow()<2)return out; const data=sh.getDataRange().getValues(),h=cfbMap_(data[0]);
  for(let i=data.length-1;i>=1;i--){const r=data[i],id=cfbText_(cfbGet_(r,h,['رقم الأوردر','Order ID','orderId']));if(id!==out.orderId)continue;out.customerName=cfbText_(cfbGet_(r,h,['اسم العميل','العميل','Customer']));out.phone=cfbPhone_(cfbGet_(r,h,['رقم الموبايل','الموبايل','الهاتف','رقم العميل','Phone']));out.status=cfbText_(cfbGet_(r,h,['الحالة العامة','الحالة','Status']));break;} return out;
}
function cfbFindOrder_(orderId){ return cfbRows_(cfbEnsureSheet_()).filter(x=>cfbText_(cfbVal_(x,'رقم الأوردر'))===cfbText_(orderId)).pop()||null; }
function cfbPatch_(x,patch){ const sh=cfbEnsureSheet_(),row=x.row.slice(),h=x.h;Object.keys(patch||{}).forEach(k=>{if(h[k]!==undefined)row[h[k]]=patch[k];});if(h['آخر تحديث']!==undefined)row[h['آخر تحديث']]=new Date();sh.getRange(x.rowNumber,1,1,row.length).setValues([row]); }
function cfbMessage_(ctx){ return 'رأيك يهمنا 🌟\nتم تسليم الأوردر رقم '+ctx.orderId+'.\nقيّم تجربتك مع Trend Mall من 1 إلى 5 بإرسال رقم في أول الرسالة.\nولو عندك ملاحظة اكتبها بعد الرقم في نفس الرسالة، مثال: 4 الخدمة ممتازة.\nشكراً لثقتك فينا ❤️'; }
function cfbSend_(ctx){ if(typeof cmMetaSend_!=='function')throw new Error('WhatsApp backend غير منشور'); return cmMetaSend_(ctx.phone,cfbMessage_(ctx)); }
function cfbRequest_(orderId,by){
  const lock=LockService.getScriptLock();lock.waitLock(15000);try{
    const ctx=cfbOrderContext_(orderId);if(!ctx.orderId)return{success:false,message:'رقم الأوردر مطلوب'};if(ctx.status!=='تم التسليم')return{success:false,skipped:true,message:'التقييم يرسل بعد تم التسليم فقط'};if(!ctx.phone)return{success:false,skipped:true,message:'رقم العميل غير متاح'};
    let existing=cfbFindOrder_(ctx.orderId);if(existing){const rating=Number(cfbVal_(existing,'التقييم 1-5')||0),status=cfbText_(cfbVal_(existing,'الحالة'));if(rating>=1||status==='بانتظار التقييم'||status==='تم استلام التقييم')return{success:true,duplicatePrevented:true,status:status,rating:rating};}
    let metaId='',status='بانتظار واتساب',sendError='';try{const sent=cfbSend_(ctx)||{};metaId=sent.messages&&sent.messages[0]&&sent.messages[0].id?sent.messages[0].id:'';status='بانتظار التقييم';}catch(e){sendError=e.message||String(e);}
    const sh=cfbEnsureSheet_(),h=cfbMap_(CFB_HEADERS_V1),now=new Date();
    if(existing){cfbPatch_(existing,{'اسم العميل':ctx.customerName,'الهاتف':ctx.phone,'وقت إرسال التقييم':status==='بانتظار التقييم'?now:cfbVal_(existing,'وقت إرسال التقييم'),'الحالة':status,'Meta Message ID':metaId||cfbVal_(existing,'Meta Message ID'),'المصدر':'WhatsApp','حالة المتابعة':sendError?'بانتظار ربط/إرسال واتساب':''});}
    else{const row=new Array(CFB_HEADERS_V1.length).fill('');row[h['Feedback ID']]='FB-'+Utilities.getUuid().slice(0,10);row[h['رقم الأوردر']]=ctx.orderId;row[h['اسم العميل']]=ctx.customerName;row[h['الهاتف']]=ctx.phone;row[h['وقت إرسال التقييم']]=status==='بانتظار التقييم'?now:'';row[h['الحالة']]=status;row[h['يحتاج متابعة؟']]='لا';row[h['حالة المتابعة']]=sendError?'بانتظار ربط/إرسال واتساب':'';row[h['Meta Message ID']]=metaId;row[h['المصدر']]='WhatsApp';row[h['آخر تحديث']]=now;sh.appendRow(row);}
    return{success:true,status:status,sendError:sendError,orderId:ctx.orderId};
  }finally{try{lock.releaseLock();}catch(e){}}
}
function cfbScanDelivered_(auth){
  const props=PropertiesService.getScriptProperties();let start=props.getProperty('CUSTOMER_FEEDBACK_START_AT');if(!start){start=new Date().toISOString();props.setProperty('CUSTOMER_FEEDBACK_START_AT',start);return{success:true,initialized:true,startAt:start,requested:0};}
  const startMs=new Date(start).getTime(),ss=cfbSs_(),sh=ss.getSheetByName('سجل حركة الأوردرات');if(!sh||sh.getLastRow()<2)return{success:true,requested:0};
  const last=sh.getLastRow(),from=Math.max(2,last-400),data=sh.getRange(from,1,last-from+1,Math.min(sh.getLastColumn(),16)).getValues(),headers=sh.getRange(1,1,1,Math.min(sh.getLastColumn(),16)).getValues()[0],h=cfbMap_(headers),ids={};
  data.forEach(r=>{const to=cfbText_(cfbGet_(r,h,['إلى حالة','newStatus','الحالة الجديدة']));if(to!=='تم التسليم')return;const t=cfbGet_(r,h,['الوقت','timestamp']),ms=t instanceof Date?t.getTime():new Date(t).getTime();if(!isNaN(ms)&&ms<startMs)return;const id=cfbText_(cfbGet_(r,h,['رقم الأوردر','orderId']));if(id)ids[id]=true;});
  let requested=0,pending=0;Object.keys(ids).slice(-40).forEach(id=>{try{const r=cfbRequest_(id,(auth.user||{}).username||'TrendOS');if(r&&r.success){requested++;if(r.status==='بانتظار واتساب')pending++;}}catch(e){}});return{success:true,requested:requested,pendingWhatsApp:pending};
}
function cfbLatestPendingByPhone_(phone){phone=cfbPhone_(phone);return cfbRows_(cfbEnsureSheet_()).filter(x=>cfbPhone_(cfbVal_(x,'الهاتف'))===phone&&cfbText_(cfbVal_(x,'الحالة'))==='بانتظار التقييم').pop()||null;}
function customerFeedbackWebhookV1_(payload){
  try{const messages=[];(payload.entry||[]).forEach(e=>(e.changes||[]).forEach(c=>{const v=c.value||{};(v.messages||[]).forEach(m=>messages.push(m));}));messages.forEach(m=>{if(!m||m.type!=='text')return;const phone=cfbPhone_(m.from),body=cfbText_(m.text&&m.text.body),x=cfbLatestPendingByPhone_(phone);if(!x)return;const mt=body.match(/^\s*([1-5])(?:\s*[-:،,]?\s*(.*))?$/);if(!mt)return;const rating=Number(mt[1]),comment=cfbText_(mt[2]||''),follow=rating<=3?'نعم':'لا';cfbPatch_(x,{'التقييم 1-5':rating,'الملاحظة':comment,'وقت الرد':new Date(),'الحالة':'تم استلام التقييم','يحتاج متابعة؟':follow,'حالة المتابعة':rating<=3?'مطلوب تواصل خدمة العملاء':'مغلق'});if(rating<=3&&typeof cmSetByPhone_==='function'){cmSetByPhone_(phone,{'يحتاج مدير؟':'نعم','سبب التصعيد':'تقييم عميل منخفض '+rating+'/5 للأوردر '+cfbText_(cfbVal_(x,'رقم الأوردر')),'آخر تحديث':new Date()});}try{if(typeof cmMetaSend_==='function')cmMetaSend_(phone,rating<=3?'شكراً لتقييمك. سجلنا ملاحظتك وهنتابعها مع خدمة العملاء.':'شكراً لتقييمك وثقتك في Trend Mall ❤️');}catch(e){} });return{success:true};}catch(e){return{success:false,message:e.message||String(e)};}
}
function customerFeedbackV1_(e){
  const p=(e&&e.parameter)||{},auth=typeof authorize_==='function'?authorize_(p.username,p.token):{ok:false,message:'Auth unavailable'};if(!auth.ok)return{success:false,message:auth.message};const op=cfbText_(p.op||'scan');if(op==='scan')return cfbScanDelivered_(auth);if(op==='request')return cfbRequest_(p.orderId,(auth.user||{}).username||'TrendOS');if(op==='list'){const rows=cfbRows_(cfbEnsureSheet_()).reverse().slice(0,Math.min(Number(p.limit||100),300)).map(x=>({orderId:cfbText_(cfbVal_(x,'رقم الأوردر')),customerName:cfbText_(cfbVal_(x,'اسم العميل')),phone:cfbPhone_(cfbVal_(x,'الهاتف')),rating:Number(cfbVal_(x,'التقييم 1-5')||0),comment:cfbText_(cfbVal_(x,'الملاحظة')),status:cfbText_(cfbVal_(x,'الحالة')),needsFollowup:cfbText_(cfbVal_(x,'يحتاج متابعة؟'))==='نعم'}));return{success:true,feedback:rows};}return{success:false,message:'Customer Feedback op غير معروف'};
}
