/* Zero Google CUSTOMER private D1+R2 signed scan lease issuer — INTERNAL ONLY.
 * Source is intentionally NOT imported into any Worker entry, no HTTP route,
 * no real Cloudflare resources, no public/private download URL, NO DEPLOY.
 * Must never be used as a print permission, scan verdict, or T12 writer.
 */
import {fingerprintCustomerSessionV0,CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0}
  from '../src/customer-portal-native-orders-v0.mjs';
import {classifyNativeCustomerFileV0,CUSTOMER_NATIVE_FILE_MAX_BYTES_V0}
  from '../src/customer-portal-native-draft-file-r2-v0.mjs';
import {
  CUSTOMER_R2_INTEGRITY_DRAFT_SQL_V0,
  CUSTOMER_R2_INTEGRITY_ROWS_SQL_V0,
  CUSTOMER_R2_QUARANTINE_ROWS_SQL_V0
} from './private-r2-integrity-ro-v0.mjs';

const ISS='trendos-private-customer-stage-isolated-v0';
const AUD='trendos-private-ubuntu-offline-scanner-isolated-v0';
const PURPOSE='quarantined-private-byte-observation-only';
const FILE=/^CDF-[0-9a-f]{32}$/;
const DRAFT=/^CDR-[0-9a-f]{32}$/;
const HEX64=/^[a-f0-9]{64}$/;
const MAX_FILES=5;
const SOURCE='customer-private-d1-r2-scan-lease-internal-source-v0';
const deny=code=>({ok:false,code,source:SOURCE,sourceOnly:true,
  scanAttestationVerified:false,malwareScanComplete:false,
  fileQuarantineRemainsRequired:true,printReleaseAuthorized:false,
  eligibleForT12FileHandoff:false,officialOrderCreated:false,
  productionWriteAuthorized:false});
const exactInt=x=>Number.isSafeInteger(x)&&typeof x==='number';
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const base64url=b=>btoa(Array.from(b,x=>String.fromCharCode(x)).join(''))
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const textBytes=s=>new TextEncoder().encode(s);
const rowValid=r=>r&&typeof r==='object'&&FILE.test(r.fileId)&&
  /^CDI-[a-f0-9]{32}$/.test(r.itemId)&&HEX64.test(r.sha256Hex)&&
  exactInt(r.byteSize)&&r.byteSize>=8&&
  r.byteSize<=CUSTOMER_NATIVE_FILE_MAX_BYTES_V0&&
  ['image/png','image/jpeg','application/pdf'].includes(r.contentType)&&
  r.objectKey==='customer-drafts/'+r.fileId&&r.state==='READY'&&
  exactInt(r.updatedAtMs)&&r.updatedAtMs>0;
const quarantineMatches=(qs,rows)=>qs.length===rows.length&&rows.every((r,i)=>{
  const q=qs[i];
  return q&&q.fileId===r.fileId&&q.sha256Hex===r.sha256Hex&&
    q.byteSize===r.byteSize&&q.contentType===r.contentType&&
    q.disposition==='QUARANTINED'&&q.scanCompleted===0&&
    q.printReleaseAuthorized===0;
});
const stable=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

async function ownerSnapshot(db,customerId,draftId){
  const draft=await db.prepare(CUSTOMER_R2_INTEGRITY_DRAFT_SQL_V0)
    .bind(draftId,customerId).first();
  if(!draft||draft.draftId!==draftId)return null;
  const files=await db.prepare(CUSTOMER_R2_INTEGRITY_ROWS_SQL_V0)
    .bind(draftId,customerId).all();
  if(!files||!Array.isArray(files.results)||!files.results.length||
     files.results.length>MAX_FILES||files.results.some(x=>!rowValid(x)))return null;
  const quarantine=await db.prepare(CUSTOMER_R2_QUARANTINE_ROWS_SQL_V0)
    .bind(draftId,customerId).all();
  if(!quarantine||!Array.isArray(quarantine.results)||
     !quarantineMatches(quarantine.results,files.results))return null;
  return {files:files.results,quarantine:quarantine.results};
}

async function signClaims(claims,key){
  // Python sorted-key ASCII compact JSON interoperability.
  const canonical=Object.fromEntries(
    Object.entries(claims).sort(([a],[b])=>a<b?-1:a>b?1:0));
  const raw=textBytes(JSON.stringify(canonical));
  const cryptoKey=await crypto.subtle.importKey('raw',textBytes(key),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const mac=new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,raw));
  return base64url(raw)+'.'+base64url(mac);
}

