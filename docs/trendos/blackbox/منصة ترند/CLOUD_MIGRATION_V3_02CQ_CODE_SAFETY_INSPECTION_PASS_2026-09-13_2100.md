# TrendOS Cloud Migration V3 — 02CQ Screen-View Refresh Code Safety Inspection PASS

Date: 2026-09-13 21:00 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Inspected the existing `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs` implementation before any attempt to refresh Production D1 screen-view mirrors.

Result: code-safety contract is suitable for a controlled read-mirror refresh, subject to verifying that the deployed Apps Script Web App exposes the intended status/one-shot entrypoint.

## Exact 02CQ scope

Targets only:
- `واجهة خدمة العملاء`
- `واجهة الطباعة`
- `واجهة الليزر`
- `واجهة المكبس`

Authoritative spreadsheet is locked to:
`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

Behavior:
- reads Google Sheets source only;
- reads existing `D1_API_URL` and `D1_MIGRATION_SECRET` Script Properties without exposing them;
- stages each target in bounded batches;
- performs one atomic promote covering all four target views;
- verifies source last row/col, D1 row count, status=ready, and expected note after promote;
- does not modify source Google Sheets;
- does not enable frontend D1 reads;
- does not move business-write authority;
- does not touch Cloud Write outbox/reconciliation gates.

One-shot entrypoint:
`runD1ScreenViewMirrorRefresh02CQOnce()`

Safety of one-shot:
- refuses if its gate is already ON;
- temporarily sets `TRENDOS_PERF_CF_02CQ_SCREEN_VIEW_REFRESH_ENABLED=1`;
- always deletes that property in `finally`;
- a failed preflight before promote cannot mutate the production mirror, though staging may exist transiently;
- source Sheets remain unchanged.

Read-only status entrypoint:
`getD1ScreenViewMirrorRefresh02CQStatus()`

## Important deployment uncertainty

The controlled-branch `Code.gs` does not contain an obvious route reference for `getD1ScreenViewMirrorRefresh02CQStatus` / `runD1ScreenViewMirrorRefresh02CQOnce`. Since deployed Production Apps Script has already proven to differ from this branch in Service behavior, availability must be checked against the live Web App rather than inferred from repo source.

## Production state unchanged

- Production main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with Apps Script fallback.
- Service: Apps Script.
- source Sheets and all business writes unchanged.
- no Task/Gaber/core-secret changes.

## Exact next step

Run a read-only live Web App route probe for `getD1ScreenViewMirrorRefresh02CQStatus` via GET and POST. Log only action availability/status metadata. Do NOT call the one-shot refresh until the status route / deployed module availability is proven and the mutation scope remains exactly the four D1 read mirrors.
