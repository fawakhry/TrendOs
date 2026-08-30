# TrendOS Phase 0 — D1 Read Path Inventory

> Scope: read-only inventory of the currently observed D1 read path in Apps Script Version 143 / current editor source. No production mutation.

## Status

`INV-09 — map D1 sync/read/auth paths`: **PARTIAL**.

The current production router in Version 143 has been verified to route:

- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

The user then supplied the body of a related helper:

`getRowsPageD1PrimaryV1_(e)`

Important: the router does **not** call `getRowsPageD1PrimaryV1_()` directly. Therefore this helper's behavior is now known, but the exact relationship between `getRowsPageD1FastV2_()` and `getRowsPageD1PrimaryV1_()` is still unverified.

## `getRowsPageD1PrimaryV1_(e)` verified behavior

### 1. Feature flag fallback

If `d1OrdersPrimaryFlagEnabledV1_()` is false, the function immediately returns:

`getRowsPageV1931_(e)`

Interpretation: D1 primary can be disabled without breaking the legacy Google Sheets read path.

### 2. Authentication

The function authenticates with:

`authorize_(p.username, p.token)`

before performing the D1 read.

This means the observed D1-primary helper still depends on the existing Apps Script authorization layer; this function alone is not evidence of Fast Auth V2.4.

### 3. D1 safety gate / snapshot

The function obtains:

`d1OrdersPrimarySnapshotV1_()`

The supplied source comments explicitly state the required preconditions before D1 is considered safe:

- Live Sync enabled.
- D1 ready.
- not syncing.
- fresh.
- row counts match.
- column counts match.
- last sync is newer than the latest data version.

If snapshot/read logic throws for any of the documented safety/network/runtime conditions, the function falls back to Google Sheets.

### 4. Cache key

The D1 primary runtime cache is scoped by a digest of:

- authenticated username.
- screen.
- query/search parameters.
- status filter.
- priority filter.
- heat-press filter.
- page.
- page size.
- data version.
- Orders sync timestamp.
- Lines sync timestamp.

Cache key prefix:

`D1_ROWS_PAGE_PRIMARY_V1_`

This reduces the risk of serving a cache entry after operational data/sync version changes.

### 5. D1 read path

On a valid snapshot, the function calls:

`d1OrdersPrimaryRowsFromSnapshotV1_(p, auth, snapshot)`

then builds the paged response with:

`d1OrdersPrimaryPageResponseV1_(...)`

A successful runtime records Script Property state with:

`source: 'D1'`

and removes the previous D1 runtime error property.

### 6. Failure behavior / fallback

Any exception in the D1-primary try block results in:

`getRowsPageV1931_(e)`

The returned fallback object is annotated:

- `readSource = 'GOOGLE_SHEETS_FALLBACK'`
- `d1PrimaryRead = false`
- `d1FallbackReason = <error message>`

The runtime-last Script Property is also recorded with source `GOOGLE_SHEETS_FALLBACK` and the failure reason.

## Current architectural conclusion

`getRowsPageD1PrimaryV1_()` is a **hybrid safe-read layer**:

`D1 primary -> Google Sheets fallback`

It is not a D1-only hard cutover.

This matches the current architecture decision that Google Sheets remains authoritative/safe fallback while D1 is the fast read layer.

## Important unresolved relationship

Version 143's router calls:

`getRowsPageD1FastV2_(e)`

not:

`getRowsPageD1PrimaryV1_(e)`

Therefore do not claim that the production page request uses the exact helper body above until the body of `getRowsPageD1FastV2_()` is inspected.

Possible relationships (not yet facts) include wrapper/delegation, stable-cache fronting, or a separate implementation. Preserve as UNKNOWN until source is supplied.

## Fast Auth status

The supplied `getRowsPageD1PrimaryV1_()` uses `authorize_()` directly.

Therefore:

- this helper does not prove Fast Auth V2.4 is active.
- historical/current canonical status remains: V2.4 PREPARED / NOT VERIFIED unless the actual `getRowsPageD1FastV2_()` / auth helper source proves otherwise.

## Next exact action

Read-only source inspection of:

`function getRowsPageD1FastV2_(e)`

Need the complete function body, or enough source to identify:

1. authentication path.
2. cache/stable-cache path.
3. whether it calls `getRowsPageD1PrimaryV1_()`.
4. D1 API/read helper used.
5. Google Sheets fallback behavior.
6. returned `source` / timing metadata.

Do not deploy or edit Apps Script during this step.
