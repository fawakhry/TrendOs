# TrendOS Blackbox — Gaber / EasyStore Ledger Adapter — Pre-step

Date: 2026-09-10
Status: **APPROVED BY OWNER — GITHUB CANDIDATE ONLY / NO RUNTIME ACTIVATION**
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Owner instruction: `اربط`

## Objective

Connect the already-qualified Gaber material-control candidate chain to the existing EasyStore accounting facts without touching production runtime.

Target chain:

`EasyStore department daily purchase facts`
`-> deterministic adapter`
`-> append-only Gaber Material Movement Ledger`
`-> Task material close facts`
`-> Daily material flow report`

## Required mappings

1. Active EasyStore department purchase with stock actually applied -> `PURCHASE_RECEIPT`.
2. Reversed/rejected stock receipt -> explicit append-only reversal movement, never delete history.
3. Task material custody issued quantity -> `TASK_ISSUE`.
4. Good material consumption -> `PRODUCTION_CONSUMED`.
5. Physical stock return -> `RETURNED_TO_STOCK`.
6. Reusable offcut -> `REUSABLE_OFFCUT_RETURN`.
7. Approved/valid waste detail -> `WASTE_SCRAP` with factual cost and reason.
8. Daily report is derived from ledger facts plus authoritative opening/physical closing balances.

## Safety / identity constraints

- Never use material name as the durable accounting identity when a stable Material ID is unavailable.
- Material name/department must resolve through an explicit material catalog mapping; unresolved mapping fails closed.
- Stable Task ID + Order ID + Line ID remain mandatory for Task-bound movements.
- Purchase receipt requires EasyStore purchase ID + supplier invoice/receipt number.
- Event IDs are deterministic and replay-safe.
- No silent mutation or deletion of prior ledger movements.
- No partial append plan on conflicts.

## Explicit non-actions

This step must NOT:

- install any file into live Apps Script Head;
- change any Script Property or feature flag;
- write production Google Sheets;
- write D1 business data;
- change EasyStore production runtime;
- merge to `main`;
- advance RP-07 Phase 1 or RP-08.

`TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED` remains untouched.

RP-07 Runtime Phase 0B HOLD remains authoritative.
