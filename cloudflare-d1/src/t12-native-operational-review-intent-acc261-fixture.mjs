/* ACC261: isolated, immutable signed OPERATIONAL REVIEW INTENT.
 * Explicit employee action, NOT order_line_approved, no financial authority.
 * Disposable SQLite only. NEVER import into production Worker.
 */
import {inspectOriginalNativeReviewerACC259} from './t12-native-department-review-acc259-sourceonly.mjs';
export const POLICY=Object.freeze({
 defaultMode:'OFF',fixtureOnly:true,sourceOnly:true,workerWired:false,
 realSignedFinancialApproval:false,customerOwnershipAttested:false,
 financeAuthorized:false,financeWrites:false,financeRelease:'NO_GO'
});
export const VERSION='ACC261_NATIVE_OPERATIONAL_REVIEW_INTENT_FIXTURE_V1';
export const DOMAIN='ACC261_OPERATIONAL_REVIEW_INTENT_NOT_FINANCE_V1\n';
export const FIXTURE_DDL=[
 "CREATE TABLE acc261_control(singleton INTEGER PRIMARY KEY CHECK(singleton=1),marker TEXT NOT NULL CHECK(marker='ACC261_DISPOSABLE_SQLITE_ONLY'),mode TEXT NOT NULL CHECK(mode='ISOLATED_SIGNED_REVIEW_SQLITE'))",
 "INSERT INTO acc261_control VALUES(1,'ACC261_DISPOSABLE_SQLITE_ONLY','ISOLATED_SIGNED_REVIEW_SQLITE')",
 "CREATE TABLE acc261_intents(event_id TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,order_id TEXT NOT NULL,line_id TEXT NOT NULL,department TEXT NOT NULL,actor TEXT NOT NULL,source_version INTEGER NOT NULL,payload_json TEXT NOT NULL,signature_hex TEXT NOT NULL CHECK(length(signature_hex)=64),created_at_ms INTEGER NOT NULL,UNIQUE(order_id,line_id,source_version))",
 "CREATE TRIGGER acc261_immutable BEFORE UPDATE ON acc261_intents BEGIN SELECT RAISE(ABORT,'ACC261_IMMUTABLE'); END",
 "CREATE TRIGGER acc261_no_delete BEFORE DELETE ON acc261_intents BEGIN SELECT RAISE(ABORT,'ACC261_NO_DELETE'); END"
].join(';\n')+';';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(x);
const sid=x=>typeof x==='string'&&/^[0-9]{4,18}$/.test(x);
const frozenFail=code=>Object.freeze({success:false,code,sourceOnly:true,
 fixtureOnly:true,realSignedFinancialApproval:false,
 financeAuthorized:false,customerOwnershipAttested:false,
 financeRelease:'NO_GO'});
const columns=['version','eventType','eventId','requestKey','orderId','lineId',
 'department','employeeUsername','sourceLineVersion','occurredAtMs',
 'sourceSystem','sourceOnly','fixtureOnly','customerOwnershipAttested',
 'realSignedFinancialApproval','financialAuthority','financeRelease'];
