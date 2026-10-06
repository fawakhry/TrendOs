# Entry642 — Deploy-Resilient Employee Auth Hardening

Date: 2026-10-07
Repository: fawakhry/TrendOs
Branch: candidate/t12-full-cloud-cutover-a56-20260929

## Scope
Restore Cloudflare employee-auth defense-in-depth after Entry641 found environment drift, and make the repository defaults deploy-resilient.

No D1 mutation.
No Apps Script mutation.
No frontend deployment.
No Accounting mutation.
No EasyStore mutation.
No business-data mutation.

## Entry641 follow-up stability rerun
The Entry641 read-only job was rerun without creating a new repository push:
- Run: 37544005767
- run_attempt: 2
- Job: 112544607661
- Conclusion: SUCCESS

It proved no new Cloudflare API deployment had appeared after the recent documentation/autonomous-printshop commits:
- active API version remained b1eb1e51-d713-4e30-8da5-a127fd53284b
- deployment timestamp remained 2026-10-06T22:56:20.972111Z

Therefore normal branch commits were not themselves causing a fresh API deploy during this observation window.

## Attempt 1 — failed safely before settings mutation
Workflow source commit:
d1aec76dec9fd9098ed9dd51dbe0cc1b86c9d2ed

Run:
37544706079

Job:
112545806855

Preflight:
- ENTRY642_RUNTIME_PREFLIGHT=PASS
- ENTRY642_AUTH_MODE=NATIVE
- ENTRY642_NATIVE_READY=6_OF_6
- ENTRY642_PRE_BOOTSTRAP=true
- ENTRY642_PRE_NATIVE_ONLY=false
- ENTRY642_PRE_SESSION_ENROLL=false
- ENTRY642_PRE_BRIDGE_POLICY_COUNT=17
- ENTRY642_PRE_BRIDGE_SECRET_CONFIGURED=YES
- ENTRY642_FRONTEND_PREFLIGHT=PASS
- ENTRY642_REPO_DRIFT_PRECONDITION=PASS

Cloudflare pre-state:
- active version b1eb1e51-d713-4e30-8da5-a127fd53284b
- binding count 33
- nativeOnly=false
- bootstrap=true
- bridge enabled=false
- bridge actions non-empty
- bridge secret binding present
- secret value logged=NO

Failure:
Cloudflare returned error 10057 because Settings API inherit bindings support only the literal version_id "latest", not an explicit version UUID.

No settings mutation occurred.
Rollback step correctly reported:
ENTRY642_ROLLBACK_NOT_NEEDED=PRE_PATCH_FAILURE

## Attempt 2 — PASS
Workflow fix commit:
af82f152377ec56f052eca6a08541e4519616e69

Run:
37544785002

Job:
112546068390

Conclusion:
SUCCESS

The workflow first proved that Cloudflare latest version equaled the active version, making literal "latest" inheritance safe for this settings-only patch.

Production settings patch:
- ENTRY642_CF_SETTINGS_PATCH=PASS
- pre active version: b1eb1e51-d713-4e30-8da5-a127fd53284b
- new version: e4322cbd-ac74-4f7c-b1ff-5833ea524e5a
- ENTRY642_CF_EXPLICIT_DEPLOY=NO
- Cloudflare activated the new settings version automatically
- ENTRY642_CF_CODE_ETAG_UNCHANGED=PASS

Target employee-auth settings:
- TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=true
- TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
- TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=true
- TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED=false
- TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
- EMPLOYEE_LEGACY_BRIDGE_ACTIONS=""

The bridge secret binding was intentionally retained for rollback safety.
No secret value was read or logged.

Production proof:
- ENTRY642_PROPAGATION_ATTEMPT=2
- ENTRY642_FAMILY_POSTFLIGHT=PASS
- ENTRY642_NATIVE_LOGIN=PASS
- ENTRY642_LEGACY_BRIDGE_CALLS=0
- ENTRY642_NATIVE_LOGOUT=PASS
- ENTRY642_UNKNOWN_USER_FAIL_CLOSED=PASS
- ENTRY642_PRODUCTION_HARDENING=PASS
- ENTRY642_CF_BRIDGE_POLICY_COUNT=0
- ENTRY642_CF_BRIDGE_SECRET_RETAINED=YES
- ENTRY642_CF_SECRET_VALUE_LOGGED=NO

Rollback to the exact pre-version was armed for any failure before production proof.
Rollback was not invoked because all production checks passed.

## Repository deploy-resilience reconciliation
Only cloudflare-d1/wrangler.toml was changed after production proof.

Commit:
db0e850ff096c12b3f663c3df20edc7e0b506999

Proof:
ENTRY642_WRANGLER_RECONCILED=PASS

Repository defaults now persist:
- TRENDOS_EMPLOYEE_AUTH_V1_ENABLED="true"
- TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED="false"
- TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1="true"
- TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED="false"
- TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED="false"
- EMPLOYEE_LEGACY_BRIDGE_ACTIONS=""

## Final stable Runtime
Cache-busted proof after workflow completion:
- auth mode=NATIVE
- envEnabled=true
- legacyBootstrapEnabled=false
- legacySessionEnrollEnabled=false
- nativeOnly=true
- userCount=6
- nativeReadyCount=6
- mustChangeCount=0
- plaintextStored=false

Backend bridge:
- enabled=false
- allowedPolicyCount=0
- secretConfigured=true
- rawNativeTokenForwarded=false
- plaintextPasswordForwarded=false

Frontend:
- Global Native Auth=true
- Native Canary=false
- required Native-ready count=6
- frontend Bridge=false

Accounting was observed only. At the final stability read it had independently advanced to:
- mode=READONLY
- policyEpoch=10
- authoritativeWrites=false
- writeAuthorityMode=OFF
- googleBusinessCalls=0
- appsScriptBusinessAuthority=false

No Accounting mutation was made by Entry642.

## Final
ENTRY642=PASS
ENTRY642_DEPLOY_RESILIENT_AUTH_HARDENING=PASS
ENTRY642_AUTH_MODE=NATIVE
ENTRY642_NATIVE_READY=6_OF_6
ENTRY642_BOOTSTRAP=false
ENTRY642_NATIVE_ONLY=true
ENTRY642_BACKEND_BRIDGE=false
ENTRY642_BRIDGE_POLICY_COUNT=0
ENTRY642_BRIDGE_SECRET_RETAINED=YES
ENTRY642_WRANGLER_RECONCILED=PASS
ENTRY642_APPS_SCRIPT_BRIDGE=STILL_ENABLED_FROM_ENTRY641_AUDIT
ENTRY642_NEXT_GATE=DISABLE_APPS_SCRIPT_BRIDGE_PROPERTY
