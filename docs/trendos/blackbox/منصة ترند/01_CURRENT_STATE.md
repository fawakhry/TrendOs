# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Latest checkpoint

`PERF-CF-02CR — Orders D1 Field Completeness Regression / Operational Parity Repair / Enrichment Deployment`

Status: **USER APPROVED — PREDEPLOY BOUNDARY PASS — INTEGRITY PASS — APPS SCRIPT DEPLOYMENT NOT EXECUTED — SYNC NOT EXECUTED — MANUAL IDE EXECUTION REQUIRED**

Latest record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_APPROVED_PREDEPLOY_PASS_MANUAL_APPS_SCRIPT_EXECUTION_REQUIRED.md`

Regression/root-cause record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md`

## Current factual production state

Production `main` previously had Edge-first Orders activation that exposed incomplete cards because the page-read wrapper used limited screen-view mirrors rather than the full operational row contract.

Safe rollback on `main` remains:

- `f7c3af17b3a28858d1be9d5c57455d54b4256126`
- `Rollback Orders Edge-first read after incomplete field regression`

Current production order-card read source remains **Apps Script / Sheets**.

Current `main/config.js` at the latest predeploy boundary still has:

- no active D1 Orders read flag,
- no production Edge Orders loader.

## Corrected 02CR architecture

The production `/v1/edge/orders/page` path had been intercepted by the limited 02CO screen-view canary wrapper.

The correct rich operational source is:

- `بنود الأوردرات`

with enrichment from:

- `العملاء`
- `عملاء منع التسليم بالمديونية`

Duplicate exact headers in `بنود الأوردرات` are now handled with Apps-Script-compatible last-write-wins semantics in:

- `cloudflare-d1/src/edge-orders-read-v1.mjs`
- correction commit `c6b362b4d4223e7f890af44d2067a5440224e42a`

## Existing Orders Live Sync V2 — preserved

Existing production Apps Script sync remains unchanged:

- `cloudflare-d1/D1_Orders_Live_Sync_V2.gs`
- note: `TrendOS orders live sync V2 quota-aware`
- sole ownership:
  - `الأوردرات`
  - `بنود الأوردرات`

02CR must not alter its trigger, properties, note, or ownership.

## Qualified 02CR enrichment sync candidate

File:

- `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`

Exact targets only:

- `العملاء`
- `عملاء منع التسليم بالمديونية`

Exact note:

- `PERF-CF-02CR enrichment live sync V1`

Behavior:

- independent 02CR property/trigger namespace,
- first run / repair uses atomic two-sheet full rebase,
- unchanged source uses authenticated heartbeat,
- changed source uses row-level delta,
- periodic full repair,
- trigger installs only after successful first sync,
- quota errors pause only this support lane,
- no Google Sheet writes,
- no Worker production deploy,
- no frontend cutover,
- no secret rotation.

## Qualified isolated canary

Candidate route:

- `/v1/edge/orders/02cr/page`

It is deployed only to the isolated Preview lane and no production frontend uses it.

It requires:

- `بنود الأوردرات` exact Orders V2 note,
- `العملاء` + restriction mirror exact 02CR enrichment note.

It covers operational enrichment, search, special/exact status filters, priority filters, heat-press filters, Apps Script ordering, pagination, `statusCounts`, and `statusOrderCounts`.

`__DEBT__` remains Apps Script fallback.

## Pre-approval qualification evidence

02CR Field Completeness CI:

- Run `34003887916`
- Job `101407500641`
- **SUCCESS**

Integrity:

- Run `34003887933`
- Job `101407500688`
- **SUCCESS**

Preview pre-sync fail-closed:

- Run `34003873139`
- Job `101407459524`
- **SUCCESS**
- HTTP `503`
- `code=02cr-operational-mirror-not-qualified`
- `fallback=apps-script`
- failed mirrors exactly:
  - `العملاء`
  - `عملاء منع التسليم بالمديونية`

## Explicit user approval received

User explicitly authorized:

`موافق على نشر وتشغيل Apps Script الخاص بـ02CR فقط وكمل`

This approval covers only the 02CR enrichment module and its start function.

It does not authorize Worker production deploy, frontend re-enable, authority transfer, 02CL, generic drain, or secret rotation.

## Post-approval predeploy boundary

Temporary read-only boundary workflow final run:

- Run `34004332089`
- Job `101408685296`
- **SUCCESS**
- marker: `PERF_CF_02CR_APPS_SCRIPT_PREDEPLOY_BOUNDARY_PASS_NO_MUTATION`

