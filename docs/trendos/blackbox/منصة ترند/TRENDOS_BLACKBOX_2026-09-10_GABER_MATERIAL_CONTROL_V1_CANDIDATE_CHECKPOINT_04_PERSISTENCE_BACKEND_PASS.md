# TrendOS Blackbox — Gaber Material Control V1 — Candidate Checkpoint 04 / Persistence + Backend PASS

Date: 2026-09-10
Status: **PERSISTENCE CONTRACT + APPS SCRIPT TASK CLOSE BACKEND + SERVER ACCOUNTING HYDRATION + WASTE APPROVAL CONTROL PASS — GITHUB CANDIDATE ONLY**
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Parent checkpoint:
`TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_03_EASYSTORE_ADAPTER_PASS.md`

Execution authorization record:
`TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_PERSISTENCE_BACKEND_EXECUTION_PLAN.md`

Owner instruction: `نفذ`

## Scope completed

The previously approved GitHub-only candidate phase is now implemented:

1. append-only material persistence contract;
2. Apps Script candidate backend implementing `gaberMaterialTaskCloseGateV1_`;
3. authoritative EasyStore Accounting material/cost hydration;
4. server-side purchase verification;
5. server-side abnormal-waste approval verification;
6. deterministic retry/idempotency behavior;
7. Operator Task V2 gate compatibility;
8. dedicated CI + full TrendOS Integrity verification.

No runtime activation was performed.

## New / changed candidate files

### Pure persistence contract

`gaber-material-persistence-v1.js`

Initial commit:
`7d13a115d7ab158203d3dc99c8d2fd6420769d29`

Responsibilities:

- validate persisted ledger records before accepting new movements;
- validate stored event fingerprints;
- prepare one deterministic Task Material Close transaction;
- identical Event ID + identical payload -> replay / zero append;
- identical Event ID + different payload -> hard conflict / zero accepted append;
- deterministic `Transaction ID`, `Material Close ID`, and transaction fingerprint;
- preserve Task / Order / Line / Material / Purchase / Waste references in each persistence record;
- pure/store-independent; no Spreadsheet/Properties/D1/network writes.

### Apps Script candidate backend

`gaber-material-persistence-backend-v1.gs`

Initial backend commit:
`32422648f1b81379c9cc10b2e9294b993c70e3ac`

Retry-stability correction commit:
`dbd4bf86a09699860e5de1d1698a2508eec92ad9`

Responsibilities:

- implements `gaberMaterialTaskCloseGateV1_(p, task, auth)` expected by Operator Task V2;
- defense-in-depth refuses operation unless existing Gaber material feature flag is enabled;
- trusts server Task identity and rejects conflicting client Task / Order / Line identity;
- never creates ledger/approval stores from the Task close gate;
- reads the existing EasyStore Accounting material catalog;
- resolves stable Material ID against the Accounting catalog;
- overwrites operator-entered material cost with authoritative Accounting cost;
- Accounting cost source follows current EasyStore rule: `تكلفة محسوبة`, falling back to `سعر الوحدة`;
- verifies referenced daily department purchases from the existing EasyStore purchase store;
- rejects missing, cross-department, reversed/rejected, or non-stock-applied purchase references;
- ignores client-supplied waste approval facts;
- uses exact server-side approval records by Waste + Task + Order + Line + Material;
- enforces evidence + non-self approval for abnormal waste categories;
- evaluates the pure material-close decision;
- converts the accepted close to immutable movement events through the existing adapter;
- prepares persistence using the pure append-only contract;
- appends accepted records as one `setValues` batch while the existing Operator Task completion flow already owns the script lock;
- returns `materialCloseId`, decision fingerprint, transaction ID, replay status and append count to Operator Task V2.

### Candidate stores

Ledger store schema:
`حسابات - حركة خامات جابر V1`

Approval store schema:
`حسابات - اعتماد هوالك جابر V1`

The candidate includes manager-only explicit initializer:
`gaberMaterialInitStoresV1_(auth)`

IMPORTANT: the Task close gate never calls this initializer. Store creation is a separate pre-activation administrative step and has NOT been run in production.

Candidate manager-only approval writer:
`gaberMaterialRecordWasteApprovalV1_(p, auth)`

It is append-only and not routed in this phase.

## Server authority controls

### Task identity

Client cannot substitute a different Task, Order or Line. If a payload supplies IDs, they must match the server-authoritative Task exactly.

### Material identity and cost

Material identity is hydrated from the EasyStore Accounting material catalog using its stable `ID` field.

Cost used for recognized Task material consumption and waste is hydrated from Accounting. A client-entered `unitCost` is not trusted.

Missing/ambiguous material mapping or unavailable Accounting cost fails closed.

### Purchase facts

A Task declaring `PURCHASE_RECORDED` must reference actual EasyStore daily department purchase IDs.

The backend verifies:

- purchase exists;
- department matches the Task;
- stock was actually applied;
- purchase has not been rejected/reversed;
- material maps to an Accounting Material ID.

### Waste approval

Abnormal waste approval supplied by the browser/operator is ignored.

Approval must exist in the server approval store and match exact:

- Waste ID;
- Task ID;
- Order ID;
- Line ID;
- Material ID.

Self approval remains forbidden.

## Retry / idempotency correction discovered during implementation

During backend testing, a retry-specific design risk was identified:

If the Task close timestamp were regenerated with `now` on every retry, a Task whose material movements were successfully persisted but whose later source-status update failed could generate a different event fingerprint on retry.

Correction:

`gmcExistingTaskStampV1_` reuses the first persisted Task work-date/occurred-at stamp for the same Task + Order + Line.

