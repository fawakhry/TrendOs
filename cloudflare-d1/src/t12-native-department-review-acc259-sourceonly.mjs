/* ACC259 — existing native employee/session + original T12 assigned-line review.
 * SOURCE-ONLY. No new roster, SQL migration, Worker route, financial approval
 * event, issuer, session minting, customer link or invoice.
 * Operational reviewer authentication is NOT financial consent.
 */
import {verifyNativeEmployeeSession} from './employee-auth-native-v1.mjs';
import {inspectPlatformNativeOrderContextReadOnly} from './t12-platform-order-context-readonly-acc257.mjs';

export const ACC259_POLICY=Object.freeze({
 mode:'OFF',acceptedMode:'ISOLATED_NATIVE_REVIEW_READONLY',
 existingEmployeeAuthOnly:true,existingT12OrdersOnly:true,
 requiresExplicitLineAssignment:true,operationalReviewOnly:true,
 independentFinancialGrantVerified:false,realSignedLineApproval:false,
 customerOwnershipAttested:false,financeAuthorized:false,
 approvalEventPublished:false,invoicePostingAllowed:false,
 workerWired:false,productionRelease:'NO_GO'
});
const DEPARTMENTS=Object.freeze({
 'طباعة':{role:'print',screen:'print',name:'وائل'},
 'ليزر':{role:'laser',screen:'laser',name:'جابر'}
});
const validId=x=>typeof x==='string'&&x.length>=1&&x.length<=160&&
 x===x.trim()&&x.normalize('NFC')===x&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(x);
const denied=code=>Object.freeze({
 success:false,code,sourceOnly:true,readOnly:true,
 employeeNativeSessionVerified:false,operationalReviewerMatched:false,
 independentFinancialGrantVerified:false,realSignedLineApproval:false,
 customerOwnershipAttested:false,financeAuthorized:false,
 invoicePostingAllowed:false,approvalEventPublished:false,
 productionRelease:'NO_GO'
});
export const ACC259_ASSIGNED_LINE_SQL=
 'SELECT l.line_id AS lineId,l.order_id AS orderId, '+
 'l.ordinal,l.department,l.assigned_to AS assignedTo, '+
 'o.request_key AS requestKey FROM t12_prod_lines l '+
 'JOIN t12_prod_orders o ON o.order_id=l.order_id '+
 'WHERE l.line_id=? AND l.order_id=? LIMIT 2';
const sourceVersion=s=>JSON.stringify({
 createdAt:s.sourceCreatedAt,orderId:s.orderId,
 lines:s.lines,versions:s.operationalRevision?.lineVersions
});
export async function inspectOriginalNativeReviewerACC259({
 env,orderId,lineId,username,employeeToken,nowMs=Date.now(),
 mode
}={}){
 if(mode!=='ISOLATED_NATIVE_REVIEW_READONLY'||
    env?.TRENDOS_DEPARTMENT_REVIEW_ACC259_MODE!=='ISOLATED_NATIVE_REVIEW_READONLY')
  return denied('ACC259_DISABLED');
 if(!env?.DB||typeof env.DB.prepare!=='function'||
    typeof env.DB.batch!=='function'||!validId(orderId)||
    !/^[0-9]{4,18}$/.test(orderId)||!validId(lineId)||
    !validId(username)||typeof employeeToken!=='string'||
    employeeToken.length<8||employeeToken.length>2048||
    !Number.isSafeInteger(nowMs)||nowMs<=0)
  return denied('ACC259_EXACT_NATIVE_ORDER_LINE_AND_SESSION_REQUIRED');
 try{
  // Existing employee_auth_sessions_v1+employee_auth_users_v1, readOnly.
  const auth=await verifyNativeEmployeeSession(
    username,employeeToken,env,nowMs,{readOnly:true});
  if(auth?.hit!==true||auth?.authSource!=='d1-native-employee-v1'||
    auth?.body?.success!==true||!auth.body.user||
    auth.body.user.active!==true||auth.body.user.mustChange===true||
    auth.body.user.username!==username||!Number.isSafeInteger(auth.expiresAtMs)||
    auth.expiresAtMs<=nowMs)
   return denied('ACC259_ORIGINAL_NATIVE_EMPLOYEE_SESSION_UNVERIFIED');
  const u=auth.body.user;
  // No admin override, and a department UI grant is NOT finance authority.
  const before=await inspectPlatformNativeOrderContextReadOnly({
   db:env.DB,orderId});
  if(before.status!==200||before.body?.success!==true||
    before.body.customerOwnershipAttested!==false||
    before.body.financeAuthorized!==false)
   return denied('ACC259_NATIVE_ORDER_UNQUALIFIED');
  const source=before.body,selected=source.lines.find(x=>x.lineId===lineId);
  if(!selected||selected.lineId!==orderId+'-'+String(selected.ordinal).padStart(2,'0'))
   return denied('ACC259_NATIVE_LINE_NOT_IN_ORDER');
  const expected=DEPARTMENTS[selected.department];
  if(!expected||u.role!==expected.role||
    u.department!==selected.department||
    !Array.isArray(u.screens)||!u.screens.includes(expected.screen))
   return denied('ACC259_REAL_NATIVE_DEPARTMENT_SCOPE_MISMATCH');
  const rows=await env.DB.prepare(ACC259_ASSIGNED_LINE_SQL).bind(lineId,orderId).all();
  const assigned=Array.isArray(rows)?rows:rows?.results;
  if(!Array.isArray(assigned)||assigned.length!==1||
    assigned[0].lineId!==lineId||assigned[0].orderId!==orderId||
    assigned[0].ordinal!==selected.ordinal||
    assigned[0].department!==selected.department||
    assigned[0].assignedTo!==expected.name||
    // T12 has display name; if login name mapping differs: STOP, not guess.
    assigned[0].assignedTo!==u.username||!validId(assigned[0].requestKey))
   return denied('ACC259_ORIGINAL_LINE_ASSIGNEE_NOT_VERIFIED');
  const after=await inspectPlatformNativeOrderContextReadOnly({db:env.DB,orderId});
  if(after.status!==200||after.body?.success!==true||
    sourceVersion(after.body)!==sourceVersion(source))
   return denied('ACC259_NATIVE_SOURCE_REVISION_CHANGED');
  return Object.freeze({
   success:true,sourceOnly:true,readOnly:true,
   sourceSystem:'trendos_t12_native',orderId,lineId,
   department:selected.department,ordinal:selected.ordinal,
   assignedTo:assigned[0].assignedTo,
   employeeUsername:u.username,employeeRole:u.role,
   employeeNativeSessionVerified:true,operationalReviewerMatched:true,
   currentOperationalLineVersion:source.operationalRevision.lineVersions[
     selected.ordinal-1].version,
   independentFinancialGrantVerified:false,realSignedLineApproval:false,
   customerOwnershipAttested:false,financeAuthorized:false,
   invoicePostingAllowed:false,approvalEventPublished:false,
   productionRelease:'NO_GO',
   nextRequiredGate:'SIGNED_EXPLICIT_FINANCIAL_APPROVAL_EVENT_AND_OFFICIAL_CUSTOMER_OWNERSHIP'
  });
 }catch{return denied('ACC259_SOURCE_OR_SESSION_READ_UNAVAILABLE');}
}
