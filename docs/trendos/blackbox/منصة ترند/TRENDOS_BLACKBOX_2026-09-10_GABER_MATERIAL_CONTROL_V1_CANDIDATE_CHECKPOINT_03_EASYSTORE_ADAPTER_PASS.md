# TrendOS Blackbox — Gaber Material Control V1 — Candidate Checkpoint 03 / EasyStore Adapter PASS

Date: 2026-09-10
Status: **EASYSTORE PURCHASE FACTS -> LEDGER -> TASK CLOSE -> DAILY REPORT CONNECTED IN PURE GITHUB CANDIDATE — PASS**
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Parent checkpoint:
`TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_02_LEDGER_PASS.md`

Pre-step record:
`TRENDOS_BLACKBOX_2026-09-10_GABER_EASYSTORE_LEDGER_ADAPTER_PRESTEP.md`

Owner instruction: `اربط`

## New candidate files

### 1. EasyStore -> Ledger adapter

`gaber-easystore-ledger-adapter-v1.js`

Purpose:

- map existing EasyStore department daily purchase facts into deterministic ledger events;
- map validated Gaber Task material close facts into exact Task-bound movement events;
- never persist or mutate external state itself.

### 2. Ledger-backed daily report

`gaber-ledger-daily-report-v1.js`

Purpose:

- consume ledger-derived daily material facts;
- combine them with authoritative opening and physical closing balances;
- produce per-material purchases / Order Out / waste / expected closing / actual closing / variance;
- block day close when physical closing does not reconcile.

### 3. End-to-end tests

`tests/gaber_easystore_ledger_adapter_v1.test.mjs`

CI composition commit:
`55204d5f0e4554bd7b386a75f259c11533f6991f`

## Connected mapping

### EasyStore purchase

An EasyStore department purchase whose stock was actually applied maps to:

`PURCHASE_RECEIPT`

Required durable facts:

- EasyStore purchase ID;
- supplier invoice/receipt number;
- work date;
- supplier;
- positive quantity;
- stable Material ID resolved through an explicit material catalog mapping.

Material name is NOT silently promoted to durable Material ID.
Missing/ambiguous Material ID mapping fails closed.

If a previously applied EasyStore purchase is later rejected/reversed, history is preserved:

`PURCHASE_RECEIPT`
`+ ADJUSTMENT_OUT reversal`

The original receipt is never deleted or rewritten.

### Gaber Task material close

For each balanced material line:

- issued -> `TASK_ISSUE`;
- final good consumption -> `PRODUCTION_CONSUMED`;
- stock return -> `RETURNED_TO_STOCK`;
- reusable offcut -> `REUSABLE_OFFCUT_RETURN`;
- detailed waste -> `WASTE_SCRAP`.

Every Task-bound movement carries:

- Task ID;
- Order ID;
- Line ID;
- Material ID;
- department/operator;
- factual quantity;
- factual Accounting unit cost where recognition requires cost.

Waste summary without exact waste detail fails closed.
Material imbalance fails closed.

## Owner 40 / 39 scenario — end-to-end evidence

Input facts:

- EasyStore purchase receipt: 40 wallets;
- Gaber Task issue: 40 wallets;
- good production consumption for Order 3910 / Line 3910-01: 39 wallets;
- return to stock: 1 wallet;
- opening balance: 0;
- physical closing: 1.

Derived ledger/report result:

- Purchases = 40;
- Order Out = 39;
- Waste = 0;
- Purchase minus Order Out/Waste = 1;
- Expected closing = 1;
- Actual closing = 1;
- Reconciliation = `RECONCILED`;
- Day close allowed by this material reconciliation layer.

If physical closing is 0 instead of 1:

- variance = -1;
- `DAILY_MATERIAL_STOCK_VARIANCE` blocker;
- no synthetic waste is created;
- day close is blocked.

## Replay / audit behavior

- adapter event IDs are deterministic;
- retrying identical EasyStore/Task facts produces ledger replay, not duplicate movement;
- same Event ID with conflicting payload remains a hard ledger conflict;
- no partial append plan on conflict.

## CI evidence

Dedicated workflow:

`TrendOS Gaber Material Control V1 CI`
Run: `34510083948`
Result: **SUCCESS**

Passed:

- Gaber material custody/waste close tests;
- original daily material flow tests;
- append-only ledger tests;
- EasyStore -> Ledger adapter end-to-end tests;
- Operator Task V2 material-gate integration tests;
- pure/inert safety scan.

Normal platform workflow:

`TrendOS Integrity V1`
Run: `34510083978`
Result: **SUCCESS**

Therefore the new GitHub candidate did not break the current integrity suite.

## Current chain

`EasyStore saveDeptDailyPurchaseV1917 facts`
`-> Gaber EasyStore Ledger Adapter V1`
`-> immutable Material Movement Ledger V1`
`-> Task Material Close / waste control`
`-> Operator Task V2 completion gate`
`-> Ledger-backed daily material report`
`-> purchases vs exact Order Out vs waste vs physical closing`

## Runtime / no-mutation statement

No live Apps Script Head installation.
No production deployment.
No Script Property mutation.
No production Google Sheet business write.
No D1 business write/cutover.
No EasyStore production runtime change.
No main merge.
No RP-07 Phase 1.
No RP-08.

`TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED` remains untouched and the feature is NOT live.

RP-07 Runtime Phase 0B HOLD remains authoritative.

## NEXT SAFE STEP

Before making this persistence connection live, complete the current RP-07 runtime safety boundary. After explicit runtime clearance, install a persistence adapter that reads the existing EasyStore accounting rows, persists immutable ledger events atomically/idempotently, exposes the ledger-backed daily report, and keeps the Gaber Task completion gate fail-closed.
