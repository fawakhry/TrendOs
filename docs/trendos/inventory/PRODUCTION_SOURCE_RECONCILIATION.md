# TrendOS Phase 0 — Production Source Reconciliation

> **Scope:** read-only reconciliation of the frontend runtime pointer, canonical deployment documentation, current GitHub source, and the current Apps Script `Code.gs` text supplied from the live project/editor on 2026-08-30.
> **Goal:** determine which Core protections are present in the Apps Script editor source, and what still must be proven about the deployed web-app version before Core mutation.

## Status

`INV-10 — verify exact production source/version manifest`: **PARTIAL — APPS SCRIPT EDITOR SOURCE RECONCILED FOR ORDERS/LINES; DEPLOYED VERSION STILL UNVERIFIED**.

We now have direct source evidence for the current Apps Script `Code.gs` text supplied from the project/editor. The critical Orders/Lines functions inspected are functionally identical to the GitHub working-branch `Code.gs`. However, the supplied Apps Script source also contains D1 routing changes that are newer than the current GitHub `Code.gs`. Therefore GitHub is **not yet a complete byte-for-byte mirror of the Apps Script editor source**.

This source comparison still does not prove which saved source version is attached to the active Web App deployment. `Saved in Apps Script editor != Deployed Web App version`.

---

## 1. Production frontend endpoint

`config.js` on both `main` and `agent/go-live-2026-09-01-integrity` currently points to:

- Web App deployment ID: `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- `MATBAGY_SECURE_API_PROXY_URL = ""`

Interpretation:
- frontend traffic resolves directly to this Apps Script deployment while the secure proxy URL is empty.
- `main` and the working branch point to the same backend deployment ID.

---

## 2. Current Apps Script `Code.gs` text supplied from project/editor

The supplied source identifies itself as:

`TrendOS + EasyStore unified Google Apps Script backend — V1932 FULL Go-Live / HR / WhatsApp / Attendance / Press`

and includes:

`MATBAGY_ACCOUNTING_VERSION = "V1932_FULL_GO_LIVE_20260824"`

### Orders/Lines functions reconciled against GitHub

The following supplied Apps Script functions match the working-branch `Code.gs` for the inspected ranges:

- `appendLine_()`
  - includes the V1932 Line-ID duplicate guard.
  - checks `trendosV1932FindLineRowById_()` before append.
  - returns the existing row instead of adding a second row.

- `createManualOrder_()`
  - includes outer `LockService.getScriptLock()`.
  - includes V1908 stable-request replay via `trendosV1908RequestKey_()` / `trendosV1908ReadSavedResponse_()`.
  - includes recent duplicate fingerprint guard.
  - allocates new Line IDs from the sheet state when reusing an open order.

- `submitCustomerDraft_()`
  - matches GitHub source.
  - sequentially prevents re-submit after draft status changes.
  - still has no outer lock wrapping the full `check draft -> allocate Order ID -> write order/lines -> mark draft submitted` transaction.
  - concurrent double-submit remains a real CORE-P0 candidate.

- `updateLine_()`
  - matches GitHub source.
  - writes status/ready/update/notes, syncs order summary, appends activity, queues status message, and bumps data version.
  - still has no shared event-idempotency/transaction lock around the complete mutation + side effects.

- `syncOrderFromLines_()`
  - matches GitHub source.
  - collapses duplicate Line IDs for summary calculation.
  - excludes rows marked `مكرر` from active/current totals.

### Interpretation for P0-01

The source supplied from Apps Script confirms that the existing V1932 duplicate-aware Orders/Lines protections are present in the **current editor source**. Therefore:

- do **not** add another blind Line-ID duplicate patch.
- the remaining work is to standardize concurrency/idempotency around the paths that are still weaker, especially customer draft conversion and line-update side effects.

---

## 3. Important source divergence discovered: D1 routing

The supplied Apps Script `Code.gs` is **not identical** to the current GitHub `Code.gs` at the top-level read routing.

### Supplied Apps Script source

Current supplied source routes:

- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

### Current GitHub working-branch `Code.gs`

Current GitHub file still routes:

- `getDashboard` -> `getDashboard_(e)`
- `getRowsPageV1931` -> `getRowsPageV1931_(e)`

### Meaning

The Apps Script editor source contains later D1 read-path wiring that is not currently reflected inside GitHub `Code.gs`.

This is a critical reconciliation finding:

- GitHub remains the canonical project memory and intended source repository.
- but **current Apps Script editor source is ahead of GitHub `Code.gs` in at least these D1 route lines**.
- do not overwrite the Apps Script project from GitHub `Code.gs` until this delta is captured intentionally.
- the D1 modules referenced by these routes must be inventoried before any source synchronization.

---

## 4. Canonical intended Apps Script composition

`APPS_SCRIPT_DEPLOY_V1940.md` defines the intended Apps Script project composition as:

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

Important unresolved naming conflict:
- repository history also contains `go-live-autopilot-v1.gs` naming.
- exact live project file list still needs confirmation.

---

## 5. Deployment health check evidence

GitHub commit `ca8e7179f2b280e475a09b64b1c3ccf51b6b66d2` added:

`v1940-deploy-health.gs`

with:

`trendosV1940DeploymentHealth_()`

This function can verify module presence and spreadsheet access when run inside the Apps Script project, but its existence in GitHub does not prove that it exists in the live project or deployed version.

---

## 6. Google Drive evidence

Google Drive confirms:

- main spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- pre-Go-Live backups exist.
- folder `TrendOS V1932 Apps Script Deploy` exists.

The connector did not expose live Apps Script project source/deployment metadata from Drive.

---

## 7. What is verified now

Verified from the supplied Apps Script source text:

- `appendLine_()` duplicate guard exists in current editor source.
- `createManualOrder_()` V1908 replay + ScriptLock exists in current editor source.
- `submitCustomerDraft_()` still lacks an enclosing conversion lock in current editor source.
- `updateLine_()` still lacks a unified idempotent mutation contract in current editor source.
- `syncOrderFromLines_()` duplicate collapse / `مكرر` exclusion exists in current editor source.
- Apps Script editor source includes D1 read routing newer than GitHub `Code.gs`.

---

## 8. What is still not verified

Still unknown:

- active Web App deployment version number.
- whether the active deployment currently serves the same saved Apps Script source text that was supplied.
- exact complete Apps Script project file list.
- whether `v1940-deploy-health.gs` is present in the live project.
- exact D1 module versions behind `getDashboardD1PrimaryV1_()` and `getRowsPageD1FastV2_()` in the project.

Historical evidence mentions a successful Version 138 deployment action, but this check has not independently proved that the active deployment is still Version 138 or that Version 138 contains the supplied current editor source.

---

## 9. Next exact evidence required

Before Core code mutation, capture **Deploy -> Manage deployments** for the active Web App and record:

- Deployment ID.
- Version number.

Expected Deployment ID:

`AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`

If it differs, stop and reconcile.

Once the version is known, continue source/deployment composition verification; do not redeploy yet.

---

## Safety decision

No production code, Sheets data, triggers, or deployments were changed during this reconciliation.

Do **not** overwrite Apps Script from GitHub `Code.gs` yet because the supplied Apps Script editor source contains D1 routing that GitHub `Code.gs` does not currently contain.

Do **not** deploy `trendos-integrity-v1.gs` until the active deployment version/composition is known.