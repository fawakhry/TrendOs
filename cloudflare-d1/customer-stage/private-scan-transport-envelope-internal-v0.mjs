/* Source-only outbound scan-transport envelope. No fetch or Worker import.
 * HMAC authenticates private BYTES, signed lease, timestamp and destination
 * path but is NOT workload identity, Cloudflare Access, TLS, D1 authorization
 * or permission to print. Never expose result to browser.
 */
const PATH='/internal/customer/private-scan/observe-v0';
const MAX=5*1024*1024;
const TOKEN=/^[A-Za-z0-9_-]{1,4000}\.[A-Za-z0-9_-]{43}$/;
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const utf8=s=>new TextEncoder().encode(s);
const result=(code)=>({ok:false,code,sourceOnly:true,printReleaseAuthorized:false,
  eligibleForT12FileHandoff:false,malwareScanComplete:false});
export async function makePrivateScanTransportEnvelopeInternalV0({
  lease,fileBytes,transportKey,nowMs,allowSyntheticStage=false
}={}){
  if(allowSyntheticStage!==true)return result('SCAN_TRANSPORT_OFF');
  if(typeof lease!=='string'||lease.length>4096||!TOKEN.test(lease)||
     !(fileBytes instanceof Uint8Array)||fileBytes.length<8||
     fileBytes.length>MAX||typeof transportKey!=='string'||
     utf8(transportKey).length<32||
     !Number.isSafeInteger(nowMs)||nowMs<1500000000000)
    return result('SCAN_TRANSPORT_INPUT_DENIED');
  // Byte digest is for integrity only; trusted D1 owner and R2 provenance
  // require the separate source issuer and verified scanner callbacks.
  const digest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',fileBytes)));
  const message=['trendos-private-scan-transport-v0',PATH,String(nowMs),
    lease,digest,String(fileBytes.length),''].join('\n');
  const key=await crypto.subtle.importKey('raw',utf8(transportKey),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=hex(new Uint8Array(await crypto.subtle.sign(
    'HMAC',key,utf8(message))));
  return {ok:true,sourceOnly:true,path:PATH,body:fileBytes,
    headers:{
      'content-type':'application/octet-stream',
      'x-trendos-scan-lease':lease,
      'x-trendos-transport-ts':String(nowMs),
      'x-trendos-transport-sha256':digest,
      'x-trendos-transport-signature':signature
    },printReleaseAuthorized:false,eligibleForT12FileHandoff:false,
    malwareScanComplete:false};
}
