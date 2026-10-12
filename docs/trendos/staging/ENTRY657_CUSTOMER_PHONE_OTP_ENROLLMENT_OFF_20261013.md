# Entry657 — Customer Phone OTP → Native Password Enrollment Foundation
Date: 2026-10-13 Africa/Cairo
Authorization: owner explicitly approved **phone verification code, then a newly created cloud password**, not a Production rollout.
Base: Entry656 Draft PR #127 at `9b50053ca8b90e755d8d37f5e015dd7c44df22e8`.
Branch: `test/zero-google-customer-otp-enrollment-off-20261013`.

## PREPARE / hard boundaries
- Repo/source-only: create additive UNAPPLIED migration, policy primitives, offline tests, separate Draft PR, and append to TrendOS_MASTER_BOOK.md.
- **NO PROD changes** to D1, Cloudflare, Worker endpoints, SMS/WhatsApp sends, Apps Script, Google Drive/Sheets, customer data, employee credentials, stock, EasyStore accounting or Autonomous Printshop.
- No customer SMS/OTP is sent; no production SMS provider is selected/configured. Implementation deliberately has NO sender or HTTP route and does NOT import the module into `cloudflare-d1/src/index_v2.js`.
- Existing `0032_customer_portal_identity_foundation_v1.sql` is OFF, no customer enrollment, no automatic password import. `0033_customer_portal_native_order_ownership_v1.sql` remains unapplied/PENDING.
- Owner agreed a **workflow**, NOT that any particular D1 customer phone number is valid or exclusively controlled by its customer; independent owner-verified identity binding/consent required. Duplicate/shared/mobile reassignment has to fail closed.

## Target protocol / proposed acceptance gates
1. A customer supplies their portal code; server must match exactly one independently owner-reviewed D1 customer-to-portal-code binding and current active customer record. No fuzzy name matching; no phone-only account discovery; no implicit migration of Google tokens or historical passwords.
2. The chosen Egyptian mobile must be normalized/eligible (+20, 0020, 01...) AND verified as the current owned contact with independent evidence, AND **unique** across all active customers (phone and extra_phone considered). Shared/family/shop numbers = manual review; phone SMS alone is insufficient proof of entitlement to historical orders or finance.
3. Only an explicitly approved grant with fingerprint (HMAC; no plaintext OTP), audit reviewer and fresh evidence may be used. Additive challenge/rate tables default UNSENT, NO outgoing delivery side effects, TTL ≤5 minutes, cooldown ≥60 seconds, bounded issuance and ≤5 verification attempts; challenge IDs must be unpredictable. Never log OTP, phone, password, raw session, HMAC secret or financial data.
4. OTP MAC is keyed by dedicated secret, account, grant phone fingerprint and random challenge ID. Single-use redemption via future atomic DB conditional update, not just a client/session flag. Constant-time digest comparison, expiry and replay denial, uniform external error for invalid credentials.
5. Only after securely verified OTP, user may set a **new** password: PBKDF2-SHA256 at Worker-safe 100k iterations, fresh random 16-byte salt, ≥12 characters. No old Google password reuse/import, no default customer password and no employee-token bypass.
6. Before production: independently reviewed customer ID mapping + consent, chosen SMS provider with opt-in/privacy and sender verification, server-side rate limits/abuse monitoring including anti-enumeration, atomic rate counters, credential/session revocation, device/session expiry and source isolation, controlled canary and rollback, current clean Cloudflare builds/runtime parity. Owner release authorization separate.

## Scope in code
- New migration `0034_customer_portal_phone_otp_enrollment_v1.sql`: additive grant, challenge, SMS send/verify rate counters; no writes of customer rows on apply; no live login route.
- Pure module `cloudflare-d1/src/customer-portal-phone-enrollment-v0.mjs`: strict Egyptian phone normalization, eligibility/checks, safe OTP hash/verify and password verifier. No database access or network/sender. Exact owner-verified customer binding is a trusted precondition; source-only policies cannot prove it.
- In-memory SQLite tests + mock offline Node tests, GitHub CI. Customer schema modes **remain OFF**. `ZERO_GOOGLE_COMPLETE=NO`.

## RESULT
Pending source/CI. This is an engineering foundation and must not be represented as a functioning customer OTP service.
