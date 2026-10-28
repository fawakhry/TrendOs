/* ACC262 — read-only ORIGINAL T12 0005+0008+0035 customer-source scanner.
 * 0035 is SOURCE_ONLY_NOT_ATTESTED, NOT official customer ownership.
 * No Worker import, order/customer copies, schema changes or financial effects.
 */
import {inspectOriginalNativeReviewerACC259} from './t12-native-department-review-acc259-sourceonly.mjs';
export const POLICY=Object.freeze({
 mode:'OFF',acceptedMode:'ISOLATED_READONLY',readOnly:true,
 originalOrders:true,originalCustomerMaster:true,originalAtCreateCapture:true,
 independentCustomerOwnerAttested:false,realSignedFinancialApproval:false,
 financeAuthorized:false,invoiceAllowed:false,workerWired:false,
 financeRelease:'NO_GO'
});
const okId=x=>typeof x==='string'&&x.length>0&&x.length<=160&&x===x.trim()&&
 x.normalize('NFC')===x&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(x);
const base=Object.freeze({
 sourceOnly:true,readOnly:true,officialCustomerOwnerAttested:false,
 realSignedFinancialApproval:false,independentFinanceGrantVerified:false,
 financeAuthorized:false,canPublishToEasyStore:false,canRequestInvoice:false,
 canPostInvoice:false,canPostCash:false,financeRelease:'NO_GO'
});
const reject=(code,extra={})=>Object.freeze({
 success:false,code,captureShapeMatched:false,
 employeeReviewerVerified:false,...base,...extra
});
export const TABLES=Object.freeze([
 't12_prod_orders','t12_prod_lines','t12_prod_request_ledger',
 't12_customers','t12_order_customer_at_create_control_v1',
 't12_order_customer_at_create_v1'
]);
export const TABLES_SQL=
 "SELECT name FROM sqlite_master WHERE type='table' AND name IN ("+
 TABLES.map(()=>'?').join(',')+") ORDER BY name";
export const CONTROL_SQL=
 "SELECT marker,mode FROM t12_order_customer_at_create_control_v1 WHERE singleton=1 LIMIT 2";
export const CAPTURE_SQL=
 "SELECT a.order_id AS orderId,a.request_key AS requestKey,"+
 "a.customer_id AS customerId,a.customer_version AS customerVersion,"+
 "a.external_customer_id AS externalCustomerId,"+
 "a.actor_subject AS actorSubject,a.evidence_ref AS evidenceRef,"+
 "a.selector_role AS selectorRole,"+
 "a.selector_session_sha256 AS selectorSessionSha256,"+
 "a.selector_issued_at AS selectorIssuedAt,"+
 "a.selector_expires_at AS selectorExpiresAt,"+
 "a.capture_status AS captureStatus,a.finance_authorized AS financeAuthorized,"+
 "a.delivery_authorized AS deliveryAuthorized,"+
 "o.request_key AS orderRequestKey,o.actor AS orderActor,"+
 "o.external_customer_id AS orderExternalCustomerId,"+
 "l.status AS ledgerStatus,l.order_id AS ledgerOrderId,"+
 "l.actor AS ledgerActor,c.active AS customerActive,"+
 "c.version AS currentCustomerVersion "+
 "FROM t12_order_customer_at_create_v1 a "+
 "JOIN t12_prod_orders o ON o.order_id=a.order_id "+
 "JOIN t12_prod_request_ledger l ON l.request_key=o.request_key "+
 "LEFT JOIN t12_customers c ON c.customer_id=a.customer_id "+
 "WHERE a.order_id=? LIMIT 2";
