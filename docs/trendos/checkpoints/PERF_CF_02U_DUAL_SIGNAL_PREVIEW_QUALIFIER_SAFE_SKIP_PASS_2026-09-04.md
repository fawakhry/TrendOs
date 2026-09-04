# PERF-CF-02U — Dual-Signal Preview Qualifier SAFE-SKIP PASS — 2026-09-04

## Trigger
After `PERF-CF-02T`, add an independent isolated-Preview qualification lane for the dual-signal Orders read path without weakening/removing the existing legacy freshness blocker.

## New workflow
`.github/workflows/trendos-cloudflare-orders-dual-signal-preview.yml`

Name:
`TrendOS Orders Dual-Signal Preview Qualification`

Commit:
`a9b452bbbb2c50083834f73f2b740a8b812241ec`

## Safety behavior
The workflow first requires Preview Cloud Write to remain OFF.

If `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"` is NOT explicitly present in Preview config:
- the runtime dual-signal probe is skipped;
- no Apps Script heartbeat request is made;
- no Production traffic changes occur;
- the job succeeds with a SAFE-SKIP state.

If the flag is explicitly enabled later, the workflow:
1. requires the Preview session secret;
2. creates a short-lived synthetic Orders Edge token without logging it;
3. retries the protected Preview route `/v1/edge/orders/page`;
4. requires HTTP 200;
5. requires `success=true`;
6. requires `dataSource=d1-edge-orders`;
7. requires the expected synthetic Edge session subject;
8. rejects fallback during a PASS.

## First execution
Run: `33900388815`
Job: `qualify-orders-dual-signal-preview` / `101112816331`

Result: **SUCCESS**

Step evidence:
- Checkout: PASS
- Resolve heartbeat qualification mode: PASS
- Preview secret verification: SKIPPED (heartbeat OFF)
- protected Orders runtime probe: SKIPPED (heartbeat OFF)
- qualification summary: PASS

## Interpretation
**SAFE-SKIP PASS** proves the new qualifier is inert while heartbeat is OFF. It does not claim D1 Orders runtime cutover readiness yet.

## Production impact
**NONE.**
- live Apps Script heartbeat route still not installed;
- Preview heartbeat remains OFF;
- Production Orders read cutover remains OFF;
- Cloud Write remains OFF;
- Sheets + Apps Script remain authoritative for writes.

## Exact next boundary
Install and verify the sanitized read-only Apps Script heartbeat helper + exact guarded route in the live Version-148 Apps Script Head. The current connector surface does not expose Apps Script source editing, so no blind or indirect mutation is permitted.

After live route verification:
1. add `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED = "true"` to isolated Preview only;
2. Auto Preview redeploys;
3. dual-signal qualifier must return HTTP 200 + `dataSource=d1-edge-orders`;
4. only then qualify Production Orders Read Cutover.
