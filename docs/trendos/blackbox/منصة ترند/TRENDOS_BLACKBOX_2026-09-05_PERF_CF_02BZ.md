# TrendOS Black Box — PERF-CF-02BZ

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Checkpoint: `PERF-CF-02BZ`
State: **PASS — Production wrapper deployed safely; Shadow OFF; Cloud Write OFF**

## User authorization

The user explicitly authorized safe Production deployment.

## Deployment method

The existing controlled deployment workflow was used. Because direct workflow-dispatch creation was not exposed by the connected GitHub tool, a one-commit push authorization was temporarily added and bound to the exact authorized commit message:

`AUTHORIZED PROD SHADOW OFF DEPLOY 2026-09-05`

Authorized commit:

- `e6433cea22f9eeacc723c59015c2f1ec0ef7f5f4`

Deployment workflow run:

- `33958889631`

Job:

- `101287109118`

Result:

- **SUCCESS**

## Safety gates that passed before deployment

- Production entrypoint is `production-shadow/index.js`.
- Shadow flag is OFF.
- Cloud Write flag is OFF.
- low-usage heartbeat remains enabled.
- no D1 migration apply command exists in this deployment path.
- no Worker secret rotation command exists in this deployment path.
- Shadow contract PASS.
- Orders read/freshness/idle heartbeat PASS.
- Edge gateway PASS.
- mirror safety PASS.
- Wrangler dry-run PASS.
- live Production GET-only preflight PASS.

## Production deployment result

Worker:

- `trendos-d1-api`

Production version:

- `f4bcdc6b-5071-46f4-94ae-98641e8a984e`

Worker startup time reported by Wrangler:

- `5 ms`

The deployed configuration kept:

- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = false`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = false`
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = true`

No D1 migration was executed.
No Worker secret was rotated.

## Post-deploy verification

### Core runtime

PASS:

- database connected,
- Edge auth configured,
- Apps Script upstream configured,
- cutover remains false,
- anonymous Orders path remains protected with 401.

### Production Shadow

PASS — route is installed through the wrapper but disabled:

- HTTP 404,
- `production-shadow-disabled`,
- read-only,
- mutation-free,
- no D1 read/write,
- no Apps Script call,
- no Sheets write,
- zero mutations,
- production write disabled,
- production cutover false.

### Cloud Write

PASS:

- enabled false,
- writes accepted false,
- cutover false,
- Sheets authoritative true.

### Orders mirror

PASS:

- Orders 274 / 274.
- Lines 315 / 315.
- both synced at `2026-09-05 09:43:50`.
- live sync note = `TrendOS orders live sync V2 quota-aware`.

### Rollback

Not needed. All verification passed.

## Authorization cleanup

Immediately after successful deployment, the temporary push trigger was removed.

Restoration commit:

- `849a7e1e169bbca157991a23769f2f1049fad978`

Controlled deployment workflow is again manual-only (`workflow_dispatch`).

Post-cleanup Integrity run:

- `33958941363` — SUCCESS.

## Important existing note

The general normalized Edge health still reports older normalized entities as stale under its separate 180-second freshness policy. This is pre-existing and distinct from the Orders dual-signal mirror path. `cutover=false` remains in effect. Do not treat wrapper deployment as normalized-data cutover approval.

## Exact stop state

- Production wrapper: DEPLOYED.
- Production Worker version: `f4bcdc6b-5071-46f4-94ae-98641e8a984e`.
- Production Shadow: OFF.
- Production Cloud Write: OFF.
- Sheets authoritative: YES.
- D1 migration: NONE.
- D1 business writes: NONE.
- Apps Script writes: NONE.
- Sheet writes: NONE.
- Worker secret rotation: NONE.
- frontend cutover: NONE.

## Next safe step

Do not enable Cloud Write.

If continuing the Shadow path, the next separate checkpoint is a controlled read-only Production Shadow observation enablement with a fresh live preflight first. It must remain mutation-free and must not imply Cloud Write or frontend cutover.

Canonical checkpoint:

`docs/trendos/checkpoints/PERF_CF_02BZ_PRODUCTION_SHADOW_WRAPPER_DEPLOYED_OFF_2026-09-05.md`
