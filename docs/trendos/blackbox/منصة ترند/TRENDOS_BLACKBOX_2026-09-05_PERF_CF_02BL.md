# TRENDOS BLACKBOX — PERF-CF-02BL

Date: 2026-09-05

Event: First canonical Cloud Write V2 staging write executed through the copied Apps Script runtime.

Observed:
- `createManualOrder_` returned success for Order `3885`, Line `3885-01`.
- Staging Orders: `274 -> 275`.
- Staging Lines: `315 -> 316`.
- Verification failed only because the legacy `رقم البند` cell is internally date-formatted; `getValue()` returned a Date while the displayed value is `3885-01`.
- Direct inspection confirmed older lines `3883-01` and `3884-01` share the same legacy date formatting.
- Production spreadsheet remained Orders `274`, Lines `315`.
- Production Cloud Write remained OFF.

Action taken:
- Original first-write function is now forbidden from being rerun for this staging baseline.
- Added recovery verifier that reads displayed Line ID, finds exactly one saved V1908 idempotency key for Order `3885` internally, and performs one replay-only call with zero row growth required.
- Recovery request key and staging token are never logged or returned.
- CI run `33923809358` passed including recovery and production-boundary gates.
- Staging guard updated to `NO - RECOVERY RUN REQUIRED`, checkpoint `PERF-CF-02BL`.

Next allowed action:
`runTrendOSCloudWriteOrderV2StagingRecoverFirstWrite`

No Production mutation authorized.
