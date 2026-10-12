// Entry655 source-only, privacy-minimized native order ownership inventory.
// This is NEVER a customer-facing order reader or authorization mechanism.
// No live Worker imports it. No Google, D1 writes, customer/order IDs in output.
function n(value) {
  if (value == null || value === '') return null;
  const x = Number(value);
  return Number.isSafeInteger(x) && x >= 0 ? x : null;
}
function noGo(reason) {
  return Object.freeze({
    success:false, reason, nativeOrderCount:null, verifiedOwnershipCandidates:null,
    nativeOrdersWithoutVerifiedLink:null, ownerLinkConflicts:null,
    customerOrderReadAuthority:false, historicalOrderOwnershipProved:false,
    productionRelease:'NO_GO', zeroGoogleComplete:false
  });
}
export async function inspectCustomerOrderOwnershipV0(db) {
  if(!db||typeof db.prepare!=='function')return noGo('DB_UNAVAILABLE');
  try {
    const orders = await db.prepare(`
      SELECT COUNT(*) AS nativeOrderCount FROM t12_prod_orders
    `).first();
    const qualified = await db.prepare(`
      SELECT COUNT(*) AS verifiedOwnershipCandidates
        FROM customer_portal_native_order_ownership_v1 l
        JOIN customer_portal_native_accounts_v1 a ON a.customer_id=l.customer_id
        JOIN t12_customers c ON c.customer_id=l.customer_id
        JOIN t12_prod_orders o ON o.order_id=l.order_id
       WHERE l.status='VERIFIED' AND l.proof_method='OWNER_REVIEWED_EXACT_ID'
         AND a.state='ACTIVE' AND c.active='نعم'
         AND a.portal_code=TRIM(COALESCE(c.legacy_chat_code,''))
    `).first();
    const unmapped = await db.prepare(`
      SELECT COUNT(*) AS nativeOrdersWithoutVerifiedLink
        FROM t12_prod_orders o
        LEFT JOIN customer_portal_native_order_ownership_v1 l
          ON l.order_id=o.order_id AND l.status='VERIFIED'
       WHERE l.order_id IS NULL
    `).first();
    const conflicts = await db.prepare(`
      SELECT COUNT(*) AS ownerLinkConflicts
        FROM customer_portal_native_order_ownership_v1 l
        JOIN t12_prod_orders o ON o.order_id=l.order_id
        JOIN customer_portal_native_accounts_v1 a ON a.customer_id=l.customer_id
        JOIN t12_customers c ON c.customer_id=l.customer_id
       WHERE l.status='VERIFIED' AND (
          a.state<>'ACTIVE' OR c.active<>'نعم'
          OR a.portal_code<>TRIM(COALESCE(c.legacy_chat_code,''))
          OR (TRIM(COALESCE(o.external_customer_id,''))<>''
              AND TRIM(o.external_customer_id)<>l.customer_id)
       )
    `).first();
    const counts = {
      nativeOrderCount:n(orders&&orders.nativeOrderCount),
      verifiedOwnershipCandidates:n(qualified&&qualified.verifiedOwnershipCandidates),
      nativeOrdersWithoutVerifiedLink:n(unmapped&&unmapped.nativeOrdersWithoutVerifiedLink),
      ownerLinkConflicts:n(conflicts&&conflicts.ownerLinkConflicts)
    };
    if(Object.values(counts).some(v=>v===null))return noGo('SOURCE_INCOMPLETE');
    // Even perfect numeric matching is not proof of a native customer session,
    // independently reviewed source provenance, or deployed runtime parity.
    return Object.freeze({
      success:true,reason:'OFFLINE_COUNTS_NOT_AUTHORIZATION',...counts,
      customerOrderReadAuthority:false,
      historicalOrderOwnershipProved:false,
      productionRelease:'NO_GO',zeroGoogleComplete:false
    });
  } catch {
    return noGo('SCHEMA_OR_READ_UNAVAILABLE');
  }
}