Result:

- first material persistence succeeds;
- a later Operator status-write failure can safely retry the material gate;
- same material facts replay instead of creating duplicate/conflicting movements;
- zero duplicate append on exact retry.

## Bug caught by the new backend CI and fixed

The first backend CI exposed a pre-existing pure-core defect in `gaber-material-control-v1.js`:

Old expression:

`offcutQty: nonNegative(m.offcutQty || m.reusableOffcutQty)`

When `offcutQty` was explicitly `0`, JavaScript `||` treated it as false and could turn the valid zero into a missing value.

Fix commit:
`d55ccd107e58e681fb6c0b691ea534620f02d27f`

Correct semantics now preserve explicit zero:

`m.offcutQty != null ? m.offcutQty : m.reusableOffcutQty`

Dedicated regression test added:
`tests/gaber_material_zero_offcut_regression_v1.test.mjs`

Regression-test commit:
`641dd46dd107ddcd115512476db327e08e44f7af`

CI guard composition commit:
`bad8ddd177f2814108cfd754f040e90c7e6af311`

This defect was fixed before checkpoint acceptance.

## Test coverage added

### `tests/gaber_material_persistence_v1.test.mjs`

Covers:

- deterministic append transaction;
- exact replay -> zero append;
- conflicting same Event ID -> atomic blocker;
- corrupt stored fingerprint -> fail closed;
- required Task/Order/Line/decision identity;
- missing ledger dependency -> fail closed;
- deterministic transaction identity.

### `tests/gaber_material_persistence_backend_v1.test.mjs`

Covers:

- balanced Task close persists one batch;
- Accounting cost replaces client-entered cost;
- retry after clock movement appends zero duplicate records;
- client Task/Order/Line substitution blocked;
- missing persistence store fails closed and is not created implicitly;
- client-side fake abnormal-waste approval ignored;
- exact server approval permits abnormal waste;
- EasyStore purchase reference hydrated and emitted as `PURCHASE_RECEIPT`;
- rejected/reversed purchase cannot satisfy the declaration;
- waste self-approval remains forbidden.

### `tests/gaber_material_zero_offcut_regression_v1.test.mjs`

Covers explicit zero offcut and alias zero behavior.

## Final CI evidence

Final GitHub head used for acceptance:
`bad8ddd177f2814108cfd754f040e90c7e6af311`

### Dedicated Gaber workflow

Workflow:
`TrendOS Gaber Material Control V1 CI`

Run:
`34515398994`

Result:
**SUCCESS**

Final run includes:

- original Task custody/waste tests;
- zero-offcut regression tests;
- daily material-flow tests;
- append-only movement-ledger tests;
- EasyStore adapter E2E tests;
- append-only persistence contract tests;
- Apps Script persistence backend gate tests;
- Operator Task V2 gate integration tests;
- safety scan.

### Full platform Integrity

Workflow:
`TrendOS Integrity V1`

Run:
`34515399020`

Result:
**SUCCESS**

Full integrity foundation, Apps Script composition/collision gate, pre-deploy package safety gate, Accounting core/transaction/persistence suites and the other current TrendOS integrity tests all completed successfully.

## Current candidate chain after Checkpoint 04

`EasyStore daily department purchase facts`
`-> server purchase verification`
`-> Accounting stable Material ID + factual unit cost hydration`
`-> Task material reconciliation / waste decision`
`-> EasyStore-to-ledger adapter`
`-> immutable movement events`
`-> append-only persistence transaction`
`-> Operator Task V2 material-close gate`
`-> exact Order/Line material audit trail`
`-> ledger-backed daily material report`

## Stock semantics / important limitation

This checkpoint does NOT claim live physical stock write coupling from Task close.

V1 candidate semantics remain deliberately safe:

- `TASK_ISSUE` is custody/audit only;
- `PRODUCTION_CONSUMED` and approved `WASTE_SCRAP` are the recognized outgoing facts in the ledger/report model;
- `RETURNED_TO_STOCK` and `REUSABLE_OFFCUT_RETURN` are reconciliation/audit facts because gross issue is not currently decremented from authoritative EasyStore stock by this candidate;
- no production EasyStore material stock was decremented by this work.

Connecting Task close to authoritative physical stock mutation requires a separately qualified atomic/compensating runtime stock-write adapter after the RP-07 safety boundary is cleared. It must not double-decrement stock relative to existing EasyStore behavior.

## Runtime / no-mutation statement

No live Apps Script Head installation.
No production deployment.
No production store initialization.
No Script Property mutation.
No `TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED` activation.
No production Google Sheet write.
No production D1 write/cutover.
No EasyStore production runtime change.
No main merge.
No RP-07 Phase 1.
No RP-08.

RP-07 HOLD remains authoritative.

## Phase result

**PERSISTENCE + BACKEND CANDIDATE: PASS.**

The implementation requested by the owner for this phase is complete in GitHub candidate form and fully tested.

## Next safe step

Do not activate this candidate until the current RP-07 runtime safety boundary is cleared.

After runtime clearance, the activation sequence should be independently approved and staged:

1. inspect live Apps Script deployment/version inventory and current active flags under RP-07 Phase 0B;
2. qualify exact candidate module composition with the live backend;
3. explicitly initialize the new ledger/approval stores;
4. expose the required operator/manager UI and read APIs without bypassing Task V2;
5. qualify the physical-stock write adapter with all-or-none / compensating behavior;
6. shadow-test Gaber only;
7. enable the Gaber material feature flag only after successful shadow evidence;
8. monitor first live closes, waste approvals, stock reconciliation and daily report before widening scope.