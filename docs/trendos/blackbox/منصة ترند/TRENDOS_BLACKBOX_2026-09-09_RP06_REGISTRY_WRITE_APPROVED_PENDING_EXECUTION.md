# TrendOS RP-06 Registry Write — Approved / Pending Execution

Date: 2026-09-09
Repository: `fawakhry/TrendOs`
Working branch: `agent/go-live-2026-09-01-integrity`

## Owner approval

The owner explicitly approved only this production mutation:

> موافق على تنفيذ RP-06 Registry Write فقط للـ34 سجل المعتمدين، بدون Deploy أو Flags أو تعديل Source Sheets/D1، والتوقف بعد التحقق.

This approval is sufficient for the exact RP-06 Registry Write boundary only. It does not authorize Deploy, business-family flags, Source Sheet edits, D1 writes, rollback, or RP-08 activation.

## Exact approved plan

- Writer: `trendos-core-p0-registry-writer-v1.gs`
- Approved writer blob: `3f2c2190221f90f55199e1018fcb54d6432abdef`
- Function: `trendosCoreP0RegistryWriteV1`
- Plan hash: `5e80dd09271d21e96e3f415c21688e7f16bcac2f4b664cc23d38b08c1036aa29`
- Expected rows: 34
  - 6 Attendance supersessions
  - 11 Cleaning acknowledgements
  - 3 Invoice supersessions
  - 14 Press traceability acknowledgements
- One-use Script Property required by the writer:
  `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1`
  = approved plan hash above.

## Already-completed prerequisite

The read-only runtime preview previously passed with:

- `success=true`
- `readOnly=true`
- `dryRun=true`
- `planHash=5e80dd09271d21e96e3f415c21688e7f16bcac2f4b664cc23d38b08c1036aa29`
- `actualPlanCount=34`
- `errors=[]`

Do not re-run Preview unless explicitly requested.

## Execution status at this checkpoint

**PRODUCTION REGISTRY WRITE NOT YET EXECUTED.**

Reason: the current chat control plane has GitHub and Google Sheets/Drive access but does not expose an Apps Script project execution action or Script Properties control. The approved writer must be executed through the verified TrendOS Apps Script project so its ScriptLock, live evidence recheck, one-use approval property, post-write verification, and automatic deactivation safety contract are preserved. Direct manual Sheet writes are not an acceptable substitute.

No Production Sheet/registry write, Deploy, flag change, Source Sheet mutation, D1 write, rollback, or Apps Script execution occurred while recording this checkpoint.

## Exact execution command for Work / Apps Script control plane

1. Open the verified TrendOS Apps Script project from the operational Sheet:
   `https://docs.google.com/spreadsheets/d/1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI/edit`
   → Extensions → Apps Script.
2. Verify `trendos-core-p0-registry-writer-v1.gs` exactly matches approved blob `3f2c2190221f90f55199e1018fcb54d6432abdef` and contains no temporary helper additions.
3. Set only Script Property:
   `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1`
   = `5e80dd09271d21e96e3f415c21688e7f16bcac2f4b664cc23d38b08c1036aa29`
4. Run only `trendosCoreP0RegistryWriteV1`.
5. Capture the complete result and stop.

Required success result:

- `success=true`
- `expectedCount=34`
- `appended + alreadyPresent = 34`
- `sourceSheetsMutated=false`

Do not run rollback manually unless separately approved.

## Next roadmap action after successful write

Immediately run RP-07 HEALTH / Integrity verification. Required target includes `OPEN_CORE_P0_BLOCKERS = 0`. If RP-07 passes, stop at the separate RP-08 / ORDER_LINE activation approval boundary.
