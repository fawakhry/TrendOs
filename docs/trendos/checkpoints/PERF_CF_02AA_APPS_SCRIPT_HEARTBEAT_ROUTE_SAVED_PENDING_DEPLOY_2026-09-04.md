# PERF-CF-02AA — Apps Script Heartbeat Route Saved, Deploy Pending — 2026-09-04

## User-confirmed editor state
The live Apps Script project was manually updated and saved with:
- separate helper file `D1_Orders_Low_Usage_Heartbeat_V1` containing the sanitized read-only heartbeat helper;
- one surgical `doGet` route insertion:
  `else if (action === "getD1OrdersLowUsageHeartbeatV1") result = getD1OrdersLowUsageHeartbeatV1();`

## Important limitation
This checkpoint records the user's confirmation that the editor changes were saved. It does **not** claim the Web App deployment has been updated yet.

## Production state
- current deployed Web App version remains the previous verified deployment until a new Apps Script deployment version is created;
- heartbeat route runtime availability: PENDING DEPLOY;
- Preview heartbeat verifier: OFF;
- Production Orders read cutover: OFF;
- Cloud Write: OFF;
- Sheets + Apps Script remain authoritative for writes.

## Next step
Perform controlled Apps Script deployment:
`Deploy -> Manage deployments -> Edit -> New version -> Deploy`
Then rerun the existing GET-only heartbeat route probe before enabling any Cloudflare heartbeat flag.

## Safety
No Cloudflare flag should be enabled before the route probe verifies the sanitized heartbeat payload from the newly deployed Web App version.
