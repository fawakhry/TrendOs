/**
 * TrendOS Invoice / Ready Sweep Integrity V1
 * GitHub checkpoint only. Do not deploy blindly.
 *
 * Contracts:
 * - one canonical Draft row per Order ID; duplicates fail closed.
 * - Ready Sweep is line-driven and requires all active non-cancelled lines to be ready.
 * - delivered/closed orders do not re-enter Ready Sweep.
 * - an active final invoice prevents a new draft.
 * - a reopened final invoice creates a new deterministic revision.
 * - finalize request key is persisted before the legacy final writer runs.
 * - retry after ambiguous finalization reuses the same request key.
 * - no nested ScriptLock around saveAccountingFinalInvoice_ (it owns its own lock).
 * - WhatsApp send enters NOTIFYING before network I/O; ambiguous retry does not auto-resend.
 */
const TRENDOS_INVOICE_INTEGRITY_VERSION_V1='TRENDOS_INVOICE_INTEGRITY_V1_20260830';
const TRENDOS_INVOICE_DRAFT_SHEET_V1='حسابات - مسودات الفواتير';
const TRENDOS_INVOICE_FINAL_SHEET_V1='حسابات - الفواتير النهائية';
const TRENDOS_INVOICE_LINES_SHEET_V1='بنود الأوردرات';
const TRENDOS_INVOICE_INTEGRITY_HEADERS_V1=[
  'Integrity Revision','Integrity State','Material Signature','Finalize Request Key',
  'Previous Invoice No','Finalized At','Integrity Last Error'
];

