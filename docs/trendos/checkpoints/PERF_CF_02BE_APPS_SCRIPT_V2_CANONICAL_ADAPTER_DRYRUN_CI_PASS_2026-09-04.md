# PERF-CF-02BE — Apps Script V2 Canonical Adapter Dry-Run CI PASS

Date: 2026-09-04
Branch: `agent/go-live-2026-09-01-integrity`
Qualified commit: `a68dff0a42f058851031de401fdb07b69076c201`
Workflow run: `33919642712`
Job: `101174765931` (`canonical-order-create-contract-v2`)
Result: **PASS**

## Purpose

Close the adapter gap between the Cloud Write Order Contract V2 create-intent and the exact public parameter envelope consumed by the current Apps Script `createManualOrder_(e)` path, without invoking the canonical writer or mutating any production system.

## Source added

- `apps-script/patches/CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_V1.gs`
- `tests/apps_script_cloud_write_order_v2_canonical_adapter_dryrun_v1.test.mjs`
- V2 workflow updated to include the adapter gate.

## Canonical source facts preserved

The current Apps Script `createManualOrder_(e)` remains authoritative for:
- `username` / `token` authorization and `canCreateOrder_` permission checks;
- Script Lock;
- V1908 idempotency / saved response replay;
- registered vs external customer identity resolution;
- debt and recent/open-order policy;
- department / heat-press / fly-print normalization;
- Business Order ID allocation/reuse;
- line ID allocation and Orders + Order Lines writes;
- activity/message/data-version side effects.

The V2 adapter therefore does **not** carry credentials and does **not** accept or generate a Business Order ID.

## Adapter output boundary

The adapter emits the exact canonical public aliases only:
- `clientRequestId`
- `customerName`
- `customerPhone`
- `customerMode`
- `externalCustomerId`
- `department`
- `itemName`
- `qty`
- `priority`
- `status`
- `heatPress`
- `flyPrint`
- `source`
- `notes`

It explicitly returns:
- `dryRun=true`
- `readOnly=true`
- `mutationFree=true`
- `wouldCall=createManualOrder_`
- `wouldInvoke=false`
- `canonicalEnvelopeReady=true`
- `canonicalInvocationAuthorized=false`
- auth boundary = separate authorized internal bridge required
- `businessOrderIdStrategy=apps-script-allocated`
- `orderIdPresent=false`
- `sheetsWritten=false`
- `mutationCount=0`
- `networkRequests=0`
- `propertyWrites=0`
- `safeForCanonicalInvocation=false`

## CI evidence

Workflow `TrendOS Cloud Write Order Contract V2 Gate`, run `33919642712`, job `101174765931`:
- pure V2 contract test: PASS
- staging fixed synthetic read-only plan test: PASS
- Apps Script canonical adapter dry-run test: PASS
  - log marker: `APPS_SCRIPT_CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_PASS`
- Production integration boundary: PASS
  - log marker: `V2_PRODUCTION_INTEGRATION_BOUNDARY_PASS`
- final marker: `CLOUD_WRITE_ORDER_CONTRACT_V2_GATE_PASS`

The same commit also completed `TrendOS Integrity V1` successfully.

## Production safety conclusion

- Adapter is **not** integrated into live `Code.gs`.
- Adapter is **not** exposed by a production route.
- V2 core remains outside the production Worker.
- Production Cloud Write V1 remains **OFF**.
- Business Order ID allocation remains Apps Script-owned.
- No D1, Sheets, Drive, Property, or network write was performed by 02BE.

## Next boundary

Do **not** call the production `createManualOrder_` with a synthetic V2 test against the production spreadsheet.

The next qualification must provide a genuinely isolated canonical-write environment (separate staging spreadsheet / isolated runtime or equivalent) before the first real V2 canonical write rehearsal.
