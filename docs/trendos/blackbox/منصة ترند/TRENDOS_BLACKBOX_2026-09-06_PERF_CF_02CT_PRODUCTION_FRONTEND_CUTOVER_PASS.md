# PERF-CF-02CT — Production Frontend D1 Orders Read Cutover PASS

Date: 2026-09-06

## Final status

**TECHNICAL VERIFIED PASS — PRODUCTION FRONTEND D1 ORDERS READ ON — QUALIFIED `/v1/edge/orders/02cr/page` ROUTE — APPS SCRIPT FALLBACK RETAINED — SHEETS / APPS SCRIPT AUTHORITY RETAINED**

## User authorization

The user explicitly started the frontend cutover by replying:

`ابدا`

to the stated next step: enable employee Orders reads from D1 with automatic Apps Script fallback.

This authorization covered frontend Orders read routing only. It did not authorize authority transfer, D1 writes, migrations, 02CL, generic drain, Apps Script deployment, or secret rotation.

## Critical defect found before enabling

The previously existing frontend wrapper still targeted:

`/v1/edge/orders/page`

That legacy route was the route associated with the earlier incomplete-card regression because it could pass through limited screen-view canary mirrors.

The fully qualified operational route from 02CR/02CS is:

`/v1/edge/orders/02cr/page`

Therefore the frontend flag was **not** enabled until the wrapper was corrected to the qualified route and regression-tested.

## 02CT candidate / qualification

Frontend wrapper file:

`trendos-edge-orders-read-v1.js`

02CT behavior:

- eligible `getRowsPageV1931` reads use D1 first;
- qualified page path is `/v1/edge/orders/02cr/page`;
- employee session is exchanged through `/v1/edge/orders/session`;
- `username` / employee token are not placed in the page query string;
- `__DEBT__` stays on Apps Script;
- write actions stay on Apps Script;
- unsupported actions stay on Apps Script;
- Edge HTTP errors, invalid JSON, auth/session errors, or other Edge failures fall back to the original Apps Script function.

Regression test:

`tests/frontend_edge_orders_cutover_02ct.test.mjs`

Candidate qualification:

- commit `d072a86e3ac57a72096b46096efc8c4a52af9da8`
- 02CT qualification Run `34010739030`
- Job `101425991751`
- result **SUCCESS**
- same-head Integrity Run `34010738989`
- Job `101425991698`
- result **SUCCESS**

Live qualification before production change:

- print active identity parity: `21`
- laser active identity parity: `18`
- 38-field contract: PASS
- exact `Order ID + Line ID + status` set parity vs Apps Script: PASS
- production authority boundary: PASS

## Production cutover

Pre-cutover production `main`:

`f82c76fc9421e5f8021b94bbd64244a5fde24061`

Production cutover commit:

`943da84e3b3d1591d2ce207ab3411bfe437989b1`

Message:

`Enable qualified D1 Orders frontend read with Apps Script fallback`

Exactly four production frontend files changed:

1. `config.js`
2. `trendos-edge-orders-read-v1.js`
3. `index.html`
4. `reset-cache.html`

Production config now has:

- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`
- production Worker URL configured
- wrapper loader cache tag `20260906c`

Published asset cache tag was changed to:

`trendos-d1-cutover-20260906a`

No Trend Master resilience candidate was copied into `main` during this cutover.

## Bounded production workflow evidence

Production cutover workflow:

- Run `34010864525`
- Job `101426332138`
- result **SUCCESS**

The workflow verified the exact pre-cutover main commit, checked the authority boundary, applied only the four frontend files, pushed the cutover, waited for published assets, executed the published wrapper against production auth/D1, and retained an automatic rollback step.

Rollback was **not required** because all post-cutover checks passed.

## GitHub Pages deployment

Pages deployment for production commit `943da84e...`:

- Run `34010872232`
- build: SUCCESS
- deploy: SUCCESS

Published asset propagation passed on attempt `5`.

Marker:

`PERF_CF_02CT_PAGES_PROPAGATION_PASS_ATTEMPT=5`

## Live published frontend canary

The workflow downloaded the actual published wrapper from GitHub Pages and ran it with production employee authentication.

Verified:

- published wrapper page path = `/v1/edge/orders/02cr/page`;
- normal `getRowsPageV1931` print read returned production D1 version `D1_ORDERS_READ_02CR_OPERATIONAL_CANARY`;
- pageSize `5` returned five live rows;
- normal D1 read did not invoke Apps Script fallback;
- `__DEBT__` invoked Apps Script fallback;
- a write action invoked Apps Script fallback.

Marker:

`PERF_CF_02CT_LIVE_FRONTEND_WRAPPER_PASS rows=5`

## Final production boundary

Verified after the frontend cutover:

- production employee eligible Orders reads: **D1 first**
- D1 route: `/v1/edge/orders/02cr/page`
- Apps Script fallback on Edge failure: **YES**
- `__DEBT__`: **Apps Script**
- writes: **Apps Script / Sheets**
- Sheets / Apps Script authoritative: **YES**
- Worker internal authority cutover: `false`
- `pendingOutbox=0`
- 02CL / reconcile: **OFF**
- generic drain: **OFF**
- Worker redeploy during 02CT: **NO**
- Worker version remains `c77bf453-c590-4cff-a55b-fd9c625b6d76`
- D1 migration: **NO**
- Apps Script deployment: **NO**
- `EDGE_SESSION_SECRET` rotation: **NO**
- authority transfer: **NO**

Important distinction: frontend **read routing** is ON, while data authority remains Sheets / Apps Script.

## Working-branch post-cutover synchronization

After production passed, the working branch was synchronized only for the D1 frontend-read state:

- D1 read flag changed to ON;
- D1 wrapper loader tag changed to `20260906c`;
- Trend Master resilience candidate lines were preserved and not deployed to production.

Working config sync commit:

`94699da3a7279eeea22df40c3cd383ea33c4f870`

Durable post-cutover regression CI commit:

`1da926e9c9e9be843da1e125790f2c0535d77f71`

Final durable CI:

- Run `34011062287`
- Job `101426859723`
- result **SUCCESS**

Final same-head Integrity:

- Run `34011062262`
- Job `101426859662`
- result **SUCCESS**

The durable CI now guards:

- working branch D1 read flag ON;
- `main` D1 read flag ON;
- published Pages D1 read flag ON;
- qualified `/02cr/page` route retained;
- frontend fallback regression;
- print Fly-first / operational ordering regression;
- production authority boundary;
- authenticated D1 vs Apps Script identity + 38-field parity.

## Non-mutating cleanup note

A temporary attempt to atomically push the working config + workflow from GitHub Actions was rejected by GitHub because the workflow token lacked workflow-file write permission. No remote branch mutation occurred from that failed attempt. The same synchronization was then applied through the GitHub contents API and validated successfully.

## Exact stop point

`PERF-CF-02CT CLOSED — PRODUCTION FRONTEND D1 ORDERS READ ON THROUGH QUALIFIED /02CR ROUTE — APPS SCRIPT FALLBACK RETAINED — SHEETS/APPS SCRIPT AUTHORITY RETAINED — TECHNICAL PASS`

A user browser smoke check after refresh remains useful operational confirmation, but no further code or infrastructure action is required for the 02CT technical cutover itself.
