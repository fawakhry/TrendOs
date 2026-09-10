# TrendOS Blackbox — Gaber Daily Material Flow Report Requirement

Date: 2026-09-10
Status: **OWNER-APPROVED REQUIREMENT — GITHUB CANDIDATE ONLY — NO PRODUCTION MUTATION AUTHORIZED**
Parent: `TRENDOS_BLACKBOX_2026-09-10_GABER_LASER_MATERIAL_CUSTODY_WASTE_CONTROL_V1.md`

## Owner requirement

At end of day, the owner needs one material-by-material Laser report showing total purchases against total quantities that went out through today's Orders, with the remaining quantity clearly visible.

Owner example:

- material/item: wallets;
- purchases today: 40;
- quantities that went out on today's Orders: 39;
- remaining: 1.

The report must work for every material/item, not just wallets.

## Required row model

For each `Item ID / Material ID` and unit, report at minimum:

- material/item name;
- unit;
- opening stock balance at start of work day when authoritative balance is available;
- purchases received today;
- `Order Out` / good quantity consumed or issued into successful Order/Line production today;
- waste/scrap quantity today;
- returned standard stock quantity from Task custody;
- reusable offcut return quantity;
- other inventory inflow/outflow adjustments, if any;
- net movement for the day;
- calculated expected closing balance;
- authoritative actual closing balance when available;
- closing variance / reconciliation status;
- purchase value today;
- recognized good-consumption cost;
- waste cost;
- total recognized material cost;
- list/drill-down of Order IDs + Line IDs behind `Order Out`;
- list/drill-down of waste events behind waste quantity;
- list/drill-down of Purchase IDs / supplier invoices behind purchases.

## Core equations

For a fully closed day with Task custody reconciled:

`Daily Net Movement = Purchases + Other In - Order Out - Waste - Other Out`

`Expected Closing Stock = Opening Stock + Daily Net Movement`

Returned standard stock and reusable offcut quantities are shown for audit visibility but must not be double-counted if `Order Out` is the final good consumption quantity rather than gross Task issue quantity.

If the implementation instead reports gross `ISSUED_TO_TASK`, it must separately add Task returns/offcuts back before deriving closing stock. The report must never mix gross issue and net consumption semantics.

## Example A — no prior stock, no waste

- Opening: 0 wallets
- Purchases: 40
- Order Out: 39
- Waste: 0
- Net Movement: +1
- Expected Closing: 1

## Example B — one unit damaged

- Opening: 0 wallets
- Purchases: 40
- Order Out: 39
- Waste: 1
- Net Movement: 0
- Expected Closing: 0

The damaged unit must appear as waste, not as unexplained shortage.

## Example C — stock existed before today

- Opening: 10 wallets
- Purchases: 40
- Order Out: 39
- Waste: 0
- Daily Net Movement: +1
- Expected Closing: 11

Therefore the UI must distinguish `صافي حركة اليوم` from `رصيد آخر اليوم`. The owner example's remaining `1` is the net balance created by today's movements when opening stock is zero; it is not safe to label it physical closing stock when older inventory exists.

## Drill-down requirement

The material total must be explainable, not merely numeric.

Clicking/expanding `Order Out = 39` must reveal the exact contributing Orders/Lines/Tasks, e.g.:

- Order 3910 / Line 3910-02 / Task ... / 10 wallets
- Order 3914 / Line 3914-01 / Task ... / 14 wallets
- Order 3920 / Line 3920-03 / Task ... / 15 wallets

The sum must exactly equal 39.

The same traceability rule applies to purchases and waste.

## Close/reconciliation controls

A department day close should surface a blocker when authoritative closing stock exists and does not reconcile to expected closing within configured unit tolerance.

Recommended blocker:

`DAILY_MATERIAL_STOCK_VARIANCE`

The system must never silently convert a closing variance into waste or an adjustment. Any correction requires an explicit auditable stock adjustment/reversal path.

## Reporting scope

V1 scope: Gaber / Laser.

The model should remain generic so the same engine can later support Wael / Printing and other departments without duplicating accounting logic.

## Safety boundary

This requirement authorizes GitHub candidate design/core/tests only. It does not authorize Apps Script Head mutation, production Sheet writes, D1 business writes, deployment, feature-flag/property changes, main merge, RP-07 Phase 1, or RP-08.
