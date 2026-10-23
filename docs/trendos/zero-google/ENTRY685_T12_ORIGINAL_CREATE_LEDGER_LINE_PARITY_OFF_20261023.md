# Entry685 / ACC229 — T12 original canonical order intent parity before any EasyStore invoice (OFF)

2026-10-23. **Source-only operational integrity**; NO Worker route, NO finance event, NO customer ownership/finance approval, NO additional order writer, invoice or money.

## Original owner goal and duplicate prevention

The existing employee screen already offers «استدعاء أجزاء وائل وجابر», and existing EasyStore ACC213–ACC228 already owns native Wael/Gaber financial approvals, the single final invoice/receipt logic and the V1 Finance Connector. **Do not reimplement these.** Existing ACC228 operational ID/source reader in the **same** TrendOS Draft #211 verified signed-selector source-capture shape, official customer candidate and contiguous 1–2 original T12 lines but did NOT compare item name, quantity, urgency, press/quick-print flags or customer details against what the ORIGINAL T12 create writer actually saved. SQL edits after creation could pass IDs-only shape checks.

## Actual change to existing path

Extended **existing** `cloudflare-d1/src/t12-employee-order-finance-intake-sourceonly.mjs` (no new Worker route or new helper). Its original `T12_EMPLOYEE_INTAKE_ORDER_SQL` additionally reads *already-existing* `t12_prod_request_ledger.canonical_json` and `policy_epoch`, original T12 order customer identity/department/source/notes/priority; its line read additionally reads item name/qty/priority/heat/fly flags. Both SELECTs execute in ONE D1 `batch()` transaction.

The module parses bounded existing canonical JSON and requires exact original writer `canonical()` shape: ledger policy epoch, request key, actor, `identity`, `order`, all `lines`, `activityPlan`, `queuePlans`, and optional **ACC223 mandatory in this lane** `sourceCapture`. Compares original at-create customer/selector digest/version/evidence against the immutable `t12_order_customer_at_create_v1`, original customer name/phone and input legacy external ID against the original T12 order, original order fields and current actual 1–2 department lines, assignment, item name, quantity, flags, urgency, generated line IDs and queue-plan references. One missing/extra or changed field fails closed. Rejects absent/corrupt/intolerably large canonical content, policy change, source mismatch, duplicated lanes, PREPARED or cross-customer.

The successful preview still returns **only minimal original T12 operational order/official customer/department-line identifiers** and always `officialCustomerOwnershipAttested=false`, `departmentApprovalsVerified=false`, `financeAuthorized=false`, `canRequestInvoice=false`, `connectorEventPublished=false`. **Existing ledger canonical_json is NOT cryptographically signed or an immutable historical/customer-ownership proof by itself**: this is a cross-record operational consistency check at read time, not authorization to post a financial event. Original ACC223 capture can be OFF and currently is unmerged; source-only CI doesn't establish live availability or approval. Name/phone comparisons are internal drift checks only, NEVER account matching primary keys.

## Tests and existing CI

Updated `tests/t12_employee_order_finance_intake_sourceonly_acc228.test.mjs` using actual T12 SQLite migration files 0005/0008/0035 and invented staff, 1- and 2-department orders. The fixture now uses **original writer canonical JSON shape**, not `{}`. Expanded negative tests for changed T12 item/qty/priority/heat/fly flags, tampered order customer/notes/source/department, mismatched sourceCapture selector, dropped line, wrong queue plan, changed policy_epoch, invalid JSON. Preserved fake one-invoice native finance Worker/T12 writer tests. Entire existing `.github/workflows/easystore-acc213-wael-gaber-invoice-sqlite-no-go.yml` ran SUCCESS: 13 ACC229 tests, plus existing T12/finance tests.

Test source reference prior to documentation: `d17008e86413972735b0c0dd554c778275e28cd9`, [ACC213+T12/ACC229 #40007274006](https://github.com/fawakhry/TrendOs/actions/runs/40007274006) SUCCESS, all 17/17 exact-head TrendOS GitHub Actions SUCCESS. After this documentation commit, verify new exact source HEAD independently before citing it as final.

## Outstanding authentic finance link

- Original employee `app.js` still selects cached department lines by **textual** orderId and may send legacy invoice calls; no trusted deployed employee→independent EasyStore V1 connector yet. The two TrendOS draft branches PR211 and PR221 remain separate and source-only; no validated combined cloud Worker.
- Official T12 native customer at-create selector is staff selection evidence, not proof of true customer ownership consent or finance rights. Finance requires separately certified original party mapping, sign-off, and human roles.
- `t12_prod_lines` initial `طلب جديد` is not Wael/Gaber approved finance department line or price; original EasyStore writer alone produces final invoice/receipts after authenticated `order_line_approved` event and production gates.
- Independent EasyStore Cloud Worker/D1 provider attestation, full multi-line item/R2 no-loss handoff, official signed source, G1–G5 role/cash/opening/Ubuntu backup-restore, live cutover parity remain NO_GO. NO merge, D1 deployment, production data access/write, money or Google retirement.

**`ENTRY685=SOURCE_ONLY_OFF`; `ACC229_OPERATIONAL_PARITY_ONLY=PASS_TESTS`; `REAL_CUSTOMER_ORDER_OWNERSHIP=UNVERIFIED`; `FINANCE_RELEASE=NO_GO`; `PROD_FINANCE_POST=ZERO`; `ZERO_GOOGLE_LIVE_RETIRED=0/9`.**