function trendosInvoiceTxtV1_(v){return String(v==null?'':v).trim();}
function trendosInvoiceNormV1_(v){return trendosInvoiceTxtV1_(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ة]/g,'ه');}
function trendosInvoiceNumV1_(v){const n=Number(v);return isFinite(n)?n:0;}
function trendosInvoiceDraftSheetV1_(){
  if(typeof glaEnsureSheet_==='function')return glaEnsureSheet_();
  const ss=typeof trendosSpreadsheetV1_==='function'?trendosSpreadsheetV1_():ss_();
  const sh=ss.getSheetByName(TRENDOS_INVOICE_DRAFT_SHEET_V1);
  if(!sh)throw new Error('شيت مسودات الفواتير غير موجود.');
  return sh;
}
function trendosInvoiceHeaderMap0V1_(sh){
  const out={};if(!sh||sh.getLastColumn()<1)return out;
  sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].forEach(function(v,i){const k=trendosInvoiceTxtV1_(v);if(k)out[k]=i;});
  return out;
}
function trendosInvoiceEnsureDraftColumnsV1_(){
  const sh=trendosInvoiceDraftSheetV1_();let h=trendosInvoiceHeaderMap0V1_(sh);
  TRENDOS_INVOICE_INTEGRITY_HEADERS_V1.forEach(function(name){
    if(h[name]!==undefined)return;
    const col=sh.getLastColumn()+1;
    if(sh.getMaxColumns&&sh.getMaxColumns()<col)sh.insertColumnsAfter(sh.getMaxColumns(),col-sh.getMaxColumns());
    sh.getRange(1,col).setValue(name);h[name]=col-1;
  });
  return sh;
}
function trendosInvoiceRowsV1_(sh){
  if(!sh||sh.getLastRow()<2)return[];
  const vals=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues(),h=trendosInvoiceHeaderMap0V1_(sh);
  return vals.slice(1).map(function(row,i){return{rowNumber:i+2,row:row,h:h};});
}
function trendosInvoiceValV1_(x,key){return x&&x.h&&x.h[key]!==undefined?x.row[x.h[key]]:'';}
function trendosInvoicePatchRowV1_(sh,x,patch){
  if(!sh||!x)return;const h=trendosInvoiceHeaderMap0V1_(sh),row=sh.getRange(x.rowNumber,1,1,sh.getLastColumn()).getValues()[0];
  Object.keys(patch||{}).forEach(function(k){if(h[k]!==undefined)row[h[k]]=patch[k];});
  sh.getRange(x.rowNumber,1,1,row.length).setValues([row]);
}
function trendosInvoiceDraftMatchesV1_(orderId){
  orderId=trendosNormalizeOrderId_(orderId);if(!orderId)return[];
  const sh=trendosInvoiceEnsureDraftColumnsV1_();
  return trendosInvoiceRowsV1_(sh).filter(function(x){return trendosNormalizeOrderId_(trendosInvoiceValV1_(x,'رقم الأوردر'))===orderId;});
}
function trendosInvoiceResolutionDraftV1_(x){
  const d=trendosInvoiceDraftObjectV1_(x);
  return{
    draftId:d&&d.draftId,
    orderId:d&&d.orderId,
    subtotal:d&&d.subtotal,
    status:d&&d.status,
    blocker:d&&d.blocker,
    invoiceNo:d&&d.invoiceNo,
    messageStatus:d&&d.messageStatus,
    metaId:d&&d.metaId
  };
}
function trendosInvoiceResolveDraftV1_(orderId){
  const rows=trendosInvoiceDraftMatchesV1_(orderId);
  if(rows.length>1){
    if(typeof trendosIntegrityResolutionV1_==='function'&&typeof trendosIntegrityInvoiceDraftEvidenceV1_==='function'){
      const evidence=trendosIntegrityInvoiceDraftEvidenceV1_(rows.map(trendosInvoiceResolutionDraftV1_));
      const resolution=trendosIntegrityResolutionV1_('DUPLICATE_INVOICE_DRAFTS',orderId,evidence);
      if(resolution.resolved&&resolution.canonicalId){
        const byId={};rows.forEach(function(x){const id=trendosInvoiceDraftObjectV1_(x).draftId;if(id)byId[id]=x;});
        const canonical=byId[resolution.canonicalId],superseded={};
        resolution.supersededIds.forEach(function(id){superseded[id]=true;});
        const unresolved=rows.filter(function(x){
          const id=trendosInvoiceDraftObjectV1_(x).draftId;
          return id!==resolution.canonicalId&&!superseded[id];
        });
        const invalidSuperseded=resolution.supersededIds.filter(function(id){return!byId[id]||id===resolution.canonicalId;});
        if(canonical&&!unresolved.length&&!invalidSuperseded.length){
          return{ok:true,row:canonical,count:1,totalCount:rows.length,supersededCount:resolution.supersededIds.length,resolution:resolution};
        }
        return{ok:false,integrityError:true,duplicateDrafts:true,resolutionMismatch:true,count:rows.length,resolution:resolution,message:'سجل معالجة Drafts لا يغطي الصفوف الحالية بدقة؛ تم إيقاف العملية.'};
      }
      if(resolution.stale||resolution.conflict){
        return{ok:false,integrityError:true,duplicateDrafts:true,resolutionInvalid:true,count:rows.length,resolution:resolution,message:'سجل معالجة Drafts قديم أو متعارض مع البيانات الحالية؛ تم إيقاف العملية.'};
      }
    }
    return{ok:false,integrityError:true,duplicateDrafts:true,count:rows.length,message:'يوجد أكثر من Draft لنفس رقم الأوردر؛ تم إيقاف العملية للمراجعة.'};
  }
  return{ok:true,row:rows.length?rows[0]:null,count:rows.length};
}
function trendosInvoiceDraftObjectV1_(x){
  if(!x)return null;
  let lineIds=[];try{const raw=trendosInvoiceValV1_(x,'بنود معتمدة');if(Array.isArray(raw))lineIds=raw;else if(trendosInvoiceTxtV1_(raw))lineIds=JSON.parse(trendosInvoiceTxtV1_(raw));}catch(e){}
  return{
    rowNumber:x.rowNumber,
    draftId:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'Draft ID')||trendosInvoiceValV1_(x,'ID')),
    orderId:trendosNormalizeOrderId_(trendosInvoiceValV1_(x,'رقم الأوردر')),
    customerName:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'اسم العميل')),
    phone:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'رقم العميل')||trendosInvoiceValV1_(x,'الهاتف')),
    orderStatus:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'حالة الأوردر')),
    lineIds:Array.isArray(lineIds)?lineIds.map(trendosInvoiceTxtV1_).filter(Boolean):[],
    subtotal:trendosInvoiceNumV1_(trendosInvoiceValV1_(x,'الإجمالي المقترح')),
    paidSuggested:trendosInvoiceNumV1_(trendosInvoiceValV1_(x,'مدفوع مقترح')||trendosInvoiceValV1_(x,'المدفوع المقترح')),
    remainingSuggested:trendosInvoiceNumV1_(trendosInvoiceValV1_(x,'الباقي المقترح')),
    status:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'الحالة')),
    blocker:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'سبب التعطيل')),
    invoiceNo:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'رقم الفاتورة')),
    messageStatus:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'حالة رسالة واتساب')),
    metaId:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'Meta Message ID')),
    revision:Math.max(0,Math.floor(trendosInvoiceNumV1_(trendosInvoiceValV1_(x,'Integrity Revision')))),
    integrityState:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'Integrity State')),
    materialSignature:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'Material Signature')),
    finalizeRequestKey:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'Finalize Request Key')),
    previousInvoiceNo:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'Previous Invoice No')),
    finalizedAt:trendosInvoiceValV1_(x,'Finalized At'),
    integrityLastError:trendosInvoiceTxtV1_(trendosInvoiceValV1_(x,'Integrity Last Error'))
  };
}

