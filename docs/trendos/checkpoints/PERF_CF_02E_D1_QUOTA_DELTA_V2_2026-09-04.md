# PERF-CF-02E — D1 Free-Tier Quota Root Cause + Quota-Aware Delta V2

**Date:** 2026-09-04  
**Lane:** Performance / Cloudflare / D1  
**Status:** **ROOT CAUSE VERIFIED / V2 ISOLATED CI PASS / PRODUCTION NOT ACTIVATED**

## Runtime root cause — VERIFIED

Production Apps Script runtime was inspected from the Apps Script console.

Observed trigger inventory:

- exactly one time-driven `d1OrdersLiveSyncTick` trigger;
- handler runs every minute from `Head`;
- execution history reports `Completed` with normal-looking durations.

Opening the execution log exposed the real internal failure:

`D1 ORDERS ATOMIC LIVE SYNC ERROR: D1_ERROR: Your account has exceeded D1's free tier daily row write limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.`

Therefore the earlier mirror freeze was **not** caused by a missing/stopped Apps Script trigger. The V1 handler catches the D1 error and returns, so Apps Script can label the execution `Completed` while the D1 mirror did not advance.

The production Apps Script executions screen also showed serving Web App executions as **Version 148**, which is newer than the historical Version-146 checkpoint. This runtime observation supersedes Version 146 for current-version claims; a separate deployment-state reconciliation remains required before any production source mutation.

## Why V1 exhausted D1 row writes

`cloudflare-d1/D1_Orders_Live_Sync.gs` performs a full atomic snapshot every minute:

- stages every Orders row;
- stages every Order Lines row;
- promotes both snapshots atomically.

The Worker V1 promote path deletes the previous live rows and inserts the full staged snapshot again. With the currently observed source size (~274 Orders rows and ~315 Lines rows including headers), this creates a large recurring row-write load even when only one row changes or nothing changes.

The prepared normalized V1 sender had the same quota-risk pattern: it upserted all customers/orders/messages/conversations every minute.

## V2 design — Orders + Lines

Prepared file:

`cloudflare-d1/D1_Orders_Live_Sync_V2.gs`

New authenticated Worker route:

`POST /v1/mirror/delta`

Worker implementation:

`cloudflare-d1/src/mirror-delta-gate.mjs`

### Modes

1. **Full atomic rebase**
   - first V2 activation;
   - periodic 24-hour reconciliation;
   - keeps existing staging + atomic promote safety.

2. **Heartbeat**
   - when the source fingerprint is unchanged;
   - no business row rewrite;
   - updates only freshness metadata for Orders + Lines.

3. **Row-level delta**
   - when source content changed;
   - UPSERT only changed/appended row numbers;
   - delete only tail rows when a sheet shrinks;
   - update both sheet catalogs;
   - one D1 batch is the transaction boundary for Orders + Lines.

### Delta fail-closed preflight

Before mutation the Worker verifies:

- live catalog exists and status is `ready`;
- live row count equals catalog count and sender baseline count;
- live row numbers remain contiguous;
- expected live-sync note matches;
- source growth includes every appended row in the delta payload.

A stale/mismatched baseline returns 409 before a write batch.

### Quota backoff

V2 detects the confirmed D1 free-tier daily row-write-limit error and records a local pause until immediately after the next UTC daily reset. During that interval later minute ticks skip locally with reason `d1-quota-backoff` instead of repeatedly calling the already-exhausted D1 write path.

## V2 design — normalized entities

Prepared file:

`cloudflare-d1/D1_Normalized_Live_Sync_V2.gs`

Entities:

- customers;
- orders;
- messages;
- conversations.

Modes:

- first/daily `full-upsert`;
- changed-source `delta-upsert` for changed/new entity records only;
- unchanged-source `heartbeat` using a final import request with empty entity arrays and authoritative source counts, so business rows are not rewritten and only freshness records advance.

All four normalized entity freshness markers advance together on the successful final request. Non-final chunks cannot advance freshness.

### Known normalized V2 boundary

Normalized V2 intentionally preserves V1 semantics and currently has **no delete/prune operation**. A source deletion can therefore leave an older normalized D1 row present. This does not block the Orders/Lines mirror optimization, but normalized read cutover must remain blocked until deletion semantics are explicitly designed/tested or the relevant read contract proves pruning is unnecessary.

## Isolated test evidence

Workflow:

`.github/workflows/trendos-d1-quota-v2.yml`

Final passing run after correcting a test-only expected-count assertion:

- run: `33877702416`
- job: `101038528007`
- head: `21c09ea1f70e8cc2ff7a3fbd09dc11d1abec9338`
- conclusion: **SUCCESS**

Passing gates:

- Worker delta-gate syntax = PASS;
- Worker router syntax = PASS;
- Orders/Lines row-level delta = PASS;
- unauthorized delta mutation blocked = PASS;
- stale baseline fail-closed = PASS;
- missing appended-row fail-closed = PASS;
- injected D1 batch failure rollback across both mirror sheets = PASS;
- Orders/Lines quota backoff contract = PASS;
- normalized empty-final freshness heartbeat = PASS;
- normalized changed-row-only upsert = PASS;
- all-entity normalized freshness finalization = PASS;
- normalized quota backoff contract = PASS;
- existing Orders atomic V1 regression = PASS;
- existing normalized import V1 regression = PASS;
- existing Cloudflare Preview safety regression = PASS.

## Production impact

None from this checkpoint.

- production Apps Script source unchanged by this branch work;
- existing production `d1OrdersLiveSyncTick` V1 trigger has not been removed by GitHub work;
- no V2 Apps Script trigger installed;
- no production Worker V2 route deployed yet;
- no production read cutover;
- Cloud Write remains OFF;
- Sheets + Apps Script remain authoritative writes;
- CORE-P0 is separate and untouched by this lane.

## Activation order after Worker qualification and D1 quota availability

1. Capture current production Apps Script deployment/version and trigger inventory again (latest observed Web App version = 148).
2. Deploy the Worker code containing `/v1/mirror/delta` under an explicit production Worker gate and verify rollback.
3. Add `D1_Orders_Live_Sync_V2.gs` as a separate Apps Script file; never replace `Code.gs`.
4. Run a first V2 full-sync qualification after D1 quota resets or the account plan permits writes.
5. Replace the V1 minute trigger with exactly one `d1OrdersLiveSyncTickV2` trigger only after the first V2 run succeeds.
6. Verify an unchanged minute uses `heartbeat` and does not rewrite ~589 source rows.
7. Verify a real small source change produces `delta` with a small changed-row count.
8. Observe four sustained freshness windows (`<=180s`) before any Orders/Lines read cutover.
9. Add/qualify `D1_Normalized_Live_Sync_V2.gs` separately; keep normalized Edge reads blocked until deletion/prune semantics are resolved.
10. Read cutover remains a separate decision; Cloud Write remains OFF.

## Rollback

Orders/Lines V2:

`stopD1OrdersLiveSyncV2()`

Normalized V2:

`stopD1NormalizedLiveSyncV2()`

Rollback stops mirror synchronization only. It does not alter source Google Sheets data and does not grant D1 authoritative write ownership.

## Exact stopping point

**PERF-CF-02E — D1 free-tier row-write quota is the verified freeze cause; quota-aware Orders/Lines row-level Delta V2 and normalized Delta-Upsert V2 are isolated-CI qualified; Production remains unchanged; next gate is Preview integration, then explicit Production Worker + Apps Script V2 activation only when D1 write quota is available.**
