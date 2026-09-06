# PERF-CF-02CR — View Formula Range Cap Root Cause / Live Fix

Date: 2026-09-06

## Incident

User reported that production print and laser screens showed only a subset of current operational orders. This was not a pagination-size issue.

## Root cause proven in authoritative Google Sheet

The operational source `بنود الأوردرات` currently extends through row 355 and contains many active print/laser lines beyond row 311.

The legacy view sheets used fixed FILTER source ranges:

- `واجهة الطباعة!A2` referenced `بنود الأوردرات!A2:R311`, `E2:E311`, `K2:K311`.
- `واجهة الليزر!A2` referenced the same fixed row-311 bounds.
- `واجهة المكبس!A2` referenced the same fixed row-311 bounds.
- `واجهة خدمة العملاء!A2` referenced `الأوردرات!A2:S270` / `A2:A270` while `الأوردرات` had already grown beyond that bound.

Therefore any operational rows appended after those hard-coded limits could never enter the legacy view tabs, regardless of browser cache, Apps Script health, or D1 state.

This explains the exact user-visible symptom: print showed only the three still-active rows that happened to fall inside the old capped source window, while newer active print/laser rows were absent.

## Live fix applied

Only the four legacy view formulas in cell `A2` were changed. No order/customer/source row was edited.

### خدمة العملاء

From fixed `A2:S270` / `A2:A270` to open-ended:

`=IFERROR(FILTER('الأوردرات'!A2:S,'الأوردرات'!A2:A<>""),"")`

### الطباعة

From fixed row 311 ranges to open-ended:

`=IFERROR(FILTER('بنود الأوردرات'!A2:R,REGEXMATCH('بنود الأوردرات'!E2:E,"طباعة|print|Print"),'بنود الأوردرات'!K2:K<>"تم التسليم",'بنود الأوردرات'!K2:K<>"ملغى",'بنود الأوردرات'!K2:K<>"مكرر"),"")`

### الليزر

`=IFERROR(FILTER('بنود الأوردرات'!A2:R,REGEXMATCH('بنود الأوردرات'!E2:E,"ليزر|laser|Laser"),'بنود الأوردرات'!K2:K<>"تم التسليم",'بنود الأوردرات'!K2:K<>"ملغى",'بنود الأوردرات'!K2:K<>"مكرر"),"")`

### المكبس

`=IFERROR(FILTER('بنود الأوردرات'!A2:R,'بنود الأوردرات'!R2:R="نعم",'بنود الأوردرات'!K2:K<>"تم التسليم",'بنود الأوردرات'!K2:K<>"ملغى",'بنود الأوردرات'!K2:K<>"مكرر"),"")`

## Verification after write

Formula readback confirmed all four A2 formulas are now open-ended.

`واجهة الطباعة` immediately expanded to include newer orders through order ID `3920` in the current source snapshot, including rows that were previously excluded by the row-311 cap.

`واجهة الليزر` immediately expanded to include newer orders through order ID `3918` in the current source snapshot, including current request / execution rows beyond the former row-311 cap.

No Apps Script code deployment, D1 mutation, Worker deployment, frontend D1 re-enable, secret rotation, 02CL action, authority transfer, or order-row mutation was performed by this fix.

## Current meaning

The visible incompleteness incident has a confirmed spreadsheet-view root cause and the source formulas are now repaired. Production frontend remains on the Apps Script / Sheets lane; D1 Orders read remains OFF.

User should refresh the production page and confirm print/laser order totals now reflect the repaired views.

02CR full D1 field/paging/filter parity remains a separate unfinished qualification task and must not be conflated with this legacy view repair.
