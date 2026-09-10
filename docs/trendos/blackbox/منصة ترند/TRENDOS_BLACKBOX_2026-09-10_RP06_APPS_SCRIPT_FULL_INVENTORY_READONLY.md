# TrendOS RP-06 — Apps Script full inventory READ ONLY

Date: 2026-09-10
Working branch: `agent/go-live-2026-09-01-integrity`

## Source
User supplied a ChatGPT Work report after a full read-only scan of all 40 `.gs` files in the TrendOS Production Apps Script project.

## Findings
- The only file containing the RP-06 Registry Writer code is `trendos-core-p0-registry-writer-v1.gs`.
- `TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1` is declared once in that file at line 15; no duplicate declaration exists in any other `.gs` file.
- `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1` is declared once in that file at line 16.
- `trendosCoreP0RegistryPreviewV1` exists at line 137.
- `trendosCoreP0RegistryWriteV1` exists at line 218.
- `trendosCoreP0RegistryRollbackV1` exists at line 238.
- Recovery symbols/functions are absent from the current Apps Script Head: `TRENDOS_CORE_P0_REGISTRY_RECOVERY_VERSION_V1`, `trendosCoreP0RegistryRecoveryPreviewV1`, and `trendosCoreP0RegistryRecoveryWriteV1` are not present.
- Current writer size reported by Work: 28,551 characters, 247 lines.
- `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs` currently contains only one comment line and no executable code.
- `No functions` was caused by selecting the empty helper file; when `trendos-core-p0-registry-writer-v1.gs` is selected, `trendosCoreP0RegistryPreviewV1` appears and the function selector is active.
- Therefore there is no current duplicate-file blocker. The actual remaining blocker is that Apps Script Head still contains the pre-Recovery writer and must be replaced with the approved Recovery Patch source in the same main writer file only.

## Safety
The Work scan was READ ONLY. No Save, function execution, Script Property change, Registry write/recovery/rollback, deploy, flags, source-Sheet mutation, or D1 mutation occurred.

## Next bounded action
Replace only the contents of `trendos-core-p0-registry-writer-v1.gs` in Apps Script Head with the approved Recovery Patch source matching GitHub blob `81e994945af7fefdd38538a7ca569e73483f3d24`, keep the helper file without writer code, save/reload, then run only `trendosCoreP0RegistryPreviewV1` before any Recovery Preview or Recovery Write.

STOP before mutation unless explicitly approved.