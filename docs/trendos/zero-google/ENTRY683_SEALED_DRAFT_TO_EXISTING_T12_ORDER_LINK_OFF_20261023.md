# Entry683 — Immutable native draft → original T12 order readback (OFF / SOURCE ONLY)

23 October 2026. **Operational link only**; NO finance ledger / bill / customer balance / Google cutover / production migration / customer route.

## Why this is necessary

The employee Accounting screen in the original `TrendOS/app.js` already calls `loadAccountingOrderLinesFromLocal()` through **استدعاء أجزاء وائل وجابر**, but that is a browser cache, not proof that the displayed order ID actually belongs to a native customer. Existing EasyStore ACC213–ACC225 already qualify the original Wail/Print + Gaber/Laser invoice engine, source-only exact V1 Finance Connector `order_line_approved` and authenticated READONLY tests. **Do not duplicate this invoice/collection engine or create an alternate finance writer.**

## Implemented

- `cloudflare-d1/src/customer-portal-native-seal-t12-link-read-v0.mjs` is **not imported by production Worker**. Its `inspectSealedCustomerDraftT12LinkV0({db,draftId})` uses one read-only `D1.batch()` of three SELECTs against **original tables**: Entry682 immutable private seal, `t12_prod_request_ledger` + `t12_prod_orders`, and `t12_prod_lines`.
- It reconstructs the exact `cld1_<created_ms>_<draft_hex>` request key from the original immutable draft, verifies seal/draft customer ID parity, parsed bounded private source snapshot, one independent logical item, **no attached R2**, canonical writer `COMMITTED` and its own ledger order ID/actor, `source=customer-native-draft`, registered identity name/phone equal to the private sealed snapshot, and one T12 physical line containing matching item department/name/qty/flags and generated line ID. The SQL transaction removes multi-query TOCTOU *during readback*; Entry682 database triggers stop customer staging changes *after sealing* once applied in isolated approved future Stage.
- In real T12, two print+laser lanes may represent **one mirrored item**, but not two independently authorized customer items. This source-only reader only qualifies **one source item → one T12 line**. It fails shut for multiple source items, any R2 attachment, two T12 lines, missing/pending ledger, conflicting actor or order, or changed item. This is NOT lossless multi-item handoff and not a replacement for the existing T12 writer.
- An internally coherent operational link returns the new operational `orderId`, one `lineId` and count **without** customer name, phone, PII, R2 object key, invoice or balance. Every result states `customerOwnerAttested=false`, `officialCustomerFKVerified=false`, `financeAuthorized=false`, `invoiceAuthorized=false`, `connectorEventPublished=false`, `orderCreated=false`. The original T12 `external_customer_id` is legacy client input rather than an immutable official native `t12_customers.customer_id` foreign key, as EasyStore ACC221–224 already proved. Structural equality with a privately sealed native draft **does not upgrade owner attestation**.
- No customer bearer becomes an employee actor; this module has **NO HTTP handler**, no background enqueue, no mail, no signed finance event, no account authority. EasyStore's original versioned V1 Finance Connector is the only future transport path and requires independent authenticated official customer/order proof, trusted employee approval, true separate EasyStore Cloud provider identity and reconciled financial data before use.

## Tests

- `tests/entry683_customer_seal_t12_operational_link_off.test.mjs`: single fake D1 transaction, nested tampering, lost/incomplete request ledger, changed order identity, multi-item and R2 loss prevention, no PII response, no finance rights or worker route.
- `tests/entry683_customer_seal_t12_operational_link_sqlite.test.py`: uses the original D1 customer, draft, seal, T12 order + COMMITTED ledger migrations and seed from Entry682, **fictional records only**. Constructs fixture T12 order/line rows for readback; this fixture is **not** a call to the canonical order creator and does not claim actual handoff success. Checks unrelated order key isolation, PREPARED, missing line and immutable-seal protection.
- Tests are integrated into existing `.github/workflows/trendos-entry682-customer-draft-seal-off-ci.yml` on PR #221; zero external Cloudflare/Google secrets.

## Real remaining work before an actual invoice

1. Original T12 order creator must securely accept a frozen native customer source through a verified independent employee actor and preserve **all** distinct items/metadata/private files, with official native `order_id → customer_id` evidence, not just client-supplied `external_customer_id` or matching names.
2. EasyStore independently validates authentic source event, official customer identity, Print/Laser separate approvals and one invoice through **existing** finance writer; its independent Cloudflare Worker/D1 provider identity still not attested. Existing `app.js` local button is **NOT** a completed automatic finance handoff.
3. G1–G5 authentic user grants/cash custody/real openings/backup+isolated Ubuntu restore, documented billing idempotency and app/deployment parity before owner authorizes any Stage/Production finance traffic.

**STATUS:** `ENTRY683=SOURCE_ONLY_READBACK`; `T12_CUSTOMER_OFFICIAL_SUBMIT=NO_GO`; `EASYSTORE_FINANCE_CONNECTOR=OFF`; `FINANCE_RELEASE=NO_GO`; `ZERO_GOOGLE_LIVE_RETIRED=0/9`; `NO_PRODUCTION_MODIFICATION`.
