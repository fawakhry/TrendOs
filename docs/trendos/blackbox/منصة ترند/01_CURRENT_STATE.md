# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Current active checkpoint — PERF-CF-02CU

`PERF-CF-02CU — Stability / Freshness / Resume Guards`

Status: **IN PROGRESS — PLATFORM SPEED USER-VALIDATED — NAVIGATION/RETURN NO-REFRESH CLOSED WITH TECHNICAL + PRODUCTION + USER-VISIBLE PASS — ORDERS LOW-USAGE HEARTBEAT LIVE/HEALTHY — DUAL-SIGNAL `/02cr` WORKER + FRONTEND PRODUCTION TECHNICAL PASS — USER-VISIBLE IDLE-AGING VALIDATION PENDING**

Records:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_USER_VISIBLE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_CANDIDATE.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_PRODUCTION_PASS.md`

### Current production frontend / Worker

The separately approved 02CU production promotion is complete:

- GitHub Pages from `main`
- Production main commit: `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`
- Production main message: `Promote 02CU logical freshness frontend`
- Production Worker: `trendos-d1-api`
- Production Worker version: `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8`
- Worker traffic: **100%**
- Worker deployment id: `f7615c0b-5a0f-4262-b79c-af84a0c6c683`
- D1 database: `trendos-main`
- Sheets / Apps Script authority: **YES**

### Orders read routing — current Production

Eligible `getRowsPageV1931` reads remain D1-first through:

`Frontend → trendos-edge-orders-read-v1.js → /v1/edge/orders/02cr/page → D1`

Current Production freshness safety behavior:

- physically fresh required mirrors use the normal D1 path;
- physically stale `بنود الأوردرات` may remain D1-readable only with a valid bounded Worker proof whose mode is exactly `verified-idle-source-unchanged`;
- the proof must be recent, healthy, hash-present, and source-shape matched to the Lines mirror metadata;
- Customers and Debt Restrictions remain physically freshness-gated and cannot use the Orders heartbeat exception;
- source change, bad/missing/old proof, shape mismatch, stale enrichment, auth failure, Worker error, invalid JSON, or any other qualification failure falls back to Apps Script;
- `__DEBT__` remains Apps Script;
- all writes remain Apps Script / Sheets;
- unsupported/non-qualified actions remain Apps Script.

The previous false-stale behavior — unchanged Lines crossing five minutes and forcing Apps Script solely because no D1 write was needed — is now guarded by dual-signal logical freshness rather than a fake D1 timestamp refresh.

### Orders Low-Usage heartbeat — LIVE / HEALTHY

The Low-Usage route was confirmed healthy and did not require an Apps Script redeploy.

Read-only evidence established:

- enabled: true
- Low-Usage trigger count: 1
- legacy V1 trigger count: 0
- direct V2 trigger count: 0
- unchanged authoritative source may result in zero D1 request
- unchanged authoritative source may result in zero D1 write
- no current trigger error / zero consecutive errors in the qualification evidence

This zero-write behavior is intentional and remains the desired quota-safe design.

### 02CR idle-aging root cause — FIX PROMOTED

Confirmed root cause:

- the production frontend uses `/v1/edge/orders/02cr/page`;
- before 02CU, that route bypassed the generic Orders idle verifier;
- the frontend then used physical `syncedAt` age only;
- therefore an unchanged healthy source could look stale after five minutes simply because Low-Usage correctly performed no D1 write.

02CU promoted the safe fix instead of adding a fake heartbeat write.

### Worker production promotion — PASS

The new wrapper:

`cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs`

now performs metadata-only freshness qualification for `/02cr` and delegates to the already-qualified business handler only after that decision.

Heartbeat verifier hardening remains:

- successful heartbeat responses cached in Worker isolate memory for 30 seconds only;
- concurrent reads coalesced to one in-flight heartbeat request;
- failures are never cached;
- no persistent storage;
- no D1 mutation.

Evidence:

- exact zero-traffic Worker upload created version `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8`
- exact preview requalification Run `34033006309` — **SUCCESS**
- Worker Production promotion Run `34033058006` — **SUCCESS**
- exact target `9a4e7163-53bd-4dd7-bbbb-4062d5e829b8` deployed at **100%**
- post-promotion authenticated `/02cr`: PASS
- anonymous `/02cr`: fail-closed PASS
- Sheets authoritative: true
- cutover: false
- pendingOutbox: 0
- 02CL / reconcile qualification: false
- generic drain: false
- `__DEBT__`: Apps Script fallback
- rollback: not required

No secret rotation and no `EDGE_SESSION_SECRET` change occurred.

### Frontend production promotion — PASS

Frontend promotion occurred only after Worker qualification.

The production commit changed exactly:

1. `trendos-edge-orders-read-v1.js`
2. `config.js` loader cache-bust reference

New main:

`eab0dd342085df45ac8cd9dc02b1c21e7dc76820`

Evidence:

- bounded frontend promotion Run `34034029239` — **SUCCESS**
- dual-signal frontend regression: PASS
- Navigation resume-no-autorefresh regression: PASS
- return-traffic quiet regression: PASS
- exact two-file production scope: PASS
- public GitHub Pages assets: PASS
- post-frontend authenticated Production `/02cr`: PASS
- `__DEBT__` Apps Script fallback: PASS
- rollback: not required

GitHub Pages:

- Run `34034051695` — **SUCCESS**
- deployed head `eab0dd342085df45ac8cd9dc02b1c21e7dc76820`

The post-frontend Production request was physically fresh at the moment of qualification and therefore correctly used the normal physical-fresh path.

### Stale-Lines proof already qualified

The live stale path had already been exercised on the isolated Preview before Production promotion:

- dedicated Preview qualification Run `34031601605` — **SUCCESS**
- Lines physical age: 419–420 seconds
- logical mode: `verified-idle-source-unchanged`
- logical proof age: 124–127 seconds
- logical max age: 720 seconds
- source shape matched D1 mirror metadata exactly
- repeat stale-Lines read: PASS
- anonymous access: fail-closed PASS

Focused regression coverage also verifies invalid proof, changed source, shape mismatch, stale enrichment, missing mirror, bad JSON and Edge failure all fall back safely.

### Navigation return / no refresh — CLOSED

The separate Navigation / Return sub-checkpoint remains closed.

Root cause in legacy `app.js`:

`safeRefresh()` was bound to `visibilitychange`, `window.focus`, and a 180000 ms interval, then programmatically clicked `#refreshBtn`.

