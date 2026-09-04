# PERF-CF-02Z — Apps Script doGet Heartbeat Route Patch Prepared — 2026-09-04

## User-provided live doGet source
The live Apps Script `doGet(e)` body was supplied from the editor and reviewed.

## Exact patch
One and only one route line is inserted immediately after the existing health route:

```javascript
else if (action === "health") result = healthCheck_();
else if (action === "getD1OrdersLowUsageHeartbeatV1") result = getD1OrdersLowUsageHeartbeatV1();
else if (action === "trendosV1900Ping" || action === "previewReadyPickupDelivery" || action === "deliverReadyPickupBulk") result = trendosV1900MainRouteObject_(e, null);
```

## Verification
A local diff against the user-provided `doGet` shows exactly one added line and no other content changes.

## Safety state
- helper file already saved in Apps Script editor;
- route patch prepared but user has not yet pasted/deployed this modified `doGet`;
- Cloudflare heartbeat Preview flag remains OFF;
- Production Orders read cutover remains OFF;
- Cloud Write remains OFF.

## Next step
User pastes the modified `doGet` over the current `doGet`, saves only, then provides confirmation/screenshot. No Deploy until post-paste review.
