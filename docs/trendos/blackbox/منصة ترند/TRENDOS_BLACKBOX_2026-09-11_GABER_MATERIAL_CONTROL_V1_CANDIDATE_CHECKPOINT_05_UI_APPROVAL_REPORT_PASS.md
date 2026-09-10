# TrendOS Blackbox — Gaber Material Control V1 — Candidate Checkpoint 05 / UI + Approval + Daily Report PASS

Date: 2026-09-11
Status: **GABER TASK MATERIAL UI + ABNORMAL-WASTE REQUEST/APPROVAL + LEDGER DAILY REPORT + OPERATOR TASK V2 INTEGRATION PASS — GITHUB CANDIDATE ONLY**
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Parent checkpoint:
`TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_04_PERSISTENCE_BACKEND_PASS.md`

Execution plan:
`TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_UI_REPORT_EXECUTION_PLAN.md`

Approval-request design decision:
`TRENDOS_BLACKBOX_2026-09-11_GABER_WASTE_APPROVAL_REQUEST_STORE_DECISION.md`

Owner instruction: `نفذ`

## Scope completed

The next Gaber material-control candidate layer is now implemented and CI-qualified:

1. Gaber active-Task material reconciliation UI;
2. server-authoritative material/catalog/purchase bootstrap;
3. abnormal-waste approval-request queue;
4. manager approve/reject panel with append-only/idempotent decision handling;
5. ledger-backed daily material report;
6. exact Order/Line/Task drill-down for `Order Out`;
7. fail-closed opening/closing stock reconciliation;
8. Operator Task V2 frontend/backend integration;
9. dedicated Gaber Material CI + full TrendOS Integrity verification.

No runtime activation was performed.

## Candidate implementation

### 1. Gaber material Task UI

File:
`gaber-material-ui-v1.js`

Initial commit:
`00d77293ab0532ebc72c00dcd470c439f2f8b804`

The active Laser Task can represent, per Accounting Material ID:

- issued quantity;
- final good consumption / `خارج أوردر`;
- returned stock;
- reusable offcut;
- waste quantity;
- Waste ID;
- waste reason;
- evidence reference;
- purchase declaration;
- exact EasyStore daily-purchase references.

Client UI rules:

- `issued = consumed + returned + reusable offcut + waste` must balance before payload creation;
- `PURCHASE_RECORDED` requires at least one actual EasyStore purchase reference;
- abnormal waste requires an evidence reference;
- normal cut loss does not create a manager-approval request;
- UI does not serialize `unitCost` as accounting authority;
- Accounting cost remains server-derived;
- final Task completion sends one `materialClosePayload` to the existing server gate.

### 2. UI / report backend facade

File:
`gaber-material-ui-backend-v1.gs`

Initial commit:
`f75b5129d622420625f514ea6a21e6668c73ba87`

No top-level `doGet`, `doPost`, or standalone router was added.

Candidate suboperations:

- `gaberMaterialBootstrap`;
- `gaberMaterialRequestWaste`;
- `gaberMaterialPendingWaste`;
- `gaberMaterialWasteDecision` (intercepted by idempotent guard in Operator Task V2);
- `gaberMaterialDailyReport`.

All operations remain behind both:

- Operator Task V2 activation boundary;
- Gaber material-control activation boundary.

### Bootstrap authority

For Gaber, Task identity is derived from the server-authoritative active Task. Browser-supplied Task identity cannot select a different Task.

Bootstrap returns:

- exact Task / Order / Line;
- active EasyStore Accounting materials;
- server Accounting material cost (read-only to UI);
- same-day, same-department EasyStore daily purchases whose stock was actually applied and was not reversed/rejected;
- persisted close summary when available.

### 3. Abnormal-waste request store

Candidate store:
`حسابات - طلبات اعتماد هوالك جابر V1`

This is an append-only pre-close approval-request queue. It is NOT stock authority and does not recognize cost.

Stored identity includes:

- Request ID;
- request fingerprint;
- Waste ID;
- Task ID;
- Order ID;
- Line ID;
- Material ID;
- material name;
- quantity;
- reason;
- evidence reference;
- operator;
- request timestamp;
- immutable payload JSON.

Behavior:

- exact identical retry -> replay / zero duplicate append;
- same exact Waste identity with different facts -> `WASTE_REQUEST_CONFLICT`;
- request does not count as approval;
- no request row is overwritten or deleted.

The store has an explicit manager-only pre-activation initializer but has NOT been initialized in production.

### 4. Manager waste-decision idempotency guard

File:
`gaber-material-waste-decision-v1.gs`