function trendosInvoiceFinalInactiveV1_(status){
  const s=trendosInvoiceNormV1_(status);
  return s.indexOf('مراجعه')!==-1||s.indexOf('ملغ')!==-1||s.indexOf('باطل')!==-1||s.indexOf('void')!==-1||s.indexOf('cancel')!==-1||s.indexOf('reopen')!==-1;
}
function trendosInvoiceFinalHistoryV1_(orderId){
  orderId=trendosNormalizeOrderId_(orderId);const ss=typeof trendosSpreadsheetV1_==='function'?trendosSpreadsheetV1_():ss_(),sh=ss.getSheetByName(typeof SHEET_NAME_ACC_FINAL_INVOICES!=='undefined'?SHEET_NAME_ACC_FINAL_INVOICES:TRENDOS_INVOICE_FINAL_SHEET_V1);
  const out={history:[],active:[],review:[],uniqueInvoiceCount:0};if(!sh||sh.getLastRow()<2||!orderId)return out;
  const h=trendosInvoiceHeaderMap0V1_(sh),vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(),seen={};
  vals.forEach(function(r,i){
    const oid=h['رقم الأوردر']!==undefined?trendosNormalizeOrderId_(r[h['رقم الأوردر']]):'';if(oid!==orderId)return;
    const inv=h['رقم الفاتورة']!==undefined?trendosInvoiceTxtV1_(r[h['رقم الفاتورة']]):'';
    const st=h['الحالة']!==undefined?trendosInvoiceTxtV1_(r[h['الحالة']]):'';
    const req=h['مفتاح العملية']!==undefined?trendosInvoiceTxtV1_(r[h['مفتاح العملية']]):'';
    const item={rowNumber:i+2,invoiceNo:inv,status:st,requestKey:req,inactive:trendosInvoiceFinalInactiveV1_(st)};
    out.history.push(item);if(inv)seen[inv]=true;(item.inactive?out.review:out.active).push(item);
  });
  out.uniqueInvoiceCount=Object.keys(seen).length;return out;
}
function trendosInvoiceMaterialPayloadV1_(calc){
  calc=calc||{};const items=(calc.eligible||[]).map(function(x){return{id:trendosInvoiceTxtV1_(x.id),total:Number(Number(x.total||0).toFixed(4))};}).sort(function(a,b){return a.id.localeCompare(b.id);});
  return{items:items,subtotal:Number(Number(calc.subtotal||0).toFixed(4)),blockers:(calc.blockers||[]).map(trendosInvoiceTxtV1_).sort()};
}
function trendosInvoiceMaterialSignatureV1_(calc){
  const raw=typeof trendosStableJsonV1_==='function'?trendosStableJsonV1_(trendosInvoiceMaterialPayloadV1_(calc)):JSON.stringify(trendosInvoiceMaterialPayloadV1_(calc));
  return typeof trendosSha256HexV1_==='function'?trendosSha256HexV1_(raw):raw;
}
function trendosInvoiceRequestKeyV1_(orderId,revision){orderId=trendosNormalizeOrderId_(orderId);revision=Math.max(1,Math.floor(Number(revision||1)));return'TRENDOS-GLA-FINAL|'+orderId+'|R'+revision;}

