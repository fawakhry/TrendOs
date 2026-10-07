# Entry646 — Manager Center Core-direct stabilization — 2026-10-07

## Scope
Stabilize the TrendOS Manager Center only. No D1 mutation, no Content mutation, no Comms mutation, no Accounting/EasyStore mutation.

## Diagnosis
Live `config.js` loads `trend-master-resilience-v1931.js` before `manager-center-v1932.js`.
The resilience layer requests `getTrendMasterPanelV1931`.
The live Employee dispatcher and D1 Core native route do not qualify `getTrendMasterPanelV1931`; they do qualify `getTrendMasterCenterV1931`.
Because Manager Center preferred the resilience object whenever present, the center could choose an unqualified route instead of its existing qualified D1 Core fallback.

## Controlled fix
Workflow source commit: `eda1828f0c6b6b17617b7649a048d414635ef293`.
Workflow run: `37554583893`.
Job: `112577762263`.
Repo patch commit: `463a2523a9ddf1457f113112254f7bc5176d082a`.

The Manager Center `load()` path now calls one qualified Cloud/D1 Core snapshot:
`getTrendMasterCenterV1931`.
The historical progressive resilience code remains in the repository for the separate Trend Master surface; Entry646 changes only the Manager Center selection path.

Frontend version:
- previous: `9c84a8ca-49f9-458a-9714-8a0dc03cfcd6`
- current: `cfff20f6-5a9d-46cb-8dfb-6c378c4f0eb5`
- propagation: attempt 4

## Live proof
- `ENTRY646_RUNTIME_PREFLIGHT=PASS`
- `ENTRY646_CENTER_ROUTE_MISMATCH_CONFIRMED=PASS`
- `ENTRY646_MANAGER_CENTER_CORE_DIRECT_REPO=PASS`
- authenticated Native login succeeded
- `getTrendMasterCenterV1931` returned a complete Manager Center snapshot from `/v1/employee/core`
- `ENTRY646_MANAGER_CENTER_CORE_SNAPSHOT=PASS`
- `ENTRY646_LEGACY_BRIDGE_CALLS=0`
- `ENTRY646_BUSINESS_WRITE=NO`
- Native logout PASS
- `ENTRY646_RUNTIME_POSTFLIGHT=PASS`
- rollback not used

## Final production truth
```ini
ENTRY646=PASS
MANAGER_CENTER_ROUTE=CORE_DIRECT
MANAGER_CENTER_ACTION=getTrendMasterCenterV1931
AUTH_MODE=NATIVE
D1_NATIVE_READY=6/6
BACKEND_BRIDGE=false
CORE=GENERAL
CORE_POLICY_EPOCH=2
CONTENT=READONLY
COMMS=READONLY
OPS=GENERAL
ACCOUNTING=READONLY
D1_MUTATION=NO
BUSINESS_WRITE=NO
CONTENT_MUTATION=NO
COMMS_MUTATION=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
ROLLBACK_USED=NO
```
