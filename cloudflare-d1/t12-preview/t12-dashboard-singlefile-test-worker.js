/*
 * T12 — SINGLE FILE for Cloudflare dashboard editor, isolated TEST Worker ONLY.
 * Source branch: cloud-migration-v3-t12-order-create-ci-20260919
 * DO NOT PASTE INTO trendos-d1-api or any production Worker.
 * Default OFF: variable T12_SYNTHETIC_TEST_ENABLED must remain "false".
 * This file intentionally has NO external imports, no production route,
 * no customer/order production data and no Cloudflare production D1 binding.
 * IMPORTANT: Generated for TEST-only worker; new production deployment remains prohibited.
 */
const __t12Contract=(()=>{
/* TrendOS Cloud Write Order Contract V2
 *
 * PURE / CI-ONLY canonical create-intent normalizer.
 *
 * This module intentionally does NOT:
 * - accept/preallocate a production business Order ID;
 * - read or write D1;
 * - call Apps Script;
 * - read/write Google Sheets;
 * - touch secrets/properties;
 * - expose a Worker route.
 *
 * Its only job is to validate a future Cloud-originated order create intent and
 * produce the parameter contract that a separately-qualified Apps Script adapter
 * may eventually submit through the canonical `createManualOrder_` business path.
 */

const CLOUD_WRITE_ORDER_CONTRACT_V2_VERSION = 'CLOUD_WRITE_ORDER_CONTRACT_V2_20260904';

function text(value) {
  return String(value == null ? '' : value).trim();
}

function boolish(value) {
  if (value === true || value === 1) return true;
  const v = text(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on' || v === 'نعم';
}

function digits(value) {
  return text(value)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^0-9]/g, '');
}

function cleanEgyptPhone(value) {
  let d = digits(value);
  if (d.startsWith('0020') && d.length >= 14) d = `0${d.slice(4)}`;
  else if (d.startsWith('20') && d.length === 12) d = `0${d.slice(2)}`;
  else if (d.length === 10 && d.startsWith('1')) d = `0${d}`;
  return d;
}

function requestKey(value) {
  const raw = text(value);
  if (!raw) return '';
  if (raw.length > 160) return '';
  if (!/^[A-Za-z0-9_.:-]+$/.test(raw)) return '';
  return raw;
}

function normalizeDepartment(value) {
  const raw = text(value);
  const low = raw.toLowerCase();
  if (raw === 'طباعة' || low === 'print' || low === 'printing') return { department: 'طباعة', heatPress: false };
  if (raw === 'ليزر' || low === 'laser') return { department: 'ليزر', heatPress: false };
  if (raw === 'مكبس' || low === 'press' || low === 'heat press' || low === 'heat-press') return { department: 'طباعة', heatPress: true };
  if (raw === 'متعدد الأقسام' || raw === 'متعدد' || low === 'multi' || low === 'multi-department') {
    return { department: 'متعدد الأقسام', heatPress: false };
  }
  return { department: '', heatPress: false };
}

function identityMode(input) {
  const raw = text(input.customerMode || input.identityMode || input.customerIdentityMode).toLowerCase();
  const externalId = text(input.externalCustomerId || input.customerExternalId || input.lightCustomerId);
  const explicitlyExternal = raw.includes('خارجي') || raw.includes('عابر') || raw === 'external' || raw === 'transient';
  return explicitlyExternal || externalId ? 'external' : 'registered';
}

function failure(errors, normalized = {}) {
  return {
    success: false,
    valid: false,
    version: CLOUD_WRITE_ORDER_CONTRACT_V2_VERSION,
    mutationFree: true,
    productionRouteIntegrated: false,
    errors,
    normalized
  };
}

function buildCanonicalOrderCreateIntentV2(input = {}) {
  const errors = [];

  const key = requestKey(input.clientRequestId || input.requestId || input.idempotencyKey || input.idempotency_key);
  if (!key) errors.push('valid-client-request-id-required');

  // The live Apps Script contract owns numeric business Order ID allocation.
  // A future Cloud V2 create is an intent, not an already-created production order.
  if (text(input.orderId || input.order_id || input['رقم الأوردر'])) {
    errors.push('business-order-id-preallocation-refused');
  }

  const mode = identityMode(input);
  let customerName = text(input.customerName || input.name || input['اسم العميل'] || input['اسم الشات / المكتب']);
  let customerPhone = cleanEgyptPhone(input.customerPhone || input.phone || input['رقم العميل'] || input['رقم الهاتف']);
  let externalCustomerId = digits(input.externalCustomerId || input.customerExternalId || input.lightCustomerId);

  if (mode === 'registered') {
    if (!customerName) errors.push('registered-customer-name-required');
    // V2 is intentionally stricter than createManualOrder_: first controlled lane
    // must carry an unambiguous customer identity instead of relying on fuzzy name-only lookup.
    if (!customerPhone) errors.push('registered-customer-phone-required');
    externalCustomerId = '';
  } else {
    if (externalCustomerId.length < 3) errors.push('external-customer-id-min-3-digits');
    if (!customerName && externalCustomerId) customerName = `عميل خارجي - ${externalCustomerId}`;
    // Keep a full external phone when supplied, otherwise the external/light ID is separate.
    if (!customerPhone && externalCustomerId.length >= 10) customerPhone = cleanEgyptPhone(externalCustomerId);
  }

  const departmentInput = text(input.department || input['القسم']);
  const dep = normalizeDepartment(departmentInput);
  if (!dep.department) errors.push('supported-department-required');

  let heatPress = dep.heatPress || boolish(input.heatPress || input.press || input.isPress || input['مكبس حراري']);
  const flyPrint = boolish(input.flyPrint || input.quickPrint || input.fastPrint || input['طباعة على الطاير']);
  if (flyPrint && dep.department !== 'طباعة') errors.push('fly-print-requires-print-department');

  const itemName = text(input.itemName || input.item || input['اسم البند'] || input['نوع الشغل']);
  if (!itemName) errors.push('item-name-required');

  const qty = Number(input.qty ?? input.quantity ?? input['الكمية']);
  if (!Number.isFinite(qty) || qty <= 0) errors.push('positive-qty-required');

  const requestedStatus = text(input.status || input.orderStatus || input['الحالة']) || 'طلب جديد';
  if (requestedStatus !== 'طلب جديد') errors.push('initial-status-must-be-new');

  let priority = text(input.priority || input['الأولوية']) || 'عادي';
  if (flyPrint) priority = 'عاجل';
  if (!['عاجل', 'عادي', 'مؤجل', 'VIP'].includes(priority)) errors.push('supported-priority-required');

  const source = text(input.source || input['مصدر الطلب']) || 'Cloud Write V2';
  const notes = text(input.notes || input['ملاحظات']);
  const actor = text(input.actor || input.cloudActor || input.createdBy);

  const normalized = {
    clientRequestId: key,
    identityMode: mode,
    customerName,
    customerPhone,
    externalCustomerId,
    department: dep.department,
    originalDepartment: departmentInput,
    itemName,
    qty: Number.isFinite(qty) ? qty : null,
    priority,
    status: requestedStatus,
    heatPress,
    flyPrint,
    source,
    notes,
    actor,
    businessOrderIdStrategy: 'apps-script-allocated'
  };

  if (errors.length) return failure(errors, normalized);

  const canonicalCreateParams = {
    clientRequestId: key,
    customerName,
    customerPhone,
    customerMode: mode === 'external' ? 'خارجي / عابر' : 'عميل مسجل',
    externalCustomerId: mode === 'external' ? externalCustomerId : '',
    department: dep.department,
    itemName,
    qty,
    priority,
    status: 'طلب جديد',
    heatPress: heatPress ? 'نعم' : 'لا',
    flyPrint: flyPrint ? 'نعم' : 'لا',
    source,
    notes
  };

  return {
    success: true,
    valid: true,
    version: CLOUD_WRITE_ORDER_CONTRACT_V2_VERSION,
    intentType: 'createManualOrder',
    businessOrderIdStrategy: 'apps-script-allocated',
    mutationFree: true,
    productionRouteIntegrated: false,
    normalized,
    canonicalCreateParams,
    requiredCanonicalSideEffects: [
      'authorize-canCreateOrder',
      'script-lock',
      'v1908-request-idempotency',
      'customer-or-external-identity',
      'debt-policy',
      'department-normalization',
      'recent-duplicate-guard',
      'open-order-department-scope',
      'apps-script-business-order-id-allocation',
      'line-id-allocation',
      'orders-summary-upsert',
      'order-lines-create',
      'activity-log',
      'trend-master-message-queue',
      'data-version-bump',
      'saved-response-replay'
    ]
  };
}

return {buildCanonicalOrderCreateIntentV2};
})();
const __t12Input=(()=>{
/*
 * T12 exact-shape admission control. Fail closed before calling the pure V2
 * canonical contract; V2 does not itself reject every ignored input field.
 * Intentionally restricts the FIRST isolated single-line order create lane.
 * No IO, no Worker route, no production wiring.
 */
const T12_INPUT_GUARD_VERSION='TRENDOS_T12_ORDER_CREATE_INPUT_GUARD_20260919';
const ACCEPTED=Object.freeze([
  'clientRequestId','requestId','idempotencyKey','idempotency_key',
  'customerMode','identityMode','customerIdentityMode',
  'externalCustomerId','customerExternalId','lightCustomerId',
  'customerName','name','اسم العميل','اسم الشات / المكتب',
  'customerPhone','phone','رقم العميل','رقم الهاتف',
  'department','القسم',
  'heatPress','press','isPress','مكبس حراري',
  'flyPrint','quickPrint','fastPrint','طباعة على الطاير',
  'itemName','item','اسم البند','نوع الشغل',
  'qty','quantity','الكمية',
  'status','orderStatus','الحالة',
  'priority','الأولوية',
  'source','مصدر الطلب','notes','ملاحظات'
]);
const ACCEPTED_SET=new Set(ACCEPTED);
const DANGEROUS=Object.freeze([
  'orderId','order_id','رقم الأوردر',
  'assignedTo','createdBy','actor','cloudActor',
  'username','token','employeeToken','edgeToken','password',
  'items','lineItems','orderLines','lines','products',
  'payment','payments','invoice','stockMovements','discount',
  'total','remaining','shippingFee','deposit','amountPaid','customPrice',
  'الإجمالي','المتبقي','المدفوع','الخصم','بنود الأوردر',
  'forceCreate','id','lineId','createdAt','updatedAt',
  'customerType','expectedDelivery','deliveryDate','price'
]);
function own(x,k){return Object.prototype.hasOwnProperty.call(x,k);}
function plain(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);}
function checkT12OrderCreateInputShape(input) {
  if(!plain(input))return Object.freeze({valid:false,version:T12_INPUT_GUARD_VERSION,reason:'invalid-input-object',unexpectedFields:[],sensitiveFields:[]});
  const keys=Object.keys(input);
  const unexpectedFields=keys.filter(k=>!ACCEPTED_SET.has(k));
  const sensitiveFields=keys.filter(k=>DANGEROUS.includes(k)||/token|password|secret|credential|auth/i.test(k));
  if(unexpectedFields.length||sensitiveFields.length)return Object.freeze({
    valid:false,version:T12_INPUT_GUARD_VERSION,
    reason:'unsupported-create-fields-must-be-mapped',
    unexpectedFields:Object.freeze(unexpectedFields),sensitiveFields:Object.freeze(sensitiveFields)
  });
  if(keys.length>60)return Object.freeze({valid:false,version:T12_INPUT_GUARD_VERSION,reason:'too-many-fields',unexpectedFields:[],sensitiveFields:[]});
  return Object.freeze({valid:true,version:T12_INPUT_GUARD_VERSION,reason:'accepted-restricted-single-line-intent',unexpectedFields:[],sensitiveFields:[]});
}
const T12_ACCEPTED_INPUT_FIELDS=ACCEPTED;
const T12_UNSUPPORTED_BUSINESS_FIELDS=DANGEROUS;

return {checkT12OrderCreateInputShape};
})();
const __t12Namespace=(()=>{
/*
 * T12 isolated ClientRequestId namespace fence.
 * Legacy Google co_* and all non-cloud IDs are NEVER new Cloud creates.
 * Full legacy replay may be served only from separately qualified historic
 * ledger/property/backup lookup. UNKNOWN legacy => explicit stop, no CREATE.
 *
 * This is not an auth check. Before any live Cloud create, a trusted,
 * authenticated server must bind the new Cloud key to the approved cutover
 * epoch/session and persist it through timeout, retry and browser reload.
 * No route, DB read/write, worker or production authorization here.
 */
const T12_CLOUD_CLIENT_KEY_ADMISSION='T12_CLOUD_CLIENT_KEY_ADMISSION_ISOLATED_20260920';
const NEW=/^cld1_(\d{13})_([A-Za-z0-9_-]{16,80})$/;
function classifyT12ClientRequestKey(requestKey){
  const key=String(requestKey??'');
  if(!key||key.length>160||key!==key.trim()||/[\u0000-\u001f]/.test(key))
    return {kind:'REJECT',createAuthorized:false,reason:'invalid-client-key'};
  if(/^co_/.test(key)||/^TRENDOS_CREATE_ORDER_V1908_/.test(key)){
    return {kind:'LEGACY_REPLAY_ONLY',createAuthorized:false,
      reason:'historic-key-read-only-lookup-or-manual-reconciliation'};
  }
  const m=NEW.exec(key);
  if(!m)return {kind:'REJECT',createAuthorized:false,
    reason:'unsupported-client-key-namespace'};
  const t=Number(m[1]);
  if(!Number.isSafeInteger(t)||t<1500000000000)
    return {kind:'REJECT',createAuthorized:false,reason:'invalid-cloud-key-time'};
  return {kind:'CLOUD_SYNTHETIC_ELIGIBLE',createAuthorized:false,
    reason:'namespace-only-needs-auth-cutover-proof'};
}

return {classifyT12ClientRequestKey};
})();
const __t12Create=(function(buildCanonicalOrderCreateIntentV2,checkT12OrderCreateInputShape,classifyT12ClientRequestKey){
/*
 * TrendOS T12 — isolated Cloud-native CREATE transaction rehearsal.
 * ONLY t12_synth_* tables, NOT production. No Worker route or deploy import.
 * Does not assert canonical Apps Script parity (debt, open-order reuse, queue).
 * Never call this with production D1: the caller must inject a VERIFIED
 * separately isolated TEST database, not merely self-report boolean gates.
 */



const T12_CLOUD_NATIVE_SYNTHETIC_VERSION='T12_CLOUD_NATIVE_SYNTHETIC_CREATE_20260920';
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
async function createT12CloudNativeSynthetic(db,input={},actor='',gates={}){
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

return {createT12CloudNativeSynthetic};
})(__t12Contract.buildCanonicalOrderCreateIntentV2,__t12Input.checkT12OrderCreateInputShape,__t12Namespace.classifyT12ClientRequestKey);
const __t12Worker=(function(createT12CloudNativeSynthetic){
/*
 * T12 standalone TEST Worker candidate. NOT imported by production Worker,
 * not referenced by production Wrangler. DEFAULT OFF. NO production DB binding.
 * Dedicated NEW Cloudflare TEST D1 binding name: T12_SYNTHETIC_DB.
 * Do not deploy before owner confirms a separate newly created TEST database.
 * Only fabricated records permitted; never copy customers/orders/backup here.
 */

const T12_SYNTHETIC_TEST_ROUTE='/__t12/synthetic/order-create';
function json(data,status){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store'
  }});
}
const fail=(code,status=423)=>json({
  success:false,syntheticOnly:true,productionAuthorized:false,code
},status);
const enabled=x=>String(x||'').toLowerCase()==='true';
async function hasPrivateTestBearer(request,secret){
  const actual=String(request.headers.get('Authorization')||'');
  if(!actual.startsWith('Bearer ')||typeof secret!=='string'||secret.length<32)return false;
  const token=actual.slice(7);
  if(token.length<32||token.length>256)return false;
  const subtle=(/** @type {any} */ (globalThis)).crypto?.subtle;
  if(!subtle)return false;
  const enc=new TextEncoder();
  const [x,y]=await Promise.all([
    subtle.digest('SHA-256',enc.encode(token)),
    subtle.digest('SHA-256',enc.encode(secret))
  ]);
  const a=new Uint8Array(x),b=new Uint8Array(y);
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
async function handleT12SyntheticTestRequest(request,env={}){
  if(new URL(request.url).pathname!==T12_SYNTHETIC_TEST_ROUTE)
    return fail('test-route-not-found',404);
  if(request.method!=='POST')return fail('test-post-only',405);
  if(!enabled(env.T12_SYNTHETIC_TEST_ENABLED))
    return fail('test-disabled');
  // Refuse any accidentally copied production Worker binding/configuration.
  if(env.DB||env.APPS_SCRIPT_API_URL||env.EDGE_SESSION_SECRET||
     !env.T12_SYNTHETIC_DB||typeof env.T12_SYNTHETIC_DB.batch!=='function'||
     env.T12_SYNTHETIC_TEST_ATTESTATION!=='ISOLATED_T12_SYNTHETIC_ONLY')
    return fail('test-database-isolation-not-proven',503);
  if(!env.T12_SYNTHETIC_TEST_BEARER_SECRET||
     String(env.T12_SYNTHETIC_TEST_BEARER_SECRET).length<32)
    return fail('test-auth-not-configured',503);
  if(!await hasPrivateTestBearer(request,env.T12_SYNTHETIC_TEST_BEARER_SECRET))
    return fail('test-unauthorized',401);
  let p;
  try{p=await request.json();}catch{return fail('invalid-test-json',400);}
  if(!p||Object.prototype.toString.call(p)!=='[object Object]'||
     !String(p.customerName||'').startsWith('SYNTHETIC TEST ')||
     String(p.customerPhone||'')!=='01000000000'||
     !String(p.itemName||'').startsWith('TEST '))
    return fail('fabricated-test-records-only',400);
  const out=await createT12CloudNativeSynthetic(
    env.T12_SYNTHETIC_DB,p,'T12-SYNTHETIC-OPERATOR',{
      mode:'isolated-cloud-native-synthetic-qualification',
      allowSyntheticBusinessCreate:true,
      testDatabaseIsolationVerified:true,
      googleCreateFrozenInTest:true,
      r5MirrorFencedInTest:true,
      edgeSessionVerifiedInTest:true
    }
  );
  const status=out.success?(out.idempotent?200:201):
    (out.reason==='same-key-actor-or-payload-conflict'?409:
    (out.reason==='transaction-outcome-unknown-no-retry'||out.reason==='committed-data-not-verified-no-retry'?503:422));
  // No customer records, original private key/value backup or auth in log.
  return json(out,status);
}

return {handleT12SyntheticTestRequest};
})(__t12Create.createT12CloudNativeSynthetic);
export default {fetch:__t12Worker.handleT12SyntheticTestRequest};
