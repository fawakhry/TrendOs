# TrendOS Main Platform — Canonical Project Locator

Status: **AUTHORITATIVE PROJECT IDENTITY — READ THIS BEFORE ANY TRENDOS EXECUTION**
Last verified: 2026-09-10

## 1. Production Google Sheet — canonical workbook

- Name: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Google Sheets URL: `https://docs.google.com/spreadsheets/d/1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI/edit`
- Role: current production operations workbook / Google-side operational source during the Cloudflare migration.
- Current authority rule: Apps Script / Google Sheets remain authoritative for business writes until an explicitly approved Cloudflare/D1 cutover changes that authority.

### Important workbook disambiguation

Do **not** confuse the production workbook above with any file whose name starts with or contains:

- `BACKUP_`
- `STAGING_`
- `CLOUD_WRITE_`
- performance-fix backups
- cleanup backups
- any copied/rehearsal workbook

Those are not the canonical production workbook unless a later explicit blackbox authority-transfer record says otherwise.

The workbook tab named `سكريبت Apps Script` is also **not** authoritative for the current live Apps Script Head. It is a stored/stale script snapshot and must not be used for byte-exact live source ownership, collision checks, deployment state, or Script Property state.

## 2. Bound production Apps Script project

- Apps Script Project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`
- Bound production workbook: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Direct live-project inventory was confirmed by ChatGPT Work on 2026-09-10.
- Current single owner of `trendosV1932TryRoute_`: `Code.gs`, line 11868 at the 2026-09-10 Runtime Phase 0 inspection.
- Do not add standalone `v1932-router.gs` while that ownership remains true, because it would create a duplicate global symbol.
- Do not overwrite production `Code.gs` wholesale from the GitHub copy; any later approved change must patch only the exact verified live owner/function boundary.

### Live Apps Script file inventory captured 2026-09-10

`appsscript.json`
`Code.gs`
`AI_Webhook.gs.gs`
`OpenAI_Setup.gs`
`D1_Migration.gs`
`D1_Full_Migration.gs`
`D1_Orders_Live_Sync.gs`
`D1_Orders_Read_Cutover.gs.gs`
`D1_Orders_Primary_Read.gs.gs`
`D1_Dashboard_Primary_Read.gs.gs`
`D1_Orders_Fast_V2.gs.gs`
`Set_D1_URL.gs.gs`
`trendos-integrity-v1.gs`
`trendos-integrity-runtime-tools-v1.gs`
`trendos-attendance-cleaning-integrity-v1.gs`
`trendos-whatsapp-integrity-v1.gs`
`trendos-handover-ops-integrity-v1.gs`
`trendos-andon-integrity-v1.gs`
`trendos-core-p0-remediation-v1.gs`
`trendos-order-line-integrity-v1.gs`
`trendos-press-integrity-v1.gs`
`trendos-invoice-integrity-v1.gs`
`trendos-integrity-dashboard-v1.gs`
`trendos-integrity-router-v1.gs`
`trendos-core-p0-registry-writer-v1.gs`
`D1_Orders_Live_Sync_V2.gs`
`D1_Orders_Low_Usage_Control_V1.gs`
`D1_Orders_Low_Usage_Heartbeat_V1.gs`
`CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs`
`TEMP_SET_DRYRUN_SECRET.gs`
`CLOUD_WRITE_RECONCILE_AUTH_SELFTEST_V1.gs`
`CLOUD_WRITE_STAGING_PULL_DRYRUN_V1.gs`
`CLOUD_WRITE_RECONCILE_REHEARSAL_LIVE_PACKAGE_V1.gs`
`CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1.gs.gs`
`SETUP_02CL_SECRET.gs`
`TEMP_COPY_02CL_RECONCILE_SECRET.gs`
`TEMP_ENABLE_02CL_APPS_GATE.gs`
`D1_Screen_View_Mirror_Refresh_02CQ.gs`
`D1_Operational_Enrichment_Live_Sync_02CR.gs`
`trend-master-panels-v1931.gs`
`TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs`

This file list is a verified 2026-09-10 inventory snapshot, not a permanent guarantee. Any runtime mutation must re-inventory the live project first if newer evidence may have changed it.

## 3. GitHub source of truth for migration work

- Repository: `fawakhry/TrendOs`
- Working branch: `agent/go-live-2026-09-01-integrity`
- Blackbox root: `docs/trendos/blackbox/منصة ترند/`
- Canonical state file: `01_CURRENT_STATE.md`
- Canonical index: `00_INDEX.md`
- Canonical project locator: `00_PROJECT_LOCATOR.md`

### Required startup order for any new chat/session

For TrendOS work, read in this order before acting:

1. `00_PROJECT_LOCATOR.md`
2. `00_INDEX.md`
3. `01_CURRENT_STATE.md`
4. the exact current checkpoint records referenced by `01_CURRENT_STATE.md`

Do not start a new inventory/design from memory when these records are available.

## 4. Current architecture / migration direction

Target direction is full migration from Google to Cloudflare, not continued Google re-engineering as the final architecture.

Controlled sequence:

`Google current runtime → minimum safety/remediation → Cloudflare Workers/D1/R2 parity → controlled family-by-family write cutover → Google write decommission`

Current rules until explicit cutover:

- Google Sheets / Apps Script authoritative for writes.
- Eligible Orders reads may be D1-first with Apps Script fallback according to the current blackbox state.
- `__DEBT__` remains Apps Script unless a later authority record changes it.
- D1 is not yet authoritative for business writes.
- No uncontrolled bidirectional writes.
- No family activation, deployment, property change, or authority transfer without the current checkpoint's explicit approval boundary.

## 5. Current RP-07 runtime identity facts

These are current-state facts as of the 2026-09-10 direct Runtime Phase 0 inspection and must be re-read from `01_CURRENT_STATE.md` before action:

- `TRENDOS_INTEGRITY_V1_ENABLED=true`
- `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED=true`
- reported business-family flags=false
- live Integrity Router version: `TRENDOS_INTEGRITY_ROUTER_V1_20260830`
- live Router/Press/Invoice blobs differ from the qualified RP-07 candidate
- RP-07 containment functions are absent from live Head
- Phase 1 is not safe until Runtime Phase 0B is completed and reviewed

These mutable runtime facts are summarized here only for orientation. `01_CURRENT_STATE.md` and the newest checkpoint record always supersede this section if later evidence differs.

## 6. Anti-confusion rules for future chats

Any future assistant/session must:

- use the exact production Spreadsheet ID above when the user says “الشيت الإنتاجي”, “الشيت اللي شغالين عليه”, or “مشروع TrendOS الحالي” unless the user explicitly supplies a newer authority-transfer checkpoint;
- use the exact Apps Script Project ID above for the bound production script project;
- use `agent/go-live-2026-09-01-integrity` as the working branch unless `01_CURRENT_STATE.md` explicitly changes the branch;
- never substitute a backup/staging workbook for production;
- never treat the workbook tab `سكريبت Apps Script` as live Head authority;
- never assume GitHub `Code.gs` equals live Apps Script `Code.gs` without exact verification;
- never add a duplicate router/function because a similarly named GitHub file exists;
- stop fail-closed on any identity mismatch before mutation.

## 7. Identity change rule

If the production workbook, Apps Script project, repository, branch, or write authority changes in the future, update **this file first** in the same approved checkpoint and record:

- old identity;
- new identity;
- reason;
- effective timestamp;
- approving checkpoint;
- rollback target.

Until such a record exists, the identities above remain the canonical TrendOS project locator.
