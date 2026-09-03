# GS-05 — Backend Consolidation Review

Date: 2026-09-04 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Repository: `fawakhry/TrendOs`
Production workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

## Owner objective

The owner wants to review the live Google Sheet and all prepared repair files, decide which files should be merged into one clean production Apps Script backend, remove unnecessary script clutter, keep the platform working, and then continue migration/upload to Cloudflare D1.

Arabic owner intent summary:

- Review the Sheet and repair files.
- Decide each file's condition: merge / defer / archive / D1.
- Activate the useful repair code safely.
- Remove unnecessary Apps Script clutter after verification.
- End with one working Apps Script backend, then move the platform toward D1.

## Access verified in this chat

Available:

- Google Sheets metadata/read access to the production workbook.
- GitHub read/write access to the working branch.
- Ability to create checkpoint files in GitHub.

Not available:

- Direct Apps Script source-project editor connector.
- Direct Apps Script deployment action.
- Direct Cloudflare dashboard connector.

Therefore: code can be reviewed and prepared in GitHub, and Sheet data can be audited through Google Drive, but live Apps Script consolidation/deploy still requires controlled user-assisted editor/deploy steps unless a direct Apps Script deployment path is later added.

## Live Sheet state observed

Current production settings sheet shows:

- `RUNTIME_MODE = SHEETS_ONLY`
- `SHEETS_AUTHORITATIVE_FOR_WRITES = TRUE`
- `CLOUDFLARE_CUTOVER_ENABLED = FALSE`
- `CLOUD_WRITE_LANE_STATUS = PREPARED_DEFAULT_OFF`
- `D1_MIGRATION_STATUS = BLOCKED_BY_CLOUDFLARE_FREE_TIER_WRITE_LIMIT`
- `SERVER_TIMEOUT_HOTFIX_STATUS = PATCH_PREPARED_REQUIRES_APPS_SCRIPT_DEPLOY`

Current health sheet still reports these open Core P0 blockers:

- `INVALID_LINE_IDS = 229 FAIL`
- `DUPLICATE_ATTENDANCE_SESSIONS = 6 FAIL`
- `DUPLICATE_CLEANING_RECORDS = 16 FAIL`
- `DUPLICATE_INVOICE_DRAFTS = 3 FAIL`
- `PRESS_SOURCE_VIEW_MISMATCH = 1 FAIL`
- `PRESS_COMPLETED_WITHOUT_SESSION = 3 FAIL`
- `OPEN_CORE_P0_BLOCKERS = 6 FAIL`

Important interpretation:

- These health values may be stale relative to prepared remediation code because the registry write and revised reader deployment did not complete.
- Do not assume the repair files are ineffective solely because the health sheet still shows FAIL.
- Do not mark them as solved until the live registry/reader/health recheck passes.

## Live script snapshot observed

The `سكريبت Apps Script` tab contains a large V1932-era code snapshot and visible `trendosV1932TryRoute_` content.

Search observations:

- `V1932` is present in the Sheet script snapshot.
- `TRENDOS_INTEGRITY` was not found in the Sheet script snapshot searched.
- `TRENDOS_TIMEOUT_HOTFIX_V2` was not found in the Sheet script snapshot searched.
- `TRENDOS_SAVE_TIMEOUT_HOTFIX_V3` was not found in the Sheet script snapshot searched.

Important interpretation:

- The Sheet script snapshot is useful evidence, but it is not guaranteed to be the current live Apps Script editor source.
- The project memory says Version 146 has Integrity R4 deployed with Master+HEALTH only ON.
- The Sheet snapshot may be older/incomplete or not synchronized after Apps Script deployments.
- The next live verification must come from the Apps Script editor or runtime checks, not from the Sheet snapshot alone.

## GitHub repair package evidence

`trendos-integrity-v1.package.json` currently classifies the Integrity package as `PREPARED_NOT_APPROVED_FOR_PRODUCTION` and lists 12 core Apps Script files plus optional Fast Auth and frontend shim.

Core files listed there:

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

Optional performance file:

- `D1_Fast_Auth_V2_5_Safe.gs`

Frontend contract file:

- `customer-manager-send-integrity-v1.js`

