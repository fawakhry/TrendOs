# PERF-CF-02CU — Dual-Signal Idle Freshness Production Pass

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Status

**TECHNICAL + PRODUCTION PASS — USER-VISIBLE IDLE-AGING VALIDATION PENDING**

This record documents the separately approved bounded Production promotion of the already-qualified PERF-CF-02CU dual-signal Orders freshness fix.

Navigation / Return remains a separate already-closed sub-checkpoint with technical + production + user-visible PASS and was not reopened.

## Production result

Current Production after promotion:

- Production main: `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`
- Main commit message: `Promote 02CU logical freshness frontend`
- Production Worker: `trendos-d1-api`
- Production Worker version: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8`
- Worker traffic: **100%**
- Worker deployment id: `f7615c0b-5a0f-4262-b79c-af84a0c6c683`
- D1 database: `trendos-main`
- qualified Orders route: `/v1/edge/orders/02cr/page`
- eligible `getRowsPageV1931` reads: D1 first
- Apps Script fallback: retained
- `__DEBT__`: Apps Script
- writes: Apps Script / Sheets
- Sheets / Apps Script authoritative: **YES**

## Worker promotion

The Worker was promoted before the frontend, from the retained Production baseline `c77bf453-c590-4cff-a55b-fd9c625b6d76`.

Exact qualified target:

`9a4e7163-53bd-4dd7-bbbb-4062d5e829b8`

### Zero-traffic candidate qualification

- Zero-traffic upload Run `34032945230`
- upload itself: PASS
- exact uploaded Worker version: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8`
- no Production traffic changed during upload
- focused 02CR / heartbeat / frontend-fallback tests: PASS

The first preview assertion expected the generic data-source label instead of the qualified 02CR label. That assertion was corrected without a second Worker upload and without Production traffic change.

Exact preview requalification:

