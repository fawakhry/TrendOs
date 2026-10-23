# Entry679 — Comprehensive draft manifest inventory (read-only, OFF)

**Purpose:** Prepare full customer draft item + private file metadata inventory, *without* claiming T12 can currently submit it or any live customer deployment.

- Bounded: exactly 1..50 ordered draft items, contiguous ordinals, each existing item ID unique; 0..250 private R2 file records, each READY with allowed type, SHA metadata, byte bounds, exact owner, exact item and deterministic private key. Reject pending/invalid/duplicate files, >5 per item, out-of-order or bad line flags.
- Customer login/ownership control is reused from original Entry667 SQL, reusing exact native session MAC and active D1 account controls. Does not weaken existing single-line/no-attachment preflight or expose customer data in a route.
- The result is **diagnostic read-only** only: SHA256 *observed metadata digest* of identity, items and file keys is returned internally, **not** file-body verification, not an authentication proof, not a D1 atomic seal, not immutable, not a T12 single-writer handoff. This digest MUST NOT be exposed through a public route before independent authorization/policy.
- Files remain private R2 objects; no bucket reads/writes/deletion. No order, finance, Printshop, Google, Google proxy or second writer. No Worker import/HTTP route. Entirely fake tests + D1-compatible disposable SQLite.
- Final release requirements: atomic/transactional snapshot seal + authenticated service actor + existing T12 idempotent ledger replay, batch of 1..50 items with complete attachment mapping, lost-ACK audit/reconcile, malware scanning and historical 25MiB policy parity, separate Cloudflare stage and rollback authority.
- `ENTRY679=SOURCE_ONLY_OFF`, `CUSTOMER_SUBMIT=NO_GO`, `ZERO_GOOGLE_RETIREMENT=0/9_VERIFIED`, `DEPLOY=NO`.
