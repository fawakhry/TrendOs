# TrendOS Phase 0 — D1 Dashboard Path Inventory

> Scope: read-only inventory of `getDashboardD1PrimaryV1_(e)` supplied from the Apps Script Version 143/current project source on 2026-08-30. No production mutation.

## Status

`INV-09D — inspect production Dashboard D1 path`: **PASS — SOURCE**.

Version 143 top-level routing was already verified as:

`getDashboard` -> `getDashboardD1PrimaryV1_(e)`

The complete body of `getDashboardD1PrimaryV1_(e)` has now been supplied and inspected.

## Exact behavior

### 1. Runtime feature flag / rollback

The function first checks:

`d1DashboardPrimaryEnabledV1_()`

If the flag is disabled it immediately returns:

`getDashboard_(e)`

Therefore the Dashboard D1 path is runtime-reversible and retains the legacy Google Sheets implementation as fallback.

### 2. Authentication

The function authenticates using:

`authorize_(p.username, p.token)`

before performing the D1 snapshot/read.

If auth fails it returns the auth error without entering D1 processing.

Important consequence:
- the Dashboard path still uses the existing Apps Script auth path.
- this function is not evidence of Fast Auth V2.4.

### 3. Screen authorization

After successful auth, the function derives:

`screen = normalize_(p.screen || '')`

and checks access through:

`trendosAllowedScreensForUserV1932_(auth.user)`

If the screen is not allowed, it returns:

`غير مصرح لك بعرض بيانات هذا القسم.`

Therefore D1 does not bypass existing department/screen authorization.

### 4. Shared D1 safety gate

The Dashboard uses:

`d1OrdersPrimarySnapshotV1_()`

This is the same safety-snapshot family already observed in the D1 Primary Orders helper.

The source comments state the expected gate semantics:
- ready.
- fresh.
- parity.
- complete.
- live sync.
- data version.

Thus the Dashboard does not blindly trust D1; it depends on the same mirror-safety contract before using the D1-derived result.

### 5. Dashboard result builder

After a valid snapshot, the function calls:

`d1DashboardResultV1_(screen, snapshot)`

This is the Dashboard-specific D1 aggregation/result builder.

A successful runtime writes Script Property diagnostics with:
- `source: 'D1'`
- screen.
- `syncedAt` from the Lines snapshot.
- snapshot `dataVersion`.

It also clears the previous Dashboard runtime error property.

### 6. Failure / fallback behavior

Any exception inside the D1 Dashboard try block is caught.

The error is written to:

`D1_DASHBOARD_RUNTIME_ERROR_KEY_V1`

Then the function calls:

`getDashboard_(e)`

The fallback result is annotated with:
- `readSource = 'GOOGLE_SHEETS_FALLBACK'`
- `d1PrimaryRead = false`
- `d1FallbackReason = <error message>`

The runtime-last diagnostic property is also written with:
- `source: 'GOOGLE_SHEETS_FALLBACK'`
- screen.
- reason.

Therefore Dashboard production behavior is:

`D1 primary -> automatic Google Sheets fallback`

not a D1-only hard cutover.

## Exact production Dashboard sequence

```text
request
  -> Dashboard D1 feature flag
       -> OFF: getDashboard_(e)
  -> authorize_()
  -> allowed-screen check
  -> d1OrdersPrimarySnapshotV1_()
       -> shared D1 mirror safety gate
  -> d1DashboardResultV1_(screen, snapshot)
  -> record runtime source = D1
  -> return D1 dashboard

Any D1/safety/network/runtime exception
  -> getDashboard_(e)
  -> annotate GOOGLE_SHEETS_FALLBACK
  -> record fallback reason
```

## Architectural conclusion

The currently inspected Version 143 read architecture is consistently hybrid-safe:

- operational writes remain authoritative in Google Sheets/Apps Script.
- D1 accelerates Dashboard and Orders reads.
- D1 reads are gated by mirror health/safety.
- Google Sheets remains an automatic fallback if D1 is unsafe or unavailable.
- existing authorization remains in front of D1.

This is a strong safety property and should be preserved during later optimization.

## Important performance observation

Unlike `getRowsPageD1FastV2_()`, this Dashboard function does not show an explicit page-level V2.3 stable-cache layer inside its body.

It still calls legacy `authorize_()` before D1 work.

Do not infer Dashboard Fast Auth or page-cache behavior beyond what this source proves.

## INV-09 progress after this inspection

Mapped:
- Orders Primary V1 helper.
- production Orders Fast V2/V2.3 read path.
- Fast Auth V2.4 absence from the inspected Version 143 Orders path.
- production Dashboard D1-primary + Sheets-fallback path.

Still required:
1. D1 atomic/live sync entry points.
2. sync trigger/cadence.
3. D1 Worker/API contract used by probe/snapshot helpers.
4. current legacy `authorize_()` inventory and V2.4 replacement/invalidation design.
5. current D1 mirror health/parity reconfirmation.

## Next exact action

Read-only inspection of the **D1 atomic/live sync entry point(s)**.

Need to identify the function(s) that actually synchronize Orders + Order Lines to D1 and map:

`Trigger/Event -> Entry Point -> Lock -> Staging -> Promote -> Health/Ready -> Error/Fallback`

Do not save, edit, deploy, or run a mutation yet.
