/*
 * TrendOS T12 isolated BUSINESS CREATE transaction candidate.
 * GITHUB/LOCAL TEST ONLY. No production route, no production binding, no deploy.
 * It composes the existing canonical/shadow intent with an isolated numeric
 * allocator and a durable request/order/lines/activity/outbox transaction.
 *
 * Business-policy booleans supplied here represent already-verified TEST
 * evidence only; this module cannot itself verify live auth/customer/debt or
 * Google writer fencing and therefore can NEVER authorize Production.
 */
import {buildT12OrderCreateShadowIntent} from './t12-order-create-shadow-intent.mjs';
import {classifyT12ClientRequestKey} from './t12-cloud-client-key-admission.mjs';

export const T12_BUSINESS_CREATE_CANDIDATE_VERSION =
  'T12_BUSINESS_CREATE_CANDIDATE_20260926_ISOLATED';

const MODE='isolated-business-create-candidate';
const MARKER='T12_BUSINESS_CANDIDATE_ONLY';

function text(v){return String(v==null?'':v).trim();}
function plain(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  (Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);}
function fail(reason,extra={}){
  return {success:false,productionAuthorized:false,cutoverAuthorized:false,
    retryAutomatically:false,version:T12_BUSINESS_CREATE_CANDIDATE_VERSION,
    reason,...extra};
}
function eligible(g){
  return plain(g)&&g.mode===MODE&&g.allowCandidateMutation===true&&
    g.testDatabaseIsolationVerified===true&&g.googleCreateFrozenInTest===true&&
    g.r5MirrorFencedInTest===true;
}
function policyReady(c){
  return plain(c)&&/^[A-Za-z0-9_-]{8,100}$/.test(text(c.policyEpoch))&&
    c.authCanCreateOrder===true&&c.customerIdentityVerified===true&&
    c.debtPolicyApproved===true&&c.duplicateAndOpenOrderChecked===true&&
    c.createNewOrderApproved===true&&c.stableClientRequestVerified===true;
}
function boolInt(v){return text(v).toLowerCase()==='نعم'?1:0;}
function canonical(intent,actor,policyEpoch){
  return JSON.stringify({
    actor,policyEpoch,requestKey:intent.requestKey,identity:intent.identity,
    order:intent.order,lines:intent.lines,activityPlan:intent.activityPlan,
    queuePlans:intent.queuePlans
  });
}
function row(stmt){return stmt&&typeof stmt.first==='function'?stmt.first():null;}
function stmt(db,sql,...params){return db.prepare(sql).bind(...params);}

async function verifiedRead(db,intent,canonicalJson,actor,policyEpoch){
  const key=intent.requestKey;
  const ledger=await row(db.prepare(
    'SELECT actor,policy_epoch AS policyEpoch,canonical_json AS canonicalJson,'+
    'order_id AS orderId,status,response_json AS responseJson '+
    'FROM t12_biz_request_ledger WHERE request_key=? LIMIT 1'
  ).bind(key));
  if(!ledger)return {kind:'MISSING'};
  if(ledger.actor!==actor||ledger.policyEpoch!==policyEpoch||
     ledger.canonicalJson!==canonicalJson)return {kind:'CONFLICT'};
  if(ledger.status!=='COMMITTED')return {kind:'INDETERMINATE'};

  const order=await row(db.prepare(
    'SELECT order_id AS orderId,request_key AS requestKey,department,priority,status '+
    'FROM t12_biz_orders WHERE request_key=? LIMIT 1'
  ).bind(key));
  if(!order||order.orderId!==ledger.orderId||order.requestKey!==key||
     order.department!==intent.order.department||order.priority!==intent.order.priority||
     order.status!=='طلب جديد')return {kind:'INDETERMINATE'};

  const lineIds=[];
  for(const expected of intent.lines){
    const line=await row(db.prepare(
      'SELECT line_id AS lineId,order_id AS orderId,ordinal,department,'+
      'assigned_to AS assignedTo,item_name AS itemName,qty,priority,status,'+
      'heat_press AS heatPress,fly_print AS flyPrint '+
      'FROM t12_biz_lines WHERE request_key=? AND ordinal=? LIMIT 1'
    ).bind(key,expected.ordinal));
    const expectedId=String(ledger.orderId)+'-'+String(expected.ordinal).padStart(2,'0');
    if(!line||line.lineId!==expectedId||line.orderId!==ledger.orderId||
       Number(line.ordinal)!==expected.ordinal||line.department!==expected.department||
       line.assignedTo!==expected.assignedTo||line.itemName!==expected.itemName||
       Number(line.qty)!==Number(expected.qty)||line.priority!==expected.priority||
       line.status!=='طلب جديد'||Number(line.heatPress)!==boolInt(expected.heatPress)||
       Number(line.flyPrint)!==boolInt(expected.flyPrint))return {kind:'INDETERMINATE'};
    lineIds.push(line.lineId);
    const outbox=await row(db.prepare(
      'SELECT order_id AS orderId,line_id AS lineId,event_type AS eventType,status '+
      'FROM t12_biz_outbox WHERE request_key=? AND event_key=? LIMIT 1'
    ).bind(key,'queue:'+String(expected.ordinal).padStart(2,'0')));
    if(!outbox||outbox.orderId!==ledger.orderId||outbox.lineId!==line.lineId||
       outbox.eventType!=='trend-master-status-intent'||outbox.status!=='pending')
      return {kind:'INDETERMINATE'};
  }
  const activity=await row(db.prepare(
    "SELECT order_id AS orderId,event_type AS eventType FROM t12_biz_events "+
    "WHERE request_key=? AND event_key='activity' LIMIT 1"
  ).bind(key));
  if(!activity||activity.orderId!==ledger.orderId||
     activity.eventType!=='order-create-intent')return {kind:'INDETERMINATE'};

  let saved={};
  try{saved=JSON.parse(ledger.responseJson||'{}');}catch{return {kind:'INDETERMINATE'};}
  if(saved.success!==true||saved.productionAuthorized!==false||
     String(saved.orderId)!==String(ledger.orderId))return {kind:'INDETERMINATE'};
  return {kind:'VERIFIED',response:{
    success:true,productionAuthorized:false,cutoverAuthorized:false,
    orderId:String(ledger.orderId),lineIds
  }};
}

