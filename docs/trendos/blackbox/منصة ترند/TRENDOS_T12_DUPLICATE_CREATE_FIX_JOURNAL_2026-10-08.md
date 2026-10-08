# TrendOS T12 — Duplicate Create Incident / Isolated Repair Journal

## TASK DUP-CREATE-20261008 / STEP PREPARE — 2026-10-08 Cairo
- Authorized scope: source and isolated tests on `fix/t12-duplicate-create-durable-20261008`; documentation in TrendOS Master Book. **NO Production deploy, NO D1/Apps Script writes, NO business CREATE**.
- Source branch: `candidate/t12-full-cloud-cutover-a56-20260929`.
- BASE_HEAD: `cb94646b05e94d68ce408a26dffa8b6132452c96`.
- Operations: DOC_WRITE PREPARE then isolated branch source patches, tests and result/handoff.
- Preserve all unrelated parallel work (Entry651+), live API/frontend/worker, master Order IDs, legacy CREATE fence, D1 schema and native auth.
- Evidence: Owner performed SELECT-only D1 pair comparisons: 4764↔4765 (804s), 4772↔4773 (853s), 4773↔4775 (223s); same customer/phone, department, source, notes, line item, qty, print flags, and line count. Multiple actual D1 Order IDs; business intention remains UNKNOWN.
- Root-cause candidates backed by source: 120s guard expiry; per-click creation keys; 20-minute tab-only pending key; frontend WhatsApp follow-up before clearing successful form; generic order descriptions.
- Proposed bounded changes: fail-closed exact-fingerprint **active-order** duplicate check beyond 120s; explicit confirmation for *intentional* repeated business order; preserve short atomic guard and idempotent same-key replay; durable privacy-minimized pending attempt; clear successful order form before WhatsApp side effects; require typed line-item description in employee form.
- Gate: code must run isolated Node/D1 tests; regression + concurrent requests + replay + legitimate repeat + no-retry network error. No blind rebase or production action.
- EXPECTED: All changes remain repo-only on isolated branch with PASS evidence; otherwise mark PARTIAL/BLOCKED and no deploy.
- PREPARE result: NOT YET APPLIED.

