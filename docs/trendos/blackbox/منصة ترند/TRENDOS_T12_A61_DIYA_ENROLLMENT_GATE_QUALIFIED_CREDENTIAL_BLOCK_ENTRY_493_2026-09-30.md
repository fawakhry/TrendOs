# TrendOS T12 — Entry493 — Diya enrollment gate qualified; credential path currently blocked, Production safely OFF
Date: 2026-09-30
Branch: `candidate/t12-full-cloud-cutover-a56-20260929`

## Scope
Owner refreshed the protected Production qualification credentials for employee `ضياء` and authorized continuation of A61. This phase remained single-user and guarded. No Legacy Bridge enablement, bulk employee migration, Orders mutation, Customer mutation, Accounting mutation, generic API-base flip, or bridge-secret provisioning was allowed.

## 1. Credential/bootstrap attempts and safe rollback
Initial direct native-bootstrap run `36695216149` opened only the temporary A61 TRANSITIONAL window and failed at the bootstrap request. Emergency rollback restored the canonical OFF configuration.

Subsequent work introduced and qualified a safer session-bound enrollment path:
- route: `/v1/employee/auth/enroll-legacy-session`
- default repository flag: `TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED=false`
- exact canary-user binding
- verified legacy Apps Script session required before D1 verifier creation
- request nonce boundary
- Native-only and Legacy Bridge remain OFF during enrollment
- no plaintext password is persisted

The session-bound source was installed default-OFF and qualification runs passed.

## 2. Apps Script latency hardening
Observed Apps Script employee login/verification latency was variable and sometimes exceeded the original short timeout.

A read-only latency diagnostic measured one login response at approximately 54.5 seconds. Production employee auth remained OFF before and after that diagnostic and `NATIVE_READY_COUNT=0`.

Cloudflare A61 session verification was hardened:
- legacy bootstrap timeout remains 45 seconds;
- legacy-session verification timeout increased to 90 seconds;
- both `fetch()` and response-body reading are covered by the abort/error boundary;
- upstream timeout/fetch failures now fail closed instead of surfacing an unclassified Worker 500.

Qualification run `36700033171` = SUCCESS.

## 3. Safe enrollment diagnostics
Enrollment write failures were wrapped with non-secret stage-only diagnostics:
- `password-hash`
- `d1-user-upsert`

No exception detail, employee password, token, pepper, or secret is emitted.

A later canary run `36700617785` proved the request was being rejected before any D1 upsert by the enrollment enablement gate. Therefore no partial native user was created.

The auth health response was extended with booleans only:
- `legacySessionEnrollEnabled`
- `enrollCanaryUserConfigured`
- `enrollNonceConfigured`

No values are exposed.

Qualification run `36701032748` = SUCCESS.

## 4. Enrollment window itself is now proven correct
The guarded canary was reordered so Cloudflare/D1 enrollment gates are proven live before any Apps Script login attempt.

Run `36701443364` proved:
```ini
A61_DIYA_ENROLL_PREFLIGHT=PASS
A61_ENROLL_HEALTH_MODE=TRANSITIONAL
A61_ENROLL_HEALTH_AUTH_ENABLED=YES
A61_ENROLL_HEALTH_SESSION_ENROLL=YES
A61_ENROLL_HEALTH_CANARY_USER=YES
A61_ENROLL_HEALTH_NATIVE_ONLY=NO
A61_ENROLLMENT_WINDOW=PASS
```

Only after that proof did the workflow call Apps Script login.

The latest login response was:
```ini
A61_LEGACY_LOGIN_FOR_ENROLL=FAIL
A61_LEGACY_LOGIN_HTTP_STATUS=200
A61_LEGACY_LOGIN_RATE_LIMITED=NO
A61_LEGACY_LOGIN_SERVER_ERROR=NO
```

Earlier guarded runs using the same protected qualification path had successfully reached:
`A61_LEGACY_LOGIN_FOR_ENROLL=PASS`.

Therefore the Cloudflare enrollment gate is no longer the blocker. The protected Production qualification credential must be treated as not currently reliable enough for another automatic attempt until the current Diya credential is reconfirmed outside chat.

No D1 native verifier was created.

