# TrendOS T12 — Native Employee Auth Foundation A61 — Entry 479

Date: 2026-09-29 Cairo
Repository: `fawakhry/TrendOs`

## Scope
A61 Phase 1 only: build and qualify a Cloudflare/D1-native employee authentication foundation without changing Production auth authority.

No Order ID/status mutation occurred.
No Production D1 migration was applied.
No Worker production deployment occurred.
No frontend login cutover occurred.
No temporary employee password, legacy pepper value, raw employee token, or secret value was written to GitHub.

## Documentation reconciliation before A61
The active first page of `TrendOS_MASTER_BOOK.md` was reconciled through A60:
- commit `ee8648923f3b8e813d8c1596f36ef14130147fea`.

The current handoff was extended through A59/A60:
- commit `4e21657674d3cc4eb815447ec2a66578ab3e6f43`.

## A61 foundation
PR #25:
`T12 A61: native employee auth foundation (default OFF)`

Merged into:
`candidate/t12-full-cloud-cutover-a56-20260929`

Merge SHA:
`549809bd770c97d619c40f903accc369fd0166fc`

### Additive D1 schema
Migration:
`cloudflare-d1/migrations/0009_employee_auth_native_v1.sql`

Tables:
- `employee_auth_control_v1`
- `employee_auth_users_v1`
- `employee_auth_sessions_v1`

Control defaults:
```ini
EMPLOYEE_AUTH_CONTROL_MODE=OFF
```

Native user record contains only the authentication/authorization fields needed for TrendOS:
- stable employee ID
- normalized/canonical username
- password verifier metadata
- must-change
- active
- role
- department
- screens
- session version
- lockout counters/timestamps
- migration/login timestamps

Raw session tokens are not stored. Session rows store an HMAC fingerprint using the existing Edge session secret.

### Native password verifier
Module:
`cloudflare-d1/src/employee-auth-native-v1.mjs`

Scheme:
`pbkdf2-sha256-v1`

Current candidate defaults:
```ini
PBKDF2_ITERATIONS=180000
PASSWORD_SALT_BYTES=16
PASSWORD_HASH_BYTES=32
```

Each password gets an independent random salt.
No historical Apps Script pepper is copied into D1.

### Native endpoints
Exact routes:
- `POST /v1/employee/auth/login`
- `POST /v1/employee/auth/session`
- `POST /v1/employee/auth/logout`
- `POST /v1/employee/auth/password/change`
- `GET /v1/employee/auth/health`

Features:
- D1-native login/session/logout/password change.
- five failed attempts -> 15-minute lock.
- password change increments session version and revokes existing D1-native sessions.
- `mustChange` is carried in the native user response.

### Transitional bootstrap capability
A bounded legacy-login bootstrap capability exists in source for later controlled migration:
- it is usable only in control mode `TRANSITIONAL`;
- it also requires a separate runtime flag;
- it is default-OFF;
- a successful legacy login is immediately converted to a salted native verifier;
- the temporary Apps Script login token is not persisted in D1 and a best-effort logout is sent.

This capability is not Production-enabled by Entry479.

### Session bridge integration
`cloud-session-bridge-v3.mjs` now checks a valid native D1 employee session before the old auth-shadow/Apps Script verification path.

A separate native-only flag can fail closed on D1 session miss. It remains OFF.

### Runtime flags
`cloudflare-d1/wrangler.toml` currently keeps:
```ini
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false
EMPLOYEE_AUTH_SESSION_TTL_SECONDS=28800
EMPLOYEE_AUTH_PBKDF2_ITERATIONS=180000
```

Therefore:
```ini
A61_FOUNDATION_CODE=MERGED
A61_PRODUCTION_CUTOVER=NO
EMPLOYEE_LOGIN_AUTHORITY=APPS_SCRIPT
APPS_SCRIPT_AUTH_FALLBACK=STILL_PRESENT
ZERO_GOOGLE_COMPLETE=NO
```

## Qualification
A61 PR CI:
- first run `36581207582`: FAIL due a test false-positive; the test matched the forbidden secret identifier inside a safety comment, not a stored secret.
- comment was rewritten without changing auth logic or secret handling.
- second run `36581513796`: SUCCESS.
- syntax: PASS.
- native password/hash contract: PASS.
- default-OFF boundary: PASS.
- no Production mutation: PASS.

A repository-wide `TrendOS Integrity V1` check remains red on the existing 02CR Orders read test (`expected 200, actual 502`). The failing test directly imports the 02CR handler and Orders token helper; the A61 PR changed only six Auth/schema/config files and did not change that 02CR handler/test path. It is tracked as an unrelated existing integrity failure and is not being repaired inside Auth scope.

## Critical compatibility finding before Production cutover
The browser still calls many legacy Apps Script actions using the employee `username + token` contract.

A D1-only login token cannot be sent blindly to those legacy actions because Apps Script currently validates its own token stored in the Users sheet.

Therefore a direct frontend switch:
```ini
LOGIN=D1_NATIVE
LEGACY_ACTIONS=APPS_SCRIPT
```
would break legacy screens.

Production A61 must not enable native login until a compatibility boundary is qualified.

## Next A61 phase
Design and qualify a compatibility bridge that keeps D1 as the authentication authority while legacy business actions remain temporarily on Apps Script.

The bridge must:
1. authenticate the browser with D1;
2. avoid exposing or storing plaintext passwords;
3. avoid reintroducing Apps Script as auth authority;
4. authorize each legacy request from a verified D1 session;
5. preserve role/department/screens;
6. fail closed;
7. be removable after the remaining Apps Script actions migrate to Cloudflare.

Only after that bridge is qualified may a guarded Production auth migration be considered.
