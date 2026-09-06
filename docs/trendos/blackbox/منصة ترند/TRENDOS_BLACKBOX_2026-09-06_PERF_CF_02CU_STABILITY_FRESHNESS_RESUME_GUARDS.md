# PERF-CF-02CU — Stability / Freshness / Resume Guards

Date: 2026-09-06

## Scope

This checkpoint continues from the closed 02CT D1 frontend read cutover. It does not reopen 02CL and does not transfer authority from Google Sheets / Apps Script.

## Production performance recovery already user-validated

A production slowdown was traced to automatic/background frontend fan-out against Apps Script. The production hotfix kept heavy background work disabled and the user confirmed the platform returned to normal speed.

Standing production protections include:

- Customer Feedback auto scan: OFF.
- Go-Live Autopilot auto sweep: OFF.
- Trend Master loading bounded instead of unrestricted fan-out.
- Sheets / Apps Script remain authoritative.

## 02CU finding A — stale D1 Orders mirror

Read-only stability checks found that the D1 mirror for `بنود الأوردرات` had a stale heartbeat while other support mirrors were fresher. This created a risk that a fast D1 response could still be old.

### Safety response

A frontend freshness fail-safe was qualified and deployed:

- required D1 Orders mirrors older than `5 minutes` cause the Edge read to fail open to Apps Script;
- no retry loop or request storm is introduced;
- D1 remains enabled when fresh;
- Apps Script remains the authoritative fallback.

Production freshness hotfix commit:

`296fce971c52a7338a0ce1ded4c44b773af62d01`

No Apps Script deployment, Worker deployment, D1 migration, D1 business write, 02CL activation, generic drain, or secret rotation was performed by this hotfix.

The underlying Orders Live Sync trigger / heartbeat still requires a separate recovery/qualification step. The frontend gate is a safety net, not a substitute for restoring the sync heartbeat.

## 02CU finding B — refresh when returning to the platform

User reported that leaving/switching away from the TrendOS tab/page and returning caused the platform to refresh and load data again from the beginning.

### Root cause

Legacy V1921 frontend code in `app.js` defines `safeRefresh()` and wires it to:

- `document.visibilitychange` when the page becomes visible;
- `window.focus`;
- a `180000 ms` interval.

`safeRefresh()` programmatically clicks `#refreshBtn`. Therefore returning focus/visibility can trigger a full data refresh even though the browser page itself was not explicitly reloaded.

### Fix design

A narrow isolated module was added instead of rewriting the large legacy `app.js` block:

`trendos-resume-no-autorefresh-v1.js`

It suppresses only programmatic `#refreshBtn.click()` calls whose JavaScript stack comes from the legacy `safeRefresh` function.

It deliberately preserves:

- manual user refresh;
- non-`safeRefresh` programmatic refreshes required after successful writes/actions;
- login/session behavior;
- other buttons and navigation.

It also changes the legacy live-status text so the UI no longer claims that automatic 3-minute refresh-on-return is active.

## Candidate / regression evidence

Candidate module commit:

`ee0275ba86d8cea4770fc402f29431baeb68e45e`

Regression test commit:

`db61a16fd5d82ddba6000d0eea25627d4a1f0fd2`

Dedicated CI workflow commit:

`1c8c7731f63168925db03312c5a34736840792a6`

Results:

- TrendOS Resume No Auto Refresh V1 CI — Run `34027221511` — **SUCCESS**.
- TrendOS Integrity V1 — Run `34027221532` — **SUCCESS**.
- Later same-branch Integrity after the bounded deployment guard fix — Run `34027313471` — **SUCCESS**.

Regression assertions include:

- legacy `safeRefresh()` click is suppressed;
- normal/manual refresh remains functional;
- non-safeRefresh programmatic refresh remains functional;
- other buttons are untouched;
- no backend or D1 mutation is required.

## Production deployment

First bounded production workflow attempt:

- Run `34027268222` — **FAILED BEFORE COMMIT/PUSH**.
- Cause: scope guard used `git diff --name-only`, which omitted the new untracked JS file.
- Production mutation from that failed attempt: **NONE**.

Guard was corrected to include untracked files.

Successful bounded production workflow:

- Run `34027313379` — **SUCCESS**.
- exact pre-production main guard: `296fce971c52a7338a0ce1ded4c44b773af62d01`.
- scope limited to frontend files only.
- production commit:
  `20a56241da2919e31fc12cb5224d29ac18fdf4f3`
- commit message:
  `Stop automatic data refresh when returning to TrendOS`

GitHub Pages deployment:

- Run `34027347761` — **SUCCESS**.
- head SHA: `20a56241da2919e31fc12cb5224d29ac18fdf4f3`.
- bounded workflow verified the published `config.js` loader and published `trendos-resume-no-autorefresh-v1.js` marker.

Production frontend state now includes:

- `MATBAGY_DISABLE_RETURN_AUTO_REFRESH_V1 = true`;
- `trendos-resume-no-autorefresh-v1.js` loader;
- cache-bust tag for 02CU resume guard;
- existing 5-minute D1 mirror freshness gate retained.

## Safety boundary

This work did NOT:

- deploy Apps Script;
- deploy or rebuild the production Worker;
- write business data to D1;
- transfer authority from Sheets / Apps Script;
- enable 02CL / reconcile;
- enable generic drain;
- rotate `EDGE_SESSION_SECRET`;
- alter customer PII or log customer PII.

## Temporary workflow cleanup

The temporary production workflows used for the freshness hotfix and resume hotfix were removed from the working branch after successful production deployment. Durable regression CI remains.

## Exact stop point

`PERF-CF-02CU IN PROGRESS — PLATFORM SPEED USER-VALIDATED — D1 STALE-READ FAIL-SAFE LIVE — RETURN/FOCUS AUTO-REFRESH TECHNICAL PASS + PRODUCTION DEPLOYED — USER-VISIBLE RESUME VALIDATION PENDING — UNDERLYING ORDERS LIVE SYNC HEARTBEAT RECOVERY STILL PENDING`
