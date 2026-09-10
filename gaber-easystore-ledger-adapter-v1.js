/*
 * TrendOS / EasyStore — Gaber EasyStore -> Material Ledger Adapter V1
 * PURE / STORE-INDEPENDENT / ZERO EXTERNAL WRITES.
 *
 * Maps existing EasyStore accounting/task facts into deterministic append-only
 * Gaber Material Movement Ledger events. It does NOT persist anything itself.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TrendOSGaberEasyStoreLedgerAdapterV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='GABER_EASYSTORE_LEDGER_ADAPTER_V1_20260910';
  const EPS=1e-9;

  function text(v){return String(v==null?'':v).trim();}
  function upper(v){return text(v).toUpperCase();}
  function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
  function positive(v){const n=finite(v);return n!=null&&n>0?n:null;}
  function nonNegative(v){const n=finite(v);return n!=null&&n>=0?n:null;}
  function round(n,p=8){const m=Math.pow(10,p);return Math.round((Number(n)||0)*m)/m;}
  function dateKey(v){
    if(!v)return '';
    const s=text(v);if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
    const d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):'';
  }
  function canonical(v){
    if(Array.isArray(v))return v.map(canonical);
    if(v&&typeof v==='object'){const o={};Object.keys(v).sort().forEach(k=>{if(v[k]!==undefined)o[k]=canonical(v[k]);});return o;}
    if(typeof v==='number')return Number.isFinite(v)?round(v,10):null;
    return v;
  }
  function stableStringify(v){return JSON.stringify(canonical(v));}
  function normArabic(v){return text(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/[ى]/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
  function statusHas(v,parts){const s=normArabic(v);return parts.some(p=>s.indexOf(normArabic(p))!==-1);}
  function blocker(code,extra){return Object.assign({code},extra||{});}

  function catalogRows(catalog){return Array.isArray(catalog)?catalog:[];}
  function materialAliases(row){
    const out=[row&&row.materialName,row&&row.name,row&&row.itemName];
    if(Array.isArray(row&&row.aliases))out.push.apply(out,row.aliases);
    return out.map(normArabic).filter(Boolean);
  }
  function resolveMaterial(raw,catalog){
    raw=raw||{};
    const directId=text(raw.materialId||raw.itemId);
    if(directId)return {ok:true,materialId:directId,materialName:text(raw.materialName||raw.material||raw.itemName||raw.name),unit:text(raw.unit)||'unit',unitCost:nonNegative(raw.unitCost)};
    const wanted=normArabic(raw.materialName||raw.material||raw.itemName||raw.name);
    const dept=normArabic(raw.department||'ليزر');
    if(!wanted)return {ok:false,blocker:blocker('MATERIAL_NAME_REQUIRED')};
    const matches=catalogRows(catalog).filter(row=>{
      const rowDept=normArabic(row.department||row.dept||'');
      const deptOk=!rowDept||rowDept===dept||rowDept==='مشترك'||rowDept==='عام';
      return deptOk&&materialAliases(row).indexOf(wanted)!==-1;
    });
    if(matches.length!==1)return {ok:false,blocker:blocker(matches.length?'MATERIAL_ID_MAPPING_AMBIGUOUS':'MATERIAL_ID_MAPPING_REQUIRED',{materialName:text(raw.materialName||raw.material||raw.itemName||raw.name),department:text(raw.department||'ليزر'),matchCount:matches.length})};
    const row=matches[0],id=text(row.materialId||row.itemId||row.id);
    if(!id)return {ok:false,blocker:blocker('MATERIAL_ID_MAPPING_REQUIRED',{materialName:text(raw.materialName||raw.material||raw.itemName||raw.name),reason:'CATALOG_ROW_HAS_NO_STABLE_ID'})};
    return {ok:true,materialId:id,materialName:text(row.materialName||row.name||row.itemName||raw.materialName||raw.material),unit:text(raw.unit||row.unit)||'unit',unitCost:nonNegative(raw.unitCost!=null?raw.unitCost:row.unitCost)};
  }

  function normalizeEasyStorePurchase(raw){
    raw=raw||{};
    const qty=positive(raw.stockAppliedQty!=null&&raw.stockAppliedQty!==''?raw.stockAppliedQty:raw.qty);
    const total=nonNegative(raw.total);
    const unitPrice=nonNegative(raw.unitPrice!=null?raw.unitPrice:raw.unit);
    return {
      purchaseId:text(raw.purchaseId||raw.id),requestId:text(raw.requestId),
      workDate:dateKey(raw.workDate||raw.date||raw.createdAt),createdAt:text(raw.createdAt),
      employee:text(raw.employee||raw.username||raw.createdBy),department:text(raw.department||'ليزر'),
      supplier:text(raw.supplier),invoiceNo:text(raw.receiptNo||raw.invoiceNo||raw.officialInvoiceNo),
      materialId:text(raw.materialId||raw.itemId),materialName:text(raw.materialName||raw.material||raw.itemName||raw.name),
      qty,unit:text(raw.unitName||raw.measureUnit||raw.uom||raw.unit)||'unit',unitPrice,total,
      status:text(raw.status),stockStatus:text(raw.stockStatus),stockAppliedAt:text(raw.stockAppliedAt),
      stockAppliedQty:positive(raw.stockAppliedQty),stockAfter:nonNegative(raw.stockAfter),
      stockReversedAt:text(raw.stockReversedAt),stockReversalReason:text(raw.stockReversalReason),
      notes:text(raw.notes)
    };
  }
  function purchaseWasApplied(p){
    if(p.stockAppliedQty!=null)return p.stockAppliedQty>0;
    if(p.stockAppliedAt)return true;
    return statusHas(p.stockStatus,['مضاف','applied','posted'])&&!statusHas(p.stockStatus,['عكس','ملغي','مرفوض','revers','reject','cancel']);
  }
  function purchaseWasReversed(p){
    return !!p.stockReversedAt||statusHas(p.stockStatus,['عكس','ملغي','مرفوض','revers','reject','cancel'])||statusHas(p.status,['مرفوض','ملغي','rejected','cancelled']);
  }
  function purchaseToEvents(raw,catalog){
    const p=normalizeEasyStorePurchase(raw),blockers=[],events=[];
    if(!p.purchaseId)blockers.push(blocker('EASYSTORE_PURCHASE_ID_REQUIRED'));
    if(!p.workDate)blockers.push(blocker('EASYSTORE_PURCHASE_WORK_DATE_REQUIRED',{purchaseId:p.purchaseId}));
    if(!p.supplier)blockers.push(blocker('EASYSTORE_PURCHASE_SUPPLIER_REQUIRED',{purchaseId:p.purchaseId}));
    if(!p.invoiceNo)blockers.push(blocker('EASYSTORE_PURCHASE_INVOICE_REQUIRED',{purchaseId:p.purchaseId}));
    const resolved=resolveMaterial({materialId:p.materialId,materialName:p.materialName,department:p.department,unit:p.unit,unitCost:p.unitPrice},catalog);
    if(!resolved.ok)blockers.push(Object.assign({purchaseId:p.purchaseId},resolved.blocker));
    const applied=purchaseWasApplied(p),reversed=purchaseWasReversed(p);
    if(!applied&&!reversed)return {version:VERSION,canAppend:blockers.length===0,events:[],blockers,purchase:p,ignored:true,reason:'STOCK_NOT_APPLIED'};
    const qty=p.stockAppliedQty||p.qty;
    if(qty==null)blockers.push(blocker('EASYSTORE_PURCHASE_APPLIED_QTY_REQUIRED',{purchaseId:p.purchaseId}));
    if(blockers.length)return {version:VERSION,canAppend:false,events:[],blockers,purchase:p};
    const unitCost=p.unitPrice!=null?p.unitPrice:(p.total!=null&&qty?round(p.total/qty):resolved.unitCost);
    events.push({
      eventId:'GABER:PURCHASE:'+p.purchaseId,
      type:'PURCHASE_RECEIPT',workDate:p.workDate,occurredAt:p.stockAppliedAt||p.createdAt,
      department:p.department,employee:p.employee,
      materialId:resolved.materialId,materialName:resolved.materialName||p.materialName,unit:resolved.unit||p.unit,
      qty:qty,unitCost:unitCost,totalValue:p.total,
      purchaseId:p.purchaseId,supplier:p.supplier,invoiceNo:p.invoiceNo,
      sourceRef:'EASYSTORE:DPP:'+p.purchaseId,notes:p.notes
    });
    if(reversed){
      events.push({
        eventId:'GABER:PURCHASE-REVERSAL:'+p.purchaseId,
        type:'ADJUSTMENT_OUT',workDate:dateKey(p.stockReversedAt)||p.workDate,occurredAt:p.stockReversedAt,
        department:p.department,employee:p.employee,
        materialId:resolved.materialId,materialName:resolved.materialName||p.materialName,unit:resolved.unit||p.unit,
        qty:qty,unitCost:unitCost,totalValue:p.total,
        sourceRef:'EASYSTORE:DPP_REVERSAL:'+p.purchaseId,reversalOf:'GABER:PURCHASE:'+p.purchaseId,
        notes:p.stockReversalReason||('Reversed EasyStore department purchase '+p.purchaseId)
      });
    }
    return {version:VERSION,canAppend:true,events:canonical(events),blockers:[],purchase:p};
  }

  function normalizeTask(raw){
    raw=raw||{};
    return {
      taskId:text(raw.taskId),orderId:text(raw.orderId),lineId:text(raw.lineId),
      employee:text(raw.operator||raw.employee||'جابر'),department:text(raw.department||'ليزر'),
      workDate:dateKey(raw.workDate||raw.completedAt||raw.closedAt||raw.startedAt),
      startedAt:text(raw.startedAt),completedAt:text(raw.completedAt||raw.closedAt),
      materials:Array.isArray(raw.materials)?raw.materials:[],wastes:Array.isArray(raw.wastes)?raw.wastes:[]
    };
  }
  function taskCloseToEvents(raw,catalog){
    const t=normalizeTask(raw),blockers=[],events=[];
    if(!t.taskId)blockers.push(blocker('TASK_ID_REQUIRED'));
    if(!t.orderId)blockers.push(blocker('ORDER_ID_REQUIRED'));
    if(!t.lineId)blockers.push(blocker('LINE_ID_REQUIRED'));
    if(!t.workDate)blockers.push(blocker('TASK_WORK_DATE_REQUIRED',{taskId:t.taskId}));
    const materialMap=new Map();
    t.materials.forEach((m,index)=>{
      const resolved=resolveMaterial(Object.assign({},m,{department:t.department}),catalog);
      if(!resolved.ok){blockers.push(Object.assign({taskId:t.taskId,materialIndex:index},resolved.blocker));return;}
      const issued=nonNegative(m.issuedQty),consumed=nonNegative(m.consumedQty),returned=nonNegative(m.returnedQty),offcut=nonNegative(m.offcutQty!=null?m.offcutQty:m.reusableOffcutQty),waste=nonNegative(m.wasteQty),unitCost=nonNegative(m.unitCost!=null?m.unitCost:resolved.unitCost);
      if([issued,consumed,returned,offcut,waste].some(v=>v==null)){blockers.push(blocker('TASK_MATERIAL_QUANTITY_INVALID',{taskId:t.taskId,materialId:resolved.materialId,materialIndex:index}));return;}
      if((consumed>0||waste>0)&&unitCost==null){blockers.push(blocker('ACCOUNTING_COST_UNAVAILABLE',{taskId:t.taskId,materialId:resolved.materialId}));return;}
      if(Math.abs(issued-(consumed+returned+offcut+waste))>EPS){blockers.push(blocker('MATERIAL_BALANCE_NOT_ZERO',{taskId:t.taskId,materialId:resolved.materialId,issuedQty:issued,accountedQty:round(consumed+returned+offcut+waste)}));return;}
      materialMap.set(resolved.materialId,{resolved,issued,consumed,returned,offcut,waste,unitCost});
      const base={workDate:t.workDate,department:t.department,employee:t.employee,taskId:t.taskId,orderId:t.orderId,lineId:t.lineId,materialId:resolved.materialId,materialName:resolved.materialName,unit:resolved.unit,sourceRef:'OPERATOR_TASK_V2:'+t.taskId};
      if(issued>0)events.push(Object.assign({},base,{eventId:'GABER:TASK:'+t.taskId+':'+resolved.materialId+':ISSUE',type:'TASK_ISSUE',occurredAt:t.startedAt||t.completedAt,qty:issued,unitCost}));
      if(consumed>0)events.push(Object.assign({},base,{eventId:'GABER:TASK:'+t.taskId+':'+resolved.materialId+':CONSUMED',type:'PRODUCTION_CONSUMED',occurredAt:t.completedAt||t.startedAt,qty:consumed,unitCost,totalValue:round(consumed*unitCost)}));
      if(returned>0)events.push(Object.assign({},base,{eventId:'GABER:TASK:'+t.taskId+':'+resolved.materialId+':RETURN',type:'RETURNED_TO_STOCK',occurredAt:t.completedAt||t.startedAt,qty:returned,unitCost}));
      if(offcut>0)events.push(Object.assign({},base,{eventId:'GABER:TASK:'+t.taskId+':'+resolved.materialId+':OFFCUT',type:'REUSABLE_OFFCUT_RETURN',occurredAt:t.completedAt||t.startedAt,qty:offcut,unitCost}));
    });

    const wasteByMaterial=new Map();
    t.wastes.forEach((w,index)=>{
      const resolved=resolveMaterial(Object.assign({},w,{department:t.department}),catalog);
      if(!resolved.ok){blockers.push(Object.assign({taskId:t.taskId,wasteIndex:index},resolved.blocker));return;}
      const m=materialMap.get(resolved.materialId),qty=positive(w.qty),wasteId=text(w.wasteId||w.id),reasonCode=upper(w.reasonCode||w.reason),unitCost=nonNegative(w.unitCost!=null?w.unitCost:(m&&m.unitCost));
      if(!wasteId)blockers.push(blocker('WASTE_ID_REQUIRED',{taskId:t.taskId,wasteIndex:index,materialId:resolved.materialId}));
      if(qty==null)blockers.push(blocker('WASTE_POSITIVE_QTY_REQUIRED',{taskId:t.taskId,wasteId}));
      if(!reasonCode)blockers.push(blocker('WASTE_REASON_REQUIRED',{taskId:t.taskId,wasteId}));
      if(unitCost==null)blockers.push(blocker('ACCOUNTING_COST_UNAVAILABLE',{taskId:t.taskId,wasteId,materialId:resolved.materialId}));
      if(!wasteId||qty==null||!reasonCode||unitCost==null)return;
      wasteByMaterial.set(resolved.materialId,round((wasteByMaterial.get(resolved.materialId)||0)+qty));
      events.push({
        eventId:'GABER:WASTE:'+wasteId,type:'WASTE_SCRAP',workDate:t.workDate,occurredAt:t.completedAt||t.startedAt,
        department:t.department,employee:t.employee,taskId:t.taskId,orderId:t.orderId,lineId:t.lineId,
        materialId:resolved.materialId,materialName:resolved.materialName,unit:resolved.unit,qty,unitCost,totalValue:round(qty*unitCost),
        wasteId,reasonCode,sourceRef:'OPERATOR_TASK_V2:'+t.taskId,notes:text(w.notes)
      });
    });
    materialMap.forEach((m,materialId)=>{
      const detail=round(wasteByMaterial.get(materialId)||0);
      if(Math.abs(detail-m.waste)>EPS)blockers.push(blocker('WASTE_DETAIL_MISMATCH',{taskId:t.taskId,materialId,materialWasteQty:m.waste,wasteDetailQty:detail}));
    });
    if(blockers.length)return {version:VERSION,canAppend:false,events:[],blockers,task:t};
    return {version:VERSION,canAppend:true,events:canonical(events),blockers:[],task:t};
  }

  function buildCandidateBatch(input){
    input=input||{};const blockers=[],events=[];
    (Array.isArray(input.purchases)?input.purchases:[]).forEach((p,index)=>{
      const r=purchaseToEvents(p,input.materialCatalog);if(!r.canAppend)r.blockers.forEach(b=>blockers.push(Object.assign({purchaseIndex:index},b)));else events.push.apply(events,r.events);
    });
    (Array.isArray(input.taskCloses)?input.taskCloses:[]).forEach((t,index)=>{
      const r=taskCloseToEvents(t,input.materialCatalog);if(!r.canAppend)r.blockers.forEach(b=>blockers.push(Object.assign({taskCloseIndex:index},b)));else events.push.apply(events,r.events);
    });
    return canonical({version:VERSION,canAppend:blockers.length===0,events:blockers.length?[]:events,blockers});
  }

  return {VERSION,resolveMaterial,normalizeEasyStorePurchase,purchaseToEvents,taskCloseToEvents,buildCandidateBatch,stableStringify};
});
