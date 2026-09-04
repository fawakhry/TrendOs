# TRENDOS BLACKBOX — PERF-CF-02AG — 2026-09-04

## Event
Production dual-signal Orders-read configuration was staged on the working branch only.

## Staged values
- Worker: `trendos-d1-api`
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED=true`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`
- frontend `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED` remains false.

## Verification
Full Integrity CI passed all Edge heartbeat/freshness/integration and legacy regression gates, including Apps Script composition and pre-deploy safety.

## Production impact
None at this checkpoint: config was not deployed to the production Worker, no D1 migration/write occurred, frontend traffic remains on the current path.

## Next action
Use a dedicated production deploy workflow with automatic rollback and require signed `/v1/edge/orders/page` to return HTTP 200 + `dataSource=d1-edge-orders` before any frontend flag is enabled.
