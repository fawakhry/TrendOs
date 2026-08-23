// TrendOS V1932 Customer Manager backend module.
// Requires a single route in Code.gs: action === "customerManagerV1" -> customerManagerV1_(e)
// Meta webhook POST should call customerManagerWebhookV1_(payload).

const CM_SHEET_CONVERSATIONS_V1932 = "مدير العملاء - المحادثات";
const CM_SHEET_MESSAGES_V1932 = "مدير العملاء - الرسائل";
const CM_TZ_V1932 = "Africa/Cairo";
const CM_CONVERSATION_HEADERS_V1932 = [
  "الهاتف","اسم العميل","رقم الأوردر","الحالة","آخر رسالة","آخر وقت","آخر اتجاه",
  "يحتاج مدير؟","سبب التصعيد","المسؤول","آخر تحديث","آخر رسالة Meta"
];
const CM_MESSAGE_HEADERS_V1932 = [
  "ID","الهاتف","اسم العميل","رقم الأوردر","الاتجاه","النص","الوقت","المصدر",
  "حالة الإرسال","Meta Message ID","يحتاج مدير؟","سبب التصعيد","بواسطة"
];

function cmText_(v){ return String(v == null ? "" : v).trim(); }
function cmNowIso_(){ return Utilities.formatDate(new Date(), CM_TZ_V1932, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function cmPhone_(v){
  try { return cleanPhone_(v); } catch (e) {}
  let d = cmText_(v).replace(/\D/g, "");
  if (d.indexOf("0020") === 0) d = "0" + d.slice(4);
  if (d.indexOf("20") === 0 && d.length >= 12) d = "0" + d.slice(2);
  if (d.indexOf("1") === 0 && d.length === 10) d = "0" + d;
  return d;
}
function cmEnsureSheet_(name, headers){
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}
function cmEnsureAll_(){
  cmEnsureSheet_(CM_SHEET_CONVERSATIONS_V1932, CM_CONVERSATION_HEADERS_V1932);
  cmEnsureSheet_(CM_SHEET_MESSAGES_V1932, CM_MESSAGE_HEADERS_V1932);
}
function cmAuth_(p){
  const auth = authorize_(p.username, p.token);
  if (!auth.ok) return auth;
  const key = (cmText_(auth.user.username || auth.user.name) + " " + cmText_(auth.user.role)).toLowerCase();
  const role = typeof roleFromArabic_ === "function" ? roleFromArabic_(auth.user.role, auth.user.department) : cmText_(auth.user.role).toLowerCase();
  if (!(role === "admin" || role === "service" || key.indexOf("ضياء") !== -1 || key.indexOf("diaa") !== -1)) {
    return { ok:false, message:"مدير العملاء متاح لخدمة العملاء والإدارة فقط." };
  }
  return auth;
}
function cmHeaderMap_(headers){ const m={}; headers.forEach((h,i)=>m[cmText_(h)] = i); return m; }
function cmRows_(sh){
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues();
  const h = cmHeaderMap_(values[0]);
  return values.slice(1).map((r,i)=>({ rowNumber:i+2, row:r, h:h }));
}
function cmValue_(x,key){ const i=x.h[key]; return i === undefined ? "" : x.row[i]; }
function cmSetByPhone_(phone, patch){
  cmEnsureAll_();
  const sh = ss_().getSheetByName(CM_SHEET_CONVERSATIONS_V1932);
  const rows = cmRows_(sh), target = rows.filter(x=>cmPhone_(cmValue_(x,"الهاتف"))===phone).pop();
  const row = target ? target.row.slice() : new Array(CM_CONVERSATION_HEADERS_V1932.length).fill("");
  const h = cmHeaderMap_(CM_CONVERSATION_HEADERS_V1932);
  row[h["الهاتف"]] = phone;
  Object.keys(patch || {}).forEach(k=>{ if (h[k] !== undefined) row[h[k]] = patch[k]; });
  if (target) sh.getRange(target.rowNumber,1,1,row.length).setValues([row]); else sh.appendRow(row);
}
function cmLatestOrderContext_(phone){
  phone = cmPhone_(phone);
  const out = { phone:phone, customerName:"", orderId:"", orderStatus:"", expectedDelivery:"", total:"", remaining:"" };
  const ss = ss_(), orders = ss.getSheetByName(SHEET_NAME_ORDERS);
  if (!orders || orders.getLastRow() < 2) return out;
  const data = orders.getDataRange().getValues(), headers = data[0].map(cmText_), h = cmHeaderMap_(headers);
  const phoneKeys = ["رقم الموبايل","الموبايل","الهاتف","رقم العميل","Phone"];
  const nameKeys = ["اسم العميل","العميل","Customer"];
  const idKeys = ["رقم الأوردر","Order ID"];
  const statusKeys = ["الحالة العامة","الحالة","Status"];
  const expectedKeys = ["تاريخ التسليم المتوقع","الوقت المتوقع","Expected Delivery"];
  const totalKeys = ["الإجمالي","اجمالي الفاتورة","Total"];
  const remainKeys = ["الباقي","المتبقي","Remaining"];
  function get(r, keys){ for (let k of keys){ if (h[k] !== undefined && cmText_(r[h[k]])) return r[h[k]]; } return ""; }
  for (let i=data.length-1;i>=1;i--){
    const r=data[i], rp=cmPhone_(get(r,phoneKeys));
    if (!rp || rp !== phone) continue;
    out.customerName=cmText_(get(r,nameKeys)); out.orderId=cmText_(get(r,idKeys)); out.orderStatus=cmText_(get(r,statusKeys));
    out.expectedDelivery=cmText_(get(r,expectedKeys)); out.total=cmText_(get(r,totalKeys)); out.remaining=cmText_(get(r,remainKeys));
    break;
  }
  return out;
}
function cmAppendMessage_(m){
  cmEnsureAll_();
  const sh = ss_().getSheetByName(CM_SHEET_MESSAGES_V1932);
  const id = m.id || ("CM-" + Utilities.getUuid());
  sh.appendRow([id,m.phone||"",m.customerName||"",m.orderId||"",m.direction||"in",m.text||"",m.at||new Date(),m.source||"TrendOS",m.sendStatus||"",m.metaId||"",m.needsManager?"نعم":"لا",m.reason||"",m.by||""]);
  cmSetByPhone_(m.phone,{"اسم العميل":m.customerName||"","رقم الأوردر":m.orderId||"","الحالة":m.status||"","آخر رسالة":m.text||"","آخر وقت":m.at||new Date(),"آخر اتجاه":m.direction||"in","يحتاج مدير؟":m.needsManager?"نعم":"لا","سبب التصعيد":m.reason||"","آخر تحديث":new Date(),"آخر رسالة Meta":m.metaId||""});
  return id;
}
function cmRisk_(text){
  const t = cmText_(text).toLowerCase();
  const reasons=[];
  if (/شكوى|اشتكي|مشكله|مشكلة|سيء|وحش|اتأخر|متأخر|تأخير|غلط|خطأ|بوظ|تالف/.test(t)) reasons.push("شكوى أو مشكلة جودة/تأخير");
  if (/خصم|تعويض|استرجاع|فلوس|سعر نهائي|تكلفة نهائية/.test(t)) reasons.push("قرار مالي يحتاج اعتماد");
  if (/محامي|قانون|بلاغ|شرطة|جهاز حماية|حماية المستهلك/.test(t)) reasons.push("تصعيد قانوني/رسمي");
  return { needsManager:reasons.length>0, reason:reasons.join("؛ ") };
}
function cmInbox_(limit){
  cmEnsureAll_();
  const rows = cmRows_(ss_().getSheetByName(CM_SHEET_CONVERSATIONS_V1932)).reverse().slice(0,Math.min(Number(limit||80),200));
  return rows.map(x=>({phone:cmPhone_(cmValue_(x,"الهاتف")),customerName:cmText_(cmValue_(x,"اسم العميل")),orderId:cmText_(cmValue_(x,"رقم الأوردر")),status:cmText_(cmValue_(x,"الحالة")),lastMessage:cmText_(cmValue_(x,"آخر رسالة")),lastAt:cmText_(cmValue_(x,"آخر وقت")),direction:cmText_(cmValue_(x,"آخر اتجاه")),needsManager:cmText_(cmValue_(x,"يحتاج مدير؟"))==="نعم",reason:cmText_(cmValue_(x,"سبب التصعيد")),owner:cmText_(cmValue_(x,"المسؤول"))}));
}
function cmThread_(phone,limit){
  cmEnsureAll_(); phone=cmPhone_(phone); limit=Math.min(Number(limit||100),300);
  return cmRows_(ss_().getSheetByName(CM_SHEET_MESSAGES_V1932)).filter(x=>cmPhone_(cmValue_(x,"الهاتف"))===phone).slice(-limit).map(x=>({id:cmText_(cmValue_(x,"ID")),direction:cmText_(cmValue_(x,"الاتجاه")),text:cmText_(cmValue_(x,"النص")),at:cmText_(cmValue_(x,"الوقت")),source:cmText_(cmValue_(x,"المصدر")),sendStatus:cmText_(cmValue_(x,"حالة الإرسال")),needsManager:cmText_(cmValue_(x,"يحتاج مدير؟"))==="نعم",reason:cmText_(cmValue_(x,"سبب التصعيد"))}));
}
function cmOpenAiText_(body){
  const key = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY غير مضبوط في Script Properties.");
  const model = PropertiesService.getScriptProperties().getProperty("OPENAI_CUSTOMER_MODEL") || "gpt-5.6-luna";
  const res = UrlFetchApp.fetch("https://api.openai.com/v1/responses",{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+key},muteHttpExceptions:true,payload:JSON.stringify({model:model,input:body,max_output_tokens:450})});
  const code=res.getResponseCode(), data=JSON.parse(res.getContentText()||"{}");
  if (code<200||code>=300) throw new Error("OpenAI: "+(data.error&&data.error.message?data.error.message:code));
  if (data.output_text) return cmText_(data.output_text);
  const parts=[]; (data.output||[]).forEach(o=>(o.content||[]).forEach(c=>{ if(c.text) parts.push(c.text); }));
  return cmText_(parts.join("\n"));
}
function cmSuggest_(phone){
  const ctx=cmLatestOrderContext_(phone), thread=cmThread_(phone,16), risk=cmRisk_(thread.length?thread[thread.length-1].text:"");
  if (risk.needsManager) return {reply:"",needsManager:true,reason:risk.reason,context:ctx};
  const history=thread.map(m=>(m.direction==="in"?"العميل: ":"المكان: ")+m.text).join("\n");
  const prompt=[
    "أنت مساعد خدمة عملاء Trend Mall / مطبعجي بنها. اكتب رد واتساب مصري قصير ومحترم وواضح.",
    "قواعد صارمة: لا تخترع سعر أو ميعاد أو حالة. بيانات TrendOS التالية هي مصدر الحقيقة. لو البيانات غير كافية اطلب معلومة واحدة فقط أو قل إنك ستحولها للمسؤول.",
    "لا تعد بتعويض أو خصم أو استرجاع. الشكاوى والقرارات المالية تحول للمدير.",
    "بيانات العميل/الأوردر: "+JSON.stringify(ctx),
    "آخر المحادثة:\n"+history,
    "اكتب الرد فقط بدون عنوان أو شرح."
  ].join("\n\n");
  const reply=cmOpenAiText_(prompt);
  return {reply:reply,needsManager:false,reason:"",context:ctx};
}
function cmMetaSend_(phone,text){
  const props=PropertiesService.getScriptProperties(), token=props.getProperty("WHATSAPP_TOKEN"), phoneId=props.getProperty("WHATSAPP_PHONE_NUMBER_ID"), version=props.getProperty("WHATSAPP_GRAPH_VERSION")||"v23.0";
  if (!token||!phoneId) throw new Error("اضبط WHATSAPP_TOKEN و WHATSAPP_PHONE_NUMBER_ID في Script Properties.");
  let to=cmPhone_(phone); if(to.indexOf("0")===0) to="20"+to.slice(1);
  const res=UrlFetchApp.fetch("https://graph.facebook.com/"+version+"/"+phoneId+"/messages",{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+token},muteHttpExceptions:true,payload:JSON.stringify({messaging_product:"whatsapp",to:to,type:"text",text:{preview_url:false,body:text}})});
  const code=res.getResponseCode(), data=JSON.parse(res.getContentText()||"{}");
  if(code<200||code>=300) throw new Error("WhatsApp: "+(data.error&&data.error.message?data.error.message:code));
  return data;
}
function customerManagerV1_(e){
  const p=(e&&e.parameter)||{}, auth=cmAuth_(p); if(!auth.ok) return {success:false,message:auth.message};
  const op=cmText_(p.op||"inbox"), phone=cmPhone_(p.phone);
  if(op==="inbox") return {success:true,conversations:cmInbox_(p.limit)};
  if(op==="thread") return {success:true,messages:cmThread_(phone,p.limit),context:cmLatestOrderContext_(phone)};
  if(op==="suggest") { const s=cmSuggest_(phone); if(s.needsManager) cmSetByPhone_(phone,{"يحتاج مدير؟":"نعم","سبب التصعيد":s.reason,"آخر تحديث":new Date()}); return Object.assign({success:true},s); }
  if(op==="send") { const text=cmText_(p.text); if(!phone||!text) return {success:false,message:"الهاتف والرسالة مطلوبان."}; const ctx=cmLatestOrderContext_(phone), sent=cmMetaSend_(phone,text); const metaId=sent.messages&&sent.messages[0]&&sent.messages[0].id||""; cmAppendMessage_({phone:phone,customerName:ctx.customerName,orderId:ctx.orderId,direction:"out",text:text,at:new Date(),source:"WhatsApp Cloud API",sendStatus:"تم الإرسال",metaId:metaId,by:auth.user.username||auth.user.name}); return {success:true,message:"تم الإرسال.",metaId:metaId}; }
  if(op==="handoff") { cmSetByPhone_(phone,{"يحتاج مدير؟":"نعم","سبب التصعيد":"تصعيد يدوي","المسؤول":"ضياء","آخر تحديث":new Date()}); return {success:true}; }
  if(op==="resolve") { cmSetByPhone_(phone,{"يحتاج مدير؟":"لا","سبب التصعيد":"","آخر تحديث":new Date()}); return {success:true}; }
  return {success:false,message:"أمر مدير العملاء غير معروف."};
}
function customerManagerWebhookVerifyV1_(e){
  const p=(e&&e.parameter)||{}, expected=PropertiesService.getScriptProperties().getProperty("WHATSAPP_VERIFY_TOKEN")||"";
  if(cmText_(p["hub.mode"])==="subscribe" && expected && cmText_(p["hub.verify_token"])===expected) return ContentService.createTextOutput(cmText_(p["hub.challenge"]));
  return ContentService.createTextOutput("forbidden");
}
function customerManagerWebhookV1_(payload){
  cmEnsureAll_(); payload=payload||{}; let count=0;
  (payload.entry||[]).forEach(entry=>(entry.changes||[]).forEach(change=>{
    const value=change.value||{}, contacts=value.contacts||[];
    (value.messages||[]).forEach(msg=>{
      const phone=cmPhone_(msg.from), contact=contacts.filter(c=>cmPhone_(c.wa_id)===phone)[0]||contacts[0]||{}, name=cmText_(contact.profile&&contact.profile.name), text=cmText_(msg.text&&msg.text.body || msg.button&&msg.button.text || msg.interactive&&msg.interactive.button_reply&&msg.interactive.button_reply.title || "");
      if(!phone||!text) return; const ctx=cmLatestOrderContext_(phone), risk=cmRisk_(text);
      cmAppendMessage_({phone:phone,customerName:name||ctx.customerName,orderId:ctx.orderId,status:ctx.orderStatus,direction:"in",text:text,at:new Date(Number(msg.timestamp||0)*1000||Date.now()),source:"WhatsApp Cloud API",sendStatus:"مستلم",metaId:cmText_(msg.id),needsManager:risk.needsManager,reason:risk.reason}); count++;
    });
  }));
  return {success:true,received:count};
}
