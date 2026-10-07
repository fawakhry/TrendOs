# Entry644 — Employee Core GENERAL cutover — 2026-10-07

## Scope
Promote the Employee Core family from READONLY to GENERAL on Cloudflare/D1, then switch the live frontend dispatcher/config to the qualified Core GENERAL path. Accounting and EasyStore are out of scope and were not mutated.

## Preflight truth
Fresh Production reads before the gate:
- Auth: NATIVE, 6 users, 6/6 native-ready, nativeOnly=true, legacy bootstrap/session enrollment=false, plaintextStored=false.
- Backend legacy bridge: disabled, allowedPolicyCount=0.
- Core: READONLY / policyEpoch1, schemaReady=true, googleBusinessCalls=0, appsScriptBusinessAuthority=false.
- Content: READONLY.
- Comms: READONLY.
- Ops: GENERAL.
- Accounting: READONLY, authoritativeWrites=false, writeAuthorityMode=OFF, googleBusinessCalls=0, appsScriptBusinessAuthority=false.
- Live frontend: global Native=true, canary=false, bridge=false, Core=READONLY, Content=READONLY, Comms=READONLY, Ops=GENERAL, Accounting=READONLY.

## Repo qualification
Entry644 added qualified frontend routing for the four existing D1 Core writes:
- bulkUpdateDepartmentStatusV1926
- archiveDeliveredDepartmentV1926
- updateLine
- markCustomerNotified

READONLY continues to route only the four existing Core reads. GENERAL routes those four reads plus the four writes.

Initial qualification commit:
- `7c12fa9b47392ef9f063778f99a65855354e55f5`

Attempt 1:
- Run `37550415394`
- Job `112564269742`
- FAILURE in the new test harness after these passed:
  - `ENTRY644_READONLY_WRITES_STILL_FAIL_CLOSED=PASS`
  - `ENTRY644_CORE_GENERAL_8_OF_8_ROUTE=PASS`
- Cause: the test called a non-Core Edge action through the wrong direct wrapper and got `EMPLOYEE_CLOUD_ROUTER_NOT_READY`.
- Production mutation: NO.

Test-harness fix:
- commit `d0f12b07d122690b56bda8208ab2fe3efca271fc`.

Attempt 2:
- Run `37550477764`
- Job `112564471855`
- FAILURE only because historical Entry628 test still asserts repository `CORE=OFF`, which was true at Entry628 but is no longer current truth.
- Historical Entry628 test was preserved unchanged.
- Production mutation: NO.

Gate cleanup:
- commit `4237107e27f8b8b94f149eb052ef5698e53576af`
- removed the stale historical Entry628 assertion from the new Entry644 gate only.

Attempt 3:
- Run `37550529017`
- SUCCESS.
- `ENTRY644_REPO_GATE=PASS`.

## Backend Core runtime arm
Controlled workflow commit:
- `53d8348d84f5fad968b917e535035bf0a1f66050`

Run:
- Run `37550634418`
- Job `112564985475`
- SUCCESS.

Exact D1 control mutation:
- Core `READONLY / epoch1 -> GENERAL / epoch2`.
- Conditional single control-row mutation only.
- No business data mutation.
- No API code deploy.
- No frontend deploy in this stage.
- Rollback `GENERAL/2 -> READONLY/1` was armed and skipped because all checks passed.

Safe GENERAL write-policy probe:
- unauthenticated write-shaped Core request reached employee authentication and returned 401.
- `ENTRY644_GENERAL_WRITE_POLICY_REACHES_AUTH=PASS`
- `ENTRY644_GENERAL_PROBE_BUSINESS_WRITE=NO`.

Independent between-stage verification proved:
- Backend Core=GENERAL / epoch2.
- Frontend Core remained READONLY.
- Auth remained NATIVE 6/6.
- Backend bridge remained disabled.
- Content/Comms stayed READONLY.
- Accounting stayed READONLY with write authority OFF.

## Frontend Core GENERAL cutover
Controlled frontend workflow commit:
- `d56e9fc14cd40c1ca96fc9c9dd76d187d36044da`

Run:
- Run `37551016683`
- Job `112566231841`
- SUCCESS.

Frontend versions:
- Previous: `ecba8460-e9c1-4fc7-81a2-1cf5c054943a`
- Current: `9c84a8ca-49f9-458a-9714-8a0dc03cfcd6`
- Propagation passed at attempt 4.

Live smoke:
- `ENTRY644_NATIVE_LOGIN=PASS`
- `ENTRY644_AUTHENTICATED_CORE_WRITE_ROUTE=PASS`
- synthetic nonexistent line returned `line-not-found` before any business mutation
- `ENTRY644_BUSINESS_WRITE_EXECUTED=NO`
- `ENTRY644_LEGACY_BRIDGE_CALLS=0`
- `ENTRY644_NATIVE_LOGOUT=PASS`
- `ENTRY644_RUNTIME_POSTFLIGHT=PASS`
- rollback not used.

Repository config reconciliation:
- commit `db217eea8a83c58c05fe16325d6bd09a9c5511e3`
- root `config.js` now records `MATBAGY_EMPLOYEE_CORE_CUTOVER_MODE = 'GENERAL'`.

## Historical CI noise caused by config reconciliation
The config-only reconciliation triggered old historical workflow assertions that encode superseded states. These are recorded as FAIL but are not current Runtime regressions:
- Run `37551156457` Entry631: expected historical native-ready count 0.
- Run `37551156482` Entry628: expected historical Core=OFF.
- Run `37551156578` Entry611: expected historical Native Auth=false.
- Run `37551156455` Entry619 Accounting source qualification: expected historical Native Auth=false.
- Run `37551156528` Entry603: expected historical Native Auth=false.
- Run `37551156541` A61 browser regression: expected historical Native Auth=false.
- Run `37551156506` Entry630: expected historical Comms=OFF.
- Run `37551156450` Entry636: expected historical Native Auth=false.
- Run `37551156516` Entry629: expected historical Content=OFF.

The same config commit also had successful current/unrelated guards including EasyStore SSO source qualification, Duplicate Order Guard, Legacy Line Runtime, and T12 A56 Customer Cloud-Only. No historical test was rewritten to falsify its original state.

## Final independent Production truth
```ini
ENTRY644=PASS
AUTH_MODE=NATIVE
D1_AUTH_USERS=6
D1_NATIVE_READY=6/6
NATIVE_ONLY=true
LEGACY_BOOTSTRAP=false
LEGACY_SESSION_ENROLL=false
BACKEND_BRIDGE=false
BACKEND_BRIDGE_POLICY_COUNT=0

CORE=GENERAL
CORE_POLICY_EPOCH=2
CORE_NATIVE_READ_ACTIONS=4
CORE_NATIVE_WRITE_ACTIONS=4
CORE_GOOGLE_BUSINESS_CALLS=0
CORE_APPS_SCRIPT_BUSINESS_AUTHORITY=false
FRONTEND_CORE=GENERAL

OPS=GENERAL
CONTENT=READONLY
COMMS=READONLY
ACCOUNTING=READONLY
ACCOUNTING_AUTHORITATIVE_WRITES=false
ACCOUNTING_WRITE_AUTHORITY_MODE=OFF

BUSINESS_DATA_MUTATION_FROM_ENTRY644=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
ROLLBACK_USED=NO
```

Entry644 is complete. Next non-accounting business-family gate is Content qualification beyond READONLY; do not change Accounting in that gate.
