# TrendOS Tasks V3 — T2 captured source API comparison — 2026-09-18

## Timestamp
2026-09-18 12:54 EEST

## STEP
Read the diagnostic capture Google Doc through Google Docs API and compared the captured current saved `Code.gs` against the authoritative repository source.

Diagnostic Doc:
`1Ckz_hqvUreXZGVZ2eRiRKff7lNFKWaktO0F4XF5uYtc`

Diagnostic Doc revision:
`ANLCKQlInSJsBdK5IgNhBsjVS-OrNImBsCBDZeLIwMpMmCGETnN2BoplruX_vzc-15nnykwPHBX6Hc72aBTAlMoHfWFygyfsy_SkHKVz7Q`

Authoritative source:
- commit: `31565dfdbf7b63744b32b02e5042a5f6b0664249`
- blob: `e515103e32e01643cbe60832df9ed1bbf0f6c6d8`

## RAW COMPARISON
- captured length: 11027 characters
- authoritative length: 11258 characters
- captured structural lines: 335
- authoritative lines: 332
- raw exact match: NO
- exact ignoring one final newline: NO
- first raw difference begins at index 0 due an extra leading space in the captured Google Doc representation.

Because Google Docs can alter whitespace/paragraph representation, raw byte mismatch alone is not yet treated as source-semantic drift.

## REQUIRED MARKERS
All nine required markers are present in the API-read capture:
- `TASKS_V3_READONLY_T2_WAEL_CANARY_3_BATCHGET`
- exact columns `['A', 'E', 'F', 'J', 'K', 'M', 'R', 'AG', 'AS']`
- `Sheets.Spreadsheets.Values.batchGet`
- `majorDimension: 'COLUMNS'`
- `valueRenderOption: 'FORMATTED_VALUE'`
- `Utilities.Charset.UTF_8`
- `function tasksV3ProductionProjection_`
- `function tasksV3Status_`
- `function tasksV3Health_`

This directly contradicts earlier Monaco semantic/transcription claims that COLUMNS or UTF-8 were absent. Those earlier Monaco reports are therefore not accepted as authoritative source evidence.

## FORBIDDEN MARKER PRE-CHECK
Absent in captured API text:
- `claimNext`
- `completeTask`
- `function tasksV3Column_`
- `Values.update`
- `Values.append`
- `batchUpdate`
- `setValue`
- `setValues`
- `appendRow`

The string `getDataRange` is present in the capture. The authoritative source header itself contains the documentation comment:
`No claim/complete routes. No sheet/schema writes. No getDataRange/full 92-column scan.`
Therefore string presence alone is not an executable-path failure.

## DECISION
Do not enable Sheets v4 yet.

Perform a detailed line/token-level comparison that ignores Google Docs-only whitespace/paragraph artifacts and separately checks executable forbidden paths:
- executable `getDataRange(`;
- sequential `getRange(...).getDisplayValues()` path;
- broad `A:AS` read;
- write methods such as update/append/batchUpdate/setValue/setValues/appendRow/clear/insert/delete.

Only if the captured executable source is proven semantically aligned with the authoritative source and the forbidden paths are absent may the static verification gate PASS.

## SAFETY
No Apps Script mutation in this comparison.
No Run/Deploy/version.
No Services/Properties/Secrets.
No business-data access/write.
No Task mutation.
No T1/V4/V5/Worker/T3 change.
