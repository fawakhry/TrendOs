# AP-083 — Dedicated diagnostic cache design (SOURCE_ONLY)

The runtime currently uses an in-memory isolate cache. This proposed shared cache
holds only the five operational aggregate counts already permitted by AP-080.
It cannot serve Finance, readiness, owner decisions, operator identities, order
IDs, line IDs, customer data, approvals or task activation.

The adapter accepts an injected, dedicated Workers KV-like namespace. It is
unbound and unimported by any deployed Worker. There is no schema migration or
Production storage operation in this checkpoint. Tests use an in-memory fake.

The single key is `control-tower:diagnostic:v1`. Stored fields are schema version,
source timestamp, observation timestamp, fixed source-expiry timestamp and five
nonnegative integer counts. Reads reject unknown fields, malformed numbers,
changed expiry, future timestamps and expired records. Output remains diagnostic
STALE with every protected execution authority false.

Expiry is generatedAt plus five minutes, never arrival plus five minutes. KV's
absolute expiration is rounded down. Snapshots with less than 60 seconds of
remaining storage life are skipped rather than extending their deadline to meet
KV's minimum TTL. The read validator enforces expiry even if KV returns an old
record. Eventual consistency may return an older qualified snapshot; this cache
does not promise the latest value, transactional ordering or audit retention.

Before integration or activation:

1. Obtain approval for this exact dedicated storage design and namespace scope.
2. Create one dedicated namespace, bind it only to the read-only Dashboard and
   preserve its existing service bindings/settings under fresh source leases.
3. Qualify storage permissions and a two-isolate, non-destructive staging test.
4. Integrate behind an explicit default-OFF flag. Verify upstream recovery clears
   stale UI and stale Finance/protected state never enters the cache.
5. Publish only after source CI, runtime parity and settings qualification pass.
   Rollback disables the flag and restores the previous Dashboard version; no
   business database or accounting rollback is required.

MC-02/MC-23 remain PARTIAL. This checkpoint proves a source adapter contract, not
a live durable cache or a complete platform roadmap.
