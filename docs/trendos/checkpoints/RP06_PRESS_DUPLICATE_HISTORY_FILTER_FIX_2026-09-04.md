# RP-06 Press historical `مكرر` filter fix — 2026-09-04

## Status

**GITHUB FIX + REGRESSION TEST COMPLETE / PRODUCTION UNCHANGED / CONTROLLED APPS SCRIPT INSTALL PENDING**

## Context

The read-only registry preview for Line ID `3536-01` previously failed because the source sheet contained two rows with the same Line ID:

- one historical row with status `مكرر`;
- one canonical active/business row with status `تم التسليم` and Heat Press involvement.

TrendOS project rules preserve historical `مكرر` rows for audit history but exclude them from active Line logic.

## Root cause

`trendos-core-p0-registry-writer-v1.gs` collected all source rows matching the Line ID for the `PRESS_COMPLETED_WITHOUT_SESSION` live-evidence validation path. The historical `مكرر` row therefore inflated the source-row count and caused the preview/evidence gate to fail closed.

## Safe fix

Commit:

- `250043fd9e8aea512ddb9acf32e3f842913c0b97` — `Exclude historical مكرر rows from Press registry live validation`

Behavioral rule implemented:

- keep `مكرر` rows untouched in source history;
- exclude `مكرر` rows from active Press registry live validation;
- do not delete, rewrite, merge, or normalize historical source rows as part of this fix.

## Regression coverage

Commit:

- `8bf8e1c02fd349b2586535b8d556ee325862af6c` — `Add regression for historical مكرر Press row semantics`

The regression covers the exact semantic shape:

- same Line ID appears in a historical `مكرر` row and a canonical active row;
- historical row remains present;
- validation operates on the canonical active row only.

## Production impact

**NONE.**

No production Sheet cell, Registry row, Apps Script property, trigger, family flag, deployment, Web App version, `Code.gs`, D1 cutover, or authoritative write path was changed by this GitHub-only fix.

Production safety remains:

- Google Sheets + Apps Script authoritative for writes;
- Production Apps Script Version 146 remains unchanged;
- Master + HEALTH only;
- business families OFF;
- Fast Auth OFF/absent;
- Cloudflare/D1 authoritative write cutover OFF.

## Exact next step

Controlled installation of the revised one-time registry writer logic into the current Apps Script Head **without replacing `Code.gs`**, followed by the same read-only registry preview rerun for `3536-01`.

Required gate before any Registry write:

1. install only the intended revised writer/helper delta;
2. save/parse successfully;
3. rerun read-only preview;
4. verify exactly one active source row is selected for `3536-01`;
5. verify evidence/hash/eligibility gates PASS;
6. if any mismatch occurs, STOP with no Registry write and keep production unchanged.

## Tool boundary

The current GitHub execution environment does not expose direct Apps Script source-project write control. Therefore the correct automated stopping point is before Apps Script Head mutation; a blind `Code.gs` overwrite is explicitly forbidden by canonical TrendOS rules.
