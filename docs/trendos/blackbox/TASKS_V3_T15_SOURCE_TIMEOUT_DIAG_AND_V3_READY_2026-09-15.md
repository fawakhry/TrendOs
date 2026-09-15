# Tasks V3 T1.5 — Source Timeout Diagnosis + v3 Ready — 2026-09-15

## Scope
Isolated preview only. No production mutation. No T2. No claim/complete. No secret changes.

## Evidence
Source probe run: 34970834725

Exact T1.5-style request headers:
- health: HTTP 200
- status: HTTP 400 with `TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT` at Worker hard timeout 5000ms

Browser-like User-Agent probe:
- health: HTTP 200
- status: HTTP 200

Conclusion: scheduled refresh can fail before D1 write because the T1 source `status` request is sensitive to upstream latency and request profile. The prior refresh also used two sequential source calls (health + status), increasing failure probability.

## T1.5 v3 change
Prepared isolated v3 implementation:
- single `status` source call on normal refresh
- browser-like `User-Agent: Mozilla/5.0 TrendOS-T15-Preview-Refresh`
- one retry after source failure
- validate status + flyPrint + pressCandidates before persisting
- derive health snapshot from validated status success
- read hot path remains Worker -> isolated D1 only
- no Apps Script synchronous fallback
- no shared secret duplication
- no mutation operations
- snapshot version `TASKS_V3_T15_D1_PREVIEW_3`

Files:
- `cloudflare-d1/src/tasks-v3-t15-d1-preview-v3.mjs`
- `cloudflare-d1/src/tasks-v3-t15-preview-worker-v3.mjs`
- `cloudflare-d1/dashboard/tasks-v3-t15-preview-worker-v3.single.mjs`
- `cloudflare-d1/test/tasks-v3-t15-preview-v3-contract.mjs`

Contract run: 34971105346 — PASS
Dashboard bundle commit: beee47c16a373704a631d23ced060353ae044675

## Current Cloudflare preview resources
Worker: `trendos-tasks-v3-t15-preview-20260915`
D1: `trendos-tasks-v3-t15-preview-20260915`
D1 id: `4c4d48f2-8c5d-45f2-9d41-c426c17ed93c`
Binding: `TASKS_V3_PREVIEW_DB`
Variables:
- `TASKS_V3_T1_SOURCE_URL=https://daf384a9-trendos-tasks-v3-t1-preview-20260914.trendmall-contact.workers.dev`
- `TASKS_V3_T15_MAX_SNAPSHOT_AGE_SECONDS=180`
Cron: every minute
Schema exists but snapshot table currently has no rows under prior v2 refresh implementation.

## Next step
Replace Cloudflare Dashboard `worker.js` with `cloudflare-d1/dashboard/tasks-v3-t15-preview-worker-v3.single.mjs`, deploy same isolated Worker, then wait one cron cycle and verify D1 snapshot row. Do not change bindings, variables, cron, routes, production D1, or secrets.
