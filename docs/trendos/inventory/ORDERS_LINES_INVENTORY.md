# TrendOS Phase 0 — Orders & Order Lines Inventory

> **Scope:** read-only source inventory from the GitHub working branch `agent/go-live-2026-09-01-integrity`.
> **Important:** this document describes repository source currently inspected. It does **not** prove the exact source deployed behind historical Apps Script Version 138. Production-source reconciliation remains required before code changes.

## Inventory result

`INV-01 — enumerate Order/Line create/update entry points`: **PASS for current working-branch repository source**.

The repository already contains more integrity protection than some older handoff snapshots implied. In particular, `appendLine_()` already rejects a second row with the same Line ID, and `syncOrderFromLines_()` excludes rows marked `مكرر` from active totals. These findings must be verified against the actual live Apps Script source/runtime before treating P0-01 as solved.

---

## 1. Staff/manual order creation

### Event
Employee creates an order from TrendOS Add Order UI.

### Frontend
`app.js`

The UI generates one request ID per submit attempt:

`co_<timestamp>_<random>`

and sends it as `clientRequestId` to:

`createManualOrder`

The same params object is reused by the UI retry/confirmation path.

### Entry point
`Code.gs` → `createManualOrder_(e)`

### Authorization
- `authorize_(username, token)`
- `canCreateOrder_(user)`
- current repo allows admin/service plus Diaa/Rahma aliases.

### Lock
`LockService.getScriptLock()` → `waitLock(30000)` around the create flow.

### Existing idempotency
V1908 request replay guard:
- `trendosV1908RequestKey_(p)` reads `clientRequestId`, `requestId`, `idempotencyKey`, `idempotency_key`.
- `trendosV1908ReadSavedResponse_()` reads a prior successful result from Script Properties.
- property prefix: `TRENDOS_CREATE_ORDER_V1908_`.
- `trendosV1908SaveResponse_()` persists successful response JSON.

### Duplicate/open-order behavior
- `trendosV1922FindOpenOrder_()` uses `بنود الأوردرات` as the operational source for open-order detection.
- open-order matching is department-scoped.
- if an eligible open order is reused, the next line number is obtained through `trendosV1922NextLineNumber_()`.
- if a new order is needed, `makeOrderId_(..., skipLock=true)` is called under the outer create lock.

### Writes
- `الأوردرات` through `upsertOrderSummary_()` for a new order.
- `بنود الأوردرات` through `appendLine_()`.
- `سجل حركة الأوردرات` through activity logging.
- `سجل تنبيهات التشغيل` through status-message queueing.
- Script Properties for V1908 successful request replay.
- data-version state is bumped.

### Retry behavior
**Strongest current create path** when the caller supplies a stable request ID: the outer lock serializes the operation and V1908 replays the successful response instead of creating a second order.

### Gap
If a non-UI/external caller omits all supported request-id fields, the durable V1908 replay guard is inactive. The lock still serializes the operation and open-order rules may reduce duplication, but this is not a universal stable event-key contract.

---

## 2. Line creation helper — `appendLine_()`

### Current repo behavior
`appendLine_(ss, o)` requires a Line ID and calls:

`trendosV1932FindLineRowById_(sheet, lineId)`

before append.

If the Line ID already exists, the helper:
- does not append another row,
- logs `منع تكرار بند`,
- returns success with `duplicatePrevented:true` and the existing row number.

### Existing logical key
`Line ID` is already treated in this helper as the unique create key.

### Important limitation
This is an **existence guard**, not a full semantic UPSERT/update.

`appendLine_()` itself does not acquire a lock. Sequential duplicate calls are blocked, but two concurrent callers can still race unless the caller already owns a common lock.

### Consequence
Do **not** blindly add another duplicate guard. First verify production source and then upgrade this to the shared integrity contract where needed.

---

## 3. Order summary helper — `upsertOrderSummary_()`

### Key
Order ID / Order Code.

### Behavior
- scans `الأوردرات` for the same Order ID/Code,
- updates existing row when found,
- appends only when not found.

### Limitation
No independent lock inside the helper. Concurrency safety depends on the caller or on unique order allocation.

---

## 4. Order ID allocation — `makeOrderId_()`

### Store
Script Property:

`TRENDOS_NEXT_SIMPLE_ORDER_NO`

### Behavior
- takes ScriptLock unless `skipLock=true`,
- obtains the next numeric order number,
- writes the next counter back to Script Properties,
- returns the allocated ID as a string.

### Manual-create usage
`createManualOrder_()` already owns the outer lock and calls `makeOrderId_(..., true)`.

