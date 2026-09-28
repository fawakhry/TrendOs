# TrendOS T12 Cloud-native operational runtime — Entry 442

Date: 2026-09-28 Cairo

Owner requested continuing rapidly to restore platform operation.

## Backend runtime
Working branch changes:
- Migration `0006_t12_operational_runtime.sql`
- `cloudflare-d1/src/t12-operational-runtime-handler.mjs`
- `cloudflare-d1/src/t12-read-overlay.mjs` now layers runtime state over immutable create rows.
- `cloudflare-d1/src/index_v2.js` routes the runtime endpoints.

A30:
- Branch: `diagnostic/t12-operational-runtime-a30-20260928`
- Run: `36408536753`
- Job: `108882943023`
- Conclusion: SUCCESS
- `RUNTIME_SCHEMA=PASS`
- `ORDER_4322_PRESTATE=PASS`
- `RUNTIME_HEALTH=PASS`
- `CREATE_SAFETY=PASS`
- Worker Version ID: `4e2d427c-789c-4fdd-86c7-c2f3987ca80a`
- CREATE safety remained `enabled=false`, `nextOrderNumber=4323`, `canaryRemaining=0`.

Runtime routes:
- GET `/v1/t12/orders/line-runtime/health`
- POST `/v1/t12/orders/line-runtime/update`
- POST `/v1/t12/orders/line-runtime/notify`

They apply only to Cloud-native lines and use the existing authenticated Edge session. Legacy Sheets rows remain on Apps Script writes.

## Frontend routing
A31:
- Branch: `diagnostic/t12-runtime-main-a31-20260928`
- Run: `36408740253`
- Job: `108883592464`
- Qualification: SUCCESS
- `T12 runtime frontend routing PASS`
- `RUNTIME_FRONTEND_QUALIFICATION=PASS`

Main changes:
- `trendos-edge-orders-read-v1.js` commit `30265964a4d1fdeb0722e4170f7749cf0510c1b3`
- `config.js` commit / main head `a25889dc3ae444de931f9f9b64fc13e32c784808`
- Frontend version: `EDGE_ORDERS_T12_RUNTIME_20260928`
- Cache loader: `trendos-edge-orders-read-v1.js?v=20260928-t12-runtime1`
- GitHub Pages run `36408821266`: SUCCESS

Cloud-native `updateLine` and `markCustomerNotified` now route to Cloudflare runtime. Legacy rows continue to use Apps Script.

Current safety:
```
ORDER_4322_CREATED=YES
ORDER_4322_VISIBLE_IN_PRINT_UI=YES
T12_OPERATIONAL_RUNTIME=LIVE
CANARY_ENABLED=false
CANARY_REMAINING=0
NEXT_ORDER_NUMBER=4323
GENERAL_CREATE_CUTOVER=NO
```
