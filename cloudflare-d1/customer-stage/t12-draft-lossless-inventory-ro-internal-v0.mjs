/* Zero Google — customer draft FULL INVENTORY observation, source-only OFF.
 *
 * One canonical read-only view of every customer draft item (max 50) and all
 * existing private file + immutable quarantine metadata (max 5 per item).
 * Reuses existing T12 owner-scoped session/ledger SQL and exact D1 tables.
 * This is NOT T12 submit, writer delegation, transaction seal, R2 byte read,
 * malware clearance, financial posting or approval to print. NOT imported in
 * Stage or production Workers. Never sends customer/order/file data to client.
 */
import {fingerprintCustomerSessionV0} from '../src/customer-portal-native-orders-v0.mjs';
import {
  CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0 as OWNER_SQL,
  CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0 as ITEMS_SQL,
  CUSTOMER_DRAFT_SUBMIT_EXISTING_T12_REQUEST_SQL_V0 as LEDGER_SQL
} from '../src/customer-portal-native-submit-preflight-v0.mjs';

export const T12_DRAFT_FULL_INVENTORY_SOURCE_VERSION_V0=
  'ZERO_GOOGLE_T12_DRAFT_FULL_INVENTORY_RO_OFF_V0';
const MAX_ITEMS=50,MAX_FILES_PER_ITEM=5,MAX_FILES=MAX_ITEMS*MAX_FILES_PER_ITEM;
const DRAFT=/^CDR-[a-f0-9]{32}$/;
const ITEM=/^CDI-[a-f0-9]{32}$/;
const FILE=/^CDF-[a-f0-9]{32}$/;
const HEX=/^[a-f0-9]{64}$/;
const MIMES=new Set(['image/png','image/jpeg','application/pdf']);
const DENY=(code)=>({
  success:false,code,source:T12_DRAFT_FULL_INVENTORY_SOURCE_VERSION_V0,
  sourceOnly:true,readOnly:true,snapshotSealed:false,
  t12SingleWriterInvoked:false,officialOrderCreated:false,
  productionWriteAuthorized:false,malwareScanComplete:false,
  eligibleForT12FileHandoff:false,printReleaseAuthorized:false
});
const int=x=>typeof x==='number'&&Number.isSafeInteger(x);
const values=(x)=>x&&x.success===true&&Array.isArray(x.results)?x.results:null;

// The customer scope is resolved exclusively by the existing native D1 HMAC
// session, account, customer and T12 legacy-code uniqueness joins in OWNER_SQL.
export const T12_DRAFT_INVENTORY_FILES_SQL_V0=`
SELECT f.file_id AS fileId,f.draft_id AS draftId,f.item_id AS itemId,
       f.sha256_hex AS sha256Hex,f.byte_size AS byteSize,
       f.content_type AS contentType,f.r2_object_key AS objectKey,
       f.state AS state,f.updated_at_ms AS updatedAtMs
  FROM customer_portal_native_draft_files_v1 f
  JOIN customer_portal_native_drafts_v1 d ON d.draft_id=f.draft_id
  JOIN customer_portal_native_draft_items_v1 i
    ON i.item_id=f.item_id AND i.draft_id=f.draft_id
 WHERE f.draft_id=? AND d.customer_id=? AND f.customer_id=d.customer_id
   AND d.state='DRAFT'
 ORDER BY f.item_id ASC,f.file_id ASC
 LIMIT 251
`;
export const T12_DRAFT_INVENTORY_QUARANTINE_SQL_V0=`
SELECT q.file_id AS fileId,q.draft_id AS draftId,q.item_id AS itemId,
       q.sha256_hex AS sha256Hex,q.byte_size AS byteSize,
       q.content_type AS contentType,q.disposition AS disposition,
       q.scan_completed AS scanCompleted,
       q.print_release_authorized AS printReleaseAuthorized
  FROM customer_portal_native_file_quarantine_v1 q
  JOIN customer_portal_native_draft_files_v1 f ON f.file_id=q.file_id
 WHERE f.draft_id=? AND f.customer_id=? AND q.customer_id=f.customer_id
   AND q.draft_id=f.draft_id AND q.item_id=f.item_id
 ORDER BY q.item_id ASC,q.file_id ASC
 LIMIT 251
`;

