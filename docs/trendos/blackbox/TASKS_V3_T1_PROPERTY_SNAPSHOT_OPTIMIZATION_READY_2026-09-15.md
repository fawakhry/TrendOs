# Tasks V3 T1 — Property Snapshot Optimization Ready — 2026-09-15

## Result

**ISOLATED T1 OPTIMIZATION SOURCE READY / NOT DEPLOYED**

## Basis

Authoritative T1 diagnostic run `34958340960` completed 30/30 successful health calls with:

- Worker/upstream p50: 1,349 ms
- Worker/upstream p95: 2,021 ms
- Total instrumented bridge p95: 973 ms
- Script Properties p95: 211 ms
- `SpreadsheetApp.openById` p95: 794 ms
- Sheet lookup p95: 16 ms

T1 therefore remains FAIL by 21 ms against the <= 2,000 ms target, although stability passed.

## Optimization

Commit: `8c34ccaaef10d5e4fd1977a62421b21bce8bd95c`

Only file changed:

`tasks-v3-bridge-readonly.gs`

Diff from checkpoint `cff245d4563acf088764370e3939702953aaa2bb`:

- additions: 27
- deletions: 7
- one modified file only

The optimization is intentionally limited to `health` diagnostic flow:

1. After protocol/timestamp/identity validation, fetch Script Properties once with `getProperties()`.
2. Use that same request-scoped snapshot for `TASKS_V3_SHARED_SECRET` during HMAC verification.
3. Pass the verified snapshot into the health path.
4. Reuse its `TASKS_V3_SPREADSHEET_ID` instead of issuing a second Script Properties read.
5. Non-health read-only operations retain their prior property-read behavior.

No secret is logged, returned, persisted in source, or moved to another store.

## Unchanged contracts

- Protocol unchanged: `TRENDOS_TASKS_V3_READONLY_1`
- HMAC algorithm/validation unchanged
- Assertion max age unchanged
- Allowed operations unchanged
- Role capabilities unchanged
- Read-only behavior unchanged
- Preview spreadsheet authority unchanged
- Apps Script Web App identity/settings unchanged by source preparation
- Worker timeout unchanged
- No V2 fallback
- No mutation route added

## Deployment status

- Standalone T1 Apps Script deployment: **NOT UPDATED WITH THIS OPTIMIZATION YET**
- Main TrendOS Apps Script: **UNTOUCHED**
- Production Worker: **UNTOUCHED**
- Active Preview promotion: **NO**
- Secrets changed/rotated: **NO**
- Production spreadsheet mutation: **NO**
- `claimNext`: **ZERO**
- `completeTask`: **ZERO**
- T2: **LOCKED / NOT STARTED**

## Exact next step

Copy the branch version of `tasks-v3-bridge-readonly.gs` at commit `8c34ccaaef10d5e4fd1977a62421b21bce8bd95c` into the existing standalone T1 Apps Script `Code.gs`, save it, then update the SAME existing Web App deployment using `Manage deployments -> Edit -> New version -> Deploy`, preserving all deployment settings and Script Properties.

After deployment, rerun the same 30-call versioned Preview health qualification. T1 may pass only if server-side p95 <= 2,000 ms with stability. Do not start T2 automatically.
