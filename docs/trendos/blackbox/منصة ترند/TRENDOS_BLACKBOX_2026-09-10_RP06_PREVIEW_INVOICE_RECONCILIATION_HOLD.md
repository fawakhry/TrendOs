# TrendOS RP-06 — Preview Failure / Invoice Reconciliation Hold

Date: 2026-09-10
Repository: `fawakhry/TrendOs`
Working branch: `agent/go-live-2026-09-01-integrity`

## Recording rule

Owner instruction effective from this checkpoint:

> أي حاجة بتتعمل لازم تتسجل

Every material execution step, gate result, decision, blocker, approved mutation, completed mutation, and explicit no-mutation stop must be recorded in the TrendOS blackbox before continuing to the next operational step.

Historical records remain immutable evidence. New facts supersede old operational boundaries through a new checkpoint rather than rewriting history.

## RP-06 runtime preview result — current state

Work mode returned the following result from `trendosCoreP0RegistryPreviewV1`:

- `success=false`
- `readOnly=true`
- `expectedCount=34`
- `actualPlanCount=34`

The preview failed closed only on the three historical `DUPLICATE_INVOICE_DRAFTS` specs:

- Order `3569`
  - source row count `0 != 2`
  - live evidence hash mismatch
  - Draft IDs no longer match the exact plan
  - source-row identity no longer matches the historical canonical decision
- Order `3572`
  - source row count `0 != 2`
  - live evidence hash mismatch
  - Draft IDs no longer match the exact plan
  - source-row identity no longer matches the historical canonical decision
- Order `3577`
  - source row count `1 != 2`
  - live evidence hash mismatch
  - Draft IDs no longer match the exact plan
  - source-row identity no longer matches the historical canonical decision

No `3536-01` Press error appeared in this preview. The prior `3536-01` reconciliation/fix is therefore no longer the active RP-06 preview blocker.

No Registry Write was authorized or executed from this failed preview.

## Read-only reconciliation — historical Invoice specs

Authoritative live source:

- production workbook tab: `حسابات - مسودات الفواتير`
- Sheet ID: `2026082401`
- inspected live range: `A1:X46`
- reader path: `trendosCoreP0RegistrySourceRowsV1_` -> `trendosHealthSnapshotV1_().drafts`
- selector key: normalized Order ID

Invoice evidence fields:

- `draftId`
- `orderId`
- `subtotal`
- `status`
- `blocker`
- `invoiceNo`
- `messageStatus`
- `metaId`

### Current live state

#### Order 3569

- live Draft rows: `0`
- planned historical canonical: `DR-19c18636` @ source row `21`
- planned historical superseded: `DR-55d94661` @ source row `20`
- current evidence: `[]`
- expected evidence hash: `06afbe9d9646aa151ce7f8c9bc6b1da57d4d0aafc5635784fed7c622de215023`
- current empty-array hash: `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`

#### Order 3572

- live Draft rows: `0`
- planned historical canonical: `DR-69e8cb63` @ source row `19`
- planned historical superseded: `DR-fe3c766a` @ source row `18`
- current evidence: `[]`
- expected evidence hash: `d496b057f5843f87b2c32cee86d53016e14a170706325820fdf0eb759d1c19d2`
- current empty-array hash: `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`

#### Order 3577

- live Draft rows: `1`
- current source row: `39`
- current Draft ID: `DR-48a39a8b` (`Draft ID` cell empty; DTO falls back to `ID`)
- current Order status: `جاهز للاستلام`
- current Draft status: `يحتاج تسعير/اعتماد`
- subtotal: `0`
- blocker: `لا توجد بنود معتمدة بسعر بيع.`
- invoiceNo/messageStatus/metaId: empty
- planned historical canonical: `DR-3466cb0d` @ source row `17`
- planned historical superseded: `DR-ceed6b65` @ source row `16`
- expected evidence hash: `d0913e2a85a73b2b391a2d2f04789f78d4b4b26412e9adeefe195c75297a3d77`
- current evidence hash: `8d00f6813b7cd9ba5bc01625db9ff3529a8707d0d4c4656de83a526ec350f374`

The historical planned source rows `16..21` now belong to unrelated Orders/Drafts; row position is not a stable identity and must not be used as a repair mechanism.

### Reconciliation diagnosis

- `3569`: source data changed/disappeared; historical exact plan is stale.
- `3572`: source data changed/disappeared; historical exact plan is stale.
- `3577`: historical two-row duplicate disappeared and a new single Draft row exists; historical exact plan is stale.
- required schema remains present.
- Draft-ID fallback remains functional.
- selector logic is not the cause of this failure.

## Invoice retirement decision gate

A second full read-only pass over `حسابات - مسودات الفواتير` found only two current duplicate groups:

- Order `3849`: 2 rows
  - row 6: `DR-2c398d17`
  - row 7: `DR-78d925aa`
- Order `3851`: 2 rows
  - row 4: `DR-6b61be62`
  - row 5: `DR-be3e37a2`

No other duplicate Draft groups exist in the current live source.

