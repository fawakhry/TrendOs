# PERF-CF-02AB — Apps Script Version 149 deployed — 2026-09-04

## Evidence from live Apps Script editor
- Deployment update completed successfully.
- Web App deployment remains the same deployment target.
- New deployed version: **149**.
- Deployment timestamp shown by Apps Script: **Sep 4, 2026, 8:49 PM** local UI time.

## Change scope
Only the previously reviewed heartbeat qualification change was intended for this deployment:
1. separate read-only helper file `D1_Orders_Low_Usage_Heartbeat_V1`;
2. one legacy `doGet` action route:
   `else if (action === "getD1OrdersLowUsageHeartbeatV1") result = getD1OrdersLowUsageHeartbeatV1();`

No Cloudflare feature flag was enabled by this deployment.
No Orders read cutover was performed.
Cloud Write remains OFF.
Google Sheets + Apps Script remain authoritative for writes.

## Next gate
Run the existing GET-only GitHub heartbeat route probe against the deployed Web App. Proceed only if it returns `HEARTBEAT_ROUTE_STATE=INSTALLED` with a sanitized low-usage status payload.
