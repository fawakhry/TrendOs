# TrendOS Blackbox — PERF-CF-02CQ

Date: 2026-09-06
Checkpoint: `PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`
Branch: `agent/go-live-2026-09-01-integrity`
Opening branch head: `c9f2948ac97d241c2f99eb1ab093e0ad9c0092d6`
Status: **CANDIDATE PREPARED — CI PASS — INTEGRITY PASS — PRODUCTION REFRESH NOT EXECUTED — APPS SCRIPT DEPLOYMENT APPROVAL GATE**

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

The atomic stage validates complete row parity before promotion. `promote` accepts an explicit sheet allow-list and replaces only those production mirror sheets in one D1 batch.

### Existing exporters

`cloudflare-d1/D1_Orders_Live_Sync.gs` is bounded to the live Orders pair (`الأوردرات`, `بنود الأوردرات`) and does not refresh the four screen views.

`cloudflare-d1/D1_Full_Migration.gs` can copy all Sheets, but it is intentionally NOT selected for 02CQ because the checkpoint must not run a broad/full migration.

The safe helper layer in `D1_Full_Migration.gs` is reusable:

- `d1FullConfig_()` reads `D1_API_URL` / `D1_MIGRATION_SECRET` from Apps Script Script Properties.
- `d1FullSpreadsheet_()` opens the authoritative TrendOS spreadsheet.
- `d1FullHeaders_()` / `d1FullBuildRows_()` serialize bounded sheet rows.
- `d1FullPost_()` sends authenticated mirror import requests without logging the migration secret.
- `d1FullGet_()` supports mirror verification reads.

### Existing read-cutover probe

`cloudflare-d1/D1_Orders_Read_Cutover.gs` was inspected. It only performs Google-vs-D1 parity/freshness checks for Orders + Order Lines. It does not provide a four-view refresh route.

### Existing workflows

No current workflow was found that refreshes exactly the four screen-view mirrors.

An older Orders freshness workflow performs Worker deployment and rotates `EDGE_SESSION_SECRET`; that path is explicitly disallowed for 02CQ and was not used.

### Current canary mapping

`cloudflare-d1/src/edge-orders-read-v1-canary.mjs` maps:

- `service` → `واجهة خدمة العملاء`
- `print` → `واجهة الطباعة`
- `laser` → `واجهة الليزر`
- `press` → `واجهة المكبس`

The `__DEBT__` filter continues to return `apps-script-required` with Apps Script fallback.

## Read-only source probe

A temporary GitHub Actions workflow was created solely for a non-mutating source/boundary probe and removed after use.

Final successful probe:

- Run: `34000782787`
- Job: `101399154155`
- Result: `PERF_CF_02CQ_SOURCE_PROBE_PASS_NO_MUTATION`

### Pre/post production boundary

Both the qualified pre-probe boundary and final post-probe boundary held:

- Worker health: PASS
- D1 database health: PASS
- `pendingOutbox = 0`
- `cutover = false`
- `sheetsAuthoritative = true`
- 02CL reconciliation enabled: `false`
- `genericDrainEnabled = false`
- unauthenticated `/v1/edge/orders/page?...`: `401`

No production mutation occurred in the probe.

### Apps Script qualified-account source observations

No customer values were logged. Only authorization scope, counts, and field names were inspected.

- `print`: authorized, `8` live rows, identity schema includes `orderId`, `lineId`, `status`.
- `press`: authorized, `7` live rows, identity schema includes `orderId`, `lineId`, `status`.
- `service`: current qualification account is not authorized for that screen.
- `laser`: current qualification account is not authorized for that screen.

Therefore the employee canary token is valid for the authenticated print comparison, but it is not a complete source channel for refreshing all four mirrors.

### Current D1 four-view catalog state

All four production view mirrors were confirmed stale/header-only:

- `واجهة خدمة العملاء`: `sourceLastRow=1`, `sourceLastCol=19`, `rowCount=1`, `syncedAt=2026-08-29 15:49:13`, note `TrendOS full mirror V1`.
- `واجهة الطباعة`: `sourceLastRow=1`, `sourceLastCol=18`, `rowCount=1`, `syncedAt=2026-08-29 15:49:07`, note `TrendOS full mirror V1`.
- `واجهة الليزر`: `sourceLastRow=1`, `sourceLastCol=18`, `rowCount=1`, `syncedAt=2026-08-29 15:49:10`, note `TrendOS full mirror V1`.
- `واجهة المكبس`: `sourceLastRow=1`, `sourceLastCol=18`, `rowCount=1`, `syncedAt=2026-08-29 15:49:15`, note `TrendOS full mirror V1`.

## Authoritative Google spreadsheet confirmation

Connected Google Drive metadata confirmed the current authoritative spreadsheet:

- Title: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

The exact target tabs exist in the same live spreadsheet:

- `واجهة الطباعة` — sheetId `1036713661`
- `واجهة الليزر` — sheetId `485053070`
- `واجهة خدمة العملاء` — sheetId `1674675539`
- `واجهة المكبس` — sheetId `167996617`

