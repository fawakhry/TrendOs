# Operator Task V3 — T1 Preview Package PASS — 2026-09-14

## Checkpoint
Owner selected Operator Task as the next controlled track after T11 completion.

This checkpoint advances only the isolated T1 preview package. It does not authorize or perform any Production Task mutation, Production Apps Script deployment, secret rotation, D1 write-authority move, Gaber Material Control change, or RP-08 work.

## Repository / branch
- Repository: `fawakhry/TrendOs`
- Canonical controlled branch at checkpoint start: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
- Guarded start SHA: `f07cc56501fba1c29c0ef72cccda78e494935373`
- New isolated T1 branch: `operator-task-v3-t1-preview-20260914`
- Production frontend `main` was not changed.
- Production Worker was not changed.

## What was created
Isolated preview package:
- `tasks-v3-preview/Code.gs`
- `tasks-v3-preview/appsscript.json`
- `tests/tasks_v3_t1_preview_contract.test.mjs`
- `.github/workflows/trendos-tasks-v3-t1-preview-contract.yml`

Key commits:
- preview bridge: `657cf6c579ebc3825c2709a68934c6edd33413e3`
- Apps Script manifest: `ae8f34c0d2d21293f7021e42547484d82e878221`
- isolation contract: `252da8048ddff43626e0523155ec058fcbf9f0e7`
- CI workflow / qualified head: `dcf1912b0953ee331dc6e5709e6f08ca7c75401a`

## Isolation / safety contract
The T1 preview bridge:
- is explicitly for a separate Apps Script project only;
- accepts signed POST requests only;
- exposes read-only operations only: `health`, `status`, `flyPrint`, `pressCandidates`;
- contains no Production `claimNext` or `completeTask` route/code;
- contains no dependency on main `authorize_`, `findUser_`, or `updateLine_`;
- contains no direct `بنود الأوردرات` dependency;
- contains no sheet creation, append, cell/range write, delete, clear, or Script lock;
- does not use `getDataRange()`;
- allows only `WAEL` and `MANAGER` roles in T1 preview; Gaber is not enabled;
- uses preview-only properties `TASKS_V3_PREVIEW_SPREADSHEET_ID` and `TASKS_V3_PREVIEW_SHARED_SECRET`;
- hard-blocks the canonical Production Spreadsheet ID `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI` from T1 preview use.

## Qualification
Workflow: `TrendOS Tasks V3 T1 Preview Contract`
- Run ID: `34857940035`
- Job ID: `104022248676`
- Head SHA: `dcf1912b0953ee331dc6e5709e6f08ca7c75401a`
- Result: `SUCCESS`

Successful steps:
- Checkout T1 preview branch
- Run T1 preview isolation contract
- Safety summary

Contract markers:
- `TASKS_V3_T1_PREVIEW_CONTRACT=PASS`
- Production spreadsheet blocked by code
- Task mutation code present: NO
- Main Apps Script dependency: NO

## Production mutation / authority / rollback
- Production business-data mutation: NO
- Production Task mutation: NO
- `claimNext`: NOT EXECUTED
- `completeTask`: NOT EXECUTED
- Production Apps Script deployment: NO
- Production Worker deployment: NO
- Production frontend change: NO
- Secret change/rotation: NO
- D1 business-write authority change: NO
- Gaber Material Control change: NO
- Integrity flag change: NO
- RP-08: NO
- Rollback required: NO

Sheets / Apps Script remain authoritative for all business writes.
Print/Laser/Press/Service D1-first reads and Apps Script fallback remain unchanged.
`__DEBT__` remains Apps Script.

## Current state
**T1 PREVIEW PACKAGE QUALIFIED / NOT YET DEPLOYED**

This is not T1 completion yet. T1 still requires an actually separate Apps Script project/Web App plus a non-production/preview spreadsheet and runtime/latency qualification.

## Next exact step
Provision an isolated Tasks V3 preview runtime using:
- a separate Apps Script project/deployment;
- a non-production preview spreadsheet containing only the dedicated V3 index/ledger fixtures;
- preview-only properties/binding;
- no connection to the canonical Production spreadsheet;
- no main TrendOS Apps Script/router mutation.

Then run signed `health/status/flyPrint/pressCandidates` contract and latency probes. Do not advance to T2 Production read-only canary until T1 runtime qualification passes and is recorded.