### Open question
Legacy creation paths that take an outer ScriptLock and also call `makeOrderId_()` without `skipLock=true` require runtime/source reconciliation; do not assume nested locking behavior is safe without a test.

---

## 5. Legacy Matbagy bridge order creation

### Routes
- `createOrder`
- `createMatbagyOrder`
- `clientCreateOrder`

### Entry point
`mbCreateOrder_(e)`

### Lock
ScriptLock at function start, 20 seconds.

### Writes
- new numeric Order ID,
- one Line ID `<orderId>-01`,
- `الأوردرات` through `upsertOrderSummary_()`,
- `بنود الأوردرات` through `appendLine_()`.

### Idempotency
No V1908-style stable request-key replay was found on this route in the inspected repo source.

### Risk
A repeated request after the first completes can allocate a different Order ID, so the Line-ID duplicate guard cannot detect it because the new Line ID is also different.

### Status
Legacy/reachable source path. Current production usage is **UNKNOWN**.

---

## 6. Direct legacy Customer Portal order creation

### Backend entry point
`createCustomerPortalOrder_(e)`

### Current frontend status
The current `app.js` function named `createCustomerPortalOrder()` is retained for compatibility but now calls `addCustomerDraftItem()` instead of directly creating an order. Therefore this backend route exists but is not the primary current portal UI flow.

### Backend behavior
- customer authorization,
- allocates new Order ID,
- upserts order summary,
- creates one or multiple Line IDs,
- calls `appendLine_()`,
- writes activity log.

### Lock/idempotency gap
No encompassing ScriptLock or stable request-id replay was found around this direct backend path.

### Risk
An external/direct retry can allocate a new Order ID and create a second logical order.

### Recommended future disposition
Deprecate, disable, or wrap with the shared integrity layer after production-source reconciliation.

---

## 7. Current Customer Portal Draft → Order conversion

### Frontend
`submitCustomerDraft()` sends:

`submitCustomerDraft` with `draftId`.

The UI has a local `customerDraftBusy` flag, but that is only a browser/UI guard.

### Backend
`submitCustomerDraft_(e)`

### Existing sequential replay guard
If the draft status is already not `مسودة`, the function returns the stored `رقم الأوردر الناتج`. This protects ordinary sequential repeat submissions after the first conversion completed.

### Create transaction
When status is still `مسودة`:
1. collect draft items,
2. allocate a new Order ID,
3. `upsertOrderSummary_()`,
4. create final Line IDs and call `appendLine_()`,
5. update the draft to `تم بدء التنفيذ`,
6. store `رقم الأوردر الناتج`,
7. bind draft files to final Order/Line IDs,
8. activity log + flush.

### Critical concurrency gap
No outer ScriptLock was found around:

`check draft state -> allocate Order ID -> write Order/Lines -> mark draft submitted`

Two simultaneous submits can both read `مسودة`, allocate different Order IDs, create different order/line records, then race to write the draft's resulting Order ID.

### Classification
**CORE-P0 candidate / high-value first integrity fix after production-source reconciliation.**

---

## 8. Draft item creation before conversion

### Entry point
`addCustomerDraftItem_()`

### Behavior
- requires draft state `مسودة`,
- counts current items,
- creates `draftId-Ixx`,
- creates Drive item folder,
- appends item/file row,
- increments count.

### Gap
No lock was found around count → next item ID → append.

### Risk
Concurrent additions can derive the same item number or otherwise create inconsistent draft state.

---

## 9. Single Line update

### Route
`updateLine` → `updateLine_(e)`

### Lookup order
1. valid `rowNumber`, else
2. `lineId`, else
3. `orderId` fallback.

### Writes
- status,
- ready flag,
- updated time,
- notes,
- debt fields,
- order summary via `syncOrderFromLines_()`,
- activity log when state/notes changed,
- customer status-message queue when status changed,
- data-version bump.

### Gaps
- no ScriptLock around read-old-state → write → summary/log/queue,
- no stable event/request idempotency,
- rowNumber can become stale after structural mutations,
- Order-ID fallback can select the first matching line when Line ID is absent,
- concurrent writes are effectively last-write-wins and side effects can diverge.

### Future contract
Normalized Line ID should be the required logical update key for normal application writes. Row number should be an internal/debug fallback, not the business identifier.

---

## 10. Order summary from Lines — `syncOrderFromLines_()`

### Important current repo finding
The inspected repository source already filters rows with status `مكرر` out of `effectiveMatched` before calculating active/current totals and overall order state.

### Meaning
Historical duplicate rows can remain as evidence without inflating current work totals in this code path.

### Caveat
Repository source is not yet verified as the exact deployed production source.

---

## 11. Bulk status update

### Entry point
`bulkUpdateDepartmentStatusV1926_(e)`

