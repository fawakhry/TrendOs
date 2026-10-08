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
