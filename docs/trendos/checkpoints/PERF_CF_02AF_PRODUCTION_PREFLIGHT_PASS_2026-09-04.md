# PERF-CF-02AF — Production Orders preflight PASS — 2026-09-04

## Scope
Read-only preflight only. No Worker deployment, no D1 mutation, no frontend cutover, no Cloud Write activation.

## Correct production Worker
`https://trendos-d1-api.trendmall-contact.workers.dev`

## Runtime result
- Production Edge health: PASS.
- `cutover=false` at the production Edge health contract.
- Production raw Orders mirror: `274 / 274`, status `ready`, source columns `67`, live-sync note `TrendOS orders live sync V2 quota-aware`.
- Production raw Lines mirror: `315 / 315`, status `ready`, source columns `82`, same live-sync note.
- Both mirrors reported `syncedAt=2026-09-04 16:18:18` and passed status/parity/live-note contract.
- Anonymous `/v1/edge/orders/page` returned HTTP `401`, proving the Orders Edge route already exists in production and remains auth-protected.

## Separate normalized-data note
The generic normalized entities shown by `/v1/edge/health` are stale. That lane is separate from the raw Orders/Lines mirror lane being qualified here and is not treated as proof that Orders raw-mirror parity failed.

## Current safety state
- Apps Script Version 149 heartbeat route: PASS.
- Isolated Preview dual-signal Orders route: PASS, `dataSource=d1-edge-orders`.
- Production Orders Edge route: present + auth-protected.
- Production frontend Orders cutover: NOT performed.
- Cloud Write: OFF / not authorized.
- Google Sheets + Apps Script remain authoritative for writes.

## Next gate
Inspect the exact frontend Orders Edge loader and production feature flag/rollback contract before any production backend heartbeat enablement or frontend traffic cutover.
