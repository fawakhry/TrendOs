# Entry655 — Zero-Google Customer Order Ownership Gate (SOURCE_ONLY / NO_GO)

Date: 2026-10-13 Africa/Cairo
Base: Entry654 Draft #125 exact head `a453d3f86e9717f05a2287a5725400da63a87783`
Branch: `test/zero-google-customer-order-ownership-proof-no-go-20261013`

## PREPARE
No Production mutation authority, merge, live D1, Google Sheets/Drive or customer data access. This project is only shared TrendOS.

Source findings:
- `Code.gs:getCustomerOrders_` currently authorizes a session but then accepts order rows when customer code matches **OR** customer name key matches. Reusing the name fallback for cloud customer portal could expose a similarly named customer's orders.
- `t12_prod_orders` has `external_customer_id`, not guaranteed canonical `t12_customers.customer_id`; `employee_core_orders_v1` has name, not verified customer ID.
- Existing T12 official CREATE authority is D1 and its Customer Order-ID guard must remain unchanged. Historic Google orders cannot be silently asserted as native.
- Entry654 identity schema default OFF is source-only and has not been applied.

Scope:
1. Source-only additive **UNAPPLIED** native-order ownership proof schema with hard foreign keys to canonical native order/customer identity, status PENDING/VERIFIED/REVOKED and unique proof reference.
2. Source-only SELECT-only redacted summary of native order ownership readiness; no names, order numbers, phones, tokens, or financial records returned.
3. In-memory SQLite invariants and Node mock read-only tests. Maintain NO_GO unconditionally until independent real session/identity + order ownership proofs, deployed route qualification and owner approval.
4. Do not change customer frontend, old Apps Script, routes, workers, invoices, R2, print, Orders production, schema state, credentials, or settings.

Not authorized: automatic linking by name/phone, importing legacy historical orders, enabling customer order GET, inferring customer ownership from `external_customer_id`, or modifying any business data. No source in this PR grants actual customer-order READ.
G-CUST-3 remains OPEN. `ZERO_GOOGLE_COMPLETE=NO`.

## RESULT
PENDING exact-head source CI.