Drive permission metadata confirms the spreadsheet is not public/anonymous-link readable. Sharing was not changed. No row payload was copied into GitHub.

## 02CQ bounded refresh candidate

Added:

- `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs`
- `tests/apps_script_d1_screen_view_mirror_refresh_02cq.test.mjs`
- `.github/workflows/trendos-02cq-screen-view-mirror-refresh-ci.yml`

Candidate characteristics:

1. Default OFF via Script Property `TRENDOS_PERF_CF_02CQ_SCREEN_VIEW_REFRESH_ENABLED`.
2. Exact four-sheet allow-list only.
3. Reuses existing Apps Script-held D1 API URL + migration secret; no secret is committed/logged.
4. Reads Sheets only; it does not mutate Google Sheets.
5. Atomic `stage` is performed per target while production readers continue seeing the old snapshot.
6. One atomic `promote` replaces all four target production mirrors only after all four staging copies are complete.
7. Refuses promotion when live Google `واجهة الطباعة` is itself header-only (`lastRow <= 1`).
8. Post-promote verification requires D1 `sourceLastRow`, `sourceLastCol`, and `rowCount` to match Google source stats and status/note to match the 02CQ run.
9. No Worker deployment.
10. No `d1 execute --file`.
11. No general/full migration.
12. No `EDGE_SESSION_SECRET` rotation.
13. No frontend read enable/cutover.
14. No 02CL reconciliation action.
15. No generic outbox drain.
16. No customer/phone/notes diagnostic logging.

Candidate code commit:

- `f78ec084b1282372c18428b01cd6aba0339dd849`

Final candidate/test checkpoint commit before temporary-probe cleanup:

- `711f2d214395a55b71400e82f1132730a40615b5`

## CI evidence

### 02CQ bounded mirror refresh CI

- Run: `34001050365`
- Job: `101399861784`
- Conclusion: **SUCCESS**
- Marker: `PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH_CANDIDATE_SAFETY_PASS`

The first CI attempt exposed only an overly broad static assertion in the test itself; no runtime/deployment action was involved. The assertion was corrected to inspect the executable refresh function body, after which the candidate gate passed.

### TrendOS Integrity V1

- Run: `34001050376`
- Job: `101399861836`
- Conclusion: **SUCCESS**

Notable passing gates include:

- composed Apps Script module syntax/collision test
- pre-deploy package safety gate
- existing Edge Orders / freshness / integrity suites
- accounting integrity suites

## Temporary workflow cleanup

The completed read-only source-probe workflow was removed after evidence collection.

Cleanup commit:

- `8328ca5934a3fdc1714f0754481da044fbcf5e22`

The durable candidate CI remains retained.

## Current execution gate

The repository did not contain an already deployed bounded four-view refresh route/workflow.

The safest source channel is the existing Apps Script environment because it already holds:

- access to the authoritative private Google spreadsheet,
- `D1_API_URL`,
- `D1_MIGRATION_SECRET` in Script Properties.

The new 02CQ candidate is therefore an Apps Script module. Executing it in production requires getting this module into the live Apps Script project first.

**Apps Script deployment is explicitly outside current authorization and requires clear user approval.**

Accordingly:

- the candidate was prepared and fully CI-qualified,
- it was NOT deployed to Apps Script,
- its default-OFF gate was NOT enabled,
- the four production D1 mirrors were NOT refreshed,
- the authenticated D1-vs-Apps-Script canary was NOT rerun yet because mirror freshness prerequisite is not yet satisfied.

This is a safety/authorization gate, not a technical failure.

## Required next bounded sequence after explicit Apps Script deployment approval

1. Perform pre-deploy production boundary read-only checks.
2. Deploy only the qualified 02CQ Apps Script module using the existing controlled Apps Script deployment mechanism; do not rotate any secret.
3. Confirm `TRENDOS_PERF_CF_02CQ_SCREEN_VIEW_REFRESH_ENABLED` remains OFF immediately after deployment.
4. In one dated bounded execution, enable only the 02CQ refresh gate, run the four-view atomic refresh once, then disable the gate again.
5. Confirm D1 catalog for `واجهة الطباعة` has `sourceLastRow > 1` and is no longer header-only.
6. Confirm four-view Google-vs-D1 source row/column parity from the module's safe verification result.
7. Run authenticated print canary and compare D1-vs-Apps-Script using identity-safe diagnostics (`Order ID / Line ID / status` only).
8. Preserve `__DEBT__` on Apps Script fallback.
9. Verify final production boundary:
   - Worker health OK,
   - Cloud Write OK,
   - `pendingOutbox=0`,
   - `cutover=false`,
   - `sheetsAuthoritative=true`,
   - 02CL OFF,
   - generic drain OFF,
   - unauth orders endpoint remains `401`,
   - frontend D1 read flag remains OFF.
10. Log final result and close or block 02CQ based on canary outcome.

## Current safety conclusion

**PASS — candidate preparation only. No production D1 write, no Apps Script deployment, no Worker deployment, no frontend cutover, no authority transfer, no 02CL reopen, no generic drain, and no secret rotation occurred in 02CQ.**
