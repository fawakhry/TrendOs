/*
 * TrendOS T12 isolated D1 shadow persistence candidate.
 * NOT ROUTED. NOT PRODUCTION-AUTHORIZED. It writes only t12_* shadow tables
 * when the caller explicitly supplies mode='isolated-shadow-qualification'
 * and allowShadowMutation=true. It never allocates a business Order/Line ID.
 */
import { buildT12OrderCreateShadowIntent } from './t12-order-create-shadow-intent.mjs';

export const T12_SHADOW_STORE_VERSION = 'TRENDOS_T12_ORDER_CREATE_SHADOW_STORE_20260922_AMBIGUOUS_BATCH_FAIL_CLOSED';

function text(v){ return String(v == null ? '' : v).trim(); }
function fail(reason, extra={}){
  return {
    success:false, stored:false, idempotent:false, conflict:false,
    productionCutoverAuthorized:false, businessOrderIdAllocated:false,
    version:T12_SHADOW_STORE_VERSION, reason, ...extra
  };
}
function canonicalPayload(intent){
  return JSON.stringify({
    requestKey:intent.requestKey,
    provisionalRef:intent.provisionalRef,
    identity:intent.identity,
    order:intent.order,
    lines:intent.lines,
    activityPlan:intent.activityPlan,
    queuePlans:intent.queuePlans
  });
}
function boolInt(v){ return String(v).toLowerCase()==='نعم' ? 1 : 0; }

// An existing intent alone is NOT proof that its lines and queue events were
// committed. The pure-read check never fixes a missing row or retries CREATE.
async function verifiedShadowFootprint(db,intent,canonicalJson,actor,header){
  if(!header || header.canonicalJson!==canonicalJson ||
     header.actor!==text(actor) || header.provisionalRef!==intent.provisionalRef ||
     !['shadow-planned','shadow-qualified'].includes(header.qualificationStatus))return false;
  const key=intent.requestKey;
  const [lineCount,eventCount]=await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM t12_order_create_line_intents WHERE client_request_id=?').bind(key).first(),
    db.prepare('SELECT COUNT(*) AS n FROM t12_order_create_shadow_events WHERE client_request_id=?').bind(key).first()
  ]);
  if(Number(lineCount?.n)!==intent.lines.length ||
     Number(eventCount?.n)!==intent.queuePlans.length+1)return false;
  for(const expected of intent.lines){
    const found=await db.prepare('SELECT provisional_line_ref AS provisionalLineRef, department, assigned_to AS assignedTo, item_name AS itemName, qty, priority, status, heat_press AS heatPress, fly_print AS flyPrint FROM t12_order_create_line_intents WHERE client_request_id=? AND ordinal=? LIMIT 1')
      .bind(key,expected.ordinal).first();
    if(!found || found.provisionalLineRef!==expected.provisionalLineRef ||
       found.department!==expected.department || found.assignedTo!==expected.assignedTo ||
       found.itemName!==expected.itemName || Number(found.qty)!==expected.qty ||
       found.priority!==expected.priority || found.status!==expected.status ||
       Number(found.heatPress)!==boolInt(expected.heatPress) ||
       Number(found.flyPrint)!==boolInt(expected.flyPrint))return false;
  }
  const eventPlans=[['activity','order-create-intent',intent.activityPlan],
    ...intent.queuePlans.map((plan,i)=>['queue:'+String(i+1).padStart(2,'0'),plan.eventType,plan])];
  for(const [eventKey,eventType,payload] of eventPlans){
    const event=await db.prepare('SELECT event_type AS eventType, payload_json AS payloadJson FROM t12_order_create_shadow_events WHERE client_request_id=? AND event_key=? LIMIT 1')
      .bind(key,eventKey).first();
    if(!event || event.eventType!==eventType || event.payloadJson!==JSON.stringify(payload))return false;
  }
  return true;
}

