/*
 * Entry667 — native customer draft SUBMIT PREFLIGHT, not production order submit.
 * SOURCE-ONLY / OFF. Reuses existing T12 shadow order intent and key namespace.
 * Never imports or calls createT12GeneralOrder(), Sheets, Apps Script, R2, or
 * Printshop. A customer bearer cannot become an employee authorizer.
 */
import { fingerprintCustomerSessionV0 } from './customer-portal-native-orders-v0.mjs';
import { buildT12OrderCreateShadowIntent } from './t12-order-create-shadow-intent.mjs';
import { classifyT12ClientRequestKey } from './t12-cloud-client-key-admission.mjs';
import { customerLaneIdentityMaterial } from './t12-customer-lane-policy.mjs';

export const CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_VERSION_V0='ENTRY667_CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_OFF_V0';
const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const draftValid=x=>typeof x==='string'&&/^CDR-[a-f0-9]{32}$/.test(x);
const deny=(code,status=409)=>({status,body:{success:false,code,readOnly:true,officialOrderCreated:false,productionWriteAuthorized:false}});
export const CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0=`
SELECT d.draft_id AS draftId,d.created_at_ms AS createdAtMs,
       d.state AS draftState,a.customer_id AS customerId,
       c.customer_name AS customerName,c.phone AS customerPhone,
       c.source AS customerSource
  FROM customer_portal_native_drafts_v1 d
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=d.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_sessions_v1 s ON s.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
 WHERE d.draft_id=? AND d.state='DRAFT'
   AND s.token_fingerprint_hex=? AND s.source='d1-customer-native'
   AND s.revoked_at_ms IS NULL
   AND s.issued_at_ms>0 AND s.issued_at_ms<=?
   AND s.expires_at_ms>? AND s.expires_at_ms>s.issued_at_ms
   AND s.expires_at_ms-s.issued_at_ms<=28800000
   AND s.session_version=a.session_version
   AND a.state='ACTIVE' AND a.must_change=0
   AND a.password_scheme='pbkdf2-sha256-v1'
   AND a.password_iterations=100000
   AND length(trim(a.verified_enrollment_ref))>0
   AND c.active='نعم' AND c.source='cloud-native'
   AND trim(coalesce(c.legacy_chat_code,''))=a.portal_code
   AND ctl.marker='ENTRY654_CUSTOMER_PORTAL_NATIVE_V1'
   AND ctl.policy_epoch>=1 AND ctl.mode='GENERAL'
   AND NOT EXISTS(SELECT 1 FROM t12_customers other
     WHERE other.customer_id<>a.customer_id AND other.active='نعم'
       AND trim(coalesce(other.legacy_chat_code,''))=a.portal_code)
 LIMIT 1
`;
export const CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0=`
SELECT i.item_id AS itemId,i.ordinal AS ordinal,
       i.department AS department,i.item_name AS itemName,
       i.qty AS qty,i.notes AS notes,
       i.heat_press AS heatPress,i.fly_print AS flyPrint
  FROM customer_portal_native_draft_items_v1 i
 WHERE i.draft_id=?
 ORDER BY i.ordinal ASC
 LIMIT 51
`;
// Same immutable Cloud request key as the canonical T12 writer. An existing
// PREPARED/COMMITTED request is never eligible for another customer submit.
export const CUSTOMER_DRAFT_SUBMIT_EXISTING_T12_REQUEST_SQL_V0=`
SELECT l.status AS status
  FROM customer_portal_native_drafts_v1 d
  JOIN t12_prod_request_ledger l
    ON l.request_key=('cld1_' || CAST(d.created_at_ms AS TEXT) || '_' || substr(d.draft_id,5))
 WHERE d.draft_id=? LIMIT 1
`;
export const CUSTOMER_DRAFT_SUBMIT_FILES_SQL_V0=`
SELECT COUNT(*) AS fileCount,
       COALESCE(SUM(CASE WHEN state<>'READY' THEN 1 ELSE 0 END),0) AS notReady
  FROM customer_portal_native_draft_files_v1
 WHERE draft_id=?
`;

