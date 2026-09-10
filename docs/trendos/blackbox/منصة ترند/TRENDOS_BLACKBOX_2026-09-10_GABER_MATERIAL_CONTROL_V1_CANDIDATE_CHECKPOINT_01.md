# TrendOS Blackbox — Gaber Material Control V1 — Candidate Checkpoint 01

Date: 2026-09-10
Status: **GITHUB CANDIDATE CORE + DAILY FLOW + TASK CLOSE GATE PASS — NO RUNTIME/PRODUCTION MUTATION**
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Parent requirements:

- `TRENDOS_BLACKBOX_2026-09-10_GABER_LASER_MATERIAL_CUSTODY_WASTE_CONTROL_V1.md`
- `TRENDOS_BLACKBOX_2026-09-10_GABER_DAILY_MATERIAL_FLOW_REQUIREMENT.md`
- `TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md`

## Completed candidate work

### GM-01 — owner design captured

Design record commit:
`fd136533990940f5c41a795ccf54057f9ad0311a`

Defines mandatory Task Material Close, purchase declaration/evidence, material reconciliation, reusable offcuts, waste control, cost/profit facts, and fail-closed Task completion behavior.

### GM-02 — pure Task Material Close decision core

File:
`gaber-material-control-v1.js`

Code commit:
`6cef2d90ad48040862373fa895d4b03c2987a5ee`

Test commit:
`270f448f6bdc6a0c9f32525ec3aa94990ac7b8bb`

Implemented without external writes:

- mandatory purchase declaration;
- purchase invoice/evidence validation;
- Task / Order / Line linkage;
- material equation `issued = consumed + returned + reusable offcut + waste`;
- waste detail reconciliation;
- standard vs abnormal waste;
- configurable evidence/approval thresholds;
- self-approval rejection;
- factual Accounting unit-cost requirement;
- recognized material cost from consumption + waste, not purchase spend;
- deterministic decision fingerprint/replay behavior.

### GM-03 — owner daily material flow requirement captured

Requirement record commit:
`0bceea23d8504fb5bcb4ebb1b4382f5015411b0d`

Required owner example is explicit:

`40 purchased wallets - 39 Order Out = 1 net remaining from today's movement` when opening stock and waste are zero.

The model distinguishes today's net movement from physical closing stock when opening stock exists.

### GM-04 — pure daily material flow report core

File:
`gaber-daily-material-flow-v1.js`

Code commit:
`f0acdd4a632cde4255a8222ce550574d47061d60`

Test commit:
`c8ba60408933a9ee173915eb99265934aacb3393`

Implemented:

- per Material ID + unit aggregation;
- opening stock;
- purchases today;
- Order Out/good consumption today;
- waste today;
- returned stock and reusable offcuts for audit visibility;
- other in/out adjustments;
- daily net movement;
- expected vs actual closing stock;
- `DAILY_MATERIAL_STOCK_VARIANCE` blocker;
- purchase drill-down;
- Order ID / Line ID / Task drill-down for outgoing quantity;
- waste drill-down;
- purchase value and recognized material cost.

The test suite includes the owner example 40/39/1 and the 40 purchased / 39 good output / 1 waste / 0 closing example.

### GM-05 — Task V2 material-close gate integrated in GitHub candidate

Operator Task V2 code commit:
`4b6c768259991009a84bafd04676f95e2693e1aa`

Integration test commit:
`6e606369b8cf104ac135b64f51462d5b37e8672d`

Dedicated CI composition commit:
`ad6e1ad5afef11eca63d57a8079a9fd8ca11f10c`

Behavior:

- new independent property name: `TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED`;
- candidate code never sets this property;
- when the property is false/missing, existing Task V2 behavior remains unchanged;
- when enabled, a Gaber/Laser Task cannot complete before `gaberMaterialTaskCloseGateV1_` returns `success=true` and `canClose=true`;
- missing gate backend while enabled fails closed;
- the gate executes inside the existing Task V2 completion lock and before source Order/Line status mutation;
- manager completion of a Gaber/Laser Task does not bypass the material gate;
- successful completion may preserve material-close fingerprint / close ID references.

## CI evidence

Dedicated workflow:
`TrendOS Gaber Material Control V1 CI`

Latest checked run:
`34503530339`

Result: **SUCCESS**.

Passed steps include:

- Task material custody/waste close tests;
- daily material flow report tests;
- Operator Task V2 material-gate integration tests;
- safety scan proving pure cores remain free of external write APIs and candidate code does not set activation properties.

Normal repository Integrity run on the same final composition:
`34503530345`

Result: **SUCCESS**.

This includes the existing composed Apps Script syntax/collision test, pre-deploy package safety gate, Accounting suites, Integrity suites, and existing regression families.

## Runtime safety statement

No Apps Script Head mutation occurred.
No production deployment occurred.
No Script Property was changed.
No Source Sheet business data was written.
No D1 business data was written.
No main merge occurred.
No RP-07 Phase 1 or RP-08 action occurred.

Current RP-07 Runtime Phase 0B HOLD remains authoritative and unchanged.

## Important data-source rule for the next step

The owner requires daily `الخوارج` to be derived from actual auditable Order/Line material movements, not typed as a manual end-of-day total.

Therefore the next candidate layer must introduce a stable append-only movement/event contract so every `Order Out` quantity has exact Task ID + Order ID + Line ID + Material ID evidence.

## NEXT ALLOWED GITHUB CANDIDATE STEP — PRE-RECORDED

Build a pure **Gaber Material Movement Ledger Contract V1** before any persistence adapter.

It must:

- define immutable movement event IDs;
- classify purchase receipt, Task issue, good production consumption, return, reusable offcut, waste/scrap and explicit adjustment movements;
- require Task/Order/Line identity on Task movements;
- reject negative/invalid quantities;
- provide idempotent replay semantics and reject conflicting reuse of the same event ID;
- aggregate `PRODUCTION_CONSUMED` by Material ID into the daily `Order Out` total;
- preserve exact per-Order/Line drill-down;
- never synthesize unexplained variance into waste;
- remain pure / store-independent / zero external writes;
- get dedicated tests and CI before any Sheets/D1 persistence adapter is prepared.
