# RP-06 3536-01 Read-Only Reconciliation — 2026-09-04

## Scope
Read-only reconciliation of the `RP-06-PREVIEW-RERUN-B` blocker for `PRESS_COMPLETED_WITHOUT_SESSION / 3536-01`.

No Apps Script, Sheet, registry, Script Property, deployment, flag, trigger, route, source data, or `Code.gs` mutation was performed.

## Canonical prior failure
The observable registry preview failed closed because live resolution for `3536-01` returned:
- source row count `2 != 1`
- live evidence hash mismatch
- `Line is no longer an eligible Press completion`

Production remains Version 146 with Master+HEALTH ON only; business families and Fast Auth remain OFF.

## Fresh production workbook evidence
Read-only inspection of `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY` / `بنود الأوردرات` found exactly two rows carrying Line ID `3536-01`:

1. Row 71
   - Order: `3536`
   - Line ID: `3536-01`
   - Department: `طباعة`
   - Status: `مكرر`
   - Ready: `نعم`
   - Last update: `2026-08-24`
   - Heat press: `لا`

2. Row 108
   - Order: `3536`
   - Line ID: `3536-01`
   - Department: `طباعة`
   - Status: `تم التسليم`
   - Ready: `نعم`
   - Last update: `2026-08-30`
   - Heat press: `نعم`

`تشغيل - جلسات المكبس` currently contains no `3536-01` Line-ID evidence.
`واجهة المكبس` currently contains no `3536-01` row.

## Diagnosis
The blocker is now classified as a **writer live-plan compatibility defect against known historical-duplicate semantics**, not evidence that the delivered canonical row itself became invalid.

The current writer implementation resolves `PRESS_COMPLETED_WITHOUT_SESSION` source rows by matching Line ID across `snap.lines` with no exclusion for rows whose status is `مكرر`. It then:
- compares raw matching row count to the historical plan's `sourceCount=1`, and
- applies Press-completion eligibility validation to every matched row.

Because row 71 is `مكرر`, it should be historical-only under the established TrendOS safeguard: **`مكرر` stays history and is excluded from active logic**. Counting and validating that row as an active Press source causes the three preview failures observed for `3536-01`.

## Safe conclusion
Do **not** rewrite or delete either source row and do **not** regenerate the 34-row registry plan automatically.

The next safe implementation step is GitHub-only:
1. adjust the registry writer's `PRESS_COMPLETED_WITHOUT_SESSION` source-row selection to exclude exact historical `مكرر` rows before source-count/evidence/eligibility validation;
2. add a regression fixture containing one historical `مكرر` row and one delivered heat-press row sharing the same Line ID;
3. require the preview test to treat only the non-`مكرر` row as the live source while retaining both rows in source history;
4. run the dedicated writer tests and full Integrity CI;
5. only after CI PASS request/consume the separately bounded Apps Script Head replacement + read-only preview rerun checkpoint.

No registry write, property, deploy, feature activation, or production-data mutation is authorized by this checkpoint.

## Status
**READ-ONLY RECONCILIATION PASS / ROOT CAUSE IDENTIFIED / GITHUB-ONLY FIX PENDING.**
