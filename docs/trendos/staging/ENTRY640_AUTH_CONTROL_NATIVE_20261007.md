# Entry640 — Employee Auth Control NATIVE Closure Evidence

Date: 2026-10-07
Repository: fawakhry/TrendOs
Branch: candidate/t12-full-cloud-cutover-a56-20260929

## Scope
Final employee Auth control-plane closure only:
- D1 employee_auth_control_v1 mode TRANSITIONAL -> NATIVE.
- No API code deployment.
- No frontend deployment.
- No Apps Script mutation.
- No Accounting mutation.
- No EasyStore mutation.
- No business-data mutation.

## Controlled execution
Workflow:
.github/workflows/trendos-entry640-auth-control-native-controlled.yml

Workflow source commit:
748f20c9db3bdfe6e92adbad2cb8e0a0f3d46211

Run:
37543328267

Job:
112541292439

Conclusion:
SUCCESS

## Exact pre-state
Public Runtime:
- auth mode=TRANSITIONAL
- envEnabled=true
- legacyBootstrapEnabled=false
- legacySessionEnrollEnabled=false
- nativeOnly=true
- userCount=6
- nativeReadyCount=6
- mustChangeCount=0
- plaintextStored=false
- backend bridge=false

Frontend:
- Global Native Auth=true
- Native Canary=false
- canary user list=[]
- required Native-ready count=6
- frontend bridge=false

D1 control:
- mode=TRANSITIONAL
- policyEpoch=23
- target policyEpoch=24
- Native-ready users=6/6
- password hash values logged=NO

## Mutation
The only control mutation was a conditional exact-state update:
- TRANSITIONAL epoch23 -> NATIVE epoch24
- changed row count required to equal 1

Proof:
- ENTRY640_D1_CONTROL_MUTATION=PASS
- ENTRY640_AUTH_CONTROL=NATIVE
- ENTRY640_AUTH_POLICY_EPOCH=24

## Transitional-path closure proof
After the mutation:
- public Auth health propagated to mode=NATIVE on attempt 1
- legacy session enrollment returned fail-closed:
  ENTRY640_LEGACY_SESSION_ENROLL_CONTROL_CLOSED=PASS
- a synthetic unmigrated login returned migration-required without Bootstrap:
  ENTRY640_UNKNOWN_USER_BOOTSTRAP_CLOSED=PASS

## Real Native login proof
Using the already-configured qualification credentials from GitHub Secrets; no password/token value was logged:
- ENTRY640_NATIVE_LOGIN=PASS
- authSource=d1-native-employee-v1
- ENTRY640_LEGACY_BRIDGE_CALLS=0
- ENTRY640_NATIVE_LOGOUT=PASS

## Final D1 proof
- ENTRY640_FINAL_D1_CONTROL=NATIVE
- ENTRY640_FINAL_AUTH_POLICY_EPOCH=24
- ENTRY640_FINAL_NATIVE_READY=6_OF_6
- ENTRY640_PASSWORD_HASH_VALUE_LOGGED=NO

## Final Runtime proof
- ENTRY640_RUNTIME_FINAL=PASS
- ENTRY640_AUTH_MODE=NATIVE

Stable public Runtime after the workflow:
- mode=NATIVE
- legacyBootstrapEnabled=false
- legacySessionEnrollEnabled=false
- nativeOnly=true
- userCount=6
- nativeReadyCount=6
- mustChangeCount=0
- plaintextStored=false

Backend Bridge:
- enabled=false
- rawNativeTokenForwarded=false
- plaintextPasswordForwarded=false

Family boundaries remained:
- CORE=READONLY / epoch1
- CONTENT=READONLY / epoch2
- COMMS=READONLY / epoch2
- OPS=GENERAL / epoch7
- ACCOUNTING=READONLY / epoch8
- Accounting authoritativeWrites=false
- Accounting writeAuthorityMode=OFF
- Accounting googleBusinessCalls=0
- Accounting appsScriptBusinessAuthority=false

Frontend remained:
- FRONTEND_GLOBAL_NATIVE_AUTH=true
- FRONTEND_NATIVE_CANARY=false
- FRONTEND_BRIDGE=false
- FRONTEND_REQUIRED_NATIVE_READY=6

## Rollback
Rollback was prepared to restore exactly:
- NATIVE epoch24 -> TRANSITIONAL epoch23
only if a post-mutation step failed.

Rollback step result:
SKIPPED
Reason:
All post-mutation checks passed.

## Final
- ENTRY640=PASS
- EMPLOYEE_AUTH_CONTROL=NATIVE
- AUTH_POLICY_EPOCH=24
- NATIVE_READY=6/6
- FRONTEND_GLOBAL_NATIVE_AUTH=true
- BACKEND_NATIVE_ONLY=true
- LEGACY_BOOTSTRAP=false
- LEGACY_SESSION_ENROLL=false
- FRONTEND_BRIDGE=false
- BACKEND_BRIDGE=false
- ACCOUNTING_TOUCHED=NO
- EASYSTORE_TOUCHED=NO
- BUSINESS_DATA_MUTATION=NO
