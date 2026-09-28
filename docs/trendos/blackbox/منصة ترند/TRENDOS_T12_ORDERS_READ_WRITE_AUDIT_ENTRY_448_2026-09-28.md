# TrendOS T12 — Orders Read/Write Comprehensive Audit

Date: 2026-09-28 Cairo

## Entry 448 RESULT — ORDERS-READ-WRITE-AUDIT-COMPLETE

Scope requested by owner:
Review all order read/write paths after GENERAL CREATE cutover.

This entry is diagnostic/read-only. No production code/data mutation was performed by the audit.

## A43 production D1 audit
- Branch: `diagnostic/t12-orders-read-write-audit-a43-20260928`
- Workflow commit: `5a58e69631c1a5cd68d2e1b741d083919bad563a`
- Run: `36448021009`
- Job: `109015249952`
- Conclusion: SUCCESS
- `TOKEN_GUARD=PASS`
- `CREATE_HEALTH=PASS`
- `RUNTIME_HEALTH=PASS`
- `PRODUCTION_MUTATION=NO`

Core D1 state:
```
generalMode=GENERAL
generalBudget=0
legacyBudget=0
nextOrderNumber=4324
orderCount=2
lineCount=2
ledgerCount=2
committedLedgerCount=2
createEventCount=2
outboxCount=2
outboxPending=2
outboxDone=0
outboxFailed=0
runtimeRows=0
runtimeEventRows=0
ordersMissingLedger=0
orphanLines=0
orphanOutbox=0
orphanRuntime=0
```

Cloud orders:
- 4322 = T12 CANARY CUSTOMER, print, request-new
- 4323 = محمود مناع / 01007131332, registered, print, source داخلي, request-new

## Live Google Sheets verification
Authoritative workbook:
`TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
Spreadsheet ID:
`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

Live sheet search found:
- Orders row 713: Order 4322 = محمود مناع / 01007131332 / print / generic print item / request-new / created 2026-09-28.
- Lines row 769: Line 4322-01 = محمود مناع / 01007131332 / print / generic print item / qty 1 / request-new.
- No Order 4323 in Orders sheet.
- No Line 4323 in Order Lines sheet.
- Sheet numeric sequence before that row was 4309..4321 then 4322.

This proves a live identity collision:
```
D1 order 4322   = T12 CANARY CUSTOMER
Sheet order 4322 = محمود مناع
D1 order 4323   = محمود مناع
```

The Sheet 4322 and D1 4323 strongly match as the same business request (same customer name, phone, department, generic item, quantity and status), while D1 4322 is the synthetic production canary. Treat business equivalence as highly likely but not destructively reconcile without explicit owner approval.

## Critical legacy CREATE writers
Repository baseline still contains independent Google numeric allocator `makeOrderId_` using Script Property `TRENDOS_NEXT_SIMPLE_ORDER_NO`.

Known create owners/routes that can still allocate outside D1:
1. `mbCreateOrder_`: actions `createOrder`, `createMatbagyOrder`, `clientCreateOrder`
2. `createCustomerPortalOrder_`: `createCustomerPortalOrder`
3. `submitCustomerDraft_`: `submitCustomerDraft`
4. `createManualOrder_`: `createManualOrder`
5. supplemental customer-draft allocator path `trendosCustomerDraftResolveOrderIdV1_` when its guarded route is enabled

Current browser wrapper only redirects `createManualOrder` to Cloud. It does not server-side fence the other allocators, and a stale/open browser without the current wrapper can still call legacy `createManualOrder`.

Therefore D1 is not yet the only numeric Order-ID authority despite GENERAL CREATE being enabled.

## Read path audit

### Print/Laser — fresh 02CR path
PASS with caveat:
- T12 Cloud rows are merged before filters/pagination.
- Cloud row is preferred over a duplicate mirror identity.
- Status counts/dashboard are recomputed over merged rows.

### Service screen
CRITICAL GAP:
- `/v1/edge/orders/service/page` reads only the Sheets Orders mirror.
- It does not merge T12 Cloud-native rows.
- When this route succeeds/freshness is accepted, Cloud-only orders disappear from Service and a colliding Sheet identity can be shown instead.
- When the route falls back, client hybrid overlay reintroduces Cloud rows, so Service results can change depending on mirror freshness.

### Hybrid fallback pagination/counters
GAP:
- Apps Script returns one paginated legacy page.
- Client then prepends all matching Cloud overlay rows to that page.
- Cloud rows may repeat on later pages.
- `pagination.totalRows` is incremented but page boundaries are not rebuilt globally.
- Dashboard/status counts from Apps Script are not recomputed after Cloud rows are merged, so current stale-mirror fallback counters omit Cloud-native rows.

