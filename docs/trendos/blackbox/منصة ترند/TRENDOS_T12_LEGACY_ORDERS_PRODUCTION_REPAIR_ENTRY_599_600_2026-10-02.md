# TrendOS T12 — Legacy Orders Production Repair — Entry599/600 — 2026-10-02

## Owner authorization

Authorized scope:

```text
0011 + API + reconcile exact verified 15 + frontend only
```

Explicit exclusions:
- no Apps Script change
- no Google Sheets write
- no Order ID change
- no business CREATE test
- no route/domain change

## Pre-mutation truth

Entry598 read-only preflight:
- run `37020759452`
- job `110882922276`
- result: SUCCESS
- active API version: `23be0ab2-0a2b-4b81-bf54-e2f05f847989`
- active API SHA: `2b78dea01c7e5892460ead4581915da9982208d60a41a95ce903beb742698f67`
- active UI version: `a26589a4-e2e0-4ed5-9abf-e1b19b56ce0e`
- migration 0011 absent and the only pending migration
- stale D1 active set = exact verified 15
- Google read-only recheck immediately before execution confirmed all 15 remained `تم التسليم`
- Order 4317 current note = `@koko.1072`

## Entry599 Production mutation

Workflow run: `37027377098`

Successful mutation stages:
1. exact qualified source check passed.
2. exact API target SHA built:
   `7550c3a82b30acf0f34c52565568df8d7e7d6092ca322b36bbac7726256a0bc6`
3. migration `0011_t12_legacy_line_runtime.sql` applied.
4. exact API target deployed.
5. live API target verified before business reconciliation.
6. exact 15 legacy rows reconciled into `t12_legacy_line_runtime` as `تم التسليم`.
7. exact 15 reconciliation events written.
8. Order 4317 note preserved as `@koko.1072`.
9. exact frontend target version created with zero traffic first.
10. frontend target promoted to 100%.

API after deploy:
- version: `ce156662-a698-47fc-b73c-dfd4657be9f5`
- live SHA: `7550c3a82b30acf0f34c52565568df8d7e7d6092ca322b36bbac7726256a0bc6`

Frontend after promote:
- version: `ff4a2517-042c-48f0-8b43-98621c2a6957`

The final combined Entry599 postflight failed after all authorized mutations had already succeeded. The failure occurred in the immediate static-asset marker check after promote. Per runbook, no mutation/deploy was repeated; the next action was independent read-only reconciliation.

## Entry600 independent read-only reconciliation

Workflow run: `37027847139`
Result: SUCCESS

Verified Production:
- API version `ce156662-a698-47fc-b73c-dfd4657be9f5` @ 100%
- API deployment `477ee04d-10ac-4fc3-9ba6-e81691bcd286`
- API bundle SHA exact target
- API bindings/vars pass
- UI version `ff4a2517-042c-48f0-8b43-98621c2a6957` @ 100%
- UI deployment `dafdd5bf-b6bd-4467-9fa0-a938e66ea2cf`
- runtime health pass
- duplicate-order create health pass
- customer GENERAL health pass
- employee auth OFF-state preserved
- legacy bridge OFF-state preserved
- legacy runtime rows = 15
- delivered runtime rows = 15
- reconciliation events = 15
- exact identity set only
- Order 4317 note preserved
- base mirror unchanged: `2026-09-26 18:33:08`, row/source count 768
- frontend assets HTTP 200
- legacy runtime frontend flag present
- legacy runtime update route present
- duplicate-order message preserved
- browser refresh fix preserved

Final state:

```ini
ENTRY600_READONLY_POSTFLIGHT=PASS
PRODUCTION_REPAIR_EFFECTIVE=YES
MIGRATION_0011_APPLIED=YES
API_TARGET_LIVE=YES
LEGACY_15_RECONCILED=YES
LEGACY_15_DELIVERED=YES
FRONTEND_TARGET_LIVE=YES
GOOGLE_SHEETS_WRITE=NO
APPS_SCRIPT_TOUCHED=NO
ORDER_IDS_CHANGED=NO
BUSINESS_CREATE_TEST_SENT=NO
```

## Closed issue

The legacy symptom `البند غير موجود في الشيت` for the verified stale 15 is closed by the D1 legacy runtime overlay. The immutable stale base mirror remains preserved for history; current operational state is layered in D1 runtime rather than rewriting mirror history.
