# TrendOS Blackbox — Department Invoice Control Requirements — Gaber Laser / Wael Print

Date: 2026-09-12
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Status: **OWNER REQUIREMENT LOCK — DESIGN/CANDIDATE ONLY — NOT LIVE**

## Owner requirement

Expand the post-Operator-Task accounting/material-control track from Gaber-only material control into department-scoped invoice control:

- Gaber owns **Laser invoices** only.
- Wael owns **Print invoices** only.
- Each operator must see/create only the invoice lane for their own department unless manager/admin authority is explicitly granted.

## Accounting authority

EasyStore / Accounting remains the financial authority for supplier, cost, unit-price and accounting posting semantics. TrendOS/Operator Task should collect and enforce operational evidence and department attribution, not become an uncontrolled second accounting authority.

## Proposed department invoice entity

Each department invoice candidate should carry at least:

- department (`LASER` or `PRINT`);
- operator identity derived server/session side;
- supplier / vendor identity;
- invoice number or deterministic invoice identity;
- invoice date/business date;
- material/service lines;
- quantity and unit;
- accounting unit cost / total sourced or validated against EasyStore where applicable;
- payment/settlement reference when available;
- invoice image/document evidence when required;
- exact purchase/material reference when stock-bearing;
- exact Task / Order / Line references for operational attribution where applicable;
- immutable creation/audit identity;
- status / approval state;
- idempotency key for retries.

## Operator scope

### Gaber — Laser

Gaber can create/view Laser department invoices and associated material purchases/usage only. He must not create Print department invoices through the ordinary operator surface.

### Wael — Print

Wael can create/view Print department invoices and associated material purchases/usage only. He must not create Laser department invoices through the ordinary operator surface.

Wael Fly Print and Press operational lanes remain logically separate from invoice authority; invoice capture must not silently reorder or consume ordinary Operator Task queue state.

## Control objectives

The design must support later manager reporting of:

- department purchases;
- department material withdrawals/consumption;
- exact Task/Order/Line attribution;
- waste and abnormal-waste approvals;
- department revenue/cost/profit;
- unlinked invoice/material exceptions;
- missing mandatory invoice evidence;
- daily closing and stock variance where stock-bearing materials apply.

## Task gating direction

A later explicit runtime design should allow mandatory accounting evidence to block starting/closing the next department Task when required business rules are unmet, but no live gate is authorized by this requirements record alone.

The gate must be server-side, deterministic, idempotent, and must not permit a client to bypass invoice/material obligations.

## Stock safety

The existing Gaber Shadow/Parity invariant remains mandatory for stock-bearing invoices and purchases:

`TASK_ISSUE` is custody/audit only and must not independently double-decrement physical stock when final stock impact is recognized through production consumption/waste/returns.

The Shadow/Parity work must now consider both Laser and Print stock-bearing invoice flows where applicable, while preserving department separation.

## Roadmap priority

Current owner-priority order becomes:

`RP-07 -> Operator Task V2 -> Department Invoice + Material Shadow/Parity (Gaber Laser + Wael Print) -> RP-08`

This broadens the previously inserted Gaber-only Shadow/Parity gate. It does not authorize production activation now.

## Safety / non-actions

This record performs no Apps Script installation/deployment, no Script Property mutation, no EasyStore financial write, no D1 business write, no stock decrement, no invoice creation, no Operator Task runtime mutation, and no RP-08 transition.

RP-07 remains the current blocking track until explicit PASS/CLOSED.