# TrendOS Blackbox — PERF-CF-02CR Frontend Stale Cache Recovery

Date: 2026-09-06
Checkpoint: `PERF-CF-02CR — Orders Completeness / Frontend Runtime Recovery`
Status: **D1 ENRICHMENT SYNC PASS — PRODUCTION FRONTEND STILL APPS SCRIPT — STALE FRONTEND ASSET PROVEN — CACHE-BUST DEPLOYED — USER VISUAL RECHECK PENDING — FULL PARITY NOT YET CLOSED**

## User-visible trigger

After manually starting the approved 02CR enrichment sync, the user reported that the production print screen still showed an incomplete order list.

The screenshot showed pagination text equivalent to:

- page 1 of 2
- 3 orders per page

This was treated as a live production completeness incident, and D1 frontend activation remained OFF.

## Authoritative source evidence

Read-only Google Sheets inspection established that the current `بنود الأوردرات` source contains substantially more active print work than the UI screenshot showed.

Safe identity/status-only inspection found multiple current print rows with status `طلب جديد`, including Order IDs above the earlier 02CQ eight-row screen-view snapshot.

The source therefore was not limited to the four orders visible in the screenshot.

No customer names, phone numbers, notes, or message contents were logged into GitHub.

## Key runtime proof — stale frontend JavaScript

Current `main/app.js` defines:

- `state.serverPaging.pageSize = 5`
- `state.pageSize = 5`
- pager label: `كل صفحة 5 أوردرات`

The user's live screenshot instead displayed `كل صفحة 3 أوردرات`.

Therefore the browser was not executing the current `main/app.js` runtime.

This is direct evidence of stale frontend assets, independent of D1 mirror correctness.

## Why rollback alone was insufficient

The production D1 read rollback commit:

- `f7c3af17b3a28858d1be9d5c57455d54b4256126`

correctly removed Edge-first Orders read from `config.js`.

However `index.html` still referenced frontend assets using the old fixed cache tag:

- `trendos-v1931-trend-master-20260812a`

for at least:

- `config.js`
- `app.js`
- stylesheet/theme assets

That allowed a browser/cache layer to continue serving an older `config.js` and `app.js` even after their file contents changed on `main`.

In particular, an older cached `config.js` could retain the previously enabled D1 Orders read path while the repository source had already rolled it back.

## Bounded production recovery

A bounded workflow changed cache tags only in:

- `index.html`
- `reset-cache.html`

No application logic, Apps Script, D1 rows, Worker code, Worker secrets, or authority settings were changed.

Production commit:

- `f82c76fc9421e5f8021b94bbd64244a5fde24061`
- message: `Bust TrendOS frontend cache after D1 read rollback`

New cache tag:

- `trendos-runtime-recovery-20260906a`

The commit changed the asset URLs for `config.js`, `app.js`, theme/CSS references, the inline `CACHE_TAG`, and the reset-cache redirect.

GitHub Pages deployment:

- Run `34005021133`
- Conclusion: **SUCCESS**
- Head SHA: `f82c76fc9421e5f8021b94bbd64244a5fde24061`

The temporary cache-recovery workflow was removed after use.

## 02CR enrichment sync external verification

The user's manual Apps Script execution of:

- `startD1OperationalEnrichmentLiveSync02CR()`

completed without an IDE exception.

External read-only verification then confirmed:

### `العملاء`

- `sourceLastRow=239`
- `sourceLastCol=47`
- `rowCount=239`
- `status=ready`
- `syncedAt=2026-09-06 01:44:09`
- note `PERF-CF-02CR enrichment live sync V1`

### `عملاء منع التسليم بالمديونية`

- `sourceLastRow=1`
- `sourceLastCol=10`
- `rowCount=1`
- `status=ready`
- `syncedAt=2026-09-06 01:44:09`
- same exact 02CR enrichment note

### Existing Orders V2 ownership preserved

`بنود الأوردرات` remained:

- `sourceLastRow=355`
- `rowCount=355`
- note `TrendOS orders live sync V2 quota-aware`

Therefore 02CR support sync succeeded without taking ownership of Orders/Lines.

## Production boundary after enrichment sync

Read-only verification confirmed:

- `cutover=false`
- `sheetsAuthoritative=true`
- 02CL reconcile `enabled=false`
- `genericDrainEnabled=false`
- `pendingOutbox=0`
- unauthenticated Orders endpoint HTTP `401`
- production frontend Edge Orders read remains OFF in current repository configuration

## Preview parity status

The post-sync Preview comparison did not complete because the stored GitHub qualification employee token returned Apps Script `success=false`.

This is an authentication/qualification credential blocker for automated Apps-Script-vs-D1 comparison; it is not evidence that the 02CR enrichment sync failed.

Do not paste or log employee token values.

Full 02CR field/paging/filter parity therefore remains **not yet closed**.

## Exact current stop point

1. The production frontend cache-bust is deployed successfully.
2. The user must reload/reopen the production page and verify that the pager now says `كل صفحة 5 أوردرات` rather than `3`.
3. If the pager shows `5` and the active orders are now complete, record frontend runtime recovery PASS and continue 02CR parity qualification.
4. If the pager shows `5` but order count is still incomplete, the next blocker is the deployed Apps Script Web App/runtime or its authorization/filter path, not stale frontend assets; diagnose that path before any D1 frontend activation.
5. Do not enable D1 Orders read on production frontend yet.

## Safety state

- Google Sheets / Apps Script remain authoritative.
- Production frontend D1 Orders read: OFF.
- Existing Orders Live Sync V2: unchanged.
- 02CR enrichment sync: live for customer/restriction support mirrors.
- 02CL: OFF.
- generic drain: OFF.
- no `EDGE_SESSION_SECRET` rotation.
- no production Worker deploy in this recovery.
- no authority transfer.

Current status:

**SOURCE HAS MORE ORDERS THAN UI — STALE FRONTEND RUNTIME PROVEN — CACHE-BUST DEPLOYED — USER RECHECK PENDING — D1 FRONTEND REMAINS OFF.**
