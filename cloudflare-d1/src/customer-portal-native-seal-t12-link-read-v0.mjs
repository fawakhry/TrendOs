/* Entry683 — OFF/source-only operational readback of Entry682 sealed draft
 * against EXISTING T12 general create ledger/order/line. No order writer,
 * finance reads/writes, connector POST, customer HTTP route or delegation.
 *
 * A committed T12 request matching a customer-created draft key is NOT an
 * official order->customer owner attestation: original T12 orders lack FK.
 */
export const CUSTOMER_SEAL_T12_LINK_VERSION_V0='ENTRY683_SEALED_DRAFT_T12_OPERATIONAL_LINK_OFF_V0';
const validDraft=v=>typeof v==='string'&&/^CDR-[a-f0-9]{32}$/.test(v);
const validLine=v=>typeof v==='string'&&/^CDI-[a-f0-9]{32}$/.test(v);
const validId=v=>typeof v==='string'&&v.length>0&&v.length<=160&&v===v.trim()&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(v);
function stop(code,status=409){
 return {status,body:{success:false,code,readOnly:true,sourceOnly:true,
  operationallyLinked:false,customerOwnerAttested:false,
  officialCustomerFKVerified:false,financeAuthorized:false,
  invoiceAuthorized:false,orderCreated:false,connectorEventPublished:false}};
}
export const CUSTOMER_SEAL_T12_LINK_SEAL_SQL_V0=`
SELECT s.draft_id AS draftId,s.customer_id AS customerId,
       s.t12_request_key AS requestKey,s.snapshot_json AS snapshotJson,
       s.stage AS stage,d.customer_id AS draftCustomerId,
       d.created_at_ms AS draftCreatedAtMs
 FROM customer_portal_native_draft_seals_v1 s
 JOIN customer_portal_native_drafts_v1 d ON d.draft_id=s.draft_id
 WHERE s.draft_id=? LIMIT 2
`;
export const CUSTOMER_SEAL_T12_LINK_ORDER_SQL_V0=`
SELECT l.request_key AS requestKey,l.order_id AS ledgerOrderId,
       l.status AS ledgerStatus,l.actor AS ledgerActor,
       o.order_id AS orderId,o.request_key AS orderRequestKey,
       o.customer_name AS orderCustomerName,o.customer_phone AS orderPhone,
       o.department AS orderDepartment,o.notes AS orderNotes,
       o.source AS orderSource,o.actor AS orderActor,
       o.customer_mode AS orderCustomerMode,o.status AS orderStatus
 FROM customer_portal_native_draft_seals_v1 s
 JOIN t12_prod_request_ledger l ON l.request_key=s.t12_request_key
 LEFT JOIN t12_prod_orders o ON o.request_key=l.request_key
 WHERE s.draft_id=? LIMIT 2
`;
export const CUSTOMER_SEAL_T12_LINK_LINES_SQL_V0=`
SELECT line.line_id AS lineId,line.order_id AS orderId,
       line.request_key AS requestKey,line.ordinal AS ordinal,
       line.department AS department,line.item_name AS itemName,
       line.qty AS qty,line.heat_press AS heatPress,
       line.fly_print AS flyPrint,line.status AS status
 FROM customer_portal_native_draft_seals_v1 s
 JOIN t12_prod_orders o ON o.request_key=s.t12_request_key
 JOIN t12_prod_lines line ON line.order_id=o.order_id
 WHERE s.draft_id=? ORDER BY line.ordinal ASC LIMIT 3
`;
export const CUSTOMER_SEAL_T12_LINK_POLICY_V0=Object.freeze({
 sourceOnly:true,workerEntryWired:false,httpRouteAvailable:false,
 readsOneD1BatchTransaction:true,canonicalT12WriterReused:true,
 officialT12OrderWriterCalled:false,customerOwnerAttested:false,
 invoiceCreation:false,directAccountingD1Access:false,
 financeConnectorPost:false,productionRelease:'NO_GO'
});
function exactOne(r){return Array.isArray(r)&&r.length===1&&r[0]&&typeof r[0]==='object';}
export async function inspectSealedCustomerDraftT12LinkV0({db,draftId}={}){
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
  return stop('LINK_D1_READ_TRANSACTION_UNAVAILABLE',503);
 if(!validDraft(draftId))return stop('INVALID_DRAFT_REFERENCE',400);
 try{
  const result=await db.batch([
   db.prepare(CUSTOMER_SEAL_T12_LINK_SEAL_SQL_V0).bind(draftId),
   db.prepare(CUSTOMER_SEAL_T12_LINK_ORDER_SQL_V0).bind(draftId),
   db.prepare(CUSTOMER_SEAL_T12_LINK_LINES_SQL_V0).bind(draftId)
  ]);
  if(!Array.isArray(result)||result.length!==3||
     result.some(r=>!r||r.success!==true||!Array.isArray(r.results)))
    return stop('LINK_READ_TRANSACTION_FAILED',503);
  if(!exactOne(result[0].results))return stop('NO_UNIQUE_SEALED_CUSTOMER_DRAFT');
  const s=result[0].results[0];
  if(s.draftId!==draftId||s.customerId!==s.draftCustomerId||
     !validId(s.customerId)||s.stage!=='SEALED'||!Number.isSafeInteger(Number(s.draftCreatedAtMs)))
    return stop('SEALED_DRAFT_SOURCE_INVALID');
  const expected='cld1_'+String(s.draftCreatedAtMs)+'_'+draftId.slice(4);
  if(s.requestKey!==expected)return stop('T12_DRAFT_KEY_NOT_CANONICAL');
  let snapshot;
  try{snapshot=JSON.parse(s.snapshotJson);}catch{return stop('SEALED_PRIVATE_SNAPSHOT_INVALID');}
  if(!Array.isArray(snapshot)||snapshot.length!==8||
     snapshot[0]!=='ENTRY682_CUSTOMER_DRAFT_SEAL_V1'||
     snapshot[1]!==draftId||snapshot[2]!==s.customerId||
     snapshot[5]!==Number(s.draftCreatedAtMs)||
     !Array.isArray(snapshot[6])||!Array.isArray(snapshot[7]))
    return stop('SEALED_PRIVATE_SNAPSHOT_INVALID');
  // Original T12 General Create supports ONE logical customer item. Its
  // two-lane print+laser expansion is NOT two separate customer items.
  if(snapshot[6].length!==1||snapshot[7].length!==0)
    return stop('T12_MULTI_ITEM_OR_R2_HANDOFF_NOT_SUPPORTED');
  const item=snapshot[6][0];
  if(!Array.isArray(item)||item.length!==8||!validLine(item[0])||
     item[1]!==1||!['طباعة','ليزر'].includes(item[2])||
     typeof item[3]!=='string'||!item[3]||
     !Number.isSafeInteger(item[4])||item[4]<1||item[4]>99||
     typeof item[5]!=='string'||![0,1].includes(item[6])||
     ![0,1].includes(item[7])||
     (item[2]==='ليزر'&&(item[6]!==0||item[7]!==0)))
    return stop('SEALED_LINE_CONTRACT_INVALID');
  if(!exactOne(result[1].results))return stop('T12_REQUEST_NOT_COMMITTED_OR_AMBIGUOUS');
  const o=result[1].results[0];
  if(o.requestKey!==expected||o.ledgerStatus!=='COMMITTED')
    return stop('T12_REQUEST_NOT_COMMITTED_OR_AMBIGUOUS');
  if(!validId(o.orderId)||o.ledgerOrderId!==o.orderId||
     o.orderRequestKey!==expected||!validId(o.ledgerActor)||
     o.ledgerActor!==o.orderActor||o.orderSource!=='customer-native-draft'||
     o.orderCustomerMode!=='registered'||o.orderStatus!=='طلب جديد')
    return stop('T12_COMMITTED_ORDER_SOURCE_MISMATCH');
  // Customer identity here is a byte-for-byte comparison with the sealed
  // private draft, NOT a FK or customer-owner verification for finance.
  if(o.orderCustomerName!==snapshot[3]||o.orderPhone!==snapshot[4]||
     o.orderNotes!==item[5])
    return stop('T12_ORDER_SNAPSHOT_IDENTITY_MISMATCH');
  const lines=result[2].results;
  if(lines.length!==1)return stop('T12_ORDER_LINE_PARITY_UNVERIFIED');
  const line=lines[0];
  if(line.requestKey!==expected||line.orderId!==o.orderId||
     line.ordinal!==1||line.lineId!==o.orderId+'-01'||
     line.department!==item[2]||line.itemName!==item[3]||
     line.qty!==item[4]||line.heatPress!==item[6]||
     line.flyPrint!==item[7]||line.status!=='طلب جديد'||
     o.orderDepartment!==item[2])
    return stop('T12_ORDER_LINE_PARITY_UNVERIFIED');
  // Return only operational IDs for a FUTURE authorized server delegate;
  // no customer PII, private R2 metadata, invoice, cost, balance or token.
  return {status:200,body:{
   success:true,version:CUSTOMER_SEAL_T12_LINK_VERSION_V0,
   readOnly:true,sourceOnly:true,operationallyLinked:true,
   orderId:o.orderId,lineIds:[line.lineId],lineCount:1,
   customerOwnerAttested:false,officialCustomerFKVerified:false,
   financeAuthorized:false,invoiceAuthorized:false,
   orderCreated:false,connectorEventPublished:false,
   nextGate:'VERIFY_OFFICIAL_ORDER_CUSTOMER_OWNERSHIP_AND_EASYSTORE_V1_CONNECTOR'
  }};
 }catch{return stop('LINK_SOURCE_SCHEMA_OR_READ_UNAVAILABLE',503);}
}
