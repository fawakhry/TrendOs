# TrendOS RP-06 — Registry Write auto-rollback root cause confirmed

Date: 2026-09-10
Repository: `fawakhry/TrendOs`
Working branch: `agent/go-live-2026-09-01-integrity`

## Read-only live Registry reconciliation

Source workbook: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
Registry sheet: `إدارة - معالجات السلامة V1`
Workbook timezone: `America/Los_Angeles`

A bounded read-only inspection of `A1:J200` and exact CellData for Press Entity Key cells confirmed the live Registry state after the failed write attempts.

## Exact current Registry shape

The sheet contains the exact 10-column header plus 66 data rows:

- rows 2–34: 33 plan mappings written with `Active? = true`;
- rows 35–67: the same 33 mappings appended with `Active? = false` and reason `AUTO_ROLLBACK: post-write evidence or registry verification failed`.

Therefore one write attempt successfully appended all 33 active mappings, then the writer's post-write verification failed and its built-in automatic rollback appended 33 inactive revisions. The latest state for each exact mapping is inactive.

A subsequent write attempt then failed closed at the existing-state check with `exact mapping is explicitly inactive`, as shown in the owner's Apps Script execution log.

## Confirmed root cause

The writer currently appends Registry rows with `setValues` without first forcing identifier columns to plain text.

For 11 numeric-looking Press Entity Keys, Google Sheets coerced the text IDs into DATE/number values while displaying the same apparent text. CellData confirms for both the active block and rollback block that these keys have `userEnteredValue.numberValue` / `effectiveValue.numberValue` with number format `DATE` pattern `yyyy-mm`.

Affected Press Entity Keys:

- `3536-01`
- `3585-02`
- `3628-01`
- `3669-01`
- `3756-01`
- `3758-01`
- `3764-01`
- `3770-01`
- `3774-01`
- `3779-01`
- `3788-01`

The three `TM...` Press Entity Keys remained strings.

Because Registry resolution code reads raw values with `getValues()` and compares `Entity Key` as text to the planned string key, the date-coerced values cannot match their original Press IDs during post-write verification. This explains the post-write verification failure and subsequent automatic rollback.

## Safety interpretation

The automatic rollback behaved as designed: after post-write verification failed, it appended inactive revisions for the 33 mappings. No source business rows or D1 data were changed by the Registry writer.

The current one-use write approval must be treated as consumed. Do not rerun the write wrapper or writer now.

## Required recovery design before any new production write

A new GitHub-only patch is required before another production attempt. It must preserve append-only history and fail-closed behavior. At minimum it must:

1. force Registry identifier/text columns to plain-text storage before append so Press IDs such as `3536-01` cannot be date-coerced;
2. add regression coverage for date-like Entity Keys;
3. provide a bounded recovery path for mappings whose latest revision is inactive specifically because of the writer's own `AUTO_ROLLBACK: post-write evidence or registry verification failed`, without weakening the general rule that arbitrary explicitly inactive mappings must not be silently reactivated;
4. require current live evidence/hash revalidation and a new one-use approval before any recovery append;
5. run normal Integrity CI and a new read-only preview/recovery-preview before any production recovery write.

Do not delete or edit the 66 existing Registry history rows. Do not directly flip `Active?` values. Do not bypass the writer with direct Sheet writes.

## Current decision

Status: **RP-06 HOLD — AUTO-ROLLBACK ROOT CAUSE CONFIRMED — RECOVERY PATCH REQUIRED BEFORE ANY RETRY**

No code patch, Apps Script mutation, Registry mutation, Script Property, deploy, flag change, source-Sheet mutation, D1 write, merge, or RP-07 action was performed by this read-only reconciliation.

STOP pending explicit owner approval for the bounded GitHub recovery patch.