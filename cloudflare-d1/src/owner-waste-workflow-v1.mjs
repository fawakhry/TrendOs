// Source-only state machine. No database writes or financial posting.
export const WASTE_STATES=Object.freeze({PENDING:'PENDING',APPROVED:'APPROVED',REJECTED:'REJECTED'});
const valid=s=>typeof s==='string'&&s.trim().length>0&&s.length<=180;
const blocked=code=>({success:false,code,stockPosted:false,ledgerPosted:false,financeRelease:'NO_GO'});
export function prepareWasteRequest(input,verifiedActor){
  if(!verifiedActor||verifiedActor.authenticated!==true||!valid(verifiedActor.principalRef)||!['print','laser','full'].includes(verifiedActor.accountingMode))return blocked('VERIFIED_EMPLOYEE_REQUIRED');
  if(!input||!valid(input.requestRef)||!valid(input.orderId)||!valid(input.department)||!valid(input.materialId)||!valid(input.reason)||!Number.isSafeInteger(input.quantity)||input.quantity<=0)return blocked('INVALID_WASTE_REQUEST');
  return {success:true,code:'WASTE_REQUEST_PREVIEW_ONLY',request:{requestRef:input.requestRef,orderId:input.orderId,department:input.department,materialId:input.materialId,reason:input.reason,quantity:input.quantity,employeeRef:verifiedActor.principalRef,state:WASTE_STATES.PENDING},stockPosted:false,ledgerPosted:false,financeRelease:'NO_GO'};
}
export function reviewWasteRequest(request,decision,verifiedActor){
  if(!request||request.state!==WASTE_STATES.PENDING||!valid(request.requestRef)||!valid(request.employeeRef))return blocked('WASTE_NOT_PENDING');
  if(!verifiedActor||verifiedActor.authenticated!==true||verifiedActor.accountingMode!=='full'||verifiedActor.role!=='admin'||verifiedActor.ownerVerified!==true||!valid(verifiedActor.principalRef)||verifiedActor.principalRef===request.employeeRef)return blocked('VERIFIED_OWNER_REQUIRED');
  if(!decision||decision.requestRef!==request.requestRef||!['APPROVE','REJECT'].includes(decision.action)||!valid(decision.evidenceRef))return blocked('INVALID_DECISION_EVIDENCE');
  return {success:true,code:'WASTE_DECISION_PREVIEW_ONLY',nextState:decision.action==='APPROVE'?WASTE_STATES.APPROVED:WASTE_STATES.REJECTED,reviewedBy:verifiedActor.principalRef,evidenceRef:decision.evidenceRef,stockPosted:false,ledgerPosted:false,financeRelease:'NO_GO'};
}
