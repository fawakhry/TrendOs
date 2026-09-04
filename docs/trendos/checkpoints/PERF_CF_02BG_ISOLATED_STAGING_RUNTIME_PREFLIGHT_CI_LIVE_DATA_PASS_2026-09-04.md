# PERF-CF-02BG — Isolated Staging Runtime Preflight CI + Live Data PASS

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`
Qualified commit: `61482e7f8e749e95466bf5a14f614a4e758f1095`
Workflow run: `33920150050`
Job: `101176381072`
Result: **PASS**

## Purpose

Qualify a read-only first-write safety preflight for the dedicated V2 canonical staging spreadsheet created in PERF-CF-02BF.

## Apps Script preflight candidate

`apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_RUNTIME_PREFLIGHT_V1.gs`

The preflight refuses canonical execution unless the active spreadsheet ID is exactly:
`1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s`

It explicitly refuses production:
`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

It validates the guard sheet:
`__TRENDOS_V2_CANONICAL_STAGING_GUARD`

It validates the first-write baselines:
- Orders last row = 274
- Order Lines last row = 315

A successful preflight still returns:
- `authBridgeQualified=false`
- `externalSideEffectsQualified=false`
- `canonicalInvocationAllowed=false`

## CI evidence

Workflow `TrendOS Cloud Write Order Contract V2 Gate`, run `33920150050`, job `101176381072`:
- pure V2 create-intent contract: PASS
- staging read-only plan contract: PASS
- Apps Script V2 canonical adapter dry-run: PASS
- isolated Apps Script staging runtime preflight: PASS
  - marker `APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_STAGING_RUNTIME_PREFLIGHT_PASS`
- production integration boundary: PASS
  - marker `V2_PRODUCTION_INTEGRATION_BOUNDARY_PASS`
- final marker `CLOUD_WRITE_ORDER_CONTRACT_V2_GATE_PASS`

## Live Google Sheets evidence

Read directly from staging spreadsheet:
- guard A1:B8 exactly matches the PERF-CF-02BF isolation contract;
- Orders `A270:A276` returns five populated rows ending with Order ID `3884`, confirming rows 275+ are empty and the data last row remains 274;
- Order Lines `A310:A318` returns six populated rows ending with Order ID `3884`, confirming rows 316+ are empty and the data last row remains 315.

## Safety conclusion

- No canonical write was invoked.
- No production spreadsheet mutation.
- No Apps Script production deployment.
- No Production Cloud Write enablement.
- Production Cloud Write remains OFF.

## Next gates

1. staging-only authentication bridge / synthetic staging principal;
2. canonical external side-effect isolation;
3. only after both PASS: first canonical V2 write rehearsal on the isolated staging spreadsheet.
