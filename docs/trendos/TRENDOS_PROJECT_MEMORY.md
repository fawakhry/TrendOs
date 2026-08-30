# TrendOS Project Memory

> Canonical project memory for future chats and execution work.
> Last consolidated: 2026-08-30.
> Launch target: **01/03/2027 — TrendOS V1**, aligned with Matbagy third anniversary.

## Evidence rule

Use this precedence when reconciling conflicting history:

`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`

A plan is not implementation. A generated file is not deployment. A deployment is not production verification. Preserve unresolved conflicts as `Needs reconciliation`.

## Project identity

TrendOS is the unified operating platform for Trend Mall / Matbagy operations. It is not only an order-management app. The target product connects the full business lifecycle:

`Lead -> Customer -> Order -> Design -> Production -> Invoice -> Payment -> Delivery -> Feedback -> Learning -> Growth`

## Product layers

1. **Core Operating System** — Customers, Orders, Order Lines, Production, Accounting, Payments, Delivery, Attendance, Cleaning, Press, HR, Handover, Integrity.
2. **Customer & Communication** — Customer 360, Customer Portal, WhatsApp, Unified Inbox, Feedback, Loyalty/Points.
3. **Matbagy AI Brain** — knowledge, approved replies, learning, local models, live TrendOS connectors.
4. **Smart Designer** — templates, layer editor, proof approval, archive, optional local/premium AI.
5. **Growth** — Lead Hunter, CRM, Facebook/Instagram lead discovery, follow-up and conversion.
6. **Infrastructure** — Cloudflare/D1 read layer, Apps Script write path, secure remote file access, backups and rollback.
7. **Future Network** — Marketplace, suppliers, logistics, white-label/multi-tenant expansion after V1 stabilization.

## Current program phase

**PHASE 1 — TRENDOS CORE + CLOUD**

This is the only active implementation lane until it is complete and verified. Smart Designer, Matbagy AI, Lead Hunter, Marketplace and Logistics remain separate backlog/modules unless explicitly needed for Core integration.

## Current core architecture

### Frontend
- GitHub repository: `fawakhry/TrendOs`.
- Production/default branch: `main`.
- Working branch: `agent/go-live-2026-09-01-integrity`.
- Safety backup branch: `backup/go-live-2026-08-30-pre-p0`.
- GitHub Pages is the frontend hosting lineage.

### Backend / writes
- Google Apps Script remains the operational backend/write path.
- Google Sheets remains authoritative for operational and financial writes during this phase.
- Do not move authoritative writes to D1 without a separate verified migration decision.

### Cloudflare / D1 reads
- D1 is the fast read/mirror layer.
- Orders + Order Lines atomic sync is the current approved direction: stage both, then promote together.
- Newer verified snapshot: 87 sheets mirrored, 31,176 rows, 87 ready, 0 pending.
- Stable page-cache V2.3 is verified; source: `D1_FAST_STABLE_CACHE_V23`.
- Last historical performance bottleneck was Apps Script auth, not D1 page cache.
- `D1_Orders_Fast_V2_4.gs` Fast Auth is prepared but must not be treated as installed/deployed/verified until tested.
- Sheets fallback must remain available for unsafe D1/network/health/parity states.

## Current master technical plan

Primary technical plan:
`TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

Its September target is the **Core stabilization milestone**, not the final platform launch. Final product launch target is 01/03/2027.

Core execution order:

1. Inventory + baseline + trigger map.
2. Shared integrity foundation (`trendos-integrity-v1.gs`).
3. Order/Line integrity.
4. Business Calendar + Attendance + Cleaning.
5. Press integrity.
6. Invoice/pricing integrity.
7. WhatsApp webhook idempotency.
8. Handover / OPS.
9. Integrity Dashboard + observability.
10. D1 performance / Fast Auth.
11. Regression + E2E + GO/NO-GO.

## Core invariants

- `Order ID` is the logical order key.
- `Line ID` is the logical unique key for active order lines.
- Do not delete valid historical data.
- Historical duplicate rows marked `مكرر` are preserved but excluded from active metrics/queues.
- All repeated events must become idempotent.
- Check-then-create/update paths require locks.
- Prices, stock, order states, settlements, press energy values and customer approvals must never be invented.
- Operational truth comes from live TrendOS data, not AI/RAG memory.
- Every fix requires `Expected / Actual / PASS|FAIL` evidence.

## Current backups/checkpoints

- Main spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- Pre-Go-Live spreadsheet backup exists: `BACKUP_TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY_2026-08-30_PRE_GO_LIVE_P0`.
- GitHub safety branch exists: `backup/go-live-2026-08-30-pre-p0`.
- Historical performance checkpoint: before installing Fast Auth V2.4.

## Known current risks

- Apps Script production-source lineage/version content must be inventoried before new deployment.
- Spreadsheet metadata timezone was observed as `America/Los_Angeles` while operating rules use `Africa/Cairo`; do not change blindly before dependency inventory.
- Fast Auth V2.4 lacks verified production test and explicit invalidation review.
- Core P0 integrity fixes must be complete before performance-only optimization.

## Module memory summary

### Branding
- Primary blue `#005BFF`, accent orange `#FF6A00`, black `#111111`, white `#FFFFFF`, gray `#8A8F98`, light gray `#F4F6F8`.
- Arabic fonts: Cairo/Tajawal. English: Montserrat/Poppins.
- Brand phrase/reference: `فكرتك جاهزة`.
- Some spelling/print-spec details remain `Needs reconciliation`.

### Lead Hunter
- Standalone/local-first Lead Hunter with Chrome extension was prepared.
- Latest prepared checkpoint: `trendos_lead_hunter_pro_background_scheduler_v2_fix.zip`.
- Latest fix not user-verified.
- No Facebook scraper is part of the approved design; safe/manual capture plus scheduled search is the intended model.

### Smart Designer
- Local Node/Vite prototype exists.
- Latest OpenAI-capable checkpoint: `matbagy-smart-designer-ai-live-mime-fixed.zip`.
- OpenAI API path reached billing hard-limit; production deployment not confirmed.
- Current preferred direction: Mug Template Engine + Layer Editor + optional Premium AI.

### Matbagy AI
- Local FastAPI + SQLite/FTS5 prototype exists.
- Latest checkpoint: `matbagy_ai_seller_v0_5_8_exact_memory_no_timeout.zip`.
- WhatsApp knowledge import and manual memory save are verified.
- Ollama models were pulled (`qwen3:4b`, `llama3.2`, `nomic-embed-text`), but app-level timeout remained before v0.5.8; v0.5.8 is not verified.
- RAG must never be source of truth for order status, final price, stock or approval.

### Secure Remote Access
- Tailscale + controlled Windows share is the selected pattern.
- Print-shop side was partially working; home Windows client had Wintun/adapter failure.
- Never expose SMB/FTP/RDP/SSH directly to the public internet for this workflow.

## Chat working rule

Use one chat per major phase. Before moving to a new chat, the active phase must have:

`IMPLEMENTED + TESTED + VERIFIED + CHECKPOINT + ROLLBACK + GITHUB MEMORY UPDATED + EXACT NEXT STEP`

This file is the top-level memory entry point. Read `TRENDOS_HANDOFF.md` for the exact current stopping point.