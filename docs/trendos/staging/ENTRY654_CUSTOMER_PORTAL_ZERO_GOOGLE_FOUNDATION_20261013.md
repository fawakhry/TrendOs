# Entry654 — Customer Portal Zero-Google Native Identity Foundation (SOURCE ONLY / NO_GO)

Date: 2026-10-13 Africa/Cairo
Repository: fawakhry/TrendOs
Base source: PR #124 head `3fda291f33ec00a03866219a5ed1f06111bda6c2`
Branch: `test/zero-google-customer-portal-foundation-no-go-20261013`
Project: TrendOS only, not EasyStore accounting or Autonomous Printshop.

## PREPARE — E654-CUSTOMER-IDENTITY
Owner request: continue Zero-Google autonomously only within repository/offline-test authority. Do not merge, deploy, run live migrations, change flags/properties, send a live customer request, read secrets or touch finances, stock, Google Drive, Cloudflare or D1.

Known 9 Apps Script customer-session actions allowed in `cloudflare-d1/src/legacy-browser-transport-v1.mjs`:
1. customerLogin — password/rate-limit/token stored in Google customer sheet.
2. customerLogout — Google sheet session token.
3. changeCustomerPassword — Google sheet credentials and session.
4. getCustomerOrders — Google sheet read.
5. getCustomerPortalAccountsV1859 — Google finance ledgers, not a trustworthy EasyStore authority.
6. createCustomerDraft — Google sheet/Drive draft folder creation.
7. addCustomerDraftItem — Google sheet and Drive item folder.
8. submitCustomerDraft — legacy Google official-order CREATE is fenced by T12 Cloud Order ID authority; must not reactivate.
9. uploadCustomerDraftFile — Google Drive base64 upload up to 25MB.

Evidence: `Code.gs` customer auth/portal and draft handlers, `app.js` customer login/draft flows, `cloudflare-d1/migrations/0008_t12_customer_master.sql` contains customer master records but **no** native customer password/session tables. Employee Native Auth is a distinct identity realm, and D1 customer master write authority does not confer portal-login authority.

## Bounded source-only scope
- Add an **additive, default-OFF** customer-native identity schema for future explicit code/identity linkage, hashed-only credentials and session fingerprints; no legacy token/password import, no external customer migration, no auth endpoint.
- Add privacy-safe source-only readiness inspector that uses SELECT queries, reports only numerical data completeness/mapping conflicts, never discloses customer identity/financial data, and always returns NO_GO absent separately qualified real runtime proofs.
- Add SQLite in-memory schema constraint tests and pure mocked inspector tests; only source-only CI on exact PR head.
- Never treat customer code/name/phone matching as identity verification. Provisioning native customer credentials will require a distinct controlled enrollment/identity-proof process. Do not reuse employee token or an existing Google session as an automatic customer-native credential.
- Do not change `cloudflare-d1/src/index_v2.js`, `app.js`, `config.js`, customer scripts, routing, Cloudflare settings, D1, source/owner financial accounting or production.

## Gates that remain OPEN
G-CUST-1: authoritative customer identity/unique code mapping, collision handling and independent consent/enrollment.
G-CUST-2: password & session security, rotation and revocation with deployed test.
G-CUST-3: customer-owned order read parity with no cross-customer leakage.
G-CUST-4: draft write, file R2 object ownership/permissions, SHA-256, idempotency, size limits and retention.
G-CUST-5: Cloud-native `submitCustomerDraft` tied atomically to T12 official Order IDs — no legacy Sheets writer.
G-CUST-6: accounts read belongs to EasyStore financial authority; no fake zero balance/legacy finance claim.
G-CUST-7: live read-only route/current-user smoke, controlled canary, rollback, independent reviewer and final Zero-Google runtime audit.

Expected: schema defaults OFF, zero customer rows imported, no plaintext passwords/tokens, no runtime behavior change; source-only CI green. No customer success claims; `ZERO_GOOGLE_COMPLETE=NO`.

## RESULT
PENDING. Update with exact head/CI proof after changes.
