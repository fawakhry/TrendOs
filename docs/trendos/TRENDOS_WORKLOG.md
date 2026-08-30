# TrendOS Worklog

> Consolidated provenance and historical work registry.
> This is not a deployment log by itself. Each entry preserves its evidence state.
> For exact step-by-step current execution, use `docs/trendos/TRENDOS_EXECUTION_LEDGER.md`.

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
- Fast Auth V2.4 was reviewed later and rejected for deployment.
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
- `INV-01` complete for current working-branch source.

Key discoveries:
- manual order path already had ScriptLock and stable request replay.
- frontend reused `clientRequestId` across Add Order retry.
- `appendLine_()` already had duplicate guard.
- `submitCustomerDraft_()` had no outer lock around conversion.
- `updateLine_()` had no unified idempotent mutation contract.

Decision:
- reconcile live Apps Script source/deployment before any blind patch.

## 2026-08-30 — Production/source reconciliation

Verified:
- active Web App Version 143.
- live backend `V1932_FULL_GO_LIVE_20260824`.
- correct main workbook and 87 sheets.
- Version 143 top-level D1 routes for Dashboard and Orders.

Critical lineage discovery:
- old V1940 modular manifest predates later consolidated V1932 FULL `Code.gs` lineage.
- GitHub `Code.gs` must not be used to overwrite production.

Result:
- `INV-10` remains PARTIAL only for exact full Version 143 file list; evidence boundary documented.

## 2026-08-30 — Phase 0 module inventories completed

Completed read-only inventories for:
- Orders/Lines.
- triggers.
- Invoice/Ready Sweep.
- Attendance/Clock-in.
- Cleaning.
- Press.
- WhatsApp/Customer Manager/Feedback.
- Handover/OPS.
- D1/Auth paths.

Historical live/source failures were preserved in `TRENDOS_TEST_MATRIX.md`; they were not rewritten as PASS merely because later fixes were prepared.

## 2026-08-30 — Fast Auth V2.4 rejected

Prepared V2.4 source review found:
- sanitizer could include primitive `password` and `token` fields in Script Cache payload.
- invalidation helper was not wired to auth lifecycle.

Decision:
- **DO NOT DEPLOY V2.4**.

A safer V2.5 lane was designed later and remains separate from first Core activation.

## 2026-08-30 — Integrity V1 implementation series

Implemented and CI-tested on `agent/go-live-2026-09-01-integrity`:

1. `trendos-integrity-v1.gs` — shared locks, ID normalization, business calendar, durable event/idempotency ledgers.
2. `trendos-order-line-integrity-v1.gs` — Draft/Order/Line concurrency and stale-row protection.
3. `trendos-attendance-cleaning-integrity-v1.gs` — session uniqueness, clock-in enforcement, event idempotency, real checklist data.
4. `trendos-press-integrity-v1.gs` — session Start/Stop integrity + Order/Line snapshot ledger.
5. `trendos-invoice-integrity-v1.gs` — canonical Draft/revision/finalization/Ready Sweep protection.
6. `trendos-whatsapp-integrity-v1.gs` + frontend stable-send shim — logical send idempotency and webhook exact-once contract.
7. `trendos-handover-ops-integrity-v1.gs` — structured Handover + OPS state fingerprint + automation run contract.
8. `trendos-andon-integrity-v1.gs` — structured ANDON/resolve path.
9. `trendos-integrity-dashboard-v1.gs` — problem counts plus IDs/details and automation observability.
10. `D1_Fast_Auth_V2_5_Safe.gs` — optional non-secret revisioned fast auth, kept outside first Core activation.
11. `trendos-integrity-router-v1.gs` — default-OFF guarded route family integration.

Representative verified CI runs:
- Attendance/Cleaning `33319559363` SUCCESS.
- Press `33320046858` SUCCESS.
- Invoice `33323669244` SUCCESS.
- WhatsApp `33324339920` SUCCESS.
- Handover/OPS `33326904772` SUCCESS.
- Integrity Dashboard `33327350322` SUCCESS.
- Fast Auth V2.5 SAFE `33327466500` SUCCESS.
- composed Apps Script test `33327527682` SUCCESS.
- granular default-OFF flags `33328375829` SUCCESS.

Important checkpoints:
- Order/Line correction `7a5cf846e978110c0111eb4f6461b5d21652e985`.
- Order/Line checkpoint `e75756feb2f21a0e2f38b71eeaf88a5f5543eabe`.
- Attendance/Cleaning checkpoint `c5c5ebf2281064997dac2a3f2353f72409698271`.
- Press checkpoint `70d604f11bee35fd2e53ee4d83724e9242b9209b`.
- WhatsApp checkpoint `db1da117c3b7aba044bfa61cd2522f2279082e28`.

Production impact for the entire Integrity V1 implementation series: **NONE**.

## 2026-08-30 — Integrity V1 package and deployment safety

Created:
- `trendos-integrity-v1.package.json`.
- pre-deploy package safety test.
- composition collision/syntax test.
- `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md`.
- regression coverage documentation.

Safety model:
- install != activate.
- master flag default OFF.
- family flags default OFF.
- Fast Auth V2.5 separate default-OFF switch.
- `Code.gs`, Fast Auth V2.4, and old conflicting modular V1932 overlays are excluded/forbidden.

Final candidate CI:
- SHA `e72d873603841bc8e41bd8c228e3240f2feb2a29`.
- run `33328415852` = SUCCESS.

## 2026-08-30 — Pre-deploy candidate frozen

Created branch:
- `release/integrity-v1-predeploy-2026-08-30`

Pinned at:
- `e72d873603841bc8e41bd8c228e3240f2feb2a29`.

Meaning:
- fixed reference for controlled installation testing.
- not a production deployment.

## 2026-08-31 — Apps Script routing source capture

Inspected current supplied 13,959-line Apps Script snapshot.

Confirmed:
- `doGet()` calls V1932 -> V1900 -> V1898 -> legacy action chain.
- `doPost()` parses payload, calls V1932 -> V1900 -> V1898, then POST handling/fallthrough.
- V1932 router handles Meta verification and WhatsApp POST before older routes.
- existing WhatsApp POST executes Feedback webhook then Customer Manager webhook.

Conclusion:
- controlled Integrity wiring point is known conceptually.
- exact full live file list remains inaccessible from connectors.
- WhatsApp activation must prevent dual legacy+Integrity side effects for one Meta payload.

Production impact: **READ-ONLY**.

## 2026-08-31 — Apps Script tooling boundary confirmed

Available tools can modify GitHub and supported Google Drive/Sheets resources, but no direct connector can write the Google Apps Script source project.

Therefore controlled installation requires limited user assistance in Apps Script UI.

Exact next evidence requested:
- screenshot of complete Apps Script source-file list in left sidebar.
- no edit, no new file, no deployment yet.

## 2026-08-31 — Durable execution ledger created

Created:
- `docs/trendos/TRENDOS_EXECUTION_LEDGER.md`

Purpose:
- preserve every material execution step, evidence state, CI/commit, production impact, rollback and exact next step.
- make continuation from a new chat deterministic.

New standing rule:
- after every material TrendOS execution step, update the Execution Ledger before moving on.
- new chats must read Project Memory -> Execution Ledger -> Handoff before acting.
