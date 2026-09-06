# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Latest checkpoint

`PERF-CF-02CR — Orders D1 Field Completeness Regression / Production Read Rollback + Operational Parity Repair`

Status: **MITIGATION PASS — PRODUCTION FRONTEND ON APPS SCRIPT — 02CR CANDIDATE QUALIFIED — PREVIEW FAIL-CLOSED PASS — ENRICHMENT APPS SCRIPT DEPLOYMENT APPROVAL GATE**

Latest record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## Current factual production state

The production `main` branch had an older Edge-first Orders activation that caused incomplete cards because the page-read wrapper used limited screen-view mirrors rather than the full operational row contract.

Activation commit:

- `cf6a3a7e817fdb6c01fed3b6ad63c9cce8489d9a`

Safe rollback on `main`:

- `f7c3af17b3a28858d1be9d5c57455d54b4256126`
- `Rollback Orders Edge-first read after incomplete field regression`

Current production order-card read source is **Apps Script / Sheets**.

The frontend D1 read flag/loader is not active on current `main`.

## Corrected 02CR architecture

Production Worker path inspection established that `/v1/edge/orders/page` was intercepted by the 02CO screen-view canary wrapper.

That wrapper used:

- `واجهة خدمة العملاء`
- `واجهة الطباعة`
- `واجهة الليزر`
- `واجهة المكبس`

These view mirrors are suitable for limited canary identity checks but are not the full `getRowsPageV1931` operational contract.

The richer operational source is `بنود الأوردرات`, plus Apps Script enrichment from:

- `العملاء`
- `عملاء منع التسليم بالمديونية`

## Duplicate-header mapper correction

`بنود الأوردرات` has duplicate exact column names. Apps Script header mapping is last-write-wins; D1 originally used first-match semantics.

Correction:

- `cloudflare-d1/src/edge-orders-read-v1.mjs`
- commit `c6b362b4d4223e7f890af44d2067a5440224e42a`
- D1 now uses the last exact duplicate while preserving alias priority.

Regression test:

- `tests/cloudflare_edge_orders_duplicate_headers_02cr.test.mjs`

## Existing Orders Live Sync V2 — preserved

Existing production Apps Script sync:

- `cloudflare-d1/D1_Orders_Live_Sync_V2.gs`
- note `TrendOS orders live sync V2 quota-aware`
- owns only:
  - `الأوردرات`
  - `بنود الأوردرات`

It remains untouched.

It uses an every-minute quota-aware model with heartbeat on unchanged source, row-level delta on changed source, and periodic atomic full rebase.

02CR does not change its properties, trigger, note, or ownership.

## D1 operational catalog before enrichment sync

Metadata-only probe:

- Run `34003478109`
- Job `101406383520`
- SUCCESS

Current evidence from that probe:

- `الأوردرات`: `311 × 67`, rowCount `311`, `TrendOS orders live sync V2 quota-aware`, synced `2026-09-05 23:23:21`
- `بنود الأوردرات`: `355 × 82`, rowCount `355`, `TrendOS orders live sync V2 quota-aware`, synced `2026-09-05 23:23:21`
- `العملاء`: `232 × 47`, rowCount `232`, stale `TrendOS full mirror V1`, synced `2026-08-29 15:43:37`
- `عملاء منع التسليم بالمديونية`: `1 × 10`, rowCount `1`, old `TrendOS full mirror V1`, synced `2026-08-29 15:22:43`

Therefore Orders/Lines are already owned by current V2, but enrichment support mirrors are not live-qualified.

## Qualified independent enrichment sync candidate

File:

- `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`

Exact target allow-list only:

- `العملاء`
- `عملاء منع التسليم بالمديونية`

Note:

- `PERF-CF-02CR enrichment live sync V1`

Candidate properties:

- default OFF,
- independent 02CR trigger/property namespace,
- does not touch Orders Live Sync V2,
- first run/repair uses atomic two-sheet full rebase,
- unchanged support data uses authenticated D1 heartbeat,
- changed support data uses row-level delta,
- periodic 24-hour full repair,
- trigger installs only after successful first sync,
- quota errors pause only the 02CR support lane,
- no Google Sheet writes,
- no frontend cutover,
- no Worker production deploy,
- no secret rotation.

Safety test:

- `tests/apps_script_d1_operational_enrichment_live_sync_02cr.test.mjs`

## Qualified D1 operational canary candidate

