/*
 * TrendOS / EasyStore — Gaber Ledger-backed Daily Material Report V1
 * PURE / ZERO EXTERNAL WRITES.
 *
 * Consumes facts already derived from the immutable movement ledger plus
 * authoritative opening and physical closing balances.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TrendOSGaberLedgerDailyReportV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='GABER_LEDGER_DAILY_REPORT_V1_20260911';
  const EPS=1e-9;
  function text(v){return String(v==null?'':v).trim();}
  function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
  function nonNegative(v){const n=finite(v);return n!=null&&n>=0?n:null;}
  function round(n,p=8){const m=Math.pow(10,p);return Math.round((Number(n)||0)*m)/m;}
  function key(materialId,unit){return text(materialId)+'::'+text(unit||'unit');}
  function near(a,b,tol){return Math.abs((Number(a)||0)-(Number(b)||0))<=Math.max(EPS,Number(tol)||0);}
  function balanceMap(rows,field){
    const m=new Map();(Array.isArray(rows)?rows:[]).forEach((r,index)=>{
      const materialId=text(r.materialId||r.itemId),unit=text(r.unit)||'unit',qty=nonNegative(r.qty!=null?r.qty:r[field]);
      if(!materialId||qty==null)return;
      const k=key(materialId,unit);m.set(k,round((m.get(k)||0)+qty));
    });return m;
  }
  function build(input){
    input=input||{};const tolerance=Math.max(EPS,nonNegative(input.quantityTolerance)||1e-6);
    const facts=input.ledgerFacts||{},opening=balanceMap(input.openingBalances,'openingQty'),closing=balanceMap(input.actualClosingBalances,'closingQty');
    const blockers=[];
    if(facts.valid===false)(facts.blockers||[]).forEach(b=>blockers.push(Object.assign({source:'LEDGER'},b)));
    const rows=(Array.isArray(facts.rows)?facts.rows:[]).map(r=>{
      const unit=text(r.unit)||'unit',k=key(r.materialId,unit),hasOpening=opening.has(k),openingQty=hasOpening?opening.get(k):null;
      const purchasedQty=round(r.purchasedQty||0),orderOutQty=round(r.orderOutQty||0),wasteQty=round(r.wasteQty||0),otherInQty=round(r.otherInQty||0),otherOutQty=round(r.otherOutQty||0);
      const expectedClosingQty=openingQty==null?null:round(openingQty+purchasedQty+otherInQty-orderOutQty-wasteQty-otherOutQty);
      const actualClosingQty=closing.has(k)?closing.get(k):null;
      const varianceQty=expectedClosingQty==null||actualClosingQty==null?null:round(actualClosingQty-expectedClosingQty);
      let reconciliationStatus='RECONCILED';
      if(openingQty==null){reconciliationStatus='NO_OPENING_BALANCE';blockers.push({code:'DAILY_MATERIAL_OPENING_BALANCE_MISSING',materialId:r.materialId,unit});}
      else if(actualClosingQty==null){reconciliationStatus='NO_ACTUAL_CLOSING';blockers.push({code:'DAILY_MATERIAL_ACTUAL_CLOSING_MISSING',materialId:r.materialId,unit,expectedClosingQty});}
      else if(!near(actualClosingQty,expectedClosingQty,tolerance)){reconciliationStatus='VARIANCE';blockers.push({code:'DAILY_MATERIAL_STOCK_VARIANCE',materialId:r.materialId,unit,expectedClosingQty,actualClosingQty,varianceQty});}
      return {
        materialId:text(r.materialId),name:text(r.materialName),unit,
        openingQty,purchasedQty,orderOutQty,wasteQty,
        returnedQty:round(r.returnedQty||0),offcutQty:round(r.offcutQty||0),
        otherInQty,otherOutQty,
        purchaseMinusOrderOutAndWaste:round(purchasedQty-orderOutQty-wasteQty),
        dailyNetMovement:round(purchasedQty+otherInQty-orderOutQty-wasteQty-otherOutQty),
        expectedClosingQty,actualClosingQty,varianceQty,reconciliationStatus,
        purchaseValue:round(r.purchaseValue||0),goodConsumptionCost:round(r.goodConsumptionCost||0),wasteCost:round(r.wasteCost||0),recognizedMaterialCost:round(r.recognizedMaterialCost||0),
        purchaseRefs:Array.isArray(r.purchaseRefs)?r.purchaseRefs:[],orderOutRefs:Array.isArray(r.orderOutRefs)?r.orderOutRefs:[],wasteRefs:Array.isArray(r.wasteRefs)?r.wasteRefs:[],adjustmentRefs:Array.isArray(r.adjustmentRefs)?r.adjustmentRefs:[]
      };
    });
    rows.sort((a,b)=>(a.name||a.materialId).localeCompare(b.name||b.materialId,'ar'));
    const totals={
      purchasedQty:round(rows.reduce((s,r)=>s+r.purchasedQty,0)),
      orderOutQty:round(rows.reduce((s,r)=>s+r.orderOutQty,0)),
      wasteQty:round(rows.reduce((s,r)=>s+r.wasteQty,0)),
      purchaseValue:round(rows.reduce((s,r)=>s+r.purchaseValue,0)),
      recognizedMaterialCost:round(rows.reduce((s,r)=>s+r.recognizedMaterialCost,0))
    };
    return {version:VERSION,workDate:text(input.workDate||facts.workDate),department:text(input.department||facts.department||'ليزر'),rows,totals,blockers,canCloseDay:blockers.length===0};
  }
  return {VERSION,build};
});