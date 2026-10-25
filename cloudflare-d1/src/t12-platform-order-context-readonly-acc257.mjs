/* ACC257 — existing TrendOS PLATFORM native T12 order context, READ ONLY.
 * Uses only real operational 0005/0006 tables already confirmed present in
 * trendos-main via ACC255 Cloudflare sqlite_master. NO 0035 dependency.
 * NO customer binding, no finance authority, no signed line approval.
 * Not imported by Worker; service binding/finance inbox remain disabled.
 * NEVER fall back to legacy Sheets mirror rows, phone or customer name.
 */
export const ACC257_PLATFORM_CONTEXT_POLICY=Object.freeze({
 sourceSystem:'trendos_t12_native',requiresOriginalPlatformT12:true,
 readOnly:true,usesOriginalCreateLedger:true,
 requiresAtCreateCustomerCapture:false,
 returnsCustomerIdentity:false,customerOwnershipAttested:false,
 canRequestInvoice:false,departmentApprovalsVerified:false,
 financeAuthorized:false,financialWritesAllowed:false,
 actualCloudflareWorkerWired:false,productionRelease:'NO_GO'
});
const validId=x=>typeof x==='string'&&x.length>=1&&x.length<=160&&
 x===x.trim()&&x.normalize('NFC')===x&&
 !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(x);
const reject=code=>({status:409,body:{
 success:false,code,sourceSystem:'trendos_t12_native',
 sourceOnly:true,readOnly:true,customerOwnershipAttested:false,
 departmentApprovalsVerified:false,financeAuthorized:false,
 canRequestInvoice:false,consumerAcknowledged:false,posted:false,
 productionRelease:'NO_GO'
}});
export const ACC257_PLATFORM_ORDER_SQL=`
SELECT o.order_id AS orderId,o.request_key AS requestKey,
 o.actor AS orderActor,o.status AS orderStatus,
 o.created_at AS orderCreatedAt,
 led.order_id AS ledgerOrderId,led.request_key AS ledgerRequestKey,
 led.actor AS ledgerActor,led.status AS ledgerStatus,
 led.created_at AS ledgerCreatedAt
 FROM t12_prod_orders o
 LEFT JOIN t12_prod_request_ledger led
 ON led.request_key=o.request_key
 WHERE o.order_id=? LIMIT 2`;
export const ACC257_PLATFORM_LINES_SQL=`
SELECT line_id AS lineId,order_id AS orderId,
 request_key AS requestKey,ordinal,department,status AS lineStatus,
 assigned_to AS assignedTo,created_at AS lineCreatedAt
 FROM t12_prod_lines WHERE order_id=?
 ORDER BY ordinal ASC LIMIT 3`;
export const ACC257_PLATFORM_ACTIVITY_SQL=`
SELECT event_key AS eventKey,request_key AS requestKey,
 order_id AS orderId,event_type AS eventType,created_at AS activityCreatedAt
 FROM t12_prod_events
 WHERE request_key=(SELECT request_key FROM t12_prod_orders WHERE order_id=?)
 AND event_key='activity' LIMIT 2`;
export const ACC257_PLATFORM_OUTBOX_SQL=`
SELECT event_key AS eventKey,request_key AS requestKey,
 order_id AS orderId,line_id AS lineId,
 event_type AS eventType,status AS deliveryStatus,
 created_at AS outboxCreatedAt
 FROM t12_prod_outbox
 WHERE request_key=(SELECT request_key FROM t12_prod_orders WHERE order_id=?)
 ORDER BY event_key ASC LIMIT 3`;
export const ACC257_PLATFORM_RUNTIME_SQL=`
SELECT l.line_id AS lineId,l.order_id AS orderId,
 r.status AS runtimeStatus,r.updated_by AS runtimeActor,
 r.version AS runtimeVersion,
 (SELECT COUNT(*) FROM t12_prod_runtime_events e
   WHERE e.order_id=l.order_id AND e.line_id=l.line_id)
   AS runtimeEventCount,
 (SELECT e.event_type FROM t12_prod_runtime_events e
   WHERE e.order_id=l.order_id AND e.line_id=l.line_id
   ORDER BY e.event_id DESC LIMIT 1) AS lastEventType,
 (SELECT e.new_status FROM t12_prod_runtime_events e
   WHERE e.order_id=l.order_id AND e.line_id=l.line_id
   ORDER BY e.event_id DESC LIMIT 1) AS lastEventStatus,
 (SELECT e.actor FROM t12_prod_runtime_events e
   WHERE e.order_id=l.order_id AND e.line_id=l.line_id
   ORDER BY e.event_id DESC LIMIT 1) AS lastEventActor
 FROM t12_prod_lines l
 LEFT JOIN t12_prod_line_runtime r
 ON r.order_id=l.order_id AND r.line_id=l.line_id
 WHERE l.order_id=? ORDER BY l.ordinal ASC LIMIT 3`;
