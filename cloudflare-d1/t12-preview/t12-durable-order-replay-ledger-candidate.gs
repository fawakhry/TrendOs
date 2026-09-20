/**
 * TrendOS isolated candidate: durable create-order replay ledger V1, 2026-09-20.
 * NOT installed/wired in production. No Apps Script deployment or trigger.
 *
 * This script intentionally does NOT create its own sheet, modify Code.gs,
 * mutate Script Properties, or call createManualOrder_ itself.
 * All lookup/reserve/commit calls require the ACTUAL acquired global ScriptLock
 * object from the original caller; absent/unacquired lock aborts, never writes.
 * Key identity is GLOBAL per client request ID. Authenticated principal is\n * included in the payload digest: same key from another account blocks as\n * CONFLICT rather than allocating another Order ID or replaying private data.\n * A later separately approved integration must verify the deployed live source
 * and create a protected "TRENDOS_ORDER_REQUEST_LEDGER_V1" tab with EXACT headers.
 *
 * Integration contract (original global ScriptLock MUST already be held):
 * 1. Authorize caller and read V1908 legacy property (read-only) for old keys.
 * 2. Early lookup below for every key: COMMITTED=>replay, PENDING=>STOP,
 *    CONFLICT=>STOP. No ledger/legacy match=>continue validation.
 * 3. Complete all pure validations + duplicate checks; just BEFORE *any*
 *    business mutation / order-number allocation, call reserve below.
 *    Existing reservation always stops/replays, it never resumes writes.
 * 4. After all business writes + side effects, call commit with full response.
 *    If commit/flush fails, return UNKNOWN/ERROR and do not retry creation.
 * 5. On qualified cutover, stop calling the old V1908 setProperty only for
 *    newly ledger-reserved keys. Never clear old historical keys by assumption.
 *
 * A crash between business writes and ledger commit leaves PENDING and blocks
 * automated retries until a separately authorized reconciliation is proven.
 * This is fail-closed, NOT transactional across multiple Sheets operations.
 *
 * WARNING: no actual new order can be created using this standalone file;
 * only a narrowly reviewed live Code.gs integration can enable this design.
 */
