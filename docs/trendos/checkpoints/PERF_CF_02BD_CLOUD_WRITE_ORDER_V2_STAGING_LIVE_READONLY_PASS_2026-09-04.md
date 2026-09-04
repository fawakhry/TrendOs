# PERF-CF-02BD — Cloud Write Order Contract V2 Staging LIVE READ-ONLY PASS — 2026-09-04

## Result
PASS. The pure V2 canonical create-intent contract is now live on the dedicated Staging Worker through a fixed synthetic GET/read-only route only. Production does not expose the route and Production Cloud Write remains OFF.

## Staging route
`GET /v1/staging/cloud-write/v2/intent-plan`

Worker:
`trendos-d1-staging`

The route is wired only by `cloudflare-d1/staging/index.js`. Production continues to use `cloudflare-d1/src/index_v2.js` and does not import the V2 staging route.

## Deployment qualification
Existing isolated staging workflow:
- run `33916884799`
- `transactional-write-gate`: PASS
- `provision-and-qualify-staging`: PASS

The existing full Staging qualification also reconfirmed Cloud Write V1 staging idempotency, D1 direct rows, staging reconciliation, and Production isolation after the V2 route was deployed.

## V2 live probe
Workflow:
`.github/workflows/trendos-cloud-write-order-contract-v2-staging-live-probe.yml`

Run/job:
- run `33916999118`
- job `101166350147`
- conclusion `success`

## Live evidence
Before V2 plan reads, Staging reconciliation counters:
- pending=0
- verified=5
- sheetsWritten=false

Two consecutive V2 intent-plan GETs returned HTTP 200 and byte-identical deterministic JSON.

Returned safety state:
- success=true
- stagingOnly=true
- syntheticOnly=true
- readOnly=true
- d1Written=false
- sheetsWritten=false
- mutationCount=0
- productionCutover=false
- productionRouteIntegrated=false
- intentType=`createManualOrder`
- businessOrderIdStrategy=`apps-script-allocated`

Returned canonical plan:
- clientRequestId=`CWV2-STAGE-PLAN-001`
- customerMode=`خارجي / عابر`
- externalCustomerId=`987`
- department=`طباعة`
- heatPress=`نعم`
- itemName=`V2 Intent Qualification Item`
- qty=1
- status=`طلب جديد`
- flyPrint=`لا`

This proves `مكبس` normalization to Printing + heat press in the live Staging V2 plan.

A POST to the same V2 staging route returned HTTP 404 and explicit no-mutation state.

After all V2 requests, Staging reconciliation counters were unchanged:
- pending=0 -> 0
- verified=5 -> 5
- sheetsWritten=false

## Production isolation
The same V2 path on Production returned HTTP 404.

Production Cloud Write health remained:
- enabled=false
- writesAccepted=false
- cutover=false
- sheetsAuthoritative=true

## Safety conclusion
No V2 request wrote D1 or Sheets. No Apps Script call occurred. No production route was added. No production Cloud Write flag was enabled.

## Next exact gate
Prepare and CI-qualify an Apps Script V2 canonical adapter in dry-run mode only. It may accept only the fixed Staging V2 plan shape, must not call `createManualOrder_` in dry-run mode, must not allocate an Order ID, and must perform no Sheet/Property/network mutation. Its output should be the exact event/parameter envelope that a future separately-approved canonical create canary would pass to `createManualOrder_`.
