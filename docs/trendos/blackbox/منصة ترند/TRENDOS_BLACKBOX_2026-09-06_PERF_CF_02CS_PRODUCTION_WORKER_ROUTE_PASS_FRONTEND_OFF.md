# PERF-CF-02CS — Production Worker Route PASS / Frontend OFF

Date: 2026-09-06

## Final status

**VERIFIED PASS — QUALIFIED D1 READ ROUTE DEPLOYED TO PRODUCTION WORKER — FRONTEND D1 ORDERS READ REMAINS OFF — SHEETS / APPS SCRIPT REMAIN AUTHORITATIVE**

## User authorization boundary

The user explicitly approved:

`موافق على نشر مسار D1 المؤهل على Worker الإنتاج فقط، بدون تفعيل الواجهة، وكمل`

This authorization covered the Worker route deployment only. It did not authorize frontend cutover, authority transfer, D1 writes/migrations, 02CL, generic drain, or secret rotation.

## Qualified Worker version

Exact version promoted from zero-traffic Preview to production:

`c77bf453-c590-4cff-a55b-fd9c625b6d76`

Preview V5 qualification:

- Workflow Run: `34010061764`
- Job: `101424192540`
- Result: **SUCCESS**
- Production traffic during Preview: **0%**
- Print active rows at qualification: `21`
- Laser active rows at qualification: `18`
- 38-field card contract: PASS
- `Order ID + Line ID + status` identity set parity vs Apps Script: PASS
- `__DEBT__`: `409 apps-script-required`, Apps Script fallback retained

Same-head Integrity:

- Run: `34010061747`
- Job: `101424192577`
- Result: **SUCCESS**

## Defects resolved before production promotion

### Semantic Line ID

Some Google Sheets Line IDs were numeric effective values with a date display format. Example class of defect:

- authoritative effective value: numeric Line ID
- formatted display: date-like text
- D1 raw serialization: ISO date

`semanticLineId()` now converts the date-coerced raw value back to the underlying Google Sheets serial integer for the Line ID field only. This restored authoritative Line ID parity.

### Operational ordering contract

User-confirmed production business rule:

#### Print

1. `طباعة على الطاير`
2. `عاجل / VIP`
3. `عادي`
4. `مؤجل`

#### Laser

1. `عاجل / VIP`
2. `عادي`
3. `مؤجل`

The Fly Print flag affects ordering only on the print screen. It does not become a laser or service-screen priority.

Implementation is isolated in the 02CR operational canary layer through `sortOperationalRows(rows, screen)`.

Regression test:

`tests/cloudflare_edge_orders_operational_ordering_02cs.test.mjs`

## Production deployment

Bounded exact-version deployment workflow:

- Run: `34010288672`
- Job: `101424793692`
- Result: **SUCCESS**

Pre-deploy active Worker version captured for rollback:

`0ec782a9-5943-4c9d-8820-51b7d0393210`

Deployment command promoted the already-qualified version at 100%; it did not rebuild the Worker.

Production version after deployment:

`c77bf453-c590-4cff-a55b-fd9c625b6d76` — **100% Worker traffic**

No rollback was required.

## Production authenticated canary

Employee session succeeded on attempt `1` after deployment.

Live production canary result:

### Print

- active rows: `21`
- unordered identity set parity vs Apps Script using `Order ID + Line ID + status`: PASS
- user operational ordering contract: PASS
- 38-field card contract: PASS
- required mirrors ready / row-count parity: PASS

### Laser

- active rows: `18`
- unordered identity set parity vs Apps Script using `Order ID + Line ID + status`: PASS
- user operational ordering contract: PASS
- 38-field card contract: PASS
- required mirrors ready / row-count parity: PASS

### Debt

`__DEBT__` still returns `409 apps-script-required` with Apps Script fallback.

Marker:

`PERF_CF_02CS_PROD_V2_CANARY_PASS`

## Final production boundary

Verified after deployment:

- Worker: `trendos-d1-api`
- D1 database binding available: YES
- `cutover=false`
- `sheetsAuthoritative=true`
- `pendingOutbox=0`
- 02CL / reconcile: OFF
- generic drain: OFF
- unauthenticated Orders route: `401`
- frontend D1 Orders read on working branch: OFF
- frontend D1 Orders read on `main`: no enabled flag / OFF by default
- `EDGE_SESSION_SECRET` rotation: NO
- D1 migration: NO
- D1 business-data write: NO
- Apps Script deployment: NO

Final marker:

`PERF_CF_02CS_PRODUCTION_WORKER_ROUTE_PASS_FRONTEND_OFF`

## Temporary workflow cleanup

After the successful production canary and blackbox closure, all `.github/workflows/trendos-02cs-*` temporary diagnostic, patch, Preview and deployment workflows were removed from the working branch.

A fresh workflow-directory read confirmed there are **zero** remaining paths matching `trendos-02cs`.

Durable CI / older checkpoint workflows and the separate Trend Master workflows were intentionally left untouched. This cleanup did not deploy or alter the production Worker.

## Important distinction

The D1 Orders read route is now physically present and qualified on the production Worker, but production employees are **not yet routed to it by the frontend**.

Production user-facing order-card reads remain on Apps Script / Sheets until a separately authorized frontend cutover checkpoint.

## Exact stop point

`PERF-CF-02CS CLOSED — PRODUCTION WORKER D1 READ ROUTE VERIFIED PASS — TEMP WORKFLOWS CLEANED — FRONTEND D1 READ OFF — NEXT STEP REQUIRES SEPARATE CUTOVER AUTHORIZATION`
