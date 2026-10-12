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

## RESULT
PENDING.
