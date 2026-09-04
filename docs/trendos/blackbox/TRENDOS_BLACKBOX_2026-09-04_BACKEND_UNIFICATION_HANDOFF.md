# TrendOS Black Box — Backend Unification Handoff

Date: 2026-09-04 Africa/Cairo
User local time captured in chat context: 05:22 Africa/Cairo
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Why this Black Box entry exists

The owner asked to "throw all information into the black box in GitHub" after reviewing the current TrendOS state, the live Google Sheet, the project memory, and prepared Apps Script repair files.

This entry is a handoff checkpoint for the next execution session. It must be read before continuing backend consolidation, Apps Script cleanup, or Cloudflare/D1 migration.

## Canonical sources read or used in this chat

- `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
- `docs/trendos/TRENDOS_EXECUTION_LEDGER.md` as the canonical execution history and current stopping-point ledger.
- `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md`
- `docs/trendos/TRENDOS_CORE_P0_REMEDIATION_PLAN.md`
- `trendos-integrity-v1.package.json`
- `docs/trendos/checkpoints/GS05_BACKEND_CONSOLIDATION_REVIEW_2026-09-04.md`
- live Google Sheet metadata/ranges for `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.

## Current production position

Production is still Google Sheets + Google Apps Script.

Known production workbook:

- Name: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

Known production settings observed in the Sheet during this chat:

- `RUNTIME_MODE = SHEETS_ONLY`
- `SHEETS_AUTHORITATIVE_FOR_WRITES = TRUE`
- `CLOUDFLARE_CUTOVER_ENABLED = FALSE`
- `CLOUD_WRITE_LANE_STATUS = PREPARED_DEFAULT_OFF`
- `D1_MIGRATION_STATUS = BLOCKED_BY_CLOUDFLARE_FREE_TIER_WRITE_LIMIT`
- `SERVER_TIMEOUT_HOTFIX_STATUS = PATCH_PREPARED_REQUIRES_APPS_SCRIPT_DEPLOY`

No Cloudflare production cutover is active.

## What project memory says

The project memory says the current formal stage is:

`PHASE 1 — TRENDOS CORE + CLOUD`

The current exact memory stopping point is:

`CORE-P0 REMEDIATION — RP-06-PREVIEW-RERUN FAIL ON 3536-01; VERSION 146 ACTIVE AND UNCHANGED; USER-PAUSED BEFORE ANY REGISTRY WRITE, RECONCILIATION, DEPLOYMENT, OR BUSINESS-FAMILY ACTIVATION.`

Meaning:

- Apps Script Version 146 is the current baseline.
- Master + HEALTH were active according to memory.
- Business families remain OFF:
  - ORDER_LINE
  - ATTENDANCE_CLEANING
  - PRESS
  - INVOICE
  - WHATSAPP
  - OPS
  - AUTOMATION
- Fast Auth remains OFF/absent.
- Registry write did not happen.
- ORDER_LINE activation did not happen.
- Business-family activation did not happen.
- The lane was paused after read-only preview failed around `3536-01`.

## Current open Core P0 health observations from the live Sheet

The live `إدارة - صحة النظام` sheet still showed:

- `INVALID_LINE_IDS = 229 FAIL`
- `DUPLICATE_ATTENDANCE_SESSIONS = 6 FAIL`
- `DUPLICATE_CLEANING_RECORDS = 16 FAIL`
- `DUPLICATE_INVOICE_DRAFTS = 3 FAIL`
- `PRESS_SOURCE_VIEW_MISMATCH = 1 FAIL`
- `PRESS_COMPLETED_WITHOUT_SESSION = 3 FAIL`
- `OPEN_CORE_P0_BLOCKERS = 6 FAIL`

Interpretation:

- These values do not prove the GitHub repair code is useless.
- They also do not prove production is fixed.
- The registry write and final revised-reader verification have not completed.
- Treat the current Health output as a live blocker until a new read-only reconciliation and runtime recheck prove otherwise.

## Root cause and performance context

The current platform is heavy because the frontend talks to Google Apps Script, and Apps Script reads/writes directly against one large Google Sheet workbook with many tabs.

Previously observed/recorded hot paths include:

- heavy full-sheet reads such as `getDataRange().getValues()`;
- `getRows_` and `getDashboard_` causing read pressure;
- save/update path timeout where the first click may change data but frontend times out before success;
- frontend behavior requiring a second save click in some cases;
- weak or insufficient cache use compared to workload size.

Prepared but not deployed performance patches:

- `apps-script/patches/TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs`
- `apps-script/patches/SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs`

Decision: do not keep these as permanent append-only patches in the final backend. Integrate their logic natively into the unified candidate.

## Backend consolidation decision

The owner wants this to become the last clean Apps Script line/version before continuing toward D1.

Decision recorded in GS05:

Do not blindly paste every repair file into Apps Script and delete old code.

Correct path:

1. Build one unified Apps Script backend candidate in GitHub.
2. Base it on the current Version 146 lineage and the reviewed Integrity package.
3. Integrate timeout/read and save/double-click fixes natively.
4. Keep feature flags default OFF except the already-approved HEALTH state.
5. Do not permanently include the one-time registry writer.
6. Do not include Fast Auth V2.5 in the first consolidation.
7. Do not overwrite production using GitHub `Code.gs`.
8. Test the candidate before Apps Script Head install/deploy.
9. Only after candidate passes, perform user-assisted Apps Script install/deploy if no direct Apps Script connector exists.
10. Clean old script clutter only after the unified version is verified live.
11. Continue Cloudflare/D1 only after Apps Script correctness is stable.