Commit:
`db07a13b49c0cec9fe81ddff2cb1bac945dc097b`

Behavior:

- manager only;
- decision applies to exact Request/Waste/Task/Order/Line/Material identity;
- exact repeated same decision -> replay / zero duplicate approval;
- attempt to replace a previously recorded decision with a different decision -> `WASTE_DECISION_ALREADY_RECORDED`;
- corrections cannot overwrite history silently;
- existing server-side self-approval prohibition remains authoritative;
- client-side fake approval remains non-authoritative.

### 5. Daily ledger report fail-closed correction

File:
`gaber-ledger-daily-report-v1.js`

Change commit:
`f6afcc9ba6ce11bcf289296ff2e22e3c2bd79c08`

Important correction:

Missing opening stock is no longer silently treated as `0`.

New explicit blockers:

- `DAILY_MATERIAL_OPENING_BALANCE_MISSING`;
- `DAILY_MATERIAL_ACTUAL_CLOSING_MISSING`;
- existing `DAILY_MATERIAL_STOCK_VARIANCE` when both balances exist but differ.

Therefore day-close reconciliation cannot claim success from incomplete physical stock facts.

### Daily report fields

Per material:

- opening stock;
- purchases today;
- Order Out;
- waste;
- returned stock;
- reusable offcut;
- other in/out;
- daily net movement;
- expected closing;
- actual closing;
- variance;
- purchase value;
- good-consumption cost;
- waste cost;
- recognized material cost;
- exact purchase refs;
- exact Task / Order / Line Order-Out refs;
- exact waste refs;
- explicit adjustments.

The report reads immutable material-ledger facts and Accounting stock facts. It does not synthesize waste from a variance.

## Owner 40 / 39 / 1 scenario — UI/report layer evidence

Qualified test scenario:

- opening stock = 0;
- purchase = 40 wallets;
- final good Order Out = 39 wallets;
- waste = 0;
- physical closing = 1 wallet.

Report result:

- Purchases = 40;
- Order Out = 39;
- expected closing = 1;
- actual closing = 1;
- variance = 0;
- reconciliation = `RECONCILED`;
- the `39` retains exact Order ID `3910` / Line ID `3910-01` drill-down in the qualification test.

If opening or physical closing is unavailable, the report now blocks instead of inventing a zero balance.

## 6. Operator Task V2 integration

Frontend:
`operator-task-workflow-v2.js`

Integration commit:
`3a6e8592450f61e2287677aa447db25554046477`

Behavior when `role=GABER`, a Task is active, and material control is enabled:

- mounts the Gaber Material panel;
- loads bootstrap facts from server;
- obtains validated payload from `TrendOSGaberMaterialUiV1`;
- sets `materialClosePayload` before calling `completeTask`;
- if UI/module/payload validation fails, Task completion is not sent.

Manager UI:

- exposes pending abnormal-waste requests;
- approve/reject actions;
- exposes the material daily report.

Wael:

- Fly Print lane remains separate;
- Press lane remains separate;
- Gaber material UI is not mounted in the Wael lane.

Backend:
`operator-task-workflow-v2.gs`

Integration commit:
`0b608fff851650fd902983937254736e96cc0e08`

Changes:

- manager status can see the Gaber material-control enabled state;
- `gaberMaterialWasteDecision` routes through the idempotent decision guard first;
- other `gaberMaterial*` suboperations route through the narrow Gaber UI backend facade;
- no new top-level router symbol;
- existing Task close order remains:
  `material gate -> source status mutation -> Task completion persistence`.

## Tests added

### `tests/gaber_material_ui_v1.test.mjs`

Commit:
`81c94b81510de7b0d225195d83b83e1d8e0d9aad`

Covers:

- exact Task/Order/Line serialization;
- explicit zero offcut;
- client cost excluded;
- purchase-reference requirement;
- material balance validation;
- abnormal evidence/request envelope;
- normal waste does not create manager request.

### `tests/gaber_ledger_daily_report_balance_gate_v1.test.mjs`

Commit:
`c8ca8a89c4bdda3f3dd38b72b500cb2e25b0e00b`

Covers:

- missing opening fails closed;
- missing actual closing fails closed;
- 40/39/1 reconciles correctly with exact drill-down.

### `tests/gaber_material_ui_backend_v1.test.mjs`

Final test-harness correction commit:
`c63e175a31cb5fa42992ba3862a6aa711ecef54e`

Covers:

- authoritative catalog cost and EasyStore purchase refs;
- append-only abnormal-waste request;
- exact retry replay;
- conflicting same Waste facts rejected;
- manager pending queue;
- approval clears pending queue;
- repeated exact manager decision is replay-safe;
- daily report reads immutable ledger and exact Accounting balances.

