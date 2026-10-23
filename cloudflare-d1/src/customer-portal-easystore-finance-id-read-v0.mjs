/*
 * Entry668 — customer finance read from EXISTING EasyStore D1 accounting
 * party balances. NO new ledger; exact D1 customer_id, never name matching.
 * SOURCE ONLY/OFF, not imported by Worker, no public route or Google fallback.
 *
 * A successful D1 query is NOT proof that EasyStore financial authority
 * migrated away from Apps Script. Owner-certified parity and identity
 * mapping are mandatory and must be attested outside this source code.
 */
import {fingerprintCustomerSessionV0} from './customer-portal-native-orders-v0.mjs';
export const CUSTOMER_EASYSTORE_BALANCE_READ_VERSION_V0='ENTRY668_CUSTOMER_FINANCE_D1_EXACT_ID_READ_OFF_V0';
const hex64=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
function denied(code,status=503){return {status,body:{
  success:false,code,source:'easystore-d1-exact-customer-id-read-v0',
  financeAuthoritative:false,financeWriteAuthorized:false
}};}
export const CUSTOMER_EASYSTORE_EXACT_ID_BALANCE_SQL_V0=`
SELECT a.customer_id AS customerId,
       b.balance AS balance,b.version AS balanceVersion,
       b.updated_at_ms AS balanceUpdatedAtMs,
       f.mode AS accountingMode
  FROM customer_portal_native_sessions_v1 s
  JOIN customer_portal_native_accounts_v1 a ON a.customer_id=s.customer_id
  JOIN t12_customers c ON c.customer_id=a.customer_id
  JOIN customer_portal_native_control_v1 ctl ON ctl.singleton=1
  JOIN employee_accounting_control_v1 f ON f.singleton=1
  JOIN employee_accounting_party_balances_v1 b
    ON b.party_type='customer' AND b.party_id=a.customer_id
 WHERE s.token_fingerprint_hex=?
   AND s.source='d1-customer-native'
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
   AND f.marker='ENTRY614_ACCOUNTING_V1'
   AND f.policy_epoch>=1 AND f.mode IN ('READONLY','GENERAL')
   AND b.version>=1
   AND NOT EXISTS(SELECT 1 FROM t12_customers other
     WHERE other.customer_id<>a.customer_id AND other.active='نعم'
       AND trim(coalesce(other.legacy_chat_code,''))=a.portal_code)
 LIMIT 1
`;

export async function readNativeCustomerEasyStoreBalanceV0({
 db,token,secret,nowMs,
 customerFinancialMappingAttested=false,
 easyStoreBalanceParityCertified=false
}={}){
 if(!db||typeof db.prepare!=='function'||typeof secret!=='string'||secret.length<32||
    !Number.isSafeInteger(nowMs)||nowMs<=1500000000000)
   return denied('CUSTOMER_FINANCE_BACKEND_UNAVAILABLE');
 if(!hex64(token))return denied('CUSTOMER_SESSION_REJECTED',401);
 // Neither a client header nor a local Git flag is valid independent finance
 // evidence. These booleans are ONLY accepted by this unexposed offline
 // prototype; a production boundary still needs signed owner attestation.
 if(customerFinancialMappingAttested!==true||easyStoreBalanceParityCertified!==true)
   return denied('EASYSTORE_CUSTOMER_FINANCE_PARITY_NOT_APPROVED');
 try{
   const mac=await fingerprintCustomerSessionV0(token,secret);
   const row=await db.prepare(CUSTOMER_EASYSTORE_EXACT_ID_BALANCE_SQL_V0)
     .bind(mac,nowMs,nowMs).first();
   if(!row||!row.customerId)return denied('CUSTOMER_FINANCE_SCOPE_OR_BALANCE_UNAVAILABLE',404);
   // Never coerce NULL, undefined, blank text or booleans into a fake EGP 0.
   // Canonical D1/SQLite REAL balances are numeric; schema drift fails closed.
   if(typeof row.balance!=='number'||!Number.isFinite(row.balance)||
      row.balance<0)return denied('EASYSTORE_BALANCE_MISSING_OR_INVALID');
   const amount=row.balance,updatedAt=Number(row.balanceUpdatedAtMs),
     version=Number(row.balanceVersion);
   if(Math.abs(amount)>1e12||
      !Number.isSafeInteger(updatedAt)||updatedAt<=0||updatedAt>nowMs||
      nowMs-updatedAt>24*60*60*1000||
      !Number.isSafeInteger(version)||version<1||
      Math.abs(amount*100-Math.round(amount*100))>1e-6)
     return denied('EASYSTORE_BALANCE_STALE_OR_INVALID');
   // Only balance displayed. No employee financial auth/session, ledger notes,
   // supplier account or historical customer-by-name projection.
   return {status:200,body:{
     success:true,source:'easystore-d1-exact-customer-id-read-v0',
     version:CUSTOMER_EASYSTORE_BALANCE_READ_VERSION_V0,
     currency:'EGP',balance:Number(amount.toFixed(2)),
     financialPreviewOnly:true,financeAuthoritative:false,
     financeWriteAuthorized:false,zeroGoogleComplete:false
   }};
 }catch{return denied('CUSTOMER_FINANCE_SQL_OR_CONTROL_UNAVAILABLE');}
}
export const CUSTOMER_EASYSTORE_FINANCE_POLICY_V0=Object.freeze({
 sourceOnly:true,workerEntryWired:false,httpRouteAvailable:false,
 defaultEnabled:false,googleFallback:false,
 customerIdDerivedFromNativeSession:true,
 ledgerSchemaDuplicated:false,financeWriteAuthorized:false,
 currency:'EGP',balanceMaxAgeHours:24,
 accountsParityIndependentlyVerified:false,
 productionRelease:'NO_GO',zeroGoogleComplete:false
});
