// TrendOS Go-Live Autopilot V1 — safe bridge: Ready -> Draft Invoice -> Final Invoice -> WhatsApp.
// Financial posting is NEVER triggered by a production employee marking an order ready.
// A ready order only creates/updates a draft. Finalization reuses saveAccountingFinalInvoice_ and its existing accounting authorization/idempotency.

const GLA_DRAFT_SHEET_V1 = "حسابات - مسودات الفواتير";
const GLA_TZ_V1 = "Africa/Cairo";
const GLA_HEADERS_V1 = [
  "Draft ID","وقت الإنشاء","آخر تحديث","رقم الأوردر","اسم العميل","رقم العميل","حالة الأوردر",
  "بنود معتمدة","الإجمالي المقترح","مدفوع مقترح","الباقي المقترح","الحالة","سبب التعطيل",
  "رقم الفاتورة","حالة رسالة واتساب","Meta Message ID","اختيار الاستلام","ملاحظات","بواسطة"
];

function glaText_(v){ return String(v == null ? "" : v).trim(); }
function glaMoney_(v){
  if (typeof parseMoney_ === "function") return Number(parseMoney_(v) || 0);
  const n = Number(String(v == null ? "" : v).replace(/[^0-9.\-]/g,""));
  return isNaN(n) ? 0 : n;
}
function glaPhone_(v){
  try { if (typeof cleanPhone_ === "function") return cleanPhone_(v); } catch(e) {}
  let d=glaText_(v).replace(/\D/g,"");
  if(d.indexOf("0020")===0)d="0"+d.slice(4);
  if(d.indexOf("20")===0&&d.length>=12)d="0"+d.slice(2);
  if(d.indexOf("1")===0&&d.length===10)d="0"+d;
  return d;
}
function glaIso_(){ return Utilities.formatDate(new Date(),GLA_TZ_V1,"yyyy-MM-dd'T'HH:mm:ssXXX"); }
function glaSs_(){ return typeof ss_ === "function" ? ss_() : SpreadsheetApp.getActiveSpreadsheet(); }
function glaEnsureSheet_(){
  const ss=glaSs_(); let sh=ss.getSheetByName(GLA_DRAFT_SHEET_V1);
  if(!sh) sh=ss.insertSheet(GLA_DRAFT_SHEET_V1);
  if(sh.getMaxColumns()<GLA_HEADERS_V1.length) sh.insertColumnsAfter(sh.getMaxColumns(),GLA_HEADERS_V1.length-sh.getMaxColumns());
  sh.getRange(1,1,1,GLA_HEADERS_V1.length).setValues([GLA_HEADERS_V1]);
  sh.setFrozenRows(1);
  try { sh.setRightToLeft(true); } catch(e) {}
  return sh;
}
function glaMap_(headers){ const m={}; (headers||[]).forEach((h,i)=>m[glaText_(h)]=i); return m; }
function glaRows_(sh){
  if(!sh||sh.getLastRow()<2)return [];
  const values=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues(),h=glaMap_(values[0]);
  return values.slice(1).map((r,i)=>({rowNumber:i+2,row:r,h:h}));
}
function glaVal_(x,key){ const i=x.h[key]; return i===undefined?"":x.row[i]; }
function glaAuth_(p){
  if(typeof authorize_!=="function") return {ok:false,message:"authorize_ غير متاح."};
  return authorize_(p.username,p.token);
}
function glaRoleCanReview_(auth){
  if(!auth||!auth.ok)return false;
  const u=auth.user||{},key=(glaText_(u.username||u.name)+" "+glaText_(u.role)).toLowerCase();
  let role=glaText_(u.role).toLowerCase();
  try { if(typeof roleFromArabic_==="function") role=roleFromArabic_(u.role,u.department); } catch(e) {}
  return role==="admin"||role==="service"||role==="final"||key.indexOf("ضياء")!==-1||key.indexOf("diaa")!==-1||key.indexOf("رحم")!==-1||key.indexOf("revan")!==-1||key.indexOf("rivan")!==-1;
}
function glaGet_(row,h,keys){
  for(let i=0;i<keys.length;i++){ const ix=h[keys[i]]; if(ix!==undefined&&glaText_(row[ix])) return row[ix]; }
  return "";
}
function glaOrderContext_(orderId){
  const out={orderId:glaText_(orderId),customerName:"",phone:"",status:"",paidSuggested:0};
  const sh=glaSs_().getSheetByName(typeof SHEET_NAME_ORDERS!=="undefined"?SHEET_NAME_ORDERS:"الأوردرات");
  if(!sh||sh.getLastRow()<2)return out;
  const data=sh.getDataRange().getValues(),h=glaMap_(data[0]);
  for(let i=data.length-1;i>=1;i--){
    const r=data[i],id=glaText_(glaGet_(r,h,["رقم الأوردر","Order ID","orderId"]));
    if(id!==out.orderId)continue;
    out.customerName=glaText_(glaGet_(r,h,["اسم العميل","العميل","Customer","customerName"]));
    out.phone=glaPhone_(glaGet_(r,h,["رقم الموبايل","الموبايل","الهاتف","رقم العميل","Phone","customerPhone"]));
    out.status=glaText_(glaGet_(r,h,["الحالة العامة","الحالة","Status","status"]));
    out.paidSuggested=glaMoney_(glaGet_(r,h,["المدفوع","مدفوع","paid","Paid"]));
    break;
  }
  return out;
}
function glaDeptLines_(orderId){
  const ss=glaSs_();
  const name=typeof SHEET_NAME_ACC_DEPT_LINES!=="undefined"?SHEET_NAME_ACC_DEPT_LINES:"حسابات - فواتير الأقسام";
  const sh=ss.getSheetByName(name); if(!sh||sh.getLastRow()<2)return {eligible:[],blockers:["لا توجد بنود أقسام مسجلة"],subtotal:0};
  const data=sh.getDataRange().getValues(),h=glaMap_(data[0]);
  const eligible=[],blockers=[]; let subtotal=0,matched=0;
  data.slice(1).forEach((r,idx)=>{
    const idOrder=glaText_(glaGet_(r,h,["رقم الأوردر","orderId"])); if(idOrder!==glaText_(orderId))return; matched++;
    const id=glaText_(glaGet_(r,h,["ID","id"]));
    const nameItem=glaText_(glaGet_(r,h,["اسم البند","itemName"]));
    const closeStatus=glaText_(glaGet_(r,h,["حالة التقفيل","closeStatus"]));
    const pulled=glaText_(glaGet_(r,h,["مسحوب للفاتورة النهائية؟"]));
    const approve=glaText_(glaGet_(r,h,["حالة اعتماد القسم","حالة الفوترة","status"]));
    let approved=false,closed=false,total=0;
    try { approved=typeof v1889IsDeptApproved_==="function"?!!v1889IsDeptApproved_(r,h):(approve.indexOf("معتمد")!==-1); } catch(e){ approved=approve.indexOf("معتمد")!==-1; }
    try { closed=typeof deptLineClosedForFinalV1887_==="function"?!!deptLineClosedForFinalV1887_(r,h):(closeStatus==="تم التقفيل"||pulled==="نعم"); } catch(e){ closed=closeStatus==="تم التقفيل"||pulled==="نعم"; }
    try { total=typeof v1889DeptLineTotal_==="function"?Number(v1889DeptLineTotal_(r,h)||0):glaMoney_(glaGet_(r,h,["total","الإجمالي","سعر البيع","sale"])); } catch(e){ total=glaMoney_(glaGet_(r,h,["total","الإجمالي","سعر البيع","sale"])); }
    if(closed)return;
    if(!approved){ blockers.push((id||nameItem||("صف "+(idx+2)))+": يحتاج اعتماد القسم"); return; }
    if(!(total>0)){ blockers.push((id||nameItem||("صف "+(idx+2)))+": السعر/الإجمالي غير معتمد"); return; }
    eligible.push({id:id,itemName:nameItem,total:total}); subtotal+=total;
  });
  if(!matched)blockers.push("لا توجد بنود مرتبطة بهذا الأوردر في فواتير الأقسام");
  return {eligible:eligible,blockers:blockers,subtotal:subtotal};
}
function glaUpsertDraft_(ctx,calc,by,note){
  const sh=glaEnsureSheet_(),rows=glaRows_(sh),existing=rows.filter(x=>glaText_(glaVal_(x,"رقم الأوردر"))===ctx.orderId).pop();
  const h=glaMap_(GLA_HEADERS_V1),row=existing?existing.row.slice(0,GLA_HEADERS_V1.length):new Array(GLA_HEADERS_V1.length).fill("");
  const now=new Date(),draftId=existing?glaText_(glaVal_(existing,"Draft ID")):("DRAFT-"+Utilities.getUuid().slice(0,8));
  const blockers=calc.blockers||[],ready=calc.eligible.length>0&&blockers.length===0;
  const paid=Math.max(0,Number(ctx.paidSuggested||0)),remaining=Math.max(0,calc.subtotal-paid);
  row[h["Draft ID"]]=draftId; if(!row[h["وقت الإنشاء"]])row[h["وقت الإنشاء"]]=now; row[h["آخر تحديث"]]=now;
  row[h["رقم الأوردر"]]=ctx.orderId; row[h["اسم العميل"]]=ctx.customerName; row[h["رقم العميل"]]=ctx.phone; row[h["حالة الأوردر"]]=ctx.status;
  row[h["بنود معتمدة"]]=JSON.stringify(calc.eligible.map(x=>x.id).filter(Boolean)); row[h["الإجمالي المقترح"]]=calc.subtotal; row[h["مدفوع مقترح"]]=paid; row[h["الباقي المقترح"]]=remaining;
  if(!row[h["رقم الفاتورة"]]) row[h["الحالة"]]=ready?"جاهز للتقفيل":"يحتاج تسعير/اعتماد";
  row[h["سبب التعطيل"]]=blockers.join(" | "); if(note!==undefined)row[h["ملاحظات"]]=glaText_(note); row[h["بواسطة"]]=glaText_(by||"TrendOS");
  if(existing)sh.getRange(existing.rowNumber,1,1,GLA_HEADERS_V1.length).setValues([row]); else sh.appendRow(row);
  return {draftId:draftId,status:row[h["الحالة"]],subtotal:calc.subtotal,paidSuggested:paid,remainingSuggested:remaining,blockers:blockers,lineIds:calc.eligible.map(x=>x.id).filter(Boolean),customerName:ctx.customerName,phone:ctx.phone,orderStatus:ctx.status};
}
function glaPrepare_(orderId,by,note){
  const ctx=glaOrderContext_(orderId),calc=glaDeptLines_(orderId);
  return glaUpsertDraft_(ctx,calc,by,note);
}
function glaListDrafts_(limit){
  const sh=glaEnsureSheet_(),rows=glaRows_(sh).reverse().slice(0,Math.min(Number(limit||80),200));
  return rows.map(x=>({draftId:glaText_(glaVal_(x,"Draft ID")),createdAt:glaText_(glaVal_(x,"وقت الإنشاء")),updatedAt:glaText_(glaVal_(x,"آخر تحديث")),orderId:glaText_(glaVal_(x,"رقم الأوردر")),customerName:glaText_(glaVal_(x,"اسم العميل")),phone:glaPhone_(glaVal_(x,"رقم العميل")),orderStatus:glaText_(glaVal_(x,"حالة الأوردر")),lineIds:glaText_(glaVal_(x,"بنود معتمدة")),subtotal:glaMoney_(glaVal_(x,"الإجمالي المقترح")),paidSuggested:glaMoney_(glaVal_(x,"مدفوع مقترح")),remainingSuggested:glaMoney_(glaVal_(x,"الباقي المقترح")),status:glaText_(glaVal_(x,"الحالة")),blocker:glaText_(glaVal_(x,"سبب التعطيل")),invoiceNo:glaText_(glaVal_(x,"رقم الفاتورة")),messageStatus:glaText_(glaVal_(x,"حالة رسالة واتساب")),metaId:glaText_(glaVal_(x,"Meta Message ID")),deliveryChoice:glaText_(glaVal_(x,"اختيار الاستلام")),notes:glaText_(glaVal_(x,"ملاحظات"))}));
}
function glaFindDraft_(orderId){ return glaListDrafts_(200).find(d=>d.orderId===glaText_(orderId))||null; }
function glaPatchDraft_(orderId,patch){
  const sh=glaEnsureSheet_(),x=glaRows_(sh).filter(r=>glaText_(glaVal_(r,"رقم الأوردر"))===glaText_(orderId)).pop(); if(!x)return;
  const h=x.h,row=x.row.slice(); Object.keys(patch||{}).forEach(k=>{ if(h[k]!==undefined)row[h[k]]=patch[k]; }); if(h["آخر تحديث"]!==undefined)row[h["آخر تحديث"]]=new Date(); sh.getRange(x.rowNumber,1,1,row.length).setValues([row]);
}
function glaReadyMessage_(draft,invoice){
  const total=Number(invoice.finalTotal||draft.subtotal||0),paid=Number(invoice.paid||0),remaining=Number(invoice.remaining||Math.max(0,total-paid));
  const lines=["أهلاً "+(draft.customerName||"")+" 🌟","تم الانتهاء من الأوردر رقم "+draft.orderId+" وهو جاهز للاستلام ✅","رقم الفاتورة: "+(invoice.invoiceNo||draft.invoiceNo||"-"),"إجمالي الفاتورة: "+total+" جنيه"];
  if(paid>0)lines.push("المدفوع: "+paid+" جنيه"); if(remaining>0)lines.push("المتبقي: "+remaining+" جنيه");
  lines.push("تحب الاستلام من الفرع ولا نرتب لك دليفري؟ 🚚","Trend Mall"); return lines.join("\n");
}
function glaSendReady_(draft,invoice){
  if(!draft||!draft.phone)throw new Error("رقم العميل غير متاح لإرسال رسالة الجاهزية.");
  if(typeof cmMetaSend_!=="function")throw new Error("WhatsApp Customer Manager غير منشور بعد.");
  const text=glaReadyMessage_(draft,invoice),out=cmMetaSend_(draft.phone,text),metaId=out&&out.messages&&out.messages[0]&&out.messages[0].id?out.messages[0].id:"";
  try { if(typeof cmAppendMessage_==="function")cmAppendMessage_({phone:draft.phone,customerName:draft.customerName,orderId:draft.orderId,direction:"out",text:text,at:new Date(),source:"Go-Live Autopilot",sendStatus:"تم الإرسال",metaId:metaId,by:"AI مدير العملاء"}); } catch(e) {}
  glaPatchDraft_(draft.orderId,{"حالة رسالة واتساب":"تم الإرسال","Meta Message ID":metaId});
  return {text:text,metaId:metaId};
}
function glaFinalize_(p,auth){
  const orderId=glaText_(p.orderId),draft=glaFindDraft_(orderId)||glaPrepare_(orderId,auth.user&&auth.user.username,"تجهيز قبل التقفيل");
  if(!draft) return {success:false,message:"تعذر تجهيز مسودة الفاتورة."};
  if(draft.status!=="جاهز للتقفيل"&&!draft.invoiceNo)return {success:false,message:"الفاتورة غير جاهزة للتقفيل: "+(draft.blocker||"راجع التسعير واعتماد الأقسام"),draft:draft};
  if(draft.invoiceNo){
    if(glaText_(p.send)==="1"&&draft.messageStatus!=="تم الإرسال"){
      const sent=glaSendReady_(draft,{invoiceNo:draft.invoiceNo,finalTotal:draft.subtotal,paid:draft.paidSuggested,remaining:draft.remainingSuggested});
      return {success:true,alreadyFinalized:true,invoiceNo:draft.invoiceNo,message:"الفاتورة مقفلة مسبقًا وتم إرسال الرسالة.",sent:sent,draft:glaFindDraft_(orderId)};
    }
    return {success:true,alreadyFinalized:true,invoiceNo:draft.invoiceNo,message:"الفاتورة مقفلة مسبقًا.",draft:draft};
  }
  if(typeof saveAccountingFinalInvoice_!=="function")return {success:false,message:"محرك الفاتورة النهائية غير متاح."};
  let lineIds=[]; try{lineIds=JSON.parse(draft.lineIds||"[]");}catch(e){}
  const paid=(p.paid!==undefined&&p.paid!=="")?p.paid:draft.paidSuggested;
  const evt={parameter:Object.assign({},p,{orderId:orderId,customerName:draft.customerName,lineIds:JSON.stringify(lineIds),paid:paid,requestId:glaText_(p.requestId)||("GLA-FINAL-"+orderId),username:p.username,token:p.token})};
  const invoice=saveAccountingFinalInvoice_(evt);
  if(!invoice||invoice.success===false)return invoice||{success:false,message:"فشل تقفيل الفاتورة."};
  glaPatchDraft_(orderId,{"الحالة":"تم التقفيل","رقم الفاتورة":invoice.invoiceNo||"","مدفوع مقترح":invoice.paid||0,"الباقي المقترح":invoice.remaining||0,"سبب التعطيل":""});
  let sent=null;
  if(glaText_(p.send)==="1") sent=glaSendReady_(glaFindDraft_(orderId)||draft,invoice);
  return {success:true,message:sent?"تم تقفيل الفاتورة وإرسال رسالة الجاهزية.":"تم تقفيل الفاتورة؛ الرسالة لم تُرسل بعد.",invoice:invoice,sent:sent,draft:glaFindDraft_(orderId)};
}
function glaSweepReady_(auth,limit){
  const sh=glaSs_().getSheetByName(typeof SHEET_NAME_ORDERS!=="undefined"?SHEET_NAME_ORDERS:"الأوردرات"); if(!sh||sh.getLastRow()<2)return {prepared:[],count:0};
  const data=sh.getDataRange().getValues(),h=glaMap_(data[0]),prepared=[],seen={};
  for(let i=data.length-1;i>=1&&prepared.length<Math.min(Number(limit||30),100);i--){
    const r=data[i],status=glaText_(glaGet_(r,h,["الحالة العامة","الحالة","Status","status"]));
    if(["جاهز للاستلام","تم التنفيذ"].indexOf(status)===-1)continue;
    const orderId=glaText_(glaGet_(r,h,["رقم الأوردر","Order ID","orderId"])); if(!orderId||seen[orderId])continue; seen[orderId]=true;
    prepared.push(Object.assign({orderId:orderId},glaPrepare_(orderId,"Auto Ready Sweep","تم إنشاء/تحديث المسودة لأن الأوردر جاهز")));
  }
  return {prepared:prepared,count:prepared.length};
}
function goLiveAutopilotV1_(e){
  const p=(e&&e.parameter)||{},auth=glaAuth_(p); if(!auth.ok)return {success:false,message:auth.message};
  const op=glaText_(p.op||"ping");
  if(op==="ping")return {success:true,version:"GO_LIVE_AUTOPILOT_V1",draftSheet:GLA_DRAFT_SHEET_V1};
  if(op==="prepareReadyInvoice")return {success:true,draft:glaPrepare_(p.orderId,auth.user&&auth.user.username,p.notes)};
  if(op==="sweepReady")return Object.assign({success:true},glaSweepReady_(auth,p.limit));
  if(op==="listDrafts"){
    if(!glaRoleCanReview_(auth))return {success:false,message:"مسودات الفواتير متاحة لخدمة العملاء والإدارة."};
    return {success:true,drafts:glaListDrafts_(p.limit)};
  }
  if(op==="finalizeAndNotify"){
    if(!glaRoleCanReview_(auth))return {success:false,message:"تقفيل وإرسال الفاتورة متاح لخدمة العملاء والإدارة المصرح لها."};
    return glaFinalize_(p,auth);
  }
  if(op==="sendReady"){
    if(!glaRoleCanReview_(auth))return {success:false,message:"إرسال الجاهزية متاح لخدمة العملاء والإدارة."};
    const d=glaFindDraft_(p.orderId); if(!d||!d.invoiceNo)return {success:false,message:"يجب تقفيل الفاتورة أولًا."};
    const sent=glaSendReady_(d,{invoiceNo:d.invoiceNo,finalTotal:d.subtotal,paid:d.paidSuggested,remaining:d.remainingSuggested}); return {success:true,sent:sent,draft:glaFindDraft_(p.orderId)};
  }
  if(op==="deliveryChoice"){
    const choice=glaText_(p.choice); glaPatchDraft_(p.orderId,{"اختيار الاستلام":choice}); return {success:true,message:"تم حفظ اختيار الاستلام.",choice:choice};
  }
  return {success:false,message:"أمر Go-Live غير معروف."};
}
