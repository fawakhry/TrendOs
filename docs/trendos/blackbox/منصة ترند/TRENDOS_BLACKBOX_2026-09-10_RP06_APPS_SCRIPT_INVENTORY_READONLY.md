# TrendOS RP-06 — Apps Script Inventory Read-Only Result

Date: 2026-09-10
Working branch: `agent/go-live-2026-09-01-integrity`

## Scope

User supplied the result of a ChatGPT Work read-only inspection of all 40 `.gs` files in the TrendOS Production Apps Script project. No file edits, saves, function executions, Script Property changes, Registry writes, deployments, flag changes, Sheet mutations, or D1 mutations were performed by that inspection.

## Confirmed live Apps Script state

- The only Apps Script file containing RP-06 Registry Writer code is `trendos-core-p0-registry-writer-v1.gs`.
- Current Apps Script writer size reported by Work: 28,551 characters / 247 lines.
- `TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1` is declared only once in the whole Apps Script project, in that writer file.
- `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1` is declared only once in that writer file.
- `trendosCoreP0RegistryPreviewV1` exists in the live Apps Script project, declaration at reported line 137.
- `trendosCoreP0RegistryWriteV1` exists, declaration at reported line 218.
- `trendosCoreP0RegistryRollbackV1` exists, declaration at reported line 238.
- `TRENDOS_CORE_P0_REGISTRY_RECOVERY_VERSION_V1`, `trendosCoreP0RegistryRecoveryPreviewV1`, and `trendosCoreP0RegistryRecoveryWriteV1` are NOT present in the live Apps Script project.
- There is currently no duplicate writer definition in another `.gs` file.
- The helper file `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs` currently contains only the comment `// RP-06 approval helper intentionally cleared.`
- `No functions` is shown when that empty helper file is selected; when `trendos-core-p0-registry-writer-v1.gs` is selected, `trendosCoreP0RegistryPreviewV1` appears and the Run list is active.

## Reconciliation against GitHub recovery source

GitHub working-branch writer remains the Recovery Patch source with blob:

`81e994945af7fefdd38538a7ca569e73483f3d24`

That GitHub source contains the recovery version and recovery preview/write functions. Therefore the live Apps Script Head is still on the pre-Recovery writer and has NOT yet been updated to the approved Recovery Patch source.

## Correct next bounded action

Update ONLY the existing Apps Script file `trendos-core-p0-registry-writer-v1.gs` so its full contents exactly match GitHub blob `81e994945af7fefdd38538a7ca569e73483f3d24`. Do not put writer code into the helper file or any second file.

After Save/Reload and exact source verification, run only:

1. `trendosCoreP0RegistryPreviewV1`
2. if that passes, `trendosCoreP0RegistryRecoveryPreviewV1`

Then STOP and record both read-only results before any recovery write decision.

## Safety boundary

Still prohibited without a new explicit approval after both previews PASS:

- `trendosCoreP0RegistryRecoveryWriteV1`
- normal `trendosCoreP0RegistryWriteV1`
- rollback
- Script Property approval mutation
- direct Registry edits
- deploy
- business-family flag activation
- source-Sheet mutation
- D1 write
- merge to main
- RP-07 execution

STOP: inventory/result recording only.