# TrendOS Tasks V3 T1.5 — Live Observability clarification — 2026-09-15

## State
- Branch: `tasks-v3-t15-d1-read-replica-preview-20260915`
- Worker: `trendos-tasks-v3-t15-preview-20260915`
- D1 preview binding/read path already verified working.
- D1 snapshot table is still empty.
- Cron was configured/re-added as `* * * * *`.

## Live Observability evidence
At local time around 15:57, Live Observability showed exactly two POST errors to the T1.5 Worker URL.
These events correspond to the GitHub read-probe requests from workflow run `34971958555` and are NOT scheduled/Cron invocations.
The probe returned `TASKS_V3_T15_REPLICA_EMPTY` for both health and status with `upstream;dur=0.00`, proving the public read path reaches D1 and does not call upstream synchronously.

## Conclusion
- Worker fetch path: working.
- D1 binding: working.
- Snapshot persistence: not happening yet.
- No confirmed `scheduled` invocation has appeared in Live Observability yet.
- Current fault domain is narrowed to Cron attachment/propagation or scheduled-handler invocation path, not D1 read binding and not fetch routing.

## Safety
- No Production mutation.
- No secret changes.
- No Task mutation.
- No T2 start.