function trendosInvoiceReadyOrderIdsV1_(limit){
  const ss=typeof trendosSpreadsheetV1_==='function'?trendosSpreadsheetV1_():ss_(),sh=ss.getSheetByName(typeof SHEET_NAME_LINES!=='undefined'?SHEET_NAME_LINES:TRENDOS_INVOICE_LINES_SHEET_V1);
  const result={orderIds:[],integrityErrors:[]};if(!sh||sh.getLastRow()<2)return result;
  const h=trendosInvoiceHeaderMap0V1_(sh),vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues(),groups={};
  vals.forEach(function(r,i){
    let raw='';['رقم الأوردر','كود الأوردر','Order ID','orderId'].some(function(k){if(h[k]!==undefined&&trendosInvoiceTxtV1_(r[h[k]])){raw=r[h[k]];return true;}return false;});
    if(!trendosInvoiceTxtV1_(raw))return;const oid=trendosNormalizeOrderId_(raw);if(!oid){result.integrityErrors.push({rowNumber:i+2,type:'INVALID_ORDER_ID',raw:trendosInvoiceTxtV1_(raw)});return;}
    let st='';['الحالة','Status','status'].some(function(k){if(h[k]!==undefined){st=trendosInvoiceTxtV1_(r[h[k]]);return true;}return false;});const ns=trendosInvoiceNormV1_(st);
    if(ns==='مكرر'||ns.indexOf('ملغ')!==-1)return;
    const g=groups[oid]||(groups[oid]={active:0,ready:0,delivered:false,blocked:false});
    if(ns.indexOf('تم التسليم')!==-1||ns.indexOf('delivered')!==-1){g.delivered=true;g.active++;return;}
    g.active++;
    if(st==='جاهز للاستلام'||st==='تم التنفيذ')g.ready++;else g.blocked=true;
  });
  const max=Math.min(Math.max(1,Number(limit||40)),100);
  Object.keys(groups).forEach(function(oid){const g=groups[oid];if(result.orderIds.length>=max)return;if(g.active>0&&!g.delivered&&!g.blocked&&g.ready===g.active)result.orderIds.push(oid);});
  return result;
}