- Run `34033006309` — **SUCCESS**
- target version: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8`
- authenticated `/02cr` read: PASS
- data source: `d1-edge-orders-02cr-operational`
- `__DEBT__` Apps Script-required fallback: PASS
- anonymous `/02cr`: fail-closed PASS

### Production Worker promotion

- Run `34033058006` — **SUCCESS**
- exact c77 baseline lock: PASS
- exact target version lock: PASS
- pre-promotion authority boundary: PASS
- target deployed at 100%: PASS
- post-promotion authenticated `/02cr`: PASS
- exact target active at 100%: PASS
- rollback: **SKIPPED / NOT REQUIRED**

Post-promotion safety evidence:

- Sheets authoritative: true
- cutover: false
- pending outbox: 0
- reconcile / 02CL qualification: false
- generic drain: false
- `__DEBT__`: Apps Script fallback

No Worker secret rotation or `EDGE_SESSION_SECRET` change occurred.

## Frontend promotion

Frontend promotion happened only after Worker qualification.

Production changed exactly two frontend files relative to the previous main `9552407c5a5136371f9afd452b913c226329d7dc`:

1. `trendos-edge-orders-read-v1.js`
2. `config.js` — only the Edge Orders wrapper cache-bust loader reference

New main:

`eab0dd342085df45ac8cd9dc02b1c21e7dc76820`

### Frontend behavior now live

The frontend keeps the existing physical-age safety gate, but stale `بنود الأوردرات` may remain D1-readable only when the Worker returns a valid bounded logical proof:

- `ok=true`
- mode exactly `verified-idle-source-unchanged`
- no failed checks
- proof timestamp bounded and recent
- advertised max age bounded
- Lines source row/column shape exactly matches mirror metadata
- display-hash presence confirmed

The exception applies only to `بنود الأوردرات`.

`العملاء` and `عملاء منع التسليم بالمديونية` must remain physically fresh because the Orders heartbeat does not prove those sources.

Any invalid/missing/old proof, source change, shape mismatch, stale enrichment mirror, auth failure, Edge error, or malformed response retains Apps Script fallback.

### Frontend production evidence

Bounded deployment Run:

- `34034029239` — **SUCCESS**
- production baseline main `9552407...` locked before push
- Worker `9a4e7163...` @100% locked before push
- dual-signal frontend regression: PASS
- Navigation `resume-no-autorefresh` regression: PASS
- residual return-traffic quiet regression: PASS
- exact assembled Production scope: `config.js` + `trendos-edge-orders-read-v1.js` only
- pushed new main `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`
- public GitHub Pages assets: PASS
- authenticated Production `/02cr`: PASS
- `__DEBT__` fallback: PASS
- rollback: **SKIPPED / NOT REQUIRED**

GitHub Pages:

- Run `34034051695` — **SUCCESS**
- deployed head: `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`

The Production read-only qualification occurred while Lines were physically fresh, so the live request correctly used the normal physical-fresh path at that instant.

The stale-Lines logical path itself had already been exercised against the isolated live Preview before Production promotion:

- dedicated Preview qualification Run `34031601605` — **SUCCESS**
- Lines physical age: 419–420 seconds
- logical mode: `verified-idle-source-unchanged`
- proof age: 124–127 seconds
- heartbeat max age: 720 seconds
- source shape matched exactly
- repeat stale read: PASS

The promoted Worker/frontend code is the same qualified 02CU implementation whose stale path was covered by that live Preview proof and by the focused regression suite.

## Low-Usage behavior preserved

The purpose of 02CU is not to manufacture a D1 write every few minutes.

The healthy Low-Usage design remains:

- trigger enabled
- one Low-Usage trigger
- legacy V1 trigger count 0
- direct V2 trigger count 0
- unchanged authoritative source may result in zero D1 request and zero D1 write
- a recent sanitized Apps Script heartbeat proves source shape instead of faking `syncedAt`
- successful Worker heartbeat checks are cached in-isolate for only 30 seconds and concurrent requests are coalesced
- failed heartbeat calls are not cached

## Safety boundary retained

- Apps Script New Version / Deploy: **NO**
- D1 business-data write by this promotion: **NO**
- authority transfer: **NO**
- Sheets / Apps Script authoritative: **YES**
- eligible Orders reads D1 first: **YES**
- Apps Script fallback: **YES**
- `__DEBT__`: **Apps Script**
- 02CL / reconcile qualification: **OFF**
- generic drain: **OFF**
- secret rotation: **NO**
- `EDGE_SESSION_SECRET` change: **NO**
- Customer Feedback auto scan: **OFF**
- Go-Live Autopilot auto sweep: **OFF**
- Trend Master bounded protections: **RETAINED**
- Navigation return guards: **RETAINED**

## Workflow cleanup

Temporary promotion workflows created specifically for this deployment were removed from the working branch after successful qualification:

- `trendos-02cu-worker-zero-traffic-upload-temp.yml`
- `trendos-02cu-worker-preview-requalify-temp.yml`
- `trendos-02cu-worker-promote-temp.yml`
- `trendos-02cu-frontend-production-temp.yml`

Durable CI and read-only diagnostic workflows were retained.

## What remains before closing 02CU

Technical and Production promotion are complete.

The only remaining close condition is **user-visible validation of the idle-aging behavior**. The expected behavior is:

- after the new frontend asset is loaded, normal Orders pages continue using the qualified D1 path;
- when `بنود الأوردرات` becomes physically older than five minutes solely because the authoritative source stayed unchanged, a valid Low-Usage heartbeat proof prevents the false-stale Apps Script fallback;
- real source change, invalid proof, stale enrichment, or any qualification failure still falls back safely to Apps Script.

Do not mark 02CU CLOSED until the user confirms the live behavior.

## Exact stop point

`PERF-CF-02CU IN PROGRESS — NAVIGATION-RETURN-NO-REFRESH CLOSED TECHNICAL + PRODUCTION + USER-VISIBLE PASS — ORDERS DUAL-SIGNAL IDLE FRESHNESS WORKER + FRONTEND PRODUCTION TECHNICAL PASS — PRODUCTION MAIN eab0dd342085df45ac8cd9dc02b1c21e7dc76820 — WORKER 9a4e7163-53bd-4dd7-bbbb-4062d5e829b8 @100% — WORKER PROMOTION RUN 34033058006 SUCCESS — FRONTEND PROMOTION RUN 34034029239 SUCCESS — PAGES 34034051695 SUCCESS — APPS SCRIPT FALLBACK + __DEBT__ + SHEETS AUTHORITY + 02CL OFF + GENERIC DRAIN OFF + NO SECRET ROTATION RETAINED — NEXT/ONLY 02CU CLOSE CONDITION: USER-VISIBLE IDLE-AGING VALIDATION`
