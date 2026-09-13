# Cloud Migration V3 — T11 Service Orders Candidate Parity V1

Date: 2026-09-13
Branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
Workflow: `TrendOS T11 Service Orders Candidate Parity`
Run: `34778029488`
Job: `103779615316`
Workflow commit: `ffc939774140ff4d53ef09696dca8889f1af2957`
Result: **FAIL-CLOSED / READ-ONLY**

## Candidate
Build Service rows from D1 `الأوردرات` using the proven deployed Service field contract and exclude the user-approved legacy block:
- status = `طلب جديد`
- Orders source rowNumber <= 14

## Result
- Apps Script Service active rows: 35
- D1 Service candidate rows: 35
- Missing candidate matches: 1
- Extra candidate matches: 1
- Multiset exact: false
- Sequence exact: false
- Apps Script request duration: 6315 ms
- D1 Orders mirror syncedAt: `2026-09-13 18:38:19`
- No business identities exposed.
- No production mutation.

The exclusion count is now correct; only one of the 35 rows differs in the compared operational contract.

## Next step
Run a privacy-safe per-field mismatch diagnostic, matching rows internally by order identity but logging only field names and mismatch counts. Do not deploy or cut over Service until the remaining one-row difference is explained and parity passes.
