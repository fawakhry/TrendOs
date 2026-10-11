# ACC-187 — Native sale refund gap and synthetic purchase reversal negative tests

**2026-10-12; NO_GO, no finance production write.**

## Finding (real source; not invented acceptance)

At the observed candidate Worker source \`cloudflare-d1/src/employee-accounting-native-v1.mjs\`:
- \`reverseApprovedPurchaseV1920\` reverses a **whole eligible purchase** with stock and supplier-ledger guards; it requires the stock to remain available and unpaid amount to remain on supplier balance. This is not proof of supplier partial return, refund policy or handling already-consumed stock.
- \`reopenAccountingFinalInvoice\` changes customer invoice to \`UNDER_REVIEW\` and places its original paid amount in \`held_paid\`; it does **NOT** issue a customer cash refund nor restore returned items to stock.
- There is currently **no explicit native dispatch handler** for \`refundEasyStoreSaleV2\`, \`returnEasyStoreSaleV2\`, or \`reverseEasyStoreSaleV2\`. These names are probes of absence, not promises of final API names. Unknown actions fail closed. The actual approved business semantics of cash refund vs store credit, returned material condition, cost/taxes and partial refund are not specified by source.
- The existing read-only / authenticated boundary is never altered. The simulation temporarily sets GENERAL and disables canary **inside ephemeral SQLite memory exclusively**; production remains at last reported READONLY/OFF.

## Scope performed

\`tests/easystore_acc187_sale_refund_gap_purchase_reversal_sqlite.test.mjs\` adapts the previously successful ACC170 exact Worker + additive migrations + transient fake customer fixture to run:
1. Purchase with part payment, then sale consuming stock; deny purchase reversal due to no longer available stock, with byte-accounting state stable.
2. Deny full purchase reversal after settling relevant supplier debt; no stock, ledger, cash or request changes.
3. Deny three unimplemented customer sale refund/return actions and check no effects.
4. Actually reopen sale invoice for review, check \`UNDER_REVIEW\`, original paid held rather than refunded, unchanged stock and cash, customer remaining debt removed, and idempotent repeated review.
5. Verify readonly blocks finance POST, impersonated role rejected; no Cloudflare, no staff login, no canary and no genuine finance traffic.

Test prints \`ACC187_G4_FULL_SALE_REFUND_ACCEPTANCE=BLOCKED_MISSING_BUSINESS_DESIGN\`. This is *valuable evidence*, **not** completed sale refund capability. Need business rules for customer partial/full return, money refund vs credit, staff authorization, damaged/non-restockable goods, day-close correction and invoice lineage **before** implementation; do not assume defaults.

## Follow-on

ACC-187 is \`IN_PROGRESS_UNVERIFIED\` while tests/PR/CI need checking. Even if offline checks turn green, full stage must **not** mark \`VERIFIED_COMPLETE\` until legitimate refund behavior is explicitly designed, coded and tested. Meanwhile **unrelated safe stages ACC188, ACC189, ACC190 etc may proceed** without real finance release.

G1–G5 remain OPEN and NO_GO, existing ACC186 ledger/Issue #84 preserved. No production API credentials.