Forbidden replacement files:

- `Code.gs`
- `D1_Orders_Fast_V2_4.gs`
- `customer-manager-backend-v1932.gs`
- `customer-feedback-backend-v1.gs`
- `attendance-backend-v1.gs`
- `attendance-clockin-backend-v1.gs`
- `cleaning-backend-v1.gs`
- `press-control-backend-v1.gs`

## Conflict / inconsistency found

The human-readable deployment manifest lists 10 core installation files, while the machine-readable package lists 12 core files.

Files present in the package but missing from the 10-file manifest order:

- `trendos-integrity-runtime-tools-v1.gs`
- `trendos-core-p0-remediation-v1.gs`

Decision:

- Treat `trendos-integrity-v1.package.json` as the stronger source for exact package composition.
- Update/replace the human-readable deployment instructions before any next deployment so they match the 12-file package.
- Do not perform a live Apps Script merge from the older 10-file manifest alone.

## File-by-file consolidation decision

| File | Role | Decision | Reason / condition |
|---|---|---|---|
| `trendos-integrity-v1.gs` | Shared foundation: normalization, locks, idempotency, Cairo calendar | MERGE into unified backend | Required base module. Install/keep guarded by master flag. |
| `trendos-integrity-runtime-tools-v1.gs` | Public/manual runtime checks | MERGE for staging and admin diagnostics; later restrict/remove from production if not needed | Useful for dependency/health verification. Must not expose unsafe public tools. |
| `trendos-core-p0-remediation-v1.gs` | Reader/remediation helper for Core P0 health interpretation | MERGE | Required to make health understand legacy Line ID display recovery and baseline remediation. |
| `trendos-order-line-integrity-v1.gs` | Order/Line mutation safety | MERGE but family flag OFF initially | First business family target after health/registry pass. |
| `trendos-attendance-cleaning-integrity-v1.gs` | Attendance/Cleaning duplicate prevention | MERGE but family flag OFF initially | Must not rewrite historical rows; registry/baseline must pass first. |
| `trendos-press-integrity-v1.gs` | Press session/queue integrity | MERGE but family flag OFF initially | Press health has special consumer-contract decision; no fake view equality. |
| `trendos-invoice-integrity-v1.gs` | Invoice draft idempotency/canonical draft handling | MERGE but family flag OFF initially | Active duplicate drafts require registry mapping before full PASS. |
| `trendos-whatsapp-integrity-v1.gs` | WhatsApp exact-once backend | MERGE only with matching frontend contract and WHATSAPP flag OFF initially | Avoid duplicate Meta mutation path. |
| `trendos-handover-ops-integrity-v1.gs` | Handover/OPS idempotency | MERGE but family flag OFF initially | Safe behind OPS/AUTOMATION flags. |
| `trendos-andon-integrity-v1.gs` | ANDON event integrity | MERGE but family flag OFF initially | Safe behind OPS/ANDON routing. |
| `trendos-integrity-dashboard-v1.gs` | Health dashboard / blocker visibility | MERGE | Required for post-merge health verification. |
| `trendos-integrity-router-v1.gs` | Feature-flagged router | MERGE | Required to avoid big-bang activation and keep legacy fallback. |
| `trendos-core-p0-registry-writer-v1.gs` | One-time guarded registry writer | DO NOT permanently merge into production backend | Temporary operator tool only. Use for read-only preview and approved 34-row registry write, then remove/disable/archive. |
| `D1_Fast_Auth_V2_5_Safe.gs` | Optional auth performance cache | DEFER | Keep out of first consolidation until cache invalidation lifecycle verified. |
| `customer-manager-send-integrity-v1.js` | Frontend stable clientRequestId shim | MERGE with WhatsApp work only | Must be paired with backend WhatsApp exact-once route. |
| `apps-script/patches/TIMEOUT_HOTFIX_V1_APPEND_ONLY.gs` | First timeout patch | ARCHIVE / DO NOT DEPLOY | Superseded by V2 safe patch. |
| `apps-script/patches/TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs` | Screen read timeout patch | DO NOT paste as final form; integrate logic into unified backend | Useful now as emergency patch; final backend should have native bounded reads/cache, not append-only overrides. |
| `apps-script/patches/SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs` | Save/double-click timeout patch | DO NOT paste as final form; integrate logic into unified backend | Useful now as emergency patch; final backend should have native fast `updateLine_` implementation. |
| GitHub `Code.gs` | Old/large consolidated source | DO NOT overwrite live production with it | Explicitly forbidden by package and project memory. Use only for diff/reference. |
| `customer-manager-backend-v1932.gs` and old standalone backend files | Older module lineage | ARCHIVE / reference only | Package marks them forbidden as replacement files on top of live consolidated Code lineage. |
| `cloudflare-d1/*` | D1 migration, mirror, edge gateway, write lane | KEEP for D1 lane after Apps Script consolidation | Not a direct Apps Script cleanup target. Continue only after D1 limit/preview pipeline passes. |

