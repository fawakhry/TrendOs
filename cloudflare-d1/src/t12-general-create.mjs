import { buildT12OrderCreateShadowIntent } from './t12-order-create-shadow-intent.mjs';
import { classifyT12ClientRequestKey } from './t12-cloud-client-key-admission.mjs';
import { readCustomerLanePartition } from './t12-customer-lane-policy.mjs';

export const T12_GENERAL_CREATE_VERSION='T12_GENERAL_CREATE_20261008_PER_DEPARTMENT_CREATE_CANDIDATE';
export const T12_DUPLICATE_ORDER_GUARD_WINDOW_MS=120000;
export const T12_OPEN_ORDER_DUPLICATE_LOOKBACK_MS=48*60*60*1000;
const CREATE_MARKER='T12_PROD_CREATE_CANARY_V1';
const GENERAL_MARKER='T12_GENERAL_CREATE_V1';

function text(v){return String(v==null?'':v).trim();}
function boolInt(v){return text(v).toLowerCase()==='نعم'?1:0;}
function row(stmt){return stmt&&typeof stmt.first==='function'?stmt.first():null;}
function stmt(db,sql,...params){return db.prepare(sql).bind(...params);}
function fail(reason,extra={}){return {success:false,cloudNative:true,retryAutomatically:false,version:T12_GENERAL_CREATE_VERSION,reason,...extra};}
function canonical(intent,actor,epoch){return JSON.stringify({actor,policyEpoch:epoch,requestKey:intent.requestKey,identity:intent.identity,order:intent.order,lines:intent.lines,activityPlan:intent.activityPlan,queuePlans:intent.queuePlans});}
function businessCanonical(intent){
  return JSON.stringify({
    identity:intent.identity,
    order:{
      department:intent.order.department,
      priority:intent.order.priority,
      status:intent.order.status,
      notes:intent.order.notes,
      heatPress:intent.order.heatPress,
      flyPrint:intent.order.flyPrint
    },
    lines:intent.lines.map(line=>({
      ordinal:line.ordinal,
      department:line.department,
      assignedTo:line.assignedTo,
      itemName:line.itemName,
      qty:line.qty,
      priority:line.priority,
      status:line.status,
      heatPress:line.heatPress,
      flyPrint:line.flyPrint
    }))
  });
}
async function sha256Hex(value){
  const bytes=new TextEncoder().encode(String(value));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
async function activeDuplicateGuard(db,fingerprint,nowMs){
  return row(db.prepare(`
    SELECT request_key AS requestKey,order_id AS orderId,claimed_at_ms AS claimedAtMs,
           expires_at_ms AS expiresAtMs
      FROM t12_prod_duplicate_order_guard
     WHERE fingerprint=? AND expires_at_ms>?
     LIMIT 1
  `).bind(fingerprint,nowMs));
}
// A partial multi-department create must allocate line IDs, outbox and event
// payloads for allowed lanes only, without phantom lines for blocked lanes.
function projectAllowedIntent(intent,allowed){
  const lines=intent.lines.filter(line=>allowed.includes(line.department)).map((line,index)=>({
    ...line,ordinal:index+1,provisionalLineRef:intent.provisionalRef+':line:'+String(index+1).padStart(2,'0')
  }));
  const queuePlans=lines.map(line=>({
    ...intent.queuePlans.find(x=>x.department===line.department),
    provisionalLineRef:line.provisionalLineRef
  }));
  const department=lines.length===1?lines[0].department:'متعدد الأقسام';
  return {
    ...intent,
    order:{...intent.order,department},
    lines,queuePlans,
    activityPlan:{...intent.activityPlan,department}
  };
}
function laneBlocked(partition){
  return fail('customer-department-open-order-exists',{
    duplicatePrevented:true,
    existingOrderId:partition.blockedDepartments[0]?.orderId||'',
    blockedDepartments:partition.blockedDepartments,
    allowedDepartments:[],
    message:'للعميل أوردر مفتوح في نفس القسم. لا يمكن إضافة أوردر جديد لهذا القسم.'
  });
}
function duplicateBlocked(guard,nowMs){
  return fail('duplicate-order-window-active',{
    duplicatePrevented:true,
    existingOrderId:text(guard&&guard.orderId),
    retryAfterMs:Math.max(0,Number(guard&&guard.expiresAtMs||0)-Number(nowMs||0)),
    duplicateWindowMs:T12_DUPLICATE_ORDER_GUARD_WINDOW_MS
  });
}

async function verifiedRead(db,intent,canonicalJson,actor,epoch){
  const key=intent.requestKey;
  const l=await row(db.prepare('SELECT actor,policy_epoch AS policyEpoch,canonical_json AS canonicalJson,order_id AS orderId,status,response_json AS responseJson FROM t12_prod_request_ledger WHERE request_key=? LIMIT 1').bind(key));
  if(!l)return {kind:'MISSING'};
  if(l.actor!==actor||l.policyEpoch!==epoch||l.canonicalJson!==canonicalJson)return {kind:'CONFLICT'};
  if(l.status!=='COMMITTED')return {kind:'INDETERMINATE'};
  let persisted;
  try{persisted=JSON.parse(l.responseJson||'{}');}catch{return {kind:'INDETERMINATE'};}
  const created=Array.isArray(persisted.createdDepartments)?persisted.createdDepartments:null;
  const effective=created?projectAllowedIntent(intent,created):intent;
  if(!effective.lines.length)return {kind:'INDETERMINATE'};
  const o=await row(db.prepare('SELECT order_id AS orderId,request_key AS requestKey,department,priority,status,actor FROM t12_prod_orders WHERE request_key=? LIMIT 1').bind(key));
  if(!o||o.orderId!==l.orderId||o.requestKey!==key||o.department!==effective.order.department||o.priority!==effective.order.priority||o.status!=='طلب جديد'||o.actor!==actor)return {kind:'INDETERMINATE'};
  const lineIds=[];
  for(const expected of effective.lines){
    const x=await row(db.prepare('SELECT line_id AS lineId,order_id AS orderId,ordinal,department,assigned_to AS assignedTo,item_name AS itemName,qty,priority,status,heat_press AS heatPress,fly_print AS flyPrint FROM t12_prod_lines WHERE request_key=? AND ordinal=? LIMIT 1').bind(key,expected.ordinal));
    const expectedId=String(l.orderId)+'-'+String(expected.ordinal).padStart(2,'0');
    if(!x||x.lineId!==expectedId||x.orderId!==l.orderId||Number(x.ordinal)!==expected.ordinal||x.department!==expected.department||x.assignedTo!==expected.assignedTo||x.itemName!==expected.itemName||Number(x.qty)!==Number(expected.qty)||x.priority!==expected.priority||x.status!=='طلب جديد'||Number(x.heatPress)!==boolInt(expected.heatPress)||Number(x.flyPrint)!==boolInt(expected.flyPrint))return {kind:'INDETERMINATE'};
    lineIds.push(x.lineId);
  }
  return {kind:'VERIFIED',response:{
    success:true,cloudNative:true,orderId:String(l.orderId),
    lineId:lineIds[0]||'',lineIds,
    createdDepartments:created||effective.lines.map(x=>x.department),
    skippedDepartments:Array.isArray(persisted.skippedDepartments)?persisted.skippedDepartments:[],
    partialMultiDepartment:!!persisted.partialMultiDepartment
  }};
}

export async function createT12GeneralOrder(db,input={},actor='',options={}){
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')return fail('d1-adapter-required');
  const safeActor=text(actor);
  if(!safeActor||safeActor.length>140||/\s/.test(safeActor))return fail('authenticated-actor-subject-required');

  const aliases=['clientRequestId','requestId','idempotencyKey','idempotency_key'].filter(k=>Object.prototype.hasOwnProperty.call(input,k));
  if(aliases.length!==1||aliases[0]!=='clientRequestId'||typeof input.clientRequestId!=='string')return fail('exactly-one-raw-cloud-client-key-required');
  if(classifyT12ClientRequestKey(input.clientRequestId).kind!=='CLOUD_SYNTHETIC_ELIGIBLE')return fail('new-cloud-request-namespace-required');
  const intent=buildT12OrderCreateShadowIntent(input,safeActor);
  if(!intent.valid)return fail('canonical-business-intent-invalid',{details:intent.reason||'invalid-intent',errors:intent.errors||[]});
  if(intent.requestKey!==input.clientRequestId)return fail('cloud-client-key-normalization-refused');
  if(!Array.isArray(intent.lines)||intent.lines.length<1||intent.lines.length>2)return fail('line-count-not-qualified');

  const control=await row(db.prepare(`
    SELECT g.marker AS generalMarker,g.mode,g.canary_remaining AS canaryRemaining,
           g.policy_epoch AS policyEpoch,c.marker AS createMarker,c.next_order_number AS nextNo,
           c.canary_remaining AS legacyCanaryRemaining
      FROM t12_prod_general_create_control g
      JOIN t12_prod_create_control c ON c.singleton=g.singleton
     WHERE g.singleton=1
     LIMIT 1
  `));
  if(!control||control.generalMarker!==GENERAL_MARKER||control.createMarker!==CREATE_MARKER)return fail('general-create-control-invalid');
  const mode=text(control.mode);
  const isCanary=options.canary===true;
  if(Number(control.legacyCanaryRemaining)!==0)return fail('legacy-canary-budget-must-remain-zero');

  // Idempotent replay must be resolved before checking a one-shot canary budget.
  // A lost/late ACK after the budget is consumed must return the already-committed
  // order rather than looking like a second create attempt.
  const epoch=text(control.policyEpoch),canonicalJson=canonical(intent,safeActor,epoch);
  let existing;
  try{existing=await verifiedRead(db,intent,canonicalJson,safeActor,epoch);}catch{return fail('ledger-read-unavailable-no-retry');}
  if(existing.kind==='VERIFIED')return {...existing.response,stored:false,idempotent:true,version:T12_GENERAL_CREATE_VERSION};
  if(existing.kind==='CONFLICT')return fail('same-key-actor-payload-or-policy-conflict');
  if(existing.kind==='INDETERMINATE')return fail('existing-transaction-incomplete-no-retry');

  if(isCanary){
    if(mode!=='CANARY'||Number(control.canaryRemaining)!==1)return fail('general-create-canary-not-armed');
  }else if(mode!=='GENERAL'){
    return fail('general-create-not-enabled',{mode});
  }

  const nextNo=Number(control.nextNo);
  if(!Number.isSafeInteger(nextNo)||nextNo<4323)return fail('next-order-number-invalid',{nextOrderNumber:nextNo});

  // Cloud + historical mirror status checks are required, independent of item.
  // No age limit and no employee override. One blocked lane must not block
  // another lane from the same multi-department request.
  let partition;
  try{partition=await readCustomerLanePartition(db,intent.identity,intent.lines.map(l=>l.department));}
  catch{return fail('customer-department-status-unavailable-no-retry');}
  if(!partition.allowedDepartments.length)return laneBlocked(partition);
  const effectiveIntent=projectAllowedIntent(intent,partition.allowedDepartments);
  if(!effectiveIntent.lines.length)return fail('customer-department-empty-projection-no-retry');
  const nowMs=Number.isSafeInteger(Number(options.nowMs))&&Number(options.nowMs)>0?Number(options.nowMs):Date.now();
  const canonicalBusinessJson=businessCanonical(effectiveIntent);
  let duplicateFingerprint;
  try{duplicateFingerprint=await sha256Hex(canonicalBusinessJson);}
  catch{return fail('duplicate-guard-fingerprint-unavailable-no-retry');}
  let activeDuplicate;
  try{activeDuplicate=await activeDuplicateGuard(db,duplicateFingerprint,nowMs);}
  catch{return fail('duplicate-guard-unavailable-no-retry');}
  if(activeDuplicate){
    if(text(activeDuplicate.requestKey)===intent.requestKey)return fail('duplicate-guard-same-key-indeterminate-no-retry');
    return duplicateBlocked(activeDuplicate,nowMs);
  }
  const expiresAtMs=nowMs+T12_DUPLICATE_ORDER_GUARD_WINDOW_MS;
  const orderId=String(nextNo);
  const s=[];
  s.push(stmt(db,'DELETE FROM t12_prod_duplicate_order_guard WHERE fingerprint=? AND expires_at_ms<=?',duplicateFingerprint,nowMs));
  s.push(stmt(db,'INSERT INTO t12_prod_duplicate_order_guard (fingerprint,request_key,order_id,canonical_business_json,claimed_at_ms,expires_at_ms) VALUES (?,?,?,?,?,?)',
    duplicateFingerprint,intent.requestKey,'',canonicalBusinessJson,nowMs,expiresAtMs));
  s.push(stmt(db,"UPDATE t12_prod_create_control SET next_order_number=next_order_number+1,updated_at=CURRENT_TIMESTAMP WHERE singleton=1 AND marker='T12_PROD_CREATE_CANARY_V1' AND canary_remaining=0 AND next_order_number=?",nextNo));
  s.push(stmt(db,"INSERT INTO t12_prod_request_ledger (request_key,actor,policy_epoch,canonical_json,order_id,status,response_json) SELECT ?,?,?,?,?,'PREPARED','{}' WHERE EXISTS(SELECT 1 FROM t12_prod_create_control WHERE singleton=1 AND marker='T12_PROD_CREATE_CANARY_V1' AND canary_remaining=0 AND next_order_number=?)",
    intent.requestKey,safeActor,epoch,canonicalJson,orderId,nextNo+1));
  s.push(stmt(db,"INSERT INTO t12_prod_orders (order_id,request_key,customer_mode,customer_name,customer_phone,external_customer_id,department,priority,status,source,notes,actor) SELECT order_id,request_key,?,?,?,?,?,?,'طلب جديد',?,?,? FROM t12_prod_request_ledger WHERE request_key=? AND status='PREPARED'",
    effectiveIntent.identity.mode,effectiveIntent.identity.customerName,effectiveIntent.identity.customerPhone,effectiveIntent.identity.externalCustomerId,
    effectiveIntent.order.department,effectiveIntent.order.priority,effectiveIntent.order.source,effectiveIntent.order.notes,safeActor,intent.requestKey));
  for(const line of effectiveIntent.lines){
    s.push(stmt(db,"INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) SELECT order_id || '-' || printf('%02d',?),order_id,request_key,?,?,?,?,?,?,'طلب جديد',?,? FROM t12_prod_request_ledger WHERE request_key=? AND status='PREPARED'",
      line.ordinal,line.ordinal,line.department,line.assignedTo,line.itemName,line.qty,line.priority,boolInt(line.heatPress),boolInt(line.flyPrint),intent.requestKey));
  }
  s.push(stmt(db,"INSERT INTO t12_prod_events (request_key,event_key,order_id,event_type,payload_json) SELECT request_key,'activity',order_id,'order-create',? FROM t12_prod_request_ledger WHERE request_key=? AND status='PREPARED'",
    JSON.stringify(effectiveIntent.activityPlan),intent.requestKey));
  for(const line of effectiveIntent.lines){
    const q=effectiveIntent.queuePlans[line.ordinal-1];
    s.push(stmt(db,"INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) SELECT r.request_key,?,r.order_id,l.line_id,'trend-master-status-intent','pending',? FROM t12_prod_request_ledger r JOIN t12_prod_lines l ON l.request_key=r.request_key AND l.ordinal=? WHERE r.request_key=? AND r.status='PREPARED'",
      'queue:'+String(line.ordinal).padStart(2,'0'),JSON.stringify(q),line.ordinal,intent.requestKey));
  }
  const skipped=partition.blockedDepartments.map(b=>({department:b.department,orderId:b.orderId}));
  const createdDepartments=effectiveIntent.lines.map(l=>l.department);
  s.push(stmt(db,"UPDATE t12_prod_request_ledger SET status='COMMITTED',response_json=json_object('success',json('true'),'cloudNative',json('true'),'orderId',order_id,'createdDepartments',json(?),'skippedDepartments',json(?),'partialMultiDepartment',json(?)) WHERE request_key=? AND status='PREPARED'",
    JSON.stringify(createdDepartments),JSON.stringify(skipped),
    JSON.stringify(intent.lines.length>createdDepartments.length),intent.requestKey));
  s.push(stmt(db,'UPDATE t12_prod_duplicate_order_guard SET order_id=(SELECT order_id FROM t12_prod_request_ledger WHERE request_key=?),updated_at=CURRENT_TIMESTAMP WHERE fingerprint=? AND request_key=?',
    intent.requestKey,duplicateFingerprint,intent.requestKey));
  if(isCanary){
    s.push(stmt(db,"UPDATE t12_prod_general_create_control SET canary_remaining=0,updated_at=CURRENT_TIMESTAMP WHERE singleton=1 AND marker='T12_GENERAL_CREATE_V1' AND mode='CANARY' AND canary_remaining=1"));
  }

  try{await db.batch(s);}catch{
    let recovered;try{recovered=await verifiedRead(db,intent,canonicalJson,safeActor,epoch);}catch{return fail('transaction-outcome-unknown-no-retry');}
    if(recovered.kind==='VERIFIED')return {...recovered.response,stored:false,idempotent:true,ambiguousAckRecovered:true,version:T12_GENERAL_CREATE_VERSION};
    if(recovered.kind==='CONFLICT')return fail('same-key-actor-payload-or-policy-conflict');
    try{
      const duplicate=await activeDuplicateGuard(db,duplicateFingerprint,nowMs);
      if(duplicate&&text(duplicate.requestKey)!==intent.requestKey)return duplicateBlocked(duplicate,nowMs);
    }catch{return fail('transaction-outcome-unknown-no-retry');}
    return fail('transaction-outcome-unknown-no-retry');
  }

  let confirmed;try{confirmed=await verifiedRead(db,intent,canonicalJson,safeActor,epoch);}catch{return fail('committed-data-not-verified-no-retry');}
  if(confirmed.kind!=='VERIFIED')return fail('allocation-race-or-commit-not-verified-no-retry',{expectedOrderId:orderId});
  return {...confirmed.response,stored:true,idempotent:false,canary:isCanary,version:T12_GENERAL_CREATE_VERSION};
}