export async function persistT12OrderCreateShadow(db,input={},actor='',options={}){
  if (!db || typeof db.prepare!=='function' || typeof db.batch!=='function') return fail('d1-adapter-required');
  if (options.mode!=='isolated-shadow-qualification' || options.allowShadowMutation!==true) {
    return fail('shadow-mutation-not-authorized');
  }
  const intent=buildT12OrderCreateShadowIntent(input,actor);
  if (!intent.valid) return fail('shadow-intent-invalid',{errors:intent.errors || []});

  const canonicalJson=canonicalPayload(intent);
  let existing;
  try {
    existing=await db.prepare(
      'SELECT client_request_id AS clientRequestId, provisional_ref AS provisionalRef, actor, canonical_json AS canonicalJson, qualification_status AS qualificationStatus FROM t12_order_create_intents WHERE client_request_id = ? LIMIT 1'
    ).bind(intent.requestKey).first();
  } catch {
    // Unknown ledger state: never write a second intent on a failed first read.
    return fail('shadow-initial-ledger-read-unavailable-no-retry');
  }

  if (existing) {
    if (existing.canonicalJson===canonicalJson && existing.actor===text(actor)) {
      let complete=false;
      try{complete=await verifiedShadowFootprint(db,intent,canonicalJson,actor,existing);}
      catch{return fail('shadow-ledger-read-unavailable-no-retry');}
      if(!complete)return fail('shadow-ledger-incomplete-no-retry');
      return {
        success:true, stored:false, idempotent:true, conflict:false,
        productionCutoverAuthorized:false, businessOrderIdAllocated:false,
        version:T12_SHADOW_STORE_VERSION, requestKey:intent.requestKey,
        provisionalRef:text(existing.provisionalRef)||intent.provisionalRef,
        qualificationStatus:text(existing.qualificationStatus)||'shadow-planned'
      };
    }
    return fail('idempotency-key-payload-conflict',{
      conflict:true, requestKey:intent.requestKey, provisionalRef:text(existing.provisionalRef)
    });
  }

  const statements=[];
  statements.push(db.prepare(`
    INSERT INTO t12_order_create_intents
    (client_request_id, provisional_ref, actor, identity_mode, customer_name, customer_phone,
     external_customer_id, department, priority, status, source, notes, canonical_json, qualification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'shadow-planned')
  `).bind(
    intent.requestKey,intent.provisionalRef,text(actor),intent.identity.mode,
    intent.identity.customerName,intent.identity.customerPhone,intent.identity.externalCustomerId,
    intent.order.department,intent.order.priority,intent.order.status,intent.order.source,intent.order.notes,canonicalJson
  ));
  for (const line of intent.lines) {
    statements.push(db.prepare(`
      INSERT INTO t12_order_create_line_intents
      (client_request_id, ordinal, provisional_line_ref, department, assigned_to, item_name, qty, priority, status, heat_press, fly_print)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      intent.requestKey,line.ordinal,line.provisionalLineRef,line.department,line.assignedTo,
      line.itemName,line.qty,line.priority,line.status,boolInt(line.heatPress),boolInt(line.flyPrint)
    ));
  }
  statements.push(db.prepare(`
    INSERT INTO t12_order_create_shadow_events
    (client_request_id, event_key, event_type, payload_json)
    VALUES (?, ?, ?, ?)
  `).bind(intent.requestKey,'activity','order-create-intent',JSON.stringify(intent.activityPlan)));
  intent.queuePlans.forEach((event,index)=>{
    statements.push(db.prepare(`
      INSERT INTO t12_order_create_shadow_events
      (client_request_id, event_key, event_type, payload_json)
      VALUES (?, ?, ?, ?)
    `).bind(intent.requestKey,'queue:'+String(index+1).padStart(2,'0'),event.eventType,JSON.stringify(event)));
  });

  try {
    await db.batch(statements);
  } catch (err) {
    // A concurrent winner using the same idempotency key is re-read before
    // deciding whether this is a safe replay or a payload conflict.
    let raced;
    try{raced=await db.prepare(
      'SELECT provisional_ref AS provisionalRef, actor, canonical_json AS canonicalJson, qualification_status AS qualificationStatus FROM t12_order_create_intents WHERE client_request_id = ? LIMIT 1'
    ).bind(intent.requestKey).first();}
    catch{return fail('shadow-transaction-outcome-unknown-no-retry');}
    if (raced && raced.canonicalJson===canonicalJson && raced.actor===text(actor)) {
      let complete=false;
      try{complete=await verifiedShadowFootprint(db,intent,canonicalJson,actor,raced);}
      catch{return fail('shadow-transaction-outcome-unknown-no-retry');}
      if(!complete)return fail('shadow-transaction-outcome-unknown-no-retry');
      return {
        success:true, stored:false, idempotent:true, conflict:false,
        productionCutoverAuthorized:false, businessOrderIdAllocated:false,
        version:T12_SHADOW_STORE_VERSION, requestKey:intent.requestKey,
        provisionalRef:text(raced.provisionalRef)||intent.provisionalRef,
        qualificationStatus:text(raced.qualificationStatus)||'shadow-planned',
        concurrentReplay:true
      };
    }
    if (raced) return fail('idempotency-key-payload-conflict',{conflict:true,requestKey:intent.requestKey});
    // Even if the subsequent SELECT finds nothing, a timed-out batch may have
    // committed and not yet become visible to this adapter. Never suggest an
    // automatic new CREATE/key after any ambiguous D1 batch rejection.
    return fail('shadow-transaction-outcome-unknown-no-retry');
  }

  // Verify the complete read-your-write footprint before reporting success.
  try{
    const committed=await db.prepare(
      'SELECT provisional_ref AS provisionalRef, actor, canonical_json AS canonicalJson, qualification_status AS qualificationStatus FROM t12_order_create_intents WHERE client_request_id=? LIMIT 1'
    ).bind(intent.requestKey).first();
    if(!await verifiedShadowFootprint(db,intent,canonicalJson,actor,committed))
      return fail('shadow-commit-footprint-unverified-no-retry');
  }catch{return fail('shadow-commit-footprint-unverified-no-retry');}

  return {
    success:true, stored:true, idempotent:false, conflict:false,
    productionCutoverAuthorized:false, businessOrderIdAllocated:false,
    version:T12_SHADOW_STORE_VERSION, requestKey:intent.requestKey,
    provisionalRef:intent.provisionalRef, lineIntentCount:intent.lines.length,
    eventIntentCount:1+intent.queuePlans.length, qualificationStatus:'shadow-planned'
  };
}
