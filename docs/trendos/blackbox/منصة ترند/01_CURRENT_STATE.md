# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Current active checkpoint — PERF-CF-02CU

`PERF-CF-02CU — Stability / Freshness / Resume Guards`

Status: **IN PROGRESS — PLATFORM SPEED USER-VALIDATED — D1 STALE-READ FAIL-SAFE LIVE — RETURN/FOCUS AUTO-REFRESH TECHNICAL PASS + PRODUCTION DEPLOYED — USER-VISIBLE RESUME VALIDATION PENDING — ORDERS LIVE SYNC HEARTBEAT RECOVERY PENDING**

Record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`

### Current production frontend

- GitHub Pages from `main`
- Production main commit: `20a56241da2919e31fc12cb5224d29ac18fdf4f3`
- Production Worker: `trendos-d1-api`
- D1 database: `trendos-main`
- Worker version retained from qualified 02CS/02CT path: `c77bf453-c590-4cff-a55b-fd9c625b6d76`
- Sheets / Apps Script authority: **YES**

### Orders read routing

Eligible `getRowsPageV1931` reads remain D1-first through:

`Frontend → trendos-edge-orders-read-v1.js → /v1/edge/orders/02cr/page → D1`

02CU adds a frontend freshness safety gate:

- if required D1 mirrors are older than `5 minutes`, Edge read fails open to Apps Script;
- `__DEBT__` remains Apps Script;
- all writes remain Apps Script / Sheets;
- unsupported/non-qualified actions remain Apps Script.

Freshness production commit:

`296fce971c52a7338a0ce1ded4c44b773af62d01`

The underlying Orders Live Sync heartbeat was found stale and still needs a separate recovery/qualification action. The current freshness gate protects users from consuming stale D1 Orders data while that is unresolved.

### Return-to-platform refresh regression

Root cause in legacy V1921 frontend code:

`safeRefresh()` is bound to:

- `visibilitychange` when the page becomes visible;
- `window.focus`;
- a 180000 ms interval.

It programmatically clicks `#refreshBtn`, causing full data refresh when users return to the platform.

Qualified fix:

`trendos-resume-no-autorefresh-v1.js`

The fix suppresses only `refreshBtn.click()` originating from legacy `safeRefresh`; manual refresh and other required programmatic refreshes remain available.

Candidate evidence:

- dedicated CI Run `34027221511` — **SUCCESS**
- Integrity Run `34027221532` — **SUCCESS**

Production deployment:

- first bounded attempt Run `34027268222` failed at scope bookkeeping before commit/push — **NO production mutation**
- corrected bounded production Run `34027313379` — **SUCCESS**
- production commit `20a56241da2919e31fc12cb5224d29ac18fdf4f3`
- GitHub Pages Run `34027347761` — **SUCCESS**
- published config/module verification inside the bounded workflow — **PASS**

Current expected browser behavior:

- switching to another tab/page and returning must NOT automatically reload all platform data;
- the user can still press `تحديث البيانات` manually;
- login/session should remain intact;
- no request storm should be created on focus/visibility return.

User-visible validation for this resume behavior is still pending.

### 02CU safety boundary

- Apps Script deployment in this 02CU frontend work: **NO**
- Worker deployment: **NO**
- D1 business-data write: **NO**
- authority transfer: **NO**
- 02CL / reconcile: **OFF**
- generic drain: **OFF**
- `EDGE_SESSION_SECRET` rotation: **NO**

Exact active stop point:

`PERF-CF-02CU IN PROGRESS — RESUME NO-AUTO-REFRESH LIVE ON PRODUCTION — USER-VISIBLE VALIDATION PENDING — ORDERS LIVE SYNC HEARTBEAT RECOVERY PENDING`

---

## Trend Master V1931 — مسار منفصل

`TM-V1931-RESILIENCE — Trend Master Panel Resilience Candidate`

The Trend Master lane is maintained separately. 02CU did not perform an Apps Script deployment or backend mutation for Trend Master. Current production frontend keeps bounded Trend Master concurrency and heavy background auto-scans disabled to protect platform performance.

---

## Last closed D1 checkpoint — PERF-CF-02CT

`PERF-CF-02CT — Production Frontend D1 Orders Read Cutover`

Status: **CLOSED — TECHNICAL VERIFIED PASS + USER-VISIBLE PASS — FRONTEND D1 READ ON FOR QUALIFIED ORDER READS — APPS SCRIPT FALLBACK + SHEETS AUTHORITY RETAINED**

Technical record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_PRODUCTION_FRONTEND_CUTOVER_PASS.md`

User-visible record:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_USER_VISIBLE_PASS.md`

02CT established the qualified `/v1/edge/orders/02cr/page` D1-first frontend read path, Apps Script fallback, `__DEBT__` fallback, write boundary, field/identity parity, and operational ordering. The user confirmed the live result with `فل`.

02CU does not change that authority boundary; it adds stability protections on top of it.