function trendosDurableReplayV1Headers_() {
  return ['keyDigest','payloadDigest','state','responseJson','orderId',
    'lineId','createdAt','updatedAt','schemaVersion'];
}
function trendosDurableReplayV1Hash_(s) {
  var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    String(s),Utilities.Charset.UTF_8);
  return bytes.map(function(b) {
    return ('0'+(b<0?b+256:b).toString(16)).slice(-2);
  }).join('');
}
function trendosDurableReplayV1Identity_(requestKey,principal,requestParams) {
  var key=String(requestKey==null?'':requestKey).trim();
  var who=String(principal==null?'':principal).trim();
  if(!who||!key||key.length>160||/[\x00-\x1f]/.test(key))
    throw new Error('DURABLE_REPLAY_INVALID_REQUEST_KEY_OR_PRINCIPAL');
  var params=requestParams||{},safe=Object.create(null);
  if(Object.prototype.toString.call(params)!=='[object Object]')
    throw new Error('DURABLE_REPLAY_PAYLOAD_NOT_OBJECT');
  var omitted={username:true,token:true,sessionToken:true,clientRequestId:true,
    requestId:true,idempotencyKey:true,idempotency_key:true,callback:true};
  var names=Object.keys(params).filter(function(k){return !omitted[k];}).sort();
  if(names.length>120)throw new Error('DURABLE_REPLAY_PAYLOAD_TOO_LARGE');
  names.forEach(function(name) {
    var val=params[name];
    if(Array.isArray(val)) {
      if(val.length>100)throw new Error('DURABLE_REPLAY_PAYLOAD_TOO_LARGE');
      safe[name]=val.map(function(x){return String(x==null?'':x);});
    } else if(val==null||typeof val==='string'||typeof val==='number'||
              typeof val==='boolean') safe[name]=String(val==null?'':val);
    else throw new Error('DURABLE_REPLAY_UNSUPPORTED_PAYLOAD_TYPE');
    if(JSON.stringify(safe[name]).length>8000)
      throw new Error('DURABLE_REPLAY_PAYLOAD_TOO_LARGE');
  });
  return {keyDigest:trendosDurableReplayV1Hash_(JSON.stringify(['v1',key])),
    payloadDigest:trendosDurableReplayV1Hash_(JSON.stringify(['v1',who,safe]))};
}
function trendosDurableReplayV1Sheet_(ss) {
  if(!ss||ss.getId()!=='1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI')
    throw new Error('DURABLE_REPLAY_WRONG_WORKBOOK');
  var sheet=ss.getSheetByName('TRENDOS_ORDER_REQUEST_LEDGER_V1');
  if(!sheet)throw new Error('DURABLE_REPLAY_LEDGER_NOT_PROVISIONED');
  var headers=trendosDurableReplayV1Headers_();
  if(sheet.getLastColumn()!==headers.length||
     JSON.stringify(sheet.getRange(1,1,1,headers.length).getDisplayValues()[0])!==
       JSON.stringify(headers))
    throw new Error('DURABLE_REPLAY_LEDGER_HEADER_MISMATCH');
  return sheet;
}
function trendosDurableReplayV1Find_(sheet,keyDigest) {
  var n=sheet.getLastRow()-1;
  if(n<0)throw new Error('DURABLE_REPLAY_MISSING_HEADERS');
  if(n===0)return null;
  // Bounded evidence check: an oversized ledger needs a qualified indexed
  // storage backend. Never interpret a partial scan as "request not present".
  if(n>100000)throw new Error('DURABLE_REPLAY_LEDGER_TOO_LARGE');
  var matches=sheet.getRange(2,1,n,1).createTextFinder(keyDigest)
    .matchEntireCell(true).findAll();
  if(matches.length>1)throw new Error('DURABLE_REPLAY_DUPLICATE_DIGEST');
  if(!matches.length)return null;
  var rowNumber=matches[0].getRow();
  var cols=sheet.getRange(rowNumber,1,1,9).getValues()[0];
  if(String(cols[0])!==keyDigest||String(cols[8])!=='1')
    throw new Error('DURABLE_REPLAY_ROW_INVALID');
  return {rowNumber:rowNumber,payloadDigest:String(cols[1]),
    state:String(cols[2]),responseJson:String(cols[3]||''),
    orderId:String(cols[4]||''),lineId:String(cols[5]||'')};
}
function trendosDurableReplayV1Interpret_(row,payloadDigest) {
  if(!row)return {kind:'NEW'};
  if(row.payloadDigest!==payloadDigest)return {kind:'CONFLICT',
    errorCode:'DURABLE_REPLAY_SAME_KEY_DIFFERENT_PAYLOAD'};
  if(row.state==='PENDING')return {kind:'PENDING',
    errorCode:'DURABLE_REPLAY_PENDING_RECONCILIATION'};
  if(row.state!=='COMMITTED'||!row.responseJson||!row.orderId||!row.lineId)
    throw new Error('DURABLE_REPLAY_ROW_INVALID');
  var response;
  try {response=JSON.parse(row.responseJson);}catch(e){
    throw new Error('DURABLE_REPLAY_RESPONSE_INVALID');
  }
  if(!response||response.success!==true||
     String(response.orderId||'')!==row.orderId||
     String(response.lineId||'')!==row.lineId)
    throw new Error('DURABLE_REPLAY_RESPONSE_MISMATCH');
  return {kind:'REPLAY',response:Object.assign({},response,{
    idempotentReplay:true,duplicatePrevented:true
  })};
}
function trendosDurableReplayV1RequireLock_(heldLock) {
  if (!heldLock || typeof heldLock.hasLock!=='function' ||
      heldLock.hasLock()!==true)
    throw new Error('DURABLE_REPLAY_GLOBAL_SCRIPT_LOCK_REQUIRED');
}
/** Original caller must pass its currently held GLOBAL create-order ScriptLock. */
function trendosDurableReplayV1Lookup_(ss,identity,heldLock) {
  trendosDurableReplayV1RequireLock_(heldLock);
  if(!identity||!/^[0-9a-f]{64}$/.test(identity.keyDigest)||
     !/^[0-9a-f]{64}$/.test(identity.payloadDigest))
    throw new Error('DURABLE_REPLAY_INVALID_IDENTITY');
  var sheet=trendosDurableReplayV1Sheet_(ss);
  return trendosDurableReplayV1Interpret_(
    trendosDurableReplayV1Find_(sheet,identity.keyDigest),
    identity.payloadDigest);
}
/** Reserve before order ID allocation or any business write; one-time only. */
function trendosDurableReplayV1Reserve_(ss,identity,heldLock) {
  trendosDurableReplayV1RequireLock_(heldLock);
  var sheet=trendosDurableReplayV1Sheet_(ss);
  var state=trendosDurableReplayV1Lookup_(ss,identity,heldLock);
  if(state.kind!=='NEW')return state;
  var at=new Date().toISOString(),headers=trendosDurableReplayV1Headers_();
  sheet.appendRow([identity.keyDigest,identity.payloadDigest,'PENDING','','','',
    at,at,'1']);
  SpreadsheetApp.flush();
  var verified=trendosDurableReplayV1Find_(sheet,identity.keyDigest);
  if(!verified||verified.state!=='PENDING'||
     verified.payloadDigest!==identity.payloadDigest)
    throw new Error('DURABLE_REPLAY_RESERVATION_UNVERIFIED_NO_CREATE');
  return {kind:'RESERVED',rowNumber:verified.rowNumber,
    keyDigest:identity.keyDigest,payloadDigest:identity.payloadDigest};
}
/** Commit ONLY the corresponding PENDING reservation after writes are done. */
function trendosDurableReplayV1Commit_(ss,reservation,response,heldLock) {
  trendosDurableReplayV1RequireLock_(heldLock);
  if(!reservation||reservation.kind!=='RESERVED'||
     !response||response.success!==true||
     !String(response.orderId||'').trim()||
     !String(response.lineId||'').trim())
    throw new Error('DURABLE_REPLAY_INVALID_COMMIT');
  var sheet=trendosDurableReplayV1Sheet_(ss),
      row=trendosDurableReplayV1Find_(sheet,reservation.keyDigest);
  if(!row||row.rowNumber!==reservation.rowNumber||
     row.payloadDigest!==reservation.payloadDigest||
     row.state!=='PENDING'||row.orderId||row.lineId||row.responseJson)
    throw new Error('DURABLE_REPLAY_COMMIT_MISMATCH_NO_RETRY');
  var json=JSON.stringify(response);
  if(!json||json.length>24000)
    throw new Error('DURABLE_REPLAY_RESPONSE_TOO_LARGE_NO_RETRY');
  sheet.getRange(row.rowNumber,4,1,3).setValues([
    [json,String(response.orderId),String(response.lineId)]
  ]);
  SpreadsheetApp.flush();
  var staged=trendosDurableReplayV1Find_(sheet,reservation.keyDigest);
  if(!staged||staged.rowNumber!==reservation.rowNumber||
     staged.payloadDigest!==reservation.payloadDigest||
     staged.state!=='PENDING'||staged.responseJson!==json||
     staged.orderId!==String(response.orderId)||
     staged.lineId!==String(response.lineId))
    throw new Error('DURABLE_REPLAY_STAGED_RESPONSE_UNVERIFIED_NO_RETRY');
  // State COMMITTED is written last. If the status write is interrupted,
  // next retry still sees PENDING; a human must reconcile, never re-create.
  sheet.getRange(row.rowNumber,3).setValue('COMMITTED');
  sheet.getRange(row.rowNumber,8).setValue(new Date().toISOString());
  SpreadsheetApp.flush();
  var confirmed=trendosDurableReplayV1Interpret_(
    trendosDurableReplayV1Find_(sheet,reservation.keyDigest),
    reservation.payloadDigest);
  if(confirmed.kind!=='REPLAY')
    throw new Error('DURABLE_REPLAY_COMMIT_UNVERIFIED_NO_RETRY');
  return {kind:'COMMITTED',rowNumber:row.rowNumber};
}
/**
 * Manual-only independent safeguard; no automatic recovery of PENDING.
 * Any future operator reconcile must prove exact request key, actor, content,
 * all Order+Line writes and side effects; never auto-reissue a request.
 */