Files:

- `cloudflare-d1/src/edge-orders-operational-enrichment-02cr.mjs`
- `cloudflare-d1/src/edge-orders-read-02cr-canary.mjs`
- route wired in `cloudflare-d1/src/index_v2.js`

Isolated route:

- `/v1/edge/orders/02cr/page`

No production frontend points to this route.

Ownership gate:

- `بنود الأوردرات` requires exact Orders V2 note,
- `العملاء` + restriction mirror require exact 02CR enrichment note.

The route reproduces Apps Script operational behavior for:

- duplicate-header semantics,
- customer phone fallback,
- customer-sheet authoritative debt,
- debt hold/restriction/reason/debt notes,
- text search,
- status filters and special status buckets,
- priority filters,
- heat-press filters,
- priority + Order ID ordering,
- pagination,
- `statusCounts`,
- `statusOrderCounts`.

`__DEBT__` remains Apps Script-only and returns the existing fallback contract.

## CI / Integrity evidence

02CR Field Completeness CI:

- Run `34003887916`
- Job `101407500641`
- Conclusion **SUCCESS**

Integrity:

- Run `34003887933`
- Job `101407500688`
- Conclusion **SUCCESS**
- composed Apps Script syntax/collision PASS
- pre-deploy package safety gate PASS

## Isolated Preview evidence before support sync

Preview Worker uses the same D1 read mirror but Cloud Write is OFF and normalized/mirror imports are unavailable without migration secret.

Pre-sync authenticated synthetic-token probe:

- Run `34003873139`
- Job `101407459524`
- Conclusion **SUCCESS**

Result:

- HTTP `503`
- `code=02cr-operational-mirror-not-qualified`
- `fallback=apps-script`
- failed qualification mirrors exactly:
  - `العملاء`
  - `عملاء منع التسليم بالمديونية`

The lines mirror passed the ownership gate and therefore was absent from the failed-mirror list.

This proves 02CR is fail-closed before enrichment support is synchronized.

Temporary Preview probe was removed:

- cleanup commit `4caec04f629c1ffa5daaad4b67a776070ad1ad43`

## Current production boundary

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Cloud Write: **ON**
- Sheets / Apps Script authority: **YES**
- production order-card read source: **Apps Script / Sheets**
- frontend D1 Orders read: **OFF / rolled back on main**
- existing Orders Live Sync V2: **UNCHANGED**
- 02CR enrichment live sync: **QUALIFIED CANDIDATE / NOT DEPLOYED**
- isolated 02CR Preview route: **DEPLOYED TO PREVIEW / FAIL-CLOSED BEFORE SUPPORT SYNC**
- 02CL reconciliation: **OFF**
- generic drain: **OFF / unused**
- frontend cutover: **NO**
- authority transfer: **NO**
- Production Worker deploy during 02CR: **NONE**
- `EDGE_SESSION_SECRET` rotation during 02CR: **NONE**

## Exact next step / approval gate

A NEW explicit Apps Script approval is required before deploying the 02CR support sync. The earlier approval was explicitly for 02CQ only and must not be reused.

After approval, deploy only:

- `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`

Then:

1. pre-action read-only production boundary,
2. add/save module in live Apps Script project while default OFF,
3. run `getD1OperationalEnrichmentLiveSync02CRStatus()` and confirm OFF,
4. run `startD1OperationalEnrichmentLiveSync02CR()`,
5. first atomic support sync must succeed before trigger exists,
6. verify `العملاء` + restriction mirrors fresh with exact 02CR note,
7. rerun isolated Preview canary and compare Apps Script vs D1 full field/paging/filter contract without logging PII,
8. observe a subsequent heartbeat/delta freshness cycle,
9. final boundary + blackbox update,
10. keep production frontend on Apps Script.

Production Worker deployment and frontend D1 re-enable are later separate decisions only after full parity PASS.

## Previously closed/prepared checkpoints

- `PERF-CF-02CQ` — **VERIFIED PASS — CLOSED for freshness + identity parity**
- `PERF-CF-02CO` — auth pass; stale mirror blocker resolved by 02CQ
- `PERF-CF-02CN` — **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF**
- `PERF-CF-02CM` — **READ-ONLY PREFLIGHT PASS — CLOSED**
- `PERF-CF-02CL` — **VERIFIED PASS — CLOSED**
- `PERF-CF-02CK` — **VERIFIED PASS — CLOSED**
