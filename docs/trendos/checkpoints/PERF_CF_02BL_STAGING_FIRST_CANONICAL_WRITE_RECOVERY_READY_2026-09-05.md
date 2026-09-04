# PERF-CF-02BL — Staging First Canonical Write Recovery Ready

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Live staging observation
- Dedicated staging spreadsheet: `1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s`
- First canonical Apps Script write executed in staging only.
- Writer returned `success=true`, `orderId=3885`, `lineId=3885-01`, `linesCreated=1`.
- Staging row counts changed exactly once: Orders `274 -> 275`, Lines `315 -> 316`.
- Original harness verification then failed at Line ID comparison because `getValue()` returned a Date object for the legacy date-formatted `رقم البند` column.
- Direct Sheets inspection proved displayed Line ID is `3885-01`; underlying numeric value is a Google Sheets date serial. Rows 3883-01 and 3884-01 exhibit the same pre-existing legacy format, so the staging write did not introduce this formatting behavior.

## Production safety proof
- Production spreadsheet remains Orders `274`, Lines `315` after the staging write.
- Production Cloud Write remains OFF.
- No Production spreadsheet mutation was executed.

## Recovery implementation
Added:
- `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_RECOVERY_V1.gs`
- `tests/apps_script_cloud_write_order_v2_staging_first_write_recovery_v1.test.mjs`

Recovery behavior:
- Requires exact existing staging baseline `275/316`.
- Verifies existing Order `3885` and displayed Line ID `3885-01`.
- Scans Script Properties internally for exactly one saved V1908 response for Order `3885`.
- Never returns the saved request key or staging token.
- Replays only that saved request key through `createManualOrder_`.
- Requires `duplicatePrevented=true` and zero Orders/Lines row growth.
- Writes only safe PASS markers to staging guard rows 18-20 after successful recovery.
- Cannot create a fresh order because the replay event contains only username, token, and recovered saved request key.

## CI
Workflow: `TrendOS Cloud Write Order Contract V2 Gate`
Run: `33923809358`
Result: PASS
- First-write harness: PASS
- First-write recovery path: PASS
- Production integration boundary: PASS

## Guard state
Staging guard updated:
- `v2GateRun=33923809358`
- `v2GateConclusion=PASS`
- `canonicalInvocationAllowed=NO - RECOVERY RUN REQUIRED`
- `latestCheckpoint=PERF-CF-02BL`

## Current boundary
Do not rerun the original first-write function.
Next allowed action is the manual staging-only recovery function:
`runTrendOSCloudWriteOrderV2StagingRecoverFirstWrite`

Production Cloud Write remains OFF.
