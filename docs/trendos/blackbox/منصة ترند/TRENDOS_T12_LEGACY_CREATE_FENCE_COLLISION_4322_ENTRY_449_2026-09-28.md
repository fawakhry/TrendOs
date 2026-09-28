# TrendOS T12 — Legacy Create Fence + 4322 Collision Repair

Date: 2026-09-28 Cairo

## Entry 449 — PREPARED / PRODUCTION DEPLOYMENT BLOCKED BEFORE START

Owner authorization:
`موافق اقفل legacy writers وأصلح تصادم 4322`

## GitHub source changes completed
Working branch:
`cloud-migration-v3-t12-order-create-ci-20260919`

Changes:
- `Code.gs`: added fail-closed T12 Cloud Order-ID authority fence for legacy create actions:
  - createOrder
  - createMatbagyOrder
  - clientCreateOrder
  - createCustomerPortalOrder
  - submitCustomerDraft
  - createManualOrder
  - trendosCustomerDraftSubmitV1
- `makeOrderId_` itself now fails closed when `TRENDOS_LEGACY_ORDER_CREATE_DISABLED_V1=true`.
- `trendos-order-line-integrity-v1.gs`: supplemental draft submit path directly checks the fence.
- Added `tests/t12_legacy_create_fence.test.mjs`.

Commits:
- Code.gs fence: `2fd41374cf62b5b7c111270684dc52e8a1731d4f`
- supplemental fence: `5f46b4c4e51b5c5c6c567468519faffd619f3700`
- regression test: `dc30793515766241181866e95d15979a4fdf9d35`

## A44 qualification
Diagnostic branch:
`diagnostic/t12-legacy-create-fence-a44-20260928`

Workflow commit:
`487d600a1b0b084dcd57901671c0945c8a4dff7a`

Run:
`36459402744`

Job:
`109053864185`

Result:
- legacy create fence test: PASS
- Google create writer inventory: PASS
- lifecycle writer inventory: PASS
- supplemental writer inventory: PASS
- conclusion: SUCCESS

The existing broad T12 isolated workflow run `36459276691` failed its historical hard scope guard because that guard reports an already-existing out-of-scope workflow change; its syntax step passed. A44 is the targeted qualification for this fence.

## Live collision evidence confirmed before mutation
Spreadsheet:
`TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`

Live references for the business legacy 4322:
- Orders row 713: Order 4322 = محمود مناع / 01007131332
- Order Lines row 769: Order 4322 / Line 4322-01 = محمود مناع
- Activity row 12179: Order 4322 / Line 4322-01 / إنشاء أوردر / ضياء
- Operations alerts row 2125: Order 4322 / Line 4322-01 / محمود مناع / request-new notification

No Sheet 4323 was found in the audited operational references.
D1 remains:
- 4322 = T12 CANARY CUSTOMER
- 4323 = محمود مناع
- nextOrderNumber=4324

## Intended collision repair after live fence deployment
Only after the production Apps Script fence is live:
1. Re-key the matching Google business references from 4322/4322-01 to 4323/4323-01.
2. Update the queued customer message and duplicate key to say 4323.
3. Preserve D1 canary 4322 for audit but hide it from active operations via runtime status `ملغى`.
4. Retire canary 4322 pending outbox so it can never later reconcile into Sheets.
5. Leave real D1 4323 pending downstream intent untouched until the outbox architecture is separately fixed.
6. Verify no duplicate 4322 business references remain and 4323 is consistent across D1/Sheets.

## Production deployment blocker
The only currently authorized source-edit/deploy surface for the bound Apps Script is browser/editor deployment.
The browser automation run did NOT start because the connected browser automation wallet balance is insufficient.
Therefore:
- live Apps Script source: NOT CHANGED
- live Web App deployment: NOT CHANGED
- Sheet collision data: NOT CHANGED
- D1 collision data/runtime/outbox: NOT CHANGED
- production mutation from this step: NO

Do not perform the collision data mutation until the live Apps Script legacy allocator fence has been deployed and verified.