## Recommended consolidation strategy

Target is not to paste every file forever into Apps Script. Target is one coherent backend lineage.

### Stage A — Build unified Apps Script source in GitHub only

Create a new consolidated source artifact, for example:

`build/apps-script/TrendOS_BACKEND_UNIFIED_V147_CANDIDATE.gs`

It should contain:

1. current live production source capture;
2. integrated bounded read/cache behavior from Timeout V2;
3. integrated fast save behavior from Save V3;
4. Integrity 12-file core package;
5. feature flags default OFF except HEALTH as approved;
6. no registry writer as permanent code;
7. no Fast Auth V2.5 in first build;
8. no forbidden old standalone modules as replacements.

### Stage B — Run static tests on GitHub

Run:

- Integrity workflow tests.
- composition/collision test.
- pre-deploy package safety gate.
- timeout/save behavior tests if added.

### Stage C — Apps Script staging/head install

Requires user-assisted Apps Script editor unless a deployment connector is added.

- Backup/capture current Apps Script source.
- Install the unified candidate.
- Save/parse/reload.
- Run dependency health.
- Confirm flags are default-off except known HEALTH state.
- No deployment yet.

### Stage D — Runtime preview and registry decision

- Run `trendosCoreP0RegistryPreviewV1` read-only.
- Reconcile the current failure around `3536-01` before regenerating or writing any 34-row registry plan.
- Do not write the registry until the preview passes and receives explicit approval.

### Stage E — Controlled production deployment

- Deploy new Apps Script version only after Stage C/D pass.
- Verify login, dashboard, service/print/laser/press screens, save action, health, and trigger count.
- Keep all business family flags OFF except explicitly approved ones.

### Stage F — Cleanup Apps Script clutter

Only after the unified deployed version passes live tests:

- remove superseded append-only hotfix blocks if they were ever pasted separately;
- remove/disable the registry writer from production after it is no longer needed;
- archive old standalone modules instead of deleting audit history;
- keep one clean backend source plus controlled diagnostic helpers.

### Stage G — D1 migration continuation

After Apps Script is clean and verified:

1. Rerun Cloudflare preview pipeline after D1 free-tier write limit resets or paid plan is available.
2. Apply migrations.
3. Verify D1 mirror/read parity.
4. Move read-heavy paths first.
5. Keep Sheets authoritative for writes until write reconciliation/outbox is proven.
6. Only then plan write cutover.

## Current answer to owner question

Do not blindly activate all repair files and then delete script files today.

Correct decision:

- Merge the 12 Integrity core files into a unified backend candidate.
- Convert V2/V3 hotfix logic into native backend logic, not permanent append-only patches.
- Keep registry writer temporary only.
- Defer Fast Auth V2.5.
- Archive forbidden old standalone files.
- Keep Cloudflare/D1 work separate until the unified Apps Script backend is green.

## Immediate next technical action

Create the unified candidate source/package in GitHub and add tests for:

- no duplicate top-level function collision;
- `getRows_` bounded read/cache behavior;
- `getDashboard_` bounded/cache behavior;
- `updateLine_` fast save behavior and lineId-first resolution;
- all Integrity family flags default OFF;
- router returns legacy fallback when flags are OFF;
- no forbidden old modules included;
- registry writer excluded from final production package.

No Apps Script live deployment or script deletion is included in this checkpoint.