function trendosInvoicePatchCanonicalV1_(orderId,patch){
  const resolved=trendosInvoiceResolveDraftV1_(orderId);if(!resolved.ok)return resolved;if(!resolved.row)return{ok:false,message:'Draft غير موجود.'};const sh=trendosInvoiceEnsureDraftColumnsV1_();trendosInvoicePatchRowV1_(sh,resolved.row,patch);return{ok:true,draft:trendosInvoiceDraftObjectV1_(trendosInvoiceResolveDraftV1_(orderId).row)};
}
function trendosInvoicePrepareUnlockedV1_(orderId,auth,note){
  orderId=trendosNormalizeOrderId_(orderId);if(!orderId)return{success:false,integrityError:true,message:'رقم الأوردر غير صالح.'};
  trendosInvoiceEnsureDraftColumnsV1_();
  let resolved=trendosInvoiceResolveDraftV1_(orderId);if(!resolved.ok)return Object.assign({success:false},resolved);
  const finals=trendosInvoiceFinalHistoryV1_(orderId);
  if(finals.active.length>1)return{success:false,integrityError:true,multipleActiveFinals:true,activeFinals:finals.active,message:'يوجد أكثر من Final Invoice فعالة لنفس الأوردر؛ تم إيقاف الـReady Sweep.'};
  if(finals.active.length===1){
    const f=finals.active[0];
    if(resolved.row){trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),resolved.row,{'الحالة':'تم التقفيل','رقم الفاتورة':f.invoiceNo,'Integrity State':'FINALIZED','Finalized At':new Date(),'Integrity Last Error':''});}
    return{success:true,skippedFinalized:true,alreadyFinalized:true,orderId:orderId,invoiceNo:f.invoiceNo,finalStatus:f.status};
  }
  const ctx=typeof glaOrderContext_==='function'?glaOrderContext_(orderId):{orderId:orderId,customerName:'',phone:'',status:'',paidSuggested:0};
  const calc=typeof glaDeptLines_==='function'?glaDeptLines_(orderId):{eligible:[],blockers:['محرك بنود الأقسام غير متاح'],subtotal:0};
  const sig=trendosInvoiceMaterialSignatureV1_(calc);
  if(!resolved.row){
    if(typeof glaUpsertDraft_!=='function')return{success:false,message:'محرك إنشاء Draft غير متاح.'};
    glaUpsertDraft_(ctx,calc,auth&&auth.user&&auth.user.username||'TrendOS',note||'');
    resolved=trendosInvoiceResolveDraftV1_(orderId);if(!resolved.ok||!resolved.row)return Object.assign({success:false,message:'تعذر إنشاء Draft canonical.'},resolved);
  }
  let d=trendosInvoiceDraftObjectV1_(resolved.row);
  if(d.integrityState==='FINALIZING'&&d.materialSignature&&d.materialSignature!==sig){
    trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),resolved.row,{'Integrity Last Error':'MATERIAL_CHANGED_DURING_FINALIZE'});
    return{success:false,integrityError:true,materialChangedDuringFinalize:true,message:'بيانات الفاتورة تغيرت بعد بدء التقفيل؛ يلزم مراجعة يدوية قبل أي Retry.'};
  }
  const reopened=!!(d.invoiceNo||d.integrityState==='FINALIZED');
  let revision=d.revision;
  if(!revision)revision=Math.max(1,finals.uniqueInvoiceCount+1);
  else if(reopened&&d.integrityState!=='FINALIZING')revision=Math.max(revision+1,finals.uniqueInvoiceCount+1);
  const blockers=(calc.blockers||[]).map(trendosInvoiceTxtV1_).filter(Boolean),ready=(calc.eligible||[]).length>0&&blockers.length===0;
  const requestKey=ready?(d.integrityState==='FINALIZING'&&d.finalizeRequestKey?d.finalizeRequestKey:trendosInvoiceRequestKeyV1_(orderId,revision)):'';
  const paid=Math.max(0,Number(ctx.paidSuggested||d.paidSuggested||0)),remaining=Math.max(0,Number(calc.subtotal||0)-paid);
  const patch={
    'رقم الأوردر':orderId,'اسم العميل':ctx.customerName||d.customerName,'رقم العميل':ctx.phone||d.phone,'حالة الأوردر':ctx.status||d.orderStatus,
    'بنود معتمدة':JSON.stringify((calc.eligible||[]).map(function(x){return trendosInvoiceTxtV1_(x.id);}).filter(Boolean)),
    'الإجمالي المقترح':Number(calc.subtotal||0),'مدفوع مقترح':paid,'الباقي المقترح':remaining,
    'الحالة':ready?'جاهز للتقفيل':'يحتاج تسعير/اعتماد','سبب التعطيل':blockers.join(' | '),
    'Integrity Revision':revision,'Integrity State':d.integrityState==='FINALIZING'?'FINALIZING':(ready?'PREPARED':'BLOCKED'),
    'Material Signature':sig,'Finalize Request Key':requestKey,'Integrity Last Error':''
  };
  if(reopened&&d.integrityState!=='FINALIZING'){
    patch['Previous Invoice No']=d.invoiceNo||d.previousInvoiceNo||'';patch['رقم الفاتورة']='';patch['حالة رسالة واتساب']='';patch['Meta Message ID']='';patch['Finalized At']='';
  }
  if(note!==undefined)patch['ملاحظات']=trendosInvoiceTxtV1_(note);
  trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),resolved.row,patch);
  d=trendosInvoiceDraftObjectV1_(trendosInvoiceResolveDraftV1_(orderId).row);
  return{success:true,orderId:orderId,ready:ready,blocker:d.blocker,draft:d,revision:revision,requestKey:requestKey,materialSignature:sig,lineIds:d.lineIds,subtotal:d.subtotal};
}
function trendosInvoicePrepareV1_(orderId,auth,note){return trendosWithLock_('script',function(){return trendosInvoicePrepareUnlockedV1_(orderId,auth,note);},30000);}

