# PERF-CF-02CO — Authenticated Orders D1 Read Canary / View Mirror Stale Blocker

Date: 2026-09-06

## Status

**AUTH PASS — D1 VIEW-MIRROR STALE BLOCKED — FRONTEND OFF — BOUNDARY PASS**

02CO did not authorize or perform a frontend cutover.

The authenticated canary reached the real comparison stage, but it cannot pass yet because the D1 mirror for the live screen-view sheet `واجهة الطباعة` is stale/header-only while the authoritative Apps Script/Sheet path currently returns eight visible print rows.

This is a mirror freshness/source-selection blocker, not an authentication blocker and not a Cloudflare base-health failure.

## Starting point

02CO started after:

- `PERF-CF-02CK` closed PASS.
- `PERF-CF-02CL` closed PASS.
- `PERF-CF-02CM` closed READ-ONLY PASS.
- `PERF-CF-02CN` prepared the Orders D1 dashboard-builder candidate with CI PASS and default-OFF frontend flag.

## Production boundary throughout 02CO

No broad cutover happened.

No production authority transfer happened.

No unsafe mutation was performed:

- no D1 migration
- no `d1 execute --file`
- no generic outbox drain
- no 02CL gate reopen
- no Apps Script deployment
- no Apps Script property mutation
- no Worker secret mutation
- no `EDGE_SESSION_SECRET` rotation
- no frontend flag enablement
- no normalized-data authority cutover

The frontend flag stayed OFF:

```text
MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false
```

Sheets / Apps Script remain authoritative.

## Worker deployment evidence

The 02CN dashboard-builder code was deployed during the 02CO canary lane to make the read endpoint testable, but frontend activation stayed OFF.

Important deployed Worker versions during 02CO:

- Initial 02CN dashboard-builder deploy: `4c02c234-305c-4845-b9eb-f52bf647ff9b`
- Rerun after fresh auth: `77c8e87b-b9b5-4536-9169-3ebc87a5016f`
- First wrapper attempt: `30f6c487-7464-4829-8755-78f95e46de2e`
- View-mirror wrapper deployment: `0ec782a9-5943-4c9d-8820-51b7d0393210`

The final live Worker after this checkpoint is expected to be the view-mirror wrapper deployment, while the frontend remains OFF.

## Auth path result

The first controlled 02CO comparison attempt failed at Edge session HTTP `401`, proving the stored GitHub employee-token secret had become stale.

After the user refreshed the GitHub Actions employee-token secret from a fresh normal TrendOS login, the canary reached the authenticated comparison stage.

That means the auth blocker was resolved.

Do not paste employee-token values in chat or repository docs.

## D1 full-lines mismatch finding

The first authenticated comparison read from the D1 full `بنود الأوردرات` mirror and compared against Apps Script `getRowsPageV1931` for `screen=print`.

Result:

- Edge/D1 status: HTTP 200 / success
- Apps Script status: HTTP 200 / success
- Edge/D1 total rows: `153`
- Apps Script total rows: `8`
- Failure class: row identity mismatch

A row-diff diagnostic confirmed the Edge path was returning full historical/hidden print rows from `بنود الأوردرات`, while Apps Script was returning the current screen/hotfix-visible print list.

Safe ID examples from the Apps Script current print list:

- `3871 | 719895 | طلب جديد`
- `3874 | 720991 | طلب جديد`
- `3868 | 718799 | طلب جديد`
- `3691 | 654152 | جاهز للاستلام`
- `3628 | 631141 | جاهز للاستلام`

No customer names, phones, notes, or message contents should be logged for this diagnostic.

## View-sheet discovery

Google Sheet inspection confirmed a live sheet/tab named:

```text
واجهة الطباعة
```

That tab contains the same current eight visible print rows returned by Apps Script, using the same safe order/line/status IDs.

This showed that the correct canary source for matching Apps Script is the screen-view sheet/mirror, not raw `بنود الأوردرات`.

## Code prepared after discovery

A separate canary wrapper was added instead of changing the original large Orders read module directly:

```text
cloudflare-d1/src/edge-orders-read-v1-canary.mjs
```

It maps screen reads to view sheets:

- `service` → `واجهة خدمة العملاء`
- `print` → `واجهة الطباعة`
- `laser` → `واجهة الليزر`
- `press` → `واجهة المكبس`

`cloudflare-d1/src/index_v2.js` was routed through the wrapper for Orders read paths, but the frontend flag stayed OFF.

Safety test file:

```text
tests/cloudflare_edge_orders_canary_wrapper_02co.test.mjs
```

CI workflow retained:

```text
.github/workflows/trendos-02co-canary-wrapper-ci.yml
```

Final CI evidence for the wrapper candidate:

- 02CO Canary Wrapper CI Run: `33999677791`
- 02CO Canary Wrapper CI Job: `101396177370`
- Conclusion: **SUCCESS**
- Integrity Run: `33999677771`
- Integrity Job: `101396177393`
- Conclusion: **SUCCESS**

## Latest focused canary result

Focused canary workflow run:

