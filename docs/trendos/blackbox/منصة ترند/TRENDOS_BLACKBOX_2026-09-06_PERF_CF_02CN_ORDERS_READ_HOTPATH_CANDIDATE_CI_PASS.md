# PERF-CF-02CN — Orders Read Path Cutover Readiness / Slowness Hot-Path Fix

Date: 2026-09-06

## Status

**CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**

02CN prepared the Orders read hot-path candidate after 02CM showed Worker/D1 health was fast while Apps Script remained the slowest measured endpoint.

No Production cutover occurred. No Worker deploy occurred. No Apps Script live deployment occurred. No secret was changed. No D1 migration or D1 write was executed.

## Starting point

Read before work:

- `docs/trendos/blackbox/منصة ترند/00_INDEX.md`
- `docs/trendos/blackbox/منصة ترند/01_CURRENT_STATE.md`
- `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CM_READONLY_STABILITY_PREFLIGHT_PASS.md`

02CM had already closed as **READ-ONLY PREFLIGHT PASS — CLOSED**.

Relevant 02CM findings used as 02CN input:

- Worker/D1 base health was good.
- Orders mirror was ready with `rowCount=311`, `sourceLastRow=311`, `sourceLastCol=67`.
- Lines mirror was ready with `rowCount=355`, `sourceLastRow=355`, `sourceLastCol=82`.
- Mirror stats showed `87` ready sheets, `0` pending sheets, `31276` mirrored rows.
- Apps Script blank ping was the slowest measured endpoint at `1306 ms`.
- No cutover had been authorized.

## Hot path inspected

The active Apps Script route for the main operations screen includes:

- `getRows`
- `getDashboard`
- `getRowsPageV1931`

The heavy path identified in Apps Script:

- `getRowsPageV1931_()` authorizes the user.
- It caches the requested page.
- It calls `getRows_()`.
- `getRows_()` reads the live `بنود الأوردرات` sheet and supporting customer/debt data, builds all visible rows, sorts them, and returns `dashboard: trendosV1925DashboardFromData_(screen, data, h)`.
- `getRowsPageV1931_()` filters/paginates and returns `dashboard: all.dashboard`.

Existing frontend/edge preparation before 02CN:

- `config.js` already loaded `trendos-edge-orders-read-v1.js?v=20260904a`.
- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED` remained `false`.
- The frontend wrapper only intercepts `getRowsPageV1931` when explicitly enabled.
- Debt filter `__DEBT__` remains ineligible for Edge and falls back to Apps Script.
- Any Edge failure falls open to the original Apps Script API.

## Candidate implementation

### File changed

`cloudflare-d1/src/edge-orders-read-v1.mjs`

Commit:

`8844ab6ccd86765ea9012a042078584a738578d1`

Change summary:

- Added exported `buildDashboardFromRows(rows, screen, now)`.
- Edge `/v1/edge/orders/page` now builds and returns a dashboard from D1 mirror rows instead of returning `dashboard: null`.
- Dashboard includes key counters used by the main screen, including active orders/lines, priority counts, overdue, ready-for-pickup, delivered-today, heat press, debt orders, today-work metrics, department counts, completion/time/performance scores, and `dataSource='d1-edge-orders'`.
- Existing auth, screen authorization, mirror readiness, paging, status counts, and Apps Script fallback boundaries remain unchanged.
- `__DEBT__` continues to return an Apps Script-required fallback response.

## Tests added

### File created

`tests/cloudflare_edge_orders_dashboard_02cn.test.mjs`

Commit:

`8a7af0109fa7f51c8257706d6bd7531c0ebb230b`

Test coverage:

- D1 dashboard builder returns expected counters from sample rows.
- Active filter behavior remains correct.
- `__DEBT__` remains unsupported on Edge so debt-filtered reads stay on Apps Script.
- Mirror row mapping keeps screen-level filtering, e.g. print screen only receives print rows.
- `config.js` keeps `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false`.
- Frontend wrapper remains loaded but dormant.
- Wrapper only intercepts `getRowsPageV1931`.
- Wrapper falls open to Apps Script on Edge failure.
- Edge source now includes the D1 dashboard builder.
- The orders read endpoint does not contain D1 write SQL.

## CI added

### File created

`.github/workflows/trendos-02cn-orders-read-hotpath-ci.yml`

Initial CI commit:

`5ef76b6a9992e5ba97df591f79d8e2f646264cff`

Initial result:

- 02CN CI Run: `33998192667`
- Job: `101392278897`
- Conclusion: **SUCCESS**
- Markers:
  - `PERF_CF_02CN_STATIC_SAFETY_BOUNDARY_PASS`
  - `PERF_CF_02CN_EDGE_ORDERS_DASHBOARD_TEST_PASS`

The initial safety guard passed, but its grep output included the workflow's own guard line. The guard was then cleaned to avoid confusing self-match output.

### Final guard cleanup

Guard cleanup commit:

`7f00d3c7a02ade0cbe2aa2fb527a06b0e9ac214a`

Final 02CN CI:

- Workflow: `TrendOS 02CN Orders Read Hot-Path CI`
- Run: `33998245346`
- Job: `101392419518`
- Conclusion: **SUCCESS**
- Markers:
  - `PERF_CF_02CN_STATIC_SAFETY_BOUNDARY_PASS`
  - `PERF_CF_02CN_EDGE_ORDERS_DASHBOARD_TEST_PASS`

Static safety boundary confirmed:

- Worker name remains `trendos-d1-api`.
- Worker entrypoint remains `production-shadow/index.js`.
- D1 database remains `trendos-main`.
- `TRENDOS_CLOUD_WRITE_V1_ENABLED = "true"` unchanged.
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED = "true"` unchanged.
- `TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "false"` unchanged.
- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = false` remains default-OFF.
- Checked 02CN files contain no Worker deploy command.
- Checked 02CN files contain no D1 migration command.
- Checked 02CN files contain no `d1 execute --file` command.
- Checked 02CN files contain no `secret put` command.
- Checked 02CN files contain no 02CL reconciliation execution endpoint call.
- Checked 02CN files contain no cutover marker.

## General integrity

TrendOS Integrity V1 also passed on the final 02CN commit:

- Run: `33998245337`
- Job: `101392418999`
- Conclusion: **SUCCESS**

## Production boundary

No live production mutation happened in 02CN:

- No Worker deploy.
- No Apps Script live deploy.
- No D1 migration.
- No D1 execute/write.
- No secret mutation.
- No Apps Script property mutation.
- No reconciliation execution.
- No outbox drain.
- No 02CL gate reopen.
- No frontend cutover.
- No normalized-data authority cutover.
- No `EDGE_SESSION_SECRET` rotation.

Current authority remains:

- Sheets / Apps Script authoritative: **YES**
- Production Cloud Write: **ON**
- Production Shadow: **ON / read-only / mutation-free**
- Frontend D1 read switch: **OFF**

## Result

02CN successfully prepared the missing D1 dashboard piece needed before trying an Orders read canary.

The candidate is not active for users yet because `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED` remains `false`.

## Safe next checkpoint

Recommended next checkpoint:

`PERF-CF-02CO — Controlled Orders D1 Read Canary / Authenticated Comparison`

Safe 02CO scope:

1. Keep Sheets / Apps Script authoritative.
2. Do not enable broad frontend cutover.
3. Deploy Worker only if explicitly needed for the dashboard builder to go live, with no D1 migrations and no secret changes.
4. Enable D1 read only in a bounded canary context, not globally.
5. Use an authenticated employee session.
6. Compare Edge/D1 `getRowsPageV1931` equivalent against Apps Script for representative screens/filters.
7. Keep `__DEBT__` on Apps Script.
8. Verify fallback behavior.
9. Only after comparison PASS should any broader frontend flag change be considered.
