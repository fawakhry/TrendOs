# PERF-CF-02CU — 02CR Dual-Signal Idle Freshness Candidate

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Status

**CANDIDATE VERIFIED PASS — ISOLATED PREVIEW LIVE PASS — PRODUCTION NOT DEPLOYED**

This checkpoint fixes the remaining Orders freshness problem without changing source authority, without fabricating D1 write timestamps, and without requiring an Apps Script redeploy.

## Production boundary at start

Production remains:

- main: `9552407c5a5136371f9afd452b913c226329d7dc`
- Worker version: `c77bf453-c590-4cff-a55b-fd9c625b6d76`
- eligible Orders reads: D1 first through `/v1/edge/orders/02cr/page`
- Apps Script fallback retained
- `__DEBT__`: Apps Script
- writes: Apps Script / Sheets
- Sheets / Apps Script authoritative
- 02CL OFF
- generic drain OFF
- no secret rotation
- no `EDGE_SESSION_SECRET` change

Navigation-return/no-refresh is already CLOSED with technical + user-visible PASS and is not reopened by this work.

## What the live evidence proved

The remaining issue was not a dead Apps Script trigger.

A read-only rerun of the installed Low-Usage heartbeat route showed the route is currently healthy:

- enabled: true
- Low-Usage trigger count: 1
- legacy V1 trigger count: 0
- direct V2 trigger count: 0
- sourceChanged: false during idle
- D1 request made during unchanged idle check: false
- D1 write made during unchanged idle check: false
- lastError: empty
- consecutiveErrors: 0

This is the intended low-usage design: unchanged source must not create a D1 request/write merely to refresh a timestamp.

### Production raw mirror behavior

Read-only Production stability Run `34031380301` succeeded.

At approximately 11:50 UTC it observed:

- `بنود الأوردرات`: ready + parity, physical `syncedAt=2026-09-06 11:48:24`, age about 129–137 seconds during the six reads
- `العملاء`: about 25–33 seconds old
- `عملاء منع التسليم بالمديونية`: about 25–33 seconds old
- Edge read p95: 762 ms in that run
- `__DEBT__` remained Apps Script fallback

The same Lines mirror then naturally aged while the source stayed unchanged.

### Isolated Preview stale-path proof

Dedicated read-only `/02cr/page` Preview qualification Run `34031601605` — **SUCCESS**.

The live qualification intentionally required Lines to be physically older than 5 minutes so the new logical-freshness path was actually exercised.

Safe metadata from the successful run:

- 02CR version: `D1_ORDERS_READ_02CR_OPERATIONAL_CANARY`
- Lines physical age: 419 seconds on the first read, 420 seconds on the repeat read
- Customers physical age: 17 seconds
- Debt-restrictions physical age: 17 seconds
- logical freshness mode: `verified-idle-source-unchanged`
- heartbeat proof age: 124 seconds first read, 127 seconds repeat
- heartbeat max age: 720 seconds
- Lines source shape matched D1 metadata exactly
- anonymous `/02cr` read remained fail-closed
- repeat qualified read also passed

No business row values were printed by the dedicated qualification probe.

This demonstrates the exact production failure mode: physical D1 write time can legitimately cross the frontend 5-minute threshold during idle even though the authoritative Sheets source is unchanged and the Low-Usage heartbeat is healthy.

## Root cause

The dual-signal idle verifier already existed for the generic Orders read lane, but the qualified frontend route was different:

`/v1/edge/orders/02cr/page`

In `cloudflare-d1/src/index_v2.js`, 02CR was routed directly to `edge-orders-read-02cr-canary.mjs` before the generic Orders freshness gate.

The 02CR canary handler qualified status/parity/note and returned the expected business contract, but it did not apply the existing idle-source proof when `بنود الأوردرات.syncedAt` aged.

The frontend wrapper then applied a strict 5-minute physical-age check and fell back to Apps Script once Lines crossed that threshold.

Therefore the missing piece was not a new sync engine. It was wiring the existing safe idle-source proof into the actual qualified `/02cr` path and teaching the frontend to accept that proof for Lines only.

## Candidate implementation

### 1. New 02CR freshness wrapper

New file:

`cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs`

Behavior:

- wraps the existing qualified 02CR business handler rather than replacing it;
- performs metadata-only freshness qualification before business-row serving;
- retains the original 02CR auth/screen contract;
- does not invoke heartbeat for anonymous/unauthorized traffic;
- leaves `__DEBT__` on the original Apps Script-required path;
- requires `بنود الأوردرات` ready + parity + exact V2 live-sync note;
- requires Customers and Debt Restrictions ready + parity + exact 02CR enrichment note;
- Customers and Debt Restrictions must remain physically fresh because the Orders heartbeat does not prove those sources;
- if Lines are physically fresh, no heartbeat read is needed;
- if Lines are physically stale, the wrapper requires the idle verifier to be enabled and validates a recent sanitized Apps Script heartbeat against both Orders and Lines source row/column shape;
- source changed, shape mismatch, stale heartbeat, unhealthy trigger state, missing hash proof, structural mismatch, or verifier error all fail closed to Apps Script fallback;
- successful logical proof is returned as `logicalFreshness` metadata.

No D1 write and no fake `syncedAt` update is performed.

### 2. Actual 02CR route wiring

`cloudflare-d1/src/index_v2.js`

The `/02cr` route now imports the freshness wrapper, which delegates to the already-qualified 02CR handler only after the freshness decision.

### 3. Bounded heartbeat request load

