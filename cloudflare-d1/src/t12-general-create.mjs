import { buildT12OrderCreateShadowIntent } from './t12-order-create-shadow-intent.mjs';
import { classifyT12ClientRequestKey } from './t12-cloud-client-key-admission.mjs';
import { inspectT12CustomerSelectorSessionSourceOnly } from './t12-official-customer-selection-session-sourceonly.mjs';

export const T12_GENERAL_CREATE_VERSION='T12_GENERAL_CREATE_20261001_DUP_GUARD_V1';
export const T12_DUPLICATE_ORDER_GUARD_WINDOW_MS=120000;
const CREATE_MARKER='T12_PROD_CREATE_CANARY_V1';
const GENERAL_MARKER='T12_GENERAL_CREATE_V1';

function text(v){return String(v==null?'':v).trim();}
function boolInt(v){return text(v).toLowerCase()==='نعم'?1:0;}
function row(stmt){return stmt&&typeof stmt.first==='function'?stmt.first():null;}
function stmt(db,sql,...params){return db.prepare(sql).bind(...params);}
function fail(reason,extra={}){return {success:false,cloudNative:true,retryAutomatically:false,version:T12_GENERAL_CREATE_VERSION,reason,...extra};}
function canonical(intent,actor,epoch,sourceCapture=null){
  const base={actor,policyEpoch:epoch,requestKey:intent.requestKey,identity:intent.identity,order:intent.order,lines:intent.lines,activityPlan:intent.activityPlan,queuePlans:intent.queuePlans};
  // Unchanged byte-for-byte for all legacy creates; optional capture is
  // intentionally part of idempotent replay identity, not a mutable add-on.
  if(sourceCapture)base.sourceCapture={customerId:sourceCapture.customerId,
    externalCustomerId:sourceCapture.externalCustomerId,customerVersion:sourceCapture.customerVersion,evidenceRef:sourceCapture.evidenceRef,
    selectorRole:sourceCapture.selectorRole,selectorSessionSha256:sourceCapture.selectorSessionSha256,
    selectorIssuedAt:sourceCapture.selectorIssuedAt,selectorExpiresAt:sourceCapture.selectorExpiresAt};
  return JSON.stringify(base);
}
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
function duplicateBlocked(guard,nowMs){
  return fail('duplicate-order-window-active',{
    duplicatePrevented:true,
    existingOrderId:text(guard&&guard.orderId),
    retryAfterMs:Math.max(0,Number(guard&&guard.expiresAtMs||0)-Number(nowMs||0)),
    duplicateWindowMs:T12_DUPLICATE_ORDER_GUARD_WINDOW_MS
  });
}

