# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Current active checkpoint — PERF-CF-02CU

`PERF-CF-02CU — Stability / Freshness / Resume Guards`

Status: **IN PROGRESS — PLATFORM SPEED USER-VALIDATED — D1 STALE-READ FAIL-SAFE LIVE — RETURN/FOCUS FULL AUTO-REFRESH + RESIDUAL RETURN TRAFFIC TECHNICAL PASS + PRODUCTION DEPLOYED — USER-VISIBLE RESUME VALIDATION PENDING — ORDERS LIVE SYNC HEARTBEAT RECOVERY PENDING**

Records:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md`

### Current production frontend

- GitHub Pages from `main`
- Production main commit: `9552407c5a5136371f9afd452b913c226329d7dc`
- Production Worker: `trendos-d1-api`
- D1 database: `trendos-main`
- Worker version retained: `c77bf453-c590-4cff-a55b-fd9c625b6d76`
- Sheets / Apps Script authority: **YES**

### Orders read routing

Eligible `getRowsPageV1931` reads remain D1-first through:

`Frontend → trendos-edge-orders-read-v1.js → /v1/edge/orders/02cr/page → D1`

02CU freshness safety gate remains active:

- required D1 mirrors older than `5 minutes` fail open to Apps Script;
- `__DEBT__` remains Apps Script;
- all writes remain Apps Script / Sheets;
- unsupported/non-qualified actions remain Apps Script.

Freshness production commit: `296fce971c52a7338a0ce1ded4c44b773af62d01`.

Orders Live Sync heartbeat for `بنود الأوردرات` still needs separate recovery/qualification. Do not infer activation from this frontend checkpoint.

### Navigation return / no refresh

Root cause in legacy `app.js`:

`safeRefresh()` was bound to `visibilitychange`, `window.focus`, and a 180000 ms interval, then programmatically clicked `#refreshBtn`, causing full data refresh when returning to TrendOS.

Primary production guard:

`trendos-resume-no-autorefresh-v1.js`

It suppresses only `refreshBtn.click()` originating from legacy `safeRefresh`, while manual refresh remains available.

Primary evidence:

- dedicated CI Run `34027221511` — **SUCCESS**
- Integrity Run `34027221532` — **SUCCESS**
- bounded production Run `34027313379` — **SUCCESS**
- production commit `20a56241da2919e31fc12cb5224d29ac18fdf4f3`
- GitHub Pages Run `34027347761` — **SUCCESS**

### Residual return traffic hardening

Audit also found two non-reset request sources on return:

- `attendance-v1.js`: visible return → `loadState()`, despite its existing 60-second state loop;
- `employee-manager-strips-v2.js`: focus return → `refresh({source:'focus'})` → `getRows + getMatbagyNotes`, despite its existing 60-second interval.

Production now loads an early narrow guard before `config.js`:

`trendos-return-traffic-quiet-v1.js`

The guard suppresses only registration of those two known listeners. It does **not** block:

- legacy safeRefresh listeners;
- unrelated focus/visibility listeners;
- manual refresh;
- Attendance state/presence/prayer timers;
- Employee Manager periodic timer;
- Customer Feedback focus listener.

Customer Feedback auto scan remains OFF, so its focus auto-scan path does not start in current production.

Residual guard evidence:

- candidate head `e5051df3cbf44ee3bc536e44059bce7d26105b6b`
- Return Traffic Quiet CI Run `34028439196` — **SUCCESS**
- candidate Integrity Run `34028439136` — **SUCCESS**
- bounded production Run `34028483654` — **SUCCESS**
- bounded-deploy push Integrity Run `34028483586` — **SUCCESS**
- production commit `9552407c5a5136371f9afd452b913c226329d7dc`
- GitHub Pages Run `34028490166` — **SUCCESS**
- production scope: `index.html` + `trendos-return-traffic-quiet-v1.js` only
- rollback base: `20a56241da2919e31fc12cb5224d29ac18fdf4f3`
- temporary production workflow removed after success.

### Expected browser behavior

After one normal/manual reload to receive the current production assets:

- switching away and returning must NOT reload all platform data;
- Attendance must not call `loadState()` solely because visibility returned;
- Employee Manager must not call `getRows + getMatbagyNotes` solely because focus returned;
- manual `تحديث البيانات` still works;
- login/session remains intact;
- live SPA screen/filter/page/search state remains untouched while the TrendOS tab stays open;
- required periodic timers continue normally;
- no focus/visibility request storm.

No new PII/customer dataset/token persistence was added. Existing TrendOS sessionStorage already retains the employee session/current screen. Extra UI-state persistence is deferred unless a distinct hard-navigation state-loss case is reproduced.

User-visible validation is still **PENDING**.

### 02CU safety boundary

- Apps Script deployment: **NO**
- Worker deployment: **NO**
- D1 business-data write: **NO**
- authority transfer: **NO**
- 02CL / reconcile: **OFF**
- generic drain: **OFF**
- `EDGE_SESSION_SECRET` rotation/change: **NO**
- Customer Feedback auto scan: **OFF**
- Go-Live Autopilot auto sweep: **OFF**
- Trend Master bounded protections: **retained**

Exact active stop point:

`PERF-CF-02CU IN PROGRESS — NAVIGATION-RETURN-NO-REFRESH TECHNICAL PASS — PRODUCTION MAIN 9552407c5a5136371f9afd452b913c226329d7dc — GITHUB PAGES SUCCESS — FULL SAFE-REFRESH RETURN RELOAD + RESIDUAL ATTENDANCE/EMPLOYEE RETURN TRAFFIC QUIETED — USER-VISIBLE VALIDATION PENDING — ORDERS LIVE SYNC HEARTBEAT RECOVERY PENDING`

---

## Trend Master V1931 — مسار منفصل

`TM-V1931-RESILIENCE — Trend Master Panel Resilience Candidate`

02CU did not perform an Apps Script deployment or backend mutation for Trend Master. Production keeps bounded Trend Master concurrency and heavy background auto-scans disabled.

---

## Last closed D1 checkpoint — PERF-CF-02CT

`PERF-CF-02CT — Production Frontend D1 Orders Read Cutover`

Status: **CLOSED — TECHNICAL VERIFIED PASS + USER-VISIBLE PASS — FRONTEND D1 READ ON FOR QUALIFIED ORDER READS — APPS SCRIPT FALLBACK + SHEETS AUTHORITY RETAINED**

Technical record: `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_PRODUCTION_FRONTEND_CUTOVER_PASS.md`

User-visible record: `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_USER_VISIBLE_PASS.md`

02CT established the qualified `/v1/edge/orders/02cr/page` D1-first frontend read path, Apps Script fallback, `__DEBT__` fallback, write boundary, field/identity parity, and operational ordering. The user confirmed that live result with `فل`.

02CU does not change that authority boundary; it adds stability protections on top of it.