export async function createT12BusinessCandidate(db,input={},actor='',context={},gates={}){
  if(!eligible(gates))return fail('isolated-candidate-gates-not-met');
  if(!policyReady(context))return fail('verified-business-policy-context-required');
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
    return fail('isolated-database-adapter-required');

  const safeActor=text(actor);
  if(!safeActor||safeActor.length>140||/\s/.test(safeActor))
    return fail('authenticated-actor-subject-required');

  let control;
  try{control=await row(db.prepare(
    'SELECT fixture_marker AS marker,google_writer_fenced AS googleFence,'+
    'r5_mirror_writer_fenced AS r5Fence,next_order_number AS nextNo,'+
    'policy_epoch AS policyEpoch FROM t12_biz_control WHERE singleton=1 LIMIT 1'
  ));}catch{return fail('candidate-schema-unavailable');}
  if(!control||control.marker!==MARKER||Number(control.googleFence)!==1||
     Number(control.r5Fence)!==1||!Number.isSafeInteger(Number(control.nextNo))||
     Number(control.nextNo)<1001||control.policyEpoch!==text(context.policyEpoch))
    return fail('candidate-db-identity-fence-or-policy-mismatch');

  const aliases=['clientRequestId','requestId','idempotencyKey','idempotency_key']
    .filter(k=>Object.prototype.hasOwnProperty.call(input,k));
  if(aliases.length!==1||aliases[0]!=='clientRequestId'||
     typeof input.clientRequestId!=='string')
    return fail('exactly-one-raw-cloud-client-key-required');
  const namespace=classifyT12ClientRequestKey(input.clientRequestId);
  if(namespace.kind==='LEGACY_REPLAY_ONLY')
    return fail('legacy-request-read-only-or-reconcile-no-create');
  if(namespace.kind!=='CLOUD_SYNTHETIC_ELIGIBLE')
    return fail('new-cloud-request-namespace-required');

  const intent=buildT12OrderCreateShadowIntent(input,safeActor);
  if(!intent.valid)return fail('canonical-business-intent-invalid',{
    details:intent.reason||'invalid-intent'
  });
  if(intent.requestKey!==input.clientRequestId)
    return fail('cloud-client-key-normalization-refused');
  if(!Array.isArray(intent.lines)||intent.lines.length<1||intent.lines.length>2)
    return fail('candidate-line-count-not-qualified');

  const policyEpoch=text(context.policyEpoch);
  const canonicalJson=canonical(intent,safeActor,policyEpoch);
  let existing;
  try{existing=await verifiedRead(db,intent,canonicalJson,safeActor,policyEpoch);}
  catch{return fail('candidate-ledger-read-unavailable-no-retry');}
  if(existing.kind==='VERIFIED')return {
    ...existing.response,stored:false,idempotent:true,
    version:T12_BUSINESS_CREATE_CANDIDATE_VERSION
  };
  if(existing.kind==='CONFLICT')return fail('same-key-actor-payload-or-policy-conflict');
  if(existing.kind==='INDETERMINATE')
    return fail('existing-transaction-incomplete-no-retry');

  const allocated="(SELECT CAST(next_order_number-1 AS TEXT) FROM t12_biz_control "+
    "WHERE singleton=1 AND fixture_marker='"+MARKER+"' AND google_writer_fenced=1 "+
    "AND r5_mirror_writer_fenced=1 AND policy_epoch=?)";
  const statements=[];
  statements.push(stmt(db,
    "UPDATE t12_biz_control SET next_order_number=next_order_number+1 "+
    "WHERE singleton=1 AND fixture_marker='"+MARKER+"' AND google_writer_fenced=1 "+
    "AND r5_mirror_writer_fenced=1 AND policy_epoch=?",
    policyEpoch));
  statements.push(stmt(db,
    'INSERT INTO t12_biz_request_ledger '+
    '(request_key,actor,policy_epoch,canonical_json,order_id,status,response_json) '+
    "SELECT ?,?,?,?,"+allocated+",'PREPARED','{}' "+
    "WHERE EXISTS(SELECT 1 FROM t12_biz_control WHERE singleton=1 AND fixture_marker='"+
    MARKER+"' AND google_writer_fenced=1 AND r5_mirror_writer_fenced=1 AND policy_epoch=?)",
    intent.requestKey,safeActor,policyEpoch,canonicalJson,policyEpoch,policyEpoch));
  statements.push(stmt(db,
    'INSERT INTO t12_biz_orders '+
    '(order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,'+
    'department,priority,status,source,notes) '+
    "SELECT order_id,request_key,?,?,?,?,?,?,'طلب جديد',?,? "+
    'FROM t12_biz_request_ledger WHERE request_key=?',
    intent.identity.mode,intent.identity.customerName,intent.identity.customerPhone,
    intent.identity.externalCustomerId,intent.order.department,intent.order.priority,
    intent.order.source,intent.order.notes,intent.requestKey));

  for(const line of intent.lines){
    statements.push(stmt(db,
      'INSERT INTO t12_biz_lines '+
      '(line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,'+
      'priority,status,heat_press,fly_print) '+
      "SELECT order_id || '-' || printf('%02d',?),order_id,request_key,?,?,?,?,?,"+
      "?,'طلب جديد',?,? FROM t12_biz_request_ledger WHERE request_key=?",
      line.ordinal,line.ordinal,line.department,line.assignedTo,line.itemName,
      line.qty,line.priority,boolInt(line.heatPress),boolInt(line.flyPrint),
      intent.requestKey));
  }
  statements.push(stmt(db,
    'INSERT INTO t12_biz_events (request_key,event_key,order_id,event_type,payload_json) '+
    "SELECT request_key,'activity',order_id,'order-create-intent',? "+
    'FROM t12_biz_request_ledger WHERE request_key=?',
    JSON.stringify(intent.activityPlan),intent.requestKey));
  for(const line of intent.lines){
    const q=intent.queuePlans[line.ordinal-1];
    statements.push(stmt(db,
      'INSERT INTO t12_biz_outbox '+
      '(request_key,event_key,order_id,line_id,event_type,status,payload_json) '+
      "SELECT r.request_key,?,r.order_id,l.line_id,'trend-master-status-intent','pending',? "+
      'FROM t12_biz_request_ledger r JOIN t12_biz_lines l '+
      'ON l.request_key=r.request_key AND l.ordinal=? WHERE r.request_key=?',
      'queue:'+String(line.ordinal).padStart(2,'0'),JSON.stringify(q),
      line.ordinal,intent.requestKey));
  }
  statements.push(stmt(db,
    "UPDATE t12_biz_request_ledger SET status='COMMITTED',response_json="+
    "json_object('success',json('true'),'productionAuthorized',json('false'),'orderId',order_id) "+
    'WHERE request_key=?',
    intent.requestKey));

  try{await db.batch(statements);}
  catch{
    let reread;
    try{reread=await verifiedRead(db,intent,canonicalJson,safeActor,policyEpoch);}
    catch{return fail('transaction-outcome-unknown-no-retry');}
    if(reread.kind==='VERIFIED')return {
      ...reread.response,stored:false,idempotent:true,
      ambiguousAckRecovered:true,version:T12_BUSINESS_CREATE_CANDIDATE_VERSION
    };
    if(reread.kind==='CONFLICT')
      return fail('same-key-actor-payload-or-policy-conflict');
    return fail('transaction-outcome-unknown-no-retry');
  }

  let confirmed;
  try{confirmed=await verifiedRead(db,intent,canonicalJson,safeActor,policyEpoch);}
  catch{return fail('committed-data-not-verified-no-retry');}
  if(confirmed.kind!=='VERIFIED')
    return fail('committed-data-not-verified-no-retry');
  return {
    ...confirmed.response,stored:true,idempotent:false,
    version:T12_BUSINESS_CREATE_CANDIDATE_VERSION
  };
}
