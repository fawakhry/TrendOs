# TrendOS Roadmap — Launch 01/03/2027

> Product launch target: **01/03/2027 — TrendOS V1**.
> Principle: complete and verify one phase before opening the next major phase/chat.

## Phase 0 — Canonical memory and control plane
**Window:** 30/08/2026 → early September 2026  
**Goal:** establish one durable project memory and exact current-state handoff in GitHub.

Deliverables:
- canonical memory files under `docs/trendos/`.
- roadmap and decision register.
- transfer-package provenance registry.
- exact current handoff.

Exit gate:
- future chat can understand scope/current state/next step from GitHub without old chats.

---

# Phase 1 — Core + Cloud
**Window:** September 2026  
**Active now:** YES

## Goal
Make TrendOS Core correct, idempotent, observable, recoverable and fast enough before building the higher product layers.

## Work order
1. Inventory current production source, functions, routes, triggers and sheets.
2. Baseline integrity counts.
3. Event/entrypoint/lock/idempotency/write/retry map.
4. Shared `trendos-integrity-v1.gs` foundation.
5. Order/Line integrity and transaction-like writes.
6. Business Calendar.
7. Attendance/Cleaning integrity.
8. Press source/view/session integrity.
9. Invoice eligibility/pricing/draft integrity.
10. WhatsApp webhook idempotency.
11. Handover/OPS fact-based alerts.
12. Integrity Dashboard + automation observability.
13. D1 atomic sync verification.
14. D1 read/auth performance.
15. Regression pack.
16. Full E2E.
17. Core GO/NO-GO.

## Core exit gates
- zero active duplicate Line IDs.
- no duplicate invoice drafts under repeated sweep/generation.
- approved prices map exactly; unpriced jobs remain explicitly unpriced.
- closed/delivered orders do not return to draft queues.
- Press source/view parity.
- complete/idempotent Press sessions.
- Attendance/Cleaning idempotency tests pass.
- Line IDs remain literal text.
- WhatsApp webhook idempotency passes.
- concurrency tests pass.
- rollback/checkpoint proven.
- no open `CORE-P0` blockers.

At exit:
- update canonical memory.
- freeze exact Core checkpoint.
- create next-chat handoff.

---

# Phase 2 — Customer 360 + Unified Communication
**Window:** October 2026

## Goal
One customer identity and communication journey across Orders, Payments, Designs, Messages, Feedback and Loyalty.

Target deliverables:
- Customer 360.
- Customer Portal integration.
- Unified Inbox architecture.
- WhatsApp production-safe integration.
- Feedback.
- Points/Loyalty.
- role-based communication permissions.
- customer/order/message linkage.

Target flow:
`Message -> Customer -> Order -> Status/Payment/Design context -> Reply/Follow-up`

Exit gate:
- one customer journey works end-to-end without duplicate identity or unsupported AI facts.

---

# Phase 3 — Matbagy AI Brain
**Window:** November 2026

## Goal
Turn the local Matbagy AI prototype into a controlled TrendOS knowledge/assistant layer.

Target deliverables:
- model management/health.
- exact-memory behavior verified.
- approved-reply learning.
- feedback learning.
- tenant-separated memory.
- improved retrieval/embeddings where justified.
- TrendOS live connector for facts.
- safe response-confidence/escalation policy.
- WhatsApp daily learning pipeline where approved.

Non-negotiable:
- live order status, stock, final price, payment and customer approval come from TrendOS, not RAG.

---

# Phase 4 — Smart Designer
**Window:** December 2026

## Goal
A production-oriented design workflow tied to Order/Line context.

Priority products:
1. Mug 20×9.
2. Kids 7×10.
3. Collage.
4. Invitations.
5. Graduation.
6. Laser/vector workflows.

Target architecture:
`Template Engine -> Layer Editor -> Local AI -> Premium AI (optional) -> Proof -> Approval -> Print Ready -> Archive`

Exit gate:
- common design request completes from Order Line to approved print-ready output with archive/version lineage.

---

# Phase 5 — Lead Hunter + CRM + Growth
**Window:** January 2027

## Goal
Turn lead discovery into a measurable acquisition pipeline inside TrendOS.

Target flow:
`Source -> Lead -> Qualification -> Customer -> Order -> Revenue attribution`

Deliverables:
- source tracking.
- lead scoring.
- suggested reply.
- follow-up state.
- conversion workflow.
- CRM integration.
- acquisition analytics.

No unapproved Facebook scraping is required for launch.

---

# Phase 6 — Full Integration
**Window:** 01/02/2027 → 15/02/2027

## Goal
No major new feature work. Connect and test the full platform lifecycle.

Full lifecycle:
`Lead -> Customer -> Order -> Design -> Approval -> Production -> Invoice -> Payment -> Delivery -> Feedback -> AI Learning`

Exit gate:
- cross-module IDs, permissions, audit and state transitions are consistent.

---

# Phase 7 — Launch Hardening
**Window:** 15/02/2027 → 25/02/2027

Focus only on:
- security.
- permissions.
- backup/restore.
- rollback.
- observability.
- performance.
- mobile UX.
- error handling.
- fallback behavior.
- role tests.
- data integrity.
- customer/employee/manager journey regression.

Feature freeze applies except for launch blockers.

---

# Phase 8 — Launch Rehearsal
**Window:** 25/02/2027 → 28/02/2027

Run the system as if launch day:

`Lead -> Customer -> Order -> Design -> Approval -> Production -> Invoice -> Payment -> Delivery -> Feedback -> Learning`

Rules:
- no new optional features.
- every critical failure is fixed and retested.
- final backups/checkpoints recorded.
- launch decision recorded.

---

# Launch — 01/03/2027

## TrendOS V1 definition
A complete operating loop that can:

`Find Customer -> Talk -> Sell -> Design -> Produce -> Collect -> Deliver -> Learn -> Grow`

V1 includes:
- Core Operations.
- Customer 360 / Communication.
- Matbagy AI controlled assistant layer.
- Smart Designer for prioritized production workflows.
- Lead Hunter/CRM growth flow.
- Accounting and operations linkage.
- team/attendance/press/handover integrity.
- administration/control-tower view.

## Post-V1
Not launch blockers:
- Marketplace.
- supplier network.
- commercial logistics marketplace.
- broader white-label network.
- VR/virtual-city concepts.

These start after V1 operational stability is proven.