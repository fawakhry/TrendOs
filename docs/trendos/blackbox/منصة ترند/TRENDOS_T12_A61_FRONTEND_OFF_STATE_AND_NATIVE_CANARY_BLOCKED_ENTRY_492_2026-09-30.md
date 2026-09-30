# TrendOS T12 — Entry492 — A61 Frontend OFF-state live + Native bootstrap canary blocked safely
Date: 2026-09-30
Branch: `candidate/t12-full-cloud-cutover-a56-20260929`

## Scope
Owner explicitly authorized continuing the T12 Zero-Google transfer after Entry491. This phase did **not** enable native employee login globally and did **not** enable the legacy bridge.

## 1. Native employee bootstrap canary attempt
Temporary workflow run:
- GitHub Actions run: `36692243224`
- Purpose: qualify one existing Production qualification employee by temporarily opening only A61 native auth/bootstrap, create a D1 verifier if the existing credential remained valid, verify native session, then restore OFF.

Preflight:
```ini
A61_CANARY_PREFLIGHT=PASS
PRE_NATIVE_READY_COUNT=0
D1_CONTROL_PREFLIGHT=OFF
BRIDGE_ENABLEMENT=NO
BRIDGE_SECRET_ACCESS=NO
```

The workflow temporarily used:
```ini
EMPLOYEE_AUTH_CONTROL_MODE=TRANSITIONAL
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=true
TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=true
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
EMPLOYEE_LEGACY_BRIDGE_ACTIONS=
```

Transitional health passed and the legacy bridge remained disabled.

The bootstrap login then failed safely with HTTP 401 from the existing Apps Script login path. The credential values were never printed. This is consistent with the existing `TRENDOS_PROD_QUALIFY_PASSWORD` Actions secret being stale after the A60 forced employee password reset.

No native verifier was created:
```ini
NATIVE_READY_COUNT=0
NATIVE_EMPLOYEE_MIGRATED=NO
```

## 2. Automatic rollback and independent proof
The failure path immediately:
1. reset `employee_auth_control_v1.mode` to `OFF`;
2. redeployed the canonical A61 OFF-state Worker configuration;
3. removed ephemeral runner token/config files.

Emergency restore Worker version:
`a2f0bb11-3fbc-4f9b-ba87-a8a6826a7a92`

Independent OFF-state verification run `36692423714` succeeded.

The authoritative A61 read-only verification workflow was then rerun as run `36688742762`, attempt 2, and succeeded. Current API Worker proof:
```ini
ACTIVE_DEPLOYMENT_ID=d28ab053-3811-46dd-ae79-ca23137f6a79
ACTIVE_VERSION_ID=a2f0bb11-3fbc-4f9b-ba87-a8a6826a7a92
LIVE_BUNDLE_SHA256=befde84a727cf7bb0b7f3a8769b7b5aad560d783ab7edf9f783430e84b083494
EXPECTED_A61_TARGET_BUNDLE_SHA256=befde84a727cf7bb0b7f3a8769b7b5aad560d783ab7edf9f783430e84b083494
LIVE_EQUALS_A61_TARGET=YES
SETTINGS_OFF_STATE=PASS
AUTH_HEALTH=PASS_OFF
BRIDGE_HEALTH=PASS_DISABLED
D1_AUTH_CONTROL_MODE=OFF
CUSTOMER_MODE=GENERAL
CUSTOMER_COUNT=247
ORDER_CREATE_MODE=GENERAL
PROTECTED_ROUTES=PASS_AUTH_PROTECTED
```

Therefore the failed canary caused no Production drift and no Customers/Orders/Accounting regression.

## 3. A61 frontend dispatcher installed live, default-OFF
A dedicated frontend-only deployment was qualified from exact current `main`:
`12dd9d31bcd36db736f0c06191812bdcc5167bad`

GitHub Actions run:
`36692737729`

