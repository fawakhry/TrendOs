# PERF-CF-02H — Freshness Recheck After Low-Usage Runtime — 2026-09-04

## Trigger
Continuation from `PERF-CF-02G` after the user supplied the final prior-chat Apps Script Executions screenshot and the resume anchor was recorded.

## Safety verification
Before execution, `.github/workflows/trendos-cloudflare-freshness-diagnostics.yml` was re-read and confirmed to be read-only:
- GitHub token permission: contents read.
- Apps Script probes are GET-only.
- D1 mirror inspection is GET-only.
- No migration.
- No import.
- No Apps Script mutation.
- No production cutover.

## Diagnostic execution
Existing workflow run `33872269114` / prior job `101020794642` was re-run safely.

New job:
- Job ID: `101101815305`
- Result: `SUCCESS`
- Execution window began around `2026-09-04T16:46:23Z`.

## Production Apps Script read-only probe
`ping` returned HTTP 200 and confirmed:
- backend lineage: `V1932_FULL_GO_LIVE_20260824`
- Orders rows: `274`
- Lines rows: `315`

Legacy status actions queried by this older diagnostics workflow still return `Action غير معروف.` and therefore are not used as authoritative status evidence.

## D1 Orders / Lines result
Orders mirror:
- rowCount: `274`
- sourceLastRow: `274`
- sourceLastCol: `67`
- status: `ready`
- syncedAt: `2026-09-04 16:18:18`
- ageSeconds at observation: `1706`
- note: `TrendOS orders live sync V2 quota-aware`
- row parity: PASS
- freshness <=180s: FAIL

Lines mirror:
- rowCount: `315`
- sourceLastRow: `315`
- sourceLastCol: `82`
- status: `ready`
- syncedAt: `2026-09-04 16:18:18`
- ageSeconds at observation: `1706`
- note: `TrendOS orders live sync V2 quota-aware`
- row parity: PASS
- freshness <=180s: FAIL

Both mirrors share the same sync point.

## Important change from PERF-CF-02E
The mirror is no longer frozen at `2026-09-04 00:27:55`.
It advanced to `2026-09-04 16:18:18` under the new quota-aware V2 / low-usage path.

Therefore:
- sync recovery: PARTIAL/PASS evidence exists;
- current 180-second absolute freshness gate: still FAIL;
- Production read cutover remains BLOCKED.

## New diagnosis direction
The low-usage controller intentionally performs zero Cloudflare requests / zero D1 writes while the source fingerprint is unchanged. That means `syncedAt` can naturally age during a legitimate idle period even when the source has not changed.

The next step is therefore not to force writes. The next safe step is to inspect the low-usage status/heartbeat contract and the Edge stale-data predicate to determine whether freshness should be based on a verified-source heartbeat/fingerprint rather than only the last D1 data-write timestamp.

## Safety state
- No Production cutover.
- No D1 import/migration.
- No Cloud Write authority change.
- No Apps Script mutation from this diagnostic.
- Sheets + Apps Script remain write authority.
- CORE-P0 remains paused.
