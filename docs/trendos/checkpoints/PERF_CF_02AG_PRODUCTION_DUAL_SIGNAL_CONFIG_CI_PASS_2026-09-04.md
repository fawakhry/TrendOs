# PERF-CF-02AG — Production dual-signal config staged + CI PASS — 2026-09-04

## Staged production config (not yet deployed at this checkpoint)
`cloudflare-d1/wrangler.toml` now explicitly contains:
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "false"`
- Worker name remains `trendos-d1-api`.
- Apps Script upstream remains the verified Version-149 Web App deployment.
- D1 binding remains `trendos-main`.

## CI result
Full TrendOS Integrity CI completed all relevant gates successfully, including:
- Edge Gateway;
- Orders freshness gate;
- Orders idle heartbeat validator;
- idle freshness integration;
- Apps Script heartbeat helper safety;
- idle verifier;
- visibility-aware polling;
- all existing integrity regressions;
- Apps Script composition syntax/collision;
- pre-deploy package safety.

## Safety state
No production Worker deploy occurred as part of this config staging step.
No D1 migration/write occurred.
Frontend Orders cutover remains OFF.
Cloud Write remains explicitly OFF in the staged payload.

## Next gate
Deploy `trendos-d1-api` through a dedicated dual-signal production workflow that:
1. qualifies the staged payload;
2. keeps Cloud Write OFF;
3. rotates/knows a short-lived signing secret for runtime verification;
4. requires the signed protected Orders route to return HTTP 200 + `dataSource=d1-edge-orders`;
5. automatically rolls back to the immediately previous Worker version on any post-deploy failure.
