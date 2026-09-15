# TrendOS Tasks V3 — T1.5 Schema Applied + Dashboard Bundle Ready — 2026-09-15

## D1 preview database
- Name: `trendos-tasks-v3-t15-preview-20260915`
- Database ID: `4c4d48f2-8c5d-45f2-9d41-c426c17ed93c`
- User-confirmed Console execution: schema query successfully executed.
- Table: `tasks_v3_t15_read_snapshot`
- Index: `idx_tasks_v3_t15_read_snapshot_refreshed_at`

## Worker configuration
- Real isolated Wrangler config exists and binds only the preview D1 database above.
- T1 source URL: `https://daf384a9-trendos-tasks-v3-t1-preview-20260914.trendmall-contact.workers.dev`
- No new shared secret is required in T1.5; async refresh goes through the qualified T1 preview source.
- Read hot path remains D1-only and has no synchronous Google/Apps Script call.

## Dashboard-ready deployment artifact
- Single-file Worker source: `cloudflare-d1/dashboard/tasks-v3-t15-preview-worker.single.mjs`
- Source commit: `1b46989838c1d9a5e58ebb07def2241567f82485`
- CI hardening commit: `a8f57ede3661953a3d25663faf894e33abd49f40`
- Contract/syntax workflow run: `34963872513`
- Result: PASS.

## Guardrails
- Never bind `trendos-main` (`5c4b92bf-e043-4f6e-bd6d-d514a92cd825`).
- No production routes.
- No claimNext / completeTask.
- No T2.
- No production secret changes.

## Production mutation
NONE.

## Next step
Create an isolated Cloudflare Worker named `trendos-tasks-v3-t15-preview-20260915` from the single-file dashboard artifact; bind D1 as `TASKS_V3_PREVIEW_DB`; add non-secret vars `TASKS_V3_T1_SOURCE_URL` and `TASKS_V3_T15_MAX_SNAPSHOT_AGE_SECONDS=180`; add a one-minute cron; deploy; verify scheduled refresh populates one snapshot row; then run 30 read-only health calls and evaluate p50/p95.
