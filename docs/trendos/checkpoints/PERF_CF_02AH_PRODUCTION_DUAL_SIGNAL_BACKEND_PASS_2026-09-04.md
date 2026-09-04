# PERF-CF-02AH — Production dual-signal Orders backend PASS — 2026-09-04

## Deployment
Production Worker `trendos-d1-api` was deployed through the hardened existing Production Deploy V2 workflow.

Cloudflare runtime deployment evidence:
- Worker URL: `https://trendos-d1-api.trendmall-contact.workers.dev`
- deployed Worker Version ID: `787c62b5-fb3e-42ec-afa3-8101fc42c7ce`
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED=true`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`
- no D1 migration command was run.

## Post-deploy gates
All gates PASS:
- production Worker health: HTTP 200;
- database/auth/upstream configured;
- health `cutover=false`;
- Orders mirror: `274/274`, ready, live V2 note;
- Lines mirror: `315/315`, ready, live V2 note;
- anonymous Orders route: HTTP 401;
- signed Orders route: initial propagation HTTP 503 then HTTP 200 on attempt 2;
- signed result: `dataSource=d1-edge-orders`, 5 returned rows in the test page, 38 matching active rows total;
- sensitive `__DEBT__` route: Apps Script fallback contract retained;
- Cloud Write health: enabled=false, writesAccepted=false, cutover=false, sheetsAuthoritative=true, schemaMutationFree=true.

## Rollback
Automatic rollback gate existed but was skipped because all post-deploy verification passed.

## Current cutover state
Backend is production-qualified for dual-signal Orders reads.
Frontend feature flag is still OFF at this checkpoint; live client traffic has not yet been switched to Edge-first Orders reads.
