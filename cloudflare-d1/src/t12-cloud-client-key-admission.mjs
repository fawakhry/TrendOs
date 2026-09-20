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
export const T12_CLOUD_CLIENT_KEY_ADMISSION='T12_CLOUD_CLIENT_KEY_ADMISSION_ISOLATED_20260920';
const NEW=/^cld1_(\d{13})_([A-Za-z0-9_-]{16,80})$/;
export function classifyT12ClientRequestKey(requestKey){
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
