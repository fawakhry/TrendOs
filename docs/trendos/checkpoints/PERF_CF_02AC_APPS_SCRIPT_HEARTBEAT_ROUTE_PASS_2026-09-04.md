# PERF-CF-02AC — Apps Script heartbeat route PASS — 2026-09-04

## Runtime evidence
GET-only GitHub probe against the deployed Apps Script Web App after Version 149 returned:
- HTTP: `200`
- `HEARTBEAT_ROUTE_STATE=INSTALLED`
- `success=true`
- `lowUsage=true`
- `lightweightIdleDetection=true`
- `enabled=true`
- `intervalMinutes=5`
- `lowUsageTriggerCount=1`
- `legacyV1TriggerCount=0`
- `directV2TriggerCount=0`
- `lastErrorPresent=false`
- `consecutiveErrors=0`
- `idleMode=unchanged-light-fingerprint-no-d1-request`
- `sourceChanged=false`
- `d1RequestMade=false`
- `d1WriteMade=false`
- `sourceCount=2`

Observed idle timestamp from sanitized response:
`2026-09-04T17:48:19.518Z`

## Safety conclusion
The deployed heartbeat route is reachable and returns only the sanitized low-usage status contract required by the Edge verifier. The probe itself was GET-only and performed no Sheet writes, Script Property mutation, trigger change, D1 write, deployment change, or cutover action.

## Current production state
- Apps Script Version 149: deployed.
- low-usage trigger: healthy.
- Preview idle-heartbeat verifier: still OFF at this checkpoint.
- Production Orders read cutover: OFF.
- Cloud Write: OFF.
- Sheets + Apps Script remain authoritative for writes.

## Next gate
Enable `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED=true` on the isolated Cloudflare Preview only, deploy Preview, then require the protected Orders route to return HTTP 200 with `dataSource=d1-edge-orders` through dual-signal freshness qualification.
