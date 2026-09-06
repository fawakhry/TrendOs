# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-06

## Current active checkpoint — PERF-CF-02CU

`PERF-CF-02CU — Stability / Freshness / Resume Guards`

Status: **IN PROGRESS — PLATFORM SPEED USER-VALIDATED — NAVIGATION/RETURN NO-REFRESH CLOSED WITH TECHNICAL + PRODUCTION + USER-VISIBLE PASS — ORDERS LOW-USAGE HEARTBEAT LIVE/HEALTHY — `/02cr` IDLE-AGING ROOT CAUSE CONFIRMED — DUAL-SIGNAL FRESHNESS CANDIDATE VERIFIED + ISOLATED PREVIEW LIVE PASS — PRODUCTION PROMOTION PENDING**

Records:

- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_USER_VISIBLE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_CANDIDATE.md`

### Current production frontend / Worker

Production is intentionally unchanged by the new dual-signal candidate:

- GitHub Pages from `main`
- Production main commit: `9552407c5a5136371f9afd452b913c226329d7dc`
- Production Worker: `trendos-d1-api`
- D1 database: `trendos-main`
- Production Worker version retained: `c77bf453-c590-4cff-a55b-fd9c625b6d76`
- Sheets / Apps Script authority: **YES**

### Orders read routing — current Production

Eligible `getRowsPageV1931` reads remain D1-first through:

`Frontend → trendos-edge-orders-read-v1.js → /v1/edge/orders/02cr/page → D1`

Current Production freshness safety behavior remains:

- required D1 mirrors older than `5 minutes` fail open to Apps Script;
- `__DEBT__` remains Apps Script;
- all writes remain Apps Script / Sheets;
- unsupported/non-qualified actions remain Apps Script.

Freshness production commit: `296fce971c52a7338a0ce1ded4c44b773af62d01`.

### Orders Low-Usage heartbeat — LIVE / HEALTHY

The remaining 02CU investigation proved that the Apps Script Low-Usage heartbeat route is not dead and does not need a recovery deploy.

Current read-only route evidence:

- enabled: true
- Low-Usage trigger count: 1
- legacy V1 trigger count: 0
- direct V2 trigger count: 0
- source unchanged during idle check
- no D1 request during unchanged idle check
- no D1 write during unchanged idle check
- no current error / zero consecutive errors

This zero-write behavior is intentional. It prevents unnecessary Cloudflare/D1 activity while the authoritative Sheets source has not changed.

### Confirmed 02CR idle-aging root cause

The generic Orders lane already had a dual-signal freshness verifier capable of treating an old D1 write timestamp as logically current when a recent sanitized Apps Script heartbeat proves that Orders + Lines source shape is unchanged.

However the production frontend uses the qualified route:

`/v1/edge/orders/02cr/page`

That route was dispatched before the generic Orders freshness gate, so the existing idle-source verifier was never applied to the actual qualified frontend path.

At the same time, the frontend wrapper used physical `syncedAt` age only. Result:

- immediately after a real sync, D1 works;
- when the source stays unchanged and Low-Usage correctly performs zero D1 writes, `بنود الأوردرات.syncedAt` naturally ages;
- after five minutes, the frontend treats it as stale and falls back to Apps Script even though the source is unchanged and healthy.

Production read-only Run `34031380301` — **SUCCESS** — observed Lines at about 129–137 seconds old, while Customers / Debt Restrictions were about 25–33 seconds old.

A few minutes later the isolated Preview live qualification observed the same Lines mirror at 419–420 seconds old while Customers / Debt Restrictions were only 17 seconds old, proving the exact idle-aging transition.

### 02CR Dual-Signal candidate — VERIFIED PASS

Worker candidate:

`cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs`

The candidate wraps the already-qualified 02CR handler and adds a metadata-only freshness decision:

- fresh Lines: no heartbeat request;
- stale Lines: require a recent healthy Low-Usage proof that Orders + Lines source row/column shape is unchanged;
- source change, shape mismatch, stale proof, unhealthy trigger state, missing proof, structural mismatch, or verifier error: fail closed to Apps Script;
- Customers and Debt Restrictions must remain physically fresh because the Orders heartbeat does not prove those sources;
- `__DEBT__` remains Apps Script-required;
- anonymous/unauthorized reads do not trigger heartbeat verification;
- no D1 write and no fake `syncedAt` refresh.

`cloudflare-d1/src/index_v2.js` routes `/02cr` through this freshness wrapper before delegating to the existing qualified business handler.

Heartbeat verifier hardening:

- successful heartbeat responses are cached in Worker isolate memory for only 30 seconds;
- concurrent reads are coalesced to one in-flight Apps Script request;
- failures are never cached;
- no persistent storage is introduced.

Frontend candidate in `trendos-edge-orders-read-v1.js` accepts logical freshness only for stale `بنود الأوردرات`, only when the proof is bounded, recent, source-unchanged, hash-present, and exactly shape-matched. Customers / Debt Restrictions cannot use this exception.

Any invalid proof retains the existing Apps Script fallback.

### Candidate / Preview evidence

Final same-head Integrity:

- TrendOS Integrity V1 Run `34031601579` — **SUCCESS**
- all 02CR contract, dual-signal, route wiring, frontend fallback, heartbeat, cache/coalescing, freshness and legacy platform suites passed.

Isolated Preview deployment:

- TrendOS Cloudflare Auto Preview Run `34031294735` — **SUCCESS**
- Preview Worker version: `607bccf3-8d7e-45f6-b179-6625aeafa3f8`
- cutover=false
- Cloud Write OFF
- no D1 migrations
- normalized import unavailable before mutation
- Production Worker/frontend unchanged.

Dedicated read-only `/02cr` Preview qualification:

- Run `34031601605` — **SUCCESS**
- anonymous `/02cr` fail-closed: PASS
- focused candidate tests: PASS
- live stale-Lines dual-signal read: PASS
- repeat stale-Lines dual-signal read: PASS
- Lines physical age: 419–420 seconds
- logical mode: `verified-idle-source-unchanged`
- logical proof age: 124–127 seconds
- logical max age: 720 seconds
- source shape matched D1 mirror metadata exactly
- no business row values were printed by the dedicated probe.

The candidate is therefore **verified in isolated Preview**, but **not deployed to Production**.

### Required next action — separate Production approval

The remaining 02CU action is a coordinated Production promotion, not an Apps Script heartbeat recovery.

If separately approved, the bounded order is:

1. recheck exact Production main/Worker baseline and safety flags;
2. promote only the qualified Worker dual-signal changes with write/cutover settings unchanged;
3. live read-only qualify `/02cr` on Production, including the stale-Lines logical-proof case;
4. only after Worker qualification, promote the frontend proof acceptance;
5. run GitHub Pages + production read-only stability qualification;
6. retain Apps Script fallback, `__DEBT__`, authority and all no-write/no-drain/no-secret invariants;
7. obtain user-visible confirmation before closing 02CU.

### Navigation return / no refresh — CLOSED

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

Production also loads `trendos-return-traffic-quiet-v1.js` before `config.js` to suppress only the redundant Attendance visible-return load and Employee Manager focus refresh while keeping required periodic timers.

Residual evidence:

- Return Traffic Quiet CI Run `34028439196` — **SUCCESS**
- bounded production Run `34028483654` — **SUCCESS**
- production commit `9552407c5a5136371f9afd452b913c226329d7dc`
- GitHub Pages Run `34028490166` — **SUCCESS**

### Navigation user-visible validation — PASS

User confirmed production behavior with:

`تمام ثبت`

Navigation / Return remains **CLOSED — TECHNICAL + PRODUCTION + USER-VISIBLE PASS**.

No new PII/customer dataset/token persistence was added by that fix.

### 02CU safety boundary

- Apps Script deployment in current candidate: **NO**
- Production Worker deployment in current candidate: **NO**
- Production frontend deployment in current candidate: **NO**
- D1 business-data write: **NO**
- authority transfer: **NO**
- Sheets / Apps Script authority: **YES**
- Apps Script fallback: **retained**
- `__DEBT__`: **Apps Script**
- 02CL / reconcile: **OFF**
- generic drain: **OFF**
- `EDGE_SESSION_SECRET` rotation/change: **NO**
- Customer Feedback auto scan: **OFF**
- Go-Live Autopilot auto sweep: **OFF**
- Trend Master bounded protections: **retained**

Exact active stop point:

`PERF-CF-02CU IN PROGRESS — NAVIGATION-RETURN-NO-REFRESH CLOSED TECHNICAL + PRODUCTION + USER-VISIBLE PASS — ORDERS LOW-USAGE HEARTBEAT LIVE/HEALTHY — /02CR IDLE-AGING ROOT CAUSE CONFIRMED — 02CR DUAL-SIGNAL IDLE FRESHNESS CANDIDATE VERIFIED + INTEGRITY SUCCESS + ISOLATED PREVIEW LIVE STALE-LINES PASS — PRODUCTION MAIN 9552407c5a5136371f9afd452b913c226329d7dc + WORKER c77bf453-c590-4cff-a55b-fd9c625b6d76 UNCHANGED — NEXT ACTION: SEPARATELY APPROVED BOUNDED WORKER + FRONTEND PRODUCTION PROMOTION`

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