`cloudflare-d1/src/edge-orders-idle-verifier.mjs`

Added:

- in-isolate successful heartbeat cache: default 30 seconds
- concurrent request coalescing to one in-flight heartbeat fetch
- failed heartbeat calls are never cached
- no persistent storage
- no D1 mutation

This prevents stale idle traffic from becoming an Apps Script request storm.

### 4. Frontend logical-freshness acceptance

`trendos-edge-orders-read-v1.js`

The frontend still keeps the 5-minute physical-age gate.

Only stale `بنود الأوردرات` may use `logicalFreshness`, and only when all of these hold:

- proof `ok=true`
- mode is exactly `verified-idle-source-unchanged`
- no failed checks
- proof timestamp is bounded and not future-skewed
- advertised max age is bounded
- Lines source row/column shape exactly matches returned mirror metadata
- display-hash presence is confirmed

Customers / Debt Restrictions cannot be excused by this proof.

Any failed condition keeps the existing Apps Script fallback.

`__DEBT__` and all writes remain Apps Script.

## Regression coverage

Added/updated tests cover:

- existing 02CR contract remains intact
- fresh Lines skip heartbeat entirely
- stale Lines + valid source-unchanged proof pass
- source row/column mismatch fails closed
- `sourceChanged=true` fails closed
- stale Customers fail before heartbeat
- wrong structural note fails closed
- verifier OFF fails to Apps Script
- `__DEBT__` does not use the proof
- anonymous access does not trigger heartbeat
- 30-second successful cache/coalescing
- heartbeat failures are not cached
- frontend accepts only valid Lines proof
- frontend rejects old proof, bad shape, stale enrichment, missing mirror, bad JSON, and Edge HTTP failures
- no new mutation SQL in the wrapper

Final same-head Integrity:

- TrendOS Integrity V1 Run `34031601579` — **SUCCESS**
- all 02CR / dual-signal / freshness / heartbeat / coalescing / existing platform integrity suites passed.

## Isolated Preview evidence

The candidate Worker was deployed only to the existing isolated Preview Worker by the normal Preview workflow, not to Production.

Preview deployment evidence:

- TrendOS Cloudflare Auto Preview Run `34031294735` — **SUCCESS**
- Preview Worker version: `607bccf3-8d7e-45f6-b179-6625aeafa3f8`
- Cloud Write OFF
- no D1 migrations
- normalized import unavailable before mutation
- mirror read checks SELECT-only
- cutover=false
- production frontend not changed by Preview

Dedicated 02CR live qualification:

- Run `34031601605` — **SUCCESS**
- focused candidate tests PASS
- anonymous 02CR fail-closed PASS
- live stale-Lines 02CR dual-signal PASS
- repeat stale-Lines 02CR dual-signal PASS

An earlier first draft of the qualification workflow failed before creating any job because of workflow-definition syntax; it performed no runtime request and was superseded by the successful simplified Run `34031601605`.

## Production status after this checkpoint

**Production is intentionally unchanged.**

No production Worker deployment and no production frontend promotion were performed in this checkpoint.

Therefore current Production still relies on the existing physical-age frontend fallback once an unchanged Lines mirror exceeds five minutes. The candidate has now proved the safe way to remove that false-stale fallback, but coordinated Production promotion is a separate action.

## Required production promotion order

If separately approved, promotion should be bounded and coordinated:

1. recheck exact Production main/Worker baseline and safety flags;
2. deploy only the qualified Worker changes to Production with the heartbeat verifier enabled and no write/cutover changes;
3. qualify live `/02cr` with a short-lived authenticated read-only probe and require valid logical proof when Lines are physically stale;
4. only after Worker qualification, promote the frontend `trendos-edge-orders-read-v1.js` proof acceptance;
5. run GitHub Pages and production read-only stability qualification;
6. require Apps Script fallback, `__DEBT__`, authority, no-write, 02CL/generic-drain/secret invariants throughout;
7. obtain user-visible confirmation before closing 02CU.

## Safety boundary — unchanged

- Apps Script New Version / Deploy: **NO**
- Production Worker deploy in this checkpoint: **NO**
- Production frontend deploy in this checkpoint: **NO**
- D1 business-data write: **NO**
- authority transfer: **NO**
- Sheets / Apps Script authoritative: **YES**
- eligible Orders reads: **D1 first**
- Apps Script fallback: **retained**
- `__DEBT__`: **Apps Script**
- 02CL: **OFF**
- generic drain: **OFF**
- secret rotation: **NO**
- `EDGE_SESSION_SECRET` change: **NO**

## Exact stop point

`PERF-CF-02CU IN PROGRESS — NAVIGATION-RETURN-NO-REFRESH CLOSED TECHNICAL + USER-VISIBLE PASS — ORDERS LOW-USAGE HEARTBEAT LIVE/HEALTHY — ROOT CAUSE CONFIRMED: QUALIFIED /02CR BYPASSED IDLE PROOF + FRONTEND USED PHYSICAL AGE ONLY — 02CR DUAL-SIGNAL IDLE FRESHNESS CANDIDATE VERIFIED — INTEGRITY SUCCESS — ISOLATED PREVIEW LIVE STALE-LINES PASS — PRODUCTION MAIN 9552407c5a5136371f9afd452b913c226329d7dc + WORKER c77bf453-c590-4cff-a55b-fd9c625b6d76 UNCHANGED — PRODUCTION PROMOTION REQUIRES SEPARATE APPROVAL`