export function validReviewPayload(p){
 return p&&typeof p==='object'&&!Array.isArray(p)&&
  Object.keys(p).length===columns.length&&columns.every(k=>Object.hasOwn(p,k))&&
  p.version===VERSION&&p.eventType==='operational_review_intent'&&
  p.eventId==='acc261:review:'+p.orderId+':'+p.lineId+':'+p.requestKey&&
  sid(p.orderId)&&p.lineId.startsWith(p.orderId+'-')&&uuid(p.requestKey)&&
  ({'طباعة':'وائل','ليزر':'جابر'})[p.department]===p.employeeUsername&&
  Number.isSafeInteger(p.sourceLineVersion)&&p.sourceLineVersion>=0&&
  Number.isSafeInteger(p.occurredAtMs)&&p.occurredAtMs>0&&
  p.sourceSystem==='trendos_t12_native'&&p.sourceOnly===true&&
  p.fixtureOnly===true&&p.customerOwnershipAttested===false&&
  p.realSignedFinancialApproval===false&&p.financialAuthority===false&&
  p.financeRelease==='NO_GO';
}
function canonical(p){
 if(!validReviewPayload(p))throw Error('ACC261_NOT_NONFINANCIAL_REVIEW');
 return JSON.stringify(Object.fromEntries(columns.map(k=>[k,p[k]])));
}
async function key(secret){
 if(typeof secret!=='string'||secret.length<32||secret.length>512)
  throw Error('ACC261_DEDICATED_SECRET_REQUIRED');
 return crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
const toHex=a=>Array.from(new Uint8Array(a),b=>b.toString(16).padStart(2,'0')).join('');
export async function signReview(secret,p){
 return toHex(await crypto.subtle.sign('HMAC',await key(secret),
  new TextEncoder().encode(DOMAIN+canonical(p))));
}
export async function verifyReview(secret,p,sig){
 if(typeof sig!=='string'||!/^[0-9a-f]{64}$/.test(sig))return false;
 try{return await crypto.subtle.verify('HMAC',await key(secret),
   Uint8Array.from(sig.match(/../g),x=>parseInt(x,16)),
   new TextEncoder().encode(DOMAIN+canonical(p)));
 }catch{return false;}
}
const get=(db,key)=>db.prepare(
 'SELECT event_id AS eventId,request_key AS requestKey,order_id AS orderId,'+
 'line_id AS lineId,department,actor,source_version AS sourceVersion,'+
 'payload_json AS payloadJson,signature_hex AS signatureHex '+
 'FROM acc261_intents WHERE request_key=? LIMIT 1').get(key);
const same=(r,p,s)=>r?.eventId===p.eventId&&r.requestKey===p.requestKey&&
 r.orderId===p.orderId&&r.lineId===p.lineId&&
 r.department===p.department&&r.actor===p.employeeUsername&&
 r.sourceVersion===p.sourceLineVersion&&r.payloadJson===canonical(p)&&
 r.signatureHex===s;
const success=(p,s,replayed)=>Object.freeze({
 success:true,receipt:p,signatureHex:s,idempotent:replayed,
 eventType:'operational_review_intent',sourceOnly:true,fixtureOnly:true,
 realSignedFinancialApproval:false,customerOwnershipAttested:false,
 financeAuthorized:false,invoiceAuthorized:false,connectorEventPublished:false,
 financeRelease:'NO_GO'
});
const stateSQL=
 'SELECT COALESCE(r.version,0) AS sourceVersion, '+
 'COALESCE(r.status,l.status) AS status,l.assigned_to AS assignedTo,'+
 'l.department AS department FROM t12_prod_lines l '+
 'LEFT JOIN t12_prod_line_runtime r ON r.line_id=l.line_id AND r.order_id=l.order_id '+
 'WHERE l.line_id=? AND l.order_id=? LIMIT 2';
/** Original verifier is injected server-side from original pinned TrendOS.
 * fixtureDb must be disposable node:sqlite, never an actual production DB.
 */
export async function recordIsolatedReview({
 env,fixtureDb,verifyOriginalNativeSession,orderId,lineId,username,
 employeeToken,expectedVersion,requestKey,decision,nowMs=Date.now(),mode
}={}){
 if(mode!=='ISOLATED_SIGNED_REVIEW_SQLITE'||
    env?.ACC261_MODE!=='ISOLATED_SIGNED_REVIEW_SQLITE')
  return frozenFail('ACC261_DEFAULT_OFF');
 if(!fixtureDb||typeof fixtureDb.exec!=='function'||
    typeof fixtureDb.prepare!=='function'||!sid(orderId)||!uuid(requestKey)||
    typeof lineId!=='string'||!lineId.startsWith(orderId+'-')||
    decision!=='CONFIRM_OPERATIONAL_REVIEW_ONLY'||
    !Number.isSafeInteger(expectedVersion)||expectedVersion<0||
    !Number.isSafeInteger(nowMs)||nowMs<=0||
    typeof verifyOriginalNativeSession!=='function')
  return frozenFail('ACC261_EXPLICIT_SOURCE_REVIEW_FIELDS_REQUIRED');
 try{
  const ctrl=fixtureDb.prepare('SELECT marker,mode FROM acc261_control WHERE singleton=1').get();
  if(ctrl?.marker!=='ACC261_DISPOSABLE_SQLITE_ONLY'||
     ctrl.mode!=='ISOLATED_SIGNED_REVIEW_SQLITE')
   return frozenFail('ACC261_DISPOSABLE_MARKER_MISSING');
 }catch{return frozenFail('ACC261_DISPOSABLE_MARKER_MISSING');}
 const secret=env?.ACC261_HMAC_SECRET;
 try{await key(secret)}catch{return frozenFail('ACC261_HMAC_NOT_CONFIGURED')}
 const verdict=await inspectOriginalNativeReviewerACC259({
  env,orderId,lineId,username,employeeToken,nowMs,
  verifyOriginalNativeSession,mode:'ISOLATED_NATIVE_REVIEW_READONLY'
 });
 if(verdict.success!==true||verdict.financeAuthorized!==false||
    verdict.realSignedLineApproval!==false||
    verdict.currentOperationalLineVersion!==expectedVersion)
  return frozenFail('ACC261_NATIVE_REVIEW_OR_VERSION_DENIED');
 const p={version:VERSION,eventType:'operational_review_intent',
  eventId:'acc261:review:'+orderId+':'+lineId+':'+requestKey,
  requestKey,orderId,lineId,department:verdict.department,
  employeeUsername:verdict.employeeUsername,
  sourceLineVersion:expectedVersion,occurredAtMs:nowMs,
  sourceSystem:'trendos_t12_native',sourceOnly:true,fixtureOnly:true,
  customerOwnershipAttested:false,realSignedFinancialApproval:false,
  financialAuthority:false,financeRelease:'NO_GO'};
 let signature;
 try{signature=await signReview(secret,p)}
 catch{return frozenFail('ACC261_SIGN_FAILED')}
 let begun=false;
 try{
  fixtureDb.exec('BEGIN IMMEDIATE');begun=true;
  // Revalidate original native session inside atomic disposable transaction.
  const auth=await verifyOriginalNativeSession(username,employeeToken,env,nowMs,{readOnly:true});
  const user=auth?.body?.user;
  const role=({'طباعة':'print','ليزر':'laser'})[verdict.department];
  if(auth?.hit!==true||auth?.authSource!=='d1-native-employee-v1'||
     !user||user.active!==true||user.mustChange===true||
     user.username!==username||user.role!==role||
     user.department!==verdict.department||
     !Array.isArray(user.screens)||!user.screens.includes(role)||
     !Number.isSafeInteger(auth.expiresAtMs)||auth.expiresAtMs<=nowMs)
   throw Error('ACC261_SOURCE_SESSION_REVOKED');
  const state=fixtureDb.prepare(stateSQL).all(lineId,orderId);
  if(state.length!==1||state[0].sourceVersion!==expectedVersion||
     state[0].assignedTo!==username||
     state[0].department!==verdict.department||
     !['طلب جديد','بدأ التنفيذ','تحت التنفيذ','جاهز للاستلام','تم التسليم'].includes(state[0].status))
   throw Error('ACC261_SOURCE_REVISION_OR_STATUS_CHANGED');
  const old=get(fixtureDb,requestKey);
  if(old){
   if(!same(old,p,signature))throw Error('ACC261_REPLAY_CONFLICT');
   fixtureDb.exec('COMMIT');begun=false;
   return success(p,signature,true);
  }
  fixtureDb.prepare(
   'INSERT INTO acc261_intents(event_id,request_key,order_id,line_id,'+
   'department,actor,source_version,payload_json,signature_hex,created_at_ms) '+
   'VALUES (?,?,?,?,?,?,?,?,?,?)').run(
   p.eventId,requestKey,orderId,lineId,p.department,username,
   expectedVersion,canonical(p),signature,nowMs);
  if(!same(get(fixtureDb,requestKey),p,signature))
   throw Error('ACC261_STORED_DATA_INDETERMINATE');
  fixtureDb.exec('COMMIT');begun=false;
  return success(p,signature,false);
 }catch{
  if(begun)try{fixtureDb.exec('ROLLBACK')}catch{}
  return frozenFail('ACC261_REPLAY_REVISION_SESSION_OR_TX_CONFLICT_NO_RETRY');
 }
}
