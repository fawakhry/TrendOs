/* ACC228 — read-only operational identity/line candidate for ORIGINAL T12
 * employee order -> EXISTING EasyStore Finance Connector V1.
 *
 * Fails closed without ACC223/224's immutable at-create source row.
 * Even signed employee SELECTOR evidence is NOT official CUSTOMER OWNERSHIP,
 * approved department invoices, money or permission for finance posting.
 *
 * Not imported by Worker. No route, no remote finance/D1 reads or writes.
 */
export const T12_EMPLOYEE_FINANCE_INTAKE_VERSION='ACC228_T12_EMPLOYEE_ORDER_INTAKE_SOURCE_ONLY_NO_GO';
const id=v=>typeof v==='string'&&v.length>=1&&v.length<=160&&
 v===v.trim()&&v.normalize('NFC')===v&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(v);
const hex64=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
function deny(code,status=409){return {status,body:{
 success:false,code,sourceOnly:true,readOnly:true,
 officialCustomerOwnershipAttested:false,financeAuthorized:false,
 canRequestInvoice:false,departmentApprovalsVerified:false,
 posted:false,connectorEventPublished:false
}};}
export const T12_EMPLOYEE_INTAKE_ORDER_SQL=`
SELECT o.order_id AS orderId,o.request_key AS requestKey,
  o.actor AS orderActor,o.external_customer_id AS externalCustomerId,
  o.customer_mode AS orderCustomerMode,o.customer_name AS orderCustomerName,
  o.customer_phone AS orderCustomerPhone,o.department AS orderDepartment,
  o.priority AS orderPriority,o.source AS orderSource,o.notes AS orderNotes,
  o.status AS orderStatus,l.status AS ledgerStatus,
  l.canonical_json AS originalCanonicalJson,
  l.policy_epoch AS originalLedgerPolicyEpoch,
  l.order_id AS ledgerOrderId,l.actor AS ledgerActor,
  s.order_id AS capturedOrderId,s.request_key AS capturedRequestKey,
  s.customer_id AS officialCustomerId,
  s.external_customer_id AS capturedExternalCustomerId,
  s.customer_version AS capturedCustomerVersion,
  s.actor_subject AS capturedActor,
  s.selector_role AS selectorRole,
  s.selector_session_sha256 AS selectorSessionFingerprint,
  s.selector_issued_at AS selectorIssuedAt,
  s.selector_expires_at AS selectorExpiresAt,
  s.evidence_ref AS evidenceRef,
  s.capture_status AS captureStatus,
  s.finance_authorized AS captureFinanceAuthorized,
  s.delivery_authorized AS captureDeliveryAuthorized,
  c.customer_id AS currentCustomerId,c.version AS currentCustomerVersion,
  c.active AS customerActive
 FROM t12_prod_orders o
 LEFT JOIN t12_prod_request_ledger l ON l.request_key=o.request_key
 LEFT JOIN t12_order_customer_at_create_v1 s
   ON s.order_id=o.order_id AND s.request_key=o.request_key
 LEFT JOIN t12_customers c ON c.customer_id=s.customer_id
 WHERE o.order_id=? LIMIT 2
`;
export const T12_EMPLOYEE_INTAKE_LINES_SQL=`
SELECT line.line_id AS lineId,line.order_id AS orderId,
 line.request_key AS requestKey,line.ordinal AS ordinal,
 line.department AS department,line.assigned_to AS assignedTo,
 line.status AS lineStatus,line.qty AS qty,
 line.item_name AS itemName,line.priority AS priority,
 line.heat_press AS heatPress,line.fly_print AS flyPrint
 FROM t12_prod_lines line
 WHERE line.order_id=? ORDER BY line.ordinal ASC LIMIT 3
`;

