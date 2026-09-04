# PERF-CF-02V — Live Heartbeat Route Probe: NOT INSTALLED — 2026-09-04

## Trigger
Before requesting any manual live-source edit, probe the configured Production Apps Script Web App with a GET-only GitHub Actions diagnostic to determine whether the sanitized heartbeat action may already be reachable.

## Diagnostic workflow
`.github/workflows/trendos-apps-script-heartbeat-route-probe.yml`

Commit:
`88059f3ba359ecc0ee1a4bf126565987cadcbcc7`

Run:
`33900510467`

Job:
`probe-heartbeat-route` / `101113213138`

Conclusion: **SUCCESS (diagnostic completed)**

## Runtime evidence
GET-only request to the configured Apps Script Web App:

`action=getD1OrdersLowUsageHeartbeatV1`

Result:
- HTTP: `200`
- route state: `NOT_VERIFIED`
- response class: `Action غير معروف.`

## Interpretation
The live Web App is reachable, but the heartbeat action is **not installed/routed in the deployed Apps Script lineage**.

This confirms the exact live-source boundary; it is not a network problem and not a Cloudflare problem.

## Safety
The diagnostic used GET only and performed:
- no Sheet writes;
- no Script Property mutation;
- no trigger changes;
- no D1 write/import;
- no deployment mutation;
- no traffic cutover.

## Production state
- heartbeat route: NOT INSTALLED;
- Preview heartbeat verifier: OFF;
- Production Orders Read Cutover: OFF;
- Cloud Write: OFF;
- Sheets + Apps Script remain authoritative for writes.

## Exact next boundary
Find an authorized automated Apps Script source-deployment path if one already exists in the repository/connected environment. If none exists, the only remaining required manual source operation is:
1. add `D1_Orders_Low_Usage_Heartbeat_V1.gs` as a separate Apps Script file;
2. reconcile live Version-148 `doGet` and insert exactly:
   `else if (action === "getD1OrdersLowUsageHeartbeatV1") result = getD1OrdersLowUsageHeartbeatV1();`
3. save/deploy while changing nothing else.

After that, rerun the GET-only probe before enabling any Cloudflare heartbeat flag.