async function verifiedRead(db,intent,canonicalJson,actor,epoch,sourceCapture=null){
  const key=intent.requestKey;
  const l=await row(db.prepare('SELECT actor,policy_epoch AS policyEpoch,canonical_json AS canonicalJson,order_id AS orderId,status,response_json AS responseJson FROM t12_prod_request_ledger WHERE request_key=? LIMIT 1').bind(key));
  if(!l)return {kind:'MISSING'};
  if(l.actor!==actor||l.policyEpoch!==epoch||l.canonicalJson!==canonicalJson)return {kind:'CONFLICT'};
  if(l.status!=='COMMITTED')return {kind:'INDETERMINATE'};
  const o=await row(db.prepare('SELECT order_id AS orderId,request_key AS requestKey,department,priority,status,actor FROM t12_prod_orders WHERE request_key=? LIMIT 1').bind(key));
  if(!o||o.orderId!==l.orderId||o.requestKey!==key||o.department!==intent.order.department||o.priority!==intent.order.priority||o.status!=='طلب جديد'||o.actor!==actor)return {kind:'INDETERMINATE'};
  const lineIds=[];
  for(const expected of intent.lines){
    const x=await row(db.prepare('SELECT line_id AS lineId,order_id AS orderId,ordinal,department,assigned_to AS assignedTo,item_name AS itemName,qty,priority,status,heat_press AS heatPress,fly_print AS flyPrint FROM t12_prod_lines WHERE request_key=? AND ordinal=? LIMIT 1').bind(key,expected.ordinal));
    const expectedId=String(l.orderId)+'-'+String(expected.ordinal).padStart(2,'0');
    if(!x||x.lineId!==expectedId||x.orderId!==l.orderId||Number(x.ordinal)!==expected.ordinal||x.department!==expected.department||x.assignedTo!==expected.assignedTo||x.itemName!==expected.itemName||Number(x.qty)!==Number(expected.qty)||x.priority!==expected.priority||x.status!=='طلب جديد'||Number(x.heatPress)!==boolInt(expected.heatPress)||Number(x.flyPrint)!==boolInt(expected.flyPrint))return {kind:'INDETERMINATE'};
    lineIds.push(x.lineId);
  }
  if(sourceCapture){
    const captured=await row(db.prepare('SELECT customer_id AS customerId,external_customer_id AS externalCustomerId,customer_version AS customerVersion,actor_subject AS actorSubject,evidence_ref AS evidenceRef,selector_role AS selectorRole,selector_session_sha256 AS selectorSessionSha256,selector_issued_at AS selectorIssuedAt,selector_expires_at AS selectorExpiresAt,capture_status AS captureStatus,finance_authorized AS financeAuthorized,delivery_authorized AS deliveryAuthorized FROM t12_order_customer_at_create_v1 WHERE order_id=? AND request_key=? LIMIT 1').bind(l.orderId,key));
    if(!captured||captured.customerId!==sourceCapture.customerId||captured.externalCustomerId!==sourceCapture.externalCustomerId||
      Number(captured.customerVersion)!==sourceCapture.customerVersion||
      captured.actorSubject!==actor||captured.evidenceRef!==sourceCapture.evidenceRef||
      captured.selectorRole!==sourceCapture.selectorRole||captured.selectorSessionSha256!==sourceCapture.selectorSessionSha256||
      Number(captured.selectorIssuedAt)!==sourceCapture.selectorIssuedAt||Number(captured.selectorExpiresAt)!==sourceCapture.selectorExpiresAt||
      captured.captureStatus!=='SOURCE_ONLY_NOT_ATTESTED'||
      Number(captured.financeAuthorized)!==0||Number(captured.deliveryAuthorized)!==0)
      return {kind:'INDETERMINATE'};
  }
  return {kind:'VERIFIED',response:{success:true,cloudNative:true,orderId:String(l.orderId),lineId:lineIds[0]||'',lineIds,
    ...(sourceCapture?{sourceCaptureRecorded:true,customerOwnershipAttested:false,financeAuthorized:false}:{})}};
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
  // ACC223 is reachable ONLY by a caller explicitly passed server-side
  // options in isolated source qualification; the live HTTP route passes
  // only {canary} and cannot activate this path via request-body fields.
  let sourceCapture=null;
  if(Object.prototype.hasOwnProperty.call(options,'officialCustomerLink')){
    const link=options.officialCustomerLink;
    if(!link||typeof link!=='object'||Array.isArray(link)||
       options.mode!=='isolated-source-only'||options.allowSourceCapture!==true||
       isCanary)return fail('source-capture-not-qualified');
    const customerId=text(link.customerId),evidenceRef=text(link.evidenceRef);
    if(!customerId||!/^\d{3,180}$/.test(intent.identity.externalCustomerId)||
       customerId.length>160||customerId.normalize('NFC')!==customerId||
       /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(customerId)||
       evidenceRef.length<12||evidenceRef.length>180||
       /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u.test(evidenceRef))
      return fail('source-capture-identity-untrusted-or-invalid');
    // Authentication is verified by the SAME existing Orders Edge verifier.
    // The live HTTP route does not pass this server-only selector option.
    const selectorSession=options.selectorSession;
    if(!selectorSession||typeof selectorSession!=='object'||Array.isArray(selectorSession))
      return fail('source-capture-employee-selection-session-required');
    const selector=await inspectT12CustomerSelectorSessionSourceOnly({
      token:selectorSession.token,secret:selectorSession.secret,expectedActor:safeActor
    });
    if(!selector.ok)return fail('source-capture-employee-selection-session-invalid');
    try{
      const gate=await row(db.prepare("SELECT mode FROM t12_order_customer_at_create_control_v1 WHERE singleton=1 AND marker='ACC223_ORDER_CUSTOMER_SOURCE_CAPTURE_V1' LIMIT 1"));
      if(!gate||gate.mode!=='ISOLATED')return fail('source-capture-control-off');
      const customer=await row(db.prepare('SELECT customer_id AS customerId,active,version FROM t12_customers WHERE customer_id=? LIMIT 1').bind(customerId));
      if(!customer||customer.customerId!==customerId||customer.active!=='نعم'||
         !Number.isSafeInteger(Number(customer.version))||Number(customer.version)<1)
        return fail('source-capture-customer-unavailable-or-inactive');
      sourceCapture={customerId,externalCustomerId:intent.identity.externalCustomerId,customerVersion:Number(customer.version),evidenceRef,
        selectorRole:selector.role,selectorSessionSha256:selector.tokenSha256,
        selectorIssuedAt:selector.issuedAt,selectorExpiresAt:selector.expiresAt};
    }catch{return fail('source-capture-evidence-read-unavailable');}
  }
  const epoch=text(control.policyEpoch),canonicalJson=canonical(intent,safeActor,epoch,sourceCapture);
  let existing;
  try{existing=await verifiedRead(db,intent,canonicalJson,safeActor,epoch,sourceCapture);}catch{return fail('ledger-read-unavailable-no-retry');}
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

  const nowMs=Number.isSafeInteger(Number(options.nowMs))&&Number(options.nowMs)>0?Number(options.nowMs):Date.now();
  const canonicalBusinessJson=businessCanonical(intent);
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
    intent.identity.mode,intent.identity.customerName,intent.identity.customerPhone,intent.identity.externalCustomerId,
    intent.order.department,intent.order.priority,intent.order.source,intent.order.notes,safeActor,intent.requestKey));
  for(const line of intent.lines){
    s.push(stmt(db,"INSERT INTO t12_prod_lines (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,qty,priority,status,heat_press,fly_print) SELECT order_id || '-' || printf('%02d',?),order_id,request_key,?,?,?,?,?,?,'طلب جديد',?,? FROM t12_prod_request_ledger WHERE request_key=? AND status='PREPARED'",
      line.ordinal,line.ordinal,line.department,line.assignedTo,line.itemName,line.qty,line.priority,boolInt(line.heatPress),boolInt(line.flyPrint),intent.requestKey));
  }
  s.push(stmt(db,"INSERT INTO t12_prod_events (request_key,event_key,order_id,event_type,payload_json) SELECT request_key,'activity',order_id,'order-create',? FROM t12_prod_request_ledger WHERE request_key=? AND status='PREPARED'",
    JSON.stringify(intent.activityPlan),intent.requestKey));
  for(const line of intent.lines){
    const q=intent.queuePlans[line.ordinal-1];
    s.push(stmt(db,"INSERT INTO t12_prod_outbox (request_key,event_key,order_id,line_id,event_type,status,payload_json) SELECT r.request_key,?,r.order_id,l.line_id,'trend-master-status-intent','pending',? FROM t12_prod_request_ledger r JOIN t12_prod_lines l ON l.request_key=r.request_key AND l.ordinal=? WHERE r.request_key=? AND r.status='PREPARED'",
      'queue:'+String(line.ordinal).padStart(2,'0'),JSON.stringify(q),line.ordinal,intent.requestKey));
  }
  s.push(stmt(db,"UPDATE t12_prod_request_ledger SET status='COMMITTED',response_json=json_object('success',json('true'),'cloudNative',json('true'),'orderId',order_id) WHERE request_key=? AND status='PREPARED'",intent.requestKey));
  if(sourceCapture){
    // Direct VALUES INSERT + trigger RAISE(ABORT), not SELECT/IGNORE:
    // absent/mutated customer or ledger MUST abort the entire D1 batch.
    s.push(stmt(db,'INSERT INTO t12_order_customer_at_create_v1 (order_id,request_key,customer_id,external_customer_id,customer_version,actor_subject,evidence_ref,selector_role,selector_session_sha256,selector_issued_at,selector_expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      orderId,intent.requestKey,sourceCapture.customerId,sourceCapture.externalCustomerId,sourceCapture.customerVersion,safeActor,sourceCapture.evidenceRef,
      sourceCapture.selectorRole,sourceCapture.selectorSessionSha256,sourceCapture.selectorIssuedAt,sourceCapture.selectorExpiresAt));
  }
  s.push(stmt(db,'UPDATE t12_prod_duplicate_order_guard SET order_id=(SELECT order_id FROM t12_prod_request_ledger WHERE request_key=?),updated_at=CURRENT_TIMESTAMP WHERE fingerprint=? AND request_key=?',
    intent.requestKey,duplicateFingerprint,intent.requestKey));
  if(isCanary){
    s.push(stmt(db,"UPDATE t12_prod_general_create_control SET canary_remaining=0,updated_at=CURRENT_TIMESTAMP WHERE singleton=1 AND marker='T12_GENERAL_CREATE_V1' AND mode='CANARY' AND canary_remaining=1"));
  }

  try{await db.batch(s);}catch{
    let recovered;try{recovered=await verifiedRead(db,intent,canonicalJson,safeActor,epoch,sourceCapture);}catch{return fail('transaction-outcome-unknown-no-retry');}
    if(recovered.kind==='VERIFIED')return {...recovered.response,stored:false,idempotent:true,ambiguousAckRecovered:true,version:T12_GENERAL_CREATE_VERSION};
    if(recovered.kind==='CONFLICT')return fail('same-key-actor-payload-or-policy-conflict');
    try{
      const duplicate=await activeDuplicateGuard(db,duplicateFingerprint,nowMs);
      if(duplicate&&text(duplicate.requestKey)!==intent.requestKey)return duplicateBlocked(duplicate,nowMs);
    }catch{return fail('transaction-outcome-unknown-no-retry');}
    return fail('transaction-outcome-unknown-no-retry');
  }

  let confirmed;try{confirmed=await verifiedRead(db,intent,canonicalJson,safeActor,epoch,sourceCapture);}catch{return fail('committed-data-not-verified-no-retry');}
  if(confirmed.kind!=='VERIFIED')return fail('allocation-race-or-commit-not-verified-no-retry',{expectedOrderId:orderId});
  return {...confirmed.response,stored:true,idempotent:false,canary:isCanary,version:T12_GENERAL_CREATE_VERSION};
}
