# TrendOS T12 — Entry497 — Orders session D1 shadow handoff — 2026-09-30

## Scope
Repo-only fix after Entry496 production install. No Cloudflare deploy by ChatGPT, no Wrangler, no D1 migration, no Google Sheet mutation, no secrets/variables/bindings mutation.

## Production symptom
After Entry496, the prior 02CR enrichment-stale blocker was removed, but Customer Service Orders still failed before the page read because:
```
POST /v1/edge/orders/session -> 502
Apps Script verification timeout
```

## Root cause
The browser login already completed one Cloudflare -> Apps Script authentication round-trip. Immediately afterwards, `/v1/edge/orders/session` independently called Apps Script `verifyEmployeeSession` again. If that second request timed out, Orders could not obtain the short-lived Edge token even though the employee browser session was valid.

## Fix
### Login/verify -> D1 auth shadow
`legacy-browser-transport-v1.mjs` now best-effort seeds the existing `cloud_auth_sessions_v1` shadow after a successful employee `login` or `verifyEmployeeSession`.

Only an HMAC token fingerprint plus non-secret user claims are stored. No plaintext password or raw employee token is stored.

### Sliding active-session validity
`cloud-auth-shadow-v1.mjs` extends a still-valid shadow entry on a successful exact username+token-fingerprint hit.

### Explicit revocation
Successful `logout` or `changePassword` revokes the matching D1 shadow fingerprint.

### Orders Edge TTL
Orders Edge sessions are capped at 240 seconds while the auth shadow TTL is 300 seconds. The frontend renews before Edge expiry, so an active Orders session refreshes through D1 before the auth shadow expires.

This removes the immediate and repeated Apps Script verification dependency from Orders session exchange after a successful login, while current login authority itself remains legacy until A61 native auth cutover.

## Commits
- `bb1ca13c4f28283124bf73f34ea000feb62269dd` — sliding/revocable D1 auth shadow
- `065eacf7a950c275b9d2379d1ca532002653a136` — seed/revoke shadow from successful legacy auth transport
- `37a0f4b75f3ea8207423c11db16a838be9af3c7d` — Orders Edge session TTL within shadow window
- `cc745365cec368c06158a31bab502ec489897388` — end-to-end regression test
- `f5644d9f71d0d852d22c7e370de4a39b6b87e1ab` — permanent CI coverage

## Qualification
GitHub Actions run:
`36745917638` = SUCCESS

Proven flow:
```
employee login -> Apps Script once
             -> Cloudflare stores HMAC fingerprint shadow in D1
Orders session -> D1 auth shadow hit
               -> Edge Orders token issued
               -> no second Apps Script verification
logout         -> Apps Script current authority
               -> D1 shadow fingerprint revoked
```

## State
```ini
ENTRY497_SOURCE_QUALIFIED=YES
ENTRY497_PRODUCTION_DEPLOYED=NO
ORDERS_SESSION_AFTER_LOGIN=D1_SHADOW
ORDERS_SESSION_SECOND_GOOGLE_VERIFY=NO_ON_SHADOW_HIT
RAW_EMPLOYEE_TOKEN_STORED=NO
PLAINTEXT_PASSWORD_STORED=NO
SHADOW_REVOKE_ON_LOGOUT=YES
SHADOW_REVOKE_ON_CHANGE_PASSWORD=YES
EMPLOYEE_LOGIN_AUTHORITY=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO
```

## Manual production sequence
1. Publish only the qualified API Worker to `trendos-d1-api`; preserve existing D1 binding, Variables and Secrets.
2. No frontend deploy is required.
3. Hard refresh TrendOS.
4. Sign out and sign in once to seed the D1 auth shadow from the successful login.
5. Open Customer Service and verify Orders render.
6. Console must show no `script.google.com` browser request and `/v1/edge/orders/session` must return 200.
7. Do not alter A61 native-auth/bridge flags.

After production verification, proceed to duplicate-order creation guard.
