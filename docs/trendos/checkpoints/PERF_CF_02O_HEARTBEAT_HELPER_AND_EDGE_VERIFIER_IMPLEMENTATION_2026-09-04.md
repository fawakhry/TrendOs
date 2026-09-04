# PERF-CF-02O — Heartbeat Helper + Edge Verifier Implementation — 2026-09-04

## Trigger
Follows `PERF-CF-02N`, which proved that a future live heartbeat requires a sanitized helper plus one surgical Apps Script route entry, not a blind `Code.gs` replacement.

## GitHub-only implementation
### Sanitized Apps Script helper
Created:
- `cloudflare-d1/D1_Orders_Low_Usage_Heartbeat_V1.gs`
- commit `35a26b81bae6fe68361bba685b13b6b8f1c49a09`

Function:
- `getD1OrdersLowUsageHeartbeatV1()`

Safety contract:
- delegates read-only to `getD1OrdersLowUsageStatusV1()`;
- no Sheet writes;
- no D1/Cloudflare calls;
- no Script Property mutation;
- no secrets;
- no business row values;
- raw display hashes are reduced to the literal presence marker `present`.

The helper is not reachable from the Web App by itself.

### Controlled route patch document
Created:
- `apps-script/patches/D1_ORDERS_LOW_USAGE_HEARTBEAT_ROUTE_V1.md`
- commit `656b6e6220887f69c6b54b3388638ccad96fd874`

It documents one future surgical route insertion only:

`else if (action === "getD1OrdersLowUsageHeartbeatV1") result = getD1OrdersLowUsageHeartbeatV1();`

The document explicitly forbids replacing full `Code.gs` and requires exact Version-148 Head reconciliation before any live insertion.

### Edge upstream verifier
Created:
- `cloudflare-d1/src/edge-orders-idle-verifier.mjs`
- commit `553df779476d42129d7f83df184485b625bb019a`

Behavior:
- verifier is OFF unless `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED` is explicitly truthy;
- derives the Apps Script URL only from configured `APPS_SCRIPT_API_URL`;
- adds only `action=getD1OrdersLowUsageHeartbeatV1`;
- GET-only;
- bounded timeout (default 5s, clamp 1..10s);
- rejects non-2xx or malformed payloads;
- performs no write.

### Worker entrypoint wiring
Updated:
- `cloudflare-d1/src/index_v2.js`
- commit `9db10e9c1e16eaa61faf921b1e9c001f7415f05f`

The verifier is injected into the Orders freshness guard only when `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED` is explicitly ON.

Without that flag:
- the verifier is not called;
- the previous strict D1 write-age freshness behavior remains unchanged.

## Preview / Production configuration check
Current Preview `cloudflare-d1/preview/wrangler.toml` was read before wiring.
It does **not** define `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED`.

Therefore branch/Preview deployment of this source cannot silently activate heartbeat qualification.

Cloud Write remains explicitly `false` in Preview.

## Status
**IMPLEMENTED / FEATURE DEFAULT OFF / TEST EXECUTION PENDING / PRODUCTION UNCHANGED.**

## Next step
Add static/unit regressions for the Apps Script helper, Edge verifier, and default-off entrypoint wiring; add them to Integrity CI; require full PASS before considering a controlled Apps Script Head route installation or Preview flag enablement.
