// Entry654 — source-only, privacy-minimized future customer portal readiness.
// Pure SELECT diagnostics. This module is NOT imported by the Production Worker,
// does not authorize login, writes, historical backfill, file upload, or order CREATE.
export const LEGACY_CUSTOMER_PORTAL_ACTIONS_V0 = Object.freeze([
  'customerLogin', 'customerLogout', 'changeCustomerPassword',
  'getCustomerOrders', 'getCustomerPortalAccountsV1859',
  'createCustomerDraft', 'addCustomerDraftItem',
  'submitCustomerDraft', 'uploadCustomerDraftFile'
]);

const CONTROL = 'ENTRY654_CUSTOMER_PORTAL_NATIVE_V1';
function count(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}
function fail(reason) {
  return Object.freeze({
    success: false,
    reason,
    controlMode: 'UNKNOWN',
    activeCustomerCount: null,
    missingPortalCodeCount: null,
    duplicatePortalCodeGroupCount: null,
    provisionedAccountCount: null,
    activeCredentialCount: null,
    customerSessionCount: null,
    legacyCustomerActionCount: LEGACY_CUSTOMER_PORTAL_ACTIONS_V0.length,
    crossCustomerIdentityProved: false,
    customerAuthRuntimeReady: false,
    customerOrdersRuntimeReady: false,
    customerDraftsRuntimeReady: false,
    customerFilesRuntimeReady: false,
    customerFinanceRuntimeReady: false,
    productionRelease: 'NO_GO',
    zeroGoogleComplete: false
  });
}
export async function inspectCustomerPortalNativeReadinessV0(db) {
  if (!db || typeof db.prepare !== 'function') return fail('DB_UNAVAILABLE');
  try {
    const control = await db.prepare(`
      SELECT marker, mode FROM customer_portal_native_control_v1
      WHERE singleton=1 LIMIT 1
    `).first();
    if (!control || control.marker !== CONTROL) return fail('CONTROL_MISSING');
    const mode = String(control.mode || '').toUpperCase();
    if (!['OFF', 'SHADOW', 'CANARY', 'GENERAL'].includes(mode)) return fail('INVALID_CONTROL');
    const summary = await db.prepare(`
      SELECT COUNT(*) AS activeCustomerCount,
             SUM(CASE WHEN TRIM(COALESCE(legacy_chat_code,'')) = '' THEN 1 ELSE 0 END)
               AS missingPortalCodeCount
        FROM t12_customers WHERE active='نعم'
    `).first();
    const duplicates = await db.prepare(`
      SELECT COUNT(*) AS duplicatePortalCodeGroupCount FROM (
        SELECT TRIM(legacy_chat_code) AS c
          FROM t12_customers
         WHERE active='نعم' AND TRIM(COALESCE(legacy_chat_code,'')) <> ''
         GROUP BY TRIM(legacy_chat_code)
        HAVING COUNT(*) > 1
      )
    `).first();
    const accounts = await db.prepare(`
      SELECT COUNT(*) AS provisionedAccountCount,
             SUM(CASE WHEN state='ACTIVE' THEN 1 ELSE 0 END) AS activeCredentialCount
        FROM customer_portal_native_accounts_v1
    `).first();
    const sessions = await db.prepare(`
      SELECT COUNT(*) AS customerSessionCount
        FROM customer_portal_native_sessions_v1
    `).first();
    const counts = {
      activeCustomerCount: count(summary && summary.activeCustomerCount),
      missingPortalCodeCount: count(summary && summary.missingPortalCodeCount),
      duplicatePortalCodeGroupCount: count(duplicates && duplicates.duplicatePortalCodeGroupCount),
      provisionedAccountCount: count(accounts && accounts.provisionedAccountCount),
      activeCredentialCount: count(accounts && accounts.activeCredentialCount),
      customerSessionCount: count(sessions && sessions.customerSessionCount)
    };
    if (Object.values(counts).some(v => v === null)) return fail('INCOMPLETE_READ_EVIDENCE');
    // Source-only counts cannot establish genuine identity verification,
    // deployed Cloud/Google routing parity or an owner-authorized release.
    // OFF is intentional. Even non-OFF control is NOT a GO on this diagnostic.
    return Object.freeze({
      success: true,
      reason: 'SOURCE_ONLY_NOT_RUNTIME_QUALIFIED',
      controlMode: mode,
      ...counts,
      legacyCustomerActionCount: LEGACY_CUSTOMER_PORTAL_ACTIONS_V0.length,
      crossCustomerIdentityProved: false,
      customerAuthRuntimeReady: false,
      customerOrdersRuntimeReady: false,
      customerDraftsRuntimeReady: false,
      customerFilesRuntimeReady: false,
      customerFinanceRuntimeReady: false,
      productionRelease: 'NO_GO',
      zeroGoogleComplete: false
    });
  } catch {
    // Do not expose SQL errors or metadata; do not call a legacy fallback.
    return fail('SCHEMA_OR_READ_UNAVAILABLE');
  }
}