const SQL=Object.freeze([
 ACC257_PLATFORM_ORDER_SQL,ACC257_PLATFORM_LINES_SQL,
 ACC257_PLATFORM_ACTIVITY_SQL,ACC257_PLATFORM_OUTBOX_SQL,
 ACC257_PLATFORM_RUNTIME_SQL
]);
const created=x=>{
 if(typeof x!=='string'||!/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(x))return null;
 const iso=x.replace(' ','T')+'Z',ms=Date.parse(iso);
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,19)+'Z'===iso?ms:null;
};
export async function inspectPlatformNativeOrderContextReadOnly({
 db,orderId
}={}){
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
  return reject('ACC257_ORIGINAL_PLATFORM_READER_REQUIRED');
 if(!validId(orderId))return reject('ACC257_EXACT_ORDER_ID_REQUIRED');
 let batch;
 try{batch=await db.batch(SQL.map(q=>db.prepare(q).bind(orderId)));}
 catch{return reject('ACC257_NATIVE_PLATFORM_READ_UNAVAILABLE');}
 if(!Array.isArray(batch)||batch.length!==5||
    batch.some(x=>x?.success!==true||!Array.isArray(x.results)))
  return reject('ACC257_NATIVE_PLATFORM_SNAPSHOT_UNVERIFIED');
 const [orders,lines,activities,outbox,runtime]=batch.map(x=>x.results);
 if(orders.length!==1||!orders[0])return reject('ACC257_ORIGINAL_ORDER_NOT_UNIQUE');
 const o=orders[0];
 if(o.orderId!==orderId||!validId(o.requestKey)||
    o.ledgerRequestKey!==o.requestKey||
    o.ledgerOrderId!==orderId||o.ledgerStatus!=='COMMITTED'||
    !validId(o.orderActor)||o.ledgerActor!==o.orderActor||
    o.orderStatus!=='طلب جديد')
  return reject('ACC257_UNCOMMITTED_OR_ALTERED_NATIVE_ORDER');
 if(lines.length<1||lines.length>2||outbox.length!==lines.length||
    runtime.length!==lines.length||activities.length!==1)
  return reject('ACC257_ORIGINAL_LINES_OR_CREATE_EVENTS_INCOMPLETE');
 const event=activities[0];
 if(event?.eventKey!=='activity'||event?.requestKey!==o.requestKey||
    event?.orderId!==orderId||event?.eventType!=='order-create')
  return reject('ACC257_NATIVE_CREATE_ACTIVITY_NOT_MATCHED');
 const eventTime=created(event.activityCreatedAt),
  orderTime=created(o.orderCreatedAt),ledgerTime=created(o.ledgerCreatedAt);
 if(eventTime===null||orderTime===null||ledgerTime===null||
    [orderTime,ledgerTime].some(t=>Math.abs(t-eventTime)>60000)||
    ledgerTime>orderTime+1000||orderTime>eventTime+1000)
  return reject('ACC257_ORIGINAL_CREATE_TIMESTAMP_INVALID');
 const seenDepartments=new Set(),revision=[],items=[];
 for(let i=0;i<lines.length;i++){
  const l=lines[i],q=outbox[i],r=runtime[i];
  const expectedId=orderId+'-'+String(i+1).padStart(2,'0');
  const expectedActor={'طباعة':'وائل','ليزر':'جابر'}[l?.department];
  if(!l||!validId(l.lineId)||l.lineId!==expectedId||
     l.ordinal!==i+1||l.orderId!==orderId||
     l.requestKey!==o.requestKey||l.lineStatus!=='طلب جديد'||
     !expectedActor||l.assignedTo!==expectedActor||
     seenDepartments.has(l.department)||
     q?.eventKey!=='queue:'+String(i+1).padStart(2,'0')||
     q.requestKey!==o.requestKey||q.orderId!==orderId||
     q.lineId!==l.lineId||q.eventType!=='trend-master-status-intent'||
     !['pending','done'].includes(q.deliveryStatus)||
     r?.lineId!==l.lineId||r.orderId!==orderId||
     !Number.isSafeInteger(r.runtimeEventCount)||r.runtimeEventCount<0)
   return reject('ACC257_ORIGINAL_LINES_OUTBOX_OR_RUNTIME_CONFLICT');
  const ltime=created(l.lineCreatedAt),qtime=created(q.outboxCreatedAt);
  if(ltime===null||qtime===null||
     Math.abs(ltime-eventTime)>60000||Math.abs(qtime-eventTime)>60000)
   return reject('ACC257_ORIGINAL_LINE_CREATE_TIME_DRIFT');
  if(r.runtimeStatus===null){
   if(r.runtimeVersion!==null||r.runtimeActor!==null||
      r.runtimeEventCount!==0||r.lastEventType!==null||
      r.lastEventStatus!==null||r.lastEventActor!==null)
    return reject('ACC257_ORIGINAL_RUNTIME_EVENT_WITHOUT_STATE');
  }else{
   if(!Number.isSafeInteger(r.runtimeVersion)||r.runtimeVersion<1||
      r.runtimeEventCount!==r.runtimeVersion||
      !validId(r.runtimeActor)||r.lastEventActor!==r.runtimeActor||
      r.lastEventStatus!==r.runtimeStatus||
      !['line-update','whatsapp-ready_notify','whatsapp-status_reply',
        'whatsapp-registration'].includes(r.lastEventType)||
      !['طلب جديد','بدأ التنفيذ','تحت التنفيذ','جاهز للاستلام','تم التسليم']
        .includes(r.runtimeStatus))
    return reject('ACC257_NATIVE_RUNTIME_INVALID_OR_CANCELLED');
  }
  seenDepartments.add(l.department);
  items.push(Object.freeze({
   lineId:l.lineId,department:l.department,ordinal:l.ordinal
  }));
  revision.push(Object.freeze({
   lineId:l.lineId,version:r.runtimeVersion??0
  }));
 }
 return {status:200,body:{
  success:true,sourceSystem:'trendos_t12_native',sourceOnly:true,
  readOnly:true,operationalShapeVerified:true,
  orderId,sourceCreatedAt:new Date(eventTime).toISOString().slice(0,19)+'Z',
  lines:items,operationalRevision:{lineVersions:revision},
  customerIdentity:'UNVERIFIED_NOT_INCLUDED',
  customerOwnershipAttested:false,realSignedLineApprovalsVerified:false,
  departmentApprovalsVerified:false,financeAuthorized:false,
  canRequestInvoice:false,consumerAcknowledged:false,posted:false,
  productionRelease:'NO_GO'
 }};
}
