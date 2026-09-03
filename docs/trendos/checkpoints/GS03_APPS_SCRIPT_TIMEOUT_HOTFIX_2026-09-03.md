# GS-03 — Apps Script Timeout Hotfix Prepared

Date: 2026-09-03 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Repository: `fawakhry/TrendOs`
Production workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

## Objective

Stop frequent server timeout errors while TrendOS production remains on Google Sheets / Apps Script and Cloudflare D1 is blocked by the D1 free-tier row write limit.

## Root cause found

The Apps Script snapshot in the production workbook contains duplicate/heavy definitions of `getRows_` and `getDashboard_`.

The latest effective-style implementation reads the entire `بنود الأوردرات` sheet using:

```js
const data = lines.getDataRange().getValues();
```

It also calls helper functions from read endpoints and `getRows_` can write phone values back into the sheet while a user is only opening a screen. That makes screen loading a read + write path and increases timeout risk.

## Sheets-side mitigation already done

Before this checkpoint, the workbook was stabilized for Sheets-only operation:

- Empty trailing rows were removed from many tabs.
- `الأوردرات` was reduced to its current data bound.
- `بنود الأوردرات` was reduced to its current data bound.
- Interface tabs were rebuilt as bounded formula views.
- `واجهة المكبس` and `واجهة خدمة العملاء` were verified after cleanup.

## New settings added to `إعدادات المنصة الأساسية`

- `SERVER_TIMEOUT_ROOT_CAUSE = Apps Script full-sheet reads in getRows_/getDashboard_ plus read-path writes`
- `SERVER_TIMEOUT_HOTFIX_STATUS = PATCH_PREPARED_REQUIRES_APPS_SCRIPT_DEPLOY`
- `ROWS_API_DEFAULT_LIMIT = 120`
- `ROWS_API_MAX_LIMIT = 200`
- `DASHBOARD_CACHE_SECONDS = 20`
- `READ_PATH_WRITES_ALLOWED = FALSE`

## Patch prepared

Created append-only Apps Script patch:

`apps-script/patches/TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs`

Commit:

`adb8ab385ceb295924093dd71851b84e8253c870`

## What the patch changes

The patch overrides:

- `getRows_`
- `getDashboard_`

It does not delete old code. It must be pasted at the very end of the live Apps Script project so the new definitions override the older definitions.

Patch behavior:

1. `getRows_` reads from bounded interface views when available:
   - `واجهة الطباعة`
   - `واجهة الليزر`
   - `واجهة خدمة العملاء`
   - `واجهة المكبس`
2. Default rows returned: 120.
3. Maximum rows returned: 200.
4. No phone backfill or any other writes while reading screen data.
5. `getDashboard_` reads a bounded scan window and caches results for 20 seconds per screen.
6. The patch returns `hotfix: TIMEOUT_HOTFIX_V2` in responses for verification.

## Deployment required

A direct Apps Script connector is not available in this chat. The patch is prepared in GitHub but is not yet deployed into the live Apps Script project.

To complete the fix:

1. Open the live Apps Script editor for the production web app.
2. Open the current backend `.gs` file.
3. Paste the full content of `apps-script/patches/TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs` at the bottom.
4. Save.
5. Deploy a new web app version.
6. Test login + dashboard + department screens.
7. Confirm API responses include `hotfix: TIMEOUT_HOTFIX_V2`.

## Production impact expected

Expected impact after deployment:

- Fewer or no server timeout errors on normal screen loads.
- Faster dashboard response due to 20-second cache.
- Lower write pressure on Google Sheets because screen reads no longer write phone values.
- Lower read pressure because rows are bounded and read from formula views where possible.

## Rollback

Remove the appended hotfix block from the live Apps Script project and redeploy the previous web app version.

## Current status

- Google Sheets remains production authoritative.
- Cloudflare cutover remains disabled.
- Timeout hotfix is prepared and documented.
- Live Apps Script deployment is still required to make the fix active.