## Files that should merge into the unified backend candidate

The stronger source for exact Integrity package membership is `trendos-integrity-v1.package.json`, not the older 10-file human manifest.

Merge these 12 core files into the unified candidate:

1. `trendos-integrity-v1.gs`
2. `trendos-integrity-runtime-tools-v1.gs`
3. `trendos-core-p0-remediation-v1.gs`
4. `trendos-order-line-integrity-v1.gs`
5. `trendos-attendance-cleaning-integrity-v1.gs`
6. `trendos-press-integrity-v1.gs`
7. `trendos-invoice-integrity-v1.gs`
8. `trendos-whatsapp-integrity-v1.gs`
9. `trendos-handover-ops-integrity-v1.gs`
10. `trendos-andon-integrity-v1.gs`
11. `trendos-integrity-dashboard-v1.gs`
12. `trendos-integrity-router-v1.gs`

## Files that should not become permanent production code

Temporary only:

- `trendos-core-p0-registry-writer-v1.gs`

Reason: one-time guarded registry writer. Use for read-only preview and approved registry write only, then disable/remove/archive from production.

Defer:

- `D1_Fast_Auth_V2_5_Safe.gs`

Reason: optional performance lane. Keep out of first consolidation until lifecycle invalidation is verified.

Archive / do not deploy:

- `apps-script/patches/TIMEOUT_HOTFIX_V1_APPEND_ONLY.gs`

Reason: superseded by V2 and may be unsafe compared with V2.

Use logic, not permanent append-only block:

- `apps-script/patches/TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs`
- `apps-script/patches/SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs`

Forbidden as production overwrite/replacement:

- `Code.gs`
- `D1_Orders_Fast_V2_4.gs`
- `customer-manager-backend-v1932.gs`
- `customer-feedback-backend-v1.gs`
- `attendance-backend-v1.gs`
- `attendance-clockin-backend-v1.gs`
- `cleaning-backend-v1.gs`
- `press-control-backend-v1.gs`

These may be used as references/diffs only, not as blind replacements over live consolidated code.

## Direct access boundary confirmed

Available in this chat:

- GitHub read/write.
- Google Sheets metadata/range reads.
- GitHub checkpoint creation.

Not available in this chat:

- direct Apps Script project editor connector.
- direct Apps Script deployment action.
- direct Cloudflare dashboard connector.

Therefore, GitHub candidate files and documentation can be created here; live Apps Script install/deploy still needs a controlled user-assisted step unless a direct Apps Script deployment path becomes available.

## Immediate next technical action

Create a unified Apps Script candidate file in GitHub, for example:

`build/apps-script/TrendOS_BACKEND_UNIFIED_V147_CANDIDATE.gs`

Candidate must include:

- Version 146-compatible production lineage;
- native bounded `getRows_` behavior;
- native cached `getDashboard_` behavior;
- native fast `updateLine_` behavior with `lineId`-first source-row resolution;
- the 12 Integrity core files;
- router fallback when flags are OFF;
- no permanent registry writer;
- no Fast Auth V2.5 first;
- no forbidden old standalone modules;
- clear header naming it as a candidate, not production.

## Required tests before Apps Script installation

Add or run tests for:

- composed Apps Script syntax/collision;
- no duplicate dangerous top-level overrides unless intentional;
- `getRows_` bounded read behavior;
- `getDashboard_` bounded/cache behavior;
- `updateLine_` fast save behavior and `lineId`-first lookup;
- all business family flags remain OFF by default;
- router falls back to legacy when flags are OFF;
- forbidden files not included;
- registry writer excluded from final candidate;
- D1 cutover remains disabled.

## Required reconciliation before registry write

Before registry write, reconcile the drift around:

`PRESS_COMPLETED_WITHOUT_SESSION / 3536-01`

Known drift from memory:

- `3536-01` had two source rows instead of one during the failed preview.
- evidence hash changed.
- it was no longer eligible as the same Press completion.

Do not edit those rows blindly.
Do not regenerate the 34-row registry plan automatically without read-only evidence.
Do not invent Press session links.

## Operating rule for next assistant/session

Read this file plus these files before continuing:

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_EXECUTION_LEDGER.md`
3. `docs/trendos/checkpoints/GS05_BACKEND_CONSOLIDATION_REVIEW_2026-09-04.md`
4. `docs/trendos/TRENDOS_CORE_P0_REMEDIATION_PLAN.md`
5. `trendos-integrity-v1.package.json`
6. `docs/trendos/TRENDOS_PENDING_MODIFICATIONS.md`

Do not start from scratch.
Do not run a new inventory unless explicitly required by a changed source.
Do not delete production code or Sheet data before backup, exact evidence, and rollback.
Do not claim GitHub CI PASS equals live production PASS.

## Final current answer

The next correct lane is:

`Version 146 + Integrity 12-core package + native V2/V3 performance fixes -> unified Apps Script candidate -> tests -> controlled Apps Script install/deploy -> live health/save/screen verification -> cleanup old script clutter -> D1 staged migration.`
