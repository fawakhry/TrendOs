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

## TASK DUP-CREATE-20261008 / STEP SOURCE+TEST+BOOK RESULT — 2026-10-08 Cairo

**RESULT: REPO_SOURCE_QUALIFIED / ISOLATED_CI_PASS / PRODUCTION_UNCHANGED.**
- PREPARE: commit `db0031e08fe56cfb4b6b9fae64292e3d37155983` confirmed readback.
- Isolated backend active-open 48h guard (plus original 120s atomic guard, same-key ledger): `870d4778e1cf7b1a844f2cf0f3dbb5010bf36dee`.
- Exact-shape confirmation guard: `1861a9843c1bdd1981376d5e8986c16739ca3162`.
- Durable privacy-minimized multi-pending browser key and explicit confirm plumbing: `331dd6c031681f2cbb9f7e5fe77da47bf64050c4`, `909c9c81b180bb0ec39568dbb0b96bc504ed2a9c`, `aa60a1174606c5e2b46b7f65734c8ef5f0ea2b8a`.
- Employee form requires concrete job description, explicit deliberate-repeat confirmation, clears successful form before WhatsApp: `893ee8277fd1318f4832ad14907ee48ead10753b`.
- SQLite contract regression including deliberate-repeat, completed order, 48h expiry, replay, parallel requests: `78a794139cd277c6f6a3a45b3b7eda216075f120`.
- Frontend regression plus obsolete unrelated HTML config cache pin correction: `55ce562db8149ca0b26836443de83b394c9d25a6` / `3f75dfd532417b4ca06736343575ef93936d5d32`.
- Browser SHA256 storage real functional test: `fc41fbbf9ef59f167b2c00808666c9517b12c765`.
- Isolated CI workflow (no secrets, no D1/production access): `98fd0fce92b68aedb37df752f5978f27e8f86678`; new functional test wired in `6e702d403c2824a08976bccf0c6c45ccd0d9d040`.
- CI run 37769059526 = FAIL: pre-existing historical HTML cache-version assertion, not backend failure; isolated SQLite PASS. Fixed only obsolete test assertion; run 37769124803 = SUCCESS.
- **Final CI run 37769238385 = SUCCESS, job 113284378958 = all steps PASS**. Covers real SQLite D1 simulation, syntax, frontend static contract, SHA-256 persistence/reload/multiple pending, no-PII storage and save-before-WhatsApp, and no-deploy boundaries.
- Book updated: `6f7b207f35095320dc5fe341db2728473f284bde`, `TrendOS_MASTER_BOOK.md` Incident DUP-CREATE-20261008 and §12.2. Readback verified book has both markers.
- Final independent Production read-only `GET /v1/t12/orders/create/health`: still `T12_GENERAL_CREATE_20261001_DUP_GUARD_V1`, mode GENERAL, guard ready. The candidate build is NOT live; no deployment/read/write side-effect.
- Business order identities and status untouched; no D1 changes, no Apps Script changes, no frontend Worker deployment, no Auto Printshop or Accounting changes. Existing order groups remain for owner manual intent reconciliation, not automatically de-duplicated.

### Open verification / handoff
- This is a candidate on isolated branch only, **not production certification**. A 48-hour still-open fingerprint check is deliberate bounded protection, not lifetime semantic duplicate detection. Need owner review of hold window/operational policy before any release.
- Before any deployment: diff against latest candidate HEAD and full live asset snapshot; run qualified integrated browser E2E and production read-only schema/index check; confirm no other parallel deployments; require an explicit separate owner release authorization and rollback-ready workflow.
- No production write / new business order / synthetic customer tests authorized. Unknown intent for 4764/4765, 4772/4773/4775 — no cancellation or status changes.
- NEXT_ONE_SAFE_STEP: review this isolated branch and obtain owner approval of 48h matching + intentional-repeat workflow; deployment remains BLOCKED until separate authorization.


## TASK CUSTOMER-OPEN-ORDER-GUARD / STEP PREPARE — 2026-10-08 Cairo
- Owner explicit requirement: **رفض إنشاء أي أوردر جديد للعميل طالما لديه أي أوردر مفتوح، بغض النظر عن تطابق البنود والقسم والوقت**. No employee override/confirmation.
- Branch starts at `531ad18376d6b421a24d2798c8249810ab0b9e19`; source candidate HEAD remains `cb94646b05e94d68ce408a26dffa8b6132452c96` at read-only check.
- Read sources before write: `t12-general-create.mjs`, `t12-read-overlay.mjs`, `t12-legacy-line-runtime.mjs`, `edge-orders-read-v1.mjs`, 0005/0006/0010/0011 migrations, browser `app.js`, tests.
- Interpretation: treat status `تم التسليم`, `ملغى/ملغي`, `مكرر` as closed; `جاهز للاستلام` and `في قسم التسليمات` are **open** until actual delivery. Multi-line order is open if **any** line remains open. Match registered customer by normalized phone, else unambiguous normalized name when a phone is missing; transient customer by external ID / full phone, never mix with registered.
- Check Cloud-native lines with current `t12_prod_line_runtime` overlay AND historical `sheet_rows` lines with `t12_legacy_line_runtime` overlay. Missing/unavailable state fails closed. Same request-key confirmed replay returns existing order without making a new one.
- Scope: isolated repo source, D1 in-memory SQLite tests, CI and book/handoff only; **NO Production deployment, NO D1 write, NO existing order mutation, NO business CREATE**.
- Expected: early 409 with existing order ID, no override, no new business number, all status/identity/multi-section/legacy/race regressions; record CI and QA before calling PASS.
- PREPARE outcome: COMMITTED TO JOURNAL only; implementation PENDING.

