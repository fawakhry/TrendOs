# TrendOS Tasks V3 — T1.5 Runtime Variables Confirmed — 2026-09-15

## Confirmed
On isolated Worker `trendos-tasks-v3-t15-preview-20260915`, the following plaintext runtime variables are configured:
- `TASKS_V3_T15_MAX_SNAPSHOT_AGE_SECONDS = 180`
- `TASKS_V3_T1_SOURCE_URL = https://daf384a9-trendos-tasks-v3-t1-preview-20260914.trendmall-contact.workers.dev`

## Already confirmed earlier
- Worker deployed and returns `METHOD_NOT_ALLOWED` on GET, proving T1.5 code is active.
- D1 binding `TASKS_V3_PREVIEW_DB` points to isolated preview D1 `trendos-tasks-v3-t15-preview-20260915`.
- Preview D1 schema was applied successfully.

## Production mutation
NONE.

## Next step
Add an isolated scheduled trigger every minute for the T1.5 Worker. Then verify the scheduled refresh populates the D1 snapshot and run read-only POST health qualification against the T1.5 Worker. Do not add production routes, change secrets, touch `trendos-main`, or unlock T2.
