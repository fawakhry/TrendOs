# Zero Google — Owner scope: Customer Portal/UI ONLY (23 October 2026)

## PREPARE: read-only source diagnosis and preservation

**Owner clarification (Arabic):** `العملاء موجودين على كلاود ومفيش فيهم مشكلة انا عاوز بس المنصة بتاعتهم`.

Interpretation: the existing **customer master is accepted as already resident in Cloudflare** by the owner. The work requested is the **customer-facing platform, its frontend/API wiring, onboarding/login/session, viewing own orders, creating orders, adding items, sending draft files, and viewing one's permitted account** without Google dependency. Do not restart customer data migration, create another customer database, reconcile customer master, or modify already-running employee/T12/EasyStore/Printshop ownership as a substitute. This is NOT evidence of independently audited D1 customer identity/phone ownership or an authorization for live customer enrolment.

**Book authority:** Old `TrendOS_MASTER_BOOK.md` is ACTIVE_WRITE on `agent/trendos-book-audit-v1-20261014`; `TRENDOS_CURRENT_SYSTEM_CATALOG.md` is FROZEN_MIGRATION_ONLY. This record is on an isolated, reviewable source-only branch; it must be appended to old book only, NOT to frozen catalog. No Cloudflare/D1/Google/EasyStore/Apps Script/Production mutation or deploy.

## Source evidence pinned (read-only; no assertion of production parity)

- Active book branch at scope freeze: `cf4a1622973010fcd14c733de0dd6586457b659d`.
- Existing user interface: `index.html` blob `788074c5fb4c3d4db2af9dc0b4dabffe3c34cfc1` at customer source PR #221 head `fca5625e53815647addc6d183ebe4040990acdf5`, lines 68–84 (customer login), 809–924 (customer portal/dashboard/new order, draft/chat/files). Reuse this existing UI; no duplicate/new platform.
- Browser implementation: `app.js` blob `9d90b5b1a1fc5c1ad2058cc29e97530c68c1a875`. Lines 1446–1457: all `api(action)` and `apiPost` currently call `window.trendosLegacyApiTransportV1`; 1933–1960 login action; 3482–3499 customer orders action; 3902–4019 draft create/file/add/submit actions; 4072–4105 password change + logout; 9310–9325 account action.
- Current server-side bridge: `cloudflare-d1/src/legacy-browser-transport-v1.mjs` blob `d3f1407c260c4b623352469372265c01d9bd8ad4`, 9 customer actions at lines 29–33 explicitly exempted from employee Native-only upstream retirement; lines 89–103 forwards to `script.google.com`. This *proves source routing*, not that a new deployed Worker matches the source.
- Current config source: `config.js` blob `8b83d9afd53d9c7fc95d9fb309ec0bfa350121d2` has Cloudflare API origin for employee/orders but no enabled customer-native portal feature cutover.

## Customer UI replacement inventory — reuse existing work

| Existing UI action | Source-only alternative on previous Draft branches | Latest source status |
|---|---|---|
| `customerLogin` | Entry662 Native login/PBKDF2 session; OTP Entries657–659 | OFF, no real enrollment/login HTTP route |
| `customerLogout` | Entry661 native session revoke CAS | OFF |
| `changeCustomerPassword` | Entry663 native password rotation with session revocation | OFF |
| `getCustomerOrders` | Entry660 session-scoped exact customer/order-owner read | OFF; owner evidence needed |
| `createCustomerDraft` | Entry664 D1 draft create | OFF |
| `addCustomerDraftItem` | Entry665 D1 item add | OFF |
| `uploadCustomerDraftFile` | Entry666 D1+R2 private file stage | OFF; missing production R2 binding, scan & reconciliation |
| `submitCustomerDraft` | Entry667/674/681/682/683 immutable read-only T12 handoff preflight/seal/link | **not implemented as a live submit**, existing T12 order writer stays sole authority |
| `getCustomerPortalAccountsV1859` | Entry668/669 exact-ID EasyStore D1 **balance-only preview** | not full statement parity; finance source owner attestation required |

**All nine current portal actions remain source-routed to legacy Google bridge until individually and safely cut over.** In particular, don't convert the browser API function globally (it serves employees too), silently fall back to Google after Native failure, expose customerId from browser as entitlement, or promise order submission based on preflight result alone. The existing frontend is already built; primary remaining engineering is transport integration + server routes + customer enrollment + functional response parity, not customer master migration.

## Agreed priority and next one safe software unit

1. **P0 portal entry/auth:** preserve customer UI and existing employee/T12 paths. Isolated **default-OFF** frontend customer transport adapter (without changing `api()` for employee paths), source contract tests ensuring no Google upstream when Native customer feature is enabled. Server must have independently qualified Native login/session routes and protected proof before ON.
2. **P1 orders display:** adapt `getCustomerOrders` response shape; require session + independently verified owner linkage; no name/phone shortcuts. Dual source-contract tests of UI/API compatibility, no real customer data.
3. **P2 new order:** Native create/add R2 file/submit only after verified secure T12 single-writer handoff, multi-item and file parity, no duplicate orders. No premature UI acknowledgement of an order ID.
4. **P3 optional account statement:** consume *authorized* EasyStore API with exact owner ID, but do not create any second accounting writer, and don't show preview balance as full statement.

No source-only readiness is deployment approval. Before any real user rollout, audit independently live deployed hashes, stage/rollback, customer phone/OTP consent, live routing, and real API permission models with owner. Preserve current live portal until a feature-by-feature approved cutover, not all-at-once flag flip.

## RESULT
Source-routing inspection completed and scope frozen as documentation-only. No files/code/CI, user records, secrets, Cloudflare settings, migrations or live pages have been changed by this diagnosis. `CUSTOMER_PORTAL_SOURCE_GOOGLE_ACTIONS=9/9`; `PROVEN_LIVE_NATIVE_CUSTOMER_ACTIONS=0/9`; `ZERO_GOOGLE_COMPLETE=NO`; `CLOUD_CUSTOMER_MASTER_REBUILD=OUT_OF_SCOPE`.
