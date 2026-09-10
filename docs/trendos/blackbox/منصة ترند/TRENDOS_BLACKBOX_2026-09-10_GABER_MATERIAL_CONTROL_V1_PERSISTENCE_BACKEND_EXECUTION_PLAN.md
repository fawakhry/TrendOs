# TrendOS Blackbox — Gaber Material Control V1 — Persistence + Task Close Backend Execution Plan

Date: 2026-09-10
Status: **OWNER-AUTHORIZED EXECUTION — GITHUB CANDIDATE ONLY — NO RUNTIME ACTIVATION**
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Parent checkpoint:
`TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_03_EASYSTORE_ADAPTER_PASS.md`

## Owner instruction

Owner explicitly instructed: **نفذ**.

This execution is limited to the next previously approved candidate scope:

1. append-only persistence contract for Gaber material movements;
2. Apps Script candidate backend implementing `gaberMaterialTaskCloseGateV1_`;
3. wiring the backend to the existing pure material-close decision, EasyStore adapter and movement ledger;
4. CI and blackbox evidence.

## Runtime safety boundary

RP-07 HOLD remains authoritative.

This execution MUST NOT:

- deploy or modify live Apps Script Head;
- mutate production Google Sheets;
- mutate D1 business data;
- set or change any Script Property;
- set `TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED`;
- merge to `main`;
- begin RP-07 Phase 1 or RP-08.

The new backend remains inert unless explicitly installed later and the existing independent feature flag is separately approved and enabled.

## Authoritative material identity / cost

EasyStore Accounting remains authority for material identity, stock and cost.

The existing material catalog sheet schema contains stable `ID`, department, material name, unit, stock balance and accounting cost fields. The candidate backend must resolve materials against that catalog and fail closed on missing/ambiguous IDs. Recognized unit cost must come from Accounting (`تكلفة محسوبة`, falling back to `سعر الوحدة` only according to the existing Accounting cost rule), never from an operator-entered monetary waste value.

## Persistence contract

Persistence is append-only and idempotent:

- immutable movement Event ID;
- identical Event ID + identical payload = replay / zero new append;
- identical Event ID + conflicting payload = hard blocker;
- one Task Material Close is prepared as one deterministic transaction;
- no partial accepted event set;
- stored records preserve event fingerprint, transaction ID, Task ID, Order ID, Line ID, Material ID and canonical payload;
- history is never edited to hide waste or variance; corrections are new reversal/adjustment facts.

## Stock semantics — V1

To avoid double decrement under the current EasyStore stock model:

- `TASK_ISSUE` is a **custody/audit fact only** and does not itself decrement authoritative physical department stock;
- final `PRODUCTION_CONSUMED` and approved `WASTE_SCRAP` are the recognized outgoing material facts;
- `RETURNED_TO_STOCK` and `REUSABLE_OFFCUT_RETURN` remain audit/reconciliation facts in this V1 model because the gross issue was not physically decremented;
- a future location-aware custody ledger may version these semantics, but V1 must not silently mix both models.

The current GitHub-only persistence/backend implementation does not activate production stock mutation. Production stock write coupling requires a separately qualified atomic/compensating runtime adapter after the RP-07 boundary is cleared.

## Backend gate contract

`gaberMaterialTaskCloseGateV1_(p, task, auth)` must:

1. trust server Task identity, not client IDs;
2. reject cross-Task / cross-Order / cross-Line payloads;
3. parse the submitted material close payload;
4. hydrate/verify material IDs and unit costs from EasyStore Accounting catalog;
5. evaluate the existing `gaber-material-control-v1` decision;
6. reject unbalanced material custody;
7. enforce detailed waste, abnormal-waste evidence/approval and no self-approval;
8. convert the accepted close to immutable ledger movements through the existing EasyStore adapter;
9. prepare an all-or-none append transaction against existing ledger records;
10. persist only if the transaction is valid and idempotent;
11. return `materialCloseId` + `decisionFingerprint` to Operator Task V2;
12. fail closed if any required dependency/schema/store is missing.

## Sheet lifecycle rule

The Task completion gate MUST NOT silently create its persistence sheet. Schema initialization is a separate explicit administrative action. If the ledger store is absent or has a mismatched schema, Task close fails closed.

## Acceptance evidence

Required CI coverage:

- persistence replay and conflict safety;
- all-or-none event batch;
- server Task identity override/rejection;
- accounting material ID/cost hydration;
- balanced Task close persists one deterministic close transaction;
- missing store/dependency fails closed;
- abnormal waste self-approval blocked;
- existing Operator Task V2 gate ordering remains before source status mutation;
- pure candidate files remain free of external writes;
- no code sets the feature flag.

## Stop condition

After candidate code + tests + CI PASS, write a new checkpoint. Do not activate runtime as part of this execution.