### `tests/operator_task_gaber_material_ui_v1.test.mjs`

Final assertion correction commit:
`5061d00ea22b13569c486caf6ae3e6e8aeb273af`

Covers:

- frontend material panel gating;
- complete material payload assignment before Task completion API;
- manager panel;
- idempotent decision route ordering;
- material gate remains before source status mutation;
- Wael remains independent.

## Test-only issues caught during qualification

Two failed qualification iterations were investigated before acceptance.

### A. Fake SHA-256 harness collision

The first UI-backend test harness simulated Apps Script SHA-256 by truncating the first 32 input bytes instead of hashing them. Different quantities whose differences appeared later in the payload could therefore collide in the fake test environment.

Correction:

- test harness now uses real Node SHA-256 through `createHash('sha256')`;
- production candidate fingerprint logic was NOT weakened or changed to satisfy the faulty stub.

Final correction commit:
`c63e175a31cb5fa42992ba3862a6aa711ecef54e`

### B. Static frontend assertion ordering

A test originally expected the RHS text `getPayload(...)` to appear before the LHS text `materialClosePayload` in the same JavaScript assignment.

Correction:

- test now verifies the complete assignment expression exists before the `completeTask` call.

Final correction commit:
`5061d00ea22b13569c486caf6ae3e6e8aeb273af`

No runtime behavior was changed for this assertion correction.

## Final CI evidence

Acceptance head:
`5061d00ea22b13569c486caf6ae3e6e8aeb273af`

### Dedicated Gaber Material workflow

Workflow:
`TrendOS Gaber Material Control V1 CI`

Run:
`34543875217`

Result:
**SUCCESS**

Every step passed, including:

- original material custody/waste close;
- zero-offcut regression;
- daily flow;
- immutable movement ledger;
- EasyStore adapter;
- persistence contract;
- Apps Script persistence backend;
- material UI serializer;
- daily balance gate;
- UI backend approvals/report;
- Operator Task material gate;
- Operator Task Gaber material UI integration;
- safety/collision scan.

### Full TrendOS Integrity

Workflow:
`TrendOS Integrity V1`

Run:
`34543875282`

Result:
**SUCCESS**

The run completed successfully on the same acceptance head. The suite includes the current platform integrity foundation, Router checks, composed Apps Script syntax/collision gate, pre-deploy package safety gate, and Accounting domain/transaction/persistence tests.

## Runtime / no-mutation statement

During this entire phase:

- no live Apps Script Head file was installed;
- no production Apps Script deployment was changed;
- no Script Property was changed;
- `TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED` was NOT changed;
- Operator Task V2 production activation was NOT changed;
- no candidate material/request/approval store was created in production;
- no production Google Sheet business row was written;
- no D1 business write was performed;
- no EasyStore production stock mutation was performed;
- no main merge was performed;
- no RP-07 Phase 1 was started;
- no RP-08 was started.

RP-07 HOLD remains authoritative.

## Physical-stock boundary still open

This candidate does NOT yet make the immutable Task material ledger the authoritative EasyStore stock-decrement writer.

Current candidate semantics remain:

- `TASK_ISSUE` = custody/audit fact;
- `PRODUCTION_CONSUMED` = final good Order-Out fact;
- `WASTE_SCRAP` = approved waste fact;
- returned/offcut = reconciliation/audit facts;
- authoritative physical EasyStore stock mutation remains a separate future adapter/cutover step.

This separation is intentional to avoid double-decrementing inventory before stock-location/custody semantics are fully qualified.

## NEXT SAFE STEP

Before any runtime activation:

1. qualify the future package/composition/load order for all Gaber material candidate modules;
2. create a READ-ONLY / NO-WRITE shadow-parity design for the physical EasyStore stock adapter;
3. prove the stock adapter would reconcile Task issue / final consumption / waste / return/offcut without double-decrement;
4. re-read RP-07 runtime boundary immediately before any live install or store initialization;
5. do not initialize stores, install Apps Script modules, activate flags, or mutate physical stock until RP-07 explicitly clears those runtime actions.

Required future composition ordering should keep dependencies deterministic:

Backend candidate dependency direction:

`material control / movement ledger / report pure cores`
`-> persistence backend`
`-> UI backend + waste decision guard`
`-> Operator Task V2 backend`

Frontend dependency direction:

`gaber-material-ui-v1.js`
`-> operator-task-workflow-v2.js`

Checkpoint 05 is accepted as **GitHub Candidate PASS only**, not production activation approval.
