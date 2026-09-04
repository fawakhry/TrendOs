# PERF-CF-02J — Low-Usage Heartbeat Routing Inspection — 2026-09-04

## Trigger
Follow-up to `PERF-CF-02I` after confirming that the current D1 write-age freshness model conflicts with the approved zero-idle D1 behavior.

## Read-only routing inspection performed
Inspected working-branch sources only:
- `Code.gs`
- `trendos-integrity-router-v1.gs`
- `v1932-router.gs`
- historical backend-unification handoff/checkpoint for routing safety boundaries.

## Findings
### GitHub `Code.gs`
The repository copy of `Code.gs` shows `doGet(e)` calling `trendosV1932TryRoute_` first, followed by older routers and the legacy action chain.

The repository copy does **not** contain an action route for `getD1OrdersLowUsageStatusV1`.

It also does not contain direct wiring for `trendosIntegrityTryRouteV1_` in the inspected repository copy.

Important boundary: repository `Code.gs` is **not** assumed to be an exact persisted Production Version 148 source snapshot. Existing TrendOS safety rules continue to forbid blind Production replacement from GitHub `Code.gs`.

### `trendos-integrity-router-v1.gs`
The Integrity route table currently exposes HEALTH and the guarded business families, but it does not expose the D1 low-usage status function.

### `v1932-router.gs`
The V1932 adapter handles existing production-facing V1932 actions and returns `null` for unknown actions. It does not expose `getD1OrdersLowUsageStatusV1`.

### Direct deployed URL probe
A direct external tool probe to the deployed Apps Script status action could not be used because the available web-access tool rejected the URL at its safe-navigation boundary. This is a tooling limitation and **is not Runtime failure evidence**.

## Conclusion
There is currently no repository-proven safe deployed route for Cloudflare Edge to read `getD1OrdersLowUsageStatusV1()` from Version 148.

Therefore the next safe step is **not** to modify or overwrite Production Apps Script routing.

The correct immediate step is to implement and test the dual-signal freshness contract on the GitHub working branch only, with these constraints:
- existing D1 freshness behavior remains the default;
- a stale-by-write-age mirror stays fail-closed unless an explicitly supplied trusted idle-source verifier succeeds;
- parity/status/live-note failures can never be overridden by a heartbeat;
- missing/malformed/stale/error heartbeat remains fail-closed;
- no Production route, deployment, feature flag, Cloud Write authority, or read cutover is changed by this implementation.

## Production impact
**NONE.**

## Next step
Implement the smallest testable GitHub-only heartbeat validator + optional freshness-gate verifier path, run regression tests/CI, then record results before considering any Preview or Apps Script routing work.
