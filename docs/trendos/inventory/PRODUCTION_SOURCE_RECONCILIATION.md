# TrendOS Phase 0 — Production Source Reconciliation

> **Scope:** read-only reconciliation of the public/runtime pointers and canonical deployment documentation available from connected sources on 2026-08-30.
> **Goal:** determine whether the Apps Script source actually serving production is identical to the current GitHub working-branch source before any Core write-path mutation.

## Status

`INV-10 — verify exact production source/version manifest`: **PARTIAL / BLOCKED ON LIVE APPS SCRIPT INSPECTION**.

We can now identify the production endpoint and the intended deployment composition, but connected tools do not expose the live Apps Script project's deployed version/source contents. Therefore exact production-source equivalence is **not yet verified**.

## Verified evidence

### 1. Production frontend endpoint

`config.js` on both `main` and `agent/go-live-2026-09-01-integrity` is identical for the backend pointer and currently contains:

- Web App deployment ID: `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- `MATBAGY_SECURE_API_PROXY_URL = ""`

Interpretation:
- current frontend traffic resolves directly to the same Apps Script web-app deployment when no secure proxy URL is configured.
- `main` and the current working branch point to the same backend deployment ID.

### 2. Canonical intended Apps Script composition

`APPS_SCRIPT_DEPLOY_V1940.md` defines the intended production Apps Script project composition as:

1. `Code.gs`
2. `v1932-router.gs`
3. `customer-manager-backend-v1932.gs`
4. `customer-feedback-backend-v1.gs`
5. `attendance-backend-v1.gs`
6. `attendance-clockin-backend-v1.gs`
7. `hr-backend-v1.gs`
8. `cleaning-backend-v1.gs`
9. `press-control-backend-v1.gs`
10. `go-live-autopilot-backend-v1.gs`

Important conflict to preserve:
- repository file naming observed elsewhere is `go-live-autopilot-v1.gs` while the deploy manifest names `go-live-autopilot-backend-v1.gs`.
- this naming mismatch remains part of the production-source reconciliation task.

### 3. Repository deployment health check exists

GitHub commit `ca8e7179f2b280e475a09b64b1c3ccf51b6b66d2` added `v1940-deploy-health.gs` with:

`trendosV1940DeploymentHealth_()`

The function checks whether the V1940 modules exist inside the Apps Script project and whether the target spreadsheet can be opened. This is useful runtime evidence if executed inside the live Apps Script project, but its presence in GitHub does not prove it is deployed.

### 4. Google Drive evidence

Google Drive search found:
- main spreadsheet `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- folder `TrendOS V1932 Apps Script Deploy`.

Direct listing of that Drive folder returned no files through the connector.
Search for Google Apps Script MIME-type files matching TrendOS also returned no accessible result.

Interpretation:
- Drive does not currently provide inspectable live Apps Script source via the available connector.
- do not infer that the Drive deploy folder is the source of the live deployment.

### 5. Historical deployment version

Canonical worklog preserves a historical statement that Apps Script **Version 138** deployment action succeeded, while the exact content included in that deployed version was unknown.

Current check did not independently verify that the live deployment is still Version 138.

## What is not verified yet

Still unknown:
- current live deployment version number.
- exact Apps Script project file list behind the live deployment.
- whether live `Code.gs` is byte-for-byte/functionally equivalent to current GitHub `Code.gs`.
- whether live `appendLine_()` contains the V1932 Line-ID duplicate guard.
- whether live `createManualOrder_()` contains the V1908 request replay guard.
- whether live `submitCustomerDraft_()` has any newer lock/idempotency code not present in GitHub.
- whether `v1940-deploy-health.gs` exists in the live project.

## Required next evidence

One live Apps Script inspection is required before Core mutation.

Minimum first evidence:
- open the Apps Script project bound/used by the main TrendOS backend.
- open **Deploy → Manage deployments**.
- capture the active web-app deployment card showing **Deployment ID + Version**.

Expected deployment ID:
`AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`

If the deployment ID differs, stop and reconcile before any mutation.

After version confirmation, the next verification action will be to inspect/run the live project health/file composition and compare Orders/Lines functions with GitHub.

## Safety decision

No production code, Sheets data, triggers, or deployments were changed during this reconciliation.

Do **not** create `trendos-integrity-v1.gs` in production until INV-10 is completed enough to know which existing protections are already live.