## TASK CUSTOMER-LANE-ROUTING / STEP CORRECTION PREPARE — 2026-10-08 Cairo

**Owner correction supersedes CUSTOMER-OPEN-ORDER-GUARD PREPARE directly above.** Do **not** globally block the customer. Match **customer + department lane** only:
- PRINT open, requested PRINT => reject; LASER open, requested LASER => reject, irrespective of item description/quantity/age.
- Existing PRINT must **not** block LASER and vice versa.
- A multi-department request creates **only missing/open-free departments**; e.g. existing PRINT + new multi -> LASER line only; existing LASER + new multi -> PRINT line only; both open -> no new Order ID, return existing refs; neither open -> both.
- Multi partial must use a coherent single-created-line ID `<orderId>-01` with correct effective order department and queue; never create phantom second line or duplicate outbox events.
- Preserve idempotency: replay the **original** logical request even if status of existing orders changed. Persist original request canonical and a ledger projection of created/skipped departments.
- Treat delivered, cancelled, duplicate as closed; ready-for-pickup is still open. Query Cloud-native lines plus historical mirror and legacy runtime.
- Remove former deliberate-repeat bypass and 48-hour identical-item guard; this new explicit owner rule supersedes them.
- Read/modify only isolated branch. No production writes/deploy. Add tests for multi partial, both open, cross department, reopened, multiple active lines and legacy; qualify CI and update MASTER_BOOK truth with clear supersession.

PREPARE=COMMITTED; IMPLEMENTATION_PENDING.

## TASK CUSTOMER-LANE-ROUTING / STEP RESULT+HANDOFF — 2026-10-08 Cairo

**ACTUAL RESULT: ISOLATED_REPO_PASS / CI_SUCCESS / PROD_NOT_DEPLOYED.** This authoritative later section supersedes the earlier *CUSTOMER-OPEN-ORDER-GUARD PREPARE* and *48-hour same-fingerprint candidate policy* above. No global customer-level block, no item-name/quantity matching, no confirmation bypass.

- **Rule approved in last user correction:** for a matching registered customer (strongest full phone; fall back to exact normalized name only with missing phone), PRINT and LASER are independent open-order lanes; external customer identity is isolated from registered.
- PRINT existing open => reject PRINT; LASER existing open => reject LASER. If requested MULTI, allocate/order/queue only free lanes (PRINT blocked -> create LASER only; LASER blocked -> create PRINT only; both blocked -> reject entire CREATE without allocating Order ID; neither blocked -> create two lines). Closed statuses: delivered/cancelled/duplicate; ready-to-pick-up is still open.
- Source: `cloudflare-d1/src/t12-customer-lane-policy.mjs` performs read-only Cloud-native lines and `t12_prod_line_runtime` plus `sheet_rows` historical legacy and `t12_legacy_line_runtime`; unavailable legacy catalog fails closed. `cloudflare-d1/src/t12-general-create.mjs` makes effective projected lines and outbox; original request ledger canonical/idempotency is preserved and stores created/skipped-department projection. `cloudflare-d1/src/t12-order-create-shadow-intent.mjs` keeps press/fast-print flags on print lines only, even when multi projects to LASER-only.
- `cloudflare-d1/src/t12-order-create-input-guard.mjs`, `app.js`, `trendos-edge-orders-read-v1.js`: remove previous employee duplicate override; show blocked lane+existing ID and skipped lanes with accepted order ID; retain durable idempotency.
- Test contract: `tests/t12_general_create.test.mjs`, `tests/t12_customer_lane_partial.test.mjs`, `tests/frontend_t12_duplicate_order_guard_entry590.test.mjs`, `tests/t12_create_key_durability.test.mjs`, run only in GitHub Actions on feature branch with in-memory SQLite, syntax and browser/contract assertions.
- `37770746148` / job `113289465406` = SUCCESS on initial independent lane behavior. Later `37770911983` / job `113289999692` = FAILED after heat-press testcase extension: replay used same `clientRequestId` but **different heatPress input**, rightly refused with `same-key-actor-payload-or-policy-conflict` at test line 83; backend did not mis-save an Order.
- Follow-up **test-only correction** commit `c55caff4704c683517349e1d9879d2d9756c5497`: replay passes unchanged `heatPress:'نعم'`. Final independently verified `37771963164` / job `113293468630` = **SUCCESS** (all steps PASS: syntax, SQLite general, SQLite lane/partial/multi/press, frontend, durable key, safety). This is the highest verified test truth.
- Database impact = NONE in Production; unit-test databases are ephemeral SQLite, never actual D1 writes. No Cloudflare Worker deployment, no order CREATE, no Apps Script write, no existing order reclassification.
- Pre-release OPEN GATES: check merged branch source against current `candidate/t12-full-cloud-cutover-a56-20260929` and production Worker assets; specifically verify D1 historical legacy mirror readiness/staleness and runtime overlays, concurrent creates, UI multi order workflow, state when only one lane is saved; re-run automated tests and obtain separate owner authorization for deploy with rollback. **Do not infer Production fixed from CI PASS.**
- Handoff: Feature source branch `fix/t12-duplicate-create-durable-20261008`. Continue from commit `c55caff4704c683517349e1d9879d2d9756c5497` plus documentation updates; do not redo completed steps. NEXT_SAFE_ACTION = production read-only preflight / integrated browser acceptance, no deploy.
