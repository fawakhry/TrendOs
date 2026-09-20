/*
 * TrendOS T12 — isolated Cloud-native CREATE transaction rehearsal.
 * ONLY t12_synth_* tables, NOT production. No Worker route or deploy import.
 * Does not assert canonical Apps Script parity (debt, open-order reuse, queue).
 * Never call this with production D1: the caller must inject a VERIFIED
 * separately isolated TEST database, not merely self-report boolean gates.
 */
import { buildCanonicalOrderCreateIntentV2 } from './cloud-write-order-contract-v2.mjs';
import { checkT12OrderCreateInputShape } from './t12-order-create-input-guard.mjs';
import { classifyT12ClientRequestKey } from './t12-cloud-client-key-admission.mjs';

export const T12_CLOUD_NATIVE_SYNTHETIC_VERSION='T12_CLOUD_NATIVE_SYNTHETIC_CREATE_20260920';
const MODE='isolated-cloud-native-synthetic-qualification';
function fail(reason,extra={}){
  return {success:false,syntheticOnly:true,productionAuthorized:false,
    retryAutomatically:false,version:T12_CLOUD_NATIVE_SYNTHETIC_VERSION,
    reason,...extra};
}
function eligible(g){
  return g&&g.mode===MODE&&g.allowSyntheticBusinessCreate===true&&
    g.testDatabaseIsolationVerified===true&&g.googleCreateFrozenInTest===true&&
    g.r5MirrorFencedInTest===true&&g.edgeSessionVerifiedInTest===true;
}
function content(p,actor){
  return JSON.stringify({actor,identityMode:p.identityMode,
    customerName:p.customerName,customerPhone:p.customerPhone,
    department:p.department,itemName:p.itemName,qty:p.qty,
    priority:p.priority,heatPress:p.heatPress,flyPrint:p.flyPrint,
    notes:p.notes,source:p.source});
}
function allocatedIdSQL(){
  return "(SELECT CAST(next_order_number-1 AS TEXT) FROM t12_synth_control WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY' AND google_writer_fenced=1 AND r5_mirror_writer_fenced=1)";
}
function lineIdSQL(){
  return "("+allocatedIdSQL()+" || '-01')";
}
function row(d){return d&&typeof d.first==='function'?d.first():null;}
async function verifiedRead(db,key,canonical,actor){
  const saved=await row(db.prepare(
    'SELECT actor,canonical_json AS canonicalJson,order_id AS orderId,status,response_json AS responseJson FROM t12_synth_request_ledger WHERE request_key=? LIMIT 1'
  ).bind(key));
  if(!saved)return {kind:'MISSING'};
  if(saved.canonicalJson!==canonical||saved.actor!==actor)
    return {kind:'CONFLICT'};
  if(saved.status!=='COMMITTED')return {kind:'INDETERMINATE'};
  const [order,line,event,outbox]=await Promise.all([
    row(db.prepare('SELECT order_id AS orderId, request_key AS requestKey FROM t12_synth_orders WHERE request_key=? LIMIT 1').bind(key)),
    row(db.prepare('SELECT line_id AS lineId,order_id AS orderId,request_key AS requestKey FROM t12_synth_lines WHERE request_key=? LIMIT 1').bind(key)),
    row(db.prepare("SELECT order_id AS orderId FROM t12_synth_events WHERE request_key=? AND event_key='create' LIMIT 1").bind(key)),
    row(db.prepare("SELECT order_id AS orderId,line_id AS lineId,status FROM t12_synth_outbox WHERE request_key=? AND event_key='queue:01' LIMIT 1").bind(key))
  ]);
  let response;
  try{response=JSON.parse(saved.responseJson);}catch{return {kind:'INDETERMINATE'};}
  if(!order||!line||!event||!outbox||!response||
      response.success!==true||response.syntheticOnly!==true||
      String(response.orderId)!==String(saved.orderId)||
      String(response.lineId)!==String(line.lineId)||
      order.orderId!==saved.orderId||order.requestKey!==key||
      line.orderId!==saved.orderId||line.requestKey!==key||
      event.orderId!==saved.orderId||outbox.orderId!==saved.orderId||
      outbox.lineId!==line.lineId||outbox.status!=='pending')
    return {kind:'INDETERMINATE'};
  return {kind:'VERIFIED',response};
}
function stmt(db,sql,...params){return db.prepare(sql).bind(...params);}
export async function createT12CloudNativeSynthetic(db,input={},actor='',gates={}){
  if(!eligible(gates))return fail('synthetic-exclusive-gates-not-met');
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
    return fail('isolated-database-adapter-required');
  // The DB is not deemed isolated because its caller says so: the read-only
  // fixture marker and BOTH writer fences must also exist in the actual DB.
  let control;
  try{
    control=await row(db.prepare(
      "SELECT fixture_marker AS marker,google_writer_fenced AS googleFence,r5_mirror_writer_fenced AS r5Fence,next_order_number AS nextNo FROM t12_synth_control WHERE singleton=1 LIMIT 1"
    ));
  }catch{return fail('synthetic-test-schema-unavailable');}
  if(!control||control.marker!=='T12_SYNTHETIC_ONLY'||
     Number(control.googleFence)!==1||Number(control.r5Fence)!==1||
     !Number.isSafeInteger(Number(control.nextNo))||Number(control.nextNo)<1001)
    return fail('synthetic-db-identity-or-writer-fence-mismatch');

  const safeActor=String(actor||'').trim();
  if(!safeActor||safeActor.length>100)return fail('authenticated-test-actor-required');
  const shape=checkT12OrderCreateInputShape(input);
  if(!shape.valid)return fail('synthetic-input-shape-refused');
  // Do not normalize/truncate/choose among aliases before classifying
  // the raw client key: a retry must keep byte-for-byte identity.
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
  const intent=buildCanonicalOrderCreateIntentV2(input);
  if(!intent.valid)return fail('synthetic-canonical-intent-invalid');
  const p=intent.normalized;
  if(p.clientRequestId!==input.clientRequestId)
    return fail('cloud-client-key-normalization-refused');
  // This rehearsal tests ONE narrow transaction; it does not silently claim
  // debt/registered-lookup/open-order reuse/multi/press/laser side-effect parity.
  if(p.identityMode!=='registered'||p.department!=='طباعة'||p.heatPress||
     p.flyPrint||p.priority!=='عادي'||p.status!=='طلب جديد')
    return fail('unsupported-canonical-business-case-not-qualified');
  const key=p.clientRequestId,canonical=content(p,safeActor);
  let existing;
  try{existing=await verifiedRead(db,key,canonical,safeActor);}
  catch{return fail('synthetic-ledger-lookup-failed-no-retry');}
  if(existing.kind==='VERIFIED')return {success:true,syntheticOnly:true,
    productionAuthorized:false,stored:false,idempotent:true,
    version:T12_CLOUD_NATIVE_SYNTHETIC_VERSION,...existing.response};
  if(existing.kind==='CONFLICT')return fail('same-key-actor-or-payload-conflict');
  if(existing.kind==='INDETERMINATE')return fail('existing-transaction-incomplete-no-retry');

  const id=allocatedIdSQL(),lineId=lineIdSQL();
  const statements=[
    stmt(db,"UPDATE t12_synth_control SET next_order_number=next_order_number+1 WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY' AND google_writer_fenced=1 AND r5_mirror_writer_fenced=1"),
    stmt(db,`INSERT INTO t12_synth_request_ledger
      (request_key,actor,canonical_json,order_id,status,response_json)
      SELECT ?,?,?,${id},'COMMITTED',
        json_object('success',json('true'),'syntheticOnly',json('true'),
          'orderId',${id},'lineId',${lineId})
      WHERE EXISTS(SELECT 1 FROM t12_synth_control WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY' AND google_writer_fenced=1 AND r5_mirror_writer_fenced=1)`,
      key,safeActor,canonical),
    stmt(db,`INSERT INTO t12_synth_orders (order_id,request_key,customer_name,department,status)
      SELECT order_id,request_key,? ,?,'طلب جديد'
      FROM t12_synth_request_ledger WHERE request_key=?`,
      p.customerName,p.department,key),
    stmt(db,`INSERT INTO t12_synth_lines
      (line_id,order_id,request_key,item_name,qty,department,status)
      SELECT order_id || '-01',order_id,request_key,?,?,?,'طلب جديد'
      FROM t12_synth_request_ledger WHERE request_key=?`,
      p.itemName,p.qty,p.department,key),
    stmt(db,`INSERT INTO t12_synth_events
      (request_key,event_key,order_id,event_type)
      SELECT request_key,'create',order_id,'order-created'
      FROM t12_synth_request_ledger WHERE request_key=?`,key),
    stmt(db,`INSERT INTO t12_synth_outbox
      (request_key,event_key,order_id,line_id,status)
      SELECT l.request_key,'queue:01',l.order_id,l.line_id,'pending'
      FROM t12_synth_lines l WHERE l.request_key=?`,key)
  ];
  // Cloudflare D1 batch is documented as atomic; synthetic tests inject a
  // REAL in-memory sqlite BEGIN/ROLLBACK adapter to exercise that contract.
  // An exception/timeout is an UNKNOWN outcome, never a retry signal.
  try{await db.batch(statements);}
  catch{
    let reread;
    try{reread=await verifiedRead(db,key,canonical,safeActor);}
    catch{return fail('transaction-outcome-unknown-no-retry');}
    if(reread.kind==='VERIFIED')return {success:true,syntheticOnly:true,
      productionAuthorized:false,stored:false,idempotent:true,
      version:T12_CLOUD_NATIVE_SYNTHETIC_VERSION,...reread.response};
    if(reread.kind==='CONFLICT')return fail('same-key-actor-or-payload-conflict');
    return fail('transaction-outcome-unknown-no-retry');
  }
  let confirmed;
  try{confirmed=await verifiedRead(db,key,canonical,safeActor);}
  catch{return fail('committed-data-not-verified-no-retry');}
  if(confirmed.kind!=='VERIFIED')return fail('committed-data-not-verified-no-retry');
  return {success:true,syntheticOnly:true,productionAuthorized:false,
    stored:true,idempotent:false,version:T12_CLOUD_NATIVE_SYNTHETIC_VERSION,
    ...confirmed.response};
}
