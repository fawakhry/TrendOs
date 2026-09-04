# PERF-CF-02R — Auto Preview Safety PASS / Legacy Freshness Gate Block — 2026-09-04

## Trigger
Continue from `PERF-CF-02Q` and verify the automatic Cloudflare isolated Preview on the heartbeat-default-OFF source lineage before any live Apps Script heartbeat route installation.

## Verified Auto Preview run
- Workflow: `TrendOS Cloudflare Auto Preview`
- Run ID: `33898436019`
- Job: `deploy-edge-preview`
- Job ID: `101106613882`
- Head SHA: `991dea585d69f7965318470bcb7ac64dc6f0a8cc`
- Preview Worker: `trendos-edge-gateway-preview`
- Preview URL: `https://trendos-edge-gateway-preview.trendmall-contact.workers.dev`
- Deployed Worker Version ID: `b37a7758-2517-4af6-a6a7-5a80742e7643`

## Deployment / safety evidence
The isolated Preview deployment itself completed successfully.

PASS before the final freshness gate:
- pre-deploy safety tests;
- required deploy secrets present;
- Preview workflow confirmed D1-mutation-free;
- official Wrangler deploy completed;
- `/v1/edge/health` HTTP 200;
- database/auth/upstream configured;
- `cutover=false`;
- anonymous protected route rejected;
- signed Preview authentication passed;
- stale D1 reads failed closed to Apps Script fallback;
- Edge session incomplete credentials rejected before upstream;
- Cloud Write health read-only and disabled;
- Cloud Write mutation route blocked;
- normalized import unavailable on Preview;
- mirror stats SELECT-only;
- atomic mirror capability read-only;
- anonymous mirror import could not initialize schema;
- Preview Edge / D1 mirror benchmark completed.

## Safety flags verified at deploy
Bindings reported by Wrangler included:
- `EDGE_DATA_MAX_AGE_SECONDS=180`
- `EDGE_ORDERS_MIRROR_MAX_AGE_SECONDS=600`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`

No `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED` binding was present, so the new heartbeat verifier remained OFF by default as required.

Cloud Write runtime health confirmed:
- `enabled=false`
- `writesAccepted=false`
- `schemaMutationFree=true`
- `cutover=false`
- `sheetsAuthoritative=true`

## Performance sample
15-request Preview benchmark:
- Edge health: avg `288.9 ms`, median `270 ms`, p90 `386.1 ms`, max `406.9 ms`.
- D1 Orders mirror: avg `322.2 ms`, median `270.1 ms`, p90 `403.2 ms`, max `831.3 ms`.

## Exact blocking gate
The final job step `Gate Orders and Lines mirror freshness` failed because it still uses the legacy write-timestamp-only predicate.

Orders evidence at the gate:
- sheet: `الأوردرات`
- `rowCount=274`
- `sourceLastRow=274`
- `sourceLastCol=67`
- `status=ready`
- `syncedAt=2026-09-04 16:18:18 UTC`
- `ageSeconds=2704`
- `note=TrendOS orders live sync V2 quota-aware`
- row parity: PASS
- live-sync note: PASS
- legacy freshness (`ageSeconds <= 600`): FAIL

This is the exact stale-by-idle condition diagnosed in `PERF-CF-02I`: zero-idle D1 intentionally performs no write when source data is unchanged, so `syncedAt` alone cannot prove source verification freshness.

## Interpretation
**PREVIEW DEPLOYMENT = PASS**

**PREVIEW SAFETY / AUTH / FALLBACK / CLOUD-WRITE-OFF = PASS**

**LEGACY `syncedAt`-ONLY FRESHNESS GATE = BLOCKED**

The job's overall `failure` conclusion is caused by that final legacy freshness predicate, not by a failed Preview deployment or an unsafe runtime state.

## Production impact
**NONE.**
- No live Apps Script helper/route installed.
- Heartbeat verifier remains OFF.
- No Production Edge read cutover.
- No Cloud Write authority change.
- No D1 mutation/import performed by this qualification run.
- Sheets + Apps Script remain authoritative for writes.

## Exact next boundary
Controlled Apps Script Head installation of:
1. the sanitized read-only heartbeat helper; and
2. the exact single guarded route for `getD1OrdersLowUsageHeartbeatV1`.

Do not enable `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED` in Preview until that live read-only route is verified. After route verification, enable heartbeat on isolated Preview only, rerun the dual-signal freshness qualification, then proceed toward Orders Read Cutover only if parity/status/live-note/heartbeat gates all PASS.