async function rows(db,sql,...args){
 const s=args.length?db.prepare(sql).bind(...args):db.prepare(sql);
 const v=await s.all();
 if(Array.isArray(v))return v;
 if(v&&Array.isArray(v.results))return v.results;
 throw Error('ACC262_BAD_READ_ONLY_DB_RESULT');
}
export async function inspectOriginalCustomerReadinessACC262({
 env,orderId,lineId,username,employeeToken,expectedOfficialCustomerId,
 verifyOriginalNativeSession,mode,nowMs=Date.now()
}={}){
 if(mode!=='ISOLATED_READONLY'||env?.ACC262_MODE!=='ISOLATED_READONLY')
  return reject('ACC262_DEFAULT_OFF');
 if(!env?.DB||typeof env.DB.prepare!=='function'||!okId(orderId)||
    !/^[0-9]{4,18}$/.test(orderId)||!okId(lineId)||
    !okId(username)||!okId(expectedOfficialCustomerId)||
    typeof verifyOriginalNativeSession!=='function')
  return reject('ACC262_EXACT_SOURCE_AND_NATIVE_VERIFIER_REQUIRED');
 let reviewer;
 try{reviewer=await inspectOriginalNativeReviewerACC259({
  env,orderId,lineId,username,employeeToken,nowMs,
  verifyOriginalNativeSession,mode:'ISOLATED_NATIVE_REVIEW_READONLY'
 })}catch{return reject('ACC262_NATIVE_REVIEWER_EXCEPTION')}
 if(reviewer?.success!==true||reviewer?.financeAuthorized!==false||
    reviewer?.realSignedLineApproval!==false)
  return reject('ACC262_NATIVE_EMPLOYEE_OR_ORDER_NOT_VERIFIED');
 try{
  const present=new Set((await rows(env.DB,TABLES_SQL,...TABLES)).map(x=>x.name));
  if(TABLES.some(t=>!present.has(t)))
   return reject('ACC262_ORIGINAL_0008_OR_0035_NOT_APPLIED',{
    employeeReviewerVerified:true,captureTablesPresent:false
   });
  const control=await rows(env.DB,CONTROL_SQL);
  if(control.length!==1||
     control[0].marker!=='ACC223_ORDER_CUSTOMER_SOURCE_CAPTURE_V1'||
     !['OFF','ISOLATED'].includes(control[0].mode))
   return reject('ACC262_ORIGINAL_0035_CONTROL_INVALID',{employeeReviewerVerified:true});
  if(control[0].mode==='OFF')
   return reject('ACC262_ORIGINAL_0035_DEFAULT_OFF',{employeeReviewerVerified:true});
  const values=await rows(env.DB,CAPTURE_SQL,orderId);
  if(values.length!==1)
   return reject('ACC262_ORIGINAL_AT_CREATE_CAPTURE_ABSENT',{
    employeeReviewerVerified:true,captureTablesPresent:true
   });
  const a=values[0];
  if(a.orderId!==orderId||a.requestKey!==a.orderRequestKey||
     a.ledgerOrderId!==orderId||a.ledgerStatus!=='COMMITTED'||
     a.actorSubject!==a.orderActor||a.actorSubject!==a.ledgerActor||
     !okId(a.externalCustomerId)||
     a.externalCustomerId!==a.orderExternalCustomerId||
     a.customerId!==expectedOfficialCustomerId||
     a.customerActive!=='نعم'||
     !Number.isSafeInteger(a.customerVersion)||a.customerVersion<1||
     a.customerVersion!==a.currentCustomerVersion||
     a.captureStatus!=='SOURCE_ONLY_NOT_ATTESTED'||
     a.financeAuthorized!==0||a.deliveryAuthorized!==0||
     !['admin','service'].includes(a.selectorRole)||
     !/^[a-f0-9]{64}$/.test(a.selectorSessionSha256||'')||
     !Number.isSafeInteger(a.selectorIssuedAt)||
     !Number.isSafeInteger(a.selectorExpiresAt)||
     a.selectorIssuedAt<=0||a.selectorExpiresAt<=a.selectorIssuedAt||
     typeof a.evidenceRef!=='string'||a.evidenceRef.length<12||
     a.evidenceRef.length>180)
   return reject('ACC262_CUSTOMER_CAPTURE_SOURCE_LINEAGE_MISMATCH',{
    employeeReviewerVerified:true,captureTablesPresent:true
   });
  return Object.freeze({
   success:true,code:'ACC262_RELATIONAL_SOURCE_SHAPE_ONLY_NOT_OWNER_ATTESTED',
   orderId,lineId,department:reviewer.department,
   customerIdShapeMatched:true,captureShapeMatched:true,
   captureTablesPresent:true,employeeReviewerVerified:true,
   captureStatus:'SOURCE_ONLY_NOT_ATTESTED',
   operationalLineVersion:reviewer.currentOperationalLineVersion,
   ...base
  });
 }catch{
  return reject('ACC262_CUSTOMER_SOURCE_READ_UNAVAILABLE',{
   employeeReviewerVerified:true
  });
 }
}
/* This classification never treats customer source capture + a signed
 * operational review as an independently signed financial approval.
 * Even a correctly named V1 event remains blocked until genuine independent
 * source signer, official owner and consumer security are implemented.
 */
export function classifyUntrustedFinanceInboundACC262({event,captureReview}={}){
 const e=event&&typeof event==='object'&&!Array.isArray(event)?event:{};
 if(e.event_type==='operational_review_intent')
  return reject('ACC262_OPERATIONAL_REVIEW_INTENT_NOT_FINANCE_APPROVAL');
 if(e.event_type!=='order_line_approved')
  return reject('ACC262_FINANCE_APPROVAL_EVENT_TYPE_MISSING');
 if(e.contract_version!=='ACCOUNTING_CONNECTOR_CONTRACT_V1')
  return reject('ACC262_EASYSTORE_FINANCE_CONTRACT_VERSION_REQUIRED');
 if(!Array.isArray(e.evidence_refs)||e.evidence_refs.length===0)
  return reject('ACC262_INDEPENDENT_APPROVAL_EVIDENCE_MISSING');
 return reject('ACC262_REAL_SOURCE_SIGNER_AND_OFFICIAL_OWNER_MISSING',{
  captureShapeObserved:captureReview?.captureShapeMatched===true,
  independentSourceSignatureVerified:false
 });
}
