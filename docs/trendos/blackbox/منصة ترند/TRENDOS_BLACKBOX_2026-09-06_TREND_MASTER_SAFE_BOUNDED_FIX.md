# Trend Master V1931 — Safe Bounded Production Fix

Date: 2026-09-06
Scope: Trend Master Center only

## Production symptom after Apps Script V155

User screenshot showed legacy Trend Master timeout behavior:
- global `انتهت مهلة الاتصال بالسيرفر.`
- archive remained `جاري التحميل...`
- employee KPI remained `جاري الحساب...`
- messages/stock still showed initial HTML placeholders.

A parallel production safety hotfix had intentionally disabled the first resilience fanout after detecting a browser request storm:

- main commit `cb7ba1420fb33cc2454048363f4392d299ddf385`
- message: `Hotfix disable Trend Master auto fanout on platform load`
- platform-load auto refresh remained disabled in `app.js`
- resilience flag was temporarily OFF and loader removed.

That hotfix was preserved; it was not reverted wholesale.

## Measured Apps Script V155 panel latency

Authenticated read-only production diagnostic Run `34012595423`, job `101430849465` measured each panel.

Sequential:
- summary: 13,090 ms — PASS
- archive: 36,460 ms — PASS
- messages: 13,948 ms — PASS
- stock: 10,175 ms — PASS
- employee: 11,051 ms — PASS
- debt: 8,600 ms — PASS
- dayclose: >60,000 ms — TIMEOUT

Seven-way concurrent diagnostic:
- summary: 6,439 ms — PASS
- archive: 25,001 ms — TIMEOUT
- messages: 11,338 ms — PASS
- stock: 6,443 ms — PASS
- employee: 7,162 ms — PASS
- debt: 11,237 ms — PASS
- dayclose: 25,000 ms — TIMEOUT

Conclusion:
- old 12–18 second panel timeouts were too short,
- seven-way fanout is unsafe,
- archive requires a larger budget,
- day-close preview must not load automatically.

## Safe bounded production implementation

Production `main` changes were applied on top of the request-storm hotfix, without reverting its unrelated protections.

### Main commit 1

`39465fd39f74004d0080b36e4cc3590dff9bbb21`

Added:

`trend-master-resilience-safe-v1931.js`

Behavior:
- no automatic Trend Master load on platform login/open,
- intercept legacy `getTrendMasterCenterV1931` only when user explicitly requests center data,
- core panels: summary, archive, employee, stock, messages, debt,
- global maximum concurrency: 2 Apps Script requests,
- automatic retry count: 0 (one attempt only),
- explicit retry remains available per failed panel,
- inflight deduplication and last-good stale cache retained,
- day-close excluded from automatic batch,
- day-close becomes explicit/manual review only,
- per-panel errors replace eternal loading placeholders.

### Main commit 2 / production head

`8fa24b90ece05658698564fb92b3b28c4ab1a6ef`

Updated `config.js`:
- `MATBAGY_TREND_MASTER_RESILIENCE_V1 = true`
- `MATBAGY_TREND_MASTER_MAX_CONCURRENCY = 2`
- `MATBAGY_TREND_MASTER_MAX_ATTEMPTS = 1`
- timeouts:
  - summary 30s
  - archive 60s
  - messages 30s
  - stock 30s
  - employee 30s
  - debt 30s
  - dayclose 120s, manual only
- loads `trend-master-resilience-safe-v1931.js?v=20260906safe1`

Preserved production boundaries:
- `app.js` still does not auto-load Trend Master on platform open; it instructs user to press `تحديث المركز`.
- existing request-storm hotfix protections remain intact.
- D1 state found on main was not changed by this Trend Master fix.
- no Worker deployment, 02CL change, drain, secret rotation, or authority migration was performed.
- Apps Script V155 remains the Trend Master backend authority.

## Production publication

GitHub Pages deployment for main commit `8fa24b90...`:

Run `34012902047` — **SUCCESS**

## Safe bounded production canary

The canary was changed to model the browser-safe scheduler exactly: six core panels, max concurrency 2, no dayclose, no automatic retry.

Working-branch canary commit:

`5c361bb1aa8f9f1b2a24ac390204d7536c577d08`

Run:

`34012959772`

Job:

`101431805418`

Result: **SUCCESS**

Marker:

`TREND_MASTER_SAFE_BOUNDED_CANARY_PASS`

Observed timings under the bounded scheduler:
- summary: 3,772 ms
- archive: 14,172 ms
- employee: 3,535 ms
- stock: 4,187 ms
- messages: 5,688 ms
- debt: 11,316 ms
- maximum simultaneous requests: exactly 2
- all returned HTTP 200, success true, version `V1931_TREND_MASTER_PANEL_READ_V1`
- dayclose was not automatically requested.

## Exact close point

`TM-V1931 SAFE BOUNDED FIX LIVE — APPS SCRIPT V155 — MANUAL CENTER LOAD ONLY — MAX CONCURRENCY 2 — CORE 6 PANEL CANARY PASS — DAYCLOSE LAZY/MANUAL — PAGES DEPLOY PASS — D1 STATE UNCHANGED BY THIS TRACK`
