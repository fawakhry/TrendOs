# TrendOS Phase 0 — Production Source Reconciliation

> **Scope:** read-only reconciliation of the frontend runtime pointer, canonical deployment documentation, current GitHub source, current Apps Script `Code.gs` text supplied from the live project/editor, and the active deployment metadata visible in **Manage deployments** on 2026-08-30.
> **Goal:** determine which Core protections are present in the Apps Script editor source, which deployment is active, and what still must be proven before Core mutation.

## Status

`INV-10 — verify exact production source/version manifest`: **PARTIAL — ACTIVE DEPLOYMENT IDENTIFIED; DEPLOYED VERSION CONTENT STILL NEEDS FUNCTIONAL RECONCILIATION**.

We now have direct evidence that the active Web App deployment is **Version 143**, dated **Aug 29, 2026 11:37 PM**, and its visible Deployment ID prefix matches the deployment ID currently configured in TrendOS `config.js`.

We also have direct source evidence for the current Apps Script `Code.gs` text supplied from the project/editor. Critical Orders/Lines functions inspected are functionally identical to the GitHub working-branch `Code.gs`. However, the supplied Apps Script editor source contains D1 routing changes newer than the current GitHub `Code.gs`, so GitHub is not yet a byte-for-byte mirror of editor source.

Important evidence rule:

`Apps Script editor source != deployed version source unless proven.`

The active deployment metadata now identifies Version 143, but the screenshot alone does not prove that every line in the currently open editor source is included in Version 143.

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

## 2. Active Web App deployment metadata

Verified from the user-provided **Manage deployments** screenshot on 2026-08-30:

- State: **Active**
- Type: **Web app**
- Version: **143**
- Version timestamp shown by Apps Script: **Aug 29, 2026, 11:37 PM**
- visible Deployment ID prefix: `AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSy...`

This visible prefix matches the configured production deployment ID in TrendOS `config.js`.

Historical Version 138 is therefore **superseded as the currently active deployment version**. Preserve Version 138 only as historical deployment evidence.

What this proves:
- the frontend-configured deployment and the active Apps Script deployment are consistent by visible ID prefix.
- production is currently attached to Version 143, not Version 138.

What it does not prove by itself:
- that Version 143 contains the exact current editor source now visible.
- exact complete Apps Script project file composition of Version 143.

---

## 3. Current Apps Script `Code.gs` text supplied from project/editor

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
  - concurrent double-submit remains a real `CORE-P0` candidate.

- `updateLine_()`
  - matches GitHub source.
  - writes status/ready/update/notes, syncs order summary, appends activity, queues status message, and bumps data version.
  - still has no shared event-idempotency/transaction lock around the complete mutation + side effects.

- `syncOrderFromLines_()`
  - matches GitHub source.
  - collapses duplicate Line IDs for summary calculation.
  - excludes rows marked `مكرر` from active/current totals.

### Interpretation for Orders/Lines integrity

The source supplied from Apps Script confirms that the existing V1932 duplicate-aware Orders/Lines protections are present in the **current editor source**. Therefore:

- do **not** add another blind Line-ID duplicate patch.
- remaining work is to standardize concurrency/idempotency around weaker paths, especially customer draft conversion and line-update side effects.

---

## 4. Important source divergence discovered: D1 routing

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

Safety consequence:
- do not overwrite Apps Script from GitHub `Code.gs`.
- first capture the editor-side D1 delta intentionally into the working branch after D1 inventory.

---

## 5. Canonical intended Apps Script composition

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
- exact Version 143 project file composition still needs confirmation.

---

## 6. Deployment health check evidence

GitHub commit `ca8e7179f2b280e475a09b64b1c3ccf51b6b66d2` added:

`v1940-deploy-health.gs`

with:

`trendosV1940DeploymentHealth_()`

This function can verify module presence and spreadsheet access when run inside the Apps Script project, but its existence in GitHub does not prove that it exists in Version 143.

---

## 7. Google Drive evidence

Google Drive confirms:

- main spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- pre-Go-Live backups exist.
- folder `TrendOS V1932 Apps Script Deploy` exists.

The connector did not expose live Apps Script project source/deployment metadata from Drive.

---

## 8. Verified now

- active Web App deployment is **Version 143**.
- visible deployment ID prefix matches TrendOS `config.js` production deployment.
- historical Version 138 is no longer the active version.
- current editor source contains `appendLine_()` duplicate guard.
- current editor source contains `createManualOrder_()` V1908 replay + ScriptLock.
- current editor source `submitCustomerDraft_()` still lacks enclosing conversion lock.
- current editor source `updateLine_()` still lacks unified idempotent mutation contract.
- current editor source `syncOrderFromLines_()` performs duplicate collapse / `مكرر` exclusion.
- current editor source includes D1 read routing newer than GitHub `Code.gs`.

---

## 9. Still not verified

- exact source snapshot contained in **Version 143**.
- complete file list included in Version 143.
- whether `v1940-deploy-health.gs` exists in Version 143.
- exact D1 module versions behind `getDashboardD1PrimaryV1_()` and `getRowsPageD1FastV2_()`.

---

## 10. Next exact action

Use the active deployment itself as read-only runtime evidence before any mutation.

Next verification target:

**Run/read the existing live `health` / `ping` endpoint for Version 143 and record the returned backend version/spreadsheet identity.**

This is read-only and helps prove what Version 143 is actually serving.

After that, continue with function-level/runtime reconciliation and D1 module inventory. Do not redeploy yet.

---

## Safety decision

No production code, Sheets data, triggers, or deployments were changed during this reconciliation.

Do **not** overwrite Apps Script from GitHub `Code.gs` yet because the current editor source contains D1 routing that GitHub `Code.gs` does not currently contain.

Do **not** deploy `trendos-integrity-v1.gs` until Version 143 runtime/source composition is reconciled enough to avoid overwriting newer live behavior.