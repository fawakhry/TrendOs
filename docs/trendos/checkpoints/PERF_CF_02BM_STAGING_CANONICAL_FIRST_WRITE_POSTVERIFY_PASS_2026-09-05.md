# PERF-CF-02BM — Staging Canonical First Write Post-Verify PASS

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`
Status: **VERIFIED — STAGING ONLY**

## Scope
Post-write live verification of the first real Apps Script canonical create path executed against the dedicated Staging workbook only.

Dedicated Staging Spreadsheet ID:
`1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s`

Production Spreadsheet ID:
`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

## Runtime result
The recovery harness reported:
- `success=true`
- `verified=true`
- `orderId=3885`
- `lineId=3885-01`
- before: Orders=275, Lines=316
- after replay: Orders=275, Lines=316
- `replayAttempted=true`
- `replayVerified=true`
- `duplicatePreventedOnReplay=true`
- request key present but not returned
- token present but not returned
- `productionWriteExecuted=false`
- `productionCloudWriteChanged=false`

## Live Google Sheets verification
Staging workbook:
- Orders row 275 contains exactly one Order `3885`.
- Order is synthetic/external, department `ليزر`, item summary `CW V2 STAGING FIRST WRITE`, created by `cw_stage_service`.
- Lines row 316 contains exactly one Line for Order `3885`, displayed Line ID `3885-01`, item `CW V2 STAGING FIRST WRITE`.
- Activity log contains exactly one creation event for Order `3885` / Line `3885-01`.
- Automation queue contains exactly one `رسالة حالة للعميل` row for Order `3885` / Line `3885-01`, status `جاهزة`; no direct external send was performed by the canonical create path.

Production workbook:
- Search for `3885` in `الأوردرات`: 0 matches.
- Search for `3885` in `بنود الأوردرات`: 0 matches.
- Production baseline remains Orders=274, Lines=315.

## Legacy Line ID finding
The `رقم البند` column is historically formatted as `DATE` (`yyyy-mm`). Existing legacy rows such as `3883-01`, `3884-01`, and the new `3885-01` are internally stored as numeric date serials but rendered as the expected Line ID text. This is a pre-existing workbook behavior, not introduced by Cloud Write V2. The recovery verifier therefore uses the display value for Line ID verification.

## Guard state
Staging guard now states:
- `canonicalInvocationAllowed = STAGING FIRST WRITE VERIFIED - CLOUDFLARE BRIDGE NOT ENABLED`
- `latestCheckpoint = PERF-CF-02BM`
- `firstCanonicalWriteStatus = PASS_RECOVERED`
- `firstCanonicalOrderId = 3885`
- `firstCanonicalLineId = 3885-01`

## Safety boundary
- Production Cloud Write remains OFF.
- No Production Apps Script route was changed.
- No Production Sheet row was created or mutated.
- No D1 Production write was executed.

## Next gate
Build and qualify a **Staging-only Cloudflare V2 → Staging Apps Script canonical bridge** with a separate bridge secret, fixed synthetic contract, idempotency, fail-closed target identity checks, and no Production route/import.