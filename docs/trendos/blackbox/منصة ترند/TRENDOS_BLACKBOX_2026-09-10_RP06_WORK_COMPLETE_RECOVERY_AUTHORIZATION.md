# RP-06 Work complete recovery authorization

Date: 2026-09-10

Owner requested one ChatGPT Work run to finish the current RP-06 Recovery point completely so the project can move to the next checkpoint.

Authorized bounded sequence:
1. Inspect the current TrendOS Production Apps Script project and ensure the RP-06 writer exists only in `trendos-core-p0-registry-writer-v1.gs`; keep `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs` empty/comment-only and do not duplicate writer declarations.
2. Replace only the main writer source with the exact GitHub recovery blob `81e994945af7fefdd38538a7ca569e73483f3d24` from branch `agent/go-live-2026-09-01-integrity`.
3. Save/reload and exact-verify the Apps Script Head source.
4. Run only `trendosCoreP0RegistryPreviewV1`. Require success=true, readOnly=true, expectedCount=33, actualPlanCount=33, errors=[], planHash=`5bc903bc8937ac4f523c98dec9e12a0ad6e4bff19928b4a8aa5737da32c94eab`.
5. Record that gate in the blackbox before continuing.
6. Run only `trendosCoreP0RegistryRecoveryPreviewV1`. Require success=true, readOnly=true, expectedCount=33, actualPlanCount=33, recoverableCount=33, errors=[], recoveryHash=`ef3a590e11cd4c273aa552c238f4a1d3878a3bc8c85a944c84a084786d9e9a82`.
7. Record that gate in the blackbox before continuing.
8. If and only if both previews PASS, owner authorizes setting only `TRENDOS_CORE_P0_REGISTRY_RECOVERY_APPROVAL_V1` to the exact recovery hash and executing `trendosCoreP0RegistryRecoveryWriteV1` exactly once.
9. If the pre-write Registry data-row count is still 66, successful recovery should append 33 new active revisions for total 99 data rows. The Recovery Write itself must return success=true, expectedCount=33, recovered=33, sourceSheetsMutated=false and must complete post-write verification without auto-rollback.
10. Read-only verify the latest exact 33 mappings are active and new Press Entity Keys are preserved as plain text strings, not DATE/number values.
11. Record the Recovery Write result and final RP-06 state in a new blackbox checkpoint and update `00_INDEX.md` / `01_CURRENT_STATE.md` on the working branch only.
12. STOP before RP-07. Do not execute RP-07 in the same run.

Fail-closed rules:
- If any source mismatch, duplicate declaration, parse error, preview mismatch, recoverableCount mismatch, Registry count anomaly, or Recovery Write error occurs: STOP immediately, record the exact blocker and logs, and do not retry automatically.
- Do not run normal `trendosCoreP0RegistryWriteV1`.
- Do not run rollback.
- Do not edit/delete existing Registry history or flip `Active?` in place.
- No Apps Script Production deploy.
- No Code.gs changes.
- No source Sheet or D1 business-data mutation outside the approved Recovery Writer append.
- No business-family flag changes.
- No merge to main.

This record authorizes the bounded recovery completion above, not any later RP-07 or activation step.
