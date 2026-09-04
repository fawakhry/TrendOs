# D1 Orders Low-Usage Heartbeat Route V1 — Controlled Patch

## Purpose
Expose the already-installed low-usage controller status through one sanitized, read-only Web App action so Cloudflare Edge can verify that an old D1 write timestamp is still logically current during a legitimate source-idle period.

## Required helper file
Install this file separately in Apps Script Head only after controlled approval:

`cloudflare-d1/D1_Orders_Low_Usage_Heartbeat_V1.gs`

The helper function is:

`getD1OrdersLowUsageHeartbeatV1()`

## Exact route insertion
In the persisted Apps Script Head `doGet` legacy action chain, after exact reconciliation against the live Version-148 lineage, insert exactly one read-only route:

```javascript
else if (action === "getD1OrdersLowUsageHeartbeatV1") result = getD1OrdersLowUsageHeartbeatV1();
```

Recommended placement: adjacent to the existing read-only `ping` / `health` routes.

## Do NOT
- Do not replace the full `Code.gs` from GitHub.
- Do not add any Sheet write.
- Do not set or mutate Script Properties from this route.
- Do not call Cloudflare/D1 from the route.
- Do not expose source row values or secrets.
- Do not activate any Integrity business family.
- Do not enable Production Edge Orders read cutover as part of route installation.

## Expected response contract
The action returns only sanitized controller state needed by the Edge validator:
- enabled / interval / trigger counts;
- fingerprint-present boolean;
- last error presence metadata;
- consecutive error count;
- last successful idle-check timestamp/mode;
- sourceChanged / D1 request/write booleans;
- Orders/Lines source row+column shape;
- display hash **presence marker only**, never the actual display hash.

## Validation after any future install
1. Save/parse Apps Script Head.
2. Execute `getD1OrdersLowUsageHeartbeatV1()` directly in editor and inspect sanitized output.
3. GET the deployed Web App action and require HTTP 200 JSON.
4. Confirm no Script Property, trigger, Sheet data, deployment routing, or D1 data mutation occurred.
5. Only then enable the verifier on Cloudflare Preview, never Production first.

## Rollback
Remove the single action route line and/or helper file. No data rollback is required because the route is read-only.
