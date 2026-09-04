# PERF-CF-02BP — V2 Staging Bridge Route Wiring Blocked

Date: 2026-09-05
Status: BLOCKED — SAFE / NO PRODUCTION CHANGE

## Verified before execute
- Staging Apps Script Web App URL configured in `cloudflare-d1/staging/wrangler.toml`.
- Isolated staging Worker deployment/qualification run `33926136131` passed completely.
- Authenticated bridge live-proof run `33926425031` verified:
  - staging-only boundary PASS;
  - isolated staging Edge secret rotation PASS without disclosure;
  - bridge health HTTP 200 and configured PASS;
  - short-lived caller token minted without logging;
  - Production bridge route HTTP 404;
  - Production Cloud Write remains OFF.

## Blocking observation
Authenticated bridge execute reached Apps Script but returned Worker HTTP 502 with sanitized upstream rejection:
- `apps-script-bridge-rejected`
- upstream HTTP 200
- no D1 write
- no Production write/cutover change

A direct no-token/no-write Apps Script route probe run `33926495675` returned HTTP 200 with:
- `success=false`
- `message="خطأ في السيرفر: payload is not defined"`

Root cause: the bridge routing call was inserted in `doGet`, where no `payload` local exists, rather than in `doPost` after JSON payload parsing. The canonical writer was not reached.

## Required correction
1. Remove the accidental V2 bridge routing lines from `doGet`.
2. In `doPost`, after parsing `e.postData.contents` into `payload` and before older routers, add:

```javascript
const v2StagingBridgeResponse = trendosV2StagingBridgeTryRoute_(e, payload);
if (v2StagingBridgeResponse) return v2StagingBridgeResponse;
```

3. Update the same staging Web App deployment to a new Apps Script version.
4. Re-run the safe route probe; expected no-token result: `bridge-token-required`.
5. Only then re-run authenticated execute + replay and verify staging Sheets.

## Safety conclusion
No canonical Sheet write was performed by this failed probe, no bridge/service secret was disclosed, Production bridge routes remain absent, and Production Cloud Write remains OFF.