function trendosInvoiceCheckpointFinalizingV1_(orderId){
  return trendosWithLock_('script',function(){
    const resolved=trendosInvoiceResolveDraftV1_(orderId);if(!resolved.ok)return Object.assign({success:false},resolved);if(!resolved.row)return{success:false,message:'Draft غير موجود.'};
    const d=trendosInvoiceDraftObjectV1_(resolved.row);if(d.integrityState!=='PREPARED'&&d.integrityState!=='FINALIZING')return{success:false,message:'Draft غير جاهز للتقفيل.',draft:d};
    if(!d.finalizeRequestKey||!d.revision)return{success:false,integrityError:true,message:'Finalize checkpoint غير مكتمل.'};
    trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),resolved.row,{'Integrity State':'FINALIZING','Integrity Last Error':''});
    try{SpreadsheetApp.flush();}catch(e){}
    return{success:true,draft:trendosInvoiceDraftObjectV1_(trendosInvoiceResolveDraftV1_(orderId).row)};
  },30000);
}
function trendosInvoiceFinalizeV1_(p,auth){
  p=p||{};const orderId=trendosNormalizeOrderId_(p.orderId);if(!orderId)return{success:false,message:'رقم الأوردر غير صالح.'};
  const prep=trendosInvoicePrepareV1_(orderId,auth,'إعادة تحقق قبل التقفيل');if(!prep.success)return prep;if(prep.skippedFinalized)return prep;if(!prep.ready)return{success:false,message:prep.blocker||'الفاتورة غير جاهزة للتقفيل.',draft:prep.draft};
  const checkpoint=trendosInvoiceCheckpointFinalizingV1_(orderId);if(!checkpoint.success)return checkpoint;const d=checkpoint.draft;
  if(typeof saveAccountingFinalInvoice_!=='function')return{success:false,message:'محرك الفاتورة النهائية غير متاح.'};
  const evt={parameter:Object.assign({},p,{orderId:orderId,customerName:d.customerName,lineIds:JSON.stringify(d.lineIds),paid:p.paid!==undefined&&p.paid!==''?p.paid:d.paidSuggested,requestId:d.finalizeRequestKey,username:p.username,token:p.token})};
  let invoice;
  try{invoice=saveAccountingFinalInvoice_(evt);}catch(err){
    trendosWithLock_('script',function(){const r=trendosInvoiceResolveDraftV1_(orderId);if(r.ok&&r.row)trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),r.row,{'Integrity Last Error':trendosInvoiceTxtV1_(err&&err.message||err)});},30000);
    return{success:false,retrySafe:true,requestKey:d.finalizeRequestKey,message:'تعذر إكمال التقفيل. تم الاحتفاظ بنفس Finalize Request Key للـRetry.',error:trendosInvoiceTxtV1_(err&&err.message||err)};
  }
  if(!invoice||invoice.success===false){
    trendosWithLock_('script',function(){const r=trendosInvoiceResolveDraftV1_(orderId);if(r.ok&&r.row)trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),r.row,{'Integrity Last Error':trendosInvoiceTxtV1_(invoice&&invoice.message||'FINAL_WRITER_FAILED')});},30000);
    return invoice||{success:false,retrySafe:true,requestKey:d.finalizeRequestKey,message:'تعذر تقفيل الفاتورة.'};
  }
  const reconciled=trendosWithLock_('script',function(){
    const r=trendosInvoiceResolveDraftV1_(orderId);if(!r.ok||!r.row)return Object.assign({success:false},r);
    trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),r.row,{'الحالة':'تم التقفيل','رقم الفاتورة':invoice.invoiceNo||'','مدفوع مقترح':invoice.paid||0,'الباقي المقترح':invoice.remaining||0,'سبب التعطيل':'','Integrity State':'FINALIZED','Finalized At':new Date(),'Integrity Last Error':''});
    return{success:true,draft:trendosInvoiceDraftObjectV1_(trendosInvoiceResolveDraftV1_(orderId).row)};
  },30000);
  if(!reconciled.success)return{success:false,invoiceCreated:true,requestKey:d.finalizeRequestKey,invoice:invoice,message:'الفاتورة النهائية تم إنشاؤها لكن Draft reconciliation يحتاج إصلاح؛ لا تعِد إنشاء فاتورة جديدة.'};
  let notify=null;if(trendosInvoiceTxtV1_(p.send)==='1')notify=trendosInvoiceSendReadyV1_(orderId,invoice);
  return{success:true,invoice:invoice,draft:reconciled.draft,requestKey:d.finalizeRequestKey,revision:d.revision,notify:notify,message:notify&&notify.success?'تم التقفيل والإرسال.':'تم التقفيل بنجاح.'};
}

