# PERF-CF-02F — D1 Zero-Idle Policy — 2026-09-04

## Decision
TrendOS must not perform recurring D1 writes while the source data is idle.

The user explicitly requested removal of every-minute repetitions and unnecessary Cloudflare/D1 plan consumption.

## Verified root cause
Production Apps Script trigger `d1OrdersLiveSyncTick` was executing every minute, while D1 returned a quota error indicating the daily row-write limit had been exceeded before the Workers Paid upgrade became active.

The legacy V1 design recopied the Orders + Order Lines mirror repeatedly, which was wasteful even when the source had not materially changed.

## Qualified branch implementation
Branch: `agent/d1-quota-v2-2026-09-04`

Prepared and isolated-tested:
- `cloudflare-d1/D1_Orders_Live_Sync_V2.gs`
  - row-level delta support
  - quota backoff
  - full atomic fallback
- `cloudflare-d1/D1_Normalized_Live_Sync_V2.gs`
  - normalized delta-upsert support
  - quota backoff
- `cloudflare-d1/src/mirror-delta-gate.mjs`
  - atomic row-level mirror delta gate
- `cloudflare-d1/D1_Zero_Idle_Control.gs`
  - removes known recurring D1 sync/migration triggers
  - disables known D1 recurring-sync enable flags
  - creates no trigger
  - performs no Cloudflare/D1 request during activation or status checks
  - keeps explicit one-shot V2 sync functions available

## Zero-idle recurring handlers covered
- `d1OrdersLiveSyncTick`
- `d1OrdersLiveSyncTickV2`
- `d1NormalizedLiveSyncTick`
- `d1NormalizedLiveSyncTickV2`
- `d1FullMigrationTick`

## Zero-idle flags forced OFF
- `D1_ORDERS_LIVE_SYNC_ENABLED_V1`
- `D1_ORDERS_LIVE_SYNC_V2_ENABLED`
- `D1_NORMALIZED_SYNC_ENABLED_V1`
- `D1_NORMALIZED_SYNC_V2_ENABLED`

## CI evidence
Workflow: `TrendOS D1 Quota V2 Isolated`

Latest qualified run before this checkpoint:
- Run ID: `33878541173`
- Result: SUCCESS

PASS coverage:
- Orders/Lines row-level delta
- normalized delta-upsert
- D1 Zero-Idle control contract
- V1 atomic regression
- normalized V1 regression
- Preview safety regression

Zero-Idle contract test proves:
- no `ScriptApp.newTrigger`
- no `everyMinutes(...)`
- no `everyHours(...)`
- no D1/Cloudflare network call during zero-idle activation/status
- one-shot wrappers restore recurring enable flags to OFF

## Production state
Production Apps Script has NOT been changed by this branch work.

The currently observed production recurring trigger must be removed/disabled in the Apps Script project to stop live recurring D1 consumption immediately:
- `d1OrdersLiveSyncTick`

This is safe for the main TrendOS platform because Google Sheets + Apps Script remain authoritative and the D1 read cutover is still blocked/not active.

## Production activation policy from now on
1. No 1-minute D1 sync trigger is allowed.
2. No automatic full snapshot loop is allowed.
3. D1 business-row writes should occur only for actual source changes.
4. While event-driven write hooks are not yet fully wired, use Zero-Idle mode plus explicit one-shot syncs for qualification.
5. Any later periodic reconciliation must be separately justified, low-frequency, and must not rewrite unchanged business rows.
6. Read cutover remains a separate gate and must not be enabled until the new freshness model is qualified without wasteful heartbeats.

## Exact stopping point
- Zero-Idle control: PREPARED + ISOLATED CI PASS.
- Production recurring trigger: still requires removal in Apps Script UI/source project.
- Production D1 read cutover: OFF.
- Production D1 cloud writes: unchanged.
- Google Sheets remains source of truth.
