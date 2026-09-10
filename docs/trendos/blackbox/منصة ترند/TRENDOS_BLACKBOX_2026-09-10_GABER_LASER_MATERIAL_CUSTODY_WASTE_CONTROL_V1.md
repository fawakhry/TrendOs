# TrendOS Blackbox — Gaber Laser Material Custody & Waste Control V1

Date: 2026-09-10
Status: **OWNER-APPROVED PRODUCT DESIGN — GITHUB CANDIDATE WORK AUTHORIZED — PRODUCTION MUTATION NOT AUTHORIZED**
Scope: Gaber / Laser only for V1. Integrates Operator Task V2 with EasyStore / TrendOS Accounting facts.

## 1. Purpose

Create a hard operational/accounting control around Gaber so every ordinary Laser Task is financially and materially traceable from start to close.

The owner must be able to answer, for any day / Task / Order / Line:

- what material Gaber received;
- what material was actually consumed;
- what was returned to stock;
- what reusable offcut remained;
- what became true waste/scrap;
- which supplier purchases were made by Gaber;
- which purchase invoice/evidence supports each purchase;
- which Order ID / Line ID consumed each material movement;
- how much the Laser department produced in revenue;
- the recognized material/direct cost;
- standard vs abnormal waste;
- department contribution/profit before any separate partner/profit-sharing engine.

## 2. Existing foundations that MUST be reused

Do not build a parallel accounting universe.

Existing platform foundations:

- Operator Task V2: one active ordinary Task per operator; server dispatch; authoritative start/end timing.
- EasyStore department screens already expose department invoice, daily purchases, waste and stock for Gaber/Wael.
- Daily department purchases already add stock immediately and wait for management financial review.
- EasyStore already has purchase custody/day-close concepts and financial close blockers.
- TrendOS Accounting architecture already defines stable Order ID, Line ID, Item ID, Purchase ID and Stock Movement ID and requires auditable/idempotent inventory movements.
- Existing accounting domain candidate already supports BOM/cost planning and deterministic stock-movement intent.

V1 extends these foundations; it does not replace them.

## 3. Core invariant — no next Task before material/accounting close

For Gaber ordinary Tasks, the strongest control is enforced at Task completion.

A RUNNING Gaber Task cannot transition to `جاهز للاستلام` or `تم التسليم` unless its **Task Material Close** returns PASS.

Task Material Close requires all of the following:

1. purchase declaration resolved;
2. every purchase made during/for the Task is recorded with supplier invoice evidence;
3. every issued material is reconciled;
4. all waste quantities are explicitly recorded and classified;
5. material balance is zero within configured unit tolerance;
6. high/abnormal waste approval blockers are cleared when required.

Because Operator Task V2 already permits only one active ordinary Task, blocking completion automatically blocks `هات تاسك جديد وابدأ` until the current Task is materially/accountingly closed.

There is no bypass by merely navigating away, refreshing, or hiding UI controls. Gate enforcement must be server-side.

## 4. Purchase declaration — explicit, never inferred from silence

Before Task close, Gaber must choose exactly one state:

- `NO_PURCHASE` — I made no purchase for this Task/work period;
- `PURCHASE_RECORDED` — I made purchase(s), and all required purchase records are linked.

Missing declaration is a hard blocker.

If `PURCHASE_RECORDED`, every linked purchase requires at minimum:

- Purchase ID / immutable reference;
- Task ID;
- Order ID;
- Line ID where attributable;
- department = Laser;
- supplier identity;
- supplier invoice/receipt number;
- invoice/receipt evidence reference (image/file reference when supported);
- material Item ID / material identity;
- quantity + unit;
- unit price + total;
- payment method;
- responsible employee/session;
- authoritative timestamp.

A purchase of stock is NOT automatically the cost of today's production. Purchase receipt increases stock; recognized Task cost comes from actual production consumption and waste movements.

## 5. Material custody model per Task

Each Task gets a material-custody subledger.

For each material/Item ID:

`Issued Qty = Consumed Qty + Returned Qty + Reusable Offcut Qty + Waste Qty`

Definitions:

