# GS-01 — Google Sheets-only Stabilization Checkpoint

Date: 2026-09-03 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Repository: `fawakhry/TrendOs`
Production workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

## Objective

Stabilize TrendOS on Google Sheets / Apps Script as the single operating runtime until Cloudflare D1 can accept writes again and the Cloudflare preview deployment passes end-to-end.

## Context

Cloudflare automation is installed and GitHub Actions can read the required secrets. The latest rerun reached Cloudflare and failed specifically at the D1 migration step because the account exceeded D1 free-tier daily row write limits.

Therefore, do not attempt production cutover to Cloudflare until D1 migrations and preview health verification pass.

## Safety status

- Google Sheets remains authoritative for production writes.
- Apps Script production routing remains unchanged by this checkpoint.
- Cloudflare cutover remains disabled.
- Cloud write lane remains prepared/default-off.
- No archive tabs, order rows, line rows, customer rows, WhatsApp messages, attendance logs, cleaning logs, invoice rows, or accounting data were deleted.
- A full workbook backup was created before this stabilization pass.

## Backup

Created Drive backup:

`BACKUP_TrendOS_Operations_SHEETS_ONLY_STABILIZATION_2026-09-03`

Backup spreadsheet ID:

`1JP9i3bcE2qPT2P9KZbmHZ_or8BcHfHmKCrA3HcIn_0Q`

## Spreadsheet changes applied

Updated `إعدادات المنصة الأساسية` with the following runtime keys:

- `RUNTIME_MODE = SHEETS_ONLY`
- `SHEETS_AUTHORITATIVE_FOR_WRITES = TRUE`
- `CLOUDFLARE_CUTOVER_ENABLED = FALSE`
- `CLOUD_WRITE_LANE_STATUS = PREPARED_DEFAULT_OFF`
- `D1_MIGRATION_STATUS = BLOCKED_BY_CLOUDFLARE_FREE_TIER_WRITE_LIMIT`
- `NEXT_CLOUD_ACTION = Rerun GitHub Actions after D1 limit reset or Workers Paid upgrade`

Updated `Go-Live 01-09` with a new row:

`Sheets-only stabilization / 03-09-2026 / PASS — SHEETS ONLY`

Reduced `إعدادات المنصة الأساسية` row count to 80 after adding the runtime keys.

## View stabilization

The following interface tabs were confirmed as header-only before stabilization and then rebuilt as bounded formula views, capped at row 500 so the platform stays on Sheets without using full-column ranges:

- `واجهة الطباعة`
- `واجهة الليزر`
- `واجهة خدمة العملاء`
- `واجهة المكبس`

Applied bounded formula views:

- `واجهة خدمة العملاء`: reads `الأوردرات!A2:S500` where Order ID is not blank.
- `واجهة المكبس`: reads `بنود الأوردرات!A2:R500` where `مكبس حراري = نعم` and status is not `تم التسليم`, `ملغى`, or `مكرر`.
- `واجهة الطباعة`: reads `بنود الأوردرات!A2:R500` where department matches print terms and status is active.
- `واجهة الليزر`: reads `بنود الأوردرات!A2:R500` where department matches laser terms and status is active.

Date/time formatting was applied on view date columns so formula spills do not display raw serial numbers.

## Verification

Verified after write:

- `إعدادات المنصة الأساسية` contains `RUNTIME_MODE = SHEETS_ONLY`.
- `SHEETS_AUTHORITATIVE_FOR_WRITES = TRUE`.
- `CLOUDFLARE_CUTOVER_ENABLED = FALSE`.
- `D1_MIGRATION_STATUS = BLOCKED_BY_CLOUDFLARE_FREE_TIER_WRITE_LIMIT`.
- `Go-Live 01-09` contains the Sheets-only stabilization row.
- `واجهة المكبس` now surfaces active press/heat-press rows instead of staying header-only.

## Current operational rule

Until Cloudflare D1 is unblocked and preview passes:

1. All production writes stay on Google Sheets / Apps Script.
2. No frontend cutover to Cloudflare.
3. No activation of Cloud Write Lane in production.
4. Cloudflare work continues as preview/staging only.
5. Rerun the Cloudflare pipeline only after D1 limit reset or Workers Paid upgrade.

## Known remaining Sheets-side blockers not mutated in this checkpoint

The live health sheet still contains historical/data-integrity issues such as invalid date-coerced Line IDs, duplicate attendance sessions, duplicate cleaning records, duplicate invoice drafts, and press session evidence gaps.

These are not safe to auto-delete during stabilization because they are historical operational/financial/audit records. They require a separate reconciliation pass that marks or supersedes records with an audit trail instead of silently deleting them.

## Next step

Continue hardening the Sheets runtime while waiting for Cloudflare D1 availability:

1. Keep Apps Script/Sheets as production path.
2. Avoid adding heavy full-column formulas.
3. Keep row counts bounded on configuration/interface tabs.
4. Create an audited reconciliation pass for duplicate Attendance/Cleaning/Invoice Draft records.
5. When D1 becomes available, rerun `TrendOS Cloudflare Auto Preview` and verify migrations, preview deployment, health, and cloud write default-off status.
