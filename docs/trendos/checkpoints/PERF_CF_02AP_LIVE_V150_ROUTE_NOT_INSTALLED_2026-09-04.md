# PERF-CF-02AP — Live V150 Route Baseline: NOT INSTALLED

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`

## Objective

Establish an external read-only baseline proving whether the tested V150 dry-run Apps Script route is present on the currently deployed Web App, without sending the reconciliation secret and without touching Google Sheets.

## Probe implementation

Created:

- `.github/workflows/trendos-apps-script-v150-live-probe.yml`
- `docs/trendos/staging/PROBE_APPS_SCRIPT_V150_DRYRUN.trigger`

The workflow reads the existing Apps Script API URL from the tracked Preview config and sends a GET-only request:

`action=cloudWriteReconcileDryRunV1&dryRun=true`

No reconciliation secret is sent.

If V150 is installed, the tested helper must reject before sheet access with a locked response such as:

- `dry-run-secret-not-configured`, or
- `unauthorized`

while preserving:

- `sheetsWritten=false`
- `mutationCount=0`

## Live baseline result

Probe job: `probe-v150-dryrun-route`

Result: **PASS as a safe probe**, with deployment state:

- HTTP: `200`
- response: `{"success":false,"message":"Action غير معروف."}`
- `V150_ROUTE_STATE=NOT_INSTALLED`
- response class: `Action غير معروف.`

This proves the current deployed Apps Script Web App does **not** yet contain the V150 route.

## Current live deployment conclusion

- Repository V150 candidate: **READY / PASS**
- Live V150 route: **NOT INSTALLED**
- Current deployed Apps Script remains the prior Version 149 baseline.

## Deployment capability boundary

Repository inspection found no `clasp` deployment configuration or Apps Script API deployment workflow. The project deployment manifest documents the current operational method as:

`Deploy -> Manage deployments -> Edit -> New version -> Deploy`

No connected tool available in this chat exposes Google Apps Script source deployment or Script Property mutation. Therefore no automated deployment was claimed or attempted.

## Safety conclusion

- Probe method: GET only.
- Reconciliation secret sent: NO.
- Google Sheet read by V150 helper: NO, because V150 is not installed.
- Google Sheet write: NO.
- Script Property mutation: NO.
- Apps Script deployment: NO.
- D1 write: NO.
- Production Cloud Write change: NO.

02AP closes the repository-to-live baseline and leaves the system at a clear manual deployment boundary.
