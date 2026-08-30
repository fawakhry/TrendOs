# Phase 2 — Order / Line Integrity Checkpoint

Status: **PREPARED + TESTED ON GITHUB BRANCH / NOT DEPLOYED**

Working branch: `agent/go-live-2026-09-01-integrity`

## Files

- `trendos-integrity-v1.gs`
- `trendos-order-line-integrity-v1.gs`
- `tests/trendos_integrity_v1.test.js`
- `tests/trendos_order_line_integrity_v1.test.js`
- `.github/workflows/trendos-integrity-v1.yml`

## Latest implementation commit

`7a5cf846e978110c0111eb4f6461b5d21652e985`

Latest CI run: `33316494202` — **SUCCESS**.

## Contracts implemented

### Line update

`trendosUpdateLineV1_(e)`:
- uses the shared ScriptLock for the whole mutation / summary / activity / queue / data-version block.
- treats normalized `Line ID` as the authoritative business key.
- rejects invalid Line IDs.
- rejects stale `rowNumber` when it does not match the row resolved by Line ID.
- rejects Order-ID / Line-ID mismatch.
- refuses to choose arbitrarily when more than one non-`مكرر` row exists for the same Line ID.
- ignores historical `مكرر` rows when resolving the active row.
- same desired status + notes becomes a no-op response instead of another business mutation.
- preserves the existing delivery/debt gate.

### Customer Draft item add

`trendosCustomerDraftAddItemV1_(e)`:
- runs under the same ScriptLock as Draft submit.
- checks for duplicate raw Draft Item IDs before inserting.
- allocates next item suffix from the maximum existing `-Ixx` suffix rather than row count.
- prevents Item-ID collision under concurrent Add Item calls.

### Customer Draft upload

`trendosCustomerDraftUploadFileV1_(payload)`:
- runs the legacy uploader while holding the shared ScriptLock.
- therefore Draft Submit cannot snapshot the draft concurrently with an upload.
- blocks upload after Draft execution has started.

Known remaining gap: legacy file-upload payload has no durable stable request ID, so ambiguous retry after Drive file creation is not yet exact-once. This is documented and must not be hidden.

### Customer Draft submit

`trendosCustomerDraftSubmitV1_(e)`:
- uses one outer ScriptLock across Draft validation -> Order ID allocation/reuse -> Order summary -> Lines -> Draft/File mapping -> activity log.
- calls `makeOrderId_(..., true)` only while the outer ScriptLock is held, avoiding nested ScriptLock.
- persists `رقم الأوردر الناتج` immediately after allocating the Order ID and flushes it as a durable retry checkpoint.
- retry after a partial failure reuses that same Order ID instead of allocating another Order.
- existing Lines are protected by the current `appendLine_()` Line-ID duplicate guard, so a resumed Draft can complete missing Lines without creating a second row for an already-created Line ID.
- validates raw Draft Item IDs before using `collectDraftItems_()` so Item-ID collisions cannot be silently collapsed.
- verifies raw Item count equals collected Item count before formal Order creation.
- if Draft state says execution started but `رقم الأوردر الناتج` is missing, it fails closed with an integrity error instead of returning empty success.
- preserves the original summary-department fallback behavior (`طباعة` when no department is present).

## Tests passing

Automated tests currently cover:
- one active row + historical `مكرر` row -> active row resolves.
- stale rowNumber -> rejected.
- two active rows for same Line ID -> rejected.
- Draft Item sequence uses max suffix rather than count.
- duplicate Draft Item ID -> detected.
- first Draft Order allocation -> checkpoint written.
- second retry -> same Order ID reused and allocator not called again.
- static shared-lock / `skipLock=true` / secret-leak guards.

GitHub Actions runs both foundation and Phase-2 tests on every push to the integrity branch.

## Not yet wired

Do not change production routes yet.

Future controlled wiring after source-composition checkpoint:
- `updateLine` -> `trendosUpdateLineV1_`
- `addCustomerDraftItem` -> `trendosCustomerDraftAddItemV1_`
- `submitCustomerDraft` -> `trendosCustomerDraftSubmitV1_`
- POST `uploadCustomerDraftFile` -> `trendosCustomerDraftUploadFileV1_`

No production Apps Script, Sheet data, trigger, D1 schema or deployment was changed by Phase 2 preparation.

## Phase 2 status

**IMPLEMENTED ON WORKING BRANCH + AUTOMATED TESTS PASS.**

Not yet `DEPLOYED` or `RUNTIME VERIFIED`.

Next implementation lane: **Business Calendar integration + Attendance + Cleaning**.
