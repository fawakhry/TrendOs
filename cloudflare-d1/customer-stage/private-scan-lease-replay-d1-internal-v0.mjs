/* Zero Google private scan lease replay proof: INTERNAL SOURCE ONLY.
 * No Worker import, HTTP route, live D1 migration, Ubuntu transport or
 * malware clearance. A spent nonce never authorizes T12, Google or printing.
 */
const ISS='trendos-private-customer-stage-isolated-v0';
const AUD='trendos-private-ubuntu-offline-scanner-isolated-v0';
const PURPOSE='quarantined-private-byte-observation-only';
const SOURCE='customer-private-scan-replay-d1-internal-source-v0';
const HEX64=/^[0-9a-f]{64}$/;
const NONCE=/^[0-9a-f]{32}$/;
const FILE=/^CDF-[0-9a-f]{32}$/;
const DRAFT=/^CDR-[0-9a-f]{32}$/;
const ITEM=/^CDI-[0-9a-f]{32}$/;
const TOKEN=/^[A-Za-z0-9_-]{1,4000}\.[A-Za-z0-9_-]{43}$/;
const KEYS=['aud','byteSize','contentType','draftId','expMs','fileId',
  'iatMs','iss','itemId','nonce','purpose','sha256Hex','updatedAtMs','v'];
const deny=(code,claimed=false)=>({
  source:SOURCE,code,sourceOnly:true,replayClaimConsumed:claimed,
  scanAttestationVerified:false,signatureDatabaseAuthenticityVerified:false,
  malwareScanComplete:false,fileQuarantineRemainsRequired:true,
  eligibleForT12FileHandoff:false,printReleaseAuthorized:false,
  officialOrderCreated:false,productionWriteAuthorized:false
});
const utf8=s=>new TextEncoder().encode(s);
const toHex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const b64url=b=>btoa(Array.from(b,x=>String.fromCharCode(x)).join(''))
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function decodeB64(text){
  if(typeof text!=='string'||!text||!/^[A-Za-z0-9_-]+$/.test(text))
    throw new TypeError('noncanonical base64');
  const bytes=Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')+
    '='.repeat((4-text.length%4)%4)),x=>x.charCodeAt(0));
  if(b64url(bytes)!==text)throw new TypeError('noncanonical base64');
  return bytes;
}
const goodInt=x=>typeof x==='number'&&Number.isSafeInteger(x);
function claimsValid(c,nowMs){
  if(!c||typeof c!=='object'||Array.isArray(c)||
     Object.keys(c).sort().join('|')!==KEYS.join('|'))return false;
  if(c.v!==1||!goodInt(c.v)||c.iss!==ISS||c.aud!==AUD||c.purpose!==PURPOSE)
    return false;
  if(typeof c.fileId!=='string'||!FILE.test(c.fileId)||
     typeof c.draftId!=='string'||!DRAFT.test(c.draftId)||
     typeof c.itemId!=='string'||!ITEM.test(c.itemId)||
     typeof c.sha256Hex!=='string'||!HEX64.test(c.sha256Hex)||
     typeof c.nonce!=='string'||!NONCE.test(c.nonce)||
     !['image/png','image/jpeg','application/pdf'].includes(c.contentType))
    return false;
  if(!goodInt(c.byteSize)||c.byteSize<8||c.byteSize>5242880||
     !goodInt(c.updatedAtMs)||c.updatedAtMs<=0||
     !goodInt(c.iatMs)||!goodInt(c.expMs))return false;
  if(c.iatMs<1500000000000||c.iatMs>nowMs+5000||
     nowMs<c.iatMs-5000||nowMs>=c.expMs||
     c.expMs<=c.iatMs||c.expMs-c.iatMs>120000)return false;
  return true;
}
export const CUSTOMER_PRIVATE_SCAN_REPLAY_INSERT_SQL_V0=
  'INSERT INTO customer_private_scan_lease_replay_v0 '+
  '(nonce_digest_hex,signed_lease_digest_hex,issued_at_ms,expires_at_ms,consumed_at_ms) '+
  'VALUES(?,?,?,?,?) ON CONFLICT(nonce_digest_hex) DO NOTHING';
