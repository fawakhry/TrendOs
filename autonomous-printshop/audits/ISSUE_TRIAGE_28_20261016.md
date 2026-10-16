# Autonomous Printshop — 28-item issue triage (2026-10-16, Cairo)

Status: SOURCE_ONLY triage, NOT production authorization. Base commit: ab21183f9444b8ebb49932f1b1e4f3c381888851. Canonical append-only history remains autonomous-printshop/MASTER_BOOK.md; this isolated document is a proposed book companion pending verified append. No merge/deploy/host/printer actions.

## P0 — fail closed
1. Owner Console access protection / MFA: BLOCKED pending current authenticated/unauthenticated runtime evidence.
2. Ubuntu-to-printshop secure connectivity: BLOCKED, no connection authorized.
3. Real TrendOS order read authorization: BLOCKED pending scoped synthetic tests and separate live permission.
4. DESIGN approval gate: BLOCKED for production.
5. MATERIAL approval gate: BLOCKED for production.
6. MACHINE safety/availability gate: BLOCKED for production.
7. End-to-end autonomous printing: NO_GO / NOT_RUN.

## P1 — source/contracts

Resolved items are removed from the active backlog after CI evidence. #9 is CLOSED (synthetic/source scope only); see closure evidence below.
8. Book versus config.js native employee auth setting: SOURCE_ONLY discrepancy; compare deployed config separately.
10. getRows versus getRowsPageV1931: SOURCE_ONLY; compare permission and pagination contracts.
11. Employee least-privilege read scope: BLOCKED pending authorization matrix tests.
12. Durable Andon/exception state storage: UNKNOWN current runtime; design audit and idempotency checks.
13. Operator Task activation gates: OFF / NO_GO.
14. Windows Print Server live shop status: UNKNOWN.
15. Ubuntu iMac actual shop network reachability: BLOCKED.
16. SSH safe authenticated connection: BLOCKED; installation/listening screenshot is not login proof.
17. NetBird connected device and constrained policy: BLOCKED; last owner report NeedsLogin/policy OFF.
18. Approved order-to-printer bridge: BLOCKED.
19. CUPS/printer safe control: NOT_RUN.
20. Physical machine production cycle: NOT_RUN.

## P1 — branch and CI hygiene
21. Book divergence across AP branch lineages: BLOCKED pending latest HEAD/blob ancestry check.
22. PR #97 merge conflict: BLOCKED; no force push or silent merge.
23. Ubuntu PR #121/#122/#123 separate branch ancestry: SOURCE_ONLY, no book replacement.
24. Workers Preview failure: historical FAIL; retrieve current job logs before diagnosing cause.
25. Synthetic tests are not runtime evidence: TESTED_SYNTHETIC only.
26. Security/role negative tests: BLOCKED until sufficient coverage.

## P2 — hub coordination
27. Immediate agent-to-agent messaging: UNKNOWN; registry describes issue-backed scheduled pilot, not verified live responses.
28. Autonomous multi-agent handoff: UNKNOWN; require evidence of first completed specialist cycle.

## Closed (not active backlog)
- #9 strict-success fail-closed contract: CLOSED for synthetic/source scope, tested at commit 7d586c75e1783d3a451e3d761efcf0e0e5049e73. AP-296 hosted synthetic PASS https://github.com/fawakhry/TrendOs/actions/runs/38900935137 ; Policy V1 PASS https://github.com/fawakhry/TrendOs/actions/runs/38900935295 . Historical first-run FAIL https://github.com/fawakhry/TrendOs/actions/runs/38900803018 remains preserved. NOT DEPLOYED, NOT VERIFIED RUNTIME.

## Execution order
A. Reconfirm HEAD/base/mergeability, CI and canonical book blob before modifying book. B. Add isolated synthetic strict-success tests and source-only patch. C. Audit read permissions and API contract. D. Resolve book branch divergence by owner-approved review only. E. Request separate explicit authorization for each host/network/printer action; never infer authorization from this backlog.

Historical evidence must remain intact: PR #120 CI failures and later branch-base repair; AP-281 PNG fixture initial failure and correction; Workers Preview failures; AP-156 owner screenshot only versus later reported screenshots; AP-297 source/book discrepancy. None is a current runtime PASS.

References: https://github.com/fawakhry/TrendOs/pull/95 ; https://github.com/fawakhry/TrendOs/pull/97 ; https://github.com/fawakhry/TrendOs/pull/121 ; https://github.com/fawakhry/TrendOs/pull/122 ; https://github.com/fawakhry/TrendOs/pull/123 .
