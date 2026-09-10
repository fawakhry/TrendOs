/*
 * TrendOS / EasyStore — Gaber Material Movement Ledger Contract V1
 * PURE / STORE-INDEPENDENT / ZERO EXTERNAL WRITES.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TrendOSGaberMaterialMovementLedgerV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='GABER_MATERIAL_MOVEMENT_LEDGER_V1_20260910';
  const TYPES=new Set([
    'PURCHASE_RECEIPT','TASK_ISSUE','PRODUCTION_CONSUMED','RETURNED_TO_STOCK',
    'REUSABLE_OFFCUT_RETURN','WASTE_SCRAP','ADJUSTMENT_IN','ADJUSTMENT_OUT'
  ]);
  const TASK_TYPES=new Set(['TASK_ISSUE','PRODUCTION_CONSUMED','RETURNED_TO_STOCK','REUSABLE_OFFCUT_RETURN','WASTE_SCRAP']);

  function text(v){return String(v==null?'':v).trim();}
  function upper(v){return text(v).toUpperCase();}
  function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
  function positive(v){const n=finite(v);return n!=null&&n>0?n:null;}
  function nonNegative(v){const n=finite(v);return n!=null&&n>=0?n:null;}
  function round(n,p=8){const m=Math.pow(10,p);return Math.round((Number(n)||0)*m)/m;}
  function canonical(v){
    if(Array.isArray(v))return v.map(canonical);
    if(v&&typeof v==='object'){const o={};Object.keys(v).sort().forEach(k=>{if(v[k]!==undefined)o[k]=canonical(v[k]);});return o;}
    if(typeof v==='number')return Number.isFinite(v)?round(v,10):null;
    return v;
  }
  function stableStringify(v){return JSON.stringify(canonical(v));}
  function hash(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,'0');}
  function fingerprint(v){const s=stableStringify(v);return 'GML1-'+hash(s)+'-'+s.length.toString(36);}
  function dateKey(v){
    if(!v)return '';
    if(/^\d{4}-\d{2}-\d{2}$/.test(text(v)))return text(v);
    const d=new Date(v);if(!Number.isFinite(d.getTime()))return '';
    return d.toISOString().slice(0,10);
  }

  function normalizeEvent(raw){
    raw=raw||{};
    const qty=positive(raw.qty);
    const unitCost=raw.unitCost==null||raw.unitCost===''?null:nonNegative(raw.unitCost);
    const totalValue=raw.totalValue==null||raw.totalValue===''?null:nonNegative(raw.totalValue);
    return canonical({
      eventId:text(raw.eventId||raw.movementId||raw.id),
      type:upper(raw.type||raw.movementType),
      workDate:dateKey(raw.workDate||raw.occurredAt||raw.timestamp),
      occurredAt:text(raw.occurredAt||raw.timestamp),
      department:text(raw.department||'ليزر'),
      employee:text(raw.employee||raw.operator),
      taskId:text(raw.taskId),orderId:text(raw.orderId),lineId:text(raw.lineId),
      materialId:text(raw.materialId||raw.itemId),materialName:text(raw.materialName||raw.itemName||raw.name),unit:text(raw.unit||'unit'),
      qty,unitCost,totalValue,
      purchaseId:text(raw.purchaseId),supplier:text(raw.supplier),invoiceNo:text(raw.invoiceNo||raw.receiptNo),
      wasteId:text(raw.wasteId),reasonCode:upper(raw.reasonCode||raw.reason),
      sourceRef:text(raw.sourceRef),reversalOf:text(raw.reversalOf),notes:text(raw.notes)
    });
  }

  function validateEvent(raw){
    const e=normalizeEvent(raw),blockers=[];
    if(!e.eventId)blockers.push({code:'MOVEMENT_EVENT_ID_REQUIRED'});
    if(!TYPES.has(e.type))blockers.push({code:'MOVEMENT_TYPE_INVALID',type:e.type});
    if(!e.workDate)blockers.push({code:'MOVEMENT_WORK_DATE_REQUIRED'});
    if(!e.materialId)blockers.push({code:'MATERIAL_ID_REQUIRED'});
    if(e.qty==null)blockers.push({code:'MOVEMENT_POSITIVE_QUANTITY_REQUIRED'});
    if(TASK_TYPES.has(e.type)){
      if(!e.taskId)blockers.push({code:'TASK_ID_REQUIRED'});
      if(!e.orderId)blockers.push({code:'ORDER_ID_REQUIRED'});
      if(!e.lineId)blockers.push({code:'LINE_ID_REQUIRED'});
    }
    if(e.type==='PURCHASE_RECEIPT'){
      if(!e.purchaseId)blockers.push({code:'PURCHASE_ID_REQUIRED'});
      if(!e.invoiceNo)blockers.push({code:'PURCHASE_INVOICE_NUMBER_REQUIRED'});
    }
    if(e.type==='WASTE_SCRAP'){
      if(!e.wasteId)blockers.push({code:'WASTE_ID_REQUIRED'});
      if(!e.reasonCode)blockers.push({code:'WASTE_REASON_REQUIRED'});
    }
    if((e.type==='PRODUCTION_CONSUMED'||e.type==='WASTE_SCRAP')&&e.unitCost==null)blockers.push({code:'ACCOUNTING_COST_UNAVAILABLE'});
    if((e.type==='ADJUSTMENT_IN'||e.type==='ADJUSTMENT_OUT')&&!e.sourceRef&&!e.notes)blockers.push({code:'ADJUSTMENT_REASON_REQUIRED'});
    return {event:e,blockers,valid:blockers.length===0,eventFingerprint:fingerprint(e)};
  }

  function buildAppendPlan(existingEvents,incomingEvents){
    existingEvents=Array.isArray(existingEvents)?existingEvents:[];
    incomingEvents=Array.isArray(incomingEvents)?incomingEvents:[];
    const known=new Map(),acceptedEvents=[],replayedEventIds=[],blockers=[];

    existingEvents.forEach((raw,index)=>{
      const v=validateEvent(raw);
      if(!v.valid){blockers.push({code:'EXISTING_LEDGER_EVENT_INVALID',existingIndex:index,eventId:v.event.eventId,details:v.blockers});return;}
      const prior=known.get(v.event.eventId);
      if(prior&&prior!==v.eventFingerprint)blockers.push({code:'EXISTING_LEDGER_EVENT_ID_CONFLICT',eventId:v.event.eventId});
      else known.set(v.event.eventId,v.eventFingerprint);
    });

    incomingEvents.forEach((raw,index)=>{
      const v=validateEvent(raw);
      if(!v.valid){blockers.push({code:'MOVEMENT_EVENT_INVALID',incomingIndex:index,eventId:v.event.eventId,details:v.blockers});return;}
      const prior=known.get(v.event.eventId);
      if(prior){
        if(prior===v.eventFingerprint)replayedEventIds.push(v.event.eventId);
        else blockers.push({code:'MOVEMENT_EVENT_ID_CONFLICT',incomingIndex:index,eventId:v.event.eventId});
        return;
      }
      known.set(v.event.eventId,v.eventFingerprint);
      acceptedEvents.push(Object.assign({},v.event,{eventFingerprint:v.eventFingerprint}));
    });

    const canCommit=blockers.length===0;
    return canonical({
      version:VERSION,canCommit,blockers,
      acceptedEvents:canCommit?acceptedEvents:[],
      replayedEventIds:canCommit?replayedEventIds:[],
      planFingerprint:fingerprint({acceptedEvents:canCommit?acceptedEvents:[],replayedEventIds:canCommit?replayedEventIds:[],blockers})
    });
  }

  function deriveDailyMaterialFacts(events,opts){
    events=Array.isArray(events)?events:[];opts=opts||{};
    const wantedDate=dateKey(opts.workDate),wantedDept=text(opts.department||'ليزر').toLowerCase();
    const rows=new Map(),blockers=[];
    function rowFor(e){
      const key=e.materialId+'::'+e.unit;
      if(!rows.has(key))rows.set(key,{
        materialId:e.materialId,materialName:e.materialName,unit:e.unit,
        purchasedQty:0,issuedQty:0,orderOutQty:0,returnedQty:0,offcutQty:0,wasteQty:0,otherInQty:0,otherOutQty:0,
        purchaseValue:0,goodConsumptionCost:0,wasteCost:0,
        purchaseRefs:[],issueRefs:[],orderOutRefs:[],returnRefs:[],offcutRefs:[],wasteRefs:[],adjustmentRefs:[]
      });
      const r=rows.get(key);if(!r.materialName)r.materialName=e.materialName;return r;
    }
    function ref(e){return {eventId:e.eventId,taskId:e.taskId,orderId:e.orderId,lineId:e.lineId,purchaseId:e.purchaseId,wasteId:e.wasteId,qty:e.qty};}

    events.forEach((raw,index)=>{
      const v=validateEvent(raw);
      if(!v.valid){blockers.push({code:'MOVEMENT_EVENT_INVALID',eventIndex:index,eventId:v.event.eventId,details:v.blockers});return;}
      const e=v.event;
      if(wantedDate&&e.workDate!==wantedDate)return;
      if(wantedDept&&text(e.department).toLowerCase()!==wantedDept)return;
      const r=rowFor(e),q=e.qty||0,c=e.unitCost||0;
      if(e.type==='PURCHASE_RECEIPT'){r.purchasedQty+=q;r.purchaseValue+=e.totalValue!=null?e.totalValue:q*c;r.purchaseRefs.push(ref(e));}
      else if(e.type==='TASK_ISSUE'){r.issuedQty+=q;r.issueRefs.push(ref(e));}
      else if(e.type==='PRODUCTION_CONSUMED'){r.orderOutQty+=q;r.goodConsumptionCost+=q*c;r.orderOutRefs.push(ref(e));}
      else if(e.type==='RETURNED_TO_STOCK'){r.returnedQty+=q;r.returnRefs.push(ref(e));}
      else if(e.type==='REUSABLE_OFFCUT_RETURN'){r.offcutQty+=q;r.offcutRefs.push(ref(e));}
      else if(e.type==='WASTE_SCRAP'){r.wasteQty+=q;r.wasteCost+=q*c;r.wasteRefs.push(Object.assign(ref(e),{reasonCode:e.reasonCode}));}
      else if(e.type==='ADJUSTMENT_IN'){r.otherInQty+=q;r.adjustmentRefs.push(ref(e));}
      else if(e.type==='ADJUSTMENT_OUT'){r.otherOutQty+=q;r.adjustmentRefs.push(ref(e));}
    });

    const out=[];rows.forEach(r=>{
      ['purchasedQty','issuedQty','orderOutQty','returnedQty','offcutQty','wasteQty','otherInQty','otherOutQty','purchaseValue','goodConsumptionCost','wasteCost'].forEach(k=>r[k]=round(r[k]));
      r.recognizedMaterialCost=round(r.goodConsumptionCost+r.wasteCost);
      r.dailyNetMovement=round(r.purchasedQty+r.otherInQty-r.orderOutQty-r.wasteQty-r.otherOutQty);
      r.purchaseMinusOrderOutAndWaste=round(r.purchasedQty-r.orderOutQty-r.wasteQty);
      out.push(r);
    });
    out.sort((a,b)=>(a.materialName||a.materialId).localeCompare(b.materialName||b.materialId,'ar'));
    return canonical({version:VERSION,workDate:wantedDate,department:text(opts.department||'ليزر'),rows:out,blockers,valid:blockers.length===0});
  }

  return {VERSION,TYPES:Array.from(TYPES),validateEvent,buildAppendPlan,deriveDailyMaterialFacts,stableStringify,fingerprint};
});
