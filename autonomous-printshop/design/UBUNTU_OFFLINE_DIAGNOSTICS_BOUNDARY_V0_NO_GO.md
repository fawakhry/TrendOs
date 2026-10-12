# Autonomous Printshop — Ubuntu Offline Diagnostic Boundary V0

**2026-10-12 | REPOSITORY-ONLY / NOT DEPLOYED / NO REAL UBUNTU CONNECTION**

## Why this source-only preparation is necessary

The Trend Mall owner intends for ChatGPT to help diagnose and eventually manage TrendOS/Autonomous Printshop running on Ubuntu, under strong owner control for sensitive operations. **That operating connection does not exist today.** Passing the experimental Print Server does **not** establish production printshop or hardware readiness.

Existing system-owned modules remain the starting point; don't rewrite the Printshop autonomy/Operator Task contracts from scratch:
- `autonomous-printshop/core/autonomy-policy-v1.mjs` is existing default-off, owner/human exception policy.
- `autonomous-printshop/core/operator-task-authority-v1.mjs` has separate OFF/SHADOW/CANARY/GENERAL operator gates and server-backed authority in its eventual real integration.
- The canonical project history is **only** `autonomous-printshop/MASTER_BOOK.md`. The independent EasyStore accounting history remains only in `EASYSTORE_ACCOUNTING_MASTER_BOOK.md` in its **own** repo.

## V0 deliberately has no host connection

New module `autonomous-printshop/core/ubuntu-offline-diagnostic-envelope-v0.mjs` is a **pure JavaScript, offline, synthetic telemetry schema**. It accepts mock status records for TrendOS UI, TrendOS API, Print Server, CUPS, printer device and the *hypothetical* local diagnostic agent. The only accepted telemetry source is `SYNTHETIC_TEST_FIXTURE` in mode `OFFLINE_NO_HOST`; fixed shape and `FAKE-*` IDs only.

A green **mock** result remains `SYNTHETIC_DIAGNOSTICS_GREEN_REVIEW_ONLY`, with `realUbuntuConnected=false`, `realPrinterConnected=false`, `printServerProvedProductionReady=false`, `executeUbuntuAllowed=false`, `sendPrintJobAllowed=false`, `writeAccountingOrStockAllowed=false`, `releaseDecision=NO_GO`. A stopped, unknown or missing simulated module is reviewed as an issue, **not** an instruction to start a service.

**Explicitly rejected inputs:** shell/SSH command, arbitrary hostnames and IPs, paths, logs, URLs, tokens/passwords/secrets, customer IDs, printer payloads, job queues, management flags and any unknown fields. No outbound request is implemented. No Linux process, service, CUPS queue, actual device, database or private file is touched.

## Next phase requires a separate owner-reviewed engineering plan

1. Decide how Ubuntu will **push a constrained, signed and redacted diagnostic summary** to a controlled receive point, or how the owner can manually provide an offline report. Never expose shell, filesystem, SSH credentials, printer commands or full system logs to ChatGPT merely to enable diagnostic access.
2. Build a separate *read-only* Ubuntu-side collector and attestation verifier, without hardcoded endpoints or secrets; establish log redaction, trusted sources, replay protection, expiry/clock tolerance, max size, strict per-field allowlists and rate limits. **Not implemented.**
3. Independently authenticate devices, users, roles and trusted workflow/checker code. Owner should separately approve any future **execution capability**, with narrow action allowlists, explicit confirmation on sensitive actions, immutable audit logs, rollback testing and operator emergency-stop. **Not implemented.**
4. Verify real Printer Server + USB/network hardware, CUPS readiness, print-media/materials, failure recovery, output quality and test order with human supervision before **any real printing**. A synthetic Printer Server status, or prior Print Server test, cannot replace these steps.
5. Keep EasyStore payments/credit, accounting inventory, employee role grants, owner-controlled release gates and Cloudflare deployments OUTSIDE diagnostics. Accounting `FINANCE_RELEASE=NO_GO` and G1–G5 OPEN remain binding.

This PR is **only source/tests/docs**, with a no-credentials GitHub Actions check. It must remain Draft and unmerged pending an authorized source-only merge path. Nothing here configures, runs, starts/stops or connects to the user's Ubuntu machine.

`UBUNTU_BRIDGE_STATUS=NOT_CREATED`  
`PRINT_SERVER_PRODUCTION_ACCEPTANCE=NOT_VERIFIED`  
`AUTONOMOUS_PRINTSHOP_PRODUCTION_RUNTIME=NOT_ENABLED`  
`PRINTSHOP_SOURCE_TESTS=SYNTHETIC_ONLY`  
`G1=OPEN G2=OPEN G3=OPEN G4=OPEN G5=OPEN FINANCE_RELEASE=NO_GO`
