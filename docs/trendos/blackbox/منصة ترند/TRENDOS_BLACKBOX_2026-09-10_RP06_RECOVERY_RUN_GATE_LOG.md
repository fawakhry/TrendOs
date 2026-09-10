# TrendOS RP-06 Recovery Run Gate Log — 2026-09-10

- Repository: `fawakhry/TrendOs`
- Branch: `agent/go-live-2026-09-01-integrity`
- Production Apps Script project: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`
- Production workbook: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Gate timestamp (UTC): `2026-09-10T12:33:07Z`

## Apps Script Head verification — PASS

- Main file: `trendos-core-p0-registry-writer-v1.gs`
- Exact Git blob: `81e994945af7fefdd38538a7ca569e73483f3d24`
- Source length: `36980`
- Required recovery symbols: present
- `TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1` declarations in main writer: `1`
- Parse/duplicate errors: none observed
- Approval helper remains comment-only.

## Normal Preview33 — PASS

Executed exactly once: `trendosCoreP0RegistryPreviewV1`

```json
{
  "success": true,
  "readOnly": true,
  "version": "TRENDOS_CORE_P0_REGISTRY_WRITER_V1_20260901",
  "planHash": "5bc903bc8937ac4f523c98dec9e12a0ad6e4bff19928b4a8aa5737da32c94eab",
  "expectedCount": 33,
  "actualPlanCount": 33,
  "errors": [],
  "writeApprovalProperty": "TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1",
  "rollbackApprovalProperty": "TRENDOS_CORE_P0_REGISTRY_ROLLBACK_APPROVAL_V1"
}
```

Apps Script reported `Execution completed`. Its log UI emitted `Logging output too large. Truncating output.` for the full 33-item `checks` array; every visible check had `expectedHash === actualHash`, `valid=true`, and `errors=[]`. The authoritative top-level gate fields above were present before truncation.

## Recovery Preview33 — PASS

Executed exactly once: `trendosCoreP0RegistryRecoveryPreviewV1`

```json
{
  "success": true,
  "readOnly": true,
  "version": "TRENDOS_CORE_P0_REGISTRY_WRITER_V1_20260901",
  "recoveryVersion": "TRENDOS_CORE_P0_REGISTRY_RECOVERY_V1_20260910",
  "planHash": "5bc903bc8937ac4f523c98dec9e12a0ad6e4bff19928b4a8aa5737da32c94eab",
  "recoveryHash": "ef3a590e11cd4c273aa552c238f4a1d3878a3bc8c85a944c84a084786d9e9a82",
  "expectedCount": 33,
  "actualPlanCount": 33,
  "recoverableCount": 33,
  "errors": [],
  "recoveryApprovalProperty": "TRENDOS_CORE_P0_REGISTRY_RECOVERY_APPROVAL_V1"
}
```

The complete 33-item `checks` array was returned. Every item had `recoverable=true` and `errors=[]`; `previousRow` spans 2–34 and `latestRow` spans 35–67. This proves the required 66 data-row history shape (33 immediately preceding active exact mappings and 33 latest writer AUTO_ROLLBACK inactive mappings) under the recovery gate semantics.

## Current state

Normal Preview33 and Recovery Preview33 passed. Recovery Write has not run yet.
