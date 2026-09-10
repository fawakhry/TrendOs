/*
 * TrendOS / EasyStore — Gaber Daily Material Flow Report V1
 * PURE GITHUB CANDIDATE ONLY — NO EXTERNAL WRITES.
 *
 * Aggregates purchases and per-Task material closes into an auditable end-of-day
 * material report. It deliberately separates today's net movement from the
 * authoritative physical closing stock.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TrendOSGaberDailyMaterialFlowV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='GABER_DAILY_MATERIAL_FLOW_V1_20260910';
  const EPS=1e-9;

  function text(v){return String(v==null?'':v).trim();}
  function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
  function nonNegative(v){const n=finite(v);return n!=null&&n>=0?n:null;}
  function round(n,p=8){const m=Math.pow(10,p);return Math.round((Number(n)||0)*m)/m;}
  function near(a,b,tolerance){return Math.abs((Number(a)||0)-(Number(b)||0))<=Math.max(EPS,Number(tolerance)||0);}
  function keyOf(materialId,unit){return text(materialId)+'::'+text(unit||'unit');}

  function ensureRow(map,src){
    const materialId=text(src&& (src.materialId||src.itemId));
    const unit=text(src&&src.unit)||'unit';
    const key=keyOf(materialId,unit);
    if(!map.has(key)){
      map.set(key,{
        materialId,name:text(src&&(src.name||src.materialName||src.itemName)),unit,
        openingQty:0,purchasedQty:0,orderOutQty:0,wasteQty:0,returnedQty:0,offcutQty:0,otherInQty:0,otherOutQty:0,
        purchaseValue:0,goodConsumptionCost:0,wasteCost:0,
        actualClosingQty:null,
        purchaseRefs:[],orderOutRefs:[],wasteRefs:[],otherRefs:[],
        inputIssues:[]
      });
    }
    const row=map.get(key);
    if(!row.name)row.name=text(src&&(src.name||src.materialName||src.itemName));
    return row;
  }

  function addRef(list,ref){
    const key=JSON.stringify(ref);
    if(!list.some(x=>JSON.stringify(x)===key))list.push(ref);
  }

  function validateQty(row,field,v,ref){
    const n=nonNegative(v);
    if(n==null){row.inputIssues.push({code:'NEGATIVE_QUANTITY_INVALID',field,ref:ref||null,value:v});return 0;}
    return n;
  }

  function buildDailyMaterialFlow(input){
    input=input||{};
    const tolerance=Math.max(EPS,nonNegative(input.quantityTolerance)||1e-6);
    const rows=new Map();
    const globalBlockers=[];

    (Array.isArray(input.openingBalances)?input.openingBalances:[]).forEach((b,index)=>{
      const row=ensureRow(rows,b);
      row.openingQty+=validateQty(row,'openingQty',b.qty!=null?b.qty:b.openingQty,{openingIndex:index});
    });

    (Array.isArray(input.actualClosingBalances)?input.actualClosingBalances:[]).forEach((b,index)=>{
      const row=ensureRow(rows,b);
      const qty=nonNegative(b.qty!=null?b.qty:b.closingQty);
      if(qty==null)row.inputIssues.push({code:'NEGATIVE_QUANTITY_INVALID',field:'actualClosingQty',ref:{closingIndex:index},value:b.qty});
      else row.actualClosingQty=(row.actualClosingQty==null?0:row.actualClosingQty)+qty;
    });

    (Array.isArray(input.purchases)?input.purchases:[]).forEach((p,index)=>{
      const row=ensureRow(rows,p);
      const qty=validateQty(row,'purchaseQty',p.qty,{purchaseIndex:index,purchaseId:text(p.purchaseId||p.id)});
      row.purchasedQty+=qty;
      let total=nonNegative(p.total);
      const unitPrice=nonNegative(p.unitPrice);
      if(total==null&&unitPrice!=null)total=qty*unitPrice;
      if(total==null)total=0;
      row.purchaseValue+=total;
      addRef(row.purchaseRefs,{
        purchaseId:text(p.purchaseId||p.id),supplier:text(p.supplier),invoiceNo:text(p.invoiceNo||p.receiptNo),
        qty:round(qty),value:round(total),orderId:text(p.orderId),lineId:text(p.lineId)
      });
    });

    (Array.isArray(input.taskCloses)?input.taskCloses:[]).forEach((task,taskIndex)=>{
      const taskId=text(task.taskId),orderId=text(task.orderId),lineId=text(task.lineId);
      (Array.isArray(task.materials)?task.materials:[]).forEach((m,materialIndex)=>{
        const row=ensureRow(rows,m);
        const ref={taskIndex,materialIndex,taskId,orderId,lineId};
        const consumed=validateQty(row,'consumedQty',m.consumedQty||0,ref);
        const waste=validateQty(row,'wasteQty',m.wasteQty||0,ref);
        const returned=validateQty(row,'returnedQty',m.returnedQty||0,ref);
        const offcut=validateQty(row,'offcutQty',m.offcutQty||m.reusableOffcutQty||0,ref);
        const unitCost=nonNegative(m.unitCost);

        row.orderOutQty+=consumed;
        row.wasteQty+=waste;
        row.returnedQty+=returned;
        row.offcutQty+=offcut;
        if(unitCost!=null){
          row.goodConsumptionCost+=consumed*unitCost;
          row.wasteCost+=waste*unitCost;
        }else if(consumed>0||waste>0){
          row.inputIssues.push({code:'ACCOUNTING_COST_UNAVAILABLE',ref});
        }
        if(consumed>0)addRef(row.orderOutRefs,{taskId,orderId,lineId,qty:round(consumed),cost:unitCost==null?null:round(consumed*unitCost)});
        if(waste>0)addRef(row.wasteRefs,{taskId,orderId,lineId,qty:round(waste),cost:unitCost==null?null:round(waste*unitCost)});
      });
    });

    (Array.isArray(input.otherMovements)?input.otherMovements:[]).forEach((m,index)=>{
      const row=ensureRow(rows,m);
      const qty=validateQty(row,'movementQty',m.qty,{movementIndex:index,movementId:text(m.movementId||m.id)});
      const dir=text(m.direction).toUpperCase();
      if(dir==='IN')row.otherInQty+=qty;
      else if(dir==='OUT')row.otherOutQty+=qty;
      else row.inputIssues.push({code:'MOVEMENT_DIRECTION_INVALID',ref:{movementIndex:index,movementId:text(m.movementId||m.id)},direction:dir});
      addRef(row.otherRefs,{movementId:text(m.movementId||m.id),direction:dir,qty:round(qty),reason:text(m.reason)});
    });

    const output=[];
    rows.forEach(row=>{
      row.openingQty=round(row.openingQty);
      row.purchasedQty=round(row.purchasedQty);
      row.orderOutQty=round(row.orderOutQty);
      row.wasteQty=round(row.wasteQty);
      row.returnedQty=round(row.returnedQty);
      row.offcutQty=round(row.offcutQty);
      row.otherInQty=round(row.otherInQty);
      row.otherOutQty=round(row.otherOutQty);
      row.purchaseValue=round(row.purchaseValue);
      row.goodConsumptionCost=round(row.goodConsumptionCost);
      row.wasteCost=round(row.wasteCost);
      row.recognizedMaterialCost=round(row.goodConsumptionCost+row.wasteCost);

      // IMPORTANT: orderOutQty is final good consumption, not gross TASK_ISSUE.
      // Therefore returnedQty/offcutQty are audit-only columns and are NOT added again.
      row.dailyNetMovement=round(row.purchasedQty+row.otherInQty-row.orderOutQty-row.wasteQty-row.otherOutQty);
      row.expectedClosingQty=round(row.openingQty+row.dailyNetMovement);
      row.dailyPurchaseMinusOut=round(row.purchasedQty-row.orderOutQty-row.wasteQty);
      row.closingVarianceQty=row.actualClosingQty==null?null:round(row.actualClosingQty-row.expectedClosingQty);
      row.reconciliationStatus=row.actualClosingQty==null?'NO_ACTUAL_CLOSING':(near(row.actualClosingQty,row.expectedClosingQty,tolerance)?'RECONCILED':'VARIANCE');
      if(row.reconciliationStatus==='VARIANCE'){
        globalBlockers.push({
          code:'DAILY_MATERIAL_STOCK_VARIANCE',materialId:row.materialId,unit:row.unit,
          expectedClosingQty:row.expectedClosingQty,actualClosingQty:round(row.actualClosingQty),varianceQty:row.closingVarianceQty
        });
      }
      row.inputIssues.forEach(issue=>globalBlockers.push(Object.assign({materialId:row.materialId,unit:row.unit},issue)));
      output.push(row);
    });

    output.sort((a,b)=>(a.name||a.materialId).localeCompare(b.name||b.materialId,'ar'));

    const totals={
      purchasedQty:round(output.reduce((s,r)=>s+r.purchasedQty,0)),
      orderOutQty:round(output.reduce((s,r)=>s+r.orderOutQty,0)),
      wasteQty:round(output.reduce((s,r)=>s+r.wasteQty,0)),
      purchaseValue:round(output.reduce((s,r)=>s+r.purchaseValue,0)),
      recognizedMaterialCost:round(output.reduce((s,r)=>s+r.recognizedMaterialCost,0))
    };

    return {
      version:VERSION,workDate:text(input.workDate),department:text(input.department||'ليزر'),
      rows:output,totals,blockers:globalBlockers,canCloseDay:globalBlockers.length===0
    };
  }

  return {VERSION,buildDailyMaterialFlow,_pure:{near,keyOf}};
});