function trendosInvoiceSendReadyV1_(orderId,invoice){
  orderId=trendosNormalizeOrderId_(orderId);
  const gate=trendosWithLock_('script',function(){
    const r=trendosInvoiceResolveDraftV1_(orderId);if(!r.ok||!r.row)return Object.assign({success:false},r);const d=trendosInvoiceDraftObjectV1_(r.row);
    if(!d.invoiceNo||d.integrityState==='PREPARED'||d.integrityState==='FINALIZING')return{success:false,message:'يجب تقفيل الفاتورة أولاً.'};
    if(d.messageStatus==='تم الإرسال'||d.metaId)return{success:true,duplicatePrevented:true,alreadySent:true,draft:d};
    if(d.integrityState==='NOTIFYING')return{success:false,ambiguousSend:true,message:'إرسال سابق حالته غير محسومة؛ لا يتم إعادة الإرسال تلقائياً.'};
    trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),r.row,{'Integrity State':'NOTIFYING','Integrity Last Error':''});try{SpreadsheetApp.flush();}catch(e){}
    return{success:true,draft:trendosInvoiceDraftObjectV1_(trendosInvoiceResolveDraftV1_(orderId).row)};
  },30000);
  if(!gate.success||gate.alreadySent)return gate;
  let sent;
  try{
    if(typeof glaSendReady_!=='function')throw new Error('محرك إرسال الجاهزية غير متاح.');
    if(glaSendReady_.length>=2)sent=glaSendReady_(gate.draft,invoice||{invoiceNo:gate.draft.invoiceNo,finalTotal:gate.draft.subtotal,paid:gate.draft.paidSuggested,remaining:gate.draft.remainingSuggested});
    else sent=glaSendReady_(orderId);
  }catch(err){
    trendosWithLock_('script',function(){const r=trendosInvoiceResolveDraftV1_(orderId);if(r.ok&&r.row)trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),r.row,{'Integrity Last Error':'AMBIGUOUS_NOTIFY: '+trendosInvoiceTxtV1_(err&&err.message||err)});},30000);
    return{success:false,ambiguousSend:true,message:'تعذر تأكيد نتيجة WhatsApp؛ تم منع Auto Retry لتجنب رسالة مكررة.',error:trendosInvoiceTxtV1_(err&&err.message||err)};
  }
  return trendosWithLock_('script',function(){const r=trendosInvoiceResolveDraftV1_(orderId);if(r.ok&&r.row)trendosInvoicePatchRowV1_(trendosInvoiceEnsureDraftColumnsV1_(),r.row,{'Integrity State':'FINALIZED','Integrity Last Error':''});return{success:true,sent:sent,draft:r.ok&&r.row?trendosInvoiceDraftObjectV1_(trendosInvoiceResolveDraftV1_(orderId).row):null};},30000);
}