Current `DUPLICATE_INVOICE_DRAFTS` metric semantics:

- group Draft rows by normalized Order ID;
- only groups with `rows.length > 1` enter duplicate resolution;
- `openExcess = sum(max(0, rowCount - 1))`;
- with no Resolution Registry sheet currently present, both live groups remain open.

Current live metric:

- `DUPLICATE_INVOICE_DRAFTS.count = 2`
- IDs: `3849`, `3851`
- duplicate group count: `2`

Orders `3569`, `3572`, and `3577` are not current duplicate groups and therefore do not reach the Invoice Resolution Registry consumer path.

Decision:

**RETIRE_3_INVOICE_SPECS**

Reason: the three historical specs no longer correspond to a live duplicate group, and both dashboard and Invoice runtime consult `DUPLICATE_INVOICE_DRAFTS` resolution only for groups with more than one live Draft row.

## Old 34-row approval is invalidated

The prior checkpoint:

`TRENDOS_BLACKBOX_2026-09-09_RP06_REGISTRY_WRITE_APPROVED_PENDING_EXECUTION.md`

is historical evidence only and is operationally superseded by this checkpoint.

The following old execution boundary MUST NOT be used:

- writer blob approval associated with the old exact 34-row plan
- expectedCount `34`
- plan hash `5e80dd09271d21e96e3f415c21688e7f16bcac2f4b664cc23d38b08c1036aa29`
- any one-use Script Property value equal to that old hash
- any instruction to execute `trendosCoreP0RegistryWriteV1` for those 34 rows

No Production Registry Write may proceed from the old approval.

## Candidate plan shape — not yet approved or applied

Retiring only the three stale Invoice specs would produce:

- Attendance: 6 specs unchanged
- Cleaning: 11 specs unchanged
- Press: 14 specs unchanged
- historical Invoice specs: 0
- total: 31 specs

However, two new live duplicate groups (`3849`, `3851`) remain unresolved. Therefore the 31-spec plan is not yet considered the final RP-06 execution plan.

The next bounded step is a read-only business/evidence resolution gate for Orders `3849` and `3851` only, to determine whether either has a deterministic safe canonical/superseded decision.

Possible final candidate counts after retirement:

- 33 if both current groups are safely resolvable;
- 32 if only one is safely resolvable;
- 31 if neither can be safely resolved automatically.

A new plan hash must be calculated only after the final candidate set is fixed and tested.

## Safety / mutation status

At this checkpoint:

- no Registry Write executed;
- no Registry sheet created;
- no Script Property set for a new write;
- no Production deploy executed;
- no business-family flag changed;
- no Source Sheet business data edited by these reconciliation gates;
- no D1 business-data write executed;
- no `Code.gs` mutation executed;
- no new runner/workflow created for RP-06;
- the reconciliation and retirement gates were read-only.

## Exact next action

Run only the read-only `RP-06 Live Invoice Resolution Gate` for Orders:

- `3849`
- `3851`

Required output per Order:

- all live Draft evidence and source identities;
- downstream references if any;
- deterministic canonical/superseded assessment without relying on row order alone;
- exact current evidence hash;
- `SAFE_TO_SUPERSEDE` or `HOLD_FOR_BUSINESS_DECISION`.

Then STOP and record the result in the blackbox before any RP-06 code patch or Production write.

## Operational task queue read-only review — Wael / Gaber

Date: 2026-09-10
Source: current production workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`, tab `بنود الأوردرات`.

This was a read-only status review only. No Sheet cells, Apps Script, D1 data, flags, workflows, or production configuration were changed.

### Wael — Printing queue

Current responsible department value: `وائل` / `طباعة`.

Live review shows a substantial current printing backlog. The currently visible active production rows include `41` rows in status `طلب جديد`, with no corresponding `تحت التنفيذ` row found in the reviewed current queue. The newest block is predominantly last-updated `2026-09-09`.

Urgent `طلب جديد` examples in the current queue include Orders:
`4012`, `4014`, `4021`, `4022`, `4028`, `4029`, `4031`, `4032`, `4033`, `4035`, `4039`, `4042`, `4046`, `4048`.

The review did not count `تم التسليم`, `ملغى`, or `مكرر` as active production work.

### Gaber — Laser queue

Current responsible department value: `جابر` / `ليزر`.

In the current recent queue:

- `7` rows are `طلب جديد`: `4013-02`, `4018-01`, `4027-02`, `4034-01`, `4036-01`, `4037-01`, `4047-01`.
- `3` rows are `تحت التنفيذ`: `3955-01`, `3973-01`, `3948-02`.
- `4` rows are `جاهز للاستلام`: `3982-02`, `3997-01`, `4004-02`, `4007-01`.
- `3907-02` is `مكرر` and is not treated as active extra work.

Operational interpretation: Wael currently has the larger unstarted production backlog, while Gaber has a smaller active laser queue with work already in execution plus several ready-complete items awaiting pickup/next-stage handling.

STOP: this review was read-only and has now been recorded before further operational action.