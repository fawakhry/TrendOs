# TrendOS Tasks V3 — T1.5 D1 Binding Confirmed — 2026-09-15

## Confirmed
- Isolated Worker: `trendos-tasks-v3-t15-preview-20260915`
- Worker code deployed and active; GET returns `METHOD_NOT_ALLOWED` as designed.
- D1 binding was added in Cloudflare Dashboard.
- Binding name: `TASKS_V3_PREVIEW_DB`.
- Target database: isolated preview D1 `trendos-tasks-v3-t15-preview-20260915`.
- Production `trendos-main` was not selected or modified.

## Production mutation
NONE.

## Next step
Add plain-text Worker variables only:
- `TASKS_V3_T1_SOURCE_URL = https://daf384a9-trendos-tasks-v3-t1-preview-20260914.trendmall-contact.workers.dev`
- `TASKS_V3_T15_MAX_SNAPSHOT_AGE_SECONDS = 180`
Then configure a one-minute Cron Trigger for the isolated T1.5 Worker. Do not add or rotate secrets. Do not add routes/domains. T2 remains locked.
