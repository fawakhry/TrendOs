# TrendOS Phase 0 — Live Data Baseline — 2026-08-30

> Scope: read-only audit of the live Google Sheet `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`. No spreadsheet mutation was performed.

## Source

Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

Direct Google Sheets connector access was verified on 2026-08-30.

## Line-ID duplicate baseline

Read range: `بنود الأوردرات!F1:K194`

Fields inspected:
- `رقم البند` (Line ID)
- item / quantity / owner / priority
- `الحالة`

Rule used for the Core duplicate gate:

A Line ID is an active duplicate only if the same Line ID has more than one row whose normalized status is **not** `مكرر`.

### Result

**ZERO active duplicate Line IDs were found in the inspected live range.**

Repeated Line IDs in the live sheet resolve to at most one non-`مكرر` row; extra copies are marked `مكرر`.

Examples observed:
- `3186-01`: one `تم التسليم` + one `مكرر`
- `3438-01`: one `تم التسليم` + one `مكرر`
- `3460-01`: one `تم التسليم` + two `مكرر`
- `3498-01`: one `تم التسليم` + one `مكرر`
- `3533-01`: one `تم التسليم` + two `مكرر`
- `3551-01`: one `جاهز للاستلام` + one `مكرر`
- `3562-01`: one `جاهز للاستلام` + one `مكرر`
- `3564-01`: one `جاهز للاستلام` + one `مكرر`
- `3570-02`: one `تم التسليم` + one `مكرر`
- `3593-02`: one `جاهز للاستلام` + one `مكرر`

This is consistent with the current source contract in `syncOrderFromLines_()` that excludes `مكرر` from effective/current totals.

## Duplicate-only live rows requiring data-quality follow-up

Two repeated Line IDs were observed with **all visible copies marked `مكرر`** and no non-`مكرر` canonical row in the live range:

- `3216-02` — two visible `مكرر` rows
- `3536-01` — two visible `مكرر` rows

A read-only search of `أرشيف بنود الأوردرات` returned no match for either ID.

Interpretation:
- this is **not an active-duplicate blocker**, because neither ID has more than one active/non-`مكرر` row;
- it is a data-quality/anomaly note because the canonical row is not present in the current live or archived Lines datasets inspected.

Do not delete or relabel these rows until provenance is understood.

## Historical duplicate rows

A direct live-sheet search for status `مكرر` found **35 rows** marked `مكرر` in `بنود الأوردرات` at audit time.

These rows are historical evidence and should remain excluded from active operational totals rather than being physically deleted solely to satisfy the duplicate gate.

## ID-format spot checks

The following Core regression IDs are present in the live Lines read as literal-looking IDs:

- `3637-02`
- `3647-01`
- `3651-02`

This is a **read-only baseline observation**, not yet the full write/read regression required for `REG-04` through `REG-06`.

## Header integrity observation

The `بنود الأوردرات` header contains duplicate visible header names in multiple positions (examples include notification / WhatsApp / expected-time / debt / source / creator / separator fields).

Current source `headersMap_(sheet)` iterates left-to-right and assigns:

`map[normalizedHeader] = columnIndex`

Therefore when a normalized header appears more than once, the **last occurrence wins**.

This is a schema-integrity risk: code asking for a duplicated header name may bind to a later column than a human operator expects.

Do not rename/delete columns during Phase 0. First map which duplicated headers are used by production functions.

## Timezone observation

Spreadsheet metadata currently reports:

`America/Los_Angeles`

Operational settings sheet explicitly declares:

`OPERATION_TIMEZONE = Africa/Cairo`

and contains a migration note instructing not to change the spreadsheet timezone directly before a controlled data migration.

Therefore no timezone mutation was made.

## Core gate status

Phase 1 gate: **zero active duplicate Line IDs**

Status at this baseline: **PASS — LIVE DATA READ-ONLY**.

This PASS is a current-state data baseline. It does not replace concurrency/idempotency regression tests that must prove new duplicate active rows cannot be created.

## Next audit lane

Continue read-only Phase 0 inventory directly through connected Sheets + supplied current Code.gs + GitHub, without requiring manual copy/paste from the operator unless a source is inaccessible.
