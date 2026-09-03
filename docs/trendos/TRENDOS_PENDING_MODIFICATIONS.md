# TrendOS Pending Modifications

Last updated: 2026-09-04 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Repository: `fawakhry/TrendOs`

This file records deferred TrendOS production changes that are prepared or diagnosed but intentionally not applied yet.

---

## PENDING-2026-09-04-001 — Server timeout + double-save hotfix

Status: `DEFERRED_BY_OWNER`
Priority: `HIGH`
Area: `Google Apps Script / Google Sheets production runtime`
Production workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

### Owner instruction

The owner asked to pause this work for now and return to it later:

> خليها دلوقتي  هنعملها بعدين  
> احفظها في ملف التعديلات في جيت هب ونرجع لها بعدين

### Problem observed

The production UI shows repeated server timeout alerts while saving a line status:

`انتهت مهلة الاتصال بالسيرفر.`

Operational symptom:

- The first click on `حفظ` often starts or completes the Sheet update, but the response times out before the frontend receives success.
- The user then clicks a second time so the order/card disappears from the screen.
- This indicates the save path is too heavy or slow, not only the screen read path.

### Root cause summary

The performance audit and live inspection point to the same root cause:

1. Frontend runs from GitHub Pages and calls Google Apps Script as the backend.
2. Apps Script reads/writes directly against one large Google Sheets workbook.
3. The workbook contains many tabs and no true database indexes.
4. Heavy Apps Script functions use full-sheet reads such as `getDataRange().getValues()`.
5. `getRows_` / `getDashboard_` are heavy read paths.
6. `updateLine_` is the save path and can timeout before returning success to the frontend.
7. Some frontend API loading remains sequential rather than parallel.

### Work already done before deferral

Sheets-side stabilization was already performed:

- Created backup before cleanup:
  `BACKUP_TrendOS_Operations_BEFORE_EMPTY_ROWS_CLEANUP_2026-09-03_1727`
- Removed trailing empty rows from many tabs.
- Reduced `الأوردرات` and `بنود الأوردرات` to current data bounds.
- Rebuilt interface tabs as bounded formula views.
- Verified `واجهة المكبس` and `واجهة خدمة العملاء` still display data after cleanup.
- Kept production runtime on Google Sheets only.
- Kept Cloudflare cutover disabled.

### Prepared patches — not deployed yet

The following patches exist in GitHub and are ready for later deployment into the live Apps Script project.

#### 1. Screen-read timeout hotfix

Path:

`apps-script/patches/TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs`

Purpose:

- Override `getRows_` and `getDashboard_`.
- Use bounded reads.
- Read from interface views when available.
- Default `getRows_` output limit: 120.
- Max `getRows_` output limit: 200.
- Cache dashboard output briefly.
- Perform zero writes while reading screens.

Expected verification marker:

`hotfix: TIMEOUT_HOTFIX_V2`

#### 2. Save timeout / double-click hotfix

Path:

`apps-script/patches/SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs`

Purpose:

- Override `updateLine_`.
- Find the real source row primarily by `lineId`, not by view row number.
- Update only essential status fields.
- Avoid heavy sync work during the save request.
- Return faster so the frontend receives success on the first click.

Expected verification marker:

`hotfix: SAVE_TIMEOUT_HOTFIX_V3`

### Required deployment sequence later

Do not deploy now. When work resumes:

1. Open the live Apps Script editor for the production web app.
2. Confirm the current production deployment and create/manual-copy backup of the live `.gs` code.
3. Paste the full content of `TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs` at the very end of the live Apps Script code.
4. Paste the full content of `SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs` after V2.
5. Save.
6. Deploy a new web app version.
7. Test login.
8. Test dashboard loading.
9. Test department screens: service, print, laser, press.
10. Test one controlled save action on a non-critical line.
11. Confirm API responses include the hotfix markers.
12. Monitor whether the frontend still shows `انتهت مهلة الاتصال بالسيرفر.`

### Rollback plan

If the hotfix causes any production issue:

1. Remove the appended V2/V3 hotfix blocks from the live Apps Script code.
2. Redeploy the previous web app version if available.
3. Keep Google Sheets as the authoritative runtime.
4. Do not activate Cloudflare cutover as part of this rollback.

### Notes

- This pending change is intentionally Apps Script only.
- It does not alter historical order, line, customer, attendance, cleaning, invoice, archive, or accounting data.
- Cloudflare/D1 migration remains a separate track and should resume only after D1 migrations and preview verification pass.
