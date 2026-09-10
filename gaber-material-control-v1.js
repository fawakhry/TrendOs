/*
 * TrendOS / EasyStore — Gaber Laser Material Custody & Waste Control V1
 * PURE GITHUB CANDIDATE ONLY — NO EXTERNAL WRITES.
 *
 * This module evaluates whether a Gaber Task is materially/accountingly safe to close.
 * It intentionally performs no Sheets, Apps Script, D1, stock, purchase or cash mutations.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TrendOSGaberMaterialControlV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='GABER_MATERIAL_CONTROL_V1_20260910';
  const EPS=1e-9;
  const PURCHASE_DECLARATIONS=new Set(['NO_PURCHASE','PURCHASE_RECORDED']);
  const WASTE_REASONS=new Set([
    'NORMAL_CUT_LOSS','MATERIAL_DEFECT','MACHINE_FAULT','SETUP_ERROR','WRONG_SIZE',
    'OPERATOR_ERROR','DESIGN_OR_FILE_ERROR','REWORK','OTHER'
  ]);
  const DEFAULT_ABNORMAL_REASONS=new Set([
    'MATERIAL_DEFECT','MACHINE_FAULT','SETUP_ERROR','WRONG_SIZE','OPERATOR_ERROR',
    'DESIGN_OR_FILE_ERROR','REWORK','OTHER'
  ]);

  function text(v){return String(v==null?'':v).trim();}
  function upper(v){return text(v).toUpperCase();}
  function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
  function nonNegative(v){const n=finite(v);return n!=null&&n>=0?n:null;}
  function positive(v){const n=finite(v);return n!=null&&n>0?n:null;}
  function round(n,places){const p=Math.pow(10,places==null?8:places);return Math.round((Number(n)||0)*p)/p;}
  function near(a,b,tolerance){return Math.abs((Number(a)||0)-(Number(b)||0))<=Math.max(EPS,Number(tolerance)||0);}
  function safeDivide(a,b){return Math.abs(Number(b)||0)<=EPS?null:(Number(a)||0)/(Number(b)||0);}

  function canonical(value){
    if(Array.isArray(value))return value.map(canonical);
    if(value&&typeof value==='object'){
      const out={};Object.keys(value).sort().forEach(k=>{if(value[k]!==undefined)out[k]=canonical(value[k]);});return out;
    }
    if(typeof value==='number')return Number.isFinite(value)?round(value,10):null;
    return value;
  }
  function stableStringify(value){return JSON.stringify(canonical(value));}
  function fnv1a(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,'0');}
  function fingerprint(value){const body=stableStringify(value);return 'GM1-'+fnv1a(body)+'-'+body.length.toString(36);}

  function blocker(code,extra){return Object.assign({code},extra||{});}
  function pushOnce(list,b){
    const key=stableStringify(b);
    if(!list.some(x=>stableStringify(x)===key))list.push(b);
  }
  function idMismatch(ctx,obj,field,code,extra){
    const expected=text(ctx[field]),actual=text(obj&&obj[field]);
    if(actual&&expected&&actual!==expected)pushOnce(ctx.blockers,blocker(code,Object.assign({expected,actual},extra||{})));
  }

  function normalizeContext(input){
    input=input||{};
    return {
      taskId:text(input.taskId),
      orderId:text(input.orderId),
      lineId:text(input.lineId),
      operator:text(input.operator||input.employee||'جابر'),
      department:text(input.department||'ليزر'),
      purchaseDeclaration:upper(input.purchaseDeclaration),
      lineRevenue:finite(input.lineRevenue),
      directOperatingCost:nonNegative(input.directOperatingCost)||0,
      otherDirectCost:nonNegative(input.otherDirectCost)||0,
      tolerance:Math.max(EPS,nonNegative(input.quantityTolerance)||1e-6),
      policy:normalizePolicy(input.policy),
      materials:Array.isArray(input.materials)?input.materials:[],
      wastes:Array.isArray(input.wastes)?input.wastes:[],
      purchases:Array.isArray(input.purchases)?input.purchases:[],
      blockers:[]
    };
  }

  function normalizePolicy(p){
    p=p||{};
    return {
      abnormalRequiresApproval:p.abnormalRequiresApproval!==false,
      evidenceValueThreshold:nonNegative(p.evidenceValueThreshold),
      approvalValueThreshold:nonNegative(p.approvalValueThreshold),
      approvalPctThreshold:nonNegative(p.approvalPctThreshold),
      evidenceRequiredReasons:new Set((Array.isArray(p.evidenceRequiredReasons)?p.evidenceRequiredReasons:[]).map(upper)),
      approvalRequiredReasons:new Set((Array.isArray(p.approvalRequiredReasons)?p.approvalRequiredReasons:[]).map(upper)),
      abnormalReasons:new Set((Array.isArray(p.abnormalReasons)?p.abnormalReasons:Array.from(DEFAULT_ABNORMAL_REASONS)).map(upper))
    };
  }

  function validateCoreIds(ctx){
    if(!ctx.taskId)pushOnce(ctx.blockers,blocker('TASK_ID_MISMATCH',{reason:'TASK_ID_REQUIRED'}));
    if(!ctx.orderId)pushOnce(ctx.blockers,blocker('ORDER_ID_MISMATCH',{reason:'ORDER_ID_REQUIRED'}));
    if(!ctx.lineId)pushOnce(ctx.blockers,blocker('LINE_ID_MISMATCH',{reason:'LINE_ID_REQUIRED'}));
  }

  function normalizePurchase(p){
    p=p||{};
    return {
      purchaseId:text(p.purchaseId||p.id),taskId:text(p.taskId),orderId:text(p.orderId),lineId:text(p.lineId),
      supplier:text(p.supplier),invoiceNo:text(p.invoiceNo||p.receiptNo),evidenceRef:text(p.evidenceRef||p.invoiceEvidenceRef),
      materialId:text(p.materialId||p.itemId),qty:positive(p.qty),unit:text(p.unit),unitPrice:nonNegative(p.unitPrice),
      total:nonNegative(p.total),paymentMethod:text(p.paymentMethod||p.paymentType),department:text(p.department||'ليزر')
    };
  }

  function validatePurchases(ctx){
    const declaration=ctx.purchaseDeclaration;
    if(!PURCHASE_DECLARATIONS.has(declaration)){
      pushOnce(ctx.blockers,blocker('PURCHASE_DECLARATION_REQUIRED'));
      return {rows:[],purchaseSpend:0};
    }
    const rows=ctx.purchases.map(normalizePurchase);
    if(declaration==='NO_PURCHASE'&&rows.length){
      pushOnce(ctx.blockers,blocker('PURCHASE_DECLARATION_CONFLICT',{reason:'PURCHASES_EXIST_WITH_NO_PURCHASE'}));
    }
    if(declaration==='PURCHASE_RECORDED'&&!rows.length){
      pushOnce(ctx.blockers,blocker('PURCHASE_RECORD_REQUIRED'));
    }
    let spend=0;
    rows.forEach((p,index)=>{
      const ref={purchaseIndex:index,purchaseId:p.purchaseId||''};
      if(!p.purchaseId)pushOnce(ctx.blockers,blocker('PURCHASE_RECORD_REQUIRED',Object.assign({reason:'PURCHASE_ID_REQUIRED'},ref)));
      if(!p.supplier)pushOnce(ctx.blockers,blocker('PURCHASE_RECORD_REQUIRED',Object.assign({reason:'SUPPLIER_REQUIRED'},ref)));
      if(!p.invoiceNo)pushOnce(ctx.blockers,blocker('PURCHASE_INVOICE_NUMBER_REQUIRED',ref));
      if(!p.evidenceRef)pushOnce(ctx.blockers,blocker('PURCHASE_EVIDENCE_REQUIRED',ref));
      if(!p.materialId)pushOnce(ctx.blockers,blocker('MATERIAL_ID_REQUIRED',ref));
      if(p.qty==null)pushOnce(ctx.blockers,blocker('PURCHASE_RECORD_REQUIRED',Object.assign({reason:'POSITIVE_QTY_REQUIRED'},ref)));
      if(p.unitPrice==null)pushOnce(ctx.blockers,blocker('PURCHASE_RECORD_REQUIRED',Object.assign({reason:'UNIT_PRICE_REQUIRED'},ref)));
      idMismatch(ctx,p,'taskId','TASK_ID_MISMATCH',ref);
      idMismatch(ctx,p,'orderId','ORDER_ID_MISMATCH',ref);
      idMismatch(ctx,p,'lineId','LINE_ID_MISMATCH',ref);
      const rowTotal=p.total!=null?p.total:(p.qty!=null&&p.unitPrice!=null?p.qty*p.unitPrice:0);
      spend+=Number(rowTotal)||0;
    });
    return {rows,purchaseSpend:round(spend)};
  }

  function normalizeMaterial(m){
    m=m||{};
    return {
      materialId:text(m.materialId||m.itemId),name:text(m.name||m.materialName),unit:text(m.unit),
      issuedQty:nonNegative(m.issuedQty),consumedQty:nonNegative(m.consumedQty),returnedQty:nonNegative(m.returnedQty),
      offcutQty:nonNegative(m.offcutQty||m.reusableOffcutQty),wasteQty:nonNegative(m.wasteQty),
      unitCost:nonNegative(m.unitCost),expectedQty:m.expectedQty==null||m.expectedQty===''?null:nonNegative(m.expectedQty)
    };
  }

  function wasteClass(reason,explicit,policy){
    const e=upper(explicit);if(e==='STANDARD'||e==='ABNORMAL')return e;
    if(upper(reason)==='NORMAL_CUT_LOSS')return 'STANDARD';
    return policy.abnormalReasons.has(upper(reason))?'ABNORMAL':'ABNORMAL';
  }

  function normalizeWaste(w,policy){
    w=w||{};
    const reason=upper(w.reasonCode||w.reason);
    return {
      wasteId:text(w.wasteId||w.id),taskId:text(w.taskId),orderId:text(w.orderId),lineId:text(w.lineId),
      materialId:text(w.materialId||w.itemId),qty:positive(w.qty),reasonCode:reason,
      classification:wasteClass(reason,w.classification,policy),evidenceRef:text(w.evidenceRef),
      approved:!!(w.approval&&w.approval.approved===true),approver:text(w.approval&&w.approval.approver),
      approvalReason:text(w.approval&&w.approval.reason)
    };
  }

  function validateMaterialsAndWaste(ctx){
    const materialRows=ctx.materials.map(normalizeMaterial);
    const wasteRows=ctx.wastes.map(w=>normalizeWaste(w,ctx.policy));
    const materialMap=new Map();
    const summaries=[];
    let consumedCost=0,wasteCost=0,standardWasteCost=0,abnormalWasteCost=0,expectedMaterialCost=0,expectedCostLines=0;

    materialRows.forEach((m,index)=>{
      const ref={materialIndex:index,materialId:m.materialId||''};
      if(!m.materialId){pushOnce(ctx.blockers,blocker('MATERIAL_ID_REQUIRED',ref));return;}
      if(materialMap.has(m.materialId)){pushOnce(ctx.blockers,blocker('MATERIAL_ID_REQUIRED',Object.assign({reason:'DUPLICATE_MATERIAL_LINE'},ref)));return;}
      materialMap.set(m.materialId,m);
      ['issuedQty','consumedQty','returnedQty','offcutQty','wasteQty'].forEach(k=>{
        if(m[k]==null)pushOnce(ctx.blockers,blocker('NEGATIVE_QUANTITY_INVALID',Object.assign({field:k},ref)));
      });
      const issued=m.issuedQty||0,consumed=m.consumedQty||0,returned=m.returnedQty||0,offcut=m.offcutQty||0,waste=m.wasteQty||0;
      const accounted=consumed+returned+offcut+waste;
      const variance=issued-accounted;
      if(!near(issued,accounted,ctx.tolerance))pushOnce(ctx.blockers,blocker('MATERIAL_BALANCE_NOT_ZERO',Object.assign({issuedQty:round(issued),accountedQty:round(accounted),varianceQty:round(variance)},ref)));
      if((consumed>0||waste>0)&&m.unitCost==null)pushOnce(ctx.blockers,blocker('ACCOUNTING_COST_UNAVAILABLE',ref));
      const cc=(m.unitCost||0)*consumed,wc=(m.unitCost||0)*waste;
      consumedCost+=cc;wasteCost+=wc;
      if(m.expectedQty!=null){expectedMaterialCost+=(m.unitCost||0)*m.expectedQty;expectedCostLines++;}
      summaries.push({
        materialId:m.materialId,name:m.name,unit:m.unit,issuedQty:round(issued),consumedQty:round(consumed),returnedQty:round(returned),
        offcutQty:round(offcut),wasteQty:round(waste),varianceQty:round(variance),balanced:near(issued,accounted,ctx.tolerance),
        unitCost:m.unitCost,expectedQty:m.expectedQty,actualRecognizedQty:round(consumed+waste),
        expectedVarianceQty:m.expectedQty==null?null:round((consumed+waste)-m.expectedQty),
        consumedCost:round(cc),wasteCost:round(wc),recognizedMaterialCost:round(cc+wc)
      });
    });

    const wasteByMaterial=new Map();
    wasteRows.forEach((w,index)=>{
      const ref={wasteIndex:index,wasteId:w.wasteId||'',materialId:w.materialId||''};
      if(!w.materialId)pushOnce(ctx.blockers,blocker('MATERIAL_ID_REQUIRED',ref));
      if(w.qty==null)pushOnce(ctx.blockers,blocker('NEGATIVE_QUANTITY_INVALID',Object.assign({field:'wasteQty'},ref)));
      if(!w.reasonCode||!WASTE_REASONS.has(w.reasonCode))pushOnce(ctx.blockers,blocker('WASTE_REASON_REQUIRED',Object.assign({reasonCode:w.reasonCode||''},ref)));
      idMismatch(ctx,w,'taskId','TASK_ID_MISMATCH',ref);
      idMismatch(ctx,w,'orderId','ORDER_ID_MISMATCH',ref);
      idMismatch(ctx,w,'lineId','LINE_ID_MISMATCH',ref);
      wasteByMaterial.set(w.materialId,(wasteByMaterial.get(w.materialId)||0)+(w.qty||0));
      const m=materialMap.get(w.materialId),unitCost=m&&m.unitCost!=null?m.unitCost:null,cost=(unitCost||0)*(w.qty||0);
      const denom=(m&&m.issuedQty)||0,pct=denom>EPS?((w.qty||0)/denom)*100:null;
      const evidenceRequired=(ctx.policy.evidenceValueThreshold!=null&&cost>=ctx.policy.evidenceValueThreshold)||ctx.policy.evidenceRequiredReasons.has(w.reasonCode);
      const approvalRequired=(ctx.policy.abnormalRequiresApproval&&w.classification==='ABNORMAL')||
        (ctx.policy.approvalValueThreshold!=null&&cost>=ctx.policy.approvalValueThreshold)||
        (ctx.policy.approvalPctThreshold!=null&&pct!=null&&pct>=ctx.policy.approvalPctThreshold)||
        ctx.policy.approvalRequiredReasons.has(w.reasonCode);
      if(evidenceRequired&&!w.evidenceRef)pushOnce(ctx.blockers,blocker('WASTE_EVIDENCE_REQUIRED',Object.assign({wasteCost:round(cost),wastePct:pct==null?null:round(pct)},ref)));
      const selfApproved=w.approved&&w.approver&&upper(w.approver)===upper(ctx.operator);
      if(approvalRequired&&(!w.approved||!w.approver||selfApproved))pushOnce(ctx.blockers,blocker('WASTE_APPROVAL_REQUIRED',Object.assign({classification:w.classification,selfApprovalForbidden:selfApproved},ref)));
      if(w.classification==='STANDARD')standardWasteCost+=cost;else abnormalWasteCost+=cost;
    });

    materialRows.forEach((m,index)=>{
      if(!m.materialId)return;
      const detailQty=wasteByMaterial.get(m.materialId)||0;
      if(!near(m.wasteQty||0,detailQty,ctx.tolerance))pushOnce(ctx.blockers,blocker('WASTE_DETAIL_MISMATCH',{materialIndex:index,materialId:m.materialId,materialWasteQty:round(m.wasteQty||0),wasteDetailQty:round(detailQty)}));
    });
    wasteRows.forEach((w,index)=>{
      if(w.materialId&&!materialMap.has(w.materialId))pushOnce(ctx.blockers,blocker('WASTE_DETAIL_MISMATCH',{wasteIndex:index,wasteId:w.wasteId||'',materialId:w.materialId,reason:'NO_MATERIAL_CUSTODY_LINE'}));
    });

    return {
      materialRows,wasteRows,summaries,
      consumedCost:round(consumedCost),wasteCost:round(wasteCost),
      standardWasteCost:round(standardWasteCost),abnormalWasteCost:round(abnormalWasteCost),
      expectedMaterialCost:expectedCostLines?round(expectedMaterialCost):null,
      expectedCostLineCount:expectedCostLines
    };
  }

  function buildDecision(input){
    const ctx=normalizeContext(input);
    validateCoreIds(ctx);
    const purchase=validatePurchases(ctx);
    const material=validateMaterialsAndWaste(ctx);
    const recognizedMaterialCost=round(material.consumedCost+material.wasteCost);
    const contribution=ctx.lineRevenue==null?null:round(ctx.lineRevenue-recognizedMaterialCost-ctx.directOperatingCost-ctx.otherDirectCost);
    const body={
      version:VERSION,taskId:ctx.taskId,orderId:ctx.orderId,lineId:ctx.lineId,operator:ctx.operator,department:ctx.department,
      purchaseDeclaration:ctx.purchaseDeclaration,purchaseSpend:purchase.purchaseSpend,
      materials:material.summaries,
      costs:{
        consumedMaterialCost:material.consumedCost,wasteCost:material.wasteCost,standardWasteCost:material.standardWasteCost,
        abnormalWasteCost:material.abnormalWasteCost,recognizedMaterialCost,directOperatingCost:round(ctx.directOperatingCost),
        otherDirectCost:round(ctx.otherDirectCost),expectedMaterialCost:material.expectedMaterialCost,lineRevenue:ctx.lineRevenue,taskContribution:contribution
      },
      blockerCodes:ctx.blockers.map(b=>b.code),blockers:ctx.blockers
    };
    const auditInput={
      version:VERSION,taskId:ctx.taskId,orderId:ctx.orderId,lineId:ctx.lineId,operator:ctx.operator,department:ctx.department,
      purchaseDeclaration:ctx.purchaseDeclaration,purchases:purchase.rows,materials:material.materialRows,wastes:material.wasteRows,
      lineRevenue:ctx.lineRevenue,directOperatingCost:ctx.directOperatingCost,otherDirectCost:ctx.otherDirectCost,
      policy:{
        abnormalRequiresApproval:ctx.policy.abnormalRequiresApproval,evidenceValueThreshold:ctx.policy.evidenceValueThreshold,
        approvalValueThreshold:ctx.policy.approvalValueThreshold,approvalPctThreshold:ctx.policy.approvalPctThreshold,
        evidenceRequiredReasons:Array.from(ctx.policy.evidenceRequiredReasons).sort(),approvalRequiredReasons:Array.from(ctx.policy.approvalRequiredReasons).sort(),
        abnormalReasons:Array.from(ctx.policy.abnormalReasons).sort()
      }
    };
    body.canClose=ctx.blockers.length===0;
    body.decisionFingerprint=fingerprint(auditInput);
    return canonical(body);
  }

  return {
    VERSION,buildDecision,stableStringify,fingerprint,
    _pure:{normalizeMaterial,normalizePurchase,normalizeWaste,normalizePolicy,wasteClass,near,safeDivide}
  };
});