Verified live facts:

- Edge: `success=true`, `database=true`, `cutover=false`
- 02CL: `enabled=false`
- generic drain: `false`
- `sheetsAuthoritative=true`
- Cloud Write: `enabled=true`, `writesAccepted=true`, `database=true`, `cutover=false`
- `pendingOutbox=0`
- unauthenticated production Orders edge route: `401`
- production frontend remains Apps Script lane

Pre-sync support mirrors still are:

- `العملاء`: `232 × 47`, rowCount `232`, note `TrendOS full mirror V1`, synced `2026-08-29 15:43:37`
- `عملاء منع التسليم بالمديونية`: `1 × 10`, rowCount `1`, note `TrendOS full mirror V1`, synced `2026-08-29 15:22:43`

Same-head Integrity:

- Run `34004332081`
- Job `101408685329`
- **SUCCESS**
- composed Apps Script syntax/collision PASS
- pre-deploy package safety gate PASS

Temporary boundary workflow cleanup:

- `259280613d21a6d957a9306ccaf8ae13d8fdb1d4`

## Apps Script deployment capability boundary

Repository and connector discovery found no safe automated live Apps Script source-write/function-execution path in the current tool surface.

The repository production manifest documents Apps Script production deployment through the Google Apps Script IDE, and the closed 02CQ record also documents manual IDE deployment/execution.

No configured `clasp push`, Apps Script project deployment secret, Google OAuth workflow, workload identity path, or Apps Script deployment connector was found.

The connected Google Drive surface can access the authoritative spreadsheet but cannot update Apps Script source or execute Apps Script project functions.

Therefore:

- **Apps Script deployment has NOT been executed.**
- **02CR enrichment sync has NOT been executed.**
- support mirrors remain on the pre-sync snapshots above.

This is an execution-tool boundary, not a candidate qualification failure.

## Exact next step

Inside the same live Apps Script project backing TrendOS production:

1. Add a new `.gs` file using exactly:
   - `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`
2. Save.
3. Run read-only:
   - `getD1OperationalEnrichmentLiveSync02CRStatus()`
4. Confirm:
   - `config.hasD1ApiUrl=true`
   - `config.hasD1MigrationSecret=true`
   - `enabled=false`
   - expected `triggerCount=0`
5. Run:
   - `startD1OperationalEnrichmentLiveSync02CR()`
6. Approve Google permissions if the IDE requests them.

Do not manually edit Script Properties, do not paste any secret into chat, and do not touch Orders Live Sync V2.

## After manual execution

Immediately verify externally before any other production action:

1. customers + restriction mirrors have exact 02CR note and row parity,
2. Orders/Lines V2 ownership remains unchanged,
3. isolated Preview 02CR route returns qualified 200,
4. full field/paging/filter contract passes without PII logging,
5. a later heartbeat/delta cycle stays healthy,
6. final boundary keeps frontend OFF, Sheets authoritative, 02CL OFF, generic drain OFF, unauth Orders 401, `pendingOutbox=0`.

Production Worker deploy and frontend D1 re-enable remain separate later gates.

## Current production boundary summary

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Cloud Write: **ON**
- `pendingOutbox`: **0** at latest boundary
- Sheets / Apps Script authority: **YES**
- production order-card read source: **Apps Script / Sheets**
- frontend D1 Orders read: **OFF**
- Orders Live Sync V2: **ACTIVE / UNCHANGED**
- 02CR enrichment sync: **APPROVED / NOT DEPLOYED / NOT STARTED**
- 02CR Preview route: **QUALIFIED / PRE-SYNC FAIL-CLOSED**
- 02CL: **OFF**
- generic drain: **OFF**
- frontend cutover: **NO**
- authority transfer: **NO**
- production Worker deploy in 02CR: **NONE**
- `EDGE_SESSION_SECRET` rotation in 02CR: **NONE**

## Previously closed/prepared checkpoints

- `PERF-CF-02CQ` — **VERIFIED PASS — CLOSED for freshness + identity parity**
- `PERF-CF-02CO` — auth pass; stale mirror blocker resolved by 02CQ
- `PERF-CF-02CN` — **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF**
- `PERF-CF-02CM` — **READ-ONLY PREFLIGHT PASS — CLOSED**
- `PERF-CF-02CL` — **VERIFIED PASS — CLOSED**
- `PERF-CF-02CK` — **VERIFIED PASS — CLOSED**
