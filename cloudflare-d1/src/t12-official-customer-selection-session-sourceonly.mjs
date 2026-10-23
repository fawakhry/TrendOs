/* ACC224: use the EXISTING signed Orders Edge employee session as the
 * selector-identity audit for dormant ACC223 customer-at-create SOURCE capture.
 * Zero new accounts, tokens, database writes, HTTP routes or finance grants.
 * WARNING: verified EMPLOYEE SESSION != verified CUSTOMER OWNERSHIP.
 * The current Orders Edge exchange can still rely on Google Apps Script.
 * This function is source-only; it is NOT a native/independent SSO release.
 */
import {verifyOrdersEdgeToken} from './edge-orders-read-v1.mjs';

const text=v=>typeof v==='string'?v.trim():'';
const invalidControl=/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069]/u;
const MAX_TOKEN_LENGTH=5000;
const MAX_SESSION_SECONDS=900;
function stop(code){return {ok:false,code,financialGrant:false,customerOwnerAttested:false};}

export async function inspectT12CustomerSelectorSessionSourceOnly({
  token,secret,expectedActor,nowSeconds
}={}){
  if(typeof token!=='string'||token.length<20||token.length>MAX_TOKEN_LENGTH||
     typeof secret!=='string'||secret.length<16||secret.length>10000||
     !text(expectedActor)||text(expectedActor)!==expectedActor||
     expectedActor.length>140||invalidControl.test(expectedActor)||
     (nowSeconds!==undefined&&(!Number.isSafeInteger(nowSeconds)||nowSeconds<=0)))
    return stop('SIGNED_SELECTOR_SESSION_INPUT_INVALID');
  const now=nowSeconds===undefined?Math.floor(Date.now()/1000):nowSeconds;
  try{
    // Calls the ORIGINAL verifier; no new or bypass authentication system.
    const v=await verifyOrdersEdgeToken(token,secret,now);
    if(!v.ok||!v.payload)return stop('EDGE_EMPLOYEE_SESSION_SIGNATURE_OR_EXPIRY_INVALID');
    const p=v.payload;
    if(p.sub!==expectedActor)return stop('SESSION_ACTOR_MISMATCH');
    const role=text(p.role).toLowerCase();
    if(!['admin','service'].includes(role)||
       !Array.isArray(p.screens)||!p.screens.includes('service'))
      return stop('CUSTOMER_SELECTION_EMPLOYEE_SERVICE_SCOPE_REQUIRED');
    if(!Number.isSafeInteger(p.iat)||!Number.isSafeInteger(p.exp)||
       p.iat>now+15||p.iat<now-MAX_SESSION_SECONDS||
       p.exp<=now||p.exp-p.iat>MAX_SESSION_SECONDS||p.exp<=p.iat||
       !text(p.jti)||p.jti.length>180||invalidControl.test(p.jti))
      return stop('CUSTOMER_SELECTION_SESSION_FRESHNESS_INVALID');
    // Store only a SHA-256 token digest, never a bearer token or secret.
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
    const tokenSha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    return {
      ok:true,role,subject:p.sub,issuedAt:p.iat,expiresAt:p.exp,tokenSha256,
      financialGrant:false,customerOwnerAttested:false,
      verifiedEvidence:'ORDERS_EDGE_EMPLOYEE_SESSION_SIGNATURE_ONLY'
    };
  }catch{
    return stop('CUSTOMER_SELECTION_SESSION_PROOF_UNAVAILABLE');
  }
}
