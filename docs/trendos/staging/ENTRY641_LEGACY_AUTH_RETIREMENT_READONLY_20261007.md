# Entry641 — Legacy Auth Retirement Read-only Audit

Date: 2026-10-07
Repository: fawakhry/TrendOs
Branch: candidate/t12-full-cloud-cutover-a56-20260929

## Scope
Read-only audit only. No Cloudflare, D1, Apps Script, frontend, Accounting, EasyStore, or business-data mutation.

## Attempt 1
Workflow:
.github/workflows/trendos-entry641-legacy-auth-retirement-readonly.yml

Source commit:
7c459c47e4f53ed343c1b95ca2678c8cf9509eb2

Run:
37543761337

Job:
112542724821

Result:
FAILURE in the first read-only runtime proof.

Reason:
The audit expected the defense-in-depth environment state that had been proven immediately after Entry640, but Runtime had drifted to:
- auth mode=NATIVE
- userCount=6
- nativeReadyCount=6
- legacyBootstrapEnabled=true
- nativeOnly=false

No mutation occurred. The failure correctly exposed Runtime drift.

## Attempt 2
Diagnostic source commit:
6c2da88c152f98c17a55ae88c652376cb016c8fb

Run:
37544005767

Job:
112543538509

Conclusion:
SUCCESS

### Native control remained authoritative
- ENTRY641_AUTH_MODE=NATIVE
- ENTRY641_NATIVE_READY=6_OF_6
- Cloudflare auth env enabled=YES
- legacy bootstrap env enabled=YES
- legacy session enroll env enabled=NO
- nativeOnly env=NO

Because D1 control mode is NATIVE, the login/bootstrap code does not allow transitional bootstrap even though the environment flag drifted. The drift is still a defense-in-depth regression and must be repaired.

### Cloudflare bridge residue
- ENTRY641_CF_BRIDGE_ENABLED=NO
- ENTRY641_CF_BRIDGE_UPSTREAM_CONFIGURED=YES
- ENTRY641_CF_BRIDGE_SECRET_CONFIGURED=YES
- ENTRY641_CF_BRIDGE_POLICY_COUNT=17
- secret value logged=NO

### Cloudflare deployment timeline
Current active API deployment:
- 2026-10-06T22:56:20.972111Z
- version b1eb1e51-d713-4e30-8da5-a127fd53284b
- annotation/message was empty

Previous known deployments:
- hardened version 24202d32-cd6f-41bb-9ce3-0565877ef8be at 2026-10-06T19:39:41.106173Z
- bounded-window version 59f7c6b3-64f3-4dac-a51f-7d730cb90bbb at 2026-10-06T19:38:41.535377Z

Current latest settings reported:
- NATIVE_ONLY=false
- LEGACY_BOOTSTRAP=true
- LEGACY_SESSION_ENROLL=false
- LEGACY_BRIDGE_ENABLED=false
- bridge actions configured=YES
- bridge secret binding present=YES
- secret value logged=NO

No GitHub employee-auth deployment workflow was observed between Entry640 success and the new 22:56:20Z API deployment. The source of that deployment is therefore recorded as UNATTRIBUTED until separately proven; no unsupported attribution is made.

### Apps Script Version159 bridge residue
A deliberately invalid assertion was sent to the existing read-only-safe bridge verifier route. No real employee identity, credential, nonce, secret, or business action was used.

Proof:
- HTTP 200
- invalid assertion was rejected after enabled/secret checks
- ENTRY641_APPS_SCRIPT_BRIDGE_ENABLED=YES
- ENTRY641_APPS_SCRIPT_BRIDGE_SECRET_CONFIGURED=YES
- secret value logged=NO

Retirement candidate:
DISABLE_APPS_SCRIPT_BRIDGE_PROPERTY

### Source residue
- repository default Cloudflare bridge flag=OFF
- repository bridge code present=YES
- Apps Script bridge route/code present=YES

## Decision
ENTRY641=READONLY_AUDIT_PASS
ENTRY641_RUNTIME_DRIFT=CF_AUTH_ENV_HARDENING_REGRESSED
ENTRY641_D1_AUTH_CONTROL=NATIVE
ENTRY641_NATIVE_READY=6_OF_6
ENTRY641_NEXT_GATE=DEPLOY_RESILIENT_CF_AUTH_HARDENING
ENTRY641_AFTER_CF_GATE=DISABLE_APPS_SCRIPT_BRIDGE_PROPERTY

All changes remain credential-safe; no secret value was exposed.