export const CUSTOMER_PRIVATE_SCAN_REPLAY_READBACK_SQL_V0=
  'SELECT nonce_digest_hex AS nonceDigest,'+
  'signed_lease_digest_hex AS signedLeaseDigest,'+
  'issued_at_ms AS issuedAtMs,expires_at_ms AS expiresAtMs,'+
  'consumed_at_ms AS consumedAtMs '+
  'FROM customer_private_scan_lease_replay_v0 WHERE nonce_digest_hex=? LIMIT 1';
export async function consumePrivateScanLeaseNonceD1InternalV0({
  env={},token,nowMs
}={}){
  if(env.TRENDOS_CUSTOMER_PRIVATE_SCAN_REPLAY_D1_INTERNAL_V0_ENABLED!=='true'||
     env.TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED!=='true'||
     env.TRENDOS_CUSTOMER_PORTAL_STAGE_MODE!=='isolated-customer-stage-v0')
    return deny('SCAN_REPLAY_INTERNAL_OFF');
  const db=env.DB,secret=env.TRENDOS_CUSTOMER_PRIVATE_SCAN_LEASE_SIGNING_SECRET;
  if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||
     utf8(secret).length<32)
    return deny('SCAN_REPLAY_INTERNAL_BINDING_UNAVAILABLE');
  if(typeof token!=='string'||token.length>4096||!TOKEN.test(token)||
     !goodInt(nowMs)||nowMs<1500000000000)
    return deny('SCAN_REPLAY_INTERNAL_FORMAT_OR_TIME_DENIED');
  try{
    const [p,s]=token.split('.');
    const body=decodeB64(p),signature=decodeB64(s);
    if(body.length>3072||signature.length!==32)
      return deny('SCAN_REPLAY_INTERNAL_FORMAT_OR_TIME_DENIED');
    const key=await crypto.subtle.importKey('raw',utf8(secret),
      {name:'HMAC',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('HMAC',key,signature,body))
      return deny('SCAN_REPLAY_SIGNATURE_DENIED');
    const claims=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));
    if(!claimsValid(claims,nowMs))
      return deny('SCAN_REPLAY_CLAIMS_OR_EXPIRY_DENIED');
    const canonical=Object.fromEntries(Object.entries(claims).sort(([a],[b])=>
      a<b?-1:a>b?1:0));
    if(JSON.stringify(canonical)!==new TextDecoder().decode(body))
      return deny('SCAN_REPLAY_NONCANONICAL_CLAIMS_DENIED');
    // Store opaque hashes only. Nonces cannot be reissued even after expiry.
    const nonceHash=toHex(new Uint8Array(await crypto.subtle.digest('SHA-256',
      utf8(JSON.stringify(['trendos-private-scan-replay-v0',claims.nonce])))));
    const leaseHash=toHex(new Uint8Array(await crypto.subtle.digest('SHA-256',
      utf8(token))));
    const write=await db.prepare(CUSTOMER_PRIVATE_SCAN_REPLAY_INSERT_SQL_V0)
      .bind(nonceHash,leaseHash,claims.iatMs,claims.expMs,nowMs).run();
    // D1 meta must prove exactly one inserted row, not a check inferred
    // from an HTTP status or retry after ambiguous execution.
    if(!write||!write.meta||!goodInt(write.meta.changes)||
       write.meta.changes!==1)
      return deny('SCAN_REPLAY_USED_OR_UNVERIFIED');
    const row=await db.prepare(CUSTOMER_PRIVATE_SCAN_REPLAY_READBACK_SQL_V0)
      .bind(nonceHash).first();
    if(!row||row.nonceDigest!==nonceHash||
       row.signedLeaseDigest!==leaseHash||
       row.issuedAtMs!==claims.iatMs||
       row.expiresAtMs!==claims.expMs||row.consumedAtMs!==nowMs)
      return deny('SCAN_REPLAY_ATOMIC_PROOF_UNAVAILABLE');
    return deny('SCAN_REPLAY_LOCAL_CLAIM_OBSERVED_ONLY',true);
  }catch{
    return deny('SCAN_REPLAY_D1_OR_CRYPTO_UNAVAILABLE');
  }
}
