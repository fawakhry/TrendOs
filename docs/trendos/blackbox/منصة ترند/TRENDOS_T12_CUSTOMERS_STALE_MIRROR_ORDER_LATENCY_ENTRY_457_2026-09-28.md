# TrendOS T12 — Customer mirror stale; Orders latency root cause — Entry 457
Date: 2026-09-28 Cairo
Repository: `fawakhry/TrendOs`
Working branch: `cloud-migration-v3-t12-order-create-ci-20260919`

## Owner report
Owner reported that order rows now take noticeable time to appear and requested moving Customers off Google Sheets.

## Current customer authority audit
Current frontend customer search remains Apps Script:
- `app.js -> searchCustomers()` calls `api("searchCustomers", ...)`.
- `Code.gs -> searchCustomers_()` reads the full `العملاء` sheet and filters it in Apps Script.
- `createCustomer` also remains a Google Sheets write path.
- During Cloud CREATE, `resolveRegisteredCustomerForCloud` still calls the original Apps Script `searchCustomers` when customer phone resolution is needed.

D1 already contains:
- normalized `customers` table;
- a raw mirror of `العملاء`;
but neither is currently a complete/current Cloud-native customer authority.

## Live source evidence
Authoritative spreadsheet:
`TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`

Spreadsheet ID:
`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

Current `العملاء` grid metadata:
- 248 grid rows
- 56 columns

The sheet contains the operational customer master fields including name, manager, primary/extra phone, type, active flag, debt, customer code, branch fields and portal fields.

## A49 read-only D1 diagnostic
Branch:
`diagnostic/t12-customers-latency-a49-20260928`

Workflow commit:
`1157709d88e8f02237fae09828e7f5ca8c87cf4f`

Run:
`36475178461`

Job:
`109106975382`

Safety:
`PRODUCTION_MUTATION=NO`

The workflow overall ended FAILURE only because the stored qualification employee session returned HTTP 401 during latency timing. The D1 state inspection itself succeeded before that failure.

Verified D1 state:
```ini
NORMALIZED_CUSTOMERS=103
CUSTOMER_MIRROR_ROWS=246
CUSTOMER_MIRROR_SOURCE_LAST_ROW=246
CUSTOMER_MIRROR_SOURCE_LAST_COL=47
CUSTOMER_MIRROR_STATUS=ready
CUSTOMER_MIRROR_NOTE=PERF-CF-02CR enrichment live sync V1
CUSTOMER_MIRROR_AGE_SECONDS≈789070
```

Recent normalized customer migration evidence:
- 100 rows, customers derived from orders
- 3 rows, customers derived from orders
- both dated 2026-08-27

Therefore the normalized customer table was historically populated from Orders rather than from the authoritative Customer master and is incomplete by design.

## Orders latency root cause
The qualified 02CR Orders route requires all three mirrors:
- `بنود الأوردرات`
- `العملاء`
- `عملاء منع التسليم بالمديونية`

The 02CR freshness guard requires Customer enrichment mirrors to be fresh within the configured budget (default 300 seconds).

The Customer mirror is roughly nine days stale. Therefore the qualified 02CR route can reject the read as stale and the browser then falls back to Apps Script. That creates an Edge attempt followed by an Apps Script read and explains the noticeable delay before order rows appear.

Classification:
```ini
ORDER_LOAD_LATENCY_ROOT_CAUSE=STALE_02CR_CUSTOMER_ENRICHMENT_MIRROR
CUSTOMER_SEARCH_AUTHORITY=GOOGLE_SHEETS
NORMALIZED_D1_CUSTOMERS=INCOMPLETE
PRODUCTION_MUTATION=NO
```

## Existing immediate recovery mechanism
Repository already contains:
`cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs`

It is specifically designed to keep only:
- `العملاء`
- `عملاء منع التسليم بالمديونية`

fresh in D1 using heartbeat / row delta / atomic full rebase and a 1-minute trigger.

Its expected mirror note exactly matches the stale production mirror:
`PERF-CF-02CR enrichment live sync V1`

The module does not write Google Sheets.

## Planned customer migration
Use two phases:

1. **Restore 02CR enrichment freshness** so Orders reads stop falling back to Apps Script and become fast again.

2. **Move customer reads to native D1** using the authoritative `العملاء` sheet as source, not Orders:
   - import safe operational customer fields only;
   - exclude portal password hashes/session tokens from the Cloud directory payload;
   - add authenticated Cloud customer search;
   - route frontend `searchCustomers` Cloud-first with temporary Apps Script fallback;
   - keep customer CREATE/update on Sheets until its separate write cutover is qualified.

No customer data mutation or write-authority cutover was performed in this entry.
