# PERF-CF-02BB — Canonical Order Write Contract Audit — Cloud Write V1 BLOCKED — 2026-09-04

## Result
PASS as an architecture/safety audit, with an explicit BLOCK on Production Cloud Write V1 cutover.

The production read-only preflight in 02BA proved the existing Cloud Write lane is installed but disabled. This audit traced the live Apps Script order-creation contract before allowing any production write canary.

## Canonical operational create path
The strongest current operational create path is `createManualOrder_(e)` in `Code.gs`.

It is not equivalent to appending a partial summary row to `الأوردرات`.

The canonical path includes the following business invariants and side effects:
- authenticated employee + `canCreateOrder_` authorization;
- 30-second ScriptLock;
- V1908 request-key idempotency and saved-response replay;
- registered-customer vs external/transient-customer identity handling;
- registered-customer debt lookup and delivery-restriction awareness;
- department normalization, including `مكبس -> طباعة + heatPress=true`;
- fly-print handling and urgent-priority promotion;
- duplicate fingerprint guard for recent customer/department/item/qty duplicates;
- open-order lookup using `بنود الأوردرات` as source of truth;
- department-scoped open-order reuse/block logic;
- numeric business Order ID allocation through `makeOrderId_` / `TRENDOS_NEXT_SIMPLE_ORDER_NO`;
- line number allocation from live Lines;
- multi-department split into separate Printing/Laser lines;
- broad Orders summary via `upsertOrderSummary_`;
- one or more Lines via `appendLine_`;
- V1932 Line ID duplicate guard;
- `syncOrderFromLines_` when reusing an open order;
- Activity Log append;
- Trend Master status-message queue per line;
- data-version bump;
- V1908 response persistence.

## Orders + Lines are one business write contract
`upsertOrderSummary_` writes a broad Orders summary, including identity, dates, department, priority/status, counts, debt state, source/actor, customer mode/external ID, customer notes, draft/folder and franchise fields.

`appendLine_` creates the operational line rows and enforces the final Line ID duplicate guard. Therefore a valid operational create is not an Orders-only mutation.

## Current Cloud Write V1 mismatch
The current Cloudflare `POST /v1/cloud/orders` contract normalizes/stores a D1 order with fields such as:
- orderId
- customerName / customerPhone
- status
- department / priority
- expectedDelivery
- total / remaining
- timestamps / actor

It then creates a D1 event and an `upsert_order_to_sheets` outbox item.

That shape is insufficient to faithfully execute the canonical Apps Script business create because it does not carry the complete line/business intent required by `createManualOrder_`, including at minimum explicit `itemName`, `qty`, heat/fly-print semantics, customer identity mode/external identity, and the canonical side-effect contract.

More importantly, V1 allocates/accepts a D1 `orderId` before Apps Script, while the canonical Apps Script path owns the numeric business Order ID allocator. Treating a `CW-*` D1 ID as the live business Order ID would bypass the current production numbering contract.

## Decision
Production Cloud Write V1 is BLOCKED from cutover.

Do not enable `TRENDOS_CLOUD_WRITE_V1_ENABLED` on production and do not reconcile V1 by direct partial append to `الأوردرات`.

## Required V2 direction
A Cloud Write Order Contract V2 must be prepared as a pure/default-off planning layer first.

V2 must represent a canonical create intent rather than an already-created business Order row, and must:
- require an idempotent request key;
- make customer identity mode explicit;
- require the operational line intent (`department`, `itemName`, positive `qty`);
- normalize `مكبس` and fly-print semantics consistently with Apps Script;
- keep initial status fail-closed to `طلب جديد` for the first controlled lane;
- keep multi-department explicit;
- reject ambiguous/non-supported identity or department inputs;
- not pre-allocate a production business Order ID; business Order ID remains Apps Script-owned until a future adapter is qualified;
- output only canonical `createManualOrder` parameters / a plan;
- perform no D1, Sheets, network, property, or production mutations;
- remain unimported by the production Worker until separately qualified through Staging.

## Safety state at close
- Production Cloud Write: OFF.
- Production write route: still fail-closed 423 from 02BA.
- Live Orders/Lines mutation from this audit: NONE.
- Google Sheets/Apps Script remain authoritative for writes.

## Next exact gate
Implement and CI-qualify the pure Cloud Write Order Contract V2 with no production route integration.
