/* TrendOS T12 official customer/order integrity scanner — ACC222.
 * SOURCE-ONLY, READ-ONLY, NOT IMPORTED BY WORKER, NEVER FINANCE AUTHORITY.
 * Uses existing T12 tables and refuses caller-supplied external_customer_id
 * or manual review candidate as proof of official customer ownership.
 */
export const T12_ORDER_CUSTOMER_FINANCE_FENCE_VERSION='ACC222_T12_ORDER_CUSTOMER_FINANCE_FENCE_NO_GO';
const MAX_LINES=100;
const validId=x=>typeof x==='string'&&x.length>=1&&x.length<=160&&x===x.trim()&&
  x.normalize('NFC')===x&&!/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(x);
function fail(code){return Object.freeze({success:false,code,sourceShapeQualified:false,
  financeAuthorized:false,postingAllowed:false,ownerAttested:false,
  provenanceVerified:false,liveRuntimeVerified:false,
  version:T12_ORDER_CUSTOMER_FINANCE_FENCE_VERSION});}
const reason=(code,shape=false,counts={})=>Object.freeze({
  success:false,code,sourceShapeQualified:shape,
  financeAuthorized:false,postingAllowed:false,ownerAttested:false,
  provenanceVerified:false,liveRuntimeVerified:false,
  version:T12_ORDER_CUSTOMER_FINANCE_FENCE_VERSION,...counts
});
function rows(db,sql,...params){
 const s=db.prepare(sql);
 return params.length?s.bind(...params).all():s.all();
}
function one(db,sql,...params){
 const s=db.prepare(sql);
 return params.length?s.bind(...params).first():s.first();
}
export async function inspectOfficialT12OrderCustomerShape(db,input={}){
  if(!db||typeof db.prepare!=='function'||!input||typeof input!=='object'||
     Array.isArray(input))return fail('READONLY_DB_AND_REQUEST_REQUIRED');
  const {orderId,customerId,expectedLineIds}=input;
  if(!validId(orderId)||!validId(customerId)||!Array.isArray(expectedLineIds)||
     !expectedLineIds.length||expectedLineIds.length>MAX_LINES||
     expectedLineIds.some(x=>!validId(x))||
     new Set(expectedLineIds).size!==expectedLineIds.length)
    return fail('INVALID_OR_DUPLICATED_EXACT_IDS');
  try{
    const fk=rows(db,'PRAGMA foreign_key_list(t12_prod_orders)');
    const fields=rows(db,'PRAGMA table_info(t12_prod_orders)');
    const hasOfficialKey=fields.some(x=>x.name==='customer_id');
    const hasOfficialFk=fk.some(x=>x.table==='t12_customers'&&x.from==='customer_id'&&x.to==='customer_id');
    if(!hasOfficialKey||!hasOfficialFk)return fail('OFFICIAL_CUSTOMER_ID_AND_FK_NOT_IN_SCHEMA');
    const order=one(db,
      'SELECT o.customer_id AS customerId,o.request_key AS requestKey, '+
      'l.status AS commitStatus,l.order_id AS ledgerOrderId,l.actor AS creatorActor, '+
      'c.active AS customerActive FROM t12_prod_orders o '+
      'LEFT JOIN t12_prod_request_ledger l ON l.request_key=o.request_key AND l.order_id=o.order_id '+
      'LEFT JOIN t12_customers c ON c.customer_id=o.customer_id WHERE o.order_id=? LIMIT 1',orderId);
    if(!order)return fail('OFFICIAL_ORDER_MISSING');
    if(order.customerId!==customerId)return fail('ORDER_CUSTOMER_NOT_EXACT');
    if(!order.customerId||order.customerActive!=='نعم')
      return fail('OFFICIAL_CUSTOMER_INACTIVE_OR_MISSING');
    if(order.commitStatus!=='COMMITTED'||order.ledgerOrderId!==orderId||
       !validId(order.creatorActor))
      return fail('ORDER_CREATION_NOT_COMMITTED');
    const actual=rows(db,'SELECT line_id AS lineId FROM t12_prod_lines WHERE order_id=? ORDER BY line_id',orderId);
    const expectedSet=new Set(expectedLineIds);
    if(actual.length!==expectedLineIds.length||
       actual.some(x=>!validId(x.lineId)||!expectedSet.has(x.lineId)))
      return fail('INCOMPLETE_OR_CROSS_ORDER_LINE_SET');
    // FK+commit is relational SHAPE only, not authenticated historical owner
    // consent, creator SSO, departmental approvals or money permissions.
    return reason('RELATIONAL_SHAPE_ONLY_UNATTESTED',true,{lineCount:actual.length});
  }catch{
    return fail('OFFICIAL_SOURCE_READ_UNAVAILABLE');
  }
}