// Preflight is deliberately restricted to ONE line. T12 General Create can
// accept 1 or 2 lanes, but its 2-lane expansion refers to one item mirrored
// across print/laser, NOT two independent customer items. Avoid silent loss.
export async function preflightNativeCustomerDraftSubmitV0({db,token,secret,draftId,nowMs}={}){
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function'||
     typeof secret!=='string'||secret.length<32||
     !Number.isSafeInteger(nowMs)||nowMs<1500000000000)
    return deny('SUBMIT_PREFLIGHT_BACKEND_UNAVAILABLE',503);
  if(!hex64(token))return deny('CUSTOMER_SESSION_REJECTED',401);
  if(!draftValid(draftId))return deny('INVALID_DRAFT_REFERENCE',400);
  try{
    const mac=await fingerprintCustomerSessionV0(token,secret);
    // One read-only D1 transaction prevents a false-positive preflight from
    // cross-query draft/file/ledger changes. T12 ledger key is constructed
    // INSIDE SQLite from the same authoritative draft creation timestamp.
    // Preflight still does not freeze rows after this transaction.
    const batch=await db.batch([
      db.prepare(CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0)
        .bind(draftId,mac,nowMs,nowMs),
      db.prepare(CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0).bind(draftId),
      db.prepare(CUSTOMER_DRAFT_SUBMIT_FILES_SQL_V0).bind(draftId),
      db.prepare(CUSTOMER_DRAFT_SUBMIT_EXISTING_T12_REQUEST_SQL_V0)
        .bind(draftId)
    ]);
    if(!Array.isArray(batch)||batch.length!==4||
       batch.some(r=>!r||r.success!==true||!Array.isArray(r.results)))
      return deny('SUBMIT_PREFLIGHT_TRANSACTION_UNVERIFIED',503);
    const owners=batch[0].results;
    if(owners.length!==1)return deny('CUSTOMER_DRAFT_NOT_AUTHORIZED_OR_NOT_OPEN',404);
    const owner=owners[0];
    if(!owner||owner.draftId!==draftId||!owner.customerId)
      return deny('CUSTOMER_DRAFT_NOT_AUTHORIZED_OR_NOT_OPEN',404);
    const itemRows=batch[1].results;
    if(itemRows.length!==1)
      return deny('T12_CUSTOMER_MULTI_ITEM_SUBMIT_NOT_YET_SUPPORTED');
    const fileRows=batch[2].results;
    if(fileRows.length!==1)return deny('DRAFT_FILE_READINESS_UNKNOWN',503);
    const files=fileRows[0];
    if(!files||files.fileCount==null||files.notReady==null||
       !Number.isSafeInteger(Number(files.fileCount))||
       !Number.isSafeInteger(Number(files.notReady))||
       Number(files.fileCount)<0||Number(files.notReady)<0)
      return deny('DRAFT_FILE_READINESS_UNKNOWN',503);
    // T12 general create currently does not attach R2 draft files. Reject
    // ANY attachment, including READY, instead of silently discarding it.
    if(Number(files.fileCount)!==0||Number(files.notReady)!==0)
      return deny('T12_CUSTOMER_FILE_HANDOFF_NOT_YET_SUPPORTED');
    const item=itemRows[0];
    if(!item||!/^CDI-[a-f0-9]{32}$/.test(String(item.itemId))||
       Number(item.ordinal)!==1||
       !['طباعة','ليزر'].includes(item.department)||
       !Number.isSafeInteger(Number(item.qty))||Number(item.qty)<1||Number(item.qty)>99)
      return deny('CUSTOMER_DRAFT_ITEM_CONTRACT_INVALID');
    // Exact preservation: T12 cannot accept laser-specific press/quick-print
    // flags; reject instead of silently dropping them during normalization.
    const press=Number(item.heatPress),fly=Number(item.flyPrint);
    if(!Number.isSafeInteger(press)||![0,1].includes(press)||
       !Number.isSafeInteger(fly)||![0,1].includes(fly)||
       (item.department==='ليزر'&&(press!==0||fly!==0)))
      return deny('T12_CUSTOMER_DRAFT_UNSUPPORTED_LINE_FLAGS');
    const created=Number(owner.createdAtMs);
    if(!Number.isSafeInteger(created)||created<1500000000000||
       created>nowMs+60000)return deny('CUSTOMER_DRAFT_CREATE_EPOCH_INVALID');
    // Stable T12 cloud namespace, tied to immutable draft ID, never supplied
    // by the customer. This DOES NOT grant Single-Writer/Create authority.
    const requestKey='cld1_'+created+'_'+draftId.slice(4);
    if(classifyT12ClientRequestKey(requestKey).kind!=='CLOUD_SYNTHETIC_ELIGIBLE')
      return deny('T12_CREATE_NAMESPACE_INELIGIBLE');
    // Same normalized T12 contract as employee General Create. The customer
    // name/phone come ONLY from verified D1, never from request/legacy token.
    const candidate={
      clientRequestId:requestKey,
      customerMode:'registered',
      customerName:String(owner.customerName||''),
      customerPhone:String(owner.customerPhone||''),
      department:item.department,itemName:String(item.itemName||''),
      qty:Number(item.qty),priority:'عادي',
      heatPress:Number(item.heatPress)===1?'نعم':'لا',
      flyPrint:Number(item.flyPrint)===1?'نعم':'لا',
      notes:String(item.notes||''),source:'customer-native-draft'
    };
    const intent=buildT12OrderCreateShadowIntent(candidate,'customer-draft-review');
    if(!intent.valid||intent.lines.length!==1||
       intent.identity.mode!=='registered'||
       intent.requestKey!==requestKey||
       intent.lines[0].itemName!==item.itemName||
       intent.lines[0].department!==item.department||
       intent.lines[0].heatPress!==(press===1?'نعم':'لا')||
       intent.lines[0].flyPrint!==(fly===1?'نعم':'لا')||
       intent.order.notes!==String(item.notes||'')||
       intent.order.source!=='customer-native-draft'||
       Number(intent.lines[0].qty)!==Number(item.qty))
      return deny('T12_CANONICAL_CREATE_CONTRACT_REFUSED');
    // T12's real writer requires a strong registered customer-lane identity.
    // Its earlier input normalizer permits weak phones; avoid false-positive
    // preflight for an identity that the actual single writer would refuse.
    let laneIdentity;
    try{laneIdentity=customerLaneIdentityMaterial(intent.identity);}
    catch{return deny('T12_CUSTOMER_STRONG_IDENTITY_REQUIRED');}
    if(!laneIdentity.startsWith('registered:'))
      return deny('T12_CUSTOMER_STRONG_IDENTITY_REQUIRED');
    // T12 request ledger is the existing idempotency authority. A request
    // whose outcome may already have committed requires trusted readback;
    // never advise the client to create again (including PREPARED/unknown).
    if(batch[3].results.length!==0)
      return deny('T12_EXISTING_REQUEST_REQUIRES_TRUSTED_RECONCILIATION');
    // No candidate payload/PII sent to the browser. A future trusted
    // delegated actor must recheck all records in one authoritative
    // transaction before create; this preflight is NOT that transaction.
    return {status:200,body:{
      success:true,version:CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_VERSION_V0,
      source:'t12-canonical-shadow-preflight',readOnly:true,
      transactionalReadBatch:true,snapshotSealed:false,
      preflightEligible:true,eligibleItemCount:1,
      needsTrustedEmployeeDelegate:true,
      needsSingleWriterFinanceProof:true,
      officialOrderCreated:false,productionWriteAuthorized:false
    }};
  }catch{return deny('SUBMIT_PREFLIGHT_SCHEMA_OR_READ_UNAVAILABLE',503);}
}
export const CUSTOMER_DRAFT_SUBMIT_PREFLIGHT_POLICY_V0=Object.freeze({
  sourceOnly:true,workerEntryWired:false,httpRouteAvailable:false,
  officialOrderCreatorCalled:false,productionOrderCreated:false,
  maxCompatibleItems:1,filesAllowed:0,readOnlyD1Batch:true,
  snapshotSealed:false,googleFallback:false,
  financeAuthorityGranted:false,employeeCreateDelegationAvailable:false,
  productionRelease:'NO_GO',zeroGoogleComplete:false
});
