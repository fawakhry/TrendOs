# TrendOS Blackbox — Gaber Material Control V1 — Waste Approval Request Store Decision

Date: 2026-09-11
Status: **DESIGN DECISION RECORDED BEFORE CODE MUTATION — GITHUB CANDIDATE ONLY**
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Parent plan:
`TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_UI_REPORT_EXECUTION_PLAN.md`

## Gap discovered

The current Task close backend correctly blocks abnormal waste until an exact server-side approval exists.

However, because the final Task close does not persist when approval is missing, the immutable material ledger cannot itself provide the manager with a queue of abnormal waste that is still waiting for approval.

Therefore a manager `pending waste` panel requires a durable pre-close request fact.

## Decision

Add a separate append-only candidate store:

`حسابات - طلبات اعتماد هوالك جابر V1`

The store is NOT a financial/stock ledger and does not recognize cost or mutate stock.

It only records an approval request envelope before Task close:

- Request ID;
- Request fingerprint;
- Waste ID;
- Task ID;
- Order ID;
- Line ID;
- Material ID;
- Material name;
- quantity;
- reason code;
- evidence reference;
- operator;
- requested at;
- status snapshot / payload JSON.

## Rules

- request identity is deterministic from exact Task/Order/Line/Material/Waste facts;
- identical retry is idempotent / zero duplicate append;
- same Waste ID + conflicting request facts fails closed;
- request does not grant approval;
- manager decision remains in existing append-only approval store;
- manager panel derives pending state by comparing latest request identity with approval history;
- operator cannot self-approve;
- no request row is deleted/overwritten;
- corrections require a new request identity or explicit manager decision; history stays immutable;
- Task completion still uses the existing final server gate and re-validates everything;
- client-submitted cost is not stored as authority; Accounting cost remains server-side.

## Initialization / runtime

Add the request-store schema to the explicit manager-only pre-activation initializer, but the Task close gate and UI read facade must never create it implicitly.

This store has NOT been initialized in production and must remain uninitialized while RP-07 HOLD is active.

## Safety unchanged

No production Apps Script install/deploy/property/store/data mutation is authorized by this decision.
