# V1932 private-source → current book-branch Code.gs comparison — 2026-10-16

> SOURCE_ONLY lexical inspection; NO runtime or production verification. Raw private source, literals, and credential material deliberately excluded.

- Private baseline: `TrendOS_Code_FULL_V1932_2026-08-24.gs`, SHA-256 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87` (Library; not in public repo).
- Current comparison: `fawakhry/TrendOs`, branch `agent/trendos-book-audit-v1-20261014`, `Code.gs`, blob `e91d78dcceeeca2804e721d58e065a6a7181bfc2`.
- Method: anchored named-declaration scanning and heuristic JavaScript lexical brace matching; raw function spans compared; comments, nested named functions, regex literals, template expressions and ambiguous boundaries can defeat the heuristic. Differences do not by themselves indicate breakage. This is not an AST or semantic/runtime test.
- Extracted original: 614 declarations / 614 unique names; book branch: 642 declarations / 641 unique names.
- Matched text spans: **600**; changed source spans: **12**; inconclusive: **2**; original-only names: **0**; new branch-only names: **27**.
- Duplicate anchored names: original `[]`; book branch `[["score",2]]`.

## Old-only named declarations (do not classify as deleted from production)

None in this scan.

## Book-branch-only named declarations

- `trendosLegacyOrderCreateFenceV1_`
- `trendosEmployeeLegacyBridgeEnabledV1_`
- `trendosEmployeeLegacyBridgeSecretV1_`
- `trendosEmployeeLegacyBridgeHmacV1_`
- `trendosEmployeeLegacyBridgeDecodeV1_`
- `trendosEmployeeLegacyStableValueV1_`
- `trendosEmployeeLegacyPayloadDigestV1_`
- `trendosEmployeeLegacyBridgeForbiddenActionV1_`
- `trendosConsumeEmployeeLegacyBridgeNonceV1_`
- `trendosVerifyEmployeeLegacyBridgeAssertionV1_`
- `trendosCloudEmployeeLegacyBridgeExecuteV1_`
- `score`
- `trendosAllowedScreensForUserV1932_`
- `trendosV1932FindLineRowById_`
- `customerAccountApplyPaymentToFinalInvoicesV1932_`
- `trendosV1932DuplicateLinesAudit_`
- `trendosV1932CheckDuplicateLinesNow`
- `trendosV1932FixDuplicateLinesNow`
- `cwReconcileTextV1_`
- `cwReconcileBoolV1_`
- `cwReconcileSafeEqualV1_`
- `cwReconcileCanonicalV1_`
- `cwReconcileSha256V1_`
- `cwReconcileHeaderIndexV1_`
- `cwReconcileOrderMappingV1_`
- `cwReconcilePlanV1_`
- `trendosCloudWriteReconcileDryRunV1_`

## Changed text spans (review required)

| Function | Private source line | Current branch line | Original chars | Current chars | Delta |
|---|---:|---:|---:|---:|---:|
| `doGet` | 67 | 92 | 14159 | 14403 | 244 |
| `doPost` | 237 | 266 | 2316 | 2549 | 233 |
| `authorize_` | 722 | 975 | 564 | 1420 | 856 |
| `syncOrderFromLines_` | 1119 | 1392 | 3930 | 5505 | 1575 |
| `makeOrderId_` | 1231 | 1535 | 547 | 715 | 168 |
| `getMatbagyNotes_` | 2054 | 2361 | 578 | 1454 | 876 |
| `saveAccountingDeptLine_` | 3078 | 3404 | 8715 | 9653 | 938 |
| `appendLine_` | 3799 | 4156 | 2305 | 3213 | 908 |
| `getRows_` | 3861 | 4235 | 7350 | 7542 | 192 |
| `getTrendMasterCenterV1931_` | 4779 | 5155 | 1759 | 2000 | 241 |
| `saveCustomerAccountMovementV1915_` | 8438 | 8815 | 5080 | 5180 | 100 |
| `createManualOrder_` | 10909 | 11335 | 10708 | 10730 | 22 |

## Inconclusive function boundaries

- `trendosPortalRedirectV1931_` old line 61, current line 61
- `attFindToday_` old line 11765, current line 12255

## Gate / decision

- No deletion candidates are approved by this scan; `UNKNOWN_NEEDS_PROOF` applies to every unproven inactive function and to `Code.gs` itself.
- `SOURCE_ONLY=YES`; `TESTED=NO`; `PRODUCTION_VERIFIED=NO`; `OFFSITE_BACKUP_VERIFIED=NO`.
- Before cleanup: AST re-check, call graph, execution/trigger proof, authenticated snapshot retention, independent recovery test, explicit owner approval.
