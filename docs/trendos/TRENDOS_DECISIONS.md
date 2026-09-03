# TrendOS Decisions

> Decision register. Keep user decisions distinct from assistant recommendations. Do not silently convert recommendations into approved business rules.

## D-001 — One platform, not separate disconnected apps
**Type:** User direction / canonical product decision  
**Status:** ACTIVE

TrendOS is the single platform. Orders, customers, communication, AI, design, growth, operations and accounting are modules within one operating system.

## D-002 — Final V1 launch date
**Type:** User decision  
**Status:** ACTIVE

Target full TrendOS V1 launch: **01/03/2027**, aligned with Matbagy third anniversary.

The September 2026 Go-Live plan is now treated as **Core stabilization**, not the final complete-platform launch.

## D-003 — One phase per chat
**Type:** User decision  
**Status:** ACTIVE

Use the current chat for `PHASE 1 — CORE + CLOUD` until complete. Each later major phase gets a dedicated chat. GitHub memory is updated before handoff.

## D-004 — GitHub is canonical project memory
**Type:** User direction  
**Status:** ACTIVE

Future chats must start from GitHub canonical memory rather than relying on old chat history. This is especially important because historical chats may be deleted.

## D-005 — Evidence hierarchy
**Type:** Canonical handoff rule  
**Status:** ACTIVE

`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`

Do not equate generated/saved/deployed/verified states.

## D-006 — Google Sheets authoritative writes during current D1 phase
**Type:** Current architecture decision  
**Status:** ACTIVE

Operational and financial writes remain authoritative in Google Sheets/Apps Script. D1 is the fast read/mirror layer until a separately designed and verified write migration is approved.

## D-007 — Atomic Orders + Lines sync
**Type:** Current architecture decision  
**Status:** ACTIVE

Orders and Order Lines must stage and promote together to prevent partial visible states.

## D-008 — Integrity before performance
**Type:** Core execution decision  
**Status:** ACTIVE

P0 correctness, idempotency, locks, business calendar and transactional behavior take priority over Fast Auth/other performance optimization.

## D-009 — Line ID uniqueness
**Type:** Core data-integrity decision  
**Status:** ACTIVE

`Line ID` is the logical unique key for active Order Lines. Historical duplicates may be preserved as `مكرر` but must not count in active queues/KPIs/productivity.

## D-010 — Order ID uniqueness
**Type:** Core data-integrity decision  
**Status:** ACTIVE

`Order ID` is the logical order key across operations, accounting, archive, D1 and customer context.

## D-011 — Do not invent operational or financial truth
**Type:** Safety/business decision  
**Status:** ACTIVE

Never invent final pricing, stock, order status, payment settlement, delivery promise, customer approval or press-energy values.

## D-012 — AI is not the source of live facts
**Type:** User/architecture decision  
**Status:** ACTIVE

Matbagy AI/RAG handles knowledge, policies and response assistance. Live facts must come from TrendOS live connectors/source-of-truth systems.

## D-013 — Smart Designer cost model direction
**Type:** Latest user direction  
**Status:** ACTIVE DIRECTION, business pricing still needs confirmation

Preferred architecture:
- common jobs: Template Engine.
- edits: Layer Editor.
- local AI when useful.
- Premium AI only for difficult/paid cases.

Historical 5 EGP / 10 EGP designer pricing is not treated as final production pricing because it may not cover AI generation cost.

## D-014 — Proof before print
**Type:** User/business decision  
**Status:** ACTIVE

Design workflow requires proof and customer approval before print conversion. Approved design should be archived for reuse.

## D-015 — Lead Hunter stays safe / no unapproved scraper
**Type:** Current module decision  
**Status:** ACTIVE

Lead Hunter uses scheduled search/opening, extension/manual capture and analysis. No canonical Facebook group scraper is approved.

## D-016 — Secure remote access pattern
**Type:** User selection + security direction  
**Status:** ACTIVE

Use private VPN-style access (Tailscale) plus a controlled shared folder. Do not expose SMB/FTP/RDP/SSH directly to the public internet for this workflow.

## D-017 — WhatsApp Coexistence preservation
**Type:** User requirement  
**Status:** ACTIVE

Do not delete, migrate, deregister or replace the current WhatsApp number/WABA merely to work around Meta permission/onboarding problems. Preserve current number and conversation continuity.

## D-018 — Multi-tenant isolation for future commercial product
**Type:** User/product direction  
**Status:** ACTIVE FOR FUTURE PRODUCT

Each sold printshop/client must have isolated tenant data, users, AI memory and configuration. Do not mix Matbagy internal knowledge with external tenants.

## D-019 — Marketplace / Logistics are post-V1
**Type:** Roadmap decision  
**Status:** ACTIVE

Marketplace, suppliers, logistics and broader network expansion are not blockers for TrendOS V1 launch on 01/03/2027.

## D-020 — الصندوق الاسود لترند مول هو الاسم الرسمي لذاكرة المشروع
**Type:** User decision / canonical memory naming  
**Status:** ACTIVE

الاسم الرسمي لمنظومة الذاكرة التنفيذية الكاملة للمشروع هو **الصندوق الاسود لترند مول**.

GitHub entry point الرسمي هو:

`الصندوق الاسود.md`

ويجب التعامل معه كمظلة فوق ملفات الذاكرة التقنية الحالية، وليس كبديل يحذفها أو يعيد تسميتها. الملفات الداخلية مثل Project Memory وExecution Ledger وHandoff وCheckpoints وDecisions تبقى بأسمائها ومساراتها الحالية للحفاظ على الروابط والـcheckpoints، بينما يبدأ أي استكمال جديد من `الصندوق الاسود.md` ثم يتبع ترتيب القراءة المسجل بداخله.

## Needs reconciliation

1. Exact production Apps Script source/version content behind historical deployment Version 138.
2. V1932/V1940 naming/version mismatch.
3. `go-live-autopilot-v1.gs` vs manifest name `go-live-autopilot-backend-v1.gs`.
4. Spreadsheet metadata timezone vs Cairo business-calendar rules.
5. Final bag spelling/color-count/slogan details in branding assets.
6. Final designer commercial pricing/revision rules.
7. Exact current Lead Hunter GitHub/extension deployment state.
8. Matbagy AI v0.5.8 exact-memory/Ollama behavior remains unverified.
9. Secure remote-access home-client status remains unresolved.
