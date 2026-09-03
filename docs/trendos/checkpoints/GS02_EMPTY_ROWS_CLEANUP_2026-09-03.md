# GS-02 — Google Sheets Empty Rows Cleanup

Date: 2026-09-03 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Repository: `fawakhry/TrendOs`
Production workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

## Objective

Remove trailing empty rows from the live Google Sheets workbook while Cloudflare D1 remains blocked by the D1 free-tier row write limit.

## Safety

A full Drive backup was created before cleanup:

`BACKUP_TrendOS_Operations_BEFORE_EMPTY_ROWS_CLEANUP_2026-09-03_1727`

Backup spreadsheet ID:

`1ucpXGnIiIS0mqjmlVnh_0GFnxhy-iwh3qbQiBc8AP2U`

Cleanup was limited to trailing empty rows / sheet row count reduction. No order rows, line rows, archive rows, WhatsApp rows, attendance rows, accounting rows, or customer records were deleted.

## Method

For each tab cleaned, the first key column or a bounded visible range was checked to find the last occupied row. Then the sheet `gridProperties.rowCount` was reduced to the last required row. Google Sheets requires at least one non-frozen row after a frozen header, so some header-only tabs remain at 2 rows.

## Cleaned tabs

Examples of tabs trimmed to current data bounds:

- `إدارة - صحة النظام`: 1000 → 14 rows.
- `تقييم الموظفين اليومي`: 1000 → 4 rows.
- `عملاء منع التسليم بالمديونية`: 1000 → 2 rows.
- `إعدادات المنصة الأساسية`: 80 → 12 rows.
- `المستخدمين`: 220 → 7 rows.
- `الأوردرات`: 500 → 270 rows.
- `بنود الأوردرات`: 500 → 311 rows.
- `العملاء`: 588 → 238 rows.
- `المنتجات`: 500 → 2 rows.
- `سجل الدوام`: 500 → 39 rows.
- `نبض الحضور`: 500 → 64 rows.
- `إعدادات الدوام`: 200 → 26 rows.
- `تشغيل - النظافة اليومية`: 500 → 53 rows.
- `تشغيل - إعدادات المكبس`: 100 → 14 rows.
- `حسابات - الفواتير النهائية`: 500 → 4 rows.
- `حسابات - فواتير الأقسام`: 500 → 19 rows.
- `حسابات - الخامات`: 500 → 3 rows.
- `حسابات - سجل المراجعة`: 1000 → 6 rows.
- `حسابات - كشف العملاء والموردين`: 1000 → 8 rows.
- Marketplace/config/header-only tabs were reduced to their actual header/config bounds.

## Tabs intentionally not reduced

The following were checked and kept because their last visible rows still contain data or because they are operational formula views requiring spill capacity:

- `سجل تنبيهات التشغيل` — tail rows contain alert IDs.
- `سجل حركة الأوردرات` — tail rows contain 2026-09-03 activity data.
- `أرشيف الأوردرات` — tail rows contain archive order IDs.
- `أرشيف بنود الأوردرات` — tail rows contain archive order IDs.
- `AI_Orders_View` — tail rows contain order IDs.
- `واجهة الطباعة`, `واجهة الليزر`, `واجهة خدمة العملاء`, `واجهة المكبس` — formula views kept at 500 rows to avoid future spill failures while Sheets remains the production runtime.
- `سكريبت Apps Script` — code snapshot tab retained at its current code row count.

## Verification

After cleanup:

- `واجهة المكبس` still displays active heat-press rows.
- `واجهة خدمة العملاء` still displays order rows.
- Date formatting on formula views still renders readable date/time values.
- Google Sheets / Apps Script remains production authoritative.
- Cloudflare cutover remains disabled.

## Next step

Continue Sheets-only operation until Cloudflare D1 is available. When D1 is unblocked, rerun the automated Cloudflare preview pipeline and continue the staged migration.