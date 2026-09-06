# TrendOS Blackbox — PERF-CF-02CR Field Completeness Regression / Safe Rollback

Date: 2026-09-06
Checkpoint: `PERF-CF-02CR — Orders D1 Field Completeness Regression / Production Read Rollback + Operational Parity Repair`
Branch: `agent/go-live-2026-09-01-integrity`
Status: **MITIGATION PASS — PRODUCTION FRONTEND ON APPS SCRIPT — 02CR CANDIDATE QUALIFIED — PREVIEW FAIL-CLOSED PASS — ENRICHMENT APPS SCRIPT DEPLOYMENT APPROVAL GATE**

## Trigger

User reported that production order cards were appearing incomplete after the D1 mirror work.

The screenshot showed the order rows themselves were present, but some operational details were missing/blank.

## Critical production discovery

The production `main` branch was not actually in the same frontend-read state documented by the 02CQ working checkpoint.

`main` contained commit:

- `cf6a3a7e817fdb6c01fed3b6ad63c9cce8489d9a`
- message: `Enable Production Orders Edge-first read with Apps Script fallback`

That commit changed only `config.js` and:

1. set `window.MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`,
2. loaded `trendos-edge-orders-read-v1.js`.

Therefore the live GitHub Pages frontend could read `getRowsPageV1931` from D1 even though the 02CQ working-branch boundary kept the frontend flag OFF.

## Immediate production mitigation

Because the defect affects visible order completeness, the safest reversible action was to remove the Edge-first frontend read and restore the original Apps Script read path.

Rollback commit:

- `f7c3af17b3a28858d1be9d5c57455d54b4256126`
- message: `Rollback Orders Edge-first read after incomplete field regression`

`main` was fast-forwarded to that rollback commit.

Post-rollback `main/config.js` confirms:

- no `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`,
- no production loader call for `trendos-edge-orders-read-v1.js`,
- existing Apps Script URL and unrelated production configuration remain unchanged.

Production order cards therefore remain on Apps Script while 02CR is qualified.

## Root cause — corrected architecture

The first diagnosis identified that the 18-column `واجهة الطباعة` mirror was not field-complete. Further inspection found the more important routing fact:

- production Worker entry is `production-shadow/index.js` → `src/index_v2.js`,
- `/v1/edge/orders/page` was intercepted by `edge-orders-read-v1-canary.mjs`,
- that 02CO wrapper mapped requests to the limited screen-view mirrors:
  - `واجهة خدمة العملاء`
  - `واجهة الطباعة`
  - `واجهة الليزر`
  - `واجهة المكبس`
- the richer base module `edge-orders-read-v1.mjs` reads `بنود الأوردرات`, but production page GETs were not reaching that richer path.

Therefore the user-visible incomplete cards were caused by using the limited view-canary payload as if it were the complete `getRowsPageV1931` operational contract.

## Full Apps Script row contract

`getRowsPageV1931` / `getRows_` returns the operational row fields required by the UI, including identity, customer, department/item, priority/status, WhatsApp audit, timing, fly/quick print, debt and delivery restriction fields.

Apps Script also enriches each line from:

- `العملاء` — customer phone fallback, authoritative customer debt, debt notes,
- `عملاء منع التسليم بالمديونية` — active delivery restriction and reason.

Debt displayed by `getRowsPageV1931` intentionally trusts the customer sheet rather than the line row.

## Duplicate-header parity defect fixed

`بنود الأوردرات` contains duplicate exact headers including examples such as:

- `تم الإبلاغ بواسطة`
- `آخر رسالة واتساب`
- `تم إرسال رسالة التسجيل؟`
- `الوقت المتوقع`
- `مديونية العميل`
- `مصدر الطلب`

Apps Script `headersMap_` is last-write-wins for duplicate exact headers.

The D1 mapper originally used first-match semantics, which could choose an older/blank duplicate column while the later duplicate contained the live value.

02CR regression test added:

- `tests/cloudflare_edge_orders_duplicate_headers_02cr.test.mjs`

Mapper correction:

- file: `cloudflare-d1/src/edge-orders-read-v1.mjs`
- commit: `c6b362b4d4223e7f890af44d2067a5440224e42a`
- correction: duplicate exact header lookup now uses last occurrence while preserving alias priority.

