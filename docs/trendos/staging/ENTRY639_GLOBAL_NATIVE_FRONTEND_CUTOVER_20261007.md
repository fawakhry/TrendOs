# Entry639 — Global Native Frontend Cutover Evidence

Date: 2026-10-07
Repository: fawakhry/TrendOs
Branch: candidate/t12-full-cloud-cutover-a56-20260929

## Scope
Employee frontend Auth cutover only.
No EasyStore mutation.
No D1 business mutation.
Accounting was observed only and remained READONLY.

## Attempt 1 — failed before any deploy
- Workflow source commit: 5164ec36e34c9b9bde6780350dae6e8fea6e5718
- Run: 37542306567
- Job: 112537960050
- Result: FAILURE in "Exact Runtime and repository preflight"
- Deploy step: SKIPPED
- Production frontend mutation: NO

Reason:
- The workflow pinned historical Accounting policyEpoch=2.
- Live Runtime truth had already advanced Accounting to policyEpoch=8.
- Live Accounting safety state was:
  - mode=READONLY
  - authoritativeWrites=false
  - writeAuthorityMode=OFF
  - googleBusinessCalls=0
  - appsScriptBusinessAuthority=false
- This was treated as legitimate Runtime drift; Accounting was not changed or rolled back.

Guard-fix commit:
- 8e356f7c7661ee36d625c08516b2fb5aa9d8dae3
- The guard was changed to validate READONLY safety invariants rather than pinning an obsolete epoch.

## Attempt 2 — PASS
- Run: 37542439809
- Job: 112538399521
- Result: SUCCESS

Preflight:
- ENTRY639_RUNTIME_PREFLIGHT=PASS
- ENTRY639_NATIVE_READY=6_OF_6
- ENTRY639_BACKEND_NATIVE_ONLY=true
- ENTRY639_BACKEND_BOOTSTRAP=false
- ENTRY639_BACKEND_BRIDGE=false
- ENTRY639_REPO_DRIFT_BASELINE=PASS
- ENTRY639_EXACT_LIVE_BASELINE=PASS

Frontend versions:
- Previous active version: 697f2afb-87c2-47cc-9889-3e986e7f0863
- New active version: ecba8460-e9c1-4fc7-81a2-1cf5c054943a
- Propagation verified on attempt 4.

Global Native frontend state:
- MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=true
- MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1=false
- MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_USERS=[]
- MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_REQUIRED_READY_COUNT=6
- MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false
- MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES=[]

Family routing preserved from deployed truth:
- OPS=GENERAL
- CORE=READONLY
- CONTENT=READONLY
- COMMS=READONLY
- ACCOUNTING=READONLY

Live smoke:
- ENTRY639_GLOBAL_NATIVE_LOGIN=PASS
- ENTRY639_LEGACY_BRIDGE_CALLS=0
- ENTRY639_GLOBAL_NATIVE_LOGOUT=PASS
- ENTRY639_RUNTIME_POSTFLIGHT=PASS
- ENTRY639_GLOBAL_NATIVE_FRONTEND=PASS
- ENTRY639_GLOBAL_NATIVE_AUTH=ON
- ENTRY639_FRONTEND_CANARY=OFF
- ENTRY639_FRONTEND_BRIDGE=OFF
- ENTRY639_REQUIRED_NATIVE_READY=6

Rollback:
- Previous frontend version was captured before deploy.
- Automatic rollback was armed for deploy/postflight failures.
- No rollback was invoked because all deploy smoke and postflight checks passed.

Repository reconciliation:
- config.js was reconciled from exact deployed config after successful production cutover.
- Commit: 302386136af2a694f7c8447eb741419308a52a82
- ENTRY639_REPO_CONFIG_RECONCILED=PASS

Final stable Runtime proof:
- Backend Auth:
  - mode=TRANSITIONAL
  - NATIVE_ONLY=true
  - LEGACY_BOOTSTRAP=false
  - LEGACY_SESSION_ENROLL=false
  - D1_AUTH_USERS=6
  - D1_NATIVE_READY_USERS=6
  - MUST_CHANGE=0
  - PLAINTEXT_STORED=false
- Backend Bridge:
  - enabled=false
  - rawNativeTokenForwarded=false
  - plaintextPasswordForwarded=false
- Accounting:
  - mode=READONLY
  - policyEpoch=8
  - authoritativeWrites=false
  - writeAuthorityMode=OFF
  - googleBusinessCalls=0
  - appsScriptBusinessAuthority=false

Boundaries:
- ENTRY639_D1_MUTATION=NO
- ENTRY639_ACCOUNTING_TOUCHED=NO
- ENTRY639_EASYSTORE_TOUCHED=NO

Final:
- ENTRY639=PASS
- GLOBAL_NATIVE_FRONTEND_CUTOVER=PASS
- GLOBAL_NATIVE_AUTH=true
- FRONTEND_CANARY=false
- FRONTEND_BRIDGE=false
- BACKEND_NATIVE_ONLY=true
- BACKEND_BOOTSTRAP=false
- BACKEND_BRIDGE=false
- NATIVE_READY=6/6