export const T12_EMPLOYEE_INTAKE_ACTIVITY_SQL=`
SELECT event_key AS eventKey,request_key AS requestKey,order_id AS orderId,
 event_type AS eventType,payload_json AS payloadJson
 FROM t12_prod_events
 WHERE request_key=? AND event_key='activity' LIMIT 2
`;
export const T12_EMPLOYEE_INTAKE_OUTBOX_SQL=`
SELECT event_key AS eventKey,request_key AS requestKey,order_id AS orderId,
 line_id AS lineId,event_type AS eventType,status AS deliveryStatus,
 payload_json AS payloadJson
 FROM t12_prod_outbox
 WHERE request_key=? ORDER BY event_key ASC LIMIT 3
`;
export const T12_EMPLOYEE_FINANCE_INTAKE_POLICY=Object.freeze({
 sourceOnly:true,workerEntryWired:false,httpRouteAvailable:false,
 readsOneD1Batch:true,originalT12Only:true,
 reliesOnACC223ImmutableCapture:true,
 comparesOriginalT12CanonicalLedger:true,
 comparesOriginalT12ActivityAndOutbox:true,
 existingFinanceConnectorReused:true,usesOfficialNativeCustomerId:true,
 sourceSelectorVerifiesCustomerOwnership:false,
 includesBillingPrices:false,
 departmentApprovalsVerified:false,
 financeAuthorized:false,financeWriteAuthorized:false,
 productionRelease:'NO_GO'
});
export async function inspectT12EmployeeOrderFinanceCandidate({
 db,orderId,expectedOfficialCustomerId
}={}){
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
  return deny('T12_INTAKE_READ_TRANSACTION_UNAVAILABLE',503);
 if(!id(orderId)||!id(expectedOfficialCustomerId))
  return deny('EXACT_ORDER_AND_CUSTOMER_IDS_REQUIRED',400);
 try{
  // Cloudflare D1 batch is a SQL transaction. Do not use independent .first()
  // then .all() reads; actor/customer/line may change between statements.
  const batch=await db.batch([
   db.prepare(T12_EMPLOYEE_INTAKE_ORDER_SQL).bind(orderId),
   db.prepare(T12_EMPLOYEE_INTAKE_LINES_SQL).bind(orderId),
   db.prepare(T12_EMPLOYEE_INTAKE_ACTIVITY_SQL).bind(orderId),
   db.prepare(T12_EMPLOYEE_INTAKE_OUTBOX_SQL).bind(orderId)
  ]);
  if(!Array.isArray(batch)||batch.length!==4||
     batch.some(x=>!x||x.success!==true||!Array.isArray(x.results)))
   return deny('T12_INTAKE_READ_TRANSACTION_UNVERIFIED',503);
  const orderRows=batch[0].results;
  if(orderRows.length!==1||!orderRows[0])
   return deny('T12_ORDER_OR_IMMUTABLE_CAPTURE_NOT_UNIQUE');
  const o=orderRows[0];
  if(o.orderId!==orderId||!id(o.requestKey)||!id(o.ledgerActor)||
     o.orderActor!==o.ledgerActor||o.ledgerStatus!=='COMMITTED'||
     o.ledgerOrderId!==orderId||o.orderStatus!=='طلب جديد')
   return deny('T12_ORDER_NOT_COMMITTED_OR_ACTOR_CONFLICT');
  if(o.capturedOrderId!==orderId||o.capturedRequestKey!==o.requestKey||
     o.officialCustomerId!==expectedOfficialCustomerId||
     o.currentCustomerId!==expectedOfficialCustomerId||
     !Number.isSafeInteger(o.capturedCustomerVersion)||
     o.capturedCustomerVersion<1||
     o.currentCustomerVersion!==o.capturedCustomerVersion||
     o.customerActive!=='نعم'||o.captureStatus!=='SOURCE_ONLY_NOT_ATTESTED'||
     o.captureFinanceAuthorized!==0||o.captureDeliveryAuthorized!==0)
   return deny('OFFICIAL_CUSTOMER_CAPTURE_NOT_MATCHING_OR_UNATTESTED');
  if(o.capturedActor!==o.orderActor||
     !/^[0-9]{3,180}$/.test(o.externalCustomerId||'')||
     o.capturedExternalCustomerId!==o.externalCustomerId||
     !['service','admin'].includes(o.selectorRole)||
     !hex64(o.selectorSessionFingerprint)||
     !Number.isSafeInteger(o.selectorIssuedAt)||
     !Number.isSafeInteger(o.selectorExpiresAt)||
     o.selectorIssuedAt<=0||
     o.selectorExpiresAt<=o.selectorIssuedAt||
     o.selectorExpiresAt-o.selectorIssuedAt>900||
     !id(o.evidenceRef)||o.evidenceRef.length<12)
   return deny('T12_IMMUTABLE_SELECTOR_EVIDENCE_MISMATCH');
  // ACC229: the previous shape-only check could accept altered item/qty
  // because assigned_to and line_id were still valid. The ORIGINAL T12
  // general writer stores canonical full create intent, actor and selector
  // metadata in its existing request ledger. Compare original to current D1
  // without treating unsigned ledger content as customer financial ownership.
  const originalText=o.originalCanonicalJson;
  if(typeof originalText!=='string'||originalText.length<30||
     originalText.length>131072)
   return deny('ORIGINAL_T12_CREATE_INTENT_NOT_AVAILABLE');
  let original;
  try{original=JSON.parse(originalText);}
  catch{return deny('ORIGINAL_T12_CREATE_INTENT_NOT_AVAILABLE');}
  const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  if(!plain(original)||original.actor!==o.orderActor||
     original.requestKey!==o.requestKey||!id(original.policyEpoch)||
     original.policyEpoch!==o.originalLedgerPolicyEpoch||
     !plain(original.identity)||!plain(original.order)||
     !plain(original.sourceCapture)||!Array.isArray(original.lines)||
     !Array.isArray(original.queuePlans)||!plain(original.activityPlan))
   return deny('ORIGINAL_T12_CREATE_INTENT_NOT_AVAILABLE');
  const source=original.sourceCapture;
  if(source.customerId!==expectedOfficialCustomerId||
     source.externalCustomerId!==o.capturedExternalCustomerId||
     source.customerVersion!==o.capturedCustomerVersion||
     source.evidenceRef!==o.evidenceRef||
     source.selectorRole!==o.selectorRole||
     source.selectorSessionSha256!==o.selectorSessionFingerprint||
     source.selectorIssuedAt!==o.selectorIssuedAt||
     source.selectorExpiresAt!==o.selectorExpiresAt)
   return deny('T12_ORIGINAL_CREATE_CUSTOMER_CAPTURE_CONFLICT');
  if(original.identity.mode!==o.orderCustomerMode||
     original.identity.customerName!==o.orderCustomerName||
     original.identity.customerPhone!==o.orderCustomerPhone||
     original.identity.externalCustomerId!==o.externalCustomerId||
     original.order.department!==o.orderDepartment||
     original.order.priority!==o.orderPriority||
     original.order.source!==o.orderSource||
     original.order.notes!==o.orderNotes||
     original.order.status!==o.orderStatus||
     original.activityPlan.requestKey!==o.requestKey||
     original.queuePlans.length!==original.lines.length)
   return deny('T12_ORIGINAL_CREATE_ORDER_DRIFT');
  const lines=batch[1].results;
  if(lines.length<1||lines.length>2||original.lines.length!==lines.length)
   return deny('T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
  const seen=new Set();
  const normalized=[];
  for(let i=0;i<lines.length;i++){
   const l=lines[i];
   const expectedEmployee={'طباعة':'وائل','ليزر':'جابر'}[l?.department];
   const originalLine=original.lines[i];
   const queue=original.queuePlans[i];
   if(!l||!id(l.lineId)||seen.has(l.lineId)||
      l.lineId!==orderId+'-'+String(i+1).padStart(2,'0')||
      l.ordinal!==i+1||l.orderId!==orderId||
      l.requestKey!==o.requestKey||l.lineStatus!=='طلب جديد'||
      !expectedEmployee||l.assignedTo!==expectedEmployee||
      typeof l.itemName!=='string'||l.itemName.trim()===''||
      typeof l.qty!=='number'||!Number.isFinite(l.qty)||l.qty<=0||
      !plain(originalLine)||!plain(queue)||
      originalLine.ordinal!==i+1||
      originalLine.department!==l.department||
      originalLine.assignedTo!==l.assignedTo||
      originalLine.itemName!==l.itemName||
      originalLine.qty!==l.qty||
      originalLine.priority!==l.priority||
      originalLine.status!==l.lineStatus||
      originalLine.heatPress!==(l.heatPress===1?'نعم':'لا')||
      originalLine.flyPrint!==(l.flyPrint===1?'نعم':'لا')||
      ![0,1].includes(l.heatPress)||![0,1].includes(l.flyPrint)||
      queue.requestKey!==o.requestKey||
      queue.department!==l.department||
      queue.assignedTo!==l.assignedTo)
    return deny('T12_SOURCE_LINE_SET_INCOMPLETE_OR_UNSUPPORTED');
   seen.add(l.lineId);
   normalized.push(Object.freeze({
     lineId:l.lineId,department:l.department,ordinal:l.ordinal
   }));
  }
  if(lines.length===2&&new Set(lines.map(x=>x.department)).size!==2)
   return deny('T12_DUPLICATED_OR_INVALID_DEPARTMENT_LANES');
  // ACC230: the ORIGINAL writer creates exactly one source activity event
  // and one outbox record per physical T12 line in the SAME create batch.
  // Missing, extra, rewritten or failed entries signal a partial/unknown
  // operational handoff, not a safe candidate for EasyStore billing.
  const activities=batch[2].results;
  if(activities.length!==1)return deny('T12_ACTIVITY_EVENT_MISSING_OR_AMBIGUOUS');
  const activity=activities[0];
  if(!activity||activity.eventKey!=='activity'||
     activity.requestKey!==o.requestKey||activity.orderId!==orderId||
     activity.eventType!=='order-create'||
     typeof activity.payloadJson!=='string')
   return deny('T12_ORIGINAL_ACTIVITY_EVENT_DRIFT');
  let storedActivity;
  try{storedActivity=JSON.parse(activity.payloadJson);}
  catch{return deny('T12_ORIGINAL_ACTIVITY_EVENT_DRIFT');}
  if(JSON.stringify(storedActivity)!==JSON.stringify(original.activityPlan))
   return deny('T12_ORIGINAL_ACTIVITY_EVENT_DRIFT');
  const outbox=batch[3].results;
  if(outbox.length!==lines.length)
   return deny('T12_ORIGINAL_OUTBOX_LINES_MISSING_OR_EXTRA');
  for(let i=0;i<outbox.length;i++){
   const q=outbox[i],expected=original.queuePlans[i],line=lines[i];
   if(!q||!plain(expected)||
      q.eventKey!=='queue:'+String(i+1).padStart(2,'0')||
      q.requestKey!==o.requestKey||q.orderId!==orderId||
      q.lineId!==line.lineId||q.eventType!=='trend-master-status-intent'||
      !['pending','done'].includes(q.deliveryStatus)||
      typeof q.payloadJson!=='string')
    return deny('T12_ORIGINAL_OUTBOX_ROW_INVALID_OR_FAILED');
   let storedPlan;
   try{storedPlan=JSON.parse(q.payloadJson);}
   catch{return deny('T12_ORIGINAL_OUTBOX_PAYLOAD_DRIFT');}
   if(JSON.stringify(storedPlan)!==JSON.stringify(expected))
    return deny('T12_ORIGINAL_OUTBOX_PAYLOAD_DRIFT');
  }
  // These IDs are an INTERNAL operational candidate only. The original
  // EasyStore invoice requires distinct real departmental APPROVALS, financial
  // pricing and independent official customer ownership/provenance.
  return {status:200,body:{
   success:true,version:T12_EMPLOYEE_FINANCE_INTAKE_VERSION,
   operationalSourceShapeVerified:true,
   source:'original-t12-at-create-source-only',
   officialCustomerId:expectedOfficialCustomerId,
   orderId,lines:normalized,
   lineCount:normalized.length,
   sourceOnly:true,readOnly:true,
   officialCustomerOwnershipAttested:false,
   financeAuthorized:false,canRequestInvoice:false,
   departmentApprovalsVerified:false,
   posted:false,connectorEventPublished:false,
   nextRequiredGate:'AUTHENTICATED_CUSTOMER_OWNERSHIP_PLUS_EASYSTORE_V1_FINANCE_CONNECTOR'
  }};
 }catch{return deny('T12_INTAKE_ORIGINAL_SCHEMA_READ_UNAVAILABLE',503);}
}
