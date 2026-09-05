# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Latest checkpoint

`PERF-CF-02CO — Controlled Orders D1 Read Canary / Authenticated Comparison`

Status: **AUTH PASS — D1 VIEW-MIRROR STALE BLOCKED — FRONTEND OFF — BOUNDARY PASS**

Latest record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_AUTH_PASS_VIEW_MIRROR_STALE_BLOCKED_BOUNDARY_PASS.md`

## Previously closed/prepared checkpoints

`PERF-CF-02CN — Orders Read Path Cutover Readiness / Slowness Hot-Path Fix`

Status: **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**

`PERF-CF-02CM — Post-02CL Production Stability / Cutover Readiness Preflight`

Status: **READ-ONLY PREFLIGHT PASS — CLOSED**

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

Status: **VERIFIED PASS — CLOSED**

`PERF-CF-02CK — Production Cloud Write Business Qualification`

Status: **VERIFIED PASS — CLOSED**

## 02CO final result

02CO reached authenticated D1-vs-Apps-Script comparison after the user refreshed the employee-token GitHub secret from a fresh normal TrendOS login.

The auth blocker was resolved.

The canary is now blocked by D1 source freshness, not auth.

The authoritative Apps Script `getRowsPageV1931` path for `screen=print` returns the live screen-view list with `8` rows. D1 full `بنود الأوردرات` returned too much history (`153`, then `26` after a partial wrapper). The correct live source was found to be the screen-view sheet/tab `واجهة الطباعة`.

A canary wrapper was added to route D1 Orders read canary through screen-view mirrors:

- `service` → `واجهة خدمة العملاء`
- `print` → `واجهة الطباعة`
- `laser` → `واجهة الليزر`
- `press` → `واجهة المكبس`

However, the D1 mirror for `واجهة الطباعة` is stale/header-only:

- `edgeVersion=D1_ORDERS_READ_V1_02CO_VIEW_CANARY`
- `edgeTotalRows=0`
- `appTotalRows=8`
- `edgeMirror.sheetName=واجهة الطباعة`
- `edgeMirror.sourceLastRow=1`
- `edgeMirror.sourceLastCol=18`
- `edgeMirror.syncedAt=2026-08-29 15:49:07`
- `edgeMirror.note=TrendOS full mirror V1`

Therefore the D1 Orders read canary cannot pass until the screen-view tabs are refreshed/imported into D1 or the Edge view is rebuilt exactly from another fresh D1 source.

## 02CO key evidence

Final focused canary:

- Workflow: `TrendOS 02CO Orders D1 Read Canary Wrapper TEMP`
- Run: `33999763773`
- Job: `101396400262`
- Trigger commit: `92c0ff3f90bf1b6a5435f4a094b3a41e921632a2`
- Result: Auth succeeded, comparison failed because D1 `واجهة الطباعة` mirror had `0` rows while Apps Script returned `8`.

Latest post-failure boundary:

- Workflow: `TrendOS 02CO Latest Post Failure Boundary TEMP`
- Created commit: `2132b1f6e0034bf33b2fe78ee9224e62c574310f`
- Run: `33999848762`
- Job: `101396626997`
- Conclusion: **SUCCESS**

Boundary marker:

```text
PERF_CF_02CO_LATEST_POST_FAILURE_BOUNDARY={"workerMs":580,"cloudWriteMs":559,"pendingOutbox":0,"cutover":false,"sheetsAuthoritative":true,"reconcileEnabled":false,"genericDrainEnabled":false,"ordersUnauthStatus":401}
```

## 02CO retained candidate assets

Retained:

- `cloudflare-d1/src/edge-orders-read-v1-canary.mjs`
- `tests/cloudflare_edge_orders_canary_wrapper_02co.test.mjs`
- `.github/workflows/trendos-02co-canary-wrapper-ci.yml`

CI evidence for retained candidate:

- 02CO Canary Wrapper CI Run: `33999677791`
- Job: `101396177370`
- Conclusion: **SUCCESS**
- TrendOS Integrity Run: `33999677771`
- Job: `101396177393`
- Conclusion: **SUCCESS**

Temporary workflows were cleaned after boundary proof to avoid accidental deploys/probes:

- `df24cfd314aebb309bc38e541c0e5690ba095426`
- `5c075708fb5f44f613e3dbca90c7d24105152424`
- `017a6a545d0526ea258cf05c6524ec7e8b70e7a8`
- `f3ab5d6ad7faba1821079ff663ec46e733eff32c`
- `d8d49306c70ba79680a02ff45a62dc5df9dc3b89`
- `d4f8a9c0ae6a1a3da8326cef0dbb5583479a1f80`

## Current production boundary

- Production Worker: `trendos-d1-api`
- Production Worker Version ID: `0ec782a9-5943-4c9d-8820-51b7d0393210`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Cloud Write `pendingOutbox`: `0`
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- Apps Script 02CL route: live, gate **OFF**
- Worker 02CL route: live, gate **OFF**
- generic outbox drain: **not exposed / not used**
- frontend D1 orders read flag: **OFF** (`MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`)
- frontend cutover: **NO**
- normalized-data cutover: **NO**
- authority transfer from Sheets to D1: **NO**
- `EDGE_SESSION_SECRET` rotation/replacement: **NONE**

## Active checkpoint / next safe work

`PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`

Safe next-work rules:

1. Read this file and `00_INDEX.md` before any new work.
2. Read latest 02CO view-mirror-stale record.
3. Do not rerun 02CK, 02CL, 02CM, or 02CN unless source changed materially.
4. Do not use generic outbox drain.
5. Do not rotate `EDGE_SESSION_SECRET`.
6. Do not enable Apps Script/Worker 02CL gates again unless a new bounded audited checkpoint is created.
7. Do not enable broad frontend or authority cutover without explicit approval.
8. Keep Sheets / Apps Script authoritative.
9. Find and use the existing bounded mirror import/sync route for screen-view tabs, or create a new audited candidate default-OFF.
10. Refresh/import screen-view tabs before rerunning authenticated D1 read canary.
11. Keep `__DEBT__` filter on Apps Script fallback.
