# CLOUD MIGRATION V3 — T11 Service freshness guard added

Date: 2026-09-14
Commit: `fcbb1ffceab5a02c121f8890810a0ab3f67d6f5d`

## Change
The branch-only Service D1 route now applies fail-open freshness protection before returning business rows.

Behavior:
- If `الأوردرات` mirror write age is within the qualified freshness budget, D1 read proceeds.
- If write age is older, the existing sanitized low-usage heartbeat must prove the source is unchanged and the Orders/Lines source shapes still match.
- If the verifier is disabled, heartbeat is invalid, source shape differs, or verification errors, the route returns `503` with `fallback: apps-script`.
- No stale Service business rows are intentionally served without one of those freshness proofs.

## Scope / safety
- Branch-only at this checkpoint.
- No production Worker deploy yet.
- No frontend Service cutover.
- No D1 migration.
- No business write mutation.
- No Task/Gaber/secret changes.

## Next step
Run a production Worker canary that deploys only the isolated Service route/runtime wiring, verifies live freshness + 35-row parity, and automatically rolls the Worker back if any post-deploy qualification fails.