Primary production guard:

`trendos-resume-no-autorefresh-v1.js`

Residual guard:

`trendos-return-traffic-quiet-v1.js`

User-visible validation:

`تمام ثبت`

Status: **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**.

02CU dual-signal promotion retained both navigation guards and their regressions passed during the frontend deployment.

### 02CU safety boundary — retained after Production promotion

- Apps Script New Version / Deploy: **NO**
- D1 business-data write by this promotion: **NO**
- authority transfer: **NO**
- Sheets / Apps Script authority: **YES**
- eligible Orders reads D1 first: **YES**
- Apps Script fallback: **retained**
- `__DEBT__`: **Apps Script**
- 02CL / reconcile qualification: **OFF**
- generic drain: **OFF**
- `EDGE_SESSION_SECRET` rotation/change: **NO**
- Customer Feedback auto scan: **OFF**
- Go-Live Autopilot auto sweep: **OFF**
- Trend Master bounded protections: **retained**
- Navigation return guards: **retained**

### Temporary workflow cleanup

The four promotion-only temporary workflows were removed after successful qualification:

- `trendos-02cu-worker-zero-traffic-upload-temp.yml`
- `trendos-02cu-worker-preview-requalify-temp.yml`
- `trendos-02cu-worker-promote-temp.yml`
- `trendos-02cu-frontend-production-temp.yml`

Durable CI and read-only diagnostic workflows were retained.

### Required next action — user-visible validation only

No additional Production deployment is required for the current 02CU implementation.

The only remaining close condition is user-visible idle-aging validation after the new cache-busted frontend has loaded.

Expected live behavior:

- normal Orders pages continue to use the qualified D1 path;
- when `بنود الأوردرات` becomes physically older than five minutes solely because the authoritative source is unchanged, a valid Low-Usage proof prevents the false-stale fallback;
- a real source change or any proof/freshness/qualification failure still falls back to Apps Script.

Do not mark 02CU CLOSED until the user confirms the live behavior.

Exact active stop point:

`PERF-CF-02CU IN PROGRESS — NAVIGATION-RETURN-NO-REFRESH CLOSED TECHNICAL + PRODUCTION + USER-VISIBLE PASS — ORDERS DUAL-SIGNAL IDLE FRESHNESS WORKER + FRONTEND PRODUCTION TECHNICAL PASS — PRODUCTION MAIN eab0dd342085df45ac8cd9dc02b1c21e7dc76820 — WORKER 9a4e7163-53bd-4dd7-bbbb-4062d5e829b8 @100% — WORKER PROMOTION RUN 34033058006 SUCCESS — FRONTEND PROMOTION RUN 34034029239 SUCCESS — PAGES 34034051695 SUCCESS — APPS SCRIPT FALLBACK + __DEBT__ + SHEETS AUTHORITY + 02CL OFF + GENERIC DRAIN OFF + NO SECRET ROTATION RETAINED — NEXT/ONLY 02CU CLOSE CONDITION: USER-VISIBLE IDLE-AGING VALIDATION`

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

02CU does not change that authority boundary; it adds stability/freshness protections on top of it.
