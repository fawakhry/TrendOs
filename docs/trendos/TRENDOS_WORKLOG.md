# TrendOS Worklog

> Consolidated provenance and historical work registry.
> This is not a deployment log by itself. Each entry preserves its evidence state.

## Transfer package registry

### TP-01 — Core Planning / Orders / Customers
**Status:** Historical / partial / planning-heavy  
**Use:** background context only where not superseded by newer verified technical packages.

Covered:
- Add Order planning.
- duplicate-order/customer logic.
- Order/Line status concepts.
- role permissions.
- future accounting linkage.
- AI Orders View concept.

Important rule:
- do not treat this package as implementation evidence where later technical evidence exists.

---

### TP-02 — Branding / Visual Identity
**Status:** Complete historical package  
**Namespace:** `BRANDING`

Established/reference items:
- Blue `#005BFF`.
- Orange `#FF6A00`.
- Black `#111111`.
- White `#FFFFFF`.
- Gray `#8A8F98`.
- Light gray `#F4F6F8`.
- Cairo/Tajawal + Montserrat/Poppins.
- phrase/reference `فكرتك جاهزة`.

Unresolved:
- exact Arabic spelling on some bag artifacts.
- 2-color vs 3-color final print spec.
- bag slogan variant.
- old ZIP content/print verification.

---

### TP-03 — Lead Hunter / Customer Acquisition
**Status:** Complete historical module package  
**Namespace:** `LEAD-HUNTER`

Latest historical checkpoint:
`trendos_lead_hunter_pro_background_scheduler_v2_fix.zip`

State:
- standalone/local-first direction.
- GitHub Pages intended.
- Chrome extension bridge.
- scheduled search opening.
- manual capture/floating button.
- no canonical Facebook scraper.
- latest cancel/delete/toggle fix prepared but not user-verified.

---

### TP-04 — Smart Designer / Matbagy AI Design
**Status:** Complete historical module package  
**Namespace:** `DESIGN`

Latest OpenAI-capable checkpoint:
`matbagy-smart-designer-ai-live-mime-fixed.zip`

State:
- local Vite frontend + Node/Express backend worked after fixes.
- Syntax error resolved.
- image MIME issue resolved.
- OpenAI API request reached billing hard-limit.
- no production deployment confirmed.
- latest direction pivoted toward Template Engine + Layer Editor + optional Premium AI.

---

### TP-05 — Secure Remote Access / Local Infrastructure
**Status:** Complete historical infrastructure package  
**Namespace:** `INFRA`

State:
- Tailscale chosen as secure VPN approach.
- print-shop device/login partially verified.
- `D:\TrendMall-Share` shared as `TrendShare`.
- home Windows client remained broken around Wintun/Tailscale adapter creation.
- `Everyone Full Control` was observed and must not be considered approved production security.

---

### TP-06 — TrendOS Core Technical V1931–V1940 / D1 / Apps Script / WhatsApp / Accounting
**Status:** Complete major technical history package  
**Namespace:** `CORE-HISTORICAL`

Important historical verified evidence:
- GitHub V1932 merged to `main` via PR #11.
- D1 full mirror reached 87 sheets / 31,149 rows at that historical snapshot.
- Fast V2.3 stable cache path used `D1_FAST_STABLE_CACHE_V23`.
- one historical runtime showed ~7.503s total with ~7.453s auth and ~20ms stable-cache lookup.
- historical Apps Script Version 138 deployment action succeeded, exact included content unknown.
- Meta/WABA onboarding remained blocked by permission-sync failure.

Historical-only states that were later superseded by newer project evidence:
- atomic sync package was only prepared/skipped at one point.
- later project state verifies atomic Orders/Lines sync working.
- row count 31,149 is a historical snapshot, not the newest mirror count.

---

### TP-07 — Trend AI Server / Matbagy AI Seller / Learning Center
**Status:** Complete historical AI-platform package  
**Namespace:** `AI`

Latest checkpoint:
`matbagy_ai_seller_v0_5_8_exact_memory_no_timeout.zip`

Verified:
- local web app opened.
- SQLite document/chunk storage worked.
- WhatsApp import created document/chunks.
- manual memory save worked.
- Ollama installed and models pulled.

Not verified:
- v0.5.8 exact-memory fix.
- stable Ollama integration inside app.
- real Meta WhatsApp webhook/send.
- TrendOS live connector.

Architectural rule:
- RAG is not the source of truth for live orders/pricing/stock/approval.

---

## Newer canonical technical state imported after transfer packages

The following state outranks earlier historical package snapshots where conflict exists:

- Working branch: `agent/go-live-2026-09-01-integrity`.
- Safety branch: `backup/go-live-2026-08-30-pre-p0`.
- Core master plan: `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`.
- Main operational spreadsheet has a pre-Go-Live backup.
- Atomic Orders + Lines D1 sync is working in the newer project state.
- newer D1 mirror snapshot: 87 sheets / 31,176 rows / 87 ready / 0 pending.
- V2.3 stable cache verified.
- Fast Auth V2.4 remains prepared/not verified.
- current active execution lane is Core integrity before further performance work.

## 2026-08-30 — Canonical memory initialization

Created on working branch:
- `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
- `docs/trendos/TRENDOS_ARCHITECTURE.md`
- `docs/trendos/TRENDOS_DECISIONS.md`
- `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md`
- `docs/trendos/TRENDOS_WORKLOG.md`
- `docs/trendos/TRENDOS_BACKLOG.md`
- `docs/trendos/TRENDOS_TEST_MATRIX.md`
- `docs/trendos/TRENDOS_HANDOFF.md`

Purpose:
- make GitHub the canonical durable memory before old chats are removed.
- separate current verified state from historical/planned material.
- provide exact handoff for new chats.

## 2026-08-30 — Phase 0 INV-01 Orders / Lines repository inventory

Created:
- `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`

Result:
- `INV-01` is complete for the **current working-branch repository source**.
- this is not yet proof of the exact live Apps Script Version 138 source.

Key discoveries:
- `createManualOrder_()` already has an outer ScriptLock and V1908 Script-Properties request replay when a stable request ID is supplied.
- the current frontend generates `clientRequestId` once per Add Order submit and reuses it across its retry/confirmation path.
- `appendLine_()` already contains a V1932 Line-ID duplicate guard in the inspected repo source.
- `upsertOrderSummary_()` already updates/appends by Order ID sequentially.
- `syncOrderFromLines_()` already excludes `مكرر` rows from active/current totals in the inspected repo source.
- current Customer Portal UI uses Draft -> `submitCustomerDraft_()` rather than direct `createCustomerPortalOrder_()`.
- `submitCustomerDraft_()` has a sequential draft-status replay check but no enclosing lock around check -> allocate Order -> write Lines -> mark submitted; concurrent submits remain a CORE-P0 candidate.
- `updateLine_()` has no shared lock/event idempotency around read/write/summary/log/message side effects.
- bulk status and archive paths have stronger ScriptLock + request-cache patterns, but their idempotency is not yet standardized/durable.
- legacy `mbCreateOrder_()` and direct portal-create paths remain reachable in source and do not have the same stable event-key protection as the main manual path.

Decision from inventory:
- do not implement another blind Line-ID duplicate patch.
- reconcile the actual live Apps Script source/deployment composition first, then design the shared integrity foundation around gaps that truly remain.

Next exact action:
- verify the live Apps Script production source/deployment composition for Orders/Lines (`INV-10` dependency) before modifying Core write functions.
