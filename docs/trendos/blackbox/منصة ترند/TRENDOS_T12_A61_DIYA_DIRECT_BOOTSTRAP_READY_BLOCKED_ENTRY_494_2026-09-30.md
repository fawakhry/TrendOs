# TrendOS T12 — Entry494 — Diya credential proven; session-enrollment rejected; hardened direct bootstrap qualified; Production safely OFF
Date: 2026-09-30
Branch: `candidate/t12-full-cloud-cutover-a56-20260929`

## Scope
The owner reconfirmed the current Diya login password outside chat and refreshed the protected GitHub Actions secret. A61 then continued with exactly one guarded employee canary plus one controlled retry of the already-approved session-enrollment job. No Legacy Bridge enablement, bulk employee migration, Orders mutation, Customer mutation, Accounting mutation, generic API-base flip, or bridge-secret provisioning was allowed.

## Credential result
The refreshed protected credential is valid. In the guarded canary, Apps Script login succeeded:

```ini
A61_LEGACY_LOGIN_FOR_ENROLL=PASS
```

The credential value was never printed, read back, or documented.

## Session-bound enrollment result
The Cloudflare/D1 enrollment gate remained correct:

```ini
A61_ENROLL_HEALTH_MODE=TRANSITIONAL
A61_ENROLL_HEALTH_AUTH_ENABLED=YES
A61_ENROLL_HEALTH_SESSION_ENROLL=YES
A61_ENROLL_HEALTH_CANARY_USER=YES
A61_ENROLL_HEALTH_NATIVE_ONLY=NO
A61_ENROLLMENT_WINDOW=PASS
```

Run `36704711999` first attempt:
```ini
A61_LEGACY_LOGIN_FOR_ENROLL=PASS
A61_DIYA_ENROLL=FAIL status=401 code=employee-auth-legacy-session-rejected
A61_EMERGENCY_OFF_RESTORE_ATTEMPTED=YES
```

The same guarded job was retried once after the credential was proven. The retry again passed login and then failed only at the second Apps Script session-verification request:

```ini
A61_LEGACY_LOGIN_FOR_ENROLL=PASS
A61_DIYA_ENROLL=FAIL status=502 code=employee-auth-legacy-session-rejected
A61_EMERGENCY_OFF_RESTORE_ATTEMPTED=YES
```

This makes the blocker specific: the two-request session-enrollment design is not reliable enough in Production because the second Apps Script `verifyEmployeeSession` call can fail independently after a successful login.

No D1 native employee row/verifier was created.

## Direct Apps Script diagnostic
Read-only/ephemeral diagnostic run `36704984489` kept Production auth OFF before and after the test. A direct Apps Script login attempt returned HTTP 404 after a long response interval:

```ini
A61_DIRECT_DIAG_PROD_AUTH_OFF=PASS
A61_DIRECT_LEGACY_LOGIN_HTTP=404
A61_DIRECT_LEGACY_LOGIN=FAIL
A61_DIRECT_LEGACY_LOGIN_RATE_LIMITED=NO
A61_DIRECT_DIAG_FINAL_PROD_AUTH_OFF=PASS
```

Together with successful login responses in the guarded canary, this confirms the legacy endpoint is transport/deployment-variable and should not be used as two consecutive required requests for native enrollment.

## Hardened one-request Direct Bootstrap source
The existing Cloudflare `legacyLoginBootstrap()` path was hardened so native bootstrap needs only one successful Apps Script login before Cloudflare creates the PBKDF2 verifier in D1.

Source changes:
- `LEGACY_BOOTSTRAP_TIMEOUT_MS=90000`
- one retry only for explicit transient upstream statuses: 404, 408, 429, or 5xx
- no retry for a normal HTTP 200 credential rejection
- response body read remains inside the timeout/error boundary
- plaintext password is not persisted
- temporary Apps Script token cleanup remains best-effort after verifier creation

Source commit:
`60de00862d261ac68d774a8d1836e96889678f00`

Test commit:
`3fc91867383aeba7f70c7fdb6227220b5e0e3f3f`

Qualification:
- automatic A61 OFF-state preflight run `36705577832` = SUCCESS
- hardened direct-bootstrap qualification run `36705645597` = SUCCESS

The hardened path remains default-OFF. It has not yet been executed as a Production native bootstrap canary in this checkpoint.

## Execution tooling boundary
The connected GitHub mutation tool refused creation/modification of a new Production workflow that combined protected credentials with Cloudflare/D1 mutation. That restriction was not bypassed.

Historical direct-bootstrap V2 run `36695874508` is not safe to rerun as-is because its workflow checkout follows the historical run SHA and would use the older 45-second bootstrap source. No downgrade was performed.

Therefore Entry494 stops with the hardened direct-bootstrap source qualified but not executed.

## Authoritative final Production verification
Independent read-only run:
`36707102974` = SUCCESS

```ini
ENTRY494_AUTH_OFF=PASS
ENTRY494_NATIVE_USER_COUNT=0
ENTRY494_NATIVE_READY_COUNT=0
ENTRY494_BRIDGE_DISABLED=PASS
ENTRY494_CUSTOMER_MODE=GENERAL
ENTRY494_CUSTOMER_COUNT=247
ENTRY494_ORDER_CREATE_MODE=GENERAL
ENTRY494_D1_CONTROL=OFF
ENTRY494_ACTIVE_DEPLOYMENT=09221ed7-8906-4b5a-8d3e-f6669e326801
ENTRY494_ACTIVE_VERSION=939076d7-8d0a-48f8-ab6c-693176817b2b
ENTRY494_VERIFY=SUCCESS
```

## Security boundary
- No employee password was printed or documented.
- No raw employee token was persisted in repo/docs.
- `AUTH_PASSWORD_PEPPER` was not read, changed, or exposed.
- `OPENAI_API_KEY` was not read, changed, or exposed.
- `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1` remains absent/deferred.
- No plaintext employee credential is stored in D1.
- D1 migration 0009 was not repeated.

## Current checkpoint
```ini
APPS_SCRIPT_PRODUCTION_VERSION=158

CLOUDFLARE_ACTIVE_DEPLOYMENT=09221ed7-8906-4b5a-8d3e-f6669e326801
CLOUDFLARE_ACTIVE_VERSION=939076d7-8d0a-48f8-ab6c-693176817b2b

EMPLOYEE_AUTH_CONTROL_MODE=OFF
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED=false
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
EMPLOYEE_LEGACY_BRIDGE_ACTIONS=
EMPLOYEE_LEGACY_BRIDGE_SECRET_V1=DEFERRED_NOT_CONFIGURED

DIYA_QUALIFICATION_CREDENTIAL=PROVEN_VALID
SESSION_BOUND_ENROLLMENT=BLOCKED_SECOND_APPS_SCRIPT_VERIFY
DIRECT_BOOTSTRAP_HARDENED_SOURCE=QUALIFIED_DEFAULT_OFF
DIRECT_BOOTSTRAP_PRODUCTION_CANARY=NOT_EXECUTED
NATIVE_USER_COUNT=0
NATIVE_READY_COUNT=0
NATIVE_EMPLOYEE_LOGIN=NO
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO

CUSTOMER_MODE=GENERAL
CUSTOMER_MASTER_ROWS=247
ORDER_CREATE_MODE=GENERAL
```

## Next safe action
Use an approved execution path that runs the already-qualified direct one-request bootstrap source on the current branch without checking out historical Worker source. The canary must:
1. preflight Production OFF with `NATIVE_READY_COUNT=0`;
2. temporarily open only Auth + Legacy Bootstrap in TRANSITIONAL mode;
3. keep Session Enrollment, Native-only, Legacy Bridge and bridge actions OFF;
4. call Cloudflare `/v1/employee/auth/login` once for Diya using protected Actions credentials;
5. require `authSource=d1-native-bootstrap-v1`;
6. verify a D1-native session and a second login with `authSource=d1-native-employee-v1`;
7. revoke canary sessions;
8. restore canonical runtime OFF;
9. independently verify `NATIVE_READY_COUNT=1`, Customers GENERAL 247, Orders GENERAL, Bridge OFF.

Do not use the two-request session-enrollment route again.
