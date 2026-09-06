# TrendOS Blackbox — PERF-CF-02CQ

Date: 2026-09-06
Checkpoint: `PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`
Branch: `agent/go-live-2026-09-01-integrity`
Opening branch head: `c9f2948ac97d241c2f99eb1ab093e0ad9c0092d6`
Status: **EXECUTION OPEN — DISCOVERY COMPLETE — READ-ONLY SOURCE PROBE NEXT — NO PRODUCTION D1 WRITE YET**

## Inherited boundary from 02CO

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Google Sheets / Apps Script remain authoritative.
- Frontend D1 read flag remains OFF.
- No frontend cutover is authorized in 02CQ.
- No generic outbox drain is authorized.
- `EDGE_SESSION_SECRET` must not be rotated.
- 02CL remains closed/OFF and must not be reopened by this checkpoint.
- `__DEBT__` remains on the Apps Script fallback lane.

## 02CO blocker being addressed

The authenticated D1-vs-Apps-Script canary reached the real comparison lane, but the D1 mirror for `واجهة الطباعة` was stale/header-only while Apps Script returned live print rows. Therefore 02CQ is limited to refreshing the four screen-view mirrors before rerunning the read-only canary.

Target mirrors only:

1. `واجهة خدمة العملاء`
2. `واجهة الطباعة`
3. `واجهة الليزر`
4. `واجهة المكبس`

## Repository discovery

### Existing D1 mirror storage

`cloudflare-d1/src/mirror.js` owns:

- `sheet_catalog`
- `sheet_rows`
- atomic staging tables `sheet_staging_catalog` / `sheet_staging_rows`
- `/v1/import/sheet`
- `/v1/mirror/sheet`
- atomic `stage` / `promote` primitives

The atomic stage validates full row parity before promotion, and promotion replaces only explicitly named sheets.

### Existing exporters

`cloudflare-d1/D1_Orders_Live_Sync.gs` is bounded to the live Orders pair (`الأوردرات`, `بنود الأوردرات`) and does not refresh the four screen views.

`cloudflare-d1/D1_Full_Migration.gs` can copy all Sheets, but it is intentionally NOT selected for 02CQ because the checkpoint must not run a broad/full migration.

### Existing workflows

No current workflow was found that refreshes exactly the four screen-view mirrors.

An older Orders freshness workflow performs Worker deployment and rotates `EDGE_SESSION_SECRET`; that path is explicitly disallowed for 02CQ and will not be used.

### Current canary mapping

`cloudflare-d1/src/edge-orders-read-v1-canary.mjs` maps:

- `service` → `واجهة خدمة العملاء`
- `print` → `واجهة الطباعة`
- `laser` → `واجهة الليزر`
- `press` → `واجهة المكبس`

The `__DEBT__` filter continues to return `apps-script-required` with Apps Script fallback.

## 02CQ execution design

1. Run a bounded **read-only source-shape probe** first.
2. Probe Apps Script only through the already qualified employee session secrets stored in GitHub Actions; no secret values are printed.
3. Log only:
   - screen name,
   - row counts,
   - response field names/schema keys,
   - D1 catalog metadata,
   - boundary booleans/status codes.
4. Never log customer names, phone numbers, free-text notes, or row payloads.
5. After source shape is proven, prepare a bounded four-view refresh candidate.
6. No `d1 execute --file`, no general migration, no Apps Script deployment, no Worker deployment, no secret rotation.
7. Before and after any future D1 write, verify:
   - Worker health,
   - Cloud Write boundary,
   - `pendingOutbox = 0`,
   - `cutover = false`,
   - `sheetsAuthoritative = true`,
   - 02CL reconcile disabled,
   - generic drain disabled.
8. After refresh, verify `واجهة الطباعة` is no longer header-only and `sourceLastRow > 1`, then rerun authenticated D1-vs-Apps-Script print canary using only `Order ID / Line ID / status` for diagnostic identity.

## Safety conclusion at opening

**PASS — no production mutation has occurred in 02CQ yet.**

The next action is a read-only GitHub Actions probe to prove the authoritative Apps Script response shape and current four-view D1 catalog state before implementing the bounded refresh.