### Debt/expected delivery/overdue enrichment
GAP:
Cloud overlay currently defaults:
- expectedDeliveryAt/Text = blank
- overdue = no
- debtAmount = 0
- deliveryDebtRestricted = false
- debt notes/hold empty
This makes overdue/today-work/debt UI incomplete for Cloud-native rows, especially in client fallback.

### Urgent notifications
GAP:
Frontend urgent notification polling uses legacy `getRows`, not `getRowsPageV1931`.
Therefore Cloud-only Fly Print/urgent rows can be missed.

## Cloud-native lifecycle write audit

### Single-line status/notes
PASS for basic persistence:
- Cloud-native `updateLine` routes to `/v1/t12/orders/line-runtime/update`.
- Writes status/notes into runtime overlay and appends runtime event.
- Read overlay layers runtime status/notes over immutable create row.

GAPS:
- no optimistic version precondition; concurrent editors are last-write-wins.
- `تم التسليم` is allowed without the legacy debt/invoice delivery gate.
- assignedTo and expected delivery are not runtime-mutable/persisted in this lane.

### WhatsApp metadata
Partial:
- Cloud-native rows already identified by the overlay route `markCustomerNotified` to Cloud runtime.
- Immediately after a new CREATE, before the line is re-read and added to the browser Cloud-native identity set, registration WhatsApp recording may incorrectly fall through to Apps Script and fail because the new order is not in Sheets.
- Notification runtime does not currently reconcile ambiguous batch outcome the same way line update does.

### Bulk status / delivery / archive / restore
CRITICAL GAP:
These remain Apps Script/Sheets-only:
- `bulkUpdateDepartmentStatusV1926`
- `deliverReadyPickupBulk`
- `archiveDeliveredDepartmentV1926`
- `restoreArchivedOrderV1931`
Cloud-native orders are therefore outside these workflows.

## Customer portal / conversation audit

### Customer submit
CRITICAL CREATE GAP:
- `submitCustomerDraft` still calls legacy `makeOrderId_` and writes official order/lines to Sheets.
- Customer draft can contain multiple items; current Cloud general CREATE qualifies only 1-2 lines, so migration needs an explicit multi-line path or a temporary final-submit fence.

### Customer order list
CRITICAL READ GAP:
- `getCustomerOrders_` reads only Sheet Order Lines.
- D1 Order 4323 is absent from Sheets, so customer portal will not see 4323 through this path.
- For محمود مناع, the Sheet contains colliding legacy 4322, so the portal can show 4322 while the confirmed Cloud order is 4323.

### Order conversation / proofs / attachments
CRITICAL READ/WRITE GAP:
- `getOrderConversation_` and `sendOrderConversationMessage_` require the order to exist in Sheet lines.
- A Cloud-only order can therefore fail to load/use the legacy conversation/proof workflow.

## Outbox / downstream side effects
CRITICAL GAP:
- D1 has 2 T12 outbox rows and both are still `pending`.
- No current generic T12 outbox consumer was found in the active architecture.
- Previous 02CL reconciliation was an exact one-off qualification, later disabled; generic drain was explicitly forbidden/not exposed.
- Therefore T12 CREATE downstream intents are accumulating without being processed.

## Create idempotency/concurrency
GOOD:
- ledger-based idempotent replay is verified before canary/general gate.
- D1 batch protects order/line/event/outbox commit.
- browser never automatically retries ambiguous CREATE.

GAPS:
- browser pending CREATE key is only sessionStorage and expires after 20 minutes; a very late manual retry can receive a new key and become a second business create.
- two concurrent different CREATE requests reading the same next number are fail-closed by PK/verification, but one request can surface an ambiguous/no-retry failure and require manual retry; safe but operationally rough.

## Current operational conclusion
Core Admin Cloud CREATE + Print/Laser read + basic single-line status/notes are functioning.
The complete order lifecycle is NOT yet single-authority / parity-complete.

Highest-priority blockers:
1. Fence all remaining legacy numeric CREATE allocators server-side.
2. Reconcile the live 4322 identity collision safely.
3. Add Cloud overlay to Service read path.
4. Port debt/invoice delivery gate + bulk/archive/restore to Cloud-native rows.
5. Migrate/overlay customer portal order list and order conversation/proofs.
6. Resolve T12 pending outbox/downstream side effects.
7. Fix hybrid fallback pagination/dashboard/status counts.
8. Persist/enrich expected delivery/debt/overdue fields.
9. Include Cloud rows in urgent notification polling.
10. Harden durable ambiguous-create idempotency beyond 20-minute sessionStorage.

No production mutation was performed by this audit.
