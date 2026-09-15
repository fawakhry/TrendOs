# TrendOS Tasks V3 — T1.5 Preview D1 Created + Contract PASS — 2026-09-15

## Isolated preview D1
- Name: `trendos-tasks-v3-t15-preview-20260915`
- Database ID: `4c4d48f2-8c5d-45f2-9d41-c426c17ed93c`
- Created manually in Cloudflare Dashboard by owner.
- Confirmed empty at creation: 0 tables / 0 queries / 0 rows written.

## T1.5 source refresh design
- Read hot path: Worker -> isolated D1 only.
- Refresh path: T1.5 scheduled refresh -> qualified versioned T1 Preview Worker -> isolated Apps Script -> preview Sheets.
- T1.5 does not duplicate `TASKS_V3_SHARED_SECRET` and does not call Apps Script directly.
- Sheets remain authoritative.
- Stale/missing snapshot fails closed.

## Current code/config
- Isolated branch: `tasks-v3-t15-d1-read-replica-preview-20260915`
- Real preview Wrangler config binds ONLY to the isolated preview D1 ID above.
- Production D1 `trendos-main` ID remains explicitly forbidden by CI guard.
- Contract run `34963565918`: PASS.

## Production mutation
NONE.

## Next step
Apply only `cloudflare-d1/migrations-tasks-v3-t15-preview/0001_tasks_v3_t15_read_replica.sql` to the isolated preview D1 database. Then verify exactly one table exists: `tasks_v3_t15_read_snapshot`. Do not touch `trendos-main`.
