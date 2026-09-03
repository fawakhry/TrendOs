# GS-04 — Apps Script Save Timeout Hotfix Prepared

Date: 2026-09-03 Africa/Cairo
Branch: `agent/go-live-2026-09-01-integrity`
Repository: `fawakhry/TrendOs`
Production workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`

## User-visible issue

The UI still shows:

`انتهت مهلة الاتصال بالسيرفر.`

when saving a line/order status. The first click often changes the status in Google Sheets, but the browser receives a timeout instead of a success response, so the card stays visible. The user then clicks a second time and the card disappears.

## Diagnosis

The screen-loading timeout was addressed by `TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs`, but the save path still uses the older `updateLine_` implementation.

The older save path can:

- use `rowNumber` from the formula view as if it were the source row in `بنود الأوردرات`;
- call heavy synchronization such as `syncOrderFromLines_` inside the user-facing request;
- append logs and flush while the request is still waiting;
- trigger a timeout even if the status write succeeded.

## Patch prepared

Created append-only Apps Script patch:

`apps-script/patches/SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs`

Commit:

`db2f08454e526276f00a3ccb17d18360d4a1026a`

## What V3 changes

V3 overrides `updateLine_` only.

Behavior:

1. Finds the real source row by `lineId` first.
2. Falls back to `orderId` only when `lineId` is missing.
3. Uses `rowNumber` only as a last resort.
4. Updates only necessary cells: status, ready flag, updatedAt, notes.
5. Avoids heavy `syncOrderFromLines_` inside the user-facing save request.
6. Performs only a light order header update when possible.
7. Returns `shouldRemoveFromCurrentView = true` when the status is a closed status such as `تم التسليم`, `ملغى`, or `مكرر`.
8. Returns `hotfix: SAVE_TIMEOUT_HOTFIX_V3` for verification.

## Deployment required

Paste `SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs` at the very end of the live Apps Script project, after V2 if V2 is already pasted. Then save and deploy a new web app version.

## Verification

After deployment, saving a row should return quickly with:

`hotfix: SAVE_TIMEOUT_HOTFIX_V3`

and closed/delivered cards should not require a second click.

## Rollback

Remove the appended V3 block from the live Apps Script project and redeploy the previous version.
