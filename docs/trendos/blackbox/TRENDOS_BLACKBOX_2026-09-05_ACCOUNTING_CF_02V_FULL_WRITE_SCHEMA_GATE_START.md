# TrendOS Black Box — ACCT-CF-02V Full Write-Schema Contract Gate START

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCT-CF-02U PASS`
Status: **STARTED / ZERO-WRITE**

## Verified predecessor state
- The live isolated Preview Worker recognizes `trendos-accounting-preview` as schema-compatible under the current read-only preflight.
- All financial authoritative writes remain disabled.
- Google Sheets + Apps Script remain authoritative.

## New safety finding
The current schema-preflight checks table existence plus a limited column subset. That is insufficient to authorize even an isolated write probe because the prepared D1 persistence adapter reads/writes a broader explicit SQL contract.

### D1 adapter-required contract
`accounting_operation_idempotency` must support at least:
- `idempotency_key`
- `transaction_id`
- `command_fingerprint`
- `status`
- `order_id`
- `line_id`
- `source_transaction_id`
- `result_json`

`accounting_stock_movements` must support at least:
- `operation_id`
- `stock_movement_id`
- `transaction_id`
- `transaction_idempotency_key`
- `movement_idempotency_key`
- `movement_type`
- `item_id`
- `quantity_in`
- `quantity_out`
- `unit`
- `unit_cost_minor`
- `recognized_cost_minor`
- `order_id`
- `line_id`
- `source_transaction_id`

## ACCT-CF-02V goal
Before any D1 write probe:
1. locate and inspect the exact isolated Accounting schema applied in ACCT-CF-02T;
2. align the read-only schema preflight with the actual prepared D1 adapter SQL contract;
3. add regression tests proving every critical missing table/column fails closed;
4. run local/CI tests;
5. deploy the read-only diagnostic change only;
6. require live Preview runtime `SCHEMA_COMPATIBLE` against the full write contract.

If the isolated database lacks required columns, mark 02V as a schema gap and prepare an **additive isolated-preview-only** schema correction before proceeding. Do not weaken the gate.

## Explicit prohibitions in 02V
- no financial D1 write;
- no `ACCOUNTING_D1_WRITE_PREVIEW` enablement;
- no write probe;
- no Production D1 change;
- no Production migration;
- no Google Sheets or Apps Script business-data mutation;
- no financial cutover.

## Exact next step
Inspect ACCT-CF-02T and the exact schema SQL applied to `trendos-accounting-preview`, then update the read-only preflight contract accordingly.
