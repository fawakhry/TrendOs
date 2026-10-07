# AP-069 — TrendOS Manager Center migrated to Autonomous Printshop Owner Exception Console — 2026-10-07

## Decision
The owner approved moving the management-center responsibility from the legacy TrendOS manager-center surface into the Autonomous Printshop domain.

This checkpoint migrates the **management UI responsibility and exception-oriented operating view**, not TrendOS source-of-truth authority.

TrendOS remains authoritative for operational source data in D1. Autonomous Printshop consumes the qualified read-only Control Tower projection.

## Implementation
Source commit:
`00179b7e1b2c13b4bad27d577703d1abe08d381f`

Changed:
- `autonomous-printshop/dashboard/worker.mjs`
- `autonomous-printshop/tests/dashboard_v1.test.mjs`
- `.github/workflows/autonomous-printshop-dashboard-production-deploy.yml`

The dashboard is now explicitly:
`AUTONOMOUS_PRINTSHOP_OWNER_EXCEPTION_CONSOLE_V1_20261007`

Routes:
- `/`
- `/dashboard`
- `/owner`
- `/manager-center`

All four serve the Autonomous Printshop management surface.

New management role:
- Control Tower operational summary;
- owner exception cards;
- employee/supervisor aggregate state;
- readiness blockers;
- evidence-acquisition blockers;
- Operator Task CANARY gate;
- next-action explanation;
- Shadow learning / Owner Only / Blocked aggregate signals.

The migration intentionally does **not** reuse the legacy 70/30 employee score as management authority.

## Production deploy
Workflow:
`Autonomous Printshop Dashboard Production Deploy`

Run:
`37627488015`

Result:
SUCCESS.

Proof:
```ini
AUTONOMOUS_PRINTSHOP_OWNER_EXCEPTION_CONSOLE_V1=PASS
TRENDOS_MANAGER_CENTER_ROLE=MIGRATED_TO_AUTONOMOUS_OWNER_CONSOLE
MAIN_TRENDOS_PREDEPLOY=PASS
DASHBOARD_DRYRUN=PASS
DASHBOARD_DEPLOYED=YES
DASHBOARD_LIVE=PASS
CONTROL_TOWER_UPSTREAM=PASS
DASHBOARD_MODE=READ_ONLY_OWNER_EXCEPTION_CONSOLE
OWNER_EXCEPTION_CONSOLE=PASS
MAIN_TRENDOS_POSTDEPLOY=PASS
OWNER_EXCEPTION_CONSOLE=LIVE
TRENDOS_MANAGER_CENTER_ROLE=MIGRATED_UI_RESPONSIBILITY
```

Independent runtime verification:
- health reports `READ_ONLY_OWNER_EXCEPTION_CONSOLE`;
- `ownerExceptionConsole=true`;
- `trendosManagerCenterReplacementCandidate=true`;
- `businessWrites=false`;
- `employeeAssignment=false`;
- `/owner` and `/manager-center` both return the new management UI;
- live `/state` is sourced from `trendos-main-d1` through the Control Tower service binding;
- live Control Tower remains `CONTROL_TOWER_SHADOW`;
- PII/raw IDs are not exposed by the aggregate state surface.

Observed live snapshot at verification time:
- rowCount=615;
- ordinary=85;
- inProgress=11;
- closed=519;
- available operators=2 of 4 known operators;
- strictEligible=0;
- readinessBlocked=85;
- autonomy=SHADOW;
- readiness=SHADOW;
- operatorTask=OFF.

These numbers are runtime observations, not configuration constants.

## Authority boundary
```ini
TRENDOS_SOURCE_OF_TRUTH=RETAINED
AUTONOMOUS_PRINTSHOP_MANAGER_UI=LIVE
OWNER_EXCEPTION_CONSOLE=LIVE
CONTROL_TOWER_SOURCE=trendos-main-d1
DASHBOARD_D1_BINDING=NONE
BUSINESS_WRITE=NO
EMPLOYEE_ASSIGNMENT=NO
OPERATOR_TASK_WRITE=NO
AUTOPILOT_EXECUTION=NO
ACCOUNTING_WRITE=NO
EASYSTORE_MUTATION=NO
CONTENT_MUTATION=NO
```

The legacy TrendOS Manager Center is not deleted in AP-069. It remains a stabilized fallback surface only; new management-center feature development belongs in Autonomous Printshop.
