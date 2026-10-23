# Entry682 — SOURCE_ONLY/OFF customer draft immutable staging seal

## Scope
- This is an **additive staging-only** table/trigger migration (`0039_customer_portal_native_draft_seal_v1.sql`) and an exported SQL contract file. It does **not** create a T12 order or change any accounting/printing authority.
- The exact **one SQL INSERT..SELECT** atomically verifies a live native customer session, Cloud-only unique account, general admission control, original draft in DRAFT, contiguous 1..50 lines, all 0..250 files READY/owned/cross-linked with <=5 files/item, and no previous T12 request-ledger row. Builds a deterministic ordered private JSON source snapshot inside SQLite and seals the draft in the same statement.
- Database triggers on original draft, item and file tables deny all INSERT/UPDATE/DELETE touching a sealed draft (including racing R2 PENDING→READY and late duplicate item insert) even when a different source routine issues SQL. The seal record cannot itself be modified or deleted via ordinary SQL. This closes the **post-read staging mutation window** for the sealed draft; the earlier Entry680/681 read-only inspections alone did NOT.
- `snapshot_json` includes customer data and private object keys and MUST remain inside protected D1; no HTTP response, public URL, log dump, token or R2 object download. Full file BODY/SHA provenance, malware scans, physical custody and 25MiB parity remain unresolved.
- This schema deliberately does NOT provide a generic unseal/cancel/delete path. Before live cutover the owner must define a privileged auditable compensation/recovery procedure and a post-T12 COMMITTED state transition that cannot be run by a customer.
- **NO production migration**, `R2` binding or Worker import; no HTTP route, no customer-accessible sealing call, no own order/finance writer. A trusted T12 service actor/authorization still needs to be designed, and the existing canonical T12 create contract still accepts only one logical line/no attached R2 content.

## Verification
- Disposable SQLite migration tests seed fake customers, staged drafts/items/R2 metadata and verify trigger-backed freeze, replay, pending file and T12 ledger denial.
- No deployed cloud verification; triggers depend on approved migration in same database before any staged seal usage.
- `ENTRY682=SOURCE_ONLY_OFF`, `GOOGLE_LIVE_RETIRED=0/9_VERIFIED`, `T12_CUSTOMER_OFFICIAL_SUBMIT=NO_GO`, `DEPLOY=NO`.