Production frontend Worker version:
`48c7ae87-0998-4e67-97df-b198a54d97e1`

Verification:
```ini
A61_FRONTEND_EMPLOYEE_DISPATCHER=PASS
A61_FRONTEND_EXACT_MAIN_QUALIFIED=PASS
A61_FRONTEND_ONLY_DEPLOY=PASS
A61_FRONTEND_DISPATCHER_LIVE_DEFAULT_OFF=PASS
A61_FRONTEND_POSTDEPLOY_RUNTIME=PASS

MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false
MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false
MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES=[]
EMPLOYEE_AUTH=OFF
LEGACY_BRIDGE=OFF
NATIVE_READY_COUNT=0
CUSTOMER_MODE=GENERAL
ORDER_CREATE_MODE=GENERAL
```

Only `trendos-ui` was deployed in this frontend step. No D1 mutation or API Worker deployment occurred during that frontend deployment.

## 4. D1 user/mirror discovery
Read-only run `36693021517` confirmed the employee/auth-related D1 tables currently present are:
- `cloud_auth_sessions_v1`
- `employee_auth_control_v1`
- `employee_auth_sessions_v1`
- `employee_auth_users_v1`

There is no separate D1 Users mirror table available to seed native employee profiles from. Therefore A59's historical Users mirror cannot be used as a password-free D1 source in this phase.

## 5. Security boundary
No value was read, logged, created, or stored for:
- `AUTH_PASSWORD_PEPPER`
- `OPENAI_API_KEY`
- `EMPLOYEE_LEGACY_BRIDGE_SECRET_V1`
- employee passwords
- employee session tokens

`EMPLOYEE_LEGACY_BRIDGE_SECRET_V1` remains deferred/not configured.

## 6. Cleanup
All temporary workflows created for this phase were deleted after execution:
- native bootstrap canary
- post-canary OFF verifier
- frontend OFF-state deployment
- D1 user-mirror discovery

The retained A61 post-deploy read-only verifier remains the authoritative diagnostic workflow.

## Current checkpoint
```ini
A61_FRONTEND_DISPATCHER_LIVE=YES_DEFAULT_OFF
A61_FRONTEND_VERSION=48c7ae87-0998-4e67-97df-b198a54d97e1

CLOUDFLARE_API_A61_SOURCE=LIVE
CLOUDFLARE_API_ACTIVE_VERSION=a2f0bb11-3fbc-4f9b-ba87-a8a6826a7a92
A61_LIVE_BUNDLE_SHA256=befde84a727cf7bb0b7f3a8769b7b5aad560d783ab7edf9f783430e84b083494
A61_TARGET_BUNDLE_MATCH=YES

EMPLOYEE_AUTH_CONTROL_MODE=OFF
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
EMPLOYEE_LEGACY_BRIDGE_ACTIONS=
EMPLOYEE_LEGACY_BRIDGE_SECRET_V1=DEFERRED_NOT_CONFIGURED

NATIVE_READY_COUNT=0
NATIVE_EMPLOYEE_LOGIN=NO
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO

CUSTOMER_MODE=GENERAL
CUSTOMER_MASTER_ROWS=247
ORDER_CREATE_MODE=GENERAL

A61_NATIVE_BOOTSTRAP_CANARY=BLOCKED_STALE_QUALIFY_CREDENTIAL
NEXT_OWNER_ACTION=REFRESH_PRODUCTION_QUALIFICATION_CREDENTIAL_OUTSIDE_CHAT_THEN_RERUN_SINGLE_USER_NATIVE_BOOTSTRAP_CANARY
```

## Next safe action
Do **not** send the employee password in chat and do not store it in repo/docs/logs. The next Production canary requires a current controlled qualification credential supplied through a protected secret path (for example updating the existing GitHub Actions qualification secret), then rerun a single-user native bootstrap canary. Native login, Native-only mode, bridge enablement, and Legacy Orders cutover remain out of scope until that canary succeeds.