### Idempotency
- accepts `requestId`,
- uses ScriptCache key based on user + request ID,
- cached replay returns prior response.

### Lock
ScriptLock via `tryLock(20000)`.

### Writes
- Line statuses/readiness/update time,
- synced Order summaries,
- activity log,
- status-message queue,
- data-version bump.

### Limitation
Idempotency is cache-lifetime based rather than durable, and depends on a caller-supplied request ID.

---

## 12. Archive delivered

### Entry point
`archiveDeliveredDepartmentV1926_(e)`

### Protection
- screen/role authorization,
- request ID,
- ScriptCache replay guard,
- ScriptLock,
- copy to archive + delete live rows.

### Caveat
When no request ID is supplied, the function generates a new UUID; an external retry without a stable caller key is not the same logical event.

---

## 13. Restore archived order

### Entry point
`restoreArchivedOrderV1931_(e)`

### Lock
ScriptLock, 20 seconds.

### Duplicate safety
Under the lock it builds current live Line IDs and refuses restore when an archived Line ID already exists live.

### Writes
- copies archived Lines back to live,
- restores Order summary if absent,
- removes archive copies,
- syncs summary from Lines,
- activity log,
- data-version bump.

### Idempotency note
A default request ID `RESTORE-<orderId>` is produced, but no separate durable request-response store was confirmed. Safety primarily comes from the under-lock live-Line-ID check.

---

## 14. Event map summary

| Event | Entry point | Lock | Idempotency / logical key | Main writes | Retry behavior |
|---|---|---|---|---|---|
| Staff create order | `createManualOrder_` | ScriptLock 30s | V1908 stable request ID + Order/Line guards | Orders, Lines, activity, automation, properties | strong when request ID supplied |
| Legacy Matbagy create | `mbCreateOrder_` | ScriptLock 20s | no stable request replay found | Orders, Lines | repeated completed request may create new Order ID |
| Direct legacy portal create | `createCustomerPortalOrder_` | none found around full flow | Line existence guard only after new Order ID | Orders, Lines, activity | retry can create new logical order |
| Portal draft submit | `submitCustomerDraft_` | none found around conversion | draft status replay after completion | Orders, Lines, draft/files, activity | sequential replay safe; concurrent submit unsafe |
| Draft item add | `addCustomerDraftItem_` | none found | derived `draftId-Ixx` | draft/files/Drive | concurrent numbering risk |
| Create Line helper | `appendLine_` | none internally | existing Line ID check | Lines + duplicate activity | sequential duplicate same ID blocked |
| Single Line update | `updateLine_` | none found | Line ID preferred but optional; no event key | Lines, Order summary, activity, automation | concurrent/duplicate side-effect risk |
| Bulk status | `bulkUpdateDepartmentStatusV1926_` | ScriptLock | requestId in ScriptCache | Lines, Orders, activity, automation | replay safe only within cache/key scope |
| Archive delivered | `archiveDeliveredDepartmentV1926_` | ScriptLock | requestId in ScriptCache | live/archive Orders+Lines | caller must preserve request ID |
| Restore archive | `restoreArchivedOrderV1931_` | ScriptLock | live Line ID duplicate check | live/archive Orders+Lines | duplicate restore blocked by live IDs |

---

## 15. Findings that change the earlier plan

1. **A Line-ID duplicate guard already exists in the current repo source.** Do not implement a second blind guard.
2. **`syncOrderFromLines_()` already excludes `مكرر` rows from active totals in the current repo source.**
3. **Manual Add Order already has a meaningful lock + V1908 idempotency mechanism.** The integrity foundation should standardize and strengthen it, not replace working behavior blindly.
4. **The most obvious uncovered concurrency hole is Customer Draft → Order conversion.**
5. **`updateLine_()` is weaker than the bulk update path** with respect to locking/idempotency.
6. **Stable event keys are inconsistent across paths**: PropertiesService, ScriptCache, draft state, duplicate scans, or no event key.

---

## 16. Still unknown / next verification requirements

- exact Apps Script source/files deployed behind live Version 138.
- whether current live `appendLine_()` contains the V1932 duplicate guard seen in GitHub.
- whether current live `syncOrderFromLines_()` contains the `مكرر` exclusion seen in GitHub.
- active trigger list/cadence.
- current Sheet number formats for Order ID / Line ID columns; no proof yet that Line ID columns are Plain Text.
- real current active usage of legacy create routes.
- runtime concurrency behavior for draft submit and Line update.

## Next exact action

**Verify the exact live Apps Script production source/deployment composition for the Orders/Lines paths before writing `trendos-integrity-v1.gs` or modifying these functions.**