## 5. Live Users-sheet read-only check
Using connected Google Drive/Sheets read-only access, only non-secret columns for the Diya row were read. Password and Token columns were not read.

Current row state:
```ini
USERNAME=ضياء
DEPARTMENT=الادارة
ROLE=مدير
ACTIVE=نعم
MUST_CHANGE=لا
LAST_LOGIN_DATE=2026-09-30
```

This proves the production employee row exists, is active, and is not awaiting a mandatory password change.

## 6. Authoritative post-canary OFF verification
Independent read-only workflow run:
`36701918580`

Result:
```ini
POST_DIYA_OFF_VERIFY=SUCCESS
ACTIVE_DEPLOYMENT_ID=8b3623a7-7c64-4225-b830-b800b366c573
ACTIVE_VERSION_ID=ca1f193c-9496-4dfe-b0ea-1e299b314e95
LIVE_BUNDLE_SHA256=a000921d0841d41e3dd2b7e8da969e08eb2abc528cd1fad631fcfb1703646c73

SETTINGS_OFF_STATE=PASS
ENROLLMENT_GATE_DEFAULT_OFF=PASS
BRIDGE_SECRET_PRESENT=NO

AUTH_HEALTH=PASS_OFF
D1_AUTH_CONTROL_MODE=OFF
NATIVE_USER_COUNT=0
NATIVE_READY_COUNT=0
BRIDGE_HEALTH=PASS_DISABLED

CUSTOMER_MODE=GENERAL
CUSTOMER_COUNT=247
ORDER_CREATE_MODE=GENERAL
```

The live bundle hash differs from Entry492 because the default-OFF session-enrollment/timeout/diagnostic source was intentionally installed during this phase. Runtime authority did not change: every employee-auth/enrollment/bridge control is back OFF.

## Security boundary
No employee password or session token was printed or documented.
No password/token column was read from Google Sheets.
`AUTH_PASSWORD_PEPPER` was not read, changed, or exposed.
`OPENAI_API_KEY` was not read, changed, or exposed.
`EMPLOYEE_LEGACY_BRIDGE_SECRET_V1` remains absent/deferred and was not created/read.
No plaintext employee credential is stored in D1.

## Current checkpoint
```ini
APPS_SCRIPT_PRODUCTION_VERSION=158

CLOUDFLARE_ACTIVE_DEPLOYMENT=8b3623a7-7c64-4225-b830-b800b366c573
CLOUDFLARE_ACTIVE_VERSION=ca1f193c-9496-4dfe-b0ea-1e299b314e95
A61_LIVE_BUNDLE_SHA256=a000921d0841d41e3dd2b7e8da969e08eb2abc528cd1fad631fcfb1703646c73

EMPLOYEE_AUTH_CONTROL_MODE=OFF
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED=false
EMPLOYEE_AUTH_ENROLL_CANARY_USER=
EMPLOYEE_AUTH_ENROLL_NONCE=
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
EMPLOYEE_LEGACY_BRIDGE_ACTIONS=
EMPLOYEE_LEGACY_BRIDGE_SECRET_V1=DEFERRED_NOT_CONFIGURED

A61_ENROLLMENT_WINDOW_QUALIFIED=YES
NATIVE_USER_COUNT=0
NATIVE_READY_COUNT=0
NATIVE_EMPLOYEE_LOGIN=NO
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO

CUSTOMER_MODE=GENERAL
CUSTOMER_MASTER_ROWS=247
ORDER_CREATE_MODE=GENERAL

A61_DIYA_CANARY=BLOCKED_CURRENT_LEGACY_CREDENTIAL_RECONFIRMATION
NEXT_OWNER_ACTION=RECONFIRM_CURRENT_DIYA_LOGIN_PASSWORD_OUTSIDE_CHAT_AND_REFRESH_PROTECTED_QUALIFY_SECRET_THEN_RUN_ONE_GUARDED_CANARY
```

## Next safe action
Do not send the password in chat. Reconfirm that the current Diya password can log in to TrendOS now, then overwrite the protected GitHub Actions qualification password secret with that exact current password. After that, execute exactly one guarded canary using the already-qualified gate-first workflow. Do not enable Native-only for users generally and do not enable the Legacy Bridge until the single-user D1 native login/session proof succeeds.