export async function issuePrivateCustomerScanLeaseInternalV0({
  env={},token,draftId,fileId,nowMs,clock=()=>Date.now()
}={}){
  // Not a route. Both guards are absent/OFF in committed config.
  if(env.TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_INTERNAL_V0_ENABLED!=='true'||
     env.TRENDOS_CUSTOMER_PORTAL_STAGE_MODE!=='isolated-customer-stage-v0'||
     env.TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED!=='true')
    return deny('SCAN_LEASE_INTERNAL_OFF');
  const db=env.DB,bucket=env.CUSTOMER_DRAFT_FILES_BUCKET;
  const sess=env.TRENDOS_CUSTOMER_PORTAL_SESSION_HMAC_SECRET;
  const signing=env.TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_SIGNING_SECRET;
  if(!db||typeof db.prepare!=='function'||!bucket||typeof bucket.get!=='function'||
     typeof sess!=='string'||sess.length<32||typeof signing!=='string'||
     signing.length<32||sess===signing)
    return deny('SCAN_LEASE_INTERNAL_BINDING_UNAVAILABLE');
  if(!HEX64.test(token)||!DRAFT.test(draftId)||!FILE.test(fileId))
    return deny('SCAN_LEASE_INTERNAL_REFERENCE_DENIED');
  if(!exactInt(nowMs)||nowMs<1500000000000)
    return deny('SCAN_LEASE_INTERNAL_CLOCK_DENIED');
  try{
    const tokenFp=await fingerprintCustomerSessionV0(token,sess);
    const lookup=async ms=>db.prepare(CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0)
      .bind(tokenFp,ms,ms).first();
    const auth=await lookup(nowMs);
    if(!auth||typeof auth.customerId!=='string'||!auth.customerId)
      return deny('SCAN_LEASE_INTERNAL_SESSION_DENIED');
    const owner=auth.customerId;
    const first=await ownerSnapshot(db,owner,draftId);
    if(!first)return deny('SCAN_LEASE_INTERNAL_OWNER_QUARANTINE_DENIED');
    const file=first.files.find(x=>x.fileId===fileId);
    if(!file)return deny('SCAN_LEASE_INTERNAL_FILE_NOT_IN_OWNER_DRAFT');
    const r2=await bucket.get(file.objectKey);
    if(!r2||r2.size!==file.byteSize||
       r2.httpMetadata?.contentType!==file.contentType||
       typeof r2.arrayBuffer!=='function')
      return deny('SCAN_LEASE_INTERNAL_R2_METADATA_DENIED');
    const bytes=new Uint8Array(await r2.arrayBuffer());
    if(bytes.length!==file.byteSize||!classifyNativeCustomerFileV0(bytes,file.contentType))
      return deny('SCAN_LEASE_INTERNAL_R2_BYTES_DENIED');
    const sha=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
    if(sha!==file.sha256Hex)
      return deny('SCAN_LEASE_INTERNAL_R2_SHA_DENIED');
    const end=clock();
    if(!exactInt(end)||end<nowMs||end-nowMs>60000)
      return deny('SCAN_LEASE_INTERNAL_CLOCK_DRIFT_DENIED');
    const endAuth=await lookup(end);
    if(!endAuth||endAuth.customerId!==owner)
      return deny('SCAN_LEASE_INTERNAL_SESSION_CHANGED');
    const last=await ownerSnapshot(db,owner,draftId);
    if(!last||!stable(first,last))
      return deny('SCAN_LEASE_INTERNAL_OWNER_QUARANTINE_CHANGED');
    const nonce=hex(crypto.getRandomValues(new Uint8Array(16)));
    const claims={
      v:1,iss:ISS,aud:AUD,purpose:PURPOSE,
      fileId:file.fileId,draftId,itemId:file.itemId,
      sha256Hex:file.sha256Hex,byteSize:file.byteSize,
      contentType:file.contentType,updatedAtMs:file.updatedAtMs,
      iatMs:end,expMs:end+60000,nonce
    };
    const lease=await signClaims(claims,signing);
    // This token is meant for a future ONLY-INTERNAL authenticated transport.
    // Never expose it via browser or put it in logs/analytics.
    return {ok:true,code:'SCAN_LEASE_INTERNAL_PROVISIONAL_ONLY',
      source:SOURCE,sourceOnly:true,lease,
      scanAttestationVerified:false,malwareScanComplete:false,
      fileQuarantineRemainsRequired:true,printReleaseAuthorized:false,
      eligibleForT12FileHandoff:false,officialOrderCreated:false,
      productionWriteAuthorized:false};
  }catch{
    return deny('SCAN_LEASE_INTERNAL_SOURCE_UNAVAILABLE');
  }
}
