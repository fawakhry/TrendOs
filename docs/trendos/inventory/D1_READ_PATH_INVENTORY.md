# TrendOS Phase 0 — D1 Read Path Inventory

> Scope: read-only inventory of the D1 read path observed in Apps Script Version 143 / current project source. No production mutation.

## Status

`INV-09 — map D1 sync/read/auth paths`: **PARTIAL — Orders page read path mapped; dashboard, sync and full auth inventory still pending**.

Verified Version 143 router targets:

- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

Two related Orders read implementations have now been inspected:

- `getRowsPageD1PrimaryV1_(e)`
- `getRowsPageD1FastV2_(e)`

The production router uses **`getRowsPageD1FastV2_(e)`** for Orders/Lines page reads.

---

## 1. Production Orders read path — `getRowsPageD1FastV2_(e)`

### Feature flag

If `d1OrdersPrimaryFlagEnabledV1_()` is false, the function immediately falls back to:

`getRowsPageV1931_(e)`

Therefore the D1 read path remains reversible at runtime.

### Authentication order

The function calls:

`authorize_(p.username, p.token)`

**before any stable-page cache lookup**.

This is a critical fact. The source comment explicitly states that authorization still runs before the V2.3 stable cache lookup.

Consequence:
- Version 143 Orders read path does **not** contain Fast Auth V2.4.
- a stable D1 page cache hit can still be dominated by the legacy `authorize_()` runtime.
- this matches the historical observation where stable cache lookup was ~20ms while auth consumed ~7.45s.

### Screen authorization

After authentication, the function calls:

`trendosAllowedScreensForUserV1932_(auth.user)`

and rejects a requested screen not in the allowed list.

### Data-version keyed stable cache — V2.3

The function reads:

`trendosDataVersionV1931_()`

and builds:

`stableKey = d1FastStablePageKeyV22_(p, screen, dataVersion)`

The source comment documents the V2.3 design:
- atomic live sync changes D1 `syncedAt` frequently even when TrendOS business data did not change.
- therefore the stable key intentionally excludes `syncedAt`.
- it is based on screen + filters + page + `dataVersion`.
- a TrendOS write changes `dataVersion`, preventing reuse of an older application-state page.

First cache check:

`d1FastGetPageCacheV22_(stableKey)`

A hit returns with:

- `readSource = 'D1_FAST_STABLE_CACHE_V23'`
- `fastV2 = true`
- `fastV22 = true`
- `fastV23 = true`
- `d1PrimaryRead = true`

This confirms that **Version 143 source contains the V2.3 stable-cache path**.

### D1 probe

If there is no stable-cache hit, the function probes the Lines mirror through:

`d1OrdersFastProbeV21_(linesName)`

then evaluates it with:

`d1OrdersFastProbeHealthV22_(probe, dataVersion)`

Probe timing is recorded as `timing.probeMs`.

### Safe short-window behavior while live sync is running

If probe health reports:

- `syncing === true`
- `liveSyncNote === true`

then the function may reuse the stable page for the same application `dataVersion`.

That response is tagged:

`D1_FAST_STALE_SAFE_V22`

and marks:

`d1Syncing = true`

Interpretation:
- the code distinguishes a short expected atomic/live-sync window from unsafe stale application data.
- stale-safe reuse is limited by the application data-version key.

### Probe rejection

If `probeHealth.pass` is false, the function throws an error containing health details such as:

- status.
- ageSeconds.
- rowCount.
- sourceLastRow.
- fresh.
- liveSyncNote.
- rowComplete.
- syncedAfterDataVersion.

The exception then enters the common Google Sheets fallback path.

### Current-snapshot page cache — V2.2

After a passing probe, the function builds:

`currentKey = d1FastPageKeyV22_(p, screen, dataVersion, probe.syncedAt)`

and checks:

`d1FastGetPageCacheV22_(currentKey)`

A hit returns:

`readSource = 'D1_FAST_PAGE_CACHE_V22'`

with the same Fast V2/V2.2/V2.3 flags.

### D1 fetch / build path

If both page caches miss, the function fetches the D1 snapshot through:

`d1OrdersFastSnapshotV2_(probe)`

then builds the filtered lightweight result through:

`d1OrdersFastBuildAllLightV22_(p, auth, snapshot)`

and converts it to the standard paged response with:

`d1OrdersPrimaryPageResponseV1_(...)`

Important relationship:
- `getRowsPageD1FastV2_()` does **not** delegate to `getRowsPageD1PrimaryV1_()`.
- it is a separate fast implementation.
- it only reuses the shared page-response helper `d1OrdersPrimaryPageResponseV1_()`.

### Current-page support enrichment

Only the small returned page is enriched through:

`d1FastEnrichPageRowsV22_(result.rows || [])`

The source comment describes this as live-ish customer/debt enrichment.

The result records support-cache diagnostics:

- wantedCount.
- hitCount.
- requestedBuckets.
- loadedBuckets.

### Fresh D1 result

A fresh D1-built result is tagged:

`readSource = 'D1_FAST_V22'`

plus:

