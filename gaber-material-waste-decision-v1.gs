/**
 * TrendOS — Gaber Waste Decision Idempotency Guard V1
 * GITHUB CANDIDATE ONLY / NOT ROUTED DIRECTLY.
 */
function gaberMaterialWasteDecisionIdempotentV1_(p,auth){
  p=p||{};
  if(typeof gmuFlagGateV1_!=='function')return {success:false,code:'GABER_MATERIAL_UI_BACKEND_MISSING',message:'Backend خامات جابر غير متاح.'};
  gmuFlagGateV1_();
  if(typeof gmuRoleV1_!=='function'||gmuRoleV1_(auth)!=='MANAGER')return {success:false,code:'MANAGER_ONLY',message:'قرار التالف متاح للإدارة فقط.'};
  const q=typeof gmuRequestRowsV1_==='function'?gmuRequestRowsV1_():{ok:false,code:'GABER_WASTE_REQUEST_DEPENDENCY_MISSING',rows:[]};
  if(!q.ok)return {success:false,code:q.code,message:'مخزن طلبات التالف غير مهيأ.'};
  const requestId=typeof gmuTextV1_==='function'?gmuTextV1_(p.requestId):String(p.requestId||'').trim();
  const req=q.rows.find(function(r){return r.requestId===requestId;});
  if(!req)return {success:false,code:'WASTE_REQUEST_NOT_FOUND',message:'طلب اعتماد التالف غير موجود.'};
  const wanted=String(p.decision||'APPROVED').trim().toUpperCase();
  if(['APPROVED','REJECTED'].indexOf(wanted)===-1)return {success:false,code:'WASTE_APPROVAL_DATA_REQUIRED',message:'قرار التالف غير صحيح.'};
  const approvals=typeof gmuApprovalsV1_==='function'?gmuApprovalsV1_():{ok:false,code:'WASTE_APPROVAL_DEPENDENCY_MISSING',rows:[]};
  if(!approvals.ok)return {success:false,code:approvals.code,message:'مخزن قرارات التالف غير مهيأ.'};
  const prior=typeof gmuDecisionForRequestV1_==='function'?gmuDecisionForRequestV1_(req,approvals.rows):null;
  if(prior){
    if(String(prior.decision||'').toUpperCase()===wanted)return {success:true,replayed:true,approvalId:prior.approvalId,wasteId:req.wasteId,decision:wanted,approver:prior.approver,approvedAt:prior.approvedAt};
    return {success:false,code:'WASTE_DECISION_ALREADY_RECORDED',message:'يوجد قرار نهائي مسجل بالفعل لهذا الطلب. التصحيح يحتاج مسار تصحيح مستقل ولا يكتب فوق القرار القديم.',existingDecision:prior.decision,existingApprovalId:prior.approvalId};
  }
  if(typeof gaberMaterialRecordWasteApprovalV1_!=='function')return {success:false,code:'WASTE_APPROVAL_WRITER_MISSING',message:'كاتب قرار التالف غير متاح.'};
  return gaberMaterialRecordWasteApprovalV1_({wasteId:req.wasteId,taskId:req.taskId,orderId:req.orderId,lineId:req.lineId,materialId:req.materialId,decision:wanted,operator:req.operator,reason:typeof gmuTextV1_==='function'?gmuTextV1_(p.reason):String(p.reason||'').trim(),evidenceRef:req.evidenceRef},auth);
}