function trendosInvoiceSweepReadyV1_(auth,limit){
  const scan=trendosInvoiceReadyOrderIdsV1_(limit),prepared=[],skippedFinalized=[],errors=scan.integrityErrors.slice();
  scan.orderIds.forEach(function(orderId){const r=trendosInvoicePrepareV1_(orderId,auth,'TrendOS Integrity Ready Sweep');if(r.success&&r.skippedFinalized)skippedFinalized.push({orderId:orderId,invoiceNo:r.invoiceNo});else if(r.success)prepared.push(r);else errors.push({orderId:orderId,message:r.message||'INTEGRITY_ERROR'});});
  return{success:errors.length===0,prepared:prepared,preparedCount:prepared.length,skippedFinalized:skippedFinalized,skippedFinalizedCount:skippedFinalized.length,integrityErrors:errors};
}
function trendosInvoiceListDraftsV1_(limit){if(typeof glaListDrafts_==='function')return glaListDrafts_(limit);if(typeof glaList_==='function')return glaList_(limit);return[];}
function trendosGoLiveAutopilotV1_(e){
  e=e||{parameter:{}};const p=e.parameter||{},auth=typeof glaAuth_==='function'?glaAuth_(p):authorize_(p.username,p.token);if(!auth||!auth.ok)return{success:false,message:auth&&auth.message||'غير مصرح.'};
  const op=trendosInvoiceTxtV1_(p.op||'listDrafts');
  if(op==='ping')return{success:true,version:TRENDOS_INVOICE_INTEGRITY_VERSION_V1};
  if(op==='sweepReady')return trendosInvoiceSweepReadyV1_(auth,p.limit);
  if(op==='prepareReadyInvoice')return trendosInvoicePrepareV1_(p.orderId,auth,p.notes);
  if(op==='listDrafts')return{success:true,drafts:trendosInvoiceListDraftsV1_(p.limit)};
  if(op==='finalizeAndNotify')return trendosInvoiceFinalizeV1_(p,auth);
  if(op==='sendReady')return trendosInvoiceSendReadyV1_(p.orderId,null);
  if(op==='deliveryChoice')return trendosWithLock_('script',function(){const r=trendosInvoicePatchCanonicalV1_(p.orderId,{'اختيار الاستلام':trendosInvoiceTxtV1_(p.choice)});return r.ok?{success:true,choice:trendosInvoiceTxtV1_(p.choice),draft:r.draft}:Object.assign({success:false},r);},30000);
  return{success:false,message:'أمر Go-Live Integrity غير معروف.'};
}