- `ISSUED_TO_TASK`: quantity moved/allocated from Laser available stock into Task custody.
- `PRODUCTION_CONSUMED`: quantity actually incorporated/consumed in successful production.
- `RETURNED_TO_STOCK`: unused standard stock returned to Laser stock.
- `REUSABLE_OFFCUT_RETURN`: usable remainder/offcut returned as traceable stock or offcut inventory.
- `WASTE_SCRAP`: true unusable waste/scrap.

The system must never convert an unexplained difference into waste automatically.

Any non-zero unexplained variance blocks Task close.

## 6. Offcuts / reusable remainder

Laser materials commonly leave reusable remnants. V1 must distinguish them from waste.

A reusable offcut should preserve when applicable:

- parent Item ID/material;
- dimensions / area / quantity;
- unit;
- source Task ID;
- Order ID;
- Line ID;
- generated timestamp;
- operator;
- cost basis inherited from the parent material according to Accounting policy.

An offcut return is stock value still owned by the business and must not be charged as waste.

## 7. Waste control — stronger than the existing money-only screen

The current waste concept must be upgraded for Gaber Task control.

Every waste event requires:

- Waste Movement ID;
- Task ID;
- Order ID;
- Line ID;
- Material Item ID;
- quantity + unit;
- unit cost sourced from Accounting, not typed by Gaber;
- calculated waste cost;
- reason code;
- classification: `STANDARD` or `ABNORMAL`;
- operator/session;
- server timestamp;
- notes when required;
- evidence reference when threshold/policy requires it;
- supervisor decision when threshold/policy requires approval.

Initial reason-code family:

- `NORMAL_CUT_LOSS`
- `MATERIAL_DEFECT`
- `MACHINE_FAULT`
- `SETUP_ERROR`
- `WRONG_SIZE`
- `OPERATOR_ERROR`
- `DESIGN_OR_FILE_ERROR`
- `REWORK`
- `OTHER`

Default classification:

- normal cut loss may be STANDARD within configured tolerance;
- setup/wrong-size/operator/design/rework are ABNORMAL by default;
- machine/material defect may require supervisor classification depending on evidence.

Waste cannot be deleted. Corrections must be reversal/adjustment movements with immutable audit references.

## 8. Expected vs actual consumption

When a BOM/material expectation exists, snapshot it for the Task.

For each material:

- Expected Qty / expected recognized cost;
- Actual good production consumption;
- Waste Qty / waste cost;
- Actual material cost = consumed cost + waste cost;
- Quantity variance;
- Cost variance;
- Waste percentage.

No expected/BOM value may be silently invented when Accounting does not have one.

Missing expectation does not by itself block production, but it must be visible as `NO_STANDARD_DEFINED` and excluded from false variance claims.

## 9. High-waste approval policy

V1 design supports configurable thresholds such as:

- waste value threshold;
- waste percentage threshold;
- reason-code mandatory approval;
- evidence mandatory threshold.

If a threshold is crossed, Task Material Close returns a blocker such as:

`WASTE_APPROVAL_REQUIRED`

The operator cannot self-approve the exception.

Manager/supervisor approval must preserve approver identity, timestamp, reason and evidence references.

Threshold values are tenant/configuration facts and must not be hard-coded as universal business truth.

## 10. Profit / department economics

For a Task/Line:

`Recognized Material Cost = Production Consumed Cost + Waste Cost`

`Task Contribution = Attributed Line Revenue - Recognized Material Cost - Direct Operating Cost - Other Direct Cost`

Returned stock and reusable offcuts are not expensed as waste merely because they were issued to the Task.

Daily Laser reporting should roll up:

- completed Tasks;
- line/order revenue attributed to Laser;
- recognized material consumption;
- standard waste;
- abnormal waste;
- direct operating cost;
- direct other cost;
- contribution/profit;
- purchases (cash/inventory acquisition separately from recognized Task cost);
- open/unreconciled material custody;
- reusable offcut value/quantity;
- Task time/throughput.

Accounting remains factual. Partner/investor/machine-owner distributions remain outside Accounting.

## 11. Server-side close gate contract

Proposed pure decision contract:

Input:

- Task identity and authoritative operator/session;
- Order ID + Line ID;
- purchase declaration + linked purchases;
- issued material lines;
- consumption/return/offcut/waste quantities;
- waste event details;
- configured tolerance/approval policy;
- factual unit costs and optional expected/BOM snapshot;
- direct cost facts where available.

Output:

- `canClose: true|false`;
- deterministic blocker codes;
- material reconciliation summaries;
- standard/abnormal waste summaries;
- expected-vs-actual variance summaries where standards exist;
- factual cost rollup;
- audit-ready close decision/fingerprint.

The same identical request replay must not duplicate purchase, waste, stock, or close movements.

## 12. Required blocker codes

Initial V1 blocker family:

- `PURCHASE_DECLARATION_REQUIRED`
- `PURCHASE_RECORD_REQUIRED`
- `PURCHASE_INVOICE_NUMBER_REQUIRED`
- `PURCHASE_EVIDENCE_REQUIRED`
- `TASK_ID_MISMATCH`
- `ORDER_ID_MISMATCH`
- `LINE_ID_MISMATCH`
- `MATERIAL_ID_REQUIRED`
- `NEGATIVE_QUANTITY_INVALID`
- `MATERIAL_BALANCE_NOT_ZERO`
- `WASTE_DETAIL_MISMATCH`
- `WASTE_REASON_REQUIRED`
- `WASTE_EVIDENCE_REQUIRED`
- `WASTE_APPROVAL_REQUIRED`
- `ACCOUNTING_COST_UNAVAILABLE`

UI text can be Arabic, but stored blocker codes remain stable machine identifiers.

## 13. Role and privacy boundary

Gaber may see operational quantities and the information needed to perform/close his Task.

Do not expose manager-only profitability/cost intelligence to Gaber merely to enforce material control.

Unit cost / full margin / department profit can remain manager-only while the server uses those facts to calculate waste and profitability.

Gaber cannot:

- alter system unit cost;
- approve his own abnormal waste;
- delete stock/waste movements;
- edit another operator's Task custody;
- reassign Task IDs or Order/Line IDs;
- bypass material close by directly completing source order status.

## 14. Integration ownership

### TrendOS Operations owns

- Task ID;
- operator assignment;
- Order ID / Line ID;
- operational status;
- authoritative Task start/end timing;
- dispatch priority.

### EasyStore / TrendOS Accounting owns

- Item/material master;
- BOM/expected material facts;
- purchase and supplier accounting;
- stock movement ledger;
- unit/recognized cost;
- material custody financial facts;
- waste cost;
- factual line/department profitability.

Cross-module contracts use stable IDs and replay-safe events. Never join primarily by customer name.

## 15. Implementation sequence authorized by this design

Allowed now on GitHub working branch only:

1. create isolated pure material-close decision core + tests;
2. create candidate persistence/event contract using append-only/idempotent semantics;
3. integrate Operator Task V2 candidate with an inert, feature-gated Gaber close hook;
4. add dedicated CI coverage;
5. prepare EasyStore UI candidate for Gaber Task Material Close;
6. prepare Accounting adapter mapping in isolated mode.

Not authorized by this record:

- live Apps Script Head installation;
- production deployment;
- Script Property changes;
- source Sheet business-data writes;
- D1 business writes/cutover;
- main merge;
- RP-07 Phase 1;
- RP-08.

## 16. RP-07 safety boundary remains controlling

The current RP-07 Runtime Phase 0B HOLD remains unchanged.

This feature must be developed as a GitHub candidate only until the existing safety gate explicitly permits runtime installation/activation.

Candidate code must be inert unless a dedicated feature flag is enabled in a later approved runtime boundary.

## 17. First implementation target

Create `gaber-material-control-v1.js` as a pure decision engine with no external writes and tests proving at minimum:

- purchase declaration is mandatory;
- a declared purchase requires invoice/evidence;
- issued material must balance exactly to consumed + returned + offcut + waste within tolerance;
- waste detail totals must match material waste quantity;
- abnormal/high waste can require evidence/approval;
- returned/offcut quantities do not become recognized production cost;
- factual Task contribution uses consumed+waste material cost, not purchase spend;
- replay input produces deterministic decision/fingerprint.

Only after those tests are green should a persistence or live adapter be considered.
