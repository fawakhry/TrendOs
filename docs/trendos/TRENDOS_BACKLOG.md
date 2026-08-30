# TrendOS Backlog

> Priorities are namespaced so module-local P0 items do not silently block Core unless explicitly promoted.

## CORE-P0 — Active Phase 1 blockers

### CORE-P0-01 — Exact production inventory
- Inventory actual Apps Script source/functions/routes/triggers/sheets.
- Reconcile V1932/V1940 naming/content.
- Reconcile `go-live-autopilot-v1.gs` vs manifest naming.
- Capture trigger cadence.

### CORE-P0-02 — Shared integrity foundation
Create `trendos-integrity-v1.gs` with:
- ID normalization.
- Business Calendar.
- event key/idempotency.
- locks.
- centralized state helpers.
- automation run logging.

### CORE-P0-03 — Order/Line integrity
- one active row per normalized Line ID.
- idempotent Order/Line creation.
- safe partial-write retry.
- preserve historical duplicates as `مكرر`.
- literal-text IDs.

### CORE-P0-04 — Attendance/Cleaning integrity
- one logical session/record per key.
- debounce repeated events.
- lock check/create paths.
- Cairo Business Calendar.
- Friday/special-schedule behavior.

### CORE-P0-05 — Press integrity
- normalized Line ID in queue.
- source/view parity.
- idempotent start/close.
- session Line ID traceability.

### CORE-P0-06 — Invoice/pricing integrity
- one centralized eligibility contract.
- lock/idempotent draft UPSERT.
- persistent generation/material-change state.
- no draft recreation for closed/settled orders without valid change.
- never invent price.

### CORE-P0-07 — WhatsApp webhook idempotency
- Meta Message ID dedupe.
- lock webhook processing.
- retry-safe send state.
- no duplicate action/order from repeated webhook.

### CORE-P0-08 — Handover/OPS integrity
- one handover event per Line ID + shift/business date.
- evidence-based alerts only.
- idempotent OPS follow-up.

### CORE-P0-09 — Integrity Dashboard / observability
- `إدارة - صحة النظام`.
- duplicate counts/drilldowns.
- automation run log.
- last success/error.

### CORE-P0-10 — D1 atomic/read/auth verification
- verify atomic Orders+Lines current endpoints/state.
- preserve fallback.
- test V2.4 only after correctness lane is stable.
- first-hit/cache-hit auth evidence.
- explicit cache invalidation review.

### CORE-P0-11 — Regression/E2E
- duplicate event tests.
- concurrency tests.
- Friday/special schedule tests.
- full E2E.
- zero open Core P0 before Phase 1 exit.

---

## CORE-P1

- unify business/open/closed states across modules.
- improve traceable alert evidence.
- reduce stale/cache ambiguity.
- production deployment manifest reconciliation.
- performance hardening after correctness.

---

## CUSTOMER-P0 — Phase 2

- Customer 360 canonical identity.
- Unified Inbox.
- WhatsApp production-safe Coexistence.
- order/payment/design/message linkage.
- feedback/loyalty integration.

## CUSTOMER-P1

- Facebook/Instagram channels where official integration is available.
- better assignment/follow-up UX.
- channel analytics.

---

## AI-P0 — Phase 3

- verify `matbagy_ai_seller_v0_5_8_exact_memory_no_timeout.zip` exact-memory behavior.
- verify local model health and app integration.
- model-management UI.
- TrendOS live connector for order/pricing/stock facts.
- tenant isolation.
- approved-reply/feedback learning contract.

## AI-P1

- embeddings/vector retrieval where justified.
- WhatsApp daily learning.
- ChatGPT export importer UI.
- safer confidence/escalation policy.

## AI-P2

- broader local-model routing.
- commercial multi-tenant packaging.

---

## DESIGN-P0 — Phase 4

- Mug 20×9 Template Engine.
- editable template library.
- image/name placement.
- Layer Editor.
- proof export/versioning.
- approval/print-ready/archive linkage to Order ID + Line ID.
- Premium AI optional/off by default for standard jobs.

## DESIGN-P1

- Kids 7×10.
- Collage.
- Invitations.
- Graduation.
- Laser/vector workflows.
- revision/points/Wael escalation end-to-end verification.

---

## LEAD-P0 — Phase 5

- move Lead Hunter into CRM acquisition flow.
- source/lead/customer/order linkage.
- lead scoring.
- follow-up/conversion state.
- verify latest V2 fix behavior before reuse.

## LEAD-P1

- acquisition analytics.
- campaign/source attribution.
- broader official channel integrations.

---

## INFRA-P0

- complete secure remote-access home-client path or use macOS-native Tailscale.
- remove/verify unsafe `Everyone Full Control` share posture.
- confirm dedicated limited access account if remote share remains in use.

These are important infrastructure items but are not automatically `CORE-P0` unless they block Core deployment/backup/operations.

---

## BRAND-P0

- reconcile final spelling/print version for Matbagy name in bag assets.
- finalize 2-color vs 3-color print spec where needed.
- finalize bag slogan variant.

Brand P0 is local to branding and is not a Core Go-Live blocker unless launch materials depend on it.

---

## POST-V1

### NETWORK
- Marketplace.
- supplier network.
- printshop network.
- white-label tenants.

### LOGISTICS
- commercial transport marketplace.
- vehicle/driver matching.
- shipment workflow.

### EXPERIMENTAL
- VR City / virtual experience concepts.

These items are explicitly not blockers for TrendOS V1 on 01/03/2027.
