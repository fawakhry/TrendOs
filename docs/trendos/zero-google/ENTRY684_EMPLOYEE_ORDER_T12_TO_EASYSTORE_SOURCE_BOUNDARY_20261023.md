# Entry684 / ACC228 — Existing employee T12 order → EasyStore invoice source identity fence (OFF)

**2026-10-23. This is an operational SOURCE-ONLY READ check, not a financial command, not an order writer, not an HTTP route or a live cloud connection.**

## Exact existing systems

- Original TrendOS employee frontend `app.js` already offers `loadAccountingOrderLinesFromLocal()` (button «استدعاء أجزاء وائل وجابر») and final invoice form. This browser-local cache is not an authoritative staff order/customer ownership or finance connector read.
- Existing original T12 `createT12GeneralOrder` on Draft #211 already has ACC223 additive `0035_t12_order_customer_at_create_sourceonly_v1.sql` immutable at-create customer **candidate** capturing legacy numeric `external_customer_id` and separate official native `customer_id`, and ACC224 existing Orders Edge signed employee selector. It is **not** official customer ownership attestation; OFF by default. The current public T12 route does not enable it.
- Original EasyStore canonical book ACC213–ACC227 already owns Wael/Gaber department approvals, one final invoice and receipt, a V1 `order_line_approved` Finance Connector, and original accounting Worker. **No replacement accounting app, invoice writer, customer book or connector was built.**

## Actual changed source

- New `cloudflare-d1/src/t12-employee-order-finance-intake-sourceonly.mjs` on existing TrendOS Draft #211 uses **one `D1.batch` read transaction** on real `t12_prod_orders`, COMMITTED request ledger, ACC223 immutable at-create source, actual native `t12_customers` official ID/version and complete current original `t12_prod_lines` (max two lanes supported by original General Create).
- Requires exact `orderId` and independent expected official customer ID, exact recorded request/order/actor, official ID FK candidate, current active customer and unchanged version, signed selector's stored digest/role/issued-expiry **metadata**, separate numeric original legacy external ID equality, immutable 0-finance/0-delivery flags, and contiguous original Print/Wael and Laser/Gaber lines with exact generated `orderId-01/02`, request identity and valid qty/status/assignment. Two lanes must represent one of each department, never two copies of one lane.
- Missing at-create capture fails closed even if fake order/customer names and phones match. PREPARED, expired/stale selected customer version, mismatched actor/external ID, bad line sets and partial SQL batch also fail closed.
- The safe internal result contains only official operational IDs and department refs (no customer names, phone, private selector token, R2 key, costs, invoice, balance or cash) and **always** `officialCustomerOwnershipAttested=false`, `departmentApprovalsVerified=false`, `financeAuthorized=false`, `canRequestInvoice=false`. A stored selector digest is not independently verified live SSO/owner authorization, a foreign-key capture to a customer is not authenticated business ownership, and original T12 NEW lines are not EasyStore APPROVED financial department lines.

## Evidence and coordination

- Added `tests/t12_employee_order_finance_intake_sourceonly_acc228.test.mjs`, on **actual** original SQLite migration files 0005, 0008 and original dormant 0035 with strictly invented staff, customer, one/two-lane orders. Includes true no-capture negative, immutable capture-delete denial, actor and PREPARED ledger, official customer version drift, wrong ID, wrong assigned Wail/Gaber and missing/extra lines, no mutation and no PII output.
- Added to **existing** `.github/workflows/easystore-acc213-wael-gaber-invoice-sqlite-no-go.yml`, alongside unchanged original T12 create and EasyStore actual Worker fake-invoice tests. Final exact-source SHA/test run must be recorded in canonical book once verified.
- Original EasyStore [Draft #75](https://github.com/fawakhry/EasyStore/pull/75) **existing** joined workflow now pins original TrendOS code HEAD with ACC228, verifies exact SHA and tests same read-only source plus original native invoice engine. Different source-only customer portal Draft #221 Entry683 is pinned **separately**, not merged into a common deployed Worker.

## Unfinished

1. There is **NO enabled** employee→EasyStore invoice adapter or authentic source-signed event, production ACC223 at-create capture, actual official signed customer ownership, or multi-item/attached-file lossless T12 staging (Entry683 remains another OFF code branch).
2. No pricing or EasyStore department invoice approvals in this operational T12 result. Existing EasyStore enforces these after true authenticated cross-cloud linkage.
3. Separate EasyStore Cloud provider/Worker/D1 identity and live Stage release remain unverified, cash custody/real role grants/openings/independent encrypted Ubuntu restore G1–G5 open. Exact staff roles: Wael (Print), Gaber (Laser), رحمة/ريفان invoice/cash entry, ضياء independent reviewer.

**`ENTRY684=SOURCE_ONLY_OFF`; `ACC228_FINANCE_RELEASE=NO_GO`; `ORIGINAL_T12_WRITER_REUSED=YES`; `NEW_ACCOUNTING_WRITER=NO`; `REAL_INVOICE_POST=NO`; `DEPLOY=NO`; `MERGE=NO`; `ZERO_GOOGLE_CUSTOMER_LIVE=0/9`.**
