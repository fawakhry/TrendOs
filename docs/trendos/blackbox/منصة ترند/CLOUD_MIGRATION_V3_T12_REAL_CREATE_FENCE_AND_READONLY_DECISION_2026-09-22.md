# T12 — Actual order-create transfer: writer fencing and read-only decision record
Date: 2026-09-22. GitHub-only engineering plan; NOT a deployment authorization.

## Confirmed source scope and limits
- The owner-provided T12 branch archive was verified at parent tree `0d9437475bf1756c09175ab27c7ab0239841804f`. Its repository `Code.gs` is not the same complete project as the 39-server-source Apps Script export.
- The owner-provided Apps Script JSON is a *provisional* recovered copy of an API `getContent` response, associated by the owner with deployment Version 155. Its file is lossy Windows-Arabic text, and the response body does not echo the requested `versionNumber`. Preserve `productionVersion155SourceExact=false` until a lossless UTF-8 export with read-only version-pinned request provenance establishes identity.
- The recovered source contains 5 statically observed `makeOrderId_(...)` call sites: 4 in `Code`, plus 1 in `trendos-order-line-integrity-v1`. This pattern scan is a *minimum inventory*, not a proof that every alternate write path or future edit has been found.
- The owner's original business Google Sheets/bound Apps Script remain sole production CREATE/number authority. R5 and its lifecycle/mirror behavior are independently scoped and must never be globally disabled solely because a create-only candidate exists.

## Business-number creation entrypoints that must be fenced as ONE exclusive authority transfer
| Observed action name | Source function | Possible exposure |
| --- | --- | --- |
| `createOrder`, `createMatbagyOrder`, `clientCreateOrder` | `mbCreateOrder_` | Legacy primary `doGet` and POST-to-GET fallback |
| `createCustomerPortalOrder` | `createCustomerPortalOrder_` | Legacy primary `doGet` and POST-to-GET fallback |
| `submitCustomerDraft` | `submitCustomerDraft_` | Legacy primary `doGet` and POST-to-GET fallback |
| `createManualOrder` | `createManualOrder_` | Legacy primary `doGet` and POST-to-GET fallback |
| `trendosCustomerDraftSubmitV1` | `trendosCustomerDraftSubmitV1_` → `trendosCustomerDraftResolveOrderIdV1_` | Earlier Integrity `ORDER_LINE` route if master/family flags enable it, including POST-to-GET routing |

Do NOT assume the Integrity route is disabled from the archived source, and do NOT infer live flag values from the repository or provisional export. Before any exclusive cutover, verify the published deployment's complete source, all active endpoint variants, flag state and other source files. Fencing only the four `Code.gs` direct writers leaves a fifth possible numeric allocation route.

## Operations that still write existing orders/lines
Status update, bulk department changes, delivery, notification, archive, restore, customer-draft file/line submission and Integrity-routed line changes remain separate lifecycle concerns. A create-only Cloud authority migration without a qualified canonical lifecycle and R5/mirror consistency plan is not ready; do not use a global Google write switch that blocks these unrelated business operations.

## Historic request continuity: preservation is mandatory
- The existing manual frontend generates a fresh `co_...` key on each invocation. Its in-memory busy flag does not survive reload or resolve an ambiguous timeout.
- All `co_...` requests and historical `TRENDOS_CREATE_ORDER_V1908_...` Script Properties must be LOOKUP/RECONCILE ONLY after cutover; never become new Cloud CREATE requests solely because the response was lost.
- The source export contains an administrative `cleanupOldTrendOSCreateOrderProperties` function that, if called, deletes historic entries beyond the latest 15. The review did NOT run this function and found no direct in-project calls to its exact name. Do not invoke it or any bulk deletion/reset helper as a migration shortcut.
- Cloud client keys need server-verified actor/intent/epoch binding, durable registration before initial send, reuse across timeout/reload, and explicit ambiguous-result reconciliation; a regex-matching namespace or browser-only stored state is not authorization.

## Completed isolated GitHub engineering (no production wiring)
- Pure seed-evidence reconciliation requires the Google number property and same-snapshot current/archived Orders and Lines plus D1 mirror: `t12-order-id-seed-evidence.mjs`. Output is a preliminary candidate, not a seed command.
- Supplemental fifth-writer inventory regression test covers bound-project repository sources and Integrity router, and documents the legacy frontend key lifetime.
- Pure cutover readiness now separately requires `integrityDraftSubmitWriterFenceQualified` and `historicGoogleReplayKeyRetentionQualified`; even a fully positive checklist returns `productionActivationAuthorized:false`.
- `t12-client-key-continuity-guard.mjs` provides only a conservative PURE retry disposition from an *already verified* server record: historic lookup; ambiguous reconcile without CREATE; committed receipt verify; exact prepared key resume after independent server admission. It has no storage, network, DB or Worker routing and cannot prove a live ledger exists.

## Next evidence phase — separately scoped READ-ONLY owner decision REQUIRED
No writes/deploys/freezes in this phase. Obtain owner permission to:
1. Capture the correct bound Apps Script project/deployment identity and a lossless UTF-8, `versionNumber=155` read-only `projects.getContent` export. Do not run a script function; do not publish Head or alter a deployment.
2. Inspect non-secret business-number evidence only: the selected next-order-number property value and fully counted current/archived Orders/Lines numeric ID high-water marks. Prefer anonymized counts/maxima and a consistent read-only snapshot, not customer/phone/order-row exports.
3. Inspect the correct production D1 *read-only* mirror high-water mark, sync lineage, R5 writer status and binding identity through a separately approved controlled read method. Do not infer production D1 identity from test database variables.
4. Identify active Google `ORDER_LINE` Integrity flag and five route ownerships without modifying flags or calling an order-create action.

A normal read-only snapshot while Google keeps writing is **not** a final frozen cutover seed. A separate owner-approved writer fence, final post-fence consistency reread, rollback/fallback drill and business parity qualification must precede any real numeric authority handover.

## Independent future decisions — NOT part of the read-only permission
A) Permission for any time-bounded production writer freeze and final snapshot; B) permission to deploy/activate the verified Cloud business-create route; C) approval of the rollback and R5/mirror lifecycle coordination. These are distinct actions requiring new explicit scoping after tests and evidence pass. Never replay the closed synthetic TEST original create or exact-key replay and never re-enable the TEST Worker by implication.

**Stop point:** until permission for the read-only evidence phase is granted, continue only private static analysis, isolated GitHub code/tests and documentation. No test or production Worker deployment, main Sheet/Apps Script data write, R5 change, real D1 mutation, or historic-key deletion is authorized.