## Existing Orders Live Sync V2 ownership preserved

The currently active Apps Script D1 orders sync was identified as:

- `cloudflare-d1/D1_Orders_Live_Sync_V2.gs`
- note: `TrendOS orders live sync V2 quota-aware`
- exact ownership:
  - `الأوردرات`
  - `بنود الأوردرات`
- every-minute trigger,
- unchanged source → metadata heartbeat,
- changed source → row-level delta,
- periodic atomic full rebase,
- quota-aware pause.

02CR MUST NOT overwrite those two mirrors with a different note or trigger. The earlier four-sheet 02CR sync candidate was therefore deliberately removed before deployment.

Superseded candidate removed:

- `cloudflare-d1/D1_Operational_Mirror_Sync_02CR.gs`
- corresponding superseded test removed.

## Operational D1 catalog evidence before 02CR enrichment sync

Read-only catalog probe inspected metadata only; no customer row values were logged.

Run:

- workflow run `34003478109`
- job `101406383520`
- conclusion **SUCCESS**

Observed:

- `الأوردرات`: `311 × 67`, rowCount `311`, ready, note `TrendOS orders live sync V2 quota-aware`, synced `2026-09-05 23:23:21`
- `بنود الأوردرات`: `355 × 82`, rowCount `355`, ready, note `TrendOS orders live sync V2 quota-aware`, synced `2026-09-05 23:23:21`
- `العملاء`: `232 × 47`, rowCount `232`, ready but stale, note `TrendOS full mirror V1`, synced `2026-08-29 15:43:37`
- `عملاء منع التسليم بالمديونية`: `1 × 10`, rowCount `1`, old/header-only snapshot, note `TrendOS full mirror V1`, synced `2026-08-29 15:22:43`

Temporary catalog workflow was removed after evidence collection:

- cleanup commit `760a3a9a8442016121f0825cf4269f2e5b428488`

## Independent 02CR enrichment live-sync candidate

New candidate:

- `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`

Exact scope only:

- `العملاء`
- `عملاء منع التسليم بالمديونية`

Note:

- `PERF-CF-02CR enrichment live sync V1`

Properties and trigger names are 02CR-specific and do not touch Orders Live Sync V1/V2.

Behavior:

- default OFF,
- Google Sheets read-only,
- first run / repair: atomic two-sheet full rebase,
- unchanged source: D1 heartbeat only,
- changed source: row-level D1 delta,
- both support sheets advance atomically,
- periodic 24h full repair,
- every-minute support trigger only after a successful first run,
- D1 quota failure pauses this support lane until next UTC reset,
- no frontend flag, Worker deploy, generic drain, 02CL gate, authority transfer, or secret rotation.

Safety test:

- `tests/apps_script_d1_operational_enrichment_live_sync_02cr.test.mjs`

## D1 operational enrichment logic candidate

Candidate:

- `cloudflare-d1/src/edge-orders-operational-enrichment-02cr.mjs`

It reproduces Apps Script semantics for:

- customer phone fallback,
- customer-sheet authoritative debt,
- debt hold,
- active/non-expired delivery restriction,
- restriction reason,
- debt note fallback,
- duplicate-header last-wins + alias-priority behavior.

Test:

- `tests/cloudflare_edge_orders_operational_enrichment_02cr.test.mjs`

## Isolated 02CR canary route

Candidate:

- `cloudflare-d1/src/edge-orders-read-02cr-canary.mjs`
- route: `/v1/edge/orders/02cr/page`

Wired in `cloudflare-d1/src/index_v2.js` as an isolated route before the existing production orders route.

The production frontend is NOT redirected to this route.

Qualification ownership is split deliberately:

- `بنود الأوردرات` must be ready and carry exact note `TrendOS orders live sync V2 quota-aware`,
- `العملاء` and `عملاء منع التسليم بالمديونية` must be ready and carry exact note `PERF-CF-02CR enrichment live sync V1`.

The route requires authenticated Edge session claims and keeps `__DEBT__` on Apps Script fallback.

It now mirrors the Apps Script paging/filter contract including:

