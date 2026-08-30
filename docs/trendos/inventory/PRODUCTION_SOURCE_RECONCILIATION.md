# TrendOS Phase 0 — Production Source Reconciliation

> **Scope:** read-only reconciliation of frontend runtime pointers, Apps Script deployment metadata, current editor source, GitHub source, and live runtime evidence.
> **Date:** 2026-08-30.

## Status

`INV-10 — verify exact production source/version manifest`: **PARTIAL — ACTIVE DEPLOYMENT + RUNTIME IDENTITY VERIFIED; EXACT VERSION 143 SOURCE SNAPSHOT/FILE COMPOSITION STILL PENDING**.

The active production Web App is now identified and has responded successfully through its live `/exec?action=health` endpoint.

Evidence hierarchy remains:

`LIVE RUNTIME > DEPLOYMENT METADATA > EDITOR SOURCE > REPOSITORY SOURCE > HISTORICAL PACKAGE`.

Important distinction:

`Current Apps Script editor source != Version 143 deployed source unless proven by version history or runtime behavior.`

---

## 1. Production endpoint

Current TrendOS `config.js` points to Apps Script deployment:

`AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`

Main spreadsheet ID:

`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

`MATBAGY_SECURE_API_PROXY_URL` is empty, so frontend requests currently resolve directly to the Apps Script deployment.

---

## 2. Active Web App deployment

Verified from **Deploy -> Manage deployments** screenshot:

- State: **Active**
- Type: **Web app**
- Version: **143**
- Version timestamp: **Aug 29, 2026, 11:37 PM**
- visible Deployment ID prefix matches the production ID configured in `config.js`.

Therefore historical Apps Script Version 138 is no longer the active deployment reference. It remains historical evidence only.

### Result

- `INV-10A — active deployment version`: **PASS**
- `INV-10B — deployment ID matches frontend`: **PASS — visible prefix + configured endpoint consistent**

---

## 3. Live Version 143 runtime health

Read-only request executed against the active deployment:

`/exec?action=health`

Returned:

- `success: true`
- `version: V1932_FULL_GO_LIVE_20260824`
- `spreadsheet: TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- `hasUsers: true`
- `hasOrders: true`
- `hasLines: true`
- `ordersRows: 152`
- `linesRows: 180`
- `sheets`: 87 sheet names returned.

The returned sheet list includes the expected Core sheets and newer Go-Live modules, including:

- `الأوردرات`
- `بنود الأوردرات`
- `المستخدمين`
- `العملاء`
- `سجل الدوام`
- `نبض الحضور`
- `حسابات - مسودات الفواتير`
- `تشغيل - النظافة اليومية`
- `تشغيل - مواعيد خاصة`
- `تشغيل - جلسات المكبس`
- `تشغيل - إعدادات المكبس`
- `إدارة - تسليم الشيفت`
- HR / feedback / recovery / continuity / customer-manager sheets.

### Interpretation

The active Version 143 deployment is definitely serving:

- the expected TrendOS backend family,
- the correct main spreadsheet,
- live access to Orders / Order Lines / Users,
- the 87-sheet operational workbook.

This closes runtime identity uncertainty for the base backend.

### Result

`INV-10C — deployed runtime identity`: **PASS**.

This does **not** by itself prove which exact implementation is used for every route inside Version 143, especially D1 route wiring.

---

## 4. Current Apps Script editor source vs GitHub

The supplied current Apps Script `Code.gs` identifies itself as:

`TrendOS + EasyStore unified Google Apps Script backend — V1932 FULL Go-Live / HR / WhatsApp / Attendance / Press`

and contains:

`MATBAGY_ACCOUNTING_VERSION = "V1932_FULL_GO_LIVE_20260824"`

This version label matches the live `health` response.

### Orders / Lines functions reconciled

For the inspected source ranges, current editor source and GitHub working-branch source agree on these important protections:

- `appendLine_()` has V1932 Line-ID duplicate guard.
- `createManualOrder_()` has outer `ScriptLock` + V1908 saved-request replay + recent duplicate guard.
- `syncOrderFromLines_()` collapses duplicate Line IDs and excludes rows marked `مكرر` from live totals.

Current remaining gaps in the editor source:

- `submitCustomerDraft_()` has a sequential re-submit guard but **no outer lock** around `check draft -> allocate order -> write summary/lines -> mark submitted`.
- `updateLine_()` has **no unified lock/event-idempotency contract** around state write + order sync + activity + queued message + data-version side effects.

Decision:

- do **not** add another blind Line-ID duplicate patch.
- customer-draft conversion and line-update side effects remain genuine `CORE-P0` candidates for the shared integrity layer.

---

## 5. Critical source divergence: D1 route wiring

Current supplied Apps Script editor source routes:

- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

Current GitHub working-branch `Code.gs` still routes:

- `getDashboard` -> `getDashboard_(e)`
- `getRowsPageV1931` -> `getRowsPageV1931_(e)`

Therefore Apps Script editor source is ahead of GitHub `Code.gs` in at least D1 read routing.

Safety consequence:

**Do not overwrite Apps Script from GitHub `Code.gs`.**

The D1 delta must first be captured intentionally after the D1 source inventory.

---

## 6. Remaining INV-10 uncertainty

Still not fully proven:

- exact complete source snapshot stored as Version 143.
- exact complete Apps Script file list included in Version 143.
- whether Version 143 specifically contains the two newer D1 route lines seen in current editor source.
- exact D1 module versions behind `getDashboardD1PrimaryV1_()` and `getRowsPageD1FastV2_()`.
- whether `v1940-deploy-health.gs` is included in Version 143.

The live health response confirms backend identity, not every individual function implementation.

---

## 7. Next exact action

Before any Core mutation, reconcile **Version 143 source history** against the current editor source for the two D1 route lines.

Preferred read-only evidence:

1. Open Apps Script **Project history**.
2. Select **Version 143**.
3. Inspect `Code.gs` around the `doGet` routing for:
   - `getDashboard`
   - `getRowsPageV1931`
4. Record whether Version 143 points to the D1 functions or the older direct functions.

No deploy and no save are required for this check.

After that, continue Phase 0 source/file inventory rather than editing production.

---

## Safety decision

No production code, spreadsheet data, triggers, or deployment was changed during this reconciliation.

Do not deploy `trendos-integrity-v1.gs` yet.
Do not overwrite Apps Script from GitHub yet.
Google Sheets remains authoritative for writes; D1 remains the fast read/mirror layer until an approved migration changes that.