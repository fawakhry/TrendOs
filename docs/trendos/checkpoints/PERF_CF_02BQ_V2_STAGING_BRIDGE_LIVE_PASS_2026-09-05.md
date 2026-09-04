# PERF-CF-02BQ — V2 Staging Bridge Live PASS

Date: 2026-09-05
Status: VERIFIED PASS — STAGING ONLY / PRODUCTION UNCHANGED

## Safe route probe after Apps Script route fix
GitHub Actions run: `33926495675`
Job: `101197515625`

Result:
- HTTP 200
- `success=false`
- `code=bridge-token-required`
- `stagingOnly=true`
- `productionWriteExecuted=false`

Conclusion: the V2 staging bridge route is correctly installed in `doPost` and fails closed without a bridge token.

## Authenticated end-to-end bridge proof
GitHub Actions run: `33926425031`
Job: `101197602659`

Verified steps:
- staging-only boundary PASS
- dedicated staging D1 config PASS
- staging Edge secret rotated without disclosure
- bridge health PASS
- short-lived caller token minted without logging
- authenticated canonical Apps Script staging writer execute PASS
- replay/idempotency PASS
- Production bridge route remains HTTP 404
- Production Cloud Write remains OFF

### First canonical staging execution
- `clientRequestId=CWV2-STAGE-BRIDGE-001`
- `orderId=3886`
- `lineId=3886-01`
- `linesCreated=1`
- `duplicatePrevented=false`
- `idempotentReplay=false`
- `d1Written=false`
- `productionWriteExecuted=false`
- `productionCloudWriteChanged=false`
- `productionCutover=false`

### Replay
Returned the same business IDs:
- `orderId=3886`
- `lineId=3886-01`
- `duplicatePrevented=true`
- `idempotentReplay=true`

## Production safety proof
Production bridge route: HTTP 404.
Production Cloud Write health:
- `enabled=false`
- `writesAccepted=false`
- `cutover=false`
- `sheetsAuthoritative=true`

## Conclusion
Cloudflare Staging -> Apps Script Staging canonical order writer is now verified end-to-end with deterministic replay and no token disclosure. Production remains unchanged and Production Cloud Write remains OFF.

## Next execution boundary
Continue staging-only qualification from this checkpoint. Do not enable Production Cloud Write or perform a production cutover without an explicit approved boundary.