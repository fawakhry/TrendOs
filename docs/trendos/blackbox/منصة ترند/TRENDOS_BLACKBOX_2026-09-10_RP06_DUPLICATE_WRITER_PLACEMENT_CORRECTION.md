# TrendOS RP-06 — Duplicate Writer Placement Correction

Date: 2026-09-10
Working branch: `agent/go-live-2026-09-01-integrity`

## Observation
Apps Script still reports:
`SyntaxError: Identifier 'TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1' has already been declared`
with the error pointing to `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs:1`.

## Root cause / correction
A prior assistant instruction incorrectly told the user to paste the full recovery writer into the helper file `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs` even though the writer already exists in its original Apps Script file. That created two global copies of the same constants/functions in the Apps Script project.

## Correct action
- Keep the recovery writer in exactly one Apps Script file only: the original writer file.
- Clear `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs` back to comments/empty content; do not keep writer declarations there.
- Save and reload.
- Run only `trendosCoreP0RegistryPreviewV1` after the duplicate declaration is gone.
- No Registry Write, Recovery Write, Rollback, Deploy, flags, source-sheet, or D1 mutation.

STOP: placement correction only.