- Workflow: `TrendOS 02CO Orders D1 Read Canary Wrapper TEMP`
- Run: `33999763773`
- Job: `101396400262`
- Trigger commit: `92c0ff3f90bf1b6a5435f4a094b3a41e921632a2`

Pre-deploy boundary marker:

```text
PERF_CF_02CO_WRAPPER_CANARY_PRE_BOUNDARY={"workerMs":350,"cloudWriteMs":387,"pendingOutbox":0,"cutover":false,"sheetsAuthoritative":true,"reconcileEnabled":false}
```

Controlled Worker deploy completed:

- Version ID: `0ec782a9-5943-4c9d-8820-51b7d0393210`
- Upload: `346.02 KiB / gzip 68.16 KiB`
- Startup: `6 ms`

The authenticated Edge session succeeded, but comparison failed because D1 screen-view mirror was stale/header-only:

```text
edgeVersion=D1_ORDERS_READ_V1_02CO_VIEW_CANARY
edgeTotalRows=0
appTotalRows=8
edgeMirror.sheetName=واجهة الطباعة
edgeMirror.sourceLastRow=1
edgeMirror.sourceLastCol=18
edgeMirror.syncedAt=2026-08-29 15:49:07
edgeMirror.note=TrendOS full mirror V1
```

Therefore the current blocker is:

```text
D1 mirror for واجهة الطباعة is stale/header-only and must be refreshed/imported before an authenticated D1 read canary can pass.
```

## Latest post-failure boundary proof

Read-only boundary workflow:

- Workflow: `TrendOS 02CO Latest Post Failure Boundary TEMP`
- Created commit: `2132b1f6e0034bf33b2fe78ee9224e62c574310f`
- Run: `33999848762`
- Job: `101396626997`
- Conclusion: **SUCCESS**

Boundary marker:

```text
PERF_CF_02CO_LATEST_POST_FAILURE_BOUNDARY={"workerMs":580,"cloudWriteMs":559,"pendingOutbox":0,"cutover":false,"sheetsAuthoritative":true,"reconcileEnabled":false,"genericDrainEnabled":false,"ordersUnauthStatus":401}
```

Confirmed after latest failed canary:

- Worker health OK.
- Cloud Write health OK.
- Cloud Write `pendingOutbox=0`.
- Production cutover remained `false`.
- Sheets / Apps Script remained authoritative.
- 02CL reconciliation gate remained OFF.
- generic outbox drain remained disabled/not exposed.
- `/v1/edge/orders/page` without token returned HTTP `401`.

## Cleanup performed

The following temporary workflows were deleted after boundary PASS to avoid accidental future deploy/read probes:

- `.github/workflows/trendos-02co-orders-d1-read-canary-temp.yml`
  - cleanup commit: `df24cfd314aebb309bc38e541c0e5690ba095426`
- `.github/workflows/trendos-02co-row-diff-diagnostic-temp.yml`
  - cleanup commit: `5c075708fb5f44f613e3dbca90c7d24105152424`
- `.github/workflows/trendos-02co-apps-row-shape-diagnostic-temp.yml`
  - cleanup commit: `017a6a545d0526ea258cf05c6524ec7e8b70e7a8`
- `.github/workflows/trendos-02co-orders-d1-read-canary-wrapper-temp.yml`
  - cleanup commit: `f3ab5d6ad7faba1821079ff663ec46e733eff32c`
- `.github/workflows/trendos-02co-wrapper-post-failure-boundary-temp.yml`
  - cleanup commit: `d8d49306c70ba79680a02ff45a62dc5df9dc3b89`
- `.github/workflows/trendos-02co-latest-post-failure-boundary-temp.yml`
  - cleanup commit: `d4f8a9c0ae6a1a3da8326cef0dbb5583479a1f80`

The retained candidate assets are:

- `cloudflare-d1/src/edge-orders-read-v1-canary.mjs`
- `tests/cloudflare_edge_orders_canary_wrapper_02co.test.mjs`
- `.github/workflows/trendos-02co-canary-wrapper-ci.yml`

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
- frontend D1 orders read flag: **OFF**
- frontend cutover: **NO**
- normalized-data cutover: **NO**
- authority transfer from Sheets to D1: **NO**
- `EDGE_SESSION_SECRET` rotation/replacement: **NONE**

## Required next checkpoint

Next safe checkpoint:

```text
PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite
```

Scope:

1. Do not enable frontend D1 read.
2. Keep Sheets / Apps Script authoritative.
3. Identify the existing mirror import path for screen-view sheets.
4. Refresh/import these screen-view tabs into D1 under a bounded audited workflow:
   - `واجهة خدمة العملاء`
   - `واجهة الطباعة`
   - `واجهة الليزر`
   - `واجهة المكبس`
5. Verify D1 catalog for `واجهة الطباعة` is no longer header-only and matches live source row count.
6. Then rerun authenticated D1-vs-Apps-Script canary.
7. Do not use generic outbox drain.
8. Do not rotate `EDGE_SESSION_SECRET`.

Until 02CQ or equivalent mirror freshness PASS exists, do not enable the frontend D1 Orders read flag.