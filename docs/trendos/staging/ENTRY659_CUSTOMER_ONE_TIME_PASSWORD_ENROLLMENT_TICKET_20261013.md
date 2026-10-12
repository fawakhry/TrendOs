# Entry659 — One-time customer password enrollment ticket (source-only / NO_GO)
Date: 2026-10-13 Cairo.
Parent: Entry658 Draft #129 exact head `8f5c12c1e028d317e596a6971deafe5401ea23b9`.
Branch: `test/zero-google-customer-enrollment-ticket-off-20261013`.

## PREPARE and owner permission
Owner approved customer identity verification via mobile OTP followed by setting a **new** native password. The owner requested every work step be appended in TrendOS_MASTER_BOOK.md. This **does not** authorize customer SMS sends, production migration, Cloudflare deployment, live password changes, billing/invoice decisions or merge.

## Explicit vulnerability to close in source only
A challenge ID, client-provided `otpVerified=true`, or mere `challenge.status='VERIFIED'` must never authorize a customer password change. Entry658 provides one-use server-HMAC OTP CAS only in inert SQL. The future verification server must mint an unpredictable bearer **enrollment ticket** after true OTP redemption, return ticket secret only once to the same protected browser flow, and store only a server HMAC fingerprint. Password creation must atomically consume this ticket on the correct D1 customer account in ONE SQL UPDATE, without a second non-atomic consume step.

## Bounded actions
1. Prepare isolated branch after Entry658; log PREPARE here.
2. Add **UNAPPLIED** 0035 additive D1 account columns to hold a one-time ticket HMAC fingerprint, originating verified challenge ID and expiry (≤10min) with default empty values. Nothing in production is changed.
3. Add an inert, unimported source-only issuer and password-activation SQL contract. Ticket issuer usable **only** from a future trusted server-side OTP-success branch; issuance requires a prior VERIFIED challenge, same bound customer and matching valid phone grant, and account PENDING. No client route and NO raw ticket stored.
4. Activate new-password fields/state and blank/consume ticket in a single conditional SQL UPDATE requiring correct bound HMAC fingerprint, challenge still VERIFIED, account PENDING, approved grant, valid ticket TTL and PBKDF2 verifier from Entry657. Replays, wrong customer, wrong ticket, stale/expired/challenge ID alone fail.
5. Disposable in-memory SQLite and Node fake tests; source-only CI. Register commits/test outcomes/NO_GO in master book. Draft PR stacked on #129.

## STOP
No source code imported into `index_v2.js`, no database calls or network, no SMS vendor, no real D1, no Google migration, no customer session issued. True auth/CSRF/device/consent checking and provider/anti-enumeration/abuse controls remain blocking release gates. Cloudflare build preview failure unrelated and untriaged. `ZERO_GOOGLE_COMPLETE=NO`.

## RESULT — SOURCE-ONLY TEST PASS / PRODUCTION NO_GO

**Step 1 — PREPARE:** pinned Draft #129 source at `8f5c12c1e028d317e596a6971deafe5401ea23b9`; source-only prep committed `080f6f9b090a23dbc5508fd27e723ad7b1bdb758`. No customer, SMS, Cloudflare, D1 or Google call.

**Step 2 — Additive UNAPPLIED database shape:** migration `cloudflare-d1/migrations/0035_customer_portal_otp_enrollment_ticket_v1.sql` committed `be7cfdff702c64288c7e54b94f80cc47216964d9`. Adds fingerprint-only one-use ticket, verified originating challenge and short lifetime to the OFF Entry654 account table. No migration applied, inserts or customer password modified.

**Step 3 — Inert ticket+activation CAS:** `cloudflare-d1/src/customer-portal-password-enrollment-ticket-v0.mjs` committed `cd9a057c6da962525e952226f12f72c5e1c52565`, then ticket TTL comparison corrected in `f3fb2246bdfb545bea780453e7022d51e2c30e0e`. Trusted future post-OTP-only ticket issuer requires a VERIFIED-and-consumed challenge for this exact customer, owner-approved unexpired grant, inactive native account and on-mode control; one pending ticket at a time. Source-only credential activation requires server-HMAC 32-byte bearer ticket and fresh PBKDF2 verifier and performs ticket blanking, account activation and session-version increment in a **single conditional SQLite UPDATE**. Neither module nor migration is loaded by the live Worker.

**Step 4 — Offline regressions:** Python synthetic memory database test `tests/entry659_customer_password_ticket_sqlite.test.py`, commit `ff57b6e1a1f3bc46d302e3541c0bd8d1756842a4`, covers OFF, exact identity, incorrect/expired ticket, VERIFIED challenge and grant, one-time ticket issue, one-time password activation and schema hash constraints. Node HMAC cryptography contract committed `6bdb5bf1e31c8a4c1fa1a4a5dcec559d3f61c50b`. CI committed `a091a0317cd482442238d9b76b0c0a1561c1f6d8`.

**Step 5 — Test fix transparently recorded:** initial source CI [#38316884906](https://github.com/fawakhry/TrendOs/actions/runs/38316884906) **FAILED**, only because test harness used an over-specific regexp requiring a whitespace before exported SQL assignment; no SQL tests ran in that attempt. Corrected test parser commit `272244881545af6320467fc29d408962d4c2ea7a`. Full source-only [CI #38316935044](https://github.com/fawakhry/TrendOs/actions/runs/38316935044) **SUCCESS** on test+code head `272244881545af6320467fc29d408962d4c2ea7a`: Node HMAC ticket tests, SQLite proof and replay, no runtime route/no SMS/no DB mutation beyond :memory:.

**Step 6 — Handoff:** append canonical TrendOS_MASTER_BOOK.md and create **stacked Draft PR** only. The book/doc commit advances branch head; independently verify the latest PR exact-head CI. Preserve Entry658/#129 and upstream Drafts; no merging.

### STOP gates that remain
- Future trusted OTP verification endpoint must generate bearer ticket only after it wins OTP single-use HMAC CAS and bind proof to same authenticated browser; the sample SQL is **not accessible over any endpoint** and is not enough by itself to protect session theft, CSRF, enumeration or compromised device.
- Never activate password based on challenge ID, user-supplied `otpVerified` or third-party SMS receipt alone. Verify real account code+identity, phone exclusivity and reassignment, consent, SMS provider ACK and rate abuse controls.
- No production session issue/rotation/termination code exists. Real D1 concurrency canary and Cloudflare build readiness must be qualified separately, as must customer order/files/accounting data. NO live account activation or OTP SMS occurred. `ZERO_GOOGLE_COMPLETE=NO`.

