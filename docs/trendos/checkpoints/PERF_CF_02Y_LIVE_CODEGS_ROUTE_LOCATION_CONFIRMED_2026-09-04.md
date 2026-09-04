# PERF-CF-02Y — Live Code.gs Route Location Confirmed — 2026-09-04

## Evidence from live Apps Script editor
The current live `Code.gs` action chain was visually inspected in the Apps Script editor.

Observed read-only/action area includes:
- `ping` -> `healthCheck_()`
- `trendosV1903Ping` -> `trendosV1903Ping_()`
- `health` -> `healthCheck_()`
- `trendosV1900Ping` / related legacy route
- then login/session/business actions

A separate older V1900 router helper and an `Action غير معروف.` fallback were also observed elsewhere, but they are not the selected insertion point.

## Selected insertion point
Use the live primary action chain in `Code.gs`, immediately after:

`else if (action === "health") result = healthCheck_();`

and before the following legacy `trendosV1900Ping` branch.

Insert exactly one read-only route line:

`else if (action === "getD1OrdersLowUsageHeartbeatV1") result = getD1OrdersLowUsageHeartbeatV1();`

## Safety
- Do not replace `Code.gs`.
- Do not edit the V1900 helper router shown around the separate `trendosV1900MainRouteObject_` block.
- Do not edit the unrelated `Action غير معروف.` fallback block.
- Do not deploy yet until the single-line route is saved and rechecked.
- The helper file `D1_Orders_Low_Usage_Heartbeat_V1` has already been added separately and saved in the live Apps Script project.

## Current state
- Heartbeat helper file: added/saved in Apps Script editor.
- Live route line: NOT YET INSERTED at time of this checkpoint.
- Cloudflare Preview heartbeat flag: OFF.
- Production Orders read cutover: OFF.
- Cloud Write: OFF.
