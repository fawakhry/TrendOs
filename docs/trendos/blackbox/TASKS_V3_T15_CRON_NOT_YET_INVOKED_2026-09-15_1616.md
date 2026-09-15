# Tasks V3 T1.5 Cron invocation checkpoint — 2026-09-15 16:16

Scope: isolated T1.5 preview only.

Observed:
- D1 query still returns no rows from `tasks_v3_t15_read_snapshot`.
- Observability shows only two HTTP POST error events from the GitHub read probe at ~15:57 local time.
- No `scheduled` event is visible yet.
- Deployed read path is confirmed to reach the isolated D1 binding and return `TASKS_V3_T15_REPLICA_EMPTY` with `upstream;dur=0.00`.
- Therefore the current blocker is cron-trigger invocation/propagation, not D1 schema, binding, or synchronous read path.

Cloudflare docs state cron-trigger changes may take several minutes, up to 15 minutes, to propagate globally.

No production mutation. No T2. No secret changes. No route changes.