- `d1PrimaryRead = true`
- `fastV2 = true`
- `fastV22 = true`
- D1 sync timestamp.
- total runtime.
- detailed timing object.

The result is then written to both current and stable page-cache keys through:

`d1FastPutPageCacheV22_(currentKey, stableKey, result)`

### Google Sheets fallback

Any exception in the D1 Fast V2 block calls:

`getRowsPageV1931_(e)`

The fallback is tagged:

- `readSource = 'GOOGLE_SHEETS_FALLBACK'`
- `d1PrimaryRead = false`
- `fastV2 = false`
- `fastV22 = false`
- `d1FallbackReason = <error>`

Fallback timing is also recorded.

Therefore the production Orders path is **D1-first with automatic Google Sheets fallback**, not a hard D1-only cutover.

---

## 2. Exact production Orders read sequence

Current Version 143 source is now understood as:

```text
request
  -> D1 feature flag
  -> authorize_()
  -> allowed-screen check
  -> TrendOS dataVersion
  -> V2.3 stable-page cache
       -> HIT: D1_FAST_STABLE_CACHE_V23
  -> D1 probe
       -> syncing + same dataVersion: D1_FAST_STALE_SAFE_V22 if stable page exists
       -> unsafe probe: throw -> Sheets fallback
  -> V2.2 current-snapshot page cache
       -> HIT: D1_FAST_PAGE_CACHE_V22
  -> D1 snapshot fetch
  -> lightweight D1 build/filter
  -> page response
  -> current-page customer/debt enrichment
  -> cache current + stable keys
  -> D1_FAST_V22

Any D1/runtime/safety failure
  -> getRowsPageV1931_()
  -> GOOGLE_SHEETS_FALLBACK
```

---

## 3. `getRowsPageD1PrimaryV1_(e)` relationship

The separately inspected Primary V1 helper remains useful architectural evidence:

- feature flag fallback to Sheets.
- `authorize_()` authentication.
- strict D1 snapshot safety requirements.
- D1-primary read.
- automatic Sheets fallback.

But it is **not** the function directly used by the Version 143 Orders page router.

The live router uses Fast V2 as documented above.

---

## 4. Fast Auth V2.4 status — now stronger evidence

Current Version 143 `getRowsPageD1FastV2_()` explicitly calls legacy:

`authorize_()`

before the V2.3 stable cache lookup.

Therefore:

**Fast Auth V2.4 is NOT present in this inspected Version 143 Orders read function.**

Canonical status remains:

`D1_Orders_Fast_V2_4.gs = PREPARED / NOT INSTALLED / NOT DEPLOYED / NOT VERIFIED`

Do not change that status without newer deployment evidence.

The current performance bottleneck hypothesis is strongly supported by source:
- stable-page lookup can be very fast.
- auth always occurs first.
- therefore legacy auth can dominate end-to-end request runtime even on a V2.3 stable-cache hit.

---

## 5. Source labels now mapped

| `readSource` | Meaning |
|---|---|
| `D1_FAST_STABLE_CACHE_V23` | V2.3 dataVersion-based stable page cache hit |
| `D1_FAST_STALE_SAFE_V22` | safe reuse of stable page during short live-sync window with unchanged dataVersion |
| `D1_FAST_PAGE_CACHE_V22` | current D1 snapshot/syncedAt page-cache hit |
| `D1_FAST_V22` | fresh D1 snapshot/build path |
| `GOOGLE_SHEETS_FALLBACK` | legacy Sheets page read after flag-off or D1/runtime/safety failure |

---

## 6. Timing observability already present

The function records timing components including:

- `authMs`
- `readyStableCacheMs`
- `probeMs`
- `pageCacheMs`
- `fetchMs`
- `buildMs`
- `pageBuildMs`
- `supportMs`
- `cacheWriteMs`
- `fallbackMs`
- total/runtime timing

This existing instrumentation should be preserved and reused rather than replaced blindly.

---

## 7. Current architectural conclusion

Production Version 143 Orders read architecture is:

**Google Sheets authoritative writes + atomic/live D1 mirror + D1 Fast V2/V2.3 read acceleration + safe Google Sheets fallback.**

It is not D1-native for writes, and it is not D1-only for reads.

The Fast V2 implementation is independently optimized and does not simply wrap Primary V1.

---

## 8. Remaining `INV-09` work

Still required before closing the full D1 inventory:

1. inspect `getDashboardD1PrimaryV1_(e)`.
2. map D1 atomic/live sync entry points and trigger/cadence.
3. map `d1OrdersFastProbeV21_()` / snapshot source sufficiently to identify Worker/API contract.
4. inventory existing auth path and the prepared V2.4 replacement/invalidation design.
5. reconfirm current D1 mirror health/parity at runtime after correctness inventory.

## Next exact action

Read-only source inspection of:

`function getDashboardD1PrimaryV1_(e)`

Need the complete function body to map Dashboard source, safety checks, cache/fallback behavior, and whether it shares the same D1/Sheets hybrid contract.

Do not save, edit, or deploy Apps Script during this step.
