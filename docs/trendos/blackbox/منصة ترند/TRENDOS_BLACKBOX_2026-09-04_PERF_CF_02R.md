# TrendOS Blackbox — PERF-CF-02R — 2026-09-04

## Latest verified Cloudflare continuation
Continuation was executed from `PERF-CF-02Q` on branch `agent/go-live-2026-09-01-integrity`.

### Verified outcome
The isolated Cloudflare Preview itself deployed successfully in Auto Preview run `33898436019` / job `101106613882` at head `991dea585d69f7965318470bcb7ac64dc6f0a8cc`.

Worker:
- `trendos-edge-gateway-preview`
- Version ID: `b37a7758-2517-4af6-a6a7-5a80742e7643`

Safety/runtime gates before the final legacy freshness check all passed:
- pre-deploy tests PASS;
- Preview deployment PASS;
- health PASS with `cutover=false`;
- auth protections PASS;
- stale read fallback PASS;
- Cloud Write OFF and fail-closed;
- normalized import unavailable;
- mirror stats/capabilities read-only;
- D1 mutation protection PASS.

Wrangler confirmed:
- `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`;
- no `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED` binding, therefore heartbeat verifier OFF by default.

Orders mirror at the final gate:
- `274/274` row parity PASS;
- `status=ready`;
- live-sync note PASS;
- `syncedAt=2026-09-04 16:18:18 UTC`;
- age at check `2704s`;
- legacy `<=600s` write-timestamp freshness FAIL.

### Meaning
The overall workflow failure is caused by the obsolete `syncedAt`-only freshness gate. It is not a Preview deployment failure. This is the same idle/no-write condition diagnosed in `PERF-CF-02I` and addressed by the GitHub-qualified dual-signal heartbeat model through `PERF-CF-02Q`.

### Production state
- Production read cutover: OFF.
- Cloud Write: OFF.
- Apps Script heartbeat helper/route: NOT installed live yet.
- Sheets + Apps Script remain authoritative for writes.
- No production mutation was performed by this step.

### Exact continuation point
Next boundary is a controlled live Apps Script Head installation of the sanitized read-only helper plus the exact guarded `getD1OrdersLowUsageHeartbeatV1` route. The Preview heartbeat flag must remain OFF until that route is verified. Then enable heartbeat on isolated Preview, rerun dual-signal freshness qualification, and only then consider Orders Read Cutover.

Detailed checkpoint:
`docs/trendos/checkpoints/PERF_CF_02R_AUTO_PREVIEW_SAFETY_PASS_LEGACY_FRESHNESS_BLOCK_2026-09-04.md`

Checkpoint commit:
`7f4ce565f61120d08dd30536297f2bb44e94256f`
