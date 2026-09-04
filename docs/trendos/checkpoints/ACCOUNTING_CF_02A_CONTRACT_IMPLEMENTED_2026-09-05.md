# ACCT-CF-02A — Accounting V1 Contract Implemented

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCOUNTING_CF_02_CONTRACT_PLAN_2026-09-05.md`

## Action
Implemented the first non-mutating canonical Accounting domain/validation contract:

`cloudflare-d1/src/accounting-contract-v1.mjs`

Commit:
`d75f5335ce1c74f26f41b05ca3d36cd55932804e`

## Covered canonical entities
- SalesInvoice
- SalesInvoiceLine
- Payment
- Purchase
- PurchaseLine
- Expense
- Item
- BOM
- BOMLine
- StockMovement
- CashTransaction

## Implemented invariants
- stable identifiers are explicit fields;
- future write-command envelopes require `idempotencyKey`;
- Line economics require `orderId + lineId`;
- optional `sourceOrderId` must equal `orderId`, providing an explicit Line/Order mismatch gate without assuming legacy Line ID formatting;
- customer/supplier/item names are not identity keys;
- monetary values are finite and non-negative;
- material/line quantities are finite and positive;
- item type enum is generic (`raw_material`, `semi_finished`, `finished_product`, `service`);
- payment/stock/cash direction enums are explicit;
- invoice/purchase `paid` and `remaining` cannot exceed `total`;
- Profit/Partner/Investor distribution percentage fields are rejected from Accounting payloads;
- validation output declares `authoritativeWrites=false` and `persistence=none`.

## Important design choice
Line ID formats in historical TrendOS data may be heterogeneous. Therefore the new contract does **not** infer Order identity from string prefixes. Consistency is asserted explicitly through `sourceOrderId` when that source relation is supplied. This avoids breaking valid legacy Line IDs while still allowing deterministic mismatch rejection.

## Production impact
NONE.
- no route wired yet;
- no D1 access;
- no Apps Script access;
- no Google Sheet access;
- no external network access;
- no financial persistence;
- no production traffic change.

## Exact next step
Wire read-only `GET /v1/accounting/contract` and validation-only `POST /v1/accounting/validate` into the isolated Accounting Preview handler, then immediately record the route-wiring checkpoint before adding tests.

**Status: PASS — source contract implemented; route/test wiring pending.**