function checkItems(rows,draftId){
  if(!rows.length)return 'T12_DRAFT_INVENTORY_NO_ITEMS';
  if(rows.length>MAX_ITEMS)return 'T12_DRAFT_INVENTORY_MORE_THAN_50_ITEMS';
  const ids=new Set();
  for(let j=0;j<rows.length;j++){
    const x=rows[j];
    if(!x||!ITEM.test(x.itemId)||ids.has(x.itemId)||
       !int(x.ordinal)||x.ordinal!==j+1||
       !['طباعة','ليزر'].includes(x.department)||
       typeof x.itemName!=='string'||!x.itemName.trim()||
       x.itemName!==x.itemName.trim()||x.itemName.length>120||
       !int(x.qty)||x.qty<1||x.qty>99||
       typeof x.notes!=='string'||x.notes.length>1000||
       ![0,1].includes(x.heatPress)||!int(x.heatPress)||
       ![0,1].includes(x.flyPrint)||!int(x.flyPrint)||
       (x.department==='ليزر'&&(x.heatPress||x.flyPrint)))
      return 'T12_DRAFT_INVENTORY_ITEM_INVALID_OR_DUPLICATED';
    ids.add(x.itemId);
  }
  return null;
}

function checkFiles(files,quarantines,items,draftId){
  if(files.length>MAX_FILES||quarantines.length>MAX_FILES)
    return 'T12_DRAFT_INVENTORY_TOO_MANY_FILES';
  if(files.length!==quarantines.length)
    return 'T12_DRAFT_INVENTORY_QUARANTINE_MISMATCH';
  const ids=new Set(items.map(x=>x.itemId));
  const perItem=new Map(),seen=new Set();
  for(let i=0;i<files.length;i++){
    const f=files[i],q=quarantines[i];
    if(!f||!FILE.test(f.fileId)||seen.has(f.fileId)||
       f.draftId!==draftId||!ids.has(f.itemId)||
       !HEX.test(f.sha256Hex)||!int(f.byteSize)||
       f.byteSize<8||f.byteSize>5242880||
       !MIMES.has(f.contentType)||
       f.objectKey!=='customer-drafts/'+f.fileId||
       f.state!=='READY'||!int(f.updatedAtMs)||f.updatedAtMs<=0)
      return 'T12_DRAFT_INVENTORY_FILE_INVALID_OR_UNREADY';
    seen.add(f.fileId);
    perItem.set(f.itemId,(perItem.get(f.itemId)||0)+1);
    if(perItem.get(f.itemId)>MAX_FILES_PER_ITEM)
      return 'T12_DRAFT_INVENTORY_ITEM_FILE_LIMIT';
    if(!q||q.fileId!==f.fileId||q.itemId!==f.itemId||
       q.draftId!==draftId||q.sha256Hex!==f.sha256Hex||
       q.byteSize!==f.byteSize||q.contentType!==f.contentType||
       q.disposition!=='QUARANTINED'||
       q.scanCompleted!==0||q.printReleaseAuthorized!==0)
      return 'T12_DRAFT_INVENTORY_QUARANTINE_MISMATCH';
  }
  return null;
}
function snapshotStable(rows){
  // Field order is imposed by fixed SQL. Result is used for equality only;
  // no customer, line, order, file ID or R2 key is ever returned.
  return JSON.stringify(rows);
}
async function readAll(db,draftId,tokenFingerprint,nowMs,customerId){
  const results=await db.batch([
    db.prepare(OWNER_SQL).bind(draftId,tokenFingerprint,nowMs,nowMs),
    db.prepare(ITEMS_SQL).bind(draftId),
    db.prepare(LEDGER_SQL).bind(draftId),
    db.prepare(T12_DRAFT_INVENTORY_FILES_SQL_V0).bind(draftId,customerId),
    db.prepare(T12_DRAFT_INVENTORY_QUARANTINE_SQL_V0).bind(draftId,customerId)
  ]);
  if(!Array.isArray(results)||results.length!==5)return null;
  return results.map(values);
}
export async function inspectNativeCustomerDraftFullInventoryInternalV0({
  db,token,secret,draftId,nowMs,clock=()=>Date.now(),
  isolatedSourceOnly=false
}={}){
  if(isolatedSourceOnly!==true)return DENY('T12_DRAFT_INVENTORY_INTERNAL_OFF');
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function'||
     typeof secret!=='string'||secret.length<32||!int(nowMs)||
     nowMs<1500000000000||typeof token!=='string'||!HEX.test(token)||
     typeof draftId!=='string'||!DRAFT.test(draftId)||!clock||
     typeof clock!=='function')
    return DENY('T12_DRAFT_INVENTORY_INPUT_OR_BINDINGS_DENIED');
  try{
    const tokenFingerprint=await fingerprintCustomerSessionV0(token,secret);
    // Separate owner check first: the full file inventories can only
    // be queried with the owner returned by actual existing D1 session.
    const authorized=await db.prepare(OWNER_SQL)
      .bind(draftId,tokenFingerprint,nowMs,nowMs).first();
    if(!authorized||authorized.draftId!==draftId||
       typeof authorized.customerId!=='string'||!authorized.customerId||
       authorized.draftState!=='DRAFT')
      return DENY('T12_DRAFT_INVENTORY_OWNER_SESSION_DENIED');
    const ownerId=authorized.customerId;
    const first=await readAll(db,draftId,tokenFingerprint,nowMs,ownerId);
    if(!first||first.some(x=>x===null))
      return DENY('T12_DRAFT_INVENTORY_READ_UNVERIFIED');
    const [owner,items,ledger,files,quarantine]=first;
    if(owner.length!==1||owner[0].customerId!==ownerId||
       owner[0].draftId!==draftId||owner[0].draftState!=='DRAFT')
      return DENY('T12_DRAFT_INVENTORY_OWNER_CHANGED');
    if(ledger.length!==0)
      return DENY('T12_DRAFT_INVENTORY_EXISTING_T12_REQUEST_RECONCILE');
    const itemFailure=checkItems(items,draftId);
    if(itemFailure)return DENY(itemFailure);
    const fileFailure=checkFiles(files,quarantine,items,draftId);
    if(fileFailure)return DENY(fileFailure);
    const end=clock();
    if(!int(end)||end<nowMs||end-nowMs>60000)
      return DENY('T12_DRAFT_INVENTORY_CLOCK_DRIFT');
    const last=await readAll(db,draftId,tokenFingerprint,end,ownerId);
    if(!last||last.some(x=>x===null)||
       last.some((rows,i)=>snapshotStable(rows)!==snapshotStable(first[i])))
      return DENY('T12_DRAFT_INVENTORY_CHANGED_DURING_READ');
    return {
      success:true,source:T12_DRAFT_FULL_INVENTORY_SOURCE_VERSION_V0,
      sourceOnly:true,readOnly:true,snapshotSealed:false,
      wholeDraftObservedNow:true,itemCount:items.length,
      quarantinedFileCount:files.length,
      allFilesQuarantined:true,
      needsOfficialT12SingleWriterDelegation:true,
      needsAttachmentMalwareAttestation:files.length>0,
      // T12 cannot consume multiple independent items or attachments.
      // Report inventory completeness, NEVER actual submit eligibility.
      oneItemWithoutFilePreflightCandidate:items.length===1&&files.length===0,
      t12SingleWriterInvoked:false,officialOrderCreated:false,
      productionWriteAuthorized:false,malwareScanComplete:false,
      eligibleForT12FileHandoff:false,printReleaseAuthorized:false
    };
  }catch{
    return DENY('T12_DRAFT_INVENTORY_READ_OR_SCHEMA_UNAVAILABLE');
  }
}
