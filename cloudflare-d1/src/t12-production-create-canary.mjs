import {buildT12OrderCreateShadowIntent} from './t12-order-create-shadow-intent.mjs';
import {classifyT12ClientRequestKey} from './t12-cloud-client-key-admission.mjs';

export const T12_PROD_CREATE_CANARY_VERSION='T12_PROD_CREATE_CANARY_20260926_V1';
const MARKER='T12_PROD_CREATE_CANARY_V1';
function text(v){return String(v==null?'':v).trim();}
function boolInt(v){return text(v).toLowerCase()==='نعم'?1:0;}
function fail(reason,extra={}){return {success:false,productionAuthorized:false,cutoverAuthorized:false,canaryOnly:true,retryAutomatically:false,version:T12_PROD_CREATE_CANARY_VERSION,reason,...extra};}
function gatesOk(g={}){return g.mode==='production-canary-one-shot'&&g.allowProductionCanaryMutation===true&&g.ownerFreshStartApproved===true&&g.googleHistoricalBackfillRequired===false&&g.recurringMirrorWriterFenced===true;}
function canonical(intent,actor,epoch){return JSON.stringify({actor,policyEpoch:epoch,requestKey:intent.requestKey,identity:intent.identity,order:intent.order,lines:intent.lines,activityPlan:intent.activityPlan,queuePlans:intent.queuePlans});}
function row(stmt){return stmt&&typeof stmt.first==='function'?stmt.first():null;}
function stmt(db,sql,...params){return db.prepare(sql).bind(...params);}
async function verifiedRead(db,intent,canonicalJson,actor,epoch){
  const key=intent.requestKey;
  const l=await row(db.prepare('SELECT actor,policy_epoch AS policyEpoch,canonical_json AS canonicalJson,order_id AS orderId,status,response_json AS responseJson FROM t12_prod_request_ledger WHERE request_key=? LIMIT 1').bind(key));
  if(!l)return {kind:'MISSING'};
  if(l.actor!==actor||l.policyEpoch!==epoch||l.canonicalJson!==canonicalJson)return {kind:'CONFLICT'};
  if(l.status!=='COMMITTED')return {kind:'INDETERMINATE'};
  const o=await row(db.prepare('SELECT order_id AS orderId,request_key AS requestKey,department,priority,status,actor FROM t12_prod_orders WHERE request_key=? LIMIT 1').bind(key));
  if(!o||o.orderId!==l.orderId||o.requestKey!==key||o.department!==intent.order.department||o.priority!==intent.order.priority||o.status!=='طلب جديد'||o.actor!==actor)return {kind:'INDETERMINATE'};
  const lineIds=[];
  for(const e of intent.lines){
    const x=await row(db.prepare('SELECT line_id AS lineId,order_id AS orderId,ordinal,department,assigned_to AS assignedTo,item_name AS itemName,qty,priority,status,heat_press AS heatPress,fly_print AS flyPrint FROM t12_prod_lines WHERE request_key=? AND ordinal=? LIMIT 1').bind(key,e.ordinal));
    const expectedId=String(l.orderId)+'-'+String(e.ordinal).padStart(2,'0');
    if(!x||x.lineId!==expectedId||x.orderId!==l.orderId||Number(x.ordinal)!==e.ordinal||x.department!==e.department||x.assignedTo!==e.assignedTo||x.itemName!==e.itemName||Number(x.qty)!==Number(e.qty)||x.priority!==e.priority||x.status!=='طلب جديد'||Number(x.heatPress)!==boolInt(e.heatPress)||Number(x.flyPrint)!==boolInt(e.flyPrint))return {kind:'INDETERMINATE'};
    lineIds.push(x.lineId);
  }
  let saved={};try{saved=JSON.parse(l.responseJson||'{}');}catch{return {kind:'INDETERMINATE'};}
  if(saved.success!==true||saved.canaryOnly!==true||String(saved.orderId)!==String(l.orderId))return {kind:'INDETERMINATE'};
  return {kind:'VERIFIED',response:{success:true,productionAuthorized:true,cutoverAuthorized:false,canaryOnly:true,orderId:String(l.orderId),lineIds}};
}
export async function createT12ProductionCanary(db,input={},actor='',gates={}){
  if(!gatesOk(gates))return fail('production-canary-gates-not-satisfied');
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')return fail('d1-adapter-required');
  const safeActor=text(actor);if(!safeActor||safeActor.length>140||/\s/.test(safeActor))return fail('authenticated-actor-subject-required');
  let c;try{c=await row(db.prepare('SELECT marker,next_order_number AS nextNo,canary_remaining AS canaryRemaining,policy_epoch AS policyEpoch FROM t12_prod_create_control WHERE singleton=1 LIMIT 1'));}catch{return fail('production-canary-schema-unavailable');}
  if(!c||c.marker!==MARKER||!Number.isSafeInteger(Number(c.nextNo))||Number(c.nextNo)<4322||![0,1].includes(Number(c.canaryRemaining))||!text(c.policyEpoch))return fail('production-canary-control-invalid');
  const aliases=['clientRequestId','requestId','idempotencyKey','idempotency_key'].filter(k=>Object.prototype.hasOwnProperty.call(input,k));
  if(aliases.length!==1||aliases[0]!=='clientRequestId'||typeof input.clientRequestId!=='string')return fail('exactly-one-raw-cloud-client-key-required');
  if(classifyT12ClientRequestKey(input.clientRequestId).kind!=='CLOUD_SYNTHETIC_ELIGIBLE')return fail('new-cloud-request-namespace-required');
  const intent=buildT12OrderCreateShadowIntent(input,safeActor);
  if(!intent.valid)return fail('canonical-business-intent-invalid',{details:intent.reason||'invalid-intent'});
  if(intent.requestKey!==input.clientRequestId)return fail('cloud-client-key-normalization-refused');
  if(!Array.isArray(intent.lines)||intent.lines.length<1||intent.lines.length>2)return fail('canary-line-count-not-qualified');
  const epoch=text(c.policyEpoch),canonicalJson=canonical(intent,safeActor,epoch);
  let existing;try{existing=await verifiedRead(db,intent,canonicalJson,safeActor,epoch);}catch{return fail('canary-ledger-read-unavailable-no-retry');}
  if(existing.kind==='VERIFIED')return {...existing.response,stored:false,idempotent:true,version:T12_PROD_CREATE_CANARY_VERSION};
  if(existing.kind==='CONFLICT')return fail('same-key-actor-payload-or-policy-conflict');
  if(existing.kind==='INDETERMINATE')return fail('existing-transaction-incomplete-no-retry');
  if(Number(c.canaryRemaining)!==1)return fail('production-canary-budget-exhausted');
  if(Number(c.nextNo)!==4322)return fail('production-canary-seed-not-4322',{nextOrderNumber:Number(c.nextNo)});
  const allocated="(SELECT CAST(next_order_number-1 AS TEXT) FROM t12_prod_create_control WHERE singleton=1 AND marker='"+MARKER+"' AND canary_remaining=0 AND next_order_number=4323)";
  const s=[];
  s.push(stmt(db,"UPDATE t12_prod_create_control SET next_order_number=next_order_number+1,canary_remaining=canary_remaining-1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1 AND marker='"+MARKER+"' AND canary_remaining=1 AND next_order_number=4322"));
  s.push(stmt(db,'INSERT INTO t12_prod_request_ledger (request_key,actor,policy_epoch,canonical_json,order_id,status,response_json) SELECT ?,?,?,?,'+allocated+",'PREPARED','{}' WHERE EXISTS(SELECT 1 FROM t12_prod_create_control WHERE singleton=1 AND marker='"+MARKER+"' AND canary_remaining=0 AND next_order_number=4323)",intent.requestKey,safeActor,epoch,canonicalJson));
  s.push(stmt(db,"INSERT INTO t12_prod_orders (order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,source,notes,actor) SELECT order_id,request_key,?,?,?,?,?,?,'طلب جديد',?,?,? FROM t12_prod_request_ledger WHERE request_key=?",intent.identity.mode,intent.identity.customerName,intent.identity.customerPhone,intent.identity.externalCustomerId,intent.order.department,intent.order.priority,intent.order.source,intent.order.notes,safeActor,intent.requestKey));
  for(const line of intent.lines)s.push(stmt(db,"INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) SELECT order_id || '-' || printf('%02d',?),order_id,request_key,?,?,?,?,?,?,'طلب جديد',?,? FROM t12_prod_request_ledger WHERE request_key=?",line.ordinal,line.ordinal,line.department,line.assignedTo,line.itemName,line.qty,line.priority,boolInt(line.heatPress),boolInt(line.flyPrint),intent.requestKey));
  s.push(stmt(db,"INSERT INTO t12_prod_events (request_key,event_key,order_id,event_type,payload_json) SELECT request_key,'activity',order_id,'order-create-canary',? FROM t12_prod_request_ledger WHERE request_key=?",JSON.stringify(intent.activityPlan),intent.requestKey));
  for(const line of intent.lines){const q=intent.queuePlans[line.ordinal-1];s.push(stmt(db,"INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) SELECT r.request_key,?,r.order_id,l.line_id,'trend-master-status-intent','pending',? FROM t12_prod_request_ledger r JOIN t12_prod_lines l ON l.request_key=r.request_key AND l.ordinal=? WHERE r.request_key=?",'queue:'+String(line.ordinal).padStart(2,'0'),JSON.stringify(q),line.ordinal,intent.requestKey));}
  s.push(stmt(db,"UPDATE t12_prod_request_ledger SET status='COMMITTED',response_json=json_object('success',json('true'),'canaryOnly',json('true'),'orderId',order_id) WHERE request_key=?",intent.requestKey));
  try{await db.batch(s);}catch{let r;try{r=await verifiedRead(db,intent,canonicalJson,safeActor,epoch);}catch{return fail('transaction-outcome-unknown-no-retry');}if(r.kind==='VERIFIED')return {...r.response,stored:false,idempotent:true,ambiguousAckRecovered:true,version:T12_PROD_CREATE_CANARY_VERSION};if(r.kind==='CONFLICT')return fail('same-key-actor-payload-or-policy-conflict');return fail('transaction-outcome-unknown-no-retry');}
  let confirmed;try{confirmed=await verifiedRead(db,intent,canonicalJson,safeActor,epoch);}catch{return fail('committed-data-not-verified-no-retry');}
  if(confirmed.kind!=='VERIFIED')return fail('committed-data-not-verified-no-retry');
  return {...confirmed.response,stored:true,idempotent:false,version:T12_PROD_CREATE_CANARY_VERSION};
}
export async function readT12ProductionCanaryOrder(db,orderId){
  const id=text(orderId);if(!id)return {success:false,reason:'order-id-required'};
  const order=await row(db.prepare('SELECT order_id AS orderId,request_key AS requestKey,customer_mode AS customerMode,customer_name AS customerName,customer_phone AS customerPhone,external_customer_id AS externalCustomerId,department,priority,status,source,notes,actor,created_at AS createdAt,updated_at AS updatedAt FROM t12_prod_orders WHERE order_id=? LIMIT 1').bind(id));
  if(!order)return {success:false,reason:'order-not-found'};
  const r=await db.prepare('SELECT line_id AS lineId,ordinal,department,assigned_to AS assignedTo,item_name AS itemName,qty,priority,status,heat_press AS heatPress,fly_print AS flyPrint,created_at AS createdAt,updated_at AS updatedAt FROM t12_prod_lines WHERE order_id=? ORDER BY ordinal').bind(id).all();
  return {success:true,order,lines:r.results||[]};
}