- text search,
- exact status,
- `__ACTIVE__`,
- `__OVERDUE__`,
- `__TODAY_WORK__`,
- `__READY_PICKUP__`,
- `__CANCELLED__`,
- `__DELIVERED_TODAY__`,
- priority filters,
- heat-press filters,
- priority then Order ID sorting,
- pagination,
- `statusCounts`,
- `statusOrderCounts`.

Tests:

- `tests/cloudflare_edge_orders_02cr_canary.test.mjs`
- `tests/cloudflare_index_v2_02cr_route.test.mjs`

## 02CR CI / Integrity evidence

Durable workflow:

- `.github/workflows/trendos-02cr-field-completeness-ci.yml`

Qualified run after paging/filter and split-ownership work:

- 02CR Field Completeness CI Run `34003887916`
- Job `101407500641`
- **SUCCESS**

It passed:

- existing Edge Orders contract,
- duplicate-header regression,
- customer/debt enrichment,
- isolated 02CR canary,
- isolated Worker route,
- independent enrichment live-sync safety.

Integrity on same candidate generation:

- Run `34003887933`
- Job `101407500688`
- **SUCCESS**
- composed Apps Script syntax/collision PASS,
- pre-deploy package safety gate PASS,
- all listed foundation suites PASS.

## Preview deployment / pre-sync fail-closed proof

The isolated Preview Worker uses `src/index_v2.js`, shares the existing `trendos-main` D1 binding for read verification, and has Cloud Write OFF / no migration secret.

No production Worker deployment was needed for this qualification.

A synthetic short-lived Preview Edge Orders token was used only to query the isolated 02CR path. No employee/customer credentials or customer row values were logged.

Pre-sync probe:

- Run `34003873139`
- Job `101407459524`
- **SUCCESS**

Result:

- HTTP `503`
- code `02cr-operational-mirror-not-qualified`
- fallback `apps-script`
- failed qualification mirrors were exactly:
  - `العملاء` — old `TrendOS full mirror V1`
  - `عملاء منع التسليم بالمديونية` — old `TrendOS full mirror V1`

`بنود الأوردرات` did not appear in the failed list, proving the current Orders Live Sync V2 line mirror already satisfies its ownership gate.

Temporary Preview probe workflow was removed after evidence collection:

- cleanup commit `4caec04f629c1ffa5daaad4b67a776070ad1ad43`

## Current gate / exact stop point

Production remains safe on Apps Script.

The next required operational step is to deploy ONLY:

- `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`

into the existing live Apps Script project, while it remains default-OFF, then start:

- `startD1OperationalEnrichmentLiveSync02CR()`

This is a NEW Apps Script deployment/trigger action and is NOT covered by the user’s earlier 02CQ-only approval.

Therefore execution stops at an explicit approval gate.

After approval, required sequence is:

1. read-only production boundary,
2. deploy only the qualified 02CR enrichment module,
3. verify its status is OFF before start,
4. start the independent enrichment sync; first atomic two-sheet sync must PASS before its trigger is installed,
5. verify customer + restriction mirror note/count/freshness,
6. use Preview `/v1/edge/orders/02cr/page` for full field/paging/filter parity against Apps Script without PII logging,
7. verify at least one subsequent support heartbeat/delta freshness cycle,
8. final boundary + blackbox update,
9. keep production frontend on Apps Script.

Any production Worker deploy or frontend D1 re-enable remains a later separate gate after full parity proof.

## What remains unchanged

- Sheets / Apps Script are authoritative.
- Production frontend reads Apps Script.
- Existing Orders Live Sync V2 remains untouched and owns Orders + Lines.
- `pendingOutbox=0` boundary from prior verified checkpoint remains the last production write-boundary evidence until the next pre-action check.
- 02CL remains OFF.
- generic drain remains OFF / unused.
- no `EDGE_SESSION_SECRET` rotation.
- no authority transfer.
- no production Worker deploy in 02CR so far.

## Safety conclusion

**02CR mitigation and candidate qualification PASS.**

The original user-visible regression is mitigated in production, the D1 architectural cause is isolated, duplicate-header semantics are fixed, the missing enrichment sources are explicitly separated from the existing quota-aware Orders sync, and the isolated Preview route fails closed exactly as required before enrichment sync.

Current status is an **Apps Script deployment approval gate**, not a technical failure.
