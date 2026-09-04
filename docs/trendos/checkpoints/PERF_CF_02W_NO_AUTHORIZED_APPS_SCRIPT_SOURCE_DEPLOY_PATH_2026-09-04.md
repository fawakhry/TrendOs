# PERF-CF-02W — No Authorized Apps Script Source Deploy Path — 2026-09-04

## Trigger
After `PERF-CF-02V` proved the live Web App returns `Action غير معروف.` for `getD1OrdersLowUsageHeartbeatV1`, inspect all currently available deployment surfaces before requiring a manual source edit.

## Repository evidence
Current working-branch tree was inspected at head lineage after `PERF-CF-02V`.

No repository path exists for:
- `.clasp.json`;
- `clasp` deployment configuration;
- an Apps Script source-deploy GitHub Actions workflow;
- stored Apps Script OAuth/deployment credentials usable by the connected execution surface.

The available workflows are Cloudflare / D1 / runtime / integrity qualification workflows. The only Apps Script-specific workflow is the GET-only heartbeat route probe created for diagnostics; it does not mutate source.

## Existing deployment manifest evidence
`APPS_SCRIPT_DEPLOY_V1940.md` describes Apps Script deployment as an editor operation:
`Deploy -> Manage deployments -> Edit -> New version -> Deploy`.

It is not an automated source-deployment mechanism and must not be used to replace the live consolidated `Code.gs` blindly.

## Connected-tool boundary
- Google Drive exposes the live TrendOS spreadsheet but no `application/vnd.google-apps.script` project for source mutation.
- No dedicated Google Apps Script source-edit/deploy connector was available through plugin discovery.

## Decision
Do not create a new credential path, OAuth flow, or blind `clasp` deployment solely to bypass this boundary during a production performance cutover.

The only remaining source mutation required for the heartbeat qualification is a controlled direct edit in the live Apps Script editor:
1. add a separate source file containing `cloudflare-d1/D1_Orders_Low_Usage_Heartbeat_V1.gs`;
2. reconcile the live Version-148 `doGet` action chain and insert exactly:
   `else if (action === "getD1OrdersLowUsageHeartbeatV1") result = getD1OrdersLowUsageHeartbeatV1();`
3. save and create/deploy a new Web App version while changing nothing else.

## Rollback
Remove that one route line and/or the separate helper file, then redeploy the previous verified Apps Script version if needed. No data rollback is required because the helper/route is read-only.

## Current production state
- heartbeat live route: NOT INSTALLED;
- Preview heartbeat verifier: OFF;
- Production Orders read cutover: OFF;
- Cloud Write: OFF;
- Google Sheets + Apps Script authoritative for writes.

## Continuation after manual editor operation
Do not enable any Cloudflare flag manually. Rerun the existing GET-only GitHub heartbeat probe first. Only if it verifies the sanitized route should the working branch enable `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"` on isolated Preview and run the dual-signal Orders qualification.
