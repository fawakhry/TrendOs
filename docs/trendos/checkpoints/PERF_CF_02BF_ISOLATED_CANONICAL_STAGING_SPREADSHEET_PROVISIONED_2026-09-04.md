# PERF-CF-02BF — Isolated Canonical Staging Spreadsheet Provisioned

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`
State: **PROVISIONED / VERIFIED DATA ISOLATION / NO CANONICAL WRITE YET**

## Purpose

Create a genuinely separate Google Sheets target before the first real Cloud Write V2 canonical write rehearsal. The production spreadsheet must never be used for a synthetic first-write test.

## Production source

- Title: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Orders grid baseline: 274 rows
- Order Lines grid baseline: 315 rows

## Isolated staging copy

- Title: `STAGING_TrendOS_Operations_CLOUD_WRITE_V2_CANONICAL_2026-09-04`
- Spreadsheet ID: `1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s`
- Created by Drive copy from the production workbook.
- Orders grid baseline: 274 rows
- Order Lines grid baseline: 315 rows
- The staging spreadsheet ID is distinct from production.

## Staging guard

Added sheet:
`__TRENDOS_V2_CANONICAL_STAGING_GUARD`

Guard values explicitly record:
- staging spreadsheet ID;
- source production spreadsheet ID;
- `productionCloudWrite = OFF`;
- `allowedSyntheticOrderPrefix = CW-STAGE-`;
- `canonicalWriteTarget = THIS STAGING COPY ONLY`;
- `productionSpreadsheetMutationAllowed = NO`;
- checkpoint = `PERF-CF-02BF`.

## Apps Script runtime boundary

A container-bound Apps Script project for the copied workbook was not discoverable as a manageable Drive script file through the available connector. Therefore no assumption is made that the bound runtime was copied or is safe to execute.

No `createManualOrder_` call was made.
No production spreadsheet mutation was made by this phase.
Production Cloud Write remains OFF.

## Next gate

Build a staging runtime preflight that refuses canonical execution unless:
1. the active/target spreadsheet ID exactly equals the staging ID above;
2. the staging guard exists and matches the expected IDs and `CW-STAGE-` prefix;
3. no production spreadsheet target is accepted;
4. external/network side effects are either absent or explicitly suppressed;
5. canonical invocation remains disabled until the preflight passes.
