# TrendOS Blackbox — Gaber Material Control V1 — UI + Report Candidate Execution Plan

Date: 2026-09-11
Status: **OWNER-AUTHORIZED EXECUTION PLAN — GITHUB CANDIDATE ONLY — NO RUNTIME ACTIVATION**
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Parent checkpoint:
`TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_04_PERSISTENCE_BACKEND_PASS.md`

Owner instruction: `نفذ`

## Safety boundary re-read

`01_CURRENT_STATE.md` remains authoritative:

- RP-07 HOLD remains active;
- Operator Task V2 remains OT-00 GitHub-only preparation;
- no live Apps Script install/deploy;
- no production feature/property activation;
- no production Sheet/D1 business mutation;
- no main merge;
- no RP-08;
- `TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED` remains untouched.

This phase therefore implements only candidate UI/read-facade/test/CI work.

## Owner-visible outcome required

Prepare the next candidate layer so that, after a future approved runtime install, the workflow can present:

### Gaber / Laser Task close panel

For the active Laser Task:

- choose one or more accounting materials from the authoritative EasyStore material catalog;
- enter issued quantity;
- enter final good consumption (`خوارج أوردر`);
- enter returned stock;
- enter reusable offcut;
- enter waste quantity;
- if waste exists, enter exact Waste ID/reason/evidence reference;
- declare either `NO_PURCHASE` or `PURCHASE_RECORDED`;
- if purchase recorded, choose/reference actual EasyStore department purchase IDs;
- UI must not ask Gaber to type material cost;
- cost displayed, when shown, is server-supplied/read-only;
- Task completion must send one structured `materialClosePayload` into existing Operator Task V2 completion gate;
- if material control is disabled, current Task behavior remains unchanged.

### Management waste-approval panel

Manager only:

- view pending abnormal-waste facts for exact Task/Order/Line/Material/Waste identity;
- approve/reject through the existing server-side append-only approval writer;
- no operator self-approval;
- client approval flags are never trusted as accounting authority.

### Daily material report

For Laser/Gaber day:

`الخامة | رصيد أول اليوم | مشتريات اليوم | خوارج الأوردرات | التالف | مرتجع | بواقي قابلة للاستخدام | صافي حركة اليوم | الرصيد المتوقع | الرصيد الفعلي | الفرق | تكلفة الاستهلاك | تكلفة التالف`

Order Out drill-down must resolve to exact Task / Order / Line movement rows from the immutable material ledger.

A physical closing variance must remain explicit and must not be silently converted into waste.

## Candidate implementation structure

Prefer separate candidate modules so current live/runtime composition is not silently widened:

1. `gaber-material-ui-v1.js`
   - browser-only UI/state serializer;
   - no direct spreadsheet/D1 writes;
   - integrates with Operator Task V2 through a narrow global bridge.

2. `gaber-material-ui-backend-v1.gs`
   - read/status facade + manager approval facade;
   - reuses existing Accounting catalog and persisted material ledger/approval stores;
   - does not create stores implicitly;
   - write operation limited to manager waste approval and protected by existing material-control flag + manager authorization;
   - daily report is read-only.

3. `operator-task-workflow-v2.js`
   - when `role=GABER` + `materialControlEnabled=true`, render/mount material panel;
   - completion obtains payload from Gaber UI bridge;
   - no material payload is fabricated when panel validation fails;
   - Wael remains unaffected.

4. `operator-task-workflow-v2.gs`
   - expose narrowly scoped candidate ops only when Operator Task V2 + Gaber Material Control are enabled;
   - keep current fail-closed Task close gate.

5. tests + dedicated CI.

## Candidate API operations

Proposed Operator Task V2 sub-ops:

- `gaberMaterialBootstrap`
  - Gaber/Manager read-only;
  - returns material-control enabled state, active Task identity, authoritative active Laser material catalog, valid department purchase references for the Task/day, and current persisted close summary if any.

- `gaberMaterialDailyReport`
  - Manager and Gaber read-only;
  - reads immutable material ledger and authoritative accounting balances where available;
  - returns daily per-material report + exact movement drill-down.

- `gaberMaterialPendingWaste`
  - Manager only read-only;
  - returns abnormal waste items requiring/awaiting approval.

- `gaberMaterialWasteDecision`
  - Manager only write;
  - delegates to `gaberMaterialRecordWasteApprovalV1_`;
  - no delete/update of prior approval history.

No standalone top-level `doGet`/`doPost`/router definition is allowed in these candidate files.

## Mandatory fail-closed controls

- active Task identity must be server-derived;
- browser may not supply a different Task/Order/Line;
- material ID must exist in Accounting catalog;
- client cannot supply authoritative unit cost;
- purchase IDs must be actual EasyStore department purchases;
- abnormal waste cannot be completed from client-side fake approval;
- manager cannot self-approve operator waste;
- missing candidate store/schema/dependency -> explicit blocker;
- UI validation cannot substitute server validation;
- exact replay remains idempotent;
- no stock mutation in this phase.

## Physical-stock limitation remains unchanged

This phase does NOT connect Task close to authoritative EasyStore stock decrement.

Current semantics stay:

- `TASK_ISSUE` custody/audit only;
- `PRODUCTION_CONSUMED` + approved `WASTE_SCRAP` are recognized outgoing ledger facts;
- return/offcut remain reconciliation facts;
- authoritative physical stock adapter remains a separately qualified future runtime step after RP-07 clearance.

## Test / CI acceptance

The phase is accepted only if all pass:

- UI serializer/validation tests;
- Operator Task V2 UI integration tests;
- backend read-facade authorization tests;
- manager waste-decision authorization/idempotency tests;
- daily report ledger drill-down tests;
- no Wael behavior regression;
- dedicated Gaber Material CI SUCCESS;
- full TrendOS Integrity SUCCESS;
- safety scan proves no top-level router collision and no property-setting code.

## Explicit no-mutation statement before code work

At plan creation:

- no production Apps Script Head changed;
- no production deployment changed;
- no Script Property changed;
- no production sheet/store created;
- no production business row written;
- no D1 write;
- no main merge.

## Stop condition

After candidate UI/read-facade/report passes CI, write a new checkpoint. Do not install or activate it while RP-07 HOLD remains authoritative